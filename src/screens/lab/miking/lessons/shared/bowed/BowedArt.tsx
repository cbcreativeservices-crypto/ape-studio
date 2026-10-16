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
import { armPath, BOW_GRIP, drawHand3, FIGURE_TONES, FigureMass, handShape, intoCollar, limb as limbChain, Nails, neckHand, FigureHead, headAbove, headProfile, wristLimit, type FigureTone, type GarmentBox, type HeadPaths } from '../players/PlayerFigure';
import type { HandSkeleton, V3 } from '../players/handModel.ts';
import { BODY, type Hand, type HandKind } from '../players/playerPose.ts';
import { add, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { archAt, fbHalf, fingerboardZ, halfWidth, outline, stationsOf, stringYs, stringZ, type BowedSpec } from './bowedSpec.ts';
import { drawnBow, drawnHands, neckBackZ, type PosedHand } from './bowedHands.ts';
import { anchorsOf, toLesson, type BPoint, type BowPose, type Posture } from './posture.ts';

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
  /** A hand's fingernails (figure pass 3), painted over the mass. */
  nails?: SkPath;
  /** Cloth seams and folds (figure pass 3: a sleeve's armhole seam, the elbow's crook), faint, in the cloth's own edge
   *  tone — short curves, never a line along the sleeve. */
  folds?: SkPath;
  /** Where this mass melts into the one behind it (a sleeve's root in the shoulder): no contour, no rim (FigureMass). */
  quiet?: SkPath;
  /** The far limb in a profile, a little darker (FigureMass). */
  far?: boolean;
  /** Where this mass lies over the same garment: a soft fold edge, no rim (FigureMass). */
  soft?: SkPath;
  /** The garment's bounds: one cloth in one light (FigureMass). */
  garment?: GarmentBox;
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
const SKIN = { colors: ['#e2bfa3', '#b98d6f', '#7d5a45'] };
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
    // (bowedHands.neckBackZ: the same back the stopping hand's thumb rests on.)
    neck.push(B({ x, y: 0, z: neckBackZ(spec, x) - (i === 0 ? 10 * k : 0) }));
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
export type HandHold = {
  kind: HandKind;
  dir?: number;
  at?: P2;
  /** Paint depth for the hand and its forearm (e.g. just behind the instrument). */ depth?: number;
  /** The hand (not its forearm) paints over the instrument (a hand on top of the stick or the strings, seen from above). */
  over?: boolean;
  /** A hand built in its own frame (a fretting hand laid along a neck seen from above): `hand` in local mm, placed by
   *  view = o + rotate(ang)·(u, mirror ? −v : v). Its wrist is where the forearm ends. */
  frame?: { o: P2; ang: number; mirror: boolean; hand: Hand };
  /** The left hand on the NECK (PlayerFigure.neckHand): the four stops on the strings (index first), the neck's
   *  direction toward the scroll and the side its strings face, in the view. */
  neck?: { tips: P2[]; a: P2; b: P2; palmOver?: boolean };
  /** FIGURE PASS 3: a hand POSED bone by bone (players/handModel.ts) in the LESSON frame — the skeleton is projected
   *  into this view and drawn by PlayerFigure.drawHand3. Its wrist (frame origin) is where the forearm ends. `cut`:
   *  a plane in the lesson frame — the parts on its −n side are painted just behind the instrument (a thumb behind a
   *  neck, fingers' roots behind a fingerboard), the rest at the hand's own depth (or `depth`). `hide`: the view's
   *  silhouette of what the hand holds — given, the far parts are hidden only inside it (and paint with the hand
   *  elsewhere) instead of going behind the whole instrument. */
  posed?: { sk: HandSkeleton; cut?: { p: V3; n: V3 }; hide?: SkPath };
  /** Paint depth for the FOREARM alone (the hand keeps `depth`): a stopping hand's arm behind the instrument while
   *  its fingers lie over the board. */
  armDepth?: number;
};
export type PlayerOpts = { hands?: { L?: HandHold; R?: HandHold } };

/** The point of a hand (its own frame) that lands on what it holds. */
function holdAnchor(kind: HandKind, dir: number): P2 {
  if (kind === 'keys' || kind === 'wrap') return [151, Math.cos(dir) >= 0 ? 28 : -28];
  if (kind === 'bow') return [BOW_GRIP.x, Math.cos(dir) >= 0 ? BOW_GRIP.y : -BOW_GRIP.y];
  if (kind === 'grip' || kind === 'pick') return [100, 0];
  return [70, 0];
}

type HandAt = { wrist: P2; dir: number; kind: HandKind; depth?: number; fore: number; over?: boolean; frame?: HandHold['frame']; neck?: ReturnType<typeof neckHand>; palmOver?: boolean; posed?: HandHold['posed']; foreLen?: number; handDepth?: number };
/** A hand's own frame → the view (HandHold.frame). */
function frameMatrix(f: NonNullable<HandHold['frame']>) {
  return Skia.Matrix().translate(f.o[0], f.o[1]).rotate(f.ang).scale(1, f.mirror ? -1 : 1);
}
function frameAt(f: NonNullable<HandHold['frame']>, p: P2): P2 {
  const c = Math.cos(f.ang);
  const sn = Math.sin(f.ang);
  const v = f.mirror ? -p[1] : p[1];
  return [f.o[0] + p[0] * c - v * sn, f.o[1] + p[0] * sn + v * c];
}

/* ── the figure's own shapes (figure pass 2, owner 2026-10-15: "a beautifully
 *    drawn human figure", not interchangeable parts plugged together) ── */
type Box = { u0: number; v0: number; u1: number; v1: number };
const opU = (a: SkPath, b: SkPath | null): SkPath => (b ? (Skia.Path.MakeFromOp(a, b, PathOp.Union) ?? a) : a);
const opI = (a: SkPath, b: SkPath): SkPath | null => Skia.Path.MakeFromOp(a, b, PathOp.Intersect);
const opD = (a: SkPath, b: SkPath): SkPath => Skia.Path.MakeFromOp(a, b, PathOp.Difference) ?? a;
const boxOfPath = (p: SkPath): Box => {
  const r = p.getBounds();
  return { u0: r.x, v0: r.y, u1: r.x + r.width, v1: r.y + r.height };
};
function disc(c: P2, r: number): SkPath {
  const p = Skia.Path.Make();
  p.addCircle(c[0], c[1], r);
  return p;
}
/** The half-plane through c on the side d points to. */
function halfPlane(c: P2, d: P2): SkPath {
  const l = Math.hypot(d[0], d[1]) || 1;
  const a: P2 = [d[0] / l, d[1] / l];
  const n: P2 = [-a[1], a[0]];
  const B = 4000;
  const at = (x: number, y: number): P2 => [c[0] + a[0] * x + n[0] * y, c[1] + a[1] * x + n[1] * y];
  return polyPath([at(0, -B), at(0, B), at(B, B), at(B, -B)]);
}
/** A garment's bounds round some view points (FigureMass `box`: one cloth shaded in one light — owner 2026-10-15). */
const boxAround = (pts: P2[], pad: number, also?: Box): GarmentBox => {
  const b = bbox(pts);
  const u0 = Math.min(b.u0 - pad, also?.u0 ?? Infinity);
  const v0 = Math.min(b.v0 - pad, also?.v0 ?? Infinity);
  return { x: u0, y: v0, width: Math.max(b.u1 + pad, also?.u1 ?? -Infinity) - u0, height: Math.max(b.v1 + pad, also?.v1 ?? -Infinity) - v0 };
};

/**
 * THE TORSO IN PROFILE — the house side figure's (PlayerFigure.buildSide)
 * shaping, built round this skeleton's hip → collar line: the collar, the
 * chest fuller than the belly, the shirt tucked in at the belt, the trousers'
 * pelvis (a flat front, the seat behind), and a HEALTHY BACK — nearly straight
 * from the nape down the shoulder blades into a gentle lumbar hollow (no
 * point of it more than ≈ 20 mm behind the nape → seat line). Offsets in mm
 * from the hip → collar axis (+ toward the face).
 */
function profileTorso(hip: P2, n: P2, f: number, shoulder?: P2) {
  const ax = Math.atan2(n[1] - hip[1], n[0] - hip[0]);
  let nu = -Math.sin(ax);
  let nv = Math.cos(ax);
  if (Math.sign(nu || f) !== Math.sign(f)) {
    nu = -nu;
    nv = -nv;
  }
  const along = (t: number, fwd: number): P2 => [hip[0] + (n[0] - hip[0]) * t + nu * fwd, hip[1] + (n[1] - hip[1]) * t + nv * fwd];
  let torso = smoothClosedP2([
    along(1.02, 46), // the front of the collar
    along(0.86, 104), // the chest
    along(0.6, 112),
    along(0.32, 96), // the belly, narrower than the chest
    along(0.06, 104), // the front at the hip
    along(-0.1, 40),
    along(-0.06, -112), // the seat
    along(0.24, -90), // the small of the back
    along(0.45, -98),
    along(0.7, -100), // the shoulder blade
    along(0.9, -82),
    along(1.02, -52), // the nape
  ]);
  const L = Math.hypot(n[0] - hip[0], n[1] - hip[1]) || 1;
  if (shoulder) {
    // A near shoulder carried FORWARD (a reaching or protracted arm: the trombone's slide arm, a bow arm at full
    // reach) takes the shirt with it: the deltoid and the chest's top grow out round the joint as one rounded
    // mass, so the sleeve leaves a shoulder, never a tube plugged onto the chest (lead/brass review 2026-10-15).
    const rel: P2 = [shoulder[0] - hip[0], shoulder[1] - hip[1]];
    const fwdOff = rel[0] * nu + rel[1] * nv;
    const t = (rel[0] * (n[0] - hip[0]) + rel[1] * (n[1] - hip[1])) / (L * L);
    if (fwdOff > 20) {
      const pts = [...circlePts(shoulder, 58, 16), ...circlePts(along(t - 0.06, 20), 84, 16), ...circlePts(along(Math.min(0.98, t + 0.04), -30), 56, 16)];
      torso = opU(torso, smoothClosedP2(hull(pts)));
    }
  }
  // The trousers' pelvis: a flat front no further forward than the thigh, the seat behind, the crotch under.
  const pelvis = smoothClosedP2([along(0.15, 92), along(0.02, 88), along(-0.1, 80), along(-0.17, 20), along(-0.16, -64), along(-0.06, -106), along(0.06, -112), along(0.15, -100)]);
  // The shirt is tucked in: nothing of it below the belt.
  const shirt = opD(torso, polyPath([along(0.12, 400), along(0.12, -400), along(-3, -400), along(-3, 400)]));
  const bt = 16 / L;
  const belt = opI(polyPath([along(0.12 + bt, 140), along(0.12 + bt, -160), along(0.12 - bt, -160), along(0.12 - bt, 140)]), torso);
  // (No collar stroke: at this size it read as a stray tick; the collar is the shirt's own edge where the neck goes in.)
  return { torso, shirt, pelvis, belt };
}

/** A shoe in profile (PlayerFigure.buildSide's): `F` the ball of the foot on the floor, `fs` the way the toe points. */
function shoeSide(F: P2, fs: number): SkPath {
  const P = (du: number, dv: number): P2 => [F[0] + fs * du, F[1] + dv];
  return smoothClosedP2([P(-96, -2), P(-100, -64), P(-44, -92), P(40, -62), P(140, -34), P(150, -4)]);
}
/** A shoe from above (PlayerFigure.buildAbove's): the heel behind the ankle, the toe along `fwd`. */
function shoeAbove(F: P2, fwd: P2): SkPath {
  const side: P2 = [-fwd[1], fwd[0]];
  const P = (du: number, dv: number): P2 => [F[0] + side[0] * du + fwd[0] * dv, F[1] + side[1] * du + fwd[1] * dv];
  return smoothClosedP2([P(-34, -96), P(34, -96), P(46, -20), P(48, 60), P(34, 128), P(0, 150), P(-34, 128), P(-48, 60), P(-46, -20)]);
}

/** An open smooth curve through view points (quadratics through the midpoints). */
function openCurve(into: SkPath, pts: P2[]) {
  into.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) into.quadTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  into.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}

/**
 * A SLEEVE'S CLOTH (figure pass 3, owner 2026-10-15: "shoulder transitions from shirt sleeves to the shirt body look
 * very unnatural … plugged"): the near sleeve's ARMHOLE SEAM — the curve where a sleeve is sewn into the shirt,
 * wrapping the root of the arm just below the deltoid's cap from the shoulder's top round its front to the armpit
 * (`front`: the way the figure faces in the picture; 0 = no seam, a far arm) — and two soft FOLDS in the elbow's
 * crook where the cloth bunches (an elbow bent past ≈ 25°). Short curves only, painted clipped to the sleeve
 * (PaintItem): never a welt along it.
 */
function sleeveFolds(S2: P2, E2: P2, w2: P2, front: number): SkPath | undefined {
  const out = Skia.Path.Make();
  const l1 = Math.hypot(E2[0] - S2[0], E2[1] - S2[1]) || 1;
  const d1: P2 = [(E2[0] - S2[0]) / l1, (E2[1] - S2[1]) / l1];
  if (front) {
    // The arm's own across direction, signed toward the front of the figure.
    let n: P2 = [-d1[1], d1[0]];
    if (n[0] * front < 0) n = [-n[0], -n[1]];
    const c: P2 = [S2[0] + d1[0] * 8, S2[1] + d1[1] * 8];
    const pts: P2[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = ((-80 + (165 * i) / 8) * Math.PI) / 180; // from the shoulder's top, down round the front, to the armpit
      pts.push([c[0] + d1[0] * 30 * Math.cos(t) + n[0] * 42 * Math.sin(t), c[1] + d1[1] * 30 * Math.cos(t) + n[1] * 42 * Math.sin(t)]);
    }
    openCurve(out, pts);
  }
  const l2 = Math.hypot(w2[0] - E2[0], w2[1] - E2[1]) || 1;
  const d2: P2 = [(w2[0] - E2[0]) / l2, (w2[1] - E2[1]) / l2];
  const bend = Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])));
  if (bend > (25 * Math.PI) / 180) {
    // The crook: the inside of the bend.
    const cl = Math.hypot(d2[0] - d1[0], d2[1] - d1[1]) || 1;
    const cn: P2 = [(d2[0] - d1[0]) / cl, (d2[1] - d1[1]) / cl];
    const ml = Math.hypot(d1[0] + d2[0], d1[1] + d2[1]) || 1;
    const m: P2 = [(d1[0] + d2[0]) / ml, (d1[1] + d2[1]) / ml];
    const r = 38;
    for (const [k, len] of [[-1, 17], [1, 13]] as const) {
      const p0: P2 = [E2[0] + cn[0] * r + m[0] * k * 8, E2[1] + cn[1] * r + m[1] * k * 8];
      const p1: P2 = [p0[0] - cn[0] * len * 0.55 + m[0] * k * 6, p0[1] - cn[1] * len * 0.55 + m[1] * k * 6];
      const p2: P2 = [p0[0] - cn[0] * len + m[0] * k * 7, p0[1] - cn[1] * len + m[1] * k * 7];
      openCurve(out, [p0, p1, p2]);
    }
  }
  return out.countPoints() === 0 ? undefined : out;
}

export function playerGroups(P: Pick<Posture, 'player' | 'chair'>, view: ViewId, withRightArm = true, opts: PlayerOpts = {}): Group3[] {
  const s = P.player;
  const q = (p: Vec3) => prj(view, p);
  const g: Group3[] = [];
  const mid3 = (a: Vec3, b: Vec3) => add(scale(a, 0.5), scale(b, 0.5));
  const toPt = (a: P2) => ({ u: a[0], v: a[1] });
  // The figure is painted at the shared player's standard (clarity pass
  // 2026-10-05): each mass with the house form, rim light and core shadow.
  const fw = Math.hypot(s.face.x, s.face.z) > 1e-6 ? scale({ x: s.face.x, y: 0, z: s.face.z }, 1 / Math.hypot(s.face.x, s.face.z)) : { x: 1, y: 0, z: 0 };
  const chestD = depthOf(view, s.chest);
  // SEATED: the thighs run forward from the seat (a standing figure's hang).
  const seated = s.kneeR.y - s.hipR.y < 250 && s.kneeL.y - s.hipL.y < 250;
  const f2 = prj(view, s.face);
  const facing = f2[0] >= 0 ? 1 : -1;
  const hipMid = q(mid3(s.hipL, s.hipR));
  // (The near shoulder as drawn: a protracted bow arm's root, the trombone's forward slide shoulder.)
  const nearSh = depthOf(view, s.shoulderR) >= depthOf(view, s.shoulderL) ? s.shoulderR : s.shoulderL;
  const prof = view === 'side' ? profileTorso(hipMid, q(s.neck), facing, q(nearSh)) : null;

  // LEGS: the house leg (thigh → knee → ankle, BODY's radii), the near leg one
  // trouser mass with the pelvis; shoes in the house shape, the trouser hem
  // over the shoe's top.
  const legPath = (hip: Vec3, knee: Vec3, ankle: Vec3) => limbChain([toPt(q(hip)), toPt(q(knee)), toPt(q(ankle))], [BODY.thighR, seated ? BODY.kneeR : BODY.kneeR - 4, BODY.ankleR]);
  const trouserBox = boxAround([q(s.hipL), q(s.hipR), q(s.kneeL), q(s.kneeR), q(s.ankleL), q(s.ankleR)], 110);
  if (view === 'side') {
    const nearR = depthOf(view, s.hipR) >= depthOf(view, s.hipL);
    const legD = (hip: Vec3, knee: Vec3) => {
      const d = depthOf(view, mid3(hip, knee));
      // Standing: under the shirt's hem. Seated: the near thigh lies over the lap and in front of what is between the knees.
      return seated ? d : Math.min(d, chestD - 0.5);
    };
    const legs = (['L', 'R'] as const).map((side) => {
      const hip = side === 'L' ? s.hipL : s.hipR;
      const knee = side === 'L' ? s.kneeL : s.kneeR;
      const ankle = side === 'L' ? s.ankleL : s.ankleR;
      const toe = side === 'L' ? s.toeL : s.toeR;
      return { side, hip, knee, ankle, toe, near: (side === 'R') === nearR, d: legD(hip, knee) };
    });
    const far = legs.find((l) => !l.near)!;
    const near = legs.find((l) => l.near)!;
    near.d = Math.max(near.d, far.d + 0.04);
    if (!seated) near.d = Math.min(near.d, chestD - 0.1);
    for (const l of [far, near]) {
      const A2 = q(l.ankle);
      const T2 = q(l.toe);
      const fs = Math.sign(T2[0] - A2[0]) || facing;
      const F: P2 = [A2[0] + fs * 40, T2[1] > A2[1] ? T2[1] + 22 : A2[1] + 80];
      const shoe = shoeSide(F, fs);
      g.push({ key: `foot${l.side}`, depth: l.d - 0.02, items: [{ path: shoe, box: boxOfPath(shoe), tone: 'shoe', far: !l.near }] });
      const leg = legPath(l.hip, l.knee, l.ankle);
      const mass = l.near && prof ? opU(prof.pelvis, leg) : leg;
      g.push({ key: `thigh${l.side}`, depth: l.d, items: [{ path: mass, garment: trouserBox, box: boxOfPath(mass), tone: 'trousers', far: !l.near }] });
    }
  } else if (seated) {
    // From above only a seated player's legs show (the thighs forward of the body).
    for (const side of ['L', 'R'] as const) {
      const hip = side === 'L' ? s.hipL : s.hipR;
      const knee = side === 'L' ? s.kneeL : s.kneeR;
      const leg = legPath(hip, knee, side === 'L' ? s.ankleL : s.ankleR);
      g.push({ key: `thigh${side}`, depth: Math.min(depthOf(view, mid3(hip, knee)), chestD - 0.5), items: [{ path: leg, garment: trouserBox, box: boxOfPath(leg), tone: 'trousers' }] });
    }
  }
  if (view === 'top') {
    // Shoes from above, toe forward — only where a foot truly shows past the body (owner 2026-10-10: a standing person from above shows no feet).
    const n2 = q(s.neck);
    for (const side of ['L', 'R'] as const) {
      const A2 = q(side === 'L' ? s.ankleL : s.ankleR);
      const T2 = q(side === 'L' ? s.toeL : s.toeR);
      const l = Math.hypot(T2[0] - A2[0], T2[1] - A2[1]) || 1;
      const fwd: P2 = [(T2[0] - A2[0]) / l, (T2[1] - A2[1]) / l];
      const F: P2 = [A2[0] + fwd[0] * 40, A2[1] + fwd[1] * 40];
      if (Math.hypot(F[0] - n2[0], F[1] - n2[1]) <= 260) continue;
      const shoe = shoeAbove(F, fwd);
      g.push({ key: `foot${side}`, depth: depthOf(view, side === 'L' ? s.toeL : s.toeR), items: [{ path: shoe, box: boxOfPath(shoe), tone: 'shoe' }] });
    }
  }

  // THE TORSO. From the side: the profile above. FROM ABOVE (owner review
  // 2026-10-10: the hull read as a hard octagon): the shared figure's
  // shoulder outline (PlayerFigure.buildAbove) — a smooth ROUNDED RECTANGLE
  // ≈ 456 mm across the deltoids, ≈ 236 mm deep, the back nearly flat, the
  // deltoids rounded, the chest a little fuller — laid along the facing.
  let topTorso: SkPath | null = null;
  if (view === 'top') {
    const n2 = q(s.neck);
    const ff = prj(view, fw);
    const fl = Math.hypot(ff[0], ff[1]) || 1;
    const fx = ff[0] / fl;
    const fy = ff[1] / fl;
    const OUT: P2[] = [[0, -112], [118, -108], [178, -66], [222, -28], [228, 26], [218, 74], [174, 106], [90, 116], [0, 124], [-90, 116], [-174, 106], [-218, 74], [-228, 26], [-222, -28], [-178, -66], [-118, -108]];
    const pts: P2[] = OUT.map(([a, b]) => [n2[0] + a * -fy + b * fx, n2[1] + a * fx + b * fy]);
    const path = smoothClosedP2(pts);
    topTorso = path;
  }

  // Hands with fingers (the shared hand), each HOLDING what it holds (figure
  // polish 2026-10-10): its wrist, from where the hand lands.
  // A wrist never bends past ≈ 70° from the forearm (owner 2026-10-10:
  // anatomy): the hand turns about what it holds until it is within that.
  const wristOf2 = (h: Vec3, elbow: Vec3, hold: HandHold | undefined): HandAt => {
    const e = q(elbow);
    if (hold?.posed) {
      // The posed hand's wrist (its frame's origin) is where the forearm ends.
      const w = q(hold.posed.sk.frame.o);
      // (`depth` paints the forearm; the hand itself paints at `handDepth`.)
      return { wrist: w, dir: 0, kind: hold.kind, depth: hold.armDepth ?? hold.depth, handDepth: hold.depth, fore: Math.atan2(w[1] - e[1], w[0] - e[0]), over: hold.over, posed: hold.posed, foreLen: Math.hypot(w[0] - e[0], w[1] - e[1]) };
    }
    if (hold?.neck) {
      const P2p = (z: P2) => ({ u: z[0], v: z[1] });
      const nh = neckHand(hold.neck.tips.map(P2p), P2p(hold.neck.a), P2p(hold.neck.b), P2p(e));
      const w: P2 = [nh.wrist.u, nh.wrist.v];
      return { wrist: w, dir: nh.dir, kind: hold.kind, depth: hold.depth, fore: Math.atan2(w[1] - e[1], w[0] - e[0]), neck: nh, palmOver: hold.neck.palmOver };
    }
    if (hold?.frame) {
      const w = frameAt(hold.frame, [hold.frame.hand.wrist.u, hold.frame.hand.wrist.v]);
      return { wrist: w, dir: hold.frame.hand.dir, kind: hold.kind, depth: hold.depth, fore: Math.atan2(w[1] - e[1], w[0] - e[0]), over: hold.over, frame: hold.frame };
    }
    const c = hold?.at ?? q(h);
    let dir = hold?.dir ?? Math.atan2(c[1] - e[1], c[0] - e[0]);
    const kind = hold?.kind ?? 'rest';
    const place = (d: number): P2 => {
      const [ax, ay] = holdAnchor(kind, d);
      return [c[0] - (ax * Math.cos(d) - ay * Math.sin(d)), c[1] - (ax * Math.sin(d) + ay * Math.cos(d))];
    };
    let wrist = place(dir);
    for (let i = 0; i < 4; i++) {
      const lim = wristLimit(Math.atan2(wrist[1] - e[1], wrist[0] - e[0]), dir);
      if (Math.abs(lim - dir) < 1e-3) break;
      dir = lim;
      wrist = place(dir);
    }
    return { wrist, dir, kind, depth: hold?.depth, fore: Math.atan2(wrist[1] - e[1], wrist[0] - e[0]), over: hold?.over };
  };
  const wL = wristOf2(s.handL, s.elbowL, opts.hands?.L);
  const wR = wristOf2(s.handR, s.elbowR, opts.hands?.R);
  // The shirt's one light: the torso and both sleeves.
  const shirtBox = boxAround([q(s.shoulderL), q(s.shoulderR), q(s.elbowL), q(s.elbowR), wL.wrist, wR.wrist], 60, boxOfPath(prof ? prof.torso : topTorso!));
  if (prof) {
    g.push({
      key: 'torso',
      depth: chestD,
      items: [
        { path: prof.shirt, garment: shirtBox, box: boxOfPath(prof.shirt), tone: 'shirt' },
        ...(prof.belt ? [{ path: prof.belt, fill: { colors: ['#2a2c33', '#17181d', '#0b0c0f'] }, box: boxOfPath(prof.belt) } as Item] : []),
      ],
    });
  }
  // Arms (owner 2026-10-10 at 3×: a readable elbow, a forearm with its
  // muscle, a wrist): each arm is ONE outline (PlayerFigure.armPath) —
  // shoulder → elbow → the hand's own wrist. The upper arm and the forearm
  // still paint at their own depths (an instrument can pass between them):
  // the farther part paints the whole arm, the nearer part the same arm
  // clipped to its side of the elbow, so no seam is ever drawn across it.
  // THE SLEEVE GROWS OUT OF THE SHIRT (owner 2026-10-15): in profile the near
  // sleeve carries the deltoid (a teardrop over the joint, kept inside the
  // shirt's outline, so no knob rises over the shoulder line) and melts into
  // the shirt at the shoulder — no contour, no rim there, the same cloth lit
  // as one piece. From above, the torso and both sleeves are ONE garment
  // outline.
  const P2pt = (a: P2) => ({ u: a[0], v: a[1] });
  const SIDE_ARM = { root: 48, upper: 43, elbow: 37, belly: 40, cuff: 31, cuffGap: 16 } as const;
  const TOP_ARM = { root: 46, upper: 42, elbow: 37, belly: 38, cuff: 30, cuffGap: 16 } as const;
  const nearArm = depthOf(view, s.shoulderR) >= depthOf(view, s.shoulderL) ? 'R' : 'L';
  const topArms: { side: 'L' | 'R'; path: SkPath; depth: number }[] = [];
  const arm = (side: 'L' | 'R', sh: Vec3, el: Vec3, h: Vec3, w2: P2, depth?: number) => {
    let S2 = q(sh);
    // A far shoulder a turned body carries behind the profile's back (the bassist) hangs its sleeve from inside the
    // shirt, a deltoid's width in from the back, never from a knob behind it.
    if (prof && side !== nearArm) for (let i = 0; i < 16 && !prof.torso.contains(S2[0] - facing * 44, S2[1]); i++) S2 = [S2[0] + facing * 6, S2[1]];
    const E2 = q(el);
    const path = armPath(P2pt(S2), P2pt(E2), P2pt(w2), view === 'top' ? TOP_ARM : SIDE_ARM);
    const box = bbox([S2, E2, w2]);
    if (view === 'top') {
      topArms.push({ side, path, depth: depthOf(view, add(scale(el, 0.5), scale(h, 0.5))) });
      return;
    }
    let body = path;
    let quiet: SkPath | undefined;
    let soft: SkPath | undefined;
    const isNear = side === nearArm && prof;
    if (isNear) {
      const a = Math.atan2(E2[1] - S2[1], E2[0] - S2[0]);
      const A = (al: number, ac: number): P2 => [S2[0] + Math.cos(a) * al - Math.sin(a) * ac, S2[1] + Math.sin(a) * al + Math.cos(a) * ac];
      const deltoid = opI(smoothClosedP2([A(-44, 0), A(-30, 40), A(10, 45), A(70, 44), A(112, 43), A(112, -43), A(70, -44), A(10, -45), A(-30, -40)]), prof.torso);
      body = opU(body, deltoid);
      // Nothing of the sleeve's round root behind the joint stands out of the shirt (the "shoulder knob").
      body = opD(body, opD(halfPlane(S2, [-Math.cos(a), -Math.sin(a)]), prof.torso));
      // The whole deltoid region (the teardrop reaches 112 mm down the arm, 45 across): no contour, no rim inside the shirt there.
      quiet = opI(disc(S2, 128), prof.torso) ?? undefined;
      // Over the shirt body the sleeve's edge is a soft fold, not the outline of a separate part.
      soft = prof.torso;
    }
    const dUp = depthOf(view, add(scale(sh, 0.5), scale(el, 0.5)));
    const dFore = depth !== undefined ? depth - 1 : depthOf(view, add(scale(el, 0.5), scale(h, 0.5)));
    const folds = sleeveFolds(S2, E2, w2, isNear ? facing : 0);
    const mass = (clip?: SkPath): Item => ({ path: body, fill: CLOTH, box, rim: 1.4, tone: 'shirt', clip, quiet, soft, garment: shirtBox, far: side !== nearArm, folds });
    // The elbow's dividing line: square to the arm's mean direction there.
    const d1 = [E2[0] - S2[0], E2[1] - S2[1]];
    const d2 = [w2[0] - E2[0], w2[1] - E2[1]];
    const l1 = Math.hypot(d1[0], d1[1]) || 1;
    const l2 = Math.hypot(d2[0], d2[1]) || 1;
    let m = [d1[0] / l1 + d2[0] / l2, d1[1] / l1 + d2[1] / l2];
    const lm = Math.hypot(m[0], m[1]);
    m = lm > 1e-3 ? [m[0] / lm, m[1] / lm] : [-d1[1] / l1, d1[0] / l1];
    const half = (toWrist: boolean): SkPath => {
      const s = toWrist ? 1 : -1;
      const n = [-m[1], m[0]];
      const B = 4000;
      const at = (a: number, b: number): P2 => [E2[0] + m[0] * a + n[0] * b, E2[1] + m[1] * a + n[1] * b];
      return polyPath([at(0, -B), at(0, B), at(s * B, B), at(s * B, -B)]);
    };
    const foreNear = dFore >= dUp;
    g.push({ key: `upper${side}`, depth: dUp, items: [mass(foreNear ? undefined : half(false))] });
    g.push({ key: `fore${side}`, depth: dFore, items: [mass(foreNear ? half(true) : undefined)] });
  };
  arm('L', s.shoulderL, s.elbowL, s.handL, wL.wrist, wL.depth);
  if (withRightArm) arm('R', s.shoulderR, s.elbowR, s.handR, wR.wrist, wR.depth);
  if (topTorso) {
    // ONE GARMENT from above: the shoulders' outline and both sleeves as one
    // silhouette, just over where the arms lie (their roots inside it), never
    // over an instrument held above the chest. A sleeve that lay higher than
    // that (a raised arm) paints again at its own height — the same garment,
    // clipped round that sleeve, so the two coats match pixel for pixel and
    // no seam shows where they meet.
    let garment = topTorso;
    for (const a of topArms) garment = opU(garment, a.path);
    const armD = topArms.length ? Math.min(...topArms.map((a) => a.depth)) : chestD;
    const main = Math.max(chestD, armD + 0.5);
    const gBox = boxOfPath(garment);
    g.push({ key: 'torso', depth: main, items: [{ path: garment, fill: CLOTH, stroke: { color: OUTLINE, w: 1.8 }, box: gBox, rim: 1.6, tone: 'shirt' }] });
    for (const a of topArms) {
      if (a.depth <= main) continue;
      const grow = a.path.copy().stroke({ width: 16 });
      g.push({ key: `upper${a.side}`, depth: a.depth, items: [{ path: garment, box: gBox, tone: 'shirt', clip: opU(a.path, grow ?? null) }] });
    }
  }
  const instDepth = depthOf(view, { x: 0, y: 0, z: 0 });
  const hand = (key: string, h: Vec3, w: HandAt) => {
    if (w.posed) {
      // FIGURE PASS 3: the posed hand projected into this view (u, v as the art's; d toward the viewer).
      const VIEW = (p: Vec3) => {
        const [u, v] = prj(view, p);
        return { u, v, d: depthOf(view, p) };
      };
      const d = drawHand3(w.posed.sk, VIEW, { fore: w.fore, foreshortened: (w.foreLen ?? 255) < 0.85 * 255, cut: w.posed.cut });
      const bb = (p: SkPath) => {
        const r = p.getBounds();
        return { u0: r.x, v0: r.y, u1: r.x + r.width, v1: r.y + r.height };
      };
      let front = d.path;
      if (d.behind && w.posed.hide) {
        // Hidden only where what it holds covers it (the neck, the stick): elsewhere it is the same hand, at its own
        // depth (a big instrument's body far below a hand seen from above never covers it).
        front = opU(front, opD(d.behind, w.posed.hide));
      } else if (d.behind) g.push({ key: `${key}Behind`, depth: instDepth - 0.5, items: [{ path: d.behind, fill: SKIN, box: bb(d.behind), tone: 'skin' }] });
      const depth = w.handDepth ?? depthOf(view, w.posed.sk.frame.o) + 25;
      g.push({ key, depth: w.over ? instDepth + 0.5 : depth, items: [{ path: front, fill: SKIN, box: bb(front), tone: 'skin', lines: d.lines, nails: d.nails }] });
      return;
    }
    if (w.neck) {
      // The palm behind the neck (over its own forearm), the arched fingers over the board.
      const bb = (p: SkPath) => {
        const r = p.getBounds();
        return { u0: r.x, v0: r.y, u1: r.x + r.width, v1: r.y + r.height };
      };
      // (From above, a neck seen end-on: the back of the hand lies beside it, in view.)
      g.push({ key: `${key}Palm`, depth: w.palmOver ? instDepth + 0.4 : instDepth - 0.5, items: [{ path: w.neck.behind, fill: SKIN, box: bb(w.neck.behind), tone: 'skin' }] });
      g.push({ key, depth: instDepth + 0.5, items: [{ path: w.neck.front, fill: SKIN, box: bb(w.neck.front), tone: 'skin', lines: w.neck.lines }] });
      return;
    }
    let hs: ReturnType<typeof handShape>;
    if (w.frame) {
      hs = handShape(w.frame.hand);
      const m = frameMatrix(w.frame);
      for (const p of [hs.path, hs.lines, hs.thumbBehind]) p?.transform(m);
    } else {
      hs = handShape({ wrist: { u: w.wrist[0], v: w.wrist[1] }, dir: w.dir, kind: w.kind }, w.fore);
    }
    const b = hs.path.getBounds();
    const depth = w.over ? instDepth + 0.5 : (w.depth ?? depthOf(view, h) + 25);
    g.push({ key, depth, items: [{ path: hs.path, fill: SKIN, box: { u0: b.x, v0: b.y, u1: b.x + b.width, v1: b.y + b.height }, tone: 'skin', lines: hs.lines }] });
    if (hs.thumbBehind && (w.kind === 'bow' || w.frame)) {
      // The thumb is on the far side of what the hand holds (under the bow's
      // stick; behind the neck): painted just behind the instrument group.
      const t = hs.thumbBehind.getBounds();
      g.push({ key: `${key}Thumb`, depth: instDepth - 0.01, items: [{ path: hs.thumbBehind, fill: SKIN, box: { u0: t.x, v0: t.y, u1: t.x + t.width, v1: t.y + t.height }, tone: 'skin' }] });
    }
  };
  hand('handL', s.handL, wL);
  if (withRightArm) hand('handR', s.handR, wR);
  // The head: the house head (bald, no face) — in profile from the side, its
  // neck going INTO the collar (PlayerFigure.intoCollar: the head's silhouette
  // stops at the shirt's outline), turned to the face from above.
  const hc = q(s.head);
  const fl = Math.hypot(f2[0], f2[1]) || 1;
  const fu: P2 = [f2[0] / fl, f2[1] / fl];
  const r = s.headR;
  let paths: HeadPaths;
  if (view === 'side') {
    paths = headProfile({ u: hc[0], v: hc[1] }, r, q(s.neck)[1], fu[0] >= 0 ? 1 : -1);
    if (prof) paths = intoCollar(paths, prof.torso);
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
        <FigureMass path={it.path} tone={it.tone} contour={1.8} far={it.far} quiet={it.quiet ?? null} soft={it.soft ?? null} box={it.garment ?? null} />
        {it.lines ? <Path path={it.lines} style="stroke" strokeWidth={1.6} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.7} /> : null}
        {it.nails ? <Nails path={it.nails} /> : null}
        {it.folds ? (
          <Group clip={it.path}>
            <Path path={it.folds} style="stroke" strokeWidth={1.3} strokeCap="round" color={FIGURE_TONES[it.tone].edge} opacity={0.42} />
          </Group>
        ) : null}
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
 * THE HANDS ON THE INSTRUMENT (figure pass 3, owner 2026-10-15): the posed
 * hands of bowedHands.ts — the stopping hand in first position (pads on the
 * strings at their stops, the fingers arched over the board from the treble
 * side, the thumb on the neck's flank or its back), the bow hold at the frog,
 * the bass's pizzicato hand — each a 3-D skeleton projected into the view.
 * The part of a hand beyond what it holds (a thumb behind the neck, under the
 * stick; fingers' roots behind the board) paints just behind the instrument:
 * the plane through the neck or the stick, square to the view.
 */
function cutFor(view: ViewId, axis: { p: V3; d: V3 }): { p: V3; n: V3 } | undefined {
  const V = TO_VIEWER[view];
  const n = sub(V, scale(axis.d, dot(V, axis.d)));
  if (len(n) < 0.25) return undefined; // seen end-on: nothing to hide behind
  return { p: axis.p, n: norm(n) };
}
function posedHold(h: PosedHand, view: ViewId, instDepth: number, stopping: boolean, hide: SkPath): HandHold {
  const natural = depthOf(view, h.sk.frame.o) + 25;
  // The hand over the instrument (its fingers on the strings, the stick); a stopping hand's forearm, seen from the
  // player's side, behind it (the hand reaches round the neck from its far side).
  return { kind: 'wrap', posed: { sk: h.sk, cut: cutFor(view, h.axis), hide }, depth: Math.max(instDepth + 0.5, natural), armDepth: stopping && view === 'side' ? instDepth - 1 : undefined };
}
/** The neck and fingerboard's silhouette round the stopping hand (≈ 180 mm either way along the neck). */
function neckHide(P: Posture, view: ViewId, h: PosedHand): SkPath {
  const { spec, st } = P;
  const xh = dot(sub(h.sk.frame.o, { x: 0, y: 0, z: 0 }), P.ax.x);
  const pts: P2[] = [];
  for (let i = 0; i <= 8; i++) {
    const x = Math.max(st.neckX - 20, Math.min(st.scrollX, xh - 200 + 50 * i));
    const fz = fingerboardZ(spec, x);
    for (const y of [-fbHalf(spec, x), fbHalf(spec, x)]) for (const z of [fz + 1, neckBackZ(spec, x)]) pts.push(prj(view, toLesson(P.ax, { x, y, z })));
  }
  return polyPath(hull(pts));
}
/** The bow's stick and frog round the bow hand (BowedArt.bowItems' shapes). */
function stickHide(P: Posture, view: ViewId): SkPath {
  const b = P.bow;
  const k = Math.max(1, P.spec.bow.mm / 750);
  const at = (d: number, lift: number) => prj(view, add(add(b.frog, scale(b.dir, -d)), scale(b.up, lift * k)));
  const stick: P2[] = [];
  for (const d of [-80, 0, 80, 160, 240]) for (const l of [12.5, 20.5]) stick.push(at(d, l));
  const frog: P2[] = [at(-13, 2), at(66, 2), at(66, 18), at(-13, 20)];
  return opU(polyPath(hull(stick)), polyPath(hull(frog)));
}

/** All the groups for a view, far to near. The posture as DRAWN (bowedHands.drawnHands): the violin/viola bow near
 *  the end of a down-bow, each elbow solved to its posed wrist; the keep-outs, hit areas and mics stay the posture's. */
export function sceneGroups(P0: Posture, view: ViewId, opts: { player?: boolean; bow?: boolean } = {}): Group3[] {
  const bowed = opts.bow !== false;
  const D = P0.player ? drawnHands(P0, bowed && P0.strokes.length > 0) : null;
  const P = D ? D.P : P0;
  const groups: Group3[] = [];
  const instDepth = depthOf(view, { x: 0, y: 0, z: 0 });
  if (opts.player !== false && D) {
    const L = posedHold(D.L, view, instDepth, true, neckHide(P, view, D.L));
    const R = D.R ? posedHold(D.R, view, instDepth, false, bowed ? stickHide(P, view) : neckHide(P, view, D.R)) : undefined;
    groups.push(...playerGroups(P, view, true, { hands: { L, R } }));
  }
  const inst = instrumentItems(P, view);
  // The bow lies on the strings: right after the instrument when its top
  // faces the camera, before it when the back does.
  const bowFirst = dot(P.ax.z, TO_VIEWER[view]) < -0.05;
  const bow = bowed && P.player && P.strokes.length > 0 ? bowItems(P, view) : [];
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
  const drawn = bowed ? drawnBow(P) : P;
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
    // BOW names the stick AS DRAWN (bowedHands.drawnBow: the end of a down-bow, the
    // stick out toward the hand) — not the posture's mid-stroke tip behind the head.
    bowed ? at(drawn.bow !== P.bow ? add(drawn.bow.contact, scale(drawn.bow.dir, drawn.bow.hair * 0.55)) : add(P.bow.contact, scale(P.bow.dir, -P.bow.hair * 0.42)), 'bow', 'BOW', undefined) : null,
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
