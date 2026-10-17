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
 *   • the player, the house figure in profile (side) or from above (top) —
 *     one shirt, the sleeves out of it at the shoulder — with the shared
 *     head (its lips round the mouthpiece) and the shared 3-D hands on the
 *     keys (saxHands.ts: the fingers' pads on the pearls, the thumbs on the
 *     octave rest and under the thumb hook). Opaque (figure pass 3).
 *
 * Nothing moves (D8). Paths are built once per posture, view and fingering.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { VariantId, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { add, dot, scale, sub } from '../../../engine/geometry/vec.ts';
import { FigureHead, headAbove, headProfile, intoCollar } from '../players/PlayerFigure';
import { PaintItem as FigurePaint, playerGroups as figureGroups, type HandHold, type Item as FigureItem } from '../bowed/BowedArt';
import { saxHands, type SaxHand, type SaxTouch } from './saxHands.ts';
import { pt } from '../players/playerPose';
import { fingering, holesOf, pathOf, radiusAt, type Fingering, type SaxRow } from './saxSpec.ts';
import { anchorsOf, centre, onTube, tangent, tubeDir, type PlaneAxes, type SaxPosture } from './saxPosture.ts';
import { TO_VIEWER, band, bellGuard, circle2, cupsOf, depthOf, engraving, lowSpatulaU, pearlsOf, prj, rodsOf, silhouette, tubeSamples, type P2, type Placed, type TubeSample } from './saxDraw.ts';

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
/* the player wears the house figure (bowed/BowedArt.playerGroups: the shared
   shirt, trouser, skin and shoe tones); the strap is this family's. */
const STRAP = ['#3a3f4a', '#1d2027', '#0d0f13'];

/* ── path helpers ── */
const make = () => Skia.Path.Make();
function poly(pts: readonly P2[], close = true): SkPath {
  const p = make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  if (close) p.close();
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
export function saxItems(P: Placed, view: ViewId, f: Pick<Fingering, 'open' | 'octaveKey'> | null, extra: { hook?: SaxTouch; table?: SaxHand } = {}): Item[] {
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
    const low = lowSpatulaU(row);
    for (let i = 0; i < 2; i++) {
      const a = onTube(P, low + i * 22, 112, 10);
      const b = onTube(P, low + i * 22 + 16, 112, 10);
      out.push(lineItem([prj(view, a), prj(view, b)], BRASS_EDGE, 11), lineItem([prj(view, a), prj(view, b)], '#e8c46a', 8.4), lineItem([prj(view, a), prj(view, b)], SPEC, 2, 0.6));
    }
    // The right thumb hook (back of the body, where the thumb sits under it —
    // saxHands) and the left thumb's octave button.
    const rt = extra.hook ? extra.hook.u - 18 : H[3]?.u ?? low - 120;
    const ra = extra.hook ? extra.hook.ang + 2 : 182;
    const tA = onTube(P, rt - 14, ra, 3);
    const tB = onTube(P, rt + 10, ra, 11);
    out.push(lineItem([prj(view, tA), prj(view, tB)], BRASS_EDGE, 6), lineItem([prj(view, tA), prj(view, tB)], '#e3bd60', 3.6));
    const ob = onTube(P, H[H.length - 3].u + 8, 186, 8);
    out.push(item(circle2(view, ob, tubeDir(P, H[H.length - 3].u + 8, 186), 6, 14), { radial: PEARL, c: prj(view, ob), r: 7 }, { color: '#6d6455', w: 0.8 }));
  }
  // The left little finger's G♯ / low-key table: its spatulas under the finger's pad.
  if (extra.table) {
    const t = extra.table.touches[3];
    const pad = extra.table.pads[3];
    if (pad && t) {
      const m = tubeDir(P, t.u, t.ang);
      const c3 = sub(pad, scale(m, 7));
      for (const d of [-9, 9]) {
        const along = sub(onTube(P, t.u + d + 8, t.ang, t.out), onTube(P, t.u + d - 8, t.ang, t.out));
        const a = add(c3, add(scale(along, 0.5), scale(tubeDir(P, t.u, t.ang + 90), d * 0.5)));
        const b = add(c3, add(scale(along, -0.5), scale(tubeDir(P, t.u, t.ang + 90), d * 0.5)));
        out.push(lineItem([prj(view, a), prj(view, b)], BRASS_EDGE, 9), lineItem([prj(view, a), prj(view, b)], '#e8c46a', 6.6), lineItem([prj(view, a), prj(view, b)], SPEC, 1.6, 0.6));
      }
    }
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

/**
 * THE PLAYER (figure pass 3, owner 2026-10-15: "shoulder transitions from
 * shirt sleeves to the shirt body look very unnatural … plug and position
 * interchangeable limbs"): the house figure the bowed and brass families
 * wear (bowed/BowedArt.playerGroups) — ONE shirt, the near sleeve growing
 * out of it with the deltoid over the joint and its armhole melting into the
 * shoulder, the far sleeve a shade darker, the collar, the chest fuller than
 * the belly, the shirt tucked in at the belt, the house legs and shoes — on
 * this posture's joints (the same joints the keep-outs use), and the HANDS
 * the shared 3-D hand posed on the keys (saxHands.ts). Opaque, as every lab
 * figure is. The head is this family's own (its lips on the mouthpiece).
 */
type Group3 = { key: string; depth: number; items: FigureItem[] };

/** The horn's silhouette round a hand's station (what hides that hand's far side). */
function hornAround(P: SaxPosture, view: ViewId, u: number): SkPath {
  const S = pathOf(P.row);
  return poly(silhouette(tubeSamples(P, view, Math.max(S.mouthEnd, u - 220), Math.min(S.bellStart, u + 220), 6, (q) => radiusAt(P.row, q) + 8)));
}

export function playerGroups(P: SaxPosture, view: ViewId): { groups: Group3[]; hornDepth: number; head: { line: SkPath; fill: SkPath; c: P2; r: number } } {
  const s = P.player;
  const S = pathOf(P.row);
  // (The body, the head and the strap always behind the horn — a soprano held in front of the chest included.)
  const hornDepth = Math.max(depthOf(view, centre(P, (S.tenon + S.bodyEnd) / 2)), depthOf(view, s.chest) + 1.5);
  const H = saxHands(P);
  const toV = TO_VIEWER[view];
  const hold = (h: SaxHand, far: boolean): HandHold => {
    const t = tangent(P, h.u);
    const n = sub(toV, scale(t, dot(toV, t)));
    const nl = Math.hypot(n.x, n.y, n.z);
    return {
      kind: 'wrap',
      // The hand over the horn; its far side (a palm round the far side of the body, a thumb behind it) hidden where the horn covers it.
      posed: { sk: h.sk, cut: nl > 0.2 ? { p: centre(P, h.u), n: scale(n, 1 / nl) } : undefined, hide: hornAround(P, view, h.u) },
      depth: hornDepth + 2.5,
      // The far (left) forearm, seen from the player's right, behind the horn;
      // the near one in front of it (the arm paints 1 under this depth).
      armDepth: far && view === 'side' ? hornDepth - 1 : hornDepth + 2,
    };
  };
  const figure = { player: { ...s, face: { x: 1, y: 0, z: 0 } }, chair: P.chair ?? undefined };
  // The near sleeve melts into the shirt only round the shoulder (≈ 150 mm,
  // the deltoid); a saxophonist's near arm lies over the shirt all the way to
  // the wrist in profile, and lower down it keeps its own outline.
  const sh = prj(view, s.shoulderR);
  const round = make();
  round.addCircle(sh[0], sh[1], 150);
  const nearSoft = (it: FigureItem): FigureItem => (it.soft ? { ...it, soft: Skia.Path.MakeFromOp(it.soft, round, PathOp.Intersect) ?? undefined } : it);
  const groups: Group3[] = figureGroups(figure, view, true, { hands: { L: hold(H.L, true), R: hold(H.R, false) } }).map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.head).map((it) => (view === 'side' && (g.key === 'upperR' || g.key === 'foreR') ? nearSoft(it) : it)),
  }));
  // The strap: from behind the neck over the shirt to the ring.
  const strapPts: P2[] = [];
  const from = P.strap.from;
  const to = P.strap.to;
  const mid = add(scale(add(from, to), 0.5), { x: 30, y: -30, z: 40 });
  for (let t = 0; t <= 1.0001; t += 0.1) strapPts.push(prj(view, add(scale(from, (1 - t) * (1 - t)), add(scale(mid, 2 * t * (1 - t)), scale(to, t * t)))));
  const strapItem = (w: number, color: string): FigureItem => ({ path: poly(strapPts, false), stroke: { color, w }, box: bbox(strapPts) });
  groups.push({ key: 'strap', depth: depthOf(view, s.chest) + 1, items: [strapItem(18, '#07080a'), strapItem(13, STRAP[1])] });
  groups.sort((a, b) => a.depth - b.depth);
  const hc = prj(view, s.head);
  // The neck goes INTO the collar (figure pass 2026-10-15): the head stops at
  // the shirt's outline instead of lying over the shoulders.
  const torso = groups.find((g) => g.key === 'torso')?.items[0]?.path ?? null;
  const head = view === 'side' ? { ...(torso ? intoCollar(headSide(hc, s.headR), torso) : headSide(hc, s.headR)), c: hc, r: s.headR } : { ...headTop(hc, s.headR), c: hc, r: s.headR };
  return { groups, hornDepth, head };
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

/** The player's head as part of the figure (owner 2026-10-06: no separate
 *  line-art head icon on a lab figure) — the shared FigureHead skin mass. */
function HeadArt({ h }: { h: { line: SkPath; fill: SkPath; c: P2; r: number } }) {
  return <FigureHead fill={h.fill} />;
}

/** The instrument alone (its own fingering), for a view. */
export function SaxInstrument({ P, view, f, dim = 1, hook, table }: { P: Placed; view: ViewId; f: Pick<Fingering, 'open' | 'octaveKey'> | null; dim?: number; hook?: SaxTouch; table?: SaxHand }) {
  const items = useMemo(() => saxItems(P, view, f, { hook, table }), [P, view, f, hook, table]);
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

/** The player and the horn, for one view, painted far to near: the player's
 *  parts behind the horn, the horn, the parts in front of it (the near arm,
 *  the hands on the keys). Opaque (owner 2026-10-10: a see-through limb reads
 *  as a mannequin). */
export function SaxScene({ P, view, f }: { P: SaxPosture; view: ViewId; f?: Pick<Fingering, 'open' | 'octaveKey'> | null }) {
  const fing = useMemo(() => f ?? fingering(P.row, REST_NOTE), [P, f]);
  const pg = useMemo(() => playerGroups(P, view), [P, view]);
  const hook = useMemo(() => saxHands(P).R.thumb, [P]);
  const draw = (gs: Group3[]) =>
    gs.map((g) => (
      <Group key={g.key}>
        {g.items.map((it, i) => (
          <FigurePaint key={i} it={it} />
        ))}
      </Group>
    ));
  const behind = pg.groups.filter((g) => g.depth < pg.hornDepth);
  const front = pg.groups.filter((g) => g.depth >= pg.hornDepth);
  return (
    <Group>
      {draw(behind)}
      <HeadArt h={pg.head} />
      <SaxInstrument P={P} view={view} f={fing} hook={hook} table={saxHands(P).L} />
      {draw(front)}
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
  // (Art fix 2026-10-16, grading: "leaders crossing the bell".) The keys
  // and holes are named on the BELL's own stack where it has one — it faces
  // the right-hand column — so no leader runs across the bell to the body.
  const onBell = H.filter((h) => h.on === 'bell');
  const keysAt = onBell.length ? onTube(P, onBell[0].u, 20, 6) : onTube(P, body[body.length - 3]?.u ?? mid.u, 20, 6);
  const holesAt = onBell.length ? onTube(P, onBell[onBell.length - 1].u, 30, 4) : onTube(P, mid.u, 30, 4);
  const out: ArtLabel[] = [
    L('mouthpiece', 'MOUTHPIECE · REED', centre(P, S.mouthEnd * 0.45), -150, 'MOUTHPIECE'),
    L('octave', 'OCTAVE KEY', onTube(P, octU, 4, 6), -90, 'OCTAVE'),
    L('neck', 'NECK', centre(P, (S.mouthEnd + S.tenon) / 2 + 30), -20),
    { ...L('keys', 'KEYS · PADS', keysAt, 60, 'KEYS'), alts: [130, -10, 200, 270].map((dv) => ({ u: right, v: at(keysAt).v + dv, align: 'left' as const })) },
    L('holes', 'TONE HOLES', holesAt, 40, 'HOLES'),
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
  // (Art fix 2026-10-16, grading: "leaders crossing the bell".) The right
  // column names the cups and holes on the BELL's own stack (the low keys),
  // which face that column, so no leader runs across the bell to the body.
  const onBell = H.filter((h) => h.on === 'bell');
  const cupAt = onBell.length ? onTube(P, onBell[Math.floor(onBell.length / 2)].u, 30, 8) : onTube(P, body[Math.floor(body.length / 2)]?.u ?? S.tenon, 30, 8);
  const holeAt = onBell.length ? onTube(P, onBell[onBell.length - 1].u, 30, 4) : onTube(P, body[2]?.u ?? S.bodyEnd, 30, 4);
  const out: StaticLabel[] = [
    lab('mouthpiece', 'MOUTHPIECE', centre(P, S.mouthEnd * 0.4), 'L', -20, 'MOUTH-PIECE'),
    lab('reed', 'REED · LIGATURE', onTube(P, S.mouthEnd * 0.38, 180, 2), 'L', 30, 'REED'),
    lab('neck', 'NECK', centre(P, (S.mouthEnd + S.tenon) / 2), 'L', 40),
    lab('octave', 'OCTAVE KEY', onTube(P, S.mouthEnd + (S.tenon - S.mouthEnd) * 0.36, 4, 6), 'R', -30, 'OCTAVE'),
    lab('pearls', 'PEARL TOUCHES', pearlsOf(P, 'side')[0]?.p3 ?? A.upperKeys, 'L', 0, 'PEARLS'),
    lab('cups', 'KEY CUPS · PADS', cupAt, 'R', -10, 'CUPS'),
    lab('rods', 'RODS', onTube(P, body[Math.floor((body.length * 2) / 3)]?.u ?? S.tenon, 100, 8), 'R', 30),
    lab('holes', 'TONE HOLES', holeAt, 'R', 20, 'HOLES'),
    lab('body', 'BODY', centre(P, (S.tenon + S.bodyEnd) / 2), 'L', 60),
    lab('bell', 'BELL', A.rimC, 'R', 0),
  ];
  if (S.bellStart > S.bodyEnd + 1) out.push(lab('bow', 'BOW', centre(P, (S.bodyEnd + S.bellStart) / 2), 'L', 0));
  if (row.bottom < 0) out.push(lab('lowA', 'LOW A KEY', onTube(P, H[0].u, 30, 4), 'R', 36, 'LOW A'));
  return out;
}
