/**
 * THE SETTING for the plucked-string family (LESSON_JOURNEY §6 stage 3, §8):
 * the player and the instrument from above, at the lesson's real scale, with
 * what sits round them as illustrated real objects — a vocal mic on its
 * stand, the chair, a floor wedge, a DI box and its cable, the band's other
 * sources, the PA and the audience edge, or a studio room.
 *
 *   AROUND THE PLAYER (rack)  the plan close up: tap an item (or step through
 *                             ITEM) to read what it means for a mic on this
 *                             instrument. Explore: nothing to answer.
 *   STAGE AND STUDIO (rack)   the wider plan: STAGE (the lesson's own monitor
 *                             positions — the ones Studio-or-live uses — the
 *                             band, the PA, the audience) or STUDIO.
 *   BEFORE ANY MIC (read)     ask the player; hear it unamplified; hearing
 *                             safety in plain words; the three checks.
 * Credit: the three checks. Positions are a typical layout (badged so); none
 * is a source's figure (each item's `prov` says so, internally).
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SettingItem, ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { copyOf } from '../../../engine/model/copy.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { WedgePlan, planIdsOf } from '../KitPlan';
import type { BuiltGuitarModel, GuitarScene } from './guitarModel.ts';
import { GuitarSceneArt } from './GuitarArt';

const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
type SkPath = ReturnType<typeof Skia.Path.Make>;
type XZ = { x: number; z: number };

export type PlanKind = 'wedge' | 'vocal' | 'chair' | 'di' | 'bassAmp' | 'kit' | 'pa' | 'player' | 'audience' | 'room' | 'shared';
export type PlanObject = { id: string; kind: PlanKind; at: XZ; faces?: XZ; scene: 'kit' | 'stage' | 'studio' | 'all'; r?: number };
export type StagePlanSpec = {
  objects: readonly PlanObject[];
  /** The close-up box and the wide box (lesson frame x, z). */
  near?: ViewBox;
  wide?: ViewBox;
  /** Where the audience edge runs (z) on a stage. */
  stageEdgeZ: number;
  /** The hearing note (strings words). */
  hearing: string;
};

const rr = (x0: number, z0: number, x1: number, z1: number, r: number): SkPath => {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(z0, z1), Math.abs(x1 - x0), Math.abs(z1 - z0)), r, r));
  return p;
};

function Halo({ path, on }: { path: SkPath; on: boolean }) {
  return on ? <Path path={path} style="stroke" strokeWidth={16} color={AMBER} opacity={0.9} /> : null;
}

/** A vocal mic on a round-base stand, its boom to the mic at `at`, from above. */
function VocalPlan({ o, hi }: { o: PlanObject; hi: boolean }) {
  const base = o.faces ?? { x: o.at.x, z: o.at.z + 380 };
  const ring = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(base.x, base.z, 125);
    return p;
  }, [base.x, base.z]);
  const mic = rr(o.at.x - 26, o.at.z - 70, o.at.x + 26, o.at.z + 70, 26);
  return (
    <Group>
      <Path path={ring} color="#000" opacity={0.5} transform={[{ translateX: 8 }, { translateY: 10 }]}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={ring}>
        <RadialGradient c={vec(base.x - 40, base.z - 40)} r={150} colors={['#5b5f69', '#2a2c32', '#16171b']} />
      </Path>
      <Line p1={vec(base.x, base.z)} p2={vec(o.at.x, o.at.z + 60)} color="#7a7f8a" strokeWidth={12} strokeCap="round" />
      <Path path={mic}>
        <LinearGradient start={vec(o.at.x - 26, o.at.z - 70)} end={vec(o.at.x + 26, o.at.z + 70)} colors={['#c8ccd4', '#6b707b', '#2b2d33']} />
      </Path>
      <Halo path={ring} on={hi} />
    </Group>
  );
}

function ChairPlan({ o, hi }: { o: PlanObject; hi: boolean }) {
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

function DiPlan({ o, hi, from }: { o: PlanObject; hi: boolean; from: XZ }) {
  const box = rr(o.at.x - 60, o.at.z - 75, o.at.x + 60, o.at.z + 75, 12);
  const cable = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(from.x, from.z);
    p.cubicTo(from.x - 120, from.z + 60, o.at.x + 80, o.at.z - 160, o.at.x, o.at.z - 75);
    return p;
  }, [from.x, from.z, o.at.x, o.at.z]);
  return (
    <Group>
      <Path path={cable} style="stroke" strokeWidth={10} color="#0b0c0f" strokeCap="round" />
      <Path path={box}>
        <LinearGradient start={vec(o.at.x - 60, o.at.z - 75)} end={vec(o.at.x + 60, o.at.z + 75)} colors={['#6b707b', '#3a3d45', '#1d1e23']} />
      </Path>
      <Path path={box} style="stroke" strokeWidth={3} color="#9aa0ab" />
      <Halo path={box} on={hi} />
    </Group>
  );
}

function AmpPlan({ o, hi }: { o: PlanObject; hi: boolean }) {
  const cab = rr(o.at.x - 320, o.at.z - 190, o.at.x + 320, o.at.z + 190, 26);
  const handle = rr(o.at.x - 90, o.at.z - 26, o.at.x + 90, o.at.z + 26, 20);
  return (
    <Group>
      <Path path={cab} color="#000" opacity={0.5} transform={[{ translateX: 10 }, { translateY: 14 }]}>
        <BlurMask blur={18} style="normal" />
      </Path>
      <Path path={cab}>
        <LinearGradient start={vec(o.at.x - 320, o.at.z - 190)} end={vec(o.at.x + 320, o.at.z + 190)} colors={['#3b3e46', '#24262c', '#141519']} />
      </Path>
      <Path path={handle} color="#0c0d10" />
      <Path path={cab} style="stroke" strokeWidth={4} color="#5d616c" />
      <Halo path={cab} on={hi} />
    </Group>
  );
}

function KitFromAbove({ o, hi }: { o: PlanObject; hi: boolean }) {
  const drums = [
    { dx: 0, dz: 0, r: 280 },
    { dx: -380, dz: 140, r: 180 },
    { dx: -180, dz: -240, r: 130 },
    { dx: 140, dz: -260, r: 150 },
    { dx: 420, dz: 120, r: 205 },
  ];
  const cymbals = [
    { dx: -600, dz: -60, r: 180 },
    { dx: -320, dz: -480, r: 205 },
    { dx: 560, dz: -380, r: 255 },
  ];
  const outline = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(o.at.x - 860, o.at.z - 760, 1720, 1300), 120, 120));
    return p;
  }, [o.at.x, o.at.z]);
  return (
    <Group>
      {drums.map((d, i) => (
        <Group key={`d${i}`}>
          <Circle cx={o.at.x + d.dx} cy={o.at.z + d.dz} r={d.r + 12}>
            <LinearGradient start={vec(o.at.x + d.dx - d.r, o.at.z + d.dz - d.r)} end={vec(o.at.x + d.dx + d.r, o.at.z + d.dz + d.r)} colors={['#eef1f6', '#9aa0ab', '#4a4e57']} />
          </Circle>
          <Circle cx={o.at.x + d.dx} cy={o.at.z + d.dz} r={d.r}>
            <RadialGradient c={vec(o.at.x + d.dx - d.r * 0.3, o.at.z + d.dz - d.r * 0.3)} r={d.r * 1.2} colors={['#fbf8f0', '#e6dfcd', '#cbbfa5']} />
          </Circle>
        </Group>
      ))}
      {cymbals.map((c, i) => (
        <Circle key={`c${i}`} cx={o.at.x + c.dx} cy={o.at.z + c.dz} r={c.r} opacity={0.75}>
          <RadialGradient c={vec(o.at.x + c.dx - c.r * 0.3, o.at.z + c.dz - c.r * 0.3)} r={c.r * 1.2} colors={['#f6d58f', '#d2a04a', '#9a6a24']} />
        </Circle>
      ))}
      <Halo path={outline} on={hi} />
    </Group>
  );
}

function PaPlan({ o, hi }: { o: PlanObject; hi: boolean }) {
  const p = useMemo(() => {
    const q = Skia.Path.Make();
    q.moveTo(o.at.x - 300, o.at.z - 220);
    q.lineTo(o.at.x + 300, o.at.z - 220);
    q.lineTo(o.at.x + 240, o.at.z + 220);
    q.lineTo(o.at.x - 240, o.at.z + 220);
    q.close();
    return q;
  }, [o.at.x, o.at.z]);
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

/** One shared vocal-and-instrument mic for a bluegrass band (a large stand mic). */
function SharedMicPlan({ o, hi }: { o: PlanObject; hi: boolean }) {
  const ring = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(o.at.x, o.at.z, 150);
    return p;
  }, [o.at.x, o.at.z]);
  return (
    <Group>
      <Path path={ring}>
        <RadialGradient c={vec(o.at.x - 40, o.at.z - 40)} r={170} colors={['#5b5f69', '#2a2c32', '#16171b']} />
      </Path>
      <Path path={rr(o.at.x - 55, o.at.z - 90, o.at.x + 55, o.at.z + 90, 30)}>
        <LinearGradient start={vec(o.at.x - 55, o.at.z - 90)} end={vec(o.at.x + 55, o.at.z + 90)} colors={['#e7eaf0', '#8a909b', '#3a3d45']} />
      </Path>
      <Halo path={ring} on={hi} />
    </Group>
  );
}

export function makeStagePlanPage(built: BuiltGuitarModel, spec: StagePlanSpec) {
  function Plan({ w, h, sc, scene, items, wedges, highlight, onTap, label }: { w: number; h: number; sc: GuitarScene; scene: 'kit' | 'stage' | 'studio'; items: readonly SettingItem[]; wedges: PageProps['lesson']['live']['wedges']; highlight: string | null; onTap: (id: string) => void; label: string }) {
    const g = sc.g;
    const textScale = useStageTextScale();
    const fit = sc.fit;
    const lap = sc.o.lap;
    const torsoZ0 = lap ? fit.torso.min.y : fit.torso.min.z;
    const near: ViewBox = spec.near ?? { u0: g.tail - 520, u1: g.L + g.spec.neck.headLen.mm + 260, v0: torsoZ0 - 260, v1: 1150 };
    const wide: ViewBox = spec.wide ?? { u0: -2400, u1: 2600, v0: -2500, v1: 2700 };
    const box = scene === 'kit' ? near : wide;
    const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
    const shownHere = (o: { scene: string }) => o.scene === 'all' || o.scene === scene || (scene !== 'kit' && o.scene === 'kit');
    const objs = spec.objects.filter(shownHere);
    const chosen = items.find((i) => i.id === highlight);
    const lit = new Set<string>(chosen ? planIdsOf(chosen) : []);
    const space = useMemo(() => rr(Math.min(g.tail, fit.torso.min.x) - 60, torsoZ0 - 60, g.L + 60, 320, 60), [g.tail, g.L, fit.torso.min.x, torsoZ0]);
    const hatch = useMemo(() => {
      const p = Skia.Path.Make();
      for (let d = -3000; d < 3000; d += 60) {
        p.moveTo(d, -3000);
        p.lineTo(d + 3000, 3000);
      }
      return p;
    }, []);
    const stageWedges = scene === 'stage' ? wedges.filter((wd) => wd.glyph !== 'none') : [];
    const walls = rr(wide.u0 + 200, wide.v0 + 200, wide.u1 - 200, wide.v1 - 200, 30);
    const tailJack = { x: g.tail - 20, z: lap ? 0 : -g.depth / 2 };
    // Labels: the chosen item first, then the rest (collisions cull later ones).
    const labels: StaticLabel[] = [];
    const add = (it: SettingItem) => {
      for (const id of planIdsOf(it)) {
        const o = objs.find((q) => q.id === id);
        const wd = stageWedges.find((q) => q.id === id);
        const at = o ? o.at : wd ? { x: wd.p.x, z: wd.p.z } : null;
        if (!at) continue;
        const dz = o?.kind === 'audience' ? -120 : o?.kind === 'room' ? 0 : (o?.r ?? 260) + 80;
        labels.push({ id: `${it.id}:${id}`, text: it.short, u: at.x, v: at.z + dz, align: 'center', tone: highlight === it.id ? 'amber' : undefined });
        break;
      }
    };
    const visible = items.filter((i) => i.scene === 'all' || i.scene === scene || (scene !== 'kit' && i.scene === 'kit'));
    if (chosen) add(chosen);
    for (const it of visible) add(it);
    labels.push({ id: 'space', text: 'PLAYER’S SPACE', short: 'PLAYER', u: Math.min(g.tail, fit.torso.min.x) - 40, v: torsoZ0 - 100, align: 'left', tone: 'illustrative' });
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
      const consider = (id: string, at: XZ, r: number) => {
        const d = Math.hypot(u - at.x, v - at.z) - r;
        if (d <= tol && (!best || d < best.d)) best = { id, d };
      };
      for (const o of objs) consider(o.id, o.at, o.kind === 'kit' ? 800 : o.kind === 'audience' || o.kind === 'room' ? 300 : o.r ?? 260);
      for (const wd of stageWedges) consider(wd.id, { x: wd.p.x, z: wd.p.z }, 300);
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
              <Path path={rr(g.tail - 700, torsoZ0 - 450, g.L + 500, 800, 80)}>
                <LinearGradient start={vec(g.tail - 700, torsoZ0 - 450)} end={vec(g.L + 500, 800)} colors={['#3a1c1f', '#2a1416', '#1c0d0f']} />
              </Path>
              <Group clip={space}>
                <Path path={hatch} style="stroke" strokeWidth={6} color={GREY} opacity={0.4} />
              </Group>
              <Path path={space} style="stroke" strokeWidth={6} color={GREY} opacity={0.7} />
              {objs.filter((o) => o.kind === 'chair').map((o) => <ChairPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'kit').map((o) => <KitFromAbove key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'bassAmp').map((o) => <AmpPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'pa').map((o) => <PaPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'di').map((o) => <DiPlan key={o.id} o={o} hi={lit.has(o.id)} from={tailJack} />)}
              {stageWedges.map((wd) => (
                <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={lit.has(wd.id)} />
              ))}
              <GuitarSceneArt sc={sc} view="top" />
              {lit.has('player') || lit.has('instrument') ? <Path path={space} style="stroke" strokeWidth={14} color={AMBER} opacity={0.85} /> : null}
              {objs.filter((o) => o.kind === 'vocal').map((o) => <VocalPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'shared').map((o) => <SharedMicPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
            </Group>
          </Canvas>
        </Pressable>
        <StaticLabels labels={uniq} xf={xf} scale={textScale} w={w} />
      </View>
    );
  }

  return function StagePlanPage({ lesson, answers, onAnswered, variant }: PageProps): ReactNode {
    const C = copyOf(lesson);
    const sc = built.scenes[variant] ?? built.scenes[built.model.defaultVariant];
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
      { k: `FOR A ${lesson.noun.one.toUpperCase()} MIC`, v: sel ? sel.tag : '—', flex: 1.5 },
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
          render: (w, h) => <Plan w={w} h={h} sc={sc} scene="kit" items={items} wedges={lesson.live.wedges} highlight={nearSel} onTap={pickNear} label={`${C.setting.kitA11y} ${nearItem ? `Highlighted: ${nearItem.label}.` : ''} A typical layout.`} />,
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
          render: (w, h) => <Plan w={w} h={h} sc={sc} scene={where} items={items} wedges={lesson.live.wedges} highlight={wideSel} onTap={pickWide} label={where === 'stage' ? C.setting.stageA11y : C.setting.studioA11y} />,
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

/** The plain hearing line every string lesson carries (the research's
 *  "missing hearing note" fix, in starting-points words). */
export const STRINGS_HEARING =
  'Protect your hearing during soundcheck and long sessions. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. It is a limit for PEOPLE, measured where a person listens — not a microphone’s rating. Stage monitors and a loud band reach far higher than the instrument alone: keep levels and time down, and use hearing protection.';
