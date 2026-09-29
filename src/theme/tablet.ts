/**
 * tablet — the ONE test for "is this a tablet layout", shared by every
 * surface that sizes itself differently on an iPad (owner 2026-09-29, tablet
 * pass: "tablet users are getting a premium experience on their larger
 * display").
 *
 * The rule is the SHORT edge of the live window, so it holds in both
 * orientations: an iPad mini's short edge is 744, the widest phone's is 430.
 * 600 sits between them with room either side — the same threshold the Home
 * deck's `useCardDims()` has used since 2026-09-26.
 *
 * Always read it from `useWindowDimensions()` (rotation and Split View change
 * the answer on a tablet); never from `Dimensions.get` at module scope. The
 * hook form is `useIsTablet()` in ./useIsTablet — kept out of this file so the
 * pure rules here import cleanly into node tests.
 *
 * ✅ NO PIXEL MOVES ON ANY PHONE: every caller keeps its phone constants and
 * only takes a tablet branch when this returns true.
 */
export const TABLET_SHORT_EDGE = 600;

export function isTabletWindow(width: number, height: number): boolean {
  return Math.min(width, height) >= TABLET_SHORT_EDGE;
}

/**
 * How many columns a grid of tiles should have at `available` width: as many
 * as fit at `minTile` wide (gaps included), never fewer than `phoneCols` and
 * never more than `maxCols`. On a phone this returns `phoneCols` exactly:
 * callers pass the phone's own column count as the floor and a `minTile` too
 * wide for a phone to fit more columns than that.
 */
export function gridColumns(available: number, minTile: number, gap: number, phoneCols: number, maxCols: number): number {
  const fit = Math.floor((available + gap) / (minTile + gap));
  return Math.max(phoneCols, Math.min(maxCols, fit));
}
