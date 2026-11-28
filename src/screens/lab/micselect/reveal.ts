/**
 * Bring a changed card into view (beginner waves 2026-11-15, MS-02; owner:
 * "build waves 1 thru 3", D62 adoption plan). Tapping a mic photo, a
 * characteristic chip or CHECK MY REASONING changed a card BELOW the fold,
 * with nothing to say so. The lab now scrolls just far enough for the card
 * to show. Pure: the tests reach it directly.
 */

/** A box on screen: its top (window y) and its height, in pt. */
export type Box = { y: number; h: number };

/**
 * How far to scroll DOWN (pt, never negative) so `card` shows inside `view`,
 * leaving `margin` at the edges. 0 when it already shows whole.
 *  - Below the fold: bring its foot into view, but never push its top above
 *    the top edge (a card taller than the view lines up with the top).
 *  - It only ever scrolls DOWN: what was tapped sits above the card, so a
 *    card whose top is at (or above) the top edge is left alone.
 */
export function revealDelta(card: Box, view: Box, margin = 12): number {
  if (!(card.h >= 0) || !(view.h > 0)) return 0;
  const top = card.y - view.y;
  const bottom = top + card.h;
  if (bottom <= view.h - margin) return 0;
  return Math.max(0, Math.min(bottom - (view.h - margin), top - margin));
}
