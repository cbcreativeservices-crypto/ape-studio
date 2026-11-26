/**
 * FIGURE V2 — THE TUBA'S RIGHT (VALVE) HAND, SEEN FROM THE PLAYER'S RIGHT (A04a, bell up).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the right hand plays the four top-action piston valves. It comes over the
 * pistons from the player's right, the fingers ARCHED and spread to reach the widely spaced pearl buttons — index on
 * the 1st (nearest the player), middle on the 2nd, ring on the 3rd, little finger on the 4th — each pressing with its
 * pad; the THUMB hooks into the thumb ring on the player's side of the 1st valve, which steadies the hand (the left
 * hand and the lap carry the tuba). The wrist is level and relaxed, the back of the hand up and out to the right.
 *
 * WHAT THE EYE SEES FROM THE PLAYER'S RIGHT (this drawing): the back of the hand above the valve block, a broad plane
 * leaving the cuff; the knuckles in a row along its far edge; the four fingers coming DOWN from them, spread, each
 * bending at its middle joint and turning its end in under it onto its button (index and middle leaning back toward
 * the player, ring and little fingers reaching forward), the nails seen from their side as the ends press down; the
 * THUMB, the thickest digit, going straight down at the left into the ring, its end bent a little forward. The
 * fingers flow out of the hand: one outline round the whole.
 *
 * Frame: page millimetres in the A04a picture from the player's right (bell up), origin on the centre of the figure's
 * cuff rim, u right (toward the audience), v DOWN. The four buttons' tops at v ≈ 41, centres u −5, 31, 66, 102; the
 * thumb ring round (10, 61). The posed pads (lowBrassHands.ts, unchanged): (−5, 33), (31, 33), (66, 33), (102, 33);
 * the thumb (6, 60).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import { digitPoly, type BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.651, -0.759);

/** The back of the hand and the palm's edge below it (the digits are joined into it). */
const BODY: Poly = pts([
  [-24, -12], [-14.6, -27.6], [0, -36.6], [18, -40.6], [36, -40.6], [52, -36.4], [66, -28.4], [78, -18.4], [86.6, -8.4], [89.4, 1.6],
  [84.6, 9.6], [74.6, 15.4], [60, 19], [44, 20.4], [28, 19.6], [14, 15.4], [4, 6], [-4, -2], [-14, -6],
]);

/** Each finger's centre line (knuckle → middle joint → end on its button) and half-widths, authored on the pose. */
// (each end drawn pressing ON its button's top, v ≈ 41: the pad's centre a little lower than the posed one)
const INDEX = digitPoly(pts([[37, -18], [31.6, -1], [24.6, 13], [14.6, 25.4], [3.6, 32.4], [-3.6, 34.6]]), [9.8, 9.6, 9.2, 8.6, 8, 7.6]);
const MIDDLE = digitPoly(pts([[53, -12], [57.4, 3], [59.6, 17], [55, 29.6], [44, 36.4], [33.6, 36.6]]), [10, 9.8, 9.4, 8.8, 8.2, 7.8]);
const RING = digitPoly(pts([[64.6, -4], [77.4, 0.6], [88.6, 9], [88, 22.4], [80.4, 31.4], [68.6, 35.2]]), [9.4, 9.2, 8.8, 8.4, 7.8, 7.4]);
const LITTLE = digitPoly(pts([[72.6, 3.4], [85.6, 3.6], [96.6, 7], [103.2, 17.4], [103.6, 28.4], [102.2, 35]]), [8.6, 8.4, 8, 7.4, 7, 6.6]);
/** The thumb: the thickest digit, straight down into the ring, a slight bend at its middle joint. */
const THUMB = digitPoly(pts([[-7, -6], [-5, 10], [-3.6, 25], [-1.6, 40], [1.6, 51], [6, 59.6]]), [13.4, 12.6, 11.8, 11, 10.4, 9.6]);

export const BRASS_HAND_TUBA_VALVE_SIDE: BrassHandArt = {
  fore: FORE,
  body: BODY,
  union: [INDEX, MIDDLE, RING, LITTLE, THUMB],
  lines: [
    // where the fingers part at their roots (fading up into the back of the hand)
    pts([[46.4, 6], [45.6, -2], [45, -10]]),
    pts([[66.6, 13], [63.6, 4], [61, -4]]),
    pts([[84.6, 13.4], [79.4, 9], [74, 4]]),
    // the thumb's edge along the hand (fading up)
    pts([[10.4, 20], [7.6, 10], [5.4, 0], [3, -8]]),
  ],
  creases: [
    // the folds over the middle joints (on the finger's back, where it bends)
    pts([[18.6, 8.4], [22.6, 11.6], [24.4, 16]]),
    pts([[52.6, 15.4], [57.4, 15.8], [61.6, 14]]),
    pts([[84.4, 3.4], [88.6, 6], [90.4, 10.4]]),
    pts([[99, 13.6], [102.6, 14.2], [105.4, 12.6]]),
    pts([[-11, 33.6], [-5.6, 33.4], [-0.6, 31.6]]),
  ],
  nails: [
    // each end pressing down on its button: the nail on its upper side, seen from the side
    { c: P(0.6, 27.6), len: 9, w: 6, rot: Math.PI - 0.2, k: 0.45 },
    { c: P(37.6, 30.2), len: 9, w: 6, rot: Math.PI - 0.1, k: 0.45 },
    { c: P(72.4, 29.2), len: 8.6, w: 5.8, rot: Math.PI - 0.2, k: 0.45 },
    { c: P(108.4, 29), len: 8, w: 5.2, rot: Math.PI / 2 + 0.15, k: 0.45 },
    // the thumb's nail on its outer side
    { c: P(13.4, 55.6), len: 10, w: 6.4, rot: 1.15, k: 0.5 },
  ],
  broad: [E(30, -22, 32, 16, 0.15)],
  lights: [
    // the back of the hand's upper plane; each finger's upper (lit) side as it comes down
    E(24, -30, 26, 4, 0.05), E(28, 4, 2.6, 10, 0.4), E(51, 6, 2.6, 10, -0.2), E(78, 0, 8, 2.4, 0.3), E(92, 2, 7, 2, 0.15),
    // the thumb's left (lit) side
    E(-12, 18, 2.6, 16, -0.05),
  ],
  swells: [E(38, -24, 7, 4, 0.2), E(54, -18, 7, 4, 0.3), E(66, -10, 6, 3.6, 0.45), E(75, -2, 5, 3, 0.6)],
  shades: [E(44, 14, 26, 6, 0.05)],
  darks: [
    // each finger's underside as it turns down onto the button
    E(9, 34, 7, 1.8, -0.4), E(46, 39, 7, 1.8, -0.2), E(79, 36, 7, 1.8, -0.3), E(98, 30, 2, 6, 0.1),
    // the thumb's right side
    E(9, 34, 2.4, 14, -0.05),
  ],
};
