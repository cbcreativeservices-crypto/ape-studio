/**
 * F03 PROPS — MEET IT, where the sound comes from, drawn (LESSON_JOURNEY §6
 * stage 1, §7): the variant's prop drawn large.
 *
 *   StrikeSequence  one action in four events: ① the hand grasps and moves
 *                   it; ② the small contact — the keys strike each other,
 *                   the sheet bends, the latch releases, the leg scrapes;
 *                   ③ the body answers — the ring and the keys, the table,
 *                   the panel, the chair's frame; ④ the final contact and the
 *                   room. "A single door sound can involve several places."
 *   CoupledHeads    CLICK or BODY (copy.sound.pair) on the door from above:
 *                   the latch's small click, or the panel's large resonance —
 *                   SWING closes the door.
 * The order of events and WHERE, never level; motion drawn larger.
 */
import { Group } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { AIR, Arrow, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { Chair, FoleyDoor, KeyRing, PaperSheet } from '../shared/foley/props';
import { TableArt } from '../shared/foley/StageArt';
import { CHAIR, DOOR } from '../shared/foley/propGeom.ts';

type Spot = { box: { u0: number; u1: number; v0: number; v1: number }; contact: [number, number]; body: [number, number]; final: [number, number]; hand: [[number, number], [number, number]]; words: [string, string, string] };

const SPOTS: Record<string, Spot> = {
  keys: { box: { u0: -110, u1: 110, v0: -40, v1: 120 }, contact: [6, 70], body: [0, 16], final: [0, 90], hand: [[-90, -20], [-20, -10]], words: ['② KEY STRIKES KEY', '③ THE RING AND THE KEYS RING ON', '④ INTO THE LOCK · THE ROOM'] },
  paper: { box: { u0: -260, u1: 260, v0: -160, v1: 110 }, contact: [40, -6], body: [-60, 40], final: [140, -60], hand: [[-220, -120], [-150, -40]], words: ['② THE SHEET BENDS · RUBS', '③ THE TABLE UNDER IT', '④ SET DOWN · THE ROOM'] },
  door: { box: { u0: -420, u1: 420, v0: -560, v1: 260 }, contact: [0, 0], body: [0, -300], final: [0, 120], hand: [[-260, -40], [-60, 0]], words: ['② THE LATCH RELEASES', '③ THE PANEL RESONATES', '④ INTO THE FRAME · THE ROOM'] },
  chair: { box: { u0: -640, u1: 260, v0: -980, v1: 90 }, contact: [0, -6], body: [-220, -470], final: [-420, -6], hand: [[-560, -960], [-440, -900]], words: ['② THE LEG SCRAPES', '③ THE FRAME RATTLES', '④ SET DOWN · THE ROOM'] },
};
const spotOf = (v: VariantId) => SPOTS[v === 'live' ? 'keys' : v] ?? SPOTS.keys;

function TheProp({ variant, step }: { variant: VariantId; step: number }) {
  const v = variant === 'live' ? 'keys' : variant;
  if (v === 'keys') return <KeyRing view="side" swing={step >= 2 && step < 4 ? 0.5 : 0} />;
  if (v === 'paper')
    return (
      <Group>
        <TableArt view="side" x0={-260} x1={260} z0={-200} z1={200} topY={0} floorY={200} />
        <PaperSheet view="side" lift={step <= 1 ? 0.15 : step < 4 ? 0.45 : 0} />
      </Group>
    );
  if (v === 'door') return <FoleyDoor view="side" floorY={1000} />;
  return <Chair view="side" lift={step >= 2 && step < 4 ? 0 : step === 1 ? 40 : 0} />;
}

export function PropStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const s = spotOf(variant);
  const b = s.box;
  const sc = (b.u1 - b.u0) / 840;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE HAND MOVES IT', short: '① HAND', u: b.u0 + 6 * sc, v: b.v0 + 14 * sc, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: s.words[0], short: '② CONTACT', u: b.u1 - 6 * sc, v: b.v0 + 14 * sc, align: 'right', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: s.words[1], short: '③ BODY', u: b.u1 - 6 * sc, v: b.v0 + 46 * sc, align: 'right', tone: 'amber' });
  if (shown >= 4) labels.push({ id: 's4', text: s.words[2], short: '④ ROOM', u: b.u0 + 6 * sc, v: b.v1 - 14 * sc, align: 'left', tone: 'blue' });
  return (
    <SoundCanvas w={w} h={h} box={b} label={accessibilityLabel} labels={labels}>
      <TheProp variant={variant} step={shown} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Arrow a={s.hand[0]} b={s.hand[1]} width={5 * sc} head={16 * sc} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Burst c={s.contact} r0={14 * sc} r1={40 * sc} n={8} phase={-1.3} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Radiate c={s.body} radii={[50 * sc, 80 * sc]} a0={-160} a1={-20} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Burst c={s.final} r0={12 * sc} r1={32 * sc} n={7} phase={0.4} />
        <Radiate c={s.body} radii={[200 * sc, 260 * sc]} a0={-180} a1={0} color={AIR} />
      </Group>
    </SoundCanvas>
  );
}

const PAIR_BOX = { u0: -900, u1: 500, v0: -150, v1: 1000 };

/** Step 2: `together` = THE CLICK (the latch); `opposed` = THE BODY (the panel). SWING closes the door. */
export function PropClickBody({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const click = mode === 'together';
  const open = Math.max(0, Math.min(1, (1 - swing) / 2));
  const shut = open < 0.04;
  const labels: StaticLabel[] = [
    { id: 'door', text: shut ? 'THE DOOR CLOSES INTO THE FRAME' : 'THE DOOR SWINGS', short: 'THE DOOR', u: -890, v: -120, align: 'left', tone: 'amber' },
    { id: 'where', text: click ? 'THE LATCH · A SMALL CLICK' : 'THE PANEL · A LARGE RESONANCE', short: click ? 'LATCH' : 'PANEL', u: 490, v: 980, align: 'right', tone: 'blue' },
    { id: 'ex', text: 'FROM ABOVE · MOTION DRAWN LARGER', short: 'FROM ABOVE', u: -890, v: 980, align: 'left', tone: 'illustrative' },
  ];
  const mid = { x: -Math.sin(open * Math.PI / 2) * DOOR.W * 0.5, z: DOOR.W - Math.cos(open * Math.PI / 2) * DOOR.W * 0.5 };
  return (
    <SoundCanvas w={w} h={h} box={PAIR_BOX} label={accessibilityLabel} labels={labels}>
      <FoleyDoor view="top" floorY={1000} open={open} marks={false} />
      {click ? (shut ? <Burst c={[0, 20]} r0={24} r1={70} n={9} phase={-1.2} /> : null) : <Radiate c={[mid.x, mid.z]} radii={shut ? [120, 200, 280] : [80, 140]} a0={-90} a1={90} />}
      {!shut ? <Arrow a={[mid.x - 160, mid.z - 60]} b={[mid.x - 40, mid.z - 140]} width={5} head={16} dashed /> : null}
    </SoundCanvas>
  );
}

export const CHAIR_SIZE = CHAIR;
