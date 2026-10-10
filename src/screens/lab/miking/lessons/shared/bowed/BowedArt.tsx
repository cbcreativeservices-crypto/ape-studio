/**
 * THE BOWED FAMILY — the look (charter §2 layer 3). Everything is DRAWN IN
 * 3-D and projected: the instrument is built in its own frame B (arched top
 * with purfling and spruce grain, f-holes with their nicks, ribs, back,
 * bridge, tailpiece, chin rest or endpin, fingerboard, neck, pegbox, pegs
 * and scroll, the four strings), the bow (stick, hair, frog, tip), the
 * bow's sweep (hatched) and the player (a neutral figure: head, torso,
 * arms, legs; a chair for the cellist) — all from posture.ts, so they sit
 * exactly where the collisions and the zones are. The engine's views are
 * orthographic: SIDE looks from the player's right toward −z (u = x,
 * v = y), TOP looks down (u = x, v = z). Parts are painted far-to-near.
 *
 * Upper-left light, gradients and a rim light on every object (charter §3);
 * palette: varnished spruce and maple, ebony, metal; the figure in neutral
 * clothing. Nothing moves (D8). Strings are drawn a little thicker than life
 * so they read at the overview zoom.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { VariantId, Vec3, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { useKeepOutsAtRest } from '../../../engine/scene/keepOuts.ts';
import { FIGURE_TONES, FigureMass, handShape, FigureHead, headAbove, headProfile, type FigureTone, type HeadPaths } from '../players/PlayerFigure';
import type { HandKind } from '../players/playerPose.ts';
import { add, dot, scale, sub } from '../../../engine/geometry/vec.ts';
import { archAt, fbHalf, fingerboardZ, halfWidth, outline, stationsOf, stringYs, stringZ, type BowedSpec } from './bowedSpec.ts';
import { anchorsOf, toB, toLesson, type BPoint, type BowPose, type Posture } from './posture.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P2 = [number, number];

/* ── projection ── */
export const prj = (view: ViewId, p: Vec3): P2 => [p.x, view === 'side' ? p.y : p.z];
/** Nearer to the camera = larger (side: +z toward the camera; top: up). */
export const depthOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.z : -p.y);
const TO_VIEWER: Record<ViewId, Vec3> = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } };

export function polyPath(pts: P2[], close = true): SkPath {
  const p = Skia.Path.Make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  if (close) p.close();
  return p;
}
export function hull(pts: P2[]): P2[] {
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
export function circlePts(c: P2, r: number, n = 18): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < n; i++) out.push([c[0] + r * Math.cos((i / n) * Math.PI * 2), c[1] + r * Math.sin((i / n) * Math.PI * 2)]);
  return out;
}
/** A tapered limb: the hull of two circles. */
export function limbPath(a: P2, b: P2, ra: number, rb: number): SkPath {
  return polyPath(hull([...circlePts(a, ra), ...circlePts(b, rb)]));
}
export function bbox(pts: P2[]) {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const [u, v] of pts) {
    if (u < u0) u0 = u;
    if (v < v0) v0 = v;
    if (u > u1) u1 = u;
    if (v > v1) v1 = v;
  }
  return { u0, v0, u1, v1 };
}

/* ── the paint list ── */
export type Fill = { colors: string[]; positions?: number[] } | string;
export type Item = {
  path: SkPath;
  fill?: Fill;
  stroke?: { color: string; w: number; opacity?: number; dash?: number[] };
  opacity?: number;
  box: { u0: number; v0: number; u1: number; v1: number };
  clip?: SkPath;
  rim?: number;
  /** A body mass painted at the shared figure standard (players/PlayerFigure). */
  tone?: FigureTone;
  /** The house line-art head (players/PlayerFigure). */
  head?: { paths: HeadPaths; c: { u: number; v: number }; r: number };
  /** Extra lines over the mass (a hand's knuckles and finger gaps). */
  lines?: SkPath;
};
export type Group3 = { key: string; depth: number; items: Item[] };

const item = (pts: P2[], fill: Fill | undefined, stroke?: Item['stroke'], close = true, rim?: number): Item => ({ path: polyPath(pts, close), fill, stroke, box: bbox(pts), rim });

/* palette */
const VARNISH = { colors: ['#e3a052', '#b8621f', '#7c3610', '#4a1d06'], positions: [0, 0.35, 0.75, 1] };
const RIB = { colors: ['#a3541c', '#6e2c0b', '#3a1604'] };
const BACK = { colors: ['#93461a', '#5a2309', '#2c1003'] };
const EBONY = { colors: ['#45403b', '#1b1917', '#090808'] };
const MAPLE_PALE = { colors: ['#f4e1bb', '#d8b47d', '#a77d47'] };
const METAL = { colors: ['#eef1f5', '#9aa1ad', '#4d535e'] };
const CLOTH = { colors: ['#4c5466', '#2f3542', '#1b1f28'] };
const TROUSER = { colors: ['#3c4150', '#262a35', '#14171e'] };
const SKIN = { colors: ['#e2bfa3', '#b98d6f', '#7d5a45'] };
const SHOE = { colors: ['#3a3634', '#151312', '#050505'] };
const STRING_COL = '#d7dbe2';
const OUTLINE = '#07070a';

/** The instrument as a list of paint items, far to near, for one view. */
type InstPose = Pick<Posture, 'spec' | 'st' | 'ax' | 'endpinTip'>;
function instrumentItems(P: InstPose, view: ViewId): Item[] {
  const { spec, st, ax } = P;
  const B = (q: BPoint) => prj(view, toLesson(ax, q));
  const k = spec.body.mm / 358; // size factor (violin = 1)
  const rib = spec.rib.mm;
  const facing = dot(ax.z, TO_VIEWER[view]); // > 0: the top faces us
  const ol = outline(spec, 200);
  const top: P2[] = ol.map(([x, y]) => B({ x, y, z: 0 }));
  const back: P2[] = ol.map(([x, y]) => B({ x, y, z: -rib }));
  const out: { back: Item[]; ribs: Item[]; top: Item[]; above: Item[] } = { back: [], ribs: [], top: [], above: [] };

  // BACK: the plate and its arch on the centre line.
  out.back.push(item(back, BACK, { color: OUTLINE, w: 1.6 * k }));
  const archB: P2[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = st.tailX + (spec.body.mm * i) / 40;
    const u = i / 40;
    archB.push(B({ x, y: 0, z: -rib - spec.archBack.mm * Math.pow(Math.sin(Math.PI * u), 0.55) }));
  }
  for (let i = 40; i >= 0; i--) archB.push(B({ x: st.tailX + (spec.body.mm * i) / 40, y: 0, z: -rib }));
  out.back.push(item(archB, BACK, { color: OUTLINE, w: 1.2 * k }));
  // The neck heel and the endpin collar, behind the top.
  // RIBS: quads between the top rim and the back rim.
  const ribPath = Skia.Path.Make();
  for (let i = 0; i < ol.length - 1; i++) {
    // Every quad wound the same way, so the band fills as one (the two
    // sides of the outline would otherwise cancel under non-zero winding).
    const q: P2[] = [top[i], top[i + 1], back[i + 1], back[i]];
    let area = 0;
    for (let j = 0; j < 4; j++) area += q[j][0] * q[(j + 1) % 4][1] - q[(j + 1) % 4][0] * q[j][1];
    const o = area >= 0 ? q : [...q].reverse();
    ribPath.moveTo(o[0][0], o[0][1]);
    for (let j = 1; j < 4; j++) ribPath.lineTo(o[j][0], o[j][1]);
    ribPath.close();
  }
  out.ribs.push({ path: ribPath, fill: RIB, box: bbox([...top, ...back]) });
  // TOP: its arch on the centre line (seen edge-on), the plate, grain,
  // purfling, f-holes and a rim light.
  const archT: P2[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = st.tailX + (spec.body.mm * i) / 40;
    archT.push(B({ x, y: 0, z: archAt(spec, x, 0) }));
  }
  for (let i = 40; i >= 0; i--) archT.push(B({ x: st.tailX + (spec.body.mm * i) / 40, y: 0, z: 0 }));
  out.top.push(item(archT, VARNISH, { color: OUTLINE, w: 1.2 * k }));
  const plate = item(top, VARNISH, { color: OUTLINE, w: 1.8 * k }, true, 1.2 * k);
  out.top.push(plate);
  // Spruce grain along the plate, faint.
  const grain = Skia.Path.Make();
  const W = spec.lower.mm / 2;
  for (let j = -6; j <= 6; j++) {
    const y = (j / 6.5) * W;
    let started = false;
    for (let i = 0; i <= 30; i++) {
      const x = st.tailX + (spec.body.mm * i) / 30;
      if (Math.abs(y) > halfWidth(spec, x) - 2 * k) {
        started = false;
        continue;
      }
      const q = B({ x, y, z: archAt(spec, x, y) });
      if (!started) grain.moveTo(q[0], q[1]);
      else grain.lineTo(q[0], q[1]);
      started = true;
    }
  }
  if (facing > 0.15) out.top.push({ path: grain, stroke: { color: '#3a1604', w: 0.7 * k, opacity: 0.35 }, box: plate.box, clip: plate.path });
  // Purfling: an inlaid line ≈ 4 mm (violin) inside the edge.
  const inset = 4 * k;
  const purf: P2[] = ol.map(([x, y]) => {
    const w = Math.abs(y);
    const s = w > inset ? (w - inset) / w : 0;
    const xx = Math.max(st.tailX + inset, Math.min(st.neckX - inset, x));
    return B({ x: xx, y: y * s, z: archAt(spec, xx, y * s) * 0.6 });
  });
  if (facing > 0.15) out.top.push(item(purf, undefined, { color: '#1c0b02', w: 1.3 * k, opacity: 0.9 }));
  // f-holes (art pass 2026-10-10): the S-shaped stem as a cut of varying
  // width — narrow at its middle, flaring into the WINGS by each eye — the
  // small upper eye toward the neck and nearer the centre line, the larger
  // lower eye toward the tail and farther out, and the nicks on the bridge
  // line. Each point sits on the arch.
  const [fx0, fx1] = spec.fholeX;
  const fl = fx1 - fx0;
  for (const s of [1, -1]) {
    const Y = spec.fholeY.mm;
    const spread = 0.2 * Y;
    const up = { x: fx1 - 0.06 * fl, y: s * (Y - spread) };
    const lo = { x: fx0 + 0.06 * fl, y: s * (Y + spread) };
    const c1 = { x: up.x - 0.45 * fl, y: up.y };
    const c2 = { x: lo.x + 0.45 * fl, y: lo.y };
    const at = (t: number) => ({
      x: (1 - t) ** 3 * up.x + 3 * (1 - t) ** 2 * t * c1.x + 3 * (1 - t) * t * t * c2.x + t ** 3 * lo.x,
      y: (1 - t) ** 3 * up.y + 3 * (1 - t) ** 2 * t * c1.y + 3 * (1 - t) * t * t * c2.y + t ** 3 * lo.y,
    });
    const left: P2[] = [];
    const right: P2[] = [];
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const t = 0.04 + (0.92 * i) / N;
      const p = at(t);
      const q = at(Math.min(1, t + 0.01));
      const r = at(Math.max(0, t - 0.01));
      const tx = q.x - r.x;
      const ty = q.y - r.y;
      const tl = Math.hypot(tx, ty) || 1;
      // Stem width: 0.032 fl at its middle, the wings to 0.075 fl near each eye.
      const wing = Math.exp(-(((t - 0.16) / 0.09) ** 2)) * 0.8 + Math.exp(-(((t - 0.84) / 0.09) ** 2));
      const w = fl * (0.032 + 0.043 * wing);
      // The wings flare to the f-hole's outer side (away from the centre line).
      const nx = -ty / tl;
      const ny = tx / tl;
      const outSide = Math.sign(ny * s) || 1;
      const wo = w * (0.5 + 0.25 * wing);
      const wi = w - wo;
      left.push(B({ x: p.x + nx * outSide * wo, y: p.y + ny * outSide * wo, z: archAt(spec, p.x, p.y) + 0.4 }));
      right.push(B({ x: p.x - nx * outSide * wi, y: p.y - ny * outSide * wi, z: archAt(spec, p.x, p.y) + 0.4 }));
    }
    out.top.push(item([...left, ...right.reverse()], '#050302'));
    const eyeU = circlePts([up.x, up.y], 0.06 * fl, 14).map(([x, y]) => B({ x, y, z: archAt(spec, x, y) + 0.4 }));
    const eyeL = circlePts([lo.x, lo.y], 0.08 * fl, 14).map(([x, y]) => B({ x, y, z: archAt(spec, x, y) + 0.4 }));
    out.top.push(item(eyeU, '#050302'));
    out.top.push(item(eyeL, '#050302'));
    const mid = at(0.5);
    const nick = [B({ x: 0, y: mid.y - 0.07 * fl, z: archAt(spec, 0, mid.y) + 0.4 }), B({ x: 0, y: mid.y + 0.07 * fl, z: archAt(spec, 0, mid.y) + 0.4 })];
    out.top.push(item(nick, undefined, { color: '#050302', w: 0.9 * k }, false));
  }

  // ABOVE THE TOP: tailpiece, chin rest, neck, fingerboard, pegbox and
  // scroll, bridge, strings.
  const [t0, t1] = spec.tailpiece;
  const tw1 = spec.bridgeW.mm * 0.34;
  const tw0 = tw1 * 0.55;
  const tz = (x: number) => stringZ(spec, x) * 0.78;
  const tail: P2[] = [B({ x: t0, y: -tw0, z: tz(t0) }), B({ x: t1, y: -tw1, z: tz(t1) }), B({ x: t1 + 4 * k, y: 0, z: tz(t1) }), B({ x: t1, y: tw1, z: tz(t1) }), B({ x: t0, y: tw0, z: tz(t0) }), B({ x: t0 - 5 * k, y: 0, z: tz(t0) })];
  const tailSide: P2[] = [B({ x: t0, y: 0, z: tz(t0) }), B({ x: t1, y: 0, z: tz(t1) }), B({ x: t1, y: 0, z: tz(t1) - 7 * k }), B({ x: t0, y: 0, z: 2 * k })];
  const gut: P2[] = [B({ x: t0, y: 0, z: tz(t0) * 0.5 }), B({ x: st.tailX + 3 * k, y: 0, z: 2 * k })];
  out.above.push(item(gut, undefined, { color: '#1a1a1a', w: 2 * k }, false));
  out.above.push(item(tailSide, EBONY, { color: OUTLINE, w: 1 * k }));
  out.above.push(item(tail, EBONY, { color: OUTLINE, w: 1.2 * k }, true, 0.9 * k));
  if (spec.id === 'violin' || spec.id === 'viola') {
    // The chin rest (art pass 2026-10-10): an ebony cup, kidney-shaped,
    // ~105 × 55 mm, left of the tailpiece on the lowest string's side and
    // lapping a little over the tail edge; its dished cup drawn as an inner
    // rim.
    const cx = st.tailX + 26 * k;
    const cy = -spec.lower.mm * 0.2;
    const kidney = (sc: number): P2[] => {
      const pts: P2[] = [];
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        // An ellipse 55 (along) × 105 (across), its tail-side edge pulled in
        // at the middle (the bean's hollow faces the tailpiece's end).
        const rx = 26 * k * sc;
        const ry = 50 * k * sc;
        const dent = Math.cos(a) > 0 ? 0 : 0.22 * Math.exp(-((Math.sin(a) / 0.45) ** 2));
        const yy = cy + ry * Math.sin(a) * (1 - 0.08 * Math.cos(a));
        const xx = cx + rx * Math.cos(a) * (1 - dent) + (Math.sin(a) > 0.6 ? 4 * k * sc : 0);
        pts.push(B({ x: xx, y: yy, z: spec.archTop.mm * 0.6 + 12 * k }));
      }
      return pts;
    };
    out.above.push(item(kidney(1), { colors: ['#5a524b', '#2a2622', '#0d0c0b'] }, { color: OUTLINE, w: 1 * k }, true, 1 * k));
    out.above.push(item(kidney(0.7), { colors: ['#3a3530', '#1a1816', '#0a0909'] }, { color: '#6a645d', w: 0.7 * k, opacity: 0.7 }));
  }
  // The neck (seen from the side under the fingerboard) with its heel.
  const nz = (x: number) => fingerboardZ(spec, x) - 5 * k;
  const neck: P2[] = [];
  for (let i = 0; i <= 10; i++) {
    const x = st.neckX - 12 * k + ((st.nutX - st.neckX + 12 * k) * i) / 10;
    neck.push(B({ x, y: 0, z: nz(x) }));
  }
  for (let i = 10; i >= 0; i--) {
    const x = st.neckX - 12 * k + ((st.nutX - st.neckX + 12 * k) * i) / 10;
    const depth = (20 + 8 * (1 - i / 10)) * k;
    neck.push(B({ x, y: 0, z: nz(x) - depth - (i === 0 ? 10 * k : 0) }));
  }
  neck.push(B({ x: st.neckX - 16 * k, y: 0, z: -rib * 0.55 }));
  const neckFace: P2[] = [];
  for (let i = 0; i <= 8; i++) {
    const x = st.neckX + ((st.nutX - st.neckX) * i) / 8;
    neckFace.push(B({ x, y: -fbHalf(spec, x) * 0.92, z: nz(x) - 6 * k }));
  }
  for (let i = 8; i >= 0; i--) {
    const x = st.neckX + ((st.nutX - st.neckX) * i) / 8;
    neckFace.push(B({ x, y: fbHalf(spec, x) * 0.92, z: nz(x) - 6 * k }));
  }
  out.above.push(item(neckFace, RIB, { color: OUTLINE, w: 1 * k }));
  out.above.push(item(neck, RIB, { color: OUTLINE, w: 1.2 * k }, true, 0.8 * k));
  // Pegbox and scroll: the face (pegs out sideways) and the profile (the volute).
  const sx0 = st.nutX + 4 * k;
  const sx1 = st.scrollX;
  const pl = sx1 - sx0;
  const zn = fingerboardZ(spec, st.nutX);
  const pw = spec.fbNut.mm * 0.5;
  const scrollR = pl * 0.24;
  const pbFace: P2[] = [B({ x: sx0, y: -pw, z: zn - 4 * k }), B({ x: sx1 - 2 * scrollR, y: -pw * 0.8, z: zn - 4 * k }), B({ x: sx1 - 2 * scrollR, y: pw * 0.8, z: zn - 4 * k }), B({ x: sx0, y: pw, z: zn - 4 * k })];
  out.above.push(item(pbFace, RIB, { color: OUTLINE, w: 1 * k }));
  // The open pegbox (art pass 2026-10-10): its cavity between the cheeks,
  // where the strings wind onto the pegs.
  const cav: P2[] = [B({ x: sx0 + 3 * k, y: -pw * 0.6, z: zn - 3.6 * k }), B({ x: sx1 - 2.1 * scrollR, y: -pw * 0.45, z: zn - 3.6 * k }), B({ x: sx1 - 2.1 * scrollR, y: pw * 0.45, z: zn - 3.6 * k }), B({ x: sx0 + 3 * k, y: pw * 0.6, z: zn - 3.6 * k })];
  out.above.push(item(cav, '#120804', { color: '#2a1206', w: 0.6 * k }));
  // The scroll seen face-on: the volute's outer turn, its centre spine and
  // the turns either side of it (drawn, not traced).
  const vc: P2 = [sx1 - scrollR, 0];
  const volute: P2[] = circlePts(vc, scrollR, 24).map(([x, y]) => B({ x, y: y * 0.78, z: zn - 6 * k }));
  out.above.push(item(volute, RIB, { color: OUTLINE, w: 1 * k }, true, 0.8 * k));
  for (const s2 of [-1, 1]) {
    const turn: P2[] = [];
    for (let i = 0; i <= 14; i++) {
      const a = -Math.PI * 0.62 + (i / 14) * Math.PI * 1.24;
      turn.push(B({ x: vc[0] - scrollR * 0.15 + scrollR * 0.62 * Math.cos(a), y: s2 * scrollR * (0.36 + 0.3 * Math.sin(Math.abs(a) * 0.9)) * 0.78, z: zn - 5.5 * k }));
    }
    out.above.push(item(turn, undefined, { color: '#1c0a02', w: 0.9 * k, opacity: 0.85 }, false));
  }
  out.above.push(item([B({ x: vc[0] - scrollR * 0.95, y: 0, z: zn - 5.5 * k }), B({ x: vc[0] + scrollR * 0.95, y: 0, z: zn - 5.5 * k })], undefined, { color: '#e2a070', w: 0.9 * k, opacity: 0.45 }, false));
  if (spec.id === 'bass') {
    // The bass's machine heads: a brass gear plate along each cheek, two
    // worm shafts out of each, a flat key on each shaft (~38 mm out).
    for (const s2 of [-1, 1]) {
      const plate: P2[] = [B({ x: sx0 + pl * 0.08, y: s2 * pw * 1.02, z: zn - 8 * k }), B({ x: sx0 + pl * 0.62, y: s2 * pw * 0.9, z: zn - 8 * k }), B({ x: sx0 + pl * 0.62, y: s2 * (pw * 0.9 + 4), z: zn - 8 * k }), B({ x: sx0 + pl * 0.08, y: s2 * (pw * 1.02 + 4), z: zn - 8 * k })];
      out.above.push(item(plate, { colors: ['#f2d58a', '#b8913f', '#6d521c'] }, { color: OUTLINE, w: 0.6 * k }));
    }
  }
  // Pegs: two each side, alternating (violin, viola, cello: ebony pegs with
  // a collar and the thumb piece; the bass: worm shafts with flat keys).
  for (let i = 0; i < 4; i++) {
    const x = sx0 + pl * (0.14 + 0.15 * i);
    const s = i % 2 === 0 ? -1 : 1;
    const bass = spec.id === 'bass';
    const reach = bass ? 38 : 30 * k;
    const a = B({ x, y: s * pw, z: zn - 10 * k });
    const b = B({ x, y: s * (pw + reach), z: zn - 10 * k });
    out.above.push({ path: limbPath(a, b, bass ? 4 : 3.5 * k, bass ? 4 : 3 * k), fill: bass ? METAL : EBONY, box: bbox([a, b]) });
    if (!bass) {
      const collar = [B({ x: x - 4.5 * k, y: s * (pw + reach * 0.62), z: zn - 10 * k }), B({ x: x + 4.5 * k, y: s * (pw + reach * 0.62), z: zn - 10 * k })];
      out.above.push(item(collar, undefined, { color: '#d8cfbf', w: 1.6 * k, opacity: 0.85 }, false));
    }
    const kx = bass ? 16 : 10 * k;
    const ky = bass ? 8 : 6 * k;
    const knob = circlePts([0, 0], 1, 16).map(([dx, dy]) => B({ x: x + dx * kx, y: s * (pw + reach + ky) + dy * ky, z: zn - 10 * k }));
    out.above.push(item(knob, bass ? METAL : EBONY, { color: OUTLINE, w: 0.8 * k }, true, 0.6 * k));
  }
  const pbSide: P2[] = [B({ x: sx0, y: 0, z: zn - 2 * k }), B({ x: sx1 - 1.6 * scrollR, y: 0, z: zn - 2 * k }), B({ x: sx1 - 1.6 * scrollR, y: 0, z: zn - 2.2 * scrollR }), B({ x: sx0, y: 0, z: zn - 30 * k })];
  out.above.push(item(pbSide, RIB, { color: OUTLINE, w: 1 * k }));
  const vSide: P2[] = circlePts([sx1 - scrollR, zn - scrollR], scrollR, 22).map(([x, z]) => B({ x, y: 0, z }));
  out.above.push(item(vSide, RIB, { color: OUTLINE, w: 1.1 * k }, true, 0.9 * k));
  const spiral = Skia.Path.Make();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 3.2;
    const r = scrollR * (0.85 - (0.7 * i) / 40);
    const q = B({ x: sx1 - scrollR + r * Math.cos(a), y: 0, z: zn - scrollR + r * Math.sin(a) });
    if (i === 0) spiral.moveTo(q[0], q[1]);
    else spiral.lineTo(q[0], q[1]);
  }
  out.above.push({ path: spiral, stroke: { color: '#1c0a02', w: 1.2 * k, opacity: 0.8 }, box: bbox(vSide) });
  // Fingerboard: its top and its edge.
  const fb: P2[] = [];
  const fbE: P2[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = st.fbEndX + ((st.nutX - st.fbEndX) * i) / 12;
    fb.push(B({ x, y: -fbHalf(spec, x), z: fingerboardZ(spec, x) }));
    fbE.push(B({ x, y: 0, z: fingerboardZ(spec, x) }));
  }
  for (let i = 12; i >= 0; i--) {
    const x = st.fbEndX + ((st.nutX - st.fbEndX) * i) / 12;
    fb.push(B({ x, y: fbHalf(spec, x), z: fingerboardZ(spec, x) }));
    fbE.push(B({ x, y: 0, z: fingerboardZ(spec, x) - 6 * k }));
  }
  out.above.push(item(fbE, EBONY, { color: OUTLINE, w: 1 * k }));
  out.above.push(item(fb, EBONY, { color: OUTLINE, w: 1.2 * k }, true, 1 * k));
  const nut: P2[] = [B({ x: st.nutX, y: -fbHalf(spec, st.nutX), z: fingerboardZ(spec, st.nutX) + 2 * k }), B({ x: st.nutX, y: fbHalf(spec, st.nutX), z: fingerboardZ(spec, st.nutX) + 2 * k })];
  out.above.push(item(nut, undefined, { color: '#d8cfbf', w: 3 * k }, false));
  // The bridge: its face (feet, waist, heart, arched top) and its edge.
  const h = spec.bridgeH.mm;
  const bw = spec.bridgeW.mm;
  const bz = (y: number) => h - 0.16 * h * (y / (bw / 2)) ** 2;
  const bf: P2[] = [];
  const bridgeOutline: [number, number][] = [
    [-0.5, 0],
    [-0.3, 0],
    [-0.2, 0.2],
    [0.2, 0.2],
    [0.3, 0],
    [0.5, 0],
    [0.46, 0.14],
    [0.34, 0.36],
    [0.44, 0.56],
    [0.5, 0.8],
  ];
  for (const [yy, zz] of bridgeOutline) bf.push(B({ x: 0, y: yy * bw, z: zz * h + archAt(spec, 0, yy * bw) * (zz === 0 ? 1 : 0) }));
  for (let i = 0; i <= 10; i++) {
    const yy = 0.5 - i / 10;
    bf.push(B({ x: 0, y: yy * bw, z: bz(yy * bw) }));
  }
  for (const [yy, zz] of [[-0.5, 0.8], [-0.44, 0.56], [-0.34, 0.36], [-0.46, 0.14]] as const) bf.push(B({ x: 0, y: yy * bw, z: zz * h }));
  const bEdge: P2[] = [B({ x: -2.6 * k, y: 0, z: archAt(spec, 0) }), B({ x: 2.6 * k, y: 0, z: archAt(spec, 0) }), B({ x: 0.9 * k, y: 0, z: h }), B({ x: -0.9 * k, y: 0, z: h })];
  out.above.push(item(bEdge, MAPLE_PALE, { color: '#3a2a14', w: 0.9 * k }));
  out.above.push(item(bf, MAPLE_PALE, { color: '#3a2a14', w: 1.1 * k }, true, 0.8 * k));
  const heart = circlePts([0, 0.55 * h], 0.055 * bw, 10).map(([y, z]) => B({ x: 0.1, y, z }));
  out.above.push(item(heart, '#2b1d0c'));
  // Seen from the front of the top (art pass 2026-10-10) the bridge is its
  // thin crown — ~1.5 mm at the top, the feet ~4.5 mm along the strings and
  // a fifth of its width each — so it reads as a maple bar across the
  // strings, not a hairline.
  if (facing > 0.15) {
    for (const s2 of [-1, 1]) {
      const y0 = s2 * 0.3 * bw;
      const y1 = s2 * 0.5 * bw;
      const foot: P2[] = [B({ x: -2.6 * k, y: y0, z: archAt(spec, 0, y0) }), B({ x: -2.6 * k, y: y1, z: archAt(spec, 0, y1) }), B({ x: 2.6 * k, y: y1, z: archAt(spec, 0, y1) }), B({ x: 2.6 * k, y: y0, z: archAt(spec, 0, y0) })];
      out.above.push(item(foot, MAPLE_PALE, { color: '#3a2a14', w: 0.6 * k }));
    }
    const crown: P2[] = [];
    for (let i = 0; i <= 10; i++) crown.push(B({ x: -1.6 * k, y: (-0.5 + i / 10) * bw, z: bz((-0.5 + i / 10) * bw) }));
    for (let i = 10; i >= 0; i--) crown.push(B({ x: 1.6 * k, y: (-0.5 + i / 10) * bw, z: bz((-0.5 + i / 10) * bw) }));
    out.above.push(item(crown, MAPLE_PALE, { color: '#3a2a14', w: 0.7 * k }));
  }
  // Strings: tailpiece → bridge → nut → into the pegbox.
  const ys0 = stringYs(spec, 0);
  const ysT = stringYs(spec, t1);
  const ysN = stringYs(spec, st.nutX);
  for (let i = 0; i < 4; i++) {
    const pts: P2[] = [
      B({ x: t1, y: ysT[i], z: tz(t1) + 1 }),
      B({ x: 0, y: ys0[i], z: bz(ys0[i]) + 0.5 }),
      B({ x: st.nutX, y: ysN[i], z: fingerboardZ(spec, st.nutX) + 2.5 * k }),
      B({ x: sx0 + pl * (0.14 + 0.15 * i), y: (i % 2 === 0 ? -1 : 1) * pw * 0.5, z: zn - 8 * k }),
    ];
    const w = Math.max(1.6, (spec.id === 'bass' ? 2.6 : spec.id === 'cello' ? 1.7 : 1.0) * (1.25 - i * 0.12)) * Math.max(1, k * 0.55);
    out.above.push(item(pts, undefined, { color: STRING_COL, w }, false));
  }
  // The endpin and its collar.
  if (P.endpinTip) {
    const collar = toLesson(ax, { x: st.tailX - (spec.collar?.mm ?? 0), y: 0, z: -rib / 2 });
    const a = prj(view, collar);
    const b = prj(view, P.endpinTip);
    out.back.push({ path: limbPath(a, b, 5 * Math.max(1, k * 0.5), 3), fill: METAL, box: bbox([a, b]) });
    const c = prj(view, toLesson(ax, { x: st.tailX - 6 * k, y: 0, z: -rib / 2 }));
    out.back.push({ path: polyPath(circlePts(c, 14 * Math.max(1, k * 0.45), 14)), fill: EBONY, box: bbox([c]) });
  }
  // Painter's order: the side facing the camera last.
  return facing >= -0.05 ? [...out.back, ...out.ribs, ...out.top, ...out.above] : [...out.above, ...out.top, ...out.ribs, ...out.back];
}

/** The bow: hair, stick (cambered), frog with its eye, the tip's head. */
function bowItems(P: Pick<Posture, 'spec' | 'bow'>, view: ViewId): Item[] {
  const b = P.bow;
  const k = Math.max(1, P.spec.bow.mm / 750);
  const pt = (s: number, lift: number) => prj(view, add(add(b.tip, scale(sub(b.frog, b.tip), s)), scale(b.up, lift)));
  const hair: P2[] = [pt(0.015, 3), pt(1, 3)];
  const stick: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const s = i / 24;
    // The stick dips toward the hair in the middle (its camber).
    const lift = 10 + 11 * (1 - Math.sin(Math.PI * Math.min(1, s * 1.05)) * 0.6) - 4 * s;
    stick.push(pt(s, lift * k));
  }
  stick.push(pt(1.12, 16 * k));
  const tipHead: P2[] = [pt(-0.012, 2), pt(0.03, 2), pt(0.03, 18 * k), pt(-0.006, 16 * k)];
  const frog: P2[] = [pt(0.93, 2), pt(1.02, 2), pt(1.02, 20 * k), pt(0.9, 18 * k)];
  const eye = circlePts(pt(0.96, 11 * k), 3 * k, 10);
  return [
    item(hair, undefined, { color: '#f3eedf', w: 3.4 * k, opacity: 0.95 }, false),
    item(stick, undefined, { color: '#160803', w: 7.5 * k }, false),
    item(stick, undefined, { color: '#8a3c14', w: 5.2 * k }, false),
    item(stick.map(([u, v]) => [u - 0.6, v - 0.9] as P2), undefined, { color: '#e2a070', w: 1.3 * k, opacity: 0.55 }, false),
    item(tipHead, '#ece6d6', { color: OUTLINE, w: 0.8 }),
    item(frog, EBONY, { color: OUTLINE, w: 1 }),
    item(eye, '#e8f0ff'),
  ];
}

/** The bow's sweep (and the bow hand's), hatched: the projected fans. */
export function sweepPaths(P: Posture, view: ViewId): { bow: SkPath; hand: SkPath } {
  const { st, ax, spec, bow } = P;
  const D = Math.PI / 180;
  const R = (spec.bowHair?.mm ?? spec.bow.mm) + (spec.bowHair ? 20 : 0);
  const pts = (c: Vec3, u: Vec3, r: number, halfW: number, round: number, sides: number[]): P2[][] =>
    sides.map((sd) => {
      const ps: P2[] = [];
      for (let i = 0; i <= 14; i++) {
        const a = -25 * D + (50 * D * i) / 14;
        const dir = add(scale(u, Math.cos(a) * sd), scale(ax.z, Math.sin(a)));
        for (const w of [-halfW, halfW]) ps.push(prj(view, add(add(c, scale(dir, r + round)), scale(ax.x, w))));
      }
      for (const w of [-halfW, halfW]) for (const q of circlePts([0, 0], round, 8)) ps.push(prj(view, add(add(c, scale(ax.x, w)), add(scale(ax.y, q[0]), scale(ax.z, q[1])))));
      return hull(ps);
    });
  const toPath = (polys: P2[][]) => {
    const p = Skia.Path.Make();
    for (const poly of polys) p.addPath(polyPath(poly));
    return p;
  };
  const bowP = toPath(pts(bow.contact, ax.y, R, st.contactHalf + 10, 25, [1, -1]));
  const hc = add(add(bow.contact, scale(ax.x, 40)), scale(ax.z, 60));
  const handP = toPath(pts(hc, bow.dir, R + 20, st.contactHalf + 50, (spec.id === 'bass' ? 90 : 80) - 10, [1]));
  return { bow: bowP, hand: handP };
}

/** The plucking hand's path, hatched: the model's capsule (x′ 60–300 above
 *  the bridge, radius 60 — bowedModel's bw.pluck), projected. */
export function pluckPath(P: Posture, view: ViewId): SkPath {
  const a = prj(view, toLesson(P.ax, { x: 60, y: 0, z: stringZ(P.spec, 60) }));
  const b = prj(view, toLesson(P.ax, { x: 300, y: 0, z: stringZ(P.spec, 300) }));
  return polyPath(hull([...circlePts(a, 60, 16), ...circlePts(b, 60, 16)]));
}

/* ── the player ── */
/** A smooth closed outline through view points (Catmull-Rom as cubics). */
function smoothClosedP2(pts: P2[]): SkPath {
  const p = Skia.Path.Make();
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
/** The player figure (shared: the brass family draws its players with it). */
/**
 * How one hand holds (figure polish 2026-10-10): its shape, which way it
 * points in the view (radians; default along the forearm), and the view point
 * it lands on (default the skeleton's hand). `keys`/`wrap` land their
 * FINGERTIPS there (fingers curved down onto valve buttons, round a neck);
 * `grip` lands the fist's grip there; `rest`/`above` the palm. The forearm is
 * drawn to the hand's wrist, so it never crosses what the fingers rest on.
 */
export type HandHold = { kind: HandKind; dir?: number; at?: P2; /** Paint depth for the hand and its forearm (e.g. just behind the instrument). */ depth?: number };
export type PlayerOpts = { hands?: { L?: HandHold; R?: HandHold } };

/** The point of a hand (its own frame) that lands on what it holds. */
function holdAnchor(kind: HandKind, dir: number): P2 {
  if (kind === 'keys' || kind === 'wrap') return [151, Math.cos(dir) >= 0 ? 28 : -28];
  if (kind === 'grip' || kind === 'pick') return [100, 0];
  return [70, 0];
}

export function playerGroups(P: Pick<Posture, 'player' | 'chair'>, view: ViewId, withRightArm = true, opts: PlayerOpts = {}): Group3[] {
  const s = P.player;
  const q = (p: Vec3) => prj(view, p);
  const g: Group3[] = [];
  // The figure is painted at the shared player's standard (clarity pass
  // 2026-10-05): each mass with the house form, rim light and core shadow.
  const toneOf = (fill: Fill): FigureTone | undefined => (fill === TROUSER ? 'trousers' : fill === CLOTH ? 'shirt' : fill === SHOE ? 'shoe' : fill === SKIN ? 'skin' : undefined);
  const limb = (key: string, a: Vec3, b: Vec3, ra: number, rb: number, fill: Fill) => {
    const A2 = q(a);
    const B2 = q(b);
    g.push({ key, depth: depthOf(view, add(scale(a, 0.5), scale(b, 0.5))), items: [{ path: limbPath(A2, B2, ra, rb), fill, stroke: { color: OUTLINE, w: 1.6 }, box: bbox([A2, B2]), rim: 1.4, tone: toneOf(fill) }] });
  };
  // Legs and feet.
  // Each leg is ONE trouser mass, thigh into shin (no capsule joint at the
  // knee), its shoe below it.
  const leg = (key: string, hip: Vec3, knee: Vec3, ankle: Vec3) => {
    const H2 = q(hip);
    const K2 = q(knee);
    const A2 = q(ankle);
    const path = Skia.Path.MakeFromOp(limbPath(H2, K2, 80, 62), limbPath(K2, A2, 62, 44), PathOp.Union) ?? limbPath(H2, K2, 80, 62);
    // Under the shirt's hem: never painted over the torso (a near thigh's
    // round top read as a grey disc at the waist of a standing player).
    g.push({ key, depth: Math.min(depthOf(view, add(scale(hip, 0.5), scale(knee, 0.5))), depthOf(view, s.chest) - 0.5), items: [{ path, fill: TROUSER, stroke: { color: OUTLINE, w: 1.6 }, box: bbox([H2, K2, A2]), rim: 1.4, tone: 'trousers' }] });
  };
  leg('thighL', s.hipL, s.kneeL, s.ankleL);
  leg('thighR', s.hipR, s.kneeR, s.ankleR);
  limb('footL', s.ankleL, s.toeL, 42, 34, SHOE);
  limb('footR', s.ankleR, s.toeR, 42, 34, SHOE);
  // Torso: the hull of shoulders, chest, waist and hips.
  // A HEALTHY BACK (owner 2026-10-10: a chest disc of r 122 centred on the
  // spine bulged a hump behind the shoulders): the chest and the waist sit
  // FORWARD of the spine (chest ≈ 210 mm deep, waist ≈ 190), the hips' discs
  // a little back for the seat — so the back runs nearly straight from the
  // shoulder blades to the seat (bulge ≤ 35 mm) and the front keeps its line.
  const fw = Math.hypot(s.face.x, s.face.z) > 1e-6 ? scale({ x: s.face.x, y: 0, z: s.face.z }, 1 / Math.hypot(s.face.x, s.face.z)) : { x: 1, y: 0, z: 0 };
  const tc: P2[] = [
    ...circlePts(q(s.shoulderL), 70),
    ...circlePts(q(s.shoulderR), 70),
    ...circlePts(q(add(s.chest, scale(fw, 28))), 104),
    ...circlePts(q(add(add(scale(s.chest, 0.4), scale(s.pelvis, 0.6)), scale(fw, 20))), 96),
    ...circlePts(q(add(s.hipL, scale(fw, -8))), 96),
    ...circlePts(q(add(s.hipR, scale(fw, -8))), 96),
  ];
  if (view === 'top') {
    // FROM ABOVE (owner review 2026-10-10: the hull read as a hard octagon):
    // the shared figure's shoulder outline (PlayerFigure.buildAbove) — a
    // smooth ROUNDED RECTANGLE ≈ 456 mm across the deltoids, ≈ 236 mm deep,
    // the back nearly flat, the deltoids rounded, the chest a little fuller —
    // laid along the facing; the hanging upper arms leave from under it.
    const n2 = q(s.neck);
    const f2 = prj(view, fw);
    const fl = Math.hypot(f2[0], f2[1]) || 1;
    const fx = f2[0] / fl;
    const fy = f2[1] / fl;
    const OUT: P2[] = [[0, -112], [118, -108], [178, -66], [222, -28], [228, 26], [218, 74], [174, 106], [90, 116], [0, 124], [-90, 116], [-174, 106], [-218, 74], [-228, 26], [-222, -28], [-178, -66], [-118, -108]];
    const pts: P2[] = OUT.map(([a, b]) => [n2[0] + a * -fy + b * fx, n2[1] + a * fx + b * fy]);
    const path = smoothClosedP2(pts);
    // Just over the arms (their roots go under it), never over an instrument
    // held above the chest.
    const armD = Math.min(depthOf(view, add(scale(s.elbowL, 0.5), scale(s.handL, 0.5))), depthOf(view, add(scale(s.elbowR, 0.5), scale(s.handR, 0.5))));
    g.push({ key: 'torso', depth: Math.max(depthOf(view, s.chest), armD + 0.5), items: [{ path, fill: CLOTH, stroke: { color: OUTLINE, w: 1.8 }, box: bbox(pts), rim: 1.6, tone: 'shirt' }] });
  } else {
    const torso = hull(tc);
    g.push({ key: 'torso', depth: depthOf(view, s.chest), items: [{ path: polyPath(torso), fill: CLOTH, stroke: { color: OUTLINE, w: 1.8 }, box: bbox(torso), rim: 1.6, tone: 'shirt' }] });
  }
  // Hands with fingers (the shared hand), each HOLDING what it holds (figure
  // polish 2026-10-10): its wrist, from where the hand lands.
  const wristOf2 = (h: Vec3, elbow: Vec3, hold: HandHold | undefined): { wrist: P2; dir: number; kind: HandKind; depth?: number } => {
    const c = hold?.at ?? q(h);
    const e = q(elbow);
    const dir = hold?.dir ?? Math.atan2(c[1] - e[1], c[0] - e[0]);
    const kind = hold?.kind ?? 'rest';
    const [ax, ay] = holdAnchor(kind, dir);
    const co = Math.cos(dir);
    const si = Math.sin(dir);
    return { wrist: [c[0] - (ax * co - ay * si), c[1] - (ax * si + ay * co)], dir, kind, depth: hold?.depth };
  };
  const wL = wristOf2(s.handL, s.elbowL, opts.hands?.L);
  const wR = wristOf2(s.handR, s.elbowR, opts.hands?.R);
  // Arms: tapered sleeves, the forearm to the hand's own wrist.
  const fore = (key: string, a: Vec3, b: Vec3, w2: P2, depth?: number) => {
    const A2 = q(a);
    g.push({ key, depth: depth !== undefined ? depth - 1 : depthOf(view, add(scale(a, 0.5), scale(b, 0.5))), items: [{ path: limbPath(A2, w2, 42, 31), fill: CLOTH, stroke: { color: OUTLINE, w: 1.6 }, box: bbox([A2, w2]), rim: 1.4, tone: 'shirt' }] });
  };
  // From above, each arm is ONE sleeve (shoulder → elbow → wrist, tapering
  // 112 → 88 → 62 mm), so the bent arm reads as an arm, never two bars
  // meeting at a corner.
  const armTop = (key: string, sh: Vec3, el: Vec3, h: Vec3, w2: P2) => {
    const S2 = q(sh);
    const E2 = q(el);
    // Slim, as a hanging arm seen from above: the upper arm ≈ 90 mm across
    // (foreshortened, short), the forearm ≈ 76 mm tapering to the wrist.
    const path = Skia.Path.MakeFromOp(limbPath(S2, E2, 46, 40), limbPath(E2, w2, 38, 30), PathOp.Union) ?? limbPath(S2, E2, 46, 40);
    g.push({ key, depth: depthOf(view, add(scale(el, 0.5), scale(h, 0.5))), items: [{ path, fill: CLOTH, stroke: { color: OUTLINE, w: 1.6 }, box: bbox([S2, E2, w2]), rim: 1.4, tone: 'shirt' }] });
  };
  if (view === 'top') {
    armTop('upperL', s.shoulderL, s.elbowL, s.handL, wL.wrist);
    if (withRightArm) armTop('upperR', s.shoulderR, s.elbowR, s.handR, wR.wrist);
  } else {
    limb('upperL', s.shoulderL, s.elbowL, 54, 44, CLOTH);
    fore('foreL', s.elbowL, s.handL, wL.wrist, wL.depth);
    if (withRightArm) {
      limb('upperR', s.shoulderR, s.elbowR, 54, 44, CLOTH);
      fore('foreR', s.elbowR, s.handR, wR.wrist, wR.depth);
    }
  }
  const hand = (key: string, h: Vec3, w: { wrist: P2; dir: number; kind: HandKind; depth?: number }) => {
    const hs = handShape({ wrist: { u: w.wrist[0], v: w.wrist[1] }, dir: w.dir, kind: w.kind });
    const b = hs.path.getBounds();
    g.push({ key, depth: w.depth ?? depthOf(view, h) + 25, items: [{ path: hs.path, fill: SKIN, box: { u0: b.x, v0: b.y, u1: b.x + b.width, v1: b.y + b.height }, tone: 'skin', lines: hs.lines }] });
  };
  hand('handL', s.handL, wL);
  if (withRightArm) hand('handR', s.handR, wR);
  // The head: the house LINE-ART head (bald, no eyes; reference_head_icon_
  // spec) — in profile from the side, turned to the face from above — with
  // its neck column down to the collar (no hair, no shaded face).
  const hc = q(s.head);
  const f2 = prj(view, s.face);
  const fl = Math.hypot(f2[0], f2[1]) || 1;
  const fu: P2 = [f2[0] / fl, f2[1] / fl];
  const r = s.headR;
  let paths: HeadPaths;
  if (view === 'side') {
    paths = headProfile({ u: hc[0], v: hc[1] }, r, q(s.neck)[1], fu[0] >= 0 ? 1 : -1);
  } else {
    const h0 = headAbove({ u: 0, v: 0 }, r);
    const m = Skia.Matrix().translate(hc[0], hc[1]).rotate(Math.atan2(fu[1], fu[0]) - Math.PI / 2);
    const line = h0.line.copy();
    line.transform(m);
    const fill = h0.fill.copy();
    fill.transform(m);
    paths = { line, fill };
  }
  const hb = paths.fill.getBounds();
  g.push({ key: 'head', depth: depthOf(view, s.head), items: [{ path: paths.fill, box: { u0: hb.x, v0: hb.y, u1: hb.x + hb.width, v1: hb.y + hb.height }, head: { paths, c: { u: hc[0], v: hc[1] }, r } }] });
  // The chair.
  if (P.chair) {
    const { min, max } = P.chair.seat;
    const corners: Vec3[] = [];
    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) corners.push({ x, y, z });
    const seat = hull(corners.map(q));
    const legs: Item[] = P.chair.legs.map(([a, b]) => {
      const A2 = q(a);
      const B2 = q(b);
      return { path: limbPath(A2, B2, 12, 11), fill: METAL, box: bbox([A2, B2]) };
    });
    g.push({ key: 'chairLegs', depth: depthOf(view, { x: min.x, y: max.y + 100, z: 0 }) - 400, items: legs });
    g.push({ key: 'chair', depth: depthOf(view, { x: (min.x + max.x) / 2, y: max.y, z: 0 }) - 300, items: [{ path: polyPath(seat), fill: { colors: ['#3a3c43', '#1d1e22', '#0c0c0e'] }, stroke: { color: OUTLINE, w: 1.6 }, box: bbox(seat), rim: 1 }] });
  }
  return g;
}

/* ── painting ── */
export function PaintItem({ it }: { it: Item }) {
  const { box } = it;
  const grad = typeof it.fill === 'object' ? it.fill : null;
  if (it.head) return <FigureHead fill={it.head.paths.fill} />;
  if (it.tone) {
    return (
      <Group opacity={it.opacity ?? 1} clip={it.clip}>
        <FigureMass path={it.path} tone={it.tone} contour={1.8} />
        {it.lines ? <Path path={it.lines} style="stroke" strokeWidth={1.6} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.7} /> : null}
      </Group>
    );
  }
  return (
    <Group opacity={it.opacity ?? 1} clip={it.clip}>
      {it.fill ? (
        grad ? (
          <Path path={it.path}>
            <LinearGradient start={vec(box.u0, box.v0)} end={vec(box.u1, box.v1)} colors={grad.colors} positions={grad.positions} />
          </Path>
        ) : (
          <Path path={it.path} color={it.fill as string} />
        )
      ) : null}
      {it.stroke ? (
        <Path path={it.path} style="stroke" strokeWidth={it.stroke.w} color={it.stroke.color} opacity={it.stroke.opacity ?? 1} strokeCap="round" strokeJoin="round">
          {it.stroke.dash ? <DashPathEffect intervals={it.stroke.dash} /> : null}
        </Path>
      ) : null}
      {it.rim ? (
        // Rim light toward the upper left.
        <Group transform={[{ translateX: -it.rim * 0.7 }, { translateY: -it.rim }]}>
          <Path path={it.path} style="stroke" strokeWidth={it.rim} color="#fff3e0" opacity={0.28} />
        </Group>
      ) : null}
    </Group>
  );
}

/**
 * The left hand ON THE NECK (figure polish 2026-10-10): seen from the
 * player's right, the hand is behind the neck — the thumb on the neck's back,
 * the palm hidden by it, the fingers curling round onto the fingerboard,
 * their tips just over its edge — and the forearm reaches it from behind the
 * instrument, never across the strings. From above: the back of the hand.
 */
function neckHold(P: Posture, view: ViewId, instDepth: number): HandHold | undefined {
  if (view !== 'side' || !P.player) return undefined;
  const hb = toB(P.ax, P.player.handL);
  const face = toLesson(P.ax, { x: hb.x, y: hb.y, z: stringZ(P.spec, hb.x) + 10 });
  const a = prj(view, P.player.handL);
  const b = prj(view, face);
  return { kind: 'wrap', dir: Math.atan2(b[1] - a[1], b[0] - a[0]), at: b, depth: instDepth - 1 };
}

/**
 * The right hand HOLDS THE BOW at the frog (owner 2026-10-10: the bow hand
 * was drawn open, palm up, the bow a separate line beside it). The bow hold:
 * the hand over the stick at the frog, the fingers draped over the stick and
 * curled round it, the thumb bent under it — the stick passing THROUGH the
 * hand's grip. The hand lands on the skeleton's own hand point (the stick
 * just over the frog, posture.ts: frog + 28–30 mm along the bow's up), so the
 * bow, the keep-outs and the mic positions are untouched; the hand crosses
 * the stick square to it, coming from the forearm's side. A plucking hand
 * (the bass, pizzicato) keeps its open hand.
 */
function bowHold(P: Posture, view: ViewId): HandHold | undefined {
  if (!P.player || !P.strokes.length) return undefined;
  const atFrog = add(P.bow.frog, scale(P.bow.up, 29));
  const h = P.player.handR;
  if (Math.hypot(h.x - atFrog.x, h.y - atFrog.y, h.z - atFrog.z) > 12) return undefined;
  const a = prj(view, P.bow.frog);
  const b = prj(view, add(P.bow.frog, scale(P.bow.dir, 100)));
  const at = prj(view, h);
  const e = prj(view, P.player.elbowR);
  const fx = at[0] - e[0];
  const fy = at[1] - e[1];
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const bl = Math.hypot(bx, by);
  // Square to the stick, on the forearm's side; a stick seen end-on: along the forearm.
  let dir = Math.atan2(fy, fx);
  if (bl > 25) {
    let px = -by / bl;
    let py = bx / bl;
    if (px * fx + py * fy < 0) {
      px = -px;
      py = -py;
    }
    dir = Math.atan2(py, px);
  }
  return { kind: 'grip', dir, at };
}

/** All the groups for a view, far to near. */
export function sceneGroups(P: Posture, view: ViewId, opts: { player?: boolean; bow?: boolean } = {}): Group3[] {
  const groups: Group3[] = [];
  const instDepth = depthOf(view, { x: 0, y: 0, z: 0 });
  if (opts.player !== false) groups.push(...playerGroups(P, view, true, { hands: { L: neckHold(P, view, instDepth), R: bowHold(P, view) } }));
  const inst = instrumentItems(P, view);
  // The bow lies on the strings: right after the instrument when its top
  // faces the camera, before it when the back does.
  const bowFirst = dot(P.ax.z, TO_VIEWER[view]) < -0.05;
  const bow = opts.bow !== false && P.player && P.strokes.length > 0 ? bowItems(P, view) : [];
  groups.push({ key: 'instrument', depth: instDepth, items: bowFirst ? [...bow, ...inst] : [...inst, ...bow] });
  return groups.sort((a, b) => a.depth - b.depth);
}

const HATCH = '#8a8f9c';

/** The instrument, its bow, its sweep and its player, for one view. */
export function BowedScene({ P, view, bow = true, sweep = true, hatch }: { P: Posture; view: ViewId; bow?: boolean; sweep?: boolean; hatch: SkPath }) {
  const groups = useMemo(() => sceneGroups(P, view, { bow }), [P, view, bow]);
  // In the placement scene the sweeps are keep-outs shown by the engine on
  // approach, never at rest (keepOuts.ts, owner ruling 2026-10-05).
  const keep = useKeepOutsAtRest();
  const sw = useMemo(() => (sweep && keep ? sweepPaths(P, view) : null), [P, view, sweep, keep]);
  const pl = useMemo(() => (!bow && keep && P.kind === 'standing' ? pluckPath(P, view) : null), [P, view, bow, keep]);
  // The player is OPAQUE (figure polish 2026-10-10, owner: limbs that show
  // the instrument through them read as mannequins): painted far to near, the
  // parts behind the instrument first, the parts in front (the bow arm) over
  // it. The keep-outs stay readable as the hatched sweeps drawn on top.
  const at = groups.findIndex((g) => g.key === 'instrument');
  const far = groups.slice(0, at);
  const near = groups.slice(at + 1);
  const draw = (gs: Group3[]) =>
    gs.map((g) => (
      <Group key={g.key}>
        {g.items.map((it, i) => (
          <PaintItem key={i} it={it} />
        ))}
      </Group>
    ));
  return (
    <Group>
      <Group>{draw(far)}</Group>
      {draw(groups.slice(at, at + 1))}
      <Group>{draw(near)}</Group>
      {sw ? (
        <>
          <Group clip={sw.bow}>
            <Path path={hatch} style="stroke" strokeWidth={2} color={HATCH} opacity={0.5} />
          </Group>
          <Path path={sw.bow} style="stroke" strokeWidth={2.5} color={HATCH} opacity={0.75} />
          <Path path={sw.hand} style="stroke" strokeWidth={2.2} color={HATCH} opacity={0.6}>
            <DashPathEffect intervals={[14, 10]} />
          </Path>
        </>
      ) : null}
      {pl ? (
        <>
          <Group clip={pl}>
            <Path path={hatch} style="stroke" strokeWidth={2} color={HATCH} opacity={0.5} />
          </Group>
          <Path path={pl} style="stroke" strokeWidth={2.5} color={HATCH} opacity={0.75} />
        </>
      ) : null}
    </Group>
  );
}

/** Diagonal hatching across a box (mm). */
export function hatchFor(box: { u0: number; u1: number; v0: number; v1: number }): SkPath {
  const p = Skia.Path.Make();
  const span = box.u1 - box.u0 + (box.v1 - box.v0);
  for (let d = 0; d < span; d += 26) {
    p.moveTo(box.u0 + d, box.v0);
    p.lineTo(box.u0 + d - (box.v1 - box.v0), box.v1);
  }
  return p;
}

/* ── labels and taps ── */

export type LabelPlan = Partial<Record<string, { du: number; dv: number; align?: ArtLabel['align']; lead?: boolean }>>;

/** Part labels at the anchors (offsets per lesson and view, mm). */
export function bowedLabels(P: Posture, view: ViewId, offsets: Record<ViewId, LabelPlan>, bowed: boolean): ArtLabel[] {
  const A = anchorsOf(P);
  const at = (p: Vec3, id: string, text: string, short: string | undefined, tone?: ArtLabel['tone']): ArtLabel | null => {
    const o = offsets[view][id];
    if (!o) return null;
    const [u, v] = prj(view, p);
    // The part itself is the leader's end: a label set well clear of the
    // body (the double bass's) still points at what it names.
    return { id, text, short, u: u + o.du, v: v + o.dv, align: o.align ?? 'left', tone, lead: o.lead ? { u, v } : undefined };
  };
  const out: (ArtLabel | null)[] = [
    at(A.bridgeTop, 'bridge', 'BRIDGE', undefined),
    at(A.fholeT, 'fhole', 'F-HOLE', undefined),
    at(toLesson(P.ax, { x: P.st.fbEndX + (P.st.nutX - P.st.fbEndX) * 0.45, y: 0, z: fingerboardZ(P.spec, P.st.fbEndX) }), 'fb', 'FINGERBOARD', 'BOARD'),
    at(A.scroll, 'scroll', 'SCROLL', undefined),
    at(toLesson(P.ax, { x: (P.spec.tailpiece[0] + P.spec.tailpiece[1]) / 2, y: 0, z: 10 }), 'tail', 'TAILPIECE', 'TAIL'),
    P.spec.id === 'violin' || P.spec.id === 'viola' ? at(toLesson(P.ax, { x: P.st.tailX + 38, y: -P.spec.lower.mm * 0.22, z: 20 }), 'chin', 'CHIN REST', 'CHIN') : null,
    P.endpinTip ? at(P.endpinTip, 'endpin', 'ENDPIN', undefined, 'muted') : null,
    bowed ? at(add(P.bow.contact, scale(P.bow.dir, -P.bow.hair * 0.42)), 'bow', 'BOW', undefined) : null,
    bowed ? at(add(P.bow.contact, scale(P.bow.dir, -P.bow.hair * 0.85)), 'sweep', 'BOW’S PATH', 'BOW PATH', 'illustrative') : null,
    at(P.player.head, 'player', 'PLAYER', undefined, 'muted'),
  ];
  return out.filter((l): l is ArtLabel => !!l);
}

/** Distance from (u, v) to a segment, mm. */
function segD(u: number, v: number, a: P2, b: P2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const ll = dx * dx + dy * dy;
  let t = ll > 1e-9 ? ((u - a[0]) * dx + (v - a[1]) * dy) / ll : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(u - (a[0] + dx * t), v - (a[1] + dy * t));
}
function inPoly(u: number, v: number, poly: P2[]): boolean {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi + 1e-12) + xi) ins = !ins;
  }
  return ins;
}

/** The part under a view point (u, v), `tol` in mm. */
export function bowedHitTest(P: Posture, view: ViewId, u: number, v: number, tol: number, bowed: boolean): string | null {
  const { spec, st, ax } = P;
  const B = (q: BPoint) => prj(view, toLesson(ax, q));
  const A = anchorsOf(P);
  const near = (p: Vec3, r: number) => {
    const [a, b] = prj(view, p);
    return Math.hypot(u - a, v - b) <= r + tol;
  };
  const seg = (a: Vec3, b: Vec3, r: number) => segD(u, v, prj(view, a), prj(view, b)) <= r + tol;
  if (near(A.bridgeTop, spec.bridgeH.mm * 0.5) || near(A.bridgeFoot, spec.bridgeW.mm * 0.35)) return 'bw.bridge';
  if (near(A.fholeT, spec.fholeY.mm * 0.35) || near(A.fholeB, spec.fholeY.mm * 0.35)) return 'bw.fholes';
  if ((spec.id === 'violin' || spec.id === 'viola') && near(toLesson(ax, { x: st.tailX + 38, y: -spec.lower.mm * 0.22, z: 20 }), 30)) return 'bw.chinrest';
  if (seg(toLesson(ax, { x: spec.tailpiece[0], y: 0, z: 10 }), toLesson(ax, { x: spec.tailpiece[1], y: 0, z: 10 }), spec.bridgeW.mm * 0.3)) return 'bw.tailpiece';
  if (near(A.scroll, (st.scrollX - st.nutX) * 0.4)) return 'bw.neck';
  if (P.endpinTip && seg(toLesson(ax, { x: st.tailX, y: 0, z: -spec.rib.mm / 2 }), P.endpinTip, 10)) return 'bw.endpin';
  if (bowed && seg(P.bow.tip, P.bow.frog, 10)) return 'bw.bow';
  if (seg(toLesson(ax, { x: st.fbEndX, y: 0, z: fingerboardZ(spec, st.fbEndX) }), toLesson(ax, { x: st.nutX, y: 0, z: fingerboardZ(spec, st.nutX) }), fbHalf(spec, st.fbEndX))) return 'bw.fingerboard';
  if (seg(toLesson(ax, { x: st.neckX, y: 0, z: 0 }), toLesson(ax, { x: st.nutX, y: 0, z: 0 }), fbHalf(spec, st.nutX) * 1.2)) return 'bw.neck';
  const body = outline(spec, 40).map(([x, y]) => B({ x, y, z: 0 }));
  const bodyBack = outline(spec, 40).map(([x, y]) => B({ x, y, z: -spec.rib.mm }));
  if (inPoly(u, v, hull([...body, ...bodyBack]))) return 'bw.body';
  const s = P.player;
  if (near(s.head, s.headR)) return 'bw.head';
  if (seg(s.shoulderR, s.elbowR, 50) || seg(s.elbowR, s.handR, 45)) return bowed ? 'bw.armR1a' : 'bw.armR0a';
  if (seg(s.shoulderL, s.elbowL, 50) || seg(s.elbowL, s.handL, 45)) return 'bw.leftHand';
  if (seg(s.pelvis, s.neck, 140)) return 'bw.player';
  if (P.chair) {
    const c = P.chair.seat;
    const mid = { x: (c.min.x + c.max.x) / 2, y: (c.min.y + c.max.y) / 2, z: (c.min.z + c.max.z) / 2 };
    if (near(mid, 200)) return 'bw.chair';
  }
  return null;
}

/** The instrument component a lesson hands the engine. */
export function makeBowedInstrument(P: Posture, boxes: Record<ViewId, { u0: number; u1: number; v0: number; v1: number }>, bowed: boolean) {
  const hatches = { side: hatchFor(boxes.side), top: hatchFor(boxes.top) };
  return function BowedInstrument({ view }: { view: ViewId; variant: VariantId }): ReactElement {
    return <BowedScene P={P} view={view} bow={bowed} sweep={bowed} hatch={hatches[view]} />;
  };
}

export { stringZ };

/* ── ORIENT's figure: the instrument face-on, lying with its scroll to the
 *    right, and its bow beneath — every part named. ── */

/** The instrument lying flat, top toward the viewer, scroll to the right
 *  (the treble side down): frame B in the SIDE view's (u, v). */
export function portraitOf(spec: BowedSpec): InstPose & { bow: BowPose } {
  const st = stationsOf(spec);
  const ax = { x: { x: 1, y: 0, z: 0 }, y: { x: 0, y: 1, z: 0 }, z: { x: 0, y: 0, z: 1 } };
  const endpinTip = spec.endpin ? { x: st.tailX - (spec.collar?.mm ?? 0) - spec.endpin.mm * 0.55, y: 0, z: -spec.rib.mm / 2 } : undefined;
  const W = spec.lower.mm / 2;
  const hair = spec.bowHair?.mm ?? spec.bow.mm * 0.86;
  const y = W + 70 + spec.bow.mm * 0.04;
  const x0 = (st.tailX + st.scrollX) / 2 - spec.bow.mm / 2;
  const tip = { x: x0, y, z: 40 };
  const frog = { x: x0 + hair + (spec.bow.mm - hair) * 0.12, y, z: 40 };
  const bow: BowPose = { contact: { x: (tip.x + frog.x) / 2, y, z: 40 }, dir: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 }, frogSide: 1, tip, frog, hair };
  return { spec, st, ax, endpinTip, bow };
}

export function portraitBox(spec: BowedSpec) {
  const st = stationsOf(spec);
  const W = spec.lower.mm / 2;
  const left = Math.min(st.tailX - (spec.endpin ? (spec.collar?.mm ?? 0) + spec.endpin.mm * 0.55 : 0), (st.tailX + st.scrollX) / 2 - spec.bow.mm / 2) - 40;
  const right = Math.max(st.scrollX + 40, (st.tailX + st.scrollX) / 2 + spec.bow.mm / 2 + 40);
  return { u0: left, u1: right, v0: -W - 70 * (spec.body.mm / 358), v1: W + 140 + spec.bow.mm * 0.08 };
}

/**
 * The portrait's part labels (frame B, the side view's u = x, v = y): every
 * word sits OFF the body — a row above the upper edge, a row in the gap
 * between the body and the bow — with a leader back to its part (owner
 * 2026-10-05: on the double bass the words sat on the top). Pure, for the tests.
 */
export function portraitLabels(spec: BowedSpec): StaticLabel[] {
  const P = portraitOf(spec);
  const st = P.st;
  const k = spec.body.mm / 358;
  const W = spec.lower.mm / 2;
  const above = -W - 22 * k;
  // In the gap between the body and the bow beneath it.
  const below = W + (P.bow.tip.y - 5 * k - W) * 0.59; // the text sits 7 pt above its v, 5 pt below
  const tailU = (spec.tailpiece[0] + spec.tailpiece[1]) / 2;
  const fhU = (spec.fholeX[0] + spec.fholeX[1]) / 2;
  return [
    { id: 'scroll', text: 'SCROLL', u: st.scrollX - 10, v: -W * 0.55, align: 'right' },
    { id: 'pegs', text: spec.id === 'bass' ? 'TUNING MACHINES' : 'PEGS', short: spec.id === 'bass' ? 'MACHINES' : 'PEGS', u: (st.nutX + st.scrollX) / 2, v: W * 0.62, align: 'center' },
    { id: 'bridge', text: 'BRIDGE', u: 0, v: above, align: 'center', lead: { u: 0, v: -spec.bridgeW.mm * 0.45 } },
    { id: 'fb', text: 'FINGERBOARD', short: 'BOARD', u: (st.fbEndX + st.nutX) / 2, v: above, align: 'center', lead: { u: (st.fbEndX + st.nutX) / 2, v: -fbHalf(spec, (st.fbEndX + st.nutX) / 2) } },
    { id: 'top', text: 'TOP (BELLY)', short: 'TOP', u: -spec.body.mm * 0.32, v: above, align: 'center', lead: { u: -spec.body.mm * 0.32, v: -W * 0.6 } },
    { id: 'tail', text: 'TAILPIECE', short: 'TAIL', u: tailU, v: below, align: 'center', lead: { u: tailU, v: spec.bridgeW.mm * 0.2 } },
    { id: 'fhole', text: 'F-HOLE', u: fhU + 30 * k, v: below, align: 'left', lead: { u: fhU, v: spec.fholeY.mm } },
    spec.endpin ? { id: 'endpin', text: 'ENDPIN', u: st.tailX - (spec.collar?.mm ?? 0) - spec.endpin.mm * 0.3, v: -W * 0.72, align: 'center', lead: { u: st.tailX - (spec.collar?.mm ?? 0) - spec.endpin.mm * 0.3, v: 0 } } : { id: 'chin', text: 'CHIN REST', short: 'CHIN', u: st.tailX - 10, v: above, align: 'right', lead: { u: st.tailX + 30, v: -W * 0.35 } },
    { id: 'strings', text: `STRINGS ${spec.strings.join(' ')}`, short: 'STRINGS', u: st.nutX * 0.7, v: below, align: 'center', tone: 'muted', lead: { u: st.nutX * 0.7, v: 0 } },
    { id: 'tip', text: 'BOW · TIP', short: 'TIP', u: P.bow.tip.x, v: P.bow.tip.y + 38 * k + 12, align: 'left' },
    { id: 'hair', text: 'HAIR', u: P.bow.contact.x, v: P.bow.tip.y + 30 * k + 8, align: 'center', tone: 'muted' },
    { id: 'frog', text: 'FROG', u: P.bow.frog.x, v: P.bow.tip.y + 38 * k + 12, align: 'right' },
  ];
}

/** True where the portrait draws the instrument (body, fingerboard and neck,
 *  pegbox and scroll, tailpiece, endpin, bow) — frame B, mm. Pure. */
export function portraitHit(spec: BowedSpec, u: number, v: number): boolean {
  const P = portraitOf(spec);
  const st = P.st;
  const k = spec.body.mm / 358;
  const body = outline(spec, 40);
  if (inPoly(u, v, body)) return true;
  const seg = (a: P2, b: P2, r: number) => segD(u, v, a, b) <= r;
  if (seg([st.fbEndX, 0], [st.nutX, 0], fbHalf(spec, st.fbEndX))) return true;
  if (seg([st.nutX, 0], [st.scrollX, 0], fbHalf(spec, st.nutX) * 2.4)) return true;
  if (seg([spec.tailpiece[0], 0], [spec.tailpiece[1], 0], spec.bridgeW.mm * 0.3)) return true;
  if (P.endpinTip && seg([st.tailX, 0], [P.endpinTip.x, 0], 6 * k)) return true;
  if (seg([P.bow.tip.x, P.bow.tip.y], [P.bow.frog.x, P.bow.frog.y], 5 * k)) return true;
  return false;
}

export function makeBowedPortrait(spec: BowedSpec, a11y: string): { aspect: number; render: (w: number, h: number) => ReactElement } {
  const P = portraitOf(spec);
  const box = portraitBox(spec);
  const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
  function Portrait({ w, h }: { w: number; h: number }) {
    const textScale = useStageTextScale();
    const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]);
    const items = useMemo(() => [...instrumentItems(P, 'side'), ...bowItems(P, 'side')], []);
    const labels = useMemo(() => portraitLabels(spec), []);
    return (
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {items.map((it, i) => (
              <PaintItem key={i} it={it} />
            ))}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }
  return { aspect, render: (w, h) => <Portrait w={w} h={h} /> };
}
