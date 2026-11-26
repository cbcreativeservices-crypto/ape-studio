/**
 * FIGURE V2 — THE TRUMPET'S RIGHT (VALVE) HAND, SEEN FROM ABOVE (A01; the flugelhorn's the same hold).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the PADS of the index, middle and ring fingers rest on the 1st, 2nd and 3rd
 * valve buttons (the 1st nearest the player), each finger curved as if round a ball, pressing the pearl from above;
 * the little finger rests on the finger hook on the leadpipe just ahead of the 3rd valve; the THUMB is under the
 * leadpipe between the 1st and 2nd valve casings, its pad up against the pipe. The wrist is straight and low, beside
 * the valve block on the player's right; the hand stays light (the left hand holds the trumpet).
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's right is DOWN the page):
 * the back of the hand rising from the cuff, a little foreshortened; the four big knuckles in a slanting row; the
 * fingers going on up the page side by side over the valve block, each with its middle joint as a soft swell, each
 * fingertip coming down onto its round pearl button — its NAIL seen foreshortened at the far end of the finger. The
 * little finger, shorter, reaches out to the right onto the hook, its nail at its end. The thumb lies UNDER the hand
 * (on the palm side, below it): only its outer side shows, a thick rounded edge along the hand's left side, its end
 * going in under the index finger toward the leadpipe.
 *
 * Frame: page millimetres in the A01 picture from above, origin on the centre of the figure's cuff rim, u right
 * (toward the bell), v DOWN the page (toward the player's right). The buttons' centres: 1st (−29, −119), 2nd
 * (−3, −119), 3rd (23, −119); the hook (47, −99); the leadpipe's centre line v = −99. The posed pads
 * (brassPosture.ts, unchanged): index (−29, −118), middle (−3, −118), ring (23, −118), little (47, −99).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });
const UP = -Math.PI / 2;

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.298, -0.955);

const BODY: Poly = pts([
  // the wrist's left side, from just inside the cuff
  [-26, 0], [-24.6, -8], [-23.4, -16],
  // the thumb's base, then its outer side: a thick rounded edge along the hand's left (the thumb itself under the hand)
  [-26.6, -25], [-32, -35], [-38, -46], [-42.4, -57], [-44.6, -68], [-45, -79], [-43.8, -88.6],
  // the thumb's middle joint, its end turning in under the index finger
  [-41.4, -95.4], [-37.6, -99.4],
  // the index's outer side up to its tip on the 1st button
  [-35, -104], [-36.2, -110], [-37.6, -116], [-37, -121.6], [-33.6, -125.6], [-28.4, -127], [-23.2, -125],
  // where the index's and middle finger's tips part
  [-20.4, -121.6], [-17.6, -120.8], [-14.4, -122.8],
  // the middle finger's tip on the 2nd button (the longest)
  [-11.2, -127.4], [-5.8, -130.4], [0.2, -130.2], [5, -127], [7.4, -122.4],
  // the parting to the ring finger
  [9.4, -119.6], [12, -119.8], [14.6, -122.6],
  // the ring finger's tip on the 3rd button
  [18.2, -127], [24, -128.6], [30.2, -126.6], [34, -122], [35.2, -116], [36, -110.6],
  // the parting to the little finger, shorter, reaching out to the right onto the hook
  [38.2, -106.6], [41.6, -107.4], [44.4, -110.6], [48.6, -112.6], [53.6, -111.8], [57, -108], [57.8, -102.6],
  // its outer side back down to its knuckle
  [56.2, -95], [53, -86], [49.4, -77.4], [46.4, -68],
  // the hand's little-finger edge down to the wrist, the wrist narrower than the hand
  [44, -58], [41.6, -46], [38, -33], [33, -21], [28, -10], [25.4, -2], [25, 8],
]);

const LINES: Poly[] = [
  // the partings between the fingers, clear at the tips, fading toward the knuckles
  pts([[-19, -120.6], [-16.4, -110], [-12.6, -98], [-8.6, -87], [-5, -78]]),
  pts([[10.6, -119.4], [12.6, -108], [14.4, -96], [15, -85], [14.8, -77]]),
  pts([[38.4, -106.8], [38.4, -98], [37, -88], [35, -79], [33, -72]]),
  // the back of the hand's edge over the thumb (the thumb is under it), fading up
  pts([[-36.4, -100], [-34.6, -88], [-33.2, -74], [-31, -58], [-27.4, -40]]),
];

const CREASES: Poly[] = [
  // the soft folds over each middle joint
  pts([[-24.6, -95.6], [-20.4, -94.4], [-16, -95]]),
  pts([[2.4, -101], [6.8, -100], [11, -100.8]]),
  pts([[28.6, -92.4], [32.6, -90.6], [36.4, -91.6]]),
  pts([[44.6, -90.4], [48.6, -89.6], [52.4, -90.6]]),
];

export const BRASS_HAND_TRUMPET_VALVE_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  lines: LINES,
  creases: CREASES,
  nails: [
    // each fingertip comes down onto its button: the nail seen foreshortened at the finger's far end
    { c: P(-30.4, -121.2), len: 6, w: 8.8, rot: UP, k: 0.75 },
    { c: P(-3, -124.6), len: 6, w: 9.2, rot: UP, k: 0.75 },
    { c: P(24.4, -122.8), len: 6, w: 8.6, rot: UP, k: 0.75 },
    { c: P(51.4, -106.4), len: 6, w: 7.4, rot: UP + 0.3, k: 0.75 },
  ],
  broad: [E(0, -48, 28, 30, -0.2)],
  lights: [
    // along each finger's left (lit) side, knuckle to middle joint to tip
    E(-24.6, -100, 3.2, 16, 0.25), E(-2, -102, 3.2, 18, 0.12), E(21.6, -100, 3, 16, -0.05), E(44, -92, 2.6, 12, -0.3),
    // the middle joints' soft swells
    E(-21, -96, 5.4, 3.4, 0.2), E(5.6, -101, 5.4, 3.4, 0.05), E(31.4, -92, 5, 3.2, -0.1),
    // the big knuckles, faint
    E(-13.6, -71, 5.4, 3.4, -0.3), E(4.6, -76, 5.4, 3.4, -0.1), E(21.6, -75, 4.6, 3, 0.05), E(36, -69, 3.6, 2.6, 0.4),
    // the thumb's edge
    E(-39.6, -66, 2.6, 13, 0.15),
  ],
  darks: [
    // the partings
    E(-11, -95, 2, 16, 0.3), E(14, -97, 2, 17, 0.05), E(36, -88, 2, 12, -0.3),
    // the hand's right edge and the wrist's right side turning away
    E(38, -36, 4.6, 16, 0.3), E(24, -6, 4, 9, 0.2),
    // the little finger's underside; the thumb going in under the hand
    E(53, -88, 2.4, 10, -0.35), E(-35, -90, 3.4, 6, 0.6),
  ],
};
