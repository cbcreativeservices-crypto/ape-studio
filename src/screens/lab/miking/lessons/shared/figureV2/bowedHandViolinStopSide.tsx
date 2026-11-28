/**
 * FIGURE V2 — THE VIOLIN (AND VIOLA) STOPPING HAND, SEEN FROM THE PLAYER'S RIGHT (C09a standing and seated, C09b; side
 * view). The player's LEFT hand, on the far side of the body: dimmed a step as every far part.
 *
 * WHAT THE HAND DOES (first position, as the lessons pose it — bowedHands.leftHand): the neck rests in the hand between
 * the thumb and the base of the index; the THUMB lies soft along the neck's bass flank opposite the first and second
 * fingers (never gripping); the wrist is straight with the forearm; the base knuckle of the index touches the neck's
 * treble flank just under the board; the four fingers ARCH over the board from the treble side, each fingertip coming
 * down on its string (1-2-3-4 on whole and half steps, the hand spanning ≈ 73 mm), the little finger the shortest and
 * nearest, the index reaching farthest.
 *
 * WHAT THE EYE SEES from the player's right (read from the lesson's posed hand: the LITTLE finger's edge of the hand
 * faces the camera, 0.98): the forearm and wrist rising from the cuff under the neck; the hand seen along its
 * little-finger edge, the knuckles just below the neck's back; the four fingers stacked one behind the other, each an
 * arch: up from its knuckle, a rounded bend over the board, down onto the strings — the little finger's the smallest and
 * in front, the index's the largest and farthest; the fingertips on the strings with their nails turned up, seen edge-on;
 * the thumb behind the neck (only its root shows below it).
 * Paint: the palm and the thumb BEHIND the neck (the instrument covers what lies under it), the fingers over the board.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist, straight with the forearm, and the hand seen along its little-finger edge up to the knuckles. */
const BODY = pts([
  [-6, -19], [10, -19.5], [28, -20.5], [46, -22], [62, -23.5], [76, -25.5], [88, -26.5], [97, -24], [103, -17], [104, -7], [99, 1.5],
  [89, 6.5], [74, 10.5], [56, 13.5], [38, 15.5], [20, 17.5], [4, 19], [-6, 19],
]);
/** The thumb along the neck's far flank (behind it): its root under the index's knuckle. */
const THUMB = pts([[10, -14], [24, -20], [40, -29], [56, -37], [70, -43.5], [84, -49], [94, -51.5], [99, -47.5], [96, -42], [86, -38], [72, -32], [56, -24], [40, -15], [24, -8], [12, -4]]);
const INDEX = digitOutline([P(90, -10), P(129, -6), P(130.5, -28), P(115, -36)], [10, 9.6, 8.6, 7.6]);
const MIDDLE = digitOutline([P(97, -13), P(133, -40), P(115, -58), P(100, -52)], [10.6, 10, 9, 8]);
const RING = digitOutline([P(96, -15), P(123, -40), P(107, -59), P(93, -54)], [10, 9.6, 8.6, 7.6]);
const LITTLE = digitOutline([P(90, -14), P(103, -43), P(92, -58), P(79, -61)], [9, 8.4, 7.6, 6.8]);

export const BOWED_HAND_VIOLIN_STOP_SIDE: BowedHandArt = {
  title: 'violin and viola fingering (left) hand, seen from the player’s right',
  behind: [
    { id: 'thumb', outline: THUMB, lights: [S(60, -32, 22, 3, -0.45, 0.24)], darks: [S(60, -24, 22, 3, -0.45, 0.3)] },
    {
      id: 'body',
      outline: BODY,
      lights: [S(40, -12, 34, 5, -0.05, 0.24), S(92, -18, 8, 5, 0.4, 0.26)],
      darks: [S(46, 12, 34, 3.4, -0.08, 0.3), S(-3, 0, 3, 17, 0, 0.32)],
    },
  ],
  front: [
    // (the farther each finger, the deeper its tone: the little finger nearest and lightest)
    { id: 'index', outline: INDEX, lights: [S(124, -10, 6, 3.4, 0.6, 0.24)], darks: [S(116, -28, 5, 3, 0.4, 0.3)], dim: 0.22 },
    { id: 'middle', outline: MIDDLE, lights: [S(118, -45, 9, 3, -0.7, 0.26)], darks: [S(110, -44, 6, 2.6, 0.3, 0.3)], nails: [{ c: P(106.5, -60.5), len: 8.5, w: 2.6, rot: 0.38 }], dim: 0.15 },
    { id: 'ring', outline: RING, lights: [S(108, -46, 8, 2.8, -0.8, 0.26)], darks: [S(104, -40, 6, 2.4, 0.2, 0.3)], nails: [{ c: P(99, -61.5), len: 8, w: 2.6, rot: -0.33 }], dim: 0.07 },
    { id: 'little', outline: LITTLE, lights: [S(95, -46, 3, 9, 0.2, 0.28)], darks: [S(95, -35, 3, 8, 0.4, 0.3)], nails: [{ c: P(84.5, -64.2), len: 7.5, w: 2.4, rot: 0.22 }] },
  ],
  grip: P(77.5, -45.7),
  held: [
    { kind: 'neck', a: P(140, 19), b: P(29.5, -104), r: 12.5 },
    { kind: 'board', a: P(124.5, 0), b: P(34, -100), r: 6.3 },
  ],
  span: { c: P(70, -20), R: 80 },
};
