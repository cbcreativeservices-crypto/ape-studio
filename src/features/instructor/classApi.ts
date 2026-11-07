/**
 * The instructor's class — the app's calls (must-do E3). Rules and words live
 * in ./classRules (import-free, tested on their own).
 *
 * Every read has honest faces: a FAILED read is 'error', never "no students"
 * (house rule: loading / UNREADABLE / truly empty). A session that cannot be
 * confirmed is 'error' too, never "not an instructor".
 *
 * Reached only from the instructor code row in Profile (verified instructors)
 * and the dev sample, so nothing here is in the app-start graph.
 */
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { isRealAccount } from '../commercial/realAccount.ts';
import {
  classFromRows,
  isShareGone,
  progressFromJson,
  type ClassStudent,
  type StudentProgress,
} from './classRules.ts';
import { sampleClassState } from './sampleClass';

export type ClassState =
  | { state: 'ready'; code: string; students: ClassStudent[] }
  | { state: 'not-instructor' }
  | { state: 'error' };

export type StudentState =
  | { state: 'ready'; progress: StudentProgress }
  /** The student stopped sharing (or the caller lost verification). */
  | { state: 'gone' }
  | { state: 'error' };

const never = <T,>() => new Promise<T>(() => {});

function sample(): typeof import('./sampleClassData') {
  return require('./sampleClassData') as typeof import('./sampleClassData');
}

/** instructor_my_code() then instructor_students(). */
export async function fetchMyClass(): Promise<ClassState> {
  const s = sampleClassState();
  if (s) {
    if (s.face === 'loading') return never();
    if (s.face === 'unreadable') return { state: 'error' };
    if (s.face === 'not-instructor') return { state: 'not-instructor' };
    const d = sample();
    return {
      state: 'ready',
      code: d.SAMPLE_CODE,
      students: s.face === 'empty' ? [] : (classFromRows(d.SAMPLE_CLASS_ROWS) ?? []),
    };
  }
  try {
    const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'fetchMyClass');
    if (timedOut) return { state: 'error' };
    if (!isRealAccount(result.data.session)) return { state: 'not-instructor' };
    const code = await supabase.rpc('instructor_my_code');
    if (code.error) return { state: 'error' };
    if (typeof code.data !== 'string' || !code.data) return { state: 'not-instructor' };
    const list = await supabase.rpc('instructor_students');
    if (list.error) return { state: 'error' };
    const students = classFromRows(list.data ?? []);
    return students ? { state: 'ready', code: code.data, students } : { state: 'error' };
  } catch {
    return { state: 'error' };
  }
}

/** instructor_student_progress(p_share_id). */
export async function fetchStudentProgress(shareId: string): Promise<StudentState> {
  const s = sampleClassState();
  if (s) {
    if (s.student === 'loading') return never();
    if (s.student === 'unreadable') return { state: 'error' };
    if (s.student === 'gone') return { state: 'gone' };
    const progress = progressFromJson(sample().SAMPLE_PROGRESS[shareId]);
    return progress ? { state: 'ready', progress } : { state: 'gone' };
  }
  try {
    const { data, error } = await supabase.rpc('instructor_student_progress', { p_share_id: shareId });
    if (error) return isShareGone(error.message) ? { state: 'gone' } : { state: 'error' };
    const progress = progressFromJson(data);
    return progress ? { state: 'ready', progress } : { state: 'error' };
  } catch {
    return { state: 'error' };
  }
}
