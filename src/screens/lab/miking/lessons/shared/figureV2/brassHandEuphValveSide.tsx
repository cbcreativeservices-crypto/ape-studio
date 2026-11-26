/**
 * FIGURE V2 — THE EUPHONIUM'S RIGHT (VALVE) HAND, SEEN FROM THE PLAYER'S RIGHT (A04b, bell up).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the right hand plays the three top-action piston valves: the index, middle
 * and ring fingers ARCHED over them, each pad on its pearl button (the 1st nearest the player); the little finger free
 * beside them, curled (the euphonium's 4th valve is on the side, played by the left hand); the THUMB hooked into the
 * thumb ring on the player's side of the 1st valve. The wrist level and relaxed, the back of the hand up.
 *
 * WHAT THE EYE SEES FROM THE PLAYER'S RIGHT (this drawing): the back of the hand above the valve block, seen a little
 * from above, leaving the cuff; the knuckles along its lower edge; the three playing fingers coming DOWN side by side
 * from them onto their buttons, each with a soft bend, each end's nail seen from its side as it presses; the little
 * finger shorter, curled, its end held above the block; the THUMB, the thickest digit, going down at the left into the
 * thumb ring. The fingers flow out of the hand: one outline round the whole.
 *
 * Frame: page millimetres in the A04b picture from the player's right (bell up), origin on the centre of the figure's
 * cuff rim, u right (toward the audience), v DOWN. The three buttons' tops at v ≈ 13, centres u −9, 19, 48; the thumb
 * ring round (−31, 33). The posed pads (lowBrassHands.ts, unchanged): (−9, 5), (19, 5), (48, 5); the little finger
 * curled (59, −6); the thumb (−32, 33).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import { digitPoly, type BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.685, -0.728);

/** The back of the hand (the digits are joined into it). */
const BODY: Poly = pts([
  [-21, -12], [-26, -26], [-24.6, -40.6], [-15, -51.6], [1, -57.4], [20, -57.6], [38, -54.4], [51.6, -48.4], [59.6, -39], [62, -27.6], [58.6, -16],
  [46, -12.6], [32, -13.4], [18, -14.4], [4, -13.6], [-8, -10], [-14, -6], [-16, 2],
]);

// (round 2: fuller fingers, touching at their roots and parting only toward their ends, each with a soft arch — the
// buttons are close together on a euphonium)
const INDEX = digitPoly(pts([[-1, -40], [-8, -30], [-11.6, -17], [-11, -4.6], [-9, 4.6]]), [11, 10.6, 10, 9, 8]);
const MIDDLE = digitPoly(pts([[17.6, -40], [18.6, -30], [20, -17], [20, -4.4], [19, 4.6]]), [11.2, 10.8, 10.2, 9.2, 8.2]);
const RING = digitPoly(pts([[35, -38], [41.6, -30], [46.4, -17.4], [48.2, -4.6], [48, 4.6]]), [10.6, 10.2, 9.6, 8.8, 7.8]);
const LITTLE = digitPoly(pts([[48, -33], [56, -31], [60.6, -22], [60.6, -12.4], [59, -6]]), [9.4, 9, 8.4, 7.6, 7]);
const THUMB = digitPoly(pts([[-14, -9], [-20.6, 3.4], [-27.6, 14.6], [-33.4, 23.6], [-34.6, 29.6], [-32.4, 33.6]]), [13.4, 12.6, 11.6, 10.8, 10.2, 9.6]);

export const BRASS_HAND_EUPH_VALVE_SIDE: BrassHandArt = {
  fore: FORE,
  // (the fingers come down in front of the near end of the sleeve: only a sliver behind the rim is kept clear)
  cutLen: 6,
  body: BODY,
  union: [INDEX, MIDDLE, RING, LITTLE, THUMB],
  lines: [
    // the partings between the fingers, from below fading up into the knuckles
    pts([[5.6, -2], [5.4, -14], [6.4, -26], [7.6, -36]]),
    pts([[34, -2], [33.4, -14], [30.4, -26], [26.6, -36]]),
    pts([[53.4, -8], [52.6, -18], [49.6, -28]]),
    // the thumb's edge where it leaves the hand, under the index (short, fading up)
    pts([[-21.6, 8], [-18.6, 0], [-15.6, -6]]),
  ],
  creases: [
    // the folds over the middle joints
    pts([[-14.6, -25], [-8.4, -23.6], [-2.4, -24]]),
    pts([[13.6, -26.4], [19.6, -25.8], [25.2, -26.4]]),
    pts([[39.6, -25.4], [44.6, -24.4], [49.6, -25.2]]),
    pts([[54.4, -22.6], [58.6, -21.4], [62.6, -22]]),
    pts([[-31.6, 14.6], [-27, 17.6], [-22.6, 19.2]]),
  ],
  nails: [
    // each end pressing down on its button: the nail seen from its side
    { c: P(-15.2, 0.6), len: 8.6, w: 5.6, rot: Math.PI / 2, k: 0.4 },
    { c: P(13.4, 0.6), len: 8.6, w: 5.6, rot: Math.PI / 2, k: 0.4 },
    { c: P(42.4, 0.6), len: 8.4, w: 5.4, rot: Math.PI / 2, k: 0.4 },
    { c: P(53.8, -9.4), len: 7.4, w: 5, rot: Math.PI / 2, k: 0.4 },
    { c: P(-40.2, 29.4), len: 9.4, w: 6, rot: 1.3, k: 0.5 },
  ],
  broad: [E(18, -40, 30, 14, 0)],
  lights: [
    // the back of the hand's upper plane; each finger's left (lit) side as it comes down
    E(16, -50, 26, 3.6, 0.02), E(-15, -14, 2.4, 10, 0.1), E(13.4, -14, 2.4, 10, 0.02), E(41.4, -14, 2.4, 10, -0.1),
    // the thumb's left side
    E(-29, 4, 2.6, 13, 0.5),
  ],
  swells: [E(-2, -38, 7, 4, 0), E(17, -38, 7, 4, 0), E(34, -35, 6.4, 3.8, 0.2), E(48, -30, 5, 3.2, 0.3)],
  shades: [E(24, -22, 30, 6, 0)],
  darks: [
    // the partings, each finger's right side turning away
    E(5.6, -14, 1.8, 11, 0.03), E(33.6, -14, 1.8, 11, -0.1), E(-4, -12, 2, 9, 0.05), E(25, -12, 2, 9, 0), E(54, -12, 2, 8, 0),
  ],
};
