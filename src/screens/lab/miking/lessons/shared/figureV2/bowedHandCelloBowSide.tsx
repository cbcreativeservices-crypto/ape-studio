/**
 * FIGURE V2 — THE CELLO BOW HAND, SEEN FROM THE PLAYER'S RIGHT (C09c; side view).
 *
 * WHAT THE HAND DOES (the cello bow hold, as the lesson poses it — bowedHands.bowHand, BOW_HOLD.lower): a rounder,
 * deeper hand than the violinist's. The hand hangs from a relaxed wrist over the stick at the frog, its weight sunk
 * into the bow; the fingers are draped well round the stick, spread a little: the index over the stick at its middle
 * joint, the middle finger opposite the THUMB, the ring finger over the frog, the LITTLE finger down on the frog's far
 * face (not on top of the stick as a violinist's). The thumb is bent, its tip under the stick in the corner where the
 * stick meets the frog.
 *
 * WHAT THE EYE SEES from the player's right (read from the lesson's posed hand: the bow crosses the strings toward
 * the camera, so it is seen END-ON; the hand shows its LITTLE-finger edge, 0.99): the forearm level out of the cuff;
 * the wrist bending softly down; the back of the hand sloping down on the right to the knuckles; the four fingers
 * curling round the stick, one behind the other — the little finger nearest and smallest, the ring finger's bend
 * showing past it, the middle and index farther, their tips lowest; on the left the bent thumb, farther than the
 * fingers, coming down to the stick. The stick and its frog seen end-on in the ring the thumb and fingers make; the
 * ring and little fingers' nails edge-on on the outer side of their end segments.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist out of the cuff and the hand along its little-finger edge to the knuckles. */
const BODY = pts([
  [-6, -20], [8, -20], [20, -16], [32, -6], [44, 8], [55, 23], [65, 39], [73, 53], [79, 65], [80, 76], [74, 84], [64, 89], [56, 82], [44, 68], [30, 50], [16, 33], [4, 22], [-6, 20],
]);
const THUMB = digitOutline([P(8, 8), P(14, 30), P(18, 60), P(32, 88), P(46, 101)], [14.5, 13.6, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(62, 60), P(77, 99), P(65, 117), P(49, 123)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(65, 63), P(82, 115), P(61, 129), P(45, 124)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(66, 64), P(87, 108), P(68, 123), P(52, 118)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(62, 60), P(79, 92), P(69, 108), P(54, 113)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_CELLO_BOW_SIDE: BowedHandArt = {
  title: 'cello bow hand, seen from the player’s right (the bow end-on)',
  behind: [{ id: 'thumb', outline: THUMB, lights: [S(14, 46, 4, 16, 0.1, 0.24)], darks: [S(30, 74, 4, 16, -0.5, 0.3)] }],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(30, 6, 22, 9, 0.85, 0.26), S(72, 58, 6, 4, 1, 0.28)],
      darks: [S(-3, 0, 3, 18, 0, 0.32), S(40, 60, 18, 4, 0.95, 0.28)],
    },
    { id: 'index', outline: INDEX, darks: [S(62, 118, 8, 3, 0.3, 0.3)] },
    { id: 'middle', outline: MIDDLE, lights: [S(80, 100, 3, 8, 0.3, 0.22)], darks: [S(58, 124, 9, 3, 0.2, 0.32)] },
    { id: 'ring', outline: RING, lights: [S(82, 92, 3, 9, 0.4, 0.24)], darks: [S(64, 119, 8, 2.6, 0.2, 0.3)], nails: [{ c: P(58, 124.5), len: 8, w: 3, rot: 0.3 }] },
    { id: 'little', outline: LITTLE, lights: [S(74, 80, 3, 9, 0.45, 0.28)], darks: [S(70, 104, 3, 7, 0.6, 0.3)], nails: [{ c: P(61.5, 114.8), len: 8, w: 3.6, rot: -0.32 }] },
  ],
  frontLines: [
    { pts: pts([[53, 118.5], [66, 116], [78, 104], [85, 90]]), w: 0.8 },
    { pts: pts([[47, 128], [62, 129], [80, 120], [90, 104]]), w: 0.8, o: 0.6 },
  ],
  grip: P(55.3, 97.6),
  held: [{ kind: 'stick', a: P(62, 116), b: P(47, 85), r: 3.75 }],
  span: { c: P(45, 60), R: 85 },
};
