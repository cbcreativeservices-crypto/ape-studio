/**
 * The Gallery art board's WEIGHT lane (slider pass 2026-10-14).
 *
 * WHY: the lane mapped 0..1 straight onto 0..MAX_W px, but the figure draws a
 * line no thinner than 0.5 px (PatternFigure's floor), so the bottom ~10 % of
 * travel all drew the same hairline — the lane moved and nothing changed.
 *
 * WHAT: a short OFF detent at the bottom (0 = lines hidden), then the rest of
 * the travel walks evenly from 0.5 px (the thinnest line that draws) to MAX_W.
 * `weightOfPos` and `posOfWeight` are exact inverses on that range.
 */

/** Heaviest line, px at the reference width. */
export const LINE_MAX_W = 4;
/** Thinnest line that draws (matches PatternFigure's 0.5 px floor). */
export const LINE_MIN_W = 0.5;
/** Bottom of the lane that reads OFF. */
export const LINE_OFF_DETENT = 0.03;

/** Lane position 0..1 → line weight in px (0 = hidden), rounded to 0.1 px. */
export function weightOfPos(v: number): number {
  const t = Math.max(0, Math.min(1, v));
  if (t < LINE_OFF_DETENT) return 0;
  const w = LINE_MIN_W + ((t - LINE_OFF_DETENT) / (1 - LINE_OFF_DETENT)) * (LINE_MAX_W - LINE_MIN_W);
  return Math.round(w * 10) / 10;
}

/** Line weight in px → lane position 0..1. */
export function posOfWeight(w: number): number {
  if (!(w > 0)) return 0;
  const c = Math.max(LINE_MIN_W, Math.min(LINE_MAX_W, w));
  return LINE_OFF_DETENT + ((c - LINE_MIN_W) / (LINE_MAX_W - LINE_MIN_W)) * (1 - LINE_OFF_DETENT);
}
