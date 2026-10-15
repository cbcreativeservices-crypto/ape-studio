/**
 * seeItMath — the pure analysis behind SeeItView's spectrum plots, React-free
 * so it is unit-tested in Node (test/earCombSeeIt_20261014).
 *
 * Every number comes from the SAME buffers the learner heard — Welch-averaged
 * Hann FFT frames of the clip itself. Nothing here is drawn in by hand.
 */
import { powerSpectrumDb, SR, type Mono } from '../../../features/ear/earDsp.ts';

export const SEE_IT_FFT = 4096;

/** Welch power per FFT bin (summed over `nFrames` Hann frames spread evenly
 *  across the clip, skipping the edge fades). `maxFrames` 8 is the default
 *  view; a DIFFERENCE view (M13 comb, emulator pass 2026-10-14) takes up to
 *  48 — every frame at 50 % overlap on a 2.4 s clip — because 8 frames of a
 *  sparse drum clip left the trace too grassy to show the comb's notches. */
export function welchPower(x: Mono, maxFrames: number, fft = SEE_IT_FFT): { acc: Float64Array; nFrames: number } {
  const usable = x.length - fft - 960;
  const nFrames = usable > 0 ? Math.min(maxFrames, 1 + Math.floor(usable / (fft / 2))) : 1;
  const acc = new Float64Array(fft / 2);
  for (let f = 0; f < nFrames; f++) {
    const offset = usable > 0 ? 480 + Math.floor((f * usable) / Math.max(1, nFrames - 1)) : 0;
    const { db } = powerSpectrumDb(x, fft, offset);
    for (let i = 0; i < acc.length; i++) acc[i] += Math.pow(10, db[i] / 10);
  }
  return { acc, nFrames };
}

/** Bins where the reference clip is this far below its own loudest bin carry
 *  too little energy for a ratio to mean anything — left as a gap (null),
 *  never a made-up value. */
export const DIFF_FLOOR_DB = -70;

/**
 * The measured ratio of two clips' Welch power, per FFT bin, 0…maxHz — for a
 * filter applied to the same source, the filter's own response (the source's
 * spectrum cancels).
 */
export function powerRatioDb(of: Float64Array, ref: Float64Array, maxHz: number, fft = SEE_IT_FFT): { hz: number[]; db: (number | null)[] } {
  const binHz = SR / fft;
  let refMax = 0;
  for (let i = 1; i < ref.length; i++) if (ref[i] > refMax) refMax = ref[i];
  const floor = refMax * Math.pow(10, DIFF_FLOOR_DB / 10);
  const hz: number[] = [];
  const db: (number | null)[] = [];
  for (let i = 1; i < ref.length && i * binHz <= maxHz; i++) {
    hz.push(i * binHz);
    db.push(ref[i] > floor && of[i] > 0 ? 10 * Math.log10(of[i] / ref[i]) : null);
  }
  return { hz, db };
}
