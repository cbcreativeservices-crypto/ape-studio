/**
 * tuningProgress — Tuning & Temperament Lab persistence (spec Stage 5 §3).
 * AsyncStorage `ape:tuning:v1`. Persists completed chapters, last chapter and
 * overall completion — never audio, animation or drag state.
 *
 * GUESTS (owner ruling 2026-10-01): the screen saves nothing for a guest; it
 * HOLDS the chapters they finish and the place they reach
 * (holdTuningProgress) and the shared ledger (features/lab/sessionCarry)
 * writes them to the account they sign in to in the same app session.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { holdSessionWork, peekSessionWork, registerSessionCarry } from '../lab/sessionCarry';
import { armSaveFailureReport, reportUnhandledSaveFailure } from '../storage/saveFailureNotice';

const KEY = 'ape:tuning:v1';

export type TuningProgress = {
  completed: number[];
  lastChapter: number;
  done: boolean;
  /** Basic View / See the Math — a learner setting, kept like the ear lab's toggles. */
  mathView: boolean;
};

const EMPTY: TuningProgress = { completed: [], lastChapter: 0, done: false, mathView: false };

/** The last read of storage itself FAILED (night pass 3, 2026-10-01; the Amp
 *  lab's pass-2 fix). The empty fallback must never be written back: the lab
 *  persists on every chapter move, so one failed read used to overwrite every
 *  completed chapter — credit removed. Saves stay off until a read succeeds.
 *  Not account state: the next lab mount re-reads and clears it. */
const storage = { readFailed: false };

/** True while the last read of storage FAILED (owner 2026-10-03, "do 2"): the
 *  lab says so instead of showing every chapter unstarted. Read-only. */
export function isTuningProgressUnreadable(): boolean {
  return storage.readFailed;
}

export async function loadTuningProgress(): Promise<TuningProgress> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
    storage.readFailed = false;
  } catch {
    storage.readFailed = true;
    return { ...EMPTY, completed: [] };
  }
  try {
    if (!raw) return { ...EMPTY, completed: [] };
    const p = JSON.parse(raw) as Partial<TuningProgress>;
    return {
      completed: Array.isArray(p.completed) ? p.completed : [],
      lastChapter: typeof p.lastChapter === 'number' ? p.lastChapter : 0,
      done: !!p.done,
      mathView: !!p.mathView,
    };
  } catch {
    return { ...EMPTY, completed: [] };
  }
}

export async function saveTuningProgress(p: TuningProgress): Promise<void> {
  // The change an unreadable read drops is SAID (hunt 7, 2026-10-03; hunt 6's
  // drum/mastering rule): a chapter's ✓ showed complete and was gone next
  // visit, without a word. The screen saves only after a change (a chapter
  // done, a move, BASIC/MATH).
  if (storage.readFailed) reportUnhandledSaveFailure();
  if (storage.readFailed) return; // never write an unreadable read's empty copy back
  const reportRefused = armSaveFailureReport();
  try {
    // What a guest session held is never dropped by a save from an older copy.
    await AsyncStorage.setItem(KEY, JSON.stringify(withHeldTuning(p, peekSessionWork<HeldTuning>(CARRY_KEY))));
  } catch {
    // A chapter the device refused is told to the learner (owner 2026-10-03).
    reportRefused();
  }
}

/** A guest's work this session (deltas only). */
export type HeldTuning = { completed: number[]; lastChapter?: number; mathView?: boolean };
const CARRY_KEY = 'tuning';

/** Hold a chapter finished, the chapter reached, or the BASIC/MATH pick. */
export function holdTuningProgress(d: { done?: number; lastChapter?: number; mathView?: boolean }): void {
  holdSessionWork<HeldTuning>(CARRY_KEY, (prev) => {
    const completed = prev?.completed ?? [];
    return {
      completed: d.done != null && !completed.includes(d.done) ? [...completed, d.done].sort((a, b) => a - b) : [...completed],
      lastChapter: d.lastChapter ?? prev?.lastChapter,
      mathView: d.mathView ?? prev?.mathView,
    };
  });
}

/** Pure: a copy plus held work — chapters a union (`done` recomputed from
 *  the chapter count when given, never cleared). `takePlace`: the hand-off
 *  itself puts the learner where the guest session left them. */
export function withHeldTuning(p: TuningProgress, h: HeldTuning | undefined, takePlace = false, chapterCount?: number): TuningProgress {
  if (!h) return p;
  const completed = [...new Set([...p.completed, ...h.completed])].sort((a, b) => a - b);
  return {
    completed,
    lastChapter: takePlace && h.lastChapter != null ? h.lastChapter : p.lastChapter,
    done: p.done || (chapterCount != null && completed.length >= chapterCount),
    mathView: takePlace && h.mathView != null ? h.mathView : p.mathView,
  };
}

let chapterTotal: number | undefined;
/** The lab's chapter count (the screen tells the store), so a hand-off that
 *  completes the set marks the lab done. */
export function setTuningChapterCount(n: number): void {
  chapterTotal = n;
}

registerSessionCarry<HeldTuning>(CARRY_KEY, async (h) => {
  const reportRefused = armSaveFailureReport();
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    return false; // never over a copy that could not be read
  }
  let stored: TuningProgress = { ...EMPTY, completed: [] };
  try {
    if (raw) {
      const p = JSON.parse(raw) as Partial<TuningProgress>;
      stored = { completed: Array.isArray(p.completed) ? p.completed : [], lastChapter: typeof p.lastChapter === 'number' ? p.lastChapter : 0, done: !!p.done, mathView: !!p.mathView };
    }
  } catch {
    /* damaged → empty, like a load */
  }
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(withHeldTuning(stored, h, true, chapterTotal)));
    return true;
  } catch {
    reportRefused(); // the guest's carried chapters
    return false;
  }
});

export async function resetTuningProgress(): Promise<void> {
  const reportRefused = armSaveFailureReport();
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // The learner's practice reset did not stick: told, not silent.
    reportRefused();
  }
}
