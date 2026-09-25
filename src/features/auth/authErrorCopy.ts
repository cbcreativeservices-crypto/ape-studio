/**
 * authErrorCopy — the PURE half of the auth layer: turning a server error into
 * something a person can act on, and the local password rules.
 *
 * Split out of `api.ts` on 2026-09-25 for one reason: `api.ts` imports the
 * Supabase client, so none of this could be unit-tested without standing up a
 * React Native environment. This mapping is the difference between "choose a
 * different password" and a generic failure that strands somebody on the front
 * door of the app, so it deserves a test that runs in milliseconds.
 * `api.ts` re-exports everything here, so call sites are unchanged.
 */

/**
 * Map a Supabase/JS auth error to user-facing copy (QA Wave D, D-3 2026-09-10).
 * Offline used to surface the raw developer string "Network request failed";
 * detect network failures and show an actionable line, pass everything else
 * through (Supabase's own messages are already user-legible for bad creds etc.).
 */
export function friendlyAuthError(error: { message?: string } | null | undefined): string | null {
  if (!error) return null;
  const m = error.message ?? '';
  if (/network request failed|failed to fetch|network error|timed out|timeout|unable to (resolve|connect)|offline|enotfound|econnrefused|socket hang/i.test(m)) {
    return 'You appear to be offline — reconnect and try again.';
  }
  // [1] (2026-09-07): map the common Supabase auth errors to friendly copy
  // instead of relaying the raw error.message to the user.
  if (/invalid login credentials|invalid.*(email|password)/i.test(m)) {
    return 'Email or password is incorrect.';
  }
  if (/email not confirmed/i.test(m)) {
    return 'Please confirm your email, then sign in.';
  }
  if (/rate limit|too many/i.test(m)) {
    return 'Too many attempts — wait a moment and try again.';
  }
  /**
   * ⛔ THE BIGGEST HOLE ON THE FRONT DOOR (measured 2026-09-25).
   *
   * Supabase's leaked-password protection rejects any password found in a known
   * breach corpus, with HTTP 422 and this message. In the 24 hours before this
   * was written the auth log showed **13 signups rejected this way against 7
   * that succeeded** — nearly two thirds of everyone trying to create an
   * account, while testers were reporting "I never got the email".
   *
   * They never got one because NO ACCOUNT WAS EVER CREATED. And nothing told
   * them: the string below matched none of the cases above, so it fell through
   * to the generic "We couldn't complete that", which never mentions the
   * password. The person retypes the same breached password and fails again.
   *
   * ⚠️ OUR OWN RULE CANNOT CATCH THIS. `passwordIssue()` requires 8 characters,
   * a capital and a number — which "Password1" satisfies, and which is in every
   * breach list there is. Client-side rules check SHAPE; only the server knows
   * whether a password has leaked. So this must be mapped, not prevented.
   */
  if (/known to be weak|weak.*password|password.*(leaked|breach|pwned)/i.test(m)) {
    return 'That password has appeared in a known data breach, so it can’t be used. Please choose a different one — a few unrelated words work well.';
  }
  // The server can also enforce its own length policy, which may not match the
  // 8-character rule below. Relay it as a password problem rather than as the
  // generic failure, so the person knows which field to fix.
  if (/password should be at least|password is too short|password.*at least \d+ characters/i.test(m)) {
    return 'That password is too short — please choose a longer one.';
  }
  if (/user already registered|already been registered/i.test(m)) {
    return 'That email already has an account — sign in instead.';
  }
  // ⚠️ This used to be `return m || …`, so every unmapped GoTrue string
  // rendered verbatim on the app's first screen — "Signups not allowed for
  // this instance", "Database error saving new user", and "Password should be
  // at least 6 characters", which contradicts our own 8-character rule below.
  return 'We couldn’t complete that. Your details were not changed — try again, and email info@proaudiotrainingacademy.com if it continues.';
}

/** Locked validation rules (seed brief §3 S1). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordIssue(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must include at least 1 uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must include at least 1 number.';
  return null;
}
