/**
 * I03b EGG SHAKER — the look (charter §2 layer 3), drawn ONLY from the states
 * in model.ts (each egg's centre and its arm), in millimetres of the view's
 * (u, v): side u = x, v = y; top u = x, v = z.
 *
 *   SIDE  the player from the right; each egg in a loose fist seen from the
 *         side, the far (left) hand behind the near one.
 *   TOP   from above: the shoulders and head, the arms, the backs of the
 *         hands over the eggs (a little of each shell shows past the hand).
 * The wrist shake is drawn as a pale double arrow (WHERE it moves, never how
 * far). Nothing moves (D8).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { arrow, make } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { dorsalFist, placeBetween, profileFist, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { EggShell } from '../shared/smallperc/objects';
import { EGG_DIMS, stateOf, type Egg } from './model.ts';

const R = EGG_DIMS.d.mm / 2;
const LEN = EGG_DIMS.len.mm;
const FIST = profileFist(R - 2);
const BACK = dorsalFist();
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];

function Shake({ c, view }: { c: Pt; view: ViewId }) {
  const p = useMemo(() => {
    const q = make();
    const y = c[1] + (view === 'side' ? -85 : -70);
    arrow(q, c[0], y, c[0] - EGG_DIMS.sweep.mm, y, 16);
    arrow(q, c[0], y, c[0] + EGG_DIMS.sweep.mm, y, 16);
    return q;
  }, [c, view]);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color="#ffc64d" opacity={0.7}>
      <DashPathEffect intervals={[14, 9]} />
    </Path>
  );
}

function EggHandSide({ e }: { e: Egg }) {
  const a = e.arm;
  const pl = useMemo(() => placeBetween(FIST, side(a.W), side(a.G)), [a]);
  return (
    <Group>
      <Arm2D s={side(a.S)} e={side(a.E)} w={side(a.W)} />
      <Hand geo={FIST} pl={pl} farThumb={e.side === 'L'} held={<EggShell c={side(e.c)} angle={0} len={LEN} d={EGG_DIMS.d.mm} />} />
    </Group>
  );
}

function EggHandTop({ e }: { e: Egg }) {
  const a = e.arm;
  const pl = useMemo(() => placeBetween(BACK, top(a.W), top(a.G), e.side === 'L'), [a, e.side]);
  return (
    <Group>
      <Arm2D s={top(a.S)} e={top(a.E)} w={top(a.W)} />
      <Hand geo={BACK} pl={pl} heldBehind held={<EggShell c={[e.c.x + 18, e.c.z]} angle={0} len={LEN} d={EGG_DIMS.d.mm} />} />
    </Group>
  );
}

export function EggArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const right = s.eggs.find((e) => e.side === 'R')!;
  const left = s.eggs.find((e) => e.side === 'L');
  if (view === 'top') {
    return (
      <Group>
        <PlayerTop />
        {s.eggs.map((e) => (
          <Shake key={e.side} c={top(e.c)} view="top" />
        ))}
        {s.eggs.map((e) => (
          <EggHandTop key={e.side} e={e} />
        ))}
      </Group>
    );
  }
  return (
    <Group>
      {left ? <EggHandSide e={left} /> : null}
      <PlayerSide />
      <Shake c={side(right.c)} view="side" />
      <EggHandSide e={right} />
    </Group>
  );
}

export function eggLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const r = s.eggs[0];
  if (view === 'top') {
    const out: ArtLabel[] = s.eggs.map((e) => ({ id: `egg${e.side}`, text: s.eggs.length > 1 ? (e.side === 'R' ? 'RIGHT EGG' : 'LEFT EGG') : 'EGG', u: e.c.x + 95, v: e.c.z + (e.side === 'R' ? 40 : -40), align: 'left' as const }));
    out.push({ id: 'shake', text: '↔ THE SHAKE', short: '↔', u: r.c.x, v: r.c.z - 95, align: 'center', tone: 'illustrative' });
    out.push({ id: 'player', text: 'PLAYER', u: -380, v: 330, align: 'center', tone: 'muted' });
    return out;
  }
  return [
    { id: 'egg', text: s.eggs.length > 1 ? 'EGGS (ONE IN EACH HAND)' : 'EGG SHAKER', short: 'EGG', u: r.c.x + 50, v: r.c.y + 70, align: 'left' },
    { id: 'shake', text: '↔ THE SHAKE', short: '↔', u: r.c.x, v: r.c.y - 115, align: 'center', tone: 'illustrative' },
    { id: 'player', text: '← PLAYER', u: -380, v: -900, align: 'center', tone: 'muted' },
  ];
}

export function eggHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  for (let i = 0; i < s.eggs.length; i++) {
    const e = s.eggs[i];
    const cu = e.c.x;
    const cv = view === 'side' ? e.c.y : e.c.z;
    const k = ((u - cu) / (LEN / 2 + tol)) ** 2 + ((v - cv) / (R + tol)) ** 2;
    if (k <= 1) return Math.hypot(u - cu, v - cv) < R * 0.45 ? `egg.fill.${s.id}` : `egg.shell${i}.${s.id}`;
    // The hand round it (behind the egg toward the wrist).
    if (Math.hypot(u - (cu - 40), v - cv) < 60 + tol) return `egg.grip.${s.id}`;
  }
  return null;
}

export const EGG_ART: LessonArt = { Instrument: EggArt, labels: eggLabels, hitTest: eggHitTest };
