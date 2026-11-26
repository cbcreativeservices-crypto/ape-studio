/**
 * FIGURE V2 — THE TROMBONE'S RIGHT (SLIDE) HAND, SEEN FROM ABOVE (A02; the bass trombone's the same hold).
 * Owner 2026-11-25, "batches by family". (The trombone's horn and its braces are NOT redrawn here — hands only.)
 *
 * WHAT THE HAND DOES (the real technique): it holds the outer slide's brace lightly, as a pencil — the THUMB's pad on
 * the brace's near side, the INDEX and MIDDLE fingers curled round its far side, the ring and little fingers curled
 * loosely beside them; the wrist relaxed, the hand pointing up from a forearm that rises from the elbow below.
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's right is DOWN the page):
 * the hand stands up under the slide, so from above we look down on its top: the wrist leaving the cuff, the hand's
 * index-finger side running forward to the knuckles, the four fingers rising up the page toward the slide side by
 * side (the index on top, nearest us; the middle, ring and little fingers beyond it to the right), each end curling
 * over toward the brace with its NAIL facing up; the THUMB on the left of the index, bent at its middle joint, its end
 * lying forward against the brace's near side, its nail facing up. In the lesson the slide's tubes cross over the
 * fingers' ends.
 *
 * Frame: page millimetres in the A02 picture from above (slide at 1st), origin on the centre of the figure's cuff rim,
 * u right (toward the crook), v DOWN the page (toward the player's right). The slide's two legs lie one over the other
 * along v = −39 (u from −28 on); the brace, seen end-on, at (30, −39). The posed pads (brassPosture.ts, unchanged):
 * index and middle (39, −47), thumb (17, −36).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import { digitPoly, type BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });
const UP = -Math.PI / 2;

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(-0.555, -0.832);

const BODY: Poly = pts([
  // the wrist from the cuff, its lower (back-of-hand) side running forward
  [-24, 16], [-12.6, 22.6], [3.6, 26.6], [21.6, 27.8], [39.6, 24.8], [55.6, 18.8], [69.4, 10.4], [79.4, 2],
  // the little finger's outer side rising to its end
  [86.6, -7.4], [90.4, -18.4], [90.6, -30], [88.4, -40.4],
  // the little and ring fingers' ends curling over, their nails up
  [84.6, -48.6], [78.6, -54.6], [71, -56.8], [64.4, -53.6],
  // the parting to the middle finger, its end beside the index's
  [61.4, -46], [58.4, -49.6], [52.4, -55], [45, -57.6], [37.6, -56.4], [32.4, -51.6],
  // the index's inner (thumb-side) edge back down toward the web
  [32.6, -42.4], [36.4, -32], [38.6, -21], [37.6, -12.6],
  // the web, then the hand's thumb side back to the wrist (the thumb itself is joined in below)
  [31.6, -15.4], [24, -9], [12, -3.6], [0, 0.4], [-12, 4.4], [-22, 9],
]);

/** The thumb: the thickest digit, from its mound by the wrist, a soft bend, its end lying forward against the brace. */
const THUMB = digitPoly(pts([[-6, -2], [-13.4, -12.6], [-15.4, -23.4], [-9.4, -32.4], [1.6, -37.6], [13.4, -40.2]]), [12.6, 12.2, 11.6, 11, 10.4, 9.8]);

export const BRASS_HAND_TROMBONE_SLIDE_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  union: [THUMB],
  lines: [
    // the partings between the fingers (clear at the ends, fading back toward the knuckles)
    pts([[47.6, -38], [47.4, -24], [45.2, -10], [41.4, 4]]),
    pts([[61.4, -44.6], [61, -30], [58.4, -16], [54.4, -2]]),
    pts([[74.4, -44.6], [75.2, -30], [72.6, -16], [67.4, -4]]),
    // the thumb's edge where it leaves the hand (fading toward the wrist)
    pts([[24.6, -30.6], [14, -26], [4, -20], [-4, -12]]),
  ],
  creases: [
    // the folds over the middle joints
    pts([[42.6, -14.6], [47.6, -12.6], [51.6, -13.4]]),
    pts([[55.4, -17], [59.4, -15], [63, -15.6]]),
    pts([[73.6, -14.6], [77.6, -12.6], [81.2, -13.4]]),
    // the thumb's middle joint
    pts([[-19.6, -30.4], [-14.4, -27.4], [-10.2, -22.4]]),
  ],
  nails: [
    { c: P(39.2, -51.4), len: 6.4, w: 8.6, rot: UP, k: 0.8 },
    { c: P(54.2, -51.4), len: 6, w: 8, rot: UP, k: 0.6 },
    { c: P(72.2, -51.4), len: 6, w: 8, rot: UP + 0.2, k: 0.8 },
    { c: P(83.4, -45.4), len: 5.6, w: 7, rot: UP + 0.5, k: 0.7 },
    { c: P(14.4, -42.4), len: 9.4, w: 8, rot: -0.2, k: 0.85 },
  ],
  broad: [E(30, 6, 30, 16, -0.3)],
  lights: [
    // along each finger's left (lit) side
    E(41, -28, 2.6, 13, 0.1), E(53, -30, 2.6, 13, 0.1), E(66, -30, 2.4, 12, 0.15), E(80, -26, 2.2, 11, 0.25),
    // the thumb along its top
    E(-12, -24, 3, 9, 0.4), E(4, -38, 8, 2.6, -0.3),
  ],
  swells: [E(33, 8, 6, 4, -0.3), E(48, 3, 6, 4, -0.4), E(61, -3, 5.4, 3.6, -0.5), E(71, -9, 4.6, 3.2, -0.6)],
  shades: [E(36, 22, 34, 7, -0.25)],
  darks: [
    // the partings, the thumb going in under the index
    E(47, -24, 1.6, 12, 0.05), E(60.4, -26, 1.6, 12, 0.08), E(73.6, -26, 1.6, 12, 0.15), E(14, -28, 10, 2, -0.5),
  ],
};
