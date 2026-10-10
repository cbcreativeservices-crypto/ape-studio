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
import { FIGURE_SKIN, FigureHead, FigureMass, handShape, headAbove, headProfile } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';

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
const SHIRT = ['#5d687e', '#465064', '#2f3645'];
const TROUSER = ['#41454f', '#2d3038', '#1b1d22'];
/** The hands and neck wear the shared figure skin, like the head (owner
 *  2026-10-08, HF1 — they were a grey neutral). */
const SKIN = FIGURE_SKIN.ramp;
const SKIN_EDGE = FIGURE_SKIN.edge;
const SHOE = ['#34353b', '#18191d', '#0b0b0d'];
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

function BellArt({ b, view, hand }: { b: Bell; view: ViewId; hand: { wrist: Vec3; tip: Vec3 } | null }) {
  const p = useMemo(() => bellPaths(b, view), [b, view]);
  const facing = dot(b.axis, TO_VIEWER[view]);
  const rb = bbox(p.rimPts);
  const handPath = useMemo(() => {
    if (!hand) return null;
    const w = prj(view, hand.wrist);
    const t = prj(view, hand.tip);
    return poly(limbPts(w, t, 34, 40));
  }, [hand, view]);
  return (
    <Group>
      <Lit path={p.body} pts={p.bodyPts} ramp={[BRASS.light, BRASS.hi, BRASS.mid, BRASS.low, BRASS.dark]} edge={BRASS.edge} rim={3} w={2} />
      {facing > 0.05 ? (
        <Group>
          <Path path={p.rim}>
            <RadialGradient c={vec((rb.u0 + rb.u1) / 2, (rb.v0 + rb.v1) / 2)} r={Math.max(rb.u1 - rb.u0, rb.v1 - rb.v0) * 0.55} colors={['#0d0702', '#2a1a06', '#6e4a14', '#b88a2e']} positions={[0, 0.45, 0.82, 1]} />
          </Path>
          <Path path={p.inner} style="stroke" strokeWidth={2} color="#c99634" opacity={0.25} />
          {handPath ? (
            <Group clip={p.rim}>
              <Lit path={handPath} pts={bbox2pts(handPath)} ramp={SKIN} edge={SKIN_EDGE} />
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
const bbox2pts = (p: SkPath): P2[] => {
  const r = p.getBounds();
  return [
    [r.x, r.y],
    [r.x + r.width, r.y + r.height],
  ];
};

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

/* ── the player and the chair ── */
function playerItems(s: BrassScene, view: ViewId): Item[] {
  const J = s.J;
  const q = (p: Vec3) => prj(view, p);
  const out: Item[] = [];
  const limb = (key: string, a: Vec3, b: Vec3, ra: number, rb: number, ramp: string[]) => {
    const pts = limbPts(q(a), q(b), ra, rb);
    out.push({ key, depth: depthOf(view, scale(add(a, b), 0.5)), node: <Lit key={key} path={poly(pts)} pts={pts} ramp={ramp} edge={ramp === SKIN ? SKIN_EDGE : OUTLINE} /> });
  };
  limb('thighL', J.hipL, J.kneeL, 82, 62, TROUSER);
  limb('thighR', J.hipR, J.kneeR, 82, 62, TROUSER);
  limb('shinL', J.kneeL, J.ankleL, 60, 42, TROUSER);
  limb('shinR', J.kneeR, J.ankleR, 60, 42, TROUSER);
  limb('footL', J.ankleL, J.toeL, 44, 36, SHOE);
  limb('footR', J.ankleR, J.toeR, 44, 36, SHOE);
  // The torso: the hull of the shoulders, chest, waist and hips.
  // A healthy back (owner 2026-10-10: the chest disc on the spine bulged a
  // hump): chest and waist forward of the spine (the player faces +x), the
  // hips a little back for the seat — the back nearly straight.
  const FW = { x: 1, y: 0, z: 0 };
  const tc: P2[] = [...circ(q(J.shoulderL), 66), ...circ(q(J.shoulderR), 66), ...circ(q(add(J.chest, scale(FW, 28))), 106), ...circ(q(add(add(scale(J.chest, 0.4), scale(J.pelvis, 0.6)), scale(FW, 20))), 96), ...circ(q(add(J.hipL, scale(FW, -8))), 96), ...circ(q(add(J.hipR, scale(FW, -8))), 96)];
  const torso = hull(tc);
  out.push({ key: 'torso', depth: depthOf(view, J.chest), node: <Lit key="torso" path={poly(torso)} pts={torso} ramp={SHIRT} /> });
  // The arms and HANDS (figure polish 2026-10-10: the hands were capsules —
  // mittens). Each hand is the shared anatomical hand (PlayerFigure
  // handShape, the figure skin), holding what it holds:
  //   • the right hand on top-action pistons, seen from the player's right:
  //     the wrist behind and above the cluster, the fingers arching forward
  //     and DOWN onto the buttons (fingertips where the scene puts them), so
  //     the forearm comes from the elbow behind the casings and the whole
  //     cluster stays in view; from above, the back of the hand over them;
  //   • the left hand a fist round the branch (tuba, euphonium), or the
  //     fingers on the rotor levers (horn).
  const rotary = s.valves.some((vl) => vl.kind === 'rotary');
  const side = view === 'side';
  const handAt = (key: string, kind: 'keys' | 'grip' | 'above', tip: P2, dir: number, depth: number): P2 => {
    const [ax, ay] = kind === 'keys' ? [151, Math.cos(dir) >= 0 ? 28 : -28] : kind === 'grip' ? [100, 0] : [70, 0];
    const co = Math.cos(dir);
    const si = Math.sin(dir);
    const wrist: P2 = [tip[0] - (ax * co - ay * si), tip[1] - (ax * si + ay * co)];
    const hs = handShape({ wrist: pt(wrist[0], wrist[1]), dir, kind });
    out.push({
      key,
      depth,
      node: (
        <Group key={key}>
          <FigureMass path={hs.path} tone="skin" contour={1.8} />
          <Path path={hs.lines} style="stroke" strokeWidth={1.6} strokeCap="round" color={SKIN_EDGE} opacity={0.7} />
        </Group>
      ),
    });
    return wrist;
  };
  const fore2 = (key: string, a: Vec3, w2: P2, depth: number) => {
    const pts = limbPts(q(a), w2, 42, 31);
    out.push({ key, depth, node: <Lit key={key} path={poly(pts)} pts={pts} ramp={SHIRT} /> });
  };
  const dirOf = (a: Vec3, b: Vec3) => {
    const A = q(a);
    const B = q(b);
    return Math.atan2(B[1] - A[1], B[0] - A[0]);
  };
  limb('upperL', J.shoulderL, J.elbowL, 52, 42, SHIRT);
  limb('upperR', J.shoulderR, J.elbowR, 52, 42, SHIRT);
  {
    const kind = rotary ? 'keys' : 'grip';
    const dir = dirOf(J.elbowL, J.handL);
    const wL = handAt('handL', kind, q(J.handL), dir, depthOf(view, J.handL) + 25);
    fore2('foreL', J.elbowL, wL, depthOf(view, scale(add(J.elbowL, J.wristL), 0.5)));
  }
  if (!s.bellHand) {
    const dir = side ? 0 : dirOf(J.wristR, J.handR);
    const wR = handAt('handR', side ? 'keys' : 'above', q(J.handR), dir, depthOf(view, J.handR) + 25);
    fore2('foreR', J.elbowR, wR, depthOf(view, scale(add(J.elbowR, J.wristR), 0.5)));
  } else {
    limb('foreR', J.elbowR, J.wristR, 42, 31, SHIRT);
  }
  // The neck, and the head: the SHARED figure head (head fix 2026-10-08 —
  // PlayerFigure headProfile / headAbove + FigureHead, the same skin
  // silhouette every lab figure wears; never a circle). Profile facing +x
  // (a short neck stub over the neck limb); from above, the nose toward +x.
  const nb = sub(J.head, scale({ x: 0, y: -1, z: 0 }, -J.headR * 0.55));
  limb('neckLimb', J.neck, nb, 48, 44, SKIN);
  const hc = q(J.head);
  const r = J.headR;
  const headFill = (() => {
    if (view === 'side') return headProfile(pt(hc[0] + r * 0.1, hc[1]), r * 1.05, hc[1] + r * 1.15, 1).fill; // lips on the mouthpiece, as before
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
  items.push({ key: 'bell', depth: depthOf(view, scale(add(b.rim, b.throat), 0.5)) + 10, node: <BellArt key="bell" b={b} view={view} hand={s.bellHand} /> });
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
