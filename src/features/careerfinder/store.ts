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

function persist(next: FinderRecord) {
  state = next;
  wrote = true;
  emit();
  void AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

/** Load once. A write that lands before the read finishes wins. */
export function hydrateCareerFinder(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  hydrating = AsyncStorage.getItem(KEY)
    .then((raw) => {
      if (!wrote && raw) state = clean(JSON.parse(raw));
    })
    .catch(() => {})
    .then(() => { hydrated = true; emit(); });
  return hydrating;
}

export const getCareerFinder = (): FinderRecord => state;
export const isCareerFinderHydrated = (): boolean => hydrated;

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

/* ── actions ───────────────────────────────────────────────────────────── */

/** Save one answer immediately (brief: "Save every answer immediately"). */
export function answerQuestion(id: QuestionId, value: Response): void {
  persist({ ...state, responses: { ...state.responses, [id]: value } });
}

export function setQuestionIndex(index: number): void {
  const i = Math.max(0, Math.min(QUESTION_COUNT - 1, Math.round(index)));
  if (i === state.index) return;
  persist({ ...state, index: i });
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
  if (!state.completed) return;
  persist({ ...state, completed: false });
}

/** Wipe answers + results. Saved families and feedback are kept unless `everything`. */
export function resetCareerFinder(everything = false): void {
  const fresh = EMPTY();
  persist(everything ? fresh : { ...fresh, saved: state.saved, feedback: state.feedback });
}

export function toggleSavedFamily(id: string): void {
  const saved = state.saved.includes(id) ? state.saved.filter((s) => s !== id) : [...state.saved, id];
  persist({ ...state, saved });
}

export function setCareerFinderFeedback(answer: FeedbackAnswer, note = ''): void {
  persist({ ...state, feedback: { answer, note, at: new Date().toISOString() } });
}

/** In-memory reset for an account switch (clearLocalAccountData registry). */
export function resetLocal(): void {
  state = EMPTY();
  hydrated = false;
  hydrating = null;
  wrote = false;
  emit();
}
