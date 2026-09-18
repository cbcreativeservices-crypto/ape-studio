/**
 * Final Exam RPC layer — start_final_exam + submit_final_exam (R6b).
 *
 * Deliberately mirrors features/quiz/api.ts: the server enforces the SAME
 * rules for both surfaces (verified against live function bodies 2026-08-28) —
 *   • answers keyed by slot_index as served VALUE strings (F4 contract),
 *   • graded by the shared grade_one(),
 *   • timed_out past 602 seconds from started_at,
 *   • voided at focus_loss_count >= 2 with a 15-minute lockout,
 *   • pass mark = size - 2.
 * Keeping the two layers symmetrical means a fix to one is obviously a fix to
 * the other. Where this file differs from the quiz it is called out inline.
 *
 * Idempotency: the client attempt id is generated once per (award_type,
 * award_id) and PERSISTED — re-calling start with the same id (or with an
 * in_progress attempt open) returns the SAME payload. Resume = re-call.
 *
 * Offline: exam START is online-only (same as the quiz). An offline SUBMIT is
 * queued and replayed with the true p_submitted_at + p_submitted_offline=true,
 * so the server still grades the timeout against when the user actually
 * finished. DIFFERENCE FROM QUIZ: the quiz queue is a SQLite/web platform pair;
 * a final exam is a once-per-award event, so this uses a single AsyncStorage
 * blob rather than extending that schema.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../telemetry/telemetry';

export type AwardType = 'certificate' | 'program';

export type QuestionType = 'mc' | 'fill_in_blank' | 'multi_select' | 'matching';
export type MatchingOptions = { lefts: string[]; rights: string[] };

/** One served exam item. Shape confirmed against build_final_exam_payload
 *  after the 2026-08-28 patch that added the quiz_questions join. */
export type ExamItem = {
  slot_index: number;
  question_id: string;
  question_type: QuestionType;
  question_text: string | null;
  stem: string | null;
  options: string[] | MatchingOptions;
  media_url: string | null;
  media_type: string | null;
};

export type ExamPayload = {
  attempt_id: string;
  award_type: AwardType;
  award_id: string;
  status: string;
  size: number;
  started_at: string;
  time_limit_seconds: number;
  items: ExamItem[];
};

/** F4-safe answer shapes — identical contract to the quiz. */
export type AnswerValue = string | string[] | [string, string][];

export type ExamOutcome = 'pass' | 'no_pass' | 'voided' | 'timed_out';

export type ExamResult = {
  attempt_id: string;
  award_type: AwardType;
  award_id: string;
  score: number;
  size: number;
  pass_mark: number;
  passed: boolean;
  outcome: ExamOutcome;
  credential_awarded: boolean;
  wrong_answers: Record<string, { correct: unknown; selected: unknown }>;
  lockout_until: string | null;
};

/** Every exception start_final_exam can raise (read from the live body). */
export type ExamStartError =
  | 'academy_required'
  /** One complete month of PAID membership, unbroken, before a credential is
   *  granted (owner 2026-07-22, restated 2026-09-17). Raised by
   *  start_final_exam after the academy check. */
  | 'paid_tenure_required'
  | 'already_earned'
  | 'award_content_incomplete'
  | 'award_incomplete'
  | 'award_not_found'
  | 'invalid_award_type'
  | 'pool_too_small'
  | 'under_lockout'
  | 'user_not_found'
  | 'offline'
  | 'unknown';

export const EXAM_START_ERROR_COPY: Record<ExamStartError, string> = {
  academy_required: 'Academy membership is required to take a Final Exam.',
  // States the rule and what to do about it. It deliberately does NOT promise a
  // date: the eligibility date is the server's to compute, and a client that
  // guessed it would be wrong for anyone whose membership lapsed and restarted.
  paid_tenure_required:
    'A Final Exam opens after one complete month of paid membership. Your study progress is saved — come back when the month is up.',
  already_earned: 'You have already earned this credential.',
  award_content_incomplete: 'This award is not open for examination yet — its topics are still being published.',
  award_incomplete: 'Complete every required topic and the Audio Fundamentals labs before taking the Final Exam.',
  award_not_found: 'That award could not be found.',
  invalid_award_type: 'That award type is not recognized.',
  pool_too_small: 'This Final Exam is not available yet — please contact support so we can look at it.',
  under_lockout: 'This Final Exam is locked out after a voided attempt. Try again when the lockout ends.',
  user_not_found: 'We could not find your account record. Sign out and back in, and contact support if it continues.',
  offline: 'Starting the Final Exam requires a connection. Reconnect and try again.',
  unknown: 'Could not start the Final Exam. Try again.',
};

const KNOWN_ERRORS: ExamStartError[] = [
  'academy_required',
  'paid_tenure_required',
  'already_earned',
  'award_content_incomplete',
  'award_incomplete',
  'award_not_found',
  'invalid_award_type',
  'pool_too_small',
  'under_lockout',
  'user_not_found',
];

function parseStartError(message: string): ExamStartError {
  // Longest-first so 'award_incomplete' can never shadow
  // 'award_content_incomplete' (it is a substring of it).
  const found = [...KNOWN_ERRORS].sort((a, b) => b.length - a.length).find((c) => message.includes(c));
  if (found) return found;
  if (/network|fetch/i.test(message)) return 'offline';
  return 'unknown';
}

export class ExamStartFailure extends Error {
  constructor(public code: ExamStartError) {
    super(code);
  }
}

const intentKey = (awardType: AwardType, awardId: string) => `ape:finalExamIntent:${awardType}:${awardId}`;

/** Start (or resume) a Final Exam attempt. Online-only. */
export async function startFinalExam(awardType: AwardType, awardId: string): Promise<ExamPayload> {
  const key = intentKey(awardType, awardId);
  // The intent id is a RESUME CONVENIENCE, not a correctness requirement: it
  // lets a crash/relaunch rejoin the same attempt. Unguarded, a local storage
  // hiccup threw before the RPC was ever called, and the caller's broad catch
  // turned that into "the exam could not be started" — a paid capstone refused
  // over a write that only affects resuming. Storage failure on this app is
  // proven, not hypothetical (the SQLITE_FULL incident, 2026-09-11). Losing the
  // id costs resume; refusing to start costs the exam.
  let intentId: string | null = null;
  try {
    intentId = await AsyncStorage.getItem(key);
  } catch {
    intentId = null;
  }
  if (!intentId) {
    intentId = Crypto.randomUUID();
    try {
      await AsyncStorage.setItem(key, intentId);
    } catch {
      /* resume convenience only — the attempt still starts */
    }
  }
  const { data, error } = await supabase.rpc('start_final_exam', {
    p_award_type: awardType,
    p_award_id: awardId,
    p_client_attempt_id: intentId,
  });
  if (error) throw new ExamStartFailure(parseStartError(error.message));
  // Anonymous count only — award kind, never the award/attempt id.
  trackEvent('exam_start', { award: awardType });
  return data as ExamPayload;
}

export async function clearExamIntent(awardType: AwardType, awardId: string): Promise<void> {
  // Guarded for the SAME reason the start path is, and the stakes here are
  // higher: this runs AFTER a successful submit. Unguarded, a storage throw
  // landed in the caller's catch, which does not match /network|fetch/ and so
  // told the learner their capstone "failed to submit", re-armed the
  // double-submit latch and sent them back — for an exam the server had
  // already graded and recorded. Same shape at the RETAKE button, where a
  // throw made it silently do nothing.
  try {
    await AsyncStorage.removeItem(intentKey(awardType, awardId));
  } catch {
    /* resume convenience only — the attempt is already recorded server-side */
  }
}

export type SubmitArgs = {
  attemptId: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
  submittedOffline: boolean;
  focusLossCount: number;
  focusLossDuration: number;
};

export async function submitFinalExam(args: SubmitArgs): Promise<ExamResult> {
  const { data, error } = await supabase.rpc('submit_final_exam', {
    p_attempt_id: args.attemptId,
    p_answers: args.answers,
    p_submitted_at: args.submittedAt,
    p_submitted_offline: args.submittedOffline,
    p_focus_loss_count: args.focusLossCount,
    p_focus_loss_duration: args.focusLossDuration,
  });
  if (error) throw new Error(error.message);
  const result = data as ExamResult;
  trackEvent('exam_finish', { passed: result.passed, offline: args.submittedOffline });
  return result;
}

/* ---------------- offline submit queue (AsyncStorage) ---------------- */

const QUEUE_KEY = 'ape:finalExamQueue';

/**
 * A queued exam now records WHOSE it is (2026-09-17).
 *
 * The queue used to be anonymous, which forced a choice between two bad
 * outcomes on an account switch: drop it, and a learner who signs out loses a
 * graded capstone they were promised was saved; keep it, and it replays under
 * whoever signs in next and is credited to the wrong person.
 *
 * Stamping the row removes the dilemma. The queue survives an account change,
 * and the replay submits only the rows belonging to the session doing the
 * replaying. `userId` is optional so a queue written by an older build still
 * parses; those rows are treated as the current user's, which is what they were.
 */
type QueuedExam = SubmitArgs & { awardType: AwardType; awardId: string; userId?: string | null };

/** The signed-in user, or null. Never throws: a failed read must not stop a
 *  submission being queued, so an unknown owner is recorded as null. */
async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Read the queue, QUARANTINING anything unreadable rather than discarding it.
 *
 * Fixed 2026-09-17. This used to `return []` on a parse failure, and the very
 * next thing the replay does is write the survivors back — so one malformed
 * byte permanently destroyed a graded final exam that had not reached the
 * server yet. The house idiom (patternStore, projectStore, soundSafetyAck)
 * moves a damaged row to a `:damaged` key precisely so nothing that might still
 * be recoverable is deleted by a parse error. The highest-stakes collection in
 * the app was the one collection not doing it.
 */
async function readQueue(): Promise<QueuedExam[]> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(QUEUE_KEY);
  } catch {
    // Storage unreadable. Returning [] is right — but do NOT let the caller
    // write an empty queue over data it could not read, which is what
    // `queueReadable` below prevents.
    queueReadable = false;
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QueuedExam[];
    if (Array.isArray(parsed)) return parsed;
    throw new Error('not an array');
  } catch {
    try {
      await AsyncStorage.setItem(`${QUEUE_KEY}:damaged`, raw);
      await AsyncStorage.removeItem(QUEUE_KEY);
      console.warn('[final-exam] queue was unreadable; parked at :damaged rather than deleted');
    } catch {
      // Could not park it — then do not let it be overwritten either.
      queueReadable = false;
    }
    return [];
  }
}

/** False once a read failed, so nothing overwrites a queue we could not see. */
let queueReadable = true;

/**
 * Persist the queue. Returns whether it actually landed.
 *
 * Fixed 2026-09-17: this swallowed every error, so "Your exam is saved and will
 * be submitted automatically" could be false at the moment it was shown, and
 * the learner would never find out. A caller that cannot tell cannot warn.
 */
async function writeQueue(rows: QueuedExam[]): Promise<boolean> {
  if (!queueReadable) {
    // We could not read the existing queue, so writing would clobber whatever
    // is there. Refusing is the safe direction: a duplicate replay is harmless
    // (the server returns the frozen result_payload), a lost exam is not.
    console.warn('[final-exam] refusing to overwrite a queue that could not be read');
    return false;
  }
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(rows));
    return true;
  } catch (e) {
    console.error('[final-exam] QUEUE WRITE FAILED — a submission may be lost:', (e as Error)?.message);
    return false;
  }
}

/** Queue a submission that failed for network reasons. Keyed by attempt_id. */
export async function enqueueExamSubmission(row: QueuedExam): Promise<boolean> {
  const rows = await readQueue();
  const next = rows.filter((r) => r.attemptId !== row.attemptId);
  next.push({ ...row, userId: row.userId ?? (await currentUserId()) });
  // The boolean is the point: the caller must not tell the learner their exam
  // is safely queued when it is not.
  return writeQueue(next);
}

/**
 * Replay queued offline submissions with the true submitted_at. Stops quietly
 * while still offline; drops rows the server hard-rejects (a finalized attempt
 * returns its frozen result_payload rather than erroring, so a reject here
 * means the row can never succeed).
 */
export async function replayExamSubmissions(): Promise<{ awardId: string; result: ExamResult }[]> {
  const rows = await readQueue();
  if (rows.length === 0) return [];
  const done: { awardId: string; result: ExamResult }[] = [];
  const remaining: QueuedExam[] = [];
  let offline = false;
  const me = await currentUserId();

  for (const r of rows) {
    // NOT THIS ACCOUNT'S EXAM — keep it, do not submit it. The other user may
    // sign back in on this device, and their answers are still the only copy;
    // submitting them here would credit a graded capstone to the wrong person.
    // A row with no owner predates the stamp, so it belongs to whoever is here.
    if (r.userId != null && me != null && r.userId !== me) {
      remaining.push(r);
      continue;
    }
    if (offline) {
      remaining.push(r);
      continue;
    }
    try {
      const result = await submitFinalExam({
        attemptId: r.attemptId,
        answers: r.answers,
        submittedAt: r.submittedAt,
        submittedOffline: true,
        focusLossCount: r.focusLossCount,
        focusLossDuration: r.focusLossDuration,
      });
      await clearExamIntent(r.awardType, r.awardId);
      done.push({ awardId: r.awardId, result });
    } catch (e) {
      const msg = (e as Error)?.message ?? '';
      // WIDENED 2026-09-17. This tested only /network|fetch/, so a TIMEOUT or an
      // ABORT — neither of which contains either word — fell through to the
      // `else` and PERMANENTLY DELETED a graded capstone the server had never
      // seen. `study/sync.ts` already used the broader pattern, so the least
      // valuable data in the app had the best protection and the final exam had
      // the worst.
      //
      // The rule now: a row is dropped ONLY on a positive, permanent server
      // rejection. Anything unrecognised is kept and retried, because keeping a
      // row costs one duplicate call (the server returns the frozen
      // result_payload for a finalized attempt) and dropping one costs the
      // user their credential.
      const transient = /network|fetch failed|failed to fetch|timeout|timed out|abort|socket|econn|offline/i.test(msg);
      const permanent = /attempt_not_found|already_finalized|invalid_attempt|not_authenticated|user_not_found/i.test(msg);
      if (transient) {
        offline = true;
        remaining.push(r);
      } else if (permanent) {
        console.warn('[final-exam] dropping permanently rejected submission:', msg);
      } else {
        console.warn('[final-exam] keeping queued submission after an unrecognised error:', msg);
        remaining.push(r);
      }
    }
  }
  await writeQueue(remaining);
  return done;
}

/** Drop the queue on account switch so one user's exam never replays as another's. */
export async function clearExamQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
