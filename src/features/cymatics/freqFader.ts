/**
 * freqFader — the Chladni studio's FREQ fader map (TestFlight build 32,
 * owner: "the plate is not responding and changing its pattern when I'm
 * moving the frequency slider").
 *
 * WHY: the fader spans 30 Hz – 3 kHz (two decades) on a ~300-pt lane, so one
 * point of travel is ~1.5 % of frequency. A metal plate's resonance is far
 * narrower than that — aluminum at the default damping has Q ≈ 570, a
 * half-power bandwidth of ~0.2 %. On a plain log fader the default plate read
 * AT RESONANCE at 0 of 301 lane positions: every drag stepped straight over
 * every mode, the sand only shivered, and the figure never changed.
 *
 * WHAT: a monotonic, piecewise-linear warp of the fader. Around each
 * excitable mode the fader gets a short zone (±ZONE_TRAVEL of travel, a few
 * points either side of where the mode always sat) in which the frequency
 * walks slowly across the resonance (±1/Q — the band where the plate really
 * responds); the travel between modes is compressed a little to pay for it.
 * Every frequency stays reachable, the readout always shows the exact
 * frequency being driven, and the physics is untouched: nothing here changes
 * a mode, a Q or a response — only how finely the finger moves near a mode.
 */
import type { PlateMode } from './plateModes';

/** Half-width of a mode's zone, as a fraction of fader travel (≈ ±6.5 pt on a 300-pt lane). */
export const ZONE_TRAVEL = 0.022;

export type FreqFader = {
  /** Fader position 0..1 → drive frequency in Hz. */
  hzAt: (pos: number) => number;
  /** Drive frequency → fader position 0..1 (the exact inverse of hzAt). */
  posOf: (hz: number) => number;
};

/**
 * Build the warp for one plate. `modes` is the plate's mode list; only the
 * excitable ones (drive > 0.05, the same rule as the sweep and the mode
 * chooser) inside [fMin, fMax] get a zone.
 */
export function makeFreqFader(fMin: number, fMax: number, modes: PlateMode[], Q: number): FreqFader {
  const span = Math.log(fMax / fMin);
  const u = (hz: number) => Math.log(Math.max(fMin, Math.min(fMax, hz)) / fMin) / span;
  const hzOfU = (x: number) => fMin * Math.exp(Math.max(0, Math.min(1, x)) * span);
  // Frequency half-width of the slow zone, in normalised log units: ±1/Q.
  const eQ = Math.log(1 + 1 / Math.max(1, Q)) / span;
  // Mode centres in log units; modes closer than 1/Q (degenerate or nearly
  // so) respond together, so they share one zone at their midpoint.
  const centres: number[] = [];
  for (const c of modes
    .filter((m) => m.drive > 0.05 && m.hz > fMin && m.hz < fMax)
    .map((m) => u(m.hz))
    .sort((a, b) => a - b)) {
    const last = centres[centres.length - 1];
    if (last !== undefined && c - last < eQ) centres[centres.length - 1] = (last + c) / 2;
    else centres.push(c);
  }
  const n = centres.length;
  // Zone half-width on the fader; shrinks only if a plate has a great many modes.
  const GAP = 0.004; // ≈ 1 pt of plain travel left between neighbouring zones
  const Z = Math.min(ZONE_TRAVEL, (1 - GAP * (n + 1)) / (2 * Math.max(1, n)));
  // Each zone sits where its mode sat on the plain fader; modes closer than a
  // zone apart (e.g. 516 / 538 Hz on the default rectangle) are spread just
  // enough that each keeps a full zone — pushed right, pushed left, and the
  // two averaged, so a cluster spreads about its own middle.
  const d = 2 * Z + GAP;
  const lo = Z + GAP;
  const hi = 1 - Z - GAP;
  const right = centres.slice();
  const left = centres.slice();
  for (let i = 0; i < n; i++) right[i] = Math.max(centres[i], i === 0 ? lo : right[i - 1] + d);
  for (let i = n - 1; i >= 0; i--) left[i] = Math.min(centres[i], i === n - 1 ? hi : left[i + 1] - d);
  const pc = centres.map((_, i) => Math.max(lo, Math.min(hi, (right[i] + left[i]) / 2)));
  // Knots (p = fader position, x = normalised log frequency), increasing in both.
  const P: number[] = [0];
  const X: number[] = [0];
  centres.forEach((c, i) => {
    const room = Math.min(c - (i === 0 ? 0 : centres[i - 1]), (i === n - 1 ? 1 : centres[i + 1]) - c);
    const e = Math.min(eQ, room * 0.45);
    P.push(pc[i] - Z, pc[i] + Z);
    X.push(c - e, c + e);
  });
  P.push(1);
  X.push(1);
  const interp = (from: number[], to: number[], v: number) => {
    const t = Math.max(0, Math.min(1, v));
    let k = 1;
    while (k < from.length - 1 && from[k] < t) k++;
    const a = from[k - 1];
    const b = from[k];
    return b > a ? to[k - 1] + ((t - a) / (b - a)) * (to[k] - to[k - 1]) : to[k];
  };
  return {
    hzAt: (pos) => hzOfU(interp(P, X, pos)),
    posOf: (hz) => interp(X, P, u(hz)),
  };
}
