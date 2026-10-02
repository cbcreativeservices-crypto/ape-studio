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
/** States read while the store was BLOCKED (a guest, a preview, the tier not
 *  known yet): an empty stand-in, never the learner's progress. Checked again
 *  at save time (toddler pass 3): the flag is re-read at the write, so a store
 *  that unblocked between a blocked read and its write (the tier landing, a
 *  sign-in) wrote the empty stand-in over every banked module. */
const blockedRead = new WeakSet<MasteringProgressState>();

/** The read behind this state FAILED (storage threw): it is an empty
 *  fallback, not the learner's progress. */
export function masteringReadFailed(s: MasteringProgressState): boolean {
  return unreadable.has(s);
}
/** This state came from the store (not a blocked stand-in, not a failed
 *  read): safe to show as the learner's saved progress. */
export function masteringReadFromStore(s: MasteringProgressState): boolean {
  return !unreadable.has(s) && !blockedRead.has(s);
}

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
  if (saveBlocked) {
    const b: MasteringProgressState = { modules: {} };
    blockedRead.add(b);
    return b;
  }
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
  if (saveBlocked || blockedRead.has(s)) return;
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

/** What a learner did before the first store read landed (the tier was not
 *  known yet, so every write was blocked and dropped). */
export type MasteringPreLoad = {
  /** module → scenario → first answer. */
  answers: Partial<Record<MasteringModuleId, Record<string, boolean>>>;
  checks: readonly string[];
  qc: readonly string[];
  /** Where the learner is now, if they moved. */
  at?: { module: MasteringModuleId; step: number };
};

/**
 * Carry the pre-load work INTO the stored copy (toddler pass 2): answers,
 * Module 8 ticks and the resume point given before the tier resolved were
 * held on screen but never written — a learner who answered two cards and
 * left lost both, and the place they had moved to. The stored (first)
 * answer wins; ticks are a union; `done` is never touched.
 */
export function carryPreLoad(s: MasteringProgressState, pre: MasteringPreLoad): void {
  for (const [id, a] of Object.entries(pre.answers) as [MasteringModuleId, Record<string, boolean>][]) {
    if (!a || !Object.keys(a).length) continue;
    const m = s.modules[id] ?? emptyMasteringModule();
    s.modules[id] = { ...m, answers: { ...a, ...m.answers } };
  }
  if (pre.checks.length || pre.qc.length) {
    const p = s.modules.project ?? emptyMasteringModule();
    s.modules.project = {
      ...p,
      checks: [...new Set([...(p.checks ?? []), ...pre.checks])],
      qc: [...new Set([...(p.qc ?? []), ...pre.qc])],
    };
  }
  if (pre.at) {
    s.lastModule = pre.at.module;
    s.lastStep = pre.at.step;
  }
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
