/**
 * entitlementExpiry — how an entitlement row's `expires_at` is read.
 *
 * A pure, React-free leaf so the rule is testable under `node --test` without
 * mounting the provider (same idiom as memberStanding.ts). EntitlementProvider
 * owns the tier decision; this module only answers "what does this timestamp
 * say?".
 *
 * OWNER RULING 2026-09-11 — an expiry WE cannot parse fails OPEN. See the
 * 'unreadable' case below.
 */

/**
 * What a row's `expires_at` tells us:
 *   'none'       — genuinely absent (null/undefined/empty): a row with no end date.
 *   'current'    — a real timestamp still in the future.
 *   'expired'    — a real timestamp in the past.
 *   'unreadable' — PRESENT but not parseable as a date. Fails OPEN (see below).
 */
export type ExpiryVerdict = 'none' | 'current' | 'expired' | 'unreadable';

/**
 * Classify a row's raw `expires_at`.
 *
 * Parsing is checked EXPLICITLY with `Number.isFinite(Date.parse(...))` rather
 * than left to a comparison operator: `NaN > now` is false, so the old
 * `new Date(x).getTime() > now` silently reported "expired" for any value it
 * merely failed to read.
 *
 * Anything present that is not a non-empty string (a number, an object, a bare
 * boolean from a schema drift) is 'unreadable' too — we did not read it, so we
 * do not get to act as though we did.
 */
export function classifyExpiry(expiresAt: unknown, now: number = Date.now()): ExpiryVerdict {
  // Absent/null/'' keeps its pre-existing meaning: no end date on this row.
  // (The original guard was a plain falsy check, so '' already meant "absent";
  // that path is deliberately unchanged.)
  if (expiresAt === null || expiresAt === undefined || expiresAt === '') return 'none';
  if (typeof expiresAt !== 'string') return 'unreadable';
  const ms = Date.parse(expiresAt);
  if (!Number.isFinite(ms)) return 'unreadable';
  return ms > now ? 'current' : 'expired';
}

/**
 * Does this verdict leave the row entitling the member?
 *
 * TRUE for 'none', 'current' AND 'unreadable'; only a timestamp we genuinely
 * READ and that has genuinely PASSED takes access away.
 */
export function verdictKeepsAccess(verdict: ExpiryVerdict): boolean {
  return verdict !== 'expired';
}

/**
 * When does the access these rows grant END? (full run 2, 2026-10-01.)
 *
 * The epoch ms at which the last ACTIVE row with a real future expiry passes,
 * or null when access does not end on a known date: no granting row at all, or
 * any active row with no end date / an unreadable one (those keep access with
 * no end, see above). The provider re-reads at this moment, so a cancelled
 * member whose paid cycle ends while the app is in the foreground loses the
 * tier then, not at the next return from the background.
 */
export function accessEndsAt(
  rows: { status?: string; expires_at?: unknown }[],
  now: number = Date.now(),
): number | null {
  let end: number | null = null;
  for (const r of rows) {
    if (r.status !== 'active') continue;
    const verdict = classifyExpiry(r.expires_at, now);
    if (verdict === 'expired') continue;
    if (verdict !== 'current') return null;
    const ms = Date.parse(r.expires_at as string);
    if (end === null || ms > end) end = ms;
  }
  return end;
}

/**
 * OFFLINE GRACE (toddler hunt #4, owner 2026-10-14). The remembered tier
 * (lastTierCache) and a tier kept through a failed read used to honour a
 * membership with no time limit: a member who stayed offline kept it forever.
 * Now the access END DATE is remembered with it, and once the device is past
 * that date plus this grace WITHOUT reaching the server, the member is no
 * longer treated as one. Three days covers a renewal the store has charged but
 * the server has not been able to tell this phone about.
 *
 * Only a real, known end date can run out: `null` (a lifetime / no-end grant,
 * an unreadable expiry — see `accessEndsAt`) and an entry saved before end
 * dates were remembered (`undefined`) keep access, exactly as before. Nothing
 * local is wiped and no credit is touched — this only decides the tier, and the
 * next server answer replaces it either way.
 */
export const OFFLINE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/** Is this remembered access end date more than OFFLINE_GRACE_MS ago? */
export function pastOfflineGrace(endsAt: number | null | undefined, now: number = Date.now()): boolean {
  return typeof endsAt === 'number' && Number.isFinite(endsAt) && now > endsAt + OFFLINE_GRACE_MS;
}
