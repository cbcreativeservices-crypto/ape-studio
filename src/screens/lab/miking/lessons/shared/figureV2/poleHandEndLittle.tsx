/**
 * FIGURE V2 — A RIGHT HAND GRIPPING A 30 mm POLE, SEEN ALONG THE POLE FROM THE LITTLE-FINGER END (owner 2026-11-24,
 * "one hand at a time"). The partner of poleHandEnd (seen from the thumb / index end): the same hand, the same grip,
 * the same pole tilt (25° off the line of sight), the camera at the OTHER end of the pole.
 *
 * AUTHORED 2-D ART, as the approved hands: hand-placed points (mm) drawn as smooth closed cubic curves, the same skin
 * light (cast.ts tones through useLook), the same thin soft outline, soft form lights and shadows, very few lines, the
 * light from the page's upper left. No 3-D model, no projected skeleton.
 *
 * THE VIEW, IN WORDS (written before any point was placed):
 * We stand off the little-finger end of the fist and look nearly along the pole. Walking round from the index end, left
 * and right swap: the forearm now leaves the fist to the LOWER LEFT (square to the pole in space; it only recedes a
 * little) and the fingers curl round the pole's RIGHT side. The pole's near part comes toward us about 25° off our line
 * of sight, so it is a short, strongly foreshortened cylinder: its round section (an ellipse a little narrower along the
 * pole, cos 25°) sits inside the fist, the near part runs on toward us up and to the LEFT, in front of the side of the
 * hand; the far part goes away behind the fist down and to the right and shows again only beyond the index finger.
 *   1. Nearest of all, the LITTLE finger, seen from its own outer side: the smallest finger, one tight "C" round the
 *      pole's section — its big knuckle at the top (one soft swell on the fist's top edge), the first segment's back
 *      sloping down to the right, the middle joint's rounded bend (the fist's far edge), the middle segment down and in,
 *      the last joint's softer bend, the short last segment back under the pole, its tip tucked at the bottom against the
 *      heel of the hand. Its inner side presses on the pole all round (a little gap only in the middle joint's crease).
 *   2. Behind the little finger, the RING, MIDDLE and INDEX fingers: the same curl, each farther along the pole (so seen a
 *      little lower-right of the one in front) and each a bigger finger — so each shows as a band along the C's outer
 *      edge, widest round the bends, thinning to nothing at the knuckle and at the tip: the ring's the widest band, the
 *      middle's narrower, the index's a sliver; each deeper in shade. Never a row of equal bumps: one form, layered in
 *      depth. Their knuckles are hidden below the little finger's first segment; their tips are hidden in the palm,
 *      behind the little finger's tip and the heel.
 *   3. The HEEL of the hand (the fleshy pad under the little finger, the hypothenar), nearest after the little finger:
 *      the big, round, prominent form low on the left, swelling out of the wrist's lower edge, rounding under to the
 *      little finger's tip, which presses into it.
 *   4. The pole INSIDE the ring of the little finger (top, right, bottom) and the palm (left); the near part of the
 *      pole hides the palm where it meets the pole as it comes toward us.
 *   5. Behind / left of the pole the side of the hand (little-finger side): the back of the hand edge-on as the fist's
 *      top edge running back to the wrist, the heel at the bottom; the wrist (narrower than the hand) into the cuff;
 *      the cuff's near rim a narrow ellipse, the wrist going in behind it.
 *   6. The THUMB is at the far end of the fist, under the pole, and is hidden by the fingers and the heel: not drawn.
 * Paint order (far → near): the far pole → the cuff's dark opening → the index, middle and ring fingers → the hand's
 * body (side of the hand, heel, wrist) → the little finger → the near pole (in front, its soft shadow on the hand) → the
 * cuff and sleeve.
 *
 * Frame: authored in a HAND frame (mm; origin on the pole's axis where it enters the fist on the little-finger side;
 * −x toward the forearm; −y the back of the hand) and turned once, by END_LITTLE_TURN (−25°), into the drawing's own
 * page-oriented frame (+x right, +y DOWN), so the forearm leaves to the lower left. Every exported point is in that
 * page-oriented frame.
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
import { POLE_END_TILT, POLE_R } from './poleHandEnd';

/* ── the art (pure: the tests read these points) ── */

/** The turn from the hand frame (forearm along −x) to the drawing's frame: the forearm leaves to the lower left. */
export const END_LITTLE_TURN = (-25 * Math.PI) / 180;
const CT = Math.cos(END_LITTLE_TURN);
const ST = Math.sin(END_LITTLE_TURN);
const turn = (x: number, y: number): Pt => P(x * CT - y * ST, x * ST + y * CT);
const turnPt = (p: Pt): Pt => turn(p.u, p.v);
const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => turn(x, y));
/** A soft light or shade authored in the hand frame (its centre and its turn carried into the drawing's frame). */
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: turn(x, y), rx, ry, rot: rot + END_LITTLE_TURN });

/** The pole's radius (Ø 30 mm): the same pole as poleHandEnd. */
export const POLE_R_LITTLE = POLE_R;
/** How far the pole is off the line of sight (rad): the SAME 25° as poleHandEnd, so the two views pair. */
export const POLE_END_LITTLE_TILT = POLE_END_TILT;
/** Page millimetres per millimetre along the pole (the foreshortening): sin 25° ≈ 0.42. */
export const POLE_END_LITTLE_FORESHORTEN = Math.sin(POLE_END_LITTLE_TILT);
/** The pole's axis on the page, the direction TOWARD the viewer (unit, drawing frame): up and to the left — the mirror
 *  of poleHandEnd's. */
const AXIS_ANGLE = -135 * (Math.PI / 180) + END_LITTLE_TURN;
export const POLE_END_LITTLE_AXIS: Pt = P(Math.cos(AXIS_ANGLE), Math.sin(AXIS_ANGLE));
/** Across the pole on the page (unit, the axis turned a quarter clockwise). */
const ACROSS: Pt = P(-POLE_END_LITTLE_AXIS.v, POLE_END_LITTLE_AXIS.u);
/** The pole's round section where it enters the fist (an ellipse: narrower along the pole, cos 25°). */
export const POLE_END_LITTLE_SECTION: Ellipse = { c: P(0, 0), rx: POLE_R * Math.cos(POLE_END_LITTLE_TILT), ry: POLE_R, rot: AXIS_ANGLE };
/** The point on the pole's axis `a` mm along it from the little-finger side of the fist (+ toward the viewer). */
export function poleEndLittleAxisAt(a: number): Pt {
  return P(POLE_END_LITTLE_AXIS.u * POLE_END_LITTLE_FORESHORTEN * a, POLE_END_LITTLE_AXIS.v * POLE_END_LITTLE_FORESHORTEN * a);
}
/** The grip's centre: the middle of the fist along the pole (≈ 40 mm in from the little-finger side). */
export const POLE_END_LITTLE_GRIP: Pt = poleEndLittleAxisAt(-40);

/**
 * THE LITTLE FINGER — the nearest form, its outer side toward us: the smallest finger, one tight "C" round the pole's
 * section. Hand frame.
 */
const LITTLE_H: readonly (readonly [number, number])[] = [
  // the base, closing inside the hand's side (no edge drawn there)
  [-12, -26],
  // where it rises out of the fist's top edge; the big knuckle: ONE soft swell, the fist's highest point
  [-13, -34.4], [-8.4, -35.9], [-3, -36.5], [2.4, -36],
  // the first segment's back, sloping down to the right
  [8, -34], [13.6, -30.8], [18.8, -27], [23.2, -22.8],
  // the middle joint's bend: a rounded corner (the fist's far edge)
  [26.8, -18.2], [29.4, -12.8], [30.8, -7.2], [31, -1.4],
  // the middle segment's back, down and in
  [29.8, 4.2], [27.6, 9.2], [24.6, 13.6],
  // the last joint's softer bend
  [21.2, 17.2], [17.4, 20.2],
  // the short last segment's back, under the pole
  [13, 22.8], [8.4, 24.6], [3.8, 25.6],
  // the tip, rounded, tucked at the bottom against the heel of the hand
  [-0.6, 25.2], [-3.6, 22.8], [-4, 19.4], [-2, 16.8],
  // the inner side, the pads pressed on the pole's section all round
  [2.6, 15.8], [7.4, 14], [11.6, 10.6], [14.6, 5.8], [15.8, 0.2],
  // (the middle joint's crease: the finger leaves the pole a little)
  [16.8, -4.6],
  [14.2, -8.8], [10.4, -12.4], [5.6, -14.8], [0.4, -15.7],
  // into the web over the side of the hand
  [-4.6, -17.6], [-9, -21.4],
];
const LITTLE = pts(LITTLE_H);
/** The little finger's drawn edge: from where it rises out of the fist's top edge, round the C, the tip, and the inner
 *  side up to where the near pole hides it. */
const LITTLE_EDGE = LITTLE.slice(1, 32);

/** The far direction along the pole, in the hand frame (away from the viewer): down and to the right. */
const FAR_H = P(Math.SQRT1_2, Math.SQRT1_2);
const smoothstep = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
/**
 * A finger BEHIND the little finger: the little finger's outer edge (from its first segment round to its tip) turned
 * `rotDeg` on along the curl (a longer finger bends farther round), grown `grow` mm (a bigger finger) and set back
 * `back` mm (page) along the far pole — both fading to nothing at the knuckle end and the tip end, where it tucks
 * 1.2 mm inside the little finger. Then a hidden inside that closes well within the little finger. Hand frame → turned.
 */
function behind(rotDeg: number, grow: number, back: number, t0: number, t1: number): { shape: Poly; edge: Poly } {
  const src = LITTLE_H.slice(5, 25);
  const a = (rotDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const n = src.length;
  const edgeH: Pt[] = src.map(([x0, y0], i) => {
    const t = i / (n - 1);
    const w = smoothstep(t0, t0 + 0.24, t) * (1 - smoothstep(t1 - 0.24, t1, t));
    const x = x0 * ca - y0 * sa;
    const y = x0 * sa + y0 * ca;
    const r = Math.hypot(x, y);
    const k = grow * w - 2.4 * (1 - w);
    return P(x + (x / r) * k + FAR_H.u * back * w, y + (y / r) * k + FAR_H.v * back * w);
  });
  // the hidden inside: round the little finger's body at about 22 mm from the pole's axis, back to the top
  const insideH = [95, 60, 20, -20, -60, -85].map((deg) => P(22 * Math.cos((deg * Math.PI) / 180), 22 * Math.sin((deg * Math.PI) / 180)));
  const edge = edgeH.map(turnPt);
  return { shape: [...edge, ...insideH.map(turnPt)], edge };
}
// the ring: shown from its first segment round to its last; the middle: from its bend down; the index: a sliver low
const RING_B = behind(3, 1.8, 7.6, 0.04, 0.86);
const MIDDLE_B = behind(10, 3, 12.2, 0.2, 0.94);
const INDEX_B = behind(15, 2.6, 15.4, 0.52, 0.99);

/**
 * THE HAND'S BODY — the little-finger side of the hand behind and left of the pole: the fist's top edge (the back of the
 * hand seen edge-on) back to the wrist, the forearm into the cuff, the forearm's lower edge, the wrist, and the HEEL of
 * the hand swelling out of it, round and full, under to the little finger's tip; its right side runs hidden under the
 * little finger and the pole.
 */
const BODY = pts([
  // (hidden under the little finger)
  [2, -33.4], [-8, -34.4],
  // the fist's top edge: the back of the hand edge-on, gently convex, back to the wrist (a little dip there, then the
  // wrist bone on the little-finger side: a low, soft swell)
  [-13, -34.4], [-22, -34.9], [-34, -34.9], [-46, -34.2], [-56, -33], [-63, -31.7], [-70, -33], [-77, -33],
  // the forearm's top edge, into the cuff (and on under the sleeve)
  [-88, -34.4], [-102, -35.8], [-122, -37.4],
  [-122, 16.6],
  // the forearm's lower edge, the wrist (narrower than the hand)
  [-104, 15], [-90, 13.6], [-78, 12.2], [-70, 13.8],
  // the heel of the hand: the fleshy pad swelling out of the wrist, full and round, under to the little finger's tip
  [-62, 19.4], [-52, 25.6], [-40, 29.8], [-28, 31.4], [-17, 30.6], [-8, 28.4], [1, 26.8],
  // (hidden under the little finger's tip and the pole)
  [4, 22], [1, 17.5], [-3, 12], [-4, 0], [-3, -14], [-2, -26],
]);

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
const CUFF_H = P(-98, -11.6);
const CUFF_RX = 7.6;
const CUFF_RY = 29.4;
const SLEEVE: Poly = [...arc(CUFF_H.u, CUFF_H.v, CUFF_RX, CUFF_RY, Math.PI / 2, (3 * Math.PI) / 2), turn(-150, -44.2), turn(-150, 20.4)];

export type PoleHandEndLittleArt = {
  little: Poly;
  littleEdge: Poly;
  /** The fingers behind, near → far: ring, middle, index. */
  ring: Poly;
  middle: Poly;
  index: Poly;
  behindEdges: [Poly, Poly, Poly];
  body: Poly;
  sleeve: Poly;
  /** The cuff's rim (an ellipse in the drawing's frame). */
  cuff: Ellipse;
  /** The little finger's big knuckle (the fist's highest point), its tip, and the heel's lowest point. */
  knuckle: Pt;
  littleTip: Pt;
  heel: Pt;
  lights: Ellipse[];
  darks: Ellipse[];
  littleLights: Ellipse[];
  littleDarks: Ellipse[];
  littleWarm: Ellipse[];
  creases: Poly[];
};

export const POLE_HAND_END_LITTLE: PoleHandEndLittleArt = {
  little: LITTLE,
  littleEdge: LITTLE_EDGE,
  ring: RING_B.shape,
  middle: MIDDLE_B.shape,
  index: INDEX_B.shape,
  behindEdges: [RING_B.edge, MIDDLE_B.edge, INDEX_B.edge],
  body: BODY,
  sleeve: SLEEVE,
  cuff: { c: turn(CUFF_H.u, CUFF_H.v), rx: CUFF_RX, ry: CUFF_RY, rot: END_LITTLE_TURN },
  knuckle: turn(-3, -36.5),
  littleTip: turn(-4, 19.4),
  heel: turn(-28, 31.4),
  lights: [
    // the heel: its upper side toward the light
    E(-36, 19, 18, 6.5, 0.12),
    // the side of the hand above it, lit toward the knuckle
    E(-30, -27, 13, 6, 0.1),
    // the wrist's upper side
    E(-72, -25, 7, 4),
  ],
  darks: [
    // the heel turning under, along its whole lower edge; the wrist's lower side
    E(-34, 31, 22, 2.6, 0.05), E(-84, 9, 12, 4),
    // the palm going in by the pole, beside the little finger's tip
    E(-9, 14, 6, 4, -0.4),
    // the wrist going into the cuff
    E(-91, -12, 3.6, 22),
  ],
  littleLights: [
    // the first segment's back and the knuckle's soft swell, toward the light
    E(11, -30.5, 8.5, 3, 0.62), E(-3, -32.8, 6.5, 2.6),
    // the middle joint's side, a little
    E(22, -10, 4, 7, -0.4),
  ],
  littleDarks: [
    // the last joint and segment turning down, under the pole
    E(15, 20, 8.5, 3.4, -0.55),
    // the middle joint's crease on the finger's side
    E(19.5, -5.4, 4.4, 2.6, -0.5),
    // the bend's outer side, turning away from the light
    E(29, 1, 2.6, 10),
  ],
  littleWarm: [E(27.5, -10, 4.4, 6.5, -0.4), E(17, 18, 5, 3, -0.6), E(-3, -33, 6, 2.6)],
  creases: [
    // the little finger's middle-joint and last-joint skin folds on its side: short, soft
    pts([[17.4, -5.2], [21.4, -7.6], [25.6, -9.8]]),
    pts([[12.8, 10.8], [16.2, 13.8], [19.6, 16.2]]),
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
  const c0 = poleEndLittleAxisAt(a0);
  const c1 = poleEndLittleAxisAt(a1);
  const n = ACROSS;
  const band = polyPath([P(c0.u + n.u * h, c0.v + n.v * h), P(c1.u + n.u * h, c1.v + n.v * h), P(c1.u - n.u * h, c1.v - n.v * h), P(c0.u - n.u * h, c0.v - n.v * h)]);
  const end = (c: Pt) => ellipsePath({ c, rx: h * Math.cos(POLE_END_LITTLE_TILT), ry: h, rot: AXIS_ANGLE });
  return unionOf(band, end(c0), end(c1));
}
/** The pole's two side lines from `a0` to `a1`. */
function tubeSides(a0: number, a1: number): SkPath {
  const c0 = poleEndLittleAxisAt(a0);
  const c1 = poleEndLittleAxisAt(a1);
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

function build(a: PoleHandEndLittleArt, a0: number, a1: number, M: LightMap, sleeveOn: boolean) {
  const sleeve = smoothClosed(a.sleeve, 0.2);
  const body0 = smoothClosed(a.body);
  const body = sleeveOn ? body0 : op(body0, sleeve, PathOp.Difference);
  const little = smoothClosed(a.little, 0.5);
  const ring = smoothClosed(a.ring, 0.5);
  const middle = smoothClosed(a.middle, 0.5);
  const index = smoothClosed(a.index, 0.5);
  const behind = [ring, middle, index];
  const fingers = unionOf(little, ring, middle, index);
  const all = unionOf(body, fingers);
  const sec = POLE_END_LITTLE_SECTION;
  return {
    M,
    sleeveOn,
    sleeve,
    body,
    little,
    behind,
    fingers,
    all,
    near: tube(0, a1, POLE_R),
    nearSides: tubeSides(0, a1),
    nearEnd: ellipsePath({ c: poleEndLittleAxisAt(a1), rx: sec.rx, ry: sec.ry, rot: sec.rot }),
    far: tube(a0, 0, POLE_R),
    farSides: tubeSides(a0, 0),
    /** (poleLook 'boom') the scene pole's rim, tube and lit band over the near stretch. */
    nearBoom: [tube(0, a1, 15.5), tube(0, a1, 13.5), tube(0, a1, 3)] as const,
    /** A ring round the pole's section: the finger's inner side turning in toward the pole, in shade. */
    hug: ellipsePath({ c: sec.c, rx: sec.rx + 4.5, ry: sec.ry + 4.5, rot: sec.rot }),
    cuffOpening: ellipsePath(a.cuff),
    littleEdge: smoothOpen(a.littleEdge),
    behindEdges: a.behindEdges.map((e) => smoothOpen(e)),
    creases: many(a.creases.map(smoothOpen)),
    lights: relit(a.lights, M, 1).map(ellipsePath),
    darks: relit(a.darks, M, -1).map(ellipsePath),
    littleLights: many(relit(a.littleLights, M, 1).map(ellipsePath)),
    littleDarks: many(relit(a.littleDarks, M, -1).map(ellipsePath)),
    littleWarm: many(a.littleWarm.map(ellipsePath)),
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (the approved hands': one fixed span, every piece shares it — no seam). */
function HandFill({ path, M }: { path: SkPath; M: LightMap }) {
  const { HAND } = useLook();
  const c = { u: -14, v: 4 };
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

function EndLittlePaint({ B, poleLook }: { B: Built; poleLook: 'study' | 'boom' }) {
  const { MAT } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (the fingers behind, ring → index, each deeper in the shade of the one in front)
  const depthShade = [0.12, 0.28, 0.42];
  const front = [B.little, B.behind[0], B.behind[1]];
  return (
    <Group>
      {/* 0. THE FAR POLE (behind the whole fist: seen only beyond the index finger) */}
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
            <Path path={rimL(B.behind[i], i === 0 ? 2 : 1.3, M)} color={SKIN.rim} opacity={i === 0 ? 0.28 : 0.2}>
              <Blur mm={0.7} />
            </Path>
            {/* the finger in front: its soft contact shadow on this one */}
            <Path path={front[i]} style="stroke" strokeWidth={4} color={SKIN.deep} opacity={0.38}>
              <Blur mm={1.8} />
            </Path>
          </Group>
          <Path path={B.behindEdges[i]} style="stroke" strokeWidth={0.8} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.42} />
        </Group>
      ))}

      {/* 2. THE HAND'S BODY: the side of the hand, the heel, the wrist */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        {/* the forearm turning away from the light toward the elbow */}
        <Path path={B.body}>
          <LinearGradient start={vec(-50, 0)} end={vec(-110, 40)} colors={['rgba(52,26,16,0)', 'rgba(52,26,16,0.22)']} />
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
        {/* the little finger's soft shadow on the heel and the side of the hand */}
        <Group transform={off(M, 0.8, 1.6)}>
          <Path path={B.little} color={SKIN.deep} opacity={0.3}>
            <Blur mm={2.2} />
          </Path>
        </Group>
        <Path path={rimL(B.body, 2, M)} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 3. THE LITTLE FINGER (the nearest form): its soft shadow on the fingers behind, then the finger */}
      <Group clip={B.fingers}>
        <Group transform={off(M, 0.8, 1.4)}>
          <Path path={B.little} color="#1c0f09" opacity={0.3}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>
      <HandFill path={B.little} M={M} />
      <Group clip={B.little}>
        {/* the side of the finger turning in toward the pole: in shade along its inner side */}
        <Path path={B.hug} style="stroke" strokeWidth={9} color={SKIN.deep} opacity={0.3}>
          <Blur mm={2.6} />
        </Path>
        <Path path={B.littleLights} color={SKIN.rim} opacity={0.3}>
          <Blur mm={2} />
        </Path>
        <Path path={B.littleDarks} color={SKIN.deep} opacity={0.24}>
          <Blur mm={2} />
        </Path>
        <Path path={B.littleWarm} color={WARM} opacity={0.18}>
          <Blur mm={2.4} />
        </Path>
        <Path path={rimL(B.little, 1.7, M)} color={SKIN.rim} opacity={0.32}>
          <Blur mm={0.8} />
        </Path>
        <Path path={B.creases} style="stroke" strokeWidth={0.7} strokeCap="round" color={SKIN.deep} opacity={0.24}>
          <Blur mm={0.4} />
        </Path>
      </Group>
      <Path path={B.littleEdge} style="stroke" strokeWidth={0.85} strokeCap="round" strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* 4. THE NEAR POLE (in front of the hand): its soft shadow on the hand, then the pole */}
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

      {/* 5. THE CUFF AND SLEEVE: the near rim in front of the wrist */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(Lm.u < 0 ? -150 : -80, 0)} end={vec(Lm.u < 0 ? -80 : -150, 40)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

export type PoleHandEndLittleProps = {
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
export const POLE_HAND_END_LITTLE_CUFF: Pt = POLE_HAND_END_LITTLE.cuff.c;

/** The drawing's frame on the page: local (mm) → page. */
export function poleHandEndLittleToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandEndLittleProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
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
export function poleHandEndLittleAxisOnPage({ rot = 0, mirror = false }: Pick<PoleHandEndLittleProps, 'rot' | 'mirror'>): Pt {
  const T = poleHandEndLittleToPage({ x: 0, y: 0, s: 1, rot, mirror });
  return T(POLE_END_LITTLE_AXIS);
}

/** The hand's whole outline on the page (fingers, body; without its sleeve where `sleeve` is false). */
export function poleHandEndLittleOutline(o: Pick<PoleHandEndLittleProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_END_LITTLE, -1, 1, IDENTITY, o.sleeve ?? true);
  const p = B.all.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand on its pole seen along the pole from the little-finger end, for one cast member: drawn at (x, y) (pt —
 * the pole's axis where it enters the fist on the little-finger side), `s` pt per mm, turned `rot` radians. With
 * `mirror`, the left hand (seen from ITS little-finger end), re-lit.
 */
export function PoleHandEndLittle({ who, x, y, s, rot = 0, pole = [-260, 420], mirror = false, sleeve = true, poleLook = 'study', ownScale = true }: PoleHandEndLittleProps) {
  const B = useMemo(() => build(POLE_HAND_END_LITTLE, pole[0], pole[1], mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY, sleeve), [pole[0], pole[1], rot, mirror, sleeve]);
  const paint = <EndLittlePaint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
