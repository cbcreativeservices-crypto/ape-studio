/**
 * The drawn motion speed of the Foundations air / cone / waveform views
 * (owner 2026-11-25, fix-first round 2: "motion speed stops changing below
 * 110 Hz and above 1760 Hz").
 *
 * ONE stated monotonic mapping over the lab's whole tone range:
 *
 *   drawn Hz = 0.45 + 0.2875 × log2(f ÷ 110)      for 55 Hz ≤ f ≤ 8 kHz
 *
 * i.e. 0.45 Hz of rocking at 110 Hz and +0.2875 Hz for every octave up
 * (−0.2875 for every octave down). It is the SAME line `visHzFor` draws
 * between 110 and 1760 Hz (0.45 + 1.15 × log(f/110)/log(16)), so every screen
 * that stays inside that band moves exactly as before; the line simply no
 * longer stops at its ends. 55 Hz (the lowest tone a Foundations control
 * reaches: M6 and the Playground) rocks at 0.1625 Hz, 8 kHz (the top of M9
 * and the Playground sweep) at about 2.23 Hz. Outside 55 Hz – 8 kHz no
 * control goes; the value holds there only so a stray input can never turn
 * the motion backwards.
 *
 * Pure (no React Native, no Skia) so node tests can import it; the
 * 'worklet' directive lets the sweep's frame callback call it per frame.
 */
export const MOTION_LO_HZ = 55;
export const MOTION_HI_HZ = 8000;
/** Drawn Hz at 110 Hz, and the step per octave. */
export const MOTION_AT_110 = 0.45;
export const MOTION_PER_OCTAVE = 1.15 / 4;

export function motionHzFor(freqHz: number): number {
  'worklet';
  const f = Math.max(MOTION_LO_HZ, Math.min(MOTION_HI_HZ, freqHz));
  return MOTION_AT_110 + MOTION_PER_OCTAVE * Math.log2(f / 110);
}

/** The Playground's log sweep (the generator's own law, Generator.hpp
 *  SweepLog: f = start · (end/start)^phase, phase 0→1 over `secs`, repeating)
 *  at `t` seconds after the sweep (re)started. */
export function sweepHzAt(t: number, startHz: number, endHz: number, secs: number): number {
  'worklet';
  const s = Math.max(0.05, secs);
  const ph = ((t % s) + s) % s / s;
  return startHz * Math.pow(endHz / startHz, ph);
}
