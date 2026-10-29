/**
 * WHERE IT SITS for the hand plans (M12 tonbak, M13 tabla, I06a/b/c, I12,
 * A10, A11): the player and the instrument — the lesson's own top-view
 * drawing, at its real scale — with what sits round them on a stage (the
 * wedge, the side fill, louder neighbors, the audience and the PA) or in a
 * studio room. Plan coordinates are the lesson's top view (u = x toward the
 * audience, right on screen; v = z, the player's right, down on screen), so
 * the wedge stands where the Studio-or-live page puts it. The STAGE is drawn
 * turned a quarter (DOWNSTAGE = BOTTOM, owner 2026-10-16; planFoot planTurn):
 * the audience below, the player's right to screen-left.
 *
 * Positions are a typical layout, never a measurement. The layout is the pure
 * handPlanModel.ts (the plans' overlap test reads the same numbers).
 * Collision pass 2026-10-15: no object on another, no word on an object (the
 * labels keep clear of every footprint, else move to free space with a
 * leader); the wedges are the shared floor wedge; a STUDIO draws no wedges —
 * the performer's personal headphone mixer, fed from the CONTROL ROOM.
 * Static: it changes only when the learner taps or switches (D8).
 * Tap → the item under the finger.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform, unproject } from '../../../engine/geometry/frame.ts';
import type { VariantId, ViewBox, Wedge } from '../../../engine/model/types.ts';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { HeadIconPaths, aboveRotation, makeHeadIconPaths } from '../../../../../../features/lab/headIcons';
import { ChairsTop, chairRowFacingStage, makeChairsTop } from '../../../../../../features/lab/audienceChairs';
import { clearOfFoots, planTurn, type PlanRect } from '../planFoot.ts';
import { cueCables, cueHub, cueLabels } from '../monitoring/cueMix.ts';
import { CueMixPlan } from '../monitoring/CueMixPlan';
import { WedgePlan } from '../KitPlan';
import { PlanAmpTop } from '../speakers/BacklinePlan';
import { AUDIENCE_LABEL_AT, AUDIENCE_ROW, BAND_AMP, BAND_HEADS, DECK_EDGE_U, HAND_STAGE_BOX, PA_RECTS, PLAN_HEAD_MM, drawnWedges, handCue, handFoots, handObjectRect, handPlanBox, handRoom, isHandLesson, outsideAisle, type HandScene } from './handPlanModel.ts';

export type { HandScene } from './handPlanModel.ts';
/** An item on the plan: its tap/highlight box (plan mm) and where it shows.
 *  The scene objects the plan draws itself (wedge, side fill, band,
 *  audience, room) take their box from the layout, not from here. */
export type HandPlanItem = { id: string; box: ViewBox; scene: HandScene | 'all'; label?: { u: number; v: number; align?: 'left' | 'center' | 'right' } };

const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
const make = () => Skia.Path.Make();
type SkPath = ReturnType<typeof make>;

function rr(p: SkPath, u0: number, v0: number, u1: number, v1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}
/** The deck: the stage box up to the deck's downstage edge. */
const HAND_DECK = { u0: HAND_STAGE_BOX.u0, u1: DECK_EDGE_U, v0: HAND_STAGE_BOX.v0, v1: HAND_STAGE_BOX.v1 };
const mid = (r: PlanRect) => ({ u: (r.u0 + r.u1) / 2, v: (r.v0 + r.v1) / 2 });

export function HandPlan({ w, h, lessonId, art, variant, scene, wedges, items, labelOf, highlight, onTap, accessibilityLabel }: {
  w: number;
  h: number;
  /** The lesson (its performer and headphone station in handPlanModel). */
  lessonId: string;
  art: LessonArt;
  variant: VariantId;
  scene: HandScene;
  wedges: readonly Wedge[];
  items: readonly HandPlanItem[];
  labelOf: (id: string) => string;
  highlight: string | null;
  onTap: (id: string) => void;
  accessibilityLabel: string;
}) {
  const textScale = useStageTextScale();
  const box = useMemo(() => handPlanBox(lessonId, scene, variant), [lessonId, scene, variant]);
  // DOWNSTAGE = BOTTOM (owner 2026-10-16): the stage is drawn turned, the audience below.
  const T = useMemo(() => planTurn(scene === 'stage'), [scene]);
  const xf = useMemo(() => fitXform('top', T.rect(box), w, h, 6), [T, box, w, h]);
  const Instrument = art.Instrument;
  const hand = isHandLesson(lessonId) ? lessonId : null;
  const shown = items.filter((i) => i.scene === 'all' || i.scene === scene);
  const g = useMemo(() => {
    // Two seated neighbours from above, as plan MARKERS — the owner's ABOVE
    // head icon, facing the audience (+u) — and their amp behind them.
    // Head fix 2026-10-08: a lone head marker is the shared icon, never a
    // circle (and never an icon on a drawn body, so no shoulder outline).
    const band = makeHeadIconPaths(
      'above',
      PLAN_HEAD_MM,
      BAND_HEADS.map((b) => ({ x: b.u, y: b.v, rotation: aboveRotation(1, 0) })),
    );
    const deck = rr(make(), HAND_DECK.u0, HAND_DECK.v0, HAND_DECK.u1, HAND_DECK.v1, 0);
    const pa = make();
    for (const r of PA_RECTS) rr(pa, r.u0, r.v0, r.u1, r.v1, 30);
    // The audience: one row of true-size empty chairs facing the stage (−u),
    // with a centre aisle — an audience is its chairs, never heads (owner 2026-10-10).
    const audience = makeChairsTop(chairRowFacingStage(AUDIENCE_ROW.u, AUDIENCE_ROW.v0, AUDIENCE_ROW.v1).filter(outsideAisle));
    return { band, deck, pa, audience };
  }, []);
  // The studio room: its inner wall faces from the layout, the wall outside them.
  const room = useMemo(() => {
    const r = handRoom(lessonId, variant);
    return rr(make(), r.u0 - 20, r.v0 - 20, r.u1 + 20, r.v1 + 20, 0);
  }, [lessonId, variant]);
  const stageW = scene === 'stage' ? drawnWedges(wedges) : [];
  const cue = scene === 'studio' && hand ? handCue(hand, variant) : null;
  const foots = useMemo(() => (hand ? handFoots(hand, scene, variant, wedges) : []), [hand, scene, variant, wedges]);
  // Each item's box: a scene object's from the layout, the lesson's own from the item.
  const boxOf = (i: HandPlanItem): PlanRect => handObjectRect(i.id, scene, lessonId, variant, wedges, (i.box.v0 + i.box.v1) / 2 > 0 ? 1 : -1) ?? i.box;
  const OBJECT_IDS = ['wedge', 'side', 'band', 'audience', 'room'];
  const hi = shown.find((i) => i.id === highlight);
  const hiBox = hi ? boxOf(hi) : null;
  const hiPath = hiBox ? rr(make(), hiBox.u0 - 40, hiBox.v0 - 40, hiBox.u1 + 40, hiBox.v1 + 40, 60) : null;
  // Collision pass 2026-10-15: every word keeps clear of every object (the
  // plan's footprints); a name with no clear spot beside its object moves to
  // free space with a leader back to it. The audience is named in its aisle.
  const ps = xf.s / textScale;
  const labels: StaticLabel[] = [
    ...shown.map((i) => {
      const own = boxOf(i);
      const places = T.places(own, ps);
      const authored = i.label && !OBJECT_IDS.includes(i.id) ? [{ u: i.label.u, v: i.label.v, align: i.label.align ?? ('center' as const) }] : [];
      // THE ROOM is named inside the room beside its wall, never on the wall
      // line (its box is the wall strip: the places across it sit on it)
      const inside = (own.v0 + own.v1) / 2 > 0 ? [places[3], places[0]] : [places[0], places[3]];
      const order = i.id === 'audience' && scene === 'stage' ? [{ ...AUDIENCE_LABEL_AT, align: 'center' as const }] : i.id === 'room' ? inside : [...authored, ...places];
      return { id: i.id, text: labelOf(i.id), u: order[0].u, v: order[0].v, align: order[0].align, alts: order.slice(1), point: i.id === 'audience' ? { u: AUDIENCE_ROW.u, v: AUDIENCE_ROW.aisleV } : mid(own), tone: i.id === highlight ? ('amber' as const) : ('muted' as const) };
    }),
    // A monitor the lesson lists no item for (a side fill) still carries its name.
    ...stageW
      .filter((wd) => !shown.some((i) => i.id === wd.id))
      .map((wd) => {
        const own = handObjectRect(wd.id, 'stage', lessonId, variant, wedges)!;
        const places = T.places(own, ps);
        return { id: `w:${wd.id}`, text: wd.short, u: places[0].u, v: places[0].v, align: places[0].align, alts: places.slice(1), point: mid(own), tone: 'muted' as const };
      }),
    ...(cue
      ? cueLabels(cue).map((l) => ({ ...l, tone: 'illustrative' as const, point: l.id.startsWith('cueMix:') ? cue.stations.find((s) => `cueMix:${s.id}` === l.id)!.at : mid(cueHub(cue).rect) }))
      : []),
  ];
  const onPress = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    const { u, v } = T.unPt(unproject(xf, e.nativeEvent.locationX, e.nativeEvent.locationY));
    const tol = 24 / xf.s;
    const hit = shown.find((i) => {
      const b = boxOf(i);
      return u >= b.u0 - tol && u <= b.u1 + tol && v >= b.v0 - tol && v <= b.v1 + tol;
    });
    if (hit) onTap(hit.id);
  };
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={onPress} accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }, { rotate: T.rotate }]}>
            {scene === 'studio' ? (
              <>
                <Path path={room} color="#121216" />
                <Path path={room} style="stroke" strokeWidth={40} color="#3a3d45" />
              </>
            ) : (
              <>
                {/* The stage deck (the audience floor beyond its edge). */}
                <Path path={g.deck} color="#16140f" />
                <HeadIconPaths heads={g.band} color={GREY} opacity={0.75} />
                <PlanAmpTop u0={BAND_AMP.u0} u1={BAND_AMP.u1} v0={BAND_AMP.v0} v1={BAND_AMP.v1} />
                <Path path={g.pa} color="#1b1c21" />
                <Path path={g.pa} style="stroke" strokeWidth={8} color={GREY} />
                <ChairsTop seats={g.audience.seats} backs={g.audience.backs} color={GREY} opacity={0.8} />
              </>
            )}
            <Instrument view="top" variant={variant} />
            {/* The monitors (stage only): the shared floor wedge, true size. */}
            {stageW.map((wd) => (
              <WedgePlan key={wd.id} at={wd.p} faces={wd.faces} hi={false} />
            ))}
            {/* Studio: the performer's headphone mix (no wedges in a studio). */}
            {cue ? <CueMixPlan rig={cue} /> : null}
            {hiPath ? (
              <Path path={hiPath} style="stroke" strokeWidth={10} color={AMBER}>
                <DashPathEffect intervals={[30, 18]} />
              </Path>
            ) : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={T.labels(labels)} xf={xf} scale={textScale} w={w} h={h} clearOf={clearOfFoots(T.foots(foots), T.cables(cue ? cueCables(cue) : []))} />
    </View>
  );
}
