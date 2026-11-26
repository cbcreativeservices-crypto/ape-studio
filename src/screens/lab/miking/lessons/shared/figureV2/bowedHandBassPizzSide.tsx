/**
 * FIGURE V2 — THE DOUBLE BASS PIZZICATO HAND, SEEN FROM THE PLAYER'S RIGHT (C06a; side view).
 *
 * WHAT THE HAND DOES (jazz and orchestral pizzicato, as the lesson poses it — bowedHands.pluckHand): the THUMB's pad
 * anchored on the side of the fingerboard near its end (the low string's side); the INDEX and MIDDLE fingers lie
 * along the string with their pads on it just below the thumb, pulling it sideways toward the thumb (the side of the
 * finger, not the tip, does the work); the ring and little fingers curl loosely out of the way.
 *
 * WHAT THE EYE SEES from the player's right (read from the lesson's posed hand: the hand's THUMB edge faces the camera,
 * 0.85; the bass seen from its side, the board edge-on, the strings a line in front of it): the forearm out of the
 * cuff; the hand along its thumb edge, the back of the hand up; the thumb the nearest thing, down along the board's
 * edge to its anchor, its nail narrow on its outer side; the index in front of the middle finger, both coming down
 * onto the string, the middle finger's tip just past the index's; the ring and little fingers curled behind them, their
 * ends behind the board.
 * Paint: the ring and little fingers behind the instrument; the hand's body, the index, the middle finger and the
 * thumb over it.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist out of the cuff and the hand along its thumb edge to the knuckles. */
const BODY = pts([
  [-6, -20], [10, -18], [30, -6], [50, 8], [66, 22], [80, 36], [88, 48], [86, 60], [76, 64], [62, 62], [48, 56], [34, 46], [20, 34], [6, 24], [-6, 20],
]);
const THUMB = digitOutline([P(14, 18), P(27, 63), P(40, 90), P(47, 92)], [15, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(72, 52), P(105, 83), P(99, 104), P(85, 113)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(68, 46), P(101, 81), P(99, 106), P(90, 120)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(58, 38), P(77, 76), P(63, 97), P(48, 103)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(46, 28), P(59, 59), P(46, 73), P(32, 74)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_BASS_PIZZ_SIDE: BowedHandArt = {
  title: 'double bass plucking (pizzicato) hand, seen from the player’s right',
  behind: [
    { id: 'little', outline: LITTLE, dim: 0.2 },
    { id: 'ring', outline: RING, darks: [S(60, 98, 8, 3, 0.3, 0.3)], dim: 0.14 },
  ],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(36, 4, 30, 6, 0.6, 0.26), S(80, 40, 6, 4, 0.9, 0.28)],
      darks: [S(-3, 0, 3, 18, 0, 0.32), S(44, 50, 26, 3.4, 0.65, 0.28)],
    },
    { id: 'middle', outline: MIDDLE, lights: [S(96, 74, 3, 9, 0.6, 0.24)], darks: [S(94, 112, 3, 8, 0.4, 0.3)], dim: 0.08 },
    { id: 'index', outline: INDEX, lights: [S(90, 66, 10, 3, 0.75, 0.28)], darks: [S(88, 108, 8, 3, 0.4, 0.3)] },
    { id: 'thumb', outline: THUMB, lights: [S(18, 44, 4, 16, 0.2, 0.3)], darks: [S(34, 62, 4, 14, 0.3, 0.3)], nails: [{ c: P(44, 88.5), len: 9, w: 3.6, rot: 0.28 }] },
  ],
  frontLines: [{ pts: pts([[70, 44], [62, 40], [54, 34]]), w: 0.6, o: 0.4 }],
  grip: P(55.6, 113.1),
  held: [
    { kind: 'neck', a: P(-55.2, 9.9), b: P(82.8, 193.9), r: 36.5 },
    { kind: 'board', a: P(-27.4, -11), b: P(110.6, 173), r: 2.2 },
  ],
  span: { c: P(50, 50), R: 85 },
};
