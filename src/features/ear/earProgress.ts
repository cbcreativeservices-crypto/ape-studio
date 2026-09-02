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

export async function loadEarProgress(): Promise<EarProgressState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, modules: {} };
    const p = JSON.parse(raw) as EarProgressState;
    return { modules: p.modules ?? {}, subBassOk: p.subBassOk !== false };
  } catch {
    return { ...EMPTY, modules: {} };
  }
}

export async function saveEarProgress(s: EarProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Best-effort local stat — losing it never blocks training.
  }
}

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
