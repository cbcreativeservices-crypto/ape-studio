/**
 * FIGURE V2 — THE EUPHONIUM'S RIGHT (VALVE) HAND, SEEN FROM ABOVE (A04b, bell up).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the index, middle and ring fingers arched over the three top-action
 * pistons, each pad on its pearl button (the 1st nearest the player); the little finger free beside them; the THUMB
 * hooked into the thumb ring on the player's side of the 1st valve. The wrist level, the back of the hand up.
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's right is DOWN the page):
 * the back of the hand rising up the page from the cuff toward the valve block, the knuckles in a slanting row; the
 * three playing fingers going on side by side, each ending on its round button with its NAIL seen foreshortened at the
 * far end; the little finger shorter, beside them; the THUMB, the thickest digit, along the hand's left side up into
 * the thumb ring, its nail seen from its side.
 *
 * Frame: page millimetres in the A04b picture from above (bell up), origin on the centre of the figure's cuff rim,
 * u right (toward the audience), v DOWN the page (toward the player's right). The three buttons (end-on) on v = −143 at
 * u −8, 21, 50; the thumb ring round (−30, −118). The posed pads (lowBrassHands.ts, unchanged): (−7, −143),
 * (21, −143), (50, −143); the little finger (61, −124); the thumb (−30, −119).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import { digitPoly, type BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });
const UP = -Math.PI / 2;

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.995, -0.103);

const BODY: Poly = pts([
  [-8, 12], [-14, -10], [-16, -32], [-13, -56], [-7.6, -80], [1, -95.6], [19.6, -97.6], [36, -91], [51.6, -78.4], [58.6, -62], [55, -42], [45, -18], [35, 2], [27, 15.6], [12, 22], [0, 22],
]);

const INDEX = digitPoly(pts([[0, -88], [-3.6, -107], [-6.6, -125], [-7.6, -137.6], [-7, -143]]), [9.8, 9.4, 8.8, 8.2, 7.8]);
const MIDDLE = digitPoly(pts([[19, -88], [20, -109], [21, -129], [21.6, -139.6], [21, -144]]), [10, 9.6, 9, 8.4, 7.8]);
const RING = digitPoly(pts([[36, -82], [42.6, -103], [47.6, -121.6], [50.6, -135.6], [50, -143]]), [9.4, 9, 8.6, 8, 7.4]);
const LITTLE = digitPoly(pts([[50, -70], [55.6, -87.6], [58.6, -103.6], [60.6, -116.6], [61, -124]]), [8.4, 8, 7.4, 7, 6.6]);
const THUMB = digitPoly(pts([[-10, -24], [-17.6, -46], [-25, -67.6], [-31, -89], [-32.6, -105], [-30, -118]]), [13.4, 12.6, 11.8, 11, 10.4, 9.6]);

export const BRASS_HAND_EUPH_VALVE_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  union: [INDEX, MIDDLE, RING, LITTLE, THUMB],
  lines: [
    // the partings between the fingers (clear at the ends, fading back toward the knuckles)
    pts([[7.4, -138], [7.6, -122], [8.6, -106], [9.4, -94]]),
    pts([[35.6, -136], [33.6, -120], [30.6, -104], [27.6, -92]]),
    pts([[55.6, -122], [53.4, -108], [50.4, -94], [46.4, -82]]),
    // the thumb's edge along the hand
    pts([[-21.4, -100], [-17.4, -84], [-12.6, -64], [-8.6, -44]]),
  ],
  creases: [
    pts([[-11.6, -122.6], [-6.6, -124.4], [-1.4, -123.4]]),
    pts([[16, -126], [21, -127.6], [26, -126.4]]),
    pts([[43, -121.6], [47.6, -122.6], [52.6, -120.6]]),
    pts([[54.6, -103], [58.6, -103.6], [62.6, -102]]),
    pts([[-37.6, -84], [-31.6, -86.6], [-25.6, -86.4]]),
  ],
  nails: [
    { c: P(-7.2, -146.6), len: 6, w: 8.4, rot: UP, k: 0.75 },
    { c: P(21.2, -147.4), len: 6, w: 8.6, rot: UP, k: 0.75 },
    { c: P(50.2, -146.4), len: 6, w: 8, rot: UP, k: 0.75 },
    { c: P(61, -127.4), len: 5.6, w: 7, rot: UP, k: 0.7 },
    { c: P(-37.2, -112.6), len: 9.4, w: 6.4, rot: -1.45, k: 0.45 },
  ],
  broad: [E(20, -46, 26, 30, -0.1)],
  lights: [
    // along each finger's left (lit) side
    E(-10, -118, 2.4, 14, -0.15), E(15.6, -120, 2.4, 15, 0), E(42, -116, 2.4, 14, 0.25), E(55, -100, 2.2, 12, 0.2),
    // the thumb's left side
    E(-30, -70, 2.6, 18, 0.35),
  ],
  swells: [E(0, -88, 7, 4.4, 0), E(19, -88, 7, 4.4, 0), E(35, -81, 6.4, 4, 0.3), E(48, -68, 5, 3.4, 0.5)],
  shades: [E(36, -24, 18, 26, 0.3)],
  darks: [
    // the partings, the thumb's right side
    E(8.6, -112, 1.6, 16, 0.02), E(31, -112, 1.6, 16, -0.2), E(52.6, -100, 1.6, 14, -0.2), E(-19, -84, 2.4, 16, 0.3),
  ],
};
