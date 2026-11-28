/**
 * FIGURE V2 — A RIGHT HAND GRIPPING A HORIZONTAL POLE, SEEN FROM THE BACK OF THE HAND (owner 2026-11-24, "one
 * hand at a time": hand number two). The boom operator's near hand in the SIDE view the lessons use: the arm from
 * below, the pole (Ø 30 mm) held in the palm, which faces AWAY — so the pole lies behind the hand.
 *
 * AUTHORED 2-D ART, as the approved palm-side hand (poleHandFront.tsx): hand-placed points drawn as smooth closed
 * cubic curves, the same skin light, the same thin soft outline round the whole silhouette, soft form lights and
 * shadows, very few thin lines. No 3-D model. The two must look like the same hand seen from its two sides.
 *
 * Frame: millimetres, origin on the pole's axis under the middle of the fist, +x right, +y DOWN. A RIGHT hand seen
 * from its back with the fingers up has its THUMB on the viewer's LEFT.
 *
 * What the eye sees, bottom to top (round 2, coordinator 2026-11-24):
 *   1. the cuff, then the wrist from its back — ≈ 58 mm against the hand's ≈ 85: the hand's sides curve in to it;
 *      on the little-finger side (right) the edge runs fairly straight, then tucks in at the wrist bone (a hint);
 *   2. on the thumb side (left) the thumb's base: a rounded muscular bulge that continues the hand's outline — it
 *      swells out smoothly from the wrist, peaks a little below the pole, then turns in and up to go behind the
 *      pole's lower edge as the thumb's first segment, rounded like a finger, a soft shadow where it goes behind.
 *      ONE smooth convex curve: no corner, no notch, no straight edge; a soft light along its top and a gentle
 *      groove where it meets the back of the hand;
 *   3. the back of the hand: a broad, gently convex plane; four faint tendons fanning toward the knuckles (a hint);
 *   4. the knuckle row, at the pole's lower edge: four low rounded swells — the index's and the middle's clearly the
 *      larger, the middle's the highest, the little finger's the smallest and lowest — soft light on top of each,
 *      soft shade in the three valleys between and just below the row; no outlines, no circles;
 *   5. above them the fingers' first segments over the pole, ending in the rounded bends of their middle joints —
 *      the fist's top edge, the middle highest and widest, the little clearly the smallest; the creases between
 *      them dark wedges at the top, faded by the time they reach the pole;
 *   6. the pole BEHIND the hand, seen left and right of it, its top edge a little below the bends — passing
 *      THROUGH the closed fist, never in front of the knuckles.
 * Paint order: the pole → the hand (in front of it).
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, rimOf, smoothClosed, smoothOpen, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';

/* ── the art (pure: the tests read these points) ── */

const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });

/** The pole's radius (Ø 30 mm). */
export const POLE_R = 15;

/** The four fingers from the back, index on the thumb side (LEFT): their columns, each middle joint's bend (the
 *  fist's top edge) and each big knuckle (a low swell at the pole's lower edge) with its size, mm. */
export const BACK_FINGERS = [
  { name: 'index', L: -35.5, R: -17, top: -19, knuckle: P(-26, 10.4), kr: 7.2 },
  { name: 'middle', L: -17, R: 4, top: -21.2, knuckle: P(-6.4, 9.2), kr: 7.6 },
  { name: 'ring', L: 4, R: 21, top: -20, knuckle: P(12.6, 11), kr: 5.8 },
  { name: 'little', L: 21, R: 35, top: -17.4, knuckle: P(28.6, 14), kr: 4.6 },
] as const;

/**
 * THE HAND (in front of the pole): one outline — the wrist out of the cuff, the thumb's base swelling out and turning
 * in to go behind the pole's lower edge, the web over the pole up to the index's side, the four fingers' first
 * segments and their bends (the top edge), the little finger's side down past its knuckle, the hand's outer edge
 * tucking in at the wrist bone, the wrist into the cuff.
 */
const BODY = pts([
  // the wrist's left side (under the cuff → up)
  [-30.4, 112], [-30, 100], [-29.8, 88], [-30.6, 79],
  // the thumb's base: one smooth convex swell out from the wrist, peaking a little below the pole, turning in and up
  // to go behind the pole's lower edge
  [-33, 71.6], [-36.8, 64.4], [-40.4, 56.4], [-43.2, 47.8], [-44.8, 39], [-45.4, 31], [-45, 24.2], [-44, 19],
  // the web over the pole, up to the index's side
  [-42.4, 14.6], [-40, 10.8], [-37.6, 6.6],
  // the index's first segment, its bend
  [-36.4, 1], [-36, -6], [-35.5, -11.8], [-34.4, -15.8], [-31.6, -18.3], [-26.6, -19], [-21.6, -18.6], [-18.6, -17.1],
  [-17, -15.8],
  // the middle finger's bend (the highest, the widest)
  [-15.6, -18], [-12.8, -20.4], [-6.5, -21.2], [-0.4, -20.7], [2.6, -18.6],
  [4, -16.4],
  // the ring finger's bend
  [5.4, -18.6], [8.4, -19.7], [12.6, -20], [16.8, -19.3], [19.6, -17.6],
  [21, -15.9],
  // the little finger's bend (the smallest, the lowest), its outer side down past its knuckle
  [22.2, -16.6], [24.6, -17.3], [28, -17.4], [31.4, -16.4], [33.6, -13.8], [34.8, -8.4], [35.6, -1.4], [36.8, 5.4], [38, 11],
  // the hand's outer edge: fairly straight, then tucking in at the wrist bone (a hint)
  [38.8, 18], [39.2, 26], [39.2, 38], [38.4, 50], [36.6, 59], [33.8, 66], [31.6, 71], [30.8, 74.5], [28.6, 79], [27.6, 86], [27.4, 100], [27.6, 112],
]);

/** The notches between neighbouring bends (where the dark wedge sits). */
const NOTCHES: readonly Pt[] = [P(-17, -15.8), P(4, -16.4), P(21, -15.9)];
/** The thumb's long axis on the page (from the wrist's thumb side up to the pole's underside). */
const THUMB_AXIS = Math.atan2(20 - 68, -43 + 33);

/** The cuff (as the palm-side hand's: its near rim an arc convex upward, the sleeve down past the picture). */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 16): Poly {
  const out: Poly = [];
  for (let j = 0; j <= n; j++) {
    const t = from + ((to - from) * j) / n;
    out.push(P(cx + rx * Math.cos(t), cy + ry * Math.sin(t)));
  }
  return out;
}
const CUFF_C = P(-1.4, 100);
const CUFF_RX = 37;
const CUFF_RY = 6;
const SLEEVE: Poly = [...arc(CUFF_C.u, CUFF_C.v, CUFF_RX, CUFF_RY, Math.PI, 2 * Math.PI), P(36.6, 130), P(37.2, 170), P(-40.8, 170), P(-39.4, 130)];

/** A thin soft tendon line (an elongated ellipse) from `a` to `b`. */
const tendon = (a: Pt, b: Pt): Ellipse => ({ c: P((a.u + b.u) / 2, (a.v + b.v) / 2), rx: (Math.hypot(b.u - a.u, b.v - a.v) / 2) * 0.8, ry: 1.2, rot: Math.atan2(b.v - a.v, b.u - a.u) });

export type PoleHandBackArt = {
  body: Poly;
  notches: readonly Pt[];
  fingers: typeof BACK_FINGERS;
  sleeve: Poly;
  cuffSeam: Poly;
  /** Where the back of the hand meets the wrist (y, mm). */
  wristY: number;
  /** Where the thumb's base goes behind the pole's lower edge (its outer edge, local). */
  thumbAtPole: Pt;
  /** The bulge's widest point (the thumb's base, a little below the pole). */
  thumbPeak: Pt;
  /** The knuckle row: a soft light on top of each swell; soft shade in the valleys and just below. */
  knuckleLights: Ellipse[];
  knuckleDarks: Ellipse[];
  /** Very soft broad lights (the planes). */
  broad: Ellipse[];
  lights: Ellipse[];
  darks: Ellipse[];
  /** The tendons: a hint only. */
  tendons: Ellipse[];
  /** Soft gaps from each top notch down, faded by the pole's top half. */
  gaps: Poly[];
};

export const POLE_HAND_BACK: PoleHandBackArt = {
  body: BODY,
  notches: NOTCHES,
  fingers: BACK_FINGERS,
  sleeve: SLEEVE,
  cuffSeam: arc(CUFF_C.u, CUFF_C.v + 18, CUFF_RX + 0.6, CUFF_RY, Math.PI * 1.04, Math.PI * 1.96),
  wristY: 73,
  thumbAtPole: P(-42.6, POLE_R),
  thumbPeak: P(-45.4, 31),
  knuckleLights: BACK_FINGERS.map((f) => E(f.knuckle.u - 1.2, f.knuckle.v - f.kr * 0.3, f.kr * 0.86, f.kr * 0.55)),
  knuckleDarks: [
    // the three valleys between the knuckles
    E(-16.4, 12.6, 2.6, 4.6), E(3.2, 12.6, 2.4, 4.6), E(20.6, 14.2, 2.2, 4),
    // just below the row: each swell turning down into the back of the hand
    ...BACK_FINGERS.map((f) => E(f.knuckle.u + 0.8, f.knuckle.v + f.kr * 1.05, f.kr * 0.9, 1.9)),
  ],
  broad: [E(-4, 44, 24, 16), E(0, -6, 30, 6)],
  lights: [
    // each finger's bend at the top, lit from the upper left
    ...BACK_FINGERS.map((f) => E(f.L + (f.R - f.L) * 0.42, f.top + 3.2, (f.R - f.L) * 0.3, 2.2)),
    // each first segment's lit left side
    ...BACK_FINGERS.map((f) => E(f.L + 3, -4, 2.2, 8)),
    // the thumb's base: a soft light along its top (the outer, upper side of the bulge)
    { c: P(-41.6, 36), rx: 16, ry: 3.2, rot: THUMB_AXIS },
    // the wrist bone's small bump (a hint)
    E(30.4, 71, 2.4, 1.8),
  ],
  darks: [
    // each first segment's side away from the light
    ...BACK_FINGERS.map((f) => E(f.R - 2.4, -3, 2.2, 8.5)),
    // the gentle groove where the thumb's base meets the back of the hand (short, soft)
    { c: P(-35.2, 35), rx: 8, ry: 2.4, rot: THUMB_AXIS },
    // the soft shadow where the thumb goes behind the pole
    E(-41.6, 17.6, 4.2, 2.3, -0.4),
    // the hand's outer edge turning away; the wrist's side; just under the wrist bone
    E(36.4, 40, 3.6, 20), E(25.8, 88, 3, 9), E(28.6, 77, 2.6, 1.5),
    // the wrist going into the cuff
    E(-1.4, 95, 29, 2.4),
  ],
  tendons: [tendon(P(-9, 70), P(-24, 22)), tendon(P(-4, 70), P(-6, 20)), tendon(P(1, 70), P(12, 22)), tendon(P(6, 70), P(27, 24))],
  gaps: NOTCHES.map((n) => [P(n.u - 1.6, n.v - 1.2), P(n.u + 1.6, n.v - 1.2), P(n.u + 0.15, n.v + 10), P(n.u - 0.15, n.v + 10)]),
};

/**
 * THE LEFT HAND'S OWN SOFT LIGHTS AND SHADES (an option, 2026-11-24, "Boom side": the boom operator's near LEFT hand
 * seen from its back). Drawn mirrored, the art's own frame is lit from its upper RIGHT (the page's upper left), so every
 * soft light or shade that sits on one SIDE of a form is authored again for that light — the form-centred ones (the
 * knuckle valleys and the shade just below the row, the groove at the thumb's base, the shadow where the thumb goes
 * behind the pole, the wrist into the cuff) stay as they are:
 *   • each finger's bend lit on its corner toward the light, each first segment's lit side the right one, the far side
 *     the left; each knuckle's light a little to the right of its top;
 *   • the thumb's base (now on the side away from the light) keeps only a weaker light high on its top; its outer edge
 *     turns away into shade, and the little-finger edge (now toward the light) loses its shade;
 *   • the wrist's shaded side the thumb's side.
 */
const BACK_LEFT_SHADING: Pick<PoleHandBackArt, 'lights' | 'darks' | 'knuckleLights'> = {
  knuckleLights: BACK_FINGERS.map((f) => E(f.knuckle.u + 1.2, f.knuckle.v - f.kr * 0.3, f.kr * 0.86, f.kr * 0.55)),
  lights: [
    ...BACK_FINGERS.map((f) => E(f.L + (f.R - f.L) * 0.58, f.top + 3.2, (f.R - f.L) * 0.3, 2.2)),
    ...BACK_FINGERS.map((f) => E(f.R - 3, -4, 2.2, 8)),
    { c: P(-39.4, 30), rx: 11, ry: 2.4, rot: THUMB_AXIS },
    E(30.4, 71, 2.4, 1.8),
  ],
  darks: [
    ...BACK_FINGERS.map((f) => E(f.L + 2.4, -3, 2.2, 8.5)),
    { c: P(-35.2, 35), rx: 8, ry: 2.4, rot: THUMB_AXIS },
    E(-41.6, 17.6, 4.2, 2.3, -0.4),
    // (the thumb's base, its outer edge turning away from the light; the wrist's thumb side; just under the wrist bone)
    { c: P(-43.2, 42), rx: 3.4, ry: 16, rot: 0.2 },
    E(-28.4, 88, 3, 9),
    E(28.6, 77, 2.6, 1.5),
    E(-1.4, 95, 29, 2.4),
  ],
};

/* ── the paint ── */

const POLE_STOPS = ['#25282d', '#5d636c', '#b0b6bf', '#7b818a', '#555a62', '#3b3f46', '#222428'];
const POLE_POS = [0, 0.1, 0.22, 0.38, 0.62, 0.86, 1];

/** A light map as poleHandFront's (the page's directions into the art's frame); the identity is the approved drawing. */
type LightMap = { a: number; b: number; c: number; d: number };
const IDENTITY: LightMap = { a: 1, b: 0, c: 0, d: 1 };
const isId = (M: LightMap) => M.a === 1 && M.b === 0 && M.c === 0 && M.d === 1;
const mv = (M: LightMap, u: number, v: number): Pt => P(M.a * u + M.b * v, M.c * u + M.d * v);
/** The art's frame from the page's (rotation `rot`, mirrored or not): page = R(rot)·Mirror·local. */
function lightMapOf(rot: number, mirror: boolean): LightMap {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return { a: m * co, b: m * si, c: -si, d: co };
}
/** The lit edge of a mass for the light `M` brings (the approved rimOf where M is the identity). */
function rimL(path: SkPath, w: number, M: LightMap): SkPath {
  if (isId(M)) return rimOf(path, w);
  const L = mv(M, LIGHT.u, LIGHT.v);
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

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

function build(a0: PoleHandBackArt, x0: number, x1: number, M: LightMap = IDENTITY, sleeveOn = true, mirrored = false) {
  // (mirrored: the left hand's own authored soft lights and shades)
  const a = mirrored ? { ...a0, ...BACK_LEFT_SHADING } : a0;
  const body0 = smoothClosed(a.body);
  const sleevePath = smoothClosed(a.sleeve, 0.2);
  // (no sleeve of its own: the skin ends at the cuff's rim, where the figure's own sleeve takes the wrist)
  const body = sleeveOn ? body0 : op(body0, sleevePath, PathOp.Difference);
  const poleBoom = [15.5, 13.5, 3].map((h) => {
    const r = Skia.Path.Make();
    r.addRect(Skia.XYWHRect(x0, -h, x1 - x0, 2 * h));
    return r;
  }) as [SkPath, SkPath, SkPath];
  const pole = Skia.Path.Make();
  pole.addRect(Skia.XYWHRect(x0, -POLE_R, x1 - x0, POLE_R * 2));
  const poleEdges = Skia.Path.Make();
  poleEdges.moveTo(x0, -POLE_R);
  poleEdges.lineTo(x1, -POLE_R);
  poleEdges.moveTo(x0, POLE_R);
  poleEdges.lineTo(x1, POLE_R);
  return {
    body,
    M,
    sleeveOn,
    poleBoom,
    pole,
    poleEdges,
    wedges: many(a.notches.map((t) => polyPath([P(t.u - 2.2, t.v - 4.5), P(t.u + 2.2, t.v - 4.5), P(t.u + 0.3, t.v + 4), P(t.u - 0.3, t.v + 4)]))),
    gaps: many(a.gaps.map(polyPath)),
    sleeve: sleevePath,
    cuffRim: smoothOpen(a.sleeve.slice(0, 17)),
    cuffSeam: smoothOpen(a.cuffSeam),
    broad: many(a.broad.map(ellipsePath)),
    lights: many(a.lights.map(ellipsePath)),
    darks: many(a.darks.map(ellipsePath)),
    tendons: many(a.tendons.map(ellipsePath)),
    knuckleLights: many(a.knuckleLights.map(ellipsePath)),
    knuckleDarks: many(a.knuckleDarks.map(ellipsePath)),
  };
}
type Built = ReturnType<typeof build>;

/** The hand's one skin light (the palm-side hand's: one fixed span, every piece shares it — no seam). */
function HandFill({ path, M = IDENTITY }: { path: SkPath; M?: LightMap }) {
  const { HAND } = useLook();
  const c = { u: 0, v: 22 };
  const Ld = mv(M, -0.36, -0.93);
  const R = 68;
  return (
    <Path path={path}>
      <LinearGradient start={vec(c.u + Ld.u * R, c.v + Ld.v * R)} end={vec(c.u - Ld.u * R, c.v - Ld.v * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

function Paint({ B, poleLook = 'study' }: { B: Built; poleLook?: 'study' | 'boom' }) {
  const { MAT } = useLook();
  const SKIN = MAT.skin;
  const shirt = MAT.shirt;
  const M = B.M;
  const Lm = mv(M, LIGHT.u, LIGHT.v);
  // (the pole's lit side, and the sleeve's, toward the light)
  const litTop = Lm.v <= 0;
  const litLeft = Lm.u <= 0;
  const sh = mv(M, 1.6, 2.2);
  return (
    <Group>
      {/* 1. THE POLE (behind the hand), the hand's soft shadow on it at each side ('boom': the scene draws the pole
          whole outside the hand, and inside it the hand covers it — only the hand's shadow on it is painted here) */}
      {poleLook === 'boom' ? null : (
        <Group>
          <Path path={B.pole}>
            <LinearGradient start={vec(0, litTop ? -POLE_R : POLE_R)} end={vec(0, litTop ? POLE_R : -POLE_R)} colors={POLE_STOPS} positions={POLE_POS} />
          </Path>
          <Path path={B.poleEdges} style="stroke" strokeWidth={0.8} color="#0c0d10" opacity={0.7} />
        </Group>
      )}
      <Group clip={poleLook === 'boom' ? B.poleBoom[0] : B.pole}>
        <Path path={B.body} color="#000" opacity={0.4}>
          <Blur mm={1.8} />
        </Path>
        <Group transform={[{ translateX: sh.u }, { translateY: sh.v }]}>
          <Path path={B.body} color="#000" opacity={0.45}>
            <Blur mm={2} />
          </Path>
        </Group>
      </Group>

      {/* 2. THE HAND (in front of the pole) */}
      <HandFill path={B.body} M={M} />
      <Group clip={B.body}>
        <Path path={B.broad} color={SKIN.rim} opacity={0.12}>
          <Blur mm={5} />
        </Path>
        <Path path={B.tendons} color={SKIN.rim} opacity={0.05}>
          <Blur mm={1.2} />
        </Path>
        <Path path={B.lights} color={SKIN.rim} opacity={0.26}>
          <Blur mm={2} />
        </Path>
        <Path path={B.darks} color={SKIN.deep} opacity={0.28}>
          <Blur mm={2} />
        </Path>
        <Path path={B.knuckleLights} color={SKIN.rim} opacity={0.46}>
          <Blur mm={1.5} />
        </Path>
        <Path path={B.knuckleDarks} color={SKIN.deep} opacity={0.38}>
          <Blur mm={1.5} />
        </Path>
        <Path path={B.gaps} color={SKIN.deep} opacity={0.3}>
          <Blur mm={0.7} />
        </Path>
        <Path path={B.wedges} color={SKIN.deep} opacity={0.62}>
          <Blur mm={0.6} />
        </Path>
        <Path path={rimL(B.body, 2, M)} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
      </Group>
      {/* the thin soft outline round the whole silhouette (the approved hand's) */}
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />

      {/* the cuff over the wrist (none where the figure's own sleeve takes the wrist) */}
      {B.sleeveOn ? (
        <Group>
          <Path path={B.sleeve}>
            <LinearGradient start={vec(litLeft ? -40 : 37, 0)} end={vec(litLeft ? 37 : -40, 0)} colors={shirt.form} positions={shirt.pos} />
          </Path>
          <Group clip={B.sleeve}>
            <Path path={B.cuffSeam} style="stroke" strokeWidth={1.6} color={shirt.deep} opacity={0.18}>
              <Blur mm={1} />
            </Path>
            <Path path={B.cuffRim} style="stroke" strokeWidth={3} strokeCap="round" color={shirt.rim} opacity={0.18}>
              <Blur mm={1.2} />
            </Path>
          </Group>
          <Path path={B.sleeve} style="stroke" strokeWidth={0.9} strokeJoin="round" color={shirt.edge} opacity={0.4}>
            <Blur mm={0.35} />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

export type PoleHandBackProps = {
  /** The cast member (absent: the look already given round it, inside a figure). */
  who?: CastMember;
  x: number;
  y: number;
  s: number;
  rot?: number;
  pole?: [number, number];
  /** (option) the LEFT hand: the mirror image (thumb on the viewer's right), re-lit so the light stays upper left. */
  mirror?: boolean;
  /** (option, default true) false: no sleeve of its own — the skin ends at the cuff's rim (the figure's sleeve takes the wrist). */
  sleeve?: boolean;
  /** (option) 'boom': the pole is the scene's (drawn whole outside the hand); only the hand's soft shadow on it here. */
  poleLook?: 'study' | 'boom';
  /** (option, default true) false: keep the scene's own figure scale (the hand drawn inside a figure). */
  ownScale?: boolean;
};

/** Where the art's own cuff rim is (local mm): a figure's sleeve mouth goes here. */
export const POLE_HAND_BACK_CUFF = CUFF_C;

/** The art's frame on the page: local (mm) → page. */
export function poleHandBackToPage({ x, y, s, rot = 0, mirror = false }: Pick<PoleHandBackProps, 'x' | 'y' | 's' | 'rot' | 'mirror'>) {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  return (q: Pt): Pt => {
    const u = q.u * s * m;
    const v = q.v * s;
    return P(x + u * co - v * si, y + u * si + v * co);
  };
}

/** The hand's whole outline on the page (without its sleeve where `sleeve` is false). */
export function poleHandBackOutline(o: Pick<PoleHandBackProps, 'x' | 'y' | 's' | 'rot' | 'mirror' | 'sleeve'>): SkPath {
  const B = build(POLE_HAND_BACK, -60, 60, IDENTITY, o.sleeve ?? true);
  const p = B.body.copy();
  const mt = Skia.Matrix();
  mt.translate(o.x, o.y);
  mt.rotate(o.rot ?? 0);
  mt.scale(o.s * (o.mirror ? -1 : 1), o.s);
  p.transform(mt);
  return p;
}

/**
 * The right hand on its pole from the back: drawn at (x, y) (pt — the pole's axis under the middle of the fist), `s`
 * pt per mm, turned `rot` radians; the pole from `pole[0]` to `pole[1]` mm. With `mirror`, the left hand.
 */
export function PoleHandBack({ who, x, y, s, rot = 0, pole = [-120, 120], mirror = false, sleeve = true, poleLook = 'study', ownScale = true }: PoleHandBackProps) {
  const B = useMemo(() => build(POLE_HAND_BACK, pole[0], pole[1], mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY, sleeve, mirror), [pole[0], pole[1], rot, mirror, sleeve]);
  const paint = <Paint B={B} poleLook={poleLook} />;
  const art = who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{art}</FigureScale> : art}
    </Group>
  );
}
