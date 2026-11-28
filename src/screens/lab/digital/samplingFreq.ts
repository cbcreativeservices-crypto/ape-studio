/**
 * SAMPLING module FREQ fader ↔ the input tone in Hz (owner 2026-11-25,
 * fix-first 15, item 14). Pure, so the test loads it directly.
 *
 * The input tone is kept in HZ. The fader's top end depends on the RATE (so
 * the sweep can cross Nyquist at studio rates), and the fader used to keep its
 * POSITION when RATE changed, so a new rate silently moved the tone (1 kHz at
 * 48k read 914 / 786 / 691 / 522 Hz at 32k / 22.05k / 16k / 8k). Now RATE
 * leaves the tone where the student set it; the fader just shows the same Hz
 * at its new position. Only a tone above the new top end is lowered, to that
 * top, and the screen says so in words (`clampedFrom`).
 */

/** The fader's bottom end, at every rate. */
export const SAMPLING_F_MIN = 100;

/** The fader's top end: 0.75 × the rate, at most 30 kHz; the per-cycle demo modes stop at 8 kHz. */
export function samplingFreqMax(mode: { kind: 'abs'; fs: number } | { kind: 'cyc'; mult: number }): number {
  return mode.kind === 'abs' ? Math.min(mode.fs * 0.75, 30000) : 8000;
}

/** Fader position 0..1 → Hz (log travel, whole Hz). */
export function samplingFreqOf(v: number, fMax: number): number {
  const c = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  return Math.round(SAMPLING_F_MIN * Math.pow(fMax / SAMPLING_F_MIN, c));
}

/** Hz → fader position 0..1 on this rate's range. */
export function samplingPosOf(fHz: number, fMax: number): number {
  const v = Math.log(fHz / SAMPLING_F_MIN) / Math.log(fMax / SAMPLING_F_MIN);
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

/** A new RATE: keep the tone; lower it only if it is above the new top end. */
export function samplingFreqOnRate(fHz: number, fMax: number): { fHz: number; clampedFrom: number | null } {
  const top = samplingFreqOf(1, fMax); // the fader's own top value, whole Hz
  return fHz > top ? { fHz: top, clampedFrom: fHz } : { fHz, clampedFrom: null };
}
