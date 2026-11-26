/**
 * FIGURE V2 — THE DOUBLE BASS BOW HAND (FRENCH BOW), SEEN FROM ABOVE (C06b; the view from above, also the setting plan).
 *
 * WHAT THE HAND DOES: as bowedHandBassBowSide.tsx (bowedHands.bowHand, BOW_HOLD.lower — the French bass bow held as a
 * cello bow): a round hand draped over the stick at the frog, the little finger down on the frog's far face, the bent
 * thumb's tip under the stick at the frog's corner.
 *
 * WHAT THE EYE SEES from straight above (read from the lesson's posed hand: the back of the hand faces up, 0.68): the
 * forearm out of the cuff; the back of the hand, the knuckles a slanting row across it, each a low swell; past them the
 * fingers' first segments falling away from us to their middle joints — a row of rounded bends along the fist's edge —
 * their ends curled back under the hand, out of sight (no nail shows); the thumb under the hand. The stick passes
 * UNDER the hand, showing beyond the index toward the bow's tip and past the little finger, where the frog is.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist and the back of the hand to the knuckle row. */
const BODY = pts([
  [-6, -25], [8, -28], [24, -33], [40, -36], [56, -34], [72, -25], [84, -17], [92, -10], [95, 0], [91, 10], [81, 23], [69, 35], [57, 45], [43, 48], [28, 44], [12, 36], [-6, 26],
]);
const THUMB = digitOutline([P(18, -14), P(57, -35), P(71, -24), P(77, -9)], [14.5, 12.4, 11.2, 10]);
const INDEX = digitOutline([P(78, -4), P(113, -17), P(110, -29)], [10.6, 10.2, 9.2]);
const MIDDLE = digitOutline([P(72, 10), P(106, 0), P(99, -8)], [11, 10.6, 9.6]);
const RING = digitOutline([P(61, 22), P(90, 30), P(84, 24)], [10.4, 10.2, 9.2]);
const LITTLE = digitOutline([P(48, 34), P(65, 49), P(60, 46)], [9.2, 9, 8.2]);

export const BOWED_HAND_BASS_BOW_TOP: BowedHandArt = {
  title: 'double bass bow hand (French bow), seen from above',
  behind: [{ id: 'thumb', outline: THUMB, lights: [S(54, -36, 8, 3.4, -0.5, 0.26)], darks: [S(70, -18, 4, 8, 0.4, 0.3)] }],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(36, -14, 26, 14, -0.3, 0.24), S(82, -10, 5, 4, -0.8, 0.3), S(74, 6, 5, 4, -0.8, 0.28), S(64, 20, 4.6, 3.6, -0.8, 0.26), S(52, 32, 4, 3.2, -0.8, 0.24)],
      darks: [S(-3, 0, 3, 22, 0, 0.32), S(34, 42, 22, 4, -0.3, 0.28), S(80, 2, 2.4, 1.4, -0.8, 0.24), S(70, 16, 2.4, 1.4, -0.8, 0.24), S(58, 28, 2.2, 1.3, -0.8, 0.22)],
    },
    { id: 'little', outline: LITTLE, lights: [S(54, 38, 4, 7, -0.6, 0.26)], darks: [S(64, 50, 6, 3, -0.4, 0.36)] },
    { id: 'ring', outline: RING, lights: [S(74, 24, 8, 4, 0.3, 0.26)], darks: [S(90, 32, 4, 6, 0.3, 0.36)] },
    { id: 'middle', outline: MIDDLE, lights: [S(88, 2, 8, 4, -0.3, 0.26)], darks: [S(106, 2, 4, 6, -0.3, 0.36)] },
    { id: 'index', outline: INDEX, lights: [S(94, -14, 8, 4, -0.4, 0.28)], darks: [S(114, -22, 4, 6, -0.4, 0.36)] },
  ],
  frontLines: [
    { pts: pts([[16, -16], [38, -16], [62, -12]]), w: 0.9, o: 0.12 },
    { pts: pts([[16, -4], [38, -2], [60, 4]]), w: 0.9, o: 0.12 },
    { pts: pts([[16, 8], [36, 12], [54, 20]]), w: 0.9, o: 0.12 },
  ],
  cast: [S(126, -42, 10, 4, -0.8, 0.3), S(40, 54, 14, 4, -0.8, 0.3)],
  grip: P(68.7, 14.1),
  held: [{ kind: 'stick', a: P(155, -73), b: P(-13, 91), r: 3.75 }],
  span: { c: P(40, 0), R: 75 },
};
