/**
 * THE SAXOPHONE FAMILY — the look (charter §2 layer 3), at the Kick
 * standard: real objects, upper-left light, gradients and rim highlights,
 * the house palette. One parameterised instrument (soprano, alto, tenor,
 * baritone) and its player, drawn in 3-D from the posture and projected into
 * the engine's two views (saxDraw.ts):
 *
 *   • the lacquered brass tube — neck, body, bow and flared bell — shaded as
 *     a cylinder (a lit core, a specular streak that follows the light round
 *     every bend, a shadowed edge), the bell's rolled rim and its throat,
 *     a little engraving;
 *   • the KEYWORK: a cup over every tone hole (seated on its pad, or lifted
 *     and tilted on its hinge to show the leather pad and the open hole),
 *     the key arms and the two rods with their posts, the six pearl
 *     touches, the side keys and palm keys, the low-key spatulas, the bell
 *     guard, the bow guard, the thumb rests, the strap ring, the octave key
 *     on the neck and the neck's receiver and screw;
 *   • the mouthpiece in dark hard rubber, the metal ligature and the cane
 *     reed; the neck strap;
 *   • the player, a neutral adult figure in profile (side) or from above
 *     (top), with the house line-art head (bald, brows, nose, mouth, ear —
 *     no eyes), the lips round the mouthpiece and the fingers on the pearls.
 *     The player recedes (charter §6): the subject is the instrument.
 *
 * Nothing moves (D8). Paths are built once per posture, view and fingering.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Group, LinearGradient, Paint, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { VariantId, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { add, dot, scale, sub } from '../../../engine/geometry/vec.ts';
import { armPath, FIGURE_SKIN, FigureHead, headAbove, headProfile } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';
import { fingering, holesOf, pathOf, radiusAt, type Fingering, type SaxRow } from './saxSpec.ts';
import { anchorsOf, centre, onTube, tubeDir, type PlaneAxes, type SaxPosture } from './saxPosture.ts';
import { TO_VIEWER, band, bellGuard, circle2, cupsOf, engraving, pearlsOf, prj, rodsOf, silhouette, tubeSamples, type P2, type Placed, type TubeSample } from './saxDraw.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;

/* ── palette ── */
const BRASS = ['#fbe7a6', '#e2b552', '#b58325', '#6d4710'];
const BRASS_POS = [0, 0.32, 0.7, 1];
const BRASS_LIT = '#ffeeb8';
const SPEC = '#fff9e8';
const BRASS_DARK = '#3b2504';
const BRASS_EDGE = '#2a1903';
const RUBBER = ['#4b4b52', '#1e1e23', '#09090b'];
const SILVER = ['#f4f6f9', '#b7bdc7', '#6a707b'];
const REED = '#d9b978';
const LEATHER = ['#d8b787', '#a07a48', '#5e4220'];
const PEARL = ['#fffdf6', '#efe6d4', '#b9ac95'];
const HOLE = '#140c03';
const THROAT = ['#5c3d0c', '#2a1904', '#0d0801'];
/* the player: muted, cool-neutral (PlayerFigure's palette) */
const SHIRT = ['#5d687e', '#465064', '#2f3645'];
const SHIRT_EDGE = '#171a21';
const TROUSER = ['#41454f', '#2d3038', '#1b1d22'];
/** The hands wear the shared figure skin, the head's tone (owner
 *  2026-10-08, HF1 — they were a grey neutral). */
const SKIN = FIGURE_SKIN.ramp;
const SKIN_EDGE = FIGURE_SKIN.edge;
const SHOE = ['#34353b', '#18191d', '#0b0b0d'];
const STRAP = ['#3a3f4a', '#1d2027', '#0d0f13'];
const CHAIR = ['#3a3c43', '#1d1e22', '#0c0c0e'];
const METAL = ['#d5d9e0', '#8d939e', '#4b5059'];

/* ── path helpers ── */
const make = () => Skia.Path.Make();
function poly(pts: readonly P2[], close = true): SkPath {
  const p = make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  if (close) p.close();
  return p;
}
/** A smooth curve through points (Catmull-Rom as cubics). */
function smooth(points: readonly P2[], closed: boolean, tension = 0.5): SkPath {
  const p = make();
  const n = points.length;
  if (n < 2) return p;
  const at = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  p.moveTo(points[0][0], points[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 3;
    p.cubicTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  if (closed) p.close();
  return p;
}
function bbox(pts: readonly P2[]) {
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
/** A tapered limb in 2-D: the hull of two circles. */
function limb2(a: P2, b: P2, ra: number, rb: number): P2[] {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (d < Math.abs(ra - rb) + 0.5) {
    const c = ra > rb ? a : b;
    const r = Math.max(ra, rb);
    return Array.from({ length: 20 }, (_, i) => [c[0] + r * Math.cos((i / 20) * Math.PI * 2), c[1] + r * Math.sin((i / 20) * Math.PI * 2)] as P2);
  }
  const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const ph = Math.acos(Math.max(-1, Math.min(1, (ra - rb) / d)));
  const out: P2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = th + ph + ((2 * Math.PI - 2 * ph) * i) / 10;
    out.push([a[0] + ra * Math.cos(t), a[1] + ra * Math.sin(t)]);
  }
  for (let i = 0; i <= 10; i++) {
    const t = th - ph + ((2 * ph) * i) / 10;
    out.push([b[0] + rb * Math.cos(t), b[1] + rb * Math.sin(t)]);
  }
  return out;
}

/* ── the paint list ── */
type Fill = { colors: string[]; positions?: number[] } | { radial: string[]; c: P2; r: number } | string;
type Item = { path: SkPath; fill?: Fill; stroke?: { color: string; w: number; opacity?: number }; opacity?: number; blur?: number; box: { u0: number; v0: number; u1: number; v1: number }; rim?: number };
const item = (pts: readonly P2[], fill?: Fill, stroke?: Item['stroke'], extra: Partial<Item> = {}): Item => ({ path: poly(pts), fill, stroke, box: bbox(pts), ...extra });
const itemPath = (path: SkPath, box: Item['box'], fill?: Fill, stroke?: Item['stroke'], extra: Partial<Item> = {}): Item => ({ path, box, fill, stroke, ...extra });
const lineItem = (pts: readonly P2[], color: string, w: number, opacity = 1): Item => ({ path: poly(pts, false), stroke: { color, w, opacity }, box: bbox(pts) });

function PaintItem({ it }: { it: Item }) {
  const { box } = it;
  const f = it.fill;
  return (
    <Group opacity={it.opacity ?? 1}>
      {f ? (
        typeof f === 'string' ? (
          <Path path={it.path} color={f}>
            {it.blur ? <BlurMask blur={it.blur} style="normal" /> : null}
          </Path>
        ) : 'radial' in f ? (
          <Path path={it.path}>
            <RadialGradient c={vec(f.c[0], f.c[1])} r={Math.max(1, f.r)} colors={f.radial} />
            {it.blur ? <BlurMask blur={it.blur} style="normal" /> : null}
          </Path>
        ) : (
          <Path path={it.path}>
            <LinearGradient start={vec(box.u0, box.v0)} end={vec(box.u1, box.v1)} colors={f.colors} positions={f.positions} />
            {it.blur ? <BlurMask blur={it.blur} style="normal" /> : null}
          </Path>
        )
      ) : null}
      {it.stroke ? <Path path={it.path} style="stroke" strokeWidth={it.stroke.w} color={it.stroke.color} opacity={it.stroke.opacity ?? 1} strokeCap="round" strokeJoin="round" /> : null}
      {it.rim ? (
        <Group transform={[{ translateX: -it.rim * 0.7 }, { translateY: -it.rim }]}>
          <Path path={it.path} style="stroke" strokeWidth={it.rim} color="#fff3d6" opacity={0.3} />
        </Group>
      ) : null}
    </Group>
  );
}

/* ── the instrument ── */

/** A shaded tube between two stations (brass, or the mouthpiece's rubber). */
function tubeItems(S: TubeSample[], kind: 'brass' | 'rubber' | 'silver' | 'brassLit'): Item[] {
  const sil = silhouette(S);
  const out: Item[] = [];
  const base = kind === 'rubber' ? RUBBER : kind === 'silver' ? SILVER : BRASS;
  out.push(item(sil, kind === 'brass' || kind === 'brassLit' ? { colors: base, positions: BRASS_POS } : { colors: base }, { color: kind === 'rubber' ? '#000' : BRASS_EDGE, w: 1.4 }));
  const lit = kind === 'rubber' ? '#6b6d76' : kind === 'silver' ? '#ffffff' : BRASS_LIT;
  const spec = kind === 'rubber' ? '#a9abb5' : SPEC;
  // The lit core, the shadowed edge, and the specular streak — each follows
  // the light round the bends (s = how much the normal faces the light).
  out.push(item(band(S, (q) => 0.24 * q.s, 0.5), lit, undefined, { opacity: kind === 'rubber' ? 0.35 : 0.5, blur: 2.2 }));
  out.push(item(band(S, (q) => -0.72 * (q.s / (Math.abs(q.s) + 0.22)), 0.2), kind === 'rubber' ? '#000' : BRASS_DARK, undefined, { opacity: 0.5, blur: 1.8 }));
  out.push(item(band(S, (q) => 0.5 * q.s + 0.04, 0.085), spec, undefined, { opacity: kind === 'rubber' ? 0.55 : 0.9, blur: 0.9 }));
  return out;
}

/** The instrument's paint for one view and fingering, far to near. */
export function saxItems(P: Placed, view: ViewId, f: Pick<Fingering, 'open' | 'octaveKey'> | null): Item[] {
  const row = P.row;
  const S = pathOf(row);
  const A = anchorsOf(P);
  const out: Item[] = [];
  const toV = TO_VIEWER[view];
  // The neck, then the body–bow–bell (the body passes in front of the
  // baritone's neck, on the camera side).
  const neck = tubeSamples(P, view, S.mouthEnd - 6, S.tenon + 2, 4);
  out.push(...tubeItems(neck, 'brass'));
  // The cork, just showing beyond the mouthpiece's shank.
  out.push(...tubeItems(tubeSamples(P, view, S.mouthEnd - 2, S.mouthEnd + 9, 2, (u) => Math.max(row.corkR + 0.6, radiusAt(row, u) + 0.4)), 'brass').slice(0, 1).map((it) => ({ ...it, fill: { colors: ['#d7b48a', '#a9825a', '#6e5032'] } })));
  // The octave key on the neck: its pad cup and the long lever to the body.
  const uo = S.mouthEnd + (S.tenon - S.mouthEnd) * 0.36;
  const octC = onTube(P, uo, 4, 4);
  const octN = tubeDir(P, uo, 4);
  const lever: P2[] = [];
  for (let u = uo; u <= S.tenon + 40; u += 6) lever.push(prj(view, onTube(P, u, 10, 2.5)));
  out.push(lineItem(lever, BRASS_EDGE, 3.6), lineItem(lever, '#e9c56c', 2), lineItem(lever, SPEC, 0.7, 0.6));
  const octTop = circle2(view, octC, octN, Math.max(4, row.corkR * 0.55), 18);
  out.push(item(octTop, { colors: ['#fff0bd', '#d5a645', '#7a5113'] }, { color: BRASS_EDGE, w: 1 }));
  if (f?.octaveKey) out.push(item(circle2(view, add(octC, scale(octN, 5)), octN, Math.max(4, row.corkR * 0.55), 18), { colors: ['#fff0bd', '#d5a645', '#7a5113'] }, { color: BRASS_EDGE, w: 1 }));
  // The body, bow and bell.
  const body = tubeSamples(P, view, S.tenon - 2, S.U, 5);
  out.push(...tubeItems(body, 'brass'));
  const rim = circle2(view, A.rimC, A.bellAxis, A.rimR, 40);
  // The bell's throat shows only when the bell faces the camera.
  const facing = dot(A.bellAxis, toV) > 0.05;
  // The neck receiver: a brighter ring and its screw.
  out.push(...tubeItems(tubeSamples(P, view, S.tenon - 12, S.tenon + 6, 3, (u) => radiusAt(row, u) + 2.6), 'brassLit').slice(0, 2));
  const screw = onTube(P, S.tenon - 4, 95, 4);
  out.push(item(circle2(view, screw, tubeDir(P, S.tenon - 4, 95), 4.2, 12), { colors: SILVER }, { color: '#333', w: 0.8 }));
  // The bow guard (a ring round the bow's lowest point).
  if (S.bellStart > S.bodyEnd + 1) {
    // Two raised seams across the tube where the guard ring sits.
    const ub = (S.bodyEnd + S.bellStart) / 2;
    for (const du of [-15, 15]) {
      const q = tubeSamples(P, view, ub + du - 1, ub + du + 1, 1)[0];
      const r = q.r + 1.5;
      const seam: P2[] = [
        [q.c[0] + q.n[0] * r, q.c[1] + q.n[1] * r],
        [q.c[0] - q.n[0] * r, q.c[1] - q.n[1] * r],
      ];
      out.push(lineItem(seam, BRASS_EDGE, 4.4, 0.9), lineItem(seam, '#f3d385', 2.2, 0.9));
    }
  }
  // The engraving on the bell.
  for (const e of engraving(P, view)) out.push(lineItem(e, '#5a3c0c', 1.3, 0.55));
  // The bell rim: the throat (when it faces us), the rolled lip.
  if (facing) {
    const rb = bbox(rim);
    out.push(item(rim, { radial: THROAT, c: [(rb.u0 + rb.u1) / 2, (rb.v0 + rb.v1) / 2], r: Math.max(rb.u1 - rb.u0, rb.v1 - rb.v0) * 0.55 }));
  }
  out.push(itemPath(poly(rim), bbox(rim), undefined, { color: BRASS_EDGE, w: 6.4 }));
  out.push(itemPath(poly(rim), bbox(rim), undefined, { color: '#f6d98a', w: 3.6 }));
  out.push(itemPath(poly(rim.slice(0, Math.floor(rim.length / 2))), bbox(rim), undefined, { color: SPEC, w: 1.4, opacity: 0.85 }));
  // The keywork: rods and posts, then the cups (far to near), the pearls.
  for (const rd of rodsOf(P, view)) {
    out.push(lineItem(rd.line, BRASS_EDGE, 5.4), lineItem(rd.line, '#e8c46a', 3.2), lineItem(rd.line, SPEC, 0.9, 0.7));
    for (const pp of rd.posts) out.push(item(Array.from({ length: 12 }, (_, i) => [pp.c[0] + pp.r * Math.cos((i / 12) * Math.PI * 2), pp.c[1] + pp.r * Math.sin((i / 12) * Math.PI * 2)] as P2), { colors: ['#fff0bd', '#c79739', '#6d4710'] }, { color: BRASS_EDGE, w: 0.8 }));
  }
  const cups = cupsOf(P, view, f).filter((c) => c.visible).sort((a, b) => a.depth - b.depth);
  for (const c of cups) {
    if (c.open) {
      out.push(item(c.hole, HOLE, { color: '#c9a04a', w: 1.4 }));
    }
    out.push(lineItem(c.arm, BRASS_EDGE, 3.6), lineItem(c.arm, '#e3bd60', 2));
    const sh = c.top.map(([u, v]) => [u + 3, v + 4] as P2);
    out.push(item(sh, '#000', undefined, { opacity: 0.32, blur: 2.4 }));
    if (c.pad) out.push(item(c.pad, { colors: LEATHER }, { color: '#3a2610', w: 0.8 }));
    out.push(item(c.skirt, { colors: ['#b48331', '#6d4710', '#3b2504'] }, { color: BRASS_EDGE, w: 1 }));
    const tb = bbox(c.top);
    out.push(item(c.top, { colors: ['#fff2c4', '#e3b552', '#a47420', '#5c3c0b'], positions: [0, 0.35, 0.75, 1] }, { color: BRASS_EDGE, w: 1.1 }));
    // A small domed highlight toward the light.
    const hc: P2 = [tb.u0 + (tb.u1 - tb.u0) * 0.36, tb.v0 + (tb.v1 - tb.v0) * 0.34];
    const hr = Math.max(1.5, Math.min(tb.u1 - tb.u0, tb.v1 - tb.v0) * 0.16);
    out.push(item(Array.from({ length: 12 }, (_, i) => [hc[0] + hr * Math.cos((i / 12) * Math.PI * 2), hc[1] + hr * 0.7 * Math.sin((i / 12) * Math.PI * 2)] as P2), SPEC, undefined, { opacity: 0.75, blur: 0.8 }));
  }
  // The bell guard over the lowest cups.
  const g = bellGuard(P, view);
  if (g) out.push(item(g, undefined, { color: BRASS_EDGE, w: 3.4 }), item(g, undefined, { color: '#efcf7a', w: 1.8 }));
  // Side keys (right hand, the camera side), palm keys (left, near the top),
  // the low spatulas (right little finger, near the bow).
  const H = holesOf(row).filter((h) => h.on === 'body');
  if (H.length > 6) {
    const side = H[Math.floor(H.length * 0.45)].u;
    for (let i = 0; i < 3; i++) {
      const a = onTube(P, side - 30 + i * 26, 128, 9);
      const b = onTube(P, side - 12 + i * 26, 128, 9);
      out.push(lineItem([prj(view, a), prj(view, b)], BRASS_EDGE, 8.5), lineItem([prj(view, a), prj(view, b)], '#e8c46a', 6), lineItem([prj(view, a), prj(view, b)], SPEC, 1.6, 0.7));
    }
    for (let i = 0; i < 3; i++) {
      const u = S.tenon + 26 + i * 22;
      const c3 = onTube(P, u, -38 - i * 12, 10);
      out.push(item(circle2(view, c3, tubeDir(P, u, -38 - i * 12), 7.5, 14), { colors: ['#fff2c4', '#d9a947', '#6d4710'] }, { color: BRASS_EDGE, w: 1 }));
    }
    const low = S.bodyEnd - 46;
    for (let i = 0; i < 2; i++) {
      const a = onTube(P, low + i * 22, 112, 10);
      const b = onTube(P, low + i * 22 + 16, 112, 10);
      out.push(lineItem([prj(view, a), prj(view, b)], BRASS_EDGE, 11), lineItem([prj(view, a), prj(view, b)], '#e8c46a', 8.4), lineItem([prj(view, a), prj(view, b)], SPEC, 2, 0.6));
    }
    // The right thumb rest (back of the body) and the left thumb's octave button.
    const rt = H[3]?.u ?? low - 120;
    const tA = onTube(P, rt - 14, 182, 3);
    const tB = onTube(P, rt + 10, 182, 11);
    out.push(lineItem([prj(view, tA), prj(view, tB)], BRASS_EDGE, 6), lineItem([prj(view, tA), prj(view, tB)], '#e3bd60', 3.6));
    const ob = onTube(P, H[H.length - 3].u + 8, 186, 8);
    out.push(item(circle2(view, ob, tubeDir(P, H[H.length - 3].u + 8, 186), 6, 14), { radial: PEARL, c: prj(view, ob), r: 7 }, { color: '#6d6455', w: 0.8 }));
  }
  // The strap ring.
  const ringPts = circle2(view, A.ring, tubeDir(P, S.tenon + 70, 180), 7, 16);
  out.push(itemPath(poly(ringPts), bbox(ringPts), undefined, { color: '#b8bec8', w: 2.4 }));
  for (const p of pearlsOf(P, view)) {
    const pts = Array.from({ length: 16 }, (_, i) => [p.c[0] + p.r * Math.cos((i / 16) * Math.PI * 2), p.c[1] + p.r * Math.sin((i / 16) * Math.PI * 2)] as P2);
    // The touch's brass key under the pearl, back to its cup's hinge.
    out.push(lineItem([p.base, p.c], BRASS_EDGE, 5), lineItem([p.base, p.c], '#e3bd60', 3));
    out.push(item(pts.map(([u, v]) => [u + 1.5, v + 2] as P2), '#000', undefined, { opacity: 0.3, blur: 1.5 }));
    out.push(item(pts, { radial: PEARL, c: [p.c[0] - p.r * 0.3, p.c[1] - p.r * 0.35], r: p.r * 1.3 }, { color: '#7d725f', w: 0.9 }));
  }
  // The mouthpiece in front of everything at the lips: rubber, the
  // ligature, the reed under it.
  const mp = tubeSamples(P, view, 0, S.mouthEnd, 2);
  out.push(...tubeItems(mp, 'rubber'));
  out.push(item(band(mp.filter((q) => q.u < S.mouthEnd * 0.62), (q) => (q.n[1] >= 0 ? 0.78 : -0.78), 0.16), REED, undefined, { opacity: 0.95 }));
  const lig = tubeSamples(P, view, S.mouthEnd * 0.28, S.mouthEnd * 0.46, 2, (u) => radiusAt(row, u) + 1.6);
  out.push(...tubeItems(lig, 'silver'));
  return out;
}

/* ── the player ── */

type Group3 = { key: string; items: Item[] };

/** A whole ARM, shoulder → elbow → wrist: the shared anatomical arm (owner
 *  2026-10-10: the tube arms) — the elbow's point and crook, the forearm's
 *  swell, the cuff short of the wrist; one outline, no seam. */
function armItem(view: ViewId, s: Vec3, e: Vec3, w: Vec3): Item {
  const S = prj(view, s);
  const E = prj(view, e);
  const W = prj(view, w);
  const path = armPath(pt(S[0], S[1]), pt(E[0], E[1]), pt(W[0], W[1]));
  return { path, fill: { colors: SHIRT }, stroke: { color: SHIRT_EDGE, w: 2 }, box: bbox([S, E, W]), rim: 2.2 };
}

function limbItem(view: ViewId, a: Vec3, b: Vec3, ra: number, rb: number, fill: Fill, edge = SHIRT_EDGE): Item {
  const pts = limb2(prj(view, a), prj(view, b), ra, rb);
  return { path: smooth(pts, true, 0.35), fill, stroke: { color: edge, w: 2 }, box: bbox(pts), rim: 2.2 };
}

/** The head in profile, facing +u — the SHARED figure head (PlayerFigure
 *  headProfile; head fix 2026-10-08: the sax family's own head outline is
 *  retired, every lab figure wears the same skin-silhouette head). Nudged
 *  6 head-units forward so the lips sit on the mouthpiece where the old
 *  outline's did; the neck down 168 units into the collar. */
function headSide(c: P2, r: number): { line: SkPath; fill: SkPath } {
  const k = r / 110;
  return headProfile(pt(c[0] + 6 * k, c[1]), r, c[1] + 168 * k, 1);
}
/** The head from above, the nose's tip toward +u — the SHARED figure head
 *  (PlayerFigure headAbove, nose +v, turned a quarter to +u). */
function headTop(c: P2, r: number): { line: SkPath; fill: SkPath } {
  const h0 = headAbove(pt(0, 0), r);
  const m = Skia.Matrix().translate(c[0], c[1]).rotate(-Math.PI / 2);
  const line = h0.line.copy();
  line.transform(m);
  const fill = h0.fill.copy();
  fill.transform(m);
  return { line, fill };
}

/** The player's paint, split behind and in front of the instrument. */
export function playerGroups(P: SaxPosture, view: ViewId): { behind: Group3[]; front: Group3[]; head: { line: SkPath; fill: SkPath; c: P2; r: number } } {
  const s = P.player;
  const q = (p: Vec3) => prj(view, p);
  const behind: Group3[] = [];
  const front: Group3[] = [];
  const seated = P.kind === 'seated';
  // The chair (seated), behind everything.
  if (P.chair) {
    const { min, max } = P.chair.seat;
    const legs = P.chair.legs.map(([a, b]) => limbItem(view, a, b, 12, 11, { colors: METAL }, '#202228'));
    const seat = view === 'side' ? [[min.x, min.y], [max.x, min.y], [max.x, max.y], [min.x, max.y]] as P2[] : [[min.x, min.z], [max.x, min.z], [max.x, max.z], [min.x, max.z]] as P2[];
    const backrest = view === 'side' ? ([[min.x - 6, min.y - 380], [min.x + 34, min.y - 380], [min.x + 34, min.y], [min.x - 6, min.y]] as P2[]) : null;
    behind.push({ key: 'chair', items: [...legs, item(seat, { colors: CHAIR }, { color: '#000', w: 2 }, { rim: 1.6 }), ...(backrest ? [item(backrest, { colors: CHAIR }, { color: '#000', w: 2 }, { rim: 1.6 })] : [])] });
  }
  // Legs (the far leg darker), shoes.
  const leg = (side: 'L' | 'R') => {
    const hip = side === 'L' ? s.hipL : s.hipR;
    const knee = side === 'L' ? s.kneeL : s.kneeR;
    const ankle = side === 'L' ? s.ankleL : s.ankleR;
    const toe = side === 'L' ? s.toeL : s.toeR;
    return [limbItem(view, hip, knee, 82, 60, { colors: TROUSER }), limbItem(view, knee, ankle, 60, 40, { colors: TROUSER }), limbItem(view, ankle, toe, 42, 36, { colors: SHOE }, '#000')];
  };
  behind.push({ key: 'legL', items: leg('L').map((it) => ({ ...it, opacity: 0.85 })) });
  // The far arm (the left), behind the torso and the horn.
  const armL = [armItem(view, s.shoulderL, s.elbowL, s.wristL)];
  behind.push({ key: 'armL', items: armL.map((it) => ({ ...it, opacity: 0.9 })) });
  // The torso.
  if (view === 'side') {
    const N = q(s.neck);
    const C = q(s.chest);
    const Pv = q(s.pelvis);
    const Sh = q(s.shoulderR);
    const pts: P2[] = [
      [N[0] - 48, N[1] - 6],
      [Sh[0] - 66, Sh[1] + 8],
      [C[0] - 108, C[1] + 6],
      [Pv[0] - 84, Pv[1] - 170],
      [Pv[0] - 104, Pv[1] + 6],
      [Pv[0] - 72, Pv[1] + (seated ? 70 : 96)],
      [Pv[0] + 30, Pv[1] + (seated ? 76 : 108)],
      [Pv[0] + 92, Pv[1] - 18],
      [C[0] + 112, C[1] + 196],
      [C[0] + 126, C[1] + 12],
      [N[0] + 82, N[1] + 70],
      [N[0] + 52, N[1] + 2],
    ];
    behind.push({ key: 'torso', items: [{ path: smooth(pts, true, 0.5), fill: { colors: SHIRT }, stroke: { color: SHIRT_EDGE, w: 2.2 }, box: bbox(pts), rim: 2.4 }] });
  } else {
    // From above: the shoulders' broad, rounded girdle — the back flatter,
    // the chest a gentle curve forward.
    const C = q(s.chest);
    const L = q(s.shoulderL);
    const R = q(s.shoulderR);
    const pts: P2[] = [
      [L[0] - 40, L[1] - 18],
      [C[0] - 98, (L[1] + C[1]) / 2],
      [C[0] - 104, C[1]],
      [C[0] - 98, (R[1] + C[1]) / 2],
      [R[0] - 40, R[1] + 18],
      [R[0] + 34, R[1] + 10],
      [C[0] + 102, C[1] + 92],
      [C[0] + 124, C[1]],
      [C[0] + 102, C[1] - 92],
      [L[0] + 34, L[1] - 10],
    ];
    behind.push({ key: 'torso', items: [{ path: smooth(pts, true, 0.5), fill: { colors: SHIRT }, stroke: { color: SHIRT_EDGE, w: 2.2 }, box: bbox(pts), rim: 2.4 }] });
    if (seated) behind.unshift({ key: 'thighsTop', items: [limbItem(view, s.hipL, s.kneeL, 82, 62, { colors: TROUSER }), limbItem(view, s.hipR, s.kneeR, 82, 62, { colors: TROUSER })] });
  }
  if (view === 'side') behind.push({ key: 'legR', items: leg('R') });
  else if (!seated) behind.unshift({ key: 'feet', items: [limbItem(view, s.ankleL, s.toeL, 46, 38, { colors: SHOE }, '#000'), limbItem(view, s.ankleR, s.toeR, 46, 38, { colors: SHOE }, '#000')] });
  // The strap: behind the horn.
  const strapPts: P2[] = [];
  const from = P.strap.from;
  const to = P.strap.to;
  const mid = add(scale(add(from, to), 0.5), { x: 30, y: -30, z: 40 });
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const a = add(scale(from, (1 - t) * (1 - t)), add(scale(mid, 2 * t * (1 - t)), scale(to, t * t)));
    strapPts.push(q(a));
  }
  behind.push({ key: 'strap', items: [lineItem(strapPts, '#07080a', 18), { ...lineItem(strapPts, STRAP[1], 13), opacity: 0.95 }] });
  // The left hand (on the far side of the horn): palm and fingers to the
  // pearls of the upper stack.
  const handItems = (side: 'L' | 'R'): Item[] => {
    const w = side === 'L' ? s.wristL : s.wristR;
    const h = side === 'L' ? s.handL : s.handR;
    // The wrist (≈ 54 mm) narrower than the heel of the hand, out of the cuff.
    const palm = limbItem(view, add(w, scale(sub(h, w), -0.12)), h, 27, 36, { colors: SKIN }, SKIN_EDGE);
    const tips = pearlsOf(P, view).filter((p) => p.hand === side);
    const fingers = tips.map((t) => limbItem(view, add(h, scale(sub(t.p3, h), 0.2)), t.p3, 11, 8.5, { colors: SKIN }, SKIN_EDGE));
    return [palm, ...fingers];
  };
  behind.push({ key: 'handL', items: handItems('L') });
  // In front of the horn: the right arm and hand (the camera side).
  front.push({ key: 'armR', items: [armItem(view, s.shoulderR, s.elbowR, s.wristR)] });
  front.push({ key: 'handR', items: handItems('R') });
  const hc = q(s.head);
  const head = view === 'side' ? { ...headSide(hc, s.headR), c: hc, r: s.headR } : { ...headTop(hc, s.headR), c: hc, r: s.headR };
  return { behind, front, head };
}

/** The player's head as part of the figure (owner 2026-10-06: no separate
 *  line-art head icon on a lab figure) — the shared FigureHead skin mass. */
function HeadArt({ h }: { h: { line: SkPath; fill: SkPath; c: P2; r: number } }) {
  return <FigureHead fill={h.fill} />;
}

/** The instrument alone (its own fingering), for a view. */
export function SaxInstrument({ P, view, f, dim = 1 }: { P: Placed; view: ViewId; f: Pick<Fingering, 'open' | 'octaveKey'> | null; dim?: number }) {
  const items = useMemo(() => saxItems(P, view, f), [P, view, f]);
  return (
    <Group opacity={dim}>
      {items.map((it, i) => (
        <PaintItem key={i} it={it} />
      ))}
    </Group>
  );
}

/** The resting fingering the scenes draw (written G4: the left hand down). */
export const REST_NOTE = 9;

/** The player and the horn, for one view: player behind, horn, near arm,
 *  head over the mouthpiece in the top view. */
export function SaxScene({ P, view, f }: { P: SaxPosture; view: ViewId; f?: Pick<Fingering, 'open' | 'octaveKey'> | null }) {
  const fing = useMemo(() => f ?? fingering(P.row, REST_NOTE), [P, f]);
  const pg = useMemo(() => playerGroups(P, view), [P, view]);
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
      {/* The player recedes (charter §6): behind at 0.8, in front at 0.62. */}
      <Group layer={<Paint opacity={0.8} />}>
        {draw(pg.behind)}
        <HeadArt h={pg.head} />
      </Group>
      <SaxInstrument P={P} view={view} f={fing} />
      <Group layer={<Paint opacity={0.62} />}>{draw(pg.front)}</Group>
    </Group>
  );
}

/** The instrument component a lesson hands the engine (standing / seated). */
export function makeSaxInstrument(standing: SaxPosture, seated: SaxPosture) {
  return function SaxInstrumentArt({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
    return <SaxScene P={variant === 'seated' ? seated : standing} view={view} />;
  };
}

/* ── labels and taps ── */

/** The part labels, set out in clear space beside the horn with a leader to
 *  each part (never written on the instrument). */
export function saxLabels(P: SaxPosture, view: ViewId): ArtLabel[] {
  const row = P.row;
  const S = pathOf(row);
  const A = anchorsOf(P);
  const H = holesOf(row);
  const pts: Vec3[] = [];
  for (let u = 0; u <= S.U; u += 20) pts.push(centre(P, u));
  const xs = pts.map((p) => p.x);
  const right = Math.max(...xs) + A.rimR + 70;
  const leftCol = Math.min(...xs) - 60;
  const at = (p: Vec3) => {
    const [u, v] = prj(view, p);
    return { u, v };
  };
  const L = (id: string, text: string, p: Vec3, dv: number, short?: string, tone?: ArtLabel['tone'], side: 'right' | 'left' = 'right'): ArtLabel => {
    const a = at(p);
    const u = side === 'right' ? right : leftCol;
    return { id, text, short, u, v: a.v + dv, align: side === 'right' ? 'left' : 'right', tone, at: a, alts: [{ u: side === 'right' ? right : leftCol, v: a.v + dv + 70, align: side === 'right' ? 'left' : 'right' }, { u: side === 'right' ? right : leftCol, v: a.v + dv - 70, align: side === 'right' ? 'left' : 'right' }] };
  };
  const body = H.filter((h) => h.on === 'body');
  const mid = body[Math.floor(body.length / 2)] ?? H[0];
  const octU = S.mouthEnd + (S.tenon - S.mouthEnd) * 0.36;
  if (view === 'top') {
    return [
      L('bell', 'BELL', A.rimC, 0),
      L('mouthpiece', 'MOUTHPIECE', centre(P, S.mouthEnd * 0.5), -60, 'MOUTH-PIECE'),
      { id: 'player', text: 'PLAYER', u: P.player.chest.x - 120, v: P.player.chest.z - 260, align: 'center', tone: 'muted' },
    ];
  }
  const out: ArtLabel[] = [
    L('mouthpiece', 'MOUTHPIECE · REED', centre(P, S.mouthEnd * 0.45), -150, 'MOUTHPIECE'),
    L('octave', 'OCTAVE KEY', onTube(P, octU, 4, 6), -90, 'OCTAVE'),
    L('neck', 'NECK', centre(P, (S.mouthEnd + S.tenon) / 2 + 30), -20),
    L('keys', 'KEYS · PADS', onTube(P, body[body.length - 3]?.u ?? mid.u, 20, 6), 0, 'KEYS'),
    L('holes', 'TONE HOLES', onTube(P, mid.u, 30, 4), 40, 'HOLES'),
    L('bell', 'BELL', A.rimC, -30),
  ];
  if (S.bellStart > S.bodyEnd + 1) out.push(L('bow', 'BOW', centre(P, (S.bodyEnd + S.bellStart) / 2), 40));
  out.push({ id: 'player', text: 'PLAYER', u: P.player.head.x - 40, v: P.player.head.y - 160, align: 'center', tone: 'muted', at: at(P.player.head) });
  out.push(L('strap', row.id === 'baritone' ? 'HARNESS' : 'STRAP', add(scale(add(P.strap.from, P.strap.to), 0.5), { x: 30, y: -30, z: 40 }), 0, undefined, 'muted', 'left'));
  return out;
}

function segD(u: number, v: number, a: P2, b: P2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const ll = dx * dx + dy * dy;
  let t = ll > 1e-9 ? ((u - a[0]) * dx + (v - a[1]) * dy) / ll : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(u - (a[0] + dx * t), v - (a[1] + dy * t));
}

/** The part under a view point (u, v), `tol` in mm. */
export function saxHitTest(P: SaxPosture, view: ViewId, u: number, v: number, tol: number): string | null {
  const row = P.row;
  const S = pathOf(row);
  const A = anchorsOf(P);
  const near = (p: Vec3, r: number) => {
    const [a, b] = prj(view, p);
    return Math.hypot(u - a, v - b) <= r + tol;
  };
  const alongTube = (u0: number, u1: number, extra: number) => {
    for (let x = u0; x < u1; x += 10) {
      const a = prj(view, centre(P, x));
      const b = prj(view, centre(P, Math.min(u1, x + 10)));
      if (segD(u, v, a, b) <= radiusAt(row, x) + extra + tol) return true;
    }
    return false;
  };
  if (near(A.rimC, A.rimR)) return 'sx.bell';
  if (near(onTube(P, S.mouthEnd + (S.tenon - S.mouthEnd) * 0.36, 4, 4), 12)) return 'sx.octave';
  if (alongTube(0, S.mouthEnd, 2)) return 'sx.mouthpiece';
  if (alongTube(S.mouthEnd, S.tenon, 6)) return 'sx.neck';
  for (const h of holesOf(row)) if (near(onTube(P, h.u, 30, 6), h.cupR + 4)) return 'sx.holes';
  for (const p of pearlsOf(P, view)) if (Math.hypot(u - p.c[0], v - p.c[1]) <= p.r + 6 + tol) return 'sx.keys';
  if (alongTube(S.tenon, S.bodyEnd, 16)) return 'sx.body';
  if (S.bellStart > S.bodyEnd + 1 && alongTube(S.bodyEnd, S.bellStart, 10)) return 'sx.bow';
  if (alongTube(S.bellStart, S.U, 12)) return 'sx.bell';
  const s = P.player;
  if (near(s.head, s.headR)) return 'sx.head';
  const seg = (a: Vec3, b: Vec3, r: number) => segD(u, v, prj(view, a), prj(view, b)) <= r + tol;
  if (seg(s.wristL, s.handL, 50) || seg(s.wristR, s.handR, 50)) return 'sx.handR';
  if (seg(P.strap.from, P.strap.to, 14)) return 'sx.strap';
  if (seg(s.shoulderR, s.elbowR, 50) || seg(s.elbowR, s.wristR, 45) || seg(s.shoulderL, s.elbowL, 50) || seg(s.elbowL, s.wristL, 45)) return 'sx.armR1';
  if (seg(s.pelvis, s.neck, 140)) return 'sx.player';
  if (seg(s.hipR, s.kneeR, 80) || seg(s.kneeR, s.ankleR, 60) || seg(s.hipL, s.kneeL, 80) || seg(s.kneeL, s.ankleL, 60)) return 'sx.thighR';
  if (P.chair) {
    const c = P.chair.seat;
    if (near({ x: (c.min.x + c.max.x) / 2, y: (c.min.y + c.max.y) / 2, z: 0 }, 200)) return 'sx.chair';
  }
  return null;
}

/* ── ORIENT's figure: the instrument face-on, upright, every part named ── */

/** The instrument laid flat in its own plane (a → u, b → v): the portrait. */
export function portraitOf(row: SaxRow): Placed {
  const ax: PlaneAxes = { a: { x: 1, y: 0, z: 0 }, b: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } };
  return { row, ax };
}
export function portraitBox(row: SaxRow): ViewBox {
  const S = pathOf(row);
  const P = portraitOf(row);
  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  for (let u = 0; u <= S.U; u += 10) {
    const c = centre(P, u);
    const r = radiusAt(row, u) + 20;
    u0 = Math.min(u0, c.x - r);
    u1 = Math.max(u1, c.x + r);
    v0 = Math.min(v0, c.y - r);
    v1 = Math.max(v1, c.y + r);
  }
  // Room for the labels on both sides.
  const w = u1 - u0;
  return { u0: u0 - w * 0.7 - 120, u1: u1 + w * 0.7 + 120, v0: v0 - 40, v1: v1 + 40 };
}

export function makeSaxPortrait(row: SaxRow, a11y: string): { aspect: number; render: (w: number, h: number) => ReactElement } {
  const P = portraitOf(row);
  const box = portraitBox(row);
  const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
  const f = fingering(row, REST_NOTE);
  function Portrait({ w, h }: { w: number; h: number }) {
    const textScale = useStageTextScale();
    const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]);
    const labels = useMemo(() => portraitLabels(row, box), []);
    return (
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <SaxInstrument P={P} view="side" f={f} />
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }
  return { aspect, render: (w, h) => <Portrait w={w} h={h} /> };
}

/** The portrait's labels: a column each side, a leader to every part. */
export function portraitLabels(row: SaxRow, box: ViewBox): StaticLabel[] {
  const P = portraitOf(row);
  const S = pathOf(row);
  const A = anchorsOf(P);
  const H = holesOf(row);
  const body = H.filter((h) => h.on === 'body');
  const pt = (p: Vec3) => ({ u: p.x, v: p.y });
  const R = box.u1 - 30;
  const Lc = box.u0 + 30;
  const lab = (id: string, text: string, p: Vec3, side: 'L' | 'R', dv = 0, short?: string): StaticLabel => ({ id, text, short, u: side === 'R' ? R : Lc, v: p.y + dv, align: side === 'R' ? 'right' : 'left', at: pt(p) });
  const out: StaticLabel[] = [
    lab('mouthpiece', 'MOUTHPIECE', centre(P, S.mouthEnd * 0.4), 'L', -20, 'MOUTH-PIECE'),
    lab('reed', 'REED · LIGATURE', onTube(P, S.mouthEnd * 0.38, 180, 2), 'L', 30, 'REED'),
    lab('neck', 'NECK', centre(P, (S.mouthEnd + S.tenon) / 2), 'L', 40),
    lab('octave', 'OCTAVE KEY', onTube(P, S.mouthEnd + (S.tenon - S.mouthEnd) * 0.36, 4, 6), 'R', -30, 'OCTAVE'),
    lab('pearls', 'PEARL TOUCHES', pearlsOf(P, 'side')[0]?.p3 ?? A.upperKeys, 'L', 0, 'PEARLS'),
    lab('cups', 'KEY CUPS · PADS', onTube(P, body[Math.floor(body.length / 2)]?.u ?? S.tenon, 30, 8), 'R', -10, 'CUPS'),
    lab('rods', 'RODS', onTube(P, body[Math.floor((body.length * 2) / 3)]?.u ?? S.tenon, 100, 8), 'R', 30),
    lab('holes', 'TONE HOLES', onTube(P, body[2]?.u ?? S.bodyEnd, 30, 4), 'R', 20, 'HOLES'),
    lab('body', 'BODY', centre(P, (S.tenon + S.bodyEnd) / 2), 'L', 60),
    lab('bell', 'BELL', A.rimC, 'R', 0),
  ];
  if (S.bellStart > S.bodyEnd + 1) out.push(lab('bow', 'BOW', centre(P, (S.bodyEnd + S.bellStart) / 2), 'L', 0));
  if (row.bottom < 0) out.push(lab('lowA', 'LOW A KEY', onTube(P, H[0].u, 30, 4), 'R', 36, 'LOW A'));
  return out;
}
