/**
 * FIGURE V2 — THE VIOLIN (AND VIOLA) BOW HAND, SEEN FROM THE PLAYER'S RIGHT (C09a standing and seated, C09b; side view).
 *
 * WHAT THE HAND DOES — the Franco-Belgian bow hold (the standard violin and viola hold; the lessons pose it in
 * bowedHands.bowHand, BOW_HOLD.upper). The bow is held at the frog, the back of the hand up, every joint soft:
 *   • THE THUMB is BENT outward at its middle joint, never straight or locked; its tip (the corner of the pad) sits
 *     against the stick where the stick meets the front of the frog, from UNDER the stick — opposite the middle finger.
 *   • THE INDEX finger touches the stick on its side, between its first and second joints (on the grip winding); its
 *     end hangs on over the far side. It carries the arm's weight into the string.
 *   • THE MIDDLE finger drapes over the stick opposite the thumb; its end curls down the far side of the stick toward
 *     the frog, its pad near the thumb's tip: thumb and middle finger together hold the bow.
 *   • THE RING finger drapes over the stick further back, its end over the frog, its pad on the frog's far side.
 *   • THE LITTLE finger is CURVED, its TIP standing ON TOP of the stick near the frog's back end: it balances the bow.
 * The stick therefore lies INSIDE the hand: across the fingers between the knuckles and the fingertips, the thumb
 * under it, the fingers over it. The picture is near the end of a down-bow (the arm reaching forward, the frog far from
 * the strings, the stick running back up-left toward the violin).
 *
 * WHAT THE EYE SEES from the player's right (the lesson's side camera; read from the lesson's posed hand): the back of
 * the hand turned toward us and up, the LITTLE finger's side nearest. The wrist out of the cuff; the back of the hand
 * rising to its knuckle row; the stick coming from behind the wrist and the back of the hand, leaving the palm at its
 * lower edge under the fingers. Each finger comes down from its knuckle, goes OVER the top of the stick and curls on
 * round BEHIND it — so the stick crosses IN FRONT of each finger's end: the near part of the finger, the stick, then
 * the finger's end below the stick turned back toward the thumb (the index's farthest, by the palm; the middle's and
 * ring's longer; the ring's over the frog). The little finger, curved, stands with its tip on top of the stick. Under
 * the palm the bent thumb — the thickest digit — runs out from the wrist and its tip meets the stick from below, just
 * where the stick leaves the palm, opposite the middle finger. No nail shows on the curled fingers (they face away);
 * the little finger's shows narrow on the back of its tip.
 * Paint: the thumb and the fingers' ends (behind the stick) → the stick and frog → the hand and the fingers' near parts
 * → the stick's near half again where each finger goes round behind it (`heldFront`).
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm: origin at the sleeve's cuff, +x along the forearm, +y a quarter turn
 * clockwise (down the page for this view). The stick's axis here: y ≈ −3 + 0.88 (x − 40), radius 3.75.
 */
import { P, type Poly } from './geom.ts';
import { digitOutline, type BowedHandArt, type BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });
/** The stick's axis on the page (this frame): its height at x. */
const stickY = (x: number) => -3 + 0.88 * (x - 40);

/** The back of the hand, the wrist and the palm's lower edge, which lies along the top of the stick (the fingers grow
 *  out of its right side). */
// (round 4, owner 2026-11-25 "fingers do not wrap around stick of bow": the palm's lower edge lifted to the stick —
// the stick leaves the hand UNDER the fingers, where they close round it — and the bent thumb shows whole beneath)
const BODY = pts([
  [-6, -21.5], [6, -21], [16, -22.5], [26, -26], [36, -30.5], [46, -33.5], [55, -34], [63, -31], [71, -26], [78, -20], [84, -13], [88, -5],
  [88, 4], [83, 10.5], [74, 11.5], [64, 8], [56, 3.5], [47, 1.5], [36, 3.5], [24, 7.5], [12, 13], [-6, 20.5],
]);
// THE FINGERS, each in two parts: its NEAR part (in front) from deep inside the back of the hand to where it goes over
// the top of the stick; its END (behind the stick) from inside the stick's band down and curling back toward the thumb.
/** The index: over the stick just under the palm's edge; its end curls back under, toward the thumb. */
const INDEX_NEAR = digitOutline([P(40, -16), P(56, -16), P(56.5, -1)], [11, 10.4, 9.4]);
const INDEX_END = digitOutline([P(54, stickY(54) + 2), P(51.5, 15), P(47, 18.5), P(43.5, 17)], [9.2, 8.8, 8.2, 7.6]);
/** The middle finger, opposite the thumb: over the stick at its end joint; its end curls down behind toward the thumb. */
const MIDDLE_NEAR = digitOutline([P(52, -12), P(68, -12), P(84, 2), P(78, 24)], [11.5, 11.5, 10.8, 9.8]);
const MIDDLE_END = digitOutline([P(77, stickY(77) + 1.5), P(73, 36), P(66, 38.5), P(60.5, 35.5)], [9.4, 9, 8.6, 7.8]);
/** The ring finger: over the stick further back; its end over the frog. */
const RING_NEAR = digitOutline([P(62, -4), P(78, -4), P(103, 10), P(99, 29), P(94, 35.5)], [11, 11, 10.2, 9.3, 9]);
const RING_END = digitOutline([P(91, stickY(91) + 1.5), P(87, 47.5), P(81, 49), P(76.5, 45.5)], [8.8, 8.4, 8, 7.4]);
/** The little finger (nearest): curved, its tip standing on top of the stick. */
const LITTLE = digitOutline([P(66, 3), P(83, 3), P(112, 10), P(114, 27), P(103.5, 39.5)], [9.8, 9.8, 9.1, 8.3, 7.4]);
/** The thumb (behind the stick, under the palm): the thickest digit, bent at its middle joint, its tip meeting the
 *  stick from below where the stick leaves the palm, opposite the middle finger. */
const THUMB = digitOutline([P(8, 6), P(16, 14), P(36, 22.5), P(60.5, 24.5)], [11.5, 13.6, 12, 10.6]);

/** The stick's near half (its lower half on the page) along the fingers that go round behind it. */
const NEAR_HALF: Poly = [P(50, stickY(50) - 0.3), P(98, stickY(98) - 0.3), P(98, stickY(98) + 5.6), P(50, stickY(50) + 5.6)];

export const BOWED_HAND_VIOLIN_BOW_SIDE: BowedHandArt = {
  title: 'violin and viola bow hand, seen from the player’s right',
  behind: [
    {
      id: 'thumb',
      outline: THUMB,
      lights: [S(34, 15.5, 16, 3, 0.15, 0.3), S(16, 10, 5, 4, 0.6, 0.26)],
      darks: [S(36, 32, 20, 2.6, 0.1, 0.32), S(36, 31.5, 1.4, 3.4, 0, 0.3)],
    },
    // (the fingers' ends, behind the stick: a step deeper in tone — farther, and in the hand's shade)
    { id: 'indexEnd', outline: INDEX_END, darks: [S(46, 20, 5, 3, 0.3, 0.3)], dim: 0.16 },
    { id: 'middleEnd', outline: MIDDLE_END, darks: [S(66, 41, 6, 3, 0.2, 0.3)], dim: 0.12 },
    { id: 'ringEnd', outline: RING_END, darks: [S(82, 52, 6, 3, 0.1, 0.3)], dim: 0.1 },
  ],
  front: [
    {
      id: 'body',
      outline: BODY,
      // (the back of the hand lit broadly; the four knuckles as low swells in a slanting row, each lit on its upper left)
      lights: [S(30, -14, 24, 8, -0.3, 0.26), S(51, -28.5, 6.5, 3.6, -0.2, 0.32), S(64.5, -24, 5.5, 3.2, 0.5, 0.3), S(75.5, -16.5, 4.6, 2.8, 0.8, 0.28), S(83.5, -8, 3.6, 2.4, 1.1, 0.24)],
      darks: [S(36, 4, 26, 3, -0.1, 0.28), S(-3, 0, 3, 18, 0, 0.34), S(58.5, -22, 2.4, 1.4, 0.6, 0.26), S(71, -15, 2.2, 1.3, 0.8, 0.26), S(80.5, -7, 2, 1.2, 1, 0.24)],
    },
    { id: 'index', outline: INDEX_NEAR, lights: [S(52, -6, 3.5, 7, 0.1, 0.22)], dim: 0.1 },
    { id: 'middle', outline: MIDDLE_NEAR, dim: 0.05, lights: [S(80, -6, 6, 4, 0.7, 0.28), S(82, 12, 3.4, 8, 0.3, 0.22)], darks: [S(74, 22, 6, 3, 0.4, 0.3)] },
    { id: 'ring', outline: RING_NEAR, lights: [S(99, 4, 6, 4, 0.7, 0.28), S(103, 20, 3.4, 8, 0.2, 0.22)], darks: [S(92, 34, 6, 3, 0.6, 0.3)] },
    {
      id: 'little',
      outline: LITTLE,
      lights: [S(109, 4, 7, 3.6, 0.45, 0.3), S(116, 20, 3, 8, 0.05, 0.24)],
      darks: [S(102, 38, 4, 3, 0.4, 0.3), S(100, 14, 9, 2.4, 0.1, 0.24)],
      // (the curved little finger seen from its side: its nail narrow, on the back of the end segment)
      nails: [{ c: P(111, 36.5), len: 8, w: 3.4, rot: 2.35 }],
    },
  ],
  frontLines: [
    // the knuckle row's soft valleys on the back of the hand
    { pts: pts([[63, -24], [60, -18], [56, -14]]), w: 0.6, o: 0.4 },
    { pts: pts([[76, -15], [72, -10], [67, -6]]), w: 0.6, o: 0.4 },
  ],
  // (the fingers' soft shadow on the stick where they go over it)
  cast: [S(70, 21, 26, 3.4, 0.72, 0.35)],
  heldFront: [NEAR_HALF],
  // (the lesson's own point on the stick, axis p, in this frame — the drawing is placed by the cuff and this point)
  grip: P(77.4, 29.8),
  held: [{ kind: 'stick', a: P(-28, stickY(-28)), b: P(156, stickY(156)), r: 3.75 }],
  span: { c: P(50, 2), R: 78 },
};
