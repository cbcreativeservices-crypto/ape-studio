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
import { safeUser } from '../../lib/getSessionSafe';
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

export type ExamOutcome =
  | 'pass'
  | 'no_pass'
  | 'voided'
  | 'timed_out'
  /**
   * Graded, but NOT RELEASED (owner rule, 2026-09-18).
   *
   * A certificate requires one complete paid month. A learner who reaches the
   * capstone before that may sit it — the paper is marked at submit, while the
   * served questions and correct answers are still on the attempt — and the
   * RESULT is withheld until the month completes. Then it is released and, on a
   * pass, the credential is issued.
   *
   * It covers a fail as well as a pass. Releasing a failure early would leak the
   * result the rule says is not released, and would let somebody learn their
   * score and cancel before the month was up.
   *
   * `submit_final_exam` sends a deliberately REDACTED payload for this outcome:
   * no score, no pass mark, no wrong answers. The true values are kept
   * server-side and `release_pending_credentials` rebuilds the real payload.
   */
  | 'held'
  /**
   * The membership ended before the month completed, so the paper was discarded:
   * not graded and not applied. (There is no attempt allowance to spend —
   * `start_final_exam` never compares `attempt_number` to anything.)
   */
  | 'discarded';

/**
 * Learner-facing sentence for the graded outcomes.
 *
 * ⚠️ The offline-replay notice on the Dashboard used to print the enum itself
 * (`outcome.replace(/_/g, ' ')`), so somebody read "Score 22 — voided." on the
 * capstone. `held` and `discarded` are handled separately at that call site —
 * they carry no score and must not be announced as a result.
 */
export const EXAM_OUTCOME_COPY: Record<
  'pass' | 'no_pass' | 'voided' | 'timed_out',
  string
> = {
  pass: 'You passed. This credential has been added to your record.',
  no_pass: 'You did not reach the pass mark this time. You can sit the Final Exam again whenever you are ready.',
  voided:
    'This attempt was not counted because the app was left during the exam. The Final Exam is locked for fifteen minutes before you can try again.',
  timed_out:
    'This paper arrived after the time limit, so it could not be graded. You can sit the Final Exam again whenever you are ready.',
};

/**
 * ⚠️ THE SCORE FIELDS ARE OPTIONAL, AND THAT IS THE POINT.
 *
 * They were required until 2026-09-18. A `held` or `discarded` payload carries
 * none of them, so typing them as `number` would have let every screen read
 * `result.score` off a result that has no score and render `undefined / undefined`
 * — or worse, coerce it to 0 and show the learner a zero they did not earn, on
 * the highest-stakes screen in the product.
 *
 * Making them optional turns that into a compile error at every call site, which
 * is how it was caught in the result screen. Read them only after narrowing on
 * `outcome`.
 */
export type ExamResult = {
  attempt_id: string;
  award_type: AwardType;
  award_id: string;
  size: number;
  outcome: ExamOutcome;
  credential_awarded: boolean;
  lockout_until: string | null;
  /** Present only when the result has been released — see the note above. */
  score?: number;
  pass_mark?: number;
  passed?: boolean;
  wrong_answers?: Record<string, { correct: unknown; selected: unknown }>;
  /** True when the paper is graded and withheld pending the one-month rule. */
  held?: boolean;
};

/** Has this result actually been released to the learner? */
export function isReleased(r: ExamResult): boolean {
  return r.outcome !== 'held' && r.outcome !== 'discarded';
}

/** Every exception start_final_exam can raise (read from the live body). */
export type ExamStartError =
  | 'academy_required'
  /** A previous paper is graded and WITHHELD pending the one-month rule, so a
   *  new sitting is refused. Added with the tenure rule, 2026-09-18.
   *
   *  Without this the hold became an unlimited-retry window: a held attempt
   *  sets no lockout, so start_final_exam would happily serve another paper,
   *  and another — while the member who waited out their month gets exactly one
   *  before 'already_earned' closes it. */
  | 'result_held'
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
  // Reassurance first: nothing is wrong and nothing is required of them. The
  // old copy here said a Final Exam "opens after one complete month", which the
  // owner's 2026-09-18 ruling reversed — they may SIT it whenever they qualify;
  // it is the RESULT that waits. Saying otherwise would contradict the briefing
  // they read on the way in.
  //
  // No date is promised: the release date is the server's to compute, and a
  // client that guessed would be wrong for anyone whose membership lapsed and
  // restarted.
  result_held:
    'Your Final Exam has been marked and is being held until your first month of membership completes. There is nothing more to do — you do not need to sit it again.',
  already_earned: 'You have already earned this credential.',
  award_content_incomplete: 'This award is not open for examination yet — its topics are still being published.',
  award_incomplete: 'Complete every required topic and the Audio Fundamentals labs before taking the Final Exam.',
  award_not_found: 'That award could not be found.',
  invalid_award_type: 'That award type is not recognized.',
  pool_too_small: 'This Final Exam is not available yet — email info@proaudiotrainingacademy.com so we can look at it.',
  under_lockout: 'This Final Exam is locked out after a voided attempt. Try again when the lockout ends.',
  user_not_found: 'We could not find your account record. Sign out and back in, and email info@proaudiotrainingacademy.com if it continues.',
  offline: 'Starting the Final Exam requires a connection. Reconnect and try again.',
  unknown: 'Could not start the Final Exam. Try again.',
};

const KNOWN_ERRORS: ExamStartError[] = [
  'academy_required',
  'result_held',
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

/**
 * Every exception `submit_final_exam` can raise, read from the deployed body.
 *
 * ── WHY THIS EXISTS (2026-09-18) ─────────────────────────────────────────────
 *
 * The screen did `notify('Submit failed', (e as Error).message)` — so a learner
 * who had just finished the hardest assessment in the product was shown the raw
 * Postgres string, e.g. `attempt_not_open`. On the capstone that issues the
 * credential they are paying for.
 *
 * The start path has had a vocabulary since it was written; the submit path,
 * six lines away, never got one.
 */
export type ExamSubmitError =
  | 'attempt_not_found'
  | 'attempt_not_open'
  | 'bad_serve_set'
  | 'not_owner'
  | 'user_not_found'
  | 'unknown';

export const EXAM_SUBMIT_ERROR_COPY: Record<ExamSubmitError, string> = {
  // Already graded, or already voided/timed-out. submit_final_exam returns the
  // stored payload when one exists, so reaching this means the attempt was
  // closed by something else — a second device, or a lockout.
  attempt_not_open:
    'This attempt has already been closed. Open the Final Exam again to see your result.',
  attempt_not_found:
    'We could not find this exam attempt. Open the Final Exam again — if it keeps happening, email info@proaudiotrainingacademy.com and tell us the time you finished.',
  // The serve set is written inside start_final_exam's transaction, so an empty
  // one means the attempt never fully started. Nothing the learner did.
  bad_serve_set:
    'This exam was not set up correctly and could not be marked. Nothing you did caused this, and this attempt will not be counted — email info@proaudiotrainingacademy.com.',
  not_owner: 'This exam belongs to a different account. Sign in as the account that started it.',
  user_not_found:
    'We could not find your account record. Sign out and back in, and email info@proaudiotrainingacademy.com if it continues.',
  // ⚠️ See the twin in features/quiz/api.ts: the notify dismiss handler calls
  // navigation.goBack(), which destroys the answers this line promised were
  // still there — on a one-sitting capstone.
  unknown:
    'Your exam could not be submitted and this attempt was not recorded. Nothing has been counted against you. Open the Final Exam again to retake it, and email info@proaudiotrainingacademy.com if it happens twice.',
};

/** Map a thrown Postgres message onto the vocabulary above. */
export function parseSubmitError(message: string): ExamSubmitError {
  const codes: ExamSubmitError[] = [
    'attempt_not_found',
    'attempt_not_open',
    'bad_serve_set',
    'not_owner',
    'user_not_found',
  ];
  // Longest-first, so 'attempt_not_found' cannot be shadowed by a shorter code
  // that happens to be a substring of the same message.
  return [...codes].sort((a, b) => b.length - a.length).find((c) => message.includes(c)) ?? 'unknown';
}

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
  // `passed` is undefined on a held or discarded result, and this pipeline
  // takes enum-shaped props only — sending undefined would land as a hole in
  // the funnel rather than as the distinct state it is (2026-09-18).
  trackEvent('exam_finish', {
    passed: result.passed === true,
    outcome: result.outcome,
    offline: args.submittedOffline,
  });
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
 *  submission being queued, so an unknown owner is recorded as null.
 *
 *  ⛔ AND NEVER HANGS. `getUser()` is a NETWORK round trip, and this is awaited
 *  INSIDE `enqueueExamSubmission` — i.e. in front of the disk write, on the
 *  branch entered *because* the network just failed. A stall there meant the
 *  graded exam never reached the queue at all while the screen sat on
 *  "Submitting…" with no controls. The `try/catch` covers a reject; it cannot
 *  cover a promise that never settles. Bounded, and a stall records the same
 *  null this function already documents as its unknown-owner answer. */
async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await safeUser(supabase.auth.getUser(), 'finalExam/queue');
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

/**
 * Every read-modify-write of the queue runs strictly after the last one.
 *
 * ── ENQUEUEING DURING A REPLAY DELETED THE NEW EXAM (2026-09-17, pass 4) ──
 *
 * `replayExamSubmissions` reads the queue, spends time on the network, then
 * writes back the survivors. `enqueueExamSubmission` reads, appends and writes.
 * A submission queued while a replay was in flight was appended to the OLD
 * snapshot's successor and then overwritten by the replay's write — gone,
 * moments after the screen said "your exam is saved and will be submitted
 * automatically".
 *
 * The queue is the last copy of a graded capstone, so this is the one collection
 * in the app where a lost update is unrecoverable.
 */
let queueChain: Promise<unknown> = Promise.resolve();
function withQueueLock<T>(job: () => Promise<T>): Promise<T> {
  const run = queueChain.then(job, job); // a failure must not poison the chain
  queueChain = run.catch(() => undefined);
  return run;
}

/** Queue a submission that failed for network reasons. Keyed by attempt_id. */
export function enqueueExamSubmission(row: QueuedExam): Promise<boolean> {
  return withQueueLock(async () => {
    const rows = await readQueue();
    const next = rows.filter((r) => r.attemptId !== row.attemptId);
    next.push({ ...row, userId: row.userId ?? (await currentUserId()) });
    // The boolean is the point: the caller must not tell the learner their exam
    // is safely queued when it is not.
    return writeQueue(next);
  });
}

/**
 * Replay queued offline submissions with the true submitted_at. Stops quietly
 * while still offline; drops rows the server hard-rejects (a finalized attempt
 * returns its frozen result_payload rather than erroring, so a reject here
 * means the row can never succeed).
 */
let replayInFlight = false;

export function replayExamSubmissions(): Promise<{ awardId: string; result: ExamResult }[]> {
  // THE REPLAY MUST NOT BLOCK A NEW SUBMISSION (2026-09-17, pass 5).
  //
  // Holding the queue lock across the replay's network loop was the obvious
  // reading of "one queue operation at a time", and it was wrong in the one way
  // that matters: there is no request timeout anywhere in this app, so a hung
  // replay would block `enqueueExamSubmission` — which `FinalExamScreen` awaits
  // before it tells the learner anything. A graded capstone would never be
  // queued and the screen would sit on a spinner.
  //
  // So the replay is guarded by its own re-entrancy flag rather than the lock,
  // and takes the lock only for the WRITE at the end, which is the part that
  // actually races. A row queued mid-replay is then read by that final write
  // rather than overwritten by it.
  if (replayInFlight) return Promise.resolve([]);
  replayInFlight = true;
  return replayExamSubmissionsLocked().finally(() => {
    replayInFlight = false;
  });
}

async function replayExamSubmissionsLocked(): Promise<{ awardId: string; result: ExamResult }[]> {
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
  // Re-read under the lock and keep anything queued WHILE we were replaying:
  // those rows are not in `rows` and must not be lost to this write.
  await withQueueLock(async () => {
    const latest = await readQueue();
    const attempted = new Set(rows.map((r) => r.attemptId));
    const arrivedMeanwhile = latest.filter((r) => !attempted.has(r.attemptId));
    return writeQueue([...remaining, ...arrivedMeanwhile]);
  });
  return done;
}

/** Drop the queue on account switch so one user's exam never replays as another's. */
export async function clearExamQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
