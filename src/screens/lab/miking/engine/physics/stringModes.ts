/**
 * THE IDEAL STRING (LESSON_JOURNEY §7, the strings row: "standing waves on a
 * string (fixed ends, harmonics) — a model to add, pure and tested, before it
 * is drawn"). Lab 4: the piano, the harp, the clavinet (and any string lesson
 * that wants it). Pure; worklets.
 *
 * A perfectly flexible string fixed at both ends, length L, vibrates in
 * shapes (modes) y_n(x) = sin(n·π·x / L), n = 1, 2, 3 …; shape n's pitch is n
 * times the lowest (whole-number ratios — unlike the drumhead's 1, 1.59,
 * 2.14 …); it has n − 1 still points (nodes) between the ends, at x = k·L/n.
 * A strike, a pluck or a pickup at the fraction s = x/L of the length meets
 * shape n in proportion to |sin(n·π·s)| — none at all on one of its still
 * points (the drum's strikeShare, for a string).
 *
 * HONESTY (simplifications register, Lab 4): a real string is STIFF, so its
 * upper shapes run slightly sharp of the whole numbers (a piano's most of
 * all); the ends are not perfectly rigid; the shapes decay. The pictures say
 * so once ("an ideal, flexible string"). Source keys: PHYS-STRING (standard
 * string physics, from standard texts), PHYS-ET (equal temperament,
 * acoustic_guitar/SOURCES.md §0).
 */

export type StringShape = {
  n: number;
  /** Pitch relative to the lowest shape (= n on the ideal string). */
  ratio: number;
  label: string;
  /** The still points in words. */
  still: string;
};

export const MAX_SHAPE = 8;

export const STRING_SHAPES: readonly StringShape[] = Array.from({ length: MAX_SHAPE }, (_, i) => {
  const n = i + 1;
  return {
    n,
    ratio: n,
    label: n === 1 ? '1 · lowest' : `${n}`,
    still: n === 1 ? 'no still point between the ends' : `${n - 1} still point${n - 1 === 1 ? '' : 's'} between the ends`,
  };
});

/** Displacement of shape n at the fraction s (0 … 1) of the length, −1 … 1. */
export function shapeAtFrac(n: number, s: number): number {
  'worklet';
  return Math.sin(n * Math.PI * s);
}

/** How strongly a strike / pluck / pickup at fraction s meets shape n (0 … 1). */
export function stringShare(n: number, s: number): number {
  'worklet';
  const v = Math.abs(Math.sin(n * Math.PI * s));
  return v < 1e-9 ? 0 : v;
}

/** Shape n's still points between the ends, as fractions of the length. */
export function stillPoints(n: number): number[] {
  const out: number[] = [];
  for (let k = 1; k < n; k++) out.push(k / n);
  return out;
}

/** Equal-tempered pitch of piano key k (A0 = key 1, A4 = key 49 = 440 Hz). */
export function keyFreq(k: number): number {
  return 440 * Math.pow(2, (k - 49) / 12);
}
