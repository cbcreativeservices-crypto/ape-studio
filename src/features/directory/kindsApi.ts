/**
 * The Directory's chips: Graduates through `directory_graduates`, the four
 * verified kinds through `directory_search` plus `directory_badges` (see
 * kinds.ts for why). Badges only decorate a list: when they cannot be read the
 * members still show, with no plate, and no plate is ever invented.
 */
import { supabase } from '../../lib/supabase';
import { withDeadline } from '../../lib/boundedCall';
import { searchDirectory, readableError, type DirectoryCard, type DirectoryFilters, type WorkPref } from './api';
import { KIND_SCAN_PAGES, KIND_SCAN_SIZE, badgeOf, tokensOfKind, type DirectoryChip, type MemberBadge } from './kinds.ts';
import { sampleForumOn } from '../forum/sampleSwitch.ts';
import type { VerifierKind } from '../employer/verifierKind.ts';

const data = () => require('../forum/sampleData') as typeof import('../forum/sampleData');

export type GraduateCard = DirectoryCard & { latestCredential: string | null; verifiedKind: VerifierKind | null };

export type ChipOutcome =
  | {
      status: 'ok';
      results: DirectoryCard[];
      total: number;
      badges: ReadonlyMap<string, MemberBadge>;
      /** A kind chip stopped early: how many members it read of how many. */
      scanned: { read: number; of: number } | null;
    }
  | { status: 'error'; error: string };

const none = <T,>(a: T[] | undefined) => (a && a.length ? a : null);

export async function fetchGraduates(f: DirectoryFilters, page = 0, pageSize = 30): Promise<
  { status: 'ok'; results: GraduateCard[]; total: number } | { status: 'error'; error: string }
> {
  if (sampleForumOn()) return data().sampleGraduates();
  try {
    const { data: raw, error } = await withDeadline(
      async () =>
        await supabase.rpc('directory_graduates', {
          p_q: f.q?.trim() || null,
          p_areas: none(f.areas),
          p_specialties: none(f.specialties),
          p_roles: none(f.roles),
          p_open_to: none(f.openTo),
          p_country: f.country || null,
          p_work_pref: f.workPref ?? null,
          p_limit: pageSize,
          p_offset: page * pageSize,
        }),
      'directory_graduates',
      10000,
    );
    if (error) return { status: 'error', error: readableError(error.message) };
    const rows = (raw ?? []) as Record<string, unknown>[];
    return {
      status: 'ok',
      total: rows.length ? Number(rows[0].total_count ?? rows.length) : 0,
      results: rows.map((r) => ({
        publicToken: r.public_token as string,
        displayName: (r.display_name as string) ?? 'Member',
        primaryArea: (r.primary_area as string) ?? null,
        specialties: Array.isArray(r.specialties) ? (r.specialties as string[]) : [],
        roles: Array.isArray(r.roles) ? (r.roles as string[]) : [],
        countryCode: (r.country_code as string) ?? null,
        workPref: (r.work_pref as WorkPref) ?? null,
        credentialCount: Number(r.credential_count ?? 0),
        contactEnabled: !!r.contact_enabled,
        latestCredential: (r.latest_credential_name as string) ?? null,
        verifiedKind: badgeOf(r).verifiedKind,
      })),
    };
  } catch (e) {
    return { status: 'error', error: readableError(e instanceof Error ? e.message : undefined) };
  }
}

/** Plates for the members on screen. An empty map means "not known". */
export async function fetchBadges(tokens: string[]): Promise<ReadonlyMap<string, MemberBadge>> {
  if (tokens.length === 0) return new Map();
  if (sampleForumOn()) return data().sampleBadges(tokens);
  try {
    const out = new Map<string, MemberBadge>();
    for (let i = 0; i < tokens.length; i += 100) {
      const { data: raw, error } = await supabase.rpc('directory_badges', { p_tokens: tokens.slice(i, i + 100) });
      if (error) return out;
      for (const r of (raw ?? []) as { public_token: string; verified_kind: unknown; graduate: unknown }[]) {
        out.set(r.public_token, badgeOf(r));
      }
    }
    return out;
  } catch {
    return new Map();
  }
}

async function scanKind(kind: VerifierKind, f: DirectoryFilters): Promise<ChipOutcome> {
  const seen: DirectoryCard[] = [];
  let total = 0;
  for (let page = 0; page < KIND_SCAN_PAGES; page += 1) {
    const out = await searchDirectory(f, page, KIND_SCAN_SIZE);
    if (out.status === 'error') return out;
    total = out.total;
    seen.push(...out.results);
    if (out.results.length < KIND_SCAN_SIZE) break;
  }
  const badges = await fetchBadges(seen.map((r) => r.publicToken));
  // No answer about badges is not "nobody of this kind".
  if (badges.size === 0 && seen.length > 0) {
    return { status: 'error', error: 'Could not check who is verified. Check your connection and try again.' };
  }
  const wanted = new Set(tokensOfKind(seen.map((r) => r.publicToken), badges, kind));
  const results = seen.filter((r) => wanted.has(r.publicToken));
  return {
    status: 'ok',
    results,
    total: results.length,
    badges,
    scanned: total > seen.length ? { read: seen.length, of: total } : null,
  };
}

/** One search for whichever chip is on. */
export async function searchByChip(chip: DirectoryChip, f: DirectoryFilters, page = 0): Promise<ChipOutcome> {
  if (chip === 'graduates') {
    const out = await fetchGraduates(f, page);
    if (out.status === 'error') return out;
    const badges = new Map<string, MemberBadge>(
      out.results.map((r) => [r.publicToken, { verifiedKind: r.verifiedKind, graduate: true }]),
    );
    return { status: 'ok', results: out.results, total: out.total, badges, scanned: null };
  }
  if (chip !== 'all') return scanKind(chip, f);
  const out = await searchDirectory(f, page);
  if (out.status === 'error') return out;
  return {
    status: 'ok',
    results: out.results,
    total: out.total,
    badges: await fetchBadges(out.results.map((r) => r.publicToken)),
    scanned: null,
  };
}
