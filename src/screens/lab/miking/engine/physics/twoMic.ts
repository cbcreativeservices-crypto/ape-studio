/**
 * TWO MICROPHONES (blueprint §6.2; SOURCES_SHARED.md §1–2). Pure; worklets.
 *
 * c comes from the CALCULATOR (speedOfSoundAir, calcUnits.ts) — never a copied
 * constant (charter §4: the calculators are the source of truth).
 *
 *   path difference  Δd = |S − B| − |S − A|   (signed; B later when > 0)
 *   delay            Δt = Δd / c
 *   same polarity    notches at f_n = (2n − 1) / (2|Δt|), n = 1, 2, …
 *   inverted (−1)    notches at f_n = n / |Δt|,          n = 0, 1, 2, … (0 = low-frequency loss)
 *   ideal sum        H(f) = (gA + s·gB·e^(−j2πfΔt)) / (gA + gB)
 *
 * IDEAL MODEL: one point source, straight-line paths, free field. Polarity
 * flips the sign; it does NOT remove the delay (lesson L72).
 */
import type { MicPose, PatternId, Vec3 } from '../model/types.ts';
import { speedOfSoundAir } from '../../../calc/calcUnits.ts';
import { dist } from '../geometry/vec.ts';
import { arrivalAngle, gain } from './polar.ts';

/** Speed of sound at 20 °C from the calculator (343.2 m/s). */
export const C20 = speedOfSoundAir(20);
/** Below this path difference the arrivals are treated as equal: no comb. */
export const EQUAL_PATH_MM = 0.5;
export const COMB_FLOOR_DB = -40;

export function pathDiffMm(src: Vec3, a: Vec3, b: Vec3): number {
  'worklet';
  return dist(src, b) - dist(src, a);
}

/** Δt in ms for a path difference in mm (c in m/s). */
export function deltaTms(dMm: number, c: number = C20): number {
  'worklet';
  return dMm / c; // mm ÷ (m/s) = ms
}

/** Notch frequencies (Hz) up to fMax, at most nMax of them. */
export function notchesHz(dtMs: number, polarity: 1 | -1, fMax = 20000, nMax = 64): number[] {
  'worklet';
  const dt = Math.abs(dtMs) / 1000;
  const out: number[] = [];
  if (dt * 1000 < 1e-9) return out;
  if (polarity === 1) {
    for (let n = 1; n <= nMax; n++) {
      const f = (2 * n - 1) / (2 * dt);
      if (f > fMax) break;
      out.push(f);
    }
  } else {
    for (let n = 0; n <= nMax; n++) {
      const f = n / dt;
      if (f > fMax) break;
      out.push(f);
    }
  }
  return out;
}

/** The ideal sum's magnitude in dB at f, floored at −40 dB for display. */
export function combDb(f: number, dtMs: number, gA: number, gB: number, polarity: 1 | -1): number {
  'worklet';
  const denom = Math.abs(gA) + Math.abs(gB);
  if (denom < 1e-12) return COMB_FLOOR_DB;
  const ph = 2 * Math.PI * f * (dtMs / 1000);
  const re = gA + polarity * gB * Math.cos(ph);
  const im = -polarity * gB * Math.sin(ph);
  const m = Math.sqrt(re * re + im * im) / denom;
  return m < 1e-6 ? COMB_FLOOR_DB : Math.max(COMB_FLOOR_DB, 20 * Math.log10(m));
}

/** Depth of a notch for two gains (dB), floored at −40. */
export function notchDepthDb(gA: number, gB: number): number {
  'worklet';
  const s = Math.abs(gA) + Math.abs(gB);
  if (s < 1e-12) return COMB_FLOOR_DB;
  const r = Math.abs(Math.abs(gA) - Math.abs(gB)) / s;
  return r < 1e-6 ? COMB_FLOOR_DB : Math.max(COMB_FLOOR_DB, 20 * Math.log10(r));
}

/** Ideal pickup of a point source: pattern gain ÷ distance (1/m). */
export function micGain(p: PatternId, pose: MicPose, src: Vec3): number {
  'worklet';
  const r = Math.max(1, dist(pose.p, src)) / 1000;
  return gain(p, arrivalAngle(pose, src)) / r;
}

/**
 * THE REAR-LOBE SIGN (review M8). An ideal supercardioid / hypercardioid
 * picks up a source behind it with INVERTED polarity (g(θ) < 0). The comb
 * must use the SIGNED gains: the effective polarity of the sum is the switch
 * times the sign of each mic's pickup. With the switch at "+", a source in
 * one mic's rear lobe still puts the notches on the inverted set.
 * A mic with no modelled pattern (a boundary plate) counts as positive.
 */
export function effectivePolarity(switchPol: 1 | -1, gA: number, gB: number): 1 | -1 {
  'worklet';
  const sA = gA < 0 ? -1 : 1;
  const sB = gB < 0 ? -1 : 1;
  return (switchPol * sA * sB) as 1 | -1;
}
