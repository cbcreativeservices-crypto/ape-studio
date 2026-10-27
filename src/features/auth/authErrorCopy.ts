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
  // A first SET NEW PASSWORD with the account's current password (night bug
  // pass 3, 2026-10-01) — fell through to the generic line, which never said why.
  if (/different from the old password/i.test(m)) {
    return 'That is already this account’s password — choose a different one.';
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
    // "NOT created" up front (owner, 2026-09-29: a tester could not get past
    // this, then kept trying LOGIN for an account that never existed).
    return 'Your account was NOT created yet — that password has appeared in a known data breach, so it can’t be used. Tap SUGGEST A STRONG PASSWORD (or type a different one — a few unrelated words work well), then tap CREATE ACCOUNT again.';
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

/* ── The account RECORD and the DELETED-account lookup (toddler bug hunt
 * 2026-10-14, items 7, 9, 10b — held for the owner, then approved) ─────────────────────
 *
 * Creating an account is two steps: the auth sign-up, then
 * register_commercial_user, which writes the public.users row. When the
 * second step failed, the device kept the auth session — so RETURN, LOGIN or
 * reopening walked into an account with no record. The device is now signed
 * out with ACCOUNT_SETUP_UNFINISHED. The rules below decide WHEN that is safe.
 *
 * ⛔ A REAL MEMBER MUST NEVER BE SIGNED OUT BY A TRANSIENT FAILURE. The cold-
 * start auth race (reference_cold_start_auth_race) means the first reads after
 * a launch can go out as anon: a 42501 denial, or — where RLS filters rather
 * than refuses — an empty answer that LOOKS like "no row". So:
 *   • any read ERROR other than an auth denial → unknown (do nothing);
 *   • an auth denial or an empty answer → wait for getSession() (it settles
 *     only once the stored session is loaded) and read ONCE more;
 *   • missing only when that second read, made with the SAME real account's
 *     session confirmed, also comes back empty with no error.
 * Pure like the rest of this file: the reads are passed in (api.ts wires
 * them), pinned by test/toddlerAccountHolds_20261014.test.ts.
 */


/** The message for a half-created account (owner wording, item 7). */
export const ACCOUNT_SETUP_UNFINISHED = 'Account setup didn’t finish — please try again.';

/** The same, where the person is signing IN (LOGIN, a relaunch): LOGIN again
 *  would only end here again, so name the step that finishes it. */
export const ACCOUNT_SETUP_UNFINISHED_SIGN_IN =
  'Account setup didn’t finish — please try again: tap CREATE ACCOUNT with the same email and password to finish setting it up.';

export type RecordAnswer = 'present' | 'missing' | 'unknown';

/** The stored session as these checks need it. 'unknown' = the read stalled,
 *  rejected or could not refresh (a member offline) — never "signed out". */
export type SessionRead = { uid: string | null; real: boolean } | 'unknown';

/** One users-row read: found / not found, or the error it failed with. */
export type RowRead = { found: boolean } | { error: unknown };

/** 42501 / "permission denied": the request went out without the member's
 *  token (same rule as features/study/sessionRetry.isAuthDenial). */
function isAuthDenial(e: unknown): boolean {
  if (e == null) return false;
  if ((e as { code?: unknown }).code === '42501') return true;
  const raw = (e as { message?: unknown }).message;
  return typeof raw === 'string' && /permission denied/i.test(raw);
}

/**
 * Does the signed-in account have its `public.users` row?
 * 'unknown' for no real account (a guest, an anonymous device key) as well:
 * there is nothing to judge, and nothing here may sign anyone out.
 */
export async function checkAccountRecord(deps: {
  readSession: () => Promise<SessionRead>;
  readRow: (uid: string) => Promise<RowRead>;
}): Promise<RecordAnswer> {
  const safe = async <T>(f: () => Promise<T>): Promise<T | 'unknown'> => {
    try {
      return await f();
    } catch {
      return 'unknown';
    }
  };
  const first = await safe(deps.readSession);
  if (first === 'unknown' || !first.real || !first.uid) return 'unknown';
  const uid = first.uid;

  const r1 = await safe(() => deps.readRow(uid));
  if (r1 === 'unknown') return 'unknown';
  if ('error' in r1) {
    if (!isAuthDenial(r1.error)) return 'unknown'; // offline, a stall, a 5xx
  } else if (r1.found) {
    return 'present';
  }

  // An auth denial or an empty answer: the race's two faces. getSession()
  // settles once the stored session is in place — then one more read.
  const again = await safe(deps.readSession);
  if (again === 'unknown' || !again.real || again.uid !== uid) return 'unknown';
  const r2 = await safe(() => deps.readRow(uid));
  if (r2 === 'unknown' || 'error' in r2) return 'unknown';
  return r2.found ? 'present' : 'missing';
}

/**
 * After `delete_my_account` timed out on the client (item 9): did the server
 * delete the account anyway? Classifies one `auth.getUser()` answer.
 *   'gone'    — the auth server says this user no longer exists;
 *   'present' — it returned the user (the delete did not happen, or not yet);
 *   'unknown' — no answer we can trust (offline, a stall, a 5xx).
 */
export type AccountLookup = 'gone' | 'present' | 'unknown';

export function classifyUserLookup(res: { data?: { user?: unknown } | null; error?: unknown } | null | undefined): AccountLookup {
  const error = res?.error as { status?: unknown; code?: unknown; message?: unknown; name?: unknown } | null | undefined;
  if (error) {
    const status = typeof error.status === 'number' ? error.status : 0;
    const code = typeof error.code === 'string' ? error.code : '';
    const msg = typeof error.message === 'string' ? error.message : '';
    // GoTrue: 403 "User from sub claim in JWT does not exist" (code
    // user_not_found); 404 on some versions. A network failure has no status.
    if (code === 'user_not_found') return 'gone';
    if ((status === 403 || status === 404) && /not exist|not found/i.test(msg)) return 'gone';
    return 'unknown';
  }
  return res?.data?.user ? 'present' : 'unknown';
}

/** A recovery code pasted as "123 456" (or with a stray newline): the spaces
 *  are not part of the code (item 10b). */
export function normalizeResetCode(raw: string): string {
  return raw.replace(/\s+/g, '');
}
