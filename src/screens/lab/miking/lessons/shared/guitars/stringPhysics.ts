/**
 * THE IDEAL PLUCKED STRING (LESSON_JOURNEY §7: "standing waves on a string —
 * a model to add, pure and tested, before it is drawn"). Pure arithmetic.
 *
 * A string fixed at both ends (the saddle and the nut, or a fret) vibrates in
 * shapes sin(nπs), s = position / length: shape n has n − 1 still points and
 * a pitch n times the lowest — whole numbers, which is why a string sounds
 * "pitched" where a drumhead's shapes (1, 1.59, 2.14 …) do not.
 *
 * A pluck at fraction p of the length (measured from the saddle) sets shape n
 * moving in proportion to how much the string moves there in that shape:
 * |sin(nπp)| of its peak — so a pluck at the exact middle (p = ½, the 12th
 * fret on an open string) leaves every even shape still. For the textbook
 * triangular pluck the shapes' amplitudes are
 *     a_n = 2 sin(nπp) / (n² π² p (1 − p))      (× the pluck's height)
 * — a pluck nearer the bridge gives the upper shapes relatively more.
 * An IDEAL string: no stiffness, no losses, rigid ends. Real strings, bridges
 * and tops change every number; the lab says so where it shows them.
 */

/** Shape n's displacement at s (0 … 1), peak 1. */
export function modeShape(n: number, s: number): number {
  return Math.sin(n * Math.PI * s);
}

/** How much the string moves at the pluck point in shape n (0 … 1 of its peak). */
export function pluckShare(n: number, p: number): number {
  return Math.abs(Math.sin(n * Math.PI * p));
}

/** The textbook triangular pluck: shape n's amplitude, per unit pluck height. */
export function pluckAmplitude(n: number, p: number): number {
  return (2 * Math.sin(n * Math.PI * p)) / (n * n * Math.PI * Math.PI * p * (1 - p));
}

/** Shape n's amplitude relative to shape 1's for a pluck at p (signed). */
export function relativeToLowest(n: number, p: number): number {
  return pluckAmplitude(n, p) / pluckAmplitude(1, p);
}

/** The still points of shape n (fractions of the length, ends excluded). */
export function stillPoints(n: number): number[] {
  const out: number[] = [];
  for (let k = 1; k < n; k++) out.push(k / n);
  return out;
}

/** Shape n's pitch as a multiple of the lowest (an ideal string: n). */
export function ratio(n: number): number {
  return n;
}

/** The string's shape at s for a triangular pluck at p, rebuilt from its
 *  first `count` shapes (tests: it returns the triangle). */
export function pluckSum(p: number, s: number, count = 200): number {
  let y = 0;
  for (let n = 1; n <= count; n++) y += pluckAmplitude(n, p) * modeShape(n, s);
  return y;
}

/** The string's lengths when fretted: fret n leaves L·2^(−n/12) vibrating. */
export function frettedLength(L: number, fret: number): number {
  return L * Math.pow(2, -fret / 12);
}
