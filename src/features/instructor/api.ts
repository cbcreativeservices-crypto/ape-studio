/**
 * Instructor progress sharing — the app's calls (must-do H2 student switch,
 * and the verified instructor's own code for R1). The rules and words live in
 * ./shareRules (import-free, tested on their own).
 *
 * Every read here has three honest answers plus "guest": a FAILED read is
 * 'error', never "off" — a privacy switch must not assert a state it did not
 * verify. "On" / "off" is only ever shown from a server answer.
 */
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { isRealAccount } from '../commercial/realAccount.ts';
import { shareErrorCopy, shareFromRow, SHARE_COPY, type InstructorShare } from './shareRules.ts';

export type ShareState =
  /** No account (no session, or a guest's anonymous device key). The server
   *  refuses a guest anyway; the app never pretends a guest's choice is kept. */
  | { state: 'guest' }
  | { state: 'off' }
  | { state: 'on'; share: InstructorShare }
  /** The read failed or the session is unknown — show neither on nor off. */
  | { state: 'error' };

type Who = 'account' | 'guest' | 'unknown';

async function who(tag: string): Promise<Who> {
  const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), tag);
  if (timedOut) return 'unknown';
  return isRealAccount(result.data.session) ? 'account' : 'guest';
}

const firstRow = (data: unknown) => (Array.isArray(data) ? data[0] : data) ?? null;

/** instructor_share_mine(): no row = off. */
export async function fetchMyInstructorShare(): Promise<ShareState> {
  try {
    const w = await who('fetchMyInstructorShare');
    if (w === 'unknown') return { state: 'error' };
    if (w === 'guest') return { state: 'guest' };
    const { data, error } = await supabase.rpc('instructor_share_mine');
    if (error) return { state: 'error' };
    const share = shareFromRow(firstRow(data));
    return share ? { state: 'on', share } : { state: 'off' };
  } catch {
    return { state: 'error' };
  }
}

export type LookupResult =
  | { ok: true; instructorName: string; school: string | null }
  | { ok: false; error: string };

/** instructor_share_lookup(p_code): shows WHO before anything is shared.
 *  Changes nothing on the server. */
export async function lookupInstructor(code: string): Promise<LookupResult> {
  try {
    const w = await who('lookupInstructor');
    if (w === 'guest') return { ok: false, error: SHARE_COPY.needsAccount };
    if (w === 'unknown') return { ok: false, error: SHARE_COPY.notConfirmed };
    const { data, error } = await supabase.rpc('instructor_share_lookup', { p_code: code });
    if (error) return { ok: false, error: shareErrorCopy(error.message) };
    const s = shareFromRow(firstRow(data));
    // No row: wrong code, not an instructor, revoked, or the caller's own.
    if (!s) return { ok: false, error: SHARE_COPY.codeWrong };
    return { ok: true, instructorName: s.instructorName, school: s.school };
  } catch {
    return { ok: false, error: SHARE_COPY.notConfirmed };
  }
}

export type ShareWrite = { ok: true; share: InstructorShare } | { ok: false; error: string };

/** instructor_share_on(p_code): replaces any earlier instructor. "On" is
 *  shown ONLY from the row this returns. */
export async function shareWithInstructor(code: string): Promise<ShareWrite> {
  try {
    const w = await who('shareWithInstructor');
    if (w === 'guest') return { ok: false, error: SHARE_COPY.needsAccount };
    if (w === 'unknown') return { ok: false, error: SHARE_COPY.notConfirmed };
    const { data, error } = await supabase.rpc('instructor_share_on', { p_code: code });
    if (error) return { ok: false, error: shareErrorCopy(error.message) };
    const share = shareFromRow(firstRow(data));
    return share ? { ok: true, share } : { ok: false, error: SHARE_COPY.notConfirmed };
  } catch {
    return { ok: false, error: SHARE_COPY.notConfirmed };
  }
}

/** instructor_share_off(): true = a share was removed, false = there was none.
 *  Either way nothing is shared afterwards. */
export async function stopSharingWithInstructor(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const w = await who('stopSharingWithInstructor');
    if (w === 'unknown') return { ok: false, error: SHARE_COPY.notConfirmed };
    if (w === 'guest') return { ok: true }; // a guest cannot have a share
    const { error } = await supabase.rpc('instructor_share_off');
    return error ? { ok: false, error: SHARE_COPY.notConfirmed } : { ok: true };
  } catch {
    return { ok: false, error: SHARE_COPY.notConfirmed };
  }
}

/**
 * instructor_my_code(): a verified instructor's code for students (made on
 * the first call). null for anyone else; 'error' when the read failed.
 */
export async function fetchMyInstructorCode(): Promise<string | null | 'error'> {
  try {
    const { data, error } = await supabase.rpc('instructor_my_code');
    if (error) return 'error';
    return typeof data === 'string' && data ? data : null;
  } catch {
    return 'error';
  }
}
