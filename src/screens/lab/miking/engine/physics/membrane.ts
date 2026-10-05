/**
 * HOW IT SOUNDS — the IDEAL CLAMPED MEMBRANE, for drawing (LESSON_JOURNEY §6
 * stage 2). Pure; tested. No new physics: the Bessel function and the J_n zero
 * table are the Cymatics Lab's (features/cymatics/plateModes.ts besselJ,
 * features/cymatics/faraday.ts J_ZEROS) — the same tables the Drum Tuning
 * Lab's MODE_RATIOS read, so the three labs agree.
 *
 *   shape   W_ns(r, θ) = J_n(j_ns · r) · cos(n θ),  r = radius / R ∈ [0, 1]
 *   ratio   f_ns / f_01 = j_ns / j_01   (1, 1.594, 2.136, 2.296, 2.653 …)
 *   strike  a point strike sets a shape moving in proportion to how much the
 *           head moves AT THE STRIKE POINT in that shape: none at all on a
 *           still (nodal) line. The cos(nθ) shape is taken oriented with an
 *           antinode toward the strike (the orientation a point strike
 *           excites). `strikeShare` = |W at the strike| ÷ the shape's own peak.
 *
 * Simplifications (said on screen): an ideal membrane, in a vacuum, with no
 * air loading, no second head and no bending stiffness — a real head's
 * ratios shift (the air and the other head pull the low shapes; the Drum
 * Tuning Lab models the two-head coupling).
 */
import { besselJ } from '../../../../../features/cymatics/plateModes';
import { J_ZEROS } from '../../../../../features/cymatics/faraday';

export type HeadShape = { n: number; s: number; j: number; ratio: number; label: string; still: string };

function stillWords(n: number, s: number): string {
  const d = n === 0 ? '' : `${n} still line${n === 1 ? '' : 's'} across`;
  const c = s - 1 === 0 ? '' : `${s - 1} still ring${s - 1 === 1 ? '' : 's'}`;
  return [d, c].filter(Boolean).join(' and ') || 'no still lines — the whole head moves together';
}

/** The first five shapes, ascending: (0,1) (1,1) (2,1) (0,2) (3,1). */
export const HEAD_SHAPES: readonly HeadShape[] = (() => {
  const j01 = J_ZEROS[0][0];
  const all: HeadShape[] = [];
  for (let n = 0; n < J_ZEROS.length; n++) {
    for (let si = 0; si < J_ZEROS[n].length; si++) {
      const j = J_ZEROS[n][si];
      all.push({ n, s: si + 1, j, ratio: j / j01, label: `(${n},${si + 1})`, still: stillWords(n, si + 1) });
    }
  }
  all.sort((a, b) => a.ratio - b.ratio);
  return all.slice(0, 5);
})();

/** The unnormalised shape value at (r, θ), r ∈ [0, 1]. */
export function shapeAt(sh: Pick<HeadShape, 'n' | 'j'>, r: number, theta: number): number {
  if (r > 1) return 0;
  return besselJ(sh.n, sh.j * Math.max(0, r)) * Math.cos(sh.n * theta);
}

const peakCache = new Map<string, number>();
/** The largest |J_n(j r)| over r ∈ [0, 1] (the shape's own peak). */
export function shapePeak(sh: Pick<HeadShape, 'n' | 'j'>): number {
  const key = `${sh.n}:${sh.j}`;
  const hit = peakCache.get(key);
  if (hit != null) return hit;
  let pk = 0;
  for (let i = 0; i <= 400; i++) pk = Math.max(pk, Math.abs(besselJ(sh.n, (sh.j * i) / 400)));
  peakCache.set(key, pk);
  return pk;
}

/** 0..1: how much of the shape's peak motion sits under a strike at radius
 *  fraction `rFrac`, with the shape oriented toward the strike. */
export function strikeShare(sh: Pick<HeadShape, 'n' | 'j'>, rFrac: number): number {
  const pk = shapePeak(sh);
  return pk > 0 ? Math.min(1, Math.abs(besselJ(sh.n, sh.j * Math.max(0, Math.min(1, rFrac)))) / pk) : 0;
}

/** Radii (fractions of R) of the still RINGS: the interior zeros of J_n. */
export function stillRings(sh: Pick<HeadShape, 'n' | 's'>): number[] {
  const zs = J_ZEROS[sh.n];
  const j = zs[sh.s - 1];
  return zs.slice(0, sh.s - 1).map((z) => z / j);
}

/** Angles (radians, from the strike direction) of the still DIAMETERS. */
export function stillDiameters(sh: Pick<HeadShape, 'n'>): number[] {
  if (sh.n === 0) return [];
  return Array.from({ length: sh.n }, (_, k) => ((2 * k + 1) * Math.PI) / (2 * sh.n));
}

/** The lowest (0,1) shape's radial profile, normalised to 1 at the centre:
 *  the side-view outline of a head moving in its lowest shape. */
export function lowestProfile(r: number): number {
  return besselJ(0, J_ZEROS[0][0] * Math.min(1, Math.abs(r)));
}
