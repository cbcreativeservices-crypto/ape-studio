/**
 * FIGURE V2 — THE CELLO STOPPING HAND, SEEN FROM THE PLAYER'S RIGHT (C09c; side view). The player's LEFT hand, on the
 * far side of the body: dimmed a step as every far part.
 *
 * WHAT THE HAND DOES (first position, as the lesson poses it — bowedHands.leftHand): one finger per semitone (fingers
 * 1-2-3-4 on semitones, the hand spanning ≈ 98 mm), each fingertip pressing its string to the board; the fingers
 * ROUNDED, arched from the knuckles, which stand clear of the neck on the bass side; the THUMB relaxed on the BACK of
 * the neck behind the second finger (never squeezing); the wrist naturally a little bent, the elbow up.
 *
 * WHAT THE EYE SEES from the player's right (read from the lesson's posed hand: the PALM faces the camera, 0.83; the
 * cello's neck seen from its side, the board edge-on, the strings a line just in front of it): the forearm rising out
 * of the cuff on the neck's back side; the palm behind the neck (the neck crosses in front of it); on the neck's back
 * side the thumb, its nail turned toward us; beyond the strings the four fingers' arches, each coming round the neck
 * and down onto its string, the end segments with their nails toward us — the index highest and farthest along the
 * neck, the little finger lowest and shortest.
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
  [-6, -21], [8, -21], [22, -23], [36, -18], [50, -8], [64, 8], [76, 26], [86, 42], [88, 52], [82, 60], [70, 66], [56, 72], [42, 77], [28, 80], [16, 76], [6, 60], [-2, 42], [-6, 26],
]);
const THUMB = digitOutline([P(24, -6), P(43, -14), P(50, -21), P(49, 2)], [14.5, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(72, 44), P(107, 59), P(110, 53), P(103, 44)], [10.6, 9.9, 8.9, 7.8]);
const MIDDLE = digitOutline([P(60, 57), P(89, 82), P(84, 72), P(73, 59)], [11, 10.3, 9.3, 8.1]);
const RING = digitOutline([P(45, 65), P(55, 100), P(49, 90), P(43, 74)], [10.4, 9.7, 8.8, 7.7]);
const LITTLE = digitOutline([P(27, 70), P(25, 93), P(21, 94), P(16, 88)], [9.2, 8.6, 7.8, 6.9]);

export const BOWED_HAND_CELLO_STOP_SIDE: BowedHandArt = {
  title: 'cello fingering (left) hand, seen from the player’s right',
  behind: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(40, 30, 26, 16, 0.75, 0.22), S(28, -12, 10, 6, 0.3, 0.26)],
      darks: [S(-3, 0, 3, 18, 0, 0.32), S(40, 70, 22, 4, -0.3, 0.26), S(50, 38, 14, 3, 0.8, 0.2)],
    },
    { id: 'thumb', outline: THUMB, lights: [S(44, -22, 8, 3.4, 0.2, 0.28)], darks: [S(34, 0, 9, 3, 0.3, 0.3)], nails: [{ c: P(51, -4), len: 10, w: 6.6, rot: 1.61 }] },
    { id: 'index', outline: INDEX, lights: [S(96, 50, 10, 3, 0.35, 0.24)], darks: [S(92, 62, 10, 2.6, 0.35, 0.3)], nails: [{ c: P(106, 45.5), len: 8, w: 6, rot: 0.96 }] },
    { id: 'little', outline: LITTLE, lights: [S(22, 82, 3, 8, 0, 0.24)], darks: [S(30, 88, 3, 7, 0, 0.3)], nails: [{ c: P(18, 89.5), len: 7, w: 4.5, rot: 0.88 }] },
    { id: 'ring', outline: RING, lights: [S(46, 84, 3, 10, 0.25, 0.24)], darks: [S(56, 86, 3, 9, 0.25, 0.3)], nails: [{ c: P(45, 78.5), len: 8.5, w: 7, rot: 1.21 }] },
    { id: 'middle', outline: MIDDLE, lights: [S(76, 72, 9, 3, 0.75, 0.24)], darks: [S(86, 70, 9, 2.6, 0.9, 0.3)], nails: [{ c: P(76.5, 63), len: 9, w: 7.4, rot: 0.87 }] },
  ],
  front: [],
  behindLines: [
    // the palm's creases, faint: the thumb's mound and the line under the fingers
    { pts: pts([[60, 16], [42, 6], [26, -4], [14, -8]]), w: 0.7, o: 0.3 },
    { pts: pts([[76, 50], [58, 58], [40, 64]]), w: 0.7, o: 0.3 },
  ],
  grip: P(50.6, 45.0),
  held: [
    { kind: 'neck', a: P(164.5, -21.5), b: P(-102.5, 113.5), r: 22.7 },
    { kind: 'board', a: P(173.5, 0.5), b: P(-93.5, 135.5), r: 3 },
  ],
  span: { c: P(50, 40), R: 80 },
};
