/**
 * "Does this person have an ACCOUNT?" — one definition, used everywhere
 * (owner 2026-09-13).
 *
 * ⚠️ WHY THIS IS NOT `!!session` ANY MORE. The glossary asks a guest to accept a
 * temporary device ID so the server can meter their free definitions
 * (docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md). That ID is a real
 * Supabase session — an ANONYMOUS one — created by `signInAnonymously()`. The
 * person behind it still has no account, no email, no password and no progress.
 *
 * Twenty call sites across the app used the presence of a session to mean "this
 * is a signed-in user". Every one of them would have silently changed behaviour
 * the day a guest accepted the dialog, nowhere near the glossary:
 *
 *   - `ensureSession` would have decided the guest was already signed in and
 *     never created the account they were trying to create;
 *   - redeeming an access code would have written the entitlement to a uid that
 *     the nightly purge deletes seven days later;
 *   - Profile would have read `users`, got 42501, and shown "Couldn't load your
 *     ID — check your connection" to someone with a perfect connection — the
 *     exact defect fixed earlier the same day;
 *   - the Dashboard's "your progress isn't saved" guest notice would have
 *     disappeared for the people who most need it;
 *   - Splash would have routed the guest to Main forever, so Settings'
 *     "Sign in / create account" bounced back into the app.
 *
 * So: a session proves the request can be signed. It no longer proves there is
 * an account behind it. Ask this instead.
 *
 * Import-free on purpose, so it is testable without the RN module graph.
 */

/** The subset of a Supabase session this question needs. */
export type MaybeSession = { user?: { is_anonymous?: boolean | null } | null } | null | undefined;

/** True only for a session belonging to a real, named account. */
export function isRealAccount(session: MaybeSession): boolean {
  if (!session) return false;
  return session.user?.is_anonymous !== true;
}

/** True for a guest: no session at all, or an anonymous device key. */
export function isGuestSession(session: MaybeSession): boolean {
  return !isRealAccount(session);
}
