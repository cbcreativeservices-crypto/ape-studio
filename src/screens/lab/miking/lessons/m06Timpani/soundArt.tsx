/**
 * M06 TIMPANI — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2, §7: the
 * timpani's own physics). ONE drum (the 29 in), CUT OPEN through its head,
 * under an EXPLANATORY OVERLAY, in millimetres of the side view (the drum's
 * centre at u = 0).
 *
 *   StrikeSequence  ① the mallet strikes a third of the way in from the hoop;
 *                   ② the head goes down there and up across the drum — the
 *                   (1,1) "see-saw" shape, the timpani's NOTE; ③ the air in
 *                   the bowl is shoved from side to side; ④ sound leaves the
 *                   head, up and out.
 *   CoupledHeads    (step 3, the lesson's own words): the head over its
 *                   bowl's air — SEE-SAW (1,1) or PUMP (0,1).
 *
 * Simplifications register (timpani/SOURCES.md): the head outlines are the
 * IDEAL membrane's (1,1) and (0,1) shapes, exaggerated; the bowl's shape is a
 * drawing default; arrows give ORDER and direction, never speed or pressure.
 * Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { AIR, AMBER, BLUE, arcs, arrow, make, oval, type SkPath } from '../shared/concert/paths.ts';
import { clamp01, flatFill, flatHead, PROFILE_01, PROFILE_11 } from '../shared/concert/soundPaths.ts';
import { TimpanoSection } from '../shared/concert/TimpaniArt';
import { bowlDepth } from '../shared/concert/timpanoSpec.ts';
import { Mallet } from '../shared/concert/Mallets';
import { HEAD_Y, R29 } from './model.ts';

const R = R29;
/** The (1,1) shape with the STRUCK side (−x) down: the profile negated. */
const SEESAW: number[] = PROFILE_11.map((v) => -v);
export const HEAD_AMP = 46;
export const SOUND_BOX = { u0: -760, u1: 620, v0: HEAD_Y - 470, v1: 30 };
const STRIKE_X = -(R * 2) / 3;
const MALLET = { grip: { x: -640, y: HEAD_Y - 260 }, head: { x: STRIKE_X - 6, y: HEAD_Y - 22 } };

let built: null | Record<'strike' | 'air' | 'up' | 'out' | 'pump', SkPath> = null;
function overlay() {
  if (built) return built;
  const strike = arrow(make(), STRIKE_X - 60, HEAD_Y - 160, STRIKE_X - 6, HEAD_Y - 30, 22);
  const air = make();
  const mid = HEAD_Y + bowlDepth(R) * 0.3;
  arrow(air, -R * 0.55, mid, R * 0.45, mid, 24);
  arrow(air, -R * 0.4, mid + 90, R * 0.3, mid + 90, 22);
  const up = arcs(make(), 0, HEAD_Y - 10, [150, 230, 310], -160, -20);
  const out = arcs(make(), 0, HEAD_Y - 10, [R + 80, R + 150], -12, 8);
  const pump = make();
  for (const x of [-R * 0.5, 0, R * 0.5]) arrow(pump, x, HEAD_Y + 40, x, HEAD_Y + 150, 20);
  built = { strike, air, up, out, pump };
  return built;
}

export function TimpaniStrike({ w, h, reveal, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const o = overlay();
  const op = (i: number) => {
    'worklet';
    const k = clamp01(reveal.value - i);
    return k * (reveal.value >= i + 1.98 ? 0.4 : 1);
  };
  const o1 = useDerivedValue(() => op(0));
  const o3 = useDerivedValue(() => op(2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const amp = useDerivedValue(() => HEAD_AMP * clamp01(reveal.value - 1));
  const line = useDerivedValue(() => flatHead(0, HEAD_Y, R, amp.value, SEESAW));
  const fill = useDerivedValue(() => flatFill(0, HEAD_Y, R, amp.value, SEESAW));
  const headOn = useDerivedValue(() => clamp01(reveal.value - 1));
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① MALLET STRIKES', short: '① STRIKE', u: -560, v: HEAD_Y - 330, align: 'center', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② DOWN HERE, UP THERE', short: '② SEE-SAW', u: 40, v: HEAD_Y - 110, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ AIR SHOVED ACROSS', short: '③ AIR', u: 0, v: HEAD_Y + bowlDepth(R) * 0.3 + 170, align: 'center', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ SOUND LEAVES THE HEAD', short: '④ UP AND OUT', u: 0, v: HEAD_Y - 400, align: 'center', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 20, v: -22, align: 'right', tone: 'illustrative' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <TimpanoSection R={R} headY={HEAD_Y} floorY={0} />
          <Mallet kind="timpani" grip={MALLET.grip} head={MALLET.head} />
          <Group opacity={o1}>
            <Path path={o.strike} style="stroke" strokeWidth={8} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={headOn}>
            <Path path={fill} color="rgba(111,168,255,0.28)" />
            <Path path={line} style="stroke" strokeWidth={7} color={BLUE} />
          </Group>
          <Group opacity={o3}>
            <Path path={o.air} style="stroke" strokeWidth={6} color={AIR} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[18, 12]} />
            </Path>
          </Group>
          <Group opacity={o4}>
            <Path path={o.up} style="stroke" strokeWidth={6} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[22, 14]} />
            </Path>
            <Path path={o.out} style="stroke" strokeWidth={5} color={AIR} opacity={0.6}>
              <DashPathEffect intervals={[18, 12]} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** Step 3: the head over its bowl's air. `together` = the (1,1) see-saw
 *  (the note); `opposed` = the (0,1) pump (the thud). */
export function TimpaniCoupled({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const o = overlay();
  const seesaw = mode === 'together';
  const amp = HEAD_AMP * swing;
  const paths = useMemo(() => ({ line: flatHead(0, HEAD_Y, R, amp, seesaw ? SEESAW : PROFILE_01), fill: flatFill(0, HEAD_Y, R, amp, seesaw ? SEESAW : PROFILE_01) }), [amp, seesaw]);
  const Db = bowlDepth(R);
  // The pump squeezes (swing > 0: the head down, into the bowl) or eases the air.
  const tint = !seesaw && swing > 0 ? `rgba(111,168,255,${(0.34 * swing).toFixed(3)})` : !seesaw && swing < 0 ? `rgba(232,234,238,${(0.12 * -swing).toFixed(3)})` : 'rgba(0,0,0,0)';
  const tintPath = useMemo(() => oval(make(), 0, HEAD_Y + 20 + Db * 0.375, R * 0.8, Db * 0.375), [Db]);
  const labels: StaticLabel[] = [
    { id: 'h', text: Math.abs(swing) < 0.05 ? 'HEAD · AT REST' : seesaw ? (swing > 0 ? 'LEFT HALF ↓  RIGHT HALF ↑' : 'LEFT HALF ↑  RIGHT HALF ↓') : swing > 0 ? 'WHOLE HEAD ↓' : 'WHOLE HEAD ↑', short: 'HEAD', u: 0, v: HEAD_Y - 120, align: 'center', tone: 'blue' },
    { id: 'air', text: seesaw ? (Math.abs(swing) < 0.05 ? 'AIR AT REST' : 'AIR SHOVED ACROSS') : swing > 0.05 ? 'AIR SQUEEZED' : swing < -0.05 ? 'AIR EASED' : 'AIR AT REST', short: 'AIR', u: 0, v: HEAD_Y + Db * 0.3 + 170, align: 'center', tone: 'blue' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 20, v: -22, align: 'right', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <TimpanoSection R={R} headY={HEAD_Y} floorY={0} />
          <Path path={tintPath} color={tint} />
          {seesaw && Math.abs(swing) >= 0.05 ? (
            <Group transform={swing < 0 ? [{ scaleX: -1 }] : []}>
              <Path path={o.air} style="stroke" strokeWidth={6} color={AIR} strokeCap="round" strokeJoin="round" opacity={Math.min(1, Math.abs(swing) + 0.2)}>
                <DashPathEffect intervals={[18, 12]} />
              </Path>
            </Group>
          ) : null}
          {!seesaw && swing > 0.05 ? <Path path={o.pump} style="stroke" strokeWidth={6} color={AIR} strokeCap="round" strokeJoin="round" opacity={Math.min(1, swing + 0.2)} /> : null}
          <Path path={paths.fill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.line} style="stroke" strokeWidth={7} color={BLUE} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
