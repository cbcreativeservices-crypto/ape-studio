/**
 * ARRAYS AND SPECIALIZED SENSORS — the physics F16 draws (scientific_arrays/
 * GEOMETRY_PROPOSAL.md §2–§3). Built by Lab 6 group 5 (branch lab6-g5).
 * Pure; tested. The speed of sound is the CALCULATOR's (speedOfSoundAir),
 * never a copied constant.
 *
 *   baselinePair   two omni capsules on a straight baseline (the exercise),
 *                  as the ensemble family's capsules, so their arrival
 *                  difference is stereoArray.dtLR — the same function the
 *                  stereo pairs use (REUSE, never duplicate)
 *   mirrorOf       the source's mirror point across the baseline's line: a
 *                  straight baseline hears it with the SAME time difference
 *                  (the front/back ambiguity; F16 L13, physics)
 *   lambdaHalf     a uniform line array is free of spatial aliasing up to
 *                  f_max = c / (2 d) — spacing below half a wavelength at the
 *                  highest frequency of interest (MW-ULA, CONFIRMED)
 *   axialShare     a p–p intensity probe reads the component of the flow
 *                  along its axis: cos θ of the incidence (physics; PROBE-
 *                  SPACER for the spacer presets 12 / 25 / 50 mm)
 *   WATER_AIR      the reference pressures: 1 µPa in water, 20 µPa in air —
 *                  the references alone are 26 dB apart, and equal
 *                  intensities differ by about 61.5 dB in all (DOSITS-AW).
 *                  The two scales are NOT comparable by subtracting 26 dB.
 *   nyquistOk      a sample rate must exceed twice the highest frequency kept
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { speedOfSoundAir } from '../../../../calc/calcUnits.ts';
import { arrivals, dtLR, type Capsule } from '../ensemble/stereoArray.ts';

/** Two omni capsules at ±b/2 across z about `c`, facing +x (the baseline exercise). */
export function baselinePair(bMm: number, c: Vec3 = { x: 0, y: 0, z: 0 }): Capsule[] {
  const mk = (id: 'L' | 'R', z: number): Capsule => ({ id, label: id === 'L' ? 'left' : 'right', p: { x: c.x, y: c.y, z: c.z + z }, dir: { x: 1, y: 0, z: 0 }, pattern: 'omni', route: id, levelDb: 0 });
  return [mk('L', -bMm / 2), mk('R', bMm / 2)];
}

/** Δt right − left (ms) for a source: + = the RIGHT capsule hears it later. */
export function baselineDt(caps: readonly Capsule[], src: Vec3): number {
  return dtLR(caps, src);
}

/** Which capsule hears it first ('L', 'R' or 'both' within `tolMs`). */
export function firstHeard(caps: readonly Capsule[], src: Vec3, tolMs = 0.005): 'L' | 'R' | 'both' {
  const dt = dtLR(caps, src);
  if (Math.abs(dt) <= tolMs) return 'both';
  return dt > 0 ? 'L' : 'R';
}

/** Each capsule's arrival (ms) — the ensemble family's own function. */
export function baselineArrivals(caps: readonly Capsule[], src: Vec3) {
  return arrivals(caps, src);
}

/** The source's mirror across the baseline's line (the z axis through the
 *  baseline's centre, at its height): x flips about the centre. */
export function mirrorOf(src: Vec3, c: Vec3 = { x: 0, y: 0, z: 0 }): Vec3 {
  return { x: 2 * c.x - src.x, y: src.y, z: src.z };
}

/** The highest frequency (Hz) a uniform line array with element spacing `dMm` keeps free of spatial aliasing. */
export function lambdaHalf(dMm: number, tempC = 20): number {
  if (!Number.isFinite(dMm) || dMm <= 0) return Number.NaN;
  return speedOfSoundAir(tempC) / (2 * (dMm / 1000));
}

/** The largest spacing (mm) that keeps a uniform line array alias-free up to `fHz`. */
export function spacingFor(fHz: number, tempC = 20): number {
  if (!Number.isFinite(fHz) || fHz <= 0) return Number.NaN;
  return (speedOfSoundAir(tempC) / (2 * fHz)) * 1000;
}

/** The intensity probe's spacer presets (mm) — PROBE-SPACER (one maker's set). */
export const SPACERS_MM = [12, 25, 50] as const;

/** The share of the flow a p–p probe reads along its axis at incidence θ (deg): cos θ. */
export function axialShare(thetaDeg: number): number {
  const c = Math.cos((thetaDeg * Math.PI) / 180);
  return Math.abs(c) < 1e-12 ? 0 : c;
}

/** The reference pressures (Pa) and what they do — and do not — mean (DOSITS-AW). */
export const WATER_AIR = {
  waterRefPa: 1e-6,
  airRefPa: 20e-6,
  /** The references alone: 20·log10(20 µPa / 1 µPa). */
  refGapDb: 20 * Math.log10(20e-6 / 1e-6),
  /** Equal intensities in water and in air differ by about this much in all (DOSITS-AW). */
  equalIntensityDb: 61.5,
} as const;

/** A sample rate keeps a band up to `fHz` only if it is more than twice it. */
export function nyquistOk(sampleRateHz: number, fHz: number): boolean {
  return sampleRateHz > 2 * fHz;
}
