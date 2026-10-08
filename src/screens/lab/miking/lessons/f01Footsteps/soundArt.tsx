/**
 * F01 FOLEY FOOTSTEPS — MEET IT, where the sound comes from, drawn
 * (LESSON_JOURNEY §6 stage 1, §7): one shoe on the variant's surface, the
 * pit cut open under it, drawn large.
 *
 *   StrikeSequence  ① the heel lands — the sharp contact starts here, at the
 *                   floor; ② the sole rolls to the toe (the shoe's own creak
 *                   and the scuff); ③ the surface answers (tiles click, boards
 *                   knock, stones crunch, carpet hushes); ④ the floor under it
 *                   and the room carry it on (a hollow layer can boom).
 *   CoupledHeads    SOLID or HOLLOW under the surface (copy.sound.pair): the
 *                   step's push goes into a solid bed and stops — or flexes
 *                   boards over an air gap that rings; SWING = the step.
 *
 * Simplifications register (foley_footsteps/SOURCES.md): the order of events
 * and WHERE, never how loud or how long; motion drawn larger. Nothing loops.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { make } from '../shared/concert/paths.ts';
import { AIR, AMBER, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { PitSection } from '../shared/foley/StageArt';
import { SURFACES, type SurfaceId } from '../shared/foley/stage.ts';
import { F01_SURFACE } from './geometry.ts';

export const SOUND_BOX = { u0: -420, u1: 420, v0: -330, v1: 190 };

/** A leather shoe in profile, the heel's back-bottom corner at (0, 0), the
 *  toe toward +u; `pitch` tilts it about the heel (deg, toe up > 0). */
export function Shoe({ x, y, pitch = 0, scale = 1 }: { x: number; y: number; pitch?: number; scale?: number }) {
  const g = useMemo(() => {
    const upper = make();
    upper.moveTo(6, -40);
    upper.cubicTo(-4, -92, 30, -128, 78, -130);
    upper.lineTo(132, -126);
    upper.cubicTo(150, -104, 186, -88, 236, -72);
    upper.cubicTo(278, -60, 292, -40, 290, -22);
    upper.lineTo(8, -22);
    upper.close();
    const sole = make();
    sole.moveTo(76, -22);
    sole.lineTo(292, -22);
    sole.cubicTo(298, -14, 296, -6, 286, -2);
    sole.lineTo(76, -2);
    sole.close();
    const heel = make();
    heel.moveTo(2, -30);
    heel.lineTo(78, -30);
    heel.lineTo(76, 0);
    heel.lineTo(4, 0);
    heel.close();
    const welt = make();
    welt.moveTo(10, -24);
    welt.lineTo(290, -24);
    const lace = make();
    for (let i = 0; i < 4; i++) {
      lace.moveTo(120 + i * 22, -120 + i * 9);
      lace.lineTo(132 + i * 22, -110 + i * 9);
    }
    return { upper, sole, heel, welt, lace };
  }, []);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale }, { rotate: (-pitch * Math.PI) / 180 }]}>
      <Path path={g.heel}>
        <LinearGradient start={vec(0, -30)} end={vec(0, 0)} colors={['#3a2a1e', '#1a120c']} />
      </Path>
      <Path path={g.sole}>
        <LinearGradient start={vec(0, -22)} end={vec(0, 0)} colors={['#3a2a1e', '#160f0a']} />
      </Path>
      <Path path={g.upper}>
        <LinearGradient start={vec(20, -130)} end={vec(260, -20)} colors={['#a5734a', '#6e4527', '#432812', '#2a180b']} />
      </Path>
      <Path path={g.welt} style="stroke" strokeWidth={2.4} color="#d2a57a" opacity={0.5} />
      <Path path={g.lace} style="stroke" strokeWidth={3} strokeCap="round" color="#1a120c" opacity={0.8} />
      <Path path={g.upper} style="stroke" strokeWidth={2.2} color="#140c06" />
      <Path path={g.heel} style="stroke" strokeWidth={1.8} color="#0a0705" />
    </Group>
  );
}

const ENDS = { tile: 'TILES CLICK', woodPanel: 'BOARDS KNOCK', gravel: 'STONES CRUNCH', carpetOver: 'CARPET HUSHES', concrete: 'A HARD SLAP', leaves: 'LEAVES CRACKLE' } as const;

export function FootstepStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const surface: SurfaceId = F01_SURFACE[variant] ?? 'tile';
  const s = SURFACES[surface];
  // The shoe: heel landing (toe up), rolled flat, toe pushing off.
  const pitch = shown <= 1 ? 16 : shown === 2 ? 0 : -6;
  const sx = shown <= 1 ? -230 : -250;
  const top = s.layers[0].mm;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE HEEL LANDS', short: '① HEEL', u: -410, v: -310, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE SOLE ROLLS', short: '② ROLLS', u: -410, v: -282, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: `③ ${ENDS[surface]}`, short: '③ SURFACE', u: 400, v: -60, align: 'right', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: s.hollow ? '④ THE GAP BOOMS · THE ROOM' : '④ THE FLOOR · THE ROOM', short: '④ FLOOR · ROOM', u: 400, v: -300, align: 'right', tone: 'blue' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 4, v: SOUND_BOX.v1 - 8, align: 'right', tone: 'illustrative' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <PitSection surface={surface} u0={-700} u1={700} />
      <Shoe x={sx} y={shown <= 1 ? -2 : 0} pitch={pitch} scale={1.4} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[sx + 50, -260]} b={[sx + 50, -60]} />
        <Burst c={[sx + 40, 0]} r0={20} r1={46} n={7} phase={-1.6} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Arrow a={[sx + 80, -230]} b={[sx + 330, -230]} />
        <Burst c={[sx + 360, -4]} r0={14} r1={32} n={6} phase={-1.4} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Burst c={[sx + 160, top / 2]} r0={22} r1={58} n={9} phase={-1.2} color={AMBER} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Arrow a={[sx + 160, 30]} b={[sx + 160, 130]} color={AIR} width={4} head={12} dashed />
        {s.hollow ? <Radiate c={[sx + 160, 60]} radii={[40, 70]} a0={200} a1={340} /> : null}
        <Radiate c={[sx + 160, -10]} radii={[160, 230]} a0={-170} a1={-10} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = SOLID under the surface; `opposed` = HOLLOW; swing = the step. */
export function FootstepFloor({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const hollow = mode === 'opposed';
  const surface: SurfaceId = hollow ? 'woodPanel' : 'tile';
  const press = Math.max(0, swing);
  const sx = -240;
  const labels: StaticLabel[] = [
    { id: 'step', text: Math.abs(swing) < 0.05 ? 'THE STEP LANDS' : swing > 0 ? 'WEIGHT ON THE STEP' : 'FOOT LIFTING', short: 'STEP', u: -410, v: -310, align: 'left', tone: 'amber' },
    { id: 'under', text: hollow ? 'THE BOARDS FLEX · THE GAP RINGS' : 'A SOLID BED · IT STOPS HERE', short: hollow ? 'GAP RINGS' : 'SOLID', u: 400, v: 170, align: 'right', tone: 'blue' },
    { id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: SOUND_BOX.u1 - 4, v: -310, align: 'right', tone: 'illustrative' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Group transform={hollow ? [{ translateY: press * 6 }] : []}>
        <PitSection surface={surface} u0={-700} u1={700} />
      </Group>
      <Shoe x={sx} y={swing < 0 ? swing * 60 : hollow ? press * 6 : 0} pitch={0} scale={1.4} />
      {press > 0.05 ? (
        <>
          <Arrow a={[sx + 160, 20]} b={[sx + 160, hollow ? 70 : 40]} color={AIR} width={4} head={12} dashed opacity={press} />
          {hollow ? <Radiate c={[sx + 160, 50]} radii={[40, 80, 120]} a0={190} a1={350} opacity={press} /> : null}
        </>
      ) : null}
    </SoundCanvas>
  );
}
