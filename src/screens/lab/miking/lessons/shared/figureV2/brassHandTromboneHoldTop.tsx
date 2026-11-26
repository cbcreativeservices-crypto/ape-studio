/**
 * FIGURE V2 — THE TROMBONE'S LEFT (HOLDING) HAND, SEEN FROM ABOVE (A02; the bass trombone's the same hand — its thumb
 * rests by the F-valve trigger instead of round the bell brace, a few millimetres away).
 * Owner 2026-11-25, "batches by family". (The trombone's horn and its braces are NOT redrawn here — hands only.)
 *
 * WHAT THE HAND DOES (the real technique): the left hand carries the whole trombone in a pistol grip: the INDEX lies
 * forward along the mouthpiece receiver, the MIDDLE, RING and LITTLE fingers wrap round the inner slide's brace and the
 * gooseneck, the THUMB goes round the bell section's brace (a bass trombone's rests on the F-valve trigger there).
 *
 * WHAT THE EYE SEES FROM ABOVE (this drawing; the player faces the page's right, the player's LEFT is UP the page):
 * the hand stands on its edge beside the slide, so from above we see the back of the hand as a band leaving the cuff
 * and running forward to the knuckles; the fingers curl DOWN the page round the braces, their ends coming back under
 * the hand; the THUMB lies forward across the top of the hand toward the bell brace — the nearest thing to us, the
 * thickest digit, bent softly at its middle joint, its NAIL facing up at its end. In the lesson the bell brace and the
 * slide's upper tube cross over the fingers.
 *
 * Frame: page millimetres in the A02 picture from above (slide at 1st), origin on the centre of the LEFT cuff's rim,
 * u right, v DOWN the page (toward the player's right). The slide's legs along v = 26 (u from 41 on); the bell brace
 * from (53, 22) up the page to (53, −102). The posed pads (brassPosture.ts, unchanged): index (51, 10), middle
 * (51, 13), ring (65, 25), little (76, 25), thumb (39, −6).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(-0.45, 0.893);

// (round 2: the curled fingers as their own bends round the right and lower edge, each its own width, parted by
// short notches — a fist seen from its thumb side, not one rounded mass)
const BODY: Poly = pts([
  // the hand's upper edge from the cuff forward to the index's knuckle
  [-27, -10], [-14, -21.6], [4, -31], [24, -39], [42, -45], [58, -47.6], [70, -45.6], [79.4, -39.4],
  // the index's bend (the highest), the notch
  [86.4, -30.6], [90.6, -20.6], [90.6, -11.4], [88.4, -6.4], [90.4, -4.6],
  // the little finger's bend, farthest out, the notch
  [96.4, -6.6], [101.2, -2.4], [102.6, 4], [100.4, 9.6], [96.6, 12.4],
  // the ring finger's bend, the notch
  [96.4, 17.6], [93.4, 23.6], [87.6, 27.4], [81.6, 27.6], [78, 30.4],
  // the ring's end under, the middle finger's bend along the bottom
  [72.6, 32.4], [65.6, 30.6], [60, 25.6], [55.4, 19.4],
  // the palm's lower edge back to the wrist
  [46, 15], [34, 14], [22, 15], [10, 13.6], [0, 11.6], [-10, 9.4], [-19, 7], [-26, 4],
]);

/** The thumb, lying across the top of the hand (nearest us): its own outline. */
const THUMB: Poly = pts([
  [-8.6, -12.4], [2, -15.6], [14, -15.4], [26, -14.6], [36.4, -15], [44, -12.6], [47.6, -7], [46.4, -1], [40.6, 2.4], [30, 3.6], [18, 4.8], [6, 6.6], [-4, 6.4], [-10.6, 1],
]);

export const BRASS_HAND_TROMBONE_HOLD_TOP: BrassHandArt = {
  fore: FORE,
  body: BODY,
  pieces: [THUMB],
  lines: [
    // the partings between the curled fingers (clear at the notches, fading back toward the knuckles)
    pts([[89.6, -5.4], [82, -10], [74, -16], [66, -22]]),
    pts([[96.6, 12.6], [88, 8], [80, 2], [72, -4]]),
    pts([[78.4, 29.6], [74, 22], [68, 14], [62, 8]]),
  ],
  creases: [
    // the thumb's middle joint
    pts([[18.6, -12.6], [21.4, -8.6], [21.2, -3]]),
  ],
  nails: [
    // the thumb's nail facing up; the fingers' ends turned under, their nails seen from the side
    { c: P(39.6, -5.4), len: 10.4, w: 8.4, rot: 0.04, k: 0.95 },
    { c: P(97.6, 4.4), len: 7, w: 5.6, rot: 2.0, k: 0.45 },
    { c: P(84.6, 25.6), len: 7, w: 5.6, rot: 2.7, k: 0.45 },
  ],
  broad: [E(40, -26, 32, 14, -0.15)],
  lights: [
    // the hand's upper band; each bend's upper (lit) side
    E(40, -40, 24, 2.6, -0.2), E(86, -26, 2.4, 7, -0.5), E(97, -4, 2.2, 5, -0.6), E(90, 18, 5, 2, -0.6), E(66, 26, 5, 2, 0.4),
    // the thumb along its top
    E(16, -11, 16, 2.6, -0.02),
  ],
  swells: [E(64, -38, 6, 3.4, -0.1), E(74, -30, 5.4, 3.2, -0.4), E(78, -18, 5, 3, -0.8)],
  shades: [E(50, 2, 30, 9, -0.1)],
  darks: [
    // under the thumb's lower edge; each bend's lower side turning away
    E(22, 6, 18, 1.8, -0.06), E(86, -9, 5, 1.6, 0.4), E(96, 12, 4, 1.6, 0.6), E(76, 28, 4, 1.6, 0.4),
  ],
};
