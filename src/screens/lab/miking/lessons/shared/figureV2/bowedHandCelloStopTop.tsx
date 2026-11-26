/**
 * FIGURE V2 — THE CELLO STOPPING HAND, SEEN FROM ABOVE (C09c; the view from above, also the setting plan). The
 * player's LEFT hand.
 *
 * WHAT THE HAND DOES: as bowedHandCelloStopSide.tsx (bowedHands.leftHand, first position, one finger per semitone):
 * the fingers rounded over the board, each tip pressing its string; the thumb relaxed on the back of the neck behind
 * the second finger; the wrist a little bent, the elbow up.
 *
 * WHAT THE EYE SEES from straight above (read from the lesson's posed hand: the hand's THUMB edge faces up toward
 * the camera, 0.80): the forearm out of the cuff; the hand seen along its thumb and index edge; the thumb on top,
 * lying along the back of the neck; the index nearest of the fingers, its arch coming round the neck to its string,
 * its nail on the end segment toward us; the middle finger's arch beside it, its nail turned more edge-on; the ring and
 * little fingers below them, mostly under the neck.
 * Paint: the palm and the ring and little fingers behind the neck; the index, the middle finger and the thumb over it.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist out of the cuff and the hand along its thumb edge to the knuckles. */
const BODY = pts([
  [-6, 22], [16, 24], [34, 11], [52, -11], [66, -32], [73, -50], [72, -64], [66, -74], [56, -82], [44, -82], [28, -62], [12, -42], [0, -28], [-6, -22],
]);
const THUMB = digitOutline([P(18, 10), P(69, 13), P(99, 19), P(109, -5)], [15, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(52, -44), P(78, -58), P(99, -52), P(112, -44)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(55, -58), P(88, -82), P(111, -72), P(115, -59)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(54, -66), P(83, -100), P(105, -91), P(108, -75)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(51, -70), P(78, -93), P(97, -95), P(111, -90)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_CELLO_STOP_TOP: BowedHandArt = {
  title: 'cello fingering (left) hand, seen from above',
  behind: [
    { id: 'body', outline: BODY, lights: [S(36, -10, 24, 12, -0.9, 0.22)], darks: [S(-3, 0, 3, 20, 0, 0.32), S(30, -60, 18, 4, -0.9, 0.28)] },
    { id: 'little', outline: LITTLE, lights: [S(78, -88, 10, 3, -0.6, 0.24)], darks: [S(88, -100, 10, 2.6, 0, 0.3)], dim: 0.18 },
    { id: 'ring', outline: RING, lights: [S(74, -82, 9, 3, -0.85, 0.24)], darks: [S(96, -96, 8, 2.6, 0.3, 0.3)], dim: 0.12 },
  ],
  front: [
    { id: 'middle', outline: MIDDLE, lights: [S(76, -66, 10, 3, -0.6, 0.26)], darks: [S(100, -84, 8, 2.6, 0.3, 0.3)], dim: 0.06, nails: [{ c: P(113.5, -63), len: 8, w: 3.6, rot: 1.27 }] },
    { id: 'index', outline: INDEX, lights: [S(70, -46, 12, 3, -0.45, 0.28)], darks: [S(88, -64, 10, 2.6, 0.1, 0.3)], nails: [{ c: P(108, -46.5), len: 8, w: 6.4, rot: 0.55 }] },
    { id: 'thumb', outline: THUMB, lights: [S(60, 4, 22, 3.4, 0.05, 0.3)], darks: [S(60, 22, 24, 3, 0.1, 0.3)], nails: [{ c: P(107, 4), len: 9, w: 3.4, rot: 1.97 }] },
  ],
  behindLines: [{ pts: pts([[60, -30], [40, -22], [20, -14]]), w: 0.7, o: 0.25 }],
  grip: P(112.1, -45.6),
  held: [{ kind: 'neck', a: P(128, -160), b: P(95, 40), r: 24 }],
  span: { c: P(55, -30), R: 80 },
};
