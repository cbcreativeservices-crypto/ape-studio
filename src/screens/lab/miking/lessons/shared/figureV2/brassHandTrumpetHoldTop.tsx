/**
 * FIGURE V2 — THE TRUMPET'S LEFT (HOLDING) HAND, SEEN FROM ABOVE (A01; the flugelhorn's the same hold).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the left hand holds the trumpet: it wraps round the valve casings, the palm
 * against their left side, the index, middle and ring fingers curled round the front of the 3rd casing, the little
 * finger curled below them, the THUMB on the 1st valve slide's saddle under the bell tube. The wrist is bent forward so
 * the hand reaches round the valve block.
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's LEFT is UP the page):
 * the hand stands on its edge beside the valve block, so from above we see the back of the hand as a narrow band
 * leaving the cuff and turning forward, its index-finger edge nearest us; the fingers curl DOWN the page round the
 * valve block (the index on top, its end coming round the 3rd casing, its nail seen from the side; the middle, ring and
 * little fingers' bends showing beyond it, the little finger's end and nail lowest on the right); the thumb under the
 * hand's left part, bent at its middle joint, its end lying forward along the saddle with its nail facing up.
 * In the lesson the bell tube and the leadpipe lie over the middle of the fingers.
 *
 * Frame: page millimetres in the A01 picture from above, origin on the centre of the LEFT cuff's rim, u right, v DOWN
 * the page (toward the player's right). The casings' caps (end-on): (20, 71), (46, 71), (72, 71), radius 12; the bell
 * tube runs across at v ≈ 51…63, the leadpipe at v = 91. The posed pads (brassPosture.ts, unchanged): index, middle,
 * ring (86, 85); little curled (114, 76); thumb (27, 50).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.439, 0.898);

const BODY: Poly = pts([
  // the wrist's upper (back-of-hand) side, from just inside the cuff
  [19.4, -15], [23, -7.4],
  // the back of the hand, a narrow band turning forward to the knuckles
  [34, -6.6], [50, -3.4], [66, 0.8], [81, 5.8], [94, 11.6], [102.6, 18.4],
  // the middle, ring and little fingers' bends beyond the index, down the right
  [110.6, 26.4], [117.4, 35], [120.6, 45], [120.2, 55], [121, 65], [118.4, 75.6], [113.2, 82.6],
  // the curled ends meeting under the 3rd casing
  [104.4, 86.2], [95.4, 90.4], [87, 92.4],
  // the index's end, its inner edge rising round the casing
  [81, 88], [78.8, 80], [80.8, 67], [82, 55], [81, 46.2],
  // the palm's inner edge (against the valve block) back to the thumb's web
  [76, 38.4], [64, 33], [50, 29.4], [42, 28.2],
  // the web, the thumb's upper edge out to its end lying forward on the saddle
  [37, 32.8], [31.4, 39.6], [35.4, 43.6], [38.4, 49.4], [35.6, 55.6],
  // the thumb's lower edge back to its middle joint (a soft bend) and its base
  [26.4, 59.8], [14.4, 59.4], [3.4, 56.4], [-5, 50.4], [-12, 42.4], [-17.6, 33.2], [-20.6, 22.4],
  // the wrist's lower side into the cuff
  [-23, 12], [-25, 4],
]);

/** The index finger, on top of the others: painted again over them (its own soft outline). */
// (about 19 mm across, narrowing to its end: a finger, not a hook)
const INDEX: Poly = pts([
  [68, 10.6], [78.6, 14.4], [88.6, 25.4], [95.6, 38.6], [99.2, 52], [99.4, 65], [96.4, 77.4], [91.4, 88], [85.6, 92.6], [80.6, 89.6], [79.4, 81], [81.6, 69.4], [82.4, 57.4], [80.6, 46], [75.6, 35.4], [68.4, 26.6], [62.6, 19.6],
]);

export const BRASS_HAND_TRUMPET_HOLD_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  pieces: [INDEX],
  lines: [
    // the partings between the middle, ring and little fingers' bends (fading back toward the knuckles)
    pts([[106.6, 60], [106, 46], [103, 32], [98, 22]]),
    pts([[113.6, 72], [113, 56], [110, 40], [105, 27]]),
    pts([[118.4, 80], [119, 66], [117, 50], [112, 34]]),
    // the thumb's edge where it goes in under the palm (fading)
    pts([[37, 33], [26, 31], [14, 27], [2, 22]]),
  ],
  creases: [
    // the folds over the index's middle and end joints
    pts([[93.6, 48], [97.6, 51], [99, 55]]),
    pts([[91.6, 69.4], [95.6, 71], [97.6, 74.4]]),
    // the thumb's middle joint
    pts([[-6, 38], [-2, 42], [-1, 47]]),
  ],
  nails: [
    // the index's nail seen from its side as its end comes round the casing; the little finger's; the thumb's facing up
    { c: P(92.6, 80.4), len: 9.6, w: 6.4, rot: 1.93, k: 0.6 },
    { c: P(117.4, 72.4), len: 8, w: 5.6, rot: 1.75, k: 0.55 },
    { c: P(29.2, 50.4), len: 10.4, w: 8, rot: 0.18, k: 0.9 },
  ],
  broad: [E(52, 8, 30, 12, 0.2)],
  lights: [
    // the back of the hand's upper band, the index's top, the thumb's top; the bends beyond the index
    E(48, -0.6, 20, 2.6, 0.2), E(91, 40, 2.8, 13, -0.45), E(10, 47, 10, 3, 0.2), E(110, 36, 2.4, 8, -0.6), E(116, 50, 2.2, 8, -0.2), E(118, 66, 2, 7, 0),
  ],
  swells: [E(74, 8, 6, 3.4, 0.3), E(88, 14, 5, 3, 0.4), E(100, 22, 4.4, 2.6, 0.6)],
  shades: [E(54, 22, 24, 7, 0.25)],
  darks: [
    // under the thumb; the fingers beyond the index in its shade
    E(16, 58, 10, 2, 0.1), E(103, 52, 3, 14, 0.05),
  ],
};
