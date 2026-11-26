/**
 * FIGURE V2 — THE VIOLIN (AND VIOLA) STOPPING HAND, SEEN FROM ABOVE (C09a standing and seated, C09b; the view from
 * above, also the setting plans). The player's LEFT hand.
 *
 * WHAT THE HAND DOES: as bowedHandViolinStopSide.tsx (bowedHands.leftHand, first position): the neck between the thumb
 * and the base of the index, the thumb soft on the bass flank, the wrist straight, the four fingers arching over the
 * board from the treble side, each fingertip down on its string.
 *
 * WHAT THE EYE SEES from straight above (read from the lesson's posed hand): the neck and board a band across the
 * picture; the wrist out of the cuff BELOW it (the treble side) and the palm tilted up toward us under the board's
 * edge; the knuckles in a row slanting from the index (at the board's edge, right) to the little finger (lower left);
 * from them the four fingers rise toward us — the tops of their arches the nearest thing — and come down INTO the band,
 * their tips on the strings, the NAILS on top of the end segments facing up (the index's and the little finger's
 * clearest, the middle's and ring's turned more edge-on); beyond the neck's far edge only the thumb's tip shows.
 * Paint: the palm and thumb under the instrument (the neck covers them), the fingers over the board.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist and the palm (tilted up toward us) to the knuckle row. */
const BODY = pts([
  [-6, -24], [8, -25], [22, -29], [36, -33], [50, -31], [62, -23], [71, -13], [76, -3], [74, 5], [66, 11.5], [56, 17], [46, 22], [36, 27.5], [26, 32], [14, 33.5], [2, 30], [-6, 25],
]);
const THUMB = digitOutline([P(16, -14), P(30, -25), P(47, -43), P(60, -50)], [14, 12.6, 11.4, 10.4]);
// (round 2, owner 2026-11-25 "fingers attached": each finger rises out of the palm from deep inside it, along its own
// bone, so it flows into the hand; never a knob set on the palm's edge)
const INDEX = digitOutline([P(44, -2), P(66, -6), P(88, 5), P(77, -9), P(65, -18)], [10.6, 10.6, 9.8, 8.8, 7.8]);
// (the roots kept well inside the palm: no bump of a finger's root on the palm's lower edge)
const MIDDLE = digitOutline([P(42, 6), P(55, 6), P(51, 4), P(36, -12), P(33, -19)], [9, 10.4, 10.4, 9.2, 8.2]);
const RING = digitOutline([P(32, 12), P(41, 14), P(49, 0), P(28, -12), P(19, -9)], [8, 9.6, 9.8, 8.8, 7.8]);
const LITTLE = digitOutline([P(18, 16), P(24, 18), P(23, 9), P(7, -1), P(-6, -2)], [7.5, 8.6, 8.6, 7.8, 7]);

export const BOWED_HAND_VIOLIN_STOP_TOP: BowedHandArt = {
  title: 'violin and viola fingering (left) hand, seen from above',
  behind: [
    { id: 'thumb', outline: THUMB, lights: [S(50, -46, 9, 3, -0.7, 0.24)], darks: [S(40, -30, 12, 3, -0.8, 0.3)], nails: [{ c: P(60, -47), len: 8, w: 5, rot: 1.62 }] },
    {
      id: 'body',
      outline: BODY,
      lights: [S(36, -16, 24, 8, -0.2, 0.24), S(40, 12, 14, 10, -0.6, 0.2)],
      darks: [S(30, 34, 22, 4, -0.5, 0.3), S(-3, 0, 3, 22, 0, 0.32), S(58, 10, 12, 3, -0.7, 0.26)],
    },
  ],
  front: [
    { id: 'little', outline: LITTLE, lights: [S(12, 2, 8, 3, 0.3, 0.26)], darks: [S(18, 14, 3, 8, 0.2, 0.3)], nails: [{ c: P(-2, -2.2), len: 7, w: 4.6, rot: 0.08 }] },
    { id: 'index', outline: INDEX, lights: [S(78, -6, 8, 3, 0.6, 0.26)], darks: [S(78, 6, 8, 2.4, 0.4, 0.3)], nails: [{ c: P(68, -16), len: 8, w: 5.8, rot: 0.64 }] },
    { id: 'ring', outline: RING, lights: [S(36, -6, 8, 3, 0.5, 0.26)], darks: [S(44, 8, 3, 8, 0.3, 0.3)], nails: [{ c: P(22, -10.2), len: 7, w: 3.6, rot: -0.32 }] },
    { id: 'middle', outline: MIDDLE, lights: [S(43, -4, 3, 9, 0.7, 0.28)], darks: [S(52, 2, 3, 8, 0.7, 0.3)], nails: [{ c: P(34.5, -16), len: 6, w: 3.2, rot: 1.16 }] },
  ],
  grip: P(32.4, -25.0),
  held: [
    { kind: 'neck', a: P(-35, -22), b: P(100, -27.5), r: 17.5 },
    { kind: 'board', a: P(-35, -14), b: P(100, -21), r: 12.5 },
  ],
  span: { c: P(36, -6), R: 70 },
};
