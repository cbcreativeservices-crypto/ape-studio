/**
 * Shared helpers for ear-training trial factories (spec §2 preamble).
 * Pure — no React, no side effects; runs in Node for verification.
 */
import { makeRng, normalizeRms, fadeEdges, gainDb, SR, type Mono } from '../earDsp';

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
/** Every other third-octave centre — 2/3-octave steps, 13 chips (M1 L2). */
export const ISO_HALVES: number[] = ISO_THIRDS.filter((_, i) => i % 2 === 0);

export const hzLabel = (hz: number): string =>
  hz >= 1000 ? `${(hz / 1000).toString().replace(/\.0$/, '')} kHz` : `${hz} Hz`;

/** −1 dBFS — the peak ceiling impulsive clips are held under (D41 #26). */
export const PEAK_CEILING = Math.pow(10, -1 / 20);

/**
 * Standard presentation loudness: −20 dBFS RMS + edge fades (spec §1/§5).
 *
 * `peakCeiling` (opt-in, D41 #26): a nearly silent buffer — one click in
 * 1.6 s of silence — needs ~+31 dB to reach −20 dBFS RMS, which puts its
 * peak at up to 28× full scale; encodeWav then clamps it to ±1, so it neither
 * plays at the stated level nor draws inside its lane. With a ceiling, the
 * gain is the RMS gain capped so the peak lands at the ceiling. A clip whose
 * peak is already at or under the ceiling is returned exactly as before.
 * Opt-in because the A/B modules loudness-match pairs by RMS: capping one
 * clip of a pair alone would make the pair unequal in level.
 */
export function present(x: Mono, targetDb = -20, fadeMs = 8, peakCeiling?: number): Mono {
  const out = fadeEdges(normalizeRms(x, targetDb), fadeMs);
  if (peakCeiling === undefined) return out;
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak <= peakCeiling) return out;
  const g = peakCeiling / peak;
  for (let i = 0; i < out.length; i++) out[i] *= g;
  return out;
}

/**
 * Present a MATCHED set (D41 J1): every clip is RMS-normalised to the target
 * exactly as present() does, then the WHOLE set takes ONE shared gain so its
 * loudest peak lands at or under the ceiling. The clips stay level-matched to
 * each other (capping one clip alone would give the answer away), and none is
 * hard-clamped by encodeWav. A peaky set (heavily compressed drums) plays
 * below the target: matched beats −20 dBFS.
 *
 * A one-clip "which setting?" trial does NOT use this: it plays at a fixed,
 * answer-independent level per module and level (derived offline, see
 * ONE_CLIP_DB in time.ts and M10_ONE_CLIP_DB in dynamics.ts), with
 * present()'s ceiling as a turn-down-only guard.
 */
export function presentMatched(
  xs: readonly Mono[],
  targetDb = -20,
  fadeMs = 8,
  peakCeiling = PEAK_CEILING,
): Mono[] {
  const outs = xs.map((x) => present(x, targetDb, fadeMs));
  let peak = 0;
  for (const o of outs) for (let i = 0; i < o.length; i++) peak = Math.max(peak, Math.abs(o[i]));
  if (peak <= peakCeiling) return outs;
  const g = peakCeiling / peak;
  for (const o of outs) for (let i = 0; i < o.length; i++) o[i] *= g;
  return outs;
}

/**
 * A one-clip trial's clip at a FIXED, answer-independent level (D41 J1).
 * Fades FIRST, then sets the RMS, so every answer lands on exactly
 * `rmsTargetDb` (present() fades after normalising, and an 8 ms fade over a
 * drum hit shaves up to ~0.3 dB that differs by answer). `peakCeiling` is a
 * guard that only ever turns DOWN; callers pick a target that keeps it idle.
 */
export function presentFixed(x: Mono, rmsTargetDb: number, fadeMs = 8, peakCeiling = PEAK_CEILING): Mono {
  const out = normalizeRms(fadeEdges(Float32Array.from(x), fadeMs), rmsTargetDb);
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak <= peakCeiling) return out;
  const g = peakCeiling / peak;
  for (let i = 0; i < out.length; i++) out[i] *= g;
  return out;
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

/** Pure tones get the spec's 20 ms raised-cosine fades (an 8 ms fade is only
 *  half a cycle at 63 Hz — audible as a soft click, which is M5's stimulus,
 *  not M1's). */
export function presentTone(x: Mono, freq: number): Mono {
  return gainDb(present(x, -20, 20), lfMakeupDb(freq));
}

/**
 * Rendered drum-pattern surrogate (spec M10/M12/M14 source; V2: real loop —
 * marked). 100 BPM, kick on 1 & 3 (60 Hz decaying sine + click), snare on
 * 2 & 4 (noise burst + 200 Hz body). Fully synthesized offline — labeled a
 * surrogate in module copy.
 */
export function drumPattern(bars: number, rng: Rng): Mono {
  const beat = 60 / 100; // s
  const out = new Float32Array(Math.round(bars * 4 * beat * SR));
  const addKick = (at: number) => {
    const n0 = Math.round(at * SR);
    const len = Math.round(0.28 * SR);
    for (let i = 0; i < len && n0 + i < out.length; i++) {
      const t = i / SR;
      // 60 Hz body with a fast downward pitch blip + exponential decay.
      const f = 60 + 60 * Math.exp(-t * 60);
      out[n0 + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 14) * 0.9;
    }
    for (let i = 0; i < 90 && n0 + i < out.length; i++) {
      out[n0 + i] += (rng() * 2 - 1) * Math.exp(-i / 18) * 0.5; // the click
    }
  };
  const addSnare = (at: number) => {
    const n0 = Math.round(at * SR);
    const len = Math.round(0.11 * SR);
    for (let i = 0; i < len && n0 + i < out.length; i++) {
      const t = i / SR;
      out[n0 + i] +=
        ((rng() * 2 - 1) * 0.7 + Math.sin(2 * Math.PI * 200 * t) * 0.35) * Math.exp(-t * 34);
    }
  };
  for (let b = 0; b < bars; b++) {
    const t0 = b * 4 * beat;
    addKick(t0);
    addSnare(t0 + beat);
    addKick(t0 + 2 * beat);
    addKick(t0 + 2.5 * beat); // the off-beat push that makes pumping audible
    addSnare(t0 + 3 * beat);
  }
  return out;
}

/**
 * Transient-rich "pluck" pattern (spec M8/M9 source): sharp-attack harmonic
 * bursts with silence between them so echoes and tails stay audible.
 * `tailSec` pads silence at the end (reverb/delay room).
 */
export function pluckPattern(rng: Rng, tailSec = 0.9): Mono {
  const out = new Float32Array(Math.round((1.5 + tailSec) * SR));
  const plucks = [
    { at: 0.05, f0: 220 * Math.pow(2, rng() * 0.6) },
    { at: 0.8, f0: 165 * Math.pow(2, rng() * 0.6) },
  ];
  for (const p of plucks) {
    const n0 = Math.round(p.at * SR);
    const len = Math.round(0.4 * SR);
    for (let i = 0; i < len && n0 + i < out.length; i++) {
      const t = i / SR;
      const env = Math.exp(-t * 9) * (i < 24 ? i / 24 : 1);
      out[n0 + i] +=
        (Math.sin(2 * Math.PI * p.f0 * t) +
          0.5 * Math.sin(2 * Math.PI * p.f0 * 2 * t) +
          0.25 * Math.sin(2 * Math.PI * p.f0 * 3 * t)) *
        env * 0.5;
    }
    // The pick "click" that marks each onset.
    for (let i = 0; i < 60 && n0 + i < out.length; i++) {
      out[n0 + i] += (rng() * 2 - 1) * Math.exp(-i / 14) * 0.35;
    }
  }
  return out;
}

/** 99th-percentile |sample| — the honest "peaks" reference for M14. */
export function p99(x: Mono): number {
  const mags = Array.from(x, Math.abs).sort((a, b) => a - b);
  return mags[Math.min(mags.length - 1, Math.floor(mags.length * 0.99))] || 1;
}
