/**
 * Delay Alignment (Wave module 11) readout words — pure, so the rules are
 * testable without React (lab fix round 2026-11-14, G1b_WaveLab.md module 11).
 *
 * Two things a beginner saw contradict each other on the bezel:
 *  1. "SUM −0.1 dB" (looks perfect) while "OFF BY −8.02 ms" at XOVER 117 Hz.
 *     Physics: 8.02 ms is ~0.94 of the 8.55 ms period, so the two arrivals ARE
 *     in step at that one frequency — one whole cycle apart. The sum is right;
 *     it needs a word that says so.
 *  2. The REQ key vanished at 14.98 ms: a 5-digit value did not fit the cell
 *     (BezelReadouts drops the key of a value too wide, D36). Values of 10 ms
 *     and more print to 0.1 ms on the bezel, so the key stays (the well's
 *     table keeps 0.01 ms).
 */

/**
 * Coverage (Wave module 9) "vs ON-AXIS" — G1b: the number "stuck" at −12.0 dB
 * for every out-of-beam seat. That is the model's floor, not a measurement:
 * waveEngine.directivityGain never goes below 0.25 (−12 dB) behind or beside
 * the box. At the floor the readout says "≤ −12 dB" (at least 12 dB down:
 * outside the beam) instead of printing the floor as if it were the seat's
 * level. No sub line: a line that comes and goes would make the strip jump.
 */
export const COVERAGE_FLOOR_GAIN = 0.25;
export function vsOnAxisReadout(vsOnDb: number, gainAtSeat: number): { v: string; outside: boolean } {
  if (gainAtSeat <= COVERAGE_FLOOR_GAIN + 1e-6) return { v: '≤ −12 dB', outside: true };
  return { v: `${vsOnDb > -0.05 ? '0.0' : vsOnDb.toFixed(1)} dB`, outside: false };
}

/** A bezel millisecond value: 0.01 ms below 10 ms, 0.1 ms from 10 ms up. */
export function bezelMs(v: number, signed = false): string {
  const sign = signed && v >= 0 ? '+' : '';
  const s = Math.abs(v) >= 9.995 ? v.toFixed(1) : v.toFixed(2);
  return `${sign}${s} ms`;
}

/** How many whole cycles the main is off at `freq` (0 = the same cycle). */
export function cyclesOff(mismatchMs: number, freq: number): number {
  const periodMs = 1000 / freq;
  return Math.abs(Math.round(mismatchMs / periodMs));
}

/**
 * The SUM cell's word line.
 *  - 'OUT OF STEP'  — the pair loses 1 dB or more against perfect addition;
 *  - 'IN STEP'      — they add, and the delay is right for this seat;
 *  - 'N CYCLE(S) OFF' — they add at THIS frequency only: the main is a whole
 *    number of cycles early or late (move XOVER and it falls apart);
 *  - 'LUCKY FLIP'   — they add only because the main's polarity is flipped
 *    (half a cycle at every frequency happens to suit this seat and XOVER).
 */
export function sumVerdict(p: { sumDb: number; mismatchMs: number; freq: number; inverted: boolean }): string {
  if (p.sumDb <= -1) return 'OUT OF STEP';
  if (p.inverted) return 'LUCKY FLIP';
  const n = cyclesOff(p.mismatchMs, p.freq);
  if (n === 0) return 'IN STEP';
  return `${n} CYCLE${n === 1 ? '' : 'S'} OFF`;
}
