/**
 * earProgress — the Ear Training Lab's per-module progress store (spec §3).
 *
 * AsyncStorage `ape:ear:v1` (the ape:* prefix keeps it inside the guest-entry
 * 100% wipe). Level rules from the spec:
 *   - level UP when the last 20 trials at the current level score ≥ 80%
 *     (needs at least 20 at that level — no lucky-streak promotion);
 *   - step DOWN when the last 20 at the level score < 50% (never below 1);
 *   - `near` answers count half credit toward the percentage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EarModuleId } from './earTypes';
import { holdSessionWork, registerSessionCarry, sessionCarryEpoch } from '../lab/sessionCarry';
import { armSaveFailureReport, reportUnhandledSaveFailure } from '../storage/saveFailureNotice';

const KEY = 'ape:ear:v1';
const WINDOW = 20;
const KEEP = 50;

export type EarTrialLog = {
  level: number;
  /** 1 = correct, 0.5 = near credit, 0 = wrong. */
  score: number;
  at: number; // epoch ms
};

export type EarModuleProgress = {
  level: number;
  trials: EarTrialLog[]; // most recent last, capped at KEEP
  bestStreak: number;
  streak: number;
  total: number;
  totalScore: number;
  /** Highest level ever completed at ≥80% over a full window. */
  mastered: number;
  /** `total` at the moment of the last level change. Only trials logged
   *  AFTER it count toward the next promotion/demotion window — without this
   *  a step-down could be reversed by the very next trial, because the 19
   *  old (≥80%) trials at the lower level were still in the window. */
  levelChangedAt?: number;
};

export type EarProgressState = {
  modules: Partial<Record<EarModuleId, EarModuleProgress>>;
  /** Spec §4 — "my playback can't reproduce sub-bass" opt-out. */
  subBassOk: boolean;
};

const EMPTY: EarProgressState = { modules: {}, subBassOk: true };

export function emptyModuleProgress(): EarModuleProgress {
  return { level: 1, trials: [], bestStreak: 0, streak: 0, total: 0, totalScore: 0, mastered: 0 };
}

/**
 * HOUSE GUEST RULE (owner 2026-08-12; bug hunt 2026-09-30 pass 2): a
 * signed-out guest or a members-only preview neither restores progress nor
 * saves it. The screens set this FLAG on every render, from the live
 * entitlement (like setSoundSystemsSaveBlocked). While blocked `ape:ear:v1`
 * is neither read nor written: every load starts at level 1 and saves go
 * nowhere. The drill screen keeps its own ladder, streak and round for the
 * visit, so the guest trains normally — only persistence stops (leave and
 * return restores nothing). No user data is held here, so an account change
 * has nothing to reset.
 */
let saveBlocked = false;
export function setEarSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

/** A state handed out WHILE blocked (the empty guest ladder) is never saved,
 *  even after the flag clears (bug pass 3, 2026-09-30). A signed-in learner
 *  whose first tier read failed reads 'anonymous' until a retry lands; the
 *  drill screen loaded that empty ladder at mount and, once unblocked, wrote
 *  it back over every module's real ladder. The drill saves the SAME object
 *  it loaded (mutated in place), so membership follows it. */
const blockedLoads = new WeakSet<EarProgressState>();
/** A state handed out while BLOCKED (a guest's empty ladder) → the ledger
 *  epoch it was started in. It holds only this session's training, so it is
 *  HELD for the sign-in hand-off (owner ruling 2026-10-01) — but only while
 *  the epoch is unchanged: after a sign-out the same on-screen ladder must
 *  never be carried into whoever signs in next. */
const guestLoads = new WeakMap<EarProgressState, number>();
/** A state handed out because storage could not be READ (a subset of
 *  blockedLoads): never written — but a trial saved onto it is SAID (hunt 7,
 *  2026-10-03; hunt 6's drum/mastering rule). */
const unreadLoads = new WeakSet<EarProgressState>();

/** True when this state is the stand-in handed out because storage could not
 *  be READ (owner 2026-10-03, "do 2"): the hub says so instead of showing
 *  every module unstarted. Read-only — changes nothing that is written. */
export function isEarProgressUnreadable(s: EarProgressState): boolean {
  return unreadLoads.has(s);
}

export async function loadEarProgress(): Promise<EarProgressState> {
  if (saveBlocked) {
    const s: EarProgressState = { ...EMPTY, modules: {} };
    blockedLoads.add(s);
    guestLoads.set(s, sessionCarryEpoch());
    return s;
  }
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    // Storage itself could not be read (night pass 3, 2026-10-01; the Amp
    // lab's pass-2 fix): this empty ladder says nothing about what is stored,
    // and the drill saves it on the first answer — over every module's real
    // ladder and mastered level. Never written back, like a blocked load.
    const s: EarProgressState = { ...EMPTY, modules: {} };
    unreadLoads.add(s);
    blockedLoads.add(s);
    return s;
  }
  try {
    if (!raw) return { ...EMPTY, modules: {} };
    const p = JSON.parse(raw) as EarProgressState;
    return { modules: p.modules ?? {}, subBassOk: p.subBassOk !== false };
  } catch {
    return { ...EMPTY, modules: {} };
  }
}

export async function saveEarProgress(s: EarProgressState): Promise<void> {
  if (guestLoads.get(s) === sessionCarryEpoch()) {
    // A guest's ladder: held (a copy) for the sign-in hand-off, never written here.
    // Each drill screen starts its own empty ladder, so modules from other
    // screens this session are kept; a module trained again keeps the higher
    // mastered level and best streak.
    const copy = JSON.parse(JSON.stringify(s)) as EarProgressState;
    holdSessionWork<EarProgressState>(CARRY_KEY, (prev) => {
      const out: EarProgressState = { modules: { ...(prev?.modules ?? {}) }, subBassOk: copy.subBassOk };
      for (const [id, m] of Object.entries(copy.modules) as [EarModuleId, EarModuleProgress][]) {
        if (!m || m.total <= 0) continue;
        const was = out.modules[id];
        out.modules[id] = was ? { ...m, mastered: Math.max(was.mastered, m.mastered), bestStreak: Math.max(was.bestStreak, m.bestStreak) } : m;
      }
      return out;
    });
  }
  // A trial (or the sub-bass pick) on a ladder whose stored copy could not be
  // READ is never written (below) — but it is SAID (hunt 7, 2026-10-03): every
  // answer, level-up and mastered level was dropped without a word and gone
  // next visit. Every caller saves only after a change. A guest stays quiet.
  if (!saveBlocked && unreadLoads.has(s)) reportUnhandledSaveFailure();
  if (saveBlocked || blockedLoads.has(s)) return;
  const reportRefused = armSaveFailureReport();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Losing it never blocks training — but the learner is told it was not
    // kept (owner 2026-10-03: "if it fails the user needs to know").
    reportRefused();
  }
}

const CARRY_KEY = 'ear';

/**
 * Pure: the stored copy plus a guest session's ladder. A module the account
 * has never trained takes the session's ladder whole. A module it HAS trained
 * keeps its own ladder (two ladders cannot be spliced honestly), and what the
 * session achieved only ever raises it: the mastered level and the best
 * streak are the higher of the two. The sub-bass setting is the account's.
 * `ownedBySession(id)`: the stored module was written by an earlier hand-off
 * of this same session — it IS the session's ladder, so it is replaced.
 */
export function mergeEarProgress(stored: EarProgressState | null, session: EarProgressState, ownedBySession: (id: EarModuleId) => boolean = () => false): EarProgressState {
  const out: EarProgressState = { modules: { ...(stored?.modules ?? {}) }, subBassOk: stored ? stored.subBassOk : session.subBassOk };
  for (const [id, m] of Object.entries(session.modules) as [EarModuleId, EarModuleProgress][]) {
    if (!m || m.total <= 0) continue;
    const st = out.modules[id];
    out.modules[id] = st && !ownedBySession(id)
      ? { ...st, mastered: Math.max(st.mastered, m.mastered), bestStreak: Math.max(st.bestStreak, m.bestStreak) }
      : m;
  }
  return out;
}

// The ledger's writer (it writes only for a real account): read the stored
// copy whatever the screens' flag says; never write over one that could not
// be read.
/** Modules a hand-off wrote fresh, with the ledger epoch it happened in. */
const writtenBySession = new Map<EarModuleId, number>();
registerSessionCarry<EarProgressState>(CARRY_KEY, async (session) => {
  const epoch = sessionCarryEpoch();
  const reportRefused = armSaveFailureReport();
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    return false;
  }
  let stored: EarProgressState | null = null;
  try {
    if (raw) {
      const p = JSON.parse(raw) as EarProgressState;
      stored = { modules: p.modules ?? {}, subBassOk: p.subBassOk !== false };
    }
  } catch {
    stored = null;
  }
  const owned = (id: EarModuleId) => writtenBySession.get(id) === epoch;
  for (const id of Object.keys(session.modules) as EarModuleId[]) {
    if (!stored?.modules[id] && (session.modules[id]?.total ?? 0) > 0) writtenBySession.set(id, epoch);
  }
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(mergeEarProgress(stored, session, owned)));
    return true;
  } catch {
    reportRefused(); // the guest's carried ladder was refused by the device
    return false;
  }
});

/** Pure: apply one scored trial; returns new progress + what changed. */
export function applyTrial(
  p: EarModuleProgress,
  maxLevel: number,
  score: number,
): { next: EarModuleProgress; leveledUp: boolean; leveledDown: boolean } {
  const trials = [...p.trials, { level: p.level, score, at: Date.now() }].slice(-KEEP);
  const streak = score >= 1 ? p.streak + 1 : 0;
  const next: EarModuleProgress = {
    ...p,
    trials,
    streak,
    bestStreak: Math.max(p.bestStreak, streak),
    total: p.total + 1,
    totalScore: p.totalScore + score,
  };
  // Window = the last 20 trials at this level, counted only since the last
  // level change (trials is capped at KEEP, so clamp the slice to its length).
  const sinceChange = Math.min(trials.length, next.total - (p.levelChangedAt ?? 0));
  const atLevel = trials
    .slice(-sinceChange)
    .filter((t) => t.level === p.level)
    .slice(-WINDOW);
  let leveledUp = false;
  let leveledDown = false;
  if (atLevel.length >= WINDOW) {
    const pct = atLevel.reduce((a, t) => a + t.score, 0) / atLevel.length;
    if (pct >= 0.8) {
      next.mastered = Math.max(next.mastered, p.level);
      if (p.level < maxLevel) {
        next.level = p.level + 1;
        next.levelChangedAt = next.total;
        leveledUp = true;
      }
    } else if (pct < 0.5 && p.level > 1) {
      next.level = p.level - 1;
      next.levelChangedAt = next.total;
      leveledDown = true;
    }
  }
  return { next, leveledUp, leveledDown };
}

/** Rolling accuracy over the last `n` trials (0..1), or null before any. */
export function recentAccuracy(p: EarModuleProgress, n = WINDOW): number | null {
  if (p.trials.length === 0) return null;
  const win = p.trials.slice(-n);
  return win.reduce((a, t) => a + t.score, 0) / win.length;
}
