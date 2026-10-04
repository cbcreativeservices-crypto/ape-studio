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
 * Import-free apart from the account rule, so it is testable in node.
 */
import { isRealAccount, type MaybeSession } from '../features/commercial/realAccount.ts';

/** What `safeSessionResult(getSession())` hands back, as far as this needs. */
export type SplashSessionRead = {
  result: { data: { session: MaybeSession }; error?: { name?: unknown } | null };
  timedOut: boolean;
};

/** The base route under whatever was pushed over Splash. */
export function splashBase(read: SplashSessionRead): 'Main' | 'Auth' {
  if (isRealAccount(read.result.data.session)) return 'Main';
  // The refresh could not REACH the server: the session is still stored, and
  // it is the member's (safeSessionResult marks exactly this as timedOut).
  if (read.timedOut && read.result.error?.name === 'AuthRetryableFetchError') return 'Main';
  return 'Auth';
}
