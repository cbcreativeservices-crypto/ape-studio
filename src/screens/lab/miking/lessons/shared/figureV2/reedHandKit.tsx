/**
 * FIGURE V2 — THE SAXOPHONE AND WOODWIND HANDS: HOW AN AUTHORED HAND IS PLACED AND PAINTED (owner 2026-11-25, "batches
 * by family"; the reed family's builder). The drawings themselves are the reedHand*.tsx files beside this one — each ONE
 * right hand seen from ONE side, authored in 2-D (hand-placed points in mm drawn as smooth closed curves), as the
 * approved pole and mallet hands. This file only:
 *   • PLACES a drawing on a lesson's posed hand: one turn, one size (0.8–1.15 of real size, the hand's foreshortening)
 *     and the mirror for a left hand, chosen so the drawing's wrist sits on the pose's wrist and its fingertips on the
 *     keys the pose's fingers press (least squares, the wrist counted twice); the forearm stub then turns at the wrist
 *     to come out of the figure's own cuff. Nothing of the pose moves: the wrist, the keys and the cuff are the lesson's.
 *   • PAINTS it in the approved hands' look: one skin light from the upper left (re-lit when mirrored or turned), soft
 *     form lights and shades, a thin soft outline, the nails clear on the backs of the finger ends, few lines — in two
 *     layers, the parts behind the instrument and the parts in front of it.
 */
import { useMemo, type ReactNode } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, smoothClosed, smoothOpen, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';
import { famProj, type FamPlan } from './familyV2';

export type ReedLayer = 'back' | 'front';
/** A soft light or shade (an ellipse in the drawing's frame) on one layer. */
export type ReedSoft = { e: Ellipse; o: number; layer: ReedLayer };
/** A nail: centre, length along the finger, width, the finger's direction there (rad), its layer. */
export type ReedNail = { c: Pt; len: number; w: number; rot: number; layer: ReedLayer };

/** ONE AUTHORED HAND: a RIGHT hand, millimetres, +x right, +y DOWN, the wrist at the origin, the forearm leaving it
 *  along `fore`. */
export type ReedHandArt = {
  name: string;
  /** Closed outlines, each one skin, painted in order; the layer says behind or in front of the instrument. */
  pieces: { poly: Poly; layer: ReedLayer; tension?: number }[];
  /** Short lines (a crease between two fingers, a finger's edge over the hand): strong at the first point, fading. */
  lines: { poly: Poly; layer: ReedLayer; w?: number }[];
  nails: ReedNail[];
  lights: ReedSoft[];
  darks: ReedSoft[];
  /** The fit: the wrist (origin) and the four fingertip pads (index … little); `fore` the forearm's direction. */
  pads: [Pt, Pt, Pt, Pt];
  /** Each finger's reach for the fit (index … little): from K (no move) to T (moves fully with its fingertip), its
   *  width — a finger may be eased a few mm along its own length onto its key, the hand staying one form. */
  reachOf: { K: Pt; T: Pt; w: number }[];
  fore: Pt;
  /** The middle of the drawing (where its skin light is centred) and its reach (mm). */
  centre: Pt;
  reach: number;
  /** (the review sheet only) a plain tube where the drawing expects one: its axis x, radius (mm), drawn between the layers. */
  tube?: { x: number; r: number };
};

/* ── the placement (pure) ── */

export type ReedPlace = {
  /** Page = R·(m·x, y)·k + t: the turn (rad), size, mirror. */
  rot: number;
  /** The size (the mean of the two below: line widths). */
  k: number;
  /** The size along the hand (the fingers' way) and across it; absent: `k` both ways. */
  kx?: number;
  ky?: number;
  mirror: boolean;
  t: Pt;
  /** The wrist's own turn of the forearm stub (rad, drawing frame, before the mirror). */
  bend: number;
  /** The cuff's rim: the skin is kept only on the hand's side of this line. */
  cuff: { c: Pt; out: Pt } | null;
  /** How far the drawing's pads land from the pose's (mm, mean) before the fingers are eased onto the keys. */
  miss: number;
  /** The ease (drawing frame): the wrist's and each finger's small move onto the pose's own wrist and keys. */
  ease?: { wrist: Pt; fingers: { K: Pt; T: Pt; w: number; d: Pt }[] } | null;
};

const smooth = (t: number) => t * t * (3 - 2 * t);
/** The most a wrist or a fingertip is eased (mm, the drawing's frame). */
export const EASE_MAX = 24;
/** A drawing point eased: near the wrist it follows the wrist's move, along a finger its fingertip's (fading to none
 *  at the finger's root and away from its axis). */
function eased(pl: ReedPlace, q: Pt): Pt {
  const e = pl.ease;
  if (!e) return q;
  const ww = Math.max(0, Math.min(1, (46 - q.u) / 46));
  let du = e.wrist.u * smooth(ww);
  let dv = e.wrist.v * smooth(ww);
  let sum = 0;
  const ws: number[] = [];
  for (const f of e.fingers) {
    const a = P(f.T.u - f.K.u, f.T.v - f.K.v);
    const L2 = a.u * a.u + a.v * a.v || 1;
    const t0 = ((q.u - f.K.u) * a.u + (q.v - f.K.v) * a.v) / L2;
    const t = Math.max(0, Math.min(1, t0));
    // (the distance from the finger's own line, however far along it: a curl or an end past T moves with it whole)
    const px = f.K.u + a.u * t0 - q.u;
    const py = f.K.v + a.v * t0 - q.v;
    const s = f.w * 0.45;
    const w = smooth(t) * Math.exp(-(px * px + py * py) / (2 * s * s));
    ws.push(w);
    sum += w;
  }
  const n = Math.max(1, sum);
  e.fingers.forEach((f, i) => {
    du += (f.d.u * ws[i]) / n;
    dv += (f.d.v * ws[i]) / n;
  });
  return P(q.u + du, q.v + dv);
}

/** The page point of a drawing point under a placement (the ease and the wrist bend included). */
export function placePt(pl: ReedPlace, q0: Pt): Pt {
  const q = eased(pl, q0);
  let x = q.u;
  let y = q.v;
  // the forearm stub (behind the wrist) turns by `bend`, fading out over 30 mm past it
  const f = Math.max(0, Math.min(1, (14 - x) / 30));
  if (f > 0 && pl.bend !== 0) {
    // (turned about the wrist where the ease put it: the wrist itself never moves)
    const pv = pl.ease ? pl.ease.wrist : P(0, 0);
    const a = pl.bend * f;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const nx = pv.u + (x - pv.u) * c - (y - pv.v) * s;
    const ny = pv.v + (x - pv.u) * s + (y - pv.v) * c;
    x = nx;
    y = ny;
  }
  const m = pl.mirror ? -1 : 1;
  const c = Math.cos(pl.rot);
  const s = Math.sin(pl.rot);
  const u = x * m * (pl.kx ?? pl.k);
  const v = y * (pl.ky ?? pl.k);
  return P(pl.t.u + u * c - v * s, pl.t.v + u * s + v * c);
}

/** Fit a drawing to a posed hand: page wrist `o`, page fingertip pads, the cuff (centre, direction out of the sleeve). */
/** Fit a drawing to a posed hand: page wrist `o`, page fingertip pads, the cuff (centre, direction out of the sleeve);
 *  the size range 0.72–1.15, then the wrist and each finger eased (≤ EASE_MAX mm) onto the pose's own. */
export function fitReedHand(art: ReedHandArt, o: Pt, pads: Pt[], mirror: boolean, cuff: { c: Pt; out: Pt } | null): ReedPlace {
  const m = mirror ? -1 : 1;
  const src: Pt[] = [P(0, 0), P(0, 0), ...art.pads.slice(0, 3).map((p) => P(p.u * m, p.v))];
  const dst: Pt[] = [o, o, ...pads.slice(0, 3)];
  const n = src.length;
  const ms = P(src.reduce((a, p) => a + p.u, 0) / n, src.reduce((a, p) => a + p.v, 0) / n);
  const md = P(dst.reduce((a, p) => a + p.u, 0) / n, dst.reduce((a, p) => a + p.v, 0) / n);
  let sxx = 0;
  let sxy = 0;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const a = P(src[i].u - ms.u, src[i].v - ms.v);
    const b = P(dst[i].u - md.u, dst[i].v - md.v);
    sxx += a.u * b.u + a.v * b.v;
    sxy += a.u * b.v - a.v * b.u;
    ss += a.u * a.u + a.v * a.v;
  }
  const rot = Math.atan2(sxy, sxx);
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  // the size along the hand (x, the fingers' way) and across it (y), each fitted on its own: a hand pointing toward or
  // away from us is shortened along its length (to 0.55), never stretched past a big adult hand (1.15); across, 0.72–1.15
  let ax = 0;
  let bx = 0;
  let ay = 0;
  let by = 0;
  for (let i = 0; i < n; i++) {
    const a = P(src[i].u - ms.u, src[i].v - ms.v);
    const d = P(dst[i].u - md.u, dst[i].v - md.v);
    const b = P(d.u * c + d.v * s, -d.u * s + d.v * c);
    ax += a.u * b.u;
    bx += a.u * a.u;
    ay += a.v * b.v;
    by += a.v * a.v;
  }
  const kAll = Math.hypot(sxx, sxy) / (ss || 1);
  const kx = Math.max(0.55, Math.min(1.15, bx > 1 ? ax / bx : kAll));
  const ky = Math.max(0.72, Math.min(1.15, by > 1 ? ay / by : kAll));
  const k = Math.sqrt(kx * ky);
  const t = P(md.u - (kx * ms.u * c - ky * ms.v * s), md.v - (kx * ms.u * s + ky * ms.v * c));
  // the forearm stub: from the drawing's own forearm direction to the cuff's (out of the sleeve toward the hand)
  let bend = 0;
  if (cuff) {
    const fd = P(art.fore.u * m, art.fore.v);
    const page = P(fd.u * c - fd.v * s, fd.u * s + fd.v * c);
    const want = P(-cuff.out.u, -cuff.out.v);
    let d = Math.atan2(want.v, want.u) - Math.atan2(page.v, page.u);
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    // (in the drawing's frame a mirrored turn runs the other way)
    bend = Math.max(-0.9, Math.min(0.9, d * m));
  }
  const pl: ReedPlace = { rot, k, kx, ky, mirror, t, bend: 0, cuff, miss: 0 };
  const miss = art.pads.slice(0, 3).reduce((a, p, i) => a + Math.hypot(placePt(pl, p).u - pads[i].u, placePt(pl, p).v - pads[i].v), 0) / 3;
  // the ease: a page move carried back into the drawing's frame (un-turned, un-sized, un-mirrored), at most 22 mm
  const back = (d: Pt): Pt => {
    const u = (d.u * c + d.v * s) / kx;
    const v = (-d.u * s + d.v * c) / ky;
    const r = Math.hypot(u, v);
    const f = r > EASE_MAX ? EASE_MAX / r : 1;
    return P(u * m * f, v * f);
  };
  const w0 = placePt(pl, P(0, 0));
  const ease = {
    wrist: back(P(o.u - w0.u, o.v - w0.v)),
    fingers: art.reachOf.map((f, i) => {
      const q = placePt(pl, art.pads[i]);
      return { ...f, d: pads[i] ? back(P(pads[i].u - q.u, pads[i].v - q.v)) : P(0, 0) };
    }),
  };
  return { ...pl, bend, miss, ease };
}

/** How far a placed drawing's fingertips (index … ring) land from the pose's keys, after the ease (mm, the largest). */
export function reedPadMiss(art: ReedHandArt, pl: ReedPlace, pads: Pt[]): number {
  return Math.max(...art.pads.slice(0, 3).map((p, i) => Math.hypot(placePt(pl, p).u - pads[i].u, placePt(pl, p).v - pads[i].v)));
}

/* ── the paint ── */

const polyOf = (q: Poly, pl: ReedPlace): Poly => q.map((p) => placePt(pl, p));

function nailPoly(nl: ReedNail): Poly {
  const out: Poly = [];
  const co = Math.cos(nl.rot);
  const si = Math.sin(nl.rot);
  for (let j = 0; j < 22; j++) {
    const t = (Math.PI * 2 * j) / 22;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    // (a nail: squarer at its free edge (+), rounded at its root)
    const a = (nl.len / 2) * Math.sign(ct) * Math.pow(Math.abs(ct), ct > 0 ? 0.55 : 0.85);
    const b = (nl.w / 2) * Math.sign(st) * Math.pow(Math.abs(st), 0.7);
    out.push(P(nl.c.u + a * co - b * si, nl.c.v + a * si + b * co));
  }
  return out;
}

function ellPoly(e: Ellipse, n = 20): Poly {
  const out: Poly = [];
  const co = Math.cos(e.rot);
  const si = Math.sin(e.rot);
  for (let j = 0; j < n; j++) {
    const t = (Math.PI * 2 * j) / n;
    const a = e.rx * Math.cos(t);
    const b = e.ry * Math.sin(t);
    out.push(P(e.c.u + a * co - b * si, e.c.v + a * si + b * co));
  }
  return out;
}

/** The light's direction carried into the drawing's frame (so a turned or mirrored hand is re-lit from the page's upper left). */
function lightIn(pl: ReedPlace): Pt {
  const c = Math.cos(-pl.rot);
  const s = Math.sin(-pl.rot);
  const u = LIGHT.u * c - LIGHT.v * s;
  const v = LIGHT.u * s + LIGHT.v * c;
  return P(pl.mirror ? -u : u, v);
}

type Built = {
  pieces: { path: SkPath; layer: ReedLayer }[];
  lines: { path: SkPath; a: Pt; b: Pt; layer: ReedLayer; w: number }[];
  nails: { path: SkPath; cuticle: SkPath; layer: ReedLayer }[];
  lights: { path: SkPath; o: number; layer: ReedLayer }[];
  darks: { path: SkPath; o: number; layer: ReedLayer }[];
  clip: SkPath | null;
  fillA: Pt;
  fillB: Pt;
  rimShift: Pt;
};

function build(art: ReedHandArt, pl: ReedPlace): Built {
  const Ld = lightIn(pl);
  // a soft light moves toward the light round its form, a shade away from it (re-lit, never just flipped)
  const relit = (e: Ellipse, sign: number): Ellipse => {
    const r = Math.min(e.rx, e.ry) * 0.35 * sign;
    return { ...e, c: P(e.c.u + r * (Ld.u - LIGHT.u), e.c.v + r * (Ld.v - LIGHT.v)) };
  };
  const pageL = placePt(pl, P(art.centre.u + Ld.u * art.reach, art.centre.v + Ld.v * art.reach));
  const pageD = placePt(pl, P(art.centre.u - Ld.u * art.reach, art.centre.v - Ld.v * art.reach));
  let clip: SkPath | null = null;
  if (pl.cuff) {
    const { c, out } = pl.cuff;
    const side = P(-out.v, out.u);
    const F = 2000;
    const a = P(c.u - out.u * 1.2, c.v - out.v * 1.2);
    clip = Skia.Path.Make();
    const q = [P(a.u + side.u * F, a.v + side.v * F), P(a.u + side.u * F + out.u * F, a.v + side.v * F + out.v * F), P(a.u - side.u * F + out.u * F, a.v - side.v * F + out.v * F), P(a.u - side.u * F, a.v - side.v * F)];
    q.forEach((p, i) => (i ? clip!.lineTo(p.u, p.v) : clip!.moveTo(p.u, p.v)));
    clip.close();
  }
  return {
    pieces: art.pieces.map((p) => ({ path: smoothClosed(polyOf(p.poly, pl), p.tension ?? 0.5), layer: p.layer })),
    lines: art.lines.map((l) => {
      const q = polyOf(l.poly, pl);
      return { path: smoothOpen(q), a: q[0], b: q[q.length - 1], layer: l.layer, w: (l.w ?? 0.8) * pl.k };
    }),
    nails: art.nails.map((nl) => {
      const q = polyOf(nailPoly(nl), pl);
      // the cuticle: the nail's root edge, a short soft arc
      const co = Math.cos(nl.rot);
      const si = Math.sin(nl.rot);
      const root = [-0.32, -0.5, -0.32].map((f, i) => {
        const b = (i - 1) * nl.w * 0.42;
        const a = nl.len * f - Math.abs(i - 1) * 0 ;
        return P(nl.c.u + a * co - b * si, nl.c.v + a * si + b * co);
      });
      return { path: smoothClosed(q, 0.4), cuticle: smoothOpen(polyOf(root, pl)), layer: nl.layer };
    }),
    lights: art.lights.map((s) => ({ path: smoothClosed(polyOf(ellPoly(relit(s.e, 1)), pl)), o: s.o, layer: s.layer })),
    darks: art.darks.map((s) => ({ path: smoothClosed(polyOf(ellPoly(relit(s.e, -1)), pl)), o: s.o, layer: s.layer })),
    clip,
    fillA: pageL,
    fillB: pageD,
    rimShift: P(-(LIGHT.u) * 1.6 * pl.k, -(LIGHT.v) * 1.6 * pl.k),
  };
}

function LayerPaint({ B, layer }: { B: Built; layer: ReedLayer }) {
  const { HAND, MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const pieces = B.pieces.filter((p) => p.layer === layer);
  if (!pieces.length) return null;
  const body: ReactNode[] = [];
  pieces.forEach((pc, i) => {
    // (the lit edge of each piece: the piece less itself moved away from the light)
    const moved = pc.path.copy();
    moved.offset(B.rimShift.u, B.rimShift.v);
    const rim = Skia.Path.MakeFromOp(pc.path, moved, PathOp.Difference) ?? pc.path;
    body.push(
      <Group key={`p${i}`}>
        <Path path={pc.path}>
          <LinearGradient start={vec(B.fillA.u, B.fillA.v)} end={vec(B.fillB.u, B.fillB.v)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
        </Path>
        <Group clip={pc.path}>
          {B.lights.filter((s) => s.layer === layer).map((s, j) => (
            <Path key={`l${j}`} path={s.path} color={SKIN.rim} opacity={s.o}>
              <Blur mm={1.6} />
            </Path>
          ))}
          {B.darks.filter((s) => s.layer === layer).map((s, j) => (
            <Path key={`d${j}`} path={s.path} color={SKIN.deep} opacity={s.o}>
              <Blur mm={1.5} />
            </Path>
          ))}
          <Path path={rim} color={SKIN.rim} opacity={0.24}>
            <Blur mm={1} />
          </Path>
          {B.nails.filter((n) => n.layer === layer).map((n, j) => (
            <Group key={`n${j}`}>
              <Path path={n.path} color={NAIL.fill} opacity={0.62}>
                <Blur mm={0.3} />
              </Path>
              <Path path={n.path} style="stroke" strokeWidth={0.55} color={NAIL.edge} opacity={0.55}>
                <Blur mm={0.2} />
              </Path>
              <Path path={n.cuticle} style="stroke" strokeWidth={0.6} strokeCap="round" color={SKIN.edge} opacity={0.45}>
                <Blur mm={0.25} />
              </Path>
            </Group>
          ))}
          {B.lines.filter((l) => l.layer === layer).map((l, j) => (
            <Path key={`c${j}`} path={l.path} style="stroke" strokeWidth={l.w} strokeCap="round">
              <LinearGradient start={vec(l.a.u, l.a.v)} end={vec(l.b.u, l.b.v)} colors={[SKIN.edge, `${SKIN.edge}80`, `${SKIN.edge}00`]} positions={[0, 0.5, 1]} />
              <Blur mm={0.25} />
            </Path>
          ))}
        </Group>
        <Path path={pc.path} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
      </Group>,
    );
  });
  return B.clip ? <Group clip={B.clip}>{body}</Group> : <Group>{body}</Group>;
}

/** One authored hand, one layer, on a placement (inside a figure: the look given round it, or `who`). */
export function ReedHand({ art, pl, layer, who }: { art: ReedHandArt; pl: ReedPlace; layer: ReedLayer; who?: CastMember }) {
  const B = useMemo(() => build(art, pl), [art, pl]);
  const paint = <LayerPaint B={B} layer={layer} />;
  return who ? <FigureLook look={who.look}>{paint}</FigureLook> : paint;
}

/** A placement for the drawing ALONE (the review sheet): the wrist at (x, y) pt, `s` pt per mm, unturned. */
export function alonePlace(x: number, y: number, s: number, mirror = false): ReedPlace {
  return { rot: 0, k: s, mirror, t: P(x, y), bend: 0, cuff: null, miss: 0 };
}

/* ── a lesson's posed hands → the drawings (pure) ── */

type V3 = { x: number; y: number; z: number };
/** What the placement reads of a posed hand: its frame (the wrist, the back of the hand's normal) and its fingertips. */
export type ReedPose = { frame: { o: V3; z: V3 }; fingers: { joints: V3[] }[] };
export type ReedPlaced = { side: 'L' | 'R'; art: ReedHandArt; pl: ReedPlace; backToCam: number };

/**
 * Which drawing a posed hand takes and where it sits: the back of the hand toward us → the BACK drawing; the palm toward
 * us → the PALM drawing; a left hand is the right hand's mirror image, re-lit. `proj` the view's projection, `cam` the
 * direction toward the viewer, `cuffs` the figure's own cuff openings.
 */
export function reedHandsOf(
  arts: { back: ReedHandArt; palm: ReedHandArt },
  hands: { L: ReedPose; R: ReedPose },
  proj: (p: V3) => { u: number; v: number },
  cam: V3,
  cuffs: Partial<Record<'L' | 'R', { c: Pt; out: Pt }>>,
): ReedPlaced[] {
  return (['L', 'R'] as const).map((side) => {
    const sk = hands[side];
    const z = sk.frame.z;
    const backToCam = z.x * cam.x + z.y * cam.y + z.z * cam.z;
    const art = backToCam >= 0 ? arts.back : arts.palm;
    const o = proj(sk.frame.o);
    const pads = sk.fingers.map((f) => proj(f.joints[f.joints.length - 1]));
    const pl = fitReedHand(art, P(o.u, o.v), pads.map((q) => P(q.u, q.v)), side === 'L', cuffs[side] ?? null);
    return { side, art, pl, backToCam };
  });
}

/** The placements for a family figure's plan: its view's projection, its own cuffs. */
export function reedHandsForPlan(fp: FamPlan, arts: { back: ReedHandArt; palm: ReedHandArt }, hands: { L: ReedPose; R: ReedPose }): ReedPlaced[] {
  const view = fp.in.view;
  const cuffs: Partial<Record<'L' | 'R', { c: Pt; out: Pt }>> = {};
  for (const a of fp.arms) cuffs[a.side] = { c: P(a.arm.opening.e.c.u, a.arm.opening.e.c.v), out: P(a.arm.opening.out.u, a.arm.opening.out.v) };
  return reedHandsOf(arts, hands, famProj(view), view === 'top' ? { x: 0, y: -1, z: 0 } : { x: 0, y: 0, z: 1 }, cuffs);
}

/** Every placed hand's one layer (inside the figure's look). */
export function ReedHandsLayer({ placed, layer, who }: { placed: ReedPlaced[]; layer: ReedLayer; who: CastMember }) {
  return (
    <FigureLook look={who.look}>
      {placed.map((h) => (
        <ReedHand key={h.side} art={h.art} pl={h.pl} layer={layer} />
      ))}
    </FigureLook>
  );
}

/* ── helpers the drawings share ── */

export const pts = (xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => P(x, y));
export const E = (x: number, y: number, rx: number, ry: number, rot = 0): Ellipse => ({ c: P(x, y), rx, ry, rot });
