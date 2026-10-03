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
 *
 * SIGN-IN HAND-OFF (owner ruling 2026-10-01: "if in same session guest signs
 * in then current session is saved and stored"): every change the blocked
 * store refuses is applied to a SESSION COPY held by the shared ledger
 * (features/lab/sessionCarry). It starts empty, so it holds only this
 * session's work, and the ledger WRITES it into the account's copy
 * (mergeMasteringProgress) when the guest signs in — or when a signed-in
 * learner's late membership read lands. A preview holds nothing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { holdSessionWork, registerSessionCarry } from '../../../features/lab/sessionCarry';
import { registerLocalStoreReset } from '../../../features/storage/localStoreRegistry';
import { reportUnhandledSaveFailure } from '../../../features/storage/saveFailureNotice';
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

export async function loadMasteringProgress(force = false): Promise<MasteringProgressState> {
  if (saveBlocked && !force) {
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
  const gen = generation;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Losing it never blocks learning — but the learner is told it was not
    // kept (owner 2026-10-03), never for the departing account's write.
    if (gen === generation) reportUnhandledSaveFailure();
  }
}

/** Serialized read-modify-write (the ampProgress queue): two writers in one
 *  tap never clobber each other through a stale copy. */
let queue: Promise<unknown> = Promise.resolve();
/** The identity generation (pattern hunt wave 3, 2026-10-02 — the fence
 *  drumProgress got in wave 2): bumped by the account wipe (registered with
 *  it below). An update tapped under the departing account that runs — or
 *  writes — after the wipe lands nowhere: it used to read the departing
 *  account's copy before the sweep and save it back after it, or apply the
 *  departing learner's tap to the next account's copy. */
let generation = 0;
registerLocalStoreReset(() => {
  generation++;
});
export function updateMasteringProgress(mutate: (s: MasteringProgressState) => void): Promise<MasteringProgressState> {
  const gen = generation;
  const run = queue.then(async () => {
    const s = await loadMasteringProgress();
    mutate(s);
    // Never across the account wipe: neither written nor held — and marked
    // as not-from-the-store, so a host still mounted does not show it.
    if (gen !== generation) {
      blockedRead.add(s);
      return s;
    }
    await save(s);
    // A BLOCKED read (a guest, or the tier not known yet): the same change
    // lands on the session copy the ledger holds for the sign-in hand-off.
    if (blockedRead.has(s)) holdSessionWork<MasteringProgressState>(CARRY_KEY, (prev) => {
      const c: MasteringProgressState = JSON.parse(JSON.stringify(prev ?? { modules: {} })) as MasteringProgressState;
      mutate(c);
      return c;
    });
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

const CARRY_KEY = 'mastering';

/**
 * Pure: the stored copy plus a session copy. Credit is a union (`done`), the
 * FIRST recorded answer wins (the stored one), Module 8's ticks are a union,
 * and the place is where the learner is now (carryPreLoad's rules).
 */
export function mergeMasteringProgress(stored: MasteringProgressState, session: MasteringProgressState): MasteringProgressState {
  const out: MasteringProgressState = JSON.parse(JSON.stringify(stored)) as MasteringProgressState;
  out.modules = out.modules ?? {};
  const answers: MasteringPreLoad['answers'] = {};
  for (const [id, m] of Object.entries(session.modules) as [MasteringModuleId, MasteringModuleProgress][]) {
    const c = cleanModule(m);
    if (!c) continue;
    answers[id] = c.answers;
    if (c.done) out.modules[id] = { ...(out.modules[id] ?? emptyMasteringModule()), done: true };
  }
  const p = cleanModule(session.modules.project);
  carryPreLoad(out, {
    answers,
    checks: p?.checks ?? [],
    qc: p?.qc ?? [],
    at: session.lastModule ? { module: session.lastModule, step: session.lastStep ?? 0 } : undefined,
  });
  return out;
}

// The ledger's writer: through the same serialized queue, reading the stored
// copy whatever the screen's save flag says (the ledger writes only for a
// real account), and never over a copy that could not be read.
registerSessionCarry<MasteringProgressState>(CARRY_KEY, (session) => {
  const gen = generation;
  const run = queue.then(async () => {
    const stored = await loadMasteringProgress(true);
    if (unreadable.has(stored) || gen !== generation) return false;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(mergeMasteringProgress(stored, session)));
      return true;
    } catch {
      if (gen === generation) reportUnhandledSaveFailure(); // the guest's carried work
      return false;
    }
  });
  queue = run.catch(() => undefined);
  return run;
});

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
