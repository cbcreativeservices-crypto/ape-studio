/**
 * KitPlan — the shared 5-piece kit seen from above, with the stage or the
 * studio around it (LESSON_JOURNEY §6 stage 3, §8). Every Lab 1 drum lesson
 * shows THIS kit (owner ruling 2026-10-05) and lights its own drum.
 *
 * Every object is an illustrated real object from the shared drum family
 * (drums/DrumArt.tsx): coated heads on chrome hoops with their lugs and rods,
 * the rack toms tilted toward the player on their mount, the floor tom on its
 * legs, lathed bronze cymbals on boom stands, the hi-hat and its pedal, the
 * kick and its pedal, a padded throne — lit from the upper left. M01 draws
 * its own kick with its own art (its top cutaway, the drawing every M01 page
 * uses). Positions are a typical right-handed layout (the badge says so).
 *
 * Nothing moves (D8). A tap names an item; the dock's ITEM fader is the
 * no-tap path to the same cards.
 */
import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { SettingItem, VariantId, Vec3, Wedge } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { KIT, KIT_CYMBALS, KIT_DRUMS, PLAN_BOX, planHitTest, planLabelAt, type KitDrumId, type PlanId } from './kitPlanModel.ts';
import { CymbalPlan, DrumPlan, topTransform } from './drums/DrumArt';

const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
type SkPath = ReturnType<typeof Skia.Path.Make>;

export type KitPlanScene = 'kit' | 'stage' | 'studio';
export type KitPlanProps = {
  w: number;
  h: number;
  scene: KitPlanScene;
  variant: VariantId;
  /** The lesson's setting items (labels, and which plan items each stands for). */
  items: readonly SettingItem[];
  /** The plan item that is the lesson's own drum (always named). */
  own: PlanId;
  /** M01: its own art draws its drum on the plan (the kick's top cutaway). */
  OwnArt?: (p: { view: 'top'; variant: VariantId }) => ReactElement;
  /** Where the lesson's frame origin sits on the plan (its wedges are in it). */
  offset?: Vec3;
  wedges: readonly Wedge[];
  /** The chosen ITEM id (lesson.setting.items), or null. */
  highlight: string | null;
  onTap: (itemId: string) => void;
  accessibilityLabel: string;
};

/* ── builders (mm) ── */
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
function poly(pts: readonly { u: number; v: number }[]): SkPath {
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

/** Boom-stand feet and the double tom holder on the kick (drawing defaults,
 *  kit/GEOMETRY_PROPOSAL.md §2: "stands: tripods; boom arms to each cymbal";
 *  toms §1: "one arm from the kick shell top to each rack tom"). */
export const PLAN_HARDWARE = {
  booms: { crash1: { u: -230, v: -800 }, crash2: { u: 540, v: 560 }, ride: { u: -40, v: 880 } } as Record<'crash1' | 'crash2' | 'ride', { u: number; v: number }>,
  tomPost: { u: 230, v: -110 },
};

/* ── the kick from above (uncut): a horizontal drum, its hoops, its pedal ── */
function KickPlanArt({ hi }: { hi: boolean }) {
  const k = KIT.kick;
  const parts = useMemo(() => {
    const shell = rr(0, -k.R, k.depth, 2 * k.R, 4);
    const hoops = Skia.Path.Make();
    hoops.addRRect(Skia.RRectXY(Skia.XYWHRect(k.hoop.u0, -k.hoop.halfW, 25, 2 * k.hoop.halfW), 5, 5));
    hoops.addRRect(Skia.RRectXY(Skia.XYWHRect(k.hoop.u1 - 25, -k.hoop.halfW, 25, 2 * k.hoop.halfW), 5, 5));
    const rods = Skia.Path.Make();
    for (const s of [-1, 1]) {
      rods.moveTo(k.hoop.u0 + 4, s * (k.hoop.halfW + 10));
      rods.lineTo(60, s * (k.hoop.halfW + 10));
      rods.moveTo(k.hoop.u1 - 4, s * (k.hoop.halfW + 10));
      rods.lineTo(k.depth - 60, s * (k.hoop.halfW + 10));
    }
    const pedal = rr(k.pedal.u0, -k.pedal.halfW, k.pedal.u1 - k.pedal.u0, 2 * k.pedal.halfW, 10);
    return { shell, hoops, rods, pedal };
  }, [k]);
  return (
    <Group>
      <Path path={parts.shell} color="#000" opacity={0.5} transform={[{ translateX: 12 }, { translateY: 16 }]}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={parts.shell}>
        <LinearGradient start={vec(0, -k.R)} end={vec(0, k.R)} colors={['#3a2210', '#e2b679', '#c48f52', '#7a4a20', '#2f1b0a']} positions={[0, 0.25, 0.5, 0.8, 1]} />
      </Path>
      <Path path={parts.rods} style="stroke" strokeWidth={6} strokeCap="round" color="#2a2c32" />
      <Path path={parts.rods} style="stroke" strokeWidth={2} strokeCap="round" color="#d9dde5" opacity={0.8} />
      <Path path={parts.hoops}>
        <LinearGradient start={vec(0, -k.hoop.halfW)} end={vec(0, k.hoop.halfW)} colors={['#c48a4c', '#7a4a20', '#2f1b0a']} />
      </Path>
      <Path path={parts.pedal}>
        <LinearGradient start={vec(k.pedal.u0, -45)} end={vec(k.pedal.u1, 45)} colors={['#6b707b', '#3a3d45', '#22242a']} />
      </Path>
      {hi ? <Path path={rr(k.hoop.u0 - 30, -k.hoop.halfW - 30, k.hoop.u1 - k.hoop.u0 + 60, k.hoop.halfW * 2 + 60, 30)} style="stroke" strokeWidth={9} color={AMBER} /> : null}
    </Group>
  );
}

function HiHatArt({ hi }: { hi: boolean }) {
  const h = KIT_CYMBALS.hihat;
  const c = { u: h.c.x, v: h.c.z };
  const r = h.d / 2;
  const legs = useMemo(() => legsPath(c, 30, r + 110, 3, Math.PI / 2), []); // eslint-disable-line react-hooks/exhaustive-deps
  const rings = useMemo(() => lathe(c, r), []); // eslint-disable-line react-hooks/exhaustive-deps
  const pedal = KIT.hihatPedal;
  return (
    <Group>
      <Circle cx={c.u + 14} cy={c.v + 18} r={r + 10} color="#000" opacity={0.5}>
        <BlurMask blur={16} style="normal" />
      </Circle>
      <Path path={legs} style="stroke" strokeWidth={9} color="#9aa0ab" strokeCap="round" />
      {/* footboard toward the throne */}
      <Path path={rr(pedal.u0, pedal.v - pedal.halfW, pedal.u1 - pedal.u0, pedal.halfW * 2, 14)}>
        <LinearGradient start={vec(pedal.u0, pedal.v - pedal.halfW)} end={vec(pedal.u1, pedal.v + pedal.halfW)} colors={['#c8ccd4', '#6c717c', '#2a2c32']} />
      </Path>
      <Circle cx={c.u} cy={c.v} r={r}>
        <RadialGradient c={vec(c.u - r * 0.4, c.v - r * 0.45)} r={r * 1.8} colors={['#f6d58f', '#d2a04a', '#9a6a24', '#5e3e12']} />
      </Circle>
      <Path path={rings} style="stroke" strokeWidth={1.6} color="#5e3e12" opacity={0.4} />
      <Circle cx={c.u} cy={c.v} r={r * 0.27}>
        <RadialGradient c={vec(c.u - 14, c.v - 16)} r={r * 0.4} colors={['#fff0c4', '#d9a85a', '#8a5e1e']} />
      </Circle>
      <Circle cx={c.u} cy={c.v} r={14} color="#1a1b1f" />
      <Circle cx={c.u} cy={c.v} r={r} style="stroke" strokeWidth={3} color="#7a5418" />
      {hi ? <Circle cx={c.u} cy={c.v} r={r + 40} style="stroke" strokeWidth={9} color={AMBER} /> : null}
    </Group>
  );
}

function ThroneArt({ hi }: { hi: boolean }) {
  const t = KIT.throne;
  const legs = useMemo(() => legsPath(t.c, 40, t.r + 120, 3, Math.PI / 6), [t]);
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

/** The double tom holder on the kick: a post and an arm to each rack tom. */
function TomMountPlan() {
  const p = useMemo(() => {
    const post = PLAN_HARDWARE.tomPost;
    const arms = Skia.Path.Make();
    for (const id of ['tom1', 'tom2'] as const) {
      const d = KIT_DRUMS[id];
      const R = d.spec.d.mm / 2;
      const dx = post.u - d.c.x;
      const dz = post.v - d.c.z;
      const l = Math.hypot(dx, dz);
      arms.moveTo(post.u, post.v);
      arms.lineTo(d.c.x + (dx / l) * (R + 20), d.c.z + (dz / l) * (R + 20));
    }
    return arms;
  }, []);
  const post = PLAN_HARDWARE.tomPost;
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={15} strokeCap="round" color="#16171b" />
      <Path path={p} style="stroke" strokeWidth={10} strokeCap="round" color="#8a8f99" />
      <Circle cx={post.u} cy={post.v} r={22} color="#1b1c21" />
      <Circle cx={post.u} cy={post.v} r={22} style="stroke" strokeWidth={4} color="#b6bbc5" />
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

/** The plan items an item stands for (default: its own id). */
export function planIdsOf(it: Pick<SettingItem, 'id' | 'planIds'>): readonly string[] {
  return it.planIds && it.planIds.length ? it.planIds : [it.id];
}

export function KitPlan({ w, h, scene, variant, items, own, OwnArt, offset = { x: 0, y: 0, z: 0 }, wedges, highlight, onTap, accessibilityLabel }: KitPlanProps) {
  const textScale = useStageTextScale();
  const box = scene === 'kit' ? PLAN_BOX.kit : PLAN_BOX.wide;
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const space = useMemo(() => poly(KIT.playerSpace), []);
  // The lesson's wedges are in its own frame: onto the plan.
  const stageWedges = scene === 'stage' ? wedges.filter((wd) => wd.glyph !== 'none').map((wd) => ({ ...wd, p: { x: wd.p.x + offset.x, y: wd.p.y + offset.y, z: wd.p.z + offset.z } })) : [];
  const rug = useMemo(() => rr(-1010, -790, 1780, 1640, 30), []);
  const audience = useMemo(() => {
    const p = Skia.Path.Make();
    const u = KIT.audienceU;
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
    const r = KIT.room;
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(r.u0, r.v0, r.u1 - r.u0, r.v1 - r.v0));
    return p;
  }, []);
  const panels = useMemo(() => {
    const r = KIT.room;
    const p = Skia.Path.Make();
    for (let u = r.u0 + 220; u < r.u1 - 200; u += 520) {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(u, r.v0 + 10, 300, 46), 8, 8));
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(u, r.v1 - 56, 300, 46), 8, 8));
    }
    return p;
  }, []);
  const booms = useMemo(() => {
    const p = Skia.Path.Make();
    const feet = Skia.Path.Make();
    for (const id of ['crash1', 'crash2', 'ride'] as const) {
      const f = PLAN_HARDWARE.booms[id];
      const c = KIT_CYMBALS[id].c;
      p.moveTo(f.u, f.v);
      p.lineTo(c.x, c.z);
      for (let k = 0; k < 3; k++) {
        const a = Math.PI / 6 + (k * 2 * Math.PI) / 3;
        feet.moveTo(f.u, f.v);
        feet.lineTo(f.u + Math.cos(a) * 120, f.v + Math.sin(a) * 120);
      }
    }
    return { p, feet };
  }, []);

  // Which plan items are lit: those of the chosen item, and the lesson's own drum.
  const chosen = items.find((i) => i.id === highlight);
  const litIds = new Set<string>(chosen ? planIdsOf(chosen) : []);
  const hi = (id: string) => litIds.has(id);
  const shownHere = (i: SettingItem) => i.scene === 'all' || i.scene === scene;
  const itemOfPlan = (pid: string) => items.find((i) => shownHere(i) && planIdsOf(i).includes(pid)) ?? null;

  const labels: StaticLabel[] = [];
  const addItem = (it: SettingItem) => {
    for (const pid of planIdsOf(it)) {
      let at = planLabelAt(pid);
      const wd = stageWedges.find((x) => x.id === pid);
      if (wd) at = { u: wd.p.x, v: wd.p.z + 340, align: 'center' };
      if (!at) continue;
      labels.push({ id: `${it.id}:${pid}`, text: it.short, u: at.u, v: at.v, align: at.align, tone: highlight === it.id ? 'amber' : undefined });
      break;
    }
  };
  // The chosen item first (it wins every collision), then the lesson's own drum.
  const visible = items.filter(shownHere);
  if (chosen) addItem(chosen);
  const ownItem = visible.find((i) => planIdsOf(i).includes(own));
  if (ownItem) addItem(ownItem);
  for (const it of visible) addItem(it);
  labels.push({ id: 'space', text: 'PLAYER’S SPACE', short: 'PLAYER', u: -1000, v: 125, align: 'left', tone: 'illustrative' });
  const seen = new Set<string>();
  const uniq = labels.filter((l) => {
    const k = l.id.split(':')[0];
    return seen.has(k) ? false : (seen.add(k), true);
  });

  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const pid = planHitTest({ wedges: stageWedges.map((wd) => ({ id: wd.id, u: wd.p.x, v: wd.p.z })), scene }, u, v, 20 / xf.s);
    const it = pid ? itemOfPlan(pid) : null;
    if (it) onTap(it.id);
  };
  // The lesson's own drum is ringed in amber always (unless its own art draws
  // it, as M01's kick does); a chosen item is ringed too.
  const drum = (id: KitDrumId, dim = 1, dashed = false) => (
    <Group key={id} transform={topTransform(KIT_DRUMS[id])}>
      <DrumPlan drum={KIT_DRUMS[id]} highlight={hi(id) || (own === id && !OwnArt)} dim={dim} dashed={dashed} />
    </Group>
  );

  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {scene === 'studio' ? (
              <>
                <Path path={walls} style="stroke" strokeWidth={40} color="#2a2c32" />
                <Path path={panels} color="#3a3d52" />
                <Path path={panels} style="stroke" strokeWidth={3} color="#5d6a84" />
              </>
            ) : null}
            {scene === 'stage' ? (
              <>
                <Line p1={vec(KIT.audienceU - 230, -840)} p2={vec(KIT.audienceU - 230, 940)} color="#5d616c" strokeWidth={8}>
                  <DashPathEffect intervals={[40, 26]} />
                </Line>
                <Path path={audience} style="stroke" strokeWidth={14} color="#aab0bd" strokeCap="round" strokeJoin="round" />
              </>
            ) : null}
            <Path path={rug}>
              <LinearGradient start={vec(-1010, -790)} end={vec(770, 850)} colors={['#3a1c1f', '#2a1416', '#1c0d0f']} />
            </Path>
            <Path path={rug} style="stroke" strokeWidth={6} color="#5a2c30" opacity={0.8} />
            {/* the player's space (a keep-out, the lab's grey hatch) */}
            <Group clip={space}>
              <Path path={hatchPath()} style="stroke" strokeWidth={4} color={GREY} opacity={0.45} />
            </Group>
            <Path path={space} style="stroke" strokeWidth={4} color={GREY} opacity={0.7} />
            {/* cymbal stand feet and booms, under everything above them */}
            <Path path={booms.feet} style="stroke" strokeWidth={9} strokeCap="round" color="#7a7f8a" />
            <Path path={booms.p} style="stroke" strokeWidth={10} strokeCap="round" color="#5b5f69" />
            <ThroneArt hi={hi('throne')} />
            {drum('floor')}
            {drum('snare')}
            {OwnArt && own === 'kick' ? <OwnArt view="top" variant={variant} /> : <KickPlanArt hi={false} />}
            {hi('kick') || (own === 'kick' && !OwnArt) ? <Path path={rr(KIT.kick.hoop.u0 - 30, -KIT.kick.hoop.halfW - 30, KIT.kick.hoop.u1 - KIT.kick.hoop.u0 + 60, KIT.kick.hoop.halfW * 2 + 60, 30)} style="stroke" strokeWidth={9} color={AMBER} /> : null}
            {hi('pedal') ? <Path path={rr(KIT.kick.pedal.u0 - 24, -KIT.kick.pedal.halfW - 24, KIT.kick.pedal.u1 - KIT.kick.pedal.u0 + 48, KIT.kick.pedal.halfW * 2 + 48, 20)} style="stroke" strokeWidth={9} color={AMBER} /> : null}
            <TomMountPlan />
            {drum('tom1', own === 'kick' ? 0.8 : 1, own === 'kick')}
            {drum('tom2', own === 'kick' ? 0.8 : 1, own === 'kick')}
            <HiHatArt hi={hi('hihat')} />
            {(['crash1', 'crash2', 'ride'] as const).map((id) => (
              <CymbalPlan key={id} cx={KIT_CYMBALS[id].c.x} cz={KIT_CYMBALS[id].c.z} d={KIT_CYMBALS[id].d} tiltDeg={KIT_CYMBALS[id].tiltDeg} highlight={hi(id)} dim={hi(id) ? 0.95 : 0.62} />
            ))}
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
