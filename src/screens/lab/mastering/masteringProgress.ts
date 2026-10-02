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
  /** Module 8 only: the ticked listening-check ids and QC ids, so a remount
   *  (or a return from the what's-left screen) does not lose the lists.
   *  Under the same guest rule as everything else here. */
  checks?: string[];
  qc?: string[];
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

/** States read while storage itself FAILED (the Amp rule, night pass 2):
 *  the empty fallback must never be written back. Every update is a load +
 *  save — a step change, an answer, a module change — so one transient
 *  getItem failure used to overwrite every banked module with an empty copy
 *  (toddler pass 1, 2026-10-01). */
const unreadable = new WeakSet<MasteringProgressState>();

/** One module entry, repaired: a damaged or older entry without an
 *  `answers` map made the next answer's `id in m.answers` throw, and the
 *  answer was silently never saved. `done` is kept whenever it was true. */
function cleanModule(m: unknown): MasteringModuleProgress | undefined {
  if (!m || typeof m !== 'object') return undefined;
  const o = m as Partial<MasteringModuleProgress>;
  const answers = o.answers && typeof o.answers === 'object' && !Array.isArray(o.answers) ? o.answers : {};
  const out: MasteringModuleProgress = { done: o.done === true, answers };
  if (Array.isArray(o.checks)) out.checks = o.checks.filter((x) => typeof x === 'string');
  if (Array.isArray(o.qc)) out.qc = o.qc.filter((x) => typeof x === 'string');
  return out;
}

export async function loadMasteringProgress(): Promise<MasteringProgressState> {
  if (saveBlocked) return { modules: {} };
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    const s: MasteringProgressState = { modules: {} };
    unreadable.add(s);
    return s;
  }
  try {
    if (!raw) return { modules: {} };
    const p = JSON.parse(raw) as MasteringProgressState;
    const modules: MasteringProgressState['modules'] = {};
    for (const [id, m] of Object.entries(p?.modules ?? {})) {
      const c = cleanModule(m);
      if (c) modules[id as MasteringModuleId] = c;
    }
    return { modules, lastModule: p.lastModule, lastStep: typeof p.lastStep === 'number' ? p.lastStep : undefined };
  } catch {
    return { modules: {} };
  }
}

async function save(s: MasteringProgressState): Promise<void> {
  if (saveBlocked) return;
  if (unreadable.has(s)) return; // never write an unreadable read's empty copy back
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
