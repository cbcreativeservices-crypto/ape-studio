/**
 * F04 IMPACTS, LIQUIDS AND TEXTURES — MEET IT, where the sound comes from,
 * drawn (LESSON_JOURNEY §6 stage 1, §7): the variant's action drawn large.
 *
 *   StrikeSequence  ① the hand drives it (the block falls, the jug pours,
 *                   the brush starts); ② the attack — the contact, the
 *                   water's entry and splash, the bristles' friction; ③ the
 *                   body — the table rings, bubbles and the container wall,
 *                   the board; ④ the tail and the room — the decay, the long
 *                   drip tail, the stroke's natural end.
 *   CoupledHeads    THE HIT or THE TAIL (copy.sound.pair), on the water: the
 *                   entry's splash crown, or the drips and ripples long
 *                   after; SWING = time through the action.
 * The order of events and WHERE, never level or length; motion drawn larger.
 */
import { Group } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { AIR, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { TableArt } from '../shared/foley/StageArt';
import { Basin, BrushBoard, PaddedBlock } from '../shared/foley/props';
import { BASIN } from '../shared/foley/propGeom.ts';

const BOX = { u0: -340, u1: 340, v0: -340, v1: 140 };

const WORDS: Record<string, [string, string, string]> = {
  impact: ['② THE CONTACT · THE ATTACK', '③ THE TABLE RINGS', '④ THE DECAY · THE ROOM'],
  water: ['② THE ENTRY · THE SPLASH', '③ BUBBLES · THE WALL', '④ THE DRIPS · A LONG TAIL'],
  texture: ['② FRICTION ALONG THE STROKE', '③ THE BOARD ANSWERS', '④ THE NATURAL END · THE ROOM'],
};

function Scene({ variant, step }: { variant: string; step: number }) {
  if (variant === 'water') return <Basin view="side" splash={false} />;
  if (variant === 'texture')
    return (
      <Group>
        <TableArt view="side" x0={-340} x1={340} z0={-200} z1={200} topY={18} floorY={400} />
        <BrushBoard view="side" brushX={step <= 1 ? -160 : step === 2 ? 0 : step === 3 ? 80 : 160} />
      </Group>
    );
  return (
    <Group>
      <TableArt view="side" x0={-340} x1={340} z0={-200} z1={200} topY={0} floorY={400} />
      <PaddedBlock view="side" lift={step <= 1 ? 200 : 0} />
    </Group>
  );
}

export function ImpactStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const v = variant === 'live' ? 'impact' : variant;
  const words = WORDS[v] ?? WORDS.impact;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE HAND DRIVES IT', short: '① HAND', u: -330, v: -325, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: words[0], short: '② ATTACK', u: 330, v: -325, align: 'right', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: words[1], short: '③ BODY', u: 330, v: -295, align: 'right', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: words[2], short: '④ TAIL', u: -330, v: 125, align: 'left', tone: 'blue' });
  const water = v === 'water';
  const hit: [number, number] = water ? [0, 0] : v === 'texture' ? [0, -4] : [0, -2];
  return (
    <SoundCanvas w={w} h={h} box={BOX} label={accessibilityLabel} labels={labels}>
      <Scene variant={v} step={shown} />
      <Group opacity={eventOpacity(shown, 1)}>
        {v === 'texture' ? <Arrow a={[-260, -120]} b={[-60, -120]} /> : <Arrow a={[-40, water ? -260 : -280]} b={[-10, water ? -70 : -90]} />}
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Burst c={hit} r0={20} r1={58} n={water ? 11 : 8} phase={-1.4} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Radiate c={water ? [BASIN.R - 20, 10] : [0, 20]} radii={[60, 95]} a0={water ? -60 : 20} a1={water ? 60 : 160} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        {water ? (
          <>
            <Burst c={[60, -30]} r0={4} r1={10} n={4} phase={0.2} />
            <Burst c={[-80, -60]} r0={4} r1={10} n={4} phase={1.1} />
          </>
        ) : null}
        <Radiate c={[0, 0]} radii={[200, 260]} a0={-170} a1={-10} color={AIR} />
      </Group>
    </SoundCanvas>
  );
}

const PAIR_BOX = { u0: -300, u1: 300, v0: -280, v1: 120 };

/** Step 2: `together` = THE HIT (the entry's crown); `opposed` = THE TAIL (drips and ripples); swing = time. */
export function WaterHitTail({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const hitMode = mode === 'together';
  const t = (swing + 1) / 2; // 0 … 1 through the action
  const labels: StaticLabel[] = [
    { id: 't', text: t < 0.15 ? 'BEFORE THE ENTRY' : hitMode ? 'THE HIT: THE CROWN OF THE SPLASH' : 'THE TAIL: DRIPS AND RIPPLES', short: hitMode ? 'THE HIT' : 'THE TAIL', u: 0, v: -265, align: 'center', tone: 'amber' },
    { id: 'n', text: hitMode ? 'SHARP · BRIEF · LOUDEST' : 'QUIET · LONG · EASY TO CUT OFF', short: hitMode ? 'SHARP' : 'LONG', u: 0, v: 105, align: 'center', tone: 'blue' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: 290, v: -235, align: 'right', tone: 'illustrative' },
  ];
  const crown = hitMode && t > 0.15 ? Math.min(1, (t - 0.15) * 2) : 0;
  const drips = !hitMode && t > 0.15;
  return (
    <SoundCanvas w={w} h={h} box={PAIR_BOX} label={accessibilityLabel} labels={labels}>
      <Basin view="side" splash={false} />
      {crown > 0 ? <Burst c={[0, 0]} r0={20} r1={20 + crown * 70} n={11} phase={-1.6} /> : null}
      {drips ? (
        <>
          <Burst c={[40, -40 - t * 60]} r0={3} r1={8} n={4} phase={0.4} />
          <Burst c={[-60, -20 - t * 90]} r0={3} r1={8} n={4} phase={1.4} />
          <Radiate c={[0, 0]} radii={[50 * t + 20, 90 * t + 30]} a0={-180} a1={0} />
        </>
      ) : null}
    </SoundCanvas>
  );
}
