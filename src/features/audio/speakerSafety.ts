/**
 * speakerSafety — low-frequency protection for the built-in phone speaker.
 *
 * WHY: phone micro-speakers (~10–15 mm drivers) can't reproduce much below
 * ~300 Hz — fed a low tone or low-heavy noise at level, the driver tries to
 * over-EXCURSE to make bass it physically can't, which distorts and, sustained
 * at volume, can DAMAGE it. The Learning Labs deliberately generate low
 * fundamentals (Harmonic Lab down to 60 Hz; Oscillator/Harmonograph 110 Hz) and
 * low-slope noise (brown/pink) — exactly the danger zone.
 *
 * WHAT: the native generator has no high-pass (Generator.hpp), so this applies a
 * client-side low-frequency LEVEL roll-off — a tone/mixture is pulled DOWN in
 * level as its lowest significant frequency drops below the knee. Attenuating
 * level cuts driver excursion (the failure mode) proportionally at ANY device
 * volume, and — because it scales the whole signal — it preserves relative
 * timbre, so the analytic displays/measurements (which read the model, not the
 * output) stay truthful. Honesty (§1.7): the reduction is disclosed to the user,
 * not hidden.
 *
 * INTERIM: this is the client-side guard. The COMPLETE fix is a native output
 * high-pass on the generator bus, ideally output-route-aware (full range on
 * headphones, protected on the built-in speaker) — tracked for the next EAS
 * build. See project-learning-lab-v4 memory / docs.
 */

/** Full level at/above this fundamental (Hz); the roll-off begins below it —
 *  chosen near the built-in-speaker low-frequency limit. */
export const SAFE_KNEE_HZ = 300;
/** Maximum attenuation is reached at/below this frequency (Hz). */
export const SAFE_FLOOR_HZ = 40;
/** How far the level is pulled down at/below the floor (dB). */
export const SAFE_MAX_ATTEN_DB = 18;

/**
 * Attenuation (≤ 0 dB) for tonal content whose lowest significant frequency is
 * `hz`: 0 dB at/above the knee, −SAFE_MAX_ATTEN_DB at/below the floor, with
 * log-frequency interpolation between (excursion rises with falling frequency,
 * so the guard deepens toward the bottom).
 */
export function lowFreqGuardDb(hz: number): number {
  if (!Number.isFinite(hz) || hz >= SAFE_KNEE_HZ) return 0;
  if (hz <= SAFE_FLOOR_HZ) return -SAFE_MAX_ATTEN_DB;
  const frac =
    (Math.log2(hz) - Math.log2(SAFE_FLOOR_HZ)) /
    (Math.log2(SAFE_KNEE_HZ) - Math.log2(SAFE_FLOOR_HZ));
  return -(1 - frac) * SAFE_MAX_ATTEN_DB;
}

/**
 * A speaker-safe generator level (dBFS) for a tone/mixture whose lowest
 * significant frequency is `hz`. Pass the fundamental for a single tone, or the
 * lowest sounding harmonic for a mixture (conservative: the fundamental is fine).
 */
export function safeToneLevelDb(baseDb: number, hz: number): number {
  return baseDb + lowFreqGuardDb(hz);
}

/**
 * Fixed per-noise-color attenuation (dB). Broadband noise has no single
 * frequency, so it's guarded by spectral slope: the low-slope colors (pink,
 * brown) pile energy into the sub-bass the speaker can't handle; white/blue/
 * violet sit mid-to-high and are safe as-is.
 */
export const NOISE_GUARD_DB: Record<string, number> = {
  white: 0,
  pink: -6,
  brown: -14,
  blue: 0,
  violet: 0,
};

/** A speaker-safe generator level (dBFS) for a noise color key. */
export function safeNoiseLevelDb(baseDb: number, colorKey: string): number {
  return baseDb + (NOISE_GUARD_DB[colorKey] ?? 0);
}

/** True when a frequency is low enough that the guard is meaningfully engaged
 *  (useful for showing the disclosure only when it applies). */
export function isGuardEngaged(hz: number): boolean {
  return Number.isFinite(hz) && hz < SAFE_KNEE_HZ;
}

/** Shared honest disclosure — the built-in speaker can't reproduce the lowest
 *  frequencies, and the guard attenuates them. */
export const LOW_FREQ_ADVISORY =
  'Low frequencies are reduced to protect the phone speaker — use headphones for the full low end.';
