/**
 * FIGURE V2 — THE TROMBONE'S RIGHT (SLIDE) HAND, SEEN FROM THE PLAYER'S RIGHT (A02; the bass trombone's the same hold).
 * Owner 2026-11-25, "batches by family". (The trombone's horn and its braces are NOT redrawn here — hands only.)
 *
 * WHAT THE HAND DOES (the real technique): the right hand moves the slide and never carries the trombone's weight (the
 * left hand does). It holds the outer slide's brace LIGHTLY, as a pencil: the THUMB's pad on the brace's near side
 * (toward the player), the INDEX and MIDDLE fingers curled round its far side, the ring and little fingers curled
 * loosely beside them; the wrist relaxed and straight, the back of the hand toward the player's right. At 1st position
 * the forearm rises from the elbow below, so the hand points up.
 *
 * WHAT THE EYE SEES FROM THE PLAYER'S RIGHT (this drawing): the back of the hand rising from the cuff, leaning a little
 * forward; the big knuckles as low swells in a slanting row (the index's highest); the fingers' first segments rising
 * to ONE row of rounded bends along the top (the middle finger's highest, the ring's next, the index's lower and more
 * curled as it goes round the brace, the little finger's lowest, at the right); the fingers' ends go on round behind the
 * brace and are hidden. On the left the THUMB, the thickest digit, rises along the hand's side, bends softly at its
 * middle joint and reaches forward and up, its pad against the brace's near side; its nail seen from its side. The
 * brace stands in the gap between the thumb's end and the index finger.
 *
 * Frame: page millimetres in the A02 picture from the player's right (slide at 1st), origin on the centre of the
 * figure's cuff rim, u right (toward the slide's crook), v DOWN. The outer slide's brace: the vertical bar at u = 32,
 * from v = −145 (the upper tube) to −75 (the lower tube). The posed pads (brassPosture.ts, unchanged): index (41, −129)
 * and middle (41, −117) behind the brace; thumb (19, −120) on its near side.
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(-0.205, -0.979);

const BODY: Poly = pts([
  // the wrist's thumb side, from just inside the cuff
  [-26, 6], [-25.6, -6], [-24.6, -18],
  // the thumb's mound and the thumb rising along the hand's left side, broad
  [-27, -31], [-29.6, -46], [-30.6, -61], [-29.8, -74], [-26.8, -86],
  // its middle joint (a soft bend), the end segment reaching forward and up to the brace
  [-20.4, -97.6], [-11.4, -106.4], [-1, -113.6], [9, -120.4], [16.6, -126.8], [22.6, -130.2],
  // the thumb's rounded tip, its pad against the brace, its underside back down into the web
  [27.4, -128.6], [28.6, -122.6], [25.4, -116.8], [18.6, -111.8], [10.8, -105.6], [4, -98], [0.6, -90],
  // the web, then the index's side rising to its bend (it curls round the brace)
  [6, -88.6], [14.2, -96], [21.6, -104.4], [28.2, -113], [34, -121.4], [39.6, -127.6], [45.4, -131.2], [51, -131.4],
  // the parting, the middle finger's bend (the highest)
  [54.4, -133.6], [57.6, -138.6], [62.6, -141.4], [68, -139.8], [70.6, -135.4],
  // the parting, the ring finger's bend
  [73.6, -135.4], [79.4, -136.8], [85.6, -133.2], [88.6, -126.4], [89, -118],
  // down the ring finger's right side to the little finger, lower, its bend
  [88.6, -109.6], [92.2, -106.4], [95.4, -100], [95.6, -92], [93.4, -84.6],
  // the hand's little-finger edge back down to the wrist
  [88, -73.6], [81.4, -61.6], [72.6, -48.6], [61.4, -35.6], [49, -23.2], [37.4, -12.8], [28, -5.6], [25.4, 6],
]);

const LINES: Poly[] = [
  // the partings between the fingers' first segments, from the bends down toward the knuckles (fading)
  pts([[52.6, -132.2], [49.6, -122], [45.4, -111], [40.6, -101]]),
  pts([[71.6, -135], [67.4, -122], [62, -108], [56.4, -95]]),
  pts([[89, -111], [83.4, -100], [77, -88], [71, -78]]),
  // the hand's edge over the thumb's base: the thumb lies along the side of the hand (fading down)
  pts([[1, -89.6], [-5.4, -78], [-11.6, -62], [-16.4, -44], [-18.6, -28]]),
];

const CREASES: Poly[] = [
  // the soft folds over the middle joints
  pts([[40.4, -124.4], [44.6, -126.4], [49, -126]]),
  pts([[57.8, -132], [62.4, -134.2], [66.8, -133]]),
  pts([[76, -129.4], [80.4, -131], [84.6, -128.4]]),
  pts([[88.4, -100.2], [91.4, -98], [92.6, -94]]),
  // the thumb's middle joint
  pts([[-17.6, -94.4], [-14.6, -99], [-13, -103.6]]),
];

export const BRASS_HAND_TROMBONE_SLIDE_SIDE: BrassHandArt = {
  fore: FORE,
  body: BODY,
  lines: LINES,
  creases: CREASES,
  // the thumb's nail on its end segment, seen from its side (it lies along the thumb's upper side)
  nails: [{ c: P(14.2, -123), len: 10.4, w: 6.4, rot: -0.72, k: 0.6 }],
  broad: [E(30, -66, 30, 30, -0.5)],
  lights: [
    // each finger's first segment lit along its upper-left side, into its bend
    E(36, -112, 3, 12, 0.65), E(56, -118, 3.2, 14, 0.3), E(74, -114, 3, 13, 0.25), E(86, -94, 2.6, 8, 0.5),
    // the thumb along its length, its end
    E(-25, -60, 3, 15, 0.05), E(4, -114, 10, 2.6, -0.62),
  ],
  swells: [E(32, -96, 7, 4.6, -0.7), E(48, -88, 7, 4.4, -0.6), E(61, -76, 6.4, 4, -0.6), E(69, -60, 5, 3.4, -0.5)],
  shades: [E(64, -40, 14, 22, 0.7)],
  darks: [
    // the partings
    E(47.6, -116, 1.8, 12, 0.35), E(64, -116, 1.8, 14, 0.3), E(80, -95, 1.8, 11, 0.5),
    // the thumb's underside, the wrist's right side
    E(12, -108, 9, 2, -0.7), E(24, -6, 4, 9, 0.2),
  ],
};
