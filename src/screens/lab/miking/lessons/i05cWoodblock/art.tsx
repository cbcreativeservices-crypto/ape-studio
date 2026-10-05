/**
 * I05c WOODBLOCK — the look (charter §2 layer 3), drawn ONLY from the states
 * in model.ts, in millimetres of the view's (u, v): side u = x, v = y; top
 * u = x, v = z.
 *
 *   SIDE  the block seen from its END (its length runs across the player):
 *         the slot is a dark notch in the face toward the audience; on a foam
 *         pad on the trap table, or in the left palm; the mallet in the right
 *         hand, its rubber head on the top just off the middle.
 *   TOP   the block's top face along the player's front, the mallet over it.
 * The mallet's stroke is a pale dashed arc (WHERE it travels). Nothing moves.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { make } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { cradle, dorsalFist, placeBetween, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { FoamPad, RUBBER, Stick, TrapTable, Woodblock } from '../shared/smallperc/objects';
import { stateOf, WB_DIMS, type WbState } from './model.ts';
import { TABLE } from './geometry.ts';

const L = WB_DIMS.len.mm;
const DP = WB_DIMS.depth.mm;
const H = WB_DIMS.h.mm;
const SLOT = { len: WB_DIMS.slotLen.mm, t: WB_DIMS.slotT.mm, depth: WB_DIMS.slotDepth.mm };
const BACK = dorsalFist();
const CUP = cradle(30, 55);
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];

function Swing({ s }: { s: WbState }) {
  const p = useMemo(() => {
    const q = make();
    const h = s.mallet.hand;
    const t = s.mallet.head;
    const r = Math.hypot(t.x - h.x, t.y - h.y);
    const a0 = (Math.atan2(t.y - h.y, t.x - h.x) * 180) / Math.PI;
    q.addArc(Skia.XYWHRect(h.x - r, h.y - r, 2 * r, 2 * r), a0 - 34, 30);
    return q;
  }, [s]);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" color="#ffc64d" opacity={0.7}>
      <DashPathEffect intervals={[14, 9]} />
    </Path>
  );
}

export function WoodblockArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const a = s.arm;
  const h = s.holder;
  const P = view === 'side' ? side : top;
  const plMallet = useMemo(() => placeBetween(BACK, P(a.W), P(a.G)), [a, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const plHold = useMemo(() => (h ? placeBetween(CUP, P(h.W), P(h.G), view === 'top') : null), [h, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const mallet = <Stick a={P(s.mallet.hand)} b={P(s.mallet.head)} w={11} head={{ r: 15, colors: RUBBER }} />;
  const onTable = s.id === 'table';
  if (view === 'top') {
    return (
      <Group>
        {onTable ? <TrapTable view="top" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} top={0} /> : null}
        <PlayerTop />
        {onTable ? <FoamPad c={top(s.c)} w={100} h={200} /> : null}
        {h && plHold ? (
          <>
            <Arm2D s={top(h.S)} e={top(h.E)} w={top(h.W)} />
            <Hand geo={CUP} pl={plHold} />
          </>
        ) : null}
        <Woodblock c={top(s.c)} w={DP} h={L} slot={SLOT} mode="top" />
        <Arm2D s={top(a.S)} e={top(a.E)} w={top(a.W)} />
        <Hand geo={BACK} pl={plMallet} heldBehind held={mallet} />
      </Group>
    );
  }
  return (
    <Group>
      {h && plHold ? <Arm2D s={side(h.S)} e={side(h.E)} w={side(h.W)} /> : null}
      <PlayerSide />
      {onTable ? (
        <>
          <TrapTable view="side" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} top={-WB_DIMS.tableH.mm} />
          <FoamPad c={[s.c.x, s.c.y + H / 2 + WB_DIMS.foamT.mm / 2]} w={100} h={WB_DIMS.foamT.mm} />
        </>
      ) : null}
      {h && plHold ? <Hand geo={CUP} pl={plHold} /> : null}
      <Woodblock c={side(s.c)} w={DP} h={H} slot={SLOT} mode="end" />
      <Swing s={s} />
      <Arm2D s={side(a.S)} e={side(a.E)} w={side(a.W)} />
      <Hand geo={BACK} pl={plMallet} heldBehind held={mallet} />
    </Group>
  );
}

export function woodblockLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  if (view === 'top') {
    return [
      { id: 'block', text: 'WOODBLOCK', u: s.c.x + DP / 2 + 30, v: s.c.z + L / 2 - 20, align: 'left' },
      { id: 'opening', text: 'OPENING → AUDIENCE', short: 'OPENING →', u: s.c.x + DP / 2 + 30, v: s.c.z - 20, align: 'left', tone: 'muted' },
      { id: 'player', text: 'PLAYER', u: -380, v: 320, align: 'center', tone: 'muted' },
    ];
  }
  const out: ArtLabel[] = [
    { id: 'slot', text: 'SLOT (OPENING)', short: 'SLOT', u: s.slot.x + 40, v: s.slot.y, align: 'left' },
    { id: 'mallet', text: 'MALLET', u: (s.mallet.hand.x + s.mallet.head.x) / 2, v: (s.mallet.hand.y + s.mallet.head.y) / 2 - 40, align: 'left', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: -380, v: -800, align: 'center', tone: 'muted' },
  ];
  if (s.id === 'table') out.push({ id: 'foam', text: 'FOAM PAD', u: s.c.x + 70, v: s.c.y + H / 2 - 10, align: 'left', tone: 'illustrative' });
  return out;
}

export function woodblockHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const cv = view === 'side' ? s.c.y : s.c.z;
  const hv = view === 'side' ? H / 2 : L / 2;
  if (Math.abs(u - s.c.x) <= DP / 2 + tol && Math.abs(v - cv) <= hv + tol) return view === 'side' && u > s.c.x + DP / 2 - SLOT.depth && Math.abs(v - s.slot.y) < 10 ? `wb.slot.${s.id}` : `wb.block.${s.id}`;
  const a = view === 'side' ? side(s.mallet.hand) : top(s.mallet.hand);
  const b = view === 'side' ? side(s.mallet.head) : top(s.mallet.head);
  const t = Math.max(0, Math.min(1, ((u - a[0]) * (b[0] - a[0]) + (v - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)));
  if (Math.hypot(u - (a[0] + t * (b[0] - a[0])), v - (a[1] + t * (b[1] - a[1]))) <= 16 + tol) return `wb.mallet.${s.id}`;
  if (s.id === 'table') {
    if (view === 'side' && Math.abs(u - s.c.x) <= 50 + tol && v > s.c.y + H / 2 && v < s.c.y + H / 2 + WB_DIMS.foamT.mm + tol) return 'wb.foam';
    if (view === 'side' && u >= TABLE.x0 && u <= TABLE.x1 && Math.abs(v + WB_DIMS.tableH.mm - 12) < 20 + tol) return 'wb.table';
  }
  return null;
}

export const WB_ART: LessonArt = { Instrument: WoodblockArt, labels: woodblockLabels, hitTest: woodblockHitTest };
