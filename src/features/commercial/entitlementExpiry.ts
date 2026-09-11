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
