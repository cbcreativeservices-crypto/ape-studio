/**
 * Audio Career Finder — device-local state (owner brief 2026-09-03).
 *
 * One AsyncStorage record, `ape:careerfinder:v1`, holding what the brief
 * asks to persist: assessment version, every answer (saved on tap), the
 * current question, completion, the computed dimension scores + ranking at
 * completion, the completion date — plus the user’s saved families and their
 * Beta feedback. No account required: the record is per device.
 *
 * House pattern (lastStudyLocation / enrollmentStore): module cache + listener
 * set + lazy hydrate + useSyncExternalStore hook, with `resetLocal()`
 * registered in clearLocalAccountData so an account switch wipes it.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';
import type { QuestionId, Response } from './questions';
import { QUESTIONS, QUESTION_COUNT } from './questions';
import { computeResult, type Responses } from './scoring';
import { familyFieldOf } from './careerIndex';
import type { DimensionCode } from './dimensions';

export const ASSESSMENT_VERSION = 'career-finder-v1';
const KEY = 'ape:careerfinder:v1';

export type FeedbackAnswer = 'yes' | 'somewhat' | 'no';

export type FinderRecord = {
  version: typeof ASSESSMENT_VERSION;
  responses: Responses;
  /** Index of the question the user is on (0-based). */
  index: number;
  completed: boolean;
  completedAt: string | null;
  /** Snapshot at completion — reproducible even if scoring changes later. */
  dimensionScores: Partial<Record<DimensionCode, number>> | null;
  rankedFamilyIds: string[] | null;
  /** Family ids the user chose to keep. */
  saved: string[];
  feedback: { answer: FeedbackAnswer; note: string; at: string } | null;
};

const EMPTY = (): FinderRecord => ({
  version: ASSESSMENT_VERSION,
  responses: {},
  index: 0,
  completed: false,
  completedAt: null,
  dimensionScores: null,
  rankedFamilyIds: null,
  saved: [],
  feedback: null,
});

let state: FinderRecord = EMPTY();
let hydrated = false;
let hydrating: Promise<void> | null = null;
let wrote = false;
/** Bumped by resetLocal — see the fence in hydrateCareerFinder. */
let generation = 0;
const listeners = new Set<() => void>();

const VALID_IDS = new Set<string>(QUESTIONS.map((q) => q.id));

/** Only real question ids with legal values survive a damaged record. */
function cleanResponses(raw: unknown): Responses {
  const out: Responses = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!VALID_IDS.has(k)) continue;
    if (v === null || v === 0 || v === 1 || v === 2 || v === 3 || v === 4) out[k as QuestionId] = v as Response;
  }
  return out;
}

function clean(raw: unknown): FinderRecord {
  const base = EMPTY();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<FinderRecord>;
  if (r.version !== ASSESSMENT_VERSION) return base; // a future version migrates explicitly; never guess
  const responses = cleanResponses(r.responses);
  const index = typeof r.index === 'number' && Number.isInteger(r.index) ? Math.max(0, Math.min(QUESTION_COUNT - 1, r.index)) : 0;
  const fb = r.feedback && typeof r.feedback === 'object' && (r.feedback.answer === 'yes' || r.feedback.answer === 'somewhat' || r.feedback.answer === 'no')
    ? { answer: r.feedback.answer, note: typeof r.feedback.note === 'string' ? r.feedback.note : '', at: typeof r.feedback.at === 'string' ? r.feedback.at : '' }
    : null;
  return {
    ...base,
    responses,
    index,
    completed: !!r.completed,
    completedAt: typeof r.completedAt === 'string' ? r.completedAt : null,
    dimensionScores: r.dimensionScores && typeof r.dimensionScores === 'object' ? r.dimensionScores : null,
    rankedFamilyIds: Array.isArray(r.rankedFamilyIds) ? r.rankedFamilyIds.filter((x): x is string => typeof x === 'string') : null,
    saved: Array.isArray(r.saved) ? [...new Set(r.saved.filter((x): x is string => typeof x === 'string'))] : [],
    feedback: fb,
  };
}

function emit() { for (const l of listeners) l(); }

/** The last read of storage itself THREW (full-app run 2, 2026-10-01). The
 *  empty record shown then must never be written over the one on disk —
 *  one tap (an answer, a ★) used to replace every saved answer, result and
 *  saved family. This session's changes stay in memory; a reset retries. */
let readFailed = false;

/** Resolves true only when the device accepted the write (pattern hunt wave
 *  3, 2026-10-02, class P6): the results screen said "Saved on this device"
 *  under the beta feedback whatever happened to the write. A record read
 *  while storage FAILED is never written over (see `readFailed`) — false. */
function persist(next: FinderRecord, report = true): Promise<boolean> {
  state = next;
  wrote = true;
  emit();
  const g = generation;
  if (readFailed) return Promise.resolve(false);
  return AsyncStorage.setItem(KEY, JSON.stringify(next)).then(
    () => true,
    () => {
      // An answer, a ★, a reset the device refused: the learner is told
      // (owner 2026-10-03), unless the caller says so itself (`report` false)
      // or the account wipe ran meanwhile.
      if (report && g === generation) reportUnhandledSaveFailure();
      return false;
    },
  );
}

/**
 * Run an action on the HYDRATED record (full-app run 2, 2026-10-01).
 *
 * Every action spreads `state` into the record it writes. Before the read
 * lands `state` is EMPTY, so a ★ on a family page, a feedback blur or a
 * results tap made in that window wrote a near-empty record over the stored
 * one — and the hydrate then saw `wrote` and kept the near-empty copy, so the
 * answers, results and saved families were gone for good. Now the action
 * waits for the read and applies on top of it (enrollmentStore's pattern);
 * an account switch meanwhile drops it.
 */
function act(fn: () => Promise<boolean> | void): Promise<boolean> {
  // The write result (wave 3, 2026-10-02): the action's own persist() answer;
  // true for an action with nothing to write; false for one dropped by an
  // account switch while the read was out.
  const result = (r: Promise<boolean> | void): Promise<boolean> => (r === undefined ? Promise.resolve(true) : r);
  if (hydrated) return result(fn());
  const g = generation;
  return hydrateCareerFinder().then(() => (g === generation && hydrated ? result(fn()) : false));
}

/**
 * DAMAGED JSON IS SET ASIDE, NOT LOST (final round A, 2026-10-02 — the
 * createLocalStore rule). JSON.parse threw inside the read's success handler,
 * the .catch swallowed it with `readFailed` still false, and the next answer
 * silently replaced the blob. Now the blob is copied to `<key>:damaged` and
 * the store starts EMPTY (`clean(null)`) with writes allowed.
 */
function parseOrSetAside(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Silent on purpose: setting a damaged blob aside is the app's housekeeping.
    AsyncStorage.setItem(`${KEY}:damaged`, raw).catch(() => {});
    return null;
  }
}

/** Load once. Actions wait for it (see `act`). */
export function hydrateCareerFinder(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  // Generation fence (bug hunt 2026-09-30, pass 3 — the fence pass 2 gave the
  // enrollment / bundles / deck / last-study stores). A read still out when
  // resetLocal() runs for an account switch landed AFTER the reset and put the
  // departing user's answers, results, saved families and feedback back in
  // memory for the next person — and marked the store hydrated with them.
  const g = generation;
  hydrating = AsyncStorage.getItem(KEY)
    .then(
      (raw) => {
        if (g === generation) readFailed = false;
        if (g === generation && !wrote && raw) state = clean(parseOrSetAside(raw));
      },
      () => {
        if (g === generation) readFailed = true; // unreadable, not empty — see `readFailed`
      },
    )
    .catch(() => {})
    .then(() => {
      if (g !== generation) return;
      hydrated = true;
      emit();
    });
  return hydrating;
}

export const getCareerFinder = (): FinderRecord => state;
export const isCareerFinderHydrated = (): boolean => hydrated;
/** False while the stored record could not be READ — nothing this session
 *  is written then (see `readFailed`), so "Your answers are saved" would be
 *  untrue (final round A, 2026-10-02). True before the read lands: answers
 *  then wait for it and are written on top of it (see `act`). */
export const isCareerFinderSaving = (): boolean => !readFailed;

export function useCareerFinder(): FinderRecord {
  return useSyncExternalStore(
    (l) => { listeners.add(l); void hydrateCareerFinder(); return () => { listeners.delete(l); }; },
    getCareerFinder,
    getCareerFinder,
  );
}
export function useCareerFinderHydrated(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); void hydrateCareerFinder(); return () => { listeners.delete(l); }; },
    isCareerFinderHydrated,
    isCareerFinderHydrated,
  );
}
export function useCareerFinderSaving(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); void hydrateCareerFinder(); return () => { listeners.delete(l); }; },
    isCareerFinderSaving,
    isCareerFinderSaving,
  );
}

/* ── actions ───────────────────────────────────────────────────────────── */

/** Save one answer immediately (brief: "Save every answer immediately"). */
export function answerQuestion(id: QuestionId, value: Response): void {
  act(() => persist({ ...state, responses: { ...state.responses, [id]: value } }));
}

export function setQuestionIndex(index: number): void {
  const i = Math.max(0, Math.min(QUESTION_COUNT - 1, Math.round(index)));
  act(() => {
    if (i === state.index) return;
    persist({ ...state, index: i });
  });
}

/** First unanswered question, or the last one when all are answered. */
export function firstUnansweredIndex(r: FinderRecord = state): number {
  const i = QUESTIONS.findIndex((q) => !(q.id in r.responses));
  return i < 0 ? QUESTION_COUNT - 1 : i;
}

export const answeredCount = (r: FinderRecord = state): number => QUESTIONS.filter((q) => q.id in r.responses).length;
export const allAnswered = (r: FinderRecord = state): boolean => answeredCount(r) === QUESTION_COUNT;

/** Freeze the result. Re-running after changing answers re-freezes. */
export function completeCareerFinder(): void {
  act(completeNow);
}
function completeNow(): void {
  const result = computeResult(state.responses, familyFieldOf);
  const dimensionScores: Partial<Record<DimensionCode, number>> = {};
  for (const d of Object.values(result.dims)) dimensionScores[d.code] = Math.round(d.score * 1000) / 1000;
  persist({
    ...state,
    completed: true,
    completedAt: new Date().toISOString(),
    dimensionScores,
    rankedFamilyIds: result.ranked.map((f) => f.family.id),
  });
}

/** Back to the questions with answers kept (change previous answers). */
export function reopenCareerFinder(): void {
  act(() => {
    if (!state.completed) return;
    persist({ ...state, completed: false });
  });
}

/** Wipe answers + results — and the Beta feedback, which described THOSE results
 *  (a retake was opening with "✓ YES" + the old note pre-filled — Bug+Hater night
 *  B1-03). Saved families are kept unless `everything`. */
export function resetCareerFinder(everything = false): void {
  act(() => {
    const fresh = EMPTY();
    persist(everything ? fresh : { ...fresh, saved: state.saved });
  });
}

export function toggleSavedFamily(id: string): void {
  act(() => {
    const saved = state.saved.includes(id) ? state.saved.filter((s) => s !== id) : [...state.saved, id];
    persist({ ...state, saved });
  });
}

/** Resolves true only when the feedback reached the device (see persist).
 *  The Results form says "not saved" itself, so a refusal raises the shared
 *  notice only when `report` (the save on the way out, with no form left to
 *  say it). */
export function setCareerFinderFeedback(answer: FeedbackAnswer, note = '', report = false): Promise<boolean> {
  return act(() => persist({ ...state, feedback: { answer, note, at: new Date().toISOString() } }, report));
}

/** In-memory reset for an account switch (clearLocalAccountData registry). */
export function resetLocal(): void {
  generation += 1;
  state = EMPTY();
  hydrated = false;
  hydrating = null;
  wrote = false;
  readFailed = false;
  emit();
  // Mounted hooks only hydrate on SUBSCRIBE (bug hunt 2026-10-01). A Finder
  // screen still in the stack across a sign-out sat at hydrated=false for
  // good — the hub drew no START / CONTINUE button at all, and the quiz never
  // seeded — until it was remounted. Re-hydrate for them, as enrollmentStore
  // does; storage was already wiped, so this lands an empty record.
  if (listeners.size > 0) void hydrateCareerFinder();
}
// Registered with the account wipe the moment this module is first evaluated
// (perf start trim 2026-10-04): the wipe no longer imports it, so the 217 KB
// career index stays out of app start. A session that never opened the Career
// Finder holds nothing here to reset, and ape:careerfinder:v1 (and its
// :damaged copy) is taken by the wipe's ape:* sweep either way.
registerLocalStoreReset(resetLocal);
