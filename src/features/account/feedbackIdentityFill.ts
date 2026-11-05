/**
 * Fills the feedback email's identity at sign-in (bug report 2026-11-05 item 24).
 *
 * Emails sent straight from Help had no `role=` or `sid=` unless Profile or
 * Settings had been opened that session, so the inbox sweep could not route
 * them. This binds the live reads to `fillFeedbackIdentity` (feedbackTags.ts).
 *
 * NOT in the app-start graph: accountLocalSync loads it with a `require` inside
 * a function, because the graph sits at its cap (perfStartTrim). Importing
 * lib/feedback here is what registers the sign-out reset, so the identity can
 * never be set without the wipe knowing how to clear it.
 */
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import '../../lib/feedback';
import { fillFeedbackIdentity } from '../../lib/feedbackTags';
import { myVerifierKind } from '../employer/api';

/** The account signed in now. `undefined` = the session read did not come back. */
async function sessionUid(): Promise<string | null | undefined> {
  const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'feedbackIdentity');
  if (timedOut) return undefined;
  return result.data.session?.user?.id ?? null;
}

/** `undefined` = the read failed, which leaves the field as it was. */
async function studentId(): Promise<string | null | undefined> {
  try {
    const { data, error } = await supabase.rpc('my_identity').single();
    if (error) return undefined;
    return (data as { ape_student_id?: string | null } | null)?.ape_student_id ?? null;
  } catch {
    return undefined;
  }
}

export function fillFeedbackIdentityForAccount(uid: string): Promise<void> {
  return fillFeedbackIdentity(uid, { sessionUid, role: myVerifierKind, studentId });
}
