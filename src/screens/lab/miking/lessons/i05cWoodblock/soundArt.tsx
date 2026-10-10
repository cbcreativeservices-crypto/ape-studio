/**
 * I05c WOODBLOCK — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): the
 * block from its end, drawn large, the slot opening to the right (toward the
 * audience).
 *
 *   StrikeSequence  ① the mallet strikes the top, just off the middle toward
 *                   the opening; ② the thin wall over the slot flexes (drawn
 *                   much larger); ③ the wall and the air in the slot ring
 *                   together — the hollow knock; ④ sound leaves the block,
 *                   strongly from the opening, toward the audience.
 *   CoupledHeads    the support (copy.sound.pair): ON FOAM — space under it,
 *                   free to ring — or ON A THICK TOWEL — choked. SWING flexes
 *                   the wall.
 *
 * Simplifications register (woodblock/SOURCES.md): the wall's flex is a drawn
 * shape, not a computed mode; marks show ORDER and WHERE, never level.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { INK, make, rrect } from '../shared/concert/paths.ts';
import { BLOCK_WOOD, FOAM, RUBBER, Stick } from '../shared/smallperc/objects';
import { AMBER, Arrow, BLUE, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { WB_DIMS } from './model.ts';

export const SOUND_BOX = { u0: -110, u1: 120, v0: -100, v1: 100 };
const DP = WB_DIMS.depth.mm;
const H = WB_DIMS.h.mm;
const SY = -0.18 * H;
const ST = WB_DIMS.slotT.mm;
const SD = WB_DIMS.slotDepth.mm;

/** The block's end, the wall over the slot flexed by `bow` mm at its free
 *  edge (the mouth). The wall is a lip fixed at the slot's inner end and free
 *  at the opening, so it bends as a cantilever: deflection ∝ (distance from
 *  the root)², the rest of the block stays put. Real-object reference: a
 *  hardwood block ~190 × 65 × 70 mm, the slot ~8 mm high running ~45 mm in
 *  under a top wall ~18 mm thick; edges eased (small radii). */
function blockPath(bow: number) {
  const p = make();
  const x0 = -DP / 2;
  const x1 = DP / 2;
  const y0 = -H / 2;
  const y1 = H / 2;
  const root = x1 - SD;
  const k = 1.4; // the free edge's travel (motion drawn larger)
  const def = (x: number) => (x <= root ? 0 : bow * k * ((x - root) / SD) ** 2);
  const e = 3; // eased edges
  p.moveTo(x0 + e, y0);
  // the top surface: flat to the root, then the flexing lip
  for (let i = 0; i <= 12; i++) {
    const x = root + (SD * i) / 12;
    p.lineTo(Math.min(x, x1 - 1.5), y0 + def(x));
  }
  p.quadTo(x1, y0 + def(x1), x1, y0 + def(x1) + 1.5);
  // down the lip's face to the slot, back in under the lip to the root
  p.lineTo(x1, SY - ST / 2 + def(x1));
  for (let i = 12; i >= 0; i--) {
    const x = root + (SD * i) / 12;
    p.lineTo(x, SY - ST / 2 + def(x));
  }
  // the slot's rounded inner end (a saw-and-drill cut)
  p.quadTo(root - ST / 2, SY, root, SY + ST / 2);
  p.lineTo(x1, SY + ST / 2);
  p.lineTo(x1, y1 - e);
  p.quadTo(x1, y1, x1 - e, y1);
  p.lineTo(x0 + e, y1);
  p.quadTo(x0, y1, x0, y1 - e);
  p.lineTo(x0, y0 + e);
  p.quadTo(x0, y0, x0 + e, y0);
  p.close();
  return p;
}

/** End grain: the growth rings seen on the block's end (centre off the block, low left). */
function endGrain() {
  const p = make();
  for (const r of [40, 52, 64, 78, 92, 106]) p.addArc(Skia.XYWHRect(-DP / 2 - 30 - r, H / 2 + 26 - r, 2 * r, 2 * r), -80, 75);
  return p;
}

function Block({ bow, towel }: { bow: number; towel: boolean }) {
  const g = useMemo(() => {
    const support = make();
    if (towel) {
      support.moveTo(-DP / 2 - 26, H / 2 + 26);
      for (let x = -DP / 2 - 26; x <= DP / 2 + 26; x += 12) support.quadTo(x + 6, H / 2 + (x % 24 === 0 ? -4 : 4), x + 12, H / 2 + 2);
      support.lineTo(DP / 2 + 26, H / 2 + 30);
      support.lineTo(-DP / 2 - 26, H / 2 + 30);
      support.close();
    } else rrect(support, -DP / 2 + 6, H / 2 + 6, DP / 2 - 6, H / 2 + 26, 5);
    return { body: blockPath(bow), rest: blockPath(0), support, grain: endGrain() };
  }, [bow, towel]);
  return (
    <Group>
      <Path path={g.support}>
        <LinearGradient start={vec(0, H / 2)} end={vec(0, H / 2 + 30)} colors={towel ? ['#d9cdb8', '#b5a68b', '#8a7c63'] : FOAM} />
      </Path>
      <Path path={g.support} style="stroke" strokeWidth={1} color={INK} />
      {Math.abs(bow) > 0.4 ? <Path path={g.rest} style="stroke" strokeWidth={1} color="#8a8f9c" opacity={0.6} /> : null}
      <Path path={g.body}>
        <LinearGradient start={vec(-DP / 2, -H / 2)} end={vec(DP / 2, H / 2)} colors={BLOCK_WOOD} />
      </Path>
      <Group clip={g.body}>
        <Path path={g.grain} style="stroke" strokeWidth={0.9} color="#5e3a18" opacity={0.4} />
      </Group>
      <Path path={g.body} style="stroke" strokeWidth={1.3} color={INK} />
    </Group>
  );
}

export function WoodblockStrike({ w, h, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const bow = shown === 2 ? 7 : shown === 3 ? -5 : 0;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE MALLET STRIKES THE TOP', short: '① STRIKE', u: -104, v: -90, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② THE WALL OVER THE SLOT FLEXES', short: '② FLEX', u: -104, v: -72, align: 'left', tone: 'blue' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ WALL AND SLOT AIR RING', short: '③ RING', u: -104, v: 88, align: 'left', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: '④ OUT OF THE OPENING →', short: '④ OUT →', u: 114, v: 88, align: 'right', tone: 'blue' });
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Block bow={bow} towel={false} />
      <Group opacity={eventOpacity(shown, 1)}>
        <Stick a={[-70, -95]} b={[8, -H / 2 - 15]} w={8} head={{ r: 15, colors: RUBBER }} />
        <Burst c={[10, -H / 2 - 2]} r0={18} r1={30} n={7} phase={-1.6} />
      </Group>
      <Group opacity={eventOpacity(shown, 2)}>
        <Arrow a={[14, -H / 2 - 30]} b={[14, -H / 2 + 6]} color={BLUE} width={4} head={10} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Radiate c={[DP / 2 - SD / 2, SY]} radii={[10, 18]} a0={-180} a1={180} color={AMBER} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        <Radiate c={[DP / 2, SY]} radii={[24, 40, 56]} a0={-50} a1={50} />
        <Radiate c={[0, 0]} radii={[56, 70]} a0={-160} a1={-110} />
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = ON FOAM (free); `opposed` = ON A THICK TOWEL (choked). */
export function WoodblockSupport({ w, h, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const towel = mode === 'opposed';
  const bow = swing * (towel ? 1.6 : 7);
  const labels: StaticLabel[] = [
    { id: 's', text: towel ? 'ON A THICK TOWEL' : 'ON FOAM · SPACE UNDERNEATH', short: towel ? 'TOWEL' : 'FOAM', u: 0, v: -86, align: 'center', tone: 'amber' },
    { id: 'o', text: towel ? 'CHOKED: A DEAD TAP' : 'ABLE TO RING', short: towel ? 'CHOKED' : 'RINGS', u: 0, v: 92, align: 'center', tone: 'blue' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Block bow={bow} towel={towel} />
    </SoundCanvas>
  );
}
