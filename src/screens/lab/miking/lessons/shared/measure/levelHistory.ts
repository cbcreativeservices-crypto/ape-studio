/**
 * A LEVEL HISTORY and the descriptors read from it (F12 L7–L24;
 * sound_level/GEOMETRY_PROPOSAL.md §3). Pure apart from the calculator call;
 * tested (with the Miking test loader).
 *
 * The history is a MADE-UP EXAMPLE, never a measurement (owner D-6B-2): a
 * seeded, deterministic run of A-weighted, fast-time-weighted readings, 8
 * per second, for a quiet background with traffic pass-bys — the same
 * numbers every time, so a learner and a test see the same story. It is a
 * simplified picture: a real meter computes LAeq from the pressure signal
 * itself; here the energy average of the fast readings stands in for it.
 *
 *   LAeq,T   the energy average over the interval — the SPL & exposure
 *            calculator's Leq (calcBridge.leqOf), never the mean of the dB
 *   LAFmax   the largest fast reading in the interval
 *   L10/L50/L90  the levels exceeded for 10 / 50 / 90 % of the interval
 *   mean of dB   computed ONLY to show why it is the wrong average
 */
import { leqOf } from './calcBridge';

export const SAMPLES_PER_S = 8;

/** A small, fast, seeded generator (mulberry32): the same run every time. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One event in the made-up run: a pass-by peaking at `peak` dB at `at` s,
 *  `width` s wide (to its −10 dB points, roughly). */
export type PassBy = { at: number; peak: number; width: number; label: string };
export type HistorySpec = { seed: number; seconds: number; background: number; wander: number; events: readonly PassBy[] };

/** The fast readings (dB) of a made-up run. */
export function makeHistory(s: HistorySpec): number[] {
  const rnd = seeded(s.seed);
  const n = Math.round(s.seconds * SAMPLES_PER_S);
  const out: number[] = [];
  let drift = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLES_PER_S;
    // The background wanders slowly (a random walk held near its level) with a little flutter.
    drift = 0.995 * drift + (rnd() - 0.5) * 0.35;
    const bg = s.background + Math.max(-s.wander, Math.min(s.wander, drift)) + (rnd() - 0.5) * 0.8;
    // Each pass-by adds its energy: a bell in level about its peak time.
    let e = Math.pow(10, bg / 10);
    for (const ev of s.events) {
      const x = (t - ev.at) / (ev.width / 2);
      const lv = ev.peak - 10 * x * x;
      if (lv > bg - 30) e += Math.pow(10, lv / 10);
    }
    out.push(Math.round(100 * 10 * Math.log10(e)) / 100);
  }
  return out;
}

/** The level exceeded for `pct` % of the samples (L10 → the 90th percentile). */
export function exceeded(levels: readonly number[], pct: number): number {
  const s = [...levels].sort((a, b) => a - b);
  const q = 1 - pct / 100;
  const i = Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))));
  return s[i];
}

export type Descriptors = { laeq: number | null; lafmax: number; l10: number; l50: number; l90: number; meanOfDb: number; seconds: number };

/** The descriptors of a window [from, to) in seconds. */
export function describe(levels: readonly number[], from = 0, to = levels.length / SAMPLES_PER_S): Descriptors {
  const a = Math.max(0, Math.floor(from * SAMPLES_PER_S));
  const b = Math.min(levels.length, Math.ceil(to * SAMPLES_PER_S));
  const w = levels.slice(a, b);
  return {
    laeq: leqOf(w, 1 / SAMPLES_PER_S),
    lafmax: Math.max(...w),
    l10: exceeded(w, 10),
    l50: exceeded(w, 50),
    l90: exceeded(w, 90),
    meanOfDb: w.reduce((x, y) => x + y, 0) / w.length,
    seconds: w.length / SAMPLES_PER_S,
  };
}

/** Receiver A (open) and B (by the facade): the same made-up traffic, B a
 *  little higher where the facade adds its reflection — a story, not a rule. */
export const EXAMPLE_RUNS: Readonly<Record<'A' | 'B', HistorySpec>> = {
  A: {
    seed: 1207,
    seconds: 600,
    background: 47,
    wander: 2.5,
    events: [
      { at: 38, peak: 66, width: 9, label: 'car' },
      { at: 112, peak: 64, width: 10, label: 'car' },
      { at: 171, peak: 74, width: 14, label: 'truck' },
      { at: 260, peak: 65, width: 9, label: 'car' },
      { at: 333, peak: 67, width: 8, label: 'car' },
      { at: 402, peak: 63, width: 11, label: 'car' },
      { at: 470, peak: 71, width: 12, label: 'bus' },
      { at: 548, peak: 65, width: 9, label: 'car' },
    ],
  },
  B: {
    seed: 3119,
    seconds: 600,
    background: 49,
    wander: 2.5,
    events: [
      { at: 38, peak: 68, width: 9, label: 'car' },
      { at: 112, peak: 66, width: 10, label: 'car' },
      { at: 171, peak: 76, width: 14, label: 'truck' },
      { at: 260, peak: 67, width: 9, label: 'car' },
      { at: 333, peak: 69, width: 8, label: 'car' },
      { at: 402, peak: 65, width: 11, label: 'car' },
      { at: 470, peak: 73, width: 12, label: 'bus' },
      { at: 548, peak: 67, width: 9, label: 'car' },
    ],
  },
};
