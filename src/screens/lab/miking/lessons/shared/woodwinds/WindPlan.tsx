/**
 * WindPlan — the woodwind section from above, for THE SETTING (LESSON_
 * JOURNEY §6 stage 3, §8). Every player is the family's own drawing (the
 * lesson's TOP view: the shared player figure, the chair, the instrument
 * with its keys) at true size in its seat — so a learner meets, from above,
 * exactly the instrument they will mic, among real neighbours: flutes and
 * piccolo, oboes, clarinets and bass clarinet, bassoons; the shared music
 * stands; then (STAGE) the lesson's floor wedges (the shared 2-way wedge),
 * the PA on the deck's corners and the audience's chairs, or (STUDIO) the
 * main pair above the conductor, the room, and a personal headphone mixer
 * at every player and the conductor, each fed from the CONTROL ROOM.
 *
 * The lesson's own player is lit with an amber ring; the item a learner taps
 * (or steps to with ITEM) is ringed too. Positions are a typical layout
 * (windPlanModel.ts, drawing defaults — the overlap test reads the same
 * numbers). Words keep clear of every object (owner 2026-10-15). Nothing
 * moves (D8); the neighbours' paths are built once (module caches).
 */
import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { SettingItem } from '../../../engine/model/types.ts';
import type { SettingPlanProps } from '../../../engine/scene/sceneTypes.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { ChairsTop, makeChairsTop } from '../../../../../../features/lab/audienceChairs';
import { WindScene } from './WindArt';
import { WedgePlan } from '../KitPlan';
import { PlanPaStack } from '../speakers/BacklinePlan';
import { CueMixPlan } from '../monitoring/CueMixPlan';
import { cueCables, cueLabels } from '../monitoring/cueMix.ts';
import { clearOfFoots, labelPlaces, wedgeFoot, type PlanRect } from '../planFoot.ts';
import { MAIN_LEG, PLAN_BOX, SLOTS, STAGE, STANDS, STAND_DESK, STAND_LEG, STAND_LEG_ANGLES, STUDIO_ROOM, mainRect, planHit, toPlan, windChairs, windCue, windFoots, windLayouts, windPlayerRect, type SlotId, type WindPlanConfig } from './windPlanModel.ts';

export type { WindPlanConfig } from './windPlanModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';

/* ── static furniture from above ── */
let furniture: { stands: SkPath; standLegs: SkPath; podium: SkPath; deck: SkPath; house: SkPath; walls: SkPath; floor: SkPath; mainBar: SkPath; mainMics: SkPath; mainLegs: SkPath; chairs: { seats: SkPath; backs: SkPath } } | null = null;
function furnitureOf() {
  if (furniture) return furniture;
  const stands = make();
  const standLegs = make();
  for (const s of STANDS) {
    // The desk, tilted toward the players (seen from above as a shallow
    // trapezoid), and the tripod's three feet.
    const { u, v } = s.at;
    const D = STAND_DESK;
    stands.moveTo(u - D.half, v + D.back);
    stands.lineTo(u + D.half, v + D.back);
    stands.lineTo(u + D.half - 14, v + D.front);
    stands.lineTo(u - D.half + 14, v + D.front);
    stands.close();
    for (const a of STAND_LEG_ANGLES) {
      standLegs.moveTo(u, v);
      standLegs.lineTo(u + Math.cos(a) * STAND_LEG, v + Math.sin(a) * STAND_LEG);
    }
  }
  const P = STAGE.podium;
  const podium = make();
  podium.addRRect(Skia.RRectXY(Skia.XYWHRect(P.u0, P.v0, P.u1 - P.u0, P.v1 - P.v0), 30, 30));
  const H = STAGE.hall;
  // The stage deck to its downstage edge; the audience's floor beyond.
  const deck = make();
  deck.addRect(Skia.XYWHRect(H.u0, H.v0, H.u1 - H.u0, STAGE.deckEdge - H.v0));
  const house = make();
  house.addRect(Skia.XYWHRect(H.u0, STAGE.deckEdge, H.u1 - H.u0, H.v1 - STAGE.deckEdge));
  // The studio: the floor inside the walls, the walls 70 thick outside it.
  const R = STUDIO_ROOM;
  const floor = make();
  floor.addRect(Skia.XYWHRect(R.u0, R.v0, R.u1 - R.u0, R.v1 - R.v0));
  const walls = make();
  walls.addRect(Skia.XYWHRect(R.u0 - 35, R.v0 - 35, R.u1 - R.u0 + 70, R.v1 - R.v0 + 70));
  const m = STAGE.main;
  const mainBar = make();
  mainBar.moveTo(m.u - 160, m.v);
  mainBar.lineTo(m.u + 160, m.v);
  const mainMics = make();
  for (const s of [-1, 1]) {
    mainMics.addRRect(Skia.RRectXY(Skia.XYWHRect(m.u + s * 130 - 11, m.v - 110, 22, 104), 9, 9));
  }
  const mainLegs = make();
  for (const a of STAND_LEG_ANGLES) {
    mainLegs.moveTo(m.u, m.v + 30);
    mainLegs.lineTo(m.u + Math.cos(a) * MAIN_LEG, m.v + 30 + Math.sin(a) * MAIN_LEG);
  }
  // The audience: one row of true-size empty chairs facing the stage — an
  // audience is its chairs, never heads (owner 2026-10-10).
  const chairs = makeChairsTop(windChairs());
  furniture = { stands, standLegs, podium, deck, house, walls, floor, mainBar, mainMics, mainLegs, chairs };
  return furniture;
}

/** The SettingPlan the engine's setting page (or the family's) draws. */
export function windPlanFor(cfg: WindPlanConfig) {
  return function WindPlanView(p: SettingPlanProps): ReactElement {
    return <WindPlan {...p} cfg={cfg} />;
  };
}

const planIds = (it: SettingItem): readonly string[] => it.planIds ?? [it.id];

function WindPlan({ w, h, scene, variant, items, wedges, highlight, onTap, accessibilityLabel, cfg }: SettingPlanProps & { cfg: WindPlanConfig }) {
  const textScale = useStageTextScale();
  const box = scene === 'kit' ? PLAN_BOX.section : scene === 'stage' ? PLAN_BOX.wideStage : PLAN_BOX.wide;
  const xf = useMemo(() => fitXform('top', box, w, h, 4), [box, w, h]);
  const f = furnitureOf();
  const own = cfg.own;
  const lay = useMemo(() => windLayouts(cfg, variant), [cfg, variant]);
  const shown = items.filter((i) => i.scene === 'all' || i.scene === scene || (scene !== 'kit' && i.scene === 'kit'));
  const lit = new Set<string>(highlight ? planIds(items.find((i) => i.id === highlight) ?? ({ id: highlight } as SettingItem)) : []);
  const o = SLOTS[own].at;
  const wedgesAt = wedges.filter((wd) => wd.glyph !== 'none').map((wd) => ({ id: wd.id, at: toPlan(own, { x: wd.p.x, z: wd.p.z }) }));
  // Collision pass 2026-10-15: every object's footprint (the overlap test's
  // numbers); the words keep clear of them all. STUDIO: the headphone mix.
  const foots = useMemo(() => windFoots(own, lay, scene, wedges), [own, lay, scene, wedges]);
  const rigs = useMemo(() => (scene === 'studio' ? windCue(lay) : []), [scene, lay]);
  const ringAt = (id: string): { u: number; v: number; r: number } | null => {
    if (id === 'self') return { u: o.u - 120, v: o.v, r: 640 };
    const s = SLOTS[id as SlotId];
    if (s) return { u: s.at.u + (s.kind === 'flute' || s.kind === 'piccolo' ? -180 : 0), v: s.at.v - 40, r: 600 };
    const st = STANDS.find((q) => q.id === id);
    if (st) return { u: st.at.u, v: st.at.v, r: 300 };
    if (id === 'conductor') return { u: STAGE.conductor.u, v: STAGE.conductor.v, r: 520 };
    if (id === 'main') return { u: STAGE.main.u, v: STAGE.main.v, r: 380 };
    const wd = wedgesAt.find((q) => q.id === id);
    if (wd) return { u: wd.at.u, v: wd.at.v, r: 420 };
    return null;
  };
  const rings = [...lit].map(ringAt).filter((x): x is { u: number; v: number; r: number } => !!x);
  const tap = (sx: number, sy: number) => {
    const u = (sx - xf.ox) / xf.s;
    const v = (sy - xf.oy) / xf.s;
    const hit = planHit(u, v, 40 / xf.s, { scene, wedges: wedgesAt });
    if (!hit) return;
    const id = hit === own ? 'self' : hit;
    const it = shown.find((i) => planIds(i).includes(id));
    if (it) onTap(it.id);
  };
  // Each name just outside its object (below, right, left, above), else in
  // free space with a leader back to it. The lesson's own player is named
  // first, so its words are never the ones left out.
  const s = xf.s / textScale;
  const nameAt = (id: string, r: PlanRect, text: string, short: string | undefined, tone: StaticLabel['tone']): StaticLabel => {
    const [first, ...alts] = labelPlaces(r, s);
    return { id, text, ...(short ? { short } : {}), u: first.u, v: first.v, align: first.align, alts, point: { u: (r.u0 + r.u1) / 2, v: (r.v0 + r.v1) / 2 }, tone };
  };
  const slotRect = (id: SlotId): PlanRect => {
    const r = windPlayerRect(lay(id));
    const a = SLOTS[id].at;
    return { u0: a.u + r.u0, u1: a.u + r.u1, v0: a.v + r.v0, v1: a.v + r.v1 };
  };
  const labels: StaticLabel[] = [nameAt(own, slotRect(own), cfg.ownLabel, SLOTS[own].label, 'amber')];
  for (const [id, sl] of Object.entries(SLOTS) as [SlotId, (typeof SLOTS)[SlotId]][]) if (id !== own) labels.push(nameAt(id, slotRect(id), sl.label, sl.label.split(' ')[0], 'muted'));
  if (scene !== 'kit') labels.push(nameAt('cond', STAGE.podium, 'CONDUCTOR', undefined, 'muted'));
  if (scene === 'stage') {
    for (const wd of wedges) {
      if (wd.glyph === 'none') continue;
      labels.push(nameAt(`w.${wd.id}`, wedgeFoot(wd, { x: o.u, y: 0, z: o.v }), wd.short, undefined, 'blue'));
    }
    labels.push({ id: 'aud', text: 'AUDIENCE', u: -100, v: STAGE.chairRowV + 40, align: 'center', point: { u: -100, v: STAGE.chairRowV }, tone: 'muted' });
  }
  if (scene === 'studio') {
    labels.push(nameAt('main', mainRect(), 'MAIN PAIR', 'MAIN', 'blue'));
    for (const rig of rigs) labels.push(...cueLabels(rig, undefined, [own]).map((l) => ({ ...l, tone: 'illustrative' as const })));
  }
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {/* the floor: the stage deck and the house beyond it, or the studio room */}
            {scene === 'studio' ? (
              <>
                <Path path={f.floor}>
                  <LinearGradient start={vec(0, STUDIO_ROOM.v0)} end={vec(0, STUDIO_ROOM.v1)} colors={['#17181d', '#121317', '#0d0e11']} />
                </Path>
                <Path path={f.walls} style="stroke" strokeWidth={70} color="#2a2d35" />
              </>
            ) : (
              <>
                <Path path={f.deck}>
                  <LinearGradient start={vec(0, STAGE.hall.v0)} end={vec(0, STAGE.deckEdge)} colors={['#1a1714', '#141210', '#0e0c0b']} />
                </Path>
                {scene === 'stage' ? <Path path={f.house} color="#0b0b0d" /> : null}
              </>
            )}
            {scene === 'stage' ? (
              <>
                {STAGE.pa.map((p) => (
                  <Group key={p.u} transform={[{ translateX: p.u }, { translateY: p.v }, { rotate: Math.PI / 2 }]}>
                    <PlanPaStack />
                  </Group>
                ))}
                <ChairsTop seats={f.chairs.seats} backs={f.chairs.backs} color="#7d828d" />
              </>
            ) : null}
            {scene !== 'kit' ? (
              <>
                <Path path={f.podium}>
                  <LinearGradient start={vec(STAGE.podium.u0, STAGE.podium.v0)} end={vec(STAGE.podium.u1, STAGE.podium.v1)} colors={['#4a3a2c', '#2a2018']} />
                </Path>
                <Path path={f.podium} style="stroke" strokeWidth={8} color="#120d09" />
                <Circle cx={STAGE.conductor.u} cy={STAGE.conductor.v + 40} r={110}>
                  <RadialGradient c={vec(STAGE.conductor.u - 40, STAGE.conductor.v)} r={140} colors={['#7c8492', '#3b404a']} />
                </Circle>
              </>
            ) : null}
            {/* the shared music stands */}
            <Path path={f.standLegs} style="stroke" strokeWidth={22} color="#0e0f12" strokeCap="round" />
            <Path path={f.standLegs} style="stroke" strokeWidth={9} color="#5d636e" strokeCap="round" />
            <Path path={f.stands}>
              <LinearGradient start={vec(0, -60)} end={vec(0, 40)} colors={['#2c2f36', '#121317']} />
            </Path>
            <Path path={f.stands} style="stroke" strokeWidth={8} color="#4d525c" />
            {/* the players, each with its own instrument, from above */}
            {(Object.entries(SLOTS) as [SlotId, (typeof SLOTS)[SlotId]][]).map(([id, sl]) => (
              <Group key={id} transform={[{ translateX: sl.at.u }, { translateY: sl.at.v }]}>
                <WindScene L={lay(id)} view="top" showJet={false} playerDim={id === own ? 1 : 0.62} />
              </Group>
            ))}
            {/* STAGE: the lesson's floor wedges (the shared 2-way wedge), in its own frame */}
            {scene === 'stage' ? (
              <Group transform={[{ translateX: o.u }, { translateY: o.v }]}>
                {wedges
                  .filter((wd) => wd.glyph !== 'none')
                  .map((wd) => (
                    <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={false} />
                  ))}
              </Group>
            ) : null}
            {/* STUDIO: the main pair, and every performer's headphone mixer */}
            {scene === 'studio' ? (
              <>
                <Path path={f.mainLegs} style="stroke" strokeWidth={22} color="#0e0f12" strokeCap="round" />
                <Path path={f.mainLegs} style="stroke" strokeWidth={10} color="#7d838e" strokeCap="round" />
                <Path path={f.mainBar} style="stroke" strokeWidth={22} color="#9aa1ad" strokeCap="round" />
                <Path path={f.mainMics} color="#d4d8df" />
                {rigs.map((rig) => (
                  <CueMixPlan key={rig.id} rig={rig} />
                ))}
              </>
            ) : null}
            {/* the lesson's own player, and whatever is highlighted */}
            <Circle cx={o.u - 120} cy={o.v} r={650} style="stroke" strokeWidth={14} color={AMBER} opacity={0.75}>
              <DashPathEffect intervals={[60, 40]} />
            </Circle>
            {rings.map((r, i) => (
              <Circle key={i} cx={r.u} cy={r.v} r={r.r} style="stroke" strokeWidth={22} color={AMBER}>
                <BlurMask blur={8} style="solid" />
              </Circle>
            ))}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} h={h} clearOf={clearOfFoots(foots, rigs.flatMap(cueCables))} />
      </View>
    </Pressable>
  );
}
