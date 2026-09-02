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

export async function loadTuningProgress(): Promise<TuningProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
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
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export async function resetTuningProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
