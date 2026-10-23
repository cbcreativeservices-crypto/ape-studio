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
import { tapsWhenFew } from '../../../engine/rack/fewStops.ts';
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
import { KitTop } from '../kitScene/KitSceneArt';
import { DI_XLR_TO, GUITAR_WIDE, STAGE_EDGE, stageEdgeCables, diCable, diCord, KIT_TURN, kitOriginAt, SIZES, WALL, diXlr, guitarCue, guitarPlanFoots, planFrame, shownIn, stringsPlan, type GuitarPlanOpts, type PlanKind, type PlanObject } from './stagePlanModel.ts';
import { clearOfFoots, labelPlaces, unionRect, type PlanFoot, type PlanPt } from '../planFoot.ts';
import { cueCables, cueHub, cueLabels, type CueRig } from '../monitoring/cueMix.ts';
import { CueMixPlan } from '../monitoring/CueMixPlan';

const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
/** The XLR's look (the speaker plan's, speakers/StagePlan XLR), at this plan's cable weight. */
const XLR = { color: '#666b75', w: 16, stripe: '#c3c7cf' } as const;
type SkPath = ReturnType<typeof Skia.Path.Make>;
type XZ = { x: number; z: number };

export type { PlanKind, PlanObject };
export type StagePlanSpec = {
  /** What the plan holds round the player and where the audience edge runs
   *  (stagePlanModel GUITAR_PLANS): the objects are laid out from the
   *  variant drawn. */
  plan: GuitarPlanOpts;
  /** The close-up box (lesson frame x, z). */
  near?: ViewBox;
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
    p.addCircle(base.x, base.z, SIZES.vocalBase);
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
  const C = SIZES.chair;
  const seat = rr(o.at.x - C.half, o.at.z - C.front, o.at.x + C.half, o.at.z + C.front, 60);
  const back = rr(o.at.x - C.half, o.at.z - C.back, o.at.x + C.half, o.at.z - C.back + C.backDepth, 24);
  return (
    <Group>
      <Path path={seat}>
        <LinearGradient start={vec(o.at.x - C.half, o.at.z - C.front)} end={vec(o.at.x + C.half, o.at.z + C.front)} colors={['#3a2a22', '#2a1d17', '#1a120e']} />
      </Path>
      <Path path={back} color="#140d0a" />
      <Halo path={seat} on={hi} />
    </Group>
  );
}

/** The DI: its input cord from the tail jack (its −v end) and, R2-MK-03, its
 *  XLR out from the far (+v) end to the plan's edge (stagePlanModel diXlr). */
function DiPlan({ o, hi, from, xlr }: { o: PlanObject; hi: boolean; from: XZ; xlr: readonly PlanPt[] }) {
  const { hu, hv } = SIZES.di;
  const box = rr(o.at.x - hu, o.at.z - hv, o.at.x + hu, o.at.z + hv, 12);
  const cable = useMemo(() => {
    const p = Skia.Path.Make();
    // R3-MK-06: the model's own curve (stagePlanModel diCord / diCable).
    const c = diCord(from, o.at);
    p.moveTo(c.p0.u, c.p0.v);
    p.cubicTo(c.c1.u, c.c1.v, c.c2.u, c.c2.v, c.p3.u, c.p3.v);
    return p;
  }, [from, o.at]);
  const xlrPath = useMemo(() => {
    const p = Skia.Path.Make();
    xlr.forEach((q, i) => (i ? p.lineTo(q.u, q.v) : p.moveTo(q.u, q.v)));
    return p;
  }, [xlr]);
  return (
    <Group>
      <Path path={cable} style="stroke" strokeWidth={10} color="#0b0c0f" strokeCap="round" />
      <Path path={xlrPath} style="stroke" strokeWidth={XLR.w} color={XLR.color} strokeCap="butt" strokeJoin="round" />
      <Path path={xlrPath} style="stroke" strokeWidth={4} color={XLR.stripe} strokeCap="butt">
        <DashPathEffect intervals={[40, 40]} />
      </Path>
      <Path path={box}>
        <LinearGradient start={vec(o.at.x - hu, o.at.z - hv)} end={vec(o.at.x + hu, o.at.z + hv)} colors={['#6b707b', '#3a3d45', '#1d1e23']} />
      </Path>
      <Path path={box} style="stroke" strokeWidth={3} color="#9aa0ab" />
      <Halo path={box} on={hi} />
    </Group>
  );
}

function AmpPlan({ o, hi }: { o: PlanObject; hi: boolean }) {
  const { hu, hv } = SIZES.amp;
  const cab = rr(o.at.x - hu, o.at.z - hv, o.at.x + hu, o.at.z + hv, 26);
  const handle = rr(o.at.x - 90, o.at.z - 26, o.at.x + 90, o.at.z + 26, 20);
  return (
    <Group>
      <Path path={cab} color="#000" opacity={0.5} transform={[{ translateX: 10 }, { translateY: 14 }]}>
        <BlurMask blur={18} style="normal" />
      </Path>
      <Path path={cab}>
        <LinearGradient start={vec(o.at.x - hu, o.at.z - hv)} end={vec(o.at.x + hu, o.at.z + hv)} colors={['#3b3e46', '#24262c', '#141519']} />
      </Path>
      <Path path={handle} color="#0c0d10" />
      <Path path={cab} style="stroke" strokeWidth={4} color="#5d616c" />
      <Halo path={cab} on={hi} />
    </Group>
  );
}

function KitFromAbove({ o, hi }: { o: PlanObject; hi: boolean }) {
  // the shared five-piece kit at true size, its drummer facing the audience
  const at = kitOriginAt(o.at);
  const outline = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(o.at.x - 960, o.at.z - 960, 1920, 1920), 160, 160));
    return p;
  }, [o.at.x, o.at.z]);
  return (
    <Group>
      <Group transform={[{ translateX: at.u }, { translateY: at.v }, { rotate: KIT_TURN }]}>
        <KitTop keepOuts={false} />
      </Group>
      <Halo path={outline} on={hi} />
    </Group>
  );
}

function PaPlan({ o, hi }: { o: PlanObject; hi: boolean }) {
  const { top, bottom, hv } = SIZES.pa;
  const p = useMemo(() => {
    const q = Skia.Path.Make();
    q.moveTo(o.at.x - top, o.at.z - hv);
    q.lineTo(o.at.x + top, o.at.z - hv);
    q.lineTo(o.at.x + bottom, o.at.z + hv);
    q.lineTo(o.at.x - bottom, o.at.z + hv);
    q.close();
    return q;
  }, [o.at.x, o.at.z, top, bottom, hv]);
  return (
    <Group>
      <Path path={p}>
        <LinearGradient start={vec(o.at.x - top, o.at.z - hv)} end={vec(o.at.x + top, o.at.z + hv)} colors={['#3b3e46', '#1d1e23', '#0f1013']} />
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
    p.addCircle(o.at.x, o.at.z, SIZES.sharedBase);
    return p;
  }, [o.at.x, o.at.z]);
  return (
    <Group>
      <Path path={ring}>
        <RadialGradient c={vec(o.at.x - 40, o.at.z - 40)} r={SIZES.sharedBase + 20} colors={['#5b5f69', '#2a2c32', '#16171b']} />
      </Path>
      <Path path={rr(o.at.x - 55, o.at.z - 90, o.at.x + 55, o.at.z + 90, 30)}>
        <LinearGradient start={vec(o.at.x - 55, o.at.z - 90)} end={vec(o.at.x + 55, o.at.z + 90)} colors={['#e7eaf0', '#8a909b', '#3a3d45']} />
      </Path>
      <Halo path={ring} on={hi} />
    </Group>
  );
}

/** Where a headphone-mix word points: its mixer, or the control-room box. */
function cuePoint(rig: CueRig, id: string): { u: number; v: number } {
  const st = rig.stations.find((q) => `cueMix:${q.id}` === id);
  if (st) return st.at;
  const r = cueHub(rig).rect;
  return { u: (r.u0 + r.u1) / 2, v: (r.v0 + r.v1) / 2 };
}

export function makeStagePlanPage(built: BuiltGuitarModel, spec: StagePlanSpec) {
  function Plan({ w, h, sc, scene, items, wedges, highlight, onTap, label }: { w: number; h: number; sc: GuitarScene; scene: 'kit' | 'stage' | 'studio'; items: readonly SettingItem[]; wedges: PageProps['lesson']['live']['wedges']; highlight: string | null; onTap: (id: string) => void; label: string }) {
    const g = sc.g;
    const textScale = useStageTextScale();
    const F = planFrame(sc);
    const near: ViewBox = spec.near ?? { u0: g.tail - 520, u1: g.L + g.spec.neck.headLen.mm + 260, v0: F.torsoZ0 - 260, v1: 1150 };
    const wide = GUITAR_WIDE;
    const edgeZ = spec.plan.stageEdgeZ;
    const box = scene === 'kit' ? near : wide;
    const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
    // Laid out from the variant drawn (a lap player and an upright one sit differently).
    const all = useMemo(() => stringsPlan(sc, spec.plan), [sc]);
    const objs = all.filter((o) => shownIn(o, scene));
    const chosen = items.find((i) => i.id === highlight);
    const lit = new Set<string>(chosen ? planIdsOf(chosen) : []);
    const space = useMemo(() => rr(F.space.u0, F.space.v0, F.space.u1, F.space.v1, 60), [F.space.u0, F.space.v0, F.space.u1, F.space.v1]);
    const hatch = useMemo(() => {
      const p = Skia.Path.Make();
      for (let d = -3000; d < 3000; d += 60) {
        p.moveTo(d, -3000);
        p.lineTo(d + 3000, 3000);
      }
      return p;
    }, []);
    const stageWedges = scene === 'stage' ? wedges.filter((wd) => wd.glyph !== 'none') : [];
    const walls = rr(wide.u0 + WALL.inset, wide.v0 + WALL.inset, wide.u1 - WALL.inset, wide.v1 - WALL.inset, 30);
    const tailJack = F.tailJack;
    // Every object's footprint (the close-up: its own objects only): the
    // words keep clear of them (owner 2026-10-15: no word on an object).
    const foots = useMemo<PlanFoot[]>(
      () => (scene === 'kit' ? guitarPlanFoots(sc, built.model.parts, all.filter((o) => shownIn(o, 'kit')), 'stage', []) : guitarPlanFoots(sc, built.model.parts, all, scene, wedges)),
      [sc, scene, wedges, all],
    );
    const cue = scene === 'studio' ? guitarCue(sc) : null;
    // R2-MK-03: the DI's XLR out (stage routing in the close-up, where it runs off the frame).
    const diObj = objs.find((o) => o.kind === 'di');
    const xlr = useMemo(() => (diObj ? diXlr(diObj.at, scene === 'studio' ? 'studio' : 'stage') : null), [diObj?.at.x, diObj?.at.z, scene]); // eslint-disable-line react-hooks/exhaustive-deps
    const footOf = (id: string) => {
      const ids = id === 'player' ? ['player', 'instrument'] : id === 'kit' ? foots.filter((f) => f.group === 'kit').map((f) => f.id) : [id];
      const fs = foots.filter((f) => ids.includes(f.id));
      return fs.length ? unionRect(fs) : null;
    };
    // Labels: the chosen item first, then the rest. Each name sits just
    // outside its object's footprint (below, right, left, above), else in
    // free space with a leader back to it.
    const labels: StaticLabel[] = [];
    const add = (it: SettingItem) => {
      for (const id of planIdsOf(it)) {
        const o = objs.find((q) => q.id === id);
        const wd = stageWedges.find((q) => q.id === id);
        if (!o && !wd) continue;
        const tone = highlight === it.id ? ('amber' as const) : undefined;
        if (o && (o.kind === 'audience' || o.kind === 'room')) {
          // The audience is named beyond the edge; the room in open floor.
          labels.push({ id: `${it.id}:${id}`, text: it.short, u: o.at.x, v: o.at.z, align: 'center', point: { u: o.at.x, v: o.at.z }, tone });
          break;
        }
        const own = footOf(id);
        if (!own) continue;
        const [first, ...alts] = labelPlaces(own, xf.s / textScale);
        labels.push({ id: `${it.id}:${id}`, text: it.short, u: first.u, v: first.v, align: first.align, alts, point: { u: (own.u0 + own.u1) / 2, v: (own.v0 + own.v1) / 2 }, tone });
        break;
      }
    };
    const visible = items.filter((i) => shownIn(i, scene));
    if (chosen) add(chosen);
    for (const it of visible) add(it);
    labels.push({ id: 'space', text: 'PLAYER’S SPACE', short: 'KEEP CLEAR', u: F.space.u0 + 20, v: F.space.v0 - 40, align: 'left', alts: [{ u: F.space.u0 - 40, v: F.space.v0 + 20, align: 'right' }], point: { u: F.space.u0 + 20, v: F.space.v0 + 20 }, tone: 'illustrative' });
    if (xlr && scene !== 'kit') {
      // The XLR's off-plan destination, named beside the cable's end.
      const end = xlr.pts[xlr.pts.length - 1];
      const k = textScale / xf.s;
      // R3-MK-05: on stage the cable ends at the upstage edge — its words step
      // down beside the cable's last run until they are clear.
      const down = scene === 'stage' ? [0, 1, 2, 3, 4, 5].map((n) => ({ u: end.u + 6 * k, v: end.v + (14 + 20 * n) * k, align: 'left' as const })) : [];
      const [first, ...alts] = [{ u: end.u + 40, v: end.v - 11 * k, align: 'left' as const }, { u: end.u + 40, v: end.v + 13 * k, align: 'left' as const }, ...down, ...labelPlaces({ u0: end.u, u1: end.u + 160, v0: end.v - 12, v1: end.v + 12 }, xf.s / textScale)];
      labels.push({ id: 'diXlrTo', text: DI_XLR_TO[scene], u: first.u, v: first.v, align: first.align, alts, point: { u: end.u + 80, v: end.v }, tone: 'illustrative' });
    }
    const seen = new Set<string>();
    const uniq: StaticLabel[] = [
      ...labels.filter((l) => {
        const k = l.id.split(':')[0];
        return seen.has(k) ? false : (seen.add(k), true);
      }),
      ...(cue ? cueLabels(cue).map((l) => ({ ...l, point: cuePoint(cue, l.id), tone: 'illustrative' as const })) : []),
    ];
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
              {scene === 'studio' ? <Path path={walls} style="stroke" strokeWidth={WALL.stroke} color="#2a2c32" /> : null}
              {scene === 'studio' && lit.has('room') ? <Path path={walls} style="stroke" strokeWidth={30} color={AMBER} opacity={0.8} /> : null}
              {scene === 'stage' ? (
                <Line p1={vec(wide.u0 + STAGE_EDGE.inset, edgeZ)} p2={vec(wide.u1 - STAGE_EDGE.inset, edgeZ)} color={lit.has('audience') ? AMBER : '#7a7f8a'} strokeWidth={lit.has('audience') ? 22 : 12}>
                  <DashPathEffect intervals={[60, 40]} />
                </Line>
              ) : null}
              <Path path={rr(F.rug.u0, F.rug.v0, F.rug.u1, F.rug.v1, 80)}>
                <LinearGradient start={vec(F.rug.u0, F.rug.v0)} end={vec(F.rug.u1, F.rug.v1)} colors={['#3a1c1f', '#2a1416', '#1c0d0f']} />
              </Path>
              <Group clip={space}>
                <Path path={hatch} style="stroke" strokeWidth={6} color={GREY} opacity={0.4} />
              </Group>
              <Path path={space} style="stroke" strokeWidth={6} color={GREY} opacity={0.7} />
              {objs.filter((o) => o.kind === 'chair').map((o) => <ChairPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'kit').map((o) => <KitFromAbove key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'bassAmp').map((o) => <AmpPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'pa').map((o) => <PaPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'di').map((o) => <DiPlan key={o.id} o={o} hi={lit.has(o.id)} from={tailJack} xlr={xlr?.pts ?? []} />)}
              {stageWedges.map((wd) => (
                <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={lit.has(wd.id)} />
              ))}
              <GuitarSceneArt sc={sc} view="top" />
              {lit.has('player') || lit.has('instrument') ? <Path path={space} style="stroke" strokeWidth={14} color={AMBER} opacity={0.85} /> : null}
              {objs.filter((o) => o.kind === 'vocal').map((o) => <VocalPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {objs.filter((o) => o.kind === 'shared').map((o) => <SharedMicPlan key={o.id} o={o} hi={lit.has(o.id)} />)}
              {/* Studio: the player's personal headphone mixer (no wedges in a studio). */}
              {cue ? <CueMixPlan rig={cue} /> : null}
            </Group>
          </Canvas>
        </Pressable>
        <StaticLabels labels={uniq} xf={xf} scale={textScale} w={w} h={h} clearOf={clearOfFoots(foots, [...(cue ? cueCables(cue) : []), ...(xlr ? [xlr] : []), ...(diObj ? [diCable(sc, diObj.at)] : []), ...(scene === 'stage' ? stageEdgeCables(edgeZ) : [])])} />
      </View>
    );
  }

  function StagePlanPage({ lesson, answers, onAnswered, variant }: PageProps): ReactNode {
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
      return tapsWhenFew(
        {
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
        },
        list.length,
        list.findIndex((q) => q.id === sel),
        (i) => list[i].short,
        (i) => pick(list[i].id),
      );
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
  }
  /** The plan drawing on its own (dev renders: scripts/artshot). */
  StagePlanPage.Plan = Plan;
  return StagePlanPage;
}

/** The plain hearing line every string lesson carries (the research's
 *  "missing hearing note" fix, in starting-points words). */
export const STRINGS_HEARING =
  'Protect your hearing during soundcheck and long sessions. NIOSH advises no more than 85 dBA averaged over an 8-hour day, halving the time for every 3 dB above that; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. These are limits for PEOPLE, measured where a person listens — not a microphone’s rating. Stage monitors and a loud band reach far higher than the instrument alone: keep levels and time down, and use hearing protection.';
