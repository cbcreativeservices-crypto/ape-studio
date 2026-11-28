/**
 * FIGURE V2 — THE TRUMPET'S RIGHT (VALVE) HAND, SEEN FROM THE PLAYER'S RIGHT (A01; the flugelhorn's the same hold).
 * Owner 2026-11-25, "batches by family"; the earlier review found the old valve hand wrong (it stood up off the valves
 * like an open hand, four separate fingers in the air).
 *
 * WHAT THE HAND DOES (the real technique): the right hand plays the three piston valves. The PADS of the index,
 * middle and ring fingers rest on the 1st, 2nd and 3rd valve buttons (the 1st nearest the player), each finger CURVED
 * — up from its big knuckle, over at its middle joint, down onto the pearl — as if round a ball; the little finger
 * rests on (or in) the finger hook on the leadpipe just ahead of the 3rd valve; the THUMB sits under the leadpipe
 * between the 1st and 2nd valve casings, its pad up against the pipe. The wrist is straight and low beside the valve
 * block; the back of the hand faces the player's right and a little up. The hand never grips: the left hand holds the
 * trumpet, the right hand stays light so the fingers can move.
 *
 * WHAT THE EYE SEES FROM THE PLAYER'S RIGHT (this drawing): the BACK of the hand rising out of the cuff in front of the
 * valve casings; the four big knuckles as low swells in a slanting row (the index's highest, the little finger's lowest
 * and farther on); the fingers' first segments rising from them side by side to ONE row of rounded bends along the top
 * (the middle finger's the highest, the ring's a little lower, the index's lower again — each its own width); the
 * fingers' ends go down BEHIND the bends onto the buttons, hidden by the hand itself — except the index's end, which
 * shows on the left as it comes down onto the 1st button (its nail seen from its side, a narrow sliver). The little
 * finger, lower and to the right, arches over onto the hook. The thumb is on the far (palm) side, under the leadpipe:
 * only its base shows, as the rounded mound at the hand's lower left, going in behind the hand.
 *
 * Frame: page millimetres in the A01 picture from the player's right, origin on the centre of the figure's cuff rim,
 * u right (toward the bell), v DOWN. The buttons (pearl centres): 1st (−30, −71), 2nd (−4, −71), 3rd (22, −71); the
 * hook's top (46, −47); the leadpipe's centre line v = −25. The posed pads (brassPosture.ts, unchanged): index
 * (−30, −82), middle (−4, −82), ring (22, −81), little (46, −55), thumb (−17, −18). (Drawn: the index's end on the
 * 1st button as posed; the little finger's end on the hook's top, a few millimetres right of its posed pad; the
 * bends drawn a little lower than the 3-D pose's middle joints, so the fingers arch over the buttons rather than stand
 * up off them — a drawing choice only, nothing of the pose moves.)
 */
import { P, type Poly } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { BrassHandArt } from './brassHandPaint';

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The forearm's direction in this picture (elbow → wrist). */
const FORE = P(0.217, -0.976);

const BODY: Poly = pts([
  // the wrist's left (thumb) side, from just inside the cuff
  [-26, 6], [-25, -4], [-24.5, -13],
  // the thumb's base: one rounded mound out of the hand's lower left (the thumb itself goes in behind the hand)
  [-27, -21], [-31.5, -28.5], [-34.5, -37], [-35, -45.5], [-34, -53],
  // the index's outer side rising toward its knuckle
  [-32.8, -58.6], [-33.2, -63.4],
  // the index's END coming down on the left onto the 1st button (from behind its first segment): its pad on the pearl
  [-35, -68], [-37.8, -72.4], [-40.4, -77.4], [-41.2, -84], [-40.8, -91], [-39.4, -97],
  // up into the index's bend
  [-36.4, -102], [-31.6, -106.6], [-25.6, -109.4], [-19.4, -109.8],
  // the parting between the index's and the middle finger's bends (the middle finger stands higher)
  [-14.6, -107.6], [-12.4, -106.6],
  // the middle finger's bend: the highest
  [-10.2, -110.4], [-5.6, -114.2], [0.4, -115.4], [6, -114], [9.6, -110.4],
  // the parting to the ring finger
  [11.6, -106.6], [13.6, -106],
  // the ring finger's bend, a little lower and narrower; down its right side
  [16.6, -109], [22.2, -110.4], [28.4, -109], [33.4, -105], [36.6, -99], [37.8, -92],
  // where the little finger's first segment leaves from under the ring finger's side
  [38.6, -86.6],
  // the little finger: its first segment rising to the right to its bend (lower and smaller than the others)…
  [42.4, -86.8], [48, -87.6], [53.6, -86.6], [58.2, -83.4], [61, -78.4], [61.8, -72.6],
  // …its end coming down onto the hook, its pad on the hook's top
  [61.2, -66], [59.4, -59.6], [57, -54], [53.8, -50.2], [50, -48.8], [46.8, -49.4],
  // the hand's little-finger edge going back down to the wrist, the wrist narrower than the hand
  [43.4, -46], [40.2, -40], [36.2, -31], [31.8, -22.6], [27.8, -14.6], [25.4, -6.4], [25.6, 5.6],
]);

/** The soft lines: each finger's first segment lying against its neighbour (from the dip between the bends, fading
 *  down toward the knuckles); the index's first segment's edge over its own end; the hand's edge over the thumb. */
const LINES: Poly[] = [
  pts([[-13.4, -106.8], [-11, -99], [-8.6, -91], [-6.6, -84], [-5.4, -79]]),
  pts([[12.6, -106.2], [13.2, -98], [13.2, -90], [12.8, -83], [12.2, -78]]),
  pts([[38.6, -86.8], [36.8, -81], [34.4, -76], [32, -72]]),
  // the index's first segment over its own end (the end comes down behind it on the left)
  pts([[-36.2, -100.6], [-33.4, -94], [-31.6, -86], [-31, -78], [-31.4, -70]]),
  // the little finger's end lying against the hand's edge
  pts([[47.4, -50.4], [48.4, -56.6], [50.4, -62.6], [53.4, -67]]),
  // the back of the hand's edge over the thumb's base (fading up)
  pts([[-23.6, -12], [-25.6, -24], [-28, -36], [-29.4, -46]]),
];

/** The short creases at each finger's middle joint (on its back: the skin folds a little as it bends). */
const CREASES: Poly[] = [
  pts([[-26, -103.2], [-22, -104.4], [-18, -104]]),
  pts([[-5, -108.6], [-0.6, -109.6], [3.8, -108.8]]),
  pts([[18.4, -103.4], [22.6, -104.2], [26.6, -102.6]]),
  pts([[49, -82], [52.6, -81.8], [55.4, -79.4]]),
];

export const BRASS_HAND_TRUMPET_VALVE_SIDE: BrassHandArt = {
  fore: FORE,
  body: BODY,
  lines: LINES,
  creases: CREASES,
  // the index's nail on the 1st button, seen from its side: a narrow sliver along the end's left edge
  nails: [
    // the index's nail on the 1st button and the little finger's on the hook, each seen from its side: narrow slivers
    { c: P(-38.8, -81), len: 10, w: 5.6, rot: Math.PI / 2 + 0.05, k: 0.6 },
    { c: P(59.2, -60), len: 9, w: 5, rot: Math.PI / 2 - 0.35, k: 0.55 },
  ],
  // the back of the hand lit from the upper left, broad and soft
  broad: [E(-8, -50, 26, 26, -0.2)],
  lights: [
    // each finger's first segment lit along its upper-left side, from the knuckle up into its bend (a band, not a spot)
    E(-22, -94, 3.2, 10, 0.3), E(-2, -98, 3.4, 11, 0.05), E(19, -94, 3, 10, -0.1), E(47, -79, 2.6, 7, 1),
  ],
  // the big knuckles: low swells (the index's and middle's the larger)
  swells: [E(-15, -80, 7, 4.6, -0.3), E(3, -78, 7, 4.4, -0.2), E(20, -71, 6, 4, -0.1), E(34.4, -60, 4.6, 3.4, 0.3), E(-29.6, -38, 3.4, 8.6, 0.2)],
  darks: [
    // between the fingers' first segments: a narrow shade down each parting
    E(-8.2, -94, 1.8, 11, 0.25), E(12.8, -94, 1.8, 11, 0), E(36.4, -82, 1.8, 7, 0.6),
    // the hand's little-finger edge and the wrist's right side turning away
    E(37, -32, 4.6, 15, 0.45), E(23, -6, 4, 9, 0.1),
    // the little finger's end in its own shade
    E(55, -58, 2.2, 6, 0.4),
    // the index's end, behind and in shade
    E(-37, -88, 2.4, 8, 0),
  ],
};
