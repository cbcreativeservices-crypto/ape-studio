/**
 * splashRoute — where the boot hand-off lands (SplashScreen), as a pure rule.
 *
 * ⛔ A STORED SESSION THAT COULD NOT BE REFRESHED IS STILL SIGNED IN (hunt 8,
 * 2026-10-03; hunt 7's rule, "a stall is not a guest").
 *
 * Splash routed on `data.session` alone. auth-js answers an EXPIRED access
 * token plus no connection (airplane mode, an hour after the last use — the
 * default token life) with `{ session: null, error: AuthRetryableFetchError }`
 * and KEEPS the session stored. So a member who opened the app on a flight
 * was sent to the login screen: nothing they could sign in to offline, the
 * offline glossary they had saved out of reach, and Guest Mode from there
 * (whose offline sign-out keeps the session) totally wiped the device's data
 * for a "guest" who was really the member. Only that retryable answer counts:
 * a dead refresh token removes the session (a real sign-out → Auth), and a
 * read that STALLED says nothing about who it is, so it keeps Splash's
 * documented fallback, the login screen (QA Wave D, 2026-09-10).
 *
 * ⛔ …UNLESS THE DEVICE SAYS WHOSE IT IS (wake report, 2026-10-27). In real
 * use the "stall" is almost never the keychain: auth-js's `getSession()`
 * waits for its start-up refresh, which retries with backoff for up to 30 s
 * (and a stalled socket is bounded only at 30 s, boundedCall.ts). So a member
 * whose token expired while the phone sat unused, waking to a network that is
 * not up within ~3 s, was timed out at 5 s with NO error and sent to the login
 * screen — while the refresh then succeeded behind it. When the read stalled
 * and the device's account marker (accountLocalSync — a uid only after a
 * CONFIRMED account sign-in; '' for a guest) names an account, it is that
 * member's stored session: Main. A dead refresh token still answers fast
 * (session removed → no stall → Auth), and one that dies later is caught on
 * Main by Splash's confirm read / SessionExpiryGuard.
 *
 * Import-free apart from the account rule, so it is testable in node.
 */
import { isRealAccount, type MaybeSession } from '../features/commercial/realAccount.ts';

/** What `safeSessionResult(getSession())` hands back, as far as this needs. */
export type SplashSessionRead = {
  result: { data: { session: MaybeSession }; error?: { name?: unknown } | null };
  timedOut: boolean;
  /** The device's account marker names an account (asked only for a stall). */
  storedAccount?: boolean;
};

/** The base route under whatever was pushed over Splash. */
export function splashBase(read: SplashSessionRead): 'Main' | 'Auth' {
  if (isRealAccount(read.result.data.session)) return 'Main';
  // The refresh could not REACH the server: the session is still stored, and
  // it is the member's (safeSessionResult marks exactly this as timedOut).
  if (read.timedOut && read.result.error?.name === 'AuthRetryableFetchError') return 'Main';
  // The read STALLED (no answer at all) on a device whose last confirmed
  // identity was an account: a stall is not a guest (wake report 2026-10-27).
  if (read.timedOut && !read.result.error && read.storedAccount === true) return 'Main';
  return 'Auth';
}
