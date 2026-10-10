/**
 * THE CYMBAL LESSONS' SCENE — the shared kit drawn around one cymbal, from
 * the shared families only (drums/DrumArt, cymbals/CymbalArt, the kit
 * scene's drummer keep-outs), at the Kick's illustration standard. A lesson
 * picks the kit pieces it shows (and dims), and draws its own cymbal on top,
 * lit, with its keep-outs:
 *
 *   KitAround      side or top: the kit's pieces in depth order, each dimmed
 *                  as the lesson asks; `own` slots the lesson's cymbal in at
 *                  its depth (side) or last (top), so nearer parts cover it.
 *   PlateSide      a plate's profile (any height function, upright or
 *                  inverted): the splash on top of a crash, the China.
 *   MountStack     tilter, felts, sleeve and wing nut for a stack of plates.
 *   AirRing        the hi-hats' air burst: a dashed band round the pair.
 *   SwingFan       the ± swing at a plate's edge (side view).
 *   PlanStick      the stick from the player's side to a strike point.
 *
 * Nothing moves (D8); static paths are built once per argument set. All
 * coordinates are millimetres of the view's (u, v): side u = x, v = y; top
 * u = x, v = z (the kit frame K).
 */
import { useMemo, type ReactNode } from 'react';
import { BlurMask, Circle, DashPathEffect, FillType, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import { KIT, KIT_DRUMS, KIT_FLOOR_Y, yAt, type KitDrumId } from '../kitPlanModel.ts';
import { DrumExterior, DrumPlan, FloorTomLegsSide, KickFromAbove, KickSideNeighbour, SnareStandSide, Stick, sideTransform, topTransform } from '../drums/DrumArt';
import { KICK_22x18, frameOf, pointOn } from '../drums/drumSpec.ts';
import { BoomStandSide, BoomStandTop, CymbalSide, CymbalTop, HiHatSide, HiHatTop } from './CymbalArt';
import { CYMBAL_HARDWARE as HW, CYMBAL_SWING, KIT_PLACED_CYMBALS, type CymbalSpec } from './cymbalSpec.ts';
import { DrummerKeepOut } from '../kitScene/KitSceneArt';
import { KICK_GEOM } from '../../m01Kick/geometry.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const DEG = Math.PI / 180;
const INK = '#08080a';
const BRONZE = ['#fbe3a6', '#e2b25c', '#b9852f', '#80561a', '#4f3410'];
const BRONZE_EDGE = '#5e3e12';
const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];
const FELT = ['#4a3b52', '#2a2230', '#17121b'];
const make = () => Skia.Path.Make();
function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function seg(p: SkPath, a: number, b: number, c: number, d: number) {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}

export type KitPiece = 'hihat' | 'crash1' | 'crash2' | 'ride' | KitDrumId | 'kick' | 'holder' | 'drummer';
/** Depth (z) of each piece in the side view: far (−z) first. */
const DEPTH: Readonly<Record<KitPiece, number>> = {
  hihat: KIT_PLACED_CYMBALS.hihat.c.z,
  crash1: KIT_PLACED_CYMBALS.crash1.c.z,
  snare: KIT_DRUMS.snare.c.z,
  tom1: KIT_DRUMS.tom1.c.z,
  holder: -110,
  kick: 0,
  tom2: KIT_DRUMS.tom2.c.z,
  crash2: KIT_PLACED_CYMBALS.crash2.c.z,
  floor: KIT_DRUMS.floor.c.z,
  ride: KIT_PLACED_CYMBALS.ride.c.z,
  drummer: 2000,
};

/* ── the pieces ── */

function DrumSidePiece({ id }: { id: KitDrumId }) {
  const d = KIT_DRUMS[id];
  if (id === 'snare') {
    const basket = d.c.y + d.spec.depth.mm + d.spec.hoop.above.mm;
    return (
      <Group>
        <SnareStandSide cx={d.c.x} basketY={basket} hoopR={d.spec.d.mm / 2} floorY={KIT_FLOOR_Y} armsDeg={[180, 0]} />
        <Group transform={sideTransform(d)}>
          <DrumExterior spec={d.spec} />
        </Group>
      </Group>
    );
  }
  if (id === 'floor') {
    return (
      <Group transform={sideTransform(d)}>
        <FloorTomLegsSide spec={d.spec} floorS={KIT_FLOOR_Y - d.c.y} />
        <DrumExterior spec={d.spec} />
      </Group>
    );
  }
  return (
    <Group transform={sideTransform(d)}>
      <DrumExterior spec={d.spec} />
    </Group>
  );
}

let holder: { post: SkPath; arms: SkPath; head: { x: number; y: number }; armsTop: SkPath } | null = null;
function holderPaths() {
  if (holder) return holder;
  const top = { x: 230, y: -KICK_GEOM.R };
  const head = { x: 230, y: yAt(780) };
  const post = seg(make(), top.x, top.y, head.x, head.y);
  const arms = make();
  const armsTop = make();
  for (const id of ['tom1', 'tom2'] as const) {
    const d = KIT_DRUMS[id];
    const e = pointOn(frameOf(d), d.spec.d.mm / 2 + 10, 0, d.spec.depth.mm * 0.5);
    seg(arms, head.x, head.y, e.x, e.y);
    seg(armsTop, 230, -110, e.x, e.z);
  }
  holder = { post, arms, head, armsTop };
  return holder;
}
function HolderSide() {
  const p = holderPaths();
  return (
    <Group>
      <Path path={p.post} style="stroke" strokeWidth={24} strokeCap="round" color="#16171b" />
      <Path path={p.post} style="stroke" strokeWidth={17} strokeCap="round" color="#8a8f99" />
      <Path path={p.arms} style="stroke" strokeWidth={17} strokeCap="round" color="#16171b" />
      <Path path={p.arms} style="stroke" strokeWidth={11} strokeCap="round" color="#aeb3bd" />
      <Circle cx={p.head.x} cy={p.head.y} r={20} color="#2a2c32" />
    </Group>
  );
}
function HolderTop() {
  const p = holderPaths();
  return (
    <Group>
      <Path path={p.armsTop} style="stroke" strokeWidth={15} strokeCap="round" color="#16171b" />
      <Path path={p.armsTop} style="stroke" strokeWidth={10} strokeCap="round" color="#8a8f99" />
      <Circle cx={230} cy={-110} r={22} color="#1b1c21" />
      <Circle cx={230} cy={-110} r={22} style="stroke" strokeWidth={4} color="#b6bbc5" />
    </Group>
  );
}

function SidePiece({ id }: { id: KitPiece }) {
  switch (id) {
    case 'hihat':
      return <HiHatSide />;
    case 'crash1':
    case 'crash2':
    case 'ride': {
      const p = KIT_PLACED_CYMBALS[id];
      return (
        <Group>
          <BoomStandSide id={id} />
          <CymbalSide spec={p.spec} cx={p.c.x} cy={p.c.y} tiltDeg={p.tiltDeg} />
        </Group>
      );
    }
    case 'kick':
      return <KickSideNeighbour spec={KICK_22x18} x0={0} cy={0} dim={1} />;
    case 'holder':
      return <HolderSide />;
    case 'drummer':
      return <DrummerKeepOut view="side" reach={false} />;
    default:
      return <DrumSidePiece id={id} />;
  }
}

function TopPiece({ id }: { id: KitPiece }) {
  switch (id) {
    case 'hihat':
      return <HiHatTop />;
    case 'crash1':
    case 'crash2':
    case 'ride': {
      const p = KIT_PLACED_CYMBALS[id];
      return (
        <Group>
          <BoomStandTop id={id} />
          <CymbalTop spec={p.spec} cx={p.c.x} cz={p.c.z} tiltDeg={p.tiltDeg} />
        </Group>
      );
    }
    case 'kick':
      return <KickFromAbove spec={KICK_22x18} u0={0} z={0} pedal={KIT.kick.pedal} />;
    case 'holder':
      return <HolderTop />;
    case 'drummer':
      return <DrummerKeepOut view="top" reach={false} />;
    default: {
      const d = KIT_DRUMS[id];
      return (
        <Group transform={topTransform(d)}>
          <DrumPlan drum={d} />
        </Group>
      );
    }
  }
}

/** Top-view order: low to high (drums, then the cymbals hanging above). */
const TOP_ORDER: KitPiece[] = ['kick', 'floor', 'snare', 'holder', 'tom1', 'tom2', 'hihat', 'ride', 'crash1', 'crash2', 'drummer'];

/**
 * The kit around the lesson's cymbal. `show`: the pieces and their dims
 * (0–1). `own`: the lesson's cymbal drawing and its depth (side) — drawn
 * between the pieces behind and in front of it.
 */
export function KitAround({ view, show, own, ownZ }: { view: ViewId; show: Partial<Record<KitPiece, number>>; own?: ReactNode; ownZ?: number }) {
  const ids = (Object.keys(show) as KitPiece[]).filter((k) => (show[k] ?? 0) > 0);
  if (view === 'side') {
    const items: { z: number; node: ReactNode; key: string }[] = ids.map((k) => ({ z: DEPTH[k], key: k, node: <Group key={k} opacity={show[k]}><SidePiece id={k} /></Group> }));
    if (own) items.push({ z: ownZ ?? 0, key: 'own', node: <Group key="own">{own}</Group> });
    items.sort((a, b) => a.z - b.z);
    return <Group>{items.map((i) => i.node)}</Group>;
  }
  const ordered = TOP_ORDER.filter((k) => ids.includes(k));
  return (
    <Group>
      {ordered.map((k) => (
        <Group key={k} opacity={show[k]}>
          <TopPiece id={k} />
        </Group>
      ))}
      {own}
    </Group>
  );
}

/* ── a plate from the side (any profile, either way up) ── */

const plateCache = new Map<string, { plate: SkPath; rim: SkPath; lathe: SkPath }>();
/**
 * A plate's profile from the side, in its own frame (edge plane at y = 0,
 * its top face up the screen); `height(r)` is the top surface above the edge
 * plane; `inverted` turns it over (heights negated).
 */
export function PlateSide({ spec, height, inverted = false, keyId, lip = false }: { spec: CymbalSpec; height: (r: number) => number; inverted?: boolean; keyId: string; lip?: boolean }) {
  const key = `${keyId}:${inverted ? 1 : 0}`;
  let g = plateCache.get(key);
  if (!g) {
    const R = spec.d.mm / 2;
    const T = spec.drawT.mm;
    const s = inverted ? 1 : -1;
    const N = 96;
    const plate = make();
    for (let i = 0; i <= N; i++) {
      const x = -R + (2 * R * i) / N;
      const y = s * height(x);
      if (i === 0) plate.moveTo(x, y);
      else plate.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const x = -R + (2 * R * i) / N;
      plate.lineTo(x, s * (height(x) - T));
    }
    plate.close();
    const rim = make();
    for (let i = 0; i <= N / 2; i++) {
      const x = -R + ((R * i) / (N / 2)) * 0.96;
      const y = s * height(x) + (inverted ? 0.6 : -0.6);
      if (i === 0) rim.moveTo(x, y);
      else rim.lineTo(x, y);
    }
    const lathe = make();
    const bellR = spec.bellD.mm / 2;
    for (let x = -R + 8; x < R - 5; x += 8) {
      if (Math.abs(x) < bellR) continue;
      const y = s * height(x);
      seg(lathe, x, y - s * 0.2, x, y - s * (T - 0.6));
    }
    g = { plate, rim, lathe };
    plateCache.set(key, g);
  }
  const R = spec.d.mm / 2;
  return (
    <Group>
      <Path path={g.plate}>
        <LinearGradient start={vec(-R, -spec.rise.mm)} end={vec(R, spec.rise.mm * 0.4)} colors={lip ? ['#f1d79a', '#c9a052', '#9a6c26', '#6a4614', '#3e2a0c'] : BRONZE} positions={[0, 0.22, 0.5, 0.78, 1]} />
      </Path>
      <Path path={g.lathe} style="stroke" strokeWidth={0.7} color="#fff1c6" opacity={0.28} />
      <Path path={g.rim} style="stroke" strokeWidth={1.1} color="#fff6dc" opacity={0.75} />
      <Path path={g.plate} style="stroke" strokeWidth={0.9} color={BRONZE_EDGE} />
    </Group>
  );
}

/**
 * The mounting stack, local to a cymbal frame (y up the screen = −y): the
 * tilter and bottom felt under `seat` (the bottom felt's top), then the top
 * felt on `top` (the uppermost plate's top at the centre) with the wing nut.
 */
export function MountStack({ seat, top }: { seat: number; top: number }) {
  const g = useMemo(() => {
    const fT = HW.feltT.mm;
    const fR = HW.feltD.mm / 2;
    const bottom = rrect(make(), -fR, seat, fR, seat + fT, 2.5);
    const tilter = rrect(make(), -HW.tilterD.mm / 2, seat + fT, HW.tilterD.mm / 2, seat + fT + HW.tilterH.mm, 4);
    const topFelt = rrect(make(), -fR, top - fT, fR, top, 2.5);
    const sleeve = rrect(make(), -HW.sleeve.mm / 2, top - fT - 3, HW.sleeve.mm / 2, seat + fT + 2, 1.5);
    const rod = rrect(make(), -HW.rod.mm / 2, top - fT - HW.wingH.mm - 6, HW.rod.mm / 2, seat + fT + HW.tilterH.mm, 1);
    const w = HW.wingW.mm / 2;
    const wy = top - fT;
    const wing = make();
    wing.moveTo(-5, wy);
    wing.cubicTo(-w, wy - 2, -w - 2, wy - HW.wingH.mm, -w * 0.55, wy - HW.wingH.mm);
    wing.cubicTo(-w * 0.3, wy - HW.wingH.mm, -6, wy - HW.wingH.mm * 0.45, -5, wy - 6);
    wing.lineTo(5, wy - 6);
    wing.cubicTo(6, wy - HW.wingH.mm * 0.45, w * 0.3, wy - HW.wingH.mm, w * 0.55, wy - HW.wingH.mm);
    wing.cubicTo(w + 2, wy - HW.wingH.mm, w, wy - 2, 5, wy);
    wing.close();
    return { bottom, tilter, topFelt, sleeve, rod, wing };
  }, [seat, top]);
  return (
    <Group>
      <Path path={g.rod} color="#6c717c" />
      <Path path={g.tilter}>
        <LinearGradient start={vec(-HW.tilterD.mm / 2, 0)} end={vec(HW.tilterD.mm / 2, 0)} colors={CHROME} />
      </Path>
      <Path path={g.tilter} style="stroke" strokeWidth={0.7} color={INK} />
      <Path path={g.bottom}>
        <LinearGradient start={vec(0, seat)} end={vec(0, seat + 12)} colors={FELT} />
      </Path>
      <Path path={g.sleeve} color="#d8dbe0" opacity={0.85} />
      <Path path={g.topFelt}>
        <LinearGradient start={vec(0, top - 10)} end={vec(0, top)} colors={FELT} />
      </Path>
      <Path path={g.wing}>
        <LinearGradient start={vec(-HW.wingW.mm / 2, 0)} end={vec(HW.wingW.mm / 2, 0)} colors={CHROME} />
      </Path>
      <Path path={g.wing} style="stroke" strokeWidth={0.7} color={INK} />
    </Group>
  );
}

/** The ± swing at a plate's edge from the side (local frame): a translucent
 *  fan, the space a mic keeps clear of. */
export function SwingFan({ R, rise }: { R: number; rise: number }) {
  const fan = useMemo(() => {
    const p = make();
    const a = Math.atan2(CYMBAL_SWING.mm, R);
    for (const s of [-1, 1]) {
      p.moveTo(0, 0);
      p.lineTo(s * R * Math.cos(a), -R * Math.sin(a) - rise * 0.2);
      p.lineTo(s * R * Math.cos(a), R * Math.sin(a));
      p.close();
    }
    return p;
  }, [R, rise]);
  return (
    <Group>
      <Path path={fan} color="#8a8f9c" opacity={0.14} />
      <Path path={fan} style="stroke" strokeWidth={1.6} color="#8a8f9c" opacity={0.55}>
        <DashPathEffect intervals={[8, 6]} />
      </Path>
    </Group>
  );
}

/** A cymbal's local frame as a Skia transform (side view): its edge-plane
 *  centre, tilted toward the drummer. */
export const plateTransform = (c: { x: number; y: number }, tiltDeg: number) => [{ translateX: c.x }, { translateY: c.y }, { rotate: -tiltDeg * DEG }];

/**
 * The hi-hats' air burst (DPA: air "moving out from the sides" as the pair
 * closes): side view, a dashed band beside each edge; top view, a dashed
 * ring round the pair. Its size is the family's drawing default (60 mm wide,
 * 30 mm above the top cymbal).
 */
export function AirRing({ view, cx, cy, cz, R, width, above, below }: { view: ViewId; cx: number; cy: number; cz: number; R: number; width: number; above: number; below: number }) {
  const g = useMemo(() => {
    const q = make();
    const arrows = make();
    if (view === 'side') {
      // A soft puff beside each edge (an ellipse in the band), an arrow outward.
      const mid = cy + (below - above) / 2;
      const ry = (above + below) / 2;
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? cx - R - width : cx + R;
        q.addOval(Skia.XYWHRect(x0, mid - ry, width, 2 * ry));
        const ax = cx + s * (R + width * 0.2);
        const bx = cx + s * (R + width * 0.85);
        seg(arrows, ax, mid, bx, mid);
        seg(arrows, bx, mid, bx - s * 10, mid - 7);
        seg(arrows, bx, mid, bx - s * 10, mid + 7);
      }
    } else {
      q.addCircle(cx, cz, R + width);
      q.addCircle(cx, cz, R);
      q.setFillType(FillType.EvenOdd); // the ring only
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + Math.PI / 8;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const ax = cx + c * (R + width * 0.2);
        const az = cz + sn * (R + width * 0.2);
        const bx = cx + c * (R + width * 0.85);
        const bz = cz + sn * (R + width * 0.85);
        seg(arrows, ax, az, bx, bz);
        seg(arrows, bx, bz, bx - c * 10 - sn * 7, bz - sn * 10 + c * 7);
        seg(arrows, bx, bz, bx - c * 10 + sn * 7, bz - sn * 10 - c * 7);
      }
    }
    return { q, arrows };
  }, [view, cx, cy, cz, R, width, above, below]);
  return (
    <Group>
      <Path path={g.q} color="#9cc4ff" opacity={0.2}>
        <BlurMask blur={6} style="normal" />
      </Path>
      <Path path={g.q} style="stroke" strokeWidth={2} color="#9cc4ff" opacity={0.6}>
        <DashPathEffect intervals={[8, 6]} />
      </Path>
      <Path path={g.arrows} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" color="#bcd8ff" opacity={0.85} />
    </Group>
  );
}

/** The stick, from the player's side to a strike point (side or top view). */
type Pt2 = { x: number; y: number };
/** A lesson's drawn stick (its from → to in the view, or null), as label
 *  occupancy (LessonArt.figureAt): the part labels keep off the stick — they
 *  sat on it and its leaders ran through it (clash sweep 2026-10-10). Taps are
 *  unchanged. */
export function stickFigureAt(seg: (view: ViewId, variant: VariantId) => { from: Pt2; to: Pt2 } | null) {
  return (view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean => {
    const s = seg(view, variant);
    if (!s) return false;
    const dx = s.to.x - s.from.x;
    const dy = s.to.y - s.from.y;
    const t = Math.max(0, Math.min(1, ((u - s.from.x) * dx + (v - s.from.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(u - (s.from.x + t * dx), v - (s.from.y + t * dy)) <= 10 + tol;
  };
}

export function StickTo({ to, from, dim = 1 }: { to: { x: number; y: number }; from: { x: number; y: number }; dim?: number }) {
  return <Stick from={from} to={to} dim={dim} />;
}

/** A soft amber ring round a cymbal seen from above (its plan ellipse). */
export function PlanRing({ cx, cz, R, tiltDeg }: { cx: number; cz: number; R: number; tiltDeg: number }) {
  const ct = Math.cos(tiltDeg * DEG);
  const p = useMemo(() => {
    const q = make();
    q.addOval(Skia.XYWHRect(cx - (R + 40) * ct, cz - (R + 40), 2 * (R + 40) * ct, 2 * (R + 40)));
    return q;
  }, [cx, cz, R, ct]);
  return <Path path={p} style="stroke" strokeWidth={9} color="#ffc64d" />;
}

/** A small contact shadow under a plate from above. */
export function PlanShadow({ cx, cz, R }: { cx: number; cz: number; R: number }) {
  return (
    <Circle cx={cx + 14} cy={cz + 20} r={R} color="#000" opacity={0.42}>
      <BlurMask blur={18} style="normal" />
    </Circle>
  );
}

/** A soft amber glow behind the lesson's own cymbal from the side, so the
 *  learner finds it at once among the dimmed kit (local frame: the edge
 *  plane, tilted). */
export function PlateGlow({ c, tiltDeg, R, rise }: { c: { x: number; y: number }; tiltDeg: number; R: number; rise: number }) {
  const p = useMemo(() => {
    const q = make();
    q.moveTo(-R, 0);
    q.quadTo(0, -rise * 1.6, R, 0);
    return q;
  }, [R, rise]);
  return (
    <Group transform={plateTransform(c, tiltDeg)}>
      <Path path={p} style="stroke" strokeWidth={46} strokeCap="round" color="#ffc64d" opacity={0.16}>
        <BlurMask blur={16} style="normal" />
      </Path>
    </Group>
  );
}

const ALL_PIECES: readonly KitPiece[] = ['hihat', 'crash1', 'crash2', 'ride', 'snare', 'tom1', 'tom2', 'floor', 'kick', 'holder'];
/** The whole kit, faint (`base`), with the lesson's neighbours brighter and
 *  its own cymbal (`omit`) left for the lesson to draw — so a wide view
 *  (studio or live) still shows the kit around the cymbal. */
export function kitShow(omit: readonly KitPiece[], near: Partial<Record<KitPiece, number>>, base = 0.32): Partial<Record<KitPiece, number>> {
  const out: Partial<Record<KitPiece, number>> = {};
  for (const k of ALL_PIECES) if (!omit.includes(k)) out[k] = near[k] ?? base;
  return out;
}
