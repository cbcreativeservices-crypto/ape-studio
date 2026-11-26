/**
 * FIGURE V2 — THE HORN'S LEFT (LEVER) HAND, SEEN FROM THE PLAYER'S RIGHT (A03, bell back).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the horn's left hand plays the rotary valves: the PADS of the index, middle
 * and ring fingers on the three valve levers' spatulas (valves 1–3), the LITTLE finger resting in the finger hook (it
 * steadies the horn), the THUMB on the thumb valve's lever above them. The wrist nearly straight with the forearm, the
 * palm toward the levers, the fingers curved.
 *
 * WHAT THE EYE SEES FROM THE PLAYER'S RIGHT (this drawing): the hand is on the FAR side of the horn's coils, its PALM
 * toward us (the levers are on the player's left of the valves). Drawn whole: the palm leaving the cuff toward the
 * upper right; the THUMB, the thickest digit, rising up the left and turning forward at its end onto the thumb lever,
 * its nail toward us; the index, middle and ring fingers curving forward and back toward us onto their levers, their
 * ends stacked one below another, the middle and ring fingers' NAILS facing us, the index's seen from its side; the
 * little finger short and curled below them, in the hook. In the lesson the coils and the rotors lie in front of it:
 * the hand shows only between them.
 *
 * Frame: page millimetres in the A03 picture from the player's right (bell back), origin on the centre of the LEFT
 * cuff's rim, u right (toward the audience), v DOWN. The rotors (end-on) at (32, −118), (41, −79), (49, −40), (58, −2);
 * the finger hook from (58, 4) to (82, −15). The posed pads (lowBrassHands.ts, unchanged): index (93, −95), middle
 * (88, −72), ring (83, −49), little (76, −23), thumb (26, −68).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });
const LEFT = Math.PI;

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.892, -0.451);

const BODY: Poly = pts([
  // the wrist's thumb side, from just inside the cuff
  [-14.6, -26], [-15.6, -36],
  // the thumb rising up the left, broad, bending softly at its middle joint
  [-15.4, -48], [-13.6, -61], [-9.6, -72.6], [-2.4, -80.4],
  // its end turning forward onto the thumb lever, its rounded tip
  [8, -83.4], [19.6, -82.6], [29.6, -79.6], [36.4, -74], [36.6, -66.6], [31.6, -61.6], [22.6, -60.4], [15.6, -57.4],
  // the web, the palm's upper edge out to the index's knuckle; the index going forward and up to its bend
  [14.4, -52], [22.6, -62.6], [33, -74.4], [44.6, -86.6], [58, -97], [72, -105], [85.4, -109], [96.6, -107], [103.4, -100],
  // the middle finger's bend, the farthest forward
  [106, -91.6], [109.4, -84], [109, -75.6],
  // the ring finger's bend
  [107.6, -68], [107.8, -60.4], [104.6, -52.4],
  // the little finger, short and curled into the hook
  [97.6, -45.6], [92.6, -38], [89.4, -28.4], [86.4, -19.4], [80.6, -13.2],
  // the palm's little-finger edge back down to the wrist
  [70.6, -8.6], [56, 0.6], [42, 8.6], [28, 15], [16, 20.4], [10, 24],
]);

/** The fingers' ends curling back toward us onto their levers (each running on into its bend). */
const TIPS: Poly[] = [
  pts([[85.6, -96.4], [89.6, -102.6], [97.6, -104.4], [103.6, -100], [103, -92.4], [96.6, -88.4], [89.6, -89.6]]),
  pts([[80, -73.4], [84.4, -80.6], [93.6, -84.6], [103.4, -84], [108.6, -78.4], [105.6, -72], [96.6, -67.6], [87.4, -66.4], [81.6, -68.6]]),
  pts([[75, -50.6], [79.6, -57.6], [88.6, -61.6], [98.6, -61.4], [104, -56], [100.6, -49.6], [91.6, -45.4], [82.4, -44.4], [76.6, -46.4]]),
  pts([[70.4, -24.6], [74.4, -31], [82, -33.6], [89.6, -31.4], [91, -24.4], [86.4, -18], [78.6, -16.4], [72.4, -19]]),
];

export const BRASS_HAND_HORN_LEVER_SIDE: BrassHandArt = {
  fore: FORE,
  body: BODY,
  pieces: TIPS,
  lines: [
    // the thumb's inner edge running down into the palm's mound (fading)
    pts([[15, -55], [9, -44], [3, -32], [-2, -20]]),
  ],
  creases: [
    // the palm's crease round the thumb's mound, faint
    pts([[20, -56], [16, -42], [14, -28], [16, -12]]),
    // the thumb's middle joint
    pts([[-12.4, -66.6], [-7.6, -69.4], [-4.6, -73.6]]),
  ],
  nails: [
    { c: P(94.4, -98.6), len: 8, w: 6, rot: LEFT + 0.4, k: 0.4 },
    { c: P(88.6, -73.4), len: 9, w: 7.2, rot: LEFT + 0.45, k: 1 },
    { c: P(83.6, -50.6), len: 9, w: 7, rot: LEFT + 0.45, k: 1 },
    { c: P(77.6, -24.4), len: 7.4, w: 5.8, rot: LEFT + 0.5, k: 0.7 },
    // the thumb's nail on its end, toward us
    { c: P(27.6, -72.4), len: 10, w: 7.6, rot: 0.15, k: 0.85 },
  ],
  broad: [E(40, -40, 30, 26, -0.6)],
  lights: [
    // the thumb along its length; the fingers' middle segments
    E(-11, -54, 2.8, 13, 0.1), E(12, -79, 10, 2.6, 0), E(96, -102, 5, 2, -0.5), E(102, -86, 4.6, 2, -1), E(102, -64, 4.6, 2, -1.1),
  ],
  swells: [E(0, -40, 8, 15, 0.2), E(48, -78, 7, 4, -0.6), E(62, -66, 6.4, 4, -0.7), E(72, -50, 6, 4, -0.8)],
  shades: [E(44, -38, 18, 12, -0.6), E(56, -4, 18, 6, -0.5)],
  darks: [
    // under each finger's end; the thumb's underside
    E(94, -87, 7, 1.6, -0.2), E(92, -65, 8, 1.6, -0.35), E(90, -43, 8, 1.6, -0.4), E(25, -59, 9, 1.8, -0.1),
  ],
};
