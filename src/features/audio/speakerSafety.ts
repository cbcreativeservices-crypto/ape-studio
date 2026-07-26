/**
 * speakerSafety — low-frequency protection for the built-in phone speaker,
 * modeled as ONE explicit high-pass transfer function shared by everything.
 *
 * WHY: phone micro-speakers (~10–15 mm) can't reproduce much below ~300 Hz —
 * fed a low tone or low-heavy noise at level they OVER-EXCURSE trying to make
 * bass they physically can't, which distorts and, sustained at volume, can
 * DAMAGE the driver. The Learning Labs deliberately generate low fundamentals
 * (Harmonic Lab to 60 Hz; Oscillator/Harmonograph 110 Hz) and low-slope noise
 * (brown/pink) — the danger zone.
 *
 * HONESTY (§1.7, and this audience is technical): we do NOT hide the filter.
 * The SAME response `speakerGuardDb(f)` is used to (a) shape the audio, (b) drive
 * the native generator HPF, and (c) draw the "PHONE SPEAKER OUTPUT" overlay in
 * the readouts — so what you HEAR and what you SEE always agree, and the filter
 * curve is shown, never implied.
 *
 * THE FILTER: a 2nd-order Butterworth high-pass at `SPEAKER_HPF_HZ` (−3 dB at
 * the corner, −12 dB/octave below). |H(f)|² = r⁴ / (1 + r⁴), r = f / fc.
 *
 * ROUTE AWARENESS: the built-in speaker needs the filter; headphones/line-out
 * reproduce lows fine and have no excursion risk, so the filter is BYPASSED
 * there. Route detection is native (engine build with the route-aware HPF). On
 * engine builds without it, the client applies the filter unconditionally as a
 * SAFE default and discloses it (see the labs' PHONE SPEAKER OUTPUT note).
 */

import { ApeDsp } from '../../../modules/ape-dsp';

/** High-pass corner (Hz): −3 dB here, −12 dB/oct below. */
export const SPEAKER_HPF_HZ = 150;

/** engineVersion at which the NATIVE route-aware generator HPF takes over
 *  (route-aware, and it can filter broadband noise the JS path can't). AT/ABOVE
 *  this the client must NOT also apply its JS filter — that would double-filter;
 *  below it the JS filter is the interim protection. Must match the native
 *  EngineHub kEngineVersion for the HPF build. */
export const NATIVE_HPF_ENGINE_VERSION = 4;

/** True when the native HPF is present and owns the filtering. */
export function nativeHpfActive(): boolean {
  return ApeDsp.engineVersion() >= NATIVE_HPF_ENGINE_VERSION;
}
/** Butterworth order (2 = −12 dB/oct). Kept explicit so the native biquad and
 *  this JS response are the same filter. */
export const SPEAKER_HPF_ORDER = 2;

/**
 * The high-pass magnitude response in dB at frequency `f` (Hz), for the
 * protective filter. 0 dB well above the corner, −3 dB at the corner,
 * −12 dB/octave asymptote below. This is THE filter — audio, native, and
 * display all use it.
 */
export function speakerGuardDb(f: number, fc: number = SPEAKER_HPF_HZ): number {
  if (!Number.isFinite(f) || f <= 0) return -120; // DC → fully rejected
  const r = f / fc;
  const r2n = Math.pow(r, 2 * SPEAKER_HPF_ORDER); // r⁴ for order 2
  const mag2 = r2n / (1 + r2n); // |H|²
  return 10 * Math.log10(Math.max(mag2, 1e-12));
}

/** Linear gain (0..1) of the high-pass at `f`. */
export function speakerGuardGain(f: number, fc: number = SPEAKER_HPF_HZ): number {
  return Math.pow(10, speakerGuardDb(f, fc) / 20);
}

/**
 * A speaker-safe generator LEVEL (dBFS) for a single tone at `hz` — the filter's
 * value at that one frequency, so a pure sine is filtered exactly (honest: a
 * single-frequency signal filtered by H is just scaled by |H(f)|).
 */
export function safeToneLevelDb(baseDb: number, hz: number): number {
  return baseDb + speakerGuardDb(hz);
}

/**
 * Apply the high-pass to an ADDITIVE payload `[f0, a1..a12, p1..p12]` (the flat
 * layout ApeDsp.genSetAdditive takes): each harmonic n is scaled by the filter
 * gain at its frequency n·f0. This is a REAL per-partial high-pass, identical to
 * the displayed curve — the tonal labs' audio and their PHONE SPEAKER OUTPUT
 * view are the same filter. Phases (p1..p12) are untouched. Returns a new array.
 */
export function applySpeakerGuardToAdditive(payload: number[]): number[] {
  if (payload.length < 25) return payload.slice();
  const f0 = payload[0];
  const out = payload.slice();
  for (let n = 1; n <= 12; n++) {
    out[n] = payload[n] * speakerGuardGain(n * f0);
  }
  return out;
}

/**
 * Fixed per-noise-color attenuation (dB) — the INTERIM guard for broadband
 * noise, which can't be per-frequency filtered in JS (the samples are generated
 * natively). The low-slope colors (pink, brown) pile energy into the sub-bass;
 * white/blue/violet sit mid/high and are safe. The true per-frequency high-pass
 * on noise arrives with the native route-aware HPF; until then this level cut is
 * disclosed in the Noise lab.
 */
export const NOISE_GUARD_DB: Record<string, number> = {
  white: 0,
  pink: -6,
  brown: -14,
  blue: 0,
  violet: 0,
};

/** A speaker-safe generator level (dBFS) for a noise color key (interim guard). */
export function safeNoiseLevelDb(baseDb: number, colorKey: string): number {
  return baseDb + (NOISE_GUARD_DB[colorKey] ?? 0);
}

// ── Engine-aware wrappers — the labs call THESE so the client never double-
// filters. On the native-HPF build (engineVersion ≥ 4) they pass the signal
// through untouched (native filters, route-aware); below they apply the JS
// filter (interim protection). The DISPLAY still uses the raw response fns
// above unconditionally — the PHONE SPEAKER OUTPUT view always shows the filter.

/** Additive payload for the current engine: raw on ≥4, JS per-harmonic HPF below. */
export function guardAdditiveForEngine(payload: number[]): number[] {
  return nativeHpfActive() ? payload.slice() : applySpeakerGuardToAdditive(payload);
}

/** Tone level (dBFS) for the current engine: raw base on ≥4, JS-filtered below. */
export function guardToneLevelForEngine(baseDb: number, hz: number): number {
  return nativeHpfActive() ? baseDb : safeToneLevelDb(baseDb, hz);
}

/** Noise level (dBFS) for the current engine: raw base on ≥4, JS-guarded below. */
export function guardNoiseLevelForEngine(baseDb: number, colorKey: string): number {
  return nativeHpfActive() ? baseDb : safeNoiseLevelDb(baseDb, colorKey);
}

/** True when the filter is meaningfully engaged at `f` (below ~2× the corner) —
 *  used to decide whether to flag the disclosure. */
export function isGuardEngaged(hz: number): boolean {
  return Number.isFinite(hz) && hz < SPEAKER_HPF_HZ * 2;
}

/** Shared honest disclosure — the built-in speaker can't reproduce the lowest
 *  frequencies, and the guard high-passes them. */
export const LOW_FREQ_ADVISORY =
  `Low frequencies are high-passed (${SPEAKER_HPF_HZ} Hz, −12 dB/oct) to protect the phone speaker — ` +
  `use headphones for the full low end. Toggle PHONE SPEAKER OUTPUT to see exactly what the filter does.`;
