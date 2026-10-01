/**
 * Auth API — the ONLY registration path is the register_student RPC v2.1
 * (Code brief §1). Never touch tables directly; IMPL §3's direct-table
 * snippet is superseded (C-4).
 *
 * Flow: signUp(email, password) → session → register_student(id, code).
 * v2.1 auto-enrolls the SAFE course; first-topic seeding is trigger-side.
 */
import { supabase } from '../../lib/supabase';
import { safeSession } from '../../lib/getSessionSafe';
import { isRealAccount } from '../commercial/realAccount';
import { markIntentionalSignOut } from './intentionalSignOut';
import { softDeadline, withDeadline } from '../../lib/boundedCall';

/**
 * Every auth WRITE is bounded too (night bug pass 1, 2026-10-01). The reads
 * were bounded on 2026-09-21; signIn / signUp / the recovery calls were not,
 * and supabase-js has no fetch timeout. A socket that stops answering —
 * the stall this app has seen — left LOGIN / CREATE ACCOUNT / SET NEW
 * PASSWORD on a spinner with every button hidden and, on the app's own entry
 * screen, no RETURN either: force-quit was the only way out. A stall now
 * resolves as an error whose message says "timeout", which friendlyAuthError
 * already maps to the offline line, and the form comes back for a retry.
 */
export const AUTH_CALL_MS = 30000;
const orTimeoutError = (e: unknown) => ({ data: null, error: e as Error });

/**
 * ⛔ A LATE SUCCESS IS NOT A SIGN-IN (night bug pass 2, 2026-10-01).
 *
 * The deadline above stops WAITING; it cannot cancel the request. A sign-in
 * that answers after it (a socket that stalls past 30 s still delivers — iOS
 * gives a request 60) saves the session and emits SIGNED_IN anyway, while the
 * form is showing "you appear to be offline". The person was then signed in
 * behind the sign-in screen with no single-device claim: RETURN walked them
 * into the account, a Guest Mode tapped before it landed was overtaken by it,
 * and the next launch went straight in. So a call that has been given up on
 * and later brings a session signs this device back out — unless a NEWER
 * attempt has started since, whose outcome is the one the person is waiting on.
 */
let signInAttempt = 0;
async function boundedSignIn<T extends { data: { session?: unknown } | null }>(
  run: () => Promise<T>,
  label: string,
): Promise<T | { data: null; error: Error }> {
  const mine = ++signInAttempt;
  const call = run();
  try {
    return await withDeadline(() => call, label, AUTH_CALL_MS);
  } catch (e) {
    void call.then(
      (late) => {
        if (!late?.data?.session || mine !== signInAttempt) return;
        markIntentionalSignOut();
        void signOutThisDevice();
      },
      () => {},
    );
    return orTimeoutError(e);
  }
}

// The pure helpers live in authErrorCopy.ts so they can be unit-tested without
// standing up the Supabase client. Re-exported here so every existing call site
// (AuthScreen imports EMAIL_RE / passwordIssue from this module) is unchanged.
import { friendlyAuthError } from './authErrorCopy';
export { friendlyAuthError, EMAIL_RE, passwordIssue } from './authErrorCopy';

/**
 * Map a Supabase/JS auth error to user-facing copy (QA Wave D, D-3 2026-09-10).
 * Offline used to surface the raw developer string "Network request failed";
 * detect network failures and show an actionable line, pass everything else
 * through (Supabase's own messages are already user-legible for bad creds etc.).
 */
export type EnrolledCourse = {
  course_id: string;
  course_code: string;
  first_topic_id: string;
  first_topic_status: string;
  [k: string]: unknown;
};

export type RegisterStudentResult =
  | { success: true; user_id: string; enrolled_courses: EnrolledCourse[] }
  | { success: false; error_code: RegisterErrorCode };

export type RegisterErrorCode =
  | 'not_authenticated'
  | 'student_not_found_or_registered'
  | 'code_invalid_or_used'
  | 'internal_error';

/**
 * Locked S1 error copy (seed brief §3 S1, verbatim), mapped from RPC codes.
 * NOTE (flagged D-2b): the RPC conflates "ID not found" and "already
 * registered" into one code, so the locked copy "Already registered. Use Sign
 * In below." has no distinguishable trigger — pending a Booth ruling we map
 * that code to the "not found" message (it names the recovery path: professor).
 */
export const REGISTER_ERROR_COPY: Record<RegisterErrorCode, string> = {
  // COMMERCIAL WORDING (2026-09-17). The institutional mode is retired and
  // these are paying customers with no professor to check with — a support
  // route they do not have reads as the app not knowing who they are.
  student_not_found_or_registered: 'That ID or code was not found. Check it and try again, or contact support.',
  code_invalid_or_used: 'Registration code is incorrect or already used.',
  not_authenticated: 'Something went wrong. Please try again.',
  internal_error: 'Something went wrong. Please try again.',
};

// registerStudent() removed 2026-09-03 (owner decision "delete two dead entry
// points"). It called the register_student RPC, the one writer that inserted an
// enrollment row against the archived `courses` table. It was exported and never
// imported anywhere; AuthScreen signs up through registerCommercialUser instead.
/**
 * Ensure an authed session for the (email, password) pair.
 * - Fresh email → signUp creates the account + session.
 * - Email already has an account (e.g. retry after a failed register_student,
 *   app reinstall) → fall back to signInWithPassword so the flow is resumable.
 * Returns an error message to display, or null on success.
 *
 * Model-A assumption: email confirmation is DISABLED. If signUp comes back
 * with a user but NO session, confirmation is ON — surfaced as a build-config
 * error (backend-session concern, not fixable client-side).
 */
export async function ensureSession(email: string, password: string): Promise<string | null> {
  const existing = await safeSession(supabase.auth.getSession(), 'auth/api');
  // ⚠️ Not `existing.data.session`. A guest holding the glossary's temporary
  // device key HAS a session, and returning null here would tell the Auth
  // screen "you are already signed in" — so the account they came to create
  // would never be created. signUp / signInWithPassword below REPLACE the
  // anonymous session, which is exactly what should happen.
  const current = existing.data.session;
  if (isRealAccount(current)) {
    // ⛔ ONLY when it is the SAME account (bug hunt 2026-09-29). A real session
    // survives a half-finished CREATE ACCOUNT (signUp succeeded, the
    // registration RPC failed) and a password recovery that verified its code.
    // Returning null for ANY real session meant the next CREATE ACCOUNT — say
    // after fixing a typo in the email — silently finished registration on the
    // OLD account and signed the person into it. Same email → resume; any other
    // email → drop that session and create the account that was asked for.
    const sessionEmail = (current?.user?.email ?? '').trim().toLowerCase();
    if (sessionEmail && sessionEmail === email.trim().toLowerCase()) return null;
    // scope 'local' (bug pass 2, 2026-09-30): dropping the half-created
    // session on THIS device must not revoke the account's other sessions.
    markIntentionalSignOut();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // signUp below replaces the session either way.
    }
  }

  const { data, error: signUpError } = await boundedSignIn(
    () => supabase.auth.signUp({ email, password }),
    'signUp',
  );
  if (!signUpError) {
    if (data?.session) return null;
    console.warn('[auth] signUp returned no session — email confirmation appears ENABLED (model-A violation).');
    return 'Your account was created, but sign-in needs email confirmation first. Check your inbox, then sign in — or contact support if nothing arrives.';
  }

  /**
   * Email already registered → try signing in with the provided credentials.
   *
   * ⛔ ONLY for that case (owner 2026-09-20 bug pass). This fallback used to
   * run on ANY signUp failure and return the SIGN-IN error, so anything else
   * that can fail a brand-new signup — email signups switched off in the
   * dashboard, a server-side password-policy rejection, a provider 500 —
   * told the person creating an account "Email or password is incorrect."
   * about an account that does not exist. That is a dead end: the advice is
   * to fix a password they never set.
   */
  if (!/already|registered|exists|taken/i.test(signUpError.message)) {
    return friendlyAuthError(signUpError);
  }
  const signIn = await boundedSignIn(
    () => supabase.auth.signInWithPassword({ email, password }),
    'signIn',
  );
  if (!signIn.error) return null;
  // Surface the SIGN-IN failure (the operative one — e.g. wrong password), mapped
  // to offline copy when it's a network error, rather than the stale signUp error.
  return friendlyAuthError(signIn.error);
}

/**
 * Sign THIS DEVICE out even when the server cannot be reached (bug pass 3,
 * 2026-09-30) — for the two cases where the server has ALREADY decided this
 * device is out: the account was deleted, or another device took it over.
 *
 * supabase-js revokes on the server first and, when that request fails
 * (offline, a stall), returns { error } and KEEPS the local session. Ignored,
 * the app wiped the device, reset to Splash, found the session still there and
 * walked straight back in — a deleted account still signed in; a displaced
 * device re-displaced and re-wiped every poll. So: local scope, one retry, then
 * the local half of signOut() done directly (the stored session removed and
 * SIGNED_OUT emitted, exactly what signOut() does once its server call answers).
 *
 * NOT for an ordinary Log out, which deliberately refuses offline and says so.
 * Never rejects. The caller marks the sign-out intentional first.
 */
export async function signOutThisDevice(): Promise<void> {
  const attempt = () =>
    softDeadline<unknown>(
      async () => (await supabase.auth.signOut({ scope: 'local' })).error ?? null,
      new Error('signOut failed'),
      'signOut',
      8000,
    );
  let error = await attempt();
  if (error) {
    markIntentionalSignOut(); // the 8 s marker may have lapsed during the first try
    error = await attempt();
  }
  if (error) {
    markIntentionalSignOut();
    const auth = supabase.auth as unknown as { _removeSession?: () => Promise<void> };
    await softDeadline(async () => await auth._removeSession?.(), undefined, 'removeSession', 5000);
  }
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await boundedSignIn(
    () => supabase.auth.signInWithPassword({ email, password }),
    'signIn',
  );
  return friendlyAuthError(error);
}

/**
 * Password recovery — fully IN-APP (no deep link / URL scheme).
 *
 * The native app has no URL scheme (app.json) and detectSessionInUrl is off, so
 * the default emailed magic-LINK can never return to the app — a locked-out user
 * would be unrecoverable. Instead we use the 6-digit recovery OTP:
 *   1. requestPasswordReset → sends the recovery email.
 *   2. user reads the CODE from the email and enters it in-app.
 *   3. verifyRecoveryOtp(email, code) → establishes a recovery session.
 *   4. updatePassword(newPw) → sets the new password on that session.
 *
 * OWNER SETUP (one-time, Supabase dashboard → Auth → Email Templates → "Reset
 * Password"): the template MUST include the {{ .Token }} variable so the email
 * carries the 6-digit code. The default template only has {{ .ConfirmationURL }},
 * whose link is inert here. Auth config, not DB schema — outside the freeze.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const { error } = await withDeadline(
    () => supabase.auth.resetPasswordForEmail(email),
    'resetPasswordForEmail',
    AUTH_CALL_MS,
  ).catch(orTimeoutError);
  return friendlyAuthError(error);
}

/** Back-compat alias (older call sites). */
export const resetPassword = requestPasswordReset;

/** Verify the 6-digit recovery code → recovery session. Returns error or null. */
export async function verifyRecoveryOtp(email: string, token: string): Promise<string | null> {
  const { error } = await boundedSignIn(
    () => supabase.auth.verifyOtp({ email, token: token.trim(), type: 'recovery' }),
    'verifyOtp',
  );
  return friendlyAuthError(error);
}

/** Set a new password on the active (recovery) session. Returns error or null. */
export async function updatePassword(newPassword: string): Promise<string | null> {
  const { error } = await withDeadline(
    () => supabase.auth.updateUser({ password: newPassword }),
    'updateUser',
    AUTH_CALL_MS,
  ).catch(orTimeoutError);
  // ALREADY THAT PASSWORD = DONE (night bug pass 2, 2026-10-01). An update that
  // timed out can still land; the retry then sent the same password and the
  // server's "should be different from the old password" fell through to the
  // generic failure — a SET NEW PASSWORD that could never succeed, for a
  // password that was already set. The recovery code proved the address, and
  // the account's password is exactly the one asked for.
  const code = (error as { code?: string } | null)?.code;
  if (code === 'same_password' || /different from the old password/i.test(error?.message ?? '')) return null;
  return friendlyAuthError(error);
}
