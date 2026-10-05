/**
 * I05a COWBELL — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): the bell
 * from the side, drawn large, the mouth to the right.
 *
 *   StrikeSequence  ① the stick strikes the top near the mouth; ② the steel
 *                   walls flex (drawn much larger than they move); ③ the whole
 *                   body rings on — the sustain; ④ sound leaves the WHOLE
 *                   body, walls and mouth — not only the mouth (a cowbell is
 *                   not a trumpet's bell).
 *   CoupledHeads    the pair (copy.sound.pair): OPEN — the walls ring freely
 *                   — or MUTED — a cushion in the mouth (or a magnet on the
 *                   side) damps them: a shorter ring, and a large mute lowers
 *                   the pitch. SWING bends the walls through their motion.
 *
 * Simplifications register (cowbell/SOURCES.md): the wall's bow is a drawn
 * shape, not a computed mode; marks give ORDER and WHERE, never level or
 * speed. Nothing loops.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { INK, make, rrect } from '../shared/concert/paths.ts';
import { BELL_BLACK, BELL_CHROME, FOAM } from '../shared/smallperc/objects';
import { AMBER, Arrow, BLUE, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { BELL_DIMS } from './model.ts';

export const SOUND_BOX = { u0: -140, u1: 150, v0: -110, v1: 100 };
const L = BELL_DIMS.len.mm;
const H0 = BELL_DIMS.endH.mm;
const H1 = BELL_DIMS.mouthH.mm;

/** The bell's side outline from the closed end (−L/2) to the mouth (+L/2),
 *  its top and bottom walls bowed by `bow` mm at their middles. */
function bellPath(bow: number) {
  const p = make();
  const x0 = -L / 2;
  const x1 = L / 2;
  p.moveTo(x0, -H0 / 2);
  p.quadTo(0, -(H0 + H1) / 4 - bow * 2, x1, -H1 / 2);
  p.lineTo(x1, H1 / 2);
  p.quadTo(0, (H0 + H1) / 4 + bow * 2, x0, H0 / 2);
  p.close();
  return p;
}

function BellBody({ bow, muted }: { bow: number; muted: boolean }) {
  const g = useMemo(() => ({ body: bellPath(bow), rest: bellPath(0), lip: rrect(make(), L / 2 - 7, -H1 / 2 - 2, L / 2 + 2, H1 / 2 + 2, 2), cushion: rrect(make(), L / 2 - 34, -H1 / 2 + 6, L / 2 - 4, H1 / 2 - 6, 8) }), [bow]);
  return (
    <Group>
      <Path path={g.rest} style="stroke" strokeWidth={1.2} color="#8a8f9c" opacity={Math.abs(bow) > 0.5 ? 0.6 : 0} />
      <Path path={g.body}>
        <LinearGradient start={vec(0, -H1 / 2)} end={vec(0, H1 / 2)} colors={BELL_BLACK} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={1.4} color={INK} />
      <Path path={g.lip}>
        <LinearGradient start={vec(0, -H1 / 2)} end={vec(0, H1 / 2)} colors={BELL_CHROME} />
      </Path>
      {muted ? (
        <Group>
          <Path path={g.cushion}>
            <LinearGradient start={vec(0, -H1 / 2)} end={vec(0, H1 / 2)} colors={FOAM} />
          </Path>
          <Path path={g.cushion} style="stroke" strokeWidth={1} color={INK} />
        </Group>
      ) : null}
    </Group>
  );
}

export function CowbellStrike({ w, h, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const bow = shown === 2 ? 7 : shown === 3 ? -5 : 0;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE STICK STRIKES THE TOP', short: '① STRIKE', u: -134, v: -98, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE WALLS FLEX', short: '② FLEX', u: -134, v: -80, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ THE BODY RINGS ON', short: '③ RINGS', u: -134, v: 88, align: 'left', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ FROM THE WALLS AND THE MOUTH', short: '④ ALL OF IT', u: 144, v: 88, align: 'right', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'LARGER', u: 144, v: -98, align: 'right', tone: 'illustrative' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <BellBody bow={bow} muted={false} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[L / 2 - 70, -96]} b={[L / 2 - 32, -H1 / 2 - 6]} />
        <Burst c={[L / 2 - 30, -H1 / 2 - 4]} r0={10} r1={22} n={7} phase={-0.4} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Arrow a={[0, -48]} b={[0, -30]} color={BLUE} width={4} head={10} />
        <Arrow a={[0, 48]} b={[0, 30]} color={BLUE} width={4} head={10} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[0, 0]} radii={[60, 82]} a0={-150} a1={-30} />
        <Radiate c={[0, 0]} radii={[60, 82]} a0={30} a1={150} />
        <Radiate c={[L / 2, 0]} radii={[30, 48]} a0={-50} a1={50} color={AMBER} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = OPEN (rings freely); `opposed` = MUTED (cushion in the mouth). */
export function CowbellMute({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const muted = mode === 'opposed';
  const bow = swing * (muted ? 2 : 8);
  const labels: StaticLabel[] = [
    { id: 'w', text: Math.abs(swing) < 0.05 ? 'WALLS AT REST' : muted ? 'WALLS DAMPED' : 'WALLS RING FREELY', short: 'WALLS', u: 0, v: -86, align: 'center', tone: 'blue' },
    { id: 'o', text: muted ? 'A SHORTER RING · A LARGE MUTE LOWERS THE PITCH' : 'A LONG, OPEN RING', short: muted ? 'SHORTER' : 'LONG RING', u: 0, v: 82, align: 'center', tone: 'amber' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <BellBody bow={bow} muted={muted} />
    </SoundCanvas>
  );
}
