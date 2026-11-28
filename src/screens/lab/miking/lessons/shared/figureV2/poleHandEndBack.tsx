/**
 * FIGURE V2 — A RIGHT HAND GRIPPING A 30 mm POLE, SEEN ALONG THE POLE FROM THE THUMB / INDEX END, THE CAMERA TILTED
 * TOWARD THE BACK OF THE HAND (owner 2026-11-24, "one hand at a time": hand number five). The same fist as the approved
 * end-on hand (poleHandEnd.tsx) — same paint, tones, cuff, light from the upper left — but seen from the other side of
 * the pole's line: poleHandEnd looks a little INTO the palm side of the curl; this one looks a little onto the BACK of
 * the hand.
 *
 * WHY (the boom operator's side view, BoomV2 poleSideArm): on "B04 close" (far right hand), "B04 held low" (right hand)
 * and "F09" (right hand) the camera is at the fist's thumb end (31–36° off the pole) but tilted toward the back of the
 * hand, and poleHandEnd placed there has its forearm 169°, 177° and 170° off the real arm. poleHandEnd's forearm leaves
 * the fist 45° CLOCKWISE (on the page) from the pole's near part; the real arms there leave 214–236° clockwise from it —
 * so this drawing's forearm leaves the fist 135° COUNTER-CLOCKWISE from the pole's near part (END_BACK_FORE_FROM_NEAR:
 * the near axis turned −135° on the page, y down): exactly opposite poleHandEnd's, i.e. 45° from the pole's FAR part.
 * On those three rigs it should come within 3–11° of the real forearm (the fit allows 40°). That is also what a 3-D
 * fist gives for a camera 25° off the pole tilted half toward the back of the hand and half toward the wrist (132°).
 *
 * AUTHORED 2-D ART, as the approved hands: hand-placed points (mm) drawn as smooth closed cubic curves, the same skin
 * light (cast.ts tones through useLook), the same thin soft outline, soft form lights and shadows, very few lines, the
 * light from the page's upper left. No 3-D model, no projected skeleton.
 *
 * THE VIEW, IN WORDS (written before any point was placed):
 * We stand off the index-finger end of the fist, a little above the back of the hand and a little toward the wrist, and
 * look nearly along the pole (25° off). The pole is a short, strongly foreshortened cylinder (0.42 mm on the page per mm
 * along it): its round section sits inside the fist, ringed by skin all round — the index above and to the left, the
 * thumb below, the web of the hand to the right; the NEAR part comes toward us out of that ring to the LEFT and DOWN, in
 * FRONT of the fist, hiding the lower-left of the index's curl (its middle segment and last joint) and the very end of
 * the thumb; the FAR part goes away to the upper right, hidden inside the hand, and shows again only past the
 * little-finger side, coming out from behind the top edge of the back of the hand. The forearm leaves to the right.
 *   1. Nearest of the fingers, the INDEX, seen from its thumb side and a little from its back: one curled finger round
 *      the pole as a "C" — its big knuckle the soft high swell at the top, the first segment's back sloping down to the
 *      left (seen a little from above: a lit band along its top), the middle joint's rounded bend (the fist's front,
 *      left), the middle segment going down and in until it passes behind the near pole's upper edge; under the pole
 *      only the tip, tucked against the thumb. Its inner side presses on the pole's section all round.
 *   2. Behind the index (each farther along the pole, so each a little to the UPPER RIGHT of the one in front), the
 *      MIDDLE, RING and LITTLE fingers: only the backs of their first segments show, as narrow bands stepping up above
 *      the index's back, each narrower and fading into the one in front before the middle joint; their big knuckles a
 *      receding row climbing to the upper right — the index's the biggest, the middle's standing highest above its
 *      neighbour, the ring's and the little's smaller and smaller. One form layered in depth: never a row of equal bumps,
 *      never a second row of knuckles (the bends of the fingers behind are hidden behind the index's bend).
 *   3. The BACK OF THE HAND: a foreshortened plane from that knuckle row to the wrist — its top edge (the little-finger
 *      side) running right to the wrist and the forearm, its lower edge (the index side) turning softly down into the
 *      side of the hand; below it the side of the hand (the web's muscle), the web round the pole's right side, the
 *      thumb's mound and the heel of the hand rounding into the wrist at the bottom; the wrist narrower than the hand,
 *      going into the sleeve (seen from outside: the cuff's rim convex toward the hand).
 *   4. The THUMB, on the thumb end of the fist (nearest us with the index): out of its mound low on the right, round
 *      under the pole as the fist's lower edge, its pad pressed up on the index's tip; its end segment (the nail just in
 *      view on its outer side) goes in under the near pole's lower edge — the pole lying between the index and the
 *      thumb. One thick, tapering form with its root inside the mound: no flap, no pointing finger.
 * Paint order (far → near): the far pole → the little, ring and middle fingers → the hand's body (back of the hand, side,
 * web, mound, heel, wrist, forearm) → the index → the thumb → the near pole (in front, its soft shadow on the hand) →
 * the sleeve.
 *
 * Frame: authored in a HAND frame (mm; origin on the pole's axis where it enters the fist on the index side; +x toward
 * the forearm; −y the back of the hand) and turned once, by END_BACK_TURN (15°), into the drawing's own page-oriented
 * frame (+x right, +y DOWN), so the forearm leaves gently to the lower right. Every exported point is in that frame.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, rimOf, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';
import { lightMapOf, type LightMap } from './poleHandFront';

/* ── the art (pure: the tests read these points) ── */

/** The turn from the hand frame (forearm along +x) to the drawing's frame: the forearm leaves gently to the lower right. */
export const END_BACK_TURN = (15 * Math.PI) / 180;
const CT = Math.cos(END_BACK_TURN);
const ST = Math.sin(END_BACK_TURN);
const turn = (x: number, y: number): Pt => P(x * CT - y * ST, x * ST + y * CT);
const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => turn(x, y));
/** A soft light or shade authored in the hand frame (its centre and its turn carried into the drawing's frame). */
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: turn(x, y), rx, ry, rot: rot + END_BACK_TURN });

/** The pole's radius (Ø 30 mm). */
export const POLE_R = 15;
/** How far the pole is off the line of sight (rad): about 25° (as poleHandEnd). */
export const POLE_END_BACK_TILT = (25 * Math.PI) / 180;
/** Page millimetres per millimetre along the pole (the foreshortening): sin 25° ≈ 0.42. */
export const POLE_END_BACK_FORESHORTEN = Math.sin(POLE_END_BACK_TILT);
/** (rad, page, y down) the forearm's direction (fist → elbow) minus the pole's near direction: −135° — the forearm
 *  135° counter-clockwise on the page from the pole's near part (poleHandEnd: +45°, clockwise). */
export const END_BACK_FORE_FROM_NEAR = (-135 * Math.PI) / 180;
/** The pole's axis on the page, the direction TOWARD the viewer (unit, drawing frame): to the left and down. */
const AXIS_ANGLE = END_BACK_TURN - END_BACK_FORE_FROM_NEAR;
export const POLE_END_BACK_AXIS: Pt = P(Math.cos(AXIS_ANGLE), Math.sin(AXIS_ANGLE));
/** The forearm's direction on the page, fist → elbow (unit, drawing frame). */
export const POLE_END_BACK_FORE: Pt = P(CT, ST);
/** Across the pole on the page (unit, the axis turned a quarter clockwise). */
const ACROSS: Pt = P(-POLE_END_BACK_AXIS.v, POLE_END_BACK_AXIS.u);
/** The pole's round section where it enters the fist (an ellipse: narrower along the pole, cos 25°). */
export const POLE_END_BACK_SECTION: Ellipse = { c: P(0, 0), rx: POLE_R * Math.cos(POLE_END_BACK_TILT), ry: POLE_R, rot: AXIS_ANGLE };
/** The point on the pole's axis `a` mm along it from the index side of the fist (+ toward the viewer). */
export function poleEndBackAxisAt(a: number): Pt {
  return P(POLE_END_BACK_AXIS.u * POLE_END_BACK_FORESHORTEN * a, POLE_END_BACK_AXIS.v * POLE_END_BACK_FORESHORTEN * a);
}
/** The grip's centre: the middle of the fist along the pole (≈ 40 mm in from the index side). */
export const POLE_END_BACK_GRIP: Pt = poleEndBackAxisAt(-40);

/**
 * THE INDEX — the nearest finger, its thumb side toward us and its back a little: one "C" round the pole's section.
 * Hand frame.
 */
const INDEX_H: readonly (readonly [number, number])[] = [
  // the base, closing at the knuckle into the side of the hand (no edge drawn there)
  [15.2, -34],
  // where it rises out of the back of the hand; the big knuckle: the soft high swell
  [16.2, -41.2], [12.4, -44.4], [6.6, -46.2], [0.4, -45.6],
  // the first segment's back, sloping down to the left
  [-6.4, -43.2], [-13.6, -39.4], [-20.6, -34.8], [-26.6, -30.2],
  // the middle joint's bend: a rounded corner (the fist's front)
  [-31.4, -26], [-35, -21.2], [-37.4, -15.6], [-38.4, -9.8],
  // the middle segment, down and in (it passes behind the near pole's upper edge)
  [-38.4, -3.6], [-37.2, 2.6], [-35, 8.4],
  // the last joint and segment (behind the pole)
  [-28.2, 15], [-23.8, 18.4], [-18.4, 21.4], [-12.6, 23.6], [-6.6, 25],
  // the tip, tucked against the thumb
  [-1.4, 24.8], [1.6, 22.6], [2, 19.6], [0.4, 16.8],
  // the inner side, the pads pressed on the pole's section all round
  [-4.9, 14.1], [-9.9, 10.4], [-13.4, 5.2], [-15.2, -0.6],
  // (the middle joint's crease: the finger leaves the pole a little)
  [-16.6, -5.4],
  [-13.4, -9.6], [-9.2, -13.4], [-4, -15.4], [1.4, -15.6],
  // into the web over the side of the hand
  [6.4, -17.4], [11.6, -23.4],
];
const INDEX = pts(INDEX_H);
/** The index's drawn edge: from its knuckle, round the C and the tip, and the inner side up to the web. */
const INDEX_EDGE = INDEX.slice(2, 34);

/**
 * THE FINGERS BEHIND — middle, ring, little: each farther along the pole, so seen a little to the upper right of the one
 * in front; only the back of the first segment and the knuckle show, as a band stepping up above the finger in front.
 * Each closes well inside the finger in front and the back of the hand (hidden).
 */
const MIDDLE = pts([
  [20.4, -50.4], [17.4, -55.6], [12.6, -57.6], [6.4, -56.8], [-0.4, -53.4], [-7.6, -48.8], [-15.4, -43.4], [-22.2, -37.8],
  [-28.4, -31.6], [-33.2, -25.4], [-36.6, -19], [-38.2, -12.4],
  // (tucked behind the index's bend) and the hidden inside
  [-34, -10], [-24, -22], [-8, -36], [8, -42], [18, -44],
]);
const RING = pts([
  [26.4, -55], [23, -60.4], [18.6, -61.6], [12.4, -61], [5.6, -58.8], [-1.6, -55.2], [-8.6, -50.4], [-15, -45], [-20.4, -39.6],
  [-14, -40], [0, -48], [12, -52], [22, -52],
]);
const LITTLE = pts([
  [31, -57.4], [27.4, -62.6], [23.8, -63.6], [18, -63.2], [11.4, -61.6], [5, -59], [-1, -55.4],
  [6, -55], [16, -56.4], [26, -56.6],
]);
/** Their drawn (outer) edges. */
const MIDDLE_EDGE = MIDDLE.slice(1, 12);
const RING_EDGE = RING.slice(1, 9);
const LITTLE_EDGE = LITTLE.slice(1, 7);

/**
 * THE HAND'S BODY — the back of the hand from the knuckle row to the wrist (its top edge the little-finger side), the
 * forearm into the cuff, the forearm's lower edge, the heel of the hand and the thumb's mound rounding into the thumb;
 * the side of the hand and the web round the pole's right side; its left side runs hidden under the index and the pole.
 */
const BODY = pts([
  // (hidden under the index)
  [-4, -38], [4, -43.6],
  // the knuckle row's lower side, stepping up to the right just under the fingers' knuckles
  [9.4, -47.6], [13.6, -53.2], [16.4, -56.2], [20, -58.6], [23.4, -60.6], [27, -61.6],
  // the back of the hand's top edge (the little-finger side), descending gently to the wrist (a little dip there)
  [31, -60.8], [38, -60.2], [48, -58.8], [60, -56.4], [70, -53.8], [79, -52],
  // the forearm's top edge, into the cuff (and on under the sleeve)
  [89, -52.6], [102, -53.4], [128, -54.8],
  [128, 12.4],
  // the forearm's lower edge, the wrist (narrower than the hand)
  [106, 11], [92, 10], [80, 9.4], [72, 11],
  // the heel of the hand rounding out of the wrist, the thumb's mound (thenar) — into the thumb
  [64, 15.4], [56, 20], [48, 24.6], [40, 28], [32, 30],
  // (hidden under the thumb and the pole)
  [22, 30], [8, 26], [0, 18], [-2, 6], [0, -12], [-2, -26],
]);

/**
 * THE THUMB — out of its mound low on the right, round under the pole as the fist's lower edge, its pad pressed up on
 * the index's tip, its end going in under the near pole's lower edge. Its root closes inside the mound.
 */
const THUMB = pts([
  // the root, inside the mound
  [50, 14], [42, 8.6], [32, 8.4],
  // the inner (upper) side: under the web, the base joint, the first segment, the pad on the index's tip
  [24, 10.8], [17, 14.6], [11, 18.4], [5, 21.4], [-1, 23.2], [-7, 24.2],
  // the end (in under the pole's lower edge), rounded
  [-13, 25], [-16.6, 28], [-16.4, 32.2], [-12.6, 35.2],
  // the back (nail side): the end segment, the joint's soft bend, the first segment, the base joint — one gentle line
  [-6.6, 36.8], [0, 37.8], [7, 38.6], [14, 39], [21, 38.4], [28, 36.2],
  // into the mound (meeting the heel's edge)
  [35, 32.2], [41.6, 27.4], [47, 23.6], [50.4, 19],
]);
/** The thumb's drawn edge: its free side from the first segment round the end and along the back to where it meets the
 *  heel's edge (no line where it grows out of the mound). */
const THUMB_EDGE = THUMB.slice(4, 21);

/** A quiet nail: a rounded oblong `len` along `rot`, `w` across (hand frame, turned with the art). */
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
    out.push(turn(x + a * c - b * s, y + a * s + b * c));
  }
  return out;
}

/** An ellipse as points (hand frame, turned). */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 16): Poly {
  const out: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = from + ((to - from) * j) / n;
    out.push(turn(cx + rx * Math.cos(t), cy + ry * Math.sin(t)));
  }
  return out;
}

/** The cuff (hand frame): the rim a narrow ellipse; the forearm comes a little toward us, so the sleeve is seen from
 *  outside and its edge is the rim's half toward the hand (convex toward it); the wrist goes in under it. */
const CUFF_H = P(100, -21);
const CUFF_RX = 7;
const CUFF_RY = 36;
const SLEEVE: Poly = [...arc(CUFF_H.u, CUFF_H.v, CUFF_RX, CUFF_RY, Math.PI / 2, (3 * Math.PI) / 2), turn(150, -60.4), turn(150, 17.4)];

export type PoleHandEndBackArt = {
  index: Poly;
  indexEdge: Poly;
  middle: Poly;
  ring: Poly;
  little: Poly;
  behindEdges: [Poly, Poly, Poly];
  body: Poly;
  /** The body's drawn edge: its silhouette only (the knuckle row against the fingers is one skin: no line). */
  bodyEdge: Poly;
  thumb: Poly;
  thumbEdge: Poly;
  thumbNail: Poly;
  sleeve: Poly;
  /** The cuff's rim (an ellipse in the drawing's frame). */
  cuff: Ellipse;
  /** The index's big knuckle and the four knuckle tops (index → little), and the thumb's end. */
  knuckle: Pt;
  knuckles: [Pt, Pt, Pt, Pt];
  thumbTip: Pt;
  lights: Ellipse[];
  darks: Ellipse[];
  knuckleLights: Ellipse[];
  indexLights: Ellipse[];
  indexDarks: Ellipse[];
  indexWarm: Ellipse[];
  thumbLights: Ellipse[];
  thumbDarks: Ellipse[];
  creases: Poly[];
};

export const POLE_HAND_END_BACK: PoleHandEndBackArt = {
  index: INDEX,
  indexEdge: INDEX_EDGE,
  middle: MIDDLE,
  ring: RING,
  little: LITTLE,
  behindEdges: [MIDDLE_EDGE, RING_EDGE, LITTLE_EDGE],
  body: BODY,
  bodyEdge: BODY.slice(7, 27),
  thumb: THUMB,
  thumbEdge: THUMB_EDGE,
  thumbNail: nail(-8.4, 33.4, 8, 4, 0.14),
  sleeve: SLEEVE,
  cuff: { c: turn(CUFF_H.u, CUFF_H.v), rx: CUFF_RX, ry: CUFF_RY, rot: END_BACK_TURN },
  knuckle: turn(6.6, -46.2),
  knuckles: [turn(6.6, -46.2), turn(12.6, -57.6), turn(18.6, -61.6), turn(23.8, -63.6)],
  thumbTip: turn(-16.6, 28),
  lights: [
    // the back of the hand: a long soft light along its top (toward the light)
    E(42, -54.4, 24, 3.6, 0.05),
    // the side of the hand under it (the web's muscle), lit toward the index's knuckle
    E(26, -33, 12, 6, -0.12),
    // the thumb's mound: lit on its upper side, along the thumb's base
    E(40, 17, 12, 5, -0.45),
    // the wrist's upper side
    E(76, -44, 8, 4),
  ],
  darks: [
    // the back of the hand turning down into the side of the hand (the index's side), soft
    E(44, -42.6, 28, 2.6, 0.1),
    // the groove between the mound and the side of the hand, running toward the wrist
    E(50, 3, 15, 3, -0.35),
    // the heel turning under into the wrist; the wrist's lower side
    E(58, 22, 12, 3.4, -0.6), E(86, 6, 12, 4),
    // the web going in by the pole, under the index's base
    E(16, -6, 4.6, 7, 0.2),
    // the wrist going into the cuff
    E(94, -21, 3.6, 26),
    // the soft valleys behind the knuckles, between the fingers' heads (index | middle | ring | little)
    E(12.4, -49.4, 2.4, 1.4, -0.9), E(18, -56.4, 2, 1.2, -0.9), E(23.4, -59.8, 1.6, 1, -0.9),
  ],
  knuckleLights: [E(5.4, -43.4, 6.6, 2.6, -0.1), E(11.6, -54.4, 4.6, 1.8, -0.3), E(18, -58.8, 3.6, 1.4, -0.25), E(23.4, -61, 3, 1.2, -0.2)],
  indexLights: [
    // the first segment's back, toward the light (seen a little from above)
    E(-17, -36.6, 9, 2.8, -0.58),
    // the middle joint's bend
    E(-33.6, -15, 4.4, 8, 0.38),
    // the middle segment's side
    E(-30.4, 2, 4, 6, 0.3),
  ],
  indexDarks: [
    // the middle joint's crease on the finger's side
    E(-21, -7, 4.4, 2.6, 0.5),
    // the side of the first segment turning in under its back
    E(-12, -30, 9, 2.4, -0.58),
  ],
  indexWarm: [E(-34, -13, 5, 7, 0.4), E(3, -43, 6, 2.6)],
  thumbLights: [
    // the base joint's soft swell; the first segment's side
    E(20, 25, 7.4, 3.4, -0.35), E(2, 29, 8, 2.8, 0.06),
  ],
  thumbDarks: [
    // the back turning away under; the pad pressed on the index's tip
    E(8, 37.2, 16, 2, 0.03), E(-2, 25.2, 7, 1.8, -0.15),
  ],
  creases: [
    // the index's middle-joint skin fold on its side: short, soft
    pts([[-17.6, -6.4], [-22, -9], [-26.8, -11]]),
    // the thumb's joint, a hint on its side
    pts([[4.4, 22.4], [5.4, 26.4]]),
  ],
};

/* ── the paint ── */

const WARM = '#b8665a';
const POLE_STOPS = ['#25282d', '#5d636c', '#b0b6bf', '#7b818a', '#555a62', '#3b3f46', '#222428'];
const POLE_POS = [0, 0.1, 0.22, 0.38, 0.62, 0.86, 1];

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

/** The pole from `a0` to `a1` mm along its axis (+ toward the viewer), half-width `h`: a band with round ends. */
function tube(a0: number, a1: number, h: number): SkPath {
  const c0 = poleEndBackAxisAt(a0);
  const c1 = poleEndBackAxisAt(a1);
  const n = ACROSS;
  const band = polyPath([P(c0.u + n.u * h, c0.v + n.v * h), P(c1.u + n.u * h, c1.v + n.v * h), P(c1.u - n.u * h, c1.v - n.v * h), P(c0.u - n.u * h, c0.v - n.v * h)]);
  const end = (c: Pt) => ellipsePath({ c, rx: h * Math.cos(POLE_END_BACK_TILT), ry: h, rot: AXIS_ANGLE });
  return unionOf(band, end(c0), end(c1));
}
/** The pole's two side lines from `a0` to `a1`. */
function tubeSides(a0: number, a1: number): SkPath {
  const c0 = poleEndBackAxisAt(a0);
  const c1 = poleEndBackAxisAt(a1);
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

function build(a: PoleHandEndBackArt, a0: number, a1: number, M: LightMap, sleeveOn: boolean) {
  const sleeve = smoothClosed(a.sleeve, 0.2);
  const body0 = smoothClosed(a.body);
  const body = sleeveOn ? body0 : op(body0, sleeve, PathOp.Difference);
  const index = smoothClosed(a.index, 0.5);
  const middle = smoothClosed(a.middle, 0.5);
  const ring = smoothClosed(a.ring, 0.5);
  const little = smoothClosed(a.little, 0.5);
  const thumb = smoothClosed(a.thumb, 0.5);
  const behind = [middle, ring, little];
  const fingers = unionOf(index, middle, ring, little);
  const all = unionOf(body, fingers, thumb);
  const sec = POLE_END_BACK_SECTION;
  return {
    M,
    sleeveOn,
    sleeve,
    body,
    index,
    middle,
    ring,
    little,
    behind,
    thumb,
    fingers,
    all,
    near: tube(0, a1, POLE_R),
    nearSides: tubeSides(0, a1),
    nearEnd: ellipsePath({ c: poleEndBackAxisAt(a1), rx: sec.rx, ry: sec.ry, rot: sec.rot }),
    far: tube(a0, 0, POLE_R),
    farSides: tubeSides(a0, 0),
    /** (poleLook 'boom') the scene pole's rim, tube and lit band over the near stretch. */
    nearBoom: [tube(0, a1, 15.5), tube(0, a1, 13.5), tube(0, a1, 3)] as const,
    /** A ring round the pole's section: the fingers' inner side turning in toward the pole, in shade. */
    hug: ellipsePath({ c: sec.c, rx: sec.rx + 4.5, ry: sec.ry + 4.5, rot: sec.rot }),
    indexEdge: smoothOpen(a.indexEdge),
    bodyEdge: smoothOpen(a.bodyEdge),
    behindEdges: a.behindEdges.map((e) => smoothOpen(e)),
    thumbEdge: smoothOpen(a.thumbEdge),
    thumbNail: smoothClosed(a.thumbNail),
    creases: many(a.creases.map(smoothOpen)),
    lights: relit(a.lights, M, 1).map(ellipsePath),
    darks: relit(a.darks, M, -1).map(ellipsePath),
    knuckleLights: many(relit(a.knuckleLights, M, 1).map(ellipsePath)),
    indexLights: many(relit(a.indexLights, M, 1).map(ellipsePath)),
    indexDarks: many(relit(a.indexDarks, M, -1).map(ellipsePath)),
    indexWarm: many(a.indexWarm.map(ellipsePath)),
    thumbLights: many(relit(a.thumbLights, M, 1).map(ellipsePath)),
    thumbDarks: many(relit(a.thumbDarks, M, -1).map(ellipsePath)),
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (the approved hands': one fixed span, every piece shares it — no seam). */
function HandFill({ path, M }: { path: SkPath; M: LightMap }) {
  const { HAND } = useLook();
  const c = { u: 22, v: -12 };
  const Ld = mv(M, -0.36, -0.93);
  const R = 72;
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

function EndBackPaint({ B, poleLook }: { B: Built; poleLook: 'study' | 'boom' }) {
  const { MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (the fingers behind each a little deeper in the shade of the one in front: their backs face the light, so lightly)
  const depthShade = [0.08, 0.14, 0.2];
  const front = [B.index, B.middle, B.ring];
  return (
    <Group>
      {/* 0. THE FAR POLE (behind the whole fist: seen only past the little-finger side, above the back of the hand) */}
      {poleLook === 'study' ? (
        <Group>
          <PoleShade path={B.far} M={M} />
          <Path path={B.far} color="#000" opacity={0.18} />
          <Path path={B.farSides} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.7} />
        </Group>
      ) : null}

      {/* 1. THE FINGERS BEHIND THE INDEX: little, ring, middle (far → near) */}
      {[2, 1, 0].map((i) => (
        <Group key={`f${i}`}>
          <HandFill path={B.behind[i]} M={M} />
          <Group clip={B.behind[i]}>
            <Path path={B.behind[i]} color={SKIN.deep} opacity={depthShade[i]} />
            <Path path={rimL(B.behind[i], 1.3, M)} color={SKIN.rim} opacity={0.26}>
              <Blur mm={0.7} />
            </Path>
            {/* the finger in front: its soft contact shadow on this one */}
            <Path path={front[i]} style="stroke" strokeWidth={3.4} color={SKIN.deep} opacity={0.42}>
              <Blur mm={1.4} />
            </Path>
          </Group>
          <Path path={B.behindEdges[i]} style="stroke" strokeWidth={0.8} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.42} />
        </Group>
      ))}

      {/* 2. THE HAND'S BODY: the back of the hand, the side, the web, the mound, the heel, the wrist */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        {/* the forearm turning away from the light toward the elbow */}
        <Path path={B.body}>
          <LinearGradient start={vec(60, -10)} end={vec(130, 30)} colors={['rgba(52,26,16,0)', 'rgba(52,26,16,0.22)']} />
        </Path>
        {B.lights.map((l, i) => (
          <Path key={`l${i}`} path={l} color={SKIN.rim} opacity={i === 0 ? 0.24 : 0.16}>
            <Blur mm={3} />
          </Path>
        ))}
        {B.darks.map((l, i) => (
          <Path key={`d${i}`} path={l} color={SKIN.deep} opacity={0.24}>
            <Blur mm={3.2} />
          </Path>
        ))}
        {/* the thumb's soft shadow on its own mound and the heel */}
        <Group transform={off(M, 0.8, 1.6)}>
          <Path path={B.thumb} color={SKIN.deep} opacity={0.14}>
            <Blur mm={2.6} />
          </Path>
        </Group>
        <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.24}>
          <Blur mm={1.6} />
        </Path>
        <Path path={rimL(B.body, 2, M)} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>
      <Path path={B.bodyEdge} style="stroke" strokeWidth={0.9} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 3. THE INDEX (the nearest finger) */}
      <HandFill path={B.index} M={M} />
      <Group clip={B.index}>
        {/* (the side of the hand's own light and shade carried on over the knuckle: no seam where the finger begins) */}
        <Path path={B.lights[1]} color={SKIN.rim} opacity={0.16}>
          <Blur mm={3} />
        </Path>
        <Path path={B.darks[0]} color={SKIN.deep} opacity={0.24}>
          <Blur mm={3.2} />
        </Path>
        {/* the side of the finger turning in toward the pole: in shade along its inner side */}
        <Path path={B.hug} style="stroke" strokeWidth={9} color={SKIN.deep} opacity={0.3}>
          <Blur mm={2.6} />
        </Path>
        <Path path={B.indexLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.indexDarks} color={SKIN.deep} opacity={0.22}>
          <Blur mm={2} />
        </Path>
        <Path path={B.indexWarm} color={WARM} opacity={0.18}>
          <Blur mm={2.4} />
        </Path>
        <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1.6} />
        </Path>
        <Path path={rimL(B.index, 1.7, M)} color={SKIN.rim} opacity={0.32}>
          <Blur mm={0.8} />
        </Path>
        <Path path={B.creases} style="stroke" strokeWidth={0.7} strokeCap="round" color={SKIN.deep} opacity={0.24}>
          <Blur mm={0.4} />
        </Path>
      </Group>
      <Path path={B.indexEdge} style="stroke" strokeWidth={0.85} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 4. THE THUMB: its soft shadow on the index, then the thumb */}
      <Group clip={B.fingers}>
        <Group transform={off(M, 0.8, 1.4)}>
          <Path path={B.thumb} color="#1c0f09" opacity={0.4}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>
      <HandFill path={B.thumb} M={M} />
      <Group clip={B.thumb}>
        <Path path={B.lights[2]} color={SKIN.rim} opacity={0.26}>
          <Blur mm={3} />
        </Path>
        <Path path={B.thumbLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.thumbDarks} color={SKIN.deep} opacity={0.3}>
          <Blur mm={1.8} />
        </Path>
        <Path path={rimL(B.thumb, 1.7, M)} color={SKIN.rim} opacity={0.3}>
          <Blur mm={0.8} />
        </Path>
        <Path path={B.thumbNail} color={NAIL.fill} opacity={0.32}>
          <Blur mm={0.45} />
        </Path>
        <Group transform={off(M, -0.5, -0.7)}>
          <Path path={B.thumbNail} color="#fff4ec" opacity={0.08}>
            <Blur mm={0.9} />
          </Path>
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
        // (the scene's own pole as BoomV2 paints it — dark rim, tube, lit band — only inside the hand's outline: the
        // scene draws the pole whole under the hand)
        <Group clip={B.all}>
          <Path path={B.nearBoom[0]} color="#0b0c0f" />
          <Path path={B.nearBoom[1]} color="#3a3d45" />
          <Group transform={off(M, -1, -1.6)}>
            <Path path={B.nearBoom[2]} color="#d4d8e0" opacity={0.45} />
          </Group>
        </Group>
      ) : (
        <Group>
          <PoleShade path={B.near} M={M} />
          <Path path={B.nearEnd} color="#4b5058" />
          <Path path={B.nearEnd} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.6} />
          <Path path={B.nearSides} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.7} />
        </Group>
      )}

      {/* 6. THE SLEEVE: seen from outside, its rim over the wrist */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(Lm.u < 0 ? 85 : 150, -30)} end={vec(Lm.u < 0 ? 150 : 85, 40)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

export type PoleHandEndBackProps = {
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
export const POLE_HAND_END_BACK_CUFF: Pt = POLE_HAND_END_BACK.cuff.c;

/** The drawing's frame on the page: local (mm) → page. */
export function poleHandEndBackToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandEndBackProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
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
export function poleHandEndBackAxisOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndBackProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndBackToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_BACK_AXIS);
}

/** The forearm's direction on the page, fist → elbow (unit). */
export function poleHandEndBackForeOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndBackProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndBackToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_BACK_FORE);
}

/** The hand's whole outline on the page (fingers, thumb, body; without its sleeve where `sleeve` is false). */
export function poleHandEndBackOutline(o: Pick<PoleHandEndBackProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_END_BACK, -1, 1, IDENTITY, o.sleeve ?? true);
  const p = B.all.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand on its pole seen along the pole from the index end, the camera tilted toward the back of the hand, for
 * one cast member: drawn at (x, y) (pt — the pole's axis where it enters the fist on the index side), `s` pt per mm,
 * turned `rot` radians. With `mirror`, the left hand (seen from ITS index end), re-lit.
 */
export function PoleHandEndBack({ who, x, y, s, rot = 0, pole = [-600, 420], mirror = false, sleeve = true, poleLook = 'study', ownScale = true }: PoleHandEndBackProps) {
  const B = useMemo(() => build(POLE_HAND_END_BACK, pole[0], pole[1], mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY, sleeve), [pole[0], pole[1], rot, mirror, sleeve]);
  const paint = <EndBackPaint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
