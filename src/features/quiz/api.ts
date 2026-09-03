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
  badge_earned: boolean;
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
  pool_too_small: 'Quiz unavailable for this topic — report this to your professor.',
  user_not_found: 'Account not linked to a student record — report this to your professor.',
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
  let intentId = await AsyncStorage.getItem(intentKey(achievementId));
  if (!intentId) {
    intentId = Crypto.randomUUID();
    await AsyncStorage.setItem(intentKey(achievementId), intentId);
  }
  const { data, error } = await supabase.rpc('start_quiz_attempt', {
    p_achievement_id: achievementId,
    p_client_attempt_id: intentId,
  });
  if (error) throw new QuizStartFailure(parseStartError(error.message));
  return data as AttemptPayload;
}

export async function clearQuizIntent(achievementId: string): Promise<void> {
  await AsyncStorage.removeItem(intentKey(achievementId));
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
  return data as SubmitResult;
}

/* ---------------- offline submit queue (Code brief §6) ---------------- */

export function enqueueSubmission(args: {
  attemptId: string;
  achievementId: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
  focusLossCount: number;
  focusLossDuration: number;
}): void {
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
      if (/network|fetch/i.test((e as Error).message)) break; // still offline
      // Finalized/errored attempt: idempotent replay already handled by the
      // server; a hard reject means the row can't ever succeed — drop it.
      console.warn('[quiz] dropping rejected queued submission:', (e as Error).message);
      deleteQueuedSubmission(r.attempt_id);
    }
  }
  return results;
}
