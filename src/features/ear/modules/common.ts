/**
 * Shared helpers for ear-training trial factories (spec §2 preamble).
 * Pure — no React, no side effects; runs in Node for verification.
 */
import { makeRng, normalizeRms, fadeEdges, gainDb, type Mono } from '../earDsp';

export type Rng = () => number;

export const rngFor = (seed: number): Rng => makeRng(seed);

export const pickInt = (rng: Rng, n: number): number => Math.floor(rng() * n) % n;

export function choice<T>(rng: Rng, arr: readonly T[]): T {
  return arr[pickInt(rng, arr.length)];
}

export function shuffled<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = pickInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ISO third-octave centres 63 Hz – 16 kHz (owner's 25, M1). */
export const ISO_THIRDS = [
  63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
  2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000,
] as const;

/** Octave centres (M1 L1 — every third entry of the 25). */
export const ISO_OCTAVES: number[] = ISO_THIRDS.filter((_, i) => i % 3 === 0);
/** Half-octave ladder step (M1 L2). */
export const ISO_HALVES: number[] = ISO_THIRDS.filter((_, i) => i % 2 === 0);

export const hzLabel = (hz: number): string =>
  hz >= 1000 ? `${(hz / 1000).toString().replace(/\.0$/, '')} kHz` : `${hz} Hz`;

/** Standard presentation loudness: −20 dBFS RMS + edge fades (spec §1/§5). */
export function present(x: Mono, targetDb = -20): Mono {
  return fadeEdges(normalizeRms(x, targetDb));
}

/**
 * M1 low-frequency makeup: +6 dB at 63 Hz tapering (log-f) to 0 at 250 Hz —
 * an equal-loudness APPROXIMATION, documented in feedback copy, never claimed
 * calibrated (spec §5).
 */
export function lfMakeupDb(freq: number): number {
  if (freq >= 250) return 0;
  const t = Math.log(250 / freq) / Math.log(250 / 63);
  return 6 * Math.min(1, Math.max(0, t));
}

export function presentTone(x: Mono, freq: number): Mono {
  return gainDb(present(x), lfMakeupDb(freq));
}
