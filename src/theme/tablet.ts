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

/**
 * The width of ONE tile when `cols` tiles and their gaps share `available`.
 * Floored, so a flex-wrap row can never be a fraction of a pixel too wide and
 * drop its last tile onto a row of its own (the Tools hub's 2026-09-13 lesson).
 */
export function tileSpan(available: number, cols: number, gap: number): number {
  const c = Math.max(1, Math.floor(cols));
  return Math.max(0, Math.floor((available - gap * (c - 1)) / c));
}

/**
 * MY GALLERY on a tablet (owner iPad report 2026-10-06: "Trophy images in 'My
 * Gallery' need to expand much larger and take up more of the screen. They
 * stay small."). The gallery already gained columns on 2026-09-29, but each
 * card kept its 48 pt phone badge, so an iPad showed four 239 pt cards each
 * holding a postage stamp. On a tablet the trophy art now FILLS its card's
 * width; the column count comes from the live window.
 *
 * Phone: exactly the old layout (two columns, 48 pt art) — `art` is null and
 * the caller keeps its fixed 48.
 *
 * `windowW` is the live window width; the screen's scroll padding is 16 a
 * side on a phone, 24 on a tablet; cards are 14 pt padded inside.
 */
export const GALLERY_PHONE_ART = 48;
export function galleryLayout(windowW: number, windowH: number): { cols: number; pad: number; gap: number; tileW: number; art: number | null } {
  if (!isTabletWindow(windowW, windowH)) {
    const pad = 16;
    const gap = 12;
    const cols = gridColumns(windowW - pad * 2, 220, gap, 2, 4);
    return { cols, pad, gap, tileW: tileSpan(windowW - pad * 2, cols, gap), art: null };
  }
  const pad = 24;
  const gap = 16;
  const avail = windowW - pad * 2;
  // 210 pt minimum tile: 3 across an iPad mini (744 → 221 pt cards), 4 on a
  // 13" portrait, 5 in landscape — every one far bigger than the phone's 48 pt
  // badge. (230 left a portrait iPad mini at two columns.)
  const cols = gridColumns(avail, 210, gap, 2, 6);
  const tileW = tileSpan(avail, cols, gap);
  return { cols, pad, gap, tileW, art: Math.max(GALLERY_PHONE_ART, tileW - 28) };
}

/**
 * The single-trophy VIEWER (Trophy screen, opened from the gallery). 150 pt on
 * a phone, as always; on a tablet the art scales with the short edge so a
 * trophy opened on an iPad is not a 150 pt stamp in a 1024 pt room.
 */
export const TROPHY_VIEWER_PHONE = 150;
export function trophyViewerSize(windowW: number, windowH: number): number {
  if (!isTabletWindow(windowW, windowH)) return TROPHY_VIEWER_PHONE;
  // Leave the title and the Back button their room under the art.
  return Math.round(Math.min(Math.min(windowW, windowH) * 0.6, windowH - 320, 640));
}
