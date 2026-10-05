/**
 * THE BRASS FAMILY — the look (charter §2 layer 3). Everything is DRAWN IN
 * 3-D and projected, from brassPosture.ts, so it sits exactly where the
 * solids and the zones are:
 *
 *   • the BELL as a solid of revolution: the union of its flare's frusta
 *     (exact for any projection), lacquered brass with a light band toward
 *     the upper left, a specular streak, the rim's bead and — seen at an
 *     angle (ORIENT's portrait) — the dark throat inside;
 *   • the TUBING as lengths of round tube: an outline, the metal, a shade
 *     on the lower side and a highlight on the upper-left side; nickel for
 *     the slides' inner tubes and the braces;
 *   • the VALVES (casings, caps, stems and pearl buttons), the bass
 *     trombone's ROTORS and their triggers, the MOUTHPIECE;
 *   • the PLAYER — the bowed family's shared figure (BowedArt.playerGroups),
 *     standing, lips on the mouthpiece, hands on the horn.
 *
 * SIDE looks from the player's right toward −z (u = x, v = y); TOP looks
 * down (u = x, v = z); the PORTRAIT turns the horn 32° toward the viewer
 * and looks a little down, so the bell's opening shows. Parts are painted
 * far to near. Upper-left light, gradients and rim light (charter §3).
 * Nothing moves (D8). Labels sit OFF the instrument with leaders to it.
 * Keep-outs are not drawn here: the engine draws a part's keep-out only as
 * a mic approaches it.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Paint, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { VariantId, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { add, scale } from '../../../engine/geometry/vec.ts';
import { PaintItem, bbox, circlePts, hull, playerGroups, polyPath, type Group3, type Item } from '../bowed/BowedArt';
import { bellProfile, bellRadius, type BrassSpec } from './brassSpec.ts';
import type { HornPose, Tube } from './brassPosture.ts';

type P2 = [number, number];

/* ── projections ── */
export type ProjId = ViewId | 'portrait';
export type Proj = { id: ProjId; pt: (p: Vec3) => P2; depth: (p: Vec3) => number; /** screen-up across the bell, as a frame-H direction */ upH: 'y' | 'z' };
const YAW = 32 * (Math.PI / 180);
const PITCH = 12 * (Math.PI / 180);
export const PROJ: Record<ProjId, Proj> = {
  side: { id: 'side', pt: (p) => [p.x, p.y], depth: (p) => p.z, upH: 'y' },
  top: { id: 'top', pt: (p) => [p.x, p.z], depth: (p) => -p.y, upH: 'z' },
  portrait: {
    id: 'portrait',
    pt: (p) => {
      const x1 = p.x * Math.cos(YAW) - p.z * Math.sin(YAW);
      const z1 = p.z * Math.cos(YAW) + p.x * Math.sin(YAW);
      return [x1, p.y * Math.cos(PITCH) + z1 * Math.sin(PITCH)];
    },
    depth: (p) => {
      const z1 = p.z * Math.cos(YAW) + p.x * Math.sin(YAW);
      return z1 * Math.cos(PITCH) - p.y * Math.sin(PITCH);
    },
    upH: 'y',
  },
};

/* ── palette ── */
const OUTLINE = '#07070a';
const BRASS = { lo: '#7a5410', mid: '#d2a443', hi: '#fff1bf', edge: '#2c1d04' };
const NICKEL = { lo: '#6d737e', mid: '#c4cad3', hi: '#ffffff', edge: '#23262c' };
const DARK = { lo: '#3a2a10', mid: '#6b5122', hi: '#b89a5c', edge: '#120c03' };
const BELL_FILL = { colors: ['#fff3c2', '#f2cc66', '#cf9f38', '#8f6417', '#4f3407'], positions: [0, 0.22, 0.5, 0.8, 1] };
const THROAT = { colors: ['#2a1c06', '#5e4210', '#a8781f'], positions: [0, 0.55, 1] };
const PEARL = { colors: ['#fffdf6', '#ece4cf', '#b4a98f'] };
const CASING = { colors: ['#fff0bd', '#dcb052', '#a77a22', '#5c3e0a'], positions: [0, 0.3, 0.7, 1] };
const NICKEL_FILL = { colors: ['#ffffff', '#c9ced6', '#7c828d', '#3c4048'], positions: [0, 0.3, 0.75, 1] };
const toneOf = (t?: Tube['tone']) => (t === 'nickel' ? NICKEL : t === 'dark' ? DARK : BRASS);

/** A stroke-only item from a polyline (screen mm). */
const strokeItem = (pts: P2[], color: string, w: number, opacity = 1): Item => {
  const p = Skia.Path.Make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  return { path: p, stroke: { color, w, opacity }, box: bbox(pts) };
};

/** A length of tube: outline, metal, lower shade, upper-left highlight. */
function tubeItems(t: Tube, pr: Proj): Item[] {
  const pts = t.pts.map(pr.pt);
  const c = toneOf(t.tone);
  const r = t.r;
  const off = (k: number): P2[] => pts.map(([u, v]) => [u + k * r * 0.55, v + k * r * 0.6]);
  return [strokeItem(pts, c.edge, 2 * r + 2.4), strokeItem(pts, c.mid, 2 * r), strokeItem(off(0.42), c.lo, r * 0.8, 0.75), strokeItem(off(-0.45), c.hi, r * 0.55, 0.9)];
}

/** The bell: the union of its flare's frusta, shaded across its axis. */
function bellItems(P: HornPose, pr: Proj): Item[] {
  const spec = P.spec;
  const prof = bellProfile(spec, 36);
  const ring = (x: number, r: number, n = 28): P2[] => {
    const out: P2[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push(pr.pt(P.H({ x, y: r * Math.cos(a), z: r * Math.sin(a) })));
    }
    return out;
  };
  const body = Skia.Path.Make();
  const all: P2[] = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const h = hull([...ring(prof[i][0], prof[i][1]), ...ring(prof[i + 1][0], prof[i + 1][1])]);
    body.addPath(polyPath(h));
    all.push(...h);
  }
  const box = bbox(all);
  const out: Item[] = [];
  out.push({ path: body, stroke: { color: OUTLINE, w: 2.4 }, box });
  out.push({ path: body, fill: BELL_FILL, box, rim: 1.6 });
  // The upper-left specular streak and the lower shade, along the flare.
  const across = (k: number) => prof.filter((_, i) => i % 2 === 0).map(([x, r]) => pr.pt(P.H(pr.upH === 'y' ? { x, y: -k * r, z: 0 } : { x, y: 0, z: -k * r })));
  out.push(strokeItem(across(0.58), '#fffbe6', Math.max(2.4, spec.bell.mm * 0.05), 0.55));
  out.push(strokeItem(across(-0.62), '#5a3c08', Math.max(2, spec.bell.mm * 0.05), 0.35));
  // The ferrule where the flare joins its tube.
  const F = spec.flare.mm;
  out.push({ path: polyPath(ring(-F * 0.92, bellRadius(spec, -F * 0.92) + 2.2, 20)), stroke: { color: BRASS.edge, w: 2.2, opacity: 0.9 }, box });
  // The throat, where the opening faces the viewer (the portrait).
  const R = spec.bell.mm / 2;
  const mouth = ring(0, R - 1, 40);
  const mb = bbox(mouth);
  if (mb.u1 - mb.u0 > 6 && mb.v1 - mb.v0 > 6) out.push({ path: polyPath(mouth), fill: THROAT, box: { u0: mb.u0, v0: mb.v0, u1: mb.u1, v1: mb.v1 } });
  // The rim's bead.
  out.push({ path: polyPath(ring(0, R + 1.2, 40)), stroke: { color: '#3a2705', w: 5.2 }, box });
  out.push({ path: polyPath(ring(0, R + 1.2, 40)), stroke: { color: '#ffe9a3', w: 2.6, opacity: 0.95 }, box });
  return out;
}

/** A piston casing (with caps), its stem and pearl button. */
function valveItems(vv: HornPose['valves'][number], P: HornPose, pr: Proj): Item[] {
  const top = add(vv.c, scale(P.up, vv.h));
  const bot = add(vv.c, scale(P.up, -vv.h));
  const a = pr.pt(top);
  const b = pr.pt(bot);
  const out: Item[] = [];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L > vv.r) {
    // Seen from the side: a cylinder.
    const nx = (-(b[1] - a[1]) / L) * vv.r;
    const ny = ((b[0] - a[0]) / L) * vv.r;
    const quad: P2[] = [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx, b[1] + ny],
      [b[0] - nx, b[1] - ny],
      [a[0] - nx, a[1] - ny],
    ];
    out.push({ path: polyPath(quad), fill: CASING, stroke: { color: OUTLINE, w: 1.8 }, box: bbox(quad), rim: 1 });
    for (const [c, k] of [
      [a, 1],
      [b, -1],
    ] as const) {
      const cap: P2[] = [
        [c[0] + nx * 1.18, c[1] + ny * 1.18 + k * 1],
        [c[0] + nx * 1.18 + ((b[0] - a[0]) / L) * 9 * k, c[1] + ny * 1.18 + ((b[1] - a[1]) / L) * 9 * k],
        [c[0] - nx * 1.18 + ((b[0] - a[0]) / L) * 9 * k, c[1] - ny * 1.18 + ((b[1] - a[1]) / L) * 9 * k],
        [c[0] - nx * 1.18, c[1] - ny * 1.18],
      ];
      out.push({ path: polyPath(cap), fill: NICKEL_FILL, stroke: { color: OUTLINE, w: 1.2 }, box: bbox(cap) });
    }
  } else {
    // End-on (from above): the casing's cap.
    const c = circlePts(a, vv.r * 1.18, 20);
    out.push({ path: polyPath(c), fill: NICKEL_FILL, stroke: { color: OUTLINE, w: 1.4 }, box: bbox(c), rim: 1 });
  }
  // The stem and the pearl button.
  const bt = pr.pt(vv.button);
  out.push(strokeItem([a, bt], NICKEL.edge, 6.4), strokeItem([a, bt], NICKEL.mid, 4.2));
  const bL = Math.hypot(bt[0] - a[0], bt[1] - a[1]);
  const btn: P2[] = bL > 4 ? (() => {
    const ux = (bt[0] - a[0]) / bL;
    const uy = (bt[1] - a[1]) / bL;
    const out2: P2[] = [];
    for (let i = 0; i < 20; i++) {
      const t = (i / 20) * Math.PI * 2;
      out2.push([bt[0] + Math.cos(t) * 10 * -uy + Math.sin(t) * 3.4 * ux, bt[1] + Math.cos(t) * 10 * ux + Math.sin(t) * 3.4 * uy]);
    }
    return out2;
  })() : circlePts(bt, 10, 20);
  out.push({ path: polyPath(btn), fill: PEARL, stroke: { color: '#3a352b', w: 1.4 }, box: bbox(btn), rim: 1 });
  return out;
}

/** The mouthpiece: a silver cup tapering to its shank. */
function mouthpieceItems(P: HornPose, pr: Proj): Item[] {
  const a = pr.pt(P.mouthpiece.cup);
  const b = pr.pt(P.mouthpiece.shank);
  const r = P.mouthpiece.r;
  const pts = hull([...circlePts(a, r, 16), ...circlePts(b, r * 0.55, 12)]);
  return [{ path: polyPath(pts), fill: NICKEL_FILL, stroke: { color: OUTLINE, w: 1.6 }, box: bbox(pts), rim: 1 }];
}

/** The rotors (bass trombone): drums of the valve, and the thumb triggers. */
function rotorItems(P: HornPose, pr: Proj): Item[] {
  const out: Item[] = [];
  for (const ro of P.rotors) {
    const a = pr.pt(add(ro.c, { x: 0, y: 0, z: -24 }));
    const b = pr.pt(add(ro.c, { x: 0, y: 0, z: 24 }));
    const pts = hull([...circlePts(a, ro.r, 18), ...circlePts(b, ro.r, 18)]);
    out.push({ path: polyPath(pts), fill: CASING, stroke: { color: OUTLINE, w: 1.6 }, box: bbox(pts), rim: 1 });
    const cap = circlePts(pr.pt(add(ro.c, { x: 0, y: 0, z: 26 })), ro.r * 0.62, 16);
    out.push({ path: polyPath(cap), fill: NICKEL_FILL, stroke: { color: OUTLINE, w: 1.1 }, box: bbox(cap) });
  }
  for (const t of P.triggers) {
    const c = pr.pt(t);
    const lever: P2[] = [pr.pt(add(t, { x: -26, y: -6, z: 0 })), c];
    out.push(strokeItem(lever, NICKEL.edge, 7), strokeItem(lever, NICKEL.mid, 4.6));
    const pad = circlePts(c, 6.5, 12);
    out.push({ path: polyPath(pad), fill: PEARL, stroke: { color: OUTLINE, w: 1 }, box: bbox(pad) });
  }
  return out;
}

/** The horn as paint groups, far to near (no player). */
export function hornGroups(P: HornPose, pr: Proj): Group3[] {
  const g: Group3[] = [];
  const mid = (pts: Vec3[]) => pts.reduce((s, p) => add(s, scale(p, 1 / pts.length)), { x: 0, y: 0, z: 0 });
  for (const t of P.tubes) g.push({ key: `t.${t.id}`, depth: pr.depth(mid(t.pts)), items: tubeItems(t, pr) });
  g.push({ key: 'bell', depth: pr.depth(P.H({ x: -P.spec.flare.mm * 0.3, y: 0, z: 0 })) + 4, items: bellItems(P, pr) });
  P.valves.forEach((vv, i) => g.push({ key: `valve${i}`, depth: pr.depth(vv.c) + 2, items: valveItems(vv, P, pr) }));
  if (P.rotors.length) g.push({ key: 'rotors', depth: pr.depth(P.rotors[0].c) + 30, items: rotorItems(P, pr) });
  g.push({ key: 'mouthpiece', depth: pr.depth(P.mouthpiece.cup), items: mouthpieceItems(P, pr) });
  return g;
}

/** The horn and its player for one engine view, far to near. */
export function sceneGroups(P: HornPose, view: ViewId): Group3[] {
  const horn = hornGroups(P, PROJ[view]);
  const player = playerGroups({ player: P.player }, view, true);
  return [...player, ...horn].sort((a, b) => a.depth - b.depth);
}

const HORN_KEYS = /^(t\.|bell|valve|rotors|mouthpiece)/;

/** The horn and its player: the player recedes (charter §6: the subject is the instrument). */
export function BrassScene({ P, view }: { P: HornPose; view: ViewId }) {
  const groups = useMemo(() => sceneGroups(P, view), [P, view]);
  return (
    <Group>
      {groups.map((g) =>
        HORN_KEYS.test(g.key) ? (
          <Group key={g.key}>
            {g.items.map((it, i) => (
              <PaintItem key={i} it={it} />
            ))}
          </Group>
        ) : (
          <Group key={g.key} layer={<Paint opacity={0.62} />}>
            {g.items.map((it, i) => (
              <PaintItem key={i} it={it} />
            ))}
          </Group>
        ),
      )}
    </Group>
  );
}

/** The instrument component a lesson hands the engine, one pose per variant. */
export function makeBrassInstrument(poses: Readonly<Record<VariantId, HornPose>>, fallback: VariantId) {
  return function BrassInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
    return <BrassScene P={poses[variant] ?? poses[fallback]} view={view} />;
  };
}

/* ── labels (OFF the instrument, each with a leader to its part) ── */

type LabelSpec = { id: string; text: string; short?: string; at: Vec3; du: number; dv: number; align?: ArtLabel['align']; tone?: ArtLabel['tone'] };

/** The parts' anchors for labels and taps. */
export function anchors(P: HornPose) {
  const F = P.spec.flare.mm;
  const R = P.spec.bell.mm / 2;
  return {
    bellTop: P.H({ x: -F * 0.12, y: -bellRadius(P.spec, -F * 0.12), z: 0 }),
    bellLeft: P.H({ x: -F * 0.12, y: 0, z: -bellRadius(P.spec, -F * 0.12) }),
    rimTop: P.H({ x: 0, y: -R, z: 0 }),
    rimLeft: P.H({ x: 0, y: 0, z: -R }),
    button: P.valves.length ? P.valves[1].button : null,
    cup: P.mouthpiece.cup,
    lead: P.tubes.find((t) => t.id === 'leadpipe')?.pts[0] ?? null,
    head: add(P.player.head, { x: 0, y: -P.player.headR, z: 0 }),
  };
}

export function brassLabels(P: HornPose, view: ViewId): ArtLabel[] {
  const A = anchors(P);
  const R = P.spec.bell.mm / 2;
  const L: LabelSpec[] = [];
  const side = view === 'side';
  L.push({ id: 'bell', text: 'BELL', at: side ? A.bellTop : A.bellLeft, du: -40, dv: -(R * 0.5 + 120), align: 'center' });
  if (P.valves.length && A.button) L.push({ id: 'valves', text: 'VALVES', at: side ? A.button : P.valves[2].c, du: side ? 10 : 30, dv: side ? -150 : 170, align: 'center' });
  L.push({ id: 'mouthpiece', text: 'MOUTHPIECE', short: 'MOUTHPC', at: A.cup, du: 30, dv: side ? 210 : 200, align: 'center' });
  if (P.slide) {
    const s = P.slide;
    const mid = { x: (s.receiver.x + s.crook.x) / 2 + 120, y: s.legs[1], z: s.z };
    L.push({ id: 'slide', text: 'SLIDE', at: mid, du: 0, dv: side ? 150 : 150, align: 'center' });
    const tun = P.tubes.find((t) => t.id === 'tuning');
    if (tun) L.push({ id: 'tuning', text: 'TUNING SLIDE', short: 'TUNING', at: tun.pts[Math.floor(tun.pts.length / 2)], du: -20, dv: side ? -170 : -150, align: 'center' });
    if (P.rotors.length) L.push({ id: 'valves', text: 'F VALVE LOOPS', short: 'VALVES', at: add(P.rotors[0].c, { x: 0, y: 120, z: 0 }), du: -60, dv: side ? 260 : -230, align: 'center' });
  }
  // From above, a slide instrument's tubes run past the head: the word sits farther out.
  L.push({ id: 'player', text: 'PLAYER', at: A.head, du: -60, dv: P.slide && !side ? -190 : -90, align: 'center', tone: 'muted' });
  return L.map((l) => {
    const [u, v] = PROJ[view].pt(l.at);
    return { id: l.id, text: l.text, short: l.short, u: u + l.du, v: v + l.dv, align: l.align ?? 'left', tone: l.tone, at: { u, v } };
  });
}

/* ── taps ── */
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

/** The part under a view point (u, v), `tol` in mm (base ids; the lesson maps variant twins). */
export function brassHitTest(P: HornPose, view: ViewId, u: number, v: number, tol: number): string | null {
  const pr = PROJ[view];
  const near = (p: Vec3, r: number) => {
    const [a, b] = pr.pt(p);
    return Math.hypot(u - a, v - b) <= r + tol;
  };
  const seg = (a: Vec3, b: Vec3, r: number) => segD(u, v, pr.pt(a), pr.pt(b)) <= r + tol;
  if (near(P.mouthpiece.cup, P.mouthpiece.r + 6) || seg(P.mouthpiece.cup, P.mouthpiece.shank, P.mouthpiece.r)) return 'br.mouthpiece';
  for (const vv of P.valves) if (seg(add(vv.c, scale(P.up, vv.h)), add(vv.c, scale(P.up, -vv.h)), vv.r + 2) || near(vv.button, 12)) return 'br.valves';
  for (const t of P.triggers) if (near(t, 14)) return 'br.thumb';
  for (const ro of P.rotors) if (near(ro.c, ro.r + 6)) return 'br.valves';
  // The bell: inside the projected flare.
  const prof = bellProfile(P.spec, 16);
  const pts: P2[] = [];
  for (const [x, r] of prof) for (let i = 0; i < 12; i++) pts.push(pr.pt(P.H({ x, y: r * Math.cos((i / 12) * 2 * Math.PI), z: r * Math.sin((i / 12) * 2 * Math.PI) })));
  if (inPoly(u, v, hull(pts))) return 'br.bell';
  for (const t of P.tubes) {
    for (let i = 0; i < t.pts.length - 1; i++) {
      if (seg(t.pts[i], t.pts[i + 1], t.r + 3)) return t.part === 'br.bell' ? 'br.bell' : t.part;
    }
  }
  const s = P.player;
  if (P.slide) {
    // In front of the crook along the slide's line: its path to 7th.
    const c = P.slide.crook;
    if (seg(c, add(c, { x: 560, y: 0, z: 0 }), 50)) return 'br.slidePath';
    if (seg(s.shoulderR, s.elbowR, 50) || seg(s.elbowR, s.handR, 45)) return 'br.armR2a';
  } else if (seg(s.elbowR, s.handR, 40) || seg(s.elbowL, s.handL, 40)) return 'br.valveHands';
  if (near(s.head, s.headR)) return 'br.head';
  if (seg(s.pelvis, s.neck, 140) || seg(s.shoulderL, s.shoulderR, 60)) return 'br.player';
  return null;
}

/* ── ORIENT's figure: the lesson's two horns at an angle, every part named ── */

export type PortraitRow = { P: HornPose; title: string; labels: { id: string; text: string; short?: string; at: (P: HornPose) => Vec3; du: number; dv: number; align?: StaticLabel['align']; tone?: StaticLabel['tone'] }[] };

/** Where each horn sits in the figure (screen mm), stacked top to bottom. */
function stackOf(rows: readonly PortraitRow[]) {
  const pr = PROJ.portrait;
  const boxes = rows.map((r) => {
    const pts: P2[] = [];
    for (const t of r.P.tubes) for (const p of t.pts) pts.push(pr.pt(p));
    const R = r.P.spec.bell.mm / 2;
    for (let i = 0; i < 16; i++) pts.push(pr.pt(r.P.H({ x: 0, y: R * Math.cos((i / 16) * 2 * Math.PI), z: R * Math.sin((i / 16) * 2 * Math.PI) })));
    pts.push(pr.pt(r.P.mouthpiece.cup));
    return bbox(pts);
  });
  const W = Math.max(...boxes.map((b) => b.u1 - b.u0));
  const gap = 170;
  let y = 0;
  const offs = boxes.map((b) => {
    const o = { du: -b.u0 + (W - (b.u1 - b.u0)) / 2, dv: y - b.v0 + 90, top: y + 20 };
    y += b.v1 - b.v0 + gap + 90;
    return o;
  });
  return { offs, box: { u0: -90, u1: W + 90, v0: -20, v1: y - gap + 60 } as ViewBox };
}

export function makeBrassPortrait(rows: readonly PortraitRow[], a11y: string): { aspect: number; render: (w: number, h: number) => ReactElement } {
  const { offs, box } = stackOf(rows);
  const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
  function Portrait({ w, h }: { w: number; h: number }) {
    const textScale = useStageTextScale();
    const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h]);
    const groups = useMemo(() => rows.map((r) => hornGroups(r.P, PROJ.portrait).sort((a, b) => a.depth - b.depth)), []);
    const labels: StaticLabel[] = [];
    rows.forEach((r, k) => {
      const o = offs[k];
      const at = (p: Vec3) => {
        const [u, v] = PROJ.portrait.pt(p);
        return { u: u + o.du, v: v + o.dv };
      };
      const mp = at(r.P.mouthpiece.cup);
      void mp;
      labels.push({ id: `t${k}`, text: r.title, u: -60, v: o.top, align: 'left', tone: 'amber' });
      for (const l of r.labels) {
        const a = at(l.at(r.P));
        labels.push({ id: `${k}.${l.id}`, text: l.text, short: l.short, u: a.u + l.du, v: a.v + l.dv, align: l.align ?? 'center', tone: l.tone, at: a });
      }
    });
    return (
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {groups.map((gs, k) => (
              <Group key={k} transform={[{ translateX: offs[k].du }, { translateY: offs[k].dv }]}>
                {gs.map((g) => (
                  <Group key={g.key}>
                    {g.items.map((it, i) => (
                      <PaintItem key={i} it={it} />
                    ))}
                  </Group>
                ))}
              </Group>
            ))}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }
  return { aspect, render: (w, h) => <Portrait w={w} h={h} /> };
}
