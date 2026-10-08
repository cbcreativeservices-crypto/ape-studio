/**
 * F02 CLOTHING — MEET IT, where the sound comes from, drawn (LESSON_JOURNEY
 * §6 stage 1, §7): the held leather jacket drawn large.
 *
 *   StrikeSequence  ① the hands start the move; ② the fold flexes and the
 *                   leather rubs over itself (the detail); ③ the whole
 *                   garment swings and settles (its body and weight); ④ the
 *                   sound spreads round it into the room — quiet, so the room
 *                   is close under it.
 *   CoupledHeads    PRECISE or BUNCHED (copy.sound.pair): one fold flexing in
 *                   time with the action — or the whole thing crumpled into a
 *                   ball, many rubs at once; SWING = the gesture.
 * The order of events and WHERE, never level; motion drawn larger. Nothing loops.
 */
import { Group } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { AIR, AMBER, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { HeldJacket } from './art';

export const SOUND_BOX = { u0: -300, u1: 340, v0: -160, v1: 460 };

export function ClothStrike({ w, h, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE HANDS MOVE IT', short: '① HANDS', u: -290, v: -145, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE FOLD FLEXES · RUBS', short: '② THE FOLD', u: 330, v: -145, align: 'right', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ THE GARMENT SWINGS', short: '③ SWINGS', u: 330, v: 330, align: 'right', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ ALL ROUND · THE ROOM CLOSE UNDER IT', short: '④ ALL ROUND', u: -290, v: 440, align: 'left', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: 330, v: 440, align: 'right', tone: 'illustrative' });
  const sway = shown >= 3 ? 1 : 0;
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Group transform={[{ rotate: sway * 0.05 }]}>
        <HeldJacket view="side" />
      </Group>
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[-200, -40]} b={[-110, -40]} />
        <Arrow a={[200, -80]} b={[110, -60]} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Burst c={[0, 20]} r0={22} r1={48} n={9} phase={-1.3} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Arrow a={[150, 330]} b={[220, 300]} color={AMBER} width={4} head={12} dashed />
        <Arrow a={[-150, 330]} b={[-210, 300]} color={AMBER} width={4} head={12} dashed />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[0, 120]} radii={[230, 290]} a0={-180} a1={180} color={AIR} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = PRECISE; `opposed` = BUNCHED; swing = the gesture. */
export function ClothMotion({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const precise = mode === 'together';
  const a = Math.abs(swing);
  const labels: StaticLabel[] = [
    { id: 'move', text: a < 0.05 ? 'AT REST' : precise ? 'ONE FOLD FLEXES' : 'CRUMPLED INTO A BALL', short: precise ? 'ONE FOLD' : 'A BALL', u: 0, v: -145, align: 'center', tone: 'amber' },
    { id: 'hear', text: precise ? 'A SHAPED, TIMED TEXTURE' : 'NOISE WITHOUT SHAPE', short: precise ? 'SHAPED' : 'NOISE', u: 0, v: 440, align: 'center', tone: 'blue' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: 330, v: -145, align: 'right', tone: 'illustrative' },
  ];
  const squash = precise ? 1 : 1 - a * 0.45;
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Group transform={[{ translateY: precise ? 0 : a * 120 }, { scaleY: squash }, { rotate: precise ? swing * 0.08 : swing * 0.25 }]}>
        <HeldJacket view="side" />
      </Group>
      {a > 0.05 ? (
        precise ? (
          <Burst c={[0, 20]} r0={20} r1={20 + a * 30} n={8} phase={-1.3} />
        ) : (
          <>
            <Burst c={[-60, 120]} r0={10} r1={10 + a * 20} n={6} phase={0.3} />
            <Burst c={[50, 60]} r0={10} r1={10 + a * 20} n={6} phase={1.1} />
            <Burst c={[10, 220]} r0={10} r1={10 + a * 20} n={6} phase={2.2} />
            <Burst c={[-40, 300]} r0={10} r1={10 + a * 20} n={6} phase={0.7} />
            <Burst c={[70, 260]} r0={10} r1={10 + a * 20} n={6} phase={1.7} />
          </>
        )
      ) : null}
    </SoundCanvas>
  );
}
