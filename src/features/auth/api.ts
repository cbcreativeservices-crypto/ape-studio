/**
 * Auth API — the ONLY registration path is the register_student RPC v2.1
 * (Code brief §1). Never touch tables directly; IMPL §3's direct-table
 * snippet is superseded (C-4).
 *
 * Flow: signUp(email, password) → session → register_student(id, code).
 * v2.1 auto-enrolls the SAFE course; first-topic seeding is trigger-side.
 */
import { supabase } from '../../lib/supabase';

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
  student_not_found_or_registered: 'ID or code not found. Check with your professor.',
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
  const existing = await supabase.auth.getSession();
  if (existing.data.session) return null;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (!error) {
    if (data.session) return null;
    console.warn('[auth] signUp returned no session — email confirmation appears ENABLED (model-A violation).');
    return 'Account created but sign-in is blocked by email confirmation. Report this to your professor.';
  }

  // Email already registered → try signing in with the provided credentials.
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error) return null;
  return error.message;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
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
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return error ? error.message : null;
}

/** Back-compat alias (older call sites). */
export const resetPassword = requestPasswordReset;

/** Verify the 6-digit recovery code → recovery session. Returns error or null. */
export async function verifyRecoveryOtp(email: string, token: string): Promise<string | null> {
  const { error } = await supabase.auth.verifyOtp({ email, token: token.trim(), type: 'recovery' });
  return error ? error.message : null;
}

/** Set a new password on the active (recovery) session. Returns error or null. */
export async function updatePassword(newPassword: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? error.message : null;
}

/** Locked validation rules (seed brief §3 S1). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordIssue(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must include at least 1 uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must include at least 1 number.';
  return null;
}
