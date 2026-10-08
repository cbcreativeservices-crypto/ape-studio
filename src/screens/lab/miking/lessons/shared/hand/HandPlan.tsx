/**
 * WHERE IT SITS for a HAND DRUM (tonbak, tabla): the player and the drum —
 * the lesson's own top-view drawing, at its real scale — with what sits round
 * them on a stage (the wedge, the side fill, louder neighbours, the audience
 * and the PA) or in a studio room. Plan coordinates are the lesson's top view
 * (u = x toward the audience, right on screen; v = z, the player's right
 * down on screen), so the wedge stands where the Studio-or-live page puts it.
 *
 * Positions are a typical layout, never a measurement. Static: it changes only
 * when the learner taps or switches (D8). Tap → the item under the finger.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform, unproject } from '../../../engine/geometry/frame.ts';
import type { VariantId, ViewBox, Wedge } from '../../../engine/model/types.ts';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { HeadIconPaths, aboveRotation, headIconStroke, makeHeadIconPaths } from '../../../../../../features/lab/headIcons';

export type HandScene = 'stage' | 'studio';
/** An item on the plan: its tap/highlight box (plan mm) and where it shows. */
export type HandPlanItem = { id: string; box: ViewBox; scene: HandScene | 'all'; label?: { u: number; v: number; align?: 'left' | 'center' | 'right' } };

const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
const make = () => Skia.Path.Make();
type SkPath = ReturnType<typeof make>;

export const HAND_PLAN_BOX: Record<HandScene, ViewBox> = {
  stage: { u0: -1300, u1: 2700, v0: -1550, v1: 1750 },
  studio: { u0: -1400, u1: 1800, v0: -1100, v1: 1100 },
};
/** The louder neighbours on a stage (upstage, the player's left). */
const BAND = { u: -150, v: -1150 };
const AUD_U = 2250;
/** A head icon in this plan, crown→chin, mm (a real head ≈ 230 mm). */
const PLAN_HEAD_MM = 230;

function rr(p: SkPath, u0: number, v0: number, u1: number, v1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

function wedgePath(w: Wedge, side = false): SkPath {
  // A floor wedge from above: a trapezoid, its sloped face toward `faces`.
  const p = make();
  const a = Math.atan2(w.faces.z, w.faces.x);
  const W = side ? 520 : 600;
  const D = side ? 420 : 380;
  const pts: [number, number][] = side
    ? [
        [-D / 2, -W / 2],
        [D / 2, -W / 2],
        [D / 2, W / 2],
        [-D / 2, W / 2],
      ]
    : [
        [-D / 2, -W / 2],
        [D / 2, -W / 2 + 60],
        [D / 2, W / 2 - 60],
        [-D / 2, W / 2],
      ];
  const c = Math.cos(a);
  const s = Math.sin(a);
  pts.forEach(([x, y], i) => {
    const u = w.p.x + x * c - y * s;
    const v = w.p.z + x * s + y * c;
    if (i === 0) p.moveTo(u, v);
    else p.lineTo(u, v);
  });
  p.close();
  return p;
}

export function HandPlan({ w, h, art, variant, scene, wedges, items, labelOf, highlight, onTap, accessibilityLabel }: {
  w: number;
  h: number;
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
  const box = HAND_PLAN_BOX[scene];
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [box, w, h]);
  const Instrument = art.Instrument;
  const shown = items.filter((i) => i.scene === 'all' || i.scene === scene);
  const g = useMemo(() => {
    // Two seated neighbours from above, as plan MARKERS — the owner's ABOVE
    // head icon, facing the audience (+u) — and an amplifier between them.
    // Head fix 2026-10-08: a lone head marker is the shared icon, never a
    // circle (and never an icon on a drawn body, so no shoulder outline).
    const band = makeHeadIconPaths(
      'above',
      PLAN_HEAD_MM,
      ([[-260, 0], [420, 120]] as const).map(([du, dv]) => ({ x: BAND.u + du, y: BAND.v + dv, rotation: aboveRotation(1, 0) })),
    );
    const amp = rr(make(), BAND.u + 640, BAND.v - 120, BAND.u + 1100, BAND.v + 120, 20);
    const room = make();
    room.addRect(Skia.XYWHRect(box.u0 + 120, box.v0 + 120, box.u1 - box.u0 - 240, box.v1 - box.v0 - 240));
    const pa = make();
    rr(pa, AUD_U - 200, -1500, AUD_U + 200, -1100, 30);
    rr(pa, AUD_U - 200, 1250, AUD_U + 200, 1650, 30);
    // The audience: a row of the same icons, facing the stage (−u).
    const audience = makeHeadIconPaths(
      'above',
      PLAN_HEAD_MM,
      Array.from({ length: 8 }, (_, i) => ({ x: AUD_U + 330, y: (i - 3) * 330 - 120, rotation: aboveRotation(-1, 0) })),
    );
    return { band, amp, room, pa, audience };
  }, [box]);
  const hi = shown.find((i) => i.id === highlight);
  const hiPath = useMemo(() => (hi ? rr(make(), hi.box.u0, hi.box.v0, hi.box.u1, hi.box.v1, 60) : null), [hi]);
  const stageW = scene === 'stage' ? wedges : [];
  const labels: StaticLabel[] = shown
    .filter((i) => i.label)
    .map((i) => ({ id: i.id, text: labelOf(i.id), u: i.label!.u, v: i.label!.v, align: i.label!.align ?? 'center', tone: i.id === highlight ? ('amber' as const) : ('muted' as const) }));
  const onPress = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    const { u, v } = unproject(xf, e.nativeEvent.locationX, e.nativeEvent.locationY);
    const tol = 24 / xf.s;
    const hit = shown.find((i) => u >= i.box.u0 - tol && u <= i.box.u1 + tol && v >= i.box.v0 - tol && v <= i.box.v1 + tol);
    if (hit) onTap(hit.id);
  };
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={onPress} accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {scene === 'studio' ? (
              <Path path={g.room} style="stroke" strokeWidth={26} color="#3a3d45" />
            ) : (
              <>
                <HeadIconPaths lines={g.band.lines} plate={g.band.plate} strokeWidth={Math.max(headIconStroke('above', PLAN_HEAD_MM), 1 / xf.s)} color={GREY} opacity={0.75} />
                <Path path={g.amp} color="#24262d" />
                <Path path={g.amp} style="stroke" strokeWidth={6} color={GREY} opacity={0.6} />
                <Path path={g.pa} color="#1b1c21" />
                <Path path={g.pa} style="stroke" strokeWidth={8} color={GREY} />
                <HeadIconPaths lines={g.audience.lines} plate={g.audience.plate} strokeWidth={Math.max(headIconStroke('above', PLAN_HEAD_MM), 1 / xf.s)} color={GREY} opacity={0.6} />
              </>
            )}
            <Instrument view="top" variant={variant} />
            {stageW.map((wd) => (
              <Group key={wd.id}>
                <Path path={wedgePath(wd, wd.id !== 'wedge')} color="#202228" />
                <Path path={wedgePath(wd, wd.id !== 'wedge')} style="stroke" strokeWidth={8} color="#c8ccd4" />
              </Group>
            ))}
            {hiPath ? (
              <Path path={hiPath} style="stroke" strokeWidth={10} color={AMBER}>
                <DashPathEffect intervals={[30, 18]} />
              </Path>
            ) : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
