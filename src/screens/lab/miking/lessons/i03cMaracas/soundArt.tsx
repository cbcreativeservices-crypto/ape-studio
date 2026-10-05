/**
 * I03c MARACAS — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): one head
 * drawn large and CUT OPEN, its handle below, the seeds inside.
 *
 *   StrikeSequence  ① the wrist swings the head down; the seeds lag at the
 *                   top; ② the stroke stops and turns; ③ the seeds strike the
 *                   vessel's wall — the attack — and rub along it; ④ sound
 *                   leaves the head, all round (the handle adds little).
 *   CoupledHeads    the motion (copy.sound.pair): UP AND DOWN — the seeds
 *                   thrown against the top and bottom of the vessel — or a
 *                   CIRCULAR WRIST — the seeds rolling round the wall, a longer
 *                   sustain. SWING moves the head through the motion.
 *
 * Simplifications register (maracas/SOURCES.md): a few beads stand for the
 * seeds; positions show ORDER and WHERE, never speed or level. Nothing loops.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { INK, make, oval, rrect } from '../shared/concert/paths.ts';
import { BEAD, RAWHIDE, WOOD_HANDLE } from '../shared/smallperc/objects';
import { AMBER, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { MAR_DIMS } from './model.ts';

export const SOUND_BOX = { u0: -112, u1: 112, v0: -92, v1: 120 };
const RW = MAR_DIMS.headW.mm / 2;
const RH = MAR_DIMS.headH.mm / 2;

/** Seeds as beads: `kind` 'top' / 'bottom' / 'spread' / 'ring' (round the wall at angle a). */
function seeds(kind: 'top' | 'bottom' | 'spread' | 'ring', a = 0) {
  const p = make();
  let s = 5;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < 20; i++) {
    let x: number;
    let y: number;
    if (kind === 'ring') {
      const t = a + (rnd() - 0.5) * 1.6;
      x = Math.cos(t) * (RW - 9);
      y = Math.sin(t) * (RH - 9);
    } else {
      x = (rnd() - 0.5) * RW * 1.2;
      y = kind === 'top' ? -RH + 10 + rnd() * 12 : kind === 'bottom' ? RH - 10 - rnd() * 12 : (rnd() - 0.5) * RH;
    }
    oval(p, x, y, 2.8, 2.8);
  }
  return p;
}

function CutHead({ dy = 0, kind, a = 0 }: { dy?: number; kind: 'top' | 'bottom' | 'spread' | 'ring'; a?: number }) {
  const g = useMemo(() => ({ shell: oval(make(), 0, 0, RW, RH), inner: oval(make(), 0, 0, RW - 4, RH - 4), handle: rrect(make(), -9, RH - 6, 9, RH + 96, 6), beads: seeds(kind, a) }), [kind, a]);
  return (
    <Group transform={[{ translateY: dy }]}>
      <Path path={g.handle}>
        <LinearGradient start={vec(-9, 0)} end={vec(9, 0)} colors={WOOD_HANDLE} />
      </Path>
      <Path path={g.handle} style="stroke" strokeWidth={1.1} color={INK} />
      <Path path={g.shell}>
        <RadialGradient c={vec(-RW * 0.3, -RH * 0.3)} r={RH * 1.4} colors={RAWHIDE} />
      </Path>
      <Path path={g.inner} color="#1b1409" opacity={0.78} />
      <Path path={g.beads}>
        <RadialGradient c={vec(-4, -4)} r={30} colors={BEAD} />
      </Path>
      <Path path={g.shell} style="stroke" strokeWidth={1.3} color={INK} />
    </Group>
  );
}

export function MaracaStrike({ w, h, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const kind = shown <= 1 ? 'top' : shown === 2 ? 'spread' : 'bottom';
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① DOWN · THE SEEDS LAG', short: '① LAG', u: -106, v: -82, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE STROKE STOPS', short: '② STOPS', u: -106, v: -64, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ SEEDS STRIKE THE WALL', short: '③ STRIKE', u: 106, v: 70, align: 'right', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ FROM THE HEAD', short: '④ OUT', u: 106, v: -82, align: 'right', tone: 'blue' });
  labels.push({ id: 'ex', text: 'CUT OPEN · DRAWN LARGER', short: 'LARGER', u: SOUND_BOX.u1 - 4, v: SOUND_BOX.v1 - 8, align: 'right', tone: 'illustrative' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <CutHead kind={kind} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[RW + 22, -40]} b={[RW + 22, 30]} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Arrow a={[RW + 22, 30]} b={[RW + 22, -20]} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Burst c={[0, RH - 6]} r0={12} r1={26} n={7} phase={0.4} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[0, 0]} radii={[RH + 8, RH + 24]} a0={-160} a1={-20} />
        <Radiate c={[0, 0]} radii={[RW + 12, RW + 26]} a0={-15} a1={40} />
        <Radiate c={[0, 0]} radii={[RW + 12, RW + 26]} a0={140} a1={195} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = UP AND DOWN; `opposed` = A CIRCULAR WRIST. */
export function MaracaMotion({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const circ = mode === 'opposed';
  const dy = circ ? 0 : swing * 18;
  const kind = circ ? 'ring' : swing > 0.6 ? 'bottom' : swing < -0.6 ? 'top' : 'spread';
  const ang = Math.PI / 2 + swing * Math.PI;
  const ringArrow = useMemo(() => {
    const p = make();
    p.addArc(Skia.XYWHRect(-RW - 16, -RH - 16, 2 * RW + 32, 2 * RH + 32), 200, 260);
    return p;
  }, []);
  const labels: StaticLabel[] = [
    { id: 'm', text: circ ? 'SEEDS ROLL ROUND THE WALL' : Math.abs(swing) > 0.6 ? 'SEEDS THROWN AGAINST THE WALL' : 'SEEDS IN FLIGHT', short: 'SEEDS', u: 0, v: -84, align: 'center', tone: 'amber' },
    { id: 'o', text: circ ? 'A LONGER, SMOOTHER SUSTAIN' : 'AN ACCENT AT EACH TURN', short: 'SOUND', u: 0, v: 110, align: 'center', tone: 'blue' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <CutHead dy={dy} kind={kind} a={ang} />
      {circ ? (
        <Path path={ringArrow} style="stroke" strokeWidth={4} strokeCap="round" color={AMBER} opacity={0.8}>
          <DashPathEffect intervals={[12, 8]} />
        </Path>
      ) : Math.abs(swing) > 0.6 ? (
        <Burst c={[0, dy + (swing > 0 ? RH - 6 : -RH + 6)]} r0={12} r1={24} n={7} phase={swing > 0 ? 0.4 : -2.7} />
      ) : null}
    </SoundCanvas>
  );
}
