/**
 * F15 — the GUARDED DESK FAN, drawn (charter §2 layer 3), and its room:
 *
 *   FanSide / FanTop   the fan in profile and from above: the domed wire
 *                      guard (front and rear grilles meeting at the rim),
 *                      the blades edge-on inside it, the hub cap, the motor
 *                      housing with its rear vent, the tilt joint, the column
 *                      and the round base; the contact sensor on the housing
 *   FanFront           the face the user sees: the guard's rings and radial
 *                      wires, the three blades behind them, the hub badge,
 *                      the column and the base (MEET IT's figure)
 *   FanScene           the scene: the floor, the wall behind, the table, the
 *                      fan, the exclusion zone (red dashes) and the airflow
 *                      (a pale cone), you standing back
 *
 * Generic: no maker's likeness. Sizes from geometry.ts (drawing defaults).
 * Nothing moves — the blades are drawn at rest.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../engine/model/types.ts';
import { make, Operator, rectP } from '../shared/measure/MeasureArt';
import { ContactSensor } from '../shared/measure/SensorArt';
import { flowRadius, flowStart, zoneRadius } from '../shared/measure/exclusion.ts';
import { EXCL, F15_OP_SIDE, F15_OP_TOP, F15_VIEWS, FAN, HUB, TABLE, WALL_X } from './geometry.ts';

const EDGE = '#07080a';
const F = FAN;

/* ── the fan in profile ('side': x along the airflow, y down) or from above ('top': x, z) ── */

function buildFan(view: ViewId) {
  const c = view === 'side' ? HUB.y : 0;
  const R = F.guardR;
  // The guard: the front grille domes out to guardFront, the rear grille back to guardBack; they meet at the rim.
  const guard = make();
  guard.moveTo(F.guardRim, c - R);
  guard.cubicTo(F.guardFront * 0.9, c - R * 0.95, F.guardFront + 4, c - R * 0.45, F.guardFront, c);
  guard.cubicTo(F.guardFront + 4, c + R * 0.45, F.guardFront * 0.9, c + R * 0.95, F.guardRim, c + R);
  guard.cubicTo(F.guardBack * 0.6, c + R * 0.95, F.guardBack - 4, c + R * 0.45, F.guardBack, c);
  guard.cubicTo(F.guardBack - 4, c - R * 0.45, F.guardBack * 0.6, c - R * 0.95, F.guardRim, c - R);
  guard.close();
  // Its wires seen from the side: curves from the rim toward the hub, front and back.
  const wires = make();
  for (const k of [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75]) {
    wires.moveTo(F.guardRim, c + k * R);
    wires.quadTo(F.guardFront * 0.85, c + k * R * 0.9, F.guardFront - 2, c + k * R * 0.35);
    wires.moveTo(F.guardRim, c + k * R);
    wires.quadTo(F.guardBack * 0.7, c + k * R * 0.9, F.guardBack + 2, c + k * R * 0.35);
  }
  const rim = make();
  rim.moveTo(F.guardRim, c - R - 4);
  rim.lineTo(F.guardRim, c + R + 4);
  // The blades edge-on, pitched: a thin slanted lens across the cage.
  const blades = make();
  blades.moveTo(-6, c - R * 0.88);
  blades.cubicTo(22, c - R * 0.5, 4, c + R * 0.4, 30, c + R * 0.88);
  blades.lineTo(20, c + R * 0.88);
  blades.cubicTo(-6, c + R * 0.4, 12, c - R * 0.5, -16, c - R * 0.88);
  blades.close();
  const hub = make();
  hub.addOval({ x: F.guardFront - 30, y: c - 28, width: 34, height: 56 });
  // The motor housing behind the rear grille, its rear vent slots.
  const motor = rectP(make(), F.motorBack, c - F.motorR, F.guardBack + 6, c + F.motorR, F.motorR * 0.75);
  const vent = make();
  for (const k of [-0.5, -0.25, 0, 0.25, 0.5]) rectP(vent, F.motorBack - 2, c + k * F.motorR * 1.2 - 5, F.motorBack + 10, c + k * F.motorR * 1.2 + 5, 3);
  // The tilt joint, the column and the base (side view); from above, the base disc under it all.
  const column = make();
  const base = make();
  if (view === 'side') {
    const jx = (F.motorBack + F.guardBack) / 2;
    column.addCircle(jx, c + F.motorR + 18, 22);
    rectP(column, jx - 12, c + F.motorR + 30, jx + 12, -F.baseH, 6);
    base.moveTo(-F.baseR, 0);
    base.cubicTo(-F.baseR, -F.baseH * 1.2, -F.baseR * 0.6, -F.baseH * 1.4, 0, -F.baseH * 1.4);
    base.cubicTo(F.baseR * 0.6, -F.baseH * 1.4, F.baseR, -F.baseH * 1.2, F.baseR, 0);
    base.close();
  } else {
    base.addCircle(0, 0, F.baseR);
  }
  return { guard, wires, rim, blades, hub, motor, vent, column, base };
}

export function FanBody({ view, sensor = true }: { view: ViewId; sensor?: boolean }) {
  const p = useMemo(() => buildFan(view), [view]);
  const c = view === 'side' ? HUB.y : 0;
  return (
    <Group>
      <Path path={p.base}>
        <LinearGradient start={vec(-F.baseR, -40)} end={vec(F.baseR, 10)} colors={['#e3e6eb', '#9aa0aa', '#4a4e57']} />
      </Path>
      <Path path={p.base} style="stroke" strokeWidth={3} color={EDGE} />
      <Path path={p.column}>
        <LinearGradient start={vec(-80, 0)} end={vec(-40, 0)} colors={['#d0d4db', '#7a7f89', '#3a3d44']} />
      </Path>
      <Group transform={[{ translateX: -6 }, { translateY: 10 }]}>
        <Path path={p.motor} color="#000" opacity={0.4}>
          <BlurMask blur={12} style="normal" />
        </Path>
      </Group>
      <Path path={p.motor}>
        <LinearGradient start={vec(0, c - F.motorR)} end={vec(0, c + F.motorR)} colors={['#f0f2f5', '#b4b9c2', '#5d626b']} />
      </Path>
      <Path path={p.vent} color="#1a1c20" />
      <Path path={p.motor} style="stroke" strokeWidth={3} color={EDGE} />
      <Path path={p.blades}>
        <LinearGradient start={vec(0, c - F.guardR)} end={vec(0, c + F.guardR)} colors={['#9cc4e8', '#4f7aa6', '#24405e']} />
      </Path>
      <Path path={p.blades} style="stroke" strokeWidth={2} color="#0e1a26" />
      <Path path={p.hub}>
        <RadialGradient c={vec(F.guardFront - 18, c - 10)} r={34} colors={['#f4f5f7', '#9aa0aa', '#555a63']} />
      </Path>
      <Path path={p.guard} color="#c8ccd3" opacity={0.06} />
      <Path path={p.wires} style="stroke" strokeWidth={2.2} color="#c9ced6" opacity={0.85} />
      <Path path={p.guard} style="stroke" strokeWidth={4} color="#d7dbe2" />
      <Path path={p.guard} style="stroke" strokeWidth={1.4} color={EDGE} opacity={0.7} />
      <Path path={p.rim} style="stroke" strokeWidth={7} strokeCap="round" color="#e4e7ec" />
      {sensor && view === 'side' ? <ContactSensor x={(F.motorBack + F.guardBack) / 2 - 10} y={c - F.motorR + 4} s={34} /> : null}
      {sensor && view === 'top' ? <Circle cx={(F.motorBack + F.guardBack) / 2 - 10} cy={0} r={12} color="#c7ccd4" /> : null}
    </Group>
  );
}

/* ── the fan face-on: MEET IT's figure ── */

/** The face of the fan, centred at (cx, cy), guard radius `r` (drawn in the caller's units). */
export function FanFront({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const p = useMemo(() => {
    const rings = make();
    for (const k of [0.32, 0.55, 0.78, 1]) rings.addCircle(cx, cy, r * k);
    const spokes = make();
    for (let i = 0; i < 28; i++) {
      const a = (i * Math.PI * 2) / 28;
      spokes.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
      spokes.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    const blades = make();
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      const b = make();
      // A swept blade: a narrow root on the hub, the leading edge bowing
      // forward, a broad rounded tip, the trailing edge swept back.
      const at = (t: number, k: number) => ({ x: cx + Math.cos(a + t) * r * k, y: cy + Math.sin(a + t) * r * k });
      const root0 = at(-0.32, 0.19);
      const root1 = at(0.38, 0.19);
      const lead = at(-0.05, 0.6);
      const tip0 = at(0.12, 0.86);
      const tipC = at(0.5, 0.93);
      const tip1 = at(0.86, 0.8);
      const trail = at(0.78, 0.45);
      b.moveTo(root0.x, root0.y);
      b.quadTo(lead.x, lead.y, tip0.x, tip0.y);
      b.quadTo(tipC.x, tipC.y, tip1.x, tip1.y);
      b.quadTo(trail.x, trail.y, root1.x, root1.y);
      b.close();
      blades.addPath(b);
    }
    const column = rectP(make(), cx - r * 0.07, cy + r * 1.02, cx + r * 0.07, cy + r * 1.95, r * 0.03);
    const base = make();
    base.addOval({ x: cx - r * 0.75, y: cy + r * 1.88, width: r * 1.5, height: r * 0.28 });
    return { rings, spokes, blades, column, base };
  }, [cx, cy, r]);
  return (
    <Group>
      <Path path={p.base}>
        <LinearGradient start={vec(cx - r, cy + r * 1.9)} end={vec(cx + r, cy + r * 2.1)} colors={['#e3e6eb', '#8a909a', '#3f434a']} />
      </Path>
      <Path path={p.column}>
        <LinearGradient start={vec(cx - r * 0.07, 0)} end={vec(cx + r * 0.07, 0)} colors={['#d0d4db', '#6a6f79']} />
      </Path>
      <Circle cx={cx} cy={cy} r={r} color="#101318" />
      <Path path={p.blades}>
        <RadialGradient c={vec(cx - r * 0.3, cy - r * 0.3)} r={r * 1.2} colors={['#a8cdf0', '#4f7aa6', '#203a56']} />
      </Path>
      <Path path={p.blades} style="stroke" strokeWidth={r * 0.012} color="#0e1a26" />
      <Path path={p.spokes} style="stroke" strokeWidth={r * 0.008} color="#d4d8df" opacity={0.85} />
      <Path path={p.rings} style="stroke" strokeWidth={r * 0.012} color="#e1e4ea" opacity={0.9} />
      <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={r * 0.03} color="#e8ebf0" />
      <Circle cx={cx} cy={cy} r={r * 0.17}>
        <RadialGradient c={vec(cx - r * 0.06, cy - r * 0.06)} r={r * 0.2} colors={['#f6f7f9', '#a3a8b1', '#4d515a']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.17} style="stroke" strokeWidth={r * 0.012} color={EDGE} />
    </Group>
  );
}

/* ── the scene ── */

function buildRoom(view: ViewId) {
  const b = F15_VIEWS[view];
  const floor = make();
  const wall = make();
  const table = make();
  const legs = make();
  const zone = make();
  const flow = make();
  const R = zoneRadius(EXCL);
  const s = flowStart(EXCL);
  const end = s.x + EXCL.flowLen;
  const rEnd = flowRadius(EXCL, EXCL.flowLen);
  if (view === 'side') {
    rectP(floor, b.u0 - 200, TABLE.floor, b.u1 + 200, TABLE.floor + 60);
    rectP(wall, WALL_X - 200, b.v0 - 200, WALL_X, TABLE.floor + 60);
    rectP(table, -TABLE.half, TABLE.top, TABLE.half, TABLE.top + TABLE.slab, 8);
    rectP(legs, -TABLE.half + 20, TABLE.slab, -TABLE.half + 60, TABLE.floor, 4);
    rectP(legs, TABLE.half - 60, TABLE.slab, TABLE.half - 20, TABLE.floor, 4);
    rectP(zone, -R, HUB.y - R, R, TABLE.top, 30);
    flow.moveTo(s.x, s.y - EXCL.guardR);
    flow.lineTo(end, s.y - rEnd);
    flow.lineTo(end, s.y + rEnd);
    flow.lineTo(s.x, s.y + EXCL.guardR);
    flow.close();
  } else {
    rectP(floor, b.u0 - 200, b.v0 - 200, b.u1 + 200, b.v1 + 200);
    rectP(wall, WALL_X - 200, b.v0 - 200, WALL_X, b.v1 + 200);
    rectP(table, -TABLE.half, -TABLE.half, TABLE.half, TABLE.half, 18);
    zone.addCircle(HUB.x, HUB.z, R);
    flow.moveTo(s.x, -EXCL.guardR);
    flow.lineTo(end, -rEnd);
    flow.lineTo(end, rEnd);
    flow.lineTo(s.x, EXCL.guardR);
    flow.close();
  }
  return { floor, wall, table, legs, zone, flow, end, rEnd };
}

/** The keep-outs drawn: the zone in red dashes, the airflow as a pale cone. */
export function KeepOuts({ view, px = 1 }: { view: ViewId; px?: number }) {
  const p = useMemo(() => buildRoom(view), [view]);
  const s = flowStart(EXCL);
  const cy = view === 'side' ? s.y : 0;
  return (
    <Group>
      <Path path={p.flow}>
        <LinearGradient start={vec(s.x, cy)} end={vec(p.end, cy)} colors={['rgba(127,212,255,0.22)', 'rgba(127,212,255,0.02)']} />
      </Path>
      <Path path={p.zone} color="#ff6b5e" opacity={0.07} />
      <Path path={p.zone} style="stroke" strokeWidth={Math.max(6, 2 * px)} color="#ff6b5e" opacity={0.85}>
        <DashPathEffect intervals={[Math.max(24, 8 * px), Math.max(16, 6 * px)]} />
      </Path>
    </Group>
  );
}

export function FanScene({ view }: { view: ViewId }) {
  const p = useMemo(() => buildRoom(view), [view]);
  return (
    <Group>
      <Path path={p.floor}>
        <LinearGradient start={vec(0, view === 'side' ? TABLE.floor : -1500)} end={vec(0, view === 'side' ? TABLE.floor + 60 : 1500)} colors={view === 'side' ? ['#3a3a3f', '#1f2024'] : ['#1f2023', '#18191c']} />
      </Path>
      <Path path={p.wall}>
        <LinearGradient start={vec(WALL_X - 200, 0)} end={vec(WALL_X, 0)} colors={['#2b2c30', '#45464c']} />
      </Path>
      <Path path={p.legs} color="#4a3a2c" />
      <Path path={p.table}>
        <LinearGradient start={vec(-TABLE.half, -TABLE.half)} end={vec(TABLE.half, TABLE.half)} colors={['#7a6048', '#4a3a2c']} />
      </Path>
      <Path path={p.table} style="stroke" strokeWidth={5} color={EDGE} />
      <KeepOuts view={view} />
      <FanBody view={view} />
      <Operator pose={view === 'side' ? F15_OP_SIDE : F15_OP_TOP} />
    </Group>
  );
}
