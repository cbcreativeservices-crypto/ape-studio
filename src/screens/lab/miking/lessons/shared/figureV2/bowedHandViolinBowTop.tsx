/**
 * FIGURE V2 — THE VIOLIN (AND VIOLA) BOW HAND, SEEN FROM ABOVE (C09a standing and seated, C09b; the view from above,
 * also the setting plans).
 *
 * WHAT THE HAND DOES: the same Franco-Belgian bow hold as bowedHandViolinBowSide.tsx (bowedHands.bowHand,
 * BOW_HOLD.upper; written out there digit by digit): the back of the hand up; the stick lies INSIDE the hand, across
 * the fingers between their knuckles and their tips; the index touches it between its first and second joints, the
 * middle and ring fingers drape OVER it and curl down its far side (the ring's end over the frog), the little finger,
 * curved, stands with its tip on top of the stick; the BENT thumb's tip meets the stick from UNDER it at the frog's
 * front corner, opposite the middle finger — hidden from above under the index and the stick.
 *
 * WHAT THE EYE SEES from straight above (read from the lesson's posed hand: the back of the hand faces the camera,
 * 0.93): the forearm from the left out of the cuff; the broad back of the hand, the four knuckles a slanting row from
 * the index (upper left, the nearest) down to the little finger (lower right); the four fingers side by side reaching
 * up and to the right from them, each to its middle joint's bend just past the stick, where it turns down out of
 * sight (no nail shows: the end segments face away); the stick under the fingers, seen beyond the index and past the
 * little finger; along the hand's upper-left edge the thumb, lower than the hand, rising from the wrist to its tip
 * under the stick beside the index.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The wrist and the back of the hand to the knuckle row. */
// (round 2: the thumb's metacarpal and the web belong to the hand — its upper edge rises along the thumb's base to the
// thumb's knuckle, then the web runs over to the index's knuckle; only the thumb's two segments are their own form)
const BODY = pts([
  [-6, -25], [3, -34], [8, -48], [12, -62], [17, -73], [26, -77], [36, -80.5], [46, -86], [53, -90.5], [61, -93.5], [70, -89], [79, -79], [87, -68], [93, -57], [95.5, -47],
  [93, -38], [85, -28], [72, -12], [57, 4], [41, 16.5], [24, 23.5], [8, 25.5], [-6, 25],
]);
/** The thumb's two segments (lower than the hand, its tip under the stick beside the index): a soft bend at its middle
 *  joint, its root inside the hand at its knuckle. */
// (round 3: the thumb the thickest digit — its knuckle a full rounded form out of the hand, never a thin flap)
// (round 4, owner 2026-11-25: a slimmer thumb that reads as a digit, never a lobe; its tip goes on under the index)
const THUMB = digitOutline([P(12, -58), P(18, -75), P(41, -92), P(66, -97)], [10.5, 11.6, 10.6, 9.6]);
// (round 4, owner 2026-11-25 "the fingers are not attached": each finger grows out of the back of the hand from deep
// inside it (its root never outlined) and the four lie together, touching, draped over the stick; each ends at its
// middle joint's rounded bend where it turns down out of sight)
// (round 5, owner 2026-11-25 "fingers do not wrap around stick of bow": each finger crosses OVER the stick and its
// middle joint bends down just past it — the finger's end goes down round the far side of the stick, out of sight —
// no straight finger reaching on past the stick, no hooked end; the little finger, curved, stands with its tip on the
// stick)
const INDEX = digitOutline([P(46, -62), P(54, -84), P(61.9, -113.3)], [11.4, 11.4, 10.6]);
const MIDDLE = digitOutline([P(58, -56), P(70, -75), P(80.8, -96)], [12, 12, 11.2]);
const RING = digitOutline([P(64, -46), P(80, -61), P(99.6, -78.6)], [11.2, 11.2, 10.4]);
const LITTLE = digitOutline([P(66, -36), P(85, -44), P(111, -52)], [10, 10, 9.2]);

export const BOWED_HAND_VIOLIN_BOW_TOP: BowedHandArt = {
  title: 'violin and viola bow hand, seen from above',
  behind: [
    {
      id: 'thumb',
      outline: THUMB,
      lights: [S(20, -84, 6, 4, -0.6, 0.3), S(44, -100, 10, 3, 0.2, 0.26)],
      darks: [S(46, -84, 12, 3, 0.25, 0.3), S(30, -66, 10, 3, -0.6, 0.3)],
    },
  ],
  front: [
    {
      id: 'body',
      outline: BODY,
      lights: [S(36, -30, 34, 20, -0.85, 0.14), S(57, -86, 5.5, 4, -0.9, 0.32), S(70, -76, 5.5, 4, -0.9, 0.3), S(80, -63, 5, 3.6, -0.9, 0.28), S(88, -48, 4.4, 3.2, -0.9, 0.26)],
      darks: [S(-3, 0, 3, 22, 0, 0.32), S(62, -14, 26, 4, -0.85, 0.28), S(64, -78, 2.4, 1.4, -0.9, 0.24), S(75, -66, 2.4, 1.4, -0.9, 0.24), S(85, -53, 2.2, 1.3, -0.9, 0.22)],
    },
    // (each finger lit along its upper-left side; past the stick its bend turns down, away from us: a deepening tone)
    { id: 'little', outline: LITTLE, lights: [S(96, -52, 11, 2.6, -0.3, 0.26)], darks: [S(100, -42, 10, 2.4, -0.3, 0.3), S(116, -53, 4, 6, -0.3, 0.34)] },
    { id: 'ring', outline: RING, lights: [S(87, -74, 9, 2.8, -0.75, 0.26)], darks: [S(97, -66, 9, 2.6, -0.75, 0.3), S(104, -85, 6.5, 4, -0.75, 0.4)] },
    { id: 'middle', outline: MIDDLE, lights: [S(70, -88, 9, 3, -1.1, 0.26)], darks: [S(82, -82, 9, 2.6, -1.1, 0.3), S(84, -103, 6.5, 4, -0.5, 0.4)] },
    { id: 'index', outline: INDEX, lights: [S(52, -100, 3, 11, -0.25, 0.28)], darks: [S(66, -96, 2.6, 10, -0.25, 0.3), S(64, -120, 6.5, 4, -0.2, 0.4)] },
  ],
  frontLines: [
    // three faint tendons on the back of the hand
    { pts: pts([[22, -10], [38, -40], [52, -72]]), w: 0.9, o: 0.12 },
    { pts: pts([[24, 0], [46, -30], [68, -66]]), w: 0.9, o: 0.12 },
    { pts: pts([[26, 10], [52, -18], [80, -52]]), w: 0.9, o: 0.12 },
  ],
  cast: [S(92, -84, 22, 6, -0.75, 0.3)],
  grip: P(84.7, -83.0),
  held: [{ kind: 'stick', a: P(-25, -184), b: P(168, -8), r: 3.75 }],
  span: { c: P(50, -60), R: 85 },
};
