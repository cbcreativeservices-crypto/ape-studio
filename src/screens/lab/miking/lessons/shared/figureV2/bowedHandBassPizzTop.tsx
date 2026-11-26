/**
 * FIGURE V2 — THE DOUBLE BASS PIZZICATO HAND, SEEN FROM ABOVE (C06a; the view from above, also the setting plan).
 *
 * WHAT THE HAND DOES: as bowedHandBassPizzSide.tsx (bowedHands.pluckHand): the thumb anchored on the board's edge near
 * its end, the index and middle fingers' pads on the string just below it pulling it sideways, the ring and little
 * fingers curled loosely.
 *
 * WHAT THE EYE SEES from straight above (read from the lesson's posed hand: the back of the hand faces up, 0.55): the
 * forearm out of the cuff; the back of the hand, the knuckles a row across it; the four fingers reaching on over the
 * strings to their middle joints and bending down, their ends coming back under them toward the strings (their nails
 * face away: none shows); the thumb under the wrist, out of sight, anchored on the board's edge.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist and the back of the hand to the knuckle row. */
const BODY = pts([
  [-6, -24], [20, -27], [32, -28], [62, -23], [86, -14], [92, -4], [90, 8], [84, 20], [74, 32], [62, 42], [50, 50], [38, 48], [24, 40], [8, 30], [-6, 26],
]);
const THUMB = digitOutline([P(5, 4), P(-10, 18), P(-13, 21), P(12, 15)], [14, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(50, 36), P(76, 46), P(74, 33), P(66, 19)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(64, 25), P(97, 30), P(100, 18), P(96, 6)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(72, 13), P(99, 4), P(93, -14), P(81, -27)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(76, 1), P(98, -8), P(90, -23), P(78, -33)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_BASS_PIZZ_TOP: BowedHandArt = {
  title: 'double bass plucking (pizzicato) hand, seen from above',
  behind: [{ id: 'thumb', outline: THUMB }],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(34, -6, 28, 14, -0.2, 0.24), S(64, 30, 5, 4, -0.5, 0.3), S(76, 18, 5, 4, -0.5, 0.28), S(84, 6, 4.6, 3.6, -0.5, 0.26), S(86, -6, 4, 3.2, -0.5, 0.24)],
      darks: [S(-3, 0, 3, 22, 0, 0.32), S(40, 44, 22, 4, -0.3, 0.28)],
    },
    { id: 'index', outline: INDEX, lights: [S(64, 38, 10, 3, 0.4, 0.26)], darks: [S(70, 26, 6, 3, 0.9, 0.34)] },
    { id: 'middle', outline: MIDDLE, lights: [S(80, 24, 12, 3, 0.15, 0.26)], darks: [S(98, 12, 3, 7, 0.2, 0.34)] },
    { id: 'ring', outline: RING, lights: [S(86, 4, 10, 3, -0.3, 0.26)], darks: [S(88, -20, 6, 3, 0.8, 0.34)] },
    { id: 'little', outline: LITTLE, lights: [S(88, -6, 9, 3, -0.4, 0.28)], darks: [S(84, -28, 6, 3, 0.7, 0.34)] },
  ],
  frontLines: [
    { pts: pts([[18, -10], [40, -8], [62, -4]]), w: 0.9, o: 0.12 },
    { pts: pts([[18, 4], [40, 8], [60, 14]]), w: 0.9, o: 0.12 },
  ],
  grip: P(60.2, -10.1),
  held: [
    { kind: 'board', a: P(28.2, -68), b: P(101.3, 65), r: 50 },
  ],
  span: { c: P(45, 5), R: 75 },
};
