/**
 * I05b CLAVES — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): the
 * supported clave along the page, drawn large, resting on its supports (the
 * fingertips and the heel of the hand) with the hand's hollow beneath.
 *
 *   StrikeSequence  ① the striker's edge strikes the middle; ② the clave
 *                   bends in its LOWEST free-bar shape (bar.ts: two still
 *                   points ≈ 22 % in from each end — where the hand supports
 *                   it); ③ the hollow under it rings with it; ④ sound leaves
 *                   the clave and the hollow — a click and a short woody ring.
 *   CoupledHeads    the grip (copy.sound.pair): CRADLED — supported near the
 *                   still points, it rings — or SQUEEZED — pressed into the
 *                   palm along its length, it is choked. SWING bends it.
 *
 * Physics: barShape / barNodes (Euler–Bernoulli free bar, tested); the bend
 * is drawn much larger than it moves; positions give ORDER and WHERE, never
 * speed or level. Nothing loops.
 */
import { useMemo } from 'react';
import { Circle, Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { INK, make, rrect } from '../shared/concert/paths.ts';
import { SKIN, SKIN_RIM } from '../shared/smallperc/Hand';
import { ROSEWOOD, smoothShape } from '../shared/smallperc/objects';
import { barNodes, barShape } from '../shared/smallperc/bar.ts';
import { AMBER, Arrow, BLUE, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { CL, CR } from './model.ts';

export const SOUND_BOX = { u0: -130, u1: 130, v0: -95, v1: 95 };
const NODES = barNodes(0).map((u) => -CL / 2 + u * CL);
const AMP = 14; // drawn bend at the ends, mm — much larger than real

/** The clave's outline bent in its lowest shape by `k` (−1 … 1). */
function bentClave(k: number) {
  const p = make();
  const N = 28;
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = -CL / 2 + u * CL;
    const y = -k * AMP * barShape(0, u);
    top.push([x, y - CR]);
    bot.push([x, y + CR]);
  }
  top.forEach((q, i) => (i === 0 ? p.moveTo(q[0], q[1]) : p.lineTo(q[0], q[1])));
  for (let i = bot.length - 1; i >= 0; i--) p.lineTo(bot[i][0], bot[i][1]);
  p.close();
  return p;
}

function Supports({ squeezed }: { squeezed: boolean }) {
  const g = useMemo(() => {
    if (squeezed) return { pads: smoothShape([[-CL / 2 + 10, CR + 2], [CL / 2 - 10, CR + 2], [CL / 2 - 10, CR + 26], [-CL / 2 + 10, CR + 26]]), cup: null };
    const pads = make();
    for (const x of NODES) rrect(pads, x - 12, CR + 1, x + 12, CR + 21, 10);
    const cup = smoothShape([[NODES[0] - 14, CR + 12], [0, CR + 64], [NODES[1] + 14, CR + 12], [NODES[1] + 22, CR + 40], [0, CR + 80], [NODES[0] - 22, CR + 40]]);
    return { pads, cup };
  }, [squeezed]);
  return (
    <Group>
      {g.cup ? (
        <Group>
          <Path path={g.cup}>
            <LinearGradient start={vec(-80, CR)} end={vec(80, CR + 80)} colors={SKIN} />
          </Path>
          <Path path={g.cup} style="stroke" strokeWidth={1.4} color={SKIN_RIM} />
        </Group>
      ) : null}
      <Path path={g.pads}>
        <LinearGradient start={vec(-80, CR)} end={vec(80, CR + 30)} colors={SKIN} />
      </Path>
      <Path path={g.pads} style="stroke" strokeWidth={1.4} color={SKIN_RIM} />
    </Group>
  );
}

function TheClave({ k, squeezed = false, nodes = true }: { k: number; squeezed?: boolean; nodes?: boolean }) {
  const body = useMemo(() => bentClave(k), [k]);
  const rest = useMemo(() => bentClave(0), []);
  return (
    <Group>
      <Supports squeezed={squeezed} />
      {Math.abs(k) > 0.05 ? <Path path={rest} style="stroke" strokeWidth={1} color="#8a8f9c" opacity={0.6} /> : null}
      <Path path={body}>
        <LinearGradient start={vec(0, -CR)} end={vec(0, CR)} colors={ROSEWOOD} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={1.2} color={INK} />
      {nodes ? NODES.map((x) => <Circle key={x} cx={x} cy={0} r={4} color={BLUE} />) : null}
    </Group>
  );
}

export function ClavesStrike({ w, h, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const k = shown === 2 ? 1 : shown === 3 ? -0.7 : 0;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE STRIKER’S EDGE HITS THE MIDDLE', short: '① STRIKE', u: -124, v: -86, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② IT BENDS · STILL POINTS STAY PUT', short: '② BENDS', u: -124, v: -68, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ THE HOLLOW RINGS WITH IT', short: '③ HOLLOW', u: 0, v: 86, align: 'center', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ A CLICK, THEN A SHORT RING', short: '④ OUT', u: 124, v: -86, align: 'right', tone: 'blue' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <TheClave k={k} nodes={shown >= 2} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={[-40, -62]} b={[-4, -CR - 4]} />
        <Burst c={[0, -CR - 2]} r0={9} r1={20} n={7} phase={-1.6} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Radiate c={[0, CR + 50]} radii={[16, 26]} a0={20} a1={160} color={AMBER} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[0, 0]} radii={[46, 66]} a0={-155} a1={-25} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = CRADLED (rings); `opposed` = SQUEEZED (choked). */
export function ClavesGrip({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const squeezed = mode === 'opposed';
  const k = swing * (squeezed ? 0.15 : 1);
  const labels: StaticLabel[] = [
    { id: 'g', text: squeezed ? 'PRESSED INTO THE PALM ALONG ITS LENGTH' : 'RESTING NEAR ITS STILL POINTS', short: squeezed ? 'SQUEEZED' : 'CRADLED', u: 0, v: -80, align: 'center', tone: 'amber' },
    { id: 'o', text: squeezed ? 'CHOKED: A DEAD TICK' : 'ABLE TO BEND AND RING', short: squeezed ? 'CHOKED' : 'RINGS', u: 0, v: 86, align: 'center', tone: 'blue' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <TheClave k={k} squeezed={squeezed} nodes={!squeezed} />
    </SoundCanvas>
  );
}
