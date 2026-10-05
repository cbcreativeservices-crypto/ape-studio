/**
 * ARRIVALS — when the sound of each kit source reaches a listening point
 * (HOW IT SOUNDS for the kit-level lessons). Straight-line paths in air at
 * 20 °C (the calculator's speed of sound, engine/physics/twoMic C20): at the
 * time t the learner sets, each source's sound has spread to a sphere of
 * radius c·t — drawn as a ring about the source (a sphere's outline in this
 * view). A ring that has passed the point has ARRIVED there.
 *
 * Mirror images (`images`) draw a reflection the same way: the sound from a
 * surface reaches the point as if from the source's mirror image behind it
 * (the image-source picture of one reflection) — dashed.
 *
 * Nothing moves by itself (D8): TIME is a fader the learner drags.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { C20 } from '../../../engine/physics/twoMic.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';

export type ArrivalSource = { id: string; label: string; p: Vec3; color: string };
/** `short`: the dock chip's value (defaults to the label's first word). */
export type ArrivalPoint = { id: string; label: string; short?: string; p: Vec3 };
export type ArrivalImage = { id: string; label: string; p: Vec3; of: string; color: string };

/** ms for a path (mm) at 20 °C. */
export const msFor = (mm: number): number => mm / C20;
/** mm travelled in t ms at 20 °C. */
export const mmIn = (ms: number): number => ms * C20;

const vOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.y : p.z);

export function ArrivalsScene({
  w,
  h,
  view,
  box,
  Background,
  sources,
  point,
  images = [],
  tMs,
  accessibilityLabel,
  extraLabels = [],
}: {
  w: number;
  h: number;
  view: ViewId;
  box: ViewBox;
  Background: (p: { view: ViewId }) => ReactElement;
  sources: readonly ArrivalSource[];
  point: ArrivalPoint;
  images?: readonly ArrivalImage[];
  tMs: number;
  accessibilityLabel: string;
  extraLabels?: StaticLabel[];
}) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform(view, box, w, h, 6), [view, box, w, h]);
  const r = mmIn(tMs);
  // Strokes and marks keep a screen size (px ÷ the fit scale), so they read
  // at the scale a whole kit is drawn at.
  const px = 1 / xf.s;
  const cross = useMemo(() => {
    const p = Skia.Path.Make();
    const u = point.p.x;
    const v = vOf(view, point.p);
    const k = 9 * px;
    p.moveTo(u - k, v);
    p.lineTo(u + k, v);
    p.moveTo(u, v - k);
    p.lineTo(u, v + k);
    return p;
  }, [point, view, px]);
  const labels: StaticLabel[] = [
    { id: 'pt', text: point.label, u: point.p.x + 12 * px, v: vOf(view, point.p) - 8 * px, align: 'left', tone: 'amber' },
    ...sources.map((s) => ({ id: `s:${s.id}`, text: s.label.toUpperCase(), u: s.p.x, v: vOf(view, s.p) + 12 * px, align: 'center' as const, tone: 'muted' as const })),
    ...extraLabels,
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Background view={view} />
          {/* the straight paths, faint */}
          {sources.map((s) => (
            <Line key={`path:${s.id}`} p1={vec(s.p.x, vOf(view, s.p))} p2={vec(point.p.x, vOf(view, point.p))} color={s.color} strokeWidth={1.2 * px} opacity={0.4}>
              <DashPathEffect intervals={[5 * px, 4 * px]} />
            </Line>
          ))}
          {images.map((m) => (
            <Line key={`ipath:${m.id}`} p1={vec(m.p.x, vOf(view, m.p))} p2={vec(point.p.x, vOf(view, point.p))} color={m.color} strokeWidth={1 * px} opacity={0.35}>
              <DashPathEffect intervals={[2 * px, 3 * px]} />
            </Line>
          ))}
          {/* the spreading sound: a ring of radius c·t about each source */}
          {sources.map((s) => (
            <Group key={`ring:${s.id}`}>
              <Circle cx={s.p.x} cy={vOf(view, s.p)} r={Math.max(1, r)} style="stroke" strokeWidth={6 * px} color={s.color} opacity={0.18} />
              <Circle cx={s.p.x} cy={vOf(view, s.p)} r={Math.max(1, r)} style="stroke" strokeWidth={2 * px} color={s.color} opacity={0.95} />
              <Circle cx={s.p.x} cy={vOf(view, s.p)} r={4.5 * px} color={s.color} />
              <Circle cx={s.p.x} cy={vOf(view, s.p)} r={4.5 * px} style="stroke" strokeWidth={1.2 * px} color="#08080a" />
            </Group>
          ))}
          {images.map((m) => (
            <Group key={`iring:${m.id}`}>
              <Circle cx={m.p.x} cy={vOf(view, m.p)} r={Math.max(1, r)} style="stroke" strokeWidth={1.8 * px} color={m.color} opacity={0.8}>
                <DashPathEffect intervals={[5 * px, 4 * px]} />
              </Circle>
              <Circle cx={m.p.x} cy={vOf(view, m.p)} r={4 * px} style="stroke" strokeWidth={1.5 * px} color={m.color} />
            </Group>
          ))}
          <Path path={cross} style="stroke" strokeWidth={4 * px} strokeCap="round" color="#08080a" opacity={0.8} />
          <Path path={cross} style="stroke" strokeWidth={2 * px} strokeCap="round" color="#ffc64d" />
          <Circle cx={point.p.x} cy={vOf(view, point.p)} r={5 * px} style="stroke" strokeWidth={1.8 * px} color="#ffc64d" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
