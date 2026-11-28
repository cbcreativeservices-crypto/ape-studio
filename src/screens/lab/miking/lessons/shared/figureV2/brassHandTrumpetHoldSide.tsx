/**
 * FIGURE V2 — THE TRUMPET'S LEFT (HOLDING) HAND, SEEN FROM THE PLAYER'S RIGHT (A01; the flugelhorn's the same hold).
 * Owner 2026-11-25, "batches by family".
 *
 * WHAT THE HAND DOES (the real technique): the left hand HOLDS the trumpet so the right hand stays free. It wraps round
 * the valve casings: the palm against their left (far) side, the index, middle and ring fingers curled round the front
 * of the 3rd casing (the bell side) so their tips come round onto its near side, the little finger curled below them;
 * the THUMB goes up on the left of the 1st casing to the 1st valve slide's saddle under the bell tube (it works the
 * slide). The wrist is bent forward so the hand can reach round the valve block.
 *
 * WHAT THE EYE SEES FROM THE PLAYER'S RIGHT (this drawing): the hand is on the FAR side of the valve block, its PALM
 * toward us. In the lesson most of it is hidden by the casings and by the right forearm in front: what shows is the
 * heel of the hand and the thumb's mound on the left, and on the right the fingertips coming round the 3rd casing
 * toward us — three curled fingertips stacked one over the other, each with its NAIL facing us, and the little finger
 * curled below them. Drawn whole: the palm, the thumb rising up-left to the saddle and turning in at its end, the
 * fingers going off to the right (away from us round the casing) and curling back, their ends in front.
 *
 * Frame: page millimetres in the A01 picture from the player's right, origin on the centre of the LEFT cuff's rim, u
 * right (toward the bell), v DOWN. The 3rd casing spans u 59…83 (its centre u 71); the 1st casing u 7…31; the bell
 * tube's centre line v = −111. The posed pads (brassPosture.ts, unchanged): index (85, −97), middle (85, −81), ring
 * (85, −66), little curled (113, −48), thumb (26, −93).
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });
const LEFT = Math.PI;

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.254, -0.967);

const BODY: Poly = pts([
  // the wrist's thumb side, from just inside the cuff
  [-25, 6], [-24.4, -5], [-23.4, -16],
  // the thumb's mound and the thumb rising up to the left, broad (the thickest digit)
  [-24.4, -28], [-25.2, -42], [-24.4, -56], [-22, -68], [-18.6, -79],
  // its middle joint (a soft bend), the end segment turning in to the right toward the saddle
  [-14.4, -89.4], [-8.6, -98.4], [-1.4, -104.4], [7, -107.4], [15.4, -107.4], [22.6, -105], [28, -100.6],
  // the thumb's rounded tip and its pad underside, back into the web
  [29.4, -94.6], [26.4, -89.6], [20.4, -87.4], [14.4, -84], [10.6, -77.6], [10.2, -70.4],
  // the web, then the palm's upper edge out to the index's knuckle
  [15.4, -63.4], [24, -64.4], [36, -69], [48, -74.6], [58.6, -80.6], [66.4, -85.8],
  // the index going off to the right round the casing: its top edge, its bend
  [74.4, -92.4], [83, -99.4], [91.4, -103.8], [98.6, -102.4], [103.4, -97],
  // the parting, the middle finger's bend (the farthest)
  [103, -90.4], [107.4, -87.6], [111.4, -82], [112.2, -75.4],
  // the parting, the ring finger's bend
  [108.2, -70], [110.6, -65.4], [111, -58.6],
  // the little finger curled below, a little farther on and lower
  [113.4, -55.2], [119.6, -51.6], [122.4, -45], [120.6, -38.4], [114.6, -34.2], [106, -32],
  // the palm's little-finger edge back down to the wrist
  [97.6, -24.4], [86, -12.6], [72.4, -3.4], [58, 3.6], [43.4, 9.4], [30.6, 11.4], [24.4, 6],
]);

/** The three fingertips coming round the casing toward us (in front of their own first segments), the little one below. */
// (each end running on into its own bend on the right: a finger end, not a loose pad; the middle finger's the
// largest, the index's a little turned away and smaller, the ring's narrower)
const TIPS: Poly[] = [
  pts([[80.6, -95.4], [83.4, -100.4], [89, -102.4], [96, -101.6], [101.6, -98], [101.4, -93], [95.6, -90.4], [88, -89.4], [82.6, -91]]),
  pts([[78.8, -80.4], [82.2, -86.6], [89.4, -88.8], [98, -88.2], [106.4, -84.6], [108.4, -78.6], [103, -74.2], [94, -72.6], [85.4, -73.4], [80.4, -76]]),
  pts([[79.8, -65.4], [83.4, -70.6], [90, -72.4], [98, -71.4], [105.4, -67.4], [106, -61.6], [100, -58.2], [91.6, -57.6], [84.4, -59], [80.6, -61.8]]),
  pts([[105.6, -46.4], [109, -51.2], [115, -52.4], [120, -49.4], [120.8, -43.4], [116.6, -38.8], [110, -38.6], [106.2, -42]]),
];

export const BRASS_HAND_TRUMPET_HOLD_SIDE: BrassHandArt = {
  fore: FORE,
  body: BODY,
  pieces: TIPS,
  lines: [
    // the partings between the curled fingers, from the bends back toward the palm (fading)
    pts([[103, -90.6], [96, -86], [86, -78], [76, -70]]),
    pts([[108.4, -70.2], [99, -66], [88, -58], [80, -50]]),
    pts([[111.4, -58.6], [102, -50], [92, -40], [84, -32]]),
    // the thumb's inner edge running down into the palm's mound (fading)
    pts([[14, -77], [9, -64], [3, -48], [-2, -32]]),
  ],
  creases: [
    // the palm's crease round the thumb's mound, and the one across the palm, both faint
    pts([[20, -60], [12, -46], [8, -30], [8, -14]]),
    pts([[34, -64], [48, -58], [64, -52], [80, -44]]),
  ],
  nails: [
    // the fingertips' nails facing us (the index's a little turned away)
    { c: P(86.2, -96.6), len: 8.6, w: 7, rot: LEFT + 0.25, k: 0.7 },
    { c: P(86.2, -80.6), len: 9, w: 7.4, rot: LEFT + 0.2, k: 1 },
    { c: P(86, -65.4), len: 8.6, w: 7, rot: LEFT + 0.2, k: 0.95 },
    { c: P(111.6, -45.6), len: 7, w: 5.6, rot: LEFT + 0.6, k: 0.5 },
    // the thumb's nail, on its end segment, seen from its side
    { c: P(19.8, -102.6), len: 10, w: 5.6, rot: 0.2, k: 0.6 },
  ],
  broad: [E(30, -40, 30, 24, -0.4)],
  lights: [
    // the thumb along its length
    E(-17, -60, 3, 14, 0.1), E(6, -102, 10, 2.6, -0.1),
  ],
  // the thumb's mound and the pads at the fingers' roots: low soft swells
  swells: [E(-8, -46, 9, 18, 0.2), E(66, -76, 7, 4, -0.6), E(78, -60, 6.6, 4, -0.6), E(84, -43, 6, 4, -0.7)],
  // the hollow of the palm, its little-finger edge, the wrist: broad and soft
  shades: [E(46, -36, 18, 12, -0.5), E(72, -8, 18, 6, -0.6), E(18, 6, 10, 5, -0.3)],
  darks: [
    // under each fingertip
    E(90, -88.6, 6, 1.6, -0.1), E(92, -72.4, 7, 1.6, -0.1), E(92, -57.4, 6, 1.6, -0.1),
    // the thumb's underside
    E(17, -86, 8, 2, -0.4),
  ],
  // in front of the 3rd casing: the three fingertips and the little finger's end
  front: [pts([[77, -108], [104, -108], [110, -84], [108, -55], [77, -55]]), pts([[103, -56], [123, -56], [123, -36], [103, -36]])],
};
