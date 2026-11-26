/**
 * FIGURE V2 — THE VIOLIN (AND VIOLA) BOW HAND, SEEN FROM THE PLAYER'S RIGHT (C09a standing and seated, C09b; side view).
 *
 * WHAT THE HAND DOES (the standard Franco-Belgian violin bow hold, as the lessons pose it — bowedHands.bowHand,
 * BOW_HOLD.upper): the right hand holds the bow at the frog, its back up. The THUMB is bent (never straight), its tip
 * under the stick in the corner where the stick meets the frog's front, opposite the MIDDLE finger. The INDEX finger
 * lies over the stick at its middle joint (on the winding), its end hanging down the far side; the MIDDLE finger drapes
 * over the stick opposite the thumb; the RING finger drapes over the frog, its pad on the frog's far face; the LITTLE
 * finger is curved, its tip resting ON TOP of the stick near the frog's back. The wrist is soft, the hand slanting
 * toward the bow's tip. The picture is near the end of a down-bow: the arm reaching forward, the frog far from the
 * strings, the stick running back up-left to the violin.
 *
 * WHAT THE EYE SEES from the player's right (the lesson's side camera; read from the lesson's posed hand): the back of
 * the hand turned toward us and up, the LITTLE finger's side nearest. Left to right: the wrist out of the cuff; the back
 * of the hand rising to the knuckle row (index at the top-left, farthest; little the lowest, nearest); the four fingers
 * hanging DOWN from it over the stick, each one form that bends at its middle joint, the little finger in front, the
 * index behind the others showing only its end; under the palm the bent THUMB, farther than the stick, its tip at the
 * frog's corner. The stick passes behind the hand from the top of the wrist down to the fingertips and leaves between
 * the ring finger's tip and the little finger's, over the frog.
 *
 * Frame: the cuff frame (bowedHandPaint.tsx), mm: origin at the sleeve's cuff, +x along the forearm, +y a quarter turn
 * clockwise (down the page for this view).
 */
import { P, type Poly } from './geom.ts';
import type { BowedHandArt, BHSoft } from './bowedHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const S = (x: number, y: number, rx: number, ry: number, rot: number, o: number): BHSoft => ({ e: { c: P(x, y), rx, ry, rot }, o });

/** The back of the hand, the wrist and the palm's lower edge (the fingers grow out of its right side). */
// (round 2: the wrist narrower than the hand — it dips out of the cuff and the back of the hand rises from it; the
// palm's lower edge higher, so the bent thumb shows beneath it)
const BODY = pts([
  [-6, -21.5], [6, -21], [16, -22.5], [26, -26], [36, -30.5], [46, -33.5], [55, -34], [63, -31], [71, -26], [78, -20], [84, -13], [88, -5],
  [88, 4], [83, 11], [74, 14.5], [62, 15.5], [48, 15.5], [34, 15], [22, 15.5], [10, 18], [-6, 20.5],
]);
/** The index (farthest): only its end shows, left of the middle finger, its tip turned in toward the thumb. */
const INDEX = pts([[46, -12], [53, -12], [58, -4], [58.5, 6], [56, 15], [52, 22.5], [46.5, 26], [41.5, 23.5], [41, 15], [42.5, 4], [43, -4]]);
/** The middle finger: out of its knuckle, the middle joint's bend at the right, down to its tip under the stick. */
const MIDDLE = pts([[60, -16], [70, -20], [80, -14], [87.5, -5], [90.5, 6], [89, 17], [84.5, 27], [78, 36], [71, 43.5], [64.5, 46.5], [59, 44], [58.5, 37], [63, 29], [68, 20], [69.5, 10], [66, 3], [60, 0]]);
/** The ring finger. */
const RING = pts([[74, -8], [86, -8], [98, -2], [106.5, 6.5], [110, 17], [108.5, 28], [103.5, 38], [96.5, 46.5], [89, 51], [82.5, 50], [80.5, 44.5], [85.5, 37], [91, 28], [93, 19], [89, 12], [80, 9]]);
/** The little finger (nearest): curved, its tip resting on top of the stick. */
const LITTLE = pts([[80, -2], [92, -3], [104, -0.5], [113.5, 4.5], [119.5, 11], [121.5, 20], [119.5, 29.5], [114, 37], [107, 42.5], [100, 44.5], [95.5, 41.5], [97.5, 36], [103.5, 30.5], [106, 23], [104, 16], [96, 13], [84, 12]]);
/** The thumb (behind the stick, under the palm): broad at its root, a soft bend at its middle joint, its tip at the frog's corner. */
const THUMB = pts([[2, 4], [12, 8], [24, 13], [34, 16.5], [45, 19], [54, 20.5], [60.5, 22.5], [64, 27], [62.5, 32], [56.5, 34.5], [47, 34], [38, 33], [30, 31.5], [21, 28.5], [12, 24.5], [5, 19]]);

export const BOWED_HAND_VIOLIN_BOW_SIDE: BowedHandArt = {
  title: 'violin and viola bow hand, seen from the player’s right',
  behind: [
    {
      id: 'thumb',
      outline: THUMB,
      lights: [S(36, 20.5, 15, 3, 0.18, 0.28)],
      darks: [S(36, 31, 18, 2.6, 0.12, 0.32), S(33, 30.5, 1.4, 3, 0, 0.3)],
    },
  ],
  front: [
    {
      id: 'body',
      outline: BODY,
      // (the back of the hand lit broadly; the four knuckles as low swells in a slanting row, each lit on its upper left)
      lights: [S(30, -14, 24, 8, -0.3, 0.26), S(51, -28.5, 6.5, 3.6, -0.2, 0.32), S(64.5, -24, 5.5, 3.2, 0.5, 0.3), S(75.5, -16.5, 4.6, 2.8, 0.8, 0.28), S(83.5, -8, 3.6, 2.4, 1.1, 0.24)],
      darks: [S(40, 15, 28, 3.6, 0.03, 0.3), S(-3, 0, 3, 18, 0, 0.34), S(58.5, -22, 2.4, 1.4, 0.6, 0.26), S(71, -15, 2.2, 1.3, 0.8, 0.26), S(80.5, -7, 2, 1.2, 1, 0.24)],
    },
    { id: 'index', outline: INDEX, lights: [S(50, 0, 3.5, 9, 0.1, 0.22)], darks: [S(44, 14, 2.4, 9, 0.2, 0.32)], dim: 0.12 },
    { id: 'middle', outline: MIDDLE, dim: 0.06, lights: [S(80, -6, 6, 4, 0.7, 0.28), S(82, 14, 3.4, 9, 0.35, 0.22)], darks: [S(64, 34, 3, 9, 0.6, 0.34)] },
    { id: 'ring', outline: RING, lights: [S(99, 4, 6, 4, 0.7, 0.28), S(103, 22, 3.4, 9, 0.2, 0.22)], darks: [S(86, 42, 3, 8, 0.6, 0.34)] },
    {
      id: 'little',
      outline: LITTLE,
      lights: [S(109, 4, 7, 3.6, 0.45, 0.3), S(116, 20, 3, 8, 0.05, 0.24)],
      darks: [S(100, 37, 3, 6, 0.8, 0.32), S(100, 14, 9, 2.4, 0.1, 0.24)],
      // (the curved little finger seen from its side: its nail narrow, on the back of the end segment)
      nails: [{ c: P(111.5, 36.5), len: 8, w: 3.4, rot: 2.35 }],
    },
  ],
  frontLines: [
    // the knuckle row's soft valleys on the back of the hand
    { pts: pts([[63, -24], [60, -18], [56, -14]]), w: 0.6, o: 0.4 },
    { pts: pts([[76, -15], [72, -10], [67, -6]]), w: 0.6, o: 0.4 },
  ],
  // (the hand's soft shadow on the stick where it leaves the fingers, and the palm's on the thumb under it)
  cast: [S(84, 40, 18, 5, 0.73, 0.35), S(38, 21.5, 26, 3.4, 0.08, 0.35)],
  // (the lesson's own point on the stick, axis p, in this frame — the drawing is placed by the cuff and this point)
  grip: P(77.4, 29.8),
  held: [{ kind: 'stick', a: P(-28, -63), b: P(156, 103), r: 3.75 }],
  span: { c: P(50, 2), R: 78 },
};
