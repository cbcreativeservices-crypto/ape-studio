/**
 * Earned-credential list for the Profile screen (runbook item 3, 2026-08-29).
 *
 * RLS-scoped reads only — no new access was needed for this:
 *   · credential_awards — SELECT for `authenticated`, row-gated by
 *     `own_credential_awards` to the caller's own user_id.
 *   · certificates / programs — public reference tables, SELECT already granted.
 *
 * Two round trips, not N+1: one read of the caller's award rows, then one read
 * per credential TYPE to resolve names. A student can hold dozens of
 * certificates, so per-row name lookups would be a real cost on this screen.
 */
import { supabase } from '../../lib/supabase';

export type EarnedCredentialRow = {
  /** credential_awards.credential_id — the certificate/program uuid. */
  id: string;
  type: 'certificate' | 'program';
  name: string;
  /** certificates.level or programs.tier — whichever applies. */
  levelOrTier: string | null;
  track: string | null;
  /** issued_at when present, else earned_at. */
  awardedAt: string | null;
};

/**
 * Every non-revoked credential the signed-in user holds, newest first.
 * Returns [] for a guest, an unlinked account, or any error — the caller
 * renders an honest empty state rather than an implied failure.
 */
export async function fetchMyCredentials(): Promise<EarnedCredentialRow[]> {
  try {
    const { data: user } = await supabase.from('users').select('id').single();
    const userId = (user as { id?: string } | null)?.id;
    if (!userId) return [];

    const { data: awards, error } = await supabase
      .from('credential_awards')
      .select('credential_type, credential_id, earned_at, issued_at')
      .eq('user_id', userId)
      .is('revoked_at', null);
    if (error || !awards?.length) return [];

    const rows = awards as {
      credential_type: string;
      credential_id: string;
      earned_at: string | null;
      issued_at: string | null;
    }[];

    const certIds = rows.filter((r) => r.credential_type === 'certificate').map((r) => r.credential_id);
    const progIds = rows.filter((r) => r.credential_type === 'program').map((r) => r.credential_id);

    const [certRes, progRes] = await Promise.all([
      certIds.length
        ? supabase.from('certificates').select('id, name, level, track').in('id', certIds)
        : Promise.resolve({ data: [] as unknown[] }),
      progIds.length
        ? supabase.from('programs').select('id, name, tier, track').in('id', progIds)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    const meta = new Map<string, { name: string; levelOrTier: string | null; track: string | null }>();
    for (const c of (certRes.data ?? []) as { id: string; name: string; level: string | null; track: string | null }[]) {
      meta.set(c.id, { name: c.name ?? 'Certificate', levelOrTier: c.level ?? null, track: c.track ?? null });
    }
    for (const p of (progRes.data ?? []) as { id: string; name: string; tier: string | null; track: string | null }[]) {
      meta.set(p.id, { name: p.name ?? 'Program', levelOrTier: p.tier ?? null, track: p.track ?? null });
    }

    const out: EarnedCredentialRow[] = rows.map((r) => {
      const m = meta.get(r.credential_id);
      return {
        id: r.credential_id,
        type: r.credential_type === 'program' ? 'program' : 'certificate',
        // A name that failed to resolve is labelled honestly rather than blank —
        // a deactivated or renamed award should still show as held.
        name: m?.name ?? (r.credential_type === 'program' ? 'Program' : 'Certificate'),
        levelOrTier: m?.levelOrTier ?? null,
        track: m?.track ?? null,
        awardedAt: r.issued_at ?? r.earned_at ?? null,
      };
    });

    // Newest first; undated rows sort last rather than to the top.
    out.sort((a, b) => {
      const ta = a.awardedAt ? Date.parse(a.awardedAt) : -Infinity;
      const tb = b.awardedAt ? Date.parse(b.awardedAt) : -Infinity;
      return tb - ta;
    });
    return out;
  } catch {
    return [];
  }
}
