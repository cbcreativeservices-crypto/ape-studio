/**
 * THE ENSEMBLE STAGE — Lab 5's display (the Rack Unit's glass): a seating
 * in one of frame S's views with what a page puts on it —
 *
 *   rigs      main arrays (ArrayRig: the stand, the bar, the capsules)
 *   singles   support and spot mics, each on a boom stand from the floor
 *   zones     suggested starting points (blue, a box in the view)
 *   radiate   where each chosen section's sound leaves (blue arcs: WHERE,
 *             never how loud)
 *   dims      the first rig's height above the floor and its distance in
 *             front of the front row (white dimension lines with the number)
 *   detail    the first rig's head at its own scale (ArrayDetail) in a
 *             corner, so a 17 cm pair reads on a stage-sized drawing
 *
 * Labels are said as the conductor faces the ensemble and sit in free space
 * (labelLayout.fitLabels with stageClearOf), ≥ 9 pt. A tap names a section
 * (onTapSection). Static (D8): nothing moves by itself.
 */
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { PatternId, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { fitXform, type ViewXform } from '../../../engine/geometry/frame.ts';
import { gain } from '../../../engine/physics/polar.ts';
import { angleBetween } from '../../../engine/geometry/vec.ts';
import { fitLabels, LABEL_AIR, labelRect, leaderLine, segHitsRect, segsCross, type LabelRect } from '../../../engine/scene/labelLayout.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { add, DEG, dist, fmtM, mul, planDir, unit, uv, uvDir, v3, type StageView } from './frameS.ts';
import { arrayCapsules } from './stereoArray.ts';
import { headTop, soundPoint, type Seat, type Seating } from './seating.ts';
import { SeatingView, SECTION_SLICE } from './SeatingArt';
import { ArrayDetail, ArrayRig, rigHardware, rigPoints, type RigSpec } from './ArrayArt';
import { stageClearOf, stageHit, stageLabels } from './stageLabels.ts';
import { GEAR_SIZE, PA_BOX } from './bandStage.ts';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const IDEAL = '#e8eaee';
const ZONE = '#3d8bff';
/** Group 4: a spill path (a neighbour reaching a close mic). */
const SPILL = '#ff8a6e';
const MIC = { len: 104, r: 10.5 };

/** group 2: `dimTo` replaces the rig's height/front dimensions with the white
 *  distance from the rig's centre to that point (a shared mic to a mouth). */
export type StageRig = RigSpec & { key: string; label?: string; lit?: boolean; dimTo?: Vec3 };
/** The mic drawings a single can use (features/lab/micDrawings MikingMicArt). */
export type MicArtId = 'kickDynamic' | 'sdc' | 'boundary' | 'smallDynamic' | 'clipDynamic' | 'gooseneck' | 'instDynamic' | 'sideLdc' | 'vocalDynamic' | 'vocalLdc' | 'ribbon';
export type StageSingle = {
  key: string;
  p: Vec3;
  dir: Vec3;
  pattern: PatternId;
  label?: string;
  lit?: boolean;
  /** The mic's drawing (default the pencil condenser; group 2's handheld
   *  'vocalDynamic' at its own size) and its body, mm: `len` deep, and
   *  across either `r` (a radius: group 4, from the mic type) or `cross` (a
   *  width: group 5); and a stand foot set on a riser or a gap between
   *  players (group 5; default: 650 mm back from the mic's tail, on the floor). */
  art?: MicArtId;
  len?: number;
  r?: number;
  cross?: number;
  foot?: Vec3;
  /** group 2: `dimTo` draws the white distance from the mic's front to that
   *  point (a singer's lips) with its number in cm; `aimLen` shortens the
   *  amber aim; `boomDir` the plan direction the boom runs to its stand
   *  (default: straight back from the mic). */
  dimTo?: Vec3;
  aimLen?: number;
  boomDir?: Vec3;
};
export type StageZone = { key: string; box: { min: Vec3; max: Vec3 }; label?: string; on?: boolean };
/** Group 4: a spill path (a neighbour's sound reaching a close mic) and an
 *  equal-distance ring (plan only). */
export type StageSpill = { key: string; from: Vec3; to: Vec3 };
export type StageRing = { key: string; c: Vec3; r: number };

/** Where a seat's sound radiates (a local direction: right, up, forward). */
const RADIATE: Record<string, [number, number, number]> = {
  violin: [-0.2, 0.9, 0.35],
  viola: [-0.2, 0.9, 0.35],
  cello: [0, 0.35, 0.95],
  bass: [0, 0.4, 0.9],
  flute: [1, 0.2, 0.2],
  oboe: [0, -0.6, 0.8],
  clarinet: [0, -0.6, 0.8],
  bassoon: [0, 1, 0.1],
  horn: [0.5, 0.1, -0.85],
  trumpet: [0, 0, 1],
  trombone: [0, 0, 1],
  tuba: [0, 1, 0],
  timpani: [0, 1, 0.2],
  percussion: [0, 0.8, 0.6],
  harp: [0.3, 0.3, -0.9],
  piano: [0.7, 0.7, 0],
  celesta: [0, 1, 0.2],
  // Group 4 (an amp radiates along its own facing: Seat.srcFace). The drum
  // kit is one kind for groups 4 and 5.
  drumkit: [0, 0.8, 0.6],
  keys: [0, 1, 0.2],
  tenorSax: [0.3, 0.6, 0.75],
  aguitar: [0, 0.2, 1],
  mandolin: [0, 0.2, 1],
  // group 5 (sections)
  sax: [0.35, 0.55, 0.75],
  bariSax: [0.35, 0.7, 0.6],
  guitar: [0, 0.1, 1],
  marimba: [0, 1, 0.1],
  vibraphone: [0, 1, 0.1],
  congas: [0, 1, 0.25],
  perctable: [0, 0.9, 0.4],
  // group 2 — voices: out of the mouth, ahead (group 4's lead vocal too).
  singer: [0, 0.08, 1],
  chorister: [0, 0.08, 1],
  child: [0, 0.08, 1],
};
/** A handheld vocal dynamic's drawn size (voiceMics HANDHELD: 162 mm, a 5 cm ball). */
const HANDHELD = { len: 162, r: 25 };
/** A single's drawn body: its own `len` / `r` / `cross` when given (groups 4
 *  and 5), else the handheld's (group 2) or the pencil's. */
const micSize = (m: StageSingle): { len: number; r: number } => {
  const base = m.art === 'vocalDynamic' ? HANDHELD : MIC;
  return { len: m.len ?? base.len, r: m.r ?? (m.cross != null ? m.cross / 2 : base.r) };
};
function radDir(q: Seat): Vec3 {
  if (q.srcFace != null) return planDir(q.srcFace);
  const [r, up, f] = RADIATE[q.kind] ?? [0, 1, 0];
  const F = q.face * DEG;
  const right = v3(Math.cos(F), 0, Math.sin(F));
  const fwd = planDir(q.face);
  return unit(add(add(mul(right, r), mul(fwd, f)), v3(0, -up, 0)));
}

/** The view box that holds the seating and everything placed on it.
 *  `focus` (group 2): frame only those seats and the mics — a close vocal
 *  setup, where a stage-wide frame would make 6 cm a pixel. */
export function stageBox(s: Seating, view: StageView, rigs: readonly StageRig[] = [], singles: readonly StageSingle[] = [], extra: readonly Vec3[] = [], focus?: readonly string[]): ViewBox {
  const st = s.stage;
  const pts: Vec3[] = focus ? [...extra] : [v3(st.x0, 0, st.z0), v3(st.x1, 0, st.z1), ...extra];
  for (const q of s.seats) if (!focus || focus.includes(q.id)) pts.push(v3(q.p.x, -headTop(q) - 120, q.p.z), ...(focus ? [v3(q.p.x, 0, q.p.z)] : []));
  // Group 4: the gear (an amp, the PA on its stand) is part of the stage.
  if (!focus) for (const g of s.gear ?? []) pts.push(v3(g.p.x, g.p.y - (g.kind === 'pa' ? PA_BOX.bottom + PA_BOX.h : GEAR_SIZE[g.kind].h) - 120, g.p.z));
  if (s.conductor && !focus) pts.push(v3(0, -2100, s.conductor.p.z));
  for (const r of rigs) pts.push(...rigPoints(r));
  for (const m of singles) pts.push(m.p, v3(m.p.x, 0, m.p.z), ...(focus ? [boomStand(m).foot] : []));
  const inView = view === 'section' ? pts.filter((p) => Math.abs(p.x) <= SECTION_SLICE + 2500 || p.y < -2000) : pts;
  const us = inView.map((p) => uv(view, p).u);
  const vs = inView.map((p) => uv(view, p).v);
  const pad = focus ? 250 : view === 'plan' ? 500 : 450;
  return { u0: Math.min(...us) - pad, u1: Math.max(...us) + pad, v0: Math.min(...vs) - pad - (view === 'plan' ? 0 : 300), v1: Math.max(...vs) + (view === 'plan' ? pad : 250) };
}

/** A support or spot on its boom stand: the foot toward the hall, the mast,
 *  the boom up to the mic's tail. */
function boomStand(m: StageSingle) {
  const tail = add(m.p, mul(m.dir, -micSize(m).len));
  const flat = m.boomDir ? unit(v3(m.boomDir.x, 0, m.boomDir.z)) : unit(v3(-m.dir.x, 0, -m.dir.z));
  const foot = m.foot ?? v3(tail.x + flat.x * 650, 0, tail.z + flat.z * 650);
  const top = v3(foot.x, Math.min(foot.y - 900, tail.y + 350), foot.z);
  return { tail, foot, top };
}

function micXf(view: StageView, p: Vec3, dir: Vec3) {
  const o = uv(view, p);
  const d = uvDir(view, dir);
  const fore = Math.max(0.12, Math.hypot(d.u, d.v));
  const ang = Math.atan2(-d.v, -d.u) - Math.PI / 2;
  return [{ translateX: o.u }, { translateY: o.v }, { rotate: ang }, { scaleY: fore }];
}

function lobePath(view: StageView, p: Vec3, dir: Vec3, pattern: PatternId, R: number) {
  const out = Skia.Path.Make();
  const o = uv(view, p);
  for (let i = 0; i <= 72; i++) {
    const phi = (i / 72) * Math.PI * 2;
    const d = view === 'plan' ? v3(Math.cos(phi), 0, Math.sin(phi)) : view === 'front' ? v3(Math.cos(phi), Math.sin(phi), 0) : v3(0, Math.sin(phi), -Math.cos(phi));
    const g = Math.abs(gain(pattern, angleBetween(dir, d))) * R;
    const s = uvDir(view, d);
    if (i === 0) out.moveTo(o.u + g * s.u, o.v + g * s.v);
    else out.lineTo(o.u + g * s.u, o.v + g * s.v);
  }
  out.close();
  return out;
}

export type EnsembleStageProps = {
  w: number;
  h: number;
  seating: Seating;
  view: StageView;
  hi?: string | null;
  rigs?: readonly StageRig[];
  singles?: readonly StageSingle[];
  zones?: readonly StageZone[];
  radiate?: readonly string[] | null;
  dims?: boolean;
  lobes?: boolean;
  aims?: boolean;
  wedge?: boolean;
  detail?: boolean;
  labels?: boolean;
  extraLabels?: readonly StaticLabel[];
  /** Group 4: spill paths (coral dashed) and equal-distance rings (plan). */
  spill?: readonly StageSpill[];
  rings?: readonly StageRing[];
  box?: ViewBox;
  /** group 2: frame only these seats and the mics (stageBox). */
  focus?: readonly string[];
  onTapSection?: (id: string) => void;
  accessibilityLabel: string;
  children?: ReactNode;
};

/** Stable empties: a fresh `[]` default per render would bust every memo below
 *  (the box, the label layout, the detail-corner search) on each parent render
 *  (toddler 2026-10-07 L5-R1-01). */
const NONE: readonly never[] = Object.freeze([]);

/**
 * ELEVATION LABEL ROWS (round 2, 2026-10-10 — E14's side view had leaders
 * crossing and tangling): the section names sit in ROWS above the players'
 * heads and below the stage floor, each row filled left to right in the order
 * of the parts they name, so the leaders fan out without crossing. A place is
 * taken only when its words keep off every label already set, the detail
 * inset and the drawing (clearOf), no leader runs through the words, and its
 * own leader crosses no leader and runs through no words. A label with no
 * such place keeps its own places (fitLabels then decides). Px throughout;
 * the result is the label's first place, so fitLabels takes it as it is.
 */
function rowLayoutOnce(labels: StaticLabel[], fixed: StaticLabel[], xf: ViewXform, scale: number, maxX: number, maxY: number, clearOf: (u0: number, v0: number, u1: number, v1: number) => boolean, corner: LabelRect | null, topV: number, floorV: number, rightFirst: boolean, aboveFirst: boolean): { out: StaticLabel[]; failed: Set<number> } {
  const hpx = 9.5 * scale * 1.25;
  const taken: LabelRect[] = [...(corner ? [corner] : []), ...fixed.map((l) => labelRect(l, xf, scale, maxX))];
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const overlaps = (a: LabelRect, b: LabelRect) => a.x0 < b.x1 + 3 && a.x1 > b.x0 - 3 && a.y0 < b.y1 + 1 && a.y1 > b.y0 - 1;
  const inMm = (r: LabelRect) => clearOf((r.x0 - LABEL_AIR - xf.ox) / xf.s, (r.y0 - LABEL_AIR - xf.oy) / xf.s, (r.x1 + LABEL_AIR - xf.ox) / xf.s, (r.y1 + LABEL_AIR - xf.oy) / xf.s);
  const topPx = xf.oy + topV * xf.s;
  const floorPx = xf.oy + floorV * xf.s;
  // Rows: just under the floor first, then just over the heads, then further out.
  const rows: { y: number; used: [number, number][] }[] = [];
  for (let k = 0; k < 7; k++) {
    const below = { y: floorPx + (1.4 + 1.25 * k) * hpx, used: [] as [number, number][] };
    const above = { y: topPx - (1.2 + 1.25 * k) * hpx, used: [] as [number, number][] };
    rows.push(...(aboveFirst ? [above, below] : [below, above]));
  }
  const order = labels.map((l, i) => ({ l, i })).filter((q) => q.l.at).sort((a, b) => (rightFirst ? -1 : 1) * (a.l.at!.u - b.l.at!.u));
  const out = [...labels];
  const failed = new Set<number>();
  // Every part's point (px): a leader never runs through ANOTHER part's dot.
  const dots = labels.filter((l) => l.at).map((l) => ({ x: xf.ox + l.at!.u * xf.s, y: xf.oy + l.at!.v * xf.s }));
  const passes = (sg: { x1: number; y1: number; x2: number; y2: number }, d: { x: number; y: number }) => {
    if (Math.hypot(sg.x1 - d.x, sg.y1 - d.y) < 1) return false;
    const L2 = (sg.x2 - sg.x1) ** 2 + (sg.y2 - sg.y1) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((d.x - sg.x1) * (sg.x2 - sg.x1) + (d.y - sg.y1) * (sg.y2 - sg.y1)) / L2));
    return Math.hypot(sg.x1 + t * (sg.x2 - sg.x1) - d.x, sg.y1 + t * (sg.y2 - sg.y1) - d.y) < 5;
  };
  for (const { l, i } of order) {
    const at = l.at!;
    const ax = xf.ox + at.u * xf.s;
    let done = false;
    for (const text of l.short ? [l.text, l.short] : [l.text]) {
      const W = labelRect({ ...l, text, align: 'center' }, xf, scale, maxX).x1 - labelRect({ ...l, text, align: 'center' }, xf, scale, maxX).x0;
      // In each row: straight over the part, else the nearest gap either side.
      // Straight over the part in ANY row before a shifted place in a near one
      // (vertical leaders are the ones that never cross).
      const tries: { row: (typeof rows)[number]; cx: number; k: number }[] = [];
      rows.forEach((row, k) => {
        const xs = [ax, ...row.used.flatMap(([x0, x1]) => [x1 + W / 2 + 4, x0 - W / 2 - 4])].map((x) => Math.min(maxX - W / 2 - 2, Math.max(W / 2 + 2, x)));
        for (const cx of xs) tries.push({ row, cx, k });
      });
      tries.sort((p, q) => Math.round(Math.abs(p.cx - ax) / (2 * hpx)) - Math.round(Math.abs(q.cx - ax) / (2 * hpx)) || p.k - q.k);
      for (const { row, cx } of tries) {
        const v = (row.y + 7 * scale - hpx / 2 - xf.oy) / xf.s;
        const cand = { ...l, text, u: (cx - xf.ox) / xf.s, v, align: 'center' as const };
        const r = labelRect(cand, xf, scale, maxX);
        if (r.y0 < 1 || r.y1 > maxY - 1) continue;
        if (taken.some((t) => overlaps(r, t)) || !inMm(r)) continue;
        const fat = { x0: r.x0 - 5, x1: r.x1 + 5, y0: r.y0 - 3, y1: r.y1 + 3 };
        if (lines.some((sg) => segHitsRect(sg, fat))) continue;
        const ln = leaderLine(r, xf, at);
        if (ln && (taken.some((t) => segHitsRect(ln, { x0: t.x0 - 5, x1: t.x1 + 5, y0: t.y0 - 3, y1: t.y1 + 3 })) || lines.some((sg) => segsCross(sg, ln)) || dots.some((d) => passes(ln, d)))) continue;
        const me = { x: xf.ox + at.u * xf.s, y: xf.oy + at.v * xf.s };
        if (lines.some((sg) => passes(sg, me))) continue;
        taken.push(r);
        if (ln) lines.push(ln);
        row.used.push([r.x0, r.x1]);
        out[i] = { ...cand, alts: l.alts };
        done = true;
        break;
      }
      if (done) break;
    }
    if (!done) failed.add(i);
  }
  return { out, failed };
}

/** The row layout tried four ways (left or right end first, under the floor
 *  or over the heads first); the one that sets the most labels cleanly wins.
 *  A section name with no clean place at this zoom is LEFT OUT (the house
 *  level-of-detail rule: no crossing leaders, no words on the drawing) — it
 *  appears when the drawing is zoomed in, and a tap still names the section. */
function rowLayout(labels: StaticLabel[], fixed: StaticLabel[], xf: ViewXform, scale: number, maxX: number, maxY: number, clearOf: (u0: number, v0: number, u1: number, v1: number) => boolean, corner: LabelRect | null, topV: number, floorV: number): StaticLabel[] {
  let best: { out: StaticLabel[]; failed: Set<number> } | null = null;
  for (const rightFirst of [false, true])
    for (const aboveFirst of [false, true]) {
      const r = rowLayoutOnce(labels, fixed, xf, scale, maxX, maxY, clearOf, corner, topV, floorV, rightFirst, aboveFirst);
      if (!best || r.failed.size < best.failed.size) best = r;
      if (best.failed.size === 0) break;
    }
  return best!.out.filter((_, i) => !best!.failed.has(i));
}

export function EnsembleStage(p: EnsembleStageProps) {
  const { w, h, seating, view, hi = null, rigs = NONE, singles = NONE, zones = NONE, radiate = null, dims = false, lobes = false, aims = true, wedge = true, detail = false, labels = true, extraLabels = NONE, spill = NONE, rings = NONE, onTapSection } = p;
  const textScale = useStageTextScale();
  const box = useMemo(() => p.box ?? stageBox(seating, view, rigs, singles, view === 'plan' ? rings.flatMap((r) => [v3(r.c.x - r.r, 0, r.c.z - r.r), v3(r.c.x + r.r, 0, r.c.z + r.r)]) : [], p.focus), [p.box, seating, view, rigs, singles, rings, p.focus]);
  const xf: ViewXform = useMemo(() => fitXform(view === 'front' ? 'side' : 'top', box, w, h, 6), [view, box, w, h]);
  const px = 1 / xf.s;
  const slice = view === 'section' ? SECTION_SLICE : Infinity;

  const rad = useMemo(() => {
    if (!radiate || !radiate.length) return null;
    const out = Skia.Path.Make();
    for (const q of seating.seats) {
      if (!radiate.includes(q.section)) continue;
      if (view === 'section' && Math.abs(q.p.x) > slice) continue;
      const sp = soundPoint(q);
      const o = uv(view, view === 'plan' ? v3(sp.x, 0, sp.z) : sp);
      const d = uvDir(view, radDir(q));
      const L = Math.hypot(d.u, d.v);
      for (const r of [230, 400, 570]) {
        if (L < 0.3) out.addCircle(o.u, o.v, r);
        else {
          const a = (Math.atan2(d.v, d.u) * 180) / Math.PI;
          out.addArc(Skia.XYWHRect(o.u - r, o.v - r, 2 * r, 2 * r), a - 50, 100);
        }
      }
    }
    return out;
  }, [radiate, seating, view, slice]);

  const singlesG = useMemo(
    () =>
      singles.map((m) => {
        const b = boomStand(m);
        const metal = Skia.Path.Make();
        const legs = Skia.Path.Make();
        const f = uv(view, b.foot);
        const t = uv(view, b.top);
        const tl = uv(view, b.tail);
        metal.moveTo(f.u, f.v - (view === 'plan' ? 0 : 280));
        metal.lineTo(t.u, t.v);
        metal.lineTo(tl.u, tl.v);
        if (view === 'plan') {
          for (let i = 0; i < 3; i++) {
            const a = Math.PI / 2 + (i * 2 * Math.PI) / 3;
            legs.moveTo(f.u, f.v);
            legs.lineTo(f.u + Math.cos(a) * 330, f.v + Math.sin(a) * 330);
          }
        } else {
          legs.moveTo(f.u, f.v - 280);
          legs.lineTo(f.u - 320, f.v);
          legs.moveTo(f.u, f.v - 280);
          legs.lineTo(f.u + 300, f.v);
        }
        // group 2: the white distance to a singer's lips, with its number.
        let dim: { path: ReturnType<typeof Skia.Path.Make>; label: StaticLabel } | null = null;
        if (m.dimTo) {
          const a = uv(view, m.p);
          const b = uv(view, m.dimTo);
          const L = Math.hypot(b.u - a.u, b.v - a.v);
          if (L > 1) {
            const n = { u: -(b.v - a.v) / L, v: (b.u - a.u) / L };
            // Offsets in screen pixels (px = mm per pixel), so the line and
            // its number clear the mic at any zoom.
            const off = 10 * px;
            const tk = 7 * px;
            const path = Skia.Path.Make();
            path.moveTo(a.u + n.u * off, a.v + n.v * off);
            path.lineTo(b.u + n.u * off, b.v + n.v * off);
            for (const q of [a, b]) {
              path.moveTo(q.u + n.u * (off - tk), q.v + n.v * (off - tk));
              path.lineTo(q.u + n.u * (off + tk), q.v + n.v * (off + tk));
            }
            const d3 = Math.hypot(m.p.x - m.dimTo.x, m.p.y - m.dimTo.y, m.p.z - m.dimTo.z);
            dim = { path, label: { id: `dim:${m.key}`, text: `${Math.round(d3 / 10)} CM`, u: (a.u + b.u) / 2 + n.u * (off + 30 * px), v: (a.v + b.v) / 2 + n.v * (off + 30 * px), align: 'center', tone: 'amber' } };
          }
        }
        return { m, metal, legs, dim, lobe: lobePath(view, m.p, m.dir, m.pattern, m.art === 'vocalDynamic' ? 200 : 300) };
      }),
    [singles, view, px],
  );

  const zonesG = useMemo(
    () =>
      zones.map((z) => {
        const a = uv(view, z.box.min);
        const b = uv(view, z.box.max);
        const path = Skia.Path.Make();
        path.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(a.u, b.u), Math.min(a.v, b.v), Math.abs(b.u - a.u), Math.abs(b.v - a.v)), 80, 80));
        return { z, path };
      }),
    [zones, view],
  );

  // The first rig's dimensions: its height (front, section) and its distance
  // in front of the front row (plan, section).
  const dimG = useMemo(() => {
    const r = rigs[0];
    if (!dims || !r) return null;
    const c = r.place.c;
    const lines = Skia.Path.Make();
    const lab: StaticLabel[] = [];
    const tick = (a: { u: number; v: number }, horiz: boolean) => {
      const k = 16 * px;
      lines.moveTo(a.u - (horiz ? 0 : k), a.v - (horiz ? k : 0));
      lines.lineTo(a.u + (horiz ? 0 : k), a.v + (horiz ? k : 0));
    };
    if (r.dimTo) {
      // group 2: one distance — the nearest capsule's front to a singer's mouth.
      const to = r.dimTo;
      const cap = arrayCapsules(r.id, r.params, r.place).reduce((best, q) => (dist(q.p, to) < dist(best.p, to) ? q : best));
      const c = cap.p;
      const a = uv(view, c);
      const b = uv(view, r.dimTo);
      const L = Math.hypot(b.u - a.u, b.v - a.v);
      if (L < 1) return null;
      const n = { u: -(b.v - a.v) / L, v: (b.u - a.u) / L };
      const off = 22 * px;
      lines.moveTo(a.u + n.u * off, a.v + n.v * off);
      lines.lineTo(b.u + n.u * off, b.v + n.v * off);
      for (const q of [a, b]) {
        lines.moveTo(q.u + n.u * (off - 10 * px), q.v + n.v * (off - 10 * px));
        lines.lineTo(q.u + n.u * (off + 10 * px), q.v + n.v * (off + 10 * px));
      }
      const d3 = Math.hypot(c.x - r.dimTo.x, c.y - r.dimTo.y, c.z - r.dimTo.z);
      lab.push({ id: 'dimD', text: `${Math.round(d3 / 10)} CM`, u: (a.u + b.u) / 2 + n.u * (off + 30 * px), v: (a.v + b.v) / 2 + n.v * (off + 30 * px), align: 'center', tone: 'amber' });
      return { lines, lab };
    }
    if (view !== 'plan') {
      const top = uv(view, c);
      const bot = uv(view, v3(c.x, 0, c.z));
      const off = 320;
      lines.moveTo(top.u + off, top.v);
      lines.lineTo(bot.u + off, bot.v);
      tick({ u: top.u + off, v: top.v }, false);
      tick({ u: bot.u + off, v: bot.v }, false);
      lab.push({ id: 'dimH', text: `${fmtM(-c.y)} UP`, u: top.u + off + 120, v: (top.v + bot.v) / 2, align: 'left', tone: 'amber' });
    }
    // Group 4: on a stage plot a rig upstage of the band's front line (a drum
    // pair over the kit) is not measured from that line — height only.
    if (view !== 'front' && !(seating.viewer === 'audience' && c.z < 0)) {
      const a = uv(view, view === 'plan' ? v3(c.x, 0, c.z) : c);
      const b = uv(view, view === 'plan' ? v3(c.x, 0, 0) : v3(c.x, c.y, 0));
      const off = view === 'plan' ? 420 : -260;
      const horiz = view === 'section';
      lines.moveTo(a.u + (horiz ? 0 : off), a.v + (horiz ? off : 0));
      lines.lineTo(b.u + (horiz ? 0 : off), b.v + (horiz ? off : 0));
      tick({ u: a.u + (horiz ? 0 : off), v: a.v + (horiz ? off : 0) }, horiz);
      tick({ u: b.u + (horiz ? 0 : off), v: b.v + (horiz ? off : 0) }, horiz);
      lab.push({ id: 'dimD', text: `${fmtM(Math.abs(c.z))} ${c.z >= 0 ? 'IN FRONT' : 'BEHIND'}`, short: fmtM(Math.abs(c.z)), u: (a.u + b.u) / 2 + (horiz ? 0 : off + 110), v: (a.v + b.v) / 2 + (horiz ? off - 120 : 0), align: horiz ? 'center' : 'left', tone: 'amber' });
    }
    return { lines, lab };
  }, [rigs, dims, view, px, seating]);

  // The detail inset goes in the emptiest corner of the glass: the first
  // corner clear of the players and of the rig (sampled in the drawing). On a
  // stage that fills the glass (a full orchestra from above) no corner is
  // clear: a compact inset in the corner hiding the fewest players, never
  // over the rig.
  const fullW = Math.round(Math.min(150, w * 0.36));
  const fullH = Math.round(Math.min(110, h * 0.34));
  const corner = useMemo(() => {
    if (!detail || !rigs[0]) return null;
    const rigPts = rigPoints(rigs[0]).map((q) => uv(view, q));
    const clear = stageClearOf(seating, view, slice);
    const at = (dw: number, dh: number) => {
      const W = dw + 8;
      const H = dh + 24;
      return [
        { x0: w - W, y0: 0, x1: w, y1: H, dw, dh },
        { x0: 0, y0: 0, x1: W, y1: H, dw, dh },
        { x0: w - W, y0: h - H, x1: w, y1: h, dw, dh },
        { x0: 0, y0: h - H, x1: W, y1: h, dw, dh },
      ];
    };
    const toM = (x: number, y: number) => ({ u: (x - xf.ox) / xf.s, v: (y - xf.oy) / xf.s });
    const rigIn = (a: { u: number; v: number }, b: { u: number; v: number }) => rigPts.some((q) => q.u >= a.u && q.u <= b.u && q.v >= a.v && q.v <= b.v);
    // Players under a corner (a 16 × 10 sample of it; the rig counts as many).
    const hidden = (c: { x0: number; y0: number; x1: number; y1: number }) => {
      const a = toM(c.x0, c.y0);
      const b = toM(c.x1, c.y1);
      let n = rigIn(a, b) ? 1000 : clear(a.u, a.v, b.u, b.v) ? 0 : 1;
      for (let i = 0; i <= 16; i++)
        for (let j = 0; j <= 10; j++) if (stageHit(seating, view, a.u + ((b.u - a.u) * i) / 16, a.v + ((b.v - a.v) * j) / 10, 0, slice) != null) n++;
      return n;
    };
    for (const c of at(fullW, fullH)) if (hidden(c) === 0) return c;
    const compact = at(Math.max(112, Math.round(fullW * 0.78)), Math.max(84, Math.round(fullH * 0.78)));
    let best = compact[0];
    let bestN = Infinity;
    for (const c of compact) {
      const n = hidden(c);
      if (n < bestN) {
        bestN = n;
        best = c;
      }
    }
    return best;
  }, [detail, rigs, view, seating, slice, w, h, fullW, fullH, xf]);
  const dW = corner?.dw ?? fullW;
  const dH = corner?.dh ?? fullH;
  const laid = useMemo(() => {
    // group 2: a focused (close) frame names only the singers it frames.
    const focusSecs = p.focus ? new Set(seating.seats.filter((q) => p.focus!.includes(q.id)).map((q) => q.section)) : null;
    const art = labels ? stageLabels(seating, view, slice).filter((l) => !focusSecs || focusSecs.has(l.id)).map((l) => ({ ...l, tone: l.id === hi ? ('amber' as const) : l.tone })) : [];
    // The detail inset's corner is taken: no label sits under it.
    // Round 2 (2026-10-10): a label's words keep off the main array's stand
    // and boom too (CONDUCTOR had landed on the mast) — the rig's mast and
    // boom as segments, 250 mm either side.
    const players = stageClearOf(seating, view, slice);
    const segsOf = rigs.flatMap((r) => {
      const hw = rigHardware(r, arrayCapsules(r.id, r.params, r.place));
      const a = uv(view, v3(hw.foot.x, -380, hw.foot.z));
      const b = uv(view, hw.mastTop);
      const c = uv(view, hw.centreOfBar);
      return [[a, b], ...(hw.boom ? [[b, c]] : [])] as { u: number; v: number }[][];
    });
    const clearOf = (u0: number, v0: number, u1: number, v1: number) => {
      if (!players(u0, v0, u1, v1)) return false;
      for (const [a, b] of segsOf)
        for (let t = 0; t <= 1; t += 0.05) {
          const u = a.u + (b.u - a.u) * t;
          const v = a.v + (b.v - a.v) * t;
          if (u >= u0 - 250 && u <= u1 + 250 && v >= v0 - 250 && v <= v1 + 250) return false;
        }
      return true;
    };
    const fixed: StaticLabel[] = [...(dimG?.lab ?? []), ...singlesG.flatMap((q) => (q.dim ? [q.dim.label] : [])), ...extraLabels];
    const heads = seating.seats.filter((q) => view !== 'section' || Math.abs(q.p.x) <= slice).map((q) => uv(view, q.p).v - headTop(q));
    const planned = view === 'plan' ? art : rowLayout(art, fixed, xf, textScale, w, h, clearOf, corner ?? null, Math.min(...heads, 0), 0);
    return fitLabels([...fixed, ...planned], xf, textScale, w, undefined, corner ? [corner] : undefined, { clearOf, minY: 1, maxY: h - 1 });
  }, [labels, seating, view, slice, hi, dimG, singlesG, extraLabels, xf, textScale, w, h, corner, p.focus, rigs]);

  const press = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!onTapSection) return;
    const u = (e.nativeEvent.locationX - xf.ox) / xf.s;
    const v = (e.nativeEvent.locationY - xf.oy) / xf.s;
    const id = stageHit(seating, view, u, v, 18 / xf.s, slice);
    if (id) onTapSection(id);
  };

  const r0 = rigs[0];
  const floorV = view === 'plan' ? null : 0;
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={press} accessible={false} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={p.accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {floorV != null ? <Line p1={vec(box.u0, floorV)} p2={vec(box.u1, floorV)} color="#5d616c" strokeWidth={2 * px} /> : null}
            <SeatingView seating={seating} view={view} hi={hi} />
            {rad ? (
              <Path path={rad} style="stroke" strokeWidth={1.8 * px} color={BLUE} opacity={0.85}>
                <DashPathEffect intervals={[6 * px, 4 * px]} />
              </Path>
            ) : null}
            {view === 'plan'
              ? rings.map((r) => (
                  <Circle key={r.key} cx={r.c.x} cy={r.c.z} r={r.r} style="stroke" strokeWidth={1.8 * px} color={IDEAL} opacity={0.7}>
                    <DashPathEffect intervals={[3 * px, 5 * px]} />
                  </Circle>
                ))
              : null}
            {spill.map((q) => {
              const a = uv(view, q.from);
              const b = uv(view, q.to);
              return (
                <Line key={q.key} p1={vec(a.u, a.v)} p2={vec(b.u, b.v)} color={SPILL} strokeWidth={1.6 * px} opacity={0.9}>
                  <DashPathEffect intervals={[2 * px, 4 * px]} />
                </Line>
              );
            })}
            {zonesG.map(({ z, path }) => (
              <Group key={z.key}>
                <Path path={path} color={ZONE} opacity={z.on ? 0.3 : 0.16} />
                <Path path={path} style="stroke" strokeWidth={(z.on ? 2.4 : 1.6) * px} color={ZONE} opacity={0.9} />
              </Group>
            ))}
            {singlesG.map(({ m, metal, legs, lobe, dim }) => (
              <Group key={m.key} opacity={m.lit === false ? 0.5 : 1}>
                {dim ? <Path path={dim.path} style="stroke" strokeWidth={1.6 * px} color="#ffffff" opacity={0.92} /> : null}
                {lobes ? (
                  <>
                    <Path path={lobe} color={IDEAL} opacity={0.06} />
                    <Path path={lobe} style="stroke" strokeWidth={1.2 * px} color={IDEAL} opacity={0.75}>
                      <DashPathEffect intervals={[4 * px, 3 * px]} />
                    </Path>
                  </>
                ) : null}
                {aims ? (
                  <Line p1={vec(uv(view, m.p).u, uv(view, m.p).v)} p2={vec(uv(view, m.p).u + uvDir(view, m.dir).u * (m.aimLen ?? 1300), uv(view, m.p).v + uvDir(view, m.dir).v * (m.aimLen ?? 1300))} color={AMBER} strokeWidth={1.5 * px} opacity={0.85}>
                    <DashPathEffect intervals={[6 * px, 4 * px]} />
                  </Line>
                ) : null}
                <Path path={legs} style="stroke" strokeWidth={Math.max(20, 3 * px)} strokeCap="round" color="#0b0c0f" />
                <Path path={legs} style="stroke" strokeWidth={Math.max(12, 1.8 * px)} strokeCap="round" color="#5b5f69" />
                <Path path={metal} style="stroke" strokeWidth={Math.max(22, 3 * px)} strokeCap="round" color="#0b0c0f" />
                <Path path={metal} style="stroke" strokeWidth={Math.max(13, 1.8 * px)} strokeCap="round" color="#9aa0ab" />
                <Group transform={micXf(view, m.p, m.dir)}>
                  <MikingMicArt art={m.art ?? 'sdc'} r={micSize(m).r} len={micSize(m).len} cross={m.cross ?? micSize(m).r * 2} />
                </Group>
                <Circle cx={uv(view, m.p).u} cy={uv(view, m.p).v} r={5 * px} color={AMBER} opacity={0.9} />
              </Group>
            ))}
            {rigs.map((r) => (
              <ArrayRig key={r.key} spec={r} view={view} px={px} lobes={lobes} aims={aims} wedge={wedge} lit={r.lit !== false} aimLen={view === 'plan' ? 2600 : 1800} />
            ))}
            {/* The array's centre: an amber RING (a filled dot hid the capsules under it). */}
            {r0 ? <Circle cx={uv(view, r0.place.c).u} cy={uv(view, r0.place.c).v} r={5 * px} style="stroke" strokeWidth={1.6 * px} color={AMBER} opacity={0.9} /> : null}
            {dimG ? <Path path={dimG.lines} style="stroke" strokeWidth={1.6 * px} color="#ffffff" opacity={0.92} /> : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={laid} xf={xf} scale={textScale} w={w} laidOut />
      {detail && r0 ? (
        <View pointerEvents="none" style={[styles.detail, { width: dW, height: dH + 16, left: (corner?.x0 ?? w - dW - 8) + 4, top: (corner?.y0 ?? 0) + 4 }]}>
          <Text style={styles.detailHead} {...fitValue(9)}>
            {dW < 140 ? 'TRUE SHAPE' : 'THE ARRAY · TRUE SHAPE'}
          </Text>
          <ArrayDetail w={dW - 4} h={dH} id={r0.id} params={r0.params} />
        </View>
      ) : null}
      {p.children}
    </View>
  );
}

const styles = StyleSheet.create({
  detail: { position: 'absolute', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,0.45)', backgroundColor: 'rgba(8,9,12,0.86)', paddingHorizontal: 2, paddingTop: 2 },
  detailHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1, textAlign: 'center' },
});
