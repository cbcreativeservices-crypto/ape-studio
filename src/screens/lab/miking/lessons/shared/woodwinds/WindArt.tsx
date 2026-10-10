/**
 * THE WOODWIND FAMILY — the look (charter §2 layer 3). Everything is drawn
 * from windPosture.ts in 3-D and PROJECTED (the engine's orthographic views:
 * FRONT from the audience, u = x, v = y; TOP from above, u = x, v = z), so
 * the drawing sits exactly where the collisions, the zones and the physics
 * are.
 *
 * At the Kick standard (owner 2026-10-04): real objects, never stand-ins —
 *   • every TUBE drawn as a cylinder: its true silhouette (±r about the
 *     projected centre line, round caps where it turns toward you), a form
 *     gradient across it lit from the upper left, a specular line, a darker
 *     contour; wood with its grain, metal with its sheen;
 *   • the joints' metal rings, the bell's flare and its open mouth (seen
 *     inside where it faces you), the flute's lip plate and embouchure hole,
 *     the clarinet's ligature, the double reeds' cane and thread, the
 *     bassoon's bocal, ivory bell ring and U-tube, the bass clarinet's
 *     curved neck, bow, upturned bell and floor peg;
 *   • the KEYWORK at drawing level: a padded cup over every tone hole drawn
 *     at the semitone rule's place (windSpec.ts), ring keys with their open
 *     centres, a simple-system flute's bare finger holes, the long rods on
 *     their pillars and each key's arm to its rod — each cup projected as the
 *     disc it is (a circle seen square-on, an ellipse seen at a slant);
 *   • the player is the shared figure (shared/players/PlayerFigure), its
 *     joints from the posture — the same joints the keep-outs use — with the
 *     chair, the bassoon's seat strap and the flute's air jet (dashed).
 * Labels never sit on the instrument: each is placed beside it, with a thin
 * leader to its part. Nothing moves (D8); every path is built ONCE per
 * layout and view (cached), never during a render.
 */
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, DashPathEffect, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, Vec3, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { add, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import type { PlayerPose, Pt } from '../players/playerPose.ts';
import { frameAt, samples, type Frame, type Layout } from './windPosture.ts';
import { holeR, holeS, radiusAt, type Material, type Piece } from './windSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
export type P2 = [number, number];
const make = () => Skia.Path.Make();
const D = Math.PI / 180;

/* ── projection ── */
export const prj = (view: ViewId, p: Vec3): P2 => [p.x, view === 'side' ? p.y : p.z];
const TO_VIEWER: Record<ViewId, Vec3> = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } };
const pt2 = (q: P2): Pt => ({ u: q[0], v: q[1] });

function polyPath(pts: P2[], close = true): SkPath {
  const p = make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  if (close) p.close();
  return p;
}
function ellipsePts(c: P2, major: number, minor: number, ang: number, n = 28): P2[] {
  const out: P2[] = [];
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = minor * Math.cos(t);
    const y = major * Math.sin(t);
    out.push([c[0] + x * ca - y * sa, c[1] + x * sa + y * ca]);
  }
  return out;
}
/** A disc of radius R about c with unit normal m, as seen in the view: a
 *  circle square-on, an ellipse at a slant (minor axis along m's image). */
function discPts(view: ViewId, c: Vec3, m: Vec3, R: number, n = 28): { pts: P2[]; facing: number } {
  const vd = TO_VIEWER[view];
  const facing = dot(m, vd);
  const m2: P2 = view === 'side' ? [m.x, m.y] : [m.x, m.z];
  const l = Math.hypot(m2[0], m2[1]);
  const ang = l < 1e-4 ? 0 : Math.atan2(m2[1], m2[0]);
  return { pts: ellipsePts(prj(view, c), R, Math.max(0.6, R * Math.abs(facing)), ang, n), facing };
}
function union(...ps: SkPath[]): SkPath {
  let out: SkPath | null = null;
  for (const p of ps) out = out ? Skia.Path.MakeFromOp(out, p, PathOp.Union) ?? out : p;
  return out ?? make();
}
function bbox(pts: P2[]) {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const [u, v] of pts) {
    u0 = Math.min(u0, u);
    v0 = Math.min(v0, v);
    u1 = Math.max(u1, u);
    v1 = Math.max(v1, v);
  }
  return { u0, v0, u1, v1 };
}

/* ── palette: material ramps, light from the upper left (lit → shadow) ── */
export const RAMP: Record<Material, string[]> = {
  silver: ['#ffffff', '#e4e8ef', '#b4bbc6', '#7d8592', '#4f5560', '#8d95a2'],
  nickel: ['#fffdf6', '#e8e6dd', '#b9b7ad', '#828077', '#55534c', '#97958c'],
  grenadilla: ['#6b5a50', '#38302b', '#1e1916', '#110e0c', '#070505', '#1a1512'],
  boxwood: ['#f7dfaa', '#e1b979', '#c18f4f', '#93642c', '#5e3d17', '#86602e'],
  maple: ['#f0a77a', '#c96e3d', '#9b4a20', '#6d2e10', '#421905', '#7a3a18'],
  rubber: ['#6a6a72', '#3a3a41', '#222228', '#131317', '#08080a', '#1d1d22'],
  cane: ['#fbedbd', '#ecd08b', '#d1ab5f', '#a98238', '#755620', '#b9954c'],
  cork: ['#dcb48c', '#bb8f64', '#956b44', '#6b4a2c', '#4a321c', '#7d5a3a'],
  ivory: ['#fffef8', '#f3eedf', '#ddd4bd', '#b9ae92', '#8c8269', '#c7bea6'],
};
const POS6 = [0, 0.18, 0.42, 0.72, 0.94, 1];
const EDGE: Record<Material, string> = { silver: '#3b4049', nickel: '#3f3d37', grenadilla: '#050403', boxwood: '#3b240b', maple: '#2a0f02', rubber: '#030304', cane: '#4f3a12', cork: '#3b2814', ivory: '#6a614c' };
const isMetal = (m: Material) => m === 'silver' || m === 'nickel';
const isWood = (m: Material) => m === 'grenadilla' || m === 'boxwood' || m === 'maple';
const KEY = RAMP.silver;
const HOLE = ['#000000', '#0d0b0a', '#2a2420'];
const JET = '#9cc4ff';

/* ── the paint list ── */
type Fill = { colors: string[]; positions?: number[]; a: P2; b: P2 } | { radial: string[]; c: P2; r: number } | string;
type Item = { path: SkPath; fill?: Fill; stroke?: { color: string; w: number; opacity?: number; dash?: number[]; cap?: 'round' | 'butt' }; opacity?: number; blur?: number };

/** The lit edge's side for a 2-D normal (toward the upper-left light). */
function litNormal(n2: P2): P2 {
  return n2[0] * -1 + n2[1] * -1 >= 0 ? n2 : [-n2[0], -n2[1]];
}

type Tube = { fill: Item[]; outline: SkPath; detail: Item[] };

/**
 * One piece of tube between s0 and s1 in a view: sub-pieces (each its own
 * cross gradient, so a curve keeps its light), round end discs, one union
 * outline, a specular line and (wood) grain.
 */
function tubeItems(L: Layout, view: ViewId, s0: number, s1: number, mat: Material, rOf: (s: number) => number, opts: { step?: number; grain?: boolean } = {}): Tube {
  const curved = L.segs.some((g) => g.kind === 'cubic' && s0 < g.s1 && s1 > g.s0);
  const step = opts.step ?? (curved ? 10 : Math.max(6, Math.min(40, (s1 - s0) / 8)));
  const ss = samples(L, s0, s1, step);
  const shapes: SkPath[] = [];
  const fill: Item[] = [];
  const left: P2[] = [];
  const right: P2[] = [];
  let lastN2: P2 = [0, -1];
  const nrmAt = (f: Frame): P2 => {
    const t2: P2 = view === 'side' ? [f.t.x, f.t.y] : [f.t.x, f.t.z];
    const l = Math.hypot(t2[0], t2[1]);
    if (l < 0.05) return lastN2;
    lastN2 = [-t2[1] / l, t2[0] / l];
    return lastN2;
  };
  for (const { s, f } of ss) {
    const c = prj(view, f.p);
    const n2 = nrmAt(f);
    const r = rOf(s);
    left.push([c[0] + n2[0] * r, c[1] + n2[1] * r]);
    right.push([c[0] - n2[0] * r, c[1] - n2[1] * r]);
  }
  // Sub-pieces: groups of samples ≈ 40 mm long, each lit across its own normal.
  const per = curved ? 3 : ss.length;
  for (let i = 0; i < ss.length - 1; i += per) {
    const j = Math.min(ss.length - 1, i + per);
    const poly: P2[] = [...left.slice(i, j + 1), ...right.slice(i, j + 1).reverse()];
    const mid = ss[Math.floor((i + j) / 2)];
    const c = prj(view, mid.f.p);
    const n2 = litNormal(nrmAt(mid.f));
    const r = rOf(mid.s) * 1.02;
    const path = polyPath(poly);
    shapes.push(path);
    fill.push({ path, fill: { colors: RAMP[mat], positions: POS6, a: [c[0] + n2[0] * r, c[1] + n2[1] * r], b: [c[0] - n2[0] * r, c[1] - n2[1] * r] } });
  }
  // Round ends: the disc where the tube turns toward you.
  for (const e of [ss[0], ss[ss.length - 1]]) {
    const { pts } = discPts(view, e.f.p, e.f.t, rOf(e.s), 24);
    const path = polyPath(pts);
    shapes.push(path);
    const c = prj(view, e.f.p);
    const r = rOf(e.s);
    fill.push({ path, fill: { colors: RAMP[mat], positions: POS6, a: [c[0] - r * 0.7, c[1] - r * 0.7], b: [c[0] + r * 0.7, c[1] + r * 0.7] } });
  }
  const outline = union(...shapes);
  const detail: Item[] = [];
  // The specular line (metal and rubber: crisp; wood: a soft sheen).
  const spec = make();
  const grain = make();
  ss.forEach(({ s, f }, i) => {
    const c = prj(view, f.p);
    const n2 = litNormal(nrmAt(f));
    const r = rOf(s);
    const a: P2 = [c[0] + n2[0] * r * 0.5, c[1] + n2[1] * r * 0.5];
    if (i === 0) spec.moveTo(a[0], a[1]);
    else spec.lineTo(a[0], a[1]);
  });
  detail.push({ path: spec, stroke: { color: '#ffffff', w: isMetal(mat) ? 1.3 : 1.1, opacity: isMetal(mat) ? 0.75 : isWood(mat) ? 0.16 : 0.32, cap: 'round' } });
  if (isWood(mat) && opts.grain !== false) {
    for (const k of [-0.62, -0.18, 0.28, 0.7]) {
      ss.forEach(({ s, f }, i) => {
        const c = prj(view, f.p);
        const n2 = nrmAt(f);
        const r = rOf(s) * k + Math.sin(s * 0.07 + k * 9) * 0.6;
        const q: P2 = [c[0] + n2[0] * r, c[1] + n2[1] * r];
        if (i === 0) grain.moveTo(q[0], q[1]);
        else grain.lineTo(q[0], q[1]);
      });
    }
    detail.push({ path: grain, stroke: { color: mat === 'grenadilla' ? '#5b4334' : '#2a1405', w: 0.6, opacity: mat === 'grenadilla' ? 0.55 : 0.32 } });
  }
  return { fill, outline, detail };
}

/* ── the instrument in one view ── */
type Built = { back: Item[]; body: Item[]; keys: Item[]; front: Item[] };

function pieceTube(L: Layout, view: ViewId, pc: Piece): Tube {
  return tubeItems(L, view, pc.s0, pc.s1, pc.mat, (s) => radiusAt(L.spec, Math.max(pc.s0, Math.min(pc.s1, s))));
}

/** A ring band (a joint's metal socket, the bell's rim, a ligature). */
function ringItems(L: Layout, view: ViewId, s: number, w: number, dr: number, mat: Material): Item[] {
  const t = tubeItems(L, view, s - w / 2, s + w / 2, mat, (q) => radiusAt(L.spec, q) + dr, { step: Math.max(2, w / 2), grain: false });
  return [...t.fill, { path: t.outline, stroke: { color: EDGE[mat], w: 0.9, opacity: 0.9 } }, ...t.detail];
}

/** The open mouth at the far end (or a flute's foot), seen inside. */
function mouthItems(L: Layout, view: ViewId, mat: Material): Item[] {
  const spec = L.spec;
  const f = frameAt(L, spec.end);
  const r = radiusAt(spec, spec.end);
  const { pts, facing } = discPts(view, f.p, f.t, r);
  if (facing < 0.06) return [];
  const inner = discPts(view, f.p, f.t, r * (spec.family === 'edge' ? 0.78 : 0.88)).pts;
  const c = prj(view, f.p);
  return [
    { path: polyPath(pts), fill: { colors: RAMP[mat], positions: POS6, a: [c[0] - r, c[1] - r], b: [c[0] + r, c[1] + r] }, stroke: { color: EDGE[mat], w: 0.8 } },
    { path: polyPath(inner), fill: { radial: ['#000000', '#120d0a', isMetal(mat) ? '#6b6a63' : '#3a2a20'], c: [c[0] + r * 0.12, c[1] + r * 0.12], r: r * 0.95 } },
  ];
}

/** The keywork: cups over the holes, ring keys, bare holes, rods and arms. */
function keyItems(L: Layout, view: ViewId): Item[] {
  const spec = L.spec;
  const out: Item[] = [];
  const vd = TO_VIEWER[view];
  const byPiece = new Map<string, { s: number; at: Vec3 }[]>();
  for (const h of spec.holes) {
    const s = holeS(spec, h.k);
    const pc = spec.pieces.find((p) => s >= p.s0 && s <= p.s1);
    if (!pc || pc.mat === 'rubber' || pc.mat === 'cane') continue;
    // The bassoon's U-turn and the bocal carry no hole.
    const f = frameAt(L, s);
    const r = radiusAt(spec, s);
    const a = h.side * D;
    const m = norm(add(scale(f.n, Math.cos(a)), scale(f.b, Math.sin(a))));
    const hr = holeR(spec, h.k);
    if (h.kind === 'open') {
      const { pts, facing } = discPts(view, add(f.p, scale(m, r)), m, hr);
      if (facing > 0.08) {
        const c = prj(view, add(f.p, scale(m, r)));
        out.push({ path: polyPath(pts), fill: { radial: HOLE, c, r: hr }, stroke: { color: '#000', w: 0.5, opacity: 0.6 } });
        // The worn rim round a bare finger hole.
        out.push({ path: polyPath(discPts(view, add(f.p, scale(m, r)), m, hr + 1.4).pts), stroke: { color: '#ffffff', w: 0.5, opacity: 0.18 } });
      }
      continue;
    }
    const R = hr + 2.2;
    const c3 = add(f.p, scale(m, r + 2.6));
    const { pts, facing } = discPts(view, c3, m, R);
    const list = byPiece.get(pc.id) ?? [];
    list.push({ s, at: c3 });
    byPiece.set(pc.id, list);
    if (facing < 0.05) continue;
    const c = prj(view, c3);
    out.push({ path: polyPath(pts), fill: { radial: [KEY[0], KEY[1], KEY[2], KEY[4]], c: [c[0] - R * 0.35, c[1] - R * 0.35], r: R * 1.35 }, stroke: { color: '#2f343c', w: 0.6, opacity: 0.95 } });
    if (h.kind === 'ring') {
      const { pts: inner } = discPts(view, c3, m, R * 0.48);
      out.push({ path: polyPath(inner), fill: { radial: HOLE, c, r: R * 0.5 } });
    } else {
      // The cup's domed shine.
      const { pts: hi } = discPts(view, add(c3, scale(m, 0.4)), m, R * 0.45);
      out.push({ path: polyPath(hi), fill: '#ffffff', opacity: 0.35 });
    }
  }
  // Rods on their pillars along each joint, an arm from each cup to its rod.
  for (const [pid, list] of byPiece) {
    if (list.length < 2) continue;
    const pc = spec.pieces.find((p) => p.id === pid)!;
    const s0 = Math.min(...list.map((q) => q.s));
    const s1 = Math.max(...list.map((q) => q.s));
    // The rod runs on the side of the tube that faces the viewer most.
    const fm = frameAt(L, (s0 + s1) / 2);
    let best = 60;
    let bestDot = -Infinity;
    for (const deg of [70, -70, 110, -110]) {
      const m = add(scale(fm.n, Math.cos(deg * D)), scale(fm.b, Math.sin(deg * D)));
      const dv = dot(m, vd);
      if (dv > bestDot) {
        bestDot = dv;
        best = deg;
      }
    }
    const rodAt = (s: number) => {
      const f = frameAt(L, s);
      const r = radiusAt(spec, s);
      const m = add(scale(f.n, Math.cos(best * D)), scale(f.b, Math.sin(best * D)));
      return add(f.p, scale(m, r + 3.2));
    };
    const rod = make();
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const q = prj(view, rodAt(s0 - 8 + ((s1 - s0 + 16) * i) / n));
      if (i === 0) rod.moveTo(q[0], q[1]);
      else rod.lineTo(q[0], q[1]);
    }
    const arms = make();
    for (const q of list) {
      const a = prj(view, q.at);
      const b = prj(view, rodAt(q.s));
      arms.moveTo(a[0], a[1]);
      arms.lineTo(b[0], b[1]);
    }
    const posts = make();
    for (const s of [s0 - 8, s1 + 8]) {
      const q = prj(view, rodAt(s));
      posts.addCircle(q[0], q[1], 2.6);
    }
    void pc;
    out.unshift({ path: arms, stroke: { color: '#59606b', w: 2.2, cap: 'round' } }, { path: arms, stroke: { color: '#dfe4ea', w: 1, cap: 'round', opacity: 0.9 } });
    out.unshift({ path: rod, stroke: { color: '#4a5059', w: 2.8, cap: 'round' } }, { path: rod, stroke: { color: '#eef1f5', w: 1.1, cap: 'round', opacity: 0.85 } });
    out.push({ path: posts, fill: '#d6dbe2', stroke: { color: '#3b4049', w: 0.6 } });
  }
  return out;
}

/** The flute's lip plate and embouchure hole, facing the lips. */
function lipPlateItems(L: Layout, view: ViewId): Item[] {
  const f = frameAt(L, 0);
  // The embouchure hole faces the lips: from the hole toward the mouth.
  const toLips = norm(sub(L.lips ?? { x: 0, y: 0, z: 0 }, f.p));
  const e = norm(sub(toLips, scale(f.t, dot(toLips, f.t))));
  const r = radiusAt(L.spec, 0);
  const small = L.spec.id === 'piccolo';
  const plate = discPts(view, add(f.p, scale(e, r + 0.8)), e, small ? 9 : 13);
  const hole = discPts(view, add(f.p, scale(e, r + 1.4)), e, small ? 4.2 : 5.6);
  const out: Item[] = [];
  if (plate.facing > 0.05) {
    const c = prj(view, add(f.p, scale(e, r)));
    out.push({ path: polyPath(plate.pts), fill: { radial: [KEY[0], KEY[1], KEY[3]], c: [c[0] - 4, c[1] - 4], r: 16 }, stroke: { color: '#3b4049', w: 0.6 } });
    out.push({ path: polyPath(hole.pts), fill: { radial: HOLE, c, r: 6 } });
  }
  return out;
}

/** A cane reed's blades and its thread wrap / wire (oboe, bassoon). */
function reedItems(L: Layout, view: ViewId): Item[] {
  const spec = L.spec;
  const rp = spec.pieces.find((p) => p.id === 'reed');
  if (!rp) return [];
  const out: Item[] = [];
  const wrapS = rp.s1 * 0.62;
  const t = tubeItems(L, view, wrapS, rp.s1, 'cork', (s) => radiusAt(spec, s) + 0.8, { step: 4, grain: false });
  out.push(...t.fill.map((q) => ({ ...q, fill: { colors: spec.id === 'oboe' ? ['#d9a35a', '#a8662a', '#6a3a12', '#3e200a', '#22120a', '#5a3216'] : ['#d6c3a1', '#a8865a', '#6d5232', '#3f2d18', '#22180c', '#5a4428'], positions: POS6, a: (q.fill as { a: P2 }).a, b: (q.fill as { b: P2 }).b } as Fill })));
  out.push({ path: t.outline, stroke: { color: '#2a1608', w: 0.6 } });
  return out;
}

/** The bassoon's boot: one wide body round both bores, the U-tube cap. */
function bootItems(L: Layout, view: ViewId): Item[] {
  // The boot's outline: a capsule round the two bores' centre line.
  const S = { down0: 845, down1: 1235, up0: 1305, up1: 1695 };
  const a0 = frameAt(L, S.down0).p;
  const a1 = frameAt(L, S.down1).p;
  const b0 = frameAt(L, S.up1).p;
  const b1 = frameAt(L, S.up0).p;
  const top = scale(add(a0, b0), 0.5);
  const bot = scale(add(a1, b1), 0.5);
  const seg: Layout = { ...L, segs: [{ kind: 'line', s0: 0, s1: len(sub(bot, top)), a: top, b: bot }] };
  const t = tubeItems(seg, view, 0, len(sub(bot, top)), 'maple', () => 44);
  const cap = tubeItems(seg, view, len(sub(bot, top)) - 26, len(sub(bot, top)) + 4, 'nickel', () => 46, { grain: false });
  return [...t.fill, { path: t.outline, stroke: { color: EDGE.maple, w: 1.2 } }, ...t.detail, ...cap.fill, { path: cap.outline, stroke: { color: EDGE.nickel, w: 0.9 } }];
}

const cache = new WeakMap<Layout, Partial<Record<ViewId, Built>>>();
function buildInstrument(L: Layout, view: ViewId): Built {
  const spec = L.spec;
  const back: Item[] = [];
  const body: Item[] = [];
  const front: Item[] = [];
  // Far pieces first: a piece whose middle is farther from the viewer paints first.
  const depth = (pc: Piece) => dot(frameAt(L, (pc.s0 + pc.s1) / 2).p, TO_VIEWER[view]);
  const order = [...spec.pieces].sort((a, b) => depth(a) - depth(b));
  if (spec.id === 'bassoon') body.push(...bootItems(L, view));
  for (const pc of order) {
    if (spec.id === 'bassoon' && pc.id === 'boot') continue;
    const t = pieceTube(L, view, pc);
    body.push(...t.fill, { path: t.outline, stroke: { color: EDGE[pc.mat], w: pc.mat === 'cane' ? 0.6 : 1.1, opacity: 0.95 } }, ...t.detail);
  }
  for (const r of spec.rings) body.push(...ringItems(L, view, r.s, r.w, r.dr, r.mat));
  body.push(...reedItems(L, view));
  const endMat = spec.pieces[spec.pieces.length - 1].mat;
  front.push(...mouthItems(L, view, endMat));
  if (spec.family === 'edge') front.push(...lipPlateItems(L, view));
  // Shadow under the instrument on whatever lies behind it.
  const sh = make();
  for (const pc of spec.pieces) {
    const ss = samples(L, pc.s0, pc.s1, 30);
    ss.forEach(({ f }, i) => {
      const q = prj(view, f.p);
      if (i === 0) sh.moveTo(q[0] + 6, q[1] + 9);
      else sh.lineTo(q[0] + 6, q[1] + 9);
    });
  }
  back.push({ path: sh, stroke: { color: '#000000', w: spec.id === 'bassoon' ? 34 : spec.id === 'bassClarinet' ? 30 : 18, opacity: 0.35, cap: 'round' }, blur: 10 });
  return { back, body, keys: keyItems(L, view), front };
}
export function builtFor(L: Layout, view: ViewId): Built {
  let m = cache.get(L);
  if (!m) {
    m = {};
    cache.set(L, m);
  }
  return (m[view] ??= buildInstrument(L, view));
}

/* ── the player as the shared figure's pose ── */
export function playerPose(L: Layout, view: ViewId): PlayerPose {
  const B = L.body;
  const P = (p: Vec3) => pt2(prj(view, p));
  const front = view === 'side';
  const handOf = (h: Layout['handL']) => {
    const d2 = prj(view, h.dir);
    // From the audience the fingers CLOSE round the tube onto its keys (figure
    // polish 2026-10-10: an open 'rest' hand read as palms raised beside it).
    return { wrist: P(h.wrist), dir: Math.atan2(d2[1], d2[0]), kind: front ? ('grip' as const) : ('above' as const) };
  };
  return {
    view: front ? 'front' : 'above',
    posture: B.posture,
    head: { c: P(B.head.c), r: B.head.r },
    neck: P(B.neck),
    shoulderR: P(B.shoulderR),
    shoulderL: P(B.shoulderL),
    elbowR: P(L.handR.elbow),
    elbowL: P(L.handL.elbow),
    handR: handOf(L.handR),
    handL: handOf(L.handL),
    hipR: P(B.hipR),
    hipL: P(B.hipL),
    kneeR: P(B.kneeR),
    kneeL: P(B.kneeL),
    footR: front ? { u: B.ankleR.x, v: B.floorY } : { u: B.toeR.x, v: B.toeR.z },
    footL: front ? { u: B.ankleL.x, v: B.floorY } : { u: B.toeL.x, v: B.toeL.z },
    floor: front ? B.floorY : null,
  };
}
const poseCache = new WeakMap<Layout, Partial<Record<ViewId, PlayerPose>>>();
function poseFor(L: Layout, view: ViewId): PlayerPose {
  let m = poseCache.get(L);
  if (!m) {
    m = {};
    poseCache.set(L, m);
  }
  return (m[view] ??= playerPose(L, view));
}

/* ── the chair, the strap, the peg, the air jet ── */
const WOOD_CHAIR = ['#5a4636', '#3d2f24', '#271e17'];
const STEEL = ['#c7ccd4', '#8b919c', '#4f545d'];
type Extras = { chairBack: Item[]; chairFront: Item[]; peg: Item[]; strap: Item[]; jet: Item[]; floor: Item[] };
const extrasCache = new WeakMap<Layout, Partial<Record<ViewId, Extras>>>();
function buildExtras(L: Layout, view: ViewId): Extras {
  const out: Extras = { chairBack: [], chairFront: [], peg: [], strap: [], jet: [], floor: [] };
  const C = L.chair;
  const box2 = (min: Vec3, max: Vec3): P2[] => {
    const a = prj(view, min);
    const b = prj(view, max);
    return [
      [a[0], a[1]],
      [b[0], a[1]],
      [b[0], b[1]],
      [a[0], b[1]],
    ];
  };
  if (C) {
    const seat = box2(C.seat.min, C.seat.max);
    const back = box2(C.back.min, C.back.max);
    const sb = bbox(seat);
    const bb = bbox(back);
    const legs = make();
    for (const [a, b] of C.legs) {
      const p = prj(view, a);
      const q = prj(view, b);
      legs.moveTo(p[0], p[1]);
      legs.lineTo(q[0], q[1]);
    }
    out.chairBack.push({ path: legs, stroke: { color: '#16181c', w: 16, cap: 'round' } }, { path: legs, stroke: { color: '#7d838e', w: 7, cap: 'round', opacity: 0.8 } });
    out.chairBack.push({ path: polyPath(back), fill: { colors: WOOD_CHAIR, a: [bb.u0, bb.v0], b: [bb.u1, bb.v1] }, stroke: { color: '#0e0b08', w: 2 } });
    out.chairBack.push({ path: polyPath(seat), fill: { colors: WOOD_CHAIR, a: [sb.u0, sb.v0], b: [sb.u1, sb.v1] }, stroke: { color: '#0e0b08', w: 2 } });
  }
  if (view === 'side') {
    const f = make();
    f.moveTo(-900, L.body.floorY);
    f.lineTo(900, L.body.floorY);
    out.floor.push({ path: f, stroke: { color: '#3a3d45', w: 3, opacity: 0.9 } });
  }
  if (L.peg) {
    const a = prj(view, L.peg.a);
    const b = prj(view, L.peg.b);
    const p = make();
    p.moveTo(a[0], a[1]);
    p.lineTo(b[0], b[1]);
    out.peg.push({ path: p, stroke: { color: '#2b2e34', w: 16, cap: 'round' } }, { path: p, stroke: { color: '#d9dde4', w: 9, cap: 'round' } }, { path: p, stroke: { color: '#ffffff', w: 2.4, cap: 'round', opacity: 0.6 } });
    const tip = make();
    tip.addCircle(b[0], b[1] - (view === 'side' ? 6 : 0), 9);
    out.peg.push({ path: tip, fill: '#141416', stroke: { color: '#000', w: 1 } });
  }
  if (L.strap) {
    const s = make();
    L.strap.forEach((q, i) => {
      const p = prj(view, q);
      if (i === 0) s.moveTo(p[0], p[1]);
      else s.lineTo(p[0], p[1]);
    });
    out.strap.push({ path: s, stroke: { color: '#0d0907', w: 26, cap: 'round' } }, { path: s, stroke: { color: '#5b3a22', w: 20, cap: 'round' } }, { path: s, stroke: { color: '#8a6040', w: 2, cap: 'round', opacity: 0.7, dash: [8, 7] } });
  }
  if (L.jet) {
    const j = L.jet;
    const tip = add(j.a, scale(j.dir, j.len));
    // The jet's cone: a dashed outline in the view, from the lips outward.
    const side = norm(view === 'side' ? { x: -j.dir.y, y: j.dir.x, z: 0 } : { x: -j.dir.z, y: 0, z: j.dir.x });
    const w = Math.tan(j.half * D) * j.len;
    const a = prj(view, j.a);
    const b1 = prj(view, add(tip, scale(side, w)));
    const b2 = prj(view, add(tip, scale(side, -w)));
    const path = polyPath([a, b1, b2]);
    out.jet.push({ path, fill: JET, opacity: 0.12 }, { path, stroke: { color: JET, w: 1.2, opacity: 0.7, dash: [5, 4] } });
  }
  return out;
}
function extrasFor(L: Layout, view: ViewId): Extras {
  let m = extrasCache.get(L);
  if (!m) {
    m = {};
    extrasCache.set(L, m);
  }
  return (m[view] ??= buildExtras(L, view));
}

/* ── painting ── */
function Paint({ it }: { it: Item }) {
  const f = it.fill;
  const st = it.stroke;
  return (
    <Group opacity={it.opacity ?? 1}>
      {f ? (
        typeof f === 'string' ? (
          <Path path={it.path} color={f}>
            {it.blur ? <BlurMask blur={it.blur} style="normal" /> : null}
          </Path>
        ) : 'radial' in f ? (
          <Path path={it.path}>
            <RadialGradient c={vec(f.c[0], f.c[1])} r={Math.max(0.5, f.r)} colors={f.radial} />
          </Path>
        ) : (
          <Path path={it.path}>
            <LinearGradient start={vec(f.a[0], f.a[1])} end={vec(f.b[0], f.b[1])} colors={f.colors} positions={f.positions} />
          </Path>
        )
      ) : null}
      {st ? (
        <Path path={it.path} style="stroke" strokeWidth={st.w} color={st.color} opacity={st.opacity ?? 1} strokeCap={st.cap ?? 'butt'} strokeJoin="round">
          {st.dash ? <DashPathEffect intervals={st.dash} /> : null}
          {it.blur ? <BlurMask blur={it.blur} style="normal" /> : null}
        </Path>
      ) : null}
    </Group>
  );
}
const Paints = ({ items }: { items: Item[] }) => (
  <>
    {items.map((it, i) => (
      <Paint key={i} it={it} />
    ))}
  </>
);

/** The instrument alone (the ORIENT portrait, the sound page's figures). */
export function WindBody({ L, view, dim = 1 }: { L: Layout; view: ViewId; dim?: number }): ReactElement {
  const b = builtFor(L, view);
  return (
    <Group opacity={dim}>
      <Paints items={b.back} />
      <Paints items={b.body} />
      <Paints items={b.keys} />
      <Paints items={b.front} />
    </Group>
  );
}

/** The player, the chair and the instrument in one view (the scenes). */
export function WindScene({ L, view, playerDim = 1, showJet = true }: { L: Layout; view: ViewId; playerDim?: number; showJet?: boolean }): ReactElement {
  const pose = poseFor(L, view);
  const x = extrasFor(L, view);
  const b = builtFor(L, view);
  return (
    <Group>
      <Paints items={x.floor} />
      <Paints items={x.chairBack} />
      <PlayerBehind pose={pose} dim={playerDim} />
      <Paints items={x.peg} />
      <Paints items={b.back} />
      <Paints items={b.body} />
      <Paints items={b.keys} />
      <Paints items={b.front} />
      <PlayerInFront pose={pose} dim={playerDim} />
      <Paints items={x.strap} />
      {showJet ? <Paints items={x.jet} /> : null}
    </Group>
  );
}

/** The engine's Instrument component for a family lesson. */
export function makeWindInstrument(layoutOf: (variant: VariantId) => Layout) {
  return function WindInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
    return <WindScene L={layoutOf(variant)} view={view} />;
  };
}

/* ── labels: beside the instrument, never on it, with a leader ── */
export type LabelSpec = { id: string; text: string; short?: string; s: number; /** off the tube (mm) */ off?: number; side?: 1 | -1; along?: number };

/** A label beside the tube at s: pushed out along the tube's normal on the
 *  side away from the player (or `side`), its leader to the tube's edge. */
export function tubeLabel(L: Layout, view: ViewId, l: LabelSpec): ArtLabel {
  const f = frameAt(L, l.s);
  const c = prj(view, f.p);
  const t2: P2 = view === 'side' ? [f.t.x, f.t.y] : [f.t.x, f.t.z];
  const tl = Math.hypot(t2[0], t2[1]) || 1;
  let n2: P2 = tl < 0.08 ? [1, 0] : [-t2[1] / tl, t2[0] / tl];
  // Away from the player's body (its neck, projected), unless told.
  const body = prj(view, L.body.neck);
  const away = (c[0] - body[0]) * n2[0] + (c[1] - body[1]) * n2[1];
  let sgn = l.side ?? (away >= 0 ? 1 : -1);
  if (view === 'side' && l.side == null && Math.abs(n2[0]) < 0.3 && Math.abs(c[0]) < 60) sgn = n2[1] > 0 ? -1 : 1;
  n2 = [n2[0] * sgn, n2[1] * sgn];
  const r = radiusAt(L.spec, l.s);
  const off = r + (l.off ?? 70);
  const along = l.along ?? 0;
  const at: P2 = [c[0] + n2[0] * r, c[1] + n2[1] * r];
  const p: P2 = [c[0] + n2[0] * off + (t2[0] / tl) * along, c[1] + n2[1] * off + (t2[1] / tl) * along];
  const align: ArtLabel['align'] = n2[0] > 0.35 ? 'left' : n2[0] < -0.35 ? 'right' : 'center';
  const q: P2 = [c[0] - n2[0] * (off + 10), c[1] - n2[1] * (off + 10)];
  const alignQ: ArtLabel['align'] = -n2[0] > 0.35 ? 'left' : -n2[0] < -0.35 ? 'right' : 'center';
  return { id: l.id, text: l.text, ...(l.short ? { short: l.short } : {}), u: p[0], v: p[1], align, at: { u: at[0], v: at[1] }, alts: [{ u: q[0], v: q[1], align: alignQ }, { u: p[0] + (t2[0] / tl) * 90, v: p[1] + (t2[1] / tl) * 90, align }] };
}

/** A label for a point (the player's head, a hand, the chair), with a leader. */
export function pointLabel(view: ViewId, id: string, text: string, p: Vec3, du: number, dv: number, short?: string): ArtLabel {
  const c = prj(view, p);
  const align: ArtLabel['align'] = du > 20 ? 'left' : du < -20 ? 'right' : 'center';
  return { id, text, ...(short ? { short } : {}), u: c[0] + du, v: c[1] + dv, align, at: { u: c[0], v: c[1] }, alts: [{ u: c[0] - du, v: c[1] + dv, align: align === 'left' ? 'right' : align === 'right' ? 'left' : 'center' }] };
}

/* ── hit test: the part under a model point ── */
function distSeg(p: P2, a: P2, b: P2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
}
export function windHitTest(L: Layout, view: ViewId, u: number, v: number, tol: number): string | null {
  const q: P2 = [u, v];
  for (const h of [L.handL, L.handR]) {
    if (distSeg(q, prj(view, h.wrist), prj(view, add(h.wrist, scale(h.dir, 120)))) <= 46 + tol) return 'ww.hands';
  }
  const spec = L.spec;
  for (const h of spec.holes) {
    const s = holeS(spec, h.k);
    if (Math.hypot(...(prj(view, frameAt(L, s).p).map((x, i) => x - q[i]) as P2)) <= holeR(spec, h.k) + 6 + tol) return 'ww.keys';
  }
  if (Math.hypot(...(prj(view, frameAt(L, 0).p).map((x, i) => x - q[i]) as P2)) <= 26 + tol) return 'ww.exciter';
  let best: { id: string; d: number } | null = null;
  for (const pc of spec.pieces) {
    const ss = samples(L, pc.s0, pc.s1, 15);
    for (let i = 0; i < ss.length - 1; i++) {
      const d = distSeg(q, prj(view, ss[i].f.p), prj(view, ss[i + 1].f.p)) - radiusAt(spec, ss[i].s);
      if (d <= tol && (!best || d < best.d)) best = { id: `ww.${pc.id}`, d };
    }
  }
  if (best) return best.id === 'ww.reed' || best.id === 'ww.mouthpiece' ? best.id : best.id;
  if (spec.id === 'bassoon') {
    const a = prj(view, frameAt(L, 845).p);
    const b = prj(view, frameAt(L, 1235).p);
    if (distSeg(q, a, b) <= 50 + tol) return 'ww.boot';
  }
  const B = L.body;
  if (L.peg && distSeg(q, prj(view, L.peg.a), prj(view, L.peg.b)) <= 10 + tol) return 'ww.peg';
  if (Math.hypot(u - prj(view, B.head.c)[0], v - prj(view, B.head.c)[1]) <= B.head.r + tol) return 'ww.head';
  const pel = prj(view, scale(add(B.hipL, B.hipR), 0.5));
  if (distSeg(q, pel, prj(view, B.neck)) <= 150 + tol) return 'ww.player';
  if (L.chair) {
    const a = prj(view, L.chair.seat.min);
    const b = prj(view, L.chair.seat.max);
    if (u >= Math.min(a[0], b[0]) - tol && u <= Math.max(a[0], b[0]) + tol && v >= Math.min(a[1], b[1]) - tol && v <= Math.max(a[1], b[1]) + tol) return 'ww.chair';
  }
  return null;
}

/* ── a static canvas of a layout (the ORIENT portrait) ── */
export function WindFigure({ L, view, w, h, box, labels, accessibilityLabel, player = false }: { L: Layout; view: ViewId; w: number; h: number; box: { u0: number; u1: number; v0: number; v1: number }; labels: StaticLabel[]; accessibilityLabel: string; player?: boolean }): ReactNode {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform(view, box, w, h, 8), [view, box, w, h]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>{player ? <WindScene L={L} view={view} showJet={false} /> : <WindBody L={L} view={view} />}</Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
