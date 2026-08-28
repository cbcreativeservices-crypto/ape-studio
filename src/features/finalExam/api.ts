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
  already_earned: 'You have already earned this credential.',
  award_content_incomplete: 'This award is not open for examination yet — its topics are still being published.',
  award_incomplete: 'Complete every required topic and the Audio Fundamentals labs before taking the Final Exam.',
  award_not_found: 'That award could not be found.',
  invalid_award_type: 'That award type is not recognized.',
  pool_too_small: 'Final Exam unavailable for this award — report this to your professor.',
  under_lockout: 'This Final Exam is locked out after a voided attempt. Try again when the lockout ends.',
  user_not_found: 'Account not linked to a student record — report this to your professor.',
  offline: 'Starting the Final Exam requires a connection. Reconnect and try again.',
  unknown: 'Could not start the Final Exam. Try again.',
};

const KNOWN_ERRORS: ExamStartError[] = [
  'academy_required',
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
  let intentId = await AsyncStorage.getItem(key);
  if (!intentId) {
    intentId = Crypto.randomUUID();
    await AsyncStorage.setItem(key, intentId);
  }
  const { data, error } = await supabase.rpc('start_final_exam', {
    p_award_type: awardType,
    p_award_id: awardId,
    p_client_attempt_id: intentId,
  });
  if (error) throw new ExamStartFailure(parseStartError(error.message));
  return data as ExamPayload;
}

export async function clearExamIntent(awardType: AwardType, awardId: string): Promise<void> {
  await AsyncStorage.removeItem(intentKey(awardType, awardId));
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
  return data as ExamResult;
}

/* ---------------- offline submit queue (AsyncStorage) ---------------- */

const QUEUE_KEY = 'ape:finalExamQueue';

type QueuedExam = SubmitArgs & { awardType: AwardType; awardId: string };

async function readQueue(): Promise<QueuedExam[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedExam[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(rows: QueuedExam[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(rows));
  } catch {
    // storage full / unavailable — nothing further we can do here.
  }
}

/** Queue a submission that failed for network reasons. Keyed by attempt_id. */
export async function enqueueExamSubmission(row: QueuedExam): Promise<void> {
  const rows = await readQueue();
  const next = rows.filter((r) => r.attemptId !== row.attemptId);
  next.push(row);
  await writeQueue(next);
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

  for (const r of rows) {
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
      if (/network|fetch/i.test((e as Error).message)) {
        offline = true;
        remaining.push(r);
      } else {
        console.warn('[final-exam] dropping rejected queued submission:', (e as Error).message);
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
