/**
 * I03b EGG SHAKER — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): one
 * egg drawn large and CUT OPEN (its shell seen through) so the grains show.
 *
 *   StrikeSequence  ① the wrist moves the egg; the grains lag; ② the stroke
 *                   turns; ③ the grains strike the shell — the attack — and
 *                   roll along it — the wash; ④ sound leaves the shell, less
 *                   where the palm covers it.
 *   CoupledHeads    the grip (copy.sound.pair): FINGERTIPS — the shell open
 *                   to the air — or CUPPED — the palm over part of it, shielding
 *                   and damping that side. SWING moves the egg through a stroke.
 *
 * Simplifications register (egg_shaker/SOURCES.md): a few beads stand for the
 * grains; the palm is a shape, not a measured hand; positions show ORDER and
 * WHERE, never speed or level. Nothing loops.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { INK, make, oval } from '../shared/concert/paths.ts';
import { SKIN, SKIN_RIM } from '../shared/smallperc/Hand';
import { smoothShape, BEAD, EGG_SHELL } from '../shared/smallperc/objects';
import { AIR, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { EGG_DIMS } from './model.ts';

export const SOUND_BOX = { u0: -120, u1: 120, v0: -86, v1: 86 };
const HL = EGG_DIMS.len.mm / 2;
const HR = EGG_DIMS.d.mm / 2;

/** Beads clustered at `at` (−1 … 1 along the egg). */
function grains(at: number, spread: number) {
  const p = make();
  let s = 11;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const cx = at * (HL - 9);
  for (let i = 0; i < 18; i++) oval(p, cx + (rnd() - 0.5) * spread, HR * 0.35 + (rnd() - 0.5) * HR * 0.7, 2.6, 2.6);
  return p;
}

function CutEgg({ dx = 0, at, spread }: { dx?: number; at: number; spread: number }) {
  const g = useMemo(() => ({ shell: oval(make(), 0, 0, HL, HR), inner: oval(make(), 0, 0, HL - 3, HR - 3), beads: grains(at, spread) }), [at, spread]);
  return (
    <Group transform={[{ translateX: dx }]}>
      <Path path={g.shell}>
        <RadialGradient c={vec(-HL * 0.3, -HR * 0.3)} r={HL * 1.2} colors={EGG_SHELL} />
      </Path>
      <Path path={g.inner} color="#1b1407" opacity={0.78} />
      <Path path={g.beads}>
        <RadialGradient c={vec(-4, -4)} r={26} colors={BEAD} />
      </Path>
      <Path path={g.shell} style="stroke" strokeWidth={1.3} color={INK} />
    </Group>
  );
}

export function EggStrike({ w, h, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const at = shown <= 1 ? -1 : shown === 2 ? 0.2 : 1;
  const spread = shown === 2 ? 30 : 14;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE EGG MOVES · THE GRAINS LAG', short: '① GRAINS LAG', u: -114, v: -76, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE STROKE TURNS', short: '② TURNS', u: -114, v: -58, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ GRAINS STRIKE THE SHELL', short: '③ STRIKE', u: 114, v: 52, align: 'right', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ FROM THE SHELL', short: '④ OUT', u: -114, v: 72, align: 'left', tone: 'blue' });
  labels.push({ id: 'ex', text: 'CUT OPEN · DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 4, v: SOUND_BOX.v1 - 8, align: 'right', tone: 'illustrative' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <CutEgg at={at} spread={spread} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[-50, -40]} b={[40, -40]} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Arrow a={[50, -40]} b={[-20, -40]} />
        <Arrow a={[-14, HR * 0.35]} b={[22, HR * 0.35]} color={AIR} width={3} head={9} dashed />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Burst c={[HL - 8, 6]} r0={12} r1={26} n={7} phase={-1.2} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[0, 0]} radii={[40, 56]} a0={-155} a1={-25} />
        <Radiate c={[HL, 0]} radii={[20, 32]} a0={-60} a1={60} />
        <Radiate c={[-HL, 0]} radii={[20, 32]} a0={120} a1={240} />
      </Group>
    </SoundCanvas>
  );
}

/** A palm cupped over the left part of the egg (about 40 % of the shell). */
function Palm() {
  const p = useMemo(() => smoothShape([[-HL - 30, -HR - 16], [-HL * 0.1, -HR - 14], [HL * 0.05, -HR * 0.2], [-HL * 0.05, HR + 14], [-HL - 30, HR + 16], [-HL - 46, 0]]), []);
  return (
    <Group opacity={0.92}>
      <Path path={p}>
        <LinearGradient start={vec(-HL - 40, -HR)} end={vec(0, HR)} colors={SKIN} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1.4} color={SKIN_RIM} />
    </Group>
  );
}

/** Step 2: `together` = FINGERTIPS (open); `opposed` = CUPPED PALM. */
export function EggGrip({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const cupped = mode === 'opposed';
  const dx = swing * 30;
  const at = Math.max(-1, Math.min(1, swing * 1.6));
  const end = Math.abs(swing) > 0.8;
  const labels: StaticLabel[] = [
    { id: 'grip', text: cupped ? 'PALM OVER PART OF THE SHELL' : 'FINGERTIPS: THE SHELL OPEN', short: cupped ? 'CUPPED' : 'OPEN', u: 0, v: -68, align: 'center', tone: 'amber' },
    { id: 'out', text: cupped ? 'LESS OUT OF THE COVERED SIDE' : 'OUT ALL ROUND', short: 'OUT', u: 0, v: 66, align: 'center', tone: 'blue' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <CutEgg dx={dx} at={at} spread={end ? 14 : 24} />
      {end ? <Burst c={[dx + Math.sign(swing) * (HL - 8), 6]} r0={12} r1={24} n={7} phase={swing > 0 ? -1.2 : 1.9} /> : null}
      <Group transform={[{ translateX: dx }]}>
        <Radiate c={[0, 0]} radii={[40, 54]} a0={cupped ? -70 : -155} a1={-25} />
        <Radiate c={[HL, 0]} radii={[20, 30]} a0={-60} a1={60} />
        {cupped ? <Palm /> : <Radiate c={[-HL, 0]} radii={[20, 30]} a0={120} a1={240} />}
      </Group>
    </SoundCanvas>
  );
}
