/**
 * THE SETTING for the lute family (LESSON_JOURNEY §6 stage 3, §8): the player
 * and the instrument from above, at the lesson's real scale, with what sits
 * round them as illustrated real objects — a chair and a vocal mic and a
 * frame drum for the oud; a rug, a tabla pair and a tanpura for the sitar; a
 * rug, a mridangam, a tanpura and a side-fill for the veena — and the
 * stage's monitors, PA and audience edge, or a studio room.
 *
 *   AROUND THE PLAYER (rack)  tap an item (or step through ITEM) to read
 *                             what it means for a mic. Nothing to answer.
 *   STAGE AND STUDIO (rack)   the wider plan: STAGE (the lesson's own monitor
 *                             positions — the ones Studio-or-live uses) or
 *                             STUDIO.
 *   BEFORE ANY MIC (read)     ask the player; hear it unamplified; hearing
 *                             safety in plain words; the three checks.
 * Credit: the three checks. Positions are a typical layout (badged so).
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SettingItem, ViewBox, Wedge } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { copyOf } from '../../../engine/model/copy.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { WedgePlan, planIdsOf } from '../KitPlan';
import type { BuiltLute } from './luteModel.ts';
import type { LutePlanObject } from './lutesContent.ts';
import { PAL, poly, rr, smooth, type SkPath } from './luteDraw';
import { LuteSceneArt } from './LuteArt';
import { Head } from './lutePlayers';

const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
const A = (c: readonly string[]) => c as unknown as string[];

function Halo({ path, on }: { path: SkPath; on: boolean }) {
  return on ? <Path path={path} style="stroke" strokeWidth={16} color={AMBER} opacity={0.9} /> : null;
}
function Shadow({ path }: { path: SkPath }) {
  return (
    <Path path={path} color="#000" opacity={0.5} transform={[{ translateX: 10 }, { translateY: 14 }]}>
      <BlurMask blur={16} style="normal" />
    </Path>
  );
}

/** A seated accompanist from above: shoulders and a bald head, facing the audience. */
function Seated({ x, z, w = 210 }: { x: number; z: number; w?: number }) {
  const p = smooth([
    [x - w, z + 10],
    [x - w * 0.8, z - 70],
    [x + w * 0.8, z - 70],
    [x + w, z + 10],
    [x + w * 0.7, z + 70],
    [x - w * 0.7, z + 70],
  ]);
  return (
    <Group opacity={0.9}>
      <Path path={p}>
        <LinearGradient start={vec(x - w, z - 70)} end={vec(x + w, z + 70)} colors={A(PAL.fig)} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={2.5} color={PAL.figEdge} />
      <Head cx={x} cy={z} r={100} above />
    </Group>
  );
}

function ChairPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const seat = rr(o.at.x - 220, o.at.z - 200, o.at.x + 220, o.at.z + 200, 60);
  const back = rr(o.at.x - 220, o.at.z - 250, o.at.x + 220, o.at.z - 190, 24);
  return (
    <Group>
      <Path path={seat}>
        <LinearGradient start={vec(o.at.x - 220, o.at.z - 200)} end={vec(o.at.x + 220, o.at.z + 200)} colors={['#3a2a22', '#2a1d17', '#1a120e']} />
      </Path>
      <Path path={back} color="#140d0a" />
      <Halo path={seat} on={hi} />
    </Group>
  );
}

/** A performance rug on a low riser, with a woven border. */
function RugPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const r = o.r ?? 1100;
  const body = rr(o.at.x - r, o.at.z - r * 0.62, o.at.x + r, o.at.z + r * 0.62, 26);
  const inner = rr(o.at.x - r + 70, o.at.z - r * 0.62 + 70, o.at.x + r - 70, o.at.z + r * 0.62 - 70, 14);
  return (
    <Group>
      <Path path={body}>
        <LinearGradient start={vec(o.at.x - r, o.at.z - r)} end={vec(o.at.x + r, o.at.z + r)} colors={A(PAL.rug)} />
      </Path>
      <Path path={inner} style="stroke" strokeWidth={22} color="#7a3a2a" opacity={0.8} />
      <Path path={inner} style="stroke" strokeWidth={8} color={PAL.gold[2]} opacity={0.7}>
        <DashPathEffect intervals={[30, 22]} />
      </Path>
      <Halo path={body} on={hi} />
    </Group>
  );
}

function VocalPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const base = o.faces ?? { x: o.at.x, z: o.at.z + 380 };
  const ring = useMemo(() => {
    const p = poly(Array.from({ length: 32 }, (_, i) => [base.x + 125 * Math.cos((i / 32) * Math.PI * 2), base.z + 125 * Math.sin((i / 32) * Math.PI * 2)]));
    return p;
  }, [base.x, base.z]);
  const mic = rr(o.at.x - 26, o.at.z - 70, o.at.x + 26, o.at.z + 70, 26);
  return (
    <Group>
      {/* a flat, round stand base seen from above: a dished disc with a rim and the hub */}
      <Path path={ring} color="#000" opacity={0.45} transform={[{ translateX: 8 }, { translateY: 10 }]}>
        <BlurMask blur={12} style="normal" />
      </Path>
      <Path path={ring}>
        <RadialGradient c={vec(base.x, base.z)} r={130} colors={['#2a2c32', '#3a3d45', '#5d616c']} />
      </Path>
      <Path path={ring} style="stroke" strokeWidth={5} color="#8a8f9c" opacity={0.8} />
      <Circle cx={base.x} cy={base.z} r={22} color="#9aa0ab" />
      <Line p1={vec(base.x, base.z)} p2={vec(o.at.x, o.at.z + 60)} color="#7a7f8a" strokeWidth={12} strokeCap="round" />
      <Path path={mic}>
        <LinearGradient start={vec(o.at.x - 26, o.at.z - 70)} end={vec(o.at.x + 26, o.at.z + 70)} colors={['#c8ccd4', '#6b707b', '#2b2d33']} />
      </Path>
      <Halo path={ring} on={hi} />
    </Group>
  );
}

/** A riq (frame drum with jingles) held by a seated percussionist. */
function RiqPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const { x, z } = o.at;
  const dz = z + 190;
  const frame = poly(Array.from({ length: 40 }, (_, i) => [x + 115 * Math.cos((i / 40) * Math.PI * 2), dz + 115 * Math.sin((i / 40) * Math.PI * 2)]));
  return (
    <Group>
      <Seated x={x} z={z - 60} />
      <Shadow path={frame} />
      <Path path={frame}>
        <LinearGradient start={vec(x - 115, dz - 115)} end={vec(x + 115, dz + 115)} colors={A(PAL.walnut)} />
      </Path>
      <Circle cx={x} cy={dz} r={98}>
        <RadialGradient c={vec(x - 30, dz - 30)} r={120} colors={['#f6ecd2', '#e2d2ad', '#c4b086']} />
      </Circle>
      {Array.from({ length: 5 }, (_, i) => {
        const a = -Math.PI / 2 + (i / 5) * Math.PI * 2 + 0.3;
        const cx = x + 106 * Math.cos(a);
        const cz = dz + 106 * Math.sin(a);
        return (
          <Group key={`j${i}`}>
            <Circle cx={cx} cy={cz} r={16} color="#151007" />
            <Circle cx={cx} cy={cz} r={11}>
              <RadialGradient c={vec(cx - 4, cz - 4)} r={14} colors={A(PAL.brass)} />
            </Circle>
          </Group>
        );
      })}
      <Halo path={frame} on={hi} />
    </Group>
  );
}

/** The tabla pair from above: the wooden dayan and the metal bayan, each with its black spot. */
function TablaPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const { x, z } = o.at;
  const dayan = { x: x - 110, z: z + 60, r: 80 };
  const bayan = { x: x + 120, z: z + 50, r: 118 };
  const outline = rr(x - 230, z - 100, x + 270, z + 200, 80);
  const braces = (d: { x: number; z: number; r: number }) => {
    const p = poly([], false);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      p.moveTo(d.x + d.r * 0.82 * Math.cos(a), d.z + d.r * 0.82 * Math.sin(a));
      p.lineTo(d.x + d.r * 1.05 * Math.cos(a), d.z + d.r * 1.05 * Math.sin(a));
    }
    return p;
  };
  return (
    <Group>
      <Seated x={x} z={z - 170} w={220} />
      {[dayan, bayan].map((d, i) => (
        <Group key={`d${i}`}>
          <Circle cx={d.x + 8} cy={d.z + 12} r={d.r + 14} color="#000" opacity={0.5}>
            <BlurMask blur={12} style="normal" />
          </Circle>
          <Circle cx={d.x} cy={d.z} r={d.r + 14}>
            <LinearGradient start={vec(d.x - d.r, d.z - d.r)} end={vec(d.x + d.r, d.z + d.r)} colors={i === 0 ? A(PAL.walnut) : A(PAL.brass)} />
          </Circle>
          <Path path={braces(d)} style="stroke" strokeWidth={5} color="#3a2414" opacity={0.8} />
          <Circle cx={d.x} cy={d.z} r={d.r * 0.82}>
            <RadialGradient c={vec(d.x - d.r * 0.3, d.z - d.r * 0.3)} r={d.r} colors={['#f3e6c6', '#dcc89d', '#bfa774']} />
          </Circle>
          <Circle cx={i === 0 ? d.x : d.x - d.r * 0.2} cy={d.z} r={d.r * (i === 0 ? 0.36 : 0.32)}>
            <RadialGradient c={vec(d.x - 10, d.z - 10)} r={d.r * 0.4} colors={['#3a3a3e', '#0d0d0f']} />
          </Circle>
        </Group>
      ))}
      <Halo path={outline} on={hi} />
    </Group>
  );
}

/** A tanpura held upright by a seated player: from above, its gourd and the neck's top. */
function TanpuraPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const { x, z } = o.at;
  const gx = x - 170;
  const gz = z + 60;
  const outline = rr(x - 340, z - 120, x + 230, z + 230, 80);
  return (
    <Group>
      <Seated x={x + 40} z={z - 20} />
      <Circle cx={gx + 8} cy={gz + 12} r={150} color="#000" opacity={0.5}>
        <BlurMask blur={14} style="normal" />
      </Circle>
      <Circle cx={gx} cy={gz} r={150}>
        <RadialGradient c={vec(gx - 50, gz - 50)} r={200} colors={A(PAL.lacquer)} />
      </Circle>
      <Circle cx={gx} cy={gz} r={118}>
        <LinearGradient start={vec(gx - 118, gz - 118)} end={vec(gx + 118, gz + 118)} colors={A(PAL.toon)} />
      </Circle>
      <Path path={rr(gx - 40, gz - 30, gx + 40, gz + 30, 14)}>
        <LinearGradient start={vec(gx - 40, gz)} end={vec(gx + 40, gz)} colors={A(PAL.walnut)} />
      </Path>
      {[-1, 1].map((s) => (
        <Circle key={`pg${s}`} cx={gx + s * 52} cy={gz} r={13} color={PAL.bone[1]} />
      ))}
      <Halo path={outline} on={hi} />
    </Group>
  );
}

/** A mridangam (a two-headed barrel drum) across a seated player's lap. */
function MridangamPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const { x, z } = o.at;
  const L = 330;
  const barrel = smooth([
    [x - L, z - 95],
    [x, z - 140],
    [x + L, z - 105],
    [x + L, z + 105],
    [x, z + 140],
    [x - L, z + 95],
  ]);
  const straps = poly([], false);
  for (let k = -3; k <= 3; k++) {
    straps.moveTo(x - L + 10, z + k * 26);
    straps.lineTo(x + L - 10, z + k * 30);
  }
  return (
    <Group>
      <Seated x={x} z={z - 200} w={220} />
      <Shadow path={barrel} />
      <Path path={barrel}>
        <LinearGradient start={vec(x - L, z - 140)} end={vec(x + L, z + 140)} colors={A(PAL.jack)} />
      </Path>
      <Path path={straps} style="stroke" strokeWidth={5} color="#3a2414" opacity={0.75} />
      <Path path={rr(x - L - 18, z - 96, x - L + 10, z + 96, 12)} color="#e6d6b0" />
      <Path path={rr(x + L - 10, z - 106, x + L + 18, z + 106, 12)} color="#e6d6b0" />
      <Path path={rr(x + L + 4, z - 36, x + L + 18, z + 36, 6)} color="#141416" />
      <Halo path={barrel} on={hi} />
    </Group>
  );
}

/** A side-fill monitor on a stand, from above. */
function SideFillPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const { x, z } = o.at;
  const f = o.faces ?? { x: 1, z: 0 };
  const a = Math.atan2(f.z, f.x);
  const box = rr(-170, -210, 170, 210, 18);
  return (
    <Group transform={[{ translateX: x }, { translateY: z }, { rotate: a }]}>
      <Path path={box} color="#000" opacity={0.5} transform={[{ translateX: 10 }, { translateY: 12 }]}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={box}>
        <LinearGradient start={vec(-170, -210)} end={vec(170, 210)} colors={['#3b3e46', '#24262c', '#141519']} />
      </Path>
      <Path path={rr(150, -190, 172, 190, 6)} color="#55595f" />
      <Path path={box} style="stroke" strokeWidth={4} color="#5d616c" />
      <Halo path={box} on={hi} />
    </Group>
  );
}

function PaPlan({ o, hi }: { o: LutePlanObject; hi: boolean }) {
  const p = poly([
    [o.at.x - 300, o.at.z - 220],
    [o.at.x + 300, o.at.z - 220],
    [o.at.x + 240, o.at.z + 220],
    [o.at.x - 240, o.at.z + 220],
  ]);
  return (
    <Group>
      <Path path={p}>
        <LinearGradient start={vec(o.at.x - 300, o.at.z - 220)} end={vec(o.at.x + 300, o.at.z + 220)} colors={['#3b3e46', '#1d1e23', '#0f1013']} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={4} color="#5d616c" />
      <Halo path={p} on={hi} />
    </Group>
  );
}

export type LutePlanSpec = { objects: readonly LutePlanObject[]; near: ViewBox; wide?: ViewBox; stageEdgeZ: number; hearing: string };

export function makeLutePlanPage(built: BuiltLute, spec: LutePlanSpec) {
  const sc = built.scene;
  function Plan({ w, h, scene, items, wedges, highlight, onTap, label }: { w: number; h: number; scene: 'kit' | 'stage' | 'studio'; items: readonly SettingItem[]; wedges: readonly Wedge[]; highlight: string | null; onTap: (id: string) => void; label: string }) {
    const textScale = useStageTextScale();
    const wide: ViewBox = spec.wide ?? { u0: -2400, u1: 2600, v0: -2500, v1: 2700 };
    const box = scene === 'kit' ? spec.near : wide;
    const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
    const shownHere = (o: { scene: string }) => o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit');
    const objs = spec.objects.filter(shownHere);
    const chosen = items.find((i) => i.id === highlight);
    const lit = new Set<string>(chosen ? planIdsOf(chosen) : []);
    const f = sc.fit;
    const space = useMemo(() => rr(f.torso.min.x - 160, f.torso.min.z - 60, Math.max(f.torso.max.x, f.legs.max.x, f.fretBox.max.x) + 80, Math.max(f.legs.max.z, 200) + 40, 60), [f]);
    const hatch = useMemo(() => {
      const p = poly([], false);
      for (let d = -3000; d < 3000; d += 60) {
        p.moveTo(d, -3000);
        p.lineTo(d + 3000, 3000);
      }
      return p;
    }, []);
    const floorWedges = scene === 'stage' ? wedges.filter((wd) => wd.glyph !== 'none') : [];
    const walls = rr(wide.u0 + 200, wide.v0 + 200, wide.u1 - 200, wide.v1 - 200, 30);
    const labels: StaticLabel[] = [];
    const add = (it: SettingItem) => {
      for (const id of planIdsOf(it)) {
        const o = objs.find((q) => q.id === id);
        const wd = floorWedges.find((q) => q.id === id);
        const at = o ? o.at : wd ? { x: wd.p.x, z: wd.p.z } : null;
        if (!at) continue;
        // Behind the player (the chair, the tanpura): the label goes above, upstage.
        const behind = o?.kind === 'chair';
        const dz = o?.kind === 'audience' ? -120 : o?.kind === 'room' ? 0 : o?.kind === 'rug' ? (o.r ?? 1100) * 0.62 - 90 : behind ? -((o?.r ?? 260) + 70) : (o?.r ?? 260) + 80;
        labels.push({ id: `${it.id}:${id}`, text: it.short, u: at.x, v: at.z + dz, align: 'center', tone: highlight === it.id ? 'amber' : undefined });
        break;
      }
    };
    const visible = items.filter((i) => i.scene === 'all' || i.scene === scene || (scene !== 'kit' && i.scene === 'kit'));
    if (chosen) add(chosen);
    for (const it of visible) add(it);
    labels.push({ id: 'space', text: 'PLAYER’S SPACE', short: 'PLAYER', u: f.torso.min.x - 140, v: f.torso.min.z - 100, align: 'left', tone: 'illustrative' });
    const seen = new Set<string>();
    const uniq = labels.filter((l) => {
      const k = l.id.split(':')[0];
      return seen.has(k) ? false : (seen.add(k), true);
    });
    const tap = (x: number, y: number) => {
      const u = (x - xf.ox) / xf.s;
      const v = (y - xf.oy) / xf.s;
      const tol = 30 / xf.s;
      let best: { id: string; d: number } | null = null;
      const consider = (id: string, at: { x: number; z: number }, r: number) => {
        const d = Math.hypot(u - at.x, v - at.z) - r;
        if (d <= tol && (!best || d < best.d)) best = { id, d };
      };
      // The rug is everyone's floor: considered last, so what stands on it wins.
      for (const o of objs) if (o.kind !== 'rug') consider(o.id, o.at, o.r ?? 260);
      for (const wd of floorWedges) consider(wd.id, { x: wd.p.x, z: wd.p.z }, 300);
      if (!best) for (const o of objs) if (o.kind === 'rug') consider(o.id, o.at, (o.r ?? 1100) * 0.6);
      const b = best as { id: string; d: number } | null;
      if (!b) return;
      const it = visible.find((i) => planIdsOf(i).includes(b.id));
      if (it) onTap(it.id);
    };
    return (
      <View style={{ width: w, height: h }}>
        <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
          <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
            <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
              {scene === 'studio' ? <Path path={walls} style="stroke" strokeWidth={60} color="#2a2c32" /> : null}
              {scene === 'studio' && lit.has('room') ? <Path path={walls} style="stroke" strokeWidth={30} color={AMBER} opacity={0.8} /> : null}
              {scene === 'stage' ? (
                <Line p1={vec(wide.u0 + 100, spec.stageEdgeZ)} p2={vec(wide.u1 - 100, spec.stageEdgeZ)} color={lit.has('audience') ? AMBER : '#7a7f8a'} strokeWidth={lit.has('audience') ? 22 : 12}>
                  <DashPathEffect intervals={[60, 40]} />
                </Line>
              ) : null}
              {objs.filter((o) => o.kind === 'rug').map((o) => <RugPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'chair').map((o) => <ChairPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              <Group clip={space}>
                <Path path={hatch} style="stroke" strokeWidth={6} color={GREY} opacity={0.35} />
              </Group>
              <Path path={space} style="stroke" strokeWidth={6} color={GREY} opacity={0.7} />
              {objs.filter((o) => o.kind === 'tanpura').map((o) => <TanpuraPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'tabla').map((o) => <TablaPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'mridangam').map((o) => <MridangamPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'riq').map((o) => <RiqPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'sidefill').map((o) => <SideFillPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'pa').map((o) => <PaPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {floorWedges.map((wd) => (
                <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={lit.has(wd.id)} />
              ))}
              <LuteSceneArt sc={sc} view="top" />
              {lit.has('player') ? <Path path={space} style="stroke" strokeWidth={14} color={AMBER} opacity={0.85} /> : null}
              {objs.filter((o) => o.kind === 'vocal').map((o) => <VocalPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
            </Group>
          </Canvas>
        </Pressable>
        <StaticLabels labels={uniq} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }

  return function LutePlanPage({ lesson, answers, onAnswered }: PageProps): ReactNode {
    const C = copyOf(lesson);
    const items = lesson.setting.items;
    const nearItems = items.filter((i) => i.scene === 'all' || i.scene === 'kit');
    const [nearSel, setNearSel] = useState<string | null>(null);
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const [where, setWhere] = useState<'stage' | 'studio'>('stage');
    const [wideSel, setWideSel] = useState<string | null>(null);
    const wideItems = items.filter((i) => i.scene === where || i.scene === 'all' || i.scene === 'kit');
    const byId = (id: string | null) => items.find((i) => i.id === id);
    const pickNear = (id: string) => {
      if (!nearItems.some((i) => i.id === id)) return;
      setNearSel(id);
      setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    };
    const pickWide = (id: string) => {
      if (wideItems.some((i) => i.id === id)) setWideSel(id);
    };
    const fader = (list: readonly SettingItem[], sel: string | null, pick: (id: string) => void): DockParam => {
      const idx = Math.max(0, list.findIndex((i) => i.id === sel));
      return {
        kind: 'fader',
        id: 'item',
        label: 'ITEM',
        value: list.length > 1 ? idx / (list.length - 1) : 0,
        onChange: (v) => {
          const it = list[Math.round(v * (list.length - 1))];
          if (it) pick(it.id);
        },
        format: () => (sel ? `${byId(sel)?.short ?? ''} · ${byId(sel)?.tag ?? ''}` : `step through the ${list.length} items`),
        formatShort: () => (sel ? (byId(sel)?.short ?? '').slice(0, 9) : 'STEP'),
      };
    };
    const bezel = (sel: SettingItem | undefined, extra: BezelItem): BezelItem[] => [
      { k: 'ITEM', v: sel ? sel.short : 'TAP ONE', flex: 1.4 },
      { k: `FOR ${/^[aeiou]/i.test(lesson.noun.one) ? 'AN' : 'A'} ${lesson.noun.one.toUpperCase()} MIC`, v: sel ? sel.tag : '—', flex: 1.5 },
      extra,
    ];
    const card = (it: SettingItem | undefined, idle: string) =>
      it ? (
        <Card>
          <Point title={it.label.toUpperCase()}>{it.note}</Point>
        </Card>
      ) : (
        <Note>{idle}</Note>
      );
    const nearItem = byId(nearSel);
    const wideItem = byId(wideSel);
    const steps: MikingStep[] = [
      {
        key: 'near',
        title: 'Around the player',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <Plan w={w} h={h} scene="kit" items={items} wedges={lesson.live.wedges} highlight={nearSel} onTap={pickNear} label={`${C.setting.kitA11y} ${nearItem ? `Highlighted: ${nearItem.label}.` : ''} A typical layout.`} />,
          badge: 'From above · a typical layout · grey hatch = the player’s space',
          bezel: bezel(nearItem, { k: 'LOOKED AT', v: `${seen.size} / ${nearItems.length}`, flex: 1 }),
          params: [fader(nearItems, nearSel, pickNear)],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking="Plan · the player from above · the audience is down the screen" prompt={C.setting.kitLanding} />
            {card(nearItem, C.setting.kitIdle)}
            <Note>{C.setting.leftHanded}</Note>
          </>
        ),
      },
      {
        key: 'wide',
        title: 'Stage and studio',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <Plan w={w} h={h} scene={where} items={items} wedges={lesson.live.wedges} highlight={wideSel} onTap={pickWide} label={where === 'stage' ? C.setting.stageA11y : C.setting.studioA11y} />,
          badge: where === 'stage' ? 'From above · a typical small stage · the audience below the dashed edge' : 'From above · a typical studio room',
          bezel: bezel(wideItem, { k: 'WHERE', v: where === 'stage' ? 'LIVE' : 'STUDIO', flex: 1 }),
          params: [
            fader(wideItems, wideSel, pickWide),
            {
              kind: 'options',
              id: 'where',
              label: where === 'stage' ? 'STAGE' : 'STUDIO',
              valueLabel: where === 'stage' ? 'LIVE' : 'STUDIO',
              selectedId: where,
              onSelect: (id) => {
                setWhere(id as 'stage' | 'studio');
                setWideSel(null);
              },
              sticky: true,
              options: [
                { id: 'stage', label: 'ON A STAGE (LIVE)', blurb: lesson.setting.stage },
                { id: 'studio', label: 'IN A STUDIO', blurb: lesson.setting.studio },
              ],
            },
          ],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={where === 'stage' ? 'Plan · a small stage' : 'Plan · a studio room'} prompt="Switch STAGE / STUDIO, and tap what is new around the player." />
            <Body>{where === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
            {card(wideItem, where === 'stage' ? C.setting.stageIdle : C.setting.studioIdle)}
          </>
        ),
      },
      {
        key: 'before',
        title: 'Before any mic',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              {C.setting.before.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">{spec.hearing}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
