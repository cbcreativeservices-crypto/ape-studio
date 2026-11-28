/**
 * FIGURE V2 — THE DOUBLE BASS STOPPING HAND, SEEN FROM ABOVE (C06a and C06b; the view from above, also the setting
 * plans). The player's LEFT hand.
 *
 * WHAT THE HAND DOES: as bowedHandBassStopSide.tsx (bowedHands.leftHand, first position, 1-2-4): the fingers curved
 * from knuckles standing out from the wide board, the ring finger pressing beside the little finger, the thumb relaxed
 * on the back of the neck behind the second finger.
 *
 * WHAT THE EYE SEES from straight above (read from the lesson's posed hand: the hand's THUMB edge faces up toward the
 * camera, 0.86): the forearm out of the cuff; the hand seen along its thumb and index edge, the thumb on top lying
 * along the back of the neck; the index nearest of the fingers, its arch round the neck and its nail on the end segment
 * toward us; the middle finger beside it, its nail more edge-on; the ring and little fingers lower, under the neck.
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
  [-6, 24], [16, 28], [36, 28], [60, 24], [84, 20], [98, 14], [106, 4], [104, -10], [100, -24], [94, -34], [70, -34], [44, -31], [22, -27], [6, -24], [-6, -22],
]);
const THUMB = digitOutline([P(16, 14), P(46, 57), P(75, 69), P(88, 47)], [15, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(84, 4), P(115, -2), P(132, 8), P(143, 22)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(92, -4), P(137, -19), P(156, -2), P(156, 13)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(92, -10), P(134, -32), P(154, -20), P(156, -4)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(88, -16), P(126, -14), P(144, -12), P(160, -10)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_BASS_STOP_TOP: BowedHandArt = {
  title: 'double bass fingering (left) hand, seen from above',
  behind: [
    { id: 'body', outline: BODY, lights: [S(50, 10, 34, 10, 0.05, 0.22)], darks: [S(-3, 0, 3, 20, 0, 0.32), S(50, -28, 34, 4, -0.05, 0.28)] },
    { id: 'little', outline: LITTLE, lights: [S(124, -18, 12, 3, 0.05, 0.24)], darks: [S(124, -8, 12, 2.6, 0.05, 0.3)], dim: 0.18, nails: [{ c: P(156, -10.5), len: 7.5, w: 4.5, rot: 0.12 }] },
    { id: 'ring', outline: RING, lights: [S(122, -30, 10, 3, -0.4, 0.24)], darks: [S(146, -16, 8, 2.6, 0.5, 0.3)], dim: 0.12 },
  ],
  front: [
    { id: 'middle', outline: MIDDLE, lights: [S(124, -20, 12, 3, -0.3, 0.26)], darks: [S(150, 2, 3, 8, 0, 0.3)], dim: 0.06, nails: [{ c: P(156.5, 9), len: 8, w: 3.4, rot: 1.57 }] },
    { id: 'index', outline: INDEX, lights: [S(110, -6, 12, 3, -0.2, 0.28)], darks: [S(126, 12, 10, 2.6, 0.5, 0.3)], nails: [{ c: P(140, 18), len: 8.5, w: 6.5, rot: 0.9 }] },
    { id: 'thumb', outline: THUMB, lights: [S(40, 40, 6, 18, -0.6, 0.3)], darks: [S(62, 70, 14, 3, 0.4, 0.3)] },
  ],
  behindLines: [{ pts: pts([[80, -20], [56, -14], [30, -10]]), w: 0.7, o: 0.25 }],
  grip: P(133.4, 19.7),
  held: [{ kind: 'neck', a: P(34.6, 88.9), b: P(231.4, -47.9), r: 29 }],
  span: { c: P(70, 10), R: 90 },
};
