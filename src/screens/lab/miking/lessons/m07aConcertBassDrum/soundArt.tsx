/**
 * M07a CONCERT BASS DRUM — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2):
 * the drum's own side cutaway (art.tsx) under an EXPLANATORY OVERLAY from the
 * same anchors, in millimetres of the side view (the player at the right).
 *
 *   StrikeSequence  ① the mallet strikes the playing head; ② the head is
 *                   pushed in (toward −x); ③ the air pushes the far head out;
 *                   ④ sound leaves BOTH heads, sideways — along the drum's
 *                   axis, across the stage.
 *   CoupledHeads    the two heads' lowest shape coupled through the air (the
 *                   two-headed drum model the kick uses).
 *
 * Simplifications register (concert_bass_drum/SOURCES.md): ideal lowest head
 * shape, exaggerated; arrows give ORDER and direction, never speed or level.
 * Nothing loops (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Rect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { AIR, AMBER, BLUE, arcs, arrow, make, type SkPath } from '../shared/concert/paths.ts';
import { clamp01, PROFILE_01, uprightFill, uprightHead } from '../shared/concert/soundPaths.ts';
import { ConcertBassDrumArt } from './art';
import { HOOP } from './geometry.ts';
import { D, R } from './model.ts';

export const PLAY_AMP = 60;
export const FAR_AMP = 46;
export const SOUND_BOX = { u0: -D - 420, u1: 720, v0: -R - 150, v1: R + 140 };

let built: null | Record<'strike' | 'push' | 'air' | 'pushF' | 'toPlayer' | 'toFar', SkPath> = null;
function overlay() {
  if (built) return built;
  const strike = arrow(make(), 230, -40, 70, 26, 26);
  const push = arrow(make(), 20, -140, -90, -140, 22);
  const air = make();
  for (const y of [-220, -40, 140]) arrow(air, -110, y, -D + 70, y, 26);
  const pushF = arrow(make(), -D - 10, -140, -D - 120, -140, 22);
  const toPlayer = arcs(make(), 0, 0, [170, 250, 330], -40, 40);
  const toFar = arcs(make(), -D, 0, [170, 250, 330], 140, 220);
  built = { strike, push, air, pushF, toPlayer, toFar };
  return built;
}

export function ConcertBassDrumStrike({ w, h, variant, reveal, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const o = overlay();
  const op = (i: number) => {
    'worklet';
    const k = clamp01(reveal.value - i);
    return k * (reveal.value >= i + 1.98 ? 0.4 : 1);
  };
  const o1 = useDerivedValue(() => op(0));
  const o2 = useDerivedValue(() => op(1));
  const o3 = useDerivedValue(() => op(2));
  const o4 = useDerivedValue(() => clamp01(reveal.value - 3));
  // Pushed IN = toward −x for the playing head; the far head is pushed OUT, also −x.
  const pAmp = useDerivedValue(() => -PLAY_AMP * clamp01(reveal.value - 1));
  const fAmp = useDerivedValue(() => -FAR_AMP * clamp01(reveal.value - 2));
  const pLine = useDerivedValue(() => uprightHead(0, 0, R, pAmp.value, PROFILE_01));
  const pFill = useDerivedValue(() => uprightFill(0, 0, R, pAmp.value, PROFILE_01));
  const fLine = useDerivedValue(() => uprightHead(-D, 0, R, fAmp.value, PROFILE_01));
  const fFill = useDerivedValue(() => uprightFill(-D, 0, R, fAmp.value, PROFILE_01));
  const pOn = useDerivedValue(() => clamp01(reveal.value - 1));
  const fOn = useDerivedValue(() => clamp01(reveal.value - 2));
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① MALLET STRIKES', short: '① STRIKE', u: 420, v: 120, align: 'center', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② PLAYING HEAD PUSHED IN', short: '② PUSHED IN', u: -20, v: -HOOP.rOut - 40, align: 'right', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ AIR PUSHES THE FAR HEAD', short: '③ AIR → FAR', u: -D / 2, v: R - 60, align: 'center', tone: 'blue' });
  if (shown >= 4) {
    labels.push({ id: 's4a', text: '④ PLAYER’S SIDE', short: '④ PLAYER', u: 340, v: -R - 60, align: 'center', tone: 'blue' });
    labels.push({ id: 's4b', text: '④ FAR SIDE', short: '④ FAR', u: -D - 320, v: -R - 60, align: 'center', tone: 'blue' });
  }
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 20, v: SOUND_BOX.v1 - 30, align: 'right', tone: 'illustrative' });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <ConcertBassDrumArt view="side" variant={variant} />
          <Group opacity={o1}>
            <Path path={o.strike} style="stroke" strokeWidth={9} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={pOn}>
            <Path path={pFill} color="rgba(111,168,255,0.28)" />
            <Path path={pLine} style="stroke" strokeWidth={9} color={BLUE} />
          </Group>
          <Group opacity={o2}>
            <Path path={o.push} style="stroke" strokeWidth={8} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o3}>
            <Path path={o.air} style="stroke" strokeWidth={7} color={AIR} strokeCap="round" strokeJoin="round">
              <DashPathEffect intervals={[22, 14]} />
            </Path>
            <Path path={o.pushF} style="stroke" strokeWidth={8} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={fOn}>
            <Path path={fFill} color="rgba(111,168,255,0.28)" />
            <Path path={fLine} style="stroke" strokeWidth={9} color={BLUE} />
          </Group>
          <Group opacity={o4}>
            <Path path={o.toPlayer} style="stroke" strokeWidth={7} color={AIR} opacity={0.85}>
              <DashPathEffect intervals={[26, 16]} />
            </Path>
            <Path path={o.toFar} style="stroke" strokeWidth={7} color={AIR} opacity={0.85}>
              <DashPathEffect intervals={[26, 16]} />
            </Path>
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function ConcertBassDrumCoupled({ w, h, variant, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  // swing > 0: the playing head moves IN (−x). TOGETHER: the far head moves
  // the same way (−x, out); OPPOSED: it moves +x (in), squeezing the air.
  const p = -PLAY_AMP * swing;
  const f = (mode === 'together' ? -1 : 1) * FAR_AMP * swing;
  const paths = useMemo(() => ({ pLine: uprightHead(0, 0, R, p, PROFILE_01), pFill: uprightFill(0, 0, R, p, PROFILE_01), fLine: uprightHead(-D, 0, R, f, PROFILE_01), fFill: uprightFill(-D, 0, R, f, PROFILE_01) }), [p, f]);
  const squeeze = mode === 'opposed' ? swing : 0;
  const tint = squeeze > 0 ? `rgba(111,168,255,${(0.32 * squeeze).toFixed(3)})` : `rgba(232,234,238,${(0.12 * -squeeze).toFixed(3)})`;
  const labels: StaticLabel[] = [
    { id: 'p', text: swing === 0 ? 'PLAYING · AT REST' : swing > 0 ? 'PLAYING ← IN' : 'PLAYING → OUT', short: 'PLAYING', u: 40, v: -HOOP.rOut - 40, align: 'left', tone: 'blue' },
    { id: 'f', text: f === 0 ? 'FAR · AT REST' : f < 0 ? 'FAR ← OUT' : 'FAR → IN', short: 'FAR', u: -D - 40, v: -HOOP.rOut - 40, align: 'right', tone: 'blue' },
    { id: 'air', text: mode === 'together' ? 'AIR CARRIED ALONG' : squeeze > 0.05 ? 'AIR SQUEEZED' : squeeze < -0.05 ? 'AIR EASED' : 'AIR AT REST', short: 'AIR', u: -D / 2, v: R - 60, align: 'center', tone: 'blue' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 20, v: SOUND_BOX.v1 - 30, align: 'right', tone: 'illustrative' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <ConcertBassDrumArt view="side" variant={variant} />
          <Rect x={-D + 14} y={-R + 20} width={D - 28} height={2 * R - 40} color={tint} />
          <Path path={paths.pFill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.pLine} style="stroke" strokeWidth={9} color={BLUE} />
          <Path path={paths.fFill} color="rgba(111,168,255,0.28)" />
          <Path path={paths.fLine} style="stroke" strokeWidth={9} color={BLUE} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
