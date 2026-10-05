/**
 * M07b CONCERT SNARE — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): the
 * snare's own cutaway (art.tsx) under an EXPLANATORY OVERLAY from the same
 * anchors, in millimetres of the side view.
 *
 *   StrikeSequence  ① the stick strikes the batter head; ② the batter head is
 *                   pushed in; ③ the air pushes the snare-side head out,
 *                   against the snares (snares on: they are thrown off the
 *                   head and slap back — the buzz); ④ where sound leaves.
 *   CoupledHeads    the two heads' lowest shape coupled through the air
 *                   (the two-headed drum model the kick uses).
 *
 * Simplifications register (concert_snare/SOURCES.md): the head outline is
 * the IDEAL lowest shape, exaggerated; the arrows give ORDER and direction,
 * never speed or level; the snares are drawn lifted by a fixed amount (a
 * picture of contact, not a measured motion). Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Rect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { AIR, AMBER, BLUE, arcs, arrow, make } from '../shared/concert/paths.ts';
import { clamp01, flatFill, flatHead, PROFILE_01 } from '../shared/concert/soundPaths.ts';
import { Mallet } from '../shared/concert/Mallets';
import { ConcertSnareArt, STICKS } from './art';
import { snaresY } from './geometry.ts';
import { D, R, RIM_Y } from './model.ts';

export const BATTER_AMP = 26;
export const SNARE_AMP = 20;
/** The scene's model box (side view): the drum, the stand, room for the arcs. */
export const SOUND_BOX = { u0: -600, u1: 560, v0: -410, v1: 360 };

let built: null | Record<'strike' | 'push' | 'air' | 'pushS' | 'up' | 'down' | 'side' | 'buzz', ReturnType<typeof make>> = null;
function overlay() {
  if (built) return built;
  const s = STICKS.side[0];
  const strike = arrow(make(), s.head.x - 70, s.head.y - 120, s.head.x - 4, s.head.y - 22, 22);
  const push = arrow(make(), 60, -70, 60, 18, 20);
  const air = make();
  for (const x of [-100, 0, 100]) arrow(air, x, 30, x, D - 30, 20);
  const pushS = arrow(make(), 60, D + 4, 60, D + 70, 20);
  const up = arcs(make(), 0, RIM_Y, [120, 175, 230], -150, -30);
  const down = arcs(make(), 0, D + 30, [110, 160, 210], 35, 145);
  const side = arcs(make(), R, D / 2, [60, 100], -40, 40);
  const buzz = make();
  for (let x = -150; x <= 150; x += 30) {
    buzz.moveTo(x - 9, snaresY(true) + 22);
    buzz.lineTo(x, snaresY(true) + 12);
    buzz.lineTo(x + 9, snaresY(true) + 22);
  }
  built = { strike, push, air, pushS, up, down, side, buzz };
  return built;
}

export function ConcertSnareStrike({ w, h, variant, reveal, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const o = overlay();
  const on = variant !== 'off';
  const op = (i: number) => {
    'worklet';
    const k = clamp01(reveal.value - i);
    return k * (reveal.value >= i + 1.98 ? 0.4 : 1);
  };
  const o1 = useDerivedValue(() => op(0));
  const o2 = useDerivedValue(() => op(1));
  const o3 = useDerivedValue(() => op(2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  const bAmp = useDerivedValue(() => BATTER_AMP * clamp01(reveal.value - 1));
  const sAmp = useDerivedValue(() => SNARE_AMP * clamp01(reveal.value - 2));
  const bLine = useDerivedValue(() => flatHead(0, 0, R, bAmp.value, PROFILE_01));
  const bFill = useDerivedValue(() => flatFill(0, 0, R, bAmp.value, PROFILE_01));
  const sLine = useDerivedValue(() => flatHead(0, D, R, sAmp.value, PROFILE_01));
  const sFill = useDerivedValue(() => flatFill(0, D, R, sAmp.value, PROFILE_01));
  const headOn = useDerivedValue(() => clamp01(reveal.value - 1));
  const snareOn = useDerivedValue(() => clamp01(reveal.value - 2));
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① STICK STRIKES', short: '① STRIKE', u: -330, v: -250, align: 'center', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② BATTER PUSHED IN', short: '② PUSHED IN', u: 90, v: -60, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: on ? '③ AIR → SNARE HEAD → SNARES' : '③ AIR → SNARE HEAD', short: '③ AIR', u: 90, v: D + 105, align: 'left', tone: 'blue' });
  if (shown >= 4) {
    labels.push({ id: 's4a', text: '④ UP, FROM THE BATTER', short: '④ UP', u: 0, v: RIM_Y - 245, align: 'center', tone: 'blue' });
    labels.push({ id: 's4b', text: on ? '④ DOWN, THE SNARES' : '④ DOWN', short: '④ DOWN', u: -200, v: D + 175, align: 'center', tone: 'blue' });
  }
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 20, v: SOUND_BOX.v1 - 22, align: 'right', tone: 'illustrative' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <ConcertSnareArt view="side" variant={variant} />
          <Group opacity={o1}>
            <Path path={o.strike} style="stroke" strokeWidth={7} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={headOn}>
            <Path path={bFill} color="rgba(111,168,255,0.28)" />
            <Path path={bLine} style="stroke" strokeWidth={6} color={BLUE} />
          </Group>
          <Group opacity={o2}>
            <Path path={o.push} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o3}>
            <Path path={o.air} style="stroke" strokeWidth={5} color={AIR} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[14, 10]} />
            </Path>
            <Path path={o.pushS} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={snareOn}>
            <Path path={sFill} color="rgba(111,168,255,0.28)" />
            <Path path={sLine} style="stroke" strokeWidth={6} color={BLUE} />
            {on ? <Path path={o.buzz} style="stroke" strokeWidth={4} color={AMBER} strokeJoin="round" /> : null}
          </Group>
          <Group opacity={o4}>
            <Path path={o.up} style="stroke" strokeWidth={5} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[20, 14]} />
            </Path>
            <Path path={o.down} style="stroke" strokeWidth={5} color={AIR} opacity={0.9}>
              <DashPathEffect intervals={[20, 14]} />
            </Path>
            <Path path={o.side} style="stroke" strokeWidth={4} color={AIR} opacity={0.6}>
              <DashPathEffect intervals={[16, 12]} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function ConcertSnareCoupled({ w, h, variant, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  // +y is DOWN. TOGETHER: both heads move the same way (down, then up).
  // OPPOSED: the batter moves down while the snare head moves up (both in).
  const b = BATTER_AMP * swing;
  const s = (mode === 'together' ? 1 : -1) * SNARE_AMP * swing;
  const paths = useMemo(() => ({ bLine: flatHead(0, 0, R, b, PROFILE_01), bFill: flatFill(0, 0, R, b, PROFILE_01), sLine: flatHead(0, D, R, s, PROFILE_01), sFill: flatFill(0, D, R, s, PROFILE_01) }), [b, s]);
  const squeeze = mode === 'opposed' ? swing : 0;
  const tint = squeeze > 0 ? `rgba(111,168,255,${(0.32 * squeeze).toFixed(3)})` : `rgba(232,234,238,${(0.12 * -squeeze).toFixed(3)})`;
  const labels: StaticLabel[] = [
    { id: 'b', text: swing === 0 ? 'BATTER · AT REST' : swing > 0 ? 'BATTER ↓ IN' : 'BATTER ↑ OUT', short: 'BATTER', u: -R - 30, v: -70, align: 'right', tone: 'blue' },
    { id: 's', text: s === 0 ? 'SNARE HEAD · AT REST' : s > 0 ? 'SNARE HEAD ↓ OUT' : 'SNARE HEAD ↑ IN', short: 'SNARE HEAD', u: -R - 30, v: D + 70, align: 'right', tone: 'blue' },
    { id: 'air', text: mode === 'together' ? 'AIR CARRIED ALONG' : squeeze > 0.05 ? 'AIR SQUEEZED' : squeeze < -0.05 ? 'AIR EASED' : 'AIR AT REST', short: 'AIR', u: R + 40, v: D / 2, align: 'left', tone: 'blue' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 20, v: SOUND_BOX.v1 - 22, align: 'right', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <ConcertSnareArt view="side" variant={variant} />
          <Rect x={-R + 14} y={10} width={2 * R - 28} height={D - 20} color={tint} />
          <Path path={paths.bFill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.bLine} style="stroke" strokeWidth={6} color={BLUE} />
          <Path path={paths.sFill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.sLine} style="stroke" strokeWidth={6} color={BLUE} />
          <Mallet kind="stick" grip={STICKS.side[0].grip} head={STICKS.side[0].head} opacity={0.35} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
