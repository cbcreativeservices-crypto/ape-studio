/**
 * ampProgress — Amplifier Principles Lab progress (build spec Part 3 §11).
 * AsyncStorage `ape:amp:v1` (ape:* prefix keeps it inside the guest-entry
 * wipe). Stores only what reproduces the learner's position — never
 * animation frames or per-frame state.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AmpModuleId } from './ampContent';
import { holdSessionWork, registerSessionCarry } from '../lab/sessionCarry';
import { armSaveFailureReport, reportUnhandledSaveFailure } from '../storage/saveFailureNotice';

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

/**
 * HOUSE GUEST RULE (owner 2026-08-12; bug hunt 2026-09-30 pass 2): a
 * signed-out guest or a members-only preview neither restores progress nor
 * saves it — the lab's own end screen tells them "nothing here is saved".
 * The screens set this FLAG on every render, from the live entitlement (like
 * setSoundSystemsSaveBlocked). While blocked `ape:amp:v1` is neither read nor
 * written: every load starts empty and saves go nowhere. The guest keeps
 * using the lab normally — checks, COMPLETE & CONTINUE, the final — inside
 * each screen; only persistence stops (leave and return restores nothing).
 * No user data is held here, so an account change has nothing to reset.
 *
 * SIGN-IN HAND-OFF (owner ruling 2026-10-01): every change a blocked store
 * refuses is applied to a SESSION COPY held by the shared ledger
 * (features/lab/sessionCarry) — it starts empty, so it holds only this
 * session's work — and the ledger merges it into the account's copy when the
 * guest signs in (or when a signed-in learner's late tier lands). A preview
 * holds nothing.
 */
let saveBlocked = false;
export function setAmpSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

/** States read while storage itself FAILED (night pass 2, 2026-10-01): the
 *  empty fallback must never be written back. Every update is a load + save,
 *  and the Amp home now runs one on each focus, so one failed read used to
 *  overwrite every completed module and the best final with an empty copy. */
const unreadable = new WeakSet<AmpProgressState>();

/** True when this state is the empty stand-in from a read that FAILED (owner
 *  2026-10-03, "do 2"): the hub says so instead of "0 of N modules complete".
 *  Read-only — changes nothing that is written. */
export function isAmpProgressUnreadable(s: AmpProgressState): boolean {
  return unreadable.has(s);
}

export async function loadAmpProgress(): Promise<AmpProgressState> {
  if (saveBlocked) return { modules: {} };
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    const s: AmpProgressState = { modules: {} };
    unreadable.add(s);
    return s;
  }
  try {
    if (!raw) return { modules: {} };
    const p = JSON.parse(raw) as AmpProgressState;
    return { modules: p.modules ?? {}, lastModule: p.lastModule, final: p.final, bestFinal: p.bestFinal };
  } catch {
    return { modules: {} };
  }
}

export async function saveAmpProgress(s: AmpProgressState): Promise<void> {
  if (saveBlocked) return;
  if (unreadable.has(s)) return; // never write an unreadable read's empty copy back
  const reportRefused = armSaveFailureReport();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Losing it never blocks learning — but the learner is told it was not
    // kept (owner 2026-10-03: "if it fails the user needs to know").
    reportRefused();
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
    const blocked = saveBlocked;
    const s = await loadAmpProgress();
    mutate(s);
    await saveAmpProgress(s);
    // A change dropped because the READ failed is SAID (hunt 7, 2026-10-03;
    // hunt 6's drum/mastering rule): saveAmpProgress never writes an
    // unreadable read's copy, so a check, a module's MARK COMPLETE or the
    // final tapped then was neither written nor queued while the screen
    // showed it banked — gone next visit, without a word. A pure re-read
    // (the home's focus read, FINISH) changes nothing and says nothing.
    if (!saveBlocked && unreadable.has(s) && JSON.stringify(s) !== JSON.stringify({ modules: {} })) reportUnhandledSaveFailure();
    // Blocked (a guest): the same change lands on the session copy the
    // ledger holds for the sign-in hand-off.
    if (blocked) holdSessionWork<AmpProgressState>(CARRY_KEY, (prev) => {
      const c = structuredCloneAmp(prev ?? { modules: {} });
      mutate(c);
      return c;
    });
    return s;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

const CARRY_KEY = 'amp';
const structuredCloneAmp = (s: AmpProgressState): AmpProgressState => JSON.parse(JSON.stringify(s)) as AmpProgressState;

const better = (a: AmpFinalResult | undefined, b: AmpFinalResult | undefined): AmpFinalResult | undefined =>
  !a ? b : !b ? a : b.scorePct > a.scorePct ? b : a;

/**
 * Pure: the stored copy plus a session copy. Credit only grows (`done`,
 * `visited`), the FIRST recorded answer wins (the stored one), the best final
 * is the better of the two, the latest final is the later one, and the place
 * is where the learner is now.
 */
export function mergeAmpProgress(stored: AmpProgressState, session: AmpProgressState): AmpProgressState {
  const out = structuredCloneAmp(stored);
  for (const [id, m] of Object.entries(session.modules) as [AmpModuleId, AmpModuleProgress][]) {
    if (!m) continue;
    const st = out.modules[id] ?? emptyAmpModule();
    out.modules[id] = {
      visited: st.visited || m.visited,
      done: st.done || m.done,
      checks: { ...(m.checks ?? {}), ...(st.checks ?? {}) },
    };
  }
  if (session.lastModule) out.lastModule = session.lastModule;
  if (session.final && (!out.final || session.final.at > out.final.at)) out.final = session.final;
  out.bestFinal = better(better(out.bestFinal, session.bestFinal), session.final);
  if (!out.bestFinal) delete out.bestFinal;
  return out;
}

// The ledger's writer: through the same serialized queue, reading the stored
// copy whatever the screens' save flag says (it writes only for a real
// account), and never over a copy that could not be read.
registerSessionCarry<AmpProgressState>(CARRY_KEY, (session) => {
  const reportRefused = armSaveFailureReport();
  const run = writeQueue.then(async () => {
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(KEY);
    } catch {
      return false;
    }
    let stored: AmpProgressState = { modules: {} };
    try {
      if (raw) {
        const p = JSON.parse(raw) as AmpProgressState;
        stored = { modules: p.modules ?? {}, lastModule: p.lastModule, final: p.final, bestFinal: p.bestFinal };
      }
    } catch {
      /* damaged → start from empty, like a load */
    }
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(mergeAmpProgress(stored, session)));
      return true;
    } catch {
      reportRefused(); // the guest's carried work was refused by the device
      return false;
    }
  });
  writeQueue = run.catch(() => undefined);
  return run;
});

/**
 * Reset affects ONLY this lab's key (spec: confirmation handled by the UI).
 *
 * A PRACTICE reset, never a credit wipe (owner 2026-09-29: "resets start a
 * fresh practice run; they never wipe banked credit"; bug hunt 2026-09-30).
 * It used to remove the whole key — every module's `done` and the best final
 * result, the lab's only record of credit. Now the checks, the resume point
 * and the latest final attempt clear; `done` and `bestFinal` are kept.
 */
export function resetAmpProgress(): Promise<AmpProgressState> {
  return updateAmpProgress((s) => {
    for (const id of Object.keys(s.modules) as AmpModuleId[]) {
      s.modules[id] = { ...emptyAmpModule(), done: !!s.modules[id]?.done };
    }
    if (!s.bestFinal && s.final) s.bestFinal = s.final;
    s.final = undefined;
    s.lastModule = undefined;
  });
}
