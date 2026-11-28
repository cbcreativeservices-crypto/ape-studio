/**
 * FIGURE V2 — THE TUBA'S RIGHT (VALVE) HAND, SEEN FROM ABOVE (A04a, bell up).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the fingers arch over the four top-action pistons, spread to reach the
 * pearl buttons — index on the 1st (nearest the player) … little finger on the 4th — each pressing with its pad; the
 * THUMB hooks into the thumb ring on the player's side of the 1st valve. The wrist level, the back of the hand up.
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's right is DOWN the page):
 * the back of the hand, broad, leaving the cuff and running up the page toward the valve block; the four knuckles in a
 * slanting row; the fingers arching on from them and curling back toward the player over the buttons, each end turned
 * down onto its button (seen end-on from above: the end of each finger, its nail toward the player, only a sliver);
 * the THUMB, the thickest digit, going up the page on the left into the thumb ring, its nail on its upper side.
 *
 * Frame: page millimetres in the A04a picture from above (bell up), origin on the centre of the figure's cuff rim,
 * u right (toward the audience), v DOWN the page (toward the player's right). The four buttons (end-on) on v = −97 at
 * u −4, 32, 68, 104; the thumb ring round (9, −111). The posed pads (lowBrassHands.ts, unchanged): (−3, −97),
 * (33, −96), (68, −97), (104, −97); the thumb (8, −110).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import { digitPoly, type BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.97, -0.243);

const BODY: Poly = pts([
  [-6, 26], [-10, 8], [-12, -10], [-11.6, -30], [-6, -50], [4, -68], [17.6, -84], [31.6, -96.4], [45, -99.6], [57.6, -94],
  [69, -82], [80.6, -67], [88, -53.6], [84, -38], [70.6, -20], [53, -2.4], [38, 10.6], [24, 18.6], [8, 24],
]);

const INDEX = digitPoly(pts([[40, -90], [33.4, -100], [25.4, -104.6], [14, -103.6], [3, -99.6], [-3, -97.4]]), [9.8, 9.6, 9.2, 8.6, 8, 7.6]);
const MIDDLE = digitPoly(pts([[55.6, -86], [60.4, -100], [60.6, -110.4], [51.6, -111], [42, -104.6], [34.4, -97.6]]), [10, 9.8, 9.4, 8.8, 8.2, 7.8]);
const RING = digitPoly(pts([[67.6, -74], [81.6, -87.6], [93, -100], [88.6, -107.4], [78.6, -104.6], [69.6, -98.6]]), [9.4, 9.2, 8.8, 8.4, 7.8, 7.4]);
const LITTLE = digitPoly(pts([[74.6, -57], [88, -68], [99.4, -80], [104.6, -88.6], [105, -94.6], [104.2, -98]]), [8.6, 8.4, 8, 7.4, 7, 6.6]);
const THUMB = digitPoly(pts([[-4, -32], [-3, -50], [-1.4, -68], [0, -84], [2.6, -98], [7.6, -108]]), [13.4, 12.6, 11.8, 11, 10.4, 9.6]);

export const BRASS_HAND_TUBA_VALVE_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  union: [INDEX, MIDDLE, RING, LITTLE, THUMB],
  lines: [
    // where the fingers part (clear between the arches, fading back into the hand toward the knuckles)
    pts([[44.4, -112], [47.6, -103], [48.4, -94], [47.6, -86]]),
    pts([[66.6, -106], [64.4, -96], [62, -86], [59.4, -77]]),
    pts([[93.4, -94], [86, -84], [79.4, -74], [73.4, -64]]),
    // the thumb's edge along the hand (short, fading)
    pts([[11.6, -86], [9.6, -76], [8.6, -66]]),
  ],
  creases: [
    pts([[23, -98], [26.6, -102], [28.4, -106.6]]),
    pts([[55.4, -106.6], [60, -105], [64, -106.4]]),
    pts([[88, -99.6], [91.6, -96.6], [95.6, -96.2]]),
    pts([[98, -84.6], [101.6, -83.6], [104.6, -85.4]]),
    pts([[-8, -74], [-2, -72.6], [4.6, -74]]),
  ],
  nails: [
    // the ends turned down onto the buttons: each nail toward the player, a sliver; the thumb's on its upper side
    { c: P(-4.6, -100.6), len: 7, w: 6, rot: Math.PI, k: 0.4 },
    { c: P(32.4, -100.8), len: 7, w: 6, rot: Math.PI, k: 0.4 },
    { c: P(67.4, -101.4), len: 7, w: 5.8, rot: Math.PI, k: 0.4 },
    { c: P(100.6, -98.6), len: 6.4, w: 5.2, rot: Math.PI - 0.6, k: 0.4 },
    { c: P(4.2, -104), len: 10, w: 8, rot: -1.2, k: 0.85 },
  ],
  broad: [E(36, -44, 30, 26, -0.6)],
  lights: [
    // along each finger's left (lit) side as it arches
    E(30, -103, 8, 2.4, 0.4), E(57, -102, 2.4, 8, 0.3), E(84, -92, 2.4, 9, -0.7), E(92, -76, 2.2, 8, -0.7),
    // the thumb's left (lit) side
    E(-12, -66, 2.6, 18, 0.03),
  ],
  swells: [E(40, -86, 6.4, 4, -0.6), E(55, -80, 6.4, 4, -0.7), E(66, -69, 6, 3.6, -0.7), E(74, -54, 5, 3.4, -0.7)],
  shades: [E(60, -24, 22, 12, -0.7)],
  darks: [
    // the partings between the arches; the arches' undersides; the thumb's right side
    E(47, -98, 2, 10, 0.05), E(63, -92, 2, 10, 0.2), E(84, -80, 2, 10, 0.7),
    E(18, -96, 7, 1.8, 0.3), E(48, -97, 6, 1.8, 0.4), E(80, -96, 6, 1.8, -0.2), E(10, -76, 2.2, 10, 0.03),
  ],
};
