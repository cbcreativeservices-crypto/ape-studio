/**
 * Audio Career Finder — device-local state (owner brief 2026-09-03).
 *
 * One AsyncStorage record, `ape:careerfinder:v1`, holding what the brief
 * asks to persist: assessment version, every answer (saved on tap), the
 * current question, completion, the computed dimension scores + ranking at
 * completion, the completion date — plus the user’s saved (★) families and
 * their Beta feedback. No account required: the record is per device.
 *
 * ON THE HOUSE STORE (owner 2026-10-04, D47): `createLocalStore` owns the
 * key, so the rules the hand-rolled store re-learned one bug at a time are
 * now the shared ones:
 *   • a failed READ is UNREADABLE, not empty — nothing is written over the
 *     stored record, the screens say so ("★ NOT SAVED"), and the next action
 *     reads again;
 *   • a change made before the read lands (or while it is unreadable) is
 *     QUEUED and applied on top of the stored record once it is read — so a
 *     ★ given while storage was failing is written as soon as it can be,
 *     instead of being lost when the app closed;
 *   • a damaged blob is set aside under `ape:careerfinder:v1:damaged`;
 *   • the account wipe's reset is registered at creation (this module is
 *     evaluated on first use only — perf start trim 2026-10-04 — and the
 *     wipe's `ape:*` sweep removes the key either way);
 *   • every write answers whether the device accepted it, and a refusal is
 *     told to the user by the shared notice unless the caller says it itself.
 *
 * NO MIGRATION NEEDED, ON PURPOSE: the record has only ever lived under this
 * one key (git history: 29660a03 → today), in this one shape. The store reads
 * the same key through the same `clean()`, so every existing answer, ★,
 * result and note loads untouched — and AuthScreen's Guest Mode keeps the
 * record across its total wipe by that same key name.
 */
import { useSyncExternalStore } from 'react';
import { createLocalStore } from '../storage/localStore';
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

/** The stored record, cleaned field by field (exported for the receipt). */
export function clean(raw: unknown): FinderRecord {
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

const store = createLocalStore<FinderRecord>({ key: KEY, empty: EMPTY, parse: clean });

/** Load once; the next call after a failed read tries again. */
export function hydrateCareerFinder(): Promise<void> {
  return store.hydrate();
}

/** The record as the screen should see it: the stored one with this
 *  session's queued changes on top. */
export const getCareerFinder = (): FinderRecord => store.get();
export const isCareerFinderHydrated = (): boolean => store.isHydrated();
/** False while the stored record could not be READ: nothing this session is
 *  written over it then, so "Your answers are saved" / "★ SAVED" would be
 *  untrue (final round A, 2026-10-02; hunt 13). True before the read lands:
 *  answers then wait for it and are written on top of it. */
export const isCareerFinderSaving = (): boolean => !store.isUnreadable();

/** The three faces (K2): still reading / could not be read / read (which may
 *  be truly empty — a first visit). Never "nothing saved" for a failed read. */
export type CareerFinderFace = 'loading' | 'unreadable' | 'ready';
export function careerFinderFace(): CareerFinderFace {
  if (store.isHydrated()) return 'ready';
  return store.isUnreadable() ? 'unreadable' : 'loading';
}

export function useCareerFinder(): FinderRecord {
  return store.use();
}
export function useCareerFinderHydrated(): boolean {
  return store.useHydrated();
}
export function useCareerFinderSaving(): boolean {
  return useSyncExternalStore(store.subscribe, isCareerFinderSaving, isCareerFinderSaving);
}
export function useCareerFinderFace(): CareerFinderFace {
  return useSyncExternalStore(store.subscribe, careerFinderFace, careerFinderFace);
}

/* ── actions ─────────────────────────────────────────────────────────────
 * Each is a pure change of the HYDRATED record (store.mutate), so one made
 * before the read lands applies on top of what was stored, never over it. */

/** Save one answer immediately (brief: "Save every answer immediately"). */
export function answerQuestion(id: QuestionId, value: Response): void {
  void store.mutate((r) => ({ ...r, responses: { ...r.responses, [id]: value } }));
}

export function setQuestionIndex(index: number): void {
  const i = Math.max(0, Math.min(QUESTION_COUNT - 1, Math.round(index)));
  if (store.get().index === i) return;
  void store.mutate((r) => (r.index === i ? r : { ...r, index: i }));
}

/** First unanswered question, or the last one when all are answered. */
export function firstUnansweredIndex(r: FinderRecord = getCareerFinder()): number {
  const i = QUESTIONS.findIndex((q) => !(q.id in r.responses));
  return i < 0 ? QUESTION_COUNT - 1 : i;
}

export const answeredCount = (r: FinderRecord = getCareerFinder()): number => QUESTIONS.filter((q) => q.id in r.responses).length;
export const allAnswered = (r: FinderRecord = getCareerFinder()): boolean => answeredCount(r) === QUESTION_COUNT;

/** Freeze the result. Re-running after changing answers re-freezes. */
export function completeCareerFinder(): void {
  void store.mutate(completed);
}
/** Pure: the record with its result frozen (from the record's own answers). */
function completed(r: FinderRecord): FinderRecord {
  const result = computeResult(r.responses, familyFieldOf);
  const dimensionScores: Partial<Record<DimensionCode, number>> = {};
  for (const d of Object.values(result.dims)) dimensionScores[d.code] = Math.round(d.score * 1000) / 1000;
  return {
    ...r,
    completed: true,
    completedAt: new Date().toISOString(),
    dimensionScores,
    rankedFamilyIds: result.ranked.map((f) => f.family.id),
  };
}

/** Back to the questions with answers kept (change previous answers). */
export function reopenCareerFinder(): void {
  if (!store.get().completed) return;
  void store.mutate((r) => (r.completed ? { ...r, completed: false } : r));
}

/** Wipe answers + results — and the Beta feedback, which described THOSE results
 *  (a retake was opening with "✓ YES" + the old note pre-filled — Bug+Hater night
 *  B1-03). Saved families are kept unless `everything`. */
export function resetCareerFinder(everything = false): void {
  void store.mutate((r) => (everything ? EMPTY() : { ...EMPTY(), saved: r.saved }));
}

/** ★ / un-★. The intent is decided from what the screen shows NOW (the
 *  createLocalStore toggle rule): replayed onto a record that loaded
 *  meanwhile, a blind flip would undo a ★ already stored. */
export function toggleSavedFamily(id: string): void {
  const add = !store.get().saved.includes(id);
  void store.mutate((r) => {
    const has = r.saved.includes(id);
    if (add === has) return r;
    return { ...r, saved: add ? [...r.saved, id] : r.saved.filter((s) => s !== id) };
  });
}

/** Resolves true only when the feedback reached the device. The Results form
 *  says "not saved" itself, so a refusal raises the shared notice only when
 *  `report` (the save on the way out, with no form left to say it). */
export function setCareerFinderFeedback(answer: FeedbackAnswer, note = '', report = false): Promise<boolean> {
  return store.mutate((r) => ({ ...r, feedback: { answer, note, at: new Date().toISOString() } }), { reportFailure: report });
}

/** In-memory reset for an account switch. The account wipe reaches it by
 *  itself (createLocalStore registers `reset` at creation); exported for the
 *  callers and tests that reset it directly. */
export function resetLocal(): void {
  store.reset();
}
