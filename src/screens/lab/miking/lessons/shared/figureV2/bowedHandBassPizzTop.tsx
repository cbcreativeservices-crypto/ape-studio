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
// (round 2, owner 2026-11-25: the thumb lies under the wrist from here — out of sight, so it is not drawn (it showed
// as a lobe beside the cuff); each finger grows out of the back of the hand from deep inside it and ends in its
// rounded middle joint where it bends down toward the strings — no hooked ends)
const INDEX = digitOutline([P(40, 30), P(57, 35), P(75, 44)], [10.6, 10.6, 10]);
const MIDDLE = digitOutline([P(50, 22), P(72, 25), P(95, 28)], [11, 11, 10.4]);
const RING = digitOutline([P(58, 12), P(80, 13), P(97, 5)], [10.4, 10.4, 9.8]);
const LITTLE = digitOutline([P(62, 2), P(83, 1), P(96, -6)], [9.2, 9.2, 8.8]);

export const BOWED_HAND_BASS_PIZZ_TOP: BowedHandArt = {
  title: 'double bass plucking (pizzicato) hand, seen from above',
  behind: [],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(34, -6, 28, 14, -0.2, 0.24), S(64, 30, 5, 4, -0.5, 0.3), S(76, 18, 5, 4, -0.5, 0.28), S(84, 6, 4.6, 3.6, -0.5, 0.26), S(86, -6, 4, 3.2, -0.5, 0.24)],
      darks: [S(-3, 0, 3, 22, 0, 0.32), S(40, 44, 22, 4, -0.3, 0.28)],
    },
    { id: 'index', outline: INDEX, lights: [S(64, 36, 10, 3, 0.4, 0.26)], darks: [S(82, 48, 5, 6, 0.4, 0.34)] },
    { id: 'middle', outline: MIDDLE, lights: [S(80, 22, 12, 3, 0.15, 0.26)], darks: [S(102, 29, 4, 7, 0.1, 0.34)] },
    { id: 'ring', outline: RING, lights: [S(84, 9, 10, 3, -0.2, 0.26)], darks: [S(103, 3, 4, 7, -0.4, 0.34)] },
    { id: 'little', outline: LITTLE, lights: [S(84, -3, 9, 3, -0.3, 0.28)], darks: [S(101, -8, 4, 6, -0.5, 0.34)] },
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
