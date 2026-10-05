/**
 * I03a HANDHELD SHAKER — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2):
 * the shaker's shell drawn large, along the page (the hand left out: the
 * subject is the fill inside).
 *
 *   StrikeSequence  ① the hand moves the shell; the fill lags at the
 *                   trailing end; ② the stroke turns; the fill keeps going;
 *                   ③ the fill lands on the end cap — the accent — and rubs
 *                   along the wall; ④ sound leaves the whole shell, the hand
 *                   shielding part of it.
 *   CoupledHeads    the pair of strokes (copy.sound.pair): SHARP — the fill
 *                   slams the cap at the turn — or SMOOTH — it slides along
 *                   the wall; SWING moves the shell through one stroke.
 *
 * Simplifications register (shaker/SOURCES.md): a few beads stand for the
 * fill; positions show ORDER and WHERE, never speed or level. Nothing loops.
 */
import { Group } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { ShakerTube } from '../shared/smallperc/objects';
import { AIR, AMBER, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { HALF, SHK_DIMS } from './model.ts';

export const SOUND_BOX = { u0: -128, u1: 128, v0: -92, v1: 92 };
const LEN = SHK_DIMS.len.mm;
const D = SHK_DIMS.d.mm;

function TheShaker({ dx = 0, fill }: { dx?: number; fill: number }) {
  // The shell alone, drawn large: the subject is the fill inside it.
  return <ShakerTube c={[dx, 0]} angle={0} len={LEN} d={D} fill={fill} />;
}

export function ShakerStrike({ w, h, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const fill = shown <= 1 ? -1 : shown === 2 ? 0.35 : 1;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE SHELL MOVES · THE FILL LAGS', short: '① FILL LAGS', u: -122, v: -82, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE STROKE TURNS', short: '② TURNS', u: -122, v: -64, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ FILL HITS THE END', short: '③ HITS', u: HALF - 4, v: 40, align: 'right', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ FROM THE WHOLE SHELL', short: '④ ALL ROUND', u: -122, v: 76, align: 'left', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 4, v: SOUND_BOX.v1 - 10, align: 'right', tone: 'illustrative' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <TheShaker fill={fill} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[-70, -42]} b={[40, -42]} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Arrow a={[70, -42]} b={[-20, -42]} />
        <Arrow a={[-10, 0]} b={[50, 0]} color={AIR} width={3} head={10} dashed />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Burst c={[HALF - 14, 0]} r0={16} r1={34} n={7} phase={-1.2} />
        <Arrow a={[-40, D / 2 - 6]} b={[30, D / 2 - 6]} color={AMBER} width={2.5} head={8} dashed />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[0, 0]} radii={[44, 62]} a0={-150} a1={-30} />
        <Radiate c={[HALF, 0]} radii={[24, 38]} a0={-60} a1={60} />
        <Radiate c={[-HALF, 0]} radii={[24, 38]} a0={120} a1={240} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = SHARP; `opposed` = SMOOTH; swing = the shell's place in one stroke. */
export function ShakerStroke({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const sharp = mode === 'together';
  const dx = swing * 45;
  const fill = sharp ? Math.max(-1, Math.min(1, swing * 1.6)) : swing * 0.45;
  const atEnd = sharp && Math.abs(swing) > 0.8;
  const end = Math.sign(swing) * (HALF - 14) + dx;
  const labels: StaticLabel[] = [
    { id: 'shell', text: Math.abs(swing) < 0.05 ? 'MID-STROKE' : swing > 0 ? 'SHELL → END OF STROKE' : '← SHELL, END OF STROKE', short: 'SHELL', u: 0, v: -70, align: 'center', tone: 'amber' },
    { id: 'fill', text: atEnd ? 'FILL SLAMS THE END' : sharp ? 'FILL IN FLIGHT' : 'FILL SLIDES ALONG THE WALL', short: 'FILL', u: 0, v: 56, align: 'center', tone: 'blue' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 4, v: SOUND_BOX.v1 - 10, align: 'right', tone: 'illustrative' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <TheShaker dx={dx} fill={fill} />
      {atEnd ? <Burst c={[end, 0]} r0={16} r1={34} n={7} phase={swing > 0 ? -1.2 : 1.9} /> : null}
      {!sharp && Math.abs(swing) > 0.05 ? <Arrow a={[dx - 30 * Math.sign(swing), D / 2 - 6]} b={[dx + 30 * Math.sign(swing), D / 2 - 6]} color={AMBER} width={2.5} head={8} dashed /> : null}
    </SoundCanvas>
  );
}
