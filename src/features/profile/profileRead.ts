/**
 * How a Profile ID read is classified — extracted from `api.ts` so the one rule
 * the fix turns on can be tested without dragging the Supabase client (and with
 * it all of React Native) into the test process. Same reason
 * `entitlementExpiry.ts` sits beside its provider.
 *
 * `ProfileData` stays in `api.ts`; this module only names the OUTCOME, so it
 * imports it as a type-only reference to avoid a runtime cycle.
 */
import type { ProfileData } from './api';

/**
 * The outcome of a profile read. "Nothing came back" has TWO meanings that must
 * not look the same on screen, which is the whole reason this is a result type
 * and not a throw:
 *
 *   • `none` — there is no `users` row to read. A GUEST has no account, so an
 *     empty ID card is the CORRECT answer: nothing failed, nothing to retry.
 *   • `unavailable` — the read did not complete for a reason that is not
 *     "no row" (transport, an expired token, a missing GRANT). That one is a
 *     real error and earns the RETRY.
 *
 * `fetchMyRegistryListing` below already draws this line, for the same reason,
 * on the same table. This read did not: it threw ONE opaque `user_not_found`
 * for both, so every guest who opened Profile was told to check a connection
 * that was fine. Its siblings elsewhere agree — `fetchTopicAchievements`
 * simply returns empty when there is no user id.
 */
export type ProfileRead =
  | { state: 'profile'; profile: ProfileData }
  | { state: 'none' }
  | { state: 'unavailable' };

/**
 * Which of the three a `users` `.single()` produced, for a caller that ALREADY
 * HAS A SESSION. The no-session case is settled before the read — see
 * `fetchProfile` — and this function must not be asked to guess it.
 *
 * ⚠️ WHY THE SESSION CHECK IS NOT OPTIONAL, measured rather than assumed.
 * I first wrote this to discriminate on the error code alone, expecting a guest
 * to get PostgREST's PGRST116 ("no rows") from RLS filtering the table to
 * nothing. A probe in the running app says otherwise — a guest gets:
 *
 *   42501 · permission denied for table users
 *   hint: GRANT SELECT ON public.users TO anon;
 *
 * because `anon` has no SELECT privilege on `users` at all; the denial happens
 * at the GRANT, before RLS is ever consulted. And 42501 is the SAME code as the
 * real "GRANTs dropped by a table recreate" incident that takes the app down
 * for signed-in users (docs/CROSS_SESSION_HANDOFF.md, standing rule 1). So the
 * error code cannot tell a guest from an outage — only the session can, which
 * is why `fetchMyRegistryListing` checks it first on this very table.
 */
export function classifyProfileRead(
  error: { code?: string | null; message?: string } | null,
  row: unknown,
): ProfileRead['state'] {
  const NO_ROW = 'PGRST116'; // "JSON object requested, multiple (or no) rows returned"
  // With a session in hand, "no row" means a signed-in account whose `users`
  // row is genuinely absent. That is an empty card, not a connection problem —
  // no amount of retrying conjures a row.
  if (error) return error.code === NO_ROW ? 'none' : 'unavailable';
  return row ? 'profile' : 'none';
}
