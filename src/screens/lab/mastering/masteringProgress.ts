/**
 * masteringProgress — the Mastering Lab's device-local progress
 * (AsyncStorage `ape:mastering:v1`, inside the `ape:*` account wipe).
 * Modelled on features/amp/ampProgress.ts: only what reproduces the
 * learner's place — which modules are banked, which scenarios were answered,
 * the resume point — never per-frame state.
 *
 * HOUSE GUEST RULE (owner 2026-08-12; bug pass 2026-09-30): a signed-out
 * guest or a members-only preview neither restores nor saves. The screen sets
 * the flag every render from the live entitlement (setMasteringSaveBlocked),
 * and waits for the tier to be `resolved` before the first load.
 *
 * CREDIT IS NEVER REMOVED (owner 2026-09-29): a practice reset clears the
 * answers and the resume point and keeps `done`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MasteringModuleId } from './masteringContent';

const KEY = 'ape:mastering:v1';

export type MasteringModuleProgress = {
  done: boolean;
  /** scenario id → answered correctly on the first pick. */
  answers: Record<string, boolean>;
};

export type MasteringProgressState = {
  modules: Partial<Record<MasteringModuleId, MasteringModuleProgress>>;
  lastModule?: MasteringModuleId;
  lastStep?: number;
};

export const emptyMasteringModule = (): MasteringModuleProgress => ({ done: false, answers: {} });

let saveBlocked = false;
export function setMasteringSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

export async function loadMasteringProgress(): Promise<MasteringProgressState> {
  if (saveBlocked) return { modules: {} };
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { modules: {} };
    const p = JSON.parse(raw) as MasteringProgressState;
    return { modules: p.modules ?? {}, lastModule: p.lastModule, lastStep: p.lastStep };
  } catch {
    return { modules: {} };
  }
}

async function save(s: MasteringProgressState): Promise<void> {
  if (saveBlocked) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Local convenience state — losing it never blocks learning.
  }
}

/** Serialized read-modify-write (the ampProgress queue): two writers in one
 *  tap never clobber each other through a stale copy. */
let queue: Promise<unknown> = Promise.resolve();
export function updateMasteringProgress(mutate: (s: MasteringProgressState) => void): Promise<MasteringProgressState> {
  const run = queue.then(async () => {
    const s = await loadMasteringProgress();
    mutate(s);
    await save(s);
    return s;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** A PRACTICE reset: answers and the resume point clear; `done` is kept. */
export function resetMasteringPractice(): Promise<MasteringProgressState> {
  return updateMasteringProgress((s) => {
    for (const id of Object.keys(s.modules) as MasteringModuleId[]) {
      s.modules[id] = { ...emptyMasteringModule(), done: !!s.modules[id]?.done };
    }
    s.lastModule = undefined;
    s.lastStep = undefined;
  });
}
