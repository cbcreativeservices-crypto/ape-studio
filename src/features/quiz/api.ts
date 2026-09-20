/**
 * Quiz RPC layer — start_quiz_attempt (v2.12-pooled) + submit_quiz (v8.2).
 *
 * 🔴 F4 (Code brief §4): answers are submitted as option VALUES — the exact
 * strings from served_options — keyed by slot_index (string). NEVER positional
 * letters or indices, for all 4 question types:
 *   mc / fill_in_blank → the chosen option string (byte-exact)
 *   multi_select       → array of chosen strings
 *   matching           → array of [left, right] string pairs
 * The AnswerValue type makes letter submission unrepresentable; every render
 * path hands back the served strings themselves.
 *
 * Idempotency: the client attempt id is generated once per attempt intent and
 * PERSISTED — re-calling start with the same id (or with an in_progress
 * attempt open) returns the SAME payload. Resume = re-call; never re-draw.
 * Quiz start is online-only; an offline SUBMIT queues locally and replays
 * with the true p_submitted_at + p_submitted_offline=true (Code brief §6).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../telemetry/telemetry';
import {
  deleteQueuedSubmission,
  getQueuedSubmissions,
  upsertQueuedSubmission,
} from './submissionQueueStorage';

export type QuestionType = 'mc' | 'fill_in_blank' | 'multi_select' | 'matching';
export type MatchingOptions = { lefts: string[]; rights: string[] };

export type ServedQuestion = {
  slot_index: number;
  question_id: string;
  question_type: QuestionType;
  question_text: string;
  stem: string | null;
  options: string[] | MatchingOptions;
  media_url: string | null;
  media_type: string | null;
};

export type AttemptPayload = {
  attempt_id: string;
  started_at: string;
  is_practice: boolean;
  time_limit_seconds: number;
  questions: ServedQuestion[];
};

/** F4-safe answer shapes (see header). */
export type AnswerValue = string | string[] | [string, string][];

export type QuizOutcome = 'full_pass' | 'partial_pass' | 'no_pass' | 'voided' | 'timed_out';

export type SubmitResult = {
  attempt_id: string;
  score: number;
  outcome: QuizOutcome;
  new_status: string;
  best_genuine_score: number;
  next_topic: { unlocked: boolean; clamped?: boolean } | null;
  wrong_answers: Record<string, { correct: unknown; selected: unknown }>;
  lockout_until?: string;
};

export type QuizStartError =
  | 'safety_prerequisite_incomplete'
  | 'study_gate_unmet'
  | 'under_lockout'
  | 'topic_locked'
  | 'not_enrolled'
  | 'version_mismatch'
  | 'pool_too_small'
  | 'user_not_found'
  | 'offline'
  | 'unknown';

/** RAISEd-error → user copy (routing table, Code brief §2.1). */
/** Ratified quiz shape (Booth 2026-09-03): 30 questions, pass at 28. The
 *  25-question quiz was retired ~a month earlier; do not reintroduce 25/24. */
export const QUIZ_SIZE = 30;
export const QUIZ_PASS = 28;

export const QUIZ_START_ERROR_COPY: Record<QuizStartError, string> = {
  safety_prerequisite_incomplete: 'Complete the Safety topic quiz before starting course topics.',
  study_gate_unmet: 'Study requirements are not yet met for this topic. See the quiz block for what remains.',
  under_lockout: 'This quiz is locked out after a voided attempt. Try again when the lockout ends.',
  topic_locked: 'This topic is locked.',
  not_enrolled: 'You are not enrolled in this course.',
  version_mismatch: 'Course content was updated — return to the Dashboard.',
  pool_too_small: 'This quiz is not available yet — please contact support so we can look at it.',
  user_not_found: 'We could not find your account record. Sign out and back in, and contact support if it continues.',
  offline: 'Quiz start requires a connection. Reconnect and try again.',
  unknown: 'Could not start the quiz. Try again.',
};

const KNOWN_ERRORS: QuizStartError[] = [
  'safety_prerequisite_incomplete',
  'study_gate_unmet',
  'under_lockout',
  'topic_locked',
  'not_enrolled',
  'version_mismatch',
  'pool_too_small',
  'user_not_found',
];

function parseStartError(message: string): QuizStartError {
  const found = KNOWN_ERRORS.find((c) => message.includes(c));
  if (found) return found;
  if (/network|fetch/i.test(message)) return 'offline';
  return 'unknown';
}

const intentKey = (achievementId: string) => `ape:quizIntent:${achievementId}`;

export class QuizStartFailure extends Error {
  constructor(public code: QuizStartError) {
    super(code);
  }
}

/**
 * Start (or resume) an attempt. The client attempt id persists until a
 * finalized submit, so a crash/relaunch resumes the SAME attempt + payload.
 */
export async function startQuizAttempt(achievementId: string): Promise<AttemptPayload> {
  // The intent id is a RESUME CONVENIENCE, not a correctness requirement: it
  // lets a crash/relaunch rejoin the same attempt. Unguarded, a local storage
  // hiccup threw before the RPC was ever called, and the caller's broad catch
  // turned that into "the exam could not be started" — a paid capstone refused
  // over a write that only affects resuming. Storage failure on this app is
  // proven, not hypothetical (the SQLITE_FULL incident, 2026-09-11). Losing the
  // id costs resume; refusing to start costs the exam.
  let intentId: string | null = null;
  try {
    intentId = await AsyncStorage.getItem(intentKey(achievementId));
  } catch {
    intentId = null;
  }
  if (!intentId) {
    intentId = Crypto.randomUUID();
    try {
      await AsyncStorage.setItem(intentKey(achievementId), intentId);
    } catch {
      /* resume convenience only — the attempt still starts */
    }
  }
  const { data, error } = await supabase.rpc('start_quiz_attempt', {
    p_achievement_id: achievementId,
    p_client_attempt_id: intentId,
  });
  if (error) throw new QuizStartFailure(parseStartError(error.message));
  const payload = data as AttemptPayload;
  // Anonymous count only — no topic/attempt ids leave the app.
  trackEvent('quiz_start', { practice: payload.is_practice });
  return payload;
}

export async function clearQuizIntent(achievementId: string): Promise<void> {
  // Guarded for the SAME reason the start path is, and the stakes here are
  // higher: this runs AFTER a successful submit. Unguarded, a storage throw
  // landed in the caller's catch, which does not match /network|fetch/ and so
  // told the learner their capstone "failed to submit", re-armed the
  // double-submit latch and sent them back — for an exam the server had
  // already graded and recorded. Same shape at the RETAKE button, where a
  // throw made it silently do nothing.
  try {
    await AsyncStorage.removeItem(intentKey(achievementId));
  } catch {
    /* resume convenience only — the attempt is already recorded server-side */
  }
}

export async function submitQuiz(args: {
  attemptId: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
  submittedOffline: boolean;
  focusLossCount: number;
  focusLossDuration: number;
}): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc('submit_quiz', {
    p_attempt_id: args.attemptId,
    p_answers: args.answers,
    p_submitted_at: args.submittedAt,
    p_submitted_offline: args.submittedOffline,
    p_focus_loss_count: args.focusLossCount,
    p_focus_loss_duration: args.focusLossDuration,
  });
  if (error) throw new Error(error.message);
  const result = data as SubmitResult;
  trackEvent('quiz_finish', { outcome: result.outcome, offline: args.submittedOffline });
  return result;
}

/* ---------------- offline submit queue (Code brief §6) ---------------- */

export function enqueueSubmission(args: {
  attemptId: string;
  achievementId: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
  focusLossCount: number;
  focusLossDuration: number;
}): boolean {
  // RETURNS WHETHER IT STORED (2026-09-17, bug-hunt pass 2).
  //
  // This was `void` and `upsertQueuedSubmission` is a bare synchronous SQLite
  // write, so a throw — a full disk, a locked database — escaped through the
  // caller's `catch` block, skipped its dialog entirely, and surfaced as an
  // unhandled rejection off a `void doSubmit()`. The learner saw NO message at
  // all and their finished attempt was gone. The final-exam twin was given this
  // same treatment; the quiz was left behind.
  try {
    upsertQueuedSubmission(
      {
        attempt_id: args.attemptId,
        achievement_id: args.achievementId,
        answers_json: JSON.stringify(args.answers),
        submitted_at: args.submittedAt,
        focus_loss_count: args.focusLossCount,
        focus_loss_duration: args.focusLossDuration,
      },
      Date.now(),
    );
    return true;
  } catch (e) {
    console.error('[quiz] could not queue the offline submission:', (e as Error)?.message);
    return false;
  }
}

/**
 * Replay queued offline submissions (true submitted_at, submitted_offline).
 * Returns finalized results for caller display; stops quietly while offline.
 */
export async function replayQuizSubmissions(): Promise<
  { achievementId: string; result: SubmitResult }[]
> {
  const rows = getQueuedSubmissions();
  const results: { achievementId: string; result: SubmitResult }[] = [];
  for (const r of rows) {
    try {
      const result = await submitQuiz({
        attemptId: r.attempt_id,
        answers: JSON.parse(r.answers_json),
        submittedAt: r.submitted_at,
        submittedOffline: true,
        focusLossCount: r.focus_loss_count,
        focusLossDuration: r.focus_loss_duration,
      });
      deleteQueuedSubmission(r.attempt_id);
      await clearQuizIntent(r.achievement_id);
      results.push({ achievementId: r.achievement_id, result });
    } catch (e) {
      const msg = (e as Error)?.message ?? '';
      // SAME RULE AS THE FINAL EXAM (2026-09-17). This tested only
      // /network|fetch/, so a TIMEOUT, an ABORT or an expired JWT — none of
      // which contains either word — fell straight through to the delete and
      // permanently destroyed a graded attempt the server had never seen.
      //
      // A row is dropped ONLY on a positive, permanent rejection. Keeping an
      // unrecognised one costs a duplicate call, which the server answers
      // idempotently with the frozen result; dropping one costs the learner
      // the work.
      const transient = /network|fetch failed|failed to fetch|fetch|timeout|timed out|abort|socket|econn|offline/i.test(msg);
      const permanent = /attempt_not_found|already_finalized|invalid_attempt|not_authenticated|user_not_found/i.test(msg);
      if (transient) break; // still offline — leave this row and every row after it
      if (!permanent) {
        console.warn('[quiz] keeping queued submission after an unrecognised error:', msg);
        continue;
      }
      console.warn('[quiz] dropping permanently rejected queued submission:', msg);
      deleteQueuedSubmission(r.attempt_id);
    }
  }
  return results;
}

/**
 * ── SAY IT IN WORDS, HERE TOO ───────────────────────────────────────────────
 *
 * QuizScreen's non-network submit failure printed `(e as Error).message` — the
 * RAW POSTGRES STRING. A learner who had just finished a graded 30-question
 * quiz was shown `attempt_not_open`. The Final Exam's identical line was given
 * a vocabulary on 2026-09-18 and the quiz, which is its twin, was missed.
 *
 * ⛔ THE CODES ARE SHARED; THE WORDING IS NOT. `parseSubmitError` lives in
 * `features/finalExam/api.ts` and is reused as-is — the two servers apply the
 * same rules, so a second copy of the parser would only drift. The COPY has to
 * be its own, because the exam's wording sends people to "the Final Exam" and
 * talks about a credential. Telling someone whose topic quiz failed to "open
 * the Final Exam again" would be worse than the Postgres string.
 */
export const QUIZ_SUBMIT_ERROR_COPY: Record<string, string> = {
  // Already graded, or closed by a second device. The server answers a repeat
  // submit with the stored result, so reaching this means something else
  // closed the attempt.
  attempt_not_open:
    'This quiz attempt has already been closed. Open the quiz again from your dashboard to see your result.',
  attempt_not_found:
    'We could not find this quiz attempt. Open the quiz again from your dashboard — if it keeps happening, contact support.',
  bad_serve_set:
    'This quiz was not set up correctly and could not be marked. Nothing you did caused this, and the attempt will not be counted against you.',
  not_owner: 'This quiz belongs to a different account. Sign in as the account that started it.',
  user_not_found:
    'We could not find your account record. Sign out and back in, and contact support if it continues.',
  unknown: 'Your quiz could not be submitted. Your answers are still here — try again.',
};
