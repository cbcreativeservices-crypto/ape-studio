/**
 * FIGURE V2 — A RIGHT HAND GRIPPING A HORIZONTAL POLE HELD OVERHEAD, SEEN FROM DIRECTLY ABOVE (owner 2026-11-24, "one
 * hand at a time": hand number three). The boom operator's hand in the boom lessons' views from above: the camera looks
 * straight down, the pole (Ø 30 mm) runs across the picture, the forearm rises from below toward the camera, seen
 * nearly END-ON under the hand.
 *
 * WHICH WAY ROUND (boomGrip.ts, rightFrame/boomHand): a pole across the operator is held PALMS FORWARD — the back of the
 * hand turned back toward the operator (and out to the arm's side), the forearm about vertical. The pole lies in the
 * palm on the FRONT of the hand; the four fingers come up out of the knuckles on the operator's side, over the top of
 * the pole, and down its front; the thumb goes round the other way, UNDER the pole from the operator's side, and lies
 * low across the front under the fingers' ends — the same grip the two approved hands show from the palm side
 * (poleHandFront.tsx: the fingers down the front, the thumb across them low) and from the back (poleHandBack.tsx).
 *
 * AUTHORED 2-D ART, as the two approved hands: hand-placed points drawn as smooth closed cubic curves, the same skin
 * light, the same thin soft outline, soft form lights and shadows, very few lines. No 3-D model.
 *
 * Frame: millimetres, origin on the pole's axis under the middle of the fist, +x right ALONG the pole, +y DOWN the page
 * = back toward the OPERATOR (the page's top is the front, away from them). A right hand seen so has its THUMB on the
 * page's LEFT (the operator's left: a raised right hand, palm forward, has its thumb toward the body's middle).
 *
 * What the eye sees from above (worked out against a real hand round a 30 mm pole: knuckles about level with the pole
 * on its operator side, the first finger segments rising about 30° over the top, the middle joints the highest point,
 * just in front of the pole's axis; the middle segments sloping down the front; the last segments nearly vertical, the
 * tips tucked under; the thumb under the pole):
 *   1. the pole across the picture, lit along its length, seen left and right of the hand;
 *   2. over it, nearest the camera, the four fingers side by side (index 18, middle 19, ring 18, little 15 mm): each
 *      from its big knuckle on the operator's side, across the pole, its middle joint the highest (a soft ridge of
 *      light just in front of the axis), the middle segment sloping down to the rounded bend of the last joint hanging
 *      just past the pole's front edge — the middle finger farthest, the little the shortest; between neighbours short
 *      dark wedges at the front that fade as creases back across the pole;
 *   3. on the operator's side the knuckle row: the fingers' back edge, four low swells in one edge (the middle the
 *      most prominent), with the back of the hand beyond it: foreshortened, turned away from the light, a short broad
 *      shape narrowing to the wrist;
 *   4. the thumb: hidden under the pole and the fingers' ends — what shows is its BASE, beside the index knuckle on the
 *      thumb side: one smooth convex swell in the hand's outline from the wrist out and up to the pole's near edge,
 *      where it goes in under the pole (a soft shadow there): no flap, no notch;
 *   5. the cuff: a round-ish ellipse (the forearm nearly end-on) partly under the hand, the wrist going down into it,
 *      the sleeve beyond, going away under the hand.
 * The pole passes THROUGH the closed hand: the thumb's base and the palm's edge go under it on both sides, the fingers
 * cross over it. Paint order (far → near): the sleeve → the hand's body (the back of the hand, the thumb's base, the
 * palm under the pole) → the pole → the fingers.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Paint, Path, PathOp, Rect, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, rimOf, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';
import { lightMapOf, type LightMap } from './poleHandFront';

/* ── the art (pure: the tests read these points) ── */

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The pole's radius (Ø 30 mm). */
export const POLE_R = 15;

/**
 * The four fingers from above, index on the thumb side (LEFT): their columns (mm along the pole), how far each last
 * joint's bend hangs in front (`front`, −y), where its middle joint rides highest (`pip`), and its big knuckle's swell
 * on the operator's side (`knuckle`, +y).
 */
export const TOP_FINGERS = [
  { name: 'index', L: -35, R: -17, front: -27.4, pip: -3, knuckle: 43.6 },
  { name: 'middle', L: -17, R: 2, front: -30.6, pip: -4.5, knuckle: 44.4 },
  { name: 'ring', L: 2, R: 20, front: -27.7, pip: -3.5, knuckle: 42.4 },
  { name: 'little', L: 20, R: 35, front: -23.3, pip: -0.5, knuckle: 39 },
] as const;

/**
 * THE FINGERS — one group over the pole: from the index's outer side (over the thumb's base) up to its bend, across
 * the four bends at the front (a notch between two), down the little finger's outer side, then back along the knuckle
 * row (four low swells in one edge).
 */
const GROUP = pts([
  // the index's outer side, from its knuckle forward over the pole (a touch wider at its middle joint), its bend
  [-35.4, 38.6], [-35.9, 30], [-36.2, 21], [-36.5, 12], [-36.8, 3], [-37, -3], [-36.6, -9], [-35.9, -15],
  // (the top of a bent finger: blunt, slightly squared — a nearly straight front, small rounded corners; no fingertip)
  [-35.4, -20], [-34.2, -24.4], [-31.8, -26.8], [-28, -27.4], [-24, -27.4], [-20.6, -26.6], [-18.4, -24], [-17.5, -20.8],
  [-17.1, -18.6],
  // the middle finger's bend (hanging farthest)
  [-16.6, -23], [-15.6, -27], [-13.4, -29.8], [-9.6, -30.6], [-5, -30.6], [-1.4, -29.6], [0.8, -27], [1.7, -23.2],
  [2.1, -18.4],
  // the ring finger's bend
  [2.6, -22], [3.6, -25.4], [5.8, -27.2], [9.6, -27.7], [13.6, -27.6], [17, -26.6], [18.9, -24], [19.7, -20.4],
  [20.2, -17.4],
  // the little finger's bend (the shortest), its outer side back over the pole to its knuckle
  [20.6, -20.2], [21.8, -22.4], [24.4, -23.3], [28, -23.3], [31.4, -22.8], [33.8, -21], [35, -17.6], [35.7, -11], [36.4, -1], [36.2, 7], [36, 16], [35.8, 25], [35.4, 32], [34.6, 35.6],
  // the knuckle row, right → left: the little's swell (the smallest), the ring's, the middle's (the most prominent), the index's
  [32.4, 37.8], [29, 39], [25.4, 38.8], [22.6, 37.8],
  [20.4, 37.6],
  [17.8, 40.4], [13.6, 42.2], [9.2, 42.4], [5, 41.4],
  [2.2, 40],
  [-0.8, 42.4], [-4.8, 44.2], [-9.4, 44.4], [-13.6, 43.2],
  [-16.8, 41],
  [-19.6, 42.6], [-23.6, 43.6], [-28, 43.2], [-31.8, 41.8], [-34.2, 40.4],
]);

/**
 * THE HAND'S BODY — below the fingers: the palm under the pole, the thumb's base on the left (one smooth convex swell
 * from the wrist out and up to the pole's near edge, going in under it), the wrist down into the cuff, the hand's outer
 * (little-finger) edge up to the pole on the right. Its top runs under the pole and the fingers (hidden).
 */
const BODY = pts([
  // under the pole, the thumb's side
  [-36.4, -8], [-42.6, 2], [-46.6, 10],
  // the thumb's base: full just at and behind the pole's near edge (where the thumb goes in under the pole), its widest
  // a little behind it, easing in to the wrist — one convex curve; the hand clearly fuller on the thumb's side
  [-48.6, 17.6], [-49.4, 23.6], [-49.2, 30], [-48.2, 37], [-46.4, 44], [-44.4, 50], [-41.6, 56], [-37, 60.4], [-32.4, 63.8],
  // the wrist's thumb side, down into the cuff; the wrist's far side seen down inside the cuff's opening
  [-30, 67], [-29.4, 71.5], [-28.6, 76.4], [-25.6, 81.6], [-19, 86.8], [-9.8, 90], [0.4, 90.8], [10.6, 90], [19.6, 86.8], [26, 81.6], [29, 74.6], [29.6, 68],
  // the hand's outer edge: out from the wrist, up to the pole (nearly flush with the little finger), under it
  [30.6, 63.6], [33.6, 59], [36.6, 53], [38.4, 46], [39.2, 38], [39.2, 30], [38.8, 22], [38.4, 14], [37.8, 6], [37, -2], [35, -9],
  // (under the pole: hidden)
  [20, -10], [0, -10], [-20, -10],
]);

/** The notches between neighbouring bends at the front, and the valleys between their knuckles behind. */
const NOTCHES: readonly [Pt, Pt][] = [
  [P(-17.1, -18.6), P(-16.8, 41)],
  [P(2.1, -18.4), P(2.2, 40)],
  [P(20.2, -17.4), P(20.4, 37.6)],
];

/** The big knuckles' swells (on the knuckle row's edge): where each crest is, and its size — index and middle the
 *  larger, the little the smallest (the approved back hand's sizes). */
export const KNUCKLES = [
  { name: 'index', c: P(-26.2, 41.6), kr: 7.2 },
  { name: 'middle', c: P(-7.8, 42.4), kr: 7.6 },
  { name: 'ring', c: P(10.8, 40.4), kr: 5.8 },
  { name: 'little', c: P(27, 37), kr: 4.6 },
] as const;

/** The knuckle row's band: the fingers' back edge there is a soft crest, not the hand's outline. */
const KNUCKLE_BAND = { x0: -34, x1: 33.8, y0: 35, y1: 52 };

/** An ellipse as points. */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 16): Poly {
  const out: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = from + ((to - from) * j) / n;
    out.push(P(cx + rx * Math.cos(t), cy + ry * Math.sin(t)));
  }
  return out;
}

/** The cuff: its rim a round-ish ellipse (the forearm nearly end-on), the sleeve going on beyond it, away under the hand. */
const CUFF_C = P(0, 71);
const CUFF_RX = 33.4;
const CUFF_RY = 25;
/** How far the sleeve shows beyond the cuff's rim (the forearm leaning a little back toward the operator: a sliver). */
const SLEEVE_DROP = 9;
/** The sleeve: a short tube seen nearly end-on — the rim's far half, then down its sides to the same ellipse's near half
 *  `SLEEVE_DROP` beyond (in a scene the figure's own sleeve takes the forearm from there). */
const SLEEVE: Poly = [
  ...arc(CUFF_C.u, CUFF_C.v, CUFF_RX, CUFF_RY, Math.PI, 2 * Math.PI),
  ...arc(CUFF_C.u, CUFF_C.v + SLEEVE_DROP, CUFF_RX + 0.4, CUFF_RY, 0, Math.PI),
];

export type PoleHandTopArt = {
  body: Poly;
  group: Poly;
  notches: readonly [Pt, Pt][];
  fingers: typeof TOP_FINGERS;
  sleeve: Poly;
  /** The cuff's rim (an ellipse: centre, radii). */
  cuff: { c: Pt; rx: number; ry: number };
  /** The wrist where it goes into the cuff (y, mm). */
  wristY: number;
  /** The thumb's base: its widest point, and where its outline meets the pole's near edge. */
  thumbPeak: Pt;
  thumbAtPole: Pt;
  knuckleBand: typeof KNUCKLE_BAND;
  /** Soft lights and shades on the body (the back of the hand, the thumb's base, the wrist). */
  lights: Ellipse[];
  darks: Ellipse[];
  /** The tendons on the back of the hand, knuckles → wrist: a hint only. */
  tendons: Ellipse[];
  /** The knuckle row: a soft light on each swell's crest, soft shade in the valleys. */
  knuckleLights: Ellipse[];
  knuckleDarks: Ellipse[];
  /** Each middle joint's soft ridge of light (the highest point), and soft form shades on the fingers. */
  ridgeLights: Ellipse[];
  groupLights: Ellipse[];
  groupDarks: Ellipse[];
  groupWarm: Ellipse[];
};

export const POLE_HAND_TOP: PoleHandTopArt = {
  body: BODY,
  group: GROUP,
  notches: NOTCHES,
  fingers: TOP_FINGERS,
  sleeve: SLEEVE,
  cuff: { c: CUFF_C, rx: CUFF_RX, ry: CUFF_RY },
  wristY: 70,
  thumbPeak: P(-49.4, 23.6),
  thumbAtPole: P(-47.9, POLE_R),
  knuckleBand: KNUCKLE_BAND,
  lights: [
    // the thumb's base: lit along its outer side (toward the light), running up to where it goes under the pole
    E(-45.4, 27, 3.4, 11, 0.12),
    // the back of the hand: a broad soft light on its upper (thumb) side
    E(-14, 54, 15, 4.5, -0.06),
    // the wrist's lit side
    E(-23, 67, 4, 5),
  ],
  darks: [
    // where the thumb's base meets the back of the hand: a gentle groove (short, soft)
    E(-36.4, 50, 2.6, 7, -0.6),
    // the index finger's soft shade on the thumb's base beside it
    E(-39.4, 28, 2.4, 10),
    // the thumb going in under the pole
    E(-44.4, 17.8, 5.4, 2.8),
    // the back of the hand turning away from the light below the knuckle row; its outer edge; the wrist's far side
    E(4, 56, 28, 3.6), E(34, 50, 3.6, 10, -0.2), E(25.6, 68, 3.2, 6),
    // the wrist going down into the cuff
    E(0, 86, 24, 3.4),
  ],
  tendons: [
    { c: P(-19.6, 53.6), rx: 9, ry: 1.1, rot: Math.atan2(20, 14) },
    { c: P(-6.4, 54.6), rx: 8.6, ry: 1.1, rot: Math.atan2(19, 4) },
    { c: P(7.6, 53.6), rx: 8.4, ry: 1, rot: Math.atan2(20, -6) },
    { c: P(19.6, 51.6), rx: 9, ry: 0.9, rot: Math.atan2(22, -14) },
  ],
  // (as the approved back hand's: a soft light on top of each swell — index and middle the larger — soft shade in the
  // three valleys and just behind the row; small and crisp, never blotches)
  // (each light straddles the crest — on the finger and the back of the hand alike: a knuckle, not a finger's end)
  knuckleLights: KNUCKLES.map((k) => E(k.c.u - 1, k.c.v + 0.4, k.kr * 0.9, k.kr * 0.55)),
  knuckleDarks: [
    // the three valleys between the knuckles, running on down the back of the hand
    E(-16.8, 43.4, 1.9, 5.4), E(2.2, 42.4, 1.8, 5.2), E(20.4, 39.6, 1.6, 4.6),
    // below each swell, the back of the hand turning away (soft, set back from the crest)
    ...KNUCKLES.map((k) => E(k.c.u + 0.8, k.c.v + 6, k.kr * 0.95, 2.2)),
  ],
  // the middle joints: the highest point, a soft ridge of light across each finger
  ridgeLights: TOP_FINGERS.map((f) => E(f.L + (f.R - f.L) * 0.42, f.pip, (f.R - f.L) * 0.34, 2.8)),
  groupLights: [
    // the stretch that crosses the top of the pole, facing up: lit
    ...TOP_FINGERS.map((f) => E(f.L + (f.R - f.L) * 0.4, f.pip - 4.4, (f.R - f.L) * 0.28, 5)),
  ],
  groupDarks: [
    // the bend's very front, turning down and under, out of sight
    ...TOP_FINGERS.map((f) => E(f.L + (f.R - f.L) * 0.55, f.front + 1.4, (f.R - f.L) * 0.42, 1.8)),
  ],
  groupWarm: [
    ...TOP_FINGERS.map((f) => E(f.L + (f.R - f.L) * 0.5, f.pip, (f.R - f.L) * 0.36, 3.4)),
    ...TOP_FINGERS.map((f) => E(f.L + (f.R - f.L) * 0.5, f.front + 4.6, (f.R - f.L) * 0.34, 2.8)),
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
const rect = (x: number, y: number, w: number, h: number): SkPath => {
  const p = Skia.Path.Make();
  p.addRect(Skia.XYWHRect(x, y, w, h));
  return p;
};

/* ── (options, 2026-11-24 "Boom top") the light kept at the page's upper left when the art is turned or mirrored, as
 *  the other approved pole hands do it (identity: exactly as authored) ── */
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
/** A page offset (mm) carried into the art's frame: a cast shadow falls the same way on the page. */
const offM = (M: LightMap, u: number, v: number) => {
  const q = mv(M, u, v);
  return [{ translateX: q.u }, { translateY: q.v }];
};

function build(a: PoleHandTopArt, x0: number, x1: number, sleeveOn: boolean, M: LightMap = IDENTITY) {
  const body = smoothClosed(a.body);
  const group = smoothClosed(a.group, 0.45);
  const pole = rect(x0, -POLE_R, x1 - x0, POLE_R * 2);
  const poleEdges = Skia.Path.Make();
  poleEdges.moveTo(x0, -POLE_R);
  poleEdges.lineTo(x1, -POLE_R);
  poleEdges.moveTo(x0, POLE_R);
  poleEdges.lineTo(x1, POLE_R);
  const bandX = [-60, ...a.notches.map(([t]) => t.u), 60];
  const bands = bandX.slice(0, -1).map((l, i) => op(group, rect(l, -45, bandX[i + 1] - l, 90), PathOp.Intersect));
  const kb = a.knuckleBand;
  const knuckleBand = rect(kb.x0, kb.y0, kb.x1 - kb.x0, kb.y1 - kb.y0);
  const sleeve = smoothClosed(a.sleeve, 0.2);
  const cuff = a.cuff;
  // (the opening only a little wider than the wrist: a thin dark gap round it inside the cloth's rim)
  const opening = ellipsePath({ c: P(cuff.c.u, cuff.c.v + 0.4), rx: cuff.rx - 2.6, ry: cuff.ry - 2.4, rot: 0 });
  const rimOuter = ellipsePath({ c: cuff.c, rx: cuff.rx, ry: cuff.ry, rot: 0 });
  // (the rim's band: between the cuff's outer edge and the opening — its near (lower) half catches the light)
  const rimBand = op(op(rimOuter, opening, PathOp.Difference), rect(-60, cuff.c.v - 2, 120, 60), PathOp.Intersect);
  // the soft wrinkles over each middle joint (the backs of the fingers), and the tendons' hint on the back of the hand
  // (each finger its own: a little off-centre, different lengths and bows; the little finger only one)
  const WR: readonly { dx: number; marks: readonly { d: number; h: number; bow: number }[] }[] = [
    { dx: -0.6, marks: [{ d: -1.4, h: 0.26, bow: 1.2 }, { d: 1.7, h: 0.18, bow: 0.8 }] },
    { dx: 0.4, marks: [{ d: -2, h: 0.3, bow: 1.5 }, { d: 1, h: 0.22, bow: 1 }] },
    { dx: -0.2, marks: [{ d: -1.1, h: 0.2, bow: 1.1 }, { d: 2, h: 0.25, bow: 1.3 }] },
    { dx: 0.3, marks: [{ d: -0.4, h: 0.22, bow: 1 }] },
  ];
  const wrinkles = many(
    a.fingers.flatMap((f, i) => {
      const w = f.R - f.L;
      const m = (f.L + f.R) / 2 + WR[i].dx;
      return WR[i].marks.map(({ d, h, bow }) => smoothOpen([P(m - h * w, f.pip + d + bow * 0.7), P(m + 0.3, f.pip + d - bow * 0.4), P(m + h * w * 0.9, f.pip + d + bow * 0.6)]));
    }),
  );
  const tendons = many(relit(a.tendons, M, 1).map(ellipsePath));
  return {
    M,
    body,
    group,
    pole,
    /** (poleLook 'boom') the scene pole's rim, tube and lit band, along the art's pole axis. */
    poleBoom: [15.5, 13.5, 3].map((h) => rect(x0, -h, x1 - x0, 2 * h)) as [SkPath, SkPath, SkPath],
    poleEdges,
    sleeveOn,
    sleeve,
    opening,
    rimBand,
    all: unionOf(body, group),
    /** in front of the pole's front edge (the bends' side) */
    frontZone: rect(-80, -80, 160, 80 - POLE_R),
    knuckleBand,
    wrinkles,
    tendons,
    bands,
    // the dark wedge where two bends meet at the front, and the crease between neighbours back to the knuckles
    wedges: many(a.notches.map(([t]) => polyPath([P(t.u - 2.4, t.v - 4.5), P(t.u + 2.4, t.v - 4.5), P(t.u + 0.3, t.v + 5), P(t.u - 0.3, t.v + 5)]))),
    seams: many(a.notches.map(([t, b]) => smoothOpen([t, P((t.u + b.u) / 2 + 0.2, (t.v + b.v) / 2), b]))),
    lights: many(relit(a.lights, M, 1).map(ellipsePath)),
    darks: many(relit(a.darks, M, -1).map(ellipsePath)),
    knuckleLights: many(relit(a.knuckleLights, M, 1).map(ellipsePath)),
    knuckleDarks: many(relit(a.knuckleDarks, M, -1).map(ellipsePath)),
    ridgeLights: many(relit(a.ridgeLights, M, 1).map(ellipsePath)),
    groupLights: many(relit(a.groupLights, M, 1).map(ellipsePath)),
    groupDarks: many(relit(a.groupDarks, M, -1).map(ellipsePath)),
    groupWarm: many(a.groupWarm.map(ellipsePath)),
    bodyRim: rimL(body, 2, M),
    groupRim: rimL(group, 1.6, M),
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (the approved hands': one fixed span, every piece shares it — no seam). */
function HandFill({ path, M = IDENTITY }: { path: SkPath; M?: LightMap }) {
  const { HAND } = useLook();
  const c = { u: 0, v: 8 };
  const Ld = mv(M, -0.36, -0.93);
  const R = 68;
  return (
    <Path path={path}>
      <LinearGradient start={vec(c.u + Ld.u * R, c.v + Ld.v * R)} end={vec(c.u - Ld.u * R, c.v - Ld.v * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}


function TopPaint({ B, poleLook = 'study' }: { B: Built; poleLook?: 'study' | 'boom' }) {
  const { MAT } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const F = POLE_HAND_TOP.fingers;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (the light's side in the art's own frame: as authored the page's upper left; turned or mirrored, wherever it falls)
  const litLeft = Lm.u <= 0;
  const litTop = Lm.v <= 0;
  const hl = mv(M, -1.5, -2);
  return (
    <Group>
      {/* 0. THE SLEEVE (farthest: the forearm going down away under the hand), its opening dark round the wrist */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(litLeft ? -36 : 36, 0)} end={vec(litLeft ? 36 : -36, 0)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Group clip={B.sleeve}>
            {/* (the tube's side beyond the rim: going down, away from the camera and the light) */}
            <Path path={B.sleeve}>
              <LinearGradient start={vec(0, 84)} end={vec(0, 106)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']} />
            </Path>
            {/* the cloth's rim, lit on its near half (a soft band round the opening) */}
            <Path path={B.rimBand} color={shirt.rim} opacity={0.3}>
              <Blur mm={1} />
            </Path>
            {/* (a soft shade, not a line: light shirts keep it gentle) */}
            <Path path={B.opening} color={shirt.deep} opacity={0.36}>
              <Blur mm={1} />
            </Path>
            <Path path={B.opening} color="#000" opacity={0.12}>
              <Blur mm={2} />
            </Path>
            {/* the hand's soft shadow on the cuff and into its opening */}
            <Group transform={offM(M, 1.4, 3)}>
              <Path path={B.all} color="#000" opacity={0.22}>
                <Blur mm={3} />
              </Path>
            </Group>
          </Group>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}

      {/* 1. THE HAND'S BODY (under the pole and the fingers) */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        {/* the back of the hand, turned back toward the operator: away from the light, deeper toward the wrist */}
        <Path path={B.body}>
          <LinearGradient start={vec(0, 34)} end={vec(0, 92)} colors={['rgba(52,26,16,0.10)', 'rgba(52,26,16,0.2)', 'rgba(52,26,16,0.3)']} positions={[0, 0.5, 1]} />
        </Path>
        <Path path={B.lights} color={SKIN.rim} opacity={0.22}>
          <Blur mm={3} />
        </Path>
        <Path path={B.darks} color={SKIN.deep} opacity={0.3}>
          <Blur mm={2.6} />
        </Path>
        {/* the tendons: a hint only */}
        <Path path={B.tendons} color={SKIN.rim} opacity={0.08}>
          <Blur mm={1.2} />
        </Path>
        {/* the pole's soft shadow where the thumb's base and the hand's edge go in under it */}
        <Group transform={offM(M, 1.2, 3.4)}>
          <Path path={B.pole} color={SKIN.deep} opacity={0.42}>
            <Blur mm={2.4} />
          </Path>
        </Group>
        <Path path={B.bodyRim} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 2. THE POLE (through the hand: over the palm, under the fingers) */}
      {poleLook === 'boom' ? (
        // (option: the scene's own pole as BoomV2's PoleSeg paints it — a dark rim, the tube, its lit band — only inside
        // the hand's outline: outside it the scene draws the pole whole)
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
      )}
      {/* the fingers' soft shadow on the pole */}
      <Group clip={B.pole}>
        <Group transform={offM(M, 1.2, 2)}>
          <Path path={B.group} color="#000" opacity={0.55}>
            <Blur mm={1.8} />
          </Path>
        </Group>
      </Group>

      {/* the bends' soft cast shadow in front of the pole, onto what lies below them (a faint dark edge only) */}
      <Group clip={B.frontZone}>
        <Group transform={offM(M, 0.6, -0.9)}>
          <Path path={B.group} color="#000" opacity={0.5}>
            <Blur mm={1.6} />
          </Path>
        </Group>
      </Group>

      {/* 3. THE FINGERS (nearest the camera) */}
      <HandFill path={B.group} M={M} />
      <Group clip={B.group}>
        {/* each finger turning round its own length: lit on its side toward the light, its other side turning away —
            fading back toward the knuckles, where the fingers join the hand */}
        <Group layer={<Paint />}>
          {B.bands.map((b, i) => (
            <Path key={`b${i}`} path={b}>
              <LinearGradient start={vec(litLeft ? F[i].L : F[i].R, 0)} end={vec(litLeft ? F[i].R : F[i].L, 0)} colors={['rgba(255,238,226,0.2)', 'rgba(255,238,226,0.03)', 'rgba(52,26,16,0.12)', 'rgba(52,26,16,0.4)']} positions={[0, 0.3, 0.72, 1]} />
            </Path>
          ))}
          <Rect x={-60} y={-45} width={120} height={95} blendMode="dstIn">
            <LinearGradient start={vec(0, 12)} end={vec(0, 39)} colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0)']} />
          </Rect>
        </Group>
        {/* along the fingers: lit on the stretch that crosses the top of the pole; just past the pole's front edge a
            soft terminator, then shade — the ends bend down and under (the curl); the first segments, going back down
            to the knuckles, a little deeper */}
        <Path path={B.group}>
          <LinearGradient
            start={vec(0, -31)}
            end={vec(0, 44)}
            colors={['rgba(40,18,10,0.46)', 'rgba(40,18,10,0.34)', 'rgba(255,238,226,0.02)', 'rgba(255,238,226,0.12)', 'rgba(255,238,226,0.04)', 'rgba(52,26,16,0.08)', 'rgba(52,26,16,0.14)']}
            positions={[0, 0.16, 0.215, 0.31, 0.55, 0.81, 1]}
          />
        </Path>
        <Path path={B.groupLights} color={SKIN.rim} opacity={0.2}>
          <Blur mm={2.2} />
        </Path>
        <Path path={B.ridgeLights} color={SKIN.rim} opacity={0.34}>
          <Blur mm={1.8} />
        </Path>
        <Path path={B.groupDarks} color={SKIN.deep} opacity={0.22}>
          <Blur mm={1.6} />
        </Path>
        <Path path={B.groupWarm} color={WARM} opacity={0.18}>
          <Blur mm={2.4} />
        </Path>
        {/* the soft wrinkles over each middle joint */}
        <Path path={B.wrinkles} style="stroke" strokeWidth={0.6} strokeCap="round" color={SKIN.deep} opacity={0.13}>
          <Blur mm={0.35} />
        </Path>
        {/* the lit edge only where the fingers face up (never round the bends, which turn away) */}
        <Group clip={B.frontZone} invertClip>
          <Path path={B.groupRim} color={SKIN.rim} opacity={0.3}>
            <Blur mm={0.8} />
          </Path>
        </Group>
        <Path path={B.wedges} color={SKIN.deep} opacity={0.62}>
          <Blur mm={0.7} />
        </Path>
        {/* the crease between neighbours: clear at the front, fading back across the pole, a little again at the knuckles */}
        <Path path={B.seams} style="stroke" strokeWidth={0.6} strokeCap="round">
          <LinearGradient start={vec(0, -18)} end={vec(0, 41)} colors={[`${SKIN.edge}8c`, `${SKIN.edge}4d`, `${SKIN.edge}1f`, `${SKIN.edge}33`]} positions={[0, 0.3, 0.6, 1]} />
          <Blur mm={0.3} />
        </Path>
      </Group>
      {/* the knuckle row: lit on each crest, soft in the valleys — over the fingers and the back of the hand alike */}
      <Group clip={B.all}>
        <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.34}>
          <Blur mm={1.4} />
        </Path>
        <Path path={B.knuckleDarks} color={SKIN.deep} opacity={0.3}>
          <Blur mm={1.3} />
        </Path>
      </Group>
      {/* the fingers' own contour (their sides and the bends), never along the knuckle row ... */}
      <Group clip={B.knuckleBand} invertClip>
        <Path path={B.group} style="stroke" strokeWidth={0.85} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
      </Group>
      {/* ... where it is a soft crest over the back of the hand: the four swells' one edge */}
      <Group clip={B.knuckleBand}>
        <Path path={B.group} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.15}>
          <Blur mm={0.6} />
        </Path>
      </Group>
    </Group>
  );
}

export type PoleHandTopProps = {
  /** The cast member (absent: the look already given round it, inside a figure). */
  who?: CastMember;
  x: number;
  y: number;
  s: number;
  rot?: number;
  pole?: [number, number];
  /** (option, default true) false: no sleeve of its own (the figure's sleeve takes the forearm). */
  sleeve?: boolean;
  /** (option, default true) false: keep the scene's own figure scale (the hand drawn inside a figure). */
  ownScale?: boolean;
  /** (option, 2026-11-24 "Boom top") the LEFT hand: the mirror image, re-lit so the light stays at the page's upper
   *  left (turned, the light is kept there too — as the other approved pole hands do it). */
  mirror?: boolean;
  /** (option) 'boom': the pole painted as the boom operator's scene pole, and only inside the hand's outline. */
  poleLook?: 'study' | 'boom';
};

/** Where the art's own cuff rim is (local mm): a figure's sleeve mouth goes here. */
export const POLE_HAND_TOP_CUFF = CUFF_C;

/** (option) The art's frame on the page: local (mm) → page. */
export function poleHandTopToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandTopProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return (q: Pt): Pt => {
    const u = q.u * s * m;
    const v = q.v * s;
    return P(x + u * co - v * si, y + u * si + v * co);
  };
}

/** (option) The hand's whole outline on the page (the fingers and the body; without its sleeve where `sleeve` is false). */
export function poleHandTopOutline(o: Pick<PoleHandTopProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_TOP, -1, 1, o.sleeve ?? true);
  const p = (o.sleeve ?? true) ? unionOf(B.all, B.sleeve) : B.all.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand on its pole seen from directly above, for one cast member: drawn at (x, y) (pt — the pole's axis under
 * the middle of the fist), `s` pt per mm, turned `rot` radians (unturned: the pole left → right, the operator toward the
 * page's bottom, the thumb on the left). The pole runs from `pole[0]` to `pole[1]` mm along its axis. With `mirror`, the
 * left hand, re-lit.
 */
export function PoleHandTop({ who, x, y, s, rot = 0, pole = [-120, 120], sleeve = true, ownScale = true, mirror = false, poleLook = 'study' }: PoleHandTopProps) {
  const B = useMemo(() => build(POLE_HAND_TOP, pole[0], pole[1], sleeve, mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY), [pole[0], pole[1], sleeve, rot, mirror]);
  const paint = <TopPaint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
