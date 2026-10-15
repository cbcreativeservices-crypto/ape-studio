/**
 * Console-fader taper — the position ↔ dB scale of a mixing-console level
 * fader (HOLD item #7, owner default 2026-10-14: "switch to a mixing-console
 * style scale").
 *
 * A console fader is not linear in dB: unity (0 dB) sits about three
 * quarters of the way up, the top quarter is +10 dB of gain, and the scale
 * opens out near unity (≈10 dB per segment) and closes up toward the bottom,
 * where the fader runs out to OFF. The reference scale (position 0..1):
 *
 *   +10 dB → 1.00     0 dB → 0.75    −10 → 0.55    −20 → 0.40
 *   −30 → 0.28        −40 → 0.18     −60 → 0.08    OFF (−∞) → 0
 *
 * A fader whose range is narrower (a send that tops out at +6 dB, a wedge
 * send that bottoms out at −30 dB) uses the same scale between its own ends,
 * stretched so its min sits at 0 and its max at 1 — every value stays
 * reachable and the whole travel stays useful. A min at or below −60 dB is
 * the console's OFF floor (−∞), so it sits at 0.
 *
 * Pure and piecewise linear: posToDb and dbToPos are strictly increasing and
 * exact inverses of each other (to floating-point) on [min, max] ↔ [0, 1].
 */

/** The reference scale: [dB, position] knots, ascending. */
export const CONSOLE_TAPER: readonly (readonly [number, number])[] = [
  [-60, 0.08],
  [-40, 0.18],
  [-30, 0.28],
  [-20, 0.4],
  [-10, 0.55],
  [0, 0.75],
  [10, 1],
];

/** The engine's OFF floor: at or below it a fader reads OFF (−∞). */
export const TAPER_OFF_DB = -60;

/** Position of `db` on the reference scale (extrapolated past either end
 *  along the end segment's slope). */
function refPos(db: number): number {
  const K = CONSOLE_TAPER;
  if (db <= K[0][0]) {
    const [d0, p0] = K[0];
    const [d1, p1] = K[1];
    return p0 + ((db - d0) * (p1 - p0)) / (d1 - d0);
  }
  for (let i = 1; i < K.length; i++) {
    const [d1, p1] = K[i];
    if (db <= d1) {
      const [d0, p0] = K[i - 1];
      return p0 + ((db - d0) * (p1 - p0)) / (d1 - d0);
    }
  }
  const [d0, p0] = K[K.length - 2];
  const [d1, p1] = K[K.length - 1];
  return p1 + ((db - d1) * (p1 - p0)) / (d1 - d0);
}

/** The knots of one fader's scale, [dB, position], ascending in both:
 *  its min at 0, its max at 1, the reference knots strictly between. */
export function faderKnots(min: number, max: number): [number, number][] {
  if (!(max > min)) return [[min, 0], [max, 1]];
  // A min on (or under) the OFF floor is −∞: it sits at the bottom of the
  // travel. A min above it sits where the reference scale puts it.
  const lo = min <= TAPER_OFF_DB ? 0 : refPos(min);
  const hi = refPos(max);
  // A fader that lives wholly below the floor has no console scale: linear.
  if (!(hi > lo)) return [[min, 0], [max, 1]];
  const raw: [number, number][] = [[min, lo]];
  for (const [d, p] of CONSOLE_TAPER) if (d > min && d < max) raw.push([d, p]);
  raw.push([max, hi]);
  const span = hi - lo;
  return raw.map(([d, p]) => [d, (p - lo) / span]);
}

/** dB (continuous, unsnapped) at lane position p on a [min, max] fader. */
export function posToDb(p: number, min: number, max: number): number {
  const K = faderKnots(min, max);
  const x = Math.max(0, Math.min(1, p));
  if (x <= 0) return min;
  if (x >= 1) return max;
  for (let i = 1; i < K.length; i++) {
    const [d1, p1] = K[i];
    if (x <= p1) {
      const [d0, p0] = K[i - 1];
      return d0 + ((x - p0) * (d1 - d0)) / (p1 - p0);
    }
  }
  return max;
}

/** Lane position (0..1) of `db` on a [min, max] fader (clamped). */
export function dbToPos(db: number, min: number, max: number): number {
  const K = faderKnots(min, max);
  const v = Math.max(min, Math.min(max, db));
  if (v <= min) return 0;
  if (v >= max) return 1;
  for (let i = 1; i < K.length; i++) {
    const [d1, p1] = K[i];
    if (v <= d1) {
      const [d0, p0] = K[i - 1];
      return p0 + ((v - d0) * (p1 - p0)) / (d1 - d0);
    }
  }
  return 1;
}

/** dB at lane position p, snapped to `step` (1 dB on the console) and kept
 *  inside [min, max]. */
export function posToDbSnapped(p: number, min: number, max: number, step = 1): number {
  const raw = posToDb(p, min, max);
  const snapped = Math.round(raw / step) * step;
  return Math.max(min, Math.min(max, Number(snapped.toFixed(6))));
}
