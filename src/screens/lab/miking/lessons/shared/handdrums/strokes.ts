/**
 * HAND-DRUM FAMILY — where a stroke lands, as physics (pure; tested).
 * How strongly a strike at `frac` of the radius drives each of the head's
 * first five shapes: strikeShare from the ideal membrane (the Cymatics /
 * Drum Tuning Bessel tables, engine/physics/membrane.ts). null = the stroke
 * is not on the head (a rim or a metal shell): no head shape is driven.
 */
import { HEAD_SHAPES, strikeShare } from '../../../engine/physics/membrane.ts';

export function strokeShares(frac: number | null): number[] {
  return HEAD_SHAPES.map((sh) => (frac == null ? 0 : strikeShare(sh, frac)));
}
