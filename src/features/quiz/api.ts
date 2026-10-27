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
 *
 * MY CUSTOM LIST (D12, server live 2026-10-27): its practice quiz has its OWN
 * RPCs — `start_custom_list_quiz(p_glossary_ids uuid[], p_count int,
 * p_client_attempt_id uuid)` and `submit_custom_list_quiz(…)`, the same answer
 * shape and the same void / lockout / time rules, practice only (the server
 * writes nothing but its own custom_list_quiz_* rows). The list's pseudo-id
 * 'flagged' is not a uuid and must never reach `start_quiz_attempt` /
 * `submit_quiz`: `startQuizAttempt` refuses it, and the replay sends a queued
 * list attempt to the list's own submit.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';
import * as Crypto from 'expo-crypto';
import { supabase } from '../../lib/supabase';
import { withDeadline } from '../../lib/boundedCall';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { trackEvent } from '../telemetry/telemetry';
import { clearAttemptDraft } from '../assess/attemptDraft';
import { CUSTOM_LIST_ID, isCustomListId } from '../commercial/studyGate';
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
  /** My Custom List only: 'custom_list', the length chosen (30 … the list)
   *  and how many were served — fewer only when the list runs out of terms
   *  that have a quiz question (the server substitutes before it shortens). */
  kind?: 'custom_list';
  requested_count?: number;
  served_count?: number;
};

/** F4-safe answer shapes (see header). */
export type AnswerValue = string | string[] | [string, string][];

export type QuizOutcome = 'full_pass' | 'partial_pass' | 'no_pass' | 'voided' | 'timed_out';

/**
 * Learner-facing sentence for each outcome.
 *
 * ⚠️ The offline-replay notices used to print the enum itself
 * (`outcome.replace(/_/g, ' ')`), so a learner read "Score 22 — voided." —
 * database vocabulary as a toast, and a serious accusation delivered in one
 * word with no explanation and no next step.
 */
export const QUIZ_OUTCOME_COPY: Record<QuizOutcome, string> = {
  full_pass: 'You passed. This topic is complete.',
  partial_pass: 'You passed the required sections. Some sections still need work.',
  no_pass: 'You did not pass this time. You can retake the quiz from your dashboard.',
  voided:
    'This attempt was not counted because the app was left during the quiz. The quiz locks for 15 minutes after that; then you can start a new attempt from your dashboard.',
  timed_out:
    'Time ran out before this attempt was finished. You can start a new attempt from your dashboard.',
};

export type SubmitResult = {
  attempt_id: string;
  score: number;
  outcome: QuizOutcome;
  new_status: string;
  best_genuine_score: number;
  next_topic: { unlocked: boolean; clamped?: boolean } | null;
  wrong_answers: Record<string, { correct: unknown; selected: unknown }>;
  lockout_until?: string;
  /** My Custom List only (submit_custom_list_quiz): always practice. */
  kind?: 'custom_list';
  is_practice?: boolean;
  served_count?: number;
  pass_mark?: number;
};

/**
 * The same sentences for a My Custom List quiz. It is practice only — it banks
 * no topic and counts toward nothing — so "This topic is complete" would be
 * false (owner 2026-10-19: "practice only does not count towards any other").
 */
export const CUSTOM_LIST_QUIZ_OUTCOME_COPY: Record<QuizOutcome, string> = {
  full_pass: 'Practice on My Custom List: not counted toward anything.',
  partial_pass: 'Practice on My Custom List: not counted toward anything.',
  no_pass: 'Practice on My Custom List: not counted toward anything. You can quiz your list again from your dashboard.',
  voided:
    'This attempt was not counted because the app was left during the quiz. The list quiz locks for 15 minutes after that.',
  timed_out: 'Time ran out before this attempt was finished. You can quiz your list again from your dashboard.',
};

/** The outcome sentence for a quiz, by what was quizzed (topic or My Custom List). */
export function quizOutcomeCopy(achievementId: string, outcome: QuizOutcome): string {
  return (isCustomListId(achievementId) ? CUSTOM_LIST_QUIZ_OUTCOME_COPY : QUIZ_OUTCOME_COPY)[outcome];
}

export type QuizStartError =
  | 'safety_prerequisite_incomplete'
  | 'study_gate_unmet'
  // The server raises this for a v3 topic when the caller has no academy
  // access. The Final Exam twin has had copy for it since it was written; the
  // quiz never did, so it fell through to `unknown` — "something went wrong"
  // for a person whose membership has simply lapsed, with nothing pointing at
  // the paywall.
  | 'academy_required'
  | 'under_lockout'
  | 'topic_locked'
  | 'not_enrolled'
  | 'version_mismatch'
  | 'pool_too_small'
  | 'user_not_found'
  // Retired content (server, 2026-10-05) — see RETIRED_CONTENT_COPY.
  | 'retired_content'
  | 'archived_quiz_retired'
  // My Custom List (start_custom_list_quiz). The app checks the 30-term
  // minimum before BEGIN; these are the server's backstop, plus a list the
  // phone could not read.
  | 'custom_list_too_small'
  | 'custom_list_no_questions'
  | 'custom_list_unreadable'
  | 'offline'
  | 'unknown';

/**
 * ── RETIRED CONTENT (server, 2026-10-05) ────────────────────────────────────
 * `start_quiz_attempt`, `submit_quiz`, `record_study_progress` and
 * `credit_time_trial` raise `retired_content` for a topic that has been
 * retired; `archived_quiz_retired` is the same answer for an archived quiz.
 * Both read as one plain sentence wherever an error has copy.
 */
export const RETIRED_CONTENT_COPY = 'This topic has been retired.';
const RETIRED_CONTENT_CODES = ['archived_quiz_retired', 'retired_content'] as const;
export type RetiredContentCode = (typeof RETIRED_CONTENT_CODES)[number];
/** The retired-content code a server message carries, or null. */
export function retiredContentCode(message: string): RetiredContentCode | null {
  return RETIRED_CONTENT_CODES.find((c) => message.includes(c)) ?? null;
}

/** RAISEd-error → user copy (routing table, Code brief §2.1). */
/** Ratified quiz shape (Booth 2026-09-03): 30 questions, pass at 28. The
 *  25-question quiz was retired ~a month earlier; do not reintroduce 25/24. */
export const QUIZ_SIZE = 30;
export const QUIZ_PASS = 28;

export const QUIZ_START_ERROR_COPY: Record<QuizStartError, string> = {
  // ⚠️ The start-error screen renders only `Back` (plus `Try again` for
  // offline/unknown), so every one of these must name a control the learner
  // can actually see from there. "Membership", "the quiz block" and "the
  // Dashboard" named none. The course model is also retired — the word
  // "course" does not appear in the product any more.
  safety_prerequisite_incomplete:
    'Pass the Pro Audio Safety topic quiz before taking quizzes in other topics.',
  study_gate_unmet:
    'Study requirements are not yet met for this topic. Tap Back and check the TOPIC QUIZ panel for what remains.',
  academy_required:
    'Academy membership is required for this topic’s quiz. Your progress is saved — tap Back, then Membership on the Academy screen.',
  under_lockout: 'This quiz is locked for a short while because the last attempt wasn’t counted. Try again when the wait ends.',
  topic_locked: 'This topic is locked.',
  not_enrolled: 'You are not enrolled in this topic.',
  version_mismatch: 'Content was updated — tap Back and reopen the quiz.',
  pool_too_small: 'This quiz is not available yet — email info@proaudiotrainingacademy.com so we can look at it.',
  user_not_found: 'We could not find your account record. Sign out and back in, and email info@proaudiotrainingacademy.com if it continues.',
  retired_content: RETIRED_CONTENT_COPY,
  archived_quiz_retired: RETIRED_CONTENT_COPY,
  custom_list_too_small:
    'The quiz needs at least 30 terms in your list. Tap Back, add more terms from the Glossary, then try again.',
  custom_list_no_questions:
    'None of the terms in your list have quiz questions yet. Tap Back and add other terms from the Glossary.',
  custom_list_unreadable:
    'My Custom List couldn’t be read on this phone just now. Nothing has been removed — try again in a moment.',
  offline: 'Quiz start requires a connection. Reconnect and try again.',
  unknown: 'Could not start the quiz. Try again.',
};

/** Where the My Custom List quiz needs its own words (it is not a topic). */
const CUSTOM_LIST_START_COPY: Partial<Record<QuizStartError, string>> = {
  academy_required:
    'Academy membership is required for the My Custom List quiz. Tap Back, then Membership on the Academy screen.',
  under_lockout:
    'Your list quiz is locked for a short while because the last attempt wasn’t counted. Try again when the wait ends.',
};

/** The start-failure sentence — in the list's own words for My Custom List. */
export function quizStartErrorCopy(code: QuizStartError, customList: boolean): string {
  return (customList ? CUSTOM_LIST_START_COPY[code] : undefined) ?? QUIZ_START_ERROR_COPY[code];
}

const KNOWN_ERRORS: QuizStartError[] = [
  'safety_prerequisite_incomplete',
  'study_gate_unmet',
  'academy_required',
  'under_lockout',
  'topic_locked',
  'not_enrolled',
  'version_mismatch',
  'pool_too_small',
  'user_not_found',
  'archived_quiz_retired',
  'retired_content',
  'custom_list_too_small',
  'custom_list_no_questions',
];

function parseStartError(message: string): QuizStartError {
  const found = KNOWN_ERRORS.find((c) => message.includes(c));
  if (found) return found;
  if (/network|fetch/i.test(message)) return 'offline';
  return 'unknown';
}

const intentKey = (achievementId: string) => `ape:quizIntent:${achievementId}`;
/** Bumped by the account wipe (self-registered below): an intent write that
 *  started under the departing identity lands nowhere. */
let intentGeneration = 0;
registerLocalStoreReset(() => {
  intentGeneration++;
});

export class QuizStartFailure extends Error {
  // A plain field, not a parameter property: node --test loads this module
  // (test/localStoreWave2Study_20261002) and strip-only TypeScript has none.
  code: QuizStartError;
  constructor(code: QuizStartError) {
    super(code);
    this.code = code;
  }
}

/**
 * The client attempt id for a quiz intent: the stored one, or a fresh one
 * stored for the next launch to rejoin.
 *
 * `tag` (My Custom List only) is the length chosen: a stored intent rejoins
 * only a sitting of the SAME length, so choosing another length starts a new
 * draw (the server closes the old sitting) instead of resuming a quiz of a
 * different size. Stored as `<id>#<tag>`; a topic intent is the bare id.
 */
async function resolveIntentId(achievementId: string, tag?: string): Promise<string> {
  // The intent id is a RESUME CONVENIENCE, not a correctness requirement: it
  // lets a crash/relaunch rejoin the same attempt. Unguarded, a local storage
  // hiccup threw before the RPC was ever called, and the caller's broad catch
  // turned that into "the exam could not be started" — a paid capstone refused
  // over a write that only affects resuming. Storage failure on this app is
  // proven, not hypothetical (the SQLITE_FULL incident, 2026-09-11). Losing the
  // id costs resume; refusing to start costs the exam.
  //
  // ⛔ A READ THAT FAILED IS NOT "NO INTENT" (wave 2, 2026-10-02). It minted a
  // fresh id and setItem'd it OVER the stored one, so the attempt in progress
  // (and its answer draft) could never be rejoined again, on any later launch.
  // The read is tried twice; if it still fails this start uses a fresh id for
  // this run only and the stored one is left for the next launch to resume.
  // Fenced by the account wipe: a start in flight across a sign-out must not
  // write the departing user's intent into the next user's storage.
  const gen = intentGeneration;
  let intentId: string | null = null;
  let readFailed = true;
  for (let i = 0; i < 2 && readFailed; i++) {
    try {
      intentId = await AsyncStorage.getItem(intentKey(achievementId));
      readFailed = false;
    } catch {
      intentId = null;
    }
  }
  if (intentId && tag != null) {
    const at = intentId.lastIndexOf('#');
    intentId = at > 0 && intentId.slice(at + 1) === tag ? intentId.slice(0, at) : null;
  }
  if (!intentId) {
    intentId = Crypto.randomUUID();
    if (!readFailed && gen === intentGeneration) {
      try {
        await AsyncStorage.setItem(intentKey(achievementId), tag != null ? `${intentId}#${tag}` : intentId);
      } catch {
        /* resume convenience only — the attempt still starts */
      }
    }
  }
  return intentId;
}

/**
 * ⛔ ONE RETRY FOR THE COLD-START AUTH RACE (owner 2026-09-20 bug pass).
 *
 * The session is read from the keychain ASYNCHRONOUSLY, so a tap that gets
 * to a quiz before the stored login lands goes out as `anon` — and
 * `start_quiz_attempt` answers `user_not_found`, which this very file
 * documents as exactly that. But `user_not_found` is a KNOWN error, so the
 * member was shown "We could not find your account record. Sign out and
 * back in…" — advice that is both alarming and wrong, for an account that
 * is fine and will work a second later.
 *
 * The study reads already close this window (features/study/sessionRetry).
 * Quiz start never did, and it is the one place the wrong message costs the
 * most: the learner is about to sit a graded paper.
 *
 * Retry ONCE and only with a real session: getSession() settles after the
 * client has finished reading storage, so the second call is certain to
 * carry the token. A genuine missing account still fails, immediately.
 * (`start_custom_list_quiz` opens with the same `user_not_found` check.)
 */
async function startWithAuthRetry(
  call: () => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<AttemptPayload> {
  let { data, error } = await call();
  if (error && error.message.includes('user_not_found')) {
    // An UNKNOWN read (stall / rejection / offline refresh — the session is
    // still stored) still earns the one retry (safe-session sweep,
    // 2026-10-03): skipping it showed a signed-in member "Sign out and back in".
    const { result: got, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'quiz/start');
    if (timedOut || got.data.session) {
      console.warn('[quiz] start denied before the session loaded; retrying once');
      ({ data, error } = await call());
    }
    // ⛔ STILL REFUSED WHILE THE SESSION IS UNKNOWN (hunt 12, 2026-10-04): the
    // token refresh did not reach the auth server, so the call went out as
    // `anon` and the server could not see who this is. "We could not find your
    // account record. Sign out and back in" is false advice for a member whose
    // session is still stored — and signing out is the one thing that would
    // lose it. Say the honest thing: it could not start; try again.
    if (timedOut && error && error.message.includes('user_not_found')) throw new QuizStartFailure('unknown');
  }
  if (error) throw new QuizStartFailure(parseStartError(error.message));
  return data as AttemptPayload;
}

/**
 * Start (or resume) an attempt. The client attempt id persists until a
 * finalized submit, so a crash/relaunch resumes the SAME attempt + payload.
 */
export async function startQuizAttempt(achievementId: string): Promise<AttemptPayload> {
  // ⛔ NEVER THE CUSTOM LIST (D12): 'flagged' is not a topic uuid. Its quiz is
  // startCustomListQuiz; arriving here with it is a routing bug, refused
  // before any call leaves the phone.
  if (isCustomListId(achievementId)) throw new QuizStartFailure('unknown');
  const intentId = await resolveIntentId(achievementId);
  const call = () =>
    supabase.rpc('start_quiz_attempt', {
      p_achievement_id: achievementId,
      p_client_attempt_id: intentId,
    });
  const payload = await startWithAuthRetry(call);
  // Anonymous count only — no topic/attempt ids leave the app.
  trackEvent('quiz_start', { practice: payload.is_practice });
  return payload;
}

/** A glossary row id (the list stores them; the custom-list RPCs take uuid[]). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * MY CUSTOM LIST quiz (owner 2026-10-19; server live, D12 2026-10-27).
 *
 * `glossaryIds` is the WHOLE list, never a client-side draw: the server picks
 * `count` terms at random among the list's terms that have a quiz question, so
 * a term without one is replaced by another term from the same list (owner:
 * "substitute"). It refuses a list under 30 (`custom_list_too_small`) and
 * clamps `count` into 30 … the list size. Time = the topic quiz's 20 s per
 * question. Practice only: nothing is credited and no progress is stored.
 *
 * Resume: the intent is keyed to the list and tagged with the length, so a
 * relaunch at the same length rejoins the same sitting and questions.
 */
export async function startCustomListQuiz(glossaryIds: Iterable<string>, count: number): Promise<AttemptPayload> {
  // uuid[] on the server: one malformed stored id must not fail the whole call.
  const ids = [...new Set(glossaryIds)].filter((x) => UUID_RE.test(x));
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const intentId = await resolveIntentId(CUSTOM_LIST_ID, String(n));
  const call = () =>
    supabase.rpc('start_custom_list_quiz', {
      p_glossary_ids: ids,
      p_count: n,
      p_client_attempt_id: intentId,
    });
  const payload = await startWithAuthRetry(call);
  trackEvent('quiz_start', { practice: true });
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
  /**
   * ⛔ BOUNDED, OR A COMPLETED QUIZ IS DESTROYED (2026-09-23 overnight hunt).
   *
   * QuizScreen's offline rescue lives in its CATCH and tests the error message
   * for a transient pattern. A stall throws nothing, so the catch never ran:
   * the screen sat on "Submitting…" forever AND the graded attempt was never
   * queued. Not a slow submit — a lost one.
   *
   * `submitFinalExam` was bounded a day earlier for the identical shape, two
   * directories away. This is its twin.
   *
   * Safe because the server is idempotent: submit_quiz does
   * `if v_att.result_payload is not null then return v_att.result_payload`, so
   * the queued replay returns the same frozen grade rather than re-grading.
   * Read from the live function definition.
   *
   * ⚠️ The server's own `statement_timeout = 30s` does NOT cover this. It
   * aborts the QUERY; a socket that has stopped answering never delivers that
   * abort to the client either.
   */
  // `async () =>` rather than a bare arrow: the Supabase builder is a THENABLE,
  // not a Promise, so it has no .catch/.finally and infers as unknown. Awaiting
  // it inside an async factory hands the helper a real, typed Promise.
  const { data, error } = await withDeadline(
    async () =>
      await supabase.rpc('submit_quiz', {
        p_attempt_id: args.attemptId,
        p_answers: args.answers,
        p_submitted_at: args.submittedAt,
        p_submitted_offline: args.submittedOffline,
        p_focus_loss_count: args.focusLossCount,
        p_focus_loss_duration: args.focusLossDuration,
      }),
    'submit_quiz',
  );
  if (error) throw new Error(error.message);
  const result = data as SubmitResult;
  trackEvent('quiz_finish', { outcome: result.outcome, offline: args.submittedOffline });
  return result;
}

/**
 * Submit a My Custom List attempt: `submit_custom_list_quiz`, the twin of
 * `submit_quiz` (same arguments, same idempotent frozen result, same void and
 * time rules) that writes nothing outside its own practice rows. Bounded for
 * the same reason as submitQuiz.
 */
export async function submitCustomListQuiz(args: {
  attemptId: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
  submittedOffline: boolean;
  focusLossCount: number;
  focusLossDuration: number;
}): Promise<SubmitResult> {
  const { data, error } = await withDeadline(
    async () =>
      await supabase.rpc('submit_custom_list_quiz', {
        p_attempt_id: args.attemptId,
        p_answers: args.answers,
        p_submitted_at: args.submittedAt,
        p_submitted_offline: args.submittedOffline,
        p_focus_loss_count: args.focusLossCount,
        p_focus_loss_duration: args.focusLossDuration,
      }),
    'submit_custom_list_quiz',
  );
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
 *
 * ⛔ ONE REPLAY AT A TIME (audit 2026-09-27) — the same guard as the study
 * queue's `replayQueue`. Dashboard load() runs this first thing, and two loads
 * can overlap (focus + a progress emit); both passes read the same queued rows,
 * so the same attempt was submitted twice and the learner saw "Offline quiz
 * submitted" twice. A second caller now JOINS the pass in flight — it waits for
 * it, so the progress it fetches next reflects the finalized attempt — but gets
 * an EMPTY list back: the results belong to the caller that started the pass,
 * and handing them to both would just print the duplicate notice another way.
 */
let quizReplayInFlight: Promise<{ achievementId: string; result: SubmitResult }[]> | null = null;

export function replayQuizSubmissions(): Promise<{ achievementId: string; result: SubmitResult }[]> {
  if (quizReplayInFlight) return quizReplayInFlight.then(() => [], () => []);
  const run = replayQuizSubmissionsOnce().finally(() => {
    quizReplayInFlight = null;
  });
  quizReplayInFlight = run;
  return run;
}

async function replayQuizSubmissionsOnce(): Promise<
  { achievementId: string; result: SubmitResult }[]
> {
  const rows = getQueuedSubmissions();
  const results: { achievementId: string; result: SubmitResult }[] = [];
  for (const r of rows) {
    try {
      // A queued My Custom List attempt (its row carries the 'flagged' id)
      // goes back to the list's own submit, never to submit_quiz.
      const submit = isCustomListId(r.achievement_id) ? submitCustomListQuiz : submitQuiz;
      const result = await submit({
        attemptId: r.attempt_id,
        answers: JSON.parse(r.answers_json),
        submittedAt: r.submitted_at,
        submittedOffline: true,
        focusLossCount: r.focus_loss_count,
        focusLossDuration: r.focus_loss_duration,
      });
      deleteQueuedSubmission(r.attempt_id);
      await clearQuizIntent(r.achievement_id);
      // The answer draft goes with it, exactly as on the online submit
      // (full-app run 2, 2026-10-01) — see finalExam/api's replay.
      await clearAttemptDraft(r.attempt_id);
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
      /**
       * ⛔ `user_not_found` IS NOT PERMANENT — IT IS THE COLD-START RACE.
       *
       * Both `submit_quiz` and `submit_final_exam` open with
       * `select id into v_user from users where auth_id = auth.uid();
       *  if v_user is null then raise exception 'user_not_found'`.
       * So that is exactly what the server says when a request arrives with no
       * JWT — and the session is read from the keychain ASYNCHRONOUSLY, so the
       * first calls after a relaunch go out as `anon`. DashboardScreen.load()
       * fires this replay as one of its first acts on relaunch, which is
       * precisely the window.
       *
       * Classified as permanent, it DELETED a graded attempt the server had
       * never seen — the exact loss this whole "drop only on a positive
       * rejection" rule was written to prevent, reintroduced through the list
       * itself. The study queue's equivalent never listed it, which is what
       * made these two the outliers.
       *
       * `not_authenticated` goes with it: no migration raises it, and if one
       * ever did it would mean the same thing.
       *
       * Cost of keeping a row that really is doomed: one retried call per
       * drain, answered idempotently. Cost of dropping a good one: the
       * learner's graded paper.
       */
      const permanent = /attempt_not_found|already_finalized|invalid_attempt/i.test(msg);
      if (transient) break; // still offline — leave this row and every row after it
      if (!permanent) {
        console.warn('[quiz] keeping queued submission after an unrecognised error:', msg);
        continue;
      }
      console.warn('[quiz] dropping permanently rejected queued submission:', msg);
      deleteQueuedSubmission(r.attempt_id);
      await clearAttemptDraft(r.attempt_id);
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
    'We could not find this quiz attempt. Open the quiz again from your dashboard — if it keeps happening, email info@proaudiotrainingacademy.com.',
  bad_serve_set:
    'This quiz was not set up correctly and could not be graded. Nothing you did caused this, and the attempt will not be counted against you.',
  not_owner: 'This quiz belongs to a different account. Sign in as the account that started it.',
  user_not_found:
    'We could not find your account record. Sign out and back in, and email info@proaudiotrainingacademy.com if it continues.',
  // Quiz-only codes, matched by retiredContentCode() before parseSubmitError.
  retired_content: RETIRED_CONTENT_COPY,
  archived_quiz_retired: RETIRED_CONTENT_COPY,
  // ⚠️ This used to say "Your answers are still here — try again". Both call
  // sites pass `() => navigation.goBack()` as the notify dismiss handler, so
  // tapping OK unmounts the screen and destroys `answers`. Until the callback
  // is dropped the wording must not promise survival.
  unknown:
    'Your quiz could not be submitted and this attempt was not recorded. Nothing has been counted against you. Open the quiz again from your dashboard to retake it.',
};
