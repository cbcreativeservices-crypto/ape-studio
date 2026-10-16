/**
 * THE LOW / COILED BRASS FAMILY — the look (charter §2 layer 3). Everything
 * is BUILT IN 3-D from the scene (lowBrassScene.ts) and projected into the
 * engine's two orthographic views — SIDE from the player's right (u = x,
 * v = y), TOP from above (u = x, v = z) — then painted far to near, so the
 * drawing sits exactly where the collisions and the zones are.
 *
 *   • brass tubing as lit cylinders (a dark contour, the body, a shade on the
 *     lower right and a highlight toward the upper-left light), the horn's
 *     three wraps of coil, slides, leadpipe and a silver mouthpiece;
 *   • the BELL as a true flare (rings of growing radius swept along its
 *     axis): its silhouette, a polished rim, and — where the opening faces
 *     the viewer — the dark throat inside; the horn's right hand cupped in it;
 *   • rotary valves (round casings, caps, levers) or pistons (casings,
 *     pearl finger buttons);
 *   • the seated player (a neutral lay figure; the shared figure head)
 *     and the chair, receding behind the instrument (charter §6).
 * Upper-left light, gradients and rim highlights (charter §3). Nothing moves
 * (D8). Labels never sit on the instrument: each one stands off to the side
 * with a leader to its part (labelLayout `at`).
 */
import { useMemo, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { Vec3, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { add, dot, scale, sub } from '../../../engine/geometry/vec.ts';
import { basis, brassScene, flareR, ring, type Bell, type BrassScene, type Tube, type Valve } from './lowBrassScene.ts';
import type { LowBrassSpec, Orient } from './lowBrassSpec.ts';
import { drawHand3, FIGURE_SKIN, FIGURE_TONES, FigureHead, FigureMass, headAbove, headProfile, intoCollar, limb as limbPath, Nails, splitArm, type GarmentBox, type HeadPaths } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';
import type { HandView } from '../players/handModel';
import { lowBrassHands, type PosedHand } from './lowBrassHands';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P2 = [number, number];
const make = () => Skia.Path.Make();

/* ── projection ── */
export const prj = (view: ViewId, p: Vec3): P2 => [p.x, view === 'side' ? p.y : p.z];
/** Nearer the camera = larger (side: +z toward the camera; top: up = −y). */
export const depthOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.z : -p.y);
const TO_VIEWER: Record<ViewId, Vec3> = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } };

/* ── palette ── */
const BRASS = { light: '#fff0b8', hi: '#f2cf6e', mid: '#c99634', low: '#8a5f17', dark: '#4a300a', edge: '#241604' };
const SILVER = { light: '#ffffff', hi: '#e6e9ee', mid: '#aeb4bd', low: '#6c727c', dark: '#3a3e45', edge: '#15171a' };
/** The hands and neck wear the shared figure skin, like the head (owner
 *  2026-10-08, HF1 — they were a grey neutral). */
const SKIN = FIGURE_SKIN.ramp;
const SKIN_EDGE = FIGURE_SKIN.edge;
const OUTLINE = '#08090b';
const CHAIR = ['#3a3c43', '#1d1e22', '#0c0c0e'];

/* ── 2-D helpers ── */
function poly(pts: P2[], close = true): SkPath {
  const p = make();
  pts.forEach(([u, w], i) => (i === 0 ? p.moveTo(u, w) : p.lineTo(u, w)));
  if (close) p.close();
  return p;
}
function hull(pts: P2[]): P2[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of s) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const hi: P2[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const q = s[i];
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}
function circ(c: P2, r: number, n = 18): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < n; i++) out.push([c[0] + r * Math.cos((i / n) * 2 * Math.PI), c[1] + r * Math.sin((i / n) * 2 * Math.PI)]);
  return out;
}
function bbox(pts: P2[]) {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const [u, w] of pts) {
    if (u < u0) u0 = u;
    if (w < v0) v0 = w;
    if (u > u1) u1 = u;
    if (w > v1) v1 = w;
  }
  return { u0, v0, u1, v1 };
}
function union(paths: SkPath[]): SkPath {
  let out: SkPath | null = null;
  for (const p of paths) out = out ? Skia.Path.MakeFromOp(out, p, PathOp.Union) ?? out : p;
  return out ?? make();
}
/** A tapered limb: the hull of two circles. */
const limbPts = (a: P2, b: P2, ra: number, rb: number) => hull([...circ(a, ra), ...circ(b, rb)]);

/* ── the paint list ── */
type Item = { key: string; depth: number; node: ReactNode };

/** A lit, filled shape: gradient from the upper left, a rim light, a contour. */
function Lit({ path, pts, ramp, edge = OUTLINE, rim = 2.2, w = 1.6 }: { path: SkPath; pts: P2[]; ramp: string[]; edge?: string; rim?: number; w?: number }) {
  const b = bbox(pts);
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(b.u0, b.v0)} end={vec(b.u1, b.v1)} colors={ramp} />
      </Path>
      <Group clip={path}>
        <Group transform={[{ translateX: -rim * 0.8 }, { translateY: -rim }]}>
          <Path path={path} style="stroke" strokeWidth={rim * 2} color="#fff6e0" opacity={0.3} />
        </Group>
      </Group>
      <Path path={path} style="stroke" strokeWidth={w} color={edge} strokeJoin="round" />
    </Group>
  );
}

/** A brass (or silver) tube along projected points: a lit cylinder. */
function TubeArt({ path, r, tone, cap = 'round' }: { path: SkPath; r: number; tone: typeof BRASS; cap?: 'round' | 'butt' }) {
  return (
    <Group>
      <Path path={path} style="stroke" strokeWidth={2 * r + 3} color={tone.edge} strokeCap={cap} strokeJoin="round" />
      <Path path={path} style="stroke" strokeWidth={2 * r} color={tone.mid} strokeCap={cap} strokeJoin="round" />
      <Group transform={[{ translateX: r * 0.32 }, { translateY: r * 0.36 }]}>
        <Path path={path} style="stroke" strokeWidth={r * 0.9} color={tone.low} opacity={0.75} strokeCap="round" strokeJoin="round" />
      </Group>
      <Group transform={[{ translateX: -r * 0.3 }, { translateY: -r * 0.34 }]}>
        <Path path={path} style="stroke" strokeWidth={Math.max(1.4, r * 0.42)} color={tone.hi} opacity={0.95} strokeCap="round" strokeJoin="round" />
      </Group>
      <Group transform={[{ translateX: -r * 0.42 }, { translateY: -r * 0.46 }]}>
        <Path path={path} style="stroke" strokeWidth={Math.max(0.8, r * 0.14)} color={tone.light} opacity={0.9} strokeCap="round" strokeJoin="round" />
      </Group>
    </Group>
  );
}

/**
 * A CONICAL tube (its drawn radius growing from rr[0] to rr[1] along its
 * length): the true outline, offset from the projected centre line by the
 * radius at each point, cut into short pieces that each carry their own
 * form gradient across the tube (lit from the upper left), a contour, a
 * lower shade and a specular line, so a widening branch reads as one
 * smooth, round piece of metal.
 */
function coneItems(t: Tube, view: ViewId, tone: typeof BRASS): Item[] {
  const rr = t.rr!;
  const P = t.pts.map((p) => prj(view, p));
  // Radius by the 3-D arc length (the true taper, whatever the view).
  const acc = [0];
  for (let i = 1; i < t.pts.length; i++) acc.push(acc[i - 1] + Math.hypot(t.pts[i].x - t.pts[i - 1].x, t.pts[i].y - t.pts[i - 1].y, t.pts[i].z - t.pts[i - 1].z));
  const total = acc[acc.length - 1] || 1;
  const rAt = (i: number) => rr[0] + (rr[1] - rr[0]) * (acc[i] / total);
  let last: P2 = [0, -1];
  const nrm = P.map((_, i) => {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(P.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    if (l < 0.5) return last;
    last = [-dy / l, dx / l];
    return last;
  });
  const L: P2[] = P.map((c, i) => [c[0] + nrm[i][0] * rAt(i), c[1] + nrm[i][1] * rAt(i)]);
  const R: P2[] = P.map((c, i) => [c[0] - nrm[i][0] * rAt(i), c[1] - nrm[i][1] * rAt(i)]);
  const out: Item[] = [];
  const per = 3;
  for (let i0 = 0; i0 < P.length - 1; i0 += per) {
    const i1 = Math.min(P.length - 1, i0 + per);
    const poly4: P2[] = [...L.slice(i0, i1 + 1), ...R.slice(i0, i1 + 1).reverse()];
    // Round joints between pieces: the end discs (seen side-on they hide in the body).
    const im = Math.floor((i0 + i1) / 2);
    const c = P[im];
    let n2 = nrm[im];
    if (n2[0] + n2[1] > 0) n2 = [-n2[0], -n2[1]]; // toward the upper-left light
    const r = rAt(im);
    const path = poly(poly4);
    const disc = poly(circ(P[i1], rAt(i1) * 0.97, 20));
    const body = union([path, disc]);
    const mid3 = t.pts[im];
    const a: P2 = [c[0] + n2[0] * r, c[1] + n2[1] * r];
    const b: P2 = [c[0] - n2[0] * r, c[1] - n2[1] * r];
    const spec0 = make();
    const spec1 = make();
    const shade = make();
    // The contour: the two long sides only (a seam line across the joints
    // between pieces would read as a ring that is not on the metal).
    const sides = make();
    L.slice(i0, i1 + 1).forEach((q, j) => (j === 0 ? sides.moveTo(q[0], q[1]) : sides.lineTo(q[0], q[1])));
    R.slice(i0, i1 + 1).forEach((q, j) => (j === 0 ? sides.moveTo(q[0], q[1]) : sides.lineTo(q[0], q[1])));
    // One lit side for the whole piece (a per-point flip at a bend drew a
    // stray highlight across the tube).
    const sg = nrm[im][0] + nrm[im][1] > 0 ? -1 : 1;
    for (let i = i0; i <= i1; i++) {
      const m: P2 = [nrm[i][0] * sg, nrm[i][1] * sg];
      const q = rAt(i);
      const s1: P2 = [P[i][0] + m[0] * q * 0.52, P[i][1] + m[1] * q * 0.52];
      const s2: P2 = [P[i][0] + m[0] * q * 0.74, P[i][1] + m[1] * q * 0.74];
      const sh: P2 = [P[i][0] - m[0] * q * 0.62, P[i][1] - m[1] * q * 0.62];
      if (i === i0) {
        spec0.moveTo(s1[0], s1[1]);
        spec1.moveTo(s2[0], s2[1]);
        shade.moveTo(sh[0], sh[1]);
      } else {
        spec0.lineTo(s1[0], s1[1]);
        spec1.lineTo(s2[0], s2[1]);
        shade.lineTo(sh[0], sh[1]);
      }
    }
    out.push({
      key: `${t.id}:c${i0}`,
      depth: depthOf(view, mid3),
      node: (
        <Group key={`${t.id}:c${i0}`}>
          <Path path={body}>
            <LinearGradient start={vec(a[0], a[1])} end={vec(b[0], b[1])} colors={[tone.light, tone.hi, tone.mid, tone.low, tone.dark, tone.low]} positions={[0, 0.16, 0.42, 0.74, 0.93, 1]} />
          </Path>
          <Group clip={body}>
            <Path path={shade} style="stroke" strokeWidth={Math.max(1.5, r * 0.34)} color={tone.dark} opacity={0.32} strokeCap="round" strokeJoin="round" />
            <Path path={spec0} style="stroke" strokeWidth={Math.max(1.2, r * 0.16)} color={tone.light} opacity={0.85} strokeCap="round" strokeJoin="round" />
            <Path path={spec1} style="stroke" strokeWidth={Math.max(0.8, r * 0.06)} color="#ffffff" opacity={0.55} strokeCap="round" strokeJoin="round" />
          </Group>
          <Path path={sides} style="stroke" strokeWidth={2.2} color={tone.edge} strokeJoin="round" strokeCap="round" />
        </Group>
      ),
    });
  }
  return out;
}

/**
 * The MOUTHPIECE, turned silver-plate: the rim (its outer edge the widest
 * part), the cup's outside closing in like a bowl, the throat, and the
 * shank tapering slightly to the receiver. Real-world: a tuba mouthpiece
 * about dia. 46 mm across the rim by 95 mm long; a horn's about 25 x 80 mm.
 * The exterior radius along its length, as fractions of the rim radius.
 */
const MP_PROFILE: readonly [number, number][] = [
  [0, 0.94],
  [0.025, 1],
  [0.07, 0.97],
  [0.16, 0.8],
  [0.28, 0.56],
  [0.38, 0.47],
  [0.55, 0.45],
  [1, 0.38],
];
function mouthpieceItems(t: Tube, view: ViewId, rimR: number): Item[] {
  const a3 = t.pts[0];
  const b3 = t.pts[t.pts.length - 1];
  const pts: Vec3[] = [];
  const radii: number[] = [];
  for (const [f, k] of MP_PROFILE) {
    pts.push(add(a3, scale(sub(b3, a3), f)));
    radii.push(rimR * k);
  }
  const P = pts.map((p) => prj(view, p));
  const dx = P[P.length - 1][0] - P[0][0];
  const dy = P[P.length - 1][1] - P[0][1];
  const l = Math.hypot(dx, dy) || 1;
  const n: P2 = [-dy / l, dx / l];
  const L: P2[] = P.map((c, i) => [c[0] + n[0] * radii[i], c[1] + n[1] * radii[i]]);
  const R: P2[] = P.map((c, i) => [c[0] - n[0] * radii[i], c[1] - n[1] * radii[i]]);
  const outline = poly([...L, ...R.reverse()]);
  const lit: P2 = n[0] + n[1] > 0 ? [-n[0], -n[1]] : n;
  const c = P[3];
  const ga: P2 = [c[0] + lit[0] * rimR, c[1] + lit[1] * rimR];
  const gb: P2 = [c[0] - lit[0] * rimR, c[1] - lit[1] * rimR];
  // The rim's edge: a bright band across the lip end.
  const rimBand = poly([L[0], L[2], R[R.length - 3], R[R.length - 1]]);
  const spec = make();
  P.forEach((q, i) => {
    const s: P2 = [q[0] + lit[0] * radii[i] * 0.5, q[1] + lit[1] * radii[i] * 0.5];
    if (i === 0) spec.moveTo(s[0], s[1]);
    else spec.lineTo(s[0], s[1]);
  });
  return [
    {
      key: `${t.id}`,
      depth: depthOf(view, scale(add(a3, b3), 0.5)),
      node: (
        <Group key={t.id}>
          <Path path={outline}>
            <LinearGradient start={vec(ga[0], ga[1])} end={vec(gb[0], gb[1])} colors={[SILVER.light, SILVER.hi, SILVER.mid, SILVER.low, SILVER.dark]} positions={[0, 0.2, 0.5, 0.8, 1]} />
          </Path>
          <Path path={rimBand} color="#ffffff" opacity={0.35} />
          <Path path={spec} style="stroke" strokeWidth={Math.max(0.8, rimR * 0.12)} color="#ffffff" opacity={0.85} strokeCap="round" />
          <Path path={outline} style="stroke" strokeWidth={1.4} color={SILVER.edge} strokeJoin="round" />
        </Group>
      ),
    },
  ];
}

function tubeItems(t: Tube, view: ViewId, s?: BrassScene): Item[] {
  if (t.draw === false) return [];
  const tone = t.tone === 'silver' ? SILVER : BRASS;
  if ((t.id === 'mouthpiece' || t.id === 'mpArt') && s) return mouthpieceItems(t, view, s.spec.id === 'horn' ? 12.5 : s.spec.id === 'tuba' ? 23 : 19);
  if (t.rr) return coneItems(t, view, tone);
  // A leadpipe widens from the mouthpiece receiver.
  if (t.id === 'leadpipe') return coneItems({ ...t, rr: [t.r * 0.62, t.r] }, view, tone);
  // Long tubes are cut into runs so each run sorts at its own depth (a coil
  // passes behind and in front of the valves).
  const run = 14;
  const out: Item[] = [];
  const closed = t.pts.length > 3 && Math.hypot(t.pts[0].x - t.pts[t.pts.length - 1].x, t.pts[0].y - t.pts[t.pts.length - 1].y, t.pts[0].z - t.pts[t.pts.length - 1].z) < 1;
  const single = t.pts.length - 1 <= run;
  for (let i0 = 0; i0 < t.pts.length - 1; i0 += run) {
    // Runs overlap their neighbours by a sample and meet with BUTT ends, so
    // a joint never shows a bead or a ring (only a tube's free ends are round).
    const j0 = Math.max(0, i0 - 1);
    const seg = t.pts.slice(j0, Math.min(t.pts.length, i0 + run + 2));
    const path = poly(seg.map((p) => prj(view, p)), false);
    const c = seg.reduce((a, p) => add(a, p), { x: 0, y: 0, z: 0 });
    out.push({ key: `${t.id}:${i0}`, depth: depthOf(view, scale(c, 1 / seg.length)), node: <TubeArt path={path} r={t.r} tone={tone} cap={single && !closed ? 'round' : 'butt'} /> });
  }
  return out;
}

/** The bell's rings (throat → rim), projected. */
function bellRings(b: Bell, view: ViewId, n = 16): P2[][] {
  const [e1, e2] = basis(b.axis, Math.abs(b.axis.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: -1, z: 0 });
  const out: P2[][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const c = add(b.throat, scale(sub(b.rim, b.throat), t));
    out.push(ring(c, e1, e2, flareR(b, t), 0, 2 * Math.PI, 40).map((p) => prj(view, p)));
  }
  return out;
}

export function bellPaths(b: Bell, view: ViewId) {
  const rings = bellRings(b, view);
  const parts: SkPath[] = [];
  for (let i = 0; i < rings.length - 1; i++) parts.push(poly(hull([...rings[i], ...rings[i + 1]])));
  const body = union(parts);
  const rim = rings[rings.length - 1];
  const inner = bellRings({ ...b, rim: sub(b.rim, scale(b.axis, b.R * 0.45)), R: b.R * 0.55 }, view, 1)[1];
  return { body, bodyPts: rings.flat(), rim: poly(rim), rimPts: rim, inner: poly(inner) };
}

/** The posed hand in the bell, drawn (drawHand3). */
type HandPaint = { path: SkPath; lines: SkPath; nails: SkPath };

function BellArt({ b, view, hand }: { b: Bell; view: ViewId; hand: HandPaint | null }) {
  const p = useMemo(() => bellPaths(b, view), [b, view]);
  const facing = dot(b.axis, TO_VIEWER[view]);
  const rb = bbox(p.rimPts);
  return (
    <Group>
      <Lit path={p.body} pts={p.bodyPts} ramp={[BRASS.light, BRASS.hi, BRASS.mid, BRASS.low, BRASS.dark]} edge={BRASS.edge} rim={3} w={2} />
      {facing > 0.05 ? (
        <Group>
          <Path path={p.rim}>
            <RadialGradient c={vec((rb.u0 + rb.u1) / 2, (rb.v0 + rb.v1) / 2)} r={Math.max(rb.u1 - rb.u0, rb.v1 - rb.v0) * 0.55} colors={['#0d0702', '#2a1a06', '#6e4a14', '#b88a2e']} positions={[0, 0.45, 0.82, 1]} />
          </Path>
          <Path path={p.inner} style="stroke" strokeWidth={2} color="#c99634" opacity={0.25} />
          {hand ? (
            // The right hand cupped in the bell (figure pass 3): seen through
            // the opening only.
            <Group clip={p.rim}>
              <FigureMass path={hand.path} tone="skin" contour={1.8} />
              <Path path={hand.lines} style="stroke" strokeWidth={1.7} strokeCap="round" color={SKIN_EDGE} opacity={0.7} />
              <Nails path={hand.nails} />
            </Group>
          ) : null}
        </Group>
      ) : null}
      {/* The rim's bead: a thin rolled wire edge (about 5 mm), not a band. */}
      <Path path={p.rim} style="stroke" strokeWidth={6} color={BRASS.edge} />
      <Path path={p.rim} style="stroke" strokeWidth={3.8} color={BRASS.hi} />
      <Group transform={[{ translateX: -0.8 }, { translateY: -1 }]}>
        <Path path={p.rim} style="stroke" strokeWidth={1.2} color={BRASS.light} opacity={0.95} />
      </Group>
    </Group>
  );
}
const sub2 = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];

function valveItems(vl: Valve, view: ViewId, i: number): Item[] {
  const [e1, e2] = basis(vl.axis, Math.abs(vl.axis.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: -1, z: 0 });
  const a = sub(vl.c, scale(vl.axis, vl.h / 2));
  const b = add(vl.c, scale(vl.axis, vl.h / 2));
  const ra = ring(a, e1, e2, vl.r, 0, 2 * Math.PI, 28).map((p) => prj(view, p));
  const rb = ring(b, e1, e2, vl.r, 0, 2 * Math.PI, 28).map((p) => prj(view, p));
  const casingPts = hull([...ra, ...rb]);
  const casing = poly(casingPts);
  // The end nearer the viewer shows its cap.
  const near = dot(vl.axis, TO_VIEWER[view]) >= 0 ? rb : ra;
  const cap = poly(near);
  // The casing lit ACROSS its axis (a cylinder), not corner to corner.
  const ax2 = sub2(prj(view, b), prj(view, a));
  const axl = Math.hypot(ax2[0], ax2[1]);
  const acr: P2 = axl > 1 ? [-ax2[1] / axl, ax2[0] / axl] : [1, 0];
  const lit: P2 = acr[0] + acr[1] > 0 ? [-acr[0], -acr[1]] : acr;
  const cc = prj(view, vl.c);
  /** A band round the casing at axis offsets d0..d1 (a cap or a ring). */
  const band = (d0: number, d1: number, dr: number) =>
    hull([...ring(add(vl.c, scale(vl.axis, d0)), e1, e2, vl.r + dr, 0, 2 * Math.PI, 24), ...ring(add(vl.c, scale(vl.axis, d1)), e1, e2, vl.r + dr, 0, 2 * Math.PI, 24)].map((p) => prj(view, p)));
  const caps: P2[][] = vl.kind === 'piston' ? [band(-vl.h / 2 - 2, -vl.h / 2 + 9, 2.6), band(vl.h / 2 - 9, vl.h / 2 + 2, 2.6), band(-vl.h * 0.16, -vl.h * 0.16 + 5, 1.2)] : [band(-vl.h / 2, -vl.h / 2 + 7, 2)];
  const nodes: ReactNode[] = [
    <Group key="casing">
      <Path path={casing}>
        <LinearGradient start={vec(cc[0] + lit[0] * vl.r, cc[1] + lit[1] * vl.r)} end={vec(cc[0] - lit[0] * vl.r, cc[1] - lit[1] * vl.r)} colors={[BRASS.light, BRASS.hi, BRASS.mid, BRASS.low, BRASS.dark, BRASS.low]} positions={[0, 0.16, 0.42, 0.74, 0.93, 1]} />
      </Path>
      <Path path={casing} style="stroke" strokeWidth={1.6} color={BRASS.edge} strokeJoin="round" />
      {caps.map((cp, j) => (
        <Group key={j}>
          <Path path={poly(cp)}>
            <LinearGradient start={vec(cc[0] + lit[0] * (vl.r + 3), cc[1] + lit[1] * (vl.r + 3))} end={vec(cc[0] - lit[0] * (vl.r + 3), cc[1] - lit[1] * (vl.r + 3))} colors={[BRASS.light, BRASS.hi, BRASS.mid, BRASS.low, BRASS.dark]} positions={[0, 0.2, 0.5, 0.82, 1]} />
          </Path>
          <Path path={poly(cp)} style="stroke" strokeWidth={1.1} color={BRASS.edge} strokeJoin="round" />
        </Group>
      ))}
    </Group>,
    vl.kind === 'rotary' ? (
      // A rotary valve's back cap (real-world: about dia. 40 mm): a domed
      // brass cap with its turned ring and centre screw, and the rotor's
      // STOP ARM swinging between two cork bumpers.
      <Group key="cap">
        <Path path={cap}>
          <RadialGradient c={vec(cc[0] - vl.r * 0.35, cc[1] - vl.r * 0.35)} r={vl.r * 1.5} colors={[BRASS.light, BRASS.hi, BRASS.mid, BRASS.low]} />
        </Path>
        <Path path={cap} style="stroke" strokeWidth={1.4} color={BRASS.edge} />
        <Path path={poly(ring(add(vl.c, scale(vl.axis, vl.h / 2 + 1)), e1, e2, vl.r * 0.62, 0, 2 * Math.PI, 24).map((p) => prj(view, p)))} style="stroke" strokeWidth={1.1} color={BRASS.low} opacity={0.9} />
        <Path path={poly(circ(cc, 2.6, 10))} color={SILVER.mid} />
        <Path path={poly([cc, [cc[0] + vl.r * 0.62, cc[1] - vl.r * 0.55]], false)} style="stroke" strokeWidth={4.2} color={SILVER.edge} strokeCap="round" />
        <Path path={poly([cc, [cc[0] + vl.r * 0.62, cc[1] - vl.r * 0.55]], false)} style="stroke" strokeWidth={2.4} color={SILVER.hi} strokeCap="round" />
        <Path path={poly(circ([cc[0] + vl.r * 0.95, cc[1] - vl.r * 0.2], 3.4, 10))} color="#b98b5c" />
        <Path path={poly(circ([cc[0] + vl.r * 0.2, cc[1] - vl.r * 0.95], 3.4, 10))} color="#b98b5c" />
      </Group>
    ) : (
      <Group key="cap">
        <Path path={cap}>
          <LinearGradient start={vec(bbox(near).u0, bbox(near).v0)} end={vec(bbox(near).u1, bbox(near).v1)} colors={[SILVER.light, SILVER.mid, SILVER.low]} />
        </Path>
        <Path path={cap} style="stroke" strokeWidth={1.4} color={SILVER.edge} />
      </Group>
    ),
  ];
  if (vl.kind === 'piston') {
    // The finger button on its stem, above the casing.
    // (The axis points OUT of the casing's top: the stem and the pearl
    // finger button stand above the top cap, real-world a button about
    // dia. 24 mm on a stem about 25 mm.)
    const stemA = prj(view, add(vl.c, scale(vl.axis, vl.h / 2)));
    const stemB = prj(view, add(vl.c, scale(vl.axis, vl.h / 2 + 26)));
    const button = ring(add(vl.c, scale(vl.axis, vl.h / 2 + 34)), e1, e2, vl.r * 0.8, 0, 2 * Math.PI, 24).map((p) => prj(view, p));
    const bh = hull([...button, ...ring(add(vl.c, scale(vl.axis, vl.h / 2 + 25)), e1, e2, vl.r * 0.8, 0, 2 * Math.PI, 24).map((p) => prj(view, p))]);
    nodes.push(
      <Group key="button">
        <Path path={poly([stemA, stemB], false)} style="stroke" strokeWidth={6} color={SILVER.mid} strokeCap="round" />
        <Lit path={poly(bh)} pts={bh} ramp={['#fffaf0', '#e9dfcc', '#b6a88f']} edge="#3b352a" />
      </Group>,
    );
  } else if (vl.lever) {
    const l0 = prj(view, vl.c);
    const l1 = prj(view, add(vl.c, vl.lever));
    // The key lever: a thin rod out to the left hand's flat finger spatula.
    const dl = Math.hypot(l1[0] - l0[0], l1[1] - l0[1]) || 1;
    const ang = Math.atan2(l1[1] - l0[1], l1[0] - l0[0]);
    const pad: P2[] = [];
    for (let k = 0; k < 16; k++) {
      const t2 = (k / 16) * Math.PI * 2;
      const x = Math.cos(t2) * 9;
      const y = Math.sin(t2) * 5;
      pad.push([l1[0] + x * Math.cos(ang) - y * Math.sin(ang), l1[1] + x * Math.sin(ang) + y * Math.cos(ang)]);
    }
    void dl;
    nodes.push(
      <Path key="lever" path={poly([l0, l1], false)} style="stroke" strokeWidth={4.4} color={BRASS.edge} strokeCap="round" />,
      <Path key="lever2" path={poly([l0, l1], false)} style="stroke" strokeWidth={2.6} color={BRASS.hi} strokeCap="round" />,
      <Lit key="pad" path={poly(pad)} pts={pad} ramp={[BRASS.light, BRASS.hi, BRASS.mid, BRASS.low]} edge={BRASS.edge} w={1.1} rim={1.2} />,
    );
  }
  return [{ key: `valve${i}`, depth: depthOf(view, vl.c) + 4, node: <Group key={`valve${i}`}>{nodes}</Group> }];
}

/* ── THE SEATED PLAYER'S BODY IN PROFILE (figure pass 2, owner 2026-10-15) ──
 * The house profile (PlayerFigure.buildSide's shaping) built from this
 * family's own joints, so the low-brass player wears the same body as every
 * other lab figure: a real torso — the collar, the chest forward of the
 * waist, a healthy straight back with a gentle lumbar hollow, the shirt
 * tucked in at the belt — the pelvis in the trousers joined to the near leg
 * (thigh → knee → shin → ankle as one mass), shoes flat on the floor, the
 * neck going INTO the collar (intoCollar), and the near sleeve's DELTOID
 * grown out of the shirt with no outline or rim at the join (`quiet`).
 * Drawing only: no joint moves; the solids keep the scene's numbers. */

/** An open smooth stroke through points. */
function smoothOpen(pts: P2[]): SkPath {
  const p = make();
  const n = pts.length;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = 1 / 6;
    p.cubicTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  return p;
}

/** The joints a profile body is drawn from (the view's mm). N = the near
 *  side (toward the viewer), F = the far side. */
type ProfileJoints = {
  neck: P2;
  /** The hips' midpoint. */
  hip: P2;
  shoulderN: P2;
  hipN: P2;
  kneeN: P2;
  ankleN: P2;
  hipF: P2;
  kneeF: P2;
  ankleF: P2;
  /** The floor's v. */
  floorV: number;
  /** Where the lips meet the mouthpiece's rim: the profile head is placed so
   *  its lips are there (the head joint's solid is unchanged). */
  lips: P2;
  /** +1 the figure faces +u. */
  facing: 1 | -1;
  seated: boolean;
};

type ProfileBody = {
  /** The shirt (the torso above the belt). */
  shirt: SkPath;
  /** The whole torso outline (for the collar and the deltoid). */
  torso: SkPath;
  /** The pelvis in the trousers joined to the near leg. */
  legNear: SkPath;
  legFar: SkPath;
  shoeNear: SkPath;
  shoeFar: SkPath;
  belt: SkPath;
  collar: SkPath;
  head: HeadPaths;
  /** The near sleeve's deltoid along the upper arm toward `elbow`, inside the
   *  shirt's outline. */
  deltoid: (elbow: P2) => SkPath;
  /** Where the sleeve melts into the shirt (no rim, no contour). */
  quiet: SkPath | null;
  /** Where the sleeve's edge over the shirt is only a soft fold. */
  soft: SkPath | null;
};

/** The house adult head (≈ 228 mm tall: BODY.headH). */
const PROFILE_HEAD_R = 112;

/** The profile body (PlayerFigure.buildSide's shaping, from these joints). */
function profileBody(j: ProfileJoints): ProfileBody {
  const f = j.facing;
  const n = j.neck;
  const hip = j.hip;
  const ax = Math.atan2(n[1] - hip[1], n[0] - hip[0]);
  let nu = -Math.sin(ax);
  let nv = Math.cos(ax);
  if (Math.sign(nu || f) !== Math.sign(f)) {
    nu = -nu;
    nv = -nv;
  }
  const along = (t: number, fwd: number): P2 => [hip[0] + (n[0] - hip[0]) * t + nu * fwd, hip[1] + (n[1] - hip[1]) * t + nv * fwd];
  const torso = smoothClosed([
    along(1.02, 46), // the front of the collar
    along(0.86, 104), // the chest
    along(0.6, 112),
    along(0.32, 96), // the belly
    along(0.06, 104),
    along(-0.1, 40),
    along(-0.06, -112), // the seat
    along(0.24, -90), // the lumbar hollow
    along(0.45, -98),
    along(0.7, -100), // the shoulder blade
    along(0.9, -82),
    along(1.02, -52), // the nape
  ]);
  const foot = (a: P2): P2 => [a[0] + f * 40, j.floorV];
  const kneeR = j.seated ? 60 : 56;
  const leg = (h: P2, k: P2, a: P2) => limbPath([pt(h[0], h[1]), pt(k[0], k[1]), pt(a[0], a[1])], [82, kneeR, 38]);
  const pelvis = smoothClosed([along(0.15, 92), along(0.02, 88), along(-0.1, 80), along(-0.17, 20), along(-0.16, -64), along(-0.06, -106), along(0.06, -112), along(0.15, -100)]);
  const legNear = union([pelvis, leg(j.hipN, j.kneeN, j.ankleN)]);
  const legFar = leg(j.hipF, j.kneeF, j.ankleF);
  // Shoes in profile: the heel behind the ankle, the sole flat on the floor.
  const shoe = (a: P2) => {
    const ft = foot(a);
    return smoothClosed([
      [ft[0] - f * 96, ft[1] - 2],
      [ft[0] - f * 100, ft[1] - 64],
      [ft[0] - f * 44, ft[1] - 92],
      [ft[0] + f * 40, ft[1] - 62],
      [ft[0] + f * 140, ft[1] - 34],
      [ft[0] + f * 150, ft[1] - 4],
    ]);
  };
  // The belt across the waist; the shirt tucked in below it.
  const quad = (a: P2, b: P2, c: P2, d: P2) => poly([a, b, c, d]);
  const b0 = along(0.12, 160);
  const b1 = along(0.12, -160);
  const th = Math.atan2(b1[1] - b0[1], b1[0] - b0[0]);
  const ox = -Math.sin(th) * 16;
  const oy = Math.cos(th) * 16;
  const band = quad([b0[0] + ox, b0[1] + oy], [b1[0] + ox, b1[1] + oy], [b1[0] - ox, b1[1] - oy], [b0[0] - ox, b0[1] - oy]);
  const belt = Skia.Path.MakeFromOp(band, torso, PathOp.Intersect) ?? band;
  const tuck = quad(along(0.12, 400), along(0.12, -400), along(-3, -400), along(-3, 400));
  const shirt = Skia.Path.MakeFromOp(torso, tuck, PathOp.Difference) ?? torso;
  const collar = smoothOpen([along(1.04, -40), along(0.98, 10), along(1.0, 50)]);
  // The head: its lips on the mouthpiece's rim (headProfile's lips ≈ 88 k in
  // front of and 52 k below its centre), the neck down into the collar.
  const k = PROFILE_HEAD_R / 110;
  const hc = pt(j.lips[0] - f * (88 * k + 2), j.lips[1] - 52 * k);
  const head = intoCollar(headProfile(hc, PROFILE_HEAD_R, n[1] + 10, f), torso);
  // The deltoid: a teardrop along the upper arm — broad over the joint,
  // narrowing INSIDE the sleeve before it closes ≈ 150 mm down (the house
  // profile deltoid, PlayerFigure.buildSide: closing at the sleeve's width left
  // a dimple) — kept inside the shirt's outline, so it never rises over the
  // shoulder line.
  const sh = j.shoulderN;
  const deltoid = (elbow: P2) => {
    const a = Math.atan2(elbow[1] - sh[1], elbow[0] - sh[0]);
    const A = (al: number, ac: number): P2 => [sh[0] + Math.cos(a) * al - Math.sin(a) * ac, sh[1] + Math.sin(a) * al + Math.cos(a) * ac];
    const raw = smoothClosed([A(-44, 0), A(-30, 40), A(10, 45), A(70, 43), A(115, 40.5), A(150, 28), A(150, -28), A(115, -40.5), A(70, -43), A(10, -45), A(-30, -40)]);
    return Skia.Path.MakeFromOp(raw, torso, PathOp.Intersect) ?? raw;
  };
  // (Figure pass 3, owner 2026-10-15: "plug and position interchangeable
  // limbs".) The sleeve's top melts into the shirt over the deltoid's whole
  // region (≈ 120 mm round the joint: no rim, no contour — the house
  // `shoulderQuiet`); within ≈ 150 mm its edge over the shirt is only a soft
  // fold (the same cloth turning over the shoulder — the house `atShoulder`).
  const disc = (r: number) => {
    const d = make();
    d.addCircle(sh[0], sh[1], r);
    return d;
  };
  const quiet = Skia.Path.MakeFromOp(disc(120), torso, PathOp.Intersect);
  const soft = Skia.Path.MakeFromOp(disc(150), shirt, PathOp.Intersect);
  return { shirt, torso, legNear, legFar, shoeNear: shoe(j.ankleN), shoeFar: shoe(j.ankleF), belt, collar, head, deltoid, quiet, soft };
}

/* ── the posed hands and the sleeves (figure pass 3) ── */

/** The views as the hand model sees them: (u, v) the view's mm, d toward the viewer. */
const VIEW3: Record<ViewId, HandView> = {
  side: (p) => ({ u: p.x, v: p.y, d: p.z }),
  top: (p) => ({ u: p.x, v: p.z, d: -p.y }),
};

/** How a posed hand meets its cuff in this view: the forearm's picture angle
 *  (the bare wrist is cut square there), or — a forearm reaching toward the
 *  viewer, seen end-on — the hand in front of its cuff. */
function handOpts(view: ViewId, h: PosedHand, g: { E2: P2; W2: P2 }): { fore: number; foreshortened: boolean } {
  const fore = Math.atan2(g.W2[1] - g.E2[1], g.W2[0] - g.E2[0]);
  const L3 = Math.hypot(h.sk.frame.o.x - h.elbow.x, h.sk.frame.o.y - h.elbow.y, h.sk.frame.o.z - h.elbow.z);
  const L2 = Math.hypot(g.W2[0] - g.E2[0], g.W2[1] - g.E2[1]);
  return { fore, foreshortened: L2 < 0.45 * L3 && depthOf(view, h.sk.frame.o) > depthOf(view, h.elbow) };
}

/** The bounds of a whole garment (its body and sleeves): FigureMass `box`. */
function boundsOf(ps: SkPath[]): GarmentBox {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of ps) {
    const r = p.getBounds();
    if (r.width <= 0 && r.height <= 0) continue;
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.width);
    y1 = Math.max(y1, r.y + r.height);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** Where a sleeve leaves the shirt body (FigureMass `soft`): the shirt within
 *  ≈ 150 mm of the shoulder joint — there its edge is only a soft fold. */
function shoulderSoft(shirt: SkPath, sh: P2): SkPath | null {
  const d = make();
  d.addCircle(sh[0], sh[1], 150);
  return Skia.Path.MakeFromOp(d, shirt, PathOp.Intersect);
}

/**
 * THE SLEEVE AS CLOTH (figure pass 3, owner 2026-10-15: "shoulder transitions
 * from shirt sleeves to the shirt body look very unnatural"). Never a line
 * ALONG the sleeve (owner 2026-10-10: those read as welts), and no stroked
 * armhole seam (drawn, it read as a horseshoe stamped on the shoulder at 3×):
 * only where the cloth folds — at a bent ELBOW one short soft crease hugging
 * the crook (the cloth gathering there). A foreshortened arm gets none.
 */
function sleeveCreases(s: P2, e: P2, w: P2): SkPath | null {
  const L1 = Math.hypot(e[0] - s[0], e[1] - s[1]);
  const L2 = Math.hypot(w[0] - e[0], w[1] - e[1]);
  if (L1 < 90 || L2 < 90) return null;
  const d1: P2 = [(e[0] - s[0]) / L1, (e[1] - s[1]) / L1];
  const d2: P2 = [(w[0] - e[0]) / L2, (w[1] - e[1]) / L2];
  const cr = d1[0] * d2[1] - d1[1] * d2[0];
  const bend = Math.atan2(Math.abs(cr), d1[0] * d2[0] + d1[1] * d2[1]);
  if (bend <= 0.6) return null;
  let bi: P2 = [-d1[0] + d2[0], -d1[1] + d2[1]];
  const bl = Math.hypot(bi[0], bi[1]) || 1;
  bi = [bi[0] / bl, bi[1] / bl];
  return smoothOpen([[e[0] + bi[0] * 16 - d1[0] * 30, e[1] + bi[1] * 16 - d1[1] * 30], [e[0] + bi[0] * 9, e[1] + bi[1] * 9], [e[0] + bi[0] * 16 + d2[0] * 28, e[1] + bi[1] * 16 + d2[1] * 28]]);
}
/** The shirt's crease lines: a dark fold line with a lit edge above-left (faint: cloth, not outlines). */
const CREASE = { line: '#161a24', light: FIGURE_TONES.shirt.rim, opacity: 0.5 } as const;
function Creases({ path, clip }: { path: SkPath; clip: SkPath }) {
  return (
    <Group clip={clip} opacity={CREASE.opacity}>
      <Group transform={[{ translateX: -1.6 }, { translateY: -2.2 }]}>
        <Path path={path} style="stroke" strokeWidth={1.8} strokeCap="round" color={CREASE.light} opacity={0.32} />
      </Group>
      <Path path={path} style="stroke" strokeWidth={2.4} strokeCap="round" color={CREASE.line} opacity={0.62} />
    </Group>
  );
}

/* ── the player and the chair ── */
function playerItems(s: BrassScene, view: ViewId): Item[] {
  const J = s.J;
  const q = (p: Vec3) => prj(view, p);
  const out: Item[] = [];
  const side = view === 'side';
  // THE BODY (figure pass 2, owner 2026-10-15: the hull torso read as a tube,
  // the legs as capsules). In profile: the house PROFILE BODY (profileBody
  // above — PlayerFigure.buildSide's shaping from these joints): the
  // shirt with its chest, waist and straight back, tucked in at the belt; the
  // pelvis in the trousers joined to the near leg — the thigh ON the seat,
  // the knee, the shin down, the shoe flat on the floor — the far leg a
  // little darker behind; the head with its lips on the mouthpiece and its
  // neck going into the collar. From above: the house shoulders (a rounded
  // rectangle ≈ 456 × 236 mm, PlayerFigure.buildAbove), the thighs on the
  // seat and the shoes beyond the knees. Drawing only: the joints (and so
  // the solids) are unchanged.
  const mass = (key: string, depth: number, path: SkPath, tone: 'shirt' | 'trousers' | 'shoe' | 'skin', far = false, quiet: SkPath | null = null) =>
    out.push({ key, depth, node: <FigureMass key={key} path={path} tone={tone} far={far} quiet={quiet} contour={1.8} /> });
  let body: ProfileBody | null = null;
  // The top view's shoulders and back (the house shoulders from above,
  // PlayerFigure.buildAbove: a rounded rectangle ≈ 456 × 236 mm, the chest
  // toward +x).
  let topTorso: SkPath | null = null;
  if (side) {
    body = profileBody({
      neck: q(J.neck),
      hip: q(scale(add(J.hipL, J.hipR), 0.5)),
      shoulderN: q(J.shoulderR),
      hipN: q(J.hipR),
      kneeN: q(J.kneeR),
      ankleN: q(J.ankleR),
      hipF: q(J.hipL),
      kneeF: q(J.kneeL),
      ankleF: q(J.ankleL),
      floorV: 0,
      lips: q(add(J.mouth, { x: 6, y: 0, z: 0 })),
      facing: 1,
      seated: true,
    });
    const b = body;
    out.push({
      key: 'legFar',
      depth: depthOf(view, J.hipL),
      node: (
        <Group key="legFar">
          <FigureMass path={b.shoeFar} tone="shoe" far contour={1.8} />
          <FigureMass path={b.legFar} tone="trousers" far contour={1.8} />
        </Group>
      ),
    });
  } else {
    // Each leg one trouser mass (thigh into shin), its shoe beyond the knee.
    const legTop = (key: string, hip: Vec3, knee: Vec3, ankle: Vec3, toe: Vec3) => {
      const shoe = poly(limbPts(q(ankle), q(toe), 46, 38));
      mass(`${key}Shoe`, depthOf(view, toe), shoe, 'shoe');
      const H2 = q(hip);
      const K2 = q(knee);
      const A2 = q(ankle);
      const path = union([poly(limbPts(H2, K2, 82, 64)), poly(limbPts(K2, A2, 62, 44))]);
      mass(key, depthOf(view, scale(add(hip, knee), 0.5)), path, 'trousers');
    };
    legTop('legL', J.hipL, J.kneeL, J.ankleL, J.toeL);
    legTop('legR', J.hipR, J.kneeR, J.ankleR, J.toeR);
    const n2 = q(J.neck);
    const OUT: P2[] = [[0, -112], [118, -108], [178, -66], [222, -28], [228, 26], [218, 74], [174, 106], [90, 116], [0, 124], [-90, 116], [-174, 106], [-218, 74], [-228, 26], [-222, -28], [-178, -66], [-118, -108]];
    topTorso = smoothClosed(OUT.map(([a, b]) => [n2[0] + b, n2[1] + a] as P2));
  }
  // THE ARMS AND HANDS (figure pass 3, owner 2026-10-15: "check that the hand
  // is correctly positioned, placed, bent, fingers and digits accounted for").
  // Each hand is the shared 3-D hand model POSED on what it plays
  // (lowBrassHands: the horn's left fingers on the levers, little finger in
  // the hook, thumb on the thumb valve, the right hand cupped in the bell; the
  // tuba's / euphonium's right fingers arched down onto the pistons, thumb in
  // its ring, the left hand on the bell branch or the side valve), drawn in
  // this view (drawHand3: every bone, the palm, the bare wrist cut square at
  // the cuff, the nails at close range). Each ARM is the shared anatomical
  // arm (splitArm: one outline, the elbow's point and crook, the cuff short of
  // the wrist) to that hand's own wrist, its upper arm and forearm painted at
  // their own depths (the farther part whole, the nearer clipped to its side
  // of the elbow: no seam).
  const hands = lowBrassHands(s);
  const view3 = VIEW3[view];
  const geo = (sh: Vec3, el: Vec3, wr: Vec3) => {
    const S2 = q(sh);
    const E2 = q(el);
    const W2 = q(wr);
    const a = splitArm(pt(S2[0], S2[1]), pt(E2[0], E2[1]), pt(W2[0], W2[1]));
    return { S2, E2, W2, a };
  };
  const gL = geo(J.shoulderL, J.elbowL, hands.L.sk.frame.o);
  const gR = geo(J.shoulderR, J.elbowR, hands.R.sk.frame.o);
  // In profile the near (right) sleeve's deltoid is joined to its outline.
  const pathR = body ? (Skia.Path.MakeFromOp(gR.a.path, body.deltoid(gR.E2), PathOp.Union) ?? gR.a.path) : gR.a.path;
  const shirtPath = body ? body.shirt : topTorso!;
  // ONE SHIRT (the house garment light): the body and both sleeves shaded in
  // one light across the whole garment's bounds.
  const garment = boundsOf([shirtPath, gL.a.path, pathR]);
  if (body) {
    const b = body;
    out.push({
      key: 'torso',
      depth: depthOf(view, J.chest),
      node: (
        <Group key="torso">
          <FigureMass path={b.legNear} tone="trousers" contour={1.8} />
          <FigureMass path={b.shoeNear} tone="shoe" contour={1.8} />
          <FigureMass path={b.shirt} tone="shirt" contour={1.8} box={garment} />
          <Path path={b.belt}>
            <LinearGradient start={vec(b.belt.getBounds().x, b.belt.getBounds().y)} end={vec(b.belt.getBounds().x, b.belt.getBounds().y + b.belt.getBounds().height)} colors={['#3a2a20', '#1e150f']} />
          </Path>
          <Path path={b.belt} style="stroke" strokeWidth={1.6} color="#0b0806" />
          <Path path={b.collar} style="stroke" strokeWidth={2.4} strokeCap="round" color="#161a24" opacity={0.9} />
        </Group>
      ),
    });
  } else {
    // Over the upper arms' roots (they leave from under the deltoids), under
    // the forearms and hands.
    const upD = Math.max(depthOf(view, scale(add(J.shoulderL, J.elbowL), 0.5)), depthOf(view, scale(add(J.shoulderR, J.elbowR), 0.5)));
    out.push({ key: 'torso', depth: Math.max(depthOf(view, J.chest), upD + 0.5), node: <FigureMass key="torso" path={topTorso!} tone="shirt" contour={1.8} box={garment} /> });
  }
  const arm = (lr: 'L' | 'R', g: typeof gL, sh: Vec3, el: Vec3, wr: Vec3) => {
    const near = lr === 'R' && body !== null;
    const path = lr === 'R' ? pathR : g.a.path;
    const far = side && lr === 'L';
    // The sleeve leaves the shirt as one cloth: shaded in the garment's one
    // light (`box`), its top melting into the shoulder with no rim or contour
    // (`quiet`, the deltoid's region), its edge over the shirt near the
    // shoulder only a soft fold (`soft`). (No fade-in mask: these arms reach
    // FORWARD across the body, and a sleeve faded over the chest read as
    // see-through.)
    const quiet = near ? body!.quiet : null;
    const soft = near ? body!.soft : far ? null : shoulderSoft(shirtPath, g.S2);
    const dUp = depthOf(view, scale(add(sh, el), 0.5));
    const dFore = depthOf(view, scale(add(el, wr), 0.5));
    const foreNear = dFore >= dUp;
    const folds = far ? null : sleeveCreases(g.S2, g.E2, g.W2);
    const part = (key: string, depth: number, clip: SkPath | null) =>
      out.push({
        key,
        depth,
        node: (
          <Group key={key} clip={clip ?? undefined}>
            <FigureMass path={path} tone="shirt" far={far} quiet={quiet} soft={soft} box={garment} contour={1.8} />
          </Group>
        ),
      });
    part(`upper${lr}`, dUp, foreNear ? null : g.a.upperSide);
    part(`fore${lr}`, dFore, foreNear ? g.a.foreSide : null);
    // The seam and the elbow's crease over the whole sleeve, just above its nearer part.
    if (folds) out.push({ key: `creases${lr}`, depth: Math.max(dUp, dFore) + 0.01, node: <Creases key={`creases${lr}`} path={folds} clip={path} /> });
  };
  arm('L', gL, J.shoulderL, J.elbowL, hands.L.sk.frame.o);
  arm('R', gR, J.shoulderR, J.elbowR, hands.R.sk.frame.o);
  const handItem = (key: string, h: PosedHand, g: typeof gL) => {
    const dh = drawHand3(h.sk, view3, handOpts(view, h, g));
    out.push({
      key,
      depth: depthOf(view, h.sk.frame.o) + 25,
      node: (
        <Group key={key}>
          <FigureMass path={dh.path} tone="skin" contour={1.8} />
          <Path path={dh.lines} style="stroke" strokeWidth={1.7} strokeCap="round" color={SKIN_EDGE} opacity={0.7} />
          <Nails path={dh.nails} />
        </Group>
      ),
    });
  };
  handItem('handL', hands.L, gL);
  // The horn's right hand is inside the bell (BellArt draws it, clipped to the
  // opening); the sleeve runs to its wrist at the rim.
  if (!s.bellHand) handItem('handR', hands.R, gR);
  // The neck, and the head: the SHARED figure head (head fix 2026-10-08 —
  // PlayerFigure headProfile / headAbove + FigureHead, the same skin
  // silhouette every lab figure wears; never a circle). Profile facing +x
  // (a short neck stub over the neck limb); from above, the nose toward +x.
  // (No separate neck limb: in profile the head's own neck goes into the
  // collar — profileBody / intoCollar; from above the head covers it.)
  const hc = q(J.head);
  const r = J.headR;
  const headFill = (() => {
    if (body) return body.head.fill; // lips on the mouthpiece, the neck into the collar
    const f = headAbove(pt(0, 0), r).fill.copy();
    f.transform(Skia.Matrix().translate(hc[0], hc[1]).rotate(-Math.PI / 2));
    return f;
  })();
  out.push({
    key: 'head',
    depth: depthOf(view, J.head),
    node: <FigureHead key="head" fill={headFill} />,
  });
  // The chair.
  const c = s.chair;
  const corners: P2[] = [];
  for (const x of [c.seat.min.x, c.seat.max.x]) for (const y of [c.seat.min.y, c.seat.max.y]) for (const z of [c.seat.min.z, c.seat.max.z]) corners.push(q({ x, y, z }));
  const seat = hull(corners);
  const backC: P2[] = [];
  for (const x of [c.back.min.x, c.back.max.x]) for (const y of [c.back.min.y, c.back.max.y]) for (const z of [c.back.min.z, c.back.max.z]) backC.push(q({ x, y, z }));
  const back = hull(backC);
  const legs = c.legs.map(([a, b]) => limbPts(q(a), q(b), 13, 12));
  out.push({
    key: 'chair',
    depth: view === 'side' ? -400 : -c.seat.max.y - 600,
    node: (
      <Group key="chair">
        {legs.map((l, i) => (
          <Lit key={i} path={poly(l)} pts={l} ramp={['#9aa1ad', '#5a606b', '#2a2d33']} />
        ))}
        <Lit path={poly(back)} pts={back} ramp={CHAIR} />
        <Lit path={poly(seat)} pts={seat} ramp={CHAIR} />
      </Group>
    ),
  });
  return out;
}

function smoothClosed(pts: P2[]): SkPath {
  const p = make();
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = 1 / 6;
    p.cubicTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  p.close();
  return p;
}

/** Every item of the scene for a view, far to near. */
export function sceneItems(s: BrassScene, view: ViewId, opts: { player?: boolean } = {}): Item[] {
  const items: Item[] = [];
  if (opts.player !== false) items.push(...playerItems(s, view));
  for (const t of s.tubes) items.push(...tubeItems(t, view, s));
  s.valves.forEach((vl, i) => items.push(...valveItems(vl, view, i)));
  const b = s.bell;
  let hand: HandPaint | null = null;
  if (s.bellHand && opts.player !== false) {
    const h = lowBrassHands(s).R;
    const dh = drawHand3(h.sk, VIEW3[view], handOpts(view, h, { E2: prj(view, h.elbow), W2: prj(view, h.sk.frame.o) }));
    hand = { path: dh.path, lines: dh.lines, nails: dh.nails };
  }
  items.push({ key: 'bell', depth: depthOf(view, scale(add(b.rim, b.throat), 0.5)) + 10, node: <BellArt key="bell" b={b} view={view} hand={hand} /> });
  return items.sort((a, z) => a.depth - z.depth);
}

/** The instrument and its player, for one view (Skia elements, mm). The
 *  player recedes behind the instrument (charter §6). */
export function LowBrassScene({ s, view, dim = 1 }: { s: BrassScene; view: ViewId; dim?: number }) {
  const items = useMemo(() => sceneItems(s, view), [s, view]);
  return (
    <Group opacity={dim}>
      {items.map((it) => (
        // The player is OPAQUE (figure polish 2026-10-10): nothing of the
        // horn shows through an arm; the depth sort gives the order.
        <Group key={it.key}>{it.node}</Group>
      ))}
    </Group>
  );
}

/** The lesson art's `Instrument` for an instrument whose variants are its
 *  bell orientations. */
export function makeLowBrassInstrument(spec: LowBrassSpec) {
  return function LowBrassInstrument({ view, variant }: { view: ViewId; variant: string }): ReactElement {
    const o = (spec.orients.includes(variant as Orient) ? variant : spec.orients[0]) as Orient;
    const s = brassScene(spec, o);
    return <LowBrassScene s={s} view={view} />;
  };
}

/* ── labels (never on the instrument: off to the side, with a leader) ── */
export type LabelSpot = { id: string; text: string; short?: string; at: Vec3; du: number; dv: number; align?: 'left' | 'center' | 'right'; alts?: readonly { du: number; dv: number; align: 'left' | 'center' | 'right' }[] };

export function placeLabels(view: ViewId, spots: readonly LabelSpot[]): ArtLabel[] {
  return spots.map((sp) => {
    const [u, w] = prj(view, sp.at);
    return {
      id: sp.id,
      text: sp.text,
      ...(sp.short ? { short: sp.short } : {}),
      u: u + sp.du,
      v: w + sp.dv,
      align: sp.align ?? 'left',
      at: { u, v: w },
      ...(sp.alts ? { alts: sp.alts.map((a) => ({ u: u + a.du, v: w + a.dv, align: a.align })) } : {}),
    };
  });
}

/* ── hit test: the part under a model point ── */
type Hit = { id: string; a: Vec3; b: Vec3; r: number };

export function hitParts(s: BrassScene, suffix: string): Hit[] {
  const b = s.bell;
  const lead = s.tubes.find((t) => t.id === 'leadpipe')!;
  const slide = s.tubes.find((t) => t.id === 'slide1')!;
  const vc = s.valves.reduce((a, q) => add(a, scale(q.c, 1 / s.valves.length)), { x: 0, y: 0, z: 0 });
  const hits: Hit[] = [
    { id: `lb.bell${suffix}`, a: b.throat, b: b.rim, r: b.R * 0.85 },
    { id: `lb.valves${suffix}`, a: vc, b: vc, r: 55 },
    { id: `lb.lead${suffix}`, a: s.J.mouth, b: lead.pts[lead.pts.length - 1], r: 22 },
    { id: `lb.slides${suffix}`, a: slide.pts[0], b: slide.pts[Math.floor(slide.pts.length / 2)], r: 30 },
  ];
  if (s.spec.id === 'horn') hits.push({ id: `lb.body${suffix}`, a: s.centre, b: s.centre, r: 130 });
  else {
    const bow = s.tubes.find((t) => t.id === 'bottomBow')!;
    const branch = s.tubes.find((t) => t.id === 'bellBranch')!;
    hits.push({ id: `lb.body${suffix}`, a: bow.pts[0], b: branch.pts[branch.pts.length - 1], r: 90 });
  }
  if (s.bellHand) hits.push({ id: `lb.hand${suffix}`, a: s.bellHand.wrist, b: s.bellHand.tip, r: 45 });
  hits.push({ id: 'pl.body', a: s.J.pelvis, b: s.J.neck, r: 150 }, { id: 'pl.body', a: s.J.head, b: s.J.head, r: s.J.headR });
  return hits;
}

export function hitTestScene(s: BrassScene, suffix: string, view: ViewId, u: number, w: number, tol: number): string | null {
  let best: { id: string; d: number } | null = null;
  for (const h of hitParts(s, suffix)) {
    const [au, av] = prj(view, h.a);
    const [bu, bv] = prj(view, h.b);
    const du = bu - au;
    const dv = bv - av;
    const L2 = du * du + dv * dv;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((u - au) * du + (w - av) * dv) / L2)) : 0;
    const d = Math.hypot(u - (au + du * t), w - (av + dv * t)) - h.r;
    if (d <= tol && (!best || d < best.d)) best = { id: h.id, d };
  }
  return best?.id ?? null;
}

/* ── a stand-alone portrait (ORIENT's "What it is") ── */
export function makeLowBrassPortrait(spec: LowBrassSpec, orient: Orient, box: { u0: number; u1: number; v0: number; v1: number }, a11y: string) {
  const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
  function Portrait({ w, h }: { w: number; h: number }) {
    const xf = useMemo(() => fitXform('side', box, w, h, 8), [w, h]);
    const s = brassScene(spec, orient);
    const floor = useMemo(() => {
      const p = make();
      p.addRect(Skia.XYWHRect(box.u0, 0, box.u1 - box.u0, 40));
      return p;
    }, []);
    return (
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <Path path={floor}>
              <LinearGradient start={vec(0, 0)} end={vec(0, 40)} colors={['#2a2b30', '#121316']} />
            </Path>
            <LowBrassScene s={s} view="side" />
          </Group>
        </Canvas>
      </View>
    );
  }
  return { aspect, render: (w: number, h: number) => <Portrait w={w} h={h} /> };
}
