/**
 * FIGURE V2 — THE CELLO BOW HAND, SEEN FROM ABOVE (C09c; the view from above, also the setting plans).
 *
 * WHAT THE HAND DOES: the cello bow hold as bowedHandCelloBowSide.tsx (bowedHands.bowHand, BOW_HOLD.lower): a round,
 * deep hand hanging over the stick at the frog, the fingers draped well round the stick and spread a little, the
 * little finger down on the frog's far face, the bent thumb's tip under the stick at the frog's corner.
 *
 * WHAT THE EYE SEES from straight above (read from the lesson's posed hand: the back of the hand faces up and away
 * from the wrist, 0.55; the hand sinks AWAY from us from the wrist to the knuckles): the forearm from the left out of
 * the cuff; the back of the hand, the knuckles a row across it (the index at the top, the little finger at the
 * bottom), each a low swell; past them the four fingers' first segments falling away from us to their middle joints —
 * a row of rounded bends along the fist's right edge, parted by short creases; the fingers' ends curl back under the
 * hand, out of sight (no nail shows); at the top left only the thumb's knuckle shows beside the wrist, the rest of the
 * thumb under the hand. The stick passes UNDER the hand: it shows beyond the index (toward the bow's tip, up and to
 * the right) and below the little finger, where the frog is.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist and the back of the hand to the knuckle row. */
const BODY = pts([
  [-6, -25], [8, -27], [22, -31], [36, -34], [50, -32.5], [62, -30], [70, -26], [74, -17], [72, -6], [67, 6], [61, 18], [55, 30], [48, 39], [38, 42], [24, 38], [10, 32], [-6, 26],
]);
// (round 2, owner 2026-11-25: the thumb shows only its knuckle beside the wrist — no lobe; each finger grows out of
// the back of the hand from deep inside it and ends in its rounded middle joint where it turns down — no hook)
const THUMB = digitOutline([P(16, -12), P(24, -30), P(34, -29), P(40, -18)], [11, 10.6, 9.8, 9.2]);
const INDEX = digitOutline([P(48, -4), P(62, -16), P(78, -33)], [10.6, 10.6, 10.2]);
const MIDDLE = digitOutline([P(46, 4), P(60, 0), P(73, -5)], [11, 11, 10.6]);
const RING = digitOutline([P(42, 14), P(54, 16), P(66, 27)], [10.4, 10.4, 10.2]);
const LITTLE = digitOutline([P(34, 24), P(44, 30), P(53, 44)], [9.2, 9.2, 9]);

export const BOWED_HAND_CELLO_BOW_TOP: BowedHandArt = {
  title: 'cello bow hand, seen from above',
  behind: [{ id: 'thumb', outline: THUMB, lights: [S(24, -44, 8, 4, -0.4, 0.28)], darks: [S(36, -24, 5, 8, 0.3, 0.3)] }],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(30, -10, 24, 14, -0.2, 0.24), S(64, -22, 5, 4, -0.6, 0.3), S(62, -4, 5, 4, -0.6, 0.28), S(56, 14, 4.6, 3.6, -0.6, 0.26), S(48, 30, 4, 3.2, -0.6, 0.24)],
      darks: [S(-3, 0, 3, 22, 0, 0.32), S(30, 38, 22, 4, 0.2, 0.28), S(66, -12, 2.4, 1.4, -0.6, 0.24), S(60, 6, 2.4, 1.4, -0.6, 0.24), S(52, 22, 2.2, 1.3, -0.6, 0.22)],
    },
    { id: 'little', outline: LITTLE, lights: [S(48, 38, 4, 7, -0.5, 0.26)], darks: [S(54, 50, 6, 3, -0.4, 0.36)] },
    { id: 'ring', outline: RING, lights: [S(58, 20, 4, 8, -0.75, 0.26)], darks: [S(66, 32, 6, 3, -0.3, 0.36)] },
    { id: 'middle', outline: MIDDLE, lights: [S(64, -4, 7, 4, -0.3, 0.26)], darks: [S(76, -9, 4, 6, -0.3, 0.36)] },
    { id: 'index', outline: INDEX, lights: [S(68, -28, 4, 9, 0.7, 0.28)], darks: [S(80, -40, 6, 3.6, -0.6, 0.36)] },
  ],
  frontLines: [
    // three faint tendons on the back of the hand
    { pts: pts([[16, -14], [36, -14], [58, -14]]), w: 0.9, o: 0.12 },
    { pts: pts([[16, -2], [36, 0], [56, 4]]), w: 0.9, o: 0.12 },
    { pts: pts([[16, 10], [34, 14], [50, 22]]), w: 0.9, o: 0.12 },
  ],
  cast: [S(84, -46, 10, 4, -1.15, 0.3), S(40, 52, 14, 4, -1.15, 0.3)],
  grip: P(41.6, 10.0),
  held: [{ kind: 'stick', a: P(100, -137), b: P(-7, 125), r: 3.75 }],
  span: { c: P(36, 0), R: 70 },
};
