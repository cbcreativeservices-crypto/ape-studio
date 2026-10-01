/**
 * tuningProgress — Tuning & Temperament Lab persistence (spec Stage 5 §3).
 * AsyncStorage `ape:tuning:v1`. Persists completed chapters, last chapter and
 * overall completion — never audio, animation or drag state.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  if (storage.readFailed) return; // never write an unreadable read's empty copy back
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export async function resetTuningProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
