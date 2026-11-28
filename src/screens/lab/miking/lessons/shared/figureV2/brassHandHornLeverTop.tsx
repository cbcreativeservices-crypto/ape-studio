/**
 * FIGURE V2 — THE HORN'S LEFT (LEVER) HAND, SEEN FROM ABOVE (A03, bell back).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the PADS of the index, middle and ring fingers on the three rotary valve
 * levers' spatulas, the LITTLE finger resting in the finger hook, the THUMB on the thumb valve's lever; the fingers
 * curved, the palm toward the levers, the wrist nearly straight.
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's LEFT is UP the page):
 * the back of the hand leaving the cuff and running forward and down the page; its knuckles along its lower edge; the
 * fingers curled down under it onto the levers — the index nearest us, its bend and its end with the NAIL showing; the
 * middle and ring fingers' bends beyond it on the right; the little finger's end lowest, by the hook, its nail showing;
 * the THUMB, the thickest digit, going down the page on the left, bending softly, its end turning forward onto the
 * thumb lever with its nail facing up.
 *
 * Frame: page millimetres in the A03 picture from above (bell back), origin on the centre of the LEFT cuff's rim,
 * u right (toward the audience), v DOWN the page (toward the player's right). The finger hook from (57, 130) to
 * (81, 108). The posed pads (lowBrassHands.ts, unchanged): index (92, 94), middle (87, 97), ring (82, 100), little
 * (75, 106), thumb (25, 101).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.746, 0.666);

const BODY: Poly = pts([
  // the back of the hand's upper edge from the cuff forward
  [14, -22], [28, -14.6], [42, -8], [56, 0], [70, 10.4], [82, 22.4], [92, 34.6],
  // the curled fingers' bends down the right
  [99.6, 48], [104.6, 62], [107, 76], [106, 88.6], [102, 98.6],
  // their ends tucked under, the little finger's lowest
  [95, 104.6], [87.6, 107.4], [81.4, 110.6], [75.4, 114.6], [68.6, 112.4], [67, 104.6],
  // the palm's lower edge back toward the thumb
  [66.6, 92], [60, 82.6], [48, 77], [34.6, 74.4], [24, 71.4],
  // the thumb's inner edge down to its end, turning forward onto the thumb lever
  [15, 76], [14.4, 88.4], [20.6, 95.4], [29.6, 98.4], [35, 104], [31.4, 110.4], [20, 112.6], [8, 110.6],
  // the thumb's outer edge back up to its base, a soft bend at its middle joint
  [-3.4, 103.4], [-10.4, 89.4], [-12.6, 72], [-13, 54], [-14.6, 37], [-18, 22],
]);

/** The index finger, nearest us: painted again over the others. */
const INDEX: Poly = pts([
  [42, 51.4], [58, 52.4], [74, 54.4], [85.6, 62], [93.6, 74.6], [97.6, 87.4], [96.4, 97.6], [90.4, 101], [85.4, 96.4], [83.6, 84.6], [77.6, 72], [68, 65.6], [54, 64.6], [42, 63.6],
]);

export const BRASS_HAND_HORN_LEVER_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  pieces: [INDEX],
  lines: [
    // the partings between the middle, ring and little fingers' bends (fading back)
    pts([[106.4, 80], [99, 72], [92, 64]]),
    pts([[103, 96], [96.6, 92], [92.6, 84]]),
    pts([[82, 109], [78, 100], [76, 90], [74, 80]]),
    // the thumb's edge going in under the palm
    pts([[24, 71.6], [15.4, 62], [8, 48], [2, 34]]),
  ],
  creases: [
    pts([[78.6, 57], [82.4, 61.6], [83.4, 66.6]]),
    pts([[-10.6, 70], [-4, 69.4], [2.6, 70.4]]),
  ],
  nails: [
    { c: P(91.4, 94.6), len: 8.6, w: 7, rot: 1.75, k: 0.6 },
    { c: P(73.2, 108.6), len: 7.4, w: 6, rot: 1.65, k: 0.7 },
    { c: P(25.4, 104.6), len: 9.6, w: 8, rot: 0.35, k: 0.75 },
  ],
  broad: [E(44, 26, 32, 18, 0.6)],
  lights: [
    // the back of the hand's upper edge; the index's top; the thumb's left side
    E(46, -1, 24, 2.6, 0.6), E(76, 58, 12, 2.4, 0.2), E(-9, 64, 2.6, 18, 0.03),
  ],
  swells: [E(44, 54, 6, 4, 0.2), E(60, 50, 6, 4, 0.4), E(72, 45, 5.4, 3.6, 0.6), E(80, 36, 5, 3.4, 0.8)],
  shades: [E(46, 68, 26, 7, 0.3)],
  darks: [
    // the fingers' bends beyond the index; under the index; the thumb's right side
    E(100, 78, 3, 12, 0.1), E(84, 102, 8, 1.8, 0.3), E(10, 84, 2.2, 14, 0.05),
  ],
};
