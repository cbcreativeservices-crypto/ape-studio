/**
 * eqMath — tiny shared helpers for the EQ Lab modules (owner spec 2026-08-07).
 * Q ↔ bandwidth-in-octaves uses the standard peaking-filter relation
 * 1/Q = 2·sinh(ln2/2 · BWoct) — the SAME numbers a console readout shows, so
 * the dual "Q · Bandwidth (oct)" displays the spec mandates stay honest.
 */
import { levelColor } from '../../../../features/tools/levelColor';

/** Bandwidth in octaves for a peaking filter of quality Q. */
export function bwOctFromQ(q: number): number {
  return (2 / Math.LN2) * Math.asinh(1 / (2 * q));
}

/** Quality Q for a peaking filter of the given bandwidth in octaves. */
export function qFromBwOct(bw: number): number {
  return 1 / (2 * Math.sinh((Math.LN2 / 2) * bw));
}

/** 0..1 slider position → 20 Hz…20 kHz (log-even). */
export const fFromNorm = (t: number) => 20 * Math.pow(1000, Math.max(0, Math.min(1, t)));
/** 20 Hz…20 kHz → 0..1 slider position (log-even). */
export const normFromF = (f: number) => Math.log(f / 20) / Math.log(1000);

/** Console-style frequency readout: "63 Hz" · "1.00 kHz" · "12.5 kHz". */
export function fmtHz(f: number): string {
  if (f >= 10000) return `${(f / 1000).toFixed(1)} kHz`;
  if (f >= 1000) return `${(f / 1000).toFixed(2)} kHz`;
  return `${Math.round(f)} Hz`;
}

// ---- MIDI level colour for gain/level (owner 2026-08-07) --------------------
// Amplitude everywhere in the lab uses the app MIDI ramp. Owner rule: BELOW the
// zero-crossing (a cut / negative level) stays BLUE — the ramp only warms for
// POSITIVE level (boost). So 0 dB and below → blue; positive → green…red.
export function gainColor(db: number, maxDb = 18): string {
  return levelColor(Math.max(0, db) / Math.max(1, maxDb));
}

// ---- Variable-slope Butterworth magnitudes ---------------------------------
/** n-th order Butterworth high-pass magnitude (dB): slope = order × 6 dB/oct.
 *  Analog-prototype form — the display-honest generalization of fxViz's fixed
 *  12 dB/oct `butterworthHighPassDb`. */
export function butterworthHpDb(f0: number, f: number, order: number): number {
  const r2n = Math.pow(f / f0, 2 * order);
  return 10 * Math.log10(Math.max(r2n / (1 + r2n), 1e-12));
}
/** n-th order Butterworth low-pass magnitude (dB). */
export function butterworthLpDb(f0: number, f: number, order: number): number {
  const r2n = Math.pow(f / f0, 2 * order);
  return 10 * Math.log10(Math.max(1 / (1 + r2n), 1e-12));
}

// ---- Biquad evaluation (fs matches fxViz's display-eval FS = 48 kHz) --------
export type BiquadCoeffs = { b0: number; b1: number; b2: number; a1: number; a2: number };
const FS = 48000;

/** |H(e^jω)| in dB for one biquad (mirror of fxViz's internal evaluator). */
export function biquadMagDb(c: BiquadCoeffs, f: number, fs = FS): number {
  const w = (2 * Math.PI * f) / fs;
  const cos1 = Math.cos(w), sin1 = Math.sin(w);
  const cos2 = Math.cos(2 * w), sin2 = Math.sin(2 * w);
  const nr = c.b0 + c.b1 * cos1 + c.b2 * cos2;
  const ni = -(c.b1 * sin1 + c.b2 * sin2);
  const dr = 1 + c.a1 * cos1 + c.a2 * cos2;
  const di = -(c.a1 * sin1 + c.a2 * sin2);
  const mag2 = (nr * nr + ni * ni) / Math.max(dr * dr + di * di, 1e-24);
  return 10 * Math.log10(Math.max(mag2, 1e-12));
}

/** ∠H(e^jω) in DEGREES for one biquad — the phase the minimum-phase filter
 *  really applies (the "EQ changes more than amplitude" lesson). */
export function biquadPhaseDeg(c: BiquadCoeffs, f: number, fs = FS): number {
  const w = (2 * Math.PI * f) / fs;
  const cos1 = Math.cos(w), sin1 = Math.sin(w);
  const cos2 = Math.cos(2 * w), sin2 = Math.sin(2 * w);
  const nr = c.b0 + c.b1 * cos1 + c.b2 * cos2;
  const ni = -(c.b1 * sin1 + c.b2 * sin2);
  const dr = 1 + c.a1 * cos1 + c.a2 * cos2;
  const di = -(c.a1 * sin1 + c.a2 * sin2);
  return ((Math.atan2(ni, nr) - Math.atan2(di, dr)) * 180) / Math.PI;
}

/** RBJ notch coefficients (unity skirts, null at f0) — the one shape fxViz
 *  doesn't carry; same cookbook, same normalization. */
export function rbjNotch(f0: number, q: number, fs = FS): BiquadCoeffs {
  const w = (2 * Math.PI * f0) / fs;
  const cw = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  return { b0: 1 / a0, b1: (-2 * cw) / a0, b2: 1 / a0, a1: (-2 * cw) / a0, a2: (1 - alpha) / a0 };
}

// ---- Graphic-EQ grids -------------------------------------------------------
/** ISO 1-octave graphic centers (the mobile-friendly 10-band board). */
export const OCT_CENTERS = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
/** ISO 1/3-octave centers, 20 Hz … 20 kHz (31 bands). */
export const THIRD_CENTERS = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250,
  1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000,
] as const;
/** Fixed bell width of a graphic band: 1 oct → Q≈1.41 · 1/3 oct → Q≈4.32. */
export const Q_1OCT = qFromBwOct(1);
export const Q_THIRD = qFromBwOct(1 / 3);

/** Combined ACTUAL response of a graphic EQ: the sum of real peaking filters
 *  at the board's fixed centers/width (this is the whole lesson-11 point). */
export function graphicActualDb(centers: readonly number[], gains: number[], q: number, f: number): number {
  let db = 0;
  for (let i = 0; i < centers.length; i++) {
    const g = gains[i];
    if (g !== 0) db += biquadMagDb(rbjPeakingLocal(centers[i], q, g), f);
  }
  return db;
}
/** Summed PHASE (degrees) of the same graphic board. */
export function graphicPhaseDeg(centers: readonly number[], gains: number[], q: number, f: number): number {
  let deg = 0;
  for (let i = 0; i < centers.length; i++) {
    const g = gains[i];
    if (g !== 0) deg += biquadPhaseDeg(rbjPeakingLocal(centers[i], q, g), f);
  }
  return deg;
}
// Local RBJ peaking (identical math to fxViz's export; kept here so the pure
// math module has no component-file import).
function rbjPeakingLocal(f0: number, q: number, gainDb: number, fs = FS): BiquadCoeffs {
  const A = Math.pow(10, gainDb / 40);
  const w = (2 * Math.PI * f0) / fs, cw = Math.cos(w), sw = Math.sin(w);
  const alpha = sw / (2 * q);
  const a0 = 1 + alpha / A;
  return {
    b0: (1 + alpha * A) / a0, b1: (-2 * cw) / a0, b2: (1 - alpha * A) / a0,
    a1: (-2 * cw) / a0, a2: (1 - alpha / A) / a0,
  };
}

/** The naïve "slider curve": straight lines through the slider positions on the
 *  log axis — what a beginner READS the board as. Flat beyond the end bands. */
export function sliderCurveDb(centers: readonly number[], gains: number[], f: number): number {
  const n = centers.length;
  if (f <= centers[0]) return gains[0];
  if (f >= centers[n - 1]) return gains[n - 1];
  for (let i = 0; i < n - 1; i++) {
    if (f <= centers[i + 1]) {
      const t = Math.log(f / centers[i]) / Math.log(centers[i + 1] / centers[i]);
      return gains[i] + t * (gains[i + 1] - gains[i]);
    }
  }
  return gains[n - 1];
}

// ---- Trainer reference spectrum --------------------------------------------
/** Smooth pink-ish program reference (−3 dB/oct through 1 kHz, gentle LF/HF
 *  shoulders) — the "healthy" spectrum the trainers alter and the student
 *  restores. Synthetic and labeled as such in every trainer. */
export function baseSpectrumDb(f: number): number {
  const tilt = -3 * Math.log2(f / 1000);
  const lfRoll = butterworthHpDb(35, f, 2); // stops the display at the floor
  const hfRoll = butterworthLpDb(16000, f, 2);
  return tilt * 0.6 + lfRoll + hfRoll;
}
