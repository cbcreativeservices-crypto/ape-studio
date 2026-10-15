/**
 * Miking Labs progress (blueprint §8.1; ruling §16.1: credit is lab-local,
 * exactly like the other training labs — ✓ per page, what's left, the hub's
 * "n of 8"). No certificate, no labCompletion call.
 *
 * On the shared safe store (createLocalStore, AGENTS.md): a failed READ is
 * UNREADABLE and never overwritten; a mutation before the read lands is
 * queued; the account wipe reaches it without a registry entry.
 *
 * WHO IS WRITTEN (decided by the host from useTier(), every render):
 *   persistAllowed (free / member) → written;
 *   holdAllowed (unknown / guest)  → held for the sign-in hand-off
 *                                    (holdSessionWork) and shown this session;
 *   a members-only PREVIEW         → nothing at all (PREVIEW EARNS NOTHING).
 *
 * CREDIT ONLY GROWS (owner 2026-09-29): `done` is a union; a practice reset
 * clears answers, interactives and the resume point, and
 * keeps `done` (the learner's chosen path — a preference, not progress — and
 * the quick check's FIRST TRY, which is the one that counts: owner 2026-10-14).
 *
 * THE JOURNEY (docs/labs/miking/LESSON_JOURNEY.md §2.4): `path` is NEW or
 * EXPERIENCED; `quick` is the quick check's first-try result. Recording a quick
 * check NEVER touches `done` — skipping cannot inflate credit (tested).
 */
import { useSyncExternalStore } from 'react';
import { getLabPreview } from '../../../../../features/lab/labPreviewStore';
import { holdSessionWork, registerSessionCarry, releaseSessionWork } from '../../../../../features/lab/sessionCarry';
import { createLocalStore } from '../../../../../features/storage/localStore';
import type { PageId, SourcePageId } from '../model/types.ts';
import { journeyPageOf, type LearnerPath, type QuickCheckResult } from '../journey.ts';
import { creditedCount, isStoredPage } from './creditMap.ts';
import { PAGE_IDS } from '../model/types.ts';
import { mikingLessonKey } from '../../../../../features/lab/trainingLabKeys';
import { reportTrainingComplete } from '../../../../../features/lab/trainingSignal';

export const MIKING_KEY = 'ape:miking:v1';
const CARRY_KEY = 'miking';

export type LessonProgress = {
  /** Pages banked, as stored: journey pages, and — from before the 2026-10-06
   *  restructure — instrument / sound / setting, which are KEPT (credit is
   *  never removed) and read through creditMap.creditedPages. */
  done: SourcePageId[];
  /** scenario / symptom id → the FIRST pick was right */
  answers: Record<string, boolean>;
  /** page interactives reached this run */
  interactive: string[];
  lastPage?: PageId;
  lastStep?: number;
  /** NEW or EXPERIENCED (kept through a practice reset). */
  path?: LearnerPath;
  /** The quick check's FIRST TRY — the one that counts (owner ruling
   *  2026-10-14, #19). Kept through a practice reset; a retake after seeing
   *  the answers is practice and is never recorded. */
  quick?: QuickCheckResult;
  /** The first try's picks so far, item id → option (first pick per item
   *  wins). A page change mid-check resumes THIS attempt instead of starting
   *  a fresh, credited one (#19). Kept through a practice reset too. */
  quickPicks?: Record<string, string>;
};
export type MikingProgress = { v: 1; lessons: Record<string, LessonProgress> };

const EMPTY = (): MikingProgress => ({ v: 1, lessons: {} });
export const emptyLesson = (): LessonProgress => ({ done: [], answers: {}, interactive: [] });

const isPage = isStoredPage;
const shortStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length < 64;

/** Pure: a clean record from anything (bad fields dropped, never thrown on). */
export function sanitizeMiking(raw: unknown): MikingProgress {
  const out = EMPTY();
  const lessons = (raw as { lessons?: unknown } | null)?.lessons;
  if (!lessons || typeof lessons !== 'object' || Array.isArray(lessons)) return out;
  for (const [id, l] of Object.entries(lessons as Record<string, unknown>)) {
    if (!shortStr(id) || !l || typeof l !== 'object') continue;
    const r = l as Record<string, unknown>;
    const answers: Record<string, boolean> = {};
    if (r.answers && typeof r.answers === 'object' && !Array.isArray(r.answers)) {
      for (const [k, v] of Object.entries(r.answers as Record<string, unknown>)) if (shortStr(k) && typeof v === 'boolean') answers[k] = v;
    }
    const lp: LessonProgress = {
      done: Array.isArray(r.done) ? [...new Set(r.done.filter(isPage))] : [],
      answers,
      interactive: Array.isArray(r.interactive) ? [...new Set(r.interactive.filter(shortStr))] : [],
    };
    // The resume point only (not credit): a page that left the journey
    // resumes on the page built from it.
    if (isPage(r.lastPage)) lp.lastPage = journeyPageOf(r.lastPage);
    if (typeof r.lastStep === 'number' && Number.isInteger(r.lastStep) && r.lastStep >= 0 && r.lastStep < 20) lp.lastStep = r.lastStep;
    if (r.path === 'new' || r.path === 'experienced') lp.path = r.path;
    const q = sanitizeQuick(r.quick);
    if (q) lp.quick = q;
    const picks = sanitizePicks(r.quickPicks);
    if (picks) lp.quickPicks = picks;
    out.lessons[id] = lp;
  }
  return out;
}

function sanitizeQuick(x: unknown): QuickCheckResult | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const q = x as Record<string, unknown>;
  const n = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 50;
  if (!n(q.right) || !n(q.total) || typeof q.pass !== 'boolean' || (q.right as number) > (q.total as number)) return null;
  const misses = Array.isArray(q.misses) ? [...new Set(q.misses.filter(isPage).map(journeyPageOf))] : [];
  return { right: q.right as number, total: q.total as number, pass: q.pass, misses };
}

function sanitizePicks(x: unknown): Record<string, string> | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) if (shortStr(k) && typeof v === 'string' && v.length > 0 && v.length < 400) out[k] = v;
  return Object.keys(out).length ? out : null;
}

/** Pure: stored + held. `done` and `interactive` are unions; the FIRST
 *  recorded answer wins (the stored one); the newest place (held) wins. */
export function mergeMiking(stored: MikingProgress, held: MikingProgress): MikingProgress {
  const out: MikingProgress = { v: 1, lessons: { ...stored.lessons } };
  for (const [id, h] of Object.entries(held.lessons)) {
    const s = stored.lessons[id] ?? emptyLesson();
    out.lessons[id] = {
      done: [...new Set([...s.done, ...h.done])],
      answers: { ...h.answers, ...s.answers },
      interactive: [...new Set([...s.interactive, ...h.interactive])],
      lastPage: h.lastPage ?? s.lastPage,
      lastStep: h.lastPage ? h.lastStep : s.lastStep,
    };
    const path = h.path ?? s.path;
    if (path) out.lessons[id].path = path;
    // One attempt per run: the attempt already on record wins.
    const quick = s.quick ?? h.quick;
    if (quick) out.lessons[id].quick = quick;
    // The first pick per item wins (the stored one).
    const picks = { ...h.quickPicks, ...s.quickPicks };
    if (Object.keys(picks).length) out.lessons[id].quickPicks = picks;
  }
  return out;
}

const store = createLocalStore<MikingProgress>({
  key: MIKING_KEY,
  empty: EMPTY,
  parse: (p) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('not a miking progress record');
    return sanitizeMiking(p);
  },
  onReset: () => setSession(EMPTY()),
});

/* ── this session's work that is NOT written (a guest / unknown tier) ── */
let session: MikingProgress = EMPTY();
const listeners = new Set<() => void>();
function setSession(next: MikingProgress): void {
  session = next;
  for (const l of [...listeners]) l();
}

let saveBlocked = false;
/** Set by the host every render: !persistAllowed(useTier()). */
export function setMikingSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

registerSessionCarry<MikingProgress>(CARRY_KEY, (held) => store.mutate((s) => mergeMiking(s, held)));

/** Apply one change: written, held, or (preview) dropped. Resolves true only
 *  when the device took the write. */
function change(fn: (p: MikingProgress) => MikingProgress): Promise<boolean> {
  if (getLabPreview().active) return Promise.resolve(false); // PREVIEW EARNS NOTHING
  if (saveBlocked) {
    setSession(fn(session));
    holdSessionWork<MikingProgress>(CARRY_KEY, (prev) => fn(prev ?? EMPTY()));
    void store.hydrate();
    return Promise.resolve(false);
  }
  return store.mutate(fn);
}

function withLesson(p: MikingProgress, id: string, fn: (l: LessonProgress) => LessonProgress): MikingProgress {
  return { v: 1, lessons: { ...p.lessons, [id]: fn(p.lessons[id] ?? emptyLesson()) } };
}

export function bankPage(lessonId: string, page: PageId): Promise<boolean> {
  const out = change((p) => withLesson(p, lessonId, (l) => (l.done.includes(page) ? l : { ...l, done: [...l.done, page] })));
  // CERTIFICATE CREDIT (owner 2026-10-13: Miking is required LESSON BY
  // LESSON). The lesson counts once every journey page is credited — the
  // hub's ✓ (creditedCount === PAGE_IDS.length). Read from the view, so a
  // guest's session pages count too (the report is then held for the sign-in
  // hand-off, never sent as a guest); a preview changed nothing, so nothing
  // new completes. Reported once the write (or hold) has been applied.
  void out.then(() => reportIfLessonComplete(lessonId));
  return out;
}

/** Report mk_<lessonId> when the lesson's journey is fully credited. */
export function reportIfLessonComplete(lessonId: string): void {
  if (getLabPreview().active) return;
  const l = view().lessons[lessonId];
  if (l && creditedCount(l.done) === PAGE_IDS.length) reportTrainingComplete(mikingLessonKey(lessonId));
}
export function recordAnswer(lessonId: string, id: string, firstRight: boolean): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => (id in l.answers ? l : { ...l, answers: { ...l.answers, [id]: firstRight } })));
}
export function recordInteractive(lessonId: string, id: string): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => (l.interactive.includes(id) ? l : { ...l, interactive: [...l.interactive, id] })));
}
/** NEW or EXPERIENCED — never touches credit. */
export function recordPath(lessonId: string, path: LearnerPath): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => (l.path === path ? l : { ...l, path })));
}
/** Pure: this run's quick check on a lesson record. The FIRST attempt of a
 *  run stands; `done` is never touched (skipping cannot inflate credit). */
export function withQuickCheck(l: LessonProgress, res: QuickCheckResult): LessonProgress {
  if (l.quick) return l;
  return { ...l, quick: { ...res, misses: [...res.misses] } };
}
export function recordQuickCheck(lessonId: string, res: QuickCheckResult): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => withQuickCheck(l, res)));
}
/** Pure: one pick of the quick check's FIRST TRY. Ignored once the first try
 *  is graded, and for an item already picked (the first pick stands). */
export function withQuickPick(l: LessonProgress, itemId: string, pick: string): LessonProgress {
  if (l.quick || (l.quickPicks && itemId in l.quickPicks)) return l;
  return { ...l, quickPicks: { ...l.quickPicks, [itemId]: pick } };
}
export function recordQuickPick(lessonId: string, itemId: string, pick: string): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => withQuickPick(l, itemId, pick)));
}
export function recordPlace(lessonId: string, page: PageId, step: number): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => ({ ...l, lastPage: page, lastStep: step })));
}

/** START OVER (PRACTICE): answers, interactives and the place go; credit stays.
 *  The quick check's FIRST TRY stays too (owner ruling 2026-10-14, #19: the
 *  first try is the one that counts; a retake is practice). */
export function clearMikingPracticeRun(lessonId: string): Promise<boolean> {
  const clear = (l: LessonProgress): LessonProgress => ({
    done: l.done,
    answers: {},
    interactive: [],
    ...(l.path ? { path: l.path } : null),
    ...(l.quick ? { quick: l.quick } : null),
    ...(l.quickPicks ? { quickPicks: l.quickPicks } : null),
  });
  setSession(withLesson(session, lessonId, clear));
  releaseSessionWork<MikingProgress>(CARRY_KEY, (prev) => withLesson(prev, lessonId, clear));
  if (getLabPreview().active || saveBlocked) return Promise.resolve(false);
  return store.mutate((p) => withLesson(p, lessonId, clear));
}

/* ── reading ── */
let viewCache: { base: MikingProgress; session: MikingProgress; out: MikingProgress } | null = null;
function view(): MikingProgress {
  const base = store.get();
  if (viewCache && viewCache.base === base && viewCache.session === session) return viewCache.out;
  const out = Object.keys(session.lessons).length ? mergeMiking(base, session) : base;
  viewCache = { base, session, out };
  return out;
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  const off = store.subscribe(l);
  return () => {
    listeners.delete(l);
    off();
  };
}
export function getMikingProgress(): MikingProgress {
  return view();
}
export function useMikingProgress(): MikingProgress {
  return useSyncExternalStore(subscribe, view, view);
}
export function lessonProgress(p: MikingProgress, id: string): LessonProgress {
  return p.lessons[id] ?? emptyLesson();
}
export function hydrateMiking(): Promise<void> {
  return store.hydrate();
}
export function isMikingUnreadable(): boolean {
  return store.isUnreadable();
}
const unreadableSnap = () => store.isUnreadable();
export function useMikingUnreadable(): boolean {
  return useSyncExternalStore(store.subscribe, unreadableSnap, unreadableSnap);
}
export function useMikingHydrated(): boolean {
  return store.useHydrated();
}
/** Tests: drop memory (as the account wipe does). */
export function resetMikingLocal(): void {
  store.reset();
}
