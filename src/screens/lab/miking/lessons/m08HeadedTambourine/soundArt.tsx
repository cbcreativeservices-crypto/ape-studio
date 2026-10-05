/**
 * M08 HEADED TAMBOURINE — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2).
 * The instrument edge-on and level (the head on top, the open back below),
 * a canonical pose for reading, under an EXPLANATORY OVERLAY.
 *
 *   StrikeSequence  ① the hand strikes the head; ② the head is pushed in;
 *                   ③ the frame jolts and the jingle pairs are thrown against
 *                   each other; ④ sound leaves the head — from both faces,
 *                   the back is open — and the jingles all round the frame.
 *   CoupledHeads    (step 3, the lesson's own words): HEAD STRUCK — the head
 *                   moves, the jingles are jostled — or FRAME SHAKEN — the
 *                   frame moves, the jingles lag and clash, the head barely
 *                   moves.
 *
 * Simplifications register (headed_tambourine/SOURCES.md): the head outline
 * is the IDEAL lowest shape, exaggerated; the jingles' and the frame's
 * motion are drawn as positions, not measured motions; arrows and arcs give
 * ORDER and WHERE, never speed or level. Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { AIR, AMBER, BLUE, arcs, arrow, make, rrect, type SkPath } from '../shared/concert/paths.ts';
import { clamp01, flatFill, flatHead, PROFILE_01 } from '../shared/concert/soundPaths.ts';
import { slotAngles, TambourineEdge } from './art';
import { R, TAMB_DIMS } from './model.ts';

const DEPTH = TAMB_DIMS.depth.mm;
export const HEAD_AMP = 16;
export const SOUND_BOX = { u0: -300, u1: 300, v0: -230, v1: 190 };

let built: null | Record<'strike' | 'push' | 'clash' | 'up' | 'down' | 'sides', SkPath> = null;
function overlay() {
  if (built) return built;
  const strike = arrow(make(), -60, -150, -20, -14, 18);
  const push = arrow(make(), 60, -70, 60, 10, 16);
  const clash = make();
  for (const row of [0, 1] as const) {
    const w = DEPTH * (row === 0 ? 0.36 : 0.68);
    for (const a of slotAngles(row)) {
      if (Math.sin(a) <= 0.12) continue;
      const u = R * Math.cos(a);
      clash.moveTo(u - 7, w - 12);
      clash.lineTo(u + 7, w + 12);
      clash.moveTo(u + 7, w - 12);
      clash.lineTo(u - 7, w + 12);
    }
  }
  const up = arcs(make(), 0, -8, [70, 120, 170], -150, -30);
  const down = arcs(make(), 0, DEPTH + 8, [70, 115], 35, 145);
  const sides = make();
  arcs(sides, -R - 10, DEPTH / 2, [40, 70], 150, 210);
  arcs(sides, R + 10, DEPTH / 2, [40, 70], -30, 30);
  built = { strike, push, clash, up, down, sides };
  return built;
}

export function TambourineStrike({ w, h, variant, reveal, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const o = overlay();
  const shaken = variant === 'shaken';
  const op = (i: number) => {
    'worklet';
    const k = clamp01(reveal.value - i);
    return k * (reveal.value >= i + 1.98 ? 0.4 : 1);
  };
  const o1 = useDerivedValue(() => op(0));
  const o3 = useDerivedValue(() => op(2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const amp = useDerivedValue(() => (shaken ? 0.15 : 1) * HEAD_AMP * clamp01(reveal.value - 1));
  const line = useDerivedValue(() => flatHead(0, 0, R, amp.value, PROFILE_01));
  const fill = useDerivedValue(() => flatFill(0, 0, R, amp.value, PROFILE_01));
  const on2 = useDerivedValue(() => clamp01(reveal.value - 1));
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: shaken ? '① THE HAND SHAKES THE FRAME' : '① HAND STRIKES', short: '① STRIKE', u: -140, v: -175, align: 'center', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: shaken ? '② HEAD BARELY MOVES' : '② HEAD PUSHED IN', short: '② HEAD', u: 80, v: -60, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ JINGLES CLASH', short: '③ JINGLES', u: 0, v: DEPTH + 40, align: 'center', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ FROM BOTH FACES AND ALL ROUND', short: '④ ALL ROUND', u: 0, v: -205, align: 'center', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 10, v: SOUND_BOX.v1 - 18, align: 'right', tone: 'illustrative' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <TambourineEdge />
          <Group opacity={o1}>
            {shaken ? (
              <Path path={arrow(arrow(make(), -40, -120, -150, -120, 16), 40, -120, 150, -120, 16)} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            ) : (
              <Path path={o.strike} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            )}
          </Group>
          <Group opacity={on2}>
            <Path path={fill} color="rgba(111,168,255,0.28)" />
            <Path path={line} style="stroke" strokeWidth={4} color={BLUE} />
            {!shaken ? <Path path={o.push} style="stroke" strokeWidth={4} color={BLUE} strokeCap="round" strokeJoin="round" /> : null}
          </Group>
          <Group opacity={o3}>
            <Path path={o.clash} style="stroke" strokeWidth={3} color={AMBER} strokeCap="round" />
          </Group>
          <Group opacity={o4}>
            <Path path={o.up} style="stroke" strokeWidth={4} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[14, 10]} />
            </Path>
            <Path path={o.down} style="stroke" strokeWidth={4} color={AIR} opacity={0.75}>
              <DashPathEffect intervals={[14, 10]} />
            </Path>
            <Path path={o.sides} style="stroke" strokeWidth={4} color={AMBER} opacity={0.8}>
              <DashPathEffect intervals={[10, 8]} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** Step 3: `together` = HEAD STRUCK; `opposed` = FRAME SHAKEN. */
export function TambourineCoupled({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const struck = mode === 'together';
  const amp = struck ? HEAD_AMP * swing : HEAD_AMP * 0.1 * swing;
  const dx = struck ? 0 : 60 * swing;
  const paths = useMemo(() => ({ line: flatHead(dx, 0, R, amp, PROFILE_01), fill: flatFill(dx, 0, R, amp, PROFILE_01) }), [amp, dx]);
  // The jingle discs LAG the frame when it is shaken (drawn as ghost discs
  // left behind), and are jostled in place when the head is struck.
  const lag = useMemo(() => {
    const p = make();
    const off = struck ? 0 : -dx * 0.55;
    for (const row of [0, 1] as const) {
      const wv = DEPTH * (row === 0 ? 0.36 : 0.68);
      for (const a of slotAngles(row)) {
        const s = Math.sin(a);
        if (s <= 0.12) continue;
        const u = R * Math.cos(a) + dx + off;
        const half = (TAMB_DIMS.jingleD.mm / 2) * s + 4;
        const jig = struck ? 3 * Math.abs(swing) : 0;
        rrect(p, u - half, wv - 4.2 - jig, u + half, wv - 1.2 - jig, 1.2);
        rrect(p, u - half, wv + 1.2 + jig, u + half, wv + 4.2 + jig, 1.2);
      }
    }
    return p;
  }, [dx, struck, swing]);
  const labels: StaticLabel[] = [
    { id: 'h', text: Math.abs(swing) < 0.05 ? 'AT REST' : struck ? (swing > 0 ? 'HEAD ↓ IN' : 'HEAD ↑ OUT') : swing > 0 ? 'FRAME → ' : '← FRAME', short: 'HEAD', u: 0, v: -120, align: 'center', tone: 'blue' },
    { id: 'j', text: Math.abs(swing) < 0.05 ? 'JINGLES AT REST' : struck ? 'JINGLES JOSTLED' : 'JINGLES LAG, THEN CLASH', short: 'JINGLES', u: 0, v: DEPTH + 45, align: 'center', tone: 'amber' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 10, v: SOUND_BOX.v1 - 18, align: 'right', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Group transform={[{ translateX: dx }]}>
            <TambourineEdge discs={false} />
          </Group>
          <Path path={lag} color="#d9dde5" />
          <Path path={lag} style="stroke" strokeWidth={0.8} color={AMBER} opacity={Math.min(1, Math.abs(swing) * 1.5)} />
          <Path path={paths.fill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.line} style="stroke" strokeWidth={4} color={BLUE} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
