/**
 * FIGURE V2 — A RIGHT HAND GRIPPING A HORIZONTAL POLE, SEEN FROM THE PALM SIDE
 * (owner 2026-11-24: "one hand at a time"; the first one). A boom operator
 * facing the viewer, the pole held overhead: the forearm comes up from below,
 * vertical; the pole (Ø 30 mm) runs left to right THROUGH the closed hand.
 *
 * AUTHORED 2-D ART: hand-placed points drawn as smooth closed cubic curves
 * (Catmull-Rom → cubics, paths.smoothClosed), painted in the approved authored
 * hands' skin (one hand light, soft form lights and shadows, very few thin
 * lines). No 3-D model, no projected skeleton.
 *
 * Frame: millimetres, origin on the pole's axis under the middle of the fist,
 * +x right, +y DOWN. For a RIGHT hand seen palm-side with the arm from below,
 * the THUMB is on the viewer's RIGHT (+x); the left hand is the mirror image.
 *
 * What the eye sees, bottom to top:
 *   1. the shirt cuff round the wrist (its near rim an arc convex upward: we
 *      look up at it, so the wrist goes in behind the rim);
 *   2. the wrist, palm side toward us (≈ 58 mm), two tendons at most hinted;
 *   3. the heel of the palm: the large thumb-side mound (thenar, right) and the
 *      smaller little-finger-side pad (hypothenar, left), a shallow valley;
 *   4. the pole, lying in the palm: visible left and right of the fist, hidden
 *      where the fingers and thumb cross in front of it;
 *   5. the four fingers' ends, lying down the FRONT of the pole side by side as
 *      one group (index on the thumb side … little finger outside): each the
 *      rounded bend of its last knuckle just above the pole's top, then its
 *      last segment pointing down with its nail toward us, the tip on the
 *      pole's lower part; the middle finger's bend highest, the little
 *      finger's lowest and narrowest; above the bends the middle segments going
 *      back over the pole's top, and the knuckle row as four low swells on the
 *      one top edge;
 *   6. the thumb: out of the thenar mound (no crease at its root) across in
 *      FRONT, low on the pole, lying diagonally over the ends of the index and
 *      middle fingers — the nearest piece, casting a soft shadow on them.
 * Paint order (the pole passes THROUGH the hand): the hand's body (behind the
 * pole) → the pole → the fingers' ends → the thumb.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, rimOf, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';

/* ── the art (pure: the tests read these points) ── */

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The pole's radius (Ø 30 mm). */
export const POLE_R = 15;

/** The four finger ends, index on the thumb side (right): their columns, the top of each
 *  last-knuckle bend and the bottom of each tip (mm). Widths ≈ 18 / 19 / 18 / 15. */
export const POLE_FINGERS = [
  { name: 'little', L: -38.5, R: -23.5, top: -28.4, dip: -12.5, tip: 10.2 },
  { name: 'ring', L: -23.5, R: -5.5, top: -33.5, dip: -15.5, tip: 15.1 },
  { name: 'middle', L: -5.5, R: 13.5, top: -36.3, dip: -17, tip: 16.5 },
  { name: 'index', L: 13.5, R: 31.5, top: -32.6, dip: -16, tip: 14.9 },
] as const;

/**
 * THE HAND'S BODY — everything behind the pole and the one outline of the whole hand: the wrist out
 * of the cuff, the little-finger pad, the hand's outer edge behind the pole, the little finger's side
 * going back, the knuckle row's four low swells (one edge), the index's side, the hand's edge behind
 * the pole on the thumb side, the thenar mound, the wrist.
 */
const BODY = pts([
  // the wrist's left side (under the cuff → up): narrow, then the outline swings out round the
  // little-finger pad (a smaller rounded pad)
  [-28.6, 92], [-28, 80], [-27.6, 70], [-28.2, 62.5], [-30.8, 57.6], [-34.6, 52.4], [-38.2, 45.4], [-40.7, 36.4], [-41.9, 26.4], [-42.2, 16],
  // the hand's outer edge, behind the pole
  [-42.2, 5], [-42, -5], [-41.7, -13.5],
  // (the palm's top lies behind the pole and the fingers: from this side the big knuckles on the
  // back of the hand cannot be seen — nothing of the hand rises above the fingers' bends)
  [-39, -16.5], [-20, -19], [10, -19.5], [33, -19.8],
  // (above the pole the hand ends flush inside the index's right side: nothing protrudes there)
  [34, -15.6], [35.6, -13],
  // the hand's edge behind the pole (thumb side), the web between index and thumb just under the pole
  [41.6, -8], [42.4, 2], [43, 10], [43.8, 15.6],
  // the thenar mound: a full rounded pad bulging out (the thumb springs from its top), then tucking in to the wrist
  [45.6, 20], [47.2, 27], [47.6, 35], [46.8, 43], [44.2, 50], [39.8, 55.4], [34.8, 59.2], [31.4, 62.6],
  // the wrist's right side, into the cuff
  [30.6, 70], [30.6, 80], [31, 92],
]);

/**
 * THE FOUR FINGERS — one group folded over the pole: little, ring, middle, index (left → right). Each
 * ONE strip from the top of the fist to its tip: at the top its middle joint's bend, a soft rounded
 * corner (the four bends ARE the fist's top edge: a gentle arc, the middle highest, the little lowest;
 * a dark wedge only at the very top between two corners); the middle segment coming forward over the
 * pole's top, foreshortened; the last joint's smaller soft bend about level with the pole's top; the
 * last segment down across the front of the pole to its rounded tip.
 */
const GROUP = pts([
  // the little finger's outer side, up from its tip past its last joint; its bend (the lowest)
  [-39.2, 0], [-40, -6], [-40.5, -11.5], [-40.7, -15], [-40.3, -19.5], [-39.3, -23.8], [-36.9, -26.9], [-32.6, -28.4], [-28.5, -28.2], [-25.4, -26.8],
  [-23.6, -24.4],
  // the ring finger's bend
  [-22.3, -29], [-19.9, -32.1], [-16, -33.5], [-11.5, -33.3], [-7.8, -31.5],
  [-5.5, -28.5],
  // the middle finger's bend (the highest)
  [-4.1, -32.5], [-1.1, -35.4], [3.5, -36.3], [8.4, -35.6], [11.8, -33],
  [13.5, -28.8],
  // the index finger's bend, its outer side down past its last joint to its tip
  [14.8, -30.9], [18, -32.3], [23, -32.6], [27.8, -31.4], [31.4, -28.6], [33.6, -24.4], [34.6, -19.6], [35, -14.6], [34.7, -8], [34.4, -2], [33.9, 4], [32.7, 9.4],
  // the tips, right to left, each rounded, a small notch between two
  [30.6, 12.8], [26.6, 14.6], [22, 14.9], [17.6, 14.1], [14.8, 12.1],
  [13.5, 11],
  [12.1, 13.4], [8.8, 15.8], [4.4, 16.5], [0, 15.9], [-3.6, 13.9],
  [-5.5, 12.3],
  [-7.3, 13.1], [-10.6, 14.7], [-14.6, 15.1], [-18.6, 14.3], [-21.9, 12.1],
  [-23.5, 9.6],
  // (the little finger, the shortest, ends a little higher)
  [-25.3, 9.4], [-28.3, 10.2], [-31.8, 10], [-35, 8.3], [-37.6, 5.2],
]);

/** The notches between neighbouring fingers: [top (between the bends), bottom (between the tips)]. */
const NOTCHES: readonly [Pt, Pt][] = [
  [P(-23.6, -24.4), P(-23.5, 9.6)],
  [P(-5.5, -28.5), P(-5.5, 12.3)],
  [P(13.5, -28.8), P(13.5, 11)],
];

/**
 * THE THUMB — out of the thenar mound, across in front low on the pole, over the ends of the index
 * and middle fingers. Its root closes INSIDE the mound (painted in the same skin: no edge, no crease
 * there). Two segments: the thick base segment, a soft bend, the end segment, its tip rounded.
 */
const THUMB = pts([
  // the root: springing from the top of the thenar mound, just under the pole on the right
  [45.3, 20.6],
  // the back (upper) edge toward the tip: the thick base segment low along the pole, one soft bend,
  // the end segment (a little narrower)
  [42, 16.9], [35.4, 14.6], [28.4, 12.4], [22, 10.6], [15.6, 9.1], [9.6, 8], [3.6, 7.4], [-1.2, 7.8],
  // the rounded tip
  [-5.2, 9.3], [-7.6, 12], [-8.1, 15.2], [-6.8, 18.3], [-3.6, 20.5],
  // the lower edge, back toward the mound (it runs on into the mound's own soft crease)
  [1, 21.7], [7, 22.7], [12.6, 24.3], [18.6, 27.1], [24.6, 30.9], [30, 34.9], [35, 38.6],
  // closing inside the mound
  [41, 41], [45.6, 34], [46.2, 27],
]);
/** The thumb's drawn edge: its back edge and tip, over the fingers and the pole. */
const THUMB_EDGE = THUMB.slice(1, 15);
/** Its lower edge over the palm: drawn only toward the tip, fading out before the root. */
const THUMB_UNDER = THUMB.slice(13, 20);

/** A quiet nail: a rounded oblong `len` along `rot`, `w` across. */
function nail(x: number, y: number, len: number, w: number, rot = Math.PI / 2): Poly {
  const out: Poly = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let j = 0; j < 20; j++) {
    const t = (Math.PI * 2 * j) / 20;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    // (a squarer oval: a nail's sides run nearly straight)
    const a = (len / 2) * Math.sign(ct) * Math.pow(Math.abs(ct), 0.75);
    const b = (w / 2) * Math.sign(st) * Math.pow(Math.abs(st), 0.75);
    out.push(P(x + a * c - b * s, y + a * s + b * c));
  }
  return out;
}

/** An ellipse as points (the cuff's rim). */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 16): Poly {
  const out: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = from + ((to - from) * j) / n;
    out.push(P(cx + rx * Math.cos(t), cy + ry * Math.sin(t)));
  }
  return out;
}

/** The cuff: its near rim an arc convex upward (we look up at it), the sleeve down to the picture's edge. */
// (raised: about 25 mm of wrist shows below the heel)
const CUFF_C = P(1.2, 84.5);
const CUFF_RX = 37.5;
const CUFF_RY = 6;
const SLEEVE: Poly = [...arc(CUFF_C.u, CUFF_C.v, CUFF_RX, CUFF_RY, Math.PI, 2 * Math.PI), P(39.5, 120), P(40.5, 160), P(-38.5, 160), P(-37.5, 120)];

export type PoleHandArt = {
  body: Poly;
  group: Poly;
  thumb: Poly;
  thumbEdge: Poly;
  thumbUnder: Poly;
  notches: readonly [Pt, Pt][];
  fingers: typeof POLE_FINGERS;
  nails: Poly[];
  thumbNail: Poly;
  sleeve: Poly;
  cuffSeam: Poly;
  /** The wrist crease, where the heel meets the wrist (y, mm). */
  heelY: number;
  thumbTip: Pt;
  thumbRoot: Pt;
  /** The thenar mound and the thumb's base lit as one form (painted on the body and on the thumb alike). */
  mound: Ellipse[];
  lights: Ellipse[];
  darks: Ellipse[];
  creases: Poly[];
  /** The fingertips' and the thumb's soft contact shadows on the palm. */
  contact: Ellipse[];
  /** Form lights and shadows on the finger group and the thumb. */
  groupLights: Ellipse[];
  groupDarks: Ellipse[];
  groupWarm: Ellipse[];
  thumbLights: Ellipse[];
  thumbDarks: Ellipse[];
};

export const POLE_HAND_FRONT: PoleHandArt = {
  body: BODY,
  group: GROUP,
  thumb: THUMB,
  thumbEdge: THUMB_EDGE,
  thumbUnder: THUMB_UNDER,
  notches: NOTCHES,
  fingers: POLE_FINGERS,
  nails: [nail(-31, 2.4, 8.8, 8.2), nail(-14.5, 6.2, 10.4, 9.6), nail(4.2, 7.2, 10.8, 10), nail(22.6, 6.4, 10.6, 9.8)],
  thumbNail: nail(0.6, 14.4, 11, 9.6, 0.2),
  sleeve: SLEEVE,
  cuffSeam: arc(CUFF_C.u, CUFF_C.v + 18, CUFF_RX + 0.6, CUFF_RY, Math.PI * 1.04, Math.PI * 1.96),
  heelY: 58,
  thumbTip: P(-8.1, 15.2),
  thumbRoot: P(43, 30),
  // the thumb's base and the thenar mound lit as ONE form (painted on both: no seam at the root)
  mound: [E(30, 33, 13, 6.5, 0.62), E(36, 44, 8, 7, 0.3)],
  lights: [
    // the little-finger pad: a smaller rounded pad, lit on its upper left
    E(-30, 34, 7.5, 12.5, 0.1),
    // the wrist: its lit left side, two tendons at most hinted
    E(-19, 70, 4.5, 8), E(-3.5, 70, 1.5, 7), E(8.5, 70, 1.3, 7),
  ],
  darks: [
    // the palm's hollow under the fingertips; the soft valley between the two pads, running up toward the pole
    E(-10, 21.5, 13, 3.6), E(-4, 39, 4.6, 16, -0.06),
    // under the little-finger pad, the heel turning into the wrist
    E(-30, 53, 9, 3.4, 0.5), E(2, 58.6, 25, 2.6),
    // the side away from the light: the mound's outer edge, the wrist's right side
    E(45.6, 44, 3.6, 11, 0.3), E(26.6, 71, 3.6, 9),
    // the wrist going into the cuff
    E(1, 79.5, 30, 2.4),
  ],
  creases: [
    // the wrist crease (soft), where the heel meets the wrist
    pts([[-22, 59], [-8, 61], [8, 61], [24, 58.6]]),
    // the mound's own soft crease: running on from the thumb's lower edge, round the mound, down to the wrist
    pts([[5, 23.6], [2.6, 33], [3, 43], [6.4, 52]]),
  ],
  contact: [E(-14.6, 17.2, 6.5, 2.2), E(-31.4, 12.4, 5.5, 2), E(13, 27.8, 16, 3, 0.5)],
  groupLights: [
    // the middle joints' rounded corners at the top, and the middle segments' top band, lit from the upper left
    E(-33, -24.6, 4.6, 2.4), E(-16.5, -29.6, 5.4, 2.5), E(2, -32.4, 5.6, 2.5), E(21, -30.2, 5.4, 2.5),
    E(-31.5, -20, 5, 3.4), E(-15, -24, 6, 4), E(3.5, -26, 6, 4.2), E(22, -24.6, 6, 4),
    // each last joint's small soft bend (its lit upper edge)
    E(-31.6, -13.6, 4.2, 1.5), E(-15.2, -16.6, 5, 1.6), E(3.2, -18.1, 5, 1.6), E(21.8, -17.1, 5, 1.6),
  ],
  groupDarks: [
    // under each last joint's bend: the last segment turning down toward us
    E(-31, -10, 5.2, 1.7), E(-14.5, -13, 6.2, 1.8), E(4, -14.5, 6.2, 1.8), E(22.5, -13.5, 6.2, 1.8),
  ],
  groupWarm: [
    E(-31.5, -25, 5, 2.8), E(-15, -30, 6, 3), E(3.5, -32.6, 6, 3), E(22, -30.6, 6, 3),
    E(-31, -12.6, 4.4, 2.2), E(-14.5, -15.6, 5.4, 2.2), E(4, -17, 5.4, 2.2), E(22.5, -16, 5.4, 2.2),
    E(-31, 7, 5, 2.6), E(-14.6, 11.6, 6, 2.6),
  ],
  thumbLights: [E(17, 12.4, 12, 2.4, 0.3), E(-3, 10.4, 4.2, 2.2, 0.15), E(35, 18.6, 6, 2.4, 0.4)],
  thumbDarks: [E(9, 21.2, 10, 2.2, 0.2), E(-5.2, 18, 3, 2.4, 0.5), E(20, 26.8, 5, 2, 0.55)],
};

/* ── the paint ── */

const WARM = '#b8665a';
const POLE_STOPS = ['#25282d', '#5d636c', '#b0b6bf', '#7b818a', '#555a62', '#3b3f46', '#222428'];
const POLE_POS = [0, 0.1, 0.22, 0.38, 0.62, 0.86, 1];

type Built = {
  /** The hand's whole outline (body, fingers, thumb). */
  all: SkPath;
  /** (poleLook 'boom') the scene pole's rim, tube and lit band, along the art's pole axis. */
  poleBoom: [SkPath, SkPath, SkPath];
  M: LightMap;
  sleeveOn: boolean;
  body: SkPath;
  group: SkPath;
  thumb: SkPath;
  pole: SkPath;
  sleeve: SkPath;
  front: SkPath;
  groupOrPole: SkPath;
  thumbEdge: SkPath;
  thumbUnder: SkPath;
  nails: SkPath[];
  thumbNail: SkPath;
  bands: SkPath[];
  wedges: SkPath;
  tipNotches: SkPath;
  seams: SkPath;
  creases: SkPath;
  cuffSeam: SkPath;
  cuffRim: SkPath;
  poleEdges: SkPath;
  lights: SkPath[];
  darks: SkPath[];
  contact: SkPath;
  groupLights: SkPath;
  groupDarks: SkPath;
  groupWarm: SkPath;
  thumbLights: SkPath;
  thumbDarks: SkPath;
  mound: SkPath;
};

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

/**
 * RE-LIGHTING (an option: the left hand, or the hand turned on the page). The approved art is lit from the page's
 * upper left in its own frame. Drawn mirrored or turned, every light-bound value is carried by `M` (the page's
 * directions into the art's frame) so the light stays at the page's upper left: the hand's one skin light, the lit
 * edges, the soft cast shadows' offsets, each finger's lit side, and each soft light or shade moved round its form
 * toward the light. M = identity is the approved drawing exactly.
 */
export type LightMap = { a: number; b: number; c: number; d: number };
const IDENTITY: LightMap = { a: 1, b: 0, c: 0, d: 1 };
const isId = (M: LightMap) => M.a === 1 && M.b === 0 && M.c === 0 && M.d === 1;
const mv = (M: LightMap, u: number, v: number): Pt => P(M.a * u + M.b * v, M.c * u + M.d * v);
/** The art's frame from the page's (rotation `rot`, mirrored or not): page = R(rot)·Mirror·local. */
export function lightMapOf(rot: number, mirror: boolean): LightMap {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return { a: m * co, b: m * si, c: -si, d: co };
}
/** A soft light or shade moved round its form toward the light (k: how far, as a share of its smaller radius). */
function relit(es: Ellipse[], M: LightMap, sign: 1 | -1, ref: Pt = LIGHT, k = 0.35): Ellipse[] {
  const L = mv(M, LIGHT.u, LIGHT.v);
  if (Math.abs(L.u - ref.u) < 1e-9 && Math.abs(L.v - ref.v) < 1e-9) return es;
  return es.map((e) => {
    const r = Math.min(e.rx, e.ry) * k * sign;
    return { ...e, c: P(e.c.u + r * (L.u - ref.u), e.c.v + r * (L.v - ref.v)) };
  });
}

/**
 * THE LEFT HAND'S OWN SOFT LIGHTS AND SHADES (coordinator 2026-11-24: the two hands lit consistently side by side).
 * Drawn mirrored, the art's own frame is lit from its upper RIGHT (the page's upper left). Every soft light or shade
 * that sits on one SIDE of a form is authored again for that light; the form-centred ones (the valley, the heel's
 * turn into the wrist, the fingers' last-joint shades, the warm skin, the contact shadows) stay as they are:
 *   • the little-finger pad lit on its side toward the hand's middle; the wrist's lit side the other way;
 *   • the thenar mound (on the page's left) lit across its OUTER edge, which now faces the light — its shade moved
 *     to its inner side, toward the valley; the wrist's shaded side the other way;
 *   • each finger's corner light and last-joint light on the corner toward the light.
 */
const LEFT_SHADING: Pick<PoleHandArt, 'lights' | 'darks' | 'mound' | 'groupLights'> = {
  mound: [E(33, 33, 13, 6.5, 0.62), E(40, 43, 8, 7.5, 0.3)],
  lights: [E(-26, 33, 7.5, 12.5, -0.1), E(21, 70, 4.5, 8), E(3.5, 70, 1.5, 7), E(-8.5, 70, 1.3, 7)],
  darks: [
    E(-10, 21.5, 13, 3.6), E(-4, 39, 4.6, 16, -0.06),
    E(-30, 53, 9, 3.4, 0.5), E(2, 58.6, 25, 2.6),
    // (the mound's side away from the light: its inner side, toward the valley; the wrist's far side)
    E(11, 45, 4, 10, -0.25), E(-25.6, 71, 3.6, 9),
    E(1, 79.5, 30, 2.4),
  ],
  groupLights: [
    E(-29, -24.6, 4.6, 2.4), E(-12.5, -29.6, 5.4, 2.5), E(6, -32.4, 5.6, 2.5), E(24, -30.2, 5.4, 2.5),
    E(-30.5, -20, 5, 3.4), E(-14, -24, 6, 4), E(4.5, -26, 6, 4.2), E(23, -24.6, 6, 4),
    E(-30.4, -13.6, 4.2, 1.5), E(-13.8, -16.6, 5, 1.6), E(4.8, -18.1, 5, 1.6), E(23.2, -17.1, 5, 1.6),
  ],
};
/** The light the left hand's set is authored for, in the art's own frame (the page's light, mirrored). */
const LIGHT_MIRRORED = P(-LIGHT.u, LIGHT.v);
/** The lit edge of a mass for the light `M` brings (the approved rimOf where M is the identity). */
function rimL(path: SkPath, w: number, M: LightMap): SkPath {
  if (isId(M)) return rimOf(path, w);
  const L = mv(M, LIGHT.u, LIGHT.v);
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

function build(a0: PoleHandArt, x0: number, x1: number, M: LightMap = IDENTITY, sleeveOn = true, mirrored = false): Built {
  // (mirrored: the left hand's own authored soft lights and shades; any turn then shifts them a little from there)
  const a = mirrored ? { ...a0, ...LEFT_SHADING } : a0;
  const ref = mirrored ? LIGHT_MIRRORED : LIGHT;
  const body0 = smoothClosed(a.body);
  const sleevePath = smoothClosed(a.sleeve, 0.2);
  // (no sleeve of its own: the skin ends at the cuff's rim, where the figure's own sleeve takes the wrist)
  const body = sleeveOn ? body0 : op(body0, sleevePath, PathOp.Difference);
  const group = smoothClosed(a.group, 0.45);
  const thumb = smoothClosed(a.thumb);
  const pole = Skia.Path.Make();
  pole.addRect(Skia.XYWHRect(x0, -POLE_R, x1 - x0, POLE_R * 2));
  const poleEdges = Skia.Path.Make();
  poleEdges.moveTo(x0, -POLE_R);
  poleEdges.lineTo(x1, -POLE_R);
  poleEdges.moveTo(x0, POLE_R);
  poleEdges.lineTo(x1, POLE_R);
  const bandX = [-60, ...a.notches.map(([t]) => t.u), 60];
  const bands = bandX.slice(0, -1).map((l, i) => {
    const r = Skia.Path.Make();
    r.addRect(Skia.XYWHRect(l, -40, bandX[i + 1] - l, 80));
    return op(group, r, PathOp.Intersect);
  });
  // the dark wedge where two bends meet, and the hairline crease down to the tips
  const wedges = many(a.notches.map(([t]) => polyPath([P(t.u - 2.6, t.v - 4.5), P(t.u + 2.6, t.v - 4.5), P(t.u + 0.3, t.v + 4.5), P(t.u - 0.3, t.v + 4.5)])));
  const tipNotches = many(a.notches.map(([, b]) => polyPath([P(b.u - 1.6, b.v + 1.8), P(b.u + 1.6, b.v + 1.8), P(b.u + 0.25, b.v - 4.5), P(b.u - 0.25, b.v - 4.5)])));
  const seams = many(a.notches.map(([t, b]) => smoothOpen([t, P((t.u + b.u) / 2 - 0.3, (t.v + b.v) / 2), b])));
  const sleeve = sleevePath;
  const cuffRim = smoothOpen(a.sleeve.slice(0, 17));
  return {
    body,
    group,
    thumb,
    pole,
    sleeve,
    all: unionOf(body, group, thumb),
    poleBoom: [15.5, 13.5, 3].map((h) => {
      const r = Skia.Path.Make();
      r.addRect(Skia.XYWHRect(x0, -h, x1 - x0, 2 * h));
      return r;
    }) as [SkPath, SkPath, SkPath],
    M,
    sleeveOn,
    front: unionOf(group, thumb),
    groupOrPole: unionOf(group, pole),
    thumbEdge: smoothOpen(a.thumbEdge),
    thumbUnder: smoothOpen(a.thumbUnder),
    nails: a.nails.map((n) => smoothClosed(n)),
    thumbNail: smoothClosed(a.thumbNail),
    bands,
    wedges,
    tipNotches,
    seams,
    creases: many(a.creases.map(smoothOpen)),
    cuffSeam: smoothOpen(a.cuffSeam),
    cuffRim,
    poleEdges,
    lights: relit(a.lights, M, 1, ref).map(ellipsePath),
    darks: relit(a.darks, M, -1, ref).map(ellipsePath),
    contact: many(a.contact.map(ellipsePath)),
    groupLights: many(relit(a.groupLights, M, 1, ref).map(ellipsePath)),
    groupDarks: many(relit(a.groupDarks, M, -1, ref).map(ellipsePath)),
    groupWarm: many(a.groupWarm.map(ellipsePath)),
    thumbLights: many(relit(a.thumbLights, M, 1, ref).map(ellipsePath)),
    thumbDarks: many(relit(a.thumbDarks, M, -1, ref).map(ellipsePath)),
    mound: many(relit(a.mound, M, 1, ref).map(ellipsePath)),
  };
}

/** The hand's one skin light: a fixed span round the hand, shared by every piece (no seam). */
function HandFill({ path, M = IDENTITY }: { path: SkPath; M?: LightMap }) {
  const { HAND } = useLook();
  const c = { u: 2, v: 18 };
  const Ld = mv(M, -0.36, -0.93);
  const R = 68;
  return (
    <Path path={path}>
      <LinearGradient start={vec(c.u + Ld.u * R, c.v + Ld.v * R)} end={vec(c.u - Ld.u * R, c.v - Ld.v * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

/** A page offset (the approved art's, mm) carried into the art's frame: a cast shadow falls the same way on the page. */
const off = (M: LightMap, u: number, v: number) => {
  const q = mv(M, u, v);
  return [{ translateX: q.u }, { translateY: q.v }];
};

function PoleHandArtPaint({ B, poleLook = 'study' }: { B: Built; poleLook?: 'study' | 'boom' }) {
  const { MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const F = POLE_HAND_FRONT.fingers;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (each finger lit on the side toward the light; the sleeve likewise; the pole's highlight on its lit side)
  const litLeft = Lm.u <= 0;
  const litTop = Lm.v <= 0;
  const hl = mv(M, -1.5, -2);
  const pole =
    poleLook === 'boom' ? (
      // (the scene's own pole as BoomV2's PoleSeg paints it — a dark rim, the tube, its lit band — only inside the
      // hand's outline: outside it the scene draws the pole whole)
      <Group clip={B.all}>
        <Path path={B.poleBoom[0]} color="#0b0c0f" />
        <Path path={B.poleBoom[1]} color="#3a3d45" />
        <Group transform={[{ translateY: hl.v }]}>
          <Path path={B.poleBoom[2]} color="#d4d8e0" opacity={0.45} />
        </Group>
      </Group>
    ) : (
      <Group>
        <Path path={B.pole}>
          <LinearGradient start={vec(0, litTop ? -POLE_R : POLE_R)} end={vec(0, litTop ? POLE_R : -POLE_R)} colors={POLE_STOPS} positions={POLE_POS} />
        </Path>
        <Path path={B.poleEdges} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.7} />
      </Group>
    );
  return (
    <Group>
      {/* 1. THE HAND'S BODY (behind the pole) */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        {B.lights.map((l, i) => (
          <Path key={`l${i}`} path={l} color={SKIN.rim} opacity={i >= 1 ? 0.14 : 0.26}>
            <Blur mm={3} />
          </Path>
        ))}
        <Path path={B.mound} color={SKIN.rim} opacity={0.24}>
          <Blur mm={4} />
        </Path>
        {B.darks.map((l, i) => (
          <Path key={`d${i}`} path={l} color={SKIN.deep} opacity={0.28}>
            <Blur mm={3.5} />
          </Path>
        ))}
        <Path path={B.creases} style="stroke" strokeWidth={2} strokeCap="round" color={SKIN.deep} opacity={0.22}>
          <Blur mm={1} />
        </Path>
        {/* the fingertips' and the thumb's soft shadows on the palm */}
        <Path path={B.contact} color={SKIN.deep} opacity={0.5}>
          <Blur mm={2} />
        </Path>
        {/* the pole's soft shadow on the palm just under it (the light from above) */}
        <Group transform={off(M, 1.2, 3.4)}>
          <Path path={B.pole} color={SKIN.deep} opacity={0.38}>
            <Blur mm={2.4} />
          </Path>
        </Group>
        <Path path={rimL(B.body, 2, M)} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* the cuff over the wrist (none where the figure's own sleeve takes the wrist) */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(litLeft ? -38 : 40, 0)} end={vec(litLeft ? 40 : -38, 0)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Group clip={B.sleeve}>
            {/* the cuff's fold: faint */}
            <Path path={B.cuffSeam} style="stroke" strokeWidth={1.6} color={shirt.deep} opacity={0.18}>
              <Blur mm={1} />
            </Path>
            {/* the rim: a soft lit ellipse edge, not a line */}
            <Path path={B.cuffRim} style="stroke" strokeWidth={3} strokeCap="round" color={shirt.rim} opacity={0.18}>
              <Blur mm={1.2} />
            </Path>
          </Group>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}

      {/* 2. THE POLE */}
      {pole}
      {/* the finger group's soft shadow on the pole */}
      <Group clip={B.pole}>
        <Group transform={off(M, 1.2, 2)}>
          <Path path={B.group} color="#000" opacity={0.55}>
            <Blur mm={1.8} />
          </Path>
        </Group>
      </Group>

      {/* 3. THE FINGERS' ENDS (in front of the pole) */}
      <HandFill path={B.group} M={M} />
      <Group clip={B.group}>
        {B.bands.map((b, i) => (
          // each finger turning round its own length: lit on its side toward the light, its other side turning away
          <Path key={`b${i}`} path={b}>
            <LinearGradient start={vec(litLeft ? F[i].L : F[i].R, 0)} end={vec(litLeft ? F[i].R : F[i].L, 0)} colors={['rgba(255,238,226,0.2)', 'rgba(255,238,226,0.03)', 'rgba(52,26,16,0.12)', 'rgba(52,26,16,0.4)']} positions={[0, 0.3, 0.72, 1]} />
          </Path>
        ))}
        {/* the middle segments (the top band) catch the light; the last segments, below their bend,
            turn a little darker, facing down and toward us */}
        <Path path={B.group}>
          <LinearGradient
            start={vec(0, -36)}
            end={vec(0, 17)}
            colors={['rgba(255,238,226,0.14)', 'rgba(255,238,226,0.05)', 'rgba(52,26,16,0.08)', 'rgba(52,26,16,0.12)', 'rgba(52,26,16,0.26)']}
            positions={[0, 0.34, 0.44, 0.7, 1]}
          />
        </Path>
        <Path path={B.groupLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={1.8} />
        </Path>
        <Path path={B.groupDarks} color={SKIN.deep} opacity={0.26}>
          <Blur mm={1.2} />
        </Path>
        <Path path={B.groupWarm} color={WARM} opacity={0.2}>
          <Blur mm={2.4} />
        </Path>
        <Path path={rimL(B.group, 1.6, M)} color={SKIN.rim} opacity={0.3}>
          <Blur mm={0.8} />
        </Path>
        <Path path={B.wedges} color={SKIN.deep} opacity={0.62}>
          <Blur mm={0.7} />
        </Path>
        <Path path={B.tipNotches} color={SKIN.deep} opacity={0.4}>
          <Blur mm={0.6} />
        </Path>
        {/* the crease between neighbours, unbroken top to tip: clear over the middle segments, softer below the last joint */}
        <Path path={B.seams} style="stroke" strokeWidth={0.6} strokeCap="round">
          <LinearGradient start={vec(0, -30)} end={vec(0, 14)} colors={[`${SKIN.edge}8c`, `${SKIN.edge}7a`, `${SKIN.edge}3d`, `${SKIN.edge}4d`]} positions={[0, 0.3, 0.5, 1]} />
          <Blur mm={0.3} />
        </Path>
        {B.nails.map((n, i) => (
          <QuietNail key={`n${i}`} path={n} fill={NAIL.fill} M={M} />
        ))}
      </Group>

      {/* 4. THE THUMB (nearest): its soft shadow on the fingers and the pole, then the thumb */}
      <Group clip={B.groupOrPole}>
        <Group transform={off(M, 0.8, 1.4)}>
          <Path path={B.thumb} color="#1c0f09" opacity={0.5}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>
      <HandFill path={B.thumb} M={M} />
      <Group clip={B.thumb}>
        {/* the mound's light carried on over the thumb's base (the same light, the same place: one form) */}
        <Path path={B.mound} color={SKIN.rim} opacity={0.24}>
          <Blur mm={4} />
        </Path>
        <Path path={B.thumbLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.thumbDarks} color={SKIN.deep} opacity={0.34}>
          <Blur mm={2} />
        </Path>
        <Path path={rimL(B.thumb, 1.8, M)} color={SKIN.rim} opacity={0.34}>
          <Blur mm={0.8} />
        </Path>
        <QuietNail path={B.thumbNail} fill={NAIL.fill} M={M} />
      </Group>
      <Path path={B.thumbEdge} style="stroke" strokeWidth={0.85} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />
      <Path path={B.thumbUnder} style="stroke" strokeWidth={0.8} strokeCap="round">
        <LinearGradient start={vec(-6, 18)} end={vec(30, 35)} colors={[SKIN.edge, `${SKIN.edge}59`, `${SKIN.edge}00`]} positions={[0.15, 0.6, 1]} />
      </Path>
      {/* the fingers' own contour (the fist's top edge, its sides on the pole, the tips), never over the thumb */}
      <Group clip={B.thumb} invertClip>
        <Path path={B.group} style="stroke" strokeWidth={0.85} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
      </Group>
    </Group>
  );
}

/** A quiet nail: a slightly lighter rounded shape with a soft edge, not outlined. */
function QuietNail({ path, fill, M = IDENTITY }: { path: SkPath; fill: string; M?: LightMap }) {
  return (
    <Group>
      <Path path={path} color={fill} opacity={0.3}>
        <Blur mm={0.45} />
      </Path>
      <Group transform={off(M, -0.6, -0.8)}>
        <Path path={path} color="#fff4ec" opacity={0.08}>
          <Blur mm={0.9} />
        </Path>
      </Group>
    </Group>
  );
}

export type PoleHandFrontProps = {
  /** The cast member (absent: the look already given round it, inside a figure). */
  who?: CastMember;
  x: number;
  y: number;
  s: number;
  rot?: number;
  pole?: [number, number];
  /** (option) the LEFT hand: the mirror image (thumb on the viewer's left), re-lit so the light stays upper left. */
  mirror?: boolean;
  /** (option, default true) false: no sleeve of its own — the skin ends at the cuff's rim (the figure's sleeve takes the wrist). */
  sleeve?: boolean;
  /** (option) 'boom': the pole painted as the boom operator's scene pole, and only inside the hand's outline. */
  poleLook?: 'study' | 'boom';
  /** (option, default true) false: keep the scene's own figure scale (the hand drawn inside a figure). */
  ownScale?: boolean;
};

/** Where the art's own cuff rim is (local mm): a figure's sleeve mouth goes here. */
export const POLE_HAND_CUFF = CUFF_C;

/** The art's frame on the page: local (mm) → page. */
export function poleHandToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandFrontProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return (q: Pt): Pt => {
    const u = q.u * s * m;
    const v = q.v * s;
    return P(x + u * co - v * si, y + u * si + v * co);
  };
}

/** The hand's whole outline on the page (body, fingers and thumb; without its sleeve where `sleeve` is false). */
export function poleHandOutline(o: Pick<PoleHandFrontProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_FRONT, -60, 60, IDENTITY, o.sleeve ?? true);
  const p = B.all.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand on its pole, for one cast member: drawn at (x, y) (pt — the pole's axis under the
 * middle of the fist), `s` pt per mm, turned `rot` radians. The pole runs from `pole[0]` to `pole[1]`
 * mm along its axis; the sleeve runs down past the picture's edge. With `mirror`, the left hand.
 */
export function PoleHandFront({ who, x, y, s, rot = 0, pole = [-120, 120], mirror = false, sleeve = true, poleLook = 'study', ownScale = true }: PoleHandFrontProps) {
  const B = useMemo(() => build(POLE_HAND_FRONT, pole[0], pole[1], mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY, sleeve, mirror), [pole[0], pole[1], rot, mirror, sleeve]);
  const paint = <PoleHandArtPaint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
