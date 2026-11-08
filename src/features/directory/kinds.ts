/**
 * The Directory's chips and plates (approved mockup, screen 2). Pure, so the
 * rule for who appears under a chip is tested.
 *
 * Only `directory_graduates` filters on the server. `directory_search` has no
 * kind filter and returns no kind, so a kind chip reads members and asks
 * `directory_badges` about them. SERVER GAPS covers the proper fix; until then
 * a list that stopped early says so rather than reading as everyone.
 */
import type { VerifierKind } from '../employer/verifierKind.ts';
import { acceptsContact } from './rules.ts';

export type DirectoryChip = 'all' | 'graduates' | VerifierKind;

export const DIRECTORY_CHIPS: { key: DirectoryChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'graduates', label: 'Graduates' },
  { key: 'employer', label: 'Employers' },
  { key: 'company', label: 'Companies' },
  { key: 'institution', label: 'Institutions' },
  { key: 'instructor', label: 'Instructors' },
];

/** How many pages of members a kind chip reads before it says it stopped. */
export const KIND_SCAN_PAGES = 3;
export const KIND_SCAN_SIZE = 30;

export type MemberBadge = { verifiedKind: VerifierKind | null; graduate: boolean };

export function badgeLabel(b: MemberBadge | null | undefined): string | null {
  if (!b) return null;
  if (b.verifiedKind) return b.verifiedKind.toUpperCase();
  return b.graduate ? 'GRADUATE' : null;
}

/** A row of `directory_badges`. Anything unrecognised wears no plate. */
export function badgeOf(row: { verified_kind?: unknown; graduate?: unknown }): MemberBadge {
  const k = row.verified_kind;
  return {
    verifiedKind: k === 'employer' || k === 'company' || k === 'institution' || k === 'instructor' ? k : null,
    graduate: row.graduate === true,
  };
}

/** The tokens of one kind, in the order they were listed. */
export function tokensOfKind(
  tokens: string[],
  badges: ReadonlyMap<string, MemberBadge>,
  kind: VerifierKind,
): string[] {
  return tokens.filter((t) => badges.get(t)?.verifiedKind === kind);
}

/** The line a kind chip shows when it did not read everyone. */
export function scanNote(scanned: number, total: number): string | null {
  return total > scanned ? `Looked through the first ${scanned} members. Search by name to find others.` : null;
}

export function chipEmpty(chip: DirectoryChip): { title: string; line: string } {
  const label = DIRECTORY_CHIPS.find((c) => c.key === chip)?.label.toLowerCase() ?? 'members';
  return { title: `No ${label} listed yet`, line: 'The directory is new, so it is still filling up.' };
}

/**
 * What a chip lists, as a counted noun: "1 employer", "6 companies". The
 * "Showing 30 of 45 …" line used it too late, so every kind chip counted
 * "members" (bug pass 2026-11-08, CODE-1-30).
 */
export function chipNoun(chip: DirectoryChip, n: number): string {
  const one: Record<DirectoryChip, string> = {
    all: 'member',
    graduates: 'graduate',
    employer: 'employer',
    company: 'company',
    institution: 'institution',
    instructor: 'instructor',
  };
  const word = one[chip];
  return n === 1 ? word : word === 'company' ? 'companies' : `${word}s`;
}

/**
 * A member card's screen-reader label (bug pass 2026-11-08, UI-1-17): one
 * full stop between parts, never two after an initial ("Maya R.. GRADUATE"),
 * and "1 verified credential" in the singular.
 */
export function memberCardA11y(c: {
  displayName: string;
  plate: string | null;
  primaryArea: string | null;
  roles: string[];
  credentialCount: number;
  contactEnabled: boolean;
  /** Only when the row carries it (search rows do not yet; see acceptsContact). */
  openTo?: readonly string[] | null;
}): string {
  const parts = [
    c.displayName,
    c.plate,
    c.primaryArea,
    c.roles.join(', '),
    c.credentialCount
      ? `${c.credentialCount} verified ${c.credentialCount === 1 ? 'credential' : 'credentials'}`
      : null,
    // The sheet's rule (UI-3-08): see acceptsContact in rules.ts.
    acceptsContact(c) ? 'open to contact' : null,
  ]
    .map((s) => (s ?? '').trim())
    .filter(Boolean);
  return parts.reduce((acc, s) => (acc ? `${acc}${/[.!?]$/.test(acc) ? ' ' : '. '}${s}` : s), '');
}

/** "Maya R." under a tile; a long name keeps its first word. */
export function stripName(name: string): string {
  return name.length <= 10 ? name : name.split(/\s+/)[0];
}

/* ── Two server shapes (the 2026-11-07 SERVER GAPS package) ──────────── */

/**
 * Once the package lands, a kind chip asks the server for exactly that kind:
 * `directory_search(p_kind)` lists members of the kind with a published,
 * discoverable profile (and returns `verified_kind`), and
 * `directory_verified(p_kind)` lists verified ORGANIZATIONS (employer, company,
 * institution), with those that have no community profile at all (SERVER_GAPS
 * rows 13 and 14). Instructors are people, so only `directory_search` lists
 * them. A server without either function answers PGRST202 / 42883, and the
 * chip falls back to today's scan (`legacy`). Pure: the call is passed in.
 */
export type ChipRpcError = { code?: string | null; message?: string | null } | null;
export type ChipRpc = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: ChipRpcError }>;

/** A verified organization with no community profile: it opens its page on
 *  the website (employer_profiles.public_token, never a community token). */
export type VerifiedOrg = { pageToken: string; name: string; kind: VerifierKind; verifiedAt: string | null };

export type KindCard = {
  publicToken: string;
  displayName: string;
  primaryArea: string | null;
  specialties: string[];
  roles: string[];
  countryCode: string | null;
  workPref: 'remote' | 'local' | 'either' | null;
  credentialCount: number;
  contactEnabled: boolean;
};

export type KindChipOutcome =
  | {
      status: 'ok';
      results: KindCard[];
      total: number;
      badges: ReadonlyMap<string, MemberBadge>;
      scanned: { read: number; of: number } | null;
      orgs: VerifiedOrg[];
    }
  | { status: 'error'; error: string };

const WORK = ['remote', 'local', 'either'];
const KIND_LIST: readonly string[] = ['employer', 'company', 'institution', 'instructor'];

/** A `directory_search` / `directory_graduates` row as a card. */
export function cardOf(r: Record<string, unknown>): KindCard {
  return {
    publicToken: r.public_token as string,
    displayName: (r.display_name as string) ?? 'Member',
    primaryArea: (r.primary_area as string) ?? null,
    specialties: Array.isArray(r.specialties) ? (r.specialties as string[]) : [],
    roles: Array.isArray(r.roles) ? (r.roles as string[]) : [],
    countryCode: (r.country_code as string) ?? null,
    workPref: WORK.includes(r.work_pref as string) ? (r.work_pref as KindCard['workPref']) : null,
    credentialCount: Number(r.credential_count ?? 0),
    contactEnabled: !!r.contact_enabled,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The organizations a chip adds: only those with NO community profile (one with
 * a published, discoverable profile is already listed by `directory_search`),
 * matching the name search when there is one. A row with an odd token or kind
 * is dropped, never drawn as something it may not be.
 */
export function orgsOf(raw: unknown, kind: VerifierKind, q?: string): VerifiedOrg[] {
  const want = (q ?? '').trim().toLowerCase();
  const out: VerifiedOrg[] = [];
  for (const v of Array.isArray(raw) ? raw : []) {
    const r = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
    const token = typeof r.public_token === 'string' && UUID.test(r.public_token) ? r.public_token.toLowerCase() : null;
    const name = typeof r.company_name === 'string' ? r.company_name.trim() : '';
    if (!token || !name || r.verified_kind !== kind || r.community_token) continue;
    if (want && !name.toLowerCase().includes(want)) continue;
    if (out.some((o) => o.pageToken === token)) continue;
    out.push({ pageToken: token, name, kind, verifiedAt: typeof r.verified_at === 'string' ? r.verified_at : null });
  }
  return out;
}

/** The server's "no such function, or not with these arguments, yet". */
export function chipFunctionMissing(err: ChipRpcError): boolean {
  if (!err) return false;
  if (err.code === 'PGRST202' || err.code === '42883') return true;
  return /could not find the function/i.test(err.message ?? '');
}

/** Only a kind chip with no filter but the name box lists organizations: they
 *  have no areas, roles or country to filter on. */
export function orgsListed(kind: VerifierKind, page: number, f: { areas?: string[]; specialties?: string[]; roles?: string[]; openTo?: string[]; country?: string; workPref?: string | null }): boolean {
  if (kind === 'instructor' || page > 0) return false;
  const any = (a?: string[]) => !!a && a.length > 0;
  return !any(f.areas) && !any(f.specialties) && !any(f.roles) && !any(f.openTo) && !f.country && !f.workPref;
}

export async function kindChip(
  call: ChipRpc,
  kind: VerifierKind,
  search: { args: Record<string, unknown>; q?: string; withOrgs: boolean },
  words: (message: string | null | undefined) => string,
  legacy: () => Promise<KindChipOutcome>,
): Promise<KindChipOutcome> {
  let s: { data: unknown; error: ChipRpcError };
  try {
    s = await call('directory_search', { ...search.args, p_kind: kind });
  } catch (e) {
    return { status: 'error', error: words(e instanceof Error ? e.message : null) };
  }
  if (s.error) return chipFunctionMissing(s.error) ? legacy() : { status: 'error', error: words(s.error.message) };
  const rows = (Array.isArray(s.data) ? s.data : []) as Record<string, unknown>[];
  const results = rows.map(cardOf);
  const badges = new Map<string, MemberBadge>(
    rows.map((r) => [r.public_token as string, { verifiedKind: KIND_LIST.includes(r.verified_kind as string) ? (r.verified_kind as VerifierKind) : null, graduate: false }]),
  );
  let orgs: VerifiedOrg[] = [];
  if (search.withOrgs) {
    let o: { data: unknown; error: ChipRpcError };
    try {
      o = await call('directory_verified', { p_kind: kind, p_limit: 100, p_offset: 0 });
    } catch (e) {
      return { status: 'error', error: words(e instanceof Error ? e.message : null) };
    }
    // A failed read is never "no organizations": the chip fails whole.
    if (o.error && !chipFunctionMissing(o.error)) return { status: 'error', error: words(o.error.message) };
    if (!o.error) orgs = orgsOf(o.data, kind, search.q);
  }
  return {
    status: 'ok',
    results,
    total: rows.length ? Number(rows[0].total_count ?? rows.length) : 0,
    badges,
    scanned: null,
    orgs,
  };
}
