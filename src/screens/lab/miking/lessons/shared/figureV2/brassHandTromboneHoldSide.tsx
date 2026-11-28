/**
 * FIGURE V2 — THE TROMBONE'S LEFT (HOLDING) HAND, SEEN FROM THE PLAYER'S RIGHT (A02; the bass trombone's the same
 * hand — its thumb rests by the F-valve trigger instead of round the bell brace, a few millimetres away).
 * Owner 2026-11-25, "batches by family". (The trombone's horn and its braces are NOT redrawn here — hands only.)
 *
 * WHAT THE HAND DOES (the real technique): the left hand carries the whole trombone. It is a pistol grip: the INDEX lies
 * forward along the mouthpiece receiver (its pad on the receiver's upper side); the MIDDLE, RING and LITTLE fingers
 * wrap round the inner slide's brace and the gooseneck below it; the THUMB goes up round the bell section's brace
 * (on a bass trombone it rests on the F-valve trigger there). The wrist is under the chin, the back of the hand to the
 * player's left.
 *
 * WHAT THE EYE SEES FROM THE PLAYER'S RIGHT (this drawing): the hand is on the FAR side of the slide, its PALM toward
 * us. The thumb, the thickest digit, rises up the left from the palm's mound, bends softly and reaches forward to the
 * bell brace, its nail seen from its side. The fingers go forward round the braces and curl back toward us: the index's
 * end lying forward along the receiver at the top, the middle, ring and little fingers' ends below it, each NAIL facing
 * us. In the lesson the slide's tubes and braces lie in front of it and the right hand covers most of the fingers; the
 * thumb, the palm's heel and the index's end show.
 *
 * Frame: page millimetres in the A02 picture from the player's right (slide at 1st), origin on the centre of the
 * LEFT cuff's rim, u right, v DOWN. The receiver's tube (upper inner slide) along v = −97 from u = 40; the inner slide's
 * brace at u = 50 (v −97…−27); the bell section's brace at u = 52 (v −101 upward). The posed pads (brassPosture.ts,
 * unchanged): index (50, −95), middle (50, −67), ring (64, −42), little (75, −41), thumb (38, −125).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(-0.102, -0.995);

const BODY: Poly = pts([
  // the wrist's thumb side, from just inside the cuff
  [-25.6, 6], [-25.4, -6], [-24.4, -18],
  // the thumb's mound and the thumb rising up the left, broad
  [-25.4, -31], [-25, -46], [-22.8, -61], [-19, -75], [-14.2, -87],
  // its middle joint (a soft bend), the end segment reaching up and forward to the bell brace
  [-6.8, -99], [2.6, -108.6], [13, -116.8], [23.6, -123.8], [32.4, -129.8], [39.6, -133.2],
  // the thumb's rounded tip, its pad underside back down into the web
  [45.2, -131.4], [46.2, -125.2], [42.2, -119.4], [34.6, -115.2], [25.8, -109.6], [17.6, -101.8], [12.4, -93.2],
  // the web, the palm's upper edge out to the index's knuckle; the index lying forward along the receiver
  [18, -87.4], [30.6, -88.6], [42.6, -93.2], [54.6, -99.6], [66.6, -104.6], [77.6, -105.6], [85, -101.4],
  // the middle finger's bend, the farthest forward
  [88.4, -94.4], [91.4, -87.2], [91.8, -79.6],
  // the ring finger's bend
  [94, -73.2], [95.8, -66], [94.6, -58.6],
  // the little finger, curled, lowest
  [98.6, -54.4], [101.8, -47.4], [100.4, -40.2], [94.4, -35.4], [86, -32.6],
  // the palm's little-finger edge back down to the wrist
  [79, -24.6], [65, -11.4], [50, -1], [36, 7], [26, 8.6], [24.6, 6],
]);

/** The fingers' ends curling back toward us (in front of their own first segments): each runs on into its bend. */
const TIPS: Poly[] = [
  pts([[44.6, -94.6], [48, -100.6], [56, -103.4], [66, -103.6], [75.6, -101.4], [79.4, -96], [73.6, -91.4], [63.6, -90], [53.6, -89.6], [47.4, -90.6]]),
  pts([[45, -67.4], [48.6, -74.6], [56.4, -80.4], [66.4, -83.6], [77, -84.4], [84.6, -81], [83, -74.6], [74.6, -70.2], [64, -66.4], [54.6, -63.2], [48, -63]]),
  pts([[58.6, -42.6], [62.4, -50.4], [70, -56.4], [80, -60.2], [88.6, -60.4], [92, -55.4], [87.2, -49.6], [78.6, -45.4], [69.4, -40.6], [62.4, -38.6]]),
  pts([[70.8, -40.6], [75.6, -46.2], [84, -50.6], [93.4, -50.6], [97.4, -45.6], [93.6, -40], [85.6, -36.6], [77, -35.4], [72.2, -36.8]]),
];

export const BRASS_HAND_TROMBONE_HOLD_SIDE: BrassHandArt = {
  fore: FORE,
  body: BODY,
  pieces: TIPS,
  lines: [
    // the thumb's inner edge running down into the palm's mound (fading)
    pts([[13, -92.6], [8.4, -78], [2.6, -62], [-2.6, -46]]),
  ],
  creases: [
    // the palm's crease round the thumb's mound, faint
    pts([[20, -84], [13, -68], [9, -50], [8, -32]]),
    // the thumb's middle joint
    pts([[-10.8, -91.6], [-7.6, -96.4], [-6, -101.6]]),
  ],
  nails: [
    // the fingers' nails facing us; the thumb's seen from its side
    { c: P(52.6, -95.4), len: 9.4, w: 7, rot: Math.PI + 0.02, k: 0.95 },
    { c: P(53.4, -70.4), len: 9.6, w: 7.4, rot: Math.PI + 0.5, k: 0.95 },
    { c: P(66.6, -46.4), len: 9, w: 7, rot: Math.PI + 0.55, k: 1 },
    { c: P(79.4, -40.6), len: 8, w: 6, rot: Math.PI + 0.45, k: 0.85 },
    { c: P(36, -127.6), len: 10.4, w: 6, rot: -0.55, k: 0.6 },
  ],
  broad: [E(30, -50, 30, 26, -0.5)],
  lights: [
    // the thumb along its length; the fingers' middle segments
    E(-20, -60, 3, 15, 0.1), E(12, -116, 10, 2.6, -0.6), E(80, -98, 5, 2.4, -0.7), E(88, -82, 5, 2.4, -1), E(92, -62, 4.6, 2.2, -1.1),
  ],
  swells: [E(-6, -46, 9, 18, 0.15), E(54, -84, 7, 4, -0.5), E(66, -66, 6.4, 4, -0.6), E(72, -48, 6, 4, -0.7)],
  shades: [E(42, -44, 18, 12, -0.6), E(66, -12, 18, 6, -0.6), E(18, 6, 10, 5, -0.3)],
  darks: [
    // under each finger's end
    E(64, -88.8, 9, 1.6, -0.05), E(68, -65.4, 9, 1.6, -0.4), E(78, -43.4, 8, 1.6, -0.45),
    // the thumb's underside
    E(28, -112, 10, 2, -0.6),
  ],
};
