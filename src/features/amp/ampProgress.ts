/**
 * ampProgress — Amplifier Principles Lab progress (build spec Part 3 §11).
 * AsyncStorage `ape:amp:v1` (ape:* prefix keeps it inside the guest-entry
 * wipe). Stores only what reproduces the learner's position — never
 * animation frames or per-frame state.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AmpModuleId } from './ampContent';

const KEY = 'ape:amp:v1';

export type AmpModuleProgress = {
  visited: boolean;
  done: boolean;
  /** checkId → answered correctly (latest attempt). */
  checks: Record<string, boolean>;
};

export type AmpFinalResult = {
  scorePct: number;
  passed: boolean;
  at: number;
  /** Applied-challenge dimensions, each pass/fail (Part 3 §10). */
  dimensions?: Record<string, boolean>;
};

export type AmpProgressState = {
  modules: Partial<Record<AmpModuleId, AmpModuleProgress>>;
  lastModule?: AmpModuleId;
  final?: AmpFinalResult;
  bestFinal?: AmpFinalResult;
};

export function emptyAmpModule(): AmpModuleProgress {
  return { visited: false, done: false, checks: {} };
}

export async function loadAmpProgress(): Promise<AmpProgressState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { modules: {} };
    const p = JSON.parse(raw) as AmpProgressState;
    return { modules: p.modules ?? {}, lastModule: p.lastModule, final: p.final, bestFinal: p.bestFinal };
  } catch {
    return { modules: {} };
  }
}

export async function saveAmpProgress(s: AmpProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Local convenience state — losing it never blocks learning.
  }
}

/**
 * Serialized read-modify-write. Every writer (module shell: visited/checks/
 * done; Module 8: final result) once held its OWN copy loaded at mount and
 * saved that copy back — so whichever saved last silently discarded the
 * other's changes (answer three Module 8 checks, submit the final, and the
 * checks were gone). Mutations now queue: each loads the CURRENT state,
 * applies its change, saves, and resolves with the fresh state.
 */
let writeQueue: Promise<unknown> = Promise.resolve();
export function updateAmpProgress(mutate: (s: AmpProgressState) => void): Promise<AmpProgressState> {
  const run = writeQueue.then(async () => {
    const s = await loadAmpProgress();
    mutate(s);
    await saveAmpProgress(s);
    return s;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

/** Reset affects ONLY this lab's key (spec: confirmation handled by the UI). */
export async function resetAmpProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
