/**
 * FIGURE V2 — A RIGHT HAND GRIPPING A 30 mm POLE, SEEN ALONG THE POLE FROM THE LITTLE-FINGER END, THE CAMERA TILTED
 * TOWARD THE FRONT OF THE FIST (the backs of the fingers' first segments and their bends) (owner 2026-11-24, "one hand
 * at a time": the fifth view of the end-on family). The same fist as poleHandEnd / poleHandEndBack / poleHandEndLittle /
 * poleHandEndLittleBack — same paint, tones (cast.ts), cuff, light from the upper left, the same 25° pole tilt — seen
 * from the little-finger end like poleHandEndLittle, but from a third side of the pole's line: poleHandEndLittle looks a
 * little INTO the palm side, poleHandEndLittleBack a little onto the BACK of the hand and the wrist; this one looks a
 * little onto the FRONT of the fist, the hand's own plane seen edge-on. In use it is the operator's LEFT hand: the
 * mirror image, re-lit.
 *
 * WHY: the owner rejected the boom operator's LEFT hand on "B10 post-event overhead" (side view) — the old boxy fist
 * with L-shaped lines, kept because no approved drawing could be placed there.
 *
 * THE DERIVATION (read 2026-11-24 from the rig's own 3-D pose: BoomV2.boomPlans(B10_BOOM_RIGS.overhead, 'side'), the
 * left arm's elbow → fist, the pole, the side camera's `toward` (0, 0, 1), and boomGrip.boomHandFace's back of the hand
 * d and thumb direction; unit vectors, dot products, so the same for the left hand and the right hand it mirrors):
 *   the camera · the pole toward the little finger      +0.892  → 27° off the pole, at the LITTLE-FINGER end;
 *   the camera · the fist's front (the forearm's own
 *     direction made square to the pole: wrist → knuckles,
 *     the backs of the fingers' first segments)          +0.444  → the camera's 27° lean is almost all toward the FRONT;
 *   the camera · the back of the hand                    +0.078  → the hand's plane edge-on (4.5° onto the back): the
 *                                                                  back of the hand and the palm both turned away, the
 *                                                                  back's top edge the fist's top edge;
 *   the forearm (elbow → fist) · the pole (little-ward)  −0.385  → the forearm 23° off square to the pole, the elbow on the
 *                                                                  little-finger side; the camera · (fist → elbow) −0.067:
 *                                                                  the forearm lies in the picture's plane, receding a hair.
 * So, for a right hand drawn from this camera (page x right, y down), the directions land: the little-finger end (the
 * pole's NEAR part) 0.42 mm on the page per mm, to the LEFT and a little down; the fist's front to the RIGHT (0.90); the
 * back of the hand UP (0.99); the forearm to the LEFT (1.00) — 9° clockwise from the near pole: the near pole and the
 * forearm leave the fist on the SAME side of the page, the pole in front, the forearm behind. The rig reads the left
 * forearm −9.2° from the near pole, so this drawing's right hand is authored at END_LITTLE_FORE_FORE_FROM_NEAR = +9°
 * (the mirrored left hand −9°: 0.2° off B10 overhead's arm). The previous builder's "almost square in front of the
 * fingers' bends" overstated it: the camera is mostly ALONG the pole (63° of its 90°), leaning toward the fist's front.
 * HOW FAR OFF THE OTHER B10 LEFT HANDS ARE (left hand: forearm − near pole on the page; this drawing gives −9°):
 *   B10 overhead (start)           −9.2°, camera 27° off at the little end, toward the front     →  0° off: fits.
 *   B10 raised over the head      +94.7°, camera 40° off at the THUMB end                         → the other end of the
 *                                  fist: not this view at all (104° off); it keeps the flat back-of-hand drawing.
 *   B10 dragged below the mouth   +73.7°, camera 43° off at the little end, toward the PALM       → 83° off: not this
 *                                  view; it keeps the flat palm-side drawing.
 *   the drag range (B10's live rig, the mic 800 mm out at 20–80° up, and 450–1000 mm out at 45°): where the camera is at
 *   the little-finger end and toward the front (the mic 30–50° up, 800–1000 mm out) the left forearm reads −23° … +11°
 *   (this drawing 14° off at 1000 mm, 14° at 45°, 16° at 50°, 20° at 30°, all inside the 40° tolerance); at 20° up it
 *   reads +45° (54° off: the camera nearly along the pole, 8° off it); at 60–80° up the camera is at the THUMB end, and
 *   at 450–600 mm out it is tilted toward the palm (98–117°): neither is this view.
 *
 * AUTHORED 2-D ART, as the approved hands: hand-placed points (mm) drawn as smooth closed cubic curves, the same skin
 * light, the same thin soft outline, soft form lights and shadows, very few lines. No 3-D model, no projected skeleton
 * (the projection above only says where each form lies; every point is placed by hand).
 *
 * THE VIEW, IN WORDS (written before any point was placed):
 * We stand off the little-finger end of the fist, level with the hand's own plane, a little round toward the front of
 * the fist, and look nearly along the pole (25° off). It is the fist from its little-finger side: the forearm leaving to
 * the left, the back of the hand along the top, the fingers' fronts on the right, their ends along the bottom — with the
 * pole coming at us out of the little finger's curl.
 *   1. Nearest of all, the LITTLE finger, seen from its outer side: one tight "C" round the pole's section — its big
 *      knuckle at the top (a soft swell just under the fist's top edge), the first segment's side sloping down to the
 *      right, the middle joint's rounded bend on the right, the middle segment down and in, the last joint, the short
 *      last segment along the bottom, the tip tucked at the bottom left against the heel of the hand, just under the
 *      near pole. Because we lean toward the front, the BACK of its first segment and of its bend shows too, as a narrow
 *      band in shade along the C's outer edge (the side turning into the back: no line between them).
 *   2. Behind it, each farther along the pole and so each a step to the RIGHT (0.42 mm per mm: about 8 mm a finger) and
 *      a hair higher, the RING, MIDDLE and INDEX: their sides hidden behind the finger in front, so each shows only as a
 *      band beyond the one in front — the back of its first segment running down from its knuckle to its bend, the bend,
 *      and a sliver of its end along the bottom. Together the four bands are the FRONT of the fist seen obliquely: one
 *      surface with soft valleys, never four rolls. Each its own width (the ring's and the middle's wide, the index's
 *      narrow) and its own height (the middle reaches farthest and lowest). Their big KNUCKLES make ONE row along the top,
 *      stepping up to the right — the little's lowest (under the fist's top edge), the ring's a step up, the middle's the
 *      highest, the index's a little lower and last; the finger BENDS a second, lower corner of each band on the right:
 *      that is the one row of knuckles and the one row of bends a fist shows from its side, never a doubled row.
 *   3. The BACK OF THE HAND is edge-on: only a sliver above the side of the hand, its top edge the fist's top edge from
 *      the wrist to the knuckle row, lit. The SIDE OF THE HAND (the little-finger edge) faces us: from under that edge
 *      down to the HEEL of the hand (the pad under the little finger), which rounds the bottom from the wrist to the
 *      little finger's tip; the wrist narrower than the hand, into the sleeve (the forearm recedes a hair: the cuff's
 *      rim a narrow ellipse, the wrist going in behind its near half, a dark opening above and below the wrist).
 *   4. THE POLE: its round section (an ellipse, a little narrower along the pole) sits inside the little finger's curl,
 *      ringed by skin — the little finger above, right and below, the side of the hand and the heel to the left. The
 *      NEAR part comes out of that ring toward us and, on the page, runs to the LEFT and a little down, IN FRONT of the
 *      side of the hand and the top of the heel (its soft shadow on them) — in B10 only 110 mm of pole is left past
 *      this hand, so its end shows over the heel. The FAR part goes away to the right inside the fist and comes out past
 *      the index finger's front, at mid-height: the pole enters at the little finger and leaves past the index.
 *   5. The THUMB is at the far (index) end, wrapped round the pole the other way, lying on the outside of the index's end
 *      bones along the bottom: behind the four fingers from here. Its lower edge would show at most 2–4 mm below the
 *      fingers' ends at the far end of the fist — drawn only as the bottom edge there going a little lower, no thumb of
 *      its own (its nail faces down, edge-on: no nail is owed, and no light sits where a nail could be read).
 * Paint order (far → near): the far pole → the cuff's dark opening → the index, middle and ring fingers → the hand's
 * body (back of the hand, side, heel, wrist, forearm) → the little finger → the sleeve → the near pole (in front of all,
 * its soft shadow on the hand).
 *
 * THE NEAR POLE IN 'boom' LOOK: as poleHandEndLittleBack — only the pole's piece inside the hand's outline, on the scene
 * pole's own axis and width (dark rim 31 mm, tube 27 mm, lit band 6 mm at the scene's page offset), straight stripes
 * with no end of their own where the scene's pole goes on; `pole[1]` is where the pole ENDS toward the viewer, and there
 * it ends as the scene's pole does (a round cap: rim, tube and lit band each rounded), never as a stub of its own.
 *
 * Frame: authored in a HAND frame (mm; origin on the pole's axis where it enters the fist on the little-finger side;
 * −x toward the forearm; −y the back of the hand) and turned once, by END_LITTLE_FORE_TURN (−15°), into the drawing's
 * own page-oriented frame (+x right, +y DOWN), so the forearm leaves to the lower left. Every exported point is in
 * that frame.
 */
import { useMemo, type ReactNode } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, rimOf, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';
import { lightMapOf, type LightMap } from './poleHandFront';
import { POLE_END_TILT, POLE_R } from './poleHandEnd';

/* ── the art (pure: the tests read these points) ── */

/** The turn from the hand frame (forearm along −x) to the drawing's frame: the forearm leaves to the lower left. */
export const END_LITTLE_FORE_TURN = (-15 * Math.PI) / 180;
const CT = Math.cos(END_LITTLE_FORE_TURN);
const ST = Math.sin(END_LITTLE_FORE_TURN);
const turn = (x: number, y: number): Pt => P(x * CT - y * ST, x * ST + y * CT);
const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => turn(x, y));
/** A soft light or shade authored in the hand frame (its centre and its turn carried into the drawing's frame). */
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: turn(x, y), rx, ry, rot: rot + END_LITTLE_FORE_TURN });

/** The pole's radius (Ø 30 mm): the same pole as poleHandEnd. */
export const POLE_R_LITTLE_FORE = POLE_R;
/** How far the pole is off the line of sight (rad): the SAME 25° as the other end-on drawings (B10 overhead: 27°). */
export const POLE_END_LITTLE_FORE_TILT = POLE_END_TILT;
/** Page millimetres per millimetre along the pole (the foreshortening): sin 25° ≈ 0.42. */
export const POLE_END_LITTLE_FORE_FORESHORTEN = Math.sin(POLE_END_LITTLE_FORE_TILT);
/** (rad, page, y down) the forearm's direction (fist → elbow) minus the pole's near direction: +9° — the forearm 9°
 *  CLOCKWISE on the page from the pole's near part (the mirrored left hand: −9°; B10 overhead's left arm −9.2°). */
export const END_LITTLE_FORE_FORE_FROM_NEAR = (9 * Math.PI) / 180;
/** The forearm's direction on the page, fist → elbow (unit, drawing frame): the hand frame's −x, turned. */
const FORE_ANGLE = Math.PI + END_LITTLE_FORE_TURN;
export const POLE_END_LITTLE_FORE_FORE: Pt = P(Math.cos(FORE_ANGLE), Math.sin(FORE_ANGLE));
/** The pole's axis on the page, the direction TOWARD the viewer (unit, drawing frame): to the left and down. */
const AXIS_ANGLE = FORE_ANGLE - END_LITTLE_FORE_FORE_FROM_NEAR;
export const POLE_END_LITTLE_FORE_AXIS: Pt = P(Math.cos(AXIS_ANGLE), Math.sin(AXIS_ANGLE));
/** Across the pole on the page (unit, the axis turned a quarter clockwise). */
const ACROSS: Pt = P(-POLE_END_LITTLE_FORE_AXIS.v, POLE_END_LITTLE_FORE_AXIS.u);
/** The pole's round section where it enters the fist (an ellipse: narrower along the pole, cos 25°). */
export const POLE_END_LITTLE_FORE_SECTION: Ellipse = { c: P(0, 0), rx: POLE_R * Math.cos(POLE_END_LITTLE_FORE_TILT), ry: POLE_R, rot: AXIS_ANGLE };
/** The point on the pole's axis `a` mm along it from the little-finger side of the fist (+ toward the viewer). */
export function poleEndLittleForeAxisAt(a: number): Pt {
  return P(POLE_END_LITTLE_FORE_AXIS.u * POLE_END_LITTLE_FORE_FORESHORTEN * a, POLE_END_LITTLE_FORE_AXIS.v * POLE_END_LITTLE_FORE_FORESHORTEN * a);
}
/** The grip's centre: the middle of the fist along the pole (≈ 40 mm in from the little-finger side). */
export const POLE_END_LITTLE_FORE_GRIP: Pt = poleEndLittleForeAxisAt(-40);
/** B10's pole goes on only 110 mm past this (its rear) hand: the default near length. */
export const POLE_END_LITTLE_FORE_NEAR = 110;

/**
 * THE LITTLE FINGER — the nearest form: its outer side (one tight "C" round the pole's section), with the back of its
 * first segment and its bend showing as a band along the C's outer edge. Hand frame.
 */
const LITTLE_H: readonly (readonly [number, number])[] = [
  // the base, closing inside the side of the hand (no edge drawn there)
  [-11, -25],
  // where it rises out of the side of the hand; the big knuckle: one soft swell, just under the fist's top edge
  [-9.4, -33.2], [-5, -36.6], [0.4, -38], [5.6, -38.2],
  // the first segment's back, sloping down to the right (its side and its back: the band)
  [10.2, -36.9], [15, -34.6], [19.6, -31.2], [23.8, -27.2], [27.4, -22.6],
  // the middle joint's bend: a rounded corner on the right (the slimmest of the four)
  [30.4, -17.6], [32.4, -12.2], [33.4, -6.6], [33.6, -1],
  // the middle segment's back, down and in
  [32.6, 4.4], [30.6, 9.2], [27.8, 13.6],
  // the last joint's softer bend
  [24.6, 17.2], [20.8, 20],
  // the short last segment along the bottom
  [16.6, 22.4], [12, 24.2], [7.4, 25.2], [3.2, 25.6],
  // the tip, rounded, tucked at the bottom left against the heel of the hand
  [-0.4, 25], [-2.8, 22.8], [-3.2, 19.6], [-1.4, 17],
  // the inner side, the pads pressed on the pole's section all round
  [2.8, 15.8], [7.1, 14.1], [10.9, 10.8], [13.6, 6.2], [14.8, 0.6],
  // (the middle joint's crease: the finger leaves the pole a little)
  [15.6, -4.2],
  [13.4, -8.6], [9.8, -12.2], [5.4, -14.8], [0.8, -15.9],
  // into the web over the side of the hand
  [-3.8, -17.8], [-7.8, -21],
];
const LITTLE = pts(LITTLE_H);
/** The little finger's drawn edge: from past its knuckle's top (where the ring finger shows behind it) round the C, the
 *  tip, and the inner side up to the pole's top edge, ending under it (no line over the knuckle into the hand: the
 *  finger grows out of it, the back of the hand's sliver above it is one skin; the web beyond is one skin: no line). */
const LITTLE_EDGE = [...LITTLE.slice(6, 36), turn(-0.6, -14)];
/** Where the little finger's side turns into its back (the band's inner edge, no line: a soft change of light). */
const LITTLE_TURN_H: readonly (readonly [number, number])[] = [
  [2, -36.8], [8, -34.6], [13, -31.6], [17.6, -27.8], [21.4, -23.6], [24.6, -18.4], [26.8, -12.4], [27.8, -6.4], [28, -0.6], [27, 5],
];

/**
 * THE FINGERS BEHIND — ring, middle, index: each farther along the pole, so each a step to the right (and a hair higher)
 * of the one in front; only the band beyond the finger in front shows — the knuckle, the back of the first segment, the
 * bend, a sliver of the end along the bottom. Each closes well inside the finger in front (hidden). Hand-placed, each its
 * own width and height.
 */
const RING = pts([
  // (hidden under the side of the hand) the knuckle rising above the fist's top edge: a broad swell, a big step up
  [2, -39.6], [6, -42], [9.8, -43.4], [13.6, -43.6], [17, -42.4],
  // the back of the first segment, straight down to the right (a longer bone than the little's: past its bend)
  [20.6, -39.2], [24.4, -34.6], [28, -29.2], [31.6, -23.4], [35, -17.2], [38.2, -11],
  // the bend: a firm rounded corner, below the little's
  [41, -4.8], [43, 1.4], [44, 7.2], [43.4, 12.2],
  // the middle segment's back, straight down and under (in shade)
  [41, 16.4], [37.2, 19.8], [32.4, 22.6], [27.4, 24.4],
  // its underside, along the fist's bottom, going in behind the little finger's last segment
  [22.2, 25.4], [17, 25],
  // (hidden behind the little finger) the inside
  [12, 23.4], [8, 20], [14, 16], [22, 8], [25, 0], [22, -12], [16, -24], [9, -32], [4, -36.4],
]);
const MIDDLE = pts([
  // (hidden under the ring's) the knuckle: the highest, a taller, narrower peak
  [11, -43], [15, -45.6], [18.8, -47.2], [22.4, -47.6], [25.8, -46.6],
  // the back of the first segment: the longest bone, straight
  [28.4, -43.6], [31.2, -39.2], [34.2, -34], [37.4, -28.2], [40.8, -22], [44.2, -15.6],
  // the bend: the farthest out of the three in front of the index, a little lower than the ring's
  [47.6, -8.6], [50.4, -1.8], [51.8, 4.8], [51.6, 10.8],
  // the middle segment's back, straight down and under (in shade)
  [49.6, 16], [46, 20.2], [41.4, 23.2], [36.2, 25],
  // its underside, in behind the ring's
  [31.4, 25.6], [26.6, 25],
  [22, 22], [28, 16], [36, 10], [39, 0], [34, -14], [25, -28], [19, -38], [15, -42.4],
]);
const INDEX = pts([
  // (hidden under the middle's) the knuckle: a small bump, lower than the middle's, last in the row
  [21, -44.8], [24.6, -45.6], [28.2, -45.8], [31.4, -45.2], [34, -43.6],
  // the back of the first segment: the narrowest band, past the middle's, straight
  [36.4, -41.4], [39.6, -36.8], [42.8, -31.4], [46, -25.6], [49, -19.4], [51.6, -13],
  // the bend: higher than the middle's (a firm corner), and it goes in behind the middle's
  [53.6, -6.6], [54.6, -0.6], [54.2, 4.8], [52.8, 9],
  [50.8, 11.6],
  [48, 6], [47, -6], [38, -22], [30, -36], [27, -42.6], [24, -44.8],
]);
/** Their drawn edges — only where an edge really shows: the index's whole outer edge (the fist's front silhouette); for
 *  the ring and the middle, their knuckles on the fist's top edge, and from their bends round to where they go in
 *  under the finger in front. The long backs of the first segments lie side by side as ONE surface: no line between
 *  them (only a soft shade), never a row of rolls. */
const RING_EDGE: Poly[] = [RING.slice(18, 21)];
const MIDDLE_EDGE: Poly[] = [MIDDLE.slice(14, 21)];
const INDEX_EDGE: Poly[] = [INDEX.slice(4, 16)];
/** (the knuckle row's top edge is drawn as ONE line: the whole hand's outline along the top, from over the little
 *  finger's knuckle to the index's — never a dash per knuckle) where that line is taken. */
const TOP_LINE_CLIP = pts([[-12, -90], [46, -90], [46, -33], [38, -38.6], [32, -43.2], [24, -44.6], [16, -42.8], [10, -40.8], [4, -40.2], [-12, -40.6]]);
/** The bends of the ring and the middle finger against the finger beyond: a fainter, thinner line round the corner
 *  only (a joint's edge inside the fist's front, not its outline). */
const BEND_CREASES: Poly[] = [RING.slice(10, 16), MIDDLE.slice(10, 15)];
/** The fingers behind, each: the soft valleys between it and the finger in front — only at the knuckles and round the
 *  bends, where the fingers are round; along the backs of the first segments they lie flat together (no valley). */
const VALLEYS: Poly[][] = [
  [pts(LITTLE_H.slice(3, 7)), pts(LITTLE_H.slice(9, 15))],
  [RING.slice(2, 7), RING.slice(10, 16)],
  [MIDDLE.slice(3, 8), MIDDLE.slice(10, 15)],
];
/** The fingers behind, each: a soft light on the back of its first segment (it faces up and catches the light), and
 *  one on the top of its bend (the joint's knob). */
const BEHIND_LIGHTS: Ellipse[][] = [
  [E(25.6, -32, 8, 2, 0.98), E(40.4, -3.4, 2.4, 4.6, -0.36)],
  [E(34, -34, 9, 1.8, 1.02), E(48.8, -5.4, 2, 4, -0.32)],
  [E(42.4, -31, 6.4, 1.3, 0.92), E(52.6, -8.6, 1.3, 3, -0.3)],
];
/** The fingers behind, each: the bend and the middle segment turned down, away from the light. */
const BEHIND_DARKS: Ellipse[] = [E(38, 16, 8, 5.4, -0.5), E(46.6, 16, 6, 6, -0.3), E(52, 4, 2, 5, 0)];

/**
 * THE HAND'S BODY — the back of the hand's sliver (its top edge the fist's top edge from the wrist to the knuckle row),
 * the forearm into the cuff, the forearm's lower edge, the wrist, and the side of the hand with the HEEL rounding its
 * lower edge to the little finger's tip; its right side runs hidden under the little finger and the pole.
 */
const BODY = pts([
  // the fist's top edge over the little finger's knuckle (the ring's knuckle rises behind it, to the right)
  [7.4, -40.6], [2, -41.6],
  // the back of the hand edge-on, back to the wrist (a little dip there, the wrist bone on the little-finger side)
  [-8, -41.8], [-20, -41.6], [-32, -41], [-44, -40.2], [-55, -39], [-63, -38.4], [-70, -39.2], [-78, -40],
  // the forearm's top edge, into the cuff (and on under the sleeve)
  [-90, -41.4], [-104, -42.6], [-126, -43.4],
  [-126, 14.4],
  // the forearm's lower edge, the wrist (narrower than the hand)
  [-106, 14.4], [-90, 13.6], [-78, 12.4], [-70, 13.6],
  // the heel of the hand swelling out of the wrist, under to the little finger's tip
  [-61, 18.6], [-51, 24.4], [-40, 28.6], [-28, 30.6], [-17, 30.2], [-8, 28.4], [0.2, 26.4],
  // (hidden under the little finger's tip, round behind the pole's section — so no chink shows between the finger's
  // pads and the pole — and under the little finger)
  [3.6, 22], [10, 17], [16, 8], [17, 0], [16, -8], [10, -16], [8, -26], [10.6, -33],
]);
/** The body's drawn edge: its silhouette only — the top edge from the knuckle row to the cuff, the cuff's end, the
 *  forearm's lower edge, the wrist and the heel to the little finger's tip. */
const BODY_EDGE = BODY.slice(2, 25);

/** An ellipse as points (hand frame, turned). */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 16): Poly {
  const out: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = from + ((to - from) * j) / n;
    out.push(turn(cx + rx * Math.cos(t), cy + ry * Math.sin(t)));
  }
  return out;
}

/** The cuff (hand frame): the rim a narrow ellipse (the forearm recedes a hair) — its NEAR half is the one away from
 *  the hand, so the wrist goes in behind it; the sleeve beyond. */
const CUFF_H = P(-98, -14.4);
const CUFF_RX = 5.2;
const CUFF_RY = 31.6;
const SLEEVE: Poly = [...arc(CUFF_H.u, CUFF_H.v, CUFF_RX, CUFF_RY, Math.PI / 2, (3 * Math.PI) / 2), turn(-152, -50.4), turn(-152, 21.4)];
/** (sleeve off) where the skin and its lines stop: the cuff's rim and everything beyond it (generous). */
const SLEEVE_CUT: Poly = [...arc(CUFF_H.u, CUFF_H.v, CUFF_RX, CUFF_RY, Math.PI / 2, (3 * Math.PI) / 2, 32), turn(-112, -80), turn(-240, -100), turn(-240, 70), turn(-112, 40)];

export type PoleHandEndLittleForeArt = {
  little: Poly;
  littleEdge: Poly;
  /** Where the little finger's side turns into its back (no line: the band's inner edge, for the light). */
  littleTurn: Poly;
  /** The fingers behind, near → far: ring, middle, index. */
  ring: Poly;
  middle: Poly;
  index: Poly;
  /** Each finger's drawn edges (only where an edge shows). */
  behindEdges: [Poly[], Poly[], Poly[]];
  body: Poly;
  /** The body's drawn edge: its silhouette only (the knuckle row against the fingers is one skin: no line). */
  bodyEdge: Poly;
  sleeve: Poly;
  /** The cuff's rim (an ellipse in the drawing's frame). */
  cuff: Ellipse;
  /** The little finger's big knuckle, the four knuckle tops (little → index), the four bends (rightmost points), the
   *  little finger's tip, the heel. */
  knuckle: Pt;
  knuckles: [Pt, Pt, Pt, Pt];
  bends: [Pt, Pt, Pt, Pt];
  /** The fingers behind (ring, middle, index): the lit backs of their first segments; their bends turned away. */
  behindLights: Ellipse[][];
  behindDarks: Ellipse[];
  /** The soft valleys between each finger behind and the finger in front (at the knuckles and round the bends only). */
  valleys: Poly[][];
  /** The ring's and the middle finger's bends against the finger beyond (fainter lines, round the corner only). */
  bendCreases: Poly[];
  littleTip: Pt;
  heel: Pt;
  lights: Ellipse[];
  darks: Ellipse[];
  knuckleLights: Ellipse[];
  littleLights: Ellipse[];
  littleDarks: Ellipse[];
  littleWarm: Ellipse[];
  creases: Poly[];
};

export const POLE_HAND_END_LITTLE_FORE: PoleHandEndLittleForeArt = {
  little: LITTLE,
  littleEdge: LITTLE_EDGE,
  littleTurn: pts(LITTLE_TURN_H),
  ring: RING,
  middle: MIDDLE,
  index: INDEX,
  behindEdges: [RING_EDGE, MIDDLE_EDGE, INDEX_EDGE],
  body: BODY,
  bodyEdge: BODY_EDGE,
  sleeve: SLEEVE,
  cuff: { c: turn(CUFF_H.u, CUFF_H.v), rx: CUFF_RX, ry: CUFF_RY, rot: END_LITTLE_FORE_TURN },
  knuckle: turn(5.6, -38.2),
  knuckles: [turn(5.6, -38.2), turn(13.6, -43.6), turn(22.4, -47.6), turn(31.4, -45.2)],
  bends: [turn(33.6, -3.8), turn(44, 7.2), turn(51.8, 4.8), turn(54.6, -0.6)],
  behindLights: BEHIND_LIGHTS,
  behindDarks: BEHIND_DARKS,
  valleys: VALLEYS,
  bendCreases: BEND_CREASES,
  littleTip: turn(-3.2, 19.6),
  heel: turn(-28, 30.6),
  lights: [
    // the back of the hand's sliver along the top (toward the light)
    E(-36, -38.6, 30, 2.6, 0.02),
    // the side of the hand under it, lit toward the knuckle
    E(-30, -24, 17, 7, 0.04),
    // the heel: its upper side (under the near pole)
    E(-34, 20, 15, 4.6, 0.12),
    // the wrist's upper side
    E(-72, -32, 8, 4),
  ],
  darks: [
    // the back of the hand turning down into the side of the hand, soft
    E(-34, -35.6, 32, 1.8, 0.01),
    // the heel turning under, along its lower edge; the wrist's lower side
    E(-30, 29.4, 22, 2.6, 0.04), E(-84, 9, 12, 4),
    // the palm going in by the pole, beside the little finger's tip
    E(-7, 15, 5, 3.6, -0.3),
    // the wrist going into the cuff
    E(-91, -14.4, 3.4, 26),
  ],
  knuckleLights: [E(1.6, -35.8, 6, 2.2, 0.06), E(14.4, -41.6, 4.6, 1.6, 0.08), E(23.4, -45.4, 4.2, 1.5, 0.04), E(29.6, -44.2, 2.8, 1.1, -0.1)],
  littleLights: [
    // the first segment's side, its upper part toward the light
    E(10, -28.6, 9, 2.8, 0.66),
    // the side of the finger over the bend, a little
    E(22, -10, 3.4, 6.4, -0.3),
  ],
  littleDarks: [
    // the band: the back of the first segment and of the bend, turned away from the light
    E(22.4, -29.6, 10, 2.4, 0.74), E(32, -10, 2.2, 10, 0.06),
    // the finger's inner side turning in toward the pole, round the section (top, right, bottom)
    E(7, -18.4, 7.4, 2.6, 0.32), E(17.2, -1, 2.6, 7.4), E(9.4, 15.6, 6.6, 2.4, -0.62),
    // the middle joint's crease on the finger's side
    E(19.5, -5.4, 4.2, 2.4, -0.5),
    // the last segment and the tip turning under, along the bottom
    E(12, 23, 8, 2, -0.1), E(-1.4, 22.6, 2.8, 2),
  ],
  littleWarm: [E(29, -9, 4, 7, -0.2), E(1, -34.6, 6, 2.6), E(0, 21, 3, 2.4)],
  creases: [
    // the little finger's middle-joint skin fold on its side: short, soft
    pts([[17.6, -5.6], [21.4, -8], [25.2, -10.4]]),
  ],
};

/* ── the paint ── */

const WARM = '#b8665a';
const POLE_STOPS = ['#25282d', '#5d636c', '#b0b6bf', '#7b818a', '#555a62', '#3b3f46', '#222428'];
const POLE_POS = [0, 0.1, 0.22, 0.38, 0.62, 0.86, 1];
/** (poleLook 'boom') the scene pole's paint, as BoomV2's PoleSeg: dark rim 31 mm, tube 27 mm, lit band 6 mm at a page
 *  offset of (−1.5, −2) mm, each with a round cap at the pole's end. */
const BOOM_RIM = '#0b0c0f';
const BOOM_TUBE = '#3a3d45';
const BOOM_LIT = '#d4d8e0';
const BOOM_LIT_OFF = P(-1.5, -2);

const many = (ps: SkPath[]): SkPath => {
  const p = Skia.Path.Make();
  for (const q of ps) p.addPath(q);
  return p;
};
const polyPath = (q: Poly): SkPath => {
  const p = Skia.Path.Make();
  p.moveTo(q[0].u, q[0].v);
  for (let i = 1; i < q.length; i++) p.lineTo(q[i].u, q[i].v);
  p.close();
  return p;
};
const circle = (c: Pt, r: number): SkPath => {
  const p = Skia.Path.Make();
  p.addCircle(c.u, c.v, r);
  return p;
};

/** The pole's straight band from `a0` to `a1` mm along its axis (+ toward the viewer), half-width `h`: no ends. */
function band(a0: number, a1: number, h: number, shift: Pt = P(0, 0)): SkPath {
  const c0 = poleEndLittleForeAxisAt(a0);
  const c1 = poleEndLittleForeAxisAt(a1);
  const n = ACROSS;
  const s = shift;
  return polyPath([P(c0.u + n.u * h + s.u, c0.v + n.v * h + s.v), P(c1.u + n.u * h + s.u, c1.v + n.v * h + s.v), P(c1.u - n.u * h + s.u, c1.v - n.v * h + s.v), P(c0.u - n.u * h + s.u, c0.v - n.v * h + s.v)]);
}
/** The pole from `a0` to `a1`, half-width `h`: the band with its round sections at both ends (its silhouette). */
function tube(a0: number, a1: number, h: number): SkPath {
  const end = (c: Pt) => ellipsePath({ c, rx: h * Math.cos(POLE_END_LITTLE_FORE_TILT), ry: h, rot: AXIS_ANGLE });
  return unionOf(band(a0, a1, h), end(poleEndLittleForeAxisAt(a0)), end(poleEndLittleForeAxisAt(a1)));
}
/** (poleLook 'boom') a stripe of the scene's pole from far behind to its end `a1` (a round cap there, as the scene's
 *  stroke has), half-width `h`, moved by `shift`. */
function boomStripe(a1: number, h: number, shift: Pt = P(0, 0)): SkPath {
  const e = poleEndLittleForeAxisAt(a1);
  return unionOf(band(-160, a1, h, shift), circle(P(e.u + shift.u, e.v + shift.v), h));
}
/** The pole's two side lines from `a0` to `a1`. */
function tubeSides(a0: number, a1: number): SkPath {
  const c0 = poleEndLittleForeAxisAt(a0);
  const c1 = poleEndLittleForeAxisAt(a1);
  const n = ACROSS;
  const p = Skia.Path.Make();
  for (const s of [1, -1]) {
    p.moveTo(c0.u + n.u * POLE_R * s, c0.v + n.v * POLE_R * s);
    p.lineTo(c1.u + n.u * POLE_R * s, c1.v + n.v * POLE_R * s);
  }
  return p;
}

const IDENTITY: LightMap = { a: 1, b: 0, c: 0, d: 1 };
const isId = (M: LightMap) => M.a === 1 && M.b === 0 && M.c === 0 && M.d === 1;
const mv = (M: LightMap, u: number, v: number): Pt => P(M.a * u + M.b * v, M.c * u + M.d * v);
/** A soft light or shade moved round its form toward the light the map brings (identity: as authored). */
function relit(es: Ellipse[], M: LightMap, sign: 1 | -1, k = 0.35): Ellipse[] {
  if (isId(M)) return es;
  const L = mv(M, LIGHT.u, LIGHT.v);
  return es.map((e) => {
    const r = Math.min(e.rx, e.ry) * k * sign;
    return { ...e, c: P(e.c.u + r * (L.u - LIGHT.u), e.c.v + r * (L.v - LIGHT.v)) };
  });
}
/** The lit edge of a mass for the light the map brings. */
function rimL(path: SkPath, w: number, M: LightMap): SkPath {
  if (isId(M)) return rimOf(path, w);
  const L = mv(M, LIGHT.u, LIGHT.v);
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

function build(a: PoleHandEndLittleForeArt, a0: number, a1: number, M: LightMap, sleeveOn: boolean) {
  const sleeve = smoothClosed(a.sleeve, 0.2);
  const cut = polyPath(SLEEVE_CUT);
  const body0 = smoothClosed(a.body);
  const body = sleeveOn ? body0 : op(body0, cut, PathOp.Difference);
  const little = smoothClosed(a.little, 0.5);
  // (where the little finger's base lies over the side of the hand, the hand shows: the finger grows out of it as one
  // skin — no seam, no flap's edge at the knuckle)
  const baseCut = polyPath(pts([[-40, -60], [-4.6, -60], [-4.6, -14], [-40, -14]]));
  const littleVis = op(little, op(body0, baseCut, PathOp.Intersect), PathOp.Difference);
  const ring = smoothClosed(a.ring, 0.5);
  const middle = smoothClosed(a.middle, 0.5);
  const index = smoothClosed(a.index, 0.5);
  const behind = [ring, middle, index];
  const fingers = unionOf(little, ring, middle, index);
  const all = unionOf(body, fingers);
  const sec = POLE_END_LITTLE_FORE_SECTION;
  const big = Skia.Path.Make();
  big.addRect(Skia.XYWHRect(-400, -400, 800, 800));
  // (without its own sleeve, the lines stop at the cuff's rim)
  const noSleeve = sleeveOn ? null : op(big, cut, PathOp.Difference);
  // (the scene pole's lit band, carried into the drawing's frame — the scene offsets it on the PAGE)
  const litOff = mv(M, BOOM_LIT_OFF.u, BOOM_LIT_OFF.v);
  const near = tube(0, a1, POLE_R);
  // (the hand's outline grown by its drawn edge's half-width: the near pole covers the lines it passes in front of;
  // a dilation by 1.2 mm — the outline moved eight ways — and the pole's section, the space inside the curl, filled)
  const moved = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const q = all.copy();
    q.offset(1.2 * Math.cos((k * Math.PI) / 4), 1.2 * Math.sin((k * Math.PI) / 4));
    return q;
  });
  const allGrown = unionOf(all, ...moved, ellipsePath({ c: sec.c, rx: sec.rx + 1.5, ry: sec.ry + 1.5, rot: sec.rot }));
  // ('boom') the scene pole's silhouette here: from the section in the curl to its round end at a1 (never the part
  // behind the section: that is inside the fist)
  const boomNear = unionOf(ellipsePath(sec), op(boomStripe(a1, 15.5), band(-160, 0, 40), PathOp.Difference));
  return {
    M,
    sleeveOn,
    sleeve,
    noSleeve,
    body,
    little,
    littleVis,
    behind,
    /** The fingers behind, together, less the hand's body over them (the little finger's shadow falls only there). */
    behindAll: op(unionOf(ring, middle, index), body0, PathOp.Difference),
    fingers,
    all,
    near,
    /** (poleLook 'study') where the near pole's shadow may fall: the hand, and the sleeve where it has one. */
    shadowOn: sleeveOn ? unionOf(all, sleeve) : all,
    /** (poleLook 'boom') where this drawing paints the near pole: its silhouette inside the hand's outline. */
    nearClip: op(allGrown, boomNear, PathOp.Intersect),
    /** The little finger where the near pole does not hide it (its shadow falls on the pole). */
    littleOut: op(little, near, PathOp.Difference),
    nearSides: tubeSides(0, a1),
    nearEnd: ellipsePath({ c: poleEndLittleForeAxisAt(a1), rx: sec.rx, ry: sec.ry, rot: sec.rot }),
    far: tube(a0, 0, POLE_R),
    farSides: tubeSides(a0, 0),
    /** (poleLook 'boom') the scene pole's rim, tube and lit band: straight stripes along the axis, each with the scene
     *  stroke's round cap at the pole's end, cut by the pole's section in the curl and the hand's outline. */
    // (the rim a ring round the tube, never under it: at the clip's soft edge the stripes do not stack, so no seam)
    nearBoom: [op(boomStripe(a1, 15.5), boomStripe(a1, 13.5), PathOp.Difference), boomStripe(a1, 13.5), boomStripe(a1, 3, litOff)] as const,
    /** Where the little finger's lit edge may show: past its knuckle's top (to the left of it the back of the hand's
     *  sliver lies above the knuckle — one skin, no lit edge there). */
    littleRimClip: polyPath(pts([[7, -70], [90, -70], [90, 60], [-12, 60], [-12, -10], [7, -30]])),
    cuffOpening: ellipsePath(a.cuff),
    /** The top edge over the knuckle row: the hand's own outline there, one line. */
    topClip: polyPath(TOP_LINE_CLIP),
    littleEdge: smoothOpen(a.littleEdge),
    littleTurn: smoothOpen(a.littleTurn),
    bodyEdge: smoothOpen(a.bodyEdge),
    behindEdges: a.behindEdges.map((es) => many(es.map((e) => smoothOpen(e)))),
    valleys: a.valleys.map((es) => many(es.map((e) => smoothOpen(e)))),
    bendCreases: a.bendCreases.map((e) => smoothOpen(e)),
    creases: many(a.creases.map(smoothOpen)),
    lights: relit(a.lights, M, 1).map(ellipsePath),
    darks: relit(a.darks, M, -1).map(ellipsePath),
    knuckleLights: many(relit(a.knuckleLights, M, 1).map(ellipsePath)),
    behindLights: a.behindLights.map((es) => many(relit(es, M, 1).map(ellipsePath))),
    behindDarks: relit(a.behindDarks, M, -1).map(ellipsePath),
    /** The little finger as it casts its shadow on the hand: not from its base, where it grows out of the hand. */
    littleCaster: op(littleVis, polyPath(pts([[-40, -60], [8, -60], [8, -14], [-40, -14]])), PathOp.Difference),
    littleLights: many(relit(a.littleLights, M, 1).map(ellipsePath)),
    littleDarks: many(relit(a.littleDarks, M, -1).map(ellipsePath)),
    littleWarm: many(a.littleWarm.map(ellipsePath)),
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (the approved hands': one fixed span, every piece shares it — no seam). */
const FILL_C = turn(-22, -12);
function HandFill({ path, M }: { path: SkPath; M: LightMap }) {
  const { HAND } = useLook();
  const c = FILL_C;
  const Ld = mv(M, -0.36, -0.93);
  const R = 76;
  return (
    <Path path={path}>
      <LinearGradient start={vec(c.u + Ld.u * R, c.v + Ld.v * R)} end={vec(c.u - Ld.u * R, c.v - Ld.v * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

/** A page offset (mm) carried into the drawing's frame: a cast shadow falls the same way on the page. */
const off = (M: LightMap, u: number, v: number) => {
  const q = mv(M, u, v);
  return [{ translateX: q.u }, { translateY: q.v }];
};

/** The pole's cylinder light across it: its lit side toward the light. */
function PoleShade({ path, M }: { path: SkPath; M: LightMap }) {
  const L = mv(M, LIGHT.u, LIGHT.v);
  const s = ACROSS.u * L.u + ACROSS.v * L.v > 0 ? 1 : -1;
  const n = P(ACROSS.u * s * POLE_R, ACROSS.v * s * POLE_R);
  return (
    <Path path={path}>
      <LinearGradient start={vec(n.u, n.v)} end={vec(-n.u, -n.v)} colors={POLE_STOPS} positions={POLE_POS} />
    </Path>
  );
}

/** A drawn line, kept off the cuff's place where the hand has no sleeve of its own. */
function Line({ B, children }: { B: Built; children: ReactNode }) {
  return B.noSleeve ? <Group clip={B.noSleeve}>{children}</Group> : <Group>{children}</Group>;
}

const PLATE_A = turn(24, -40);
const PLATE_B = turn(46, 20);
const FOREARM_A = turn(-56, -6);
const FOREARM_B = turn(-122, 10);

function EndLittleForePaint({ B, poleLook }: { B: Built; poleLook: 'study' | 'boom' }) {
  const { MAT } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (the fingers behind, ring → index: the backs of their first segments lie side by side as one surface — one shade,
  // the same for all; each finger's bend and middle segment carry their own shade)
  const depthShade = [0.1, 0.1, 0.12];
  return (
    <Group>
      {/* 0. THE FAR POLE (behind the whole fist: seen only past the index finger's front) */}
      {poleLook === 'study' ? (
        <Group>
          <PoleShade path={B.far} M={M} />
          <Path path={B.far} color="#000" opacity={0.18} />
          <Path path={B.farSides} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.7} />
        </Group>
      ) : null}

      {/* the cuff's opening (dark), behind the wrist */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.cuffOpening} color={shirt.deep} />
          <Path path={B.cuffOpening} color="#000" opacity={0.35} />
        </Group>
      ) : null}

      {/* 1. THE FINGERS BEHIND THE LITTLE FINGER: index, middle, ring (far → near) */}
      {[2, 1, 0].map((i) => (
        <Group key={`f${i}`}>
          <HandFill path={B.behind[i]} M={M} />
          <Group clip={B.behind[i]}>
            <Path path={B.behind[i]} color={SKIN.deep} opacity={depthShade[i]} />
            <Path path={rimL(B.behind[i], 1.3, M)} color={SKIN.rim} opacity={0.24}>
              <Blur mm={0.7} />
            </Path>
            {/* the fist's front as one surface: lit along the backs of the first segments, turning away into shade
                toward the bends and under (one span for all three fingers: no band of its own) */}
            <Path path={B.behind[i]}>
              <LinearGradient start={vec(PLATE_A.u, PLATE_A.v)} end={vec(PLATE_B.u, PLATE_B.v)} colors={['rgba(52,26,16,0)', 'rgba(52,26,16,0.3)']} />
            </Path>
            {/* the soft valley against the finger in front: at the knuckles and round the bends only */}
            <Path path={B.valleys[i]} style="stroke" strokeWidth={3} strokeCap="round" color={SKIN.deep} opacity={0.34}>
              <Blur mm={1.6} />
            </Path>
            <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.22}>
              <Blur mm={1.4} />
            </Path>
            {/* the back of its first segment catching the light; its bend and middle segment turned down, in shade */}
            <Path path={B.behindLights[i]} color={SKIN.rim} opacity={0.22}>
              <Blur mm={2} />
            </Path>
            <Path path={B.behindDarks[i]} color={SKIN.deep} opacity={0.3}>
              <Blur mm={2.8} />
            </Path>
          </Group>
          <Path path={B.behindEdges[i]} style="stroke" strokeWidth={0.8} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.42} />
          {i < 2 ? <Path path={B.bendCreases[i]} style="stroke" strokeWidth={0.65} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.26} /> : null}
        </Group>
      ))}

      {/* 2. THE HAND'S BODY: the back of the hand's sliver, the side, the heel, the wrist */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        {/* the forearm turning away from the light toward the elbow */}
        <Path path={B.body}>
          <LinearGradient start={vec(FOREARM_A.u, FOREARM_A.v)} end={vec(FOREARM_B.u, FOREARM_B.v)} colors={['rgba(52,26,16,0)', 'rgba(52,26,16,0.2)']} />
        </Path>
        {B.lights.map((l, i) => (
          <Path key={`l${i}`} path={l} color={SKIN.rim} opacity={i === 0 ? 0.3 : 0.16}>
            <Blur mm={i === 0 ? 2 : 3} />
          </Path>
        ))}
        {B.darks.map((l, i) => (
          <Path key={`d${i}`} path={l} color={SKIN.deep} opacity={i === 0 ? 0.22 : 0.24}>
            <Blur mm={i === 0 ? 2.2 : 3.2} />
          </Path>
        ))}
        {/* the little finger's soft shadow on the side of the hand and the heel */}
        <Group transform={off(M, 0.8, 1.6)}>
          <Path path={B.littleCaster} color={SKIN.deep} opacity={0.26}>
            <Blur mm={2.2} />
          </Path>
        </Group>
        {/* the little finger's knuckle light and warmth, begun on the hand (it grows out of it: no seam) */}
        <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.24}>
          <Blur mm={1.6} />
        </Path>
        <Path path={B.littleWarm} color={WARM} opacity={0.16}>
          <Blur mm={2.4} />
        </Path>
        <Path path={rimL(B.body, 2, M)} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>
      <Line B={B}>
        <Path path={B.bodyEdge} style="stroke" strokeWidth={0.9} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />
      </Line>
      {/* the top edge over the knuckle row: the hand's own outline, one line from the back of the hand to the index */}
      <Group clip={B.topClip}>
        <Path path={B.all} style="stroke" strokeWidth={0.85} strokeJoin="round" color={SKIN.edge} opacity={0.46} />
      </Group>

      {/* 3. THE LITTLE FINGER (the nearest form): its soft shadow on the fingers behind, then the finger */}
      <Group clip={B.behindAll}>
        <Group transform={off(M, 0.8, 1.4)}>
          <Path path={B.littleVis} color="#1c0f09" opacity={0.3}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>
      <HandFill path={B.littleVis} M={M} />
      <Group clip={B.littleVis}>
        {/* (the hand's own shades carried on over the finger's base: no seam where the finger begins) */}
        <Path path={B.darks[0]} color={SKIN.deep} opacity={0.22}>
          <Blur mm={2.2} />
        </Path>
        <Path path={B.littleLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.littleDarks} color={SKIN.deep} opacity={0.24}>
          <Blur mm={2} />
        </Path>
        {/* where the side turns into the back: a soft change of light, never a line */}
        <Path path={B.littleTurn} style="stroke" strokeWidth={3} strokeCap="round" color={SKIN.rim} opacity={0.14}>
          <Blur mm={1.4} />
        </Path>
        <Path path={B.littleWarm} color={WARM} opacity={0.16}>
          <Blur mm={2.4} />
        </Path>
        <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.24}>
          <Blur mm={1.6} />
        </Path>
        <Group clip={B.littleRimClip}>
          <Path path={rimL(B.little, 1.7, M)} color={SKIN.rim} opacity={0.3}>
            <Blur mm={0.8} />
          </Path>
        </Group>
        <Path path={B.creases} style="stroke" strokeWidth={0.7} strokeCap="round" color={SKIN.deep} opacity={0.24}>
          <Blur mm={0.4} />
        </Path>
      </Group>
      <Path path={B.littleEdge} style="stroke" strokeWidth={0.85} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 4. THE SLEEVE: the cuff's near rim in front of the wrist */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(Lm.u < 0 ? -150 : -84, -10)} end={vec(Lm.u < 0 ? -84 : -150, 50)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}

      {/* 5. THE NEAR POLE (in front of everything): its soft shadow on the hand, then the pole */}
      <Group clip={B.shadowOn}>
        <Group transform={off(M, 1.6, 3)}>
          <Path path={poleLook === 'boom' ? B.nearClip : B.near} color={SKIN.deep} opacity={0.42}>
            <Blur mm={2.6} />
          </Path>
        </Group>
      </Group>
      {poleLook === 'boom' ? (
        // (the scene's own pole as BoomV2 paints it — dark rim, tube, lit band — as straight stripes on its axis, cut
        // only by the pole's own section in the curl and by the hand's outline: the scene draws the pole whole under the
        // hand, so this piece and the scene's pole are one pole)
        <Group clip={B.nearClip}>
          <Path path={B.nearBoom[0]} color={BOOM_RIM} />
          <Path path={B.nearBoom[1]} color={BOOM_TUBE} />
          <Path path={B.nearBoom[2]} color={BOOM_LIT} opacity={0.45} />
        </Group>
      ) : (
        <Group>
          <PoleShade path={B.near} M={M} />
          <Path path={B.nearEnd} color="#4b5058" />
          <Path path={B.nearEnd} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.6} />
          <Path path={B.nearSides} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.7} />
        </Group>
      )}
      {/* the little finger's soft shadow on the pole where it goes into the curl (the light from the upper left): the
          pole tucked under the finger, never a pole's end */}
      <Group clip={poleLook === 'boom' ? B.nearClip : B.near}>
        <Group transform={off(M, 1.4, 2.4)}>
          <Path path={B.littleOut} color="#000" opacity={0.32}>
            <Blur mm={1.8} />
          </Path>
        </Group>
      </Group>
    </Group>
  );
}

export type PoleHandEndLittleForeProps = {
  /** The cast member (absent: the look already given round it, inside a figure). */
  who?: CastMember;
  x: number;
  y: number;
  s: number;
  rot?: number;
  /** The pole from `pole[0]` (behind the fist, negative) to `pole[1]` (toward the viewer: where it ENDS) mm along its
   *  axis. Default [−600, 110]: B10's pole goes on 110 mm past this hand. */
  pole?: [number, number];
  /** (option) the LEFT hand: the mirror image, re-lit so the light stays at the page's upper left. */
  mirror?: boolean;
  /** (option, default true) false: no sleeve of its own — the skin ends at the cuff's near rim. */
  sleeve?: boolean;
  /** (option) 'boom': the near pole painted as the boom operator's scene pole, and only inside the hand's outline. */
  poleLook?: 'study' | 'boom';
  /** (option, default true) false: keep the scene's own figure scale (the hand drawn inside a figure). */
  ownScale?: boolean;
};

/** Where the art's own cuff rim is (drawing frame, mm): a figure's sleeve mouth goes here. */
export const POLE_HAND_END_LITTLE_FORE_CUFF: Pt = POLE_HAND_END_LITTLE_FORE.cuff.c;

/** The drawing's frame on the page: local (mm) → page. */
export function poleHandEndLittleForeToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandEndLittleForeProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return (q: Pt): Pt => {
    const u = q.u * s * m;
    const v = q.v * s;
    return P(x + u * co - v * si, y + u * si + v * co);
  };
}

/** The pole's axis direction on the page, toward the viewer (unit). */
export function poleHandEndLittleForeAxisOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndLittleForeProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndLittleForeToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_LITTLE_FORE_AXIS);
}

/** The forearm's direction on the page, fist → elbow (unit). */
export function poleHandEndLittleForeForeOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndLittleForeProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndLittleForeToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_LITTLE_FORE_FORE);
}

/** The hand's whole outline on the page (fingers, body; without its sleeve where `sleeve` is false). */
export function poleHandEndLittleForeOutline(o: Pick<PoleHandEndLittleForeProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_END_LITTLE_FORE, -1, 1, IDENTITY, o.sleeve ?? true);
  const p = B.all.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand on its pole seen along the pole from the little-finger end, the camera tilted toward the front of the
 * fist, for one cast member: drawn at (x, y) (pt — the pole's axis where it enters the fist on the little-finger side),
 * `s` pt per mm, turned `rot` radians. With `mirror`, the left hand (seen from ITS little-finger end), re-lit.
 */
export function PoleHandEndLittleFore({ who, x, y, s, rot = 0, pole = [-600, POLE_END_LITTLE_FORE_NEAR], mirror = false, sleeve = true, poleLook = 'study', ownScale = true }: PoleHandEndLittleForeProps) {
  const B = useMemo(() => build(POLE_HAND_END_LITTLE_FORE, pole[0], pole[1], mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY, sleeve), [pole[0], pole[1], rot, mirror, sleeve]);
  const paint = <EndLittleForePaint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
