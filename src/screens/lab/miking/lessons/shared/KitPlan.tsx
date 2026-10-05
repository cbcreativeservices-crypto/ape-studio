/**
 * KitPlan — the kit seen from above, with the stage or the studio around it
 * (LESSON_JOURNEY §6 stage 3). The lesson's own drum is drawn with ITS art
 * (the kick's top cutaway, unchanged); every neighbour is an illustrated real
 * object built from kitPlanModel.ts — coated heads with their hoops and lugs,
 * a lathed bronze hi-hat on its stand, a padded throne on a tripod, the
 * lesson's two floor monitors — lit from the upper left like the rest of the
 * lab. Positions are ILLUSTRATIVE (said in the badge and the labels).
 *
 * Nothing moves (D8). A tap names an item; the dock's ITEM fader is the
 * no-tap path to the same cards.
 */
import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId, Vec3, Wedge } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { KIT_PLAN as K, PLAN_BOX, planHitTest, type PlanDrum } from './kitPlanModel.ts';

const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
type SkPath = ReturnType<typeof Skia.Path.Make>;

export type KitPlanScene = 'kit' | 'stage' | 'studio';
export type KitPlanProps = {
  w: number;
  h: number;
  scene: KitPlanScene;
  variant: VariantId;
  /** The lesson's own drum, drawn by its art in the TOP view. */
  Drum: (p: { view: 'top'; variant: VariantId }) => ReactElement;
  drumBox: { u0: number; u1: number; halfW: number };
  pedalBox: { u0: number; u1: number; halfW: number };
  wedges: readonly Wedge[];
  /** id → the short label to print (from lesson.setting.items). */
  shortOf: (id: string) => string;
  highlight: string | null;
  onTap: (id: string) => void;
  accessibilityLabel: string;
};

/* ── builders (mm) ── */
function lugsPath(d: PlanDrum): SkPath {
  const p = Skia.Path.Make();
  for (let k = 0; k < d.lugs; k++) {
    const a = (k / d.lugs) * 2 * Math.PI + Math.PI / d.lugs;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const r0 = d.r + 10;
    const r1 = d.r + 34;
    const hw = 9;
    const pt = (r: number, t: number) => ({ x: d.c.u + c * r - s * t, y: d.c.v + s * r + c * t });
    const q = [pt(r0, -hw), pt(r1, -hw), pt(r1, hw), pt(r0, hw)];
    p.moveTo(q[0].x, q[0].y);
    for (const z of q.slice(1)) p.lineTo(z.x, z.y);
    p.close();
  }
  return p;
}
function legsPath(c: { u: number; v: number }, r0: number, r1: number, n: number, phase: number): SkPath {
  const p = Skia.Path.Make();
  for (let k = 0; k < n; k++) {
    const a = phase + (k / n) * 2 * Math.PI;
    p.moveTo(c.u + Math.cos(a) * r0, c.v + Math.sin(a) * r0);
    p.lineTo(c.u + Math.cos(a) * r1, c.v + Math.sin(a) * r1);
  }
  return p;
}
function lathe(c: { u: number; v: number }, r: number): SkPath {
  const p = Skia.Path.Make();
  for (let q = r * 0.3; q < r - 4; q += 11) p.addCircle(c.u, c.v, q);
  return p;
}
function poly(pts: { u: number; v: number }[]): SkPath {
  const p = Skia.Path.Make();
  pts.forEach((q, i) => (i === 0 ? p.moveTo(q.u, q.v) : p.lineTo(q.u, q.v)));
  p.close();
  return p;
}
function rr(x: number, y: number, w: number, h: number, r: number): SkPath {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
  return p;
}
let hatch: SkPath | null = null;
function hatchPath(): SkPath {
  if (hatch) return hatch;
  const p = Skia.Path.Make();
  for (let k = -3000; k < 3000; k += 46) {
    p.moveTo(k, -1200);
    p.lineTo(k + 2400, 1200);
  }
  hatch = p;
  return p;
}

function PlanDrumArt({ d, hi }: { d: PlanDrum; hi: boolean }) {
  const lugs = useMemo(() => lugsPath(d), [d]);
  const legs = useMemo(() => (d.legs ? legsPath(d.c, d.r * 0.4, d.r + 95, d.legs, -Math.PI / 2) : null), [d]);
  const { u, v } = d.c;
  return (
    <Group opacity={d.above ? 0.55 : 1}>
      <Circle cx={u + 12} cy={v + 16} r={d.r + 30} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Circle>
      {legs ? <Path path={legs} style="stroke" strokeWidth={9} color="#9aa0ab" strokeCap="round" /> : null}
      <Path path={lugs}>
        <LinearGradient start={vec(u - d.r, v - d.r)} end={vec(u + d.r, v + d.r)} colors={['#eef1f6', '#9aa0ab', '#4a4e57']} />
      </Path>
      {/* chrome hoop */}
      <Circle cx={u} cy={v} r={d.r + 12}>
        <LinearGradient start={vec(u - d.r, v - d.r)} end={vec(u + d.r, v + d.r)} colors={['#eef1f6', '#9aa0ab', '#3a3d45', '#c8ccd4']} />
      </Circle>
      {/* coated head, upper-left light */}
      <Circle cx={u} cy={v} r={d.r}>
        <RadialGradient c={vec(u - d.r * 0.35, v - d.r * 0.4)} r={d.r * 1.7} colors={['#fbf8f0', '#ece5d5', '#bdb29c']} />
      </Circle>
      <Circle cx={u} cy={v} r={d.r - 14} style="stroke" strokeWidth={2} color="#a99f88" opacity={0.6} />
      {d.above ? (
        <Circle cx={u} cy={v} r={d.r + 12} style="stroke" strokeWidth={4} color="#e8eaee">
          <DashPathEffect intervals={[18, 12]} />
        </Circle>
      ) : null}
      {hi ? <Circle cx={u} cy={v} r={d.r + 46} style="stroke" strokeWidth={9} color={AMBER} /> : null}
    </Group>
  );
}

function HiHatArt({ hi }: { hi: boolean }) {
  const h = K.hihat;
  const legs = useMemo(() => legsPath(h.c, 30, h.r + 110, 3, Math.PI / 2), []);
  const rings = useMemo(() => lathe(h.c, h.r), []);
  const pedal = h.pedal;
  return (
    <Group>
      <Circle cx={h.c.u + 14} cy={h.c.v + 18} r={h.r + 10} color="#000" opacity={0.5}>
        <BlurMask blur={16} style="normal" />
      </Circle>
      <Path path={legs} style="stroke" strokeWidth={9} color="#9aa0ab" strokeCap="round" />
      {/* footboard toward the throne (ILLUSTRATIVE) */}
      <Path path={rr(pedal.u0, pedal.v - pedal.halfW, pedal.u1 - pedal.u0, pedal.halfW * 2, 14)}>
        <LinearGradient start={vec(pedal.u0, pedal.v - pedal.halfW)} end={vec(pedal.u1, pedal.v + pedal.halfW)} colors={['#c8ccd4', '#6c717c', '#2a2c32']} />
      </Path>
      {/* the top cymbal: lathed bronze, a raised bell, the clutch */}
      <Circle cx={h.c.u} cy={h.c.v} r={h.r}>
        <RadialGradient c={vec(h.c.u - h.r * 0.4, h.c.v - h.r * 0.45)} r={h.r * 1.8} colors={['#f6d58f', '#d2a04a', '#9a6a24', '#5e3e12']} />
      </Circle>
      <Path path={rings} style="stroke" strokeWidth={1.6} color="#5e3e12" opacity={0.4} />
      <Circle cx={h.c.u} cy={h.c.v} r={h.r * 0.27}>
        <RadialGradient c={vec(h.c.u - 14, h.c.v - 16)} r={h.r * 0.4} colors={['#fff0c4', '#d9a85a', '#8a5e1e']} />
      </Circle>
      <Circle cx={h.c.u} cy={h.c.v} r={14} color="#1a1b1f" />
      <Circle cx={h.c.u} cy={h.c.v} r={h.r} style="stroke" strokeWidth={3} color="#7a5418" />
      {hi ? <Circle cx={h.c.u} cy={h.c.v} r={h.r + 40} style="stroke" strokeWidth={9} color={AMBER} /> : null}
    </Group>
  );
}

function ThroneArt({ hi }: { hi: boolean }) {
  const t = K.throne;
  const legs = useMemo(() => legsPath(t.c, 40, t.r + 120, 3, Math.PI / 6), []);
  return (
    <Group>
      <Path path={legs} style="stroke" strokeWidth={11} color="#7a7f8a" strokeCap="round" />
      <Circle cx={t.c.u + 12} cy={t.c.v + 16} r={t.r + 6} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Circle>
      <Circle cx={t.c.u} cy={t.c.v} r={t.r}>
        <RadialGradient c={vec(t.c.u - t.r * 0.35, t.c.v - t.r * 0.4)} r={t.r * 1.7} colors={['#4a4e57', '#24262c', '#0e0f12']} />
      </Circle>
      <Circle cx={t.c.u} cy={t.c.v} r={t.r - 18} style="stroke" strokeWidth={2.5} color="#5d616c" opacity={0.8}>
        <DashPathEffect intervals={[8, 7]} />
      </Circle>
      {hi ? <Circle cx={t.c.u} cy={t.c.v} r={t.r + 40} style="stroke" strokeWidth={9} color={AMBER} /> : null}
    </Group>
  );
}

/** A floor wedge from above: cabinet, sloped grille facing `faces`, corners. */
function WedgePlan({ at, faces, hi }: { at: Vec3; faces: Vec3; hi: boolean }) {
  const ang = Math.atan2(faces.z, faces.x);
  const parts = useMemo(() => {
    const cab = rr(-150, -280, 300, 560, 18);
    const grille = rr(-40, -258, 176, 516, 14);
    const holes = Skia.Path.Make();
    for (let x = -26; x < 128; x += 20) for (let z = -244; z < 250; z += 20) holes.addCircle(x, z, 4.2);
    const recess = rr(-128, -70, 50, 140, 14);
    return { cab, grille, holes, recess };
  }, []);
  return (
    <Group transform={[{ translateX: at.x }, { translateY: at.z }, { rotate: ang }]}>
      <Group transform={[{ translateX: 14 }, { translateY: 18 }]}>
        <Path path={parts.cab} color="#000" opacity={0.6}>
          <BlurMask blur={22} style="normal" />
        </Path>
      </Group>
      <Path path={parts.cab}>
        <LinearGradient start={vec(-150, -280)} end={vec(150, 280)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      <Path path={parts.grille} color="#0c0d10" />
      <Path path={parts.holes} color="#4a4e57" opacity={0.9} />
      <Path path={parts.grille} style="stroke" strokeWidth={3} color="#5d616c" />
      <Path path={parts.recess} color="#0e0f12" />
      <Path path={parts.cab} style="stroke" strokeWidth={4} color="#70747f" opacity={0.9} />
      {hi ? <Path path={parts.cab} style="stroke" strokeWidth={14} color={AMBER} opacity={0.9} /> : null}
    </Group>
  );
}

export function KitPlan({ w, h, scene, variant, Drum, drumBox, pedalBox, wedges, shortOf, highlight, onTap, accessibilityLabel }: KitPlanProps) {
  const textScale = useStageTextScale();
  const box = scene === 'kit' ? PLAN_BOX.kit : PLAN_BOX.wide;
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const space = useMemo(() => poly(K.playerSpace), []);
  const stageWedges = scene === 'stage' ? wedges : [];
  const rug = useMemo(() => rr(-1010, -790, 1700, 1500, 30), []);
  const audience = useMemo(() => {
    const p = Skia.Path.Make();
    const u = K.audienceU;
    for (const v of [-420, 0, 420]) {
      p.moveTo(u - 170, v);
      p.lineTo(u + 40, v);
      p.moveTo(u + 4, v - 34);
      p.lineTo(u + 40, v);
      p.lineTo(u + 4, v + 34);
    }
    return p;
  }, []);
  const walls = useMemo(() => {
    const r = K.room;
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(r.u0, r.v0, r.u1 - r.u0, r.v1 - r.v0));
    return p;
  }, []);
  const panels = useMemo(() => {
    const r = K.room;
    const p = Skia.Path.Make();
    for (let u = r.u0 + 220; u < r.u1 - 200; u += 520) {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(u, r.v0 + 10, 300, 46), 8, 8));
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(u, r.v1 - 56, 300, 46), 8, 8));
    }
    return p;
  }, []);
  const hi = (id: string) => highlight === id;

  const labels: StaticLabel[] = [];
  const add = (id: string, u: number, v: number, align: StaticLabel['align'], tone?: StaticLabel['tone']) => labels.push({ id, text: shortOf(id), u, v, align, tone: highlight === id ? 'amber' : tone });
  if (highlight) {
    // The chosen item's label first: it wins every collision.
    const at: Record<string, [number, number, StaticLabel['align']]> = {
      kick: [drumBox.u1 * 0.5, -drumBox.halfW - 60, 'center'],
      pedal: [pedalBox.u0 + 40, pedalBox.halfW + 70, 'center'],
      throne: [K.throne.c.u, K.throne.c.v + K.throne.r + 75, 'center'],
      hihat: [K.hihat.c.u, K.hihat.c.v - K.hihat.r - 40, 'center'],
      snare: [K.snare.c.u + K.snare.r + 40, K.snare.c.v + 40, 'left'],
      tom: [K.rackTom.c.u, K.rackTom.c.v - K.rackTom.r - 50, 'center'],
      floor: [K.floorTom.c.u, K.floorTom.c.v + K.floorTom.r + 75, 'center'],
      audience: [K.audienceU + 40, 600, 'right'],
      room: [K.room.u0 + 40, K.room.v0 + 110, 'left'],
    };
    for (const wd of stageWedges) at[wd.id] = [wd.p.x, wd.p.z + 340, 'center'];
    const a = at[highlight];
    if (a) add(highlight, a[0], a[1], a[2]);
  }
  add('kick', drumBox.u1 * 0.5, drumBox.halfW + 70, 'center');
  add('throne', K.throne.c.u, K.throne.c.v + K.throne.r + 75, 'center');
  add('hihat', K.hihat.c.u, K.hihat.c.v - K.hihat.r - 40, 'center');
  add('snare', K.snare.c.u + K.snare.r + 30, K.snare.c.v - 20, 'left');
  add('floor', K.floorTom.c.u, K.floorTom.c.v + K.floorTom.r + 75, 'center');
  add('tom', K.rackTom.c.u, K.rackTom.c.v - K.rackTom.r - 50, 'center');
  add('pedal', pedalBox.u0 + 40, pedalBox.halfW + 70, 'center');
  for (const wd of stageWedges) add(wd.id, wd.p.x, wd.p.z + 340, 'center');
  if (scene === 'stage') add('audience', K.audienceU + 40, 600, 'right');
  if (scene === 'studio') add('room', K.room.u0 + 40, K.room.v0 + 110, 'left');
  labels.push({ id: 'space', text: 'PLAYER’S SPACE', short: 'PLAYER', u: -1000, v: 125, align: 'left', tone: 'illustrative' });
  const seen = new Set<string>();
  const uniq = labels.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));

  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const id = planHitTest({ kick: drumBox, pedal: pedalBox, wedges: stageWedges.map((wd) => ({ id: wd.id, u: wd.p.x, v: wd.p.z })), scene }, u, v, 20 / xf.s);
    if (id) onTap(id);
  };

  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {/* the floor: a rug under the kit (ILLUSTRATIVE), the room's walls in a studio */}
            {scene === 'studio' ? (
              <>
                <Path path={walls} style="stroke" strokeWidth={40} color="#2a2c32" />
                <Path path={panels} color="#3a3d52" />
                <Path path={panels} style="stroke" strokeWidth={3} color="#5d6a84" />
              </>
            ) : null}
            {scene === 'stage' ? (
              <>
                <Line p1={vec(K.audienceU - 230, -840)} p2={vec(K.audienceU - 230, 940)} color="#5d616c" strokeWidth={8}>
                  <DashPathEffect intervals={[40, 26]} />
                </Line>
                <Path path={audience} style="stroke" strokeWidth={14} color="#aab0bd" strokeCap="round" strokeJoin="round" />
              </>
            ) : null}
            <Path path={rug}>
              <LinearGradient start={vec(-1010, -790)} end={vec(690, 710)} colors={['#3a1c1f', '#2a1416', '#1c0d0f']} />
            </Path>
            <Path path={rug} style="stroke" strokeWidth={6} color="#5a2c30" opacity={0.8} />
            {/* the player's space (ILLUSTRATIVE keep-out, the lab's grey hatch) */}
            <Group clip={space}>
              <Path path={hatchPath()} style="stroke" strokeWidth={4} color={GREY} opacity={0.45} />
            </Group>
            <Path path={space} style="stroke" strokeWidth={4} color={GREY} opacity={0.7} />
            <ThroneArt hi={hi('throne')} />
            <PlanDrumArt d={K.floorTom} hi={hi('floor')} />
            <PlanDrumArt d={K.snare} hi={hi('snare')} />
            <Drum view="top" variant={variant} />
            {hi('kick') ? <Path path={rr(drumBox.u0 - 30, -drumBox.halfW - 30, drumBox.u1 - drumBox.u0 + 60, drumBox.halfW * 2 + 60, 30)} style="stroke" strokeWidth={9} color={AMBER} /> : null}
            {hi('pedal') ? <Path path={rr(pedalBox.u0 - 24, -pedalBox.halfW - 24, pedalBox.u1 - pedalBox.u0 + 48, pedalBox.halfW * 2 + 48, 20)} style="stroke" strokeWidth={9} color={AMBER} /> : null}
            <PlanDrumArt d={K.rackTom} hi={hi('tom')} />
            <HiHatArt hi={hi('hihat')} />
            {stageWedges.map((wd) => (
              <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={hi(wd.id)} />
            ))}
            {hi('room') ? <Path path={walls} style="stroke" strokeWidth={22} color={AMBER} opacity={0.8} /> : null}
            {hi('audience') ? <Path path={audience} style="stroke" strokeWidth={22} color={AMBER} strokeCap="round" opacity={0.85} /> : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={uniq} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
