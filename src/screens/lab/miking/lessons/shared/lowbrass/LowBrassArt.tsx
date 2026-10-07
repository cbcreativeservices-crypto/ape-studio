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
 *   • the seated player (a neutral lay figure, the house line-art bald head)
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
const SKIN = ['#8a8f98', '#6e737c', '#52565e'];
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
function TubeArt({ path, r, tone }: { path: SkPath; r: number; tone: typeof BRASS }) {
  return (
    <Group>
      <Path path={path} style="stroke" strokeWidth={2 * r + 3} color={tone.edge} strokeCap="round" strokeJoin="round" />
      <Path path={path} style="stroke" strokeWidth={2 * r} color={tone.mid} strokeCap="round" strokeJoin="round" />
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

function tubeItems(t: Tube, view: ViewId): Item[] {
  const tone = t.tone === 'silver' ? SILVER : BRASS;
  // Long tubes are cut into runs so each run sorts at its own depth (a coil
  // passes behind and in front of the valves).
  const run = 14;
  const out: Item[] = [];
  for (let i0 = 0; i0 < t.pts.length - 1; i0 += run) {
    const seg = t.pts.slice(i0, Math.min(t.pts.length, i0 + run + 1));
    const path = poly(seg.map((p) => prj(view, p)), false);
    const c = seg.reduce((a, p) => add(a, p), { x: 0, y: 0, z: 0 });
    out.push({ key: `${t.id}:${i0}`, depth: depthOf(view, scale(c, 1 / seg.length)), node: <TubeArt path={path} r={t.r} tone={tone} /> });
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
              <Lit path={handPath} pts={bbox2pts(handPath)} ramp={SKIN} edge="#24272d" />
            </Group>
          ) : null}
        </Group>
      ) : null}
      <Path path={p.rim} style="stroke" strokeWidth={9} color={BRASS.edge} />
      <Path path={p.rim} style="stroke" strokeWidth={6.5} color={BRASS.hi} />
      <Group transform={[{ translateX: -1.4 }, { translateY: -1.8 }]}>
        <Path path={p.rim} style="stroke" strokeWidth={2} color={BRASS.light} opacity={0.9} />
      </Group>
    </Group>
  );
}
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
  const nodes: ReactNode[] = [
    <Lit key="casing" path={casing} pts={casingPts} ramp={vl.kind === 'rotary' ? [BRASS.hi, BRASS.mid, BRASS.low, BRASS.dark] : [BRASS.light, BRASS.hi, BRASS.mid, BRASS.low]} edge={BRASS.edge} />,
    <Group key="cap">
      <Path path={cap}>
        <LinearGradient start={vec(bbox(near).u0, bbox(near).v0)} end={vec(bbox(near).u1, bbox(near).v1)} colors={[SILVER.light, SILVER.mid, SILVER.low]} />
      </Path>
      <Path path={cap} style="stroke" strokeWidth={1.4} color={SILVER.edge} />
    </Group>,
  ];
  if (vl.kind === 'piston') {
    // The finger button on its stem, above the casing.
    const stemA = prj(view, add(vl.c, scale(vl.axis, -(vl.h / 2))));
    const stemB = prj(view, add(vl.c, scale(vl.axis, -(vl.h / 2 + 26))));
    const button = ring(add(vl.c, scale(vl.axis, -(vl.h / 2 + 30))), e1, e2, vl.r * 0.95, 0, 2 * Math.PI, 24).map((p) => prj(view, p));
    const bh = hull([...button, ...ring(add(vl.c, scale(vl.axis, -(vl.h / 2 + 22))), e1, e2, vl.r * 0.95, 0, 2 * Math.PI, 24).map((p) => prj(view, p))]);
    nodes.push(
      <Group key="button">
        <Path path={poly([stemA, stemB], false)} style="stroke" strokeWidth={6} color={SILVER.mid} strokeCap="round" />
        <Lit path={poly(bh)} pts={bh} ramp={['#fffaf0', '#e9dfcc', '#b6a88f']} edge="#3b352a" />
      </Group>,
    );
  } else if (vl.lever) {
    const l0 = prj(view, vl.c);
    const l1 = prj(view, add(vl.c, vl.lever));
    nodes.push(<Path key="lever" path={poly([l0, l1], false)} style="stroke" strokeWidth={7} color={BRASS.edge} strokeCap="round" />, <Path key="lever2" path={poly([l0, l1], false)} style="stroke" strokeWidth={4.5} color={BRASS.hi} strokeCap="round" />);
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
    out.push({ key, depth: depthOf(view, scale(add(a, b), 0.5)), node: <Lit key={key} path={poly(pts)} pts={pts} ramp={ramp} /> });
  };
  limb('thighL', J.hipL, J.kneeL, 82, 62, TROUSER);
  limb('thighR', J.hipR, J.kneeR, 82, 62, TROUSER);
  limb('shinL', J.kneeL, J.ankleL, 60, 42, TROUSER);
  limb('shinR', J.kneeR, J.ankleR, 60, 42, TROUSER);
  limb('footL', J.ankleL, J.toeL, 44, 36, SHOE);
  limb('footR', J.ankleR, J.toeR, 44, 36, SHOE);
  // The torso: the hull of the shoulders, chest, waist and hips.
  const tc: P2[] = [...circ(q(J.shoulderL), 66), ...circ(q(J.shoulderR), 66), ...circ(q(J.chest), 125), ...circ(q(add(scale(J.chest, 0.4), scale(J.pelvis, 0.6))), 112), ...circ(q(J.hipL), 92), ...circ(q(J.hipR), 92)];
  const torso = hull(tc);
  out.push({ key: 'torso', depth: depthOf(view, J.chest), node: <Lit key="torso" path={poly(torso)} pts={torso} ramp={SHIRT} /> });
  limb('upperL', J.shoulderL, J.elbowL, 52, 42, SHIRT);
  limb('foreL', J.elbowL, J.wristL, 42, 31, SHIRT);
  limb('upperR', J.shoulderR, J.elbowR, 52, 42, SHIRT);
  limb('foreR', J.elbowR, J.wristR, 42, 31, SHIRT);
  limb('handL', J.wristL, J.handL, 30, 36, SKIN);
  if (!s.bellHand) limb('handR', J.wristR, J.handR, 30, 36, SKIN);
  // The neck and the house line-art head (bald, no eyes).
  const nb = sub(J.head, scale({ x: 0, y: -1, z: 0 }, -J.headR * 0.55));
  limb('neckLimb', J.neck, nb, 48, 44, SKIN);
  const hc = q(J.head);
  const r = J.headR;
  const headPts: P2[] =
    view === 'side'
      ? // Profile, facing +x: the cranium, brow, nose, lips and chin.
        [
          [hc[0] - r * 0.95, hc[1] + r * 0.05],
          [hc[0] - r * 0.85, hc[1] - r * 0.6],
          [hc[0] - r * 0.3, hc[1] - r * 1.02],
          [hc[0] + r * 0.45, hc[1] - r * 0.9],
          [hc[0] + r * 0.82, hc[1] - r * 0.42],
          [hc[0] + r * 0.86, hc[1] - r * 0.12],
          [hc[0] + r * 1.08, hc[1] + r * 0.12],
          [hc[0] + r * 0.88, hc[1] + r * 0.24],
          [hc[0] + r * 0.92, hc[1] + r * 0.44],
          [hc[0] + r * 0.82, hc[1] + r * 0.62],
          [hc[0] + r * 0.62, hc[1] + r * 0.95],
          [hc[0] + r * 0.05, hc[1] + r * 1.0],
          [hc[0] - r * 0.6, hc[1] + r * 0.62],
        ]
      : circ(hc, r, 28);
  const head = smoothClosed(headPts);
  // The head is part of the figure (owner 2026-10-06: no separate line-art
  // head icon on a lab figure): the same lit skin mass as the hands and the
  // neck it sits on; from above, the ears and the nose's tip.
  const ears: P2[][] = view === 'side' ? [] : [circ([hc[0] - r * 0.02, hc[1] - r * 0.98], r * 0.2, 12), circ([hc[0] - r * 0.02, hc[1] + r * 0.98], r * 0.2, 12), circ([hc[0] + r * 0.98, hc[1]], r * 0.16, 10)];
  out.push({
    key: 'head',
    depth: depthOf(view, J.head),
    node: (
      <Group key="head">
        {ears.map((e, i) => (
          <Lit key={i} path={smoothClosed(e)} pts={e} ramp={SKIN} />
        ))}
        <Lit path={head} pts={headPts} ramp={SKIN} />
      </Group>
    ),
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
  for (const t of s.tubes) items.push(...tubeItems(t, view));
  s.valves.forEach((vl, i) => items.push(...valveItems(vl, view, i)));
  const b = s.bell;
  items.push({ key: 'bell', depth: depthOf(view, scale(add(b.rim, b.throat), 0.5)) + 10, node: <BellArt key="bell" b={b} view={view} hand={s.bellHand} /> });
  return items.sort((a, z) => a.depth - z.depth);
}

/** The instrument and its player, for one view (Skia elements, mm). The
 *  player recedes behind the instrument (charter §6). */
export function LowBrassScene({ s, view, dim = 1 }: { s: BrassScene; view: ViewId; dim?: number }) {
  const items = useMemo(() => sceneItems(s, view), [s, view]);
  const playerKeys = new Set(['thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR', 'torso', 'upperL', 'foreL', 'upperR', 'foreR', 'handL', 'handR', 'neckLimb', 'head', 'chair']);
  return (
    <Group opacity={dim}>
      {items.map((it) => (
        <Group key={it.key} opacity={playerKeys.has(it.key) ? 0.82 : 1}>
          {it.node}
        </Group>
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
