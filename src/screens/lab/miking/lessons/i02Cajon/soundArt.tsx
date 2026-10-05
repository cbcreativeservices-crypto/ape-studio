/**
 * I02 CAJÓN — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): the box cut
 * open from the side, drawn large; the plate to the right, the port on the
 * back (or up through the front ledge on a front-port model).
 *
 *   StrokeSequence  ① the hand strikes the plate; ② the plate flexes (drawn
 *                   much larger) — at a top corner the snare wires buzz
 *                   against it; ③ the air in the box is pushed and pulled;
 *                   ④ sound leaves the plate — and the low end and a puff of
 *                   air leave the port.
 *   StrokePlace     the pair (copy.sound.pair): a CENTRE stroke (the plate's
 *                   middle bows, the box's air pumps: bass) or a CORNER slap
 *                   (the top flexes, the wires buzz: snare-like). SWING bows
 *                   the plate.
 *
 * Simplifications register (cajon/SOURCES.md): the plate's flex is a drawn
 * shape, not a computed mode; marks show ORDER and WHERE, never level.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { INK, make, oval } from '../shared/concert/paths.ts';
import { AMBER, Arrow, BLUE, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { BH, CAJ_DIMS, HX, PORT_R, stateOf, type CajState } from './model.ts';

export const SOUND_BOX = { u0: -300, u1: 330, v0: -600, v1: 40 };
const BIRCH = ['#ecd2a2', '#d5b07a', '#b48a54', '#86622f'];
const AIR_IN = 'rgba(150,190,255,0.16)';

/** The box in section: walls, the plate bowed by `bow` (mm, + = inward) at
 *  height `at` (0 = the middle, 1 = the top corner). */
function Box({ s, bow, at }: { s: CajState; bow: number; at: number }) {
  const front = s.id === 'frontport';
  const lo = front ? CAJ_DIMS.ledgeH.mm : 0;
  const g = useMemo(() => {
    const W = 14;
    const outer = make();
    outer.moveTo(-HX, -BH);
    outer.lineTo(s.plateX, -BH);
    outer.lineTo(s.plateX, -lo);
    if (front) {
      outer.lineTo(HX, -lo);
      outer.lineTo(HX, 0);
    }
    outer.lineTo(-HX, 0);
    outer.close();
    const inner = make();
    inner.moveTo(-HX + W, -BH + W);
    inner.lineTo(s.plateX - 6, -BH + W);
    if (front) {
      inner.lineTo(s.plateX - 6, -lo + W);
      inner.lineTo(HX - W, -lo + W);
      inner.lineTo(HX - W, -W);
    } else inner.lineTo(s.plateX - 6, -W);
    inner.lineTo(-HX + W, -W);
    inner.close();
    // The plate: a thin strip, bowed at its middle or near its top.
    const yTop = -BH;
    const yBot = -lo;
    const yb = at > 0.5 ? yTop + (yBot - yTop) * 0.18 : (yTop + yBot) / 2;
    const plate = make();
    plate.moveTo(s.plateX - 6, yTop);
    plate.quadTo(s.plateX - 6 - bow * 2, yb, s.plateX - 6, yBot);
    plate.lineTo(s.plateX, yBot);
    plate.quadTo(s.plateX - bow * 2, yb, s.plateX, yTop);
    plate.close();
    const port = front ? oval(make(), s.port.x, -lo + W / 2, CAJ_DIMS.portF.mm / 2, W / 2 + 2) : oval(make(), -HX + W / 2, s.port.y, W / 2 + 2, PORT_R);
    const wires = make();
    for (let i = 0; i < 2; i++) {
      wires.moveTo(s.plateX - 14 - i * 8, yTop + 22);
      wires.lineTo(s.plateX - 14 - i * 8 - (at > 0.5 ? bow * 0.8 : 0), yTop + 160);
    }
    return { outer, inner, plate, port, wires };
  }, [s, bow, at, front, lo]);
  return (
    <Group>
      <Path path={g.outer}>
        <LinearGradient start={vec(-HX, -BH)} end={vec(HX, 0)} colors={BIRCH} />
      </Path>
      <Path path={g.inner} color="#17120c" />
      <Path path={g.inner} color={AIR_IN} />
      <Path path={g.outer} style="stroke" strokeWidth={2} color={INK} />
      <Path path={g.plate} color="#6a4428" />
      <Path path={g.wires} style="stroke" strokeWidth={2.4} color="#d6dae2">
        <DashPathEffect intervals={[6, 4]} />
      </Path>
      <Path path={g.port} color="#050403" />
    </Group>
  );
}

export function CajonStroke({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const s = stateOf(variant);
  const front = s.id === 'frontport';
  const bow = shown === 2 ? 9 : shown === 3 ? -6 : 0;
  const mid = -(CAJ_DIMS.ledgeH.mm * (front ? 1 : 0) + BH) / 2;
  const portOut: [number, number] = front ? [s.port.x, -CAJ_DIMS.ledgeH.mm - 8] : [-HX - 8, s.port.y];
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE HAND STRIKES THE PLATE', short: '① STRIKE', u: 320, v: -585, align: 'right', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE PLATE FLEXES · WIRES BUZZ', short: '② FLEX', u: 320, v: -555, align: 'right', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ THE AIR INSIDE IS PUSHED', short: '③ AIR', u: -290, v: 25, align: 'left', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: front ? '④ OUT: PLATE · PORT ↑' : '④ OUT: PLATE · PORT ←', short: '④ OUT', u: 320, v: 25, align: 'right', tone: 'blue' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Box s={s} bow={bow} at={0.2} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[s.plateX + 130, mid - 40]} b={[s.plateX + 16, mid]} color={AMBER} width={6} head={18} />
        <Burst c={[s.plateX + 6, mid]} r0={22} r1={38} n={7} phase={0} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Burst c={[s.plateX - 20, -BH + 90]} r0={10} r1={20} n={6} phase={0.5} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Arrow a={[s.plateX - 40, mid]} b={[-HX + 60, mid]} color={BLUE} width={4} head={12} dashed />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[s.plateX, mid]} radii={[50, 85, 120]} a0={-50} a1={50} />
        {front ? <Radiate c={portOut} radii={[30, 55]} a0={-130} a1={-50} color={AMBER} /> : <Radiate c={portOut} radii={[30, 55, 80]} a0={140} a1={220} color={AMBER} />}
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = a CENTRE stroke (bass); `opposed` = a CORNER slap. */
export function CajonPlace({ w, h, variant, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const s = stateOf(variant);
  const corner = mode === 'opposed';
  const bow = swing * 9;
  const labels: StaticLabel[] = [
    { id: 's', text: corner ? 'A TOP-CORNER SLAP' : 'A CENTRE STROKE', short: corner ? 'SLAP' : 'CENTRE', u: 0, v: -575, align: 'center', tone: 'amber' },
    { id: 'o', text: corner ? 'THE TOP FLEXES · THE WIRES BUZZ' : 'THE MIDDLE BOWS · THE AIR PUMPS', short: corner ? 'WIRES BUZZ' : 'AIR PUMPS', u: 0, v: 25, align: 'center', tone: 'blue' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Box s={s} bow={bow} at={corner ? 1 : 0.2} />
    </SoundCanvas>
  );
}
