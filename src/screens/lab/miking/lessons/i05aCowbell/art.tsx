/**
 * I05a COWBELL — the look (charter §2 layer 3), drawn ONLY from the states in
 * model.ts, in millimetres of the view's (u, v): side u = x, v = y; top u = x,
 * v = z.
 *
 *   SIDE  the bell's side face: a tapered steel box, the mouth rimmed in
 *         bright steel; mounted on a stand's clamp (the mouth toward the
 *         player) or held from below in the left palm (the mouth away); the
 *         stick in the right hand, its tip on the top near the mouth.
 *   TOP   the bell's top face, the stick over it, the hands.
 * The stick's rise is drawn as a pale arc (WHERE it travels, never how fast).
 * Nothing moves (D8).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { make } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { cradle, dorsalFist, placeBetween, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { Cowbell, PercStand, Stick } from '../shared/smallperc/objects';
import { add, mul } from '../shared/smallperc/geom.ts';
import { BELL_DIMS, stateOf, type BellState } from './model.ts';

const L = BELL_DIMS.len.mm;
const BACK = dorsalFist();
const CUP = cradle(20, 70);
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];

function Bell({ s, view }: { s: BellState; view: ViewId }) {
  const closed = add(s.c, mul(s.ax, -L / 2));
  const c: Pt = view === 'side' ? side(closed) : top(closed);
  return <Cowbell c={c} angle={s.ax.x > 0 ? 0 : 180} len={L} h0={view === 'side' ? BELL_DIMS.endH.mm : BELL_DIMS.endW.mm} h1={view === 'side' ? BELL_DIMS.mouthH.mm : BELL_DIMS.mouthW.mm} />;
}

function Rise({ s }: { s: BellState }) {
  const p = useMemo(() => {
    const q = make();
    const t = s.stick.tip;
    const h = s.stick.hand;
    const r = Math.hypot(t.x - h.x, t.y - h.y);
    const a0 = Math.atan2(t.y - h.y, t.x - h.x);
    q.addArc(Skia.XYWHRect(h.x - r, h.y - r, 2 * r, 2 * r), (a0 * 180) / Math.PI - 34, 30);
    return q;
  }, [s]);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" color="#ffc64d" opacity={0.7}>
      <DashPathEffect intervals={[14, 9]} />
    </Path>
  );
}

export function CowbellArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const a = s.arm;
  const h = s.holder;
  const mounted = s.id === 'mounted';
  const plStick = useMemo(() => placeBetween(BACK, view === 'side' ? side(a.W) : top(a.W), view === 'side' ? side(a.G) : top(a.G)), [a, view]);
  const plHold = useMemo(() => (h ? placeBetween(CUP, view === 'side' ? side(h.W) : top(h.W), view === 'side' ? side(h.G) : top(h.G), view === 'top') : null), [h, view]);
  const clampAt = add(s.c, mul(s.ax, -L / 2 - 30));
  const P = view === 'side' ? side : top;
  return (
    <Group>
      {view === 'side' && h && plHold ? (
        <>
          <Arm2D s={side(h.S)} e={side(h.E)} w={side(h.W)} />
          <Hand geo={CUP} pl={plHold} />
        </>
      ) : null}
      {view === 'side' ? <PlayerSide /> : <PlayerTop />}
      {mounted ? (view === 'side' ? <PercStand x={clampAt.x} top={s.c.y} to={side(add(s.c, mul(s.ax, -L / 2)))} /> : <PercStand x={clampAt.x} top={0} to={[clampAt.x, 0]} z />) : null}
      {view === 'top' && h && plHold ? (
        <>
          <Arm2D s={top(h.S)} e={top(h.E)} w={top(h.W)} />
          <Hand geo={CUP} pl={plHold} />
        </>
      ) : null}
      <Bell s={s} view={view} />
      {view === 'side' ? <Rise s={s} /> : null}
      <Arm2D s={P(a.S)} e={P(a.E)} w={P(a.W)} />
      <Hand geo={BACK} pl={plStick} heldBehind held={<Stick a={P(s.stick.hand)} b={P(s.stick.tip)} w={13} />} />
    </Group>
  );
}

export function cowbellLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const mouth = add(s.c, mul(s.ax, L / 2));
  if (view === 'top') {
    return [
      { id: 'bell', text: 'COWBELL (TOP FACE)', short: 'BELL', u: s.c.x, v: s.c.z + BELL_DIMS.mouthW.mm / 2 + 40, align: 'left' },
      { id: 'player', text: 'PLAYER', u: -380, v: 320, align: 'center', tone: 'muted' },
    ];
  }
  const out: ArtLabel[] = [
    { id: 'bell', text: 'COWBELL', u: s.c.x + (s.ax.x > 0 ? 0 : 20), v: s.c.y + BELL_DIMS.mouthH.mm / 2 - 180, align: 'center', at: { u: s.c.x, v: s.c.y } },
    { id: 'mouth', text: 'MOUTH', u: mouth.x + (s.ax.x > 0 ? 24 : -24), v: s.c.y + 4, align: s.ax.x > 0 ? 'left' : 'right', tone: 'muted' },
    { id: 'stick', text: 'STICK', u: (s.stick.hand.x + s.stick.tip.x) / 2, v: (s.stick.hand.y + s.stick.tip.y) / 2 - 40, align: 'left', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: -380, v: -800, align: 'center', tone: 'muted' },
  ];
  if (s.id === 'mounted') out.push({ id: 'mount', text: 'CLAMP · STAND', u: s.c.x + L / 2 + 50, v: s.c.y + 160, align: 'left', tone: 'illustrative' });
  return out;
}

export function cowbellHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const cv = view === 'side' ? s.c.y : s.c.z;
  const half = (view === 'side' ? BELL_DIMS.mouthH.mm : BELL_DIMS.mouthW.mm) / 2;
  if (Math.abs(u - s.c.x) <= L / 2 + tol && Math.abs(v - cv) <= half + tol) {
    const mouthEnd = s.c.x + s.ax.x * (L / 2);
    return Math.abs(u - mouthEnd) < 20 ? `bell.mouth.${s.id}` : `bell.body.${s.id}`;
  }
  const a = view === 'side' ? side(s.stick.hand) : top(s.stick.hand);
  const b = view === 'side' ? side(s.stick.tip) : top(s.stick.tip);
  const t = Math.max(0, Math.min(1, ((u - a[0]) * (b[0] - a[0]) + (v - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)));
  if (Math.hypot(u - (a[0] + t * (b[0] - a[0])), v - (a[1] + t * (b[1] - a[1]))) <= 10 + tol) return `bell.stick.${s.id}`;
  if (s.id === 'mounted' && view === 'side' && Math.abs(u - (s.c.x + L / 2 + 30)) <= 18 + tol && v > s.c.y) return 'bell.mount';
  return null;
}

export const BELL_ART: LessonArt = { Instrument: CowbellArt, labels: cowbellLabels, hitTest: cowbellHitTest };
