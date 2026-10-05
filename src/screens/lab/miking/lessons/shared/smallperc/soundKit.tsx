/**
 * SMALL-PERCUSSION FAMILY — the HOW IT SOUNDS canvas kit (LESSON_JOURNEY §6
 * stage 2): one accessible Canvas fitted to a box in mm, the lesson's drawing
 * inside it, the EXPLANATORY OVERLAY marks (arrows, impact bursts, radiation
 * arcs — WHERE and in WHAT ORDER, never how loud or how fast) and the labels
 * (StaticLabels: ≥ 9 pt, collision-fitted). Discrete per event (`shown`):
 * nothing animates per frame and nothing loops (D8). Silent.
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { ViewBox } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { AIR, AMBER, arcs, arrow, BLUE, make, type SkPath } from '../concert/paths.ts';

export { AIR, AMBER, BLUE };

export function SoundCanvas({ w, h, box, label, labels, children }: { w: number; h: number; box: ViewBox; label: string; labels: StaticLabel[]; children: ReactNode }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>{children}</Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** An overlay arrow (amber = what the player or the instrument does). */
export function Arrow({ a, b, color = AMBER, width = 5, head = 16, dashed = false, opacity = 1 }: { a: readonly [number, number]; b: readonly [number, number]; color?: string; width?: number; head?: number; dashed?: boolean; opacity?: number }) {
  const p = useMemo(() => arrow(make(), a[0], a[1], b[0], b[1], head), [a, b, head]);
  return (
    <Path path={p} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" color={color} opacity={opacity}>
      {dashed ? <DashPathEffect intervals={[12, 8]} /> : null}
    </Path>
  );
}

/** An impact burst: short rays round a point (where an impact starts). */
export function burstPath(cx: number, cy: number, r0: number, r1: number, n = 8, phase = 0): SkPath {
  const p = make();
  for (let k = 0; k < n; k++) {
    const a = phase + (k / n) * 2 * Math.PI;
    p.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    p.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
  }
  return p;
}
export function Burst({ c, r0, r1, n = 8, phase = 0, color = AMBER, opacity = 1 }: { c: readonly [number, number]; r0: number; r1: number; n?: number; phase?: number; color?: string; opacity?: number }) {
  const p = useMemo(() => burstPath(c[0], c[1], r0, r1, n, phase), [c, r0, r1, n, phase]);
  return <Path path={p} style="stroke" strokeWidth={4} strokeCap="round" color={color} opacity={opacity} />;
}

/** Radiation arcs about a point (WHERE sound leaves, never how much). */
export function Radiate({ c, radii, a0, a1, color = AIR, opacity = 0.85 }: { c: readonly [number, number]; radii: readonly number[]; a0: number; a1: number; color?: string; opacity?: number }) {
  const p = useMemo(() => arcs(make(), c[0], c[1], radii, a0, a1), [c, radii, a0, a1]);
  return (
    <Path path={p} style="stroke" strokeWidth={4} strokeCap="round" color={color} opacity={opacity}>
      <DashPathEffect intervals={[14, 10]} />
    </Path>
  );
}

/** Event emphasis: the current event at full strength, earlier ones dimmed. */
export function eventOpacity(shown: number, k: number): number {
  return shown < k ? 0 : shown === k ? 1 : 0.4;
}
