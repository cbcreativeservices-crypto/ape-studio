/**
 * I05b CLAVES — the look (charter §2 layer 3), drawn ONLY from the states in
 * model.ts, in millimetres of the view's (u, v): side u = x, v = y; top u = x,
 * v = z.
 *
 *   SIDE  the supported clave END-ON, cradled over the left hand's curled
 *         fingers (the hollow beneath it); the striker in the right hand,
 *         held like a drumstick, its edge on the middle.
 *   TOP   the supported clave lying across the player's front on the left
 *         hand, the striker crossing it from the right.
 * The striker's arc is a pale dashed arc (WHERE it travels). Nothing moves.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { make } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { cradle, dorsalFist, placeBetween, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { Clave } from '../shared/smallperc/objects';
import { P0 } from '../shared/smallperc/geom.ts';
import { CL, CLV_DIMS, CR, stateOf, type ClvState } from './model.ts';

const CUP = cradle(CR, 115);
const BACK = dorsalFist();
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];
const D = 180 / Math.PI;

function StrikerArc({ s }: { s: ClvState }) {
  const p = useMemo(() => {
    const q = make();
    const h = s.strike.G;
    const r = Math.hypot(P0.x - h.x, P0.y - h.y);
    const a0 = Math.atan2(P0.y - h.y, P0.x - h.x) * D;
    q.addArc(Skia.XYWHRect(h.x - r, h.y - r, 2 * r, 2 * r), a0 - 30, 26);
    return q;
  }, [s]);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" color="#ffc64d" opacity={0.7}>
      <DashPathEffect intervals={[14, 9]} />
    </Path>
  );
}

export function ClavesArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const hollow = s.id === 'hollow';
  const L = s.cradle;
  const R = s.strike;
  const P = view === 'side' ? side : top;
  // The cradle's hold is the supported clave itself.
  const plCup = useMemo(() => placeBetween(CUP, P(L.W), P(s.rest), view === 'top'), [L, s.rest, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const plStrike = useMemo(() => placeBetween(BACK, P(R.W), P(R.G)), [R, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const sa = P(s.striker.a);
  const sb = P(s.striker.b);
  const sAng = Math.atan2(sb[1] - sa[1], sb[0] - sa[0]) * D;
  const striker = <Clave c={[(sa[0] + sb[0]) / 2, (sa[1] + sb[1]) / 2]} angle={sAng} len={CL} d={CLV_DIMS.d.mm} hollow={hollow} />;
  if (view === 'top') {
    return (
      <Group>
        <PlayerTop />
        <Arm2D s={top(L.S)} e={top(L.E)} w={top(L.W)} />
        <Hand geo={CUP} pl={plCup} />
        <Clave c={top(s.rest)} angle={90} len={CL} d={CLV_DIMS.d.mm} hollow={hollow} />
        <Arm2D s={top(R.S)} e={top(R.E)} w={top(R.W)} />
        <Hand geo={BACK} pl={plStrike} heldBehind held={striker} />
      </Group>
    );
  }
  return (
    <Group>
      <Arm2D s={side(L.S)} e={side(L.E)} w={side(L.W)} />
      <PlayerSide />
      <Hand geo={CUP} pl={plCup} held={<Clave c={side(s.rest)} angle={0} len={CL} d={CLV_DIMS.d.mm} hollow={hollow} endOn />} />
      <StrikerArc s={s} />
      <Arm2D s={side(R.S)} e={side(R.E)} w={side(R.W)} />
      <Hand geo={BACK} pl={plStrike} heldBehind held={striker} />
    </Group>
  );
}

export function clavesLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  if (view === 'top') {
    return [
      { id: 'rest', text: 'SUPPORTED CLAVE', short: 'SUPPORTED', u: s.rest.x + 40, v: s.rest.z + CL / 2 + 30, align: 'left' },
      { id: 'striker', text: 'STRIKER', u: s.striker.b.x - 30, v: s.striker.b.z - 20, align: 'right' },
      { id: 'player', text: 'PLAYER', u: -380, v: 320, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'rest', text: 'SUPPORTED CLAVE (END-ON)', short: 'SUPPORTED', u: s.rest.x + 30, v: s.rest.y + 110, align: 'left' },
    { id: 'striker', text: 'STRIKER', u: s.striker.b.x + 20, v: s.striker.b.y - 30, align: 'left' },
    { id: 'hollow', text: 'HAND’S HOLLOW', u: s.rest.x - 40, v: s.rest.y + 110, align: 'center', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: -380, v: -880, align: 'center', tone: 'muted' },
  ];
}

export function clavesHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const rest = view === 'side' ? side(s.rest) : top(s.rest);
  if (view === 'side' ? Math.hypot(u - rest[0], v - rest[1]) <= CR + tol : Math.abs(u - rest[0]) <= CR + tol && Math.abs(v - rest[1]) <= CL / 2 + tol) return s.id === 'hollow' && view === 'top' && Math.abs(u - rest[0]) < 5 ? `clv.slot.${s.id}` : `clv.rest.${s.id}`;
  const a = view === 'side' ? side(s.striker.a) : top(s.striker.a);
  const b = view === 'side' ? side(s.striker.b) : top(s.striker.b);
  const t = Math.max(0, Math.min(1, ((u - a[0]) * (b[0] - a[0]) + (v - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)));
  if (Math.hypot(u - (a[0] + t * (b[0] - a[0])), v - (a[1] + t * (b[1] - a[1]))) <= CR + tol) return `clv.striker.${s.id}`;
  if (view === 'side' && Math.hypot(u - rest[0], v - (rest[1] + 45)) <= 35 + tol) return `clv.hollow.${s.id}`;
  return null;
}

export const CLV_ART: LessonArt = { Instrument: ClavesArt, labels: clavesLabels, hitTest: clavesHitTest };
