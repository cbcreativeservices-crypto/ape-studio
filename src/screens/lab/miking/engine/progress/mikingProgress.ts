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
 * clears answers, interactives and the resume point, and keeps `done`.
 */
import { useSyncExternalStore } from 'react';
import { getLabPreview } from '../../../../../features/lab/labPreviewStore';
import { holdSessionWork, registerSessionCarry, releaseSessionWork } from '../../../../../features/lab/sessionCarry';
import { createLocalStore } from '../../../../../features/storage/localStore';
import { PAGE_IDS, type PageId } from '../model/types.ts';

export const MIKING_KEY = 'ape:miking:v1';
const CARRY_KEY = 'miking';

export type LessonProgress = {
  done: PageId[];
  /** scenario / symptom id → the FIRST pick was right */
  answers: Record<string, boolean>;
  /** page interactives reached this run */
  interactive: string[];
  lastPage?: PageId;
  lastStep?: number;
};
export type MikingProgress = { v: 1; lessons: Record<string, LessonProgress> };

const EMPTY = (): MikingProgress => ({ v: 1, lessons: {} });
export const emptyLesson = (): LessonProgress => ({ done: [], answers: {}, interactive: [] });

const isPage = (x: unknown): x is PageId => typeof x === 'string' && (PAGE_IDS as readonly string[]).includes(x);
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
    if (isPage(r.lastPage)) lp.lastPage = r.lastPage;
    if (typeof r.lastStep === 'number' && Number.isInteger(r.lastStep) && r.lastStep >= 0 && r.lastStep < 20) lp.lastStep = r.lastStep;
    out.lessons[id] = lp;
  }
  return out;
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
  return change((p) => withLesson(p, lessonId, (l) => (l.done.includes(page) ? l : { ...l, done: [...l.done, page] })));
}
export function recordAnswer(lessonId: string, id: string, firstRight: boolean): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => (id in l.answers ? l : { ...l, answers: { ...l.answers, [id]: firstRight } })));
}
export function recordInteractive(lessonId: string, id: string): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => (l.interactive.includes(id) ? l : { ...l, interactive: [...l.interactive, id] })));
}
export function recordPlace(lessonId: string, page: PageId, step: number): Promise<boolean> {
  return change((p) => withLesson(p, lessonId, (l) => ({ ...l, lastPage: page, lastStep: step })));
}

/** START OVER (PRACTICE): answers, interactives and the place go; credit stays. */
export function clearMikingPracticeRun(lessonId: string): Promise<boolean> {
  const clear = (l: LessonProgress): LessonProgress => ({ done: l.done, answers: {}, interactive: [] });
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
