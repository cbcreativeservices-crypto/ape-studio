/**
 * MALLET-BAR FAMILY — the look (charter §2 layer 3) of the four mallet
 * keyboards, drawn ONLY from the layout (malletSpec.layoutOf) and the model
 * geometry (malletModel.malletGeom), in MILLIMETRES of the view's plane:
 *
 *   side  the FRONT ELEVATION as the audience sees it (u = x: the low end on
 *         the right; v = y). Each bar is seen END-ON (its length runs toward
 *         the audience), so a row reads as a strip of bar ends: the far row
 *         (the accidentals) is nearer the audience and 15 mm higher. Under
 *         them hang the resonators — the organ-pipe silhouette that tells a
 *         mallet keyboard at a glance — long at the low end, short at the
 *         high end (their lengths DERIVED: a quarter wavelength).
 *   top   the PLAN (u = x, v = z: the player at the top, the audience at the
 *         bottom): the two rows of graduated bars, the cords through their
 *         still points with the posts between bars, the rails of the
 *         trapezoid frame, and the player reaching in with two mallets.
 *
 * ART (the Kick standard): gradients for form, light from the upper left
 * (a highlight strip on each bar's upper-left edges, a shade strip on the
 * lower-right ones; cylinders lit on their left), rim highlights, soft
 * contact shadows (BlurMask), a strict stroke hierarchy. Every path is built
 * ONCE per lesson × variant × view and cached (`built`) — nothing moves (D8).
 * Materials are cosmetic (no maker's colour is claimed): satin aluminium
 * vibraphone bars over anodised tubes, rosewood marimba and xylophone bars
 * over dark and tan tubes, bright steel glockenspiel bars.
 */
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ReactElement } from 'react';
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { CASE, NODE_FRAC, type Bar, type Layout, type MalletInst, type Tube } from './malletSpec.ts';
import { frameEnds, malletGeom, type MalletFamily, type MalletGeom } from './malletModel.ts';
import { FigureHead, headAbove, headFront } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';

/** The player's head — the figure's own skin silhouette (head fix 2026-10-08:
 *  a head ON A BODY is PlayerFigure's FigureHead, never a circle): face-on
 *  in the side view (the neck down into the shoulders 140 mm below), from
 *  above in the plan (the nose toward the bars, +v). Built once. */
const playerHeads: Partial<Record<'front' | 'above', ReturnType<typeof headFront>['fill']>> = {};
function playerHeadFill(view: 'front' | 'above') {
  return (playerHeads[view] ??= view === 'front' ? headFront(pt(0, 0), 100, 140).fill : headAbove(pt(0, 0), 98).fill);
}

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
function rect(p: SkPath, x0: number, y0: number, x1: number, y1: number) {
  p.addRect(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)));
  return p;
}
function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function seg(p: SkPath, a: number, b: number, c: number, d: number) {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
function oval(p: SkPath, cx: number, cy: number, rx: number, ry: number) {
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}

/* ── palette: house tokens + material ramps (light from the upper left) ── */
export const INK = '#08080a';
const AMBER = '#ffc64d';
type Look = { bar: [string, string, string]; barHi: string; barLo: string; grain: string | null; tube: [string, string, string]; tubeHi: string; frame: [string, string, string]; mallet: { head: [string, string]; shaft: string; yarn: boolean } };
export const LOOK: Record<MalletInst, Look> = {
  vibe: { bar: ['#f2f4f8', '#c5cad3', '#7f8590'], barHi: '#ffffff', barLo: '#4d525c', grain: null, tube: ['#f6e6bf', '#c9a764', '#6f5424'], tubeHi: '#fff6dc', frame: ['#3b3e46', '#24262c', '#121317'], mallet: { head: ['#6f8fd0', '#2c3f6e'], shaft: '#d9c08a', yarn: true } },
  marimba: { bar: ['#c0643f', '#843a22', '#4a1b0e'], barHi: '#f0a27a', barLo: '#2a0e06', grain: '#2d0f07', tube: ['#5c616b', '#2a2d34', '#101115'], tubeHi: '#a7adb8', frame: ['#4a3426', '#2d1f16', '#170f0a'], mallet: { head: ['#e8e3d6', '#8b8577'], shaft: '#d9c08a', yarn: true } },
  xylo: { bar: ['#cf7449', '#93462a', '#561f10'], barHi: '#f7b38c', barLo: '#2e1006', grain: '#33130a', tube: ['#efdcb9', '#bc9d69', '#6e5532'], tubeHi: '#fff4de', frame: ['#c7a978', '#8d7148', '#4f3c22'], mallet: { head: ['#ff8a6a', '#a3341c'], shaft: '#e3cf9c', yarn: false } },
  glock: { bar: ['#ffffff', '#d5dae3', '#7d8591'], barHi: '#ffffff', barLo: '#3f444e', grain: null, tube: ['#f1f3f7', '#aab1bc', '#5a606b'], tubeHi: '#ffffff', frame: ['#3b3e46', '#24262c', '#121317'], mallet: { head: ['#fff1c2', '#b8902f'], shaft: '#e3cf9c', yarn: false } },
};
const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57'];
const RUBBER = '#16171b';
const FLOOR = ['#202128', '#141519', '#0b0b0e'];
const FELT = ['#ece4d0', '#c9bea4', '#8f846c'];
const WOOD_CASE = ['#a06a3a', '#6e4421', '#3b2410'];
const CASE_FELT = '#3a2a4a';
const PLAYER = ['#5a6e96', '#3f5276', '#26324a'];

/* ── the side view (front elevation from the audience) ── */
type Cyl = { body: SkPath; hi: SkPath; lo: SkPath; rim: SkPath; cap: SkPath };
function cylinders(tubes: readonly Tube[]): Cyl {
  const c: Cyl = { body: make(), hi: make(), lo: make(), rim: make(), cap: make() };
  for (const t of tubes) {
    const r = t.d / 2;
    if (t.kind === 'helmholtz') {
      // A wide box (seen from the front: its width across x).
      rrect(c.body, t.x - r, t.yTop, t.x + r, t.yBot, 6);
      rect(c.hi, t.x - r + 2, t.yTop + 4, t.x - r + r * 0.45, t.yBot - 6);
      rect(c.lo, t.x + r * 0.55, t.yTop + 4, t.x + r - 2, t.yBot - 6);
      rect(c.cap, t.x - r, t.yBot - 10, t.x + r, t.yBot);
    } else {
      rrect(c.body, t.x - r, t.yTop, t.x + r, t.yBot, Math.min(r * 0.5, 6));
      rect(c.hi, t.x - r * 0.62, t.yTop + 3, t.x - r * 0.22, t.yBot - 3);
      rect(c.lo, t.x + r * 0.45, t.yTop + 3, t.x + r - 1, t.yBot - 3);
      rect(c.cap, t.x - r, t.yBot - Math.min(8, (t.yBot - t.yTop) * 0.3), t.x + r, t.yBot);
    }
    seg(c.rim, t.x - r, t.yTop + 1, t.x + r, t.yTop + 1);
  }
  return c;
}
type BarFaces = { body: SkPath; hi: SkPath; lo: SkPath; grain: SkPath };
function barEnds(bars: readonly Bar[]): BarFaces {
  const f: BarFaces = { body: make(), hi: make(), lo: make(), grain: make() };
  for (const b of bars) {
    const x0 = b.x - b.w / 2;
    const x1 = b.x + b.w / 2;
    rrect(f.body, x0, b.yTop, x1, b.yTop + b.t, Math.min(2.5, b.t * 0.25));
    rect(f.hi, x0 + 1, b.yTop + 0.6, x1 - 1, b.yTop + Math.max(1.6, b.t * 0.18));
    rect(f.hi, x0 + 0.6, b.yTop + 1, x0 + Math.max(1.6, b.w * 0.06), b.yTop + b.t - 1);
    rect(f.lo, x0 + 1, b.yTop + b.t - Math.max(1.4, b.t * 0.16), x1 - 1, b.yTop + b.t - 0.4);
    // End grain: two short arcs on a wooden bar's end.
    oval(f.grain, b.x + b.w * 0.12, b.yTop + b.t * 0.55, b.w * 0.18, b.t * 0.22);
  }
  return f;
}

type SideBuilt = {
  kind: 'side';
  floorBand: SkPath;
  shadow: SkPath;
  tubesBack: Cyl;
  tubesFront: Cyl;
  nat: BarFaces;
  acc: BarFaces;
  rail: SkPath;
  posts: SkPath;
  ends: SkPath;
  endsHi: SkPath;
  legs: SkPath;
  stretcher: SkPath;
  wheels: { x: number; y: number }[];
  damper: SkPath | null;
  pedal: SkPath | null;
  pedalRod: SkPath | null;
  shafts: SkPath | null;
  fanDiscs: SkPath | null;
  motor: SkPath | null;
  belt: SkPath | null;
  gas: SkPath | null;
  caseBody: SkPath | null;
  caseRim: SkPath | null;
  lid: SkPath | null;
  lidRail: SkPath | null;
  table: SkPath | null;
  tableLegs: SkPath | null;
  player: { head: { x: number; y: number }; body: SkPath; arms: SkPath };
  mallets: { shafts: SkPath; heads: { x: number; y: number }[] };
  yFloor: number;
  barTop: number;
};

function buildSide(G: MalletGeom, v: VariantId): SideBuilt {
  const L = G.layouts[v];
  const row = L.row;
  const yF = G.floor[v];
  const tNat = Math.max(...L.naturals.map((b) => b.t));
  const floorBand = rect(make(), L.xHigh - 600, yF, L.xLow + 600, yF + 60);
  const shadow = oval(make(), (L.xLow + L.xHigh) / 2, yF - 4, (L.xLow - L.xHigh) / 2 + 60, 26);
  const tubesBack = cylinders(L.tubes.filter((t) => t.z < 0));
  const tubesFront = cylinders(L.tubes.filter((t) => t.z > 0));
  const nat = barEnds(L.naturals);
  const acc = barEnds(L.accidentals);
  // The rail under the bars (the near one is hidden: the far rail shows), and
  // the posts between the far row's bars.
  const railY = L.yNat + tNat + 4;
  const rail = row.stand === 'frame' ? rect(make(), L.xHigh + 40, railY, L.xLow - 40, railY + 16) : make();
  const posts = make();
  if (row.stand === 'frame') {
    for (let i = 0; i < L.accidentals.length - 1; i++) {
      const a = L.accidentals[i];
      const b = L.accidentals[i + 1];
      const x = (a.x - a.w / 2 + b.x + b.w / 2) / 2;
      if (Math.abs(a.x - b.x) < (a.w + b.w) * 0.75) seg(posts, x, railY, x, a.yTop + a.t * 0.5);
    }
  }
  const ends = make();
  const endsHi = make();
  const legs = make();
  const stretcher = make();
  const wheels: { x: number; y: number }[] = [];
  let gas: SkPath | null = null;
  if (row.stand === 'frame') {
    const fr = frameEnds(L, yF);
    for (const s of [fr.low, fr.high]) {
      if (s.kind !== 'box') continue;
      // The end board (to 45 % of the way down), a leg below it, a caster.
      const x0 = s.min.x;
      const x1 = s.max.x;
      const yb = s.min.y + (yF - s.min.y) * 0.42;
      rrect(ends, x0, s.min.y, x1, yb, 8);
      rect(endsHi, x0 + 4, s.min.y + 6, x0 + 12, yb - 8);
      const xc = (x0 + x1) / 2;
      rrect(legs, xc - 14, yb - 4, xc + 14, yF - 62, 5);
      rrect(legs, xc - 30, yF - 70, xc + 30, yF - 52, 4); // the caster's fork plate
      wheels.push({ x: xc, y: yF - 30 });
    }
    if (fr.stretcher.kind === 'box') rrect(stretcher, fr.stretcher.min.x, fr.stretcher.min.y, fr.stretcher.max.x, fr.stretcher.max.y, 8);
    if (row.extras.gasSpring) {
      gas = make();
      for (const s of [fr.low, fr.high]) {
        if (s.kind !== 'box') continue;
        const xc = (s.min.x + s.max.x) / 2;
        const yb = s.min.y + (yF - s.min.y) * 0.42;
        rrect(gas, xc - 20, yb + 30, xc + 20, yb + 30 + (yF - yb) * 0.42, 9);
      }
    }
  }
  const ex = G.extras[v];
  let damper: SkPath | null = null;
  let pedal: SkPath | null = null;
  let pedalRod: SkPath | null = null;
  if (ex.damper && ex.damper.kind === 'box') {
    damper = rrect(make(), ex.damper.min.x, ex.damper.min.y, ex.damper.max.x, ex.damper.max.y, 6);
  }
  if (ex.pedal && ex.pedal.kind === 'box') {
    pedal = make();
    rrect(pedal, ex.pedal.min.x, yF - 46, ex.pedal.max.x, yF - 22, 6);
    rrect(pedal, ex.pedal.min.x + 40, yF - 22, ex.pedal.max.x - 40, yF - 4, 4);
    pedalRod = seg(make(), 0, yF - 46, 0, (ex.damper && ex.damper.kind === 'box' ? ex.damper.max.y : railY) + 2);
  }
  let shafts: SkPath | null = null;
  let fanDiscs: SkPath | null = null;
  let motor: SkPath | null = null;
  let belt: SkPath | null = null;
  if (row.extras.fans && L.tubes.length) {
    shafts = make();
    fanDiscs = make();
    const yS = L.tubes[0].yTop + 9;
    seg(shafts, L.xHigh + 60, yS, L.xLow - 160, yS);
    for (const t of L.tubes) oval(fanDiscs, t.x, yS, t.d * 0.44, t.d * 0.13);
  }
  if (ex.motor && ex.motor.kind === 'box') {
    motor = make();
    rrect(motor, ex.motor.min.x, ex.motor.min.y, ex.motor.max.x, ex.motor.max.y, 10);
    belt = make();
    const yS = L.tubes[0].yTop + 9;
    const xp = (ex.motor.min.x + ex.motor.max.x) / 2;
    seg(belt, xp - 26, ex.motor.min.y + 20, L.xLow - 172, yS - 6);
    seg(belt, xp + 26, ex.motor.min.y + 20, L.xLow - 148, yS + 6);
  }
  let caseBody: SkPath | null = null;
  let caseRim: SkPath | null = null;
  let lid: SkPath | null = null;
  let lidRail: SkPath | null = null;
  let table: SkPath | null = null;
  let tableLegs: SkPath | null = null;
  if (ex.caseBase && ex.caseBase.kind === 'box' && ex.lid && ex.lid.kind === 'box' && ex.table && ex.table.kind === 'box') {
    caseBody = rrect(make(), ex.caseBase.min.x, ex.caseBase.min.y, ex.caseBase.max.x, ex.caseBase.max.y, 6);
    caseRim = rect(make(), ex.caseBase.min.x + 6, ex.caseBase.min.y, ex.caseBase.max.x - 6, ex.caseBase.min.y + 6);
    lid = rrect(make(), ex.lid.min.x, ex.lid.min.y, ex.lid.max.x, ex.lid.max.y, 8);
    lidRail = rect(make(), ex.lid.min.x + 30, ex.lid.min.y + 30, ex.lid.max.x - 30, ex.lid.max.y - 30);
    table = rrect(make(), ex.table.min.x, ex.table.min.y, ex.table.max.x, ex.table.max.y, 5);
    tableLegs = make();
    for (const x of [ex.table.min.x + 40, ex.table.max.x - 80]) rect(tableLegs, x, ex.table.max.y, x + 40, yF);
  }
  // The player BEHIND the keyboard (faint: we look through to them), and
  // two mallets: one striking, one raised.
  const yHead = yF - 1620;
  const body = make();
  rrect(body, -230, yHead + 120, 230, L.yNat + 40, 90);
  const arms = make();
  arms.moveTo(-200, yHead + 170);
  arms.quadTo(-300, L.yNat - 330, -240, L.yNat - 230);
  arms.moveTo(200, yHead + 170);
  arms.quadTo(320, L.yNat - 360, 260, L.yNat - 300);
  const midA = L.naturals[Math.floor(L.naturals.length * 0.62)];
  const midB = L.accidentals[Math.floor(L.accidentals.length * 0.35)];
  const headR = row.inst === 'glock' || row.inst === 'xylo' ? 14 : 19;
  const shaftsM = make();
  const hA = { x: midA.x, y: midA.yTop - headR };
  const hB = { x: midB.x, y: L.yNat - Math.min(row.malletH.mm - 40, 300) };
  seg(shaftsM, -240, L.yNat - 230, hA.x, hA.y);
  seg(shaftsM, 260, L.yNat - 300, hB.x, hB.y);
  return {
    kind: 'side',
    floorBand,
    shadow,
    tubesBack,
    tubesFront,
    nat,
    acc,
    rail,
    posts,
    ends,
    endsHi,
    legs,
    stretcher,
    wheels,
    damper,
    pedal,
    pedalRod,
    shafts,
    fanDiscs,
    motor,
    belt,
    gas,
    caseBody,
    caseRim,
    lid,
    lidRail,
    table,
    tableLegs,
    player: { head: { x: 0, y: yHead }, body, arms },
    mallets: { shafts: shaftsM, heads: [hA, hB] },
    yFloor: yF,
    barTop: L.yAcc,
  };
}

/* ── the top view (plan; the player at the top, the audience below) ── */
type BarsTop = { body: SkPath; hi: SkPath; lo: SkPath; grain: SkPath; holes: SkPath; shadow: SkPath };
function barsTop(bars: readonly Bar[], lift: number, wood: boolean): BarsTop {
  const f: BarsTop = { body: make(), hi: make(), lo: make(), grain: make(), holes: make(), shadow: make() };
  for (const b of bars) {
    const x0 = b.x - b.w / 2;
    const x1 = b.x + b.w / 2;
    const z0 = b.z - b.L / 2;
    const z1 = b.z + b.L / 2;
    const r = Math.min(4, b.w * 0.12);
    rrect(f.body, x0, z0, x1, z1, r);
    rrect(f.shadow, x0 + lift * 0.5, z0 + lift, x1 + lift * 0.5, z1 + lift, r);
    // Upper-left light: the −x edge and the −z end lit, +x and +z in shade.
    rect(f.hi, x0 + 0.8, z0 + 2, x0 + Math.max(2.4, b.w * 0.14), z1 - 2);
    rect(f.hi, x0 + 2, z0 + 0.8, x1 - 2, z0 + 3.2);
    rect(f.lo, x1 - Math.max(2.2, b.w * 0.12), z0 + 2, x1 - 0.8, z1 - 2);
    rect(f.lo, x0 + 2, z1 - 3.2, x1 - 2, z1 - 0.8);
    if (wood) {
      for (const k of [0.3, 0.52, 0.71]) seg(f.grain, x0 + b.w * k, z0 + 8, x0 + b.w * (k + 0.04), z1 - 8);
    }
    for (const zf of [NODE_FRAC, 1 - NODE_FRAC]) f.holes.addCircle(b.x, z0 + zf * b.L, Math.min(3.2, b.w * 0.09));
  }
  return f;
}
/** The cords through the still points, one line per row and side, and the
 *  posts between neighbouring bars. */
function cordsTop(bars: readonly Bar[]): { cords: SkPath; posts: { x: number; z: number }[] } {
  const cords = make();
  const posts: { x: number; z: number }[] = [];
  const s = [...bars].sort((a, b) => b.x - a.x);
  for (const zf of [NODE_FRAC, 1 - NODE_FRAC]) {
    s.forEach((b, i) => {
      const z = b.z - b.L / 2 + zf * b.L;
      if (i === 0) cords.moveTo(b.x + b.w / 2 + 14, z);
      cords.lineTo(b.x, z);
      const n = s[i + 1];
      if (n && b.x - n.x < (b.w + n.w) * 0.8) posts.push({ x: (b.x - b.w / 2 + n.x + n.w / 2) / 2, z: (z + (n.z - n.L / 2 + zf * n.L)) / 2 });
      if (!n) cords.lineTo(b.x - b.w / 2 - 14, z);
    });
  }
  return { cords, posts };
}

type TopBuilt = {
  kind: 'top';
  frameShadow: SkPath;
  rails: SkPath;
  railsHi: SkPath;
  endBoards: SkPath;
  casters: SkPath;
  damper: SkPath | null;
  pedal: SkPath | null;
  motor: SkPath | null;
  nat: BarsTop;
  acc: BarsTop;
  cords: SkPath;
  posts: { x: number; z: number }[];
  caseOuter: SkPath | null;
  caseFelt: SkPath | null;
  lid: SkPath | null;
  table: SkPath | null;
  player: { shoulders: SkPath; arms: SkPath; head: { x: number; z: number } };
  mallets: { shafts: SkPath; heads: { x: number; z: number }[] };
};

function buildTop(G: MalletGeom, v: VariantId): TopBuilt {
  const L = G.layouts[v];
  const row = L.row;
  const wood = row.inst === 'marimba' || row.inst === 'xylo';
  const frameShadow = make();
  const rails = make();
  const railsHi = make();
  const endBoards = make();
  const casters = make();
  if (row.stand === 'frame') {
    const hzL = L.halfDepth(L.xLow);
    const hzH = L.halfDepth(L.xHigh);
    frameShadow.moveTo(L.xHigh + 20, -hzH + 30);
    frameShadow.lineTo(L.xLow + 20, -hzL + 30);
    frameShadow.lineTo(L.xLow + 20, hzL + 30);
    frameShadow.lineTo(L.xHigh + 20, hzH + 30);
    frameShadow.close();
    // The near (player-side) and far rails follow the trapezoid's edges.
    for (const s of [-1, 1]) {
      const a = { x: L.xHigh + 40, z: s * (hzH - 34) };
      const b = { x: L.xLow - 40, z: s * (hzL - 34) };
      const n = 18;
      rails.moveTo(a.x, a.z - n);
      rails.lineTo(b.x, b.z - n);
      rails.lineTo(b.x, b.z + n);
      rails.lineTo(a.x, a.z + n);
      rails.close();
      seg(railsHi, a.x, a.z - n + 3, b.x, b.z - n + 3);
    }
    for (const [x0, x1, hz] of [[L.xLow - 55, L.xLow, hzL], [L.xHigh, L.xHigh + 55, hzH]] as const) {
      rrect(endBoards, x0, -hz, x1, hz, 10);
      for (const s of [-1, 1]) rrect(casters, (x0 + x1) / 2 - 26, s * (hz - 20) - 30, (x0 + x1) / 2 + 26, s * (hz - 20) + 30, 8);
    }
  }
  const ex = G.extras[v];
  const damper = ex.damper && ex.damper.kind === 'box' ? rrect(make(), ex.damper.min.x, ex.damper.min.z, ex.damper.max.x, ex.damper.max.z, 6) : null;
  const pedal = ex.pedal && ex.pedal.kind === 'box' ? rrect(make(), ex.pedal.min.x, ex.pedal.min.z, ex.pedal.max.x, ex.pedal.max.z, 10) : null;
  const motor = ex.motor && ex.motor.kind === 'box' ? rrect(make(), ex.motor.min.x, ex.motor.min.z, ex.motor.max.x, ex.motor.max.z, 12) : null;
  const nat = barsTop(L.naturals, 6, wood);
  const acc = barsTop(L.accidentals, 10, wood);
  const cN = cordsTop(L.naturals);
  const cA = cordsTop(L.accidentals);
  const cords = make();
  cords.addPath(cN.cords);
  cords.addPath(cA.cords);
  let caseOuter: SkPath | null = null;
  let caseFelt: SkPath | null = null;
  let lid: SkPath | null = null;
  let table: SkPath | null = null;
  if (ex.caseBase && ex.caseBase.kind === 'box' && ex.lid && ex.lid.kind === 'box' && ex.table && ex.table.kind === 'box') {
    table = rrect(make(), ex.table.min.x, ex.table.min.z, ex.table.max.x, ex.table.max.z, 10);
    caseOuter = rrect(make(), ex.caseBase.min.x, ex.caseBase.min.z, ex.caseBase.max.x, ex.caseBase.max.z, 12);
    caseFelt = rrect(make(), ex.caseBase.min.x + 22, ex.caseBase.min.z + 22, ex.caseBase.max.x - 22, ex.caseBase.max.z - 22, 6);
    lid = rrect(make(), ex.lid.min.x, ex.lid.min.z, ex.lid.max.x, ex.lid.max.z, 4);
  }
  // The player from above, at the top, arms reaching in to two bars.
  const zP = L.zPlayer;
  const shoulders = oval(make(), 0, zP, 240, 125);
  const midA = L.naturals[Math.floor(L.naturals.length * 0.62)];
  const midB = L.accidentals[Math.floor(L.accidentals.length * 0.35)];
  const handA = { x: -170, z: zP + 260 };
  const handB = { x: 190, z: zP + 250 };
  const arms = make();
  arms.moveTo(-190, zP + 30);
  arms.quadTo(-230, zP + 170, handA.x, handA.z);
  arms.moveTo(190, zP + 30);
  arms.quadTo(240, zP + 160, handB.x, handB.z);
  const shafts = make();
  const hA = { x: midA.x, z: midA.z };
  const hB = { x: midB.x, z: midB.z - midB.L * 0.15 };
  seg(shafts, handA.x, handA.z, hA.x, hA.z);
  seg(shafts, handB.x, handB.z, hB.x, hB.z);
  return {
    kind: 'top',
    frameShadow,
    rails,
    railsHi,
    endBoards,
    casters,
    damper,
    pedal,
    motor,
    nat,
    acc,
    cords,
    posts: [...cN.posts, ...cA.posts],
    caseOuter,
    caseFelt,
    lid,
    table,
    player: { shoulders, arms, head: { x: 0, z: zP } },
    mallets: { shafts, heads: [hA, hB] },
  };
}

const built = new Map<string, SideBuilt | TopBuilt>();
function getBuilt(G: MalletGeom, v: VariantId, view: ViewId): SideBuilt | TopBuilt {
  const k = `${G.fam.p}:${v}:${view}`;
  let b = built.get(k);
  if (!b) {
    b = view === 'side' ? buildSide(G, v) : buildTop(G, v);
    built.set(k, b);
  }
  return b;
}

/* ── pieces ── */
function Cylinders({ c, look, y0, y1, front }: { c: Cyl; look: Look; y0: number; y1: number; front: boolean }) {
  return (
    <>
      <Path path={c.body}>
        <LinearGradient start={vec(0, y0)} end={vec(0, y1)} colors={front ? [look.tube[0], look.tube[1], look.tube[2]] : [look.tube[1], look.tube[2], '#0d0d10']} />
      </Path>
      <Path path={c.hi} color={look.tubeHi} opacity={front ? 0.55 : 0.28} />
      <Path path={c.lo} color="#000" opacity={front ? 0.35 : 0.45} />
      <Path path={c.cap} color="#000" opacity={0.35} />
      <Path path={c.body} style="stroke" strokeWidth={0.9} color={INK} opacity={0.85} />
      <Path path={c.rim} style="stroke" strokeWidth={1.4} color={look.tubeHi} opacity={front ? 0.8 : 0.45} />
    </>
  );
}
function BarRow({ f, look, y0, y1, front }: { f: BarFaces; look: Look; y0: number; y1: number; front: boolean }) {
  return (
    <>
      <Path path={f.body}>
        <LinearGradient start={vec(0, y0)} end={vec(0, y1)} colors={front ? look.bar : [look.bar[1], look.bar[2], look.barLo]} />
      </Path>
      {look.grain ? <Path path={f.grain} style="stroke" strokeWidth={0.6} color={look.grain} opacity={0.6} /> : null}
      <Path path={f.hi} color={look.barHi} opacity={front ? 0.8 : 0.45} />
      <Path path={f.lo} color={look.barLo} opacity={0.7} />
      <Path path={f.body} style="stroke" strokeWidth={0.8} color={INK} />
    </>
  );
}
function MalletHead({ x, y, r, look }: { x: number; y: number; r: number; look: Look }) {
  return (
    <>
      <Circle cx={x + 3} cy={y + 4} r={r} color="#000" opacity={0.4}>
        <BlurMask blur={4} style="normal" />
      </Circle>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient c={vec(x - r * 0.4, y - r * 0.45)} r={r * 1.5} colors={look.mallet.head} />
      </Circle>
      {look.mallet.yarn ? <Circle cx={x} cy={y} r={r * 0.62} style="stroke" strokeWidth={0.8} color="#000" opacity={0.25} /> : null}
      <Circle cx={x} cy={y} r={r} style="stroke" strokeWidth={0.9} color={INK} />
    </>
  );
}

function Side({ b, look, inst }: { b: SideBuilt; look: Look; inst: MalletInst }) {
  const headR = inst === 'glock' || inst === 'xylo' ? 14 : 19;
  const yTubes0 = b.barTop;
  const yTubes1 = b.yFloor;
  return (
    <Group>
      {/* Floor and the contact shadow. */}
      <Path path={b.floorBand}>
        <LinearGradient start={vec(0, b.yFloor)} end={vec(0, b.yFloor + 60)} colors={FLOOR} />
      </Path>
      <Path path={b.shadow} color="#000" opacity={0.55}>
        <BlurMask blur={16} style="normal" />
      </Path>

      {/* The player, behind the keyboard (faint: we look through to them). */}
      <Group opacity={0.16}>
        <Path path={b.player.body}>
          <LinearGradient start={vec(-230, b.player.head.y)} end={vec(230, b.barTop)} colors={PLAYER} />
        </Path>
        <Path path={b.player.arms} style="stroke" strokeWidth={70} strokeCap="round" color={PLAYER[1]} />
        <Group transform={[{ translateX: b.player.head.x }, { translateY: b.player.head.y }]}>
          <FigureHead fill={playerHeadFill('front')} />
        </Group>
      </Group>

      {/* A table under a case model. */}
      {b.table && b.tableLegs ? (
        <>
          <Path path={b.tableLegs}>
            <LinearGradient start={vec(0, 0)} end={vec(40, 0)} colors={['#4a4e57', '#2a2c32']} />
          </Path>
          <Path path={b.table}>
            <LinearGradient start={vec(0, b.barTop)} end={vec(0, b.yFloor)} colors={['#6e7380', '#3a3d45', '#1c1d22']} />
          </Path>
          <Path path={b.table} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}

      {/* The frame: legs, casters, the stretcher (behind the tubes). */}
      <Path path={b.legs}>
        <LinearGradient start={vec(0, b.barTop)} end={vec(0, b.yFloor)} colors={CHROME} />
      </Path>
      <Path path={b.legs} style="stroke" strokeWidth={1} color={INK} />
      {b.gas ? (
        <>
          <Path path={b.gas}>
            <LinearGradient start={vec(-20, 0)} end={vec(20, 0)} colors={['#1d1e23', '#5b5f69', '#202227']} />
          </Path>
          <Path path={b.gas} style="stroke" strokeWidth={1} color={INK} />
        </>
      ) : null}
      {b.wheels.map((w) => (
        <Group key={`w${w.x}`}>
          <Circle cx={w.x} cy={w.y} r={30} color={RUBBER} />
          <Circle cx={w.x} cy={w.y} r={30} style="stroke" strokeWidth={2} color="#3d4049" />
          <Circle cx={w.x} cy={w.y} r={9}>
            <RadialGradient c={vec(w.x - 3, w.y - 3)} r={11} colors={['#eef1f6', '#7d828d']} />
          </Circle>
        </Group>
      ))}
      <Path path={b.stretcher}>
        <LinearGradient start={vec(0, b.yFloor - 150)} end={vec(0, b.yFloor - 110)} colors={look.frame} />
      </Path>
      <Path path={b.stretcher} style="stroke" strokeWidth={1} color={INK} />

      {/* The pedal at the player's feet, its rod up to the damper. */}
      {b.pedal ? (
        <>
          {b.pedalRod ? <Path path={b.pedalRod} style="stroke" strokeWidth={7} strokeCap="round" color="#2a2c32" /> : null}
          {b.pedalRod ? <Path path={b.pedalRod} style="stroke" strokeWidth={2.2} strokeCap="round" color="#c6cad4" opacity={0.6} /> : null}
          <Path path={b.pedal}>
            <LinearGradient start={vec(-150, b.yFloor - 46)} end={vec(150, b.yFloor)} colors={['#6b707b', '#30323a', '#15161a']} />
          </Path>
          <Path path={b.pedal} style="stroke" strokeWidth={1} color={INK} />
        </>
      ) : null}

      {/* RESONATORS: the far row's tubes first (behind), darker. */}
      <Cylinders c={b.tubesBack} look={look} y0={yTubes0} y1={yTubes1} front={false} />

      {/* The damper bar and the fans' shafts sit at the tube tops. */}
      {b.damper ? (
        <>
          <Path path={b.damper}>
            <LinearGradient start={vec(0, b.barTop)} end={vec(0, b.barTop + 60)} colors={FELT} />
          </Path>
          <Path path={b.damper} style="stroke" strokeWidth={0.8} color="#4e4636" />
        </>
      ) : null}
      {b.shafts ? <Path path={b.shafts} style="stroke" strokeWidth={6} strokeCap="round" color="#2a2c32" /> : null}
      {b.shafts ? <Path path={b.shafts} style="stroke" strokeWidth={1.8} strokeCap="round" color="#d9dde5" opacity={0.75} /> : null}

      <Cylinders c={b.tubesFront} look={look} y0={yTubes0} y1={yTubes1} front />
      {b.fanDiscs ? (
        <>
          <Path path={b.fanDiscs} color="#c6cad4" opacity={0.85} />
          <Path path={b.fanDiscs} style="stroke" strokeWidth={0.7} color={INK} />
        </>
      ) : null}

      {/* The motor under the low end, its belt to the shafts. */}
      {b.motor ? (
        <>
          {b.belt ? <Path path={b.belt} style="stroke" strokeWidth={3} color="#15161a" /> : null}
          <Path path={b.motor} color="#000" opacity={0.45}>
            <BlurMask blur={6} style="normal" />
          </Path>
          <Path path={b.motor}>
            <LinearGradient start={vec(0, b.barTop)} end={vec(0, b.barTop + 220)} colors={['#4a4d56', '#24262c', '#101114']} />
          </Path>
          <Path path={b.motor} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}

      {/* End boards (the front edges of the end assemblies). */}
      <Path path={b.ends}>
        <LinearGradient start={vec(0, b.barTop)} end={vec(0, b.yFloor)} colors={look.frame} />
      </Path>
      <Path path={b.endsHi} color="#ffffff" opacity={0.12} />
      <Path path={b.ends} style="stroke" strokeWidth={1.2} color={INK} />

      {/* The case (on its table) holds the bars of a case model. */}
      {b.caseBody ? (
        <>
          <Path path={b.caseBody}>
            <LinearGradient start={vec(0, b.barTop)} end={vec(0, b.barTop + 100)} colors={WOOD_CASE} />
          </Path>
          {b.caseRim ? <Path path={b.caseRim} color={CASE_FELT} /> : null}
          <Path path={b.caseBody} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}

      {/* THE BARS: naturals (the player's row) behind, accidentals in front and higher. */}
      <Path path={b.rail}>
        <LinearGradient start={vec(0, b.barTop)} end={vec(0, b.barTop + 60)} colors={look.frame} />
      </Path>
      <Path path={b.posts} style="stroke" strokeWidth={1.6} color="#9aa0ab" />
      <BarRow f={b.nat} look={look} y0={b.barTop} y1={b.barTop + 45} front={false} />
      <BarRow f={b.acc} look={look} y0={b.barTop} y1={b.barTop + 30} front />

      {/* The open lid of a case model stands on the audience side: seen
          through (a translucent panel), so the bars behind it stay visible. */}
      {b.lid ? (
        <>
          <Path path={b.lid} opacity={0.42}>
            <LinearGradient start={vec(0, b.barTop - 480)} end={vec(0, b.barTop)} colors={WOOD_CASE} />
          </Path>
          {b.lidRail ? <Path path={b.lidRail} style="stroke" strokeWidth={1.2} color="#e2c49a" opacity={0.45} /> : null}
          <Path path={b.lid} style="stroke" strokeWidth={2} color="#e2c49a" opacity={0.85} />
        </>
      ) : null}

      {/* Two mallets in the player's hands: one striking, one raised. */}
      <Path path={b.mallets.shafts} style="stroke" strokeWidth={9} strokeCap="round" color={INK} opacity={0.8} />
      <Path path={b.mallets.shafts} style="stroke" strokeWidth={6} strokeCap="round" color={look.mallet.shaft} />
      {b.mallets.heads.map((h) => (
        <MalletHead key={`m${h.x}`} x={h.x} y={h.y} r={headR} look={look} />
      ))}
    </Group>
  );
}

function BarsPlan({ f, look, front }: { f: BarsTop; look: Look; front: boolean }) {
  return (
    <>
      <Path path={f.shadow} color="#000" opacity={front ? 0.55 : 0.45}>
        <BlurMask blur={front ? 7 : 5} style="normal" />
      </Path>
      <Path path={f.body} color={look.bar[2]} />
      <Path path={f.body} opacity={0.75}>
        <LinearGradient start={vec(-1300, -400)} end={vec(1300, 400)} colors={[look.bar[0], look.bar[1], look.bar[2]]} />
      </Path>
      {look.grain ? <Path path={f.grain} style="stroke" strokeWidth={0.9} color={look.grain} opacity={0.45} /> : null}
      <Path path={f.hi} color={look.barHi} opacity={0.75} />
      <Path path={f.lo} color={look.barLo} opacity={0.6} />
      <Path path={f.holes} color="#000" opacity={0.55} />
      <Path path={f.body} style="stroke" strokeWidth={0.9} color={INK} />
    </>
  );
}

function Top({ b, look, inst }: { b: TopBuilt; look: Look; inst: MalletInst }) {
  const headR = inst === 'glock' || inst === 'xylo' ? 14 : 19;
  return (
    <Group>
      {b.table ? (
        <>
          <Path path={b.table} color="#000" opacity={0.5}>
            <BlurMask blur={14} style="normal" />
          </Path>
          <Path path={b.table}>
            <LinearGradient start={vec(-500, -350)} end={vec(500, 350)} colors={['#6e7380', '#3a3d45', '#1c1d22']} />
          </Path>
          <Path path={b.table} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}
      <Path path={b.frameShadow} color="#000" opacity={0.5}>
        <BlurMask blur={18} style="normal" />
      </Path>
      {b.caseOuter ? (
        <>
          <Path path={b.caseOuter}>
            <LinearGradient start={vec(-400, -250)} end={vec(400, 250)} colors={WOOD_CASE} />
          </Path>
          {b.caseFelt ? <Path path={b.caseFelt} color={CASE_FELT} /> : null}
          <Path path={b.caseOuter} style="stroke" strokeWidth={1.4} color={INK} />
        </>
      ) : null}
      <Path path={b.casters} color={RUBBER} />
      <Path path={b.endBoards}>
        <LinearGradient start={vec(-1300, -500)} end={vec(1300, 500)} colors={look.frame} />
      </Path>
      <Path path={b.endBoards} style="stroke" strokeWidth={1.2} color={INK} />
      <Path path={b.rails}>
        <LinearGradient start={vec(0, -500)} end={vec(0, 500)} colors={look.frame} />
      </Path>
      <Path path={b.railsHi} style="stroke" strokeWidth={1.4} color="#ffffff" opacity={0.18} />
      <Path path={b.rails} style="stroke" strokeWidth={1} color={INK} />
      {b.motor ? (
        <>
          <Path path={b.motor}>
            <LinearGradient start={vec(0, -70)} end={vec(0, 70)} colors={['#4a4d56', '#24262c', '#101114']} />
          </Path>
          <Path path={b.motor} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}
      {b.pedal ? (
        <>
          <Path path={b.pedal}>
            <LinearGradient start={vec(-150, 0)} end={vec(150, 0)} colors={['#6b707b', '#30323a', '#15161a']} />
          </Path>
          <Path path={b.pedal} style="stroke" strokeWidth={1} color={INK} />
        </>
      ) : null}
      {b.damper ? <Path path={b.damper} color={FELT[1]} opacity={0.9} /> : null}

      {/* The bars: the player's row, then the far row (raised: a deeper shadow). */}
      <BarsPlan f={b.nat} look={look} front={false} />
      <BarsPlan f={b.acc} look={look} front />
      {/* The cords through the still points, and the posts between bars. */}
      <Path path={b.cords} style="stroke" strokeWidth={1.4} color="#d8c9a8" opacity={0.75} />
      {b.posts.map((q) => (
        <Circle key={`p${q.x}:${q.z}`} cx={q.x} cy={q.z} r={3.6} color="#c6cad4" />
      ))}
      {b.lid ? (
        <>
          <Path path={b.lid}>
            <LinearGradient start={vec(0, 0)} end={vec(0, 40)} colors={WOOD_CASE} />
          </Path>
          <Path path={b.lid} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      ) : null}

      {/* The player, from above, reaching in with two mallets. */}
      <Path path={b.player.arms} style="stroke" strokeWidth={84} strokeCap="round" color="#1c2436" />
      <Path path={b.player.arms} style="stroke" strokeWidth={68} strokeCap="round" color={PLAYER[1]} />
      <Path path={b.player.shoulders} color="#000" opacity={0.5}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={b.player.shoulders}>
        <LinearGradient start={vec(-240, b.player.head.z - 125)} end={vec(240, b.player.head.z + 125)} colors={PLAYER} />
      </Path>
      <Group transform={[{ translateX: b.player.head.x }, { translateY: b.player.head.z }]}>
        <FigureHead fill={playerHeadFill('above')} />
      </Group>
      <Path path={b.mallets.shafts} style="stroke" strokeWidth={9} strokeCap="round" color={INK} opacity={0.8} />
      <Path path={b.mallets.shafts} style="stroke" strokeWidth={6} strokeCap="round" color={look.mallet.shaft} />
      {b.mallets.heads.map((h) => (
        <MalletHead key={`m${h.x}`} x={h.x} y={h.z} r={headR} look={look} />
      ))}
    </Group>
  );
}

/** The instrument as the engine's scene draws it. */
export function malletInstrument(fam: MalletFamily) {
  const G = malletGeom(fam);
  return function MalletInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
    const v = G.layouts[variant] ? variant : fam.variants[0].row.id;
    const inst = G.layouts[v].row.inst;
    const look = LOOK[inst];
    const b = getBuilt(G, v, view);
    return b.kind === 'side' ? <Side b={b} look={look} inst={inst} /> : <Top b={b} look={look} inst={inst} />;
  };
}

/* ── labels and taps (mm, from the same layout) ── */
export function malletLabels(fam: MalletFamily) {
  const G = malletGeom(fam);
  return function labels(view: ViewId, variant: VariantId): ArtLabel[] {
    const v = G.layouts[variant] ? variant : fam.variants[0].row.id;
    const L = G.layouts[v];
    const yF = G.floor[v];
    const ex = G.extras[v];
    const out: ArtLabel[] = [];
    if (view === 'side') {
      out.push({ id: 'low', text: 'LOW END', short: 'LOW', u: L.xLow - 10, v: L.yAcc - 70, align: 'right', tone: 'muted' });
      out.push({ id: 'high', text: 'HIGH END', short: 'HIGH', u: L.xHigh + 10, v: L.yAcc - 70, align: 'left', tone: 'muted' });
      out.push({ id: 'bars', text: 'BARS', u: 0, v: L.yAcc - 26, align: 'center' });
      if (L.tubes.length) {
        const t = L.tubes.find((q) => q.x > (L.span.hi * 0.5)) ?? L.tubes[0];
        // Named on a TUBE's body (owner 2026-10-06: the resonators are the
        // tubes, not the bars), its leader ending on the tube, well below the
        // bar it hangs from. No resonator label from above: the bars hide them.
        const at = { u: t.x, v: t.yTop + (t.yBot - t.yTop) * 0.6 };
        out.push({ id: 'res', text: 'RESONATORS', short: 'TUBES', u: at.u, v: at.v, align: 'center', at });
      }
      if (ex.motor && ex.motor.kind === 'box') out.push({ id: 'motor', text: 'MOTOR', u: (ex.motor.min.x + ex.motor.max.x) / 2, v: ex.motor.max.y + 40, align: 'center', tone: 'muted' });
      if (ex.pedal) out.push({ id: 'pedal', text: 'PEDAL', u: 0, v: yF - 90, align: 'center', tone: 'muted' });
      if (ex.lid) out.push({ id: 'lid', text: 'LID (OPEN, SEEN THROUGH)', short: 'LID', u: 0, v: L.yNat - 2 * (L.row.Dlow.mm / 2) + 50, align: 'center', tone: 'muted' });
      if (ex.table) out.push({ id: 'table', text: 'TABLE', u: L.xLow - 60, v: L.yNat + CASE.base + 90, align: 'right', tone: 'muted' });
      out.push({ id: 'floor', text: 'FLOOR', u: L.xLow + 150, v: yF - 18, align: 'right', tone: 'illustrative' });
      // Its leader to the player's chest (a moved name pointed at a mallet
      // head on the bars: clash sweep 2026-10-10).
      out.push({ id: 'player', text: 'PLAYER (BEHIND)', short: 'PLAYER', u: 0, v: yF - 1820, align: 'center', tone: 'illustrative', at: { u: 0, v: yF - 1300 } });
    } else {
      const n = L.naturals[Math.floor(L.naturals.length * 0.25)];
      const a = L.accidentals[Math.floor(L.accidentals.length * 0.2)];
      // The naturals' row is nearest the player, so a name above it lands on
      // the player's arms and mallets (clash sweep 2026-10-10): it sits off
      // the row's high end first, its leader on a natural.
      const byX = [...L.naturals].sort((p, q) => p.x - q.x);
      const nHi = byX[0];
      const nAt = byX[Math.floor(byX.length * 0.2)];
      out.push({ id: 'nat', text: 'NATURALS', u: n.x, v: L.zNat - n.L / 2 - 30, align: 'center', at: { u: nAt.x, v: L.zNat - nAt.L * 0.3 }, alts: [{ u: nHi.x - nHi.w / 2, v: L.zNat - nHi.L / 2 - 45, align: 'left' }, { u: nHi.x - nHi.w / 2 - 70, v: L.zNat, align: 'right' }] });
      out.push({ id: 'acc', text: 'ACCIDENTALS', short: 'SHARPS', u: a.x, v: L.zAcc + a.L / 2 + 40, align: 'center' });
      // moved, its leader goes to the player's head, not to empty glass (clash sweep 2026-10-10)
      out.push({ id: 'player', text: 'PLAYER', u: 330, v: L.zPlayer, align: 'left', tone: 'muted', point: { u: 60, v: L.zPlayer } });
      out.push({ id: 'aud', text: 'AUDIENCE ↓', u: 0, v: G.boom + 100, align: 'center', tone: 'muted' });
      out.push({ id: 'low', text: 'LOW END →', short: 'LOW →', u: L.xLow - 10, v: L.halfDepth(L.xLow) + 60, align: 'right', tone: 'muted' });
      if (ex.motor && ex.motor.kind === 'box') out.push({ id: 'motor', text: 'MOTOR', u: (ex.motor.min.x + ex.motor.max.x) / 2, v: ex.motor.max.z + 40, align: 'center', tone: 'muted' });
    }
    return out;
  };
}

/** Distance from (u, v) to the segment a–b (mm). */
function segDist(u: number, v: number, ax: number, av: number, bx: number, bv: number): number {
  const dx = bx - ax;
  const dv = bv - av;
  const t = Math.max(0, Math.min(1, ((u - ax) * dx + (v - av) * dv) / (dx * dx + dv * dv || 1)));
  return Math.hypot(u - (ax + t * dx), v - (av + t * dv));
}

/** The drawn player from above (shoulders, arms, mallets), which the hit test
 *  does not name, so the part labels keep off it (label occupancy only; taps
 *  unchanged — clash sweep 2026-10-10: NATURALS sat on the player's arm). The
 *  same anchors buildTop draws from. */
export function malletDrawnAt(fam: MalletFamily) {
  const G = malletGeom(fam);
  return function drawnAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
    if (view === 'side') return false;
    const vv = G.layouts[variant] ? variant : fam.variants[0].row.id;
    const L = G.layouts[vv];
    const zP = L.zPlayer;
    if (((u / (240 + tol)) ** 2) + (((v - zP) / (125 + tol)) ** 2) <= 1) return true;
    // the arms (≈ 70 mm across), shoulder → elbow bend → hand
    for (const [a, b, c] of [
      [[-190, zP + 30], [-224, zP + 150], [-170, zP + 260]],
      [[190, zP + 30], [232, zP + 140], [190, zP + 250]],
    ] as const) {
      if (segDist(u, v, a[0], a[1], b[0], b[1]) <= 38 + tol || segDist(u, v, b[0], b[1], c[0], c[1]) <= 38 + tol) return true;
    }
    // the mallets, hand → head
    const midA = L.naturals[Math.floor(L.naturals.length * 0.62)];
    const midB = L.accidentals[Math.floor(L.accidentals.length * 0.35)];
    if (segDist(u, v, -170, zP + 260, midA.x, midA.z) <= 8 + tol) return true;
    if (segDist(u, v, 190, zP + 250, midB.x, midB.z - midB.L * 0.15) <= 8 + tol) return true;
    return false;
  };
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function malletHitTest(fam: MalletFamily) {
  const G = malletGeom(fam);
  const p = fam.p;
  return function hitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
    const vv = G.layouts[variant] ? variant : fam.variants[0].row.id;
    const L = G.layouts[vv];
    const yF = G.floor[vv];
    const ex = G.extras[vv];
    const id = (s: string) => `${p}.${s}.${vv}`;
    const inBox = (s: { kind: string; min?: { x: number; y: number; z: number }; max?: { x: number; y: number; z: number } } | undefined, a: 'y' | 'z') =>
      !!s && s.kind === 'box' && !!s.min && !!s.max && u >= s.min.x - tol && u <= s.max.x + tol && v >= s.min[a] - tol && v <= s.max[a] + tol;
    const a = view === 'side' ? 'y' : 'z';
    if (inBox(ex.motor, a)) return id('motor');
    if (view === 'side') {
      if (inBox(ex.lid, 'y') && v < L.yAcc - 20) return id('lid');
      // The bars: the far row's ends sit above the near row's.
      for (const b of L.accidentals) if (Math.abs(u - b.x) <= b.w / 2 + tol * 0.5 && v >= b.yTop - tol && v <= b.yTop + b.t + 2) return id('acc');
      if (u >= L.span.lo - tol && u <= L.span.hi + tol && v >= L.yNat - tol && v <= L.yNat + Math.max(...L.naturals.map((b) => b.t)) + tol) return id('nat');
      if (inBox(ex.damper, 'y')) return id('damper');
      if (L.row.extras.fans && L.tubes.length && Math.abs(v - (L.tubes[0].yTop + 9)) <= 12 + tol && u >= L.span.lo && u <= L.span.hi) return id('fans');
      for (const t of L.tubes) if (Math.abs(u - t.x) <= t.d / 2 + tol * 0.5 && v >= t.yTop - tol && v <= t.yBot + tol) return id('res');
      if (inBox(ex.pedal, 'y') || (ex.pedal && Math.abs(u) <= 12 + tol && v >= L.yNat && v <= yF)) return id('pedal');
      if (inBox(ex.caseBase, 'y')) return id('case');
      if (inBox(ex.table, 'y') || (ex.table && v > L.yNat + CASE.base && v <= yF && (Math.abs(u - (L.xHigh - 40)) < 60 || Math.abs(u - (L.xLow + 20)) < 60))) return id('table');
      if (L.row.stand === 'frame') {
        if (Math.abs(u - L.xLow) <= 70 + tol || Math.abs(u - L.xHigh) <= 70 + tol) if (v >= L.yNat && v <= yF + tol) return id('frame');
        if (v >= yF - 160 - tol && v <= yF - 100 + tol && u >= L.xHigh && u <= L.xLow) return id('frame');
      }
      return null;
    }
    // TOP: bars first (the far row is on top), then the cords, the rest.
    for (const b of L.accidentals) if (Math.abs(u - b.x) <= b.w / 2 + tol * 0.4 && Math.abs(v - b.z) <= b.L / 2 + tol * 0.4) {
      const zn = b.z - b.L / 2;
      for (const f of [NODE_FRAC, 1 - NODE_FRAC]) if (Math.abs(v - (zn + f * b.L)) <= 6 + tol * 0.3) return id('cords');
      return id('acc');
    }
    for (const b of L.naturals) if (Math.abs(u - b.x) <= b.w / 2 + tol * 0.4 && Math.abs(v - b.z) <= b.L / 2 + tol * 0.4) {
      const zn = b.z - b.L / 2;
      for (const f of [NODE_FRAC, 1 - NODE_FRAC]) if (Math.abs(v - (zn + f * b.L)) <= 6 + tol * 0.3) return id('cords');
      return id('nat');
    }
    if (inBox(ex.pedal, 'z')) return id('pedal');
    if (inBox(ex.damper, 'z')) return id('damper');
    if (inBox(ex.lid, 'z')) return id('lid');
    if (inBox(ex.caseBase, 'z')) return id('case');
    if (inBox(ex.table, 'z')) return id('table');
    if (L.row.stand === 'frame' && u >= L.xHigh - tol && u <= L.xLow + tol && Math.abs(v) <= L.halfDepth(u) + tol) return id('frame');
    return null;
  };
}

/** The amber "inside the mallets' travel" band for an example the art must
 *  show as a conflict (the glockenspiel's close example). */
export function ConflictBand({ view, u0, u1, y0, y1, z0, z1 }: { view: ViewId; u0: number; u1: number; y0: number; y1: number; z0: number; z1: number }) {
  const p = view === 'side' ? rect(make(), u0, y0, u1, y1) : rect(make(), u0, z0, u1, z1);
  return (
    <>
      <Path path={p} color="#ff6b5e" opacity={0.16} />
      <Path path={p} style="stroke" strokeWidth={3} color="#ff6b5e" opacity={0.85} />
    </>
  );
}

export { AMBER };
