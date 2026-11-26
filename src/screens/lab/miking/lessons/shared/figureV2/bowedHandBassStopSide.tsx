/**
 * FIGURE V2 — THE DOUBLE BASS STOPPING HAND, SEEN FROM THE PLAYER'S RIGHT (C06a and C06b; side view). The player's LEFT
 * hand, on the far side of the body: dimmed a step as every far part.
 *
 * WHAT THE HAND DOES (first position, as the lessons pose it — bowedHands.leftHand): the Simandl fingering 1-2-4 (the
 * ring finger pressing just behind the little finger, the two working together), the hand spanning ≈ 108 mm; the
 * fingers curved from knuckles that stand well out from the wide board (never clawed); the THUMB relaxed on the BACK of
 * the neck behind the second finger; the wrist naturally a little bent.
 *
 * WHAT THE EYE SEES from the player's right (read from the lesson's posed hand: the PALM faces the camera, 0.85; the
 * bass's neck seen exactly from its side, the board edge-on and the strings a line just in front of it): the forearm
 * rising out of the cuff on the neck's back side; on that side the thumb, its end toward us with its nail; the palm and
 * knuckles behind the neck (it crosses in front of them); past the board's edge the four fingertips curling onto their
 * strings, the middle and ring fingers' nails toward us.
 * Paint: the whole hand behind the instrument (the neck in front covers what lies behind it).
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist out of the cuff and the palm (toward us) to the knuckles. */
const BODY = pts([
  [-6, -21], [10, -22], [26, -22], [44, -14], [60, 0], [76, 14], [90, 28], [96, 40], [92, 54], [82, 64], [68, 74], [52, 84], [36, 82], [20, 64], [8, 44], [-2, 30], [-6, 24],
]);
const THUMB = digitOutline([P(20, -4), P(32, -12), P(38, 4), P(42, 27)], [15, 13, 11.5, 10]);
const INDEX = digitOutline([P(76, 34), P(119, 46), P(131, 50), P(134, 53)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(68, 50), P(106, 83), P(104, 91), P(94, 86)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(56, 62), P(83, 99), P(81, 111), P(71, 108)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(40, 70), P(51, 96), P(54, 110), P(56, 122)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_BASS_STOP_SIDE: BowedHandArt = {
  title: 'double bass fingering (left) hand, seen from the player’s right',
  behind: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(44, 30, 28, 16, 0.75, 0.22)],
      darks: [S(-3, 0, 3, 18, 0, 0.32), S(46, 76, 22, 4, -0.5, 0.26)],
    },
    { id: 'thumb', outline: THUMB, lights: [S(30, 4, 6, 10, 0.2, 0.28)], darks: [S(44, 12, 4, 12, 0.2, 0.3)], nails: [{ c: P(41.5, 19.5), len: 10, w: 7, rot: 1.4 }] },
    { id: 'little', outline: LITTLE, lights: [S(46, 96, 3, 10, 0.3, 0.24)], darks: [S(56, 100, 3, 10, 0.3, 0.3)] },
    { id: 'index', outline: INDEX, lights: [S(110, 40, 12, 3, 0.25, 0.24)], darks: [S(108, 52, 12, 2.6, 0.25, 0.3)] },
    { id: 'ring', outline: RING, lights: [S(70, 82, 3, 10, -0.5, 0.24)], darks: [S(80, 84, 3, 10, -0.5, 0.3)], nails: [{ c: P(74, 109.5), len: 8, w: 5, rot: 0.29 }] },
    { id: 'middle', outline: MIDDLE, lights: [S(84, 62, 12, 3, 0.7, 0.24)], darks: [S(92, 72, 12, 2.6, 0.7, 0.3)], nails: [{ c: P(96.5, 88), len: 8, w: 6, rot: 0.46 }] },
  ],
  front: [],
  behindLines: [{ pts: pts([[76, 26], [56, 14], [36, 2], [20, -6]]), w: 0.7, o: 0.3 }],
  grip: P(79.8, 67.9),
  held: [
    { kind: 'neck', a: P(174.4, -50.6), b: P(-74, 198), r: 32 },
    { kind: 'board', a: P(195.6, -29.4), b: P(-52.4, 218.6), r: 2.5 },
  ],
  span: { c: P(50, 40), R: 85 },
};
