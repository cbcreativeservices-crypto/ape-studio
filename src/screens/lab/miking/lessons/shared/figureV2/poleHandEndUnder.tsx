/**
 * FIGURE V2 — A RIGHT HAND SUPPORTING A 30 mm POLE FROM BELOW (UNDERHAND), SEEN ALONG THE POLE FROM THE THUMB / INDEX
 * END (owner 2026-11-25, "one hand at a time"). In use it is the boom operator's LEFT hand on B10 "post-event overhead":
 * the mirror image, re-lit.
 *
 * WHAT THE HAND DOES (written first; the last attempt drew a correct angle of the wrong hold — poleHandEndLittleFore,
 * owner: "it curls ontop of the pole and not cradeling it from below"):
 * The boom is held UP OVER HER HEAD. This is her lower, near hand and it SUPPORTS the pole: the pole rests in the PALM,
 * the palm faces UP under the pole, the fingers come up round the pole's far side and close over its top, the thumb
 * comes up the other (near) side from its mound and bends over the top toward the index, the wrist is BELOW the pole
 * and the forearm rises to the hand from below. (The rig: boomGrip BoomArm3.under, BoomV2 OVERHEAD_UNDERHAND
 * 'ruledHandOnly' — B10's left hand; palm·up +0.68.)
 *
 * THE VIEW, DERIVED (read 2026-11-25 from the rig's own 3-D pose: BoomV2.boomPlans(…, 'side') for B10's start rig, the
 * left arm's elbow → fist, the pole, the side camera's toward (0, 0, 1), boomGrip.boomHandFace's back of the hand d and
 * thumb; unit vectors, so the same for the left hand and the right hand it mirrors):
 *   the camera · the pole toward the thumb               +0.892 → 27° off the pole, at the THUMB / INDEX end;
 *   the camera · the fist's front (wrist → knuckles,
 *     square to the pole)                                 +0.444 → the camera's 27° lean is almost all toward the
 *                                                                  front of the fist (the fingers' bends);
 *   the camera · the back of the hand                    −0.078 → the hand's plane edge-on, a hair toward the PALM;
 *   palm·up (the palm's normal against world up)          +0.68 → the palm faces up under the pole;
 *   the forearm (elbow → fist) · the pole (thumb-ward)    −0.385 → the elbow on the little-finger side, 23° off square;
 *   the camera · (fist → elbow)                            −0.067 → the forearm recedes a hair;
 *   the wrist from the pole's axis (world)                 (25, 66, −34) mm → 66 mm BELOW the pole's axis.
 * On the side view's page (left hand, y down) the pole's near part leaves the fist at 56° (down and to the right,
 * 0.45 page mm per mm along it), the forearm at 47°: the forearm −9.2° from the near pole, i.e. 9° counter-clockwise
 * (the right hand as authored: +9°). That is poleHandEnd's view (the thumb end, the camera a little toward the palm)
 * with the forearm swung 36° round toward the pole — poleHandEnd placed there is 36° off and its straight wrist would
 * need a 475 mm upper arm (the real one is 300), so it cannot be used.
 * THE FOREARM ANGLE CHOSEN, AND WHY: over B10's drag grid (the mic 600–1000 mm out, 20–60° up) the poses seen from the
 * thumb end read from −42.8° (1000 mm, 30°) to +60° (600–650 mm, 20°) — no one drawing fits them all. The MAIN zone (750
 * mm out and more at 30° up and more, 650–700 mm higher up) reads −42.8° … +31.4° (800 mm: +10.9° at 30°, +4.9° at 40°,
 * +5.4° at 45°, +7.0° at 50°; 900 mm 35°: −15.1°; 1000 mm: −28.9° at 40°, −22.9° at 45°, −16.3° at 50°; 700 mm: +31.4°
 * at 30°, +19.9° at 45°): only a left-hand angle between −8.6° and −2.8° keeps EVERY one of those inside the 40° fit.
 * The mic close in and low (≤ 700 mm at ≤ 35°, 750 mm at ≤ 25°: +33.7° … +60°) and the camera within 9° of the pole are
 * other pictures (another drawing, or the old hand). The brief asked, within the fit, for the angle that opens
 * the gap between the forearm and the pole — the smaller angle (the forearm swung toward the wrist's side, the BELOW
 * side of the near pole's line). It matters less than feared here: B10's pole ENDS 70 mm past the fist (its butt),
 * before the wrist, so the near pole can never reach the wrist, forearm or sleeve at any angle; what keeps the hand
 * reading as UNDER the pole is the wrist and forearm drawn well on the below side (the wrist's middle 29 mm below the
 * axis on the page; the rig's true 16 mm would put the wrist's top edge on the pole's line). Chosen: the left forearm
 * 8° counter-clockwise from the near pole (END_UNDER_FORE_FROM_NEAR = +8° for the right hand as authored, −8°
 * mirrored), inside that window, 1° off the start pose:
 *   B10 overhead (start)                −9.2°, camera 27° off at the thumb end            →  1° off (fits);
 *   the main thumb-end drag zone        −42.8° … +31.4°                                    →  ≤ 39.4° off (all fit;
 *                                       the edges, 1000 mm / 30° and 700 mm / 30°, 34.8° and 39.4° off);
 *   B10 raised over the head           +94.7°, camera 40° off at the LITTLE-FINGER end    → another view;
 *   B10 dragged below the mouth        +73.7°, camera 43° off at the little-finger end    → another view.
 * (+5° mirrored, for the widest gap, was tried first: it missed the 1000 mm / 30° pose by 8°.)
 *
 * AUTHORED 2-D ART, as the approved hands: hand-placed points (mm) drawn as smooth closed cubic curves, the same skin
 * light (cast.ts tones through useLook), the same thin soft outline, soft form lights and shadows, very few lines, the
 * light from the page's upper left. No 3-D model, no projected skeleton (the numbers above only say where each form
 * lies; every point is placed by hand). Authored directly in the drawing's page-oriented frame (+x right, +y DOWN),
 * turned so that the mirrored left hand sits as B10's start pose draws it (rot ≈ 0 there).
 *
 * THE VIEW, IN WORDS (written before any point was placed; the right hand as authored — the lesson sees its mirror):
 * We stand off the thumb / index end of the fist and look nearly along the pole (25° off), leaning toward the front of
 * the fist, level with the hand's own plane. The pole's NEAR part comes toward us out of the fist down and to the LEFT
 * (at 124° on the page), a short foreshortened stretch (B10's pole ends 70 mm past the fist: its butt); its FAR part
 * goes away up and to the RIGHT, hidden in the hand, and shows again only past the little finger's curl at the top
 * right. Its round section sits in a RING OF SKIN: the index above and to the right, the thumb to the left, the palm and
 * the side of the hand under it.
 *   1. The THUMB, nearest of all: out of its mound (the thenar) low on the left, under the pole's end, it comes UP the
 *      near side of the pole (left), past the pole's near stretch (which crosses in front of its root), and bends over
 *      the pole's TOP toward the index, its tip pressed on the index's middle segment above the pole. One thick,
 *      tapering form: the metacarpal and the mound, the base joint, a slight bend at the middle (IP) joint, the end
 *      segment; its NAIL on the end segment's upper / outer face, a slender oblong seen from the side.
 *   2. The INDEX, the nearest finger: its big knuckle low on the right (on the back of the hand's edge), its first
 *      segment rising up the pole's FAR side (right), the middle joint's rounded bend at the top, the middle segment
 *      closing over the pole's top toward the thumb and going in under the thumb's tip; its last segment and tip are
 *      hidden behind the thumb and the near pole. Its inner side presses on the pole's section all round.
 *   3. Behind it, each farther along the pole and so each a step UP and to the RIGHT (0.42 mm per mm: about 8 mm a
 *      finger), the MIDDLE, RING and LITTLE: only an outer band of each — its knuckle, the back of its first segment, its
 *      bend — beyond the finger in front: the middle's the widest band (the longest finger), the ring's narrower, the
 *      little's a sliver at the top right where the far pole leaves. Their knuckles step up the fist's lower-right edge,
 *      each step its own; never a row of equal bumps.
 *   4. The HAND'S BODY under the pole: the side of the hand (the index side, toward us) from under the pole's section
 *      down to the wrist; its lower-right edge the back of the hand seen edge-on (in shade), from the knuckle row down to
 *      the wrist; the heel of the hand and the thumb's mound as the rounded mass UNDER the pole's end, lit on its upper
 *      side; the wrist (narrower than the hand) going down-left into the cuff; the forearm drops away BELOW the pole's
 *      line and behind it.
 *   5. THE POLE: the section ringed by skin; the near stretch in front of the thumb's root and the palm's upper edge,
 *      its soft shadow on the heel; never across the wrist, the forearm or the sleeve (it ends before the wrist and the
 *      wrist and forearm lie below its line). One pole through the hand.
 * Paint order (far → near): the far pole → the cuff's dark opening → the little, ring and middle fingers → the hand's
 * body (side of the hand, heel, wrist, forearm) → the index → the thumb → the near pole (its soft shadow on the hand)
 * → the sleeve.
 *
 * THE NEAR POLE IN 'boom' LOOK (as poleHandEndLittleBack): the scene draws its long pole under the hand; this drawing
 * paints only the piece that comes out of the fist toward the viewer, inside the hand's outline, on the scene pole's own
 * axis and width (dark rim, tube, the lit band at the scene's own page offset), with no cap or end of its own beyond
 * the pole's own silhouette — one pole passing through the hand.
 *
 * Frame: origin on the pole's axis where it enters the fist on the index / thumb side; +x right, +y DOWN (the drawing's
 * page-oriented frame). Every exported point is in that frame.
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

const deg = (d: number) => (d * Math.PI) / 180;
const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
/** A soft light or shade (page-oriented frame). */
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The pole's radius (Ø 30 mm): the same pole as poleHandEnd. */
export const POLE_R_UNDER = POLE_R;
/** How far the pole is off the line of sight (rad): the SAME 25° as the other end-on drawings (B10: 27°). */
export const POLE_END_UNDER_TILT = POLE_END_TILT;
/** Page millimetres per millimetre along the pole (the foreshortening): sin 25° ≈ 0.42. */
export const POLE_END_UNDER_FORESHORTEN = Math.sin(POLE_END_UNDER_TILT);
/** (rad, page, y down) the pole's near part, toward the viewer: down and to the left (the mirror of B10's 56°). */
const AXIS_ANGLE = deg(124);
export const POLE_END_UNDER_AXIS: Pt = P(Math.cos(AXIS_ANGLE), Math.sin(AXIS_ANGLE));
/** (rad, page, y down) the forearm's direction (fist → elbow) minus the pole's near direction: +8° — the forearm 8°
 *  CLOCKWISE on the page from the pole's near part (the mirrored left hand −8°; B10's start pose reads −9.2° for the
 *  left hand: 1° off; its main thumb-end drag zone within 40°; see the header). */
export const END_UNDER_FORE_FROM_NEAR = deg(8);
const FORE_ANGLE = AXIS_ANGLE + END_UNDER_FORE_FROM_NEAR;
/** The forearm's direction on the page, fist → elbow (unit, drawing frame). */
export const POLE_END_UNDER_FORE: Pt = P(Math.cos(FORE_ANGLE), Math.sin(FORE_ANGLE));
/** Across the pole on the page (unit, the axis turned a quarter clockwise: up and to the left, the pole's TOP side). */
const ACROSS: Pt = P(-POLE_END_UNDER_AXIS.v, POLE_END_UNDER_AXIS.u);
/** The pole's round section where it enters the fist (an ellipse: narrower along the pole, cos 25°). */
export const POLE_END_UNDER_SECTION: Ellipse = { c: P(0, 0), rx: POLE_R * Math.cos(POLE_END_UNDER_TILT), ry: POLE_R, rot: AXIS_ANGLE };
/** The point on the pole's axis `a` mm along it from the index / thumb side of the fist (+ toward the viewer). */
export function poleEndUnderAxisAt(a: number): Pt {
  return P(POLE_END_UNDER_AXIS.u * POLE_END_UNDER_FORESHORTEN * a, POLE_END_UNDER_AXIS.v * POLE_END_UNDER_FORESHORTEN * a);
}
/** The grip's centre: the middle of the fist along the pole (≈ 40 mm in from the index side). */
export const POLE_END_UNDER_GRIP: Pt = poleEndUnderAxisAt(-40);
/** B10's pole ends about 70 mm past the fist's index side (110 past the grip): its butt. The drawing's default near. */
export const POLE_END_UNDER_NEAR = 70;

/**
 * THE INDEX — the nearest finger: its knuckle low on the right, the first segment up the pole's far side, the bend at
 * the top, the middle segment over the top toward the thumb (its last segment and tip behind the thumb and the near
 * pole); the inner side pressed on the pole's section all round.
 */
const INDEX = pts([
  // the base, closing inside the side of the hand (no edge drawn there)
  [30, 21], [37, 19.4],
  // the big knuckle: a soft swell on the back of the hand's edge (its lower side ON the back of the hand's line)
  [41.6, 19.4], [44, 14.6], [45.8, 9.4], [46.8, 3.5],
  // the first segment's back, rising (nearly straight) up the pole's far side
  [46.4, -4], [44.9, -11.6], [42.8, -19], [40.2, -25.6],
  // the middle joint's bend: a rounded corner, top right
  [36.4, -30.8], [31, -34.4], [24.6, -36.2],
  // the middle segment's back, over the top toward the thumb
  [17, -36.8], [9.4, -36.6], [1.8, -35.8],
  // the last joint's softer bend, top left (going in under the thumb's tip)
  [-6, -34.4], [-13, -31.4], [-19.6, -26.8],
  // the last segment down the pole's near side, between the pole and the thumb (its back under the thumb), the tip
  // (behind the near pole)
  [-25, -20.4], [-28.6, -12.6], [-30, -4], [-29, 4.6], [-26, 12], [-21.6, 16.6], [-17, 17.6], [-13.6, 14], [-13.6, 8],
  // the inner side, the pads pressed on the pole's section all round
  [-13.6, 1.9], [-13.7, -3.8], [-11.9, -8.1], [-8.3, -11.5], [-3.3, -13.3], [2.3, -13], [7.3, -10.8],
  // (the middle joint's crease: the finger leaves the pole a little) and on down the far side
  [11.6, -7.4], [13.8, -1.9], [13.8, 3.4], [12.6, 8.2],
  // into the web over the side of the hand
  [16, 12.4], [22, 17],
]);
/** The index's drawn edge: from its knuckle round the C to where it goes in under the thumb. */
const INDEX_EDGE = INDEX.slice(4, 19);

/**
 * THE FINGERS BEHIND — middle, ring, little: each farther along the pole, so a step up and to the right; only an outer
 * band of each shows beyond the one in front — its knuckle, the back of its first segment and its bend. Each closes well
 * inside the finger in front (hidden). Hand-placed, each its own width.
 */
// (owner 2026-11-25 on the old boxy fist: "these fingers do not flow into the hands" — so no knuckle steps and no
// separate rolls: each finger behind comes out from under the one in front as a crescent that grows from nothing on
// the far side, is widest at its bend and fades back under before the top; its base never shows)
const MIDDLE = pts([
  // out from under the index's back
  [45.4, -5],
  // the back of the first segment, the bend (widest), the middle segment going over the top and back under
  [46.9, -11.9], [46.6, -20.3], [45.1, -28.4], [41.7, -35.1], [35.8, -39.8], [28.1, -41.8], [18.8, -41.9], [9.8, -40.2], [1.6, -37.4],
  // (hidden inside the index)
  [-4, -33], [4, -32], [24, -30], [38, -16],
]);
const RING = pts([
  [46, -12.6],
  [48.1, -20.8], [47.9, -30], [45.1, -37.9], [38.8, -43.3], [30.1, -45], [19.6, -44.2], [9.9, -41],
  [4, -37.6], [16, -38], [34, -36], [44, -22],
]);
const LITTLE = pts([
  [47.6, -22],
  [49, -30.9], [46.7, -39.7], [40.2, -45.5], [30.7, -46.7], [19.7, -44.8],
  [14, -42.4], [26, -42], [42, -36],
]);
/** Their drawn (outer) edges. */
const MIDDLE_EDGE = MIDDLE.slice(1, 10);
const RING_EDGE = RING.slice(1, 8);
const LITTLE_EDGE = LITTLE.slice(1, 6);

/**
 * THE HAND'S BODY — under the pole: the side of the hand from under the section down to the wrist, its lower-right edge
 * the back of the hand edge-on (from the index's knuckle down to the wrist), the wrist, the forearm into the cuff, the
 * forearm's front edge, the heel rising into the thumb's mound (hidden under the thumb), and back under the near pole and
 * the section (hidden).
 */
const BODY = pts([
  // (hidden under the index's base)
  [34, 10], [40, 6], [44.6, 8],
  // the back of the hand, edge-on, from the knuckle down to the wrist (a gentle arch; it starts on the knuckle's own
  // curve, so the hand runs on into the finger with no step)
  [44.2, 13.4], [41, 22.4], [37, 30.6], [32, 39], [26.4, 47.6], [20.4, 56], [14.2, 64.2], [9.2, 70.4],
  // the wrist (a little in), the forearm's back edge into the cuff (and on under the sleeve)
  [5.6, 75.6], [0, 83.1], [-9.2, 93.2], [-21.9, 108.7], [-34.3, 122], [-44.6, 135.4],
  [-60.5, 124.2], [-75.9, 107.3],
  // the forearm's front edge, the wrist's front (narrower than the hand)
  [-63.9, 94.6], [-49.7, 85.5], [-42.8, 78.6], [-38.4, 71], [-35.6, 61], [-34.4, 55.4],
  // the heel rising into the thumb's mound (under the thumb)
  [-29, 49], [-24, 45],
  // (hidden under the near pole and the section — the skin closed behind the pole all the way to the thumb, so no
  // scene pole shows through) back to the index
  [-25, 34], [-24, 22], [-18, 12], [-8, 6], [2, 4], [10, 2], [20, 2], [28, 5],
]);
/** The body's drawn edge: the back of the hand and the wrist's back (the forearm runs on under the sleeve). */
const BODY_EDGE = [P(45.8, 9.4), ...BODY.slice(3, 16)];
/** The forearm's front edge and the wrist's front up to the thumb's mound. */
const BODY_FRONT_EDGE = BODY.slice(19, 23);

/**
 * THE THUMB — nearest of all: out of its mound low on the left, up the pole's near side, bending over its top, its tip
 * on the index's middle segment. Its root closes inside the heel (the same skin: no edge, no crease).
 */
const THUMB = pts([
  // the root, inside the heel
  [-18, 47], [-24, 62],
  // the mound's outer edge rising out of the wrist's front (one line with it: no corner)
  // (owner 2026-11-25: "thumb is too skinny" — the thickest digit: about 21 mm across the base segment, 18 mm through
  // the end segment, a full pad and a blunt tip)
  [-29, 70], [-37.4, 67.6], [-37.4, 61.6], [-38.4, 54.6], [-39.8, 48], [-41.8, 41], [-43.8, 34], [-45.8, 26.6],
  // the base joint's soft swell, the first segment
  [-47.4, 19], [-48.2, 11], [-48, 3], [-46.8, -5],
  // the middle (IP) joint's slight bend
  [-44, -12.6], [-40, -19.4],
  // the end segment's outer (nail) face, over the top
  [-34.6, -25.6], [-28, -31], [-21, -34.6],
  // the tip, blunt and rounded, its pad pressed on the index's middle segment
  [-14, -35.2], [-8.4, -33.8], [-4.6, -30.4], [-4, -25.8], [-6, -21.6],
  // the inner (pad) side, full, lying on the index's last segment
  [-10.6, -19.2], [-15.8, -17.4], [-21, -13.8], [-24.6, -9], [-26.4, -3.6], [-27, 2], [-27, 7.6],
  // (behind the near pole) down to the root
  [-26, 16], [-24, 26], [-20, 34], [-18, 40],
]);
/** The thumb's drawn edge: from the mound round the tip and up its inner side to where the near pole hides it. */
const THUMB_EDGE = THUMB.slice(5, 32);

/** A quiet nail: a rounded oblong `len` along `rot`, `w` across. */
function nail(x: number, y: number, len: number, w: number, rot: number): Poly {
  const out: Poly = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let j = 0; j < 20; j++) {
    const t = (Math.PI * 2 * j) / 20;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const a = (len / 2) * Math.sign(ct) * Math.pow(Math.abs(ct), 0.75);
    const b = (w / 2) * Math.sign(st) * Math.pow(Math.abs(st), 0.75);
    out.push(P(x + a * c - b * s, y + a * s + b * c));
  }
  return out;
}

/** The cuff (drawing frame): its rim a narrow ellipse across the forearm (the forearm recedes a hair), centred on the
 *  forearm's line; its NEAR half is the one away from the hand, so the wrist goes in behind it; the sleeve beyond. */
const F = POLE_END_UNDER_FORE;
const FP: Pt = P(-F.v, F.u);
const CUFF_C: Pt = P(-31.4, 89.4);
const CUFF_RX = 7;
const CUFF_RY = 24;
const at = (along: number, across: number): Pt => P(CUFF_C.u + F.u * along + FP.u * across, CUFF_C.v + F.v * along + FP.v * across);
function cuffArc(from: number, to: number, n = 16): Poly {
  const out: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = from + ((to - from) * j) / n;
    out.push(at(CUFF_RX * Math.cos(t), CUFF_RY * Math.sin(t)));
  }
  return out;
}
const SLEEVE: Poly = [...cuffArc(-Math.PI / 2, Math.PI / 2), at(62, 27), at(62, -27)];
/** (sleeve off) where the skin and its lines stop: the cuff's rim, and everything beyond it. */
const SLEEVE_CUT: Poly = [...cuffArc(-Math.PI / 2, Math.PI / 2, 32), at(0, 60), at(220, 110), at(220, -110), at(0, -60)];

export type PoleHandEndUnderArt = {
  index: Poly;
  indexEdge: Poly;
  /** The fingers behind, near → far: middle, ring, little. */
  middle: Poly;
  ring: Poly;
  little: Poly;
  behindEdges: [Poly, Poly, Poly];
  body: Poly;
  bodyEdge: Poly;
  bodyFrontEdge: Poly;
  thumb: Poly;
  thumbEdge: Poly;
  thumbNail: Poly;
  sleeve: Poly;
  /** The cuff's rim (an ellipse in the drawing's frame). */
  cuff: Ellipse;
  /** The four knuckles (index → little), the index's bend (the fist's top), the thumb's tip, the heel, the wrist's
   *  middle. */
  knuckles: [Pt, Pt, Pt, Pt];
  bend: Pt;
  thumbTip: Pt;
  heel: Pt;
  wrist: Pt;
  lights: Ellipse[];
  darks: Ellipse[];
  indexLights: Ellipse[];
  indexDarks: Ellipse[];
  indexWarm: Ellipse[];
  thumbLights: Ellipse[];
  thumbDarks: Ellipse[];
  creases: Poly[];
};

export const POLE_HAND_END_UNDER: PoleHandEndUnderArt = {
  index: INDEX,
  indexEdge: INDEX_EDGE,
  middle: MIDDLE,
  ring: RING,
  little: LITTLE,
  behindEdges: [MIDDLE_EDGE, RING_EDGE, LITTLE_EDGE],
  body: BODY,
  bodyEdge: BODY_EDGE,
  // (one line from the forearm's front up over the wrist into the thumb's mound: no break where the thumb begins)
  bodyFrontEdge: [...BODY_FRONT_EDGE, THUMB[4], THUMB[5], THUMB[6]],
  thumb: THUMB,
  thumbEdge: THUMB_EDGE,
  thumbNail: nail(-23, -29.8, 10, 4.4, -0.585),
  sleeve: SLEEVE,
  cuff: { c: CUFF_C, rx: CUFF_RX, ry: CUFF_RY, rot: FORE_ANGLE },
  knuckles: [P(45.8, 9.4), P(46.9, -11.9), P(48.1, -20.8), P(49, -30.9)],
  bend: P(2.8, -37.6),
  thumbTip: P(-4.6, -30.4),
  heel: P(-22, 50),
  wrist: P(-10, 66),
  lights: [
    // the thumb's mound and the heel: lit on their upper side, under the pole's end
    E(-24, 46, 10, 6, 2.1),
    // the side of the hand under the section (the web's muscle), toward the light
    E(22, 22, 13, 6, 2.16),
    // the wrist's front (upper-left) side
    E(-30, 76, 7, 4, 2.3),
  ],
  darks: [
    // the back of the hand turning away, along the lower-right edge
    E(28, 39, 26, 4, 2.13),
    // the heel turning under into the wrist's back
    E(4, 72, 11, 4, 2.1),
    // the web going in by the pole, under the index
    E(14, 14, 6, 4, 0.5),
    // the wrist going into the cuff
    E(-30, 86, 3.6, 19, FORE_ANGLE),
    // the groove between the mound and the side of the hand (kept off the thumb's root: no seam there)
    E(2, 44, 10, 3, 2.2),
    // the index's first segment turning under where it grows out of the side of the hand: a soft fold, fading out
    // toward the knuckle and the pole (no line, no step)
    E(29, 11.6, 12, 2.4, -0.1),
  ],
  indexLights: [
    // the middle joint's rounded corner and the middle segment's back, toward the light
    E(29, -30.6, 7, 3.2, -0.7), E(8, -32.6, 9, 3, 0),
    // the first segment's side, round as a finger: a soft light along its middle
    E(31, -6, 4, 11, 0.22),
    // the last joint's softer bend; the last segment's side, between the pole and the thumb
    E(-7.6, -30, 4, 2.6, 0.55), E(-21.6, -8, 2.6, 7, 0.3),
  ],
  indexDarks: [
    // the first segment's right side, turning away from the light
    E(44.2, -6, 2.6, 10, 0.1),
    // the finger's side under the middle segment, turning in toward the pole
    E(14, -22, 9, 3, -0.15),
  ],
  indexWarm: [E(30, -31, 6, 3, -0.7), E(43, 5, 3, 4)],
  thumbLights: [
    // the outer face of the first segment and the mound, toward the light; the tip
    E(-45, -1, 3.8, 10.5, 0.25), E(-45, 24, 4.2, 9.5, 0.2), E(-9, -30, 3.8, 3.4),
  ],
  thumbDarks: [
    // the full pad lying on the index; the mound turning under toward the wrist
    E(-18.6, -15.4, 3.4, 8, 0.95), E(-38, 52, 7, 2.6, 2.0),
    // the first segment's pad side, turning under toward the pole's near stretch
    E(-25.6, 4, 3.4, 10, 0.1),
  ],
  creases: [
    // the thumb's IP joint and its base joint, hints on its side
    pts([[-24.6, -11.6], [-28.6, -13.8]]),
    pts([[-46.4, 13.6], [-43, 12.6]]),
  ],
};

/* ── the paint ── */

const WARM = '#b8665a';
const POLE_STOPS = ['#25282d', '#5d636c', '#b0b6bf', '#7b818a', '#555a62', '#3b3f46', '#222428'];
const POLE_POS = [0, 0.1, 0.22, 0.38, 0.62, 0.86, 1];
/** (poleLook 'boom') the scene pole's paint, as BoomV2's PoleSeg: dark rim 31 mm, tube 27 mm, lit band 6 mm at a page
 *  offset of (−1.5, −2) mm. */
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

/** The pole's straight band from `a0` to `a1` mm along its axis (+ toward the viewer), half-width `h`: no ends. */
function band(a0: number, a1: number, h: number, shift: Pt = P(0, 0)): SkPath {
  const c0 = poleEndUnderAxisAt(a0);
  const c1 = poleEndUnderAxisAt(a1);
  const n = ACROSS;
  const s = shift;
  return polyPath([P(c0.u + n.u * h + s.u, c0.v + n.v * h + s.v), P(c1.u + n.u * h + s.u, c1.v + n.v * h + s.v), P(c1.u - n.u * h + s.u, c1.v - n.v * h + s.v), P(c0.u - n.u * h + s.u, c0.v - n.v * h + s.v)]);
}
/** The pole from `a0` to `a1`, half-width `h`: the band with its round sections at both ends (its silhouette). */
function tube(a0: number, a1: number, h: number): SkPath {
  const end = (c: Pt) => ellipsePath({ c, rx: h * Math.cos(POLE_END_UNDER_TILT), ry: h, rot: AXIS_ANGLE });
  return unionOf(band(a0, a1, h), end(poleEndUnderAxisAt(a0)), end(poleEndUnderAxisAt(a1)));
}
/** The pole's two side lines from `a0` to `a1`. */
function tubeSides(a0: number, a1: number): SkPath {
  const c0 = poleEndUnderAxisAt(a0);
  const c1 = poleEndUnderAxisAt(a1);
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

function build(a: PoleHandEndUnderArt, a0: number, a1: number, M: LightMap, sleeveOn: boolean) {
  const sleeve = smoothClosed(a.sleeve, 0.2);
  const cut = polyPath(SLEEVE_CUT);
  const body0 = smoothClosed(a.body);
  const body = sleeveOn ? body0 : op(body0, cut, PathOp.Difference);
  const index = smoothClosed(a.index, 0.5);
  const middle = smoothClosed(a.middle, 0.5);
  const ring = smoothClosed(a.ring, 0.5);
  const little = smoothClosed(a.little, 0.5);
  const thumb = smoothClosed(a.thumb, 0.5);
  const behind = [middle, ring, little];
  const fingers = unionOf(index, middle, ring, little);
  const all = unionOf(body, fingers, thumb);
  const sec = POLE_END_UNDER_SECTION;
  const big = Skia.Path.Make();
  big.addRect(Skia.XYWHRect(-400, -400, 800, 800));
  const noSleeve = sleeveOn ? null : op(big, cut, PathOp.Difference);
  const litOff = mv(M, BOOM_LIT_OFF.u, BOOM_LIT_OFF.v);
  const near = tube(0, a1, POLE_R);
  // (the hand's outline grown by its drawn edge's half-width, and the section filled: the near pole covers the lines it
  // passes in front of)
  const moved = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const q = all.copy();
    q.offset(1.2 * Math.cos((k * Math.PI) / 4), 1.2 * Math.sin((k * Math.PI) / 4));
    return q;
  });
  const allGrown = unionOf(all, ...moved, ellipsePath({ c: sec.c, rx: sec.rx + 1.5, ry: sec.ry + 1.5, rot: sec.rot }));
  // (the thumb's root grows out of the heel as one skin: its cast shadow only from where it is free of the hand)
  const rootZone = polyPath(pts([[-26, 32], [-12, 28], [10, 90], [-40, 90], [-36.5, 68]]));
  return {
    M,
    sleeveOn,
    sleeve,
    noSleeve,
    body,
    /** The side of the hand and the index as one skin: the hand's own lights and shades run on over the finger's base. */
    bodyIndex: unionOf(body, index),
    thumbCast: op(thumb, rootZone, PathOp.Difference),
    /** The thumb's lit edge, never along its root inside the heel (re-lit, that hidden edge can face the light). */
    thumbRim: op(rimL(thumb, 1.7, M), rootZone, PathOp.Difference),
    index,
    behind,
    thumb,
    fingers,
    all,
    near,
    /** (poleLook 'boom') where this drawing paints the near pole: its silhouette inside the hand's outline. */
    nearClip: op(allGrown, near, PathOp.Intersect),
    /** The thumb and the index where the near pole does not hide them (their shadow falls on the pole). */
    ringOut: op(unionOf(thumb, index), near, PathOp.Difference),
    nearSides: tubeSides(0, a1),
    nearEnd: ellipsePath({ c: poleEndUnderAxisAt(a1), rx: sec.rx, ry: sec.ry, rot: sec.rot }),
    far: tube(a0, 0, POLE_R),
    farSides: tubeSides(a0, 0),
    /** (poleLook 'boom') the scene pole's rim, tube and lit band: straight stripes along the axis, cut only by the
     *  pole's own silhouette (`near`) and the hand's outline. */
    nearBoom: [op(band(-120, a1 + 40, 15.5), band(-120, a1 + 40, 13.5), PathOp.Difference), band(-120, a1 + 40, 13.5), band(-120, a1 + 40, 3, litOff)] as const,
    /** (poleLook 'boom') the pole's end toward the viewer (B10: the boom's butt), its round section at this slant in the
     *  scene's own paint (dark rim, the face a little lighter): a pole END facing us, never a slot in the hand. */
    nearEndBoom: [ellipsePath({ c: poleEndUnderAxisAt(a1), rx: 15.5 * Math.cos(POLE_END_UNDER_TILT), ry: 15.5, rot: AXIS_ANGLE }), ellipsePath({ c: poleEndUnderAxisAt(a1), rx: 13.5 * Math.cos(POLE_END_UNDER_TILT), ry: 13.5, rot: AXIS_ANGLE })] as const,
    allGrown,
    /** A ring round the pole's section: the fingers' inner side turning in toward the pole, in shade. */
    hug: ellipsePath({ c: sec.c, rx: sec.rx + 4.5, ry: sec.ry + 4.5, rot: sec.rot }),
    cuffOpening: ellipsePath(a.cuff),
    indexEdge: smoothOpen(a.indexEdge),
    behindEdges: a.behindEdges.map((e) => smoothOpen(e)),
    bodyEdge: smoothOpen(a.bodyEdge),
    bodyFrontEdge: smoothOpen(a.bodyFrontEdge),
    thumbEdge: smoothOpen(a.thumbEdge),
    thumbNail: smoothClosed(a.thumbNail),
    creases: many(a.creases.map(smoothOpen)),
    lights: relit(a.lights, M, 1).map(ellipsePath),
    darks: relit(a.darks, M, -1).map(ellipsePath),
    indexLights: many(relit(a.indexLights, M, 1).map(ellipsePath)),
    indexDarks: many(relit(a.indexDarks, M, -1).map(ellipsePath)),
    indexWarm: many(a.indexWarm.map(ellipsePath)),
    thumbLights: many(relit(a.thumbLights, M, 1).map(ellipsePath)),
    thumbDarks: many(relit(a.thumbDarks, M, -1).map(ellipsePath)),
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (the approved hands': one fixed span, every piece shares it — no seam). */
const FILL_C = P(2, 12);
function HandFill({ path, M }: { path: SkPath; M: LightMap }) {
  const { HAND } = useLook();
  const c = FILL_C;
  const Ld = mv(M, -0.36, -0.93);
  const R = 80;
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

function EndUnderPaint({ B, poleLook }: { B: Built; poleLook: 'study' | 'boom' }) {
  const { MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (the fingers behind, middle → little, each deeper in the shade of the one in front)
  const depthShade = [0.12, 0.22, 0.32];
  const front = [B.index, B.behind[0], B.behind[1]];
  return (
    <Group>
      {/* 0. THE FAR POLE (behind the whole fist: seen only past the little finger, top right) */}
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

      {/* 1. THE FINGERS BEHIND THE INDEX: little, ring, middle (far → near) */}
      {[2, 1, 0].map((i) => (
        <Group key={`f${i}`}>
          <HandFill path={B.behind[i]} M={M} />
          <Group clip={B.behind[i]}>
            <Path path={B.behind[i]} color={SKIN.deep} opacity={depthShade[i]} />
            <Path path={rimL(B.behind[i], 1.3, M)} color={SKIN.rim} opacity={0.24}>
              <Blur mm={0.7} />
            </Path>
            {/* the finger in front: its soft contact shadow on this one */}
            <Path path={front[i]} style="stroke" strokeWidth={4} color={SKIN.deep} opacity={0.46}>
              <Blur mm={1.6} />
            </Path>
          </Group>
          {/* (each farther finger's line fainter: one form receding, never a stack of outlined rings) */}
          <Path path={B.behindEdges[i]} style="stroke" strokeWidth={0.8} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={[0.44, 0.28, 0.2][i]} />
        </Group>
      ))}

      {/* 2. THE HAND'S BODY: the side of the hand under the pole, the heel, the wrist, the forearm */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        {/* the forearm turning away from the light toward the elbow */}
        <Path path={B.body}>
          <LinearGradient start={vec(-10, 70)} end={vec(-52, 124)} colors={['rgba(52,26,16,0)', 'rgba(52,26,16,0.22)']} />
        </Path>
        <Path path={rimL(B.body, 2, M)} color={SKIN.rim} opacity={0.24}>
          <Blur mm={1} />
        </Path>
      </Group>

      {/* 3. THE INDEX (the nearest finger): its soft shadow on the fingers behind (never on the hand it grows out of),
          then the finger — the same skin as the side of the hand: one fill, and the hand's lights and shades run on over
          the finger's base, so the finger flows out of the hand with no edge, step or seam */}
      <Group clip={unionOf(B.behind[0], B.behind[1], B.behind[2])}>
        <Group transform={off(M, 0.8, 1.4)}>
          <Path path={B.index} color="#1c0f09" opacity={0.32}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>
      <HandFill path={B.index} M={M} />
      <Group clip={B.bodyIndex}>
        {B.lights.map((l, i) => (
          <Path key={`l${i}`} path={l} color={SKIN.rim} opacity={i === 0 ? 0.26 : 0.16}>
            <Blur mm={3} />
          </Path>
        ))}
        {B.darks.map((l, i) => (
          <Path key={`d${i}`} path={l} color={SKIN.deep} opacity={i === 0 ? 0.3 : 0.24}>
            <Blur mm={3.2} />
          </Path>
        ))}
        {/* the skin turning in toward the pole all round its section: in shade */}
        <Path path={B.hug} style="stroke" strokeWidth={9} color={SKIN.deep} opacity={0.28}>
          <Blur mm={2.6} />
        </Path>
        {/* the thumb's soft shadow on the side of the hand (from where it is free of the heel) */}
        <Group transform={off(M, 0.8, 1.6)}>
          <Path path={B.thumbCast} color={SKIN.deep} opacity={0.26}>
            <Blur mm={2.2} />
          </Path>
        </Group>
      </Group>
      <Line B={B}>
        <Path path={B.bodyEdge} style="stroke" strokeWidth={0.9} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />
        <Path path={B.bodyFrontEdge} style="stroke" strokeWidth={0.9} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />
      </Line>
      <Group clip={B.index}>
        <Path path={B.indexLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.indexDarks} color={SKIN.deep} opacity={0.24}>
          <Blur mm={2} />
        </Path>
        <Path path={B.indexWarm} color={WARM} opacity={0.18}>
          <Blur mm={2.4} />
        </Path>
        <Path path={rimL(B.index, 1.7, M)} color={SKIN.rim} opacity={0.32}>
          <Blur mm={0.8} />
        </Path>
        <Path path={B.creases} style="stroke" strokeWidth={0.7} strokeCap="round" color={SKIN.deep} opacity={0.24}>
          <Blur mm={0.4} />
        </Path>
      </Group>
      <Path path={B.indexEdge} style="stroke" strokeWidth={0.85} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 4. THE THUMB (nearest of all): its soft shadow on the fingers and the hand, then the thumb */}
      <Group clip={B.fingers}>
        <Group transform={off(M, 1.1, 1.8)}>
          <Path path={B.thumbCast} color="#1c0f09" opacity={0.52}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>
      <HandFill path={B.thumb} M={M} />
      <Group clip={B.thumb}>
        {/* (the heel's own light carried on over the thumb's root: no seam where the thumb begins) */}
        <Path path={B.lights[0]} color={SKIN.rim} opacity={0.26}>
          <Blur mm={3} />
        </Path>
        <Path path={B.hug} style="stroke" strokeWidth={7} color={SKIN.deep} opacity={0.22}>
          <Blur mm={2.4} />
        </Path>
        <Path path={B.thumbLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.thumbDarks} color={SKIN.deep} opacity={0.28}>
          <Blur mm={1.8} />
        </Path>
        <Path path={B.thumbRim} color={SKIN.rim} opacity={0.3}>
          <Blur mm={0.8} />
        </Path>
        <Path path={B.creases} style="stroke" strokeWidth={0.7} strokeCap="round" color={SKIN.deep} opacity={0.24}>
          <Blur mm={0.4} />
        </Path>
        {/* the nail on the end segment's outer face, as the approved malletHandPalm's thumbnail: the skin at its fold
            turning away (sets the plate off), the plate in the nail tone, its soft edge, a lighter rim toward the light */}
        <Group transform={off(M, 0.9, 1.1)}>
          <Path path={B.thumbNail} style="stroke" strokeWidth={1.6} color={SKIN.deep} opacity={0.3}>
            <Blur mm={0.6} />
          </Path>
        </Group>
        <Path path={B.thumbNail} color={NAIL.fill} opacity={0.95}>
          <Blur mm={0.2} />
        </Path>
        <Path path={B.thumbNail} style="stroke" strokeWidth={0.5} color={NAIL.edge} opacity={0.55}>
          <Blur mm={0.2} />
        </Path>
        <Group clip={B.thumbNail}>
          <Group transform={off(M, 0.8, 1.0)}>
            <Path path={B.thumbNail} style="stroke" strokeWidth={1.2} color="#fff6ee" opacity={0.45}>
              <Blur mm={0.3} />
            </Path>
          </Group>
        </Group>
      </Group>
      <Path path={B.thumbEdge} style="stroke" strokeWidth={0.85} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 5. THE NEAR POLE (in front of the hand): its soft shadow on the hand, then the pole */}
      <Group clip={B.all}>
        <Group transform={off(M, 1.6, 3)}>
          <Path path={B.near} color={SKIN.deep} opacity={0.42}>
            <Blur mm={2.6} />
          </Path>
        </Group>
      </Group>
      {poleLook === 'boom' ? (
        // (the scene's own pole as BoomV2 paints it — dark rim, tube, lit band — as straight stripes on its axis, cut
        // only by the pole's own silhouette and by the hand's outline: the scene draws the pole whole under the hand)
        <Group>
          <Group clip={B.nearClip}>
            <Path path={B.nearBoom[0]} color={BOOM_RIM} />
            <Path path={B.nearBoom[1]} color={BOOM_TUBE} />
            <Path path={B.nearBoom[2]} color={BOOM_LIT} opacity={0.45} />
          </Group>
          {/* (the end lies wholly over the hand: drawn as it is) */}
          <Group>
            <Path path={B.nearEndBoom[0]} color={BOOM_RIM} />
            <Path path={B.nearEndBoom[1]} color="#4a4e57" />
            <Group transform={off(M, -0.8, -1.2)}>
              <Path path={B.nearEndBoom[1]} style="stroke" strokeWidth={1.2} color={BOOM_LIT} opacity={0.18}>
                <Blur mm={0.6} />
              </Path>
            </Group>
          </Group>
        </Group>
      ) : (
        <Group>
          <PoleShade path={B.near} M={M} />
          {/* (B10: the boom's butt, its dark end cap toward us) */}
          <Path path={B.nearEnd} color="#2b2e34" />
          <Path path={B.nearEnd} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.6} />
          <Path path={B.nearSides} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.7} />
        </Group>
      )}
      {/* the thumb's and the index's soft shadow on the pole where it comes out of the ring (the light from the upper
          left): the pole tucked in the hand */}
      <Group clip={poleLook === 'boom' ? B.nearClip : B.near}>
        <Group transform={off(M, 1.4, 2.4)}>
          <Path path={B.ringOut} color="#000" opacity={0.3}>
            <Blur mm={1.8} />
          </Path>
        </Group>
      </Group>

      {/* 6. THE SLEEVE: the cuff's near rim in front of the wrist */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(Lm.u < 0 ? -94 : -14, 90)} end={vec(Lm.u < 0 ? -14 : -94, 150)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

export type PoleHandEndUnderProps = {
  /** The cast member (absent: the look already given round it, inside a figure). */
  who?: CastMember;
  x: number;
  y: number;
  s: number;
  rot?: number;
  /** The pole from `pole[0]` (behind the fist, negative) to `pole[1]` (toward the viewer) mm along its axis. */
  pole?: [number, number];
  /** (option) the LEFT hand: the mirror image, re-lit so the light stays at the page's upper left. */
  mirror?: boolean;
  /** (option, default true) false: no sleeve of its own — the skin ends at the cuff's rim. */
  sleeve?: boolean;
  /** (option) 'boom': the near pole painted as the boom operator's scene pole, and only inside the hand's outline. */
  poleLook?: 'study' | 'boom';
  /** (option, default true) false: keep the scene's own figure scale (the hand drawn inside a figure). */
  ownScale?: boolean;
};

/** Where the art's own cuff rim is (drawing frame, mm): a figure's sleeve mouth goes here. */
export const POLE_HAND_END_UNDER_CUFF: Pt = POLE_HAND_END_UNDER.cuff.c;

/** The drawing's frame on the page: local (mm) → page. */
export function poleHandEndUnderToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandEndUnderProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
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
export function poleHandEndUnderAxisOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndUnderProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndUnderToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_UNDER_AXIS);
}

/** The forearm's direction on the page, fist → elbow (unit). */
export function poleHandEndUnderForeOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndUnderProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndUnderToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_UNDER_FORE);
}

/** The hand's whole outline on the page (fingers, thumb, body; without its sleeve where `sleeve` is false). */
export function poleHandEndUnderOutline(o: Pick<PoleHandEndUnderProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_END_UNDER, -1, 1, IDENTITY, o.sleeve ?? true);
  const p = B.all.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand supporting its pole from below, seen along the pole from the thumb / index end, for one cast member:
 * drawn at (x, y) (pt — the pole's axis where it enters the fist on the index side), `s` pt per mm, turned `rot`
 * radians. With `mirror`, the left hand (seen from ITS thumb end), re-lit — B10's overhead left hand.
 */
export function PoleHandEndUnder({ who, x, y, s, rot = 0, pole = [-600, POLE_END_UNDER_NEAR], mirror = false, sleeve = true, poleLook = 'study', ownScale = true }: PoleHandEndUnderProps) {
  const B = useMemo(() => build(POLE_HAND_END_UNDER, pole[0], pole[1], mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY, sleeve), [pole[0], pole[1], rot, mirror, sleeve]);
  const paint = <EndUnderPaint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
