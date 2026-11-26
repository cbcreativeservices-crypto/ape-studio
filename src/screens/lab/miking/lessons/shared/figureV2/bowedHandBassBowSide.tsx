/**
 * FIGURE V2 — THE DOUBLE BASS BOW HAND (FRENCH BOW), SEEN FROM THE PLAYER'S RIGHT (C06b; side view).
 *
 * WHAT THE HAND DOES (the French bass bow is held as a cello bow — bowedHands.bowHand, BOW_HOLD.lower): a round,
 * deep hand over the stick at the frog, the fingers draped well round the stick and spread a little, the little
 * finger down on the frog's far face, the bent THUMB's tip under the stick in the corner the stick makes with the
 * frog, opposite the middle finger; the wrist relaxed, the arm's weight sunk into the string.
 *
 * WHAT THE EYE SEES from the player's right (read from the lesson's posed hand: the bow crosses the strings toward
 * the camera, so it is seen END-ON; the hand shows its LITTLE-finger edge, 0.92): the forearm out of the cuff sloping
 * down to the right and the hand going on along it, the back of the hand on top; the four fingers curling down round
 * the stick one behind the other — the little finger nearest, the ring finger's bend showing past it, the middle and
 * index farther and darker; under the hand the bent thumb, farther still, its tip beside the stick. The stick and its
 * frog seen end-on inside the curl; the little finger's nail edge-on on the outside of its end.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist out of the cuff and the hand along its little-finger edge to the knuckles, the back of the hand on top. */
const BODY = pts([
  [-6, -20], [10, -20], [26, -18], [42, -14], [58, -9], [72, -3], [84, 4], [92, 12], [96, 22], [92, 30], [80, 32], [64, 32], [48, 30], [32, 26], [18, 22], [4, 20], [-6, 20],
]);
const THUMB = digitOutline([P(8, 8), P(38, 31), P(67, 42), P(91, 50)], [14.5, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(72, 16), P(100, 31), P(103, 51), P(97, 67)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(82, 18), P(116, 41), P(109, 66), P(96, 71)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(86, 19), P(127, 38), P(119, 62), P(103, 66)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(84, 18), P(119, 33), P(118, 52), P(106, 61)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_BASS_BOW_SIDE: BowedHandArt = {
  title: 'double bass bow hand (French bow), seen from the player’s right (the bow end-on)',
  behind: [{ id: 'thumb', outline: THUMB, lights: [S(40, 24, 18, 3, 0.55, 0.24)], darks: [S(50, 44, 22, 3, 0.4, 0.32)] }],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(40, -10, 30, 6, 0.18, 0.26), S(88, 8, 6, 4, 0.8, 0.28)],
      darks: [S(-3, 0, 3, 18, 0, 0.32), S(46, 28, 30, 3.4, 0.1, 0.28)],
    },
    { id: 'index', outline: INDEX, dim: 0.2 },
    { id: 'middle', outline: MIDDLE, darks: [S(104, 68, 8, 3, 0.4, 0.3)], dim: 0.13 },
    { id: 'ring', outline: RING, lights: [S(118, 34, 6, 3.4, 0.6, 0.24)], darks: [S(112, 64, 8, 3, 0.3, 0.3)], dim: 0.06 },
    { id: 'little', outline: LITTLE, lights: [S(108, 26, 8, 3.4, 0.45, 0.28), S(118, 42, 3, 6, 0, 0.22)], darks: [S(110, 55, 3, 6, 0.8, 0.3)], nails: [{ c: P(114.5, 59), len: 8, w: 2.6, rot: 2.5 }] },
  ],
  grip: P(100.1, 44.7),
  held: [{ kind: 'stick', a: P(99, 49), b: P(101, 41), r: 3.75 }],
  span: { c: P(55, 20), R: 85 },
};
