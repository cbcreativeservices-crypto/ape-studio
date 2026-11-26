/**
 * FIGURE V2 — THE EUPHONIUM'S LEFT HAND ON THE 4th (SIDE) VALVE, SEEN FROM ABOVE (A04b, bell up).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the euphonium's 4th valve stands on the side of the instrument, facing the
 * player's left; the left hand reaches round to it and plays it with the INDEX finger's pad on its pearl button, the
 * other fingers resting loosely curled on the body beside it, the thumb free (the lap and the right hand's thumb ring
 * carry the instrument).
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's LEFT is UP the page):
 * the back of the hand leaving the cuff and running forward and down the page to its knuckles; the middle, ring and
 * little fingers fanned out forward, loosely curled, their ends turning up the page with their NAILS facing us; the
 * INDEX coming up from under them to the side valve's button, its end and its nail (seen from its side) showing above
 * the little finger. The thumb lies under the hand and is not seen.
 *
 * Frame: page millimetres in the A04b picture from above (bell up), origin on the centre of the LEFT cuff's rim, u right
 * (toward the audience), v DOWN the page (toward the player's right). The 4th valve's button (seen from its side, its
 * face toward the page's top) at (102, −6). The posed pads (lowBrassHands.ts, unchanged): index (102, 2); the others
 * resting curled — middle (158, 46), ring (144, 26), little (116, 10).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import { digitPoly, type BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.068, 0.998);

/** The back of the hand from the cuff to the knuckles (the fingers are joined into it). */
const BODY: Poly = pts([
  [-24, -4], [-22, 6], [-10, 19.6], [8, 34], [28, 49.6], [48, 63.4], [66, 73.6], [78, 77.4], [88, 72], [93.6, 60], [93.4, 46], [86, 32], [72, 18], [54, 6], [36, -4], [20, -10], [6, -12],
]);

const INDEX = digitPoly(pts([[78, 54], [89.6, 42], [99.4, 28], [103.6, 16.6], [103, 7.6], [102, 1.6]]), [10, 9.6, 9, 8.4, 8, 7.6]);
const MIDDLE = digitPoly(pts([[84, 64], [102, 65.6], [122, 64.4], [136.4, 59.6], [148, 53], [156.6, 45.6]]), [10.4, 10, 9.6, 9, 8.4, 7.8]);
const RING = digitPoly(pts([[82, 50], [98, 51], [114, 49.4], [126.4, 44.6], [136.4, 37.6], [143, 27]]), [9.8, 9.4, 9, 8.4, 7.8, 7.2]);
const LITTLE = digitPoly(pts([[76, 36], [88, 35.6], [98.4, 32.6], [107.4, 27.6], [113.4, 20], [115.6, 11]]), [8.8, 8.4, 8, 7.4, 7, 6.6]);

export const BRASS_HAND_EUPH_SIDE_VALVE_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  union: [INDEX, MIDDLE, RING, LITTLE],
  lines: [
    // the ring finger lying beside the middle, the little beside the ring (clear at the ends, fading back)
    pts([[140, 46], [126, 54.4], [112, 58], [96, 58.6]]),
    pts([[120, 30], [110, 40.4], [98, 43.6], [86, 44]]),
    // the index coming up from under the little finger
    pts([[109.6, 18], [102.6, 25.6], [95.6, 31.4]]),
  ],
  creases: [
    pts([[118.6, 58], [121.4, 64.4], [123.4, 70.6]]),
    pts([[110.6, 43.6], [113.4, 49.4], [115, 55.6]]),
    pts([[95, 27.6], [98.6, 32.6], [100.6, 38.4]]),
    pts([[95.6, 24.4], [100.4, 22.6], [104.4, 19]]),
  ],
  nails: [
    // the curled ends turned up, their nails facing us; the index's on the button, seen from its side
    { c: P(152.6, 47.4), len: 9, w: 7.4, rot: -0.75, k: 0.65 },
    { c: P(139.6, 30.4), len: 8.6, w: 7, rot: -1.05, k: 0.65 },
    { c: P(112.6, 14.6), len: 8, w: 6.4, rot: -1.25, k: 0.6 },
    { c: P(107.6, 5.6), len: 8, w: 5.6, rot: -1.62, k: 0.35 },
  ],
  broad: [E(52, 30, 34, 16, 0.6)],
  lights: [
    // the back of the hand's upper (lit) edge; each finger's upper side
    E(40, 6, 26, 3, 0.55), E(122, 58, 14, 2.4, -0.1), E(118, 43.6, 12, 2.2, -0.3), E(100, 29, 7, 2, -0.5), E(98, 34, 2, 7, 0.5),
  ],
  swells: [E(80, 52, 5, 7, 0.6), E(82, 62, 5, 7, 0.6), E(76, 40, 4.4, 6, 0.6)],
  shades: [E(52, 54, 26, 8, 0.6)],
  darks: [
    // under each finger toward the page's bottom
    E(126, 72, 14, 2, -0.1), E(122, 52, 12, 1.8, -0.3), E(104, 39.6, 8, 1.8, -0.5),
  ],
};
