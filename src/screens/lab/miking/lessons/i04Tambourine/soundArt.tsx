/**
 * I04 HEADLESS TAMBOURINE — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2).
 * The ring edge-on and level, a canonical pose for reading — and NO head: the
 * jingles are the whole sound (the headed tambourine, with its head's body,
 * is Lab 1's M08).
 *
 *   StrikeSequence  ① the hand shakes (or strikes) the frame; ② the frame
 *                   moves — the loose jingle pairs lag; ③ they clash against
 *                   each other and their pins; ④ sound leaves from the
 *                   jingles all round the frame — brief, bright peaks.
 *   CoupledHeads    the pair (copy.sound.pair): SHAKEN — the jingles lag the
 *                   frame, then clash — or STRUCK into the hand — a jolt that
 *                   throws every pair at once: a stronger, shorter accent.
 *
 * Simplifications register (headless_tambourine/SOURCES.md): the jingles'
 * and the frame's motion are drawn as positions, not measured motions; arcs
 * give ORDER and WHERE, never speed or level. Nothing loops (D8).
 */
import { useMemo } from 'react';
import { Group, Path } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { make, rrect } from '../shared/concert/paths.ts';
import { AMBER, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { EdgeOn, slotAngles } from './art';
import { R, STATES, TMB_DIMS, type TmbState } from './model.ts';

export const SOUND_BOX = { u0: -200, u1: 200, v0: -150, v1: 130 };
const DEPTH = TMB_DIMS.depth.mm;
const LEVEL: TmbState = { ...STATES.shaken, pose: { c: { x: 0, y: 0, z: 0 }, n: { x: 0, y: -1, z: 0 }, e1: { x: 1, y: 0, z: 0 } } };

/** The near-half jingle pairs, displaced by `dx` (they lag a moving frame). */
function lagDiscs(dx: number, jig: number) {
  const p = make();
  for (const a of slotAngles()) {
    const s = Math.sin(a);
    if (s <= 0.12) continue;
    const u = R * Math.cos(a) + dx;
    const half = (TMB_DIMS.jingleD.mm / 2) * s + 4;
    rrect(p, u - half, -4.6 - jig, u + half, -1.4 - jig, 1.3);
    rrect(p, u - half, 1.4 + jig, u + half, 4.6 + jig, 1.3);
  }
  return p;
}

export function TambourineStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const struck = variant === 'struck' || variant === 'mounted';
  const clash = useMemo(() => {
    const p = make();
    for (const a of slotAngles()) {
      if (Math.sin(a) <= 0.12) continue;
      const u = R * Math.cos(a);
      p.moveTo(u - 8, -14);
      p.lineTo(u + 8, 14);
      p.moveTo(u + 8, -14);
      p.lineTo(u - 8, 14);
    }
    return p;
  }, []);
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: struck ? '① THE FRAME IS STRUCK' : '① THE HAND SHAKES THE FRAME', short: '① START', u: -190, v: -136, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE JINGLES LAG', short: '② LAG', u: -190, v: -116, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ PAIRS CLASH', short: '③ CLASH', u: 0, v: DEPTH / 2 + 34, align: 'center', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ FROM ALL ROUND THE FRAME', short: '④ ALL ROUND', u: 190, v: -136, align: 'right', tone: 'blue' });
  labels.push({ id: 'ex', text: 'NO HEAD · MOTION DRAWN LARGER', short: 'NO HEAD', u: SOUND_BOX.u1 - 6, v: SOUND_BOX.v1 - 10, align: 'right', tone: 'illustrative' });
  const lag = shown === 2 ? -16 : 0;
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Group transform={[{ translateX: shown === 2 ? 22 : 0 }]}>
        <EdgeOn s={LEVEL} />
      </Group>
      {shown === 2 ? <Path path={lagDiscs(lag + 22, 0)} color="#e2e5ec" opacity={0.85} /> : null}
      <Group opacity={eventOpacity(shown, 1)}>
        {struck ? <Arrow a={[-40, -96]} b={[-10, -30]} /> : (
          <>
            <Arrow a={[-30, -70]} b={[-140, -70]} />
            <Arrow a={[30, -70]} b={[140, -70]} />
          </>
        )}
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Path path={clash} style="stroke" strokeWidth={3} strokeCap="round" color={AMBER} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[0, 0]} radii={[70, 105]} a0={-160} a1={-20} />
        <Radiate c={[0, 0]} radii={[70, 105]} a0={20} a1={160} />
        <Radiate c={[-R - 10, 0]} radii={[30, 52]} a0={150} a1={210} />
        <Radiate c={[R + 10, 0]} radii={[30, 52]} a0={-30} a1={30} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = SHAKEN (lag, then clash); `opposed` = STRUCK INTO THE HAND. */
export function TambourineMotion({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const shaken = mode === 'together';
  const dx = shaken ? 60 * swing : 0;
  const lag = shaken ? -dx * 0.55 : 0;
  const jig = shaken ? 0 : 5 * Math.abs(swing);
  const discs = useMemo(() => lagDiscs(dx + lag, jig), [dx, lag, jig]);
  const labels: StaticLabel[] = [
    { id: 'f', text: Math.abs(swing) < 0.05 ? 'AT REST' : shaken ? (swing > 0 ? 'FRAME → ' : '← FRAME') : 'A JOLT: EVERY PAIR AT ONCE', short: 'FRAME', u: 0, v: -100, align: 'center', tone: 'amber' },
    { id: 'j', text: Math.abs(swing) < 0.05 ? 'JINGLES AT REST' : shaken ? 'JINGLES LAG, THEN CLASH' : 'A STRONGER, SHORTER ACCENT', short: 'JINGLES', u: 0, v: DEPTH / 2 + 40, align: 'center', tone: 'blue' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Group transform={[{ translateX: dx }]}>
        <EdgeOn s={LEVEL} />
      </Group>
      <Path path={discs} color="#e2e5ec" opacity={0.9} />
      {!shaken && Math.abs(swing) > 0.3 ? <Burst c={[-R + 10, -DEPTH / 2 - 10]} r0={12} r1={30} n={8} phase={0} /> : null}
    </SoundCanvas>
  );
}
