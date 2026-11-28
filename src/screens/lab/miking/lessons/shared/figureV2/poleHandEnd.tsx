/**
 * FIGURE V2 — A RIGHT HAND GRIPPING A 30 mm POLE, SEEN ALONG THE POLE FROM THE THUMB / INDEX END (owner 2026-11-24,
 * "one hand at a time": hand number four). The boom operator's fist in the side views where the pole points mostly
 * toward or away from the camera, so the camera sees the fist nearly END-ON — a view neither flat drawing
 * (poleHandFront / poleHandBack) can show.
 *
 * AUTHORED 2-D ART, as the approved hands: hand-placed points (mm) drawn as smooth closed cubic curves, the same skin
 * light (cast.ts tones through useLook), the same thin soft outline, soft form lights and shadows, very few lines, the
 * light from the page's upper left. No 3-D model, no projected skeleton.
 *
 * THE VIEW, IN WORDS (written before any point was placed):
 * We stand off the index-finger end of the fist and look nearly along the pole; the pole's near part comes toward us
 * about 25° off our line of sight, so it is a short, strongly foreshortened cylinder: its round section (an ellipse a
 * little narrower along the pole, cos 25°) sits inside the fist, the near part runs on toward us up and to the right
 * IN FRONT of the hand, the far part goes away behind the fist down and to the left and shows again only beyond the
 * little finger. The forearm leaves the fist to the lower right (square to the pole in space; it only recedes a little).
 *   1. Nearest of the fingers, the INDEX, seen from its thumb side: one curled finger round the pole's section as a
 *      "C" — from its big knuckle at the top (the only knuckle seen: one soft swell on the fist's top edge), the first
 *      segment's back sloping down to the left, the middle joint's rounded bend (the fist's front), the middle segment
 *      down and in, the last joint's softer bend, the last segment back under the pole, its tip tucked at the bottom
 *      against the thumb. Its inner side presses on the pole all round (a little gap only in the middle joint's crease).
 *   2. Behind the index, the MIDDLE, RING and LITTLE fingers: the same curl, each farther along the pole, so each is
 *      seen a little lower-left of the one in front and mostly hidden by it: nested crescents along the C's outer edge
 *      — the middle's the widest band (it is the longest finger), the ring's narrower, the little's a sliver; each
 *      deeper in shade. Never a row of equal bumps: one form, layered in depth.
 *   3. The THUMB, nearer than the fingers (the thumb side faces us): out of its mound low on the right, round under the
 *      pole, lying ACROSS the index's last segment with its pad pressed down on it, its tip at the index's last joint;
 *      its back (nail side) is the fist's lower edge, the nail partly seen just inside that edge near the tip. One
 *      thick, tapering form with its root inside the mound: no flap, no pointing finger.
 *   4. The pole INSIDE the ring of index (left, top, bottom) and thumb (bottom right); between them on the right the web
 *      of the hand, which the near part of the pole hides as it comes toward us.
 *   5. Behind / right of the pole the side of the hand (thumb side): the back of the hand edge-on as the fist's top
 *      edge running back to the wrist, the thumb's mound (thenar) and the heel of the hand rounding into the wrist at
 *      the bottom; the wrist (narrower than the hand) into the cuff; the cuff's near rim a narrow ellipse (the forearm
 *      recedes a little), the wrist going in behind it.
 * Paint order (far → near): the far pole → the cuff's dark opening → the little, ring and middle fingers → the hand's
 * body (side of the hand, mound, heel, wrist) → the index → the thumb → the near pole (in front, its soft shadow on the
 * hand) → the cuff and sleeve.
 *
 * Frame: authored in a HAND frame (mm; origin on the pole's axis where it enters the fist on the index side; +x toward
 * the forearm; −y the back of the hand) and turned once, by TURN (25°), into the drawing's own page-oriented frame
 * (+x right, +y DOWN), so the forearm leaves to the lower right. Every exported point is in that page-oriented frame.
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

/** The turn from the hand frame (forearm along +x) to the drawing's frame: the forearm leaves to the lower right. */
export const END_TURN = (25 * Math.PI) / 180;
const CT = Math.cos(END_TURN);
const ST = Math.sin(END_TURN);
const turn = (x: number, y: number): Pt => P(x * CT - y * ST, x * ST + y * CT);
const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => turn(x, y));
/** A soft light or shade authored in the hand frame (its centre and its turn carried into the drawing's frame). */
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: turn(x, y), rx, ry, rot: rot + END_TURN });

/** The pole's radius (Ø 30 mm). */
export const POLE_R = 15;
/** How far the pole is off the line of sight (rad): about 25°. */
export const POLE_END_TILT = (25 * Math.PI) / 180;
/** Page millimetres per millimetre along the pole (the foreshortening): sin 25° ≈ 0.42. */
export const POLE_END_FORESHORTEN = Math.sin(POLE_END_TILT);
/** The pole's axis on the page, the direction TOWARD the viewer (unit, drawing frame): up and to the right. */
const AXIS_ANGLE = -45 * (Math.PI / 180) + END_TURN;
export const POLE_END_AXIS: Pt = P(Math.cos(AXIS_ANGLE), Math.sin(AXIS_ANGLE));
/** Across the pole on the page (unit, the axis turned a quarter clockwise). */
const ACROSS: Pt = P(-POLE_END_AXIS.v, POLE_END_AXIS.u);
/** The pole's round section where it enters the fist (an ellipse: narrower along the pole, cos 25°). */
export const POLE_END_SECTION: Ellipse = { c: P(0, 0), rx: POLE_R * Math.cos(POLE_END_TILT), ry: POLE_R, rot: AXIS_ANGLE };
/** The point on the pole's axis `a` mm along it from the index side of the fist (+ toward the viewer). */
export function poleEndAxisAt(a: number): Pt {
  return P(POLE_END_AXIS.u * POLE_END_FORESHORTEN * a, POLE_END_AXIS.v * POLE_END_FORESHORTEN * a);
}
/** The grip's centre: the middle of the fist along the pole (≈ 40 mm in from the index side). */
export const POLE_END_GRIP: Pt = poleEndAxisAt(-40);

/**
 * THE INDEX — the nearest finger, its thumb side toward us: one "C" round the pole's section. Hand frame.
 */
const INDEX_H: readonly (readonly [number, number])[] = [
  // the base, closing inside the hand's side (no edge drawn there)
  [14, -28],
  // where it rises out of the fist's top edge; the big knuckle: ONE soft swell, the fist's highest point
  [15, -38.4], [10, -40.2], [4, -40.9], [-2, -40.4],
  // the first segment's back, sloping down to the left
  [-8.5, -38.2], [-15.5, -34.4], [-22.5, -30], [-28.5, -25.6],
  // the middle joint's bend: a rounded corner (the fist's front)
  [-33.4, -21.2], [-36.8, -16.2], [-38.6, -10.6], [-38.9, -4.8],
  // the middle segment's back, down and in
  [-37.6, 1], [-35, 6.6], [-31.6, 11.4],
  // the last joint's softer bend
  [-27.8, 15.2], [-23.6, 18.4],
  // the last segment's back (its nail side), back along under the pole
  [-18.2, 21.4], [-12.4, 23.8], [-6.4, 25.2],
  // the tip, rounded, tucked at the bottom against the thumb
  [-1.2, 24.8], [2.4, 22], [2.8, 18.4], [0.8, 15.6],
  // the inner side, the pads pressed on the pole's section all round
  [-4.9, 14.1], [-9.9, 10.4], [-13.4, 5.2], [-15.2, -0.6],
  // (the middle joint's crease: the finger leaves the pole a little)
  [-16.6, -5.4],
  [-13.2, -9.2], [-9, -13], [-3.9, -14.8], [1.3, -14.7],
  // into the web over the side of the hand
  [6, -16.6], [10.4, -21],
];
const INDEX = pts(INDEX_H);
/** The index's drawn edge: from where it rises out of the fist's top edge, round the C, the tip, and the inner side up
 *  to where the near pole hides it. */
const INDEX_EDGE = INDEX.slice(1, 31);

/**
 * THE FINGERS BEHIND — middle, ring, little: each its own curl, farther along the pole, so seen lower-left of the one in
 * front; only an outer band shows. Each closes well inside the finger in front (hidden).
 */
const MIDDLE = pts([
  [-17.9, -31.5], [-25.7, -27.4], [-33, -22.2], [-38.7, -18], [-43, -12.9], [-45.3, -7.1], [-45.8, -0.8], [-44.5, 5.4], [-41.8, 11.6], [-38.3, 16.8],
  [-34.5, 21], [-30.2, 24.5], [-24.6, 27.7], [-18.4, 30.2], [-12.2, 31.6],
  // (the tip, under the thumb) and the hidden inside
  [-6.5, 32.4], [-3, 29], [-6, 20], [-20, 8], [-27, -8], [-16, -27],
]);
const RING = pts([
  [-30.5, -20.5], [-37.5, -15.5], [-43, -11.5], [-47.2, -6.6], [-49.4, -1], [-49.8, 5], [-48.6, 11], [-46, 17], [-42.6, 22], [-39, 26],
  [-34.8, 29.4], [-29.5, 32.4], [-23.5, 34.8], [-17.5, 36.2], [-13, 36.4],
  [-9, 33], [-14, 26], [-28, 14], [-33, -2], [-24, -20],
]);
const LITTLE = pts([
  [-38.8, -6.8], [-43.5, -3.4], [-47.1, 0.9], [-49, 5.7], [-49.4, 10.8], [-48.3, 16], [-46.1, 21.2], [-43.2, 25.5], [-40.1, 28.9], [-36.5, 31.8],
  [-31.9, 34.4], [-26.8, 36.5], [-21.6, 37.7], [-16.5, 37.4],
  [-12, 34], [-24, 24], [-38, 6], [-36, -6],
]);
/** Their drawn (outer) edges. */
const MIDDLE_EDGE = MIDDLE.slice(0, 16);
const RING_EDGE = RING.slice(0, 15);
const LITTLE_EDGE = LITTLE.slice(0, 14);

/**
 * THE HAND'S BODY — the side of the hand behind and right of the pole: the fist's top edge (the back of the hand seen
 * edge-on) back to the wrist, the forearm into the cuff, the forearm's lower edge, the heel of the hand and the thumb's
 * mound rounding down into the thumb; its left side runs hidden under the index, the pole and the thumb.
 */
const BODY = pts([
  // (hidden under the index)
  [-2, -37.6], [8, -38.2],
  // the fist's top edge: the back of the hand edge-on, gently convex, back to the wrist (a little dip there)
  [15, -38.4], [24, -38.9], [36, -38.7], [48, -37.9], [58, -36.4], [66, -35], [76, -35.4],
  // the forearm's top edge, into the cuff (and on under the sleeve)
  [90, -37.2], [104, -38.4], [122, -39.8],
  [122, 16.6],
  // the forearm's lower edge, the wrist (narrower than the hand)
  [104, 15], [90, 13.6], [78, 12.2], [70, 13.6],
  // the heel of the hand rounding out of the wrist, the thumb's mound (thenar) — into the thumb
  [62, 18.6], [54, 24.2], [46, 28.2], [38, 30.4], [30, 30.6],
  // (hidden under the thumb and the pole)
  [22, 29], [12, 22], [4, 10], [2, 0], [0, -12], [-2, -25],
]);

/**
 * THE THUMB — out of its mound low on the right, round under the pole, across the index's last segment, its pad pressed
 * down on it, its tip at the index's last joint. Its root closes inside the mound (the same skin: no edge, no crease).
 */
const THUMB = pts([
  // the root, inside the mound
  [44, 15], [36, 9.6], [27, 9.4],
  // the inner (palm) side: the base joint's inside under the pole, the first segment
  [19.6, 11.2], [13, 14.6], [7, 18.2], [1.6, 20.2],
  // the pad, pressed down on the index's last segment
  [-4.4, 20.9], [-10.6, 20.6], [-16.4, 20.4], [-21, 21.4],
  // the tip, rounded
  [-24.6, 23.6], [-26.2, 27], [-25.4, 30.6], [-22.4, 33],
  // the back (nail side): the end segment, the joint's soft bend, the first segment, the base joint — one gentle line
  [-16.4, 34.8], [-9.6, 36.1], [-2.6, 37.2], [4.6, 37.4], [11.6, 36.3], [18.4, 34.4], [25.2, 32.4],
  // into the mound
  [31.6, 30.6], [38, 27.6], [43, 22.6],
]);
/** The thumb's drawn edge: its free side from the base joint round the tip and along the back. */
const THUMB_EDGE = THUMB.slice(3, 23);

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

/** The cuff (hand frame): the rim a narrow ellipse (the forearm recedes a little) — its NEAR half is the one away from
 *  the hand, so the wrist goes in behind it; the sleeve beyond. */
const CUFF_H = P(98, -11.6);
const CUFF_RX = 7.6;
const CUFF_RY = 29.4;
const SLEEVE: Poly = [...arc(CUFF_H.u, CUFF_H.v, CUFF_RX, CUFF_RY, -Math.PI / 2, Math.PI / 2), turn(150, 20.4), turn(150, -44.2)];

export type PoleHandEndArt = {
  index: Poly;
  indexEdge: Poly;
  middle: Poly;
  ring: Poly;
  little: Poly;
  behindEdges: [Poly, Poly, Poly];
  body: Poly;
  thumb: Poly;
  thumbEdge: Poly;
  thumbNail: Poly;
  sleeve: Poly;
  /** The cuff's rim (an ellipse in the drawing's frame). */
  cuff: Ellipse;
  /** The index's big knuckle (the fist's highest point) and the thumb's tip. */
  knuckle: Pt;
  thumbTip: Pt;
  lights: Ellipse[];
  darks: Ellipse[];
  indexLights: Ellipse[];
  indexDarks: Ellipse[];
  indexWarm: Ellipse[];
  thumbLights: Ellipse[];
  thumbDarks: Ellipse[];
  creases: Poly[];
};

export const POLE_HAND_END: PoleHandEndArt = {
  index: INDEX,
  indexEdge: INDEX_EDGE,
  middle: MIDDLE,
  ring: RING,
  little: LITTLE,
  behindEdges: [MIDDLE_EDGE, RING_EDGE, LITTLE_EDGE],
  body: BODY,
  thumb: THUMB,
  thumbEdge: THUMB_EDGE,
  thumbNail: nail(-16.6, 32.2, 9.4, 4.6, 0.21),
  sleeve: SLEEVE,
  cuff: { c: turn(CUFF_H.u, CUFF_H.v), rx: CUFF_RX, ry: CUFF_RY, rot: END_TURN },
  knuckle: turn(4, -40.9),
  thumbTip: turn(-26.2, 27),
  lights: [
    // the thumb's mound: lit on its upper side, along the thumb's base
    E(40, 17, 13, 5.5, -0.5),
    // the side of the hand above it (the web's muscle), lit toward the knuckle
    E(30, -28, 13, 6, -0.1),
    // the wrist's upper side
    E(72, -27, 7, 4),
  ],
  darks: [
    // the groove between the mound and the side of the hand, running toward the wrist
    E(50, 4, 15, 3, -0.4),
    // the heel turning under into the wrist; the wrist's lower side
    E(58, 24, 12, 3.6, -0.65), E(84, 9, 12, 4),
    // the web going in by the pole, under the thumb's base
    E(18, 9, 6, 4, 0.4),
    // the wrist going into the cuff
    E(91, -12, 3.6, 22),
  ],
  indexLights: [
    // the middle joint's bend and the first segment's back, toward the light
    E(-33, -14, 4.4, 8.5, 0.4), E(-18, -30.5, 8.5, 3.2, -0.55),
    // the knuckle's soft swell
    E(1, -36.6, 7, 2.8),
    // the middle segment's side
    E(-30, 3, 4, 7, 0.3),
  ],
  indexDarks: [
    // the last joint and segment turning down, under the pole
    E(-20, 19, 9, 3.6, 0.5),
    // the middle joint's crease on the finger's side
    E(-21, -6, 4.4, 2.6, 0.5),
  ],
  indexWarm: [E(-33, -12, 5, 7, 0.4), E(-25, 16, 5, 3, 0.6), E(2, -37, 6, 2.6)],
  thumbLights: [
    // the tip toward the light; the first segment's side; the base joint's soft swell
    E(-21.6, 27.4, 3.6, 3.6), E(-4, 28.4, 10, 3, 0.04), E(20, 25, 7, 3.4, -0.4),
  ],
  thumbDarks: [
    // the pad, pressed under the fingers; the back turning away under
    E(-10, 22.6, 11, 2.2, -0.02), E(2, 35.4, 16, 2, 0.03), E(-19, 33, 4, 1.8, 0.3),
  ],
  creases: [
    // the index's middle-joint and last-joint skin folds on its side: short, soft
    pts([[-17.2, -6], [-21.6, -8.6], [-26.4, -10.6]]),
    pts([[-14.2, 9.8], [-18, 13.2], [-22, 15.6]]),
    // the thumb's joint, a hint on its side
    pts([[-0.6, 21.6], [0.4, 25.6]]),
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
  const c0 = poleEndAxisAt(a0);
  const c1 = poleEndAxisAt(a1);
  const n = ACROSS;
  const band = polyPath([P(c0.u + n.u * h, c0.v + n.v * h), P(c1.u + n.u * h, c1.v + n.v * h), P(c1.u - n.u * h, c1.v - n.v * h), P(c0.u - n.u * h, c0.v - n.v * h)]);
  const end = (c: Pt) => ellipsePath({ c, rx: h * Math.cos(POLE_END_TILT), ry: h, rot: AXIS_ANGLE });
  return unionOf(band, end(c0), end(c1));
}
/** The pole's two side lines from `a0` to `a1`. */
function tubeSides(a0: number, a1: number): SkPath {
  const c0 = poleEndAxisAt(a0);
  const c1 = poleEndAxisAt(a1);
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

function build(a: PoleHandEndArt, a0: number, a1: number, M: LightMap, sleeveOn: boolean) {
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
  const sec = POLE_END_SECTION;
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
    nearEnd: ellipsePath({ c: poleEndAxisAt(a1), rx: sec.rx, ry: sec.ry, rot: sec.rot }),
    far: tube(a0, 0, POLE_R),
    farSides: tubeSides(a0, 0),
    /** (poleLook 'boom') the scene pole's rim, tube and lit band over the near stretch. */
    nearBoom: [tube(0, a1, 15.5), tube(0, a1, 13.5), tube(0, a1, 3)] as const,
    /** A ring round the pole's section: the fingers' inner side turning in toward the pole, in shade. */
    hug: ellipsePath({ c: sec.c, rx: sec.rx + 4.5, ry: sec.ry + 4.5, rot: sec.rot }),
    cuffOpening: ellipsePath(a.cuff),
    indexEdge: smoothOpen(a.indexEdge),
    behindEdges: a.behindEdges.map((e) => smoothOpen(e)),
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
function HandFill({ path, M }: { path: SkPath; M: LightMap }) {
  const { HAND } = useLook();
  const c = { u: 14, v: 4 };
  const Ld = mv(M, -0.36, -0.93);
  const R = 70;
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

function EndPaint({ B, poleLook }: { B: Built; poleLook: 'study' | 'boom' }) {
  const { MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (the behind fingers each deeper in the shade of the one in front)
  const depthShade = [0.14, 0.26, 0.38];
  const front = [B.index, B.middle, B.ring];
  return (
    <Group>
      {/* 0. THE FAR POLE (behind the whole fist: seen only beyond the little finger) */}
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
            <Path path={rimL(B.behind[i], 1.3, M)} color={SKIN.rim} opacity={0.2}>
              <Blur mm={0.7} />
            </Path>
            {/* the finger in front: its soft contact shadow on this one */}
            <Path path={front[i]} style="stroke" strokeWidth={4} color={SKIN.deep} opacity={0.5}>
              <Blur mm={1.6} />
            </Path>
          </Group>
          <Path path={B.behindEdges[i]} style="stroke" strokeWidth={0.8} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />
        </Group>
      ))}

      {/* 2. THE HAND'S BODY: the side of the hand, the mound, the heel, the wrist */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        {/* the forearm turning away from the light toward the elbow */}
        <Path path={B.body}>
          <LinearGradient start={vec(50, 0)} end={vec(110, 40)} colors={['rgba(52,26,16,0)', 'rgba(52,26,16,0.22)']} />
        </Path>
        {B.lights.map((l, i) => (
          <Path key={`l${i}`} path={l} color={SKIN.rim} opacity={i === 0 ? 0.26 : 0.16}>
            <Blur mm={3} />
          </Path>
        ))}
        {B.darks.map((l, i) => (
          <Path key={`d${i}`} path={l} color={SKIN.deep} opacity={0.26}>
            <Blur mm={3.2} />
          </Path>
        ))}
        {/* the thumb's soft shadow on its own mound and the heel */}
        <Group transform={off(M, 0.8, 1.6)}>
          <Path path={B.thumb} color={SKIN.deep} opacity={0.3}>
            <Blur mm={2.2} />
          </Path>
        </Group>
        <Path path={rimL(B.body, 2, M)} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 3. THE INDEX (the nearest finger): its soft shadow on the fingers behind, then the finger */}
      <HandFill path={B.index} M={M} />
      <Group clip={B.index}>
        {/* the side of the finger turning in toward the pole: in shade along its inner side */}
        <Path path={B.hug} style="stroke" strokeWidth={9} color={SKIN.deep} opacity={0.3}>
          <Blur mm={2.6} />
        </Path>
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

      {/* 4. THE THUMB (nearer than the fingers): its soft shadow on the fingers, then the thumb */}
      <Group clip={B.fingers}>
        <Group transform={off(M, 0.8, 1.4)}>
          <Path path={B.thumb} color="#1c0f09" opacity={0.45}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>
      <HandFill path={B.thumb} M={M} />
      <Group clip={B.thumb}>
        <Path path={B.lights[0]} color={SKIN.rim} opacity={0.26}>
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

      {/* 6. THE CUFF AND SLEEVE: the near rim in front of the wrist */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(Lm.u < 0 ? 80 : 150, 0)} end={vec(Lm.u < 0 ? 150 : 80, 40)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

export type PoleHandEndProps = {
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
  /** (option, default true) false: no sleeve of its own — the skin ends at the cuff's near rim. */
  sleeve?: boolean;
  /** (option) 'boom': the near pole painted as the boom operator's scene pole, and only inside the hand's outline. */
  poleLook?: 'study' | 'boom';
  /** (option, default true) false: keep the scene's own figure scale (the hand drawn inside a figure). */
  ownScale?: boolean;
};

/** Where the art's own cuff rim is (drawing frame, mm): a figure's sleeve mouth goes here. */
export const POLE_HAND_END_CUFF: Pt = POLE_HAND_END.cuff.c;

/** The drawing's frame on the page: local (mm) → page. */
export function poleHandEndToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandEndProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
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
export function poleHandEndAxisOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_AXIS);
}

/** The hand's whole outline on the page (fingers, thumb, body; without its sleeve where `sleeve` is false). */
export function poleHandEndOutline(o: Pick<PoleHandEndProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_END, -1, 1, IDENTITY, o.sleeve ?? true);
  const p = B.all.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand on its pole seen along the pole from the index end, for one cast member: drawn at (x, y) (pt — the
 * pole's axis where it enters the fist on the index side), `s` pt per mm, turned `rot` radians. With `mirror`, the left
 * hand (seen from ITS index end), re-lit.
 */
export function PoleHandEnd({ who, x, y, s, rot = 0, pole = [-260, 420], mirror = false, sleeve = true, poleLook = 'study', ownScale = true }: PoleHandEndProps) {
  const B = useMemo(() => build(POLE_HAND_END, pole[0], pole[1], mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY, sleeve), [pole[0], pole[1], rot, mirror, sleeve]);
  const paint = <EndPaint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
