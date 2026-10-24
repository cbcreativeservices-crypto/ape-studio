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
import { gripCylinder, h3, type Cylinder, type HandSkeleton } from '../shared/hand/anatomy/anatomy.ts';
import { cradleHand } from '../shared/smallperc/percGrip.ts';
import { HeldHand } from '../shared/smallperc/HeldHand';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { Clave } from '../shared/smallperc/objects';
import { P0, v3 } from '../shared/smallperc/geom.ts';
import { CL, CLV_DIMS, CR, stateOf, type ClvState } from './model.ts';

type Pt = readonly [number, number];
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

/**
 * THE HANDS (hands redesign 2026-10-24) — the shared Miking hand, posed in 3-D:
 *   CRADLE   the LEFT hand palm up under the supported clave, the fingertips
 *            curled up its far side and the thumb's pad on its near side, so
 *            it rests on the pads over the hollow of the cupped palm (the
 *            resonating chamber) — never on the palm itself;
 *   STRIKER  the RIGHT hand round the striker near its end, thumb on top,
 *            the fingers closed round it, the tip out past the thumb.
 */
type ClvHands = { cradle: HandSkeleton; strike: HandSkeleton; restCyl: Cylinder; strikeCyl: Cylinder };
const handsCache = new Map<ClvState, ClvHands>();
export function clavesHands(s: ClvState): ClvHands {
  const hit = handsCache.get(s);
  if (hit) return hit;
  const r = s.rest;
  // The pads round the clave's front-lower side, ≈ 19 mm apart along it (the
  // index nearest the thumb, toward the player's middle); the thumb's pad on
  // its near (player) side.
  const pads = [22, 3, -16, -34].map((dz) => v3(r.x + CR * 0.72, r.y + CR * 0.62, r.z + dz));
  const thumb = v3(r.x - CR - 4, r.y + 4, r.z + 30);
  const cradle = cradleHand(v3(r.x - 18, r.y + 34, r.z - 6), v3(1, 0, 0.12), pads, thumb);
  const strikeCyl: Cylinder = { c: s.strike.G, axis: h3.sub(s.striker.b, s.striker.a), r: CR, tipward: true, slide: 8 };
  const strike = gripCylinder(strikeCyl, { thumbSign: 1, wrist: s.strike.W, elbow: s.strike.E, angle: [45, 70], back: v3(-0.2, -1, 0.3), close: 0.9 }).sk;
  const h = { cradle, strike, restCyl: { c: r, axis: v3(0, 0, 1), r: CR }, strikeCyl };
  handsCache.set(s, h);
  return h;
}

export function ClavesArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const hollow = s.id === 'hollow';
  const L = s.cradle;
  const R = s.strike;
  const H = clavesHands(s);
  const P = view === 'side' ? side : top;
  const sa = P(s.striker.a);
  const sb = P(s.striker.b);
  const sAng = Math.atan2(sb[1] - sa[1], sb[0] - sa[0]) * D;
  const striker = <Clave c={[(sa[0] + sb[0]) / 2, (sa[1] + sb[1]) / 2]} angle={sAng} len={CL} d={CLV_DIMS.d.mm} hollow={hollow} />;
  if (view === 'top') {
    return (
      <Group>
        <PlayerTop />
        <HeldHand view="top" S={L.S} E={L.E} sk={H.cradle} cyl={H.restCyl} halfLength={CL / 2} held={<Clave c={top(s.rest)} angle={90} len={CL} d={CLV_DIMS.d.mm} hollow={hollow} />} />
        <HeldHand view="top" S={R.S} E={R.E} sk={H.strike} cyl={H.strikeCyl} held={striker} />
      </Group>
    );
  }
  return (
    <Group>
      <Arm2D s={side(L.S)} e={side(L.E)} w={side(H.cradle.frame.o)} />
      <PlayerSide />
      <HeldHand view="side" S={L.S} E={L.E} sk={H.cradle} cyl={H.restCyl} halfLength={CL / 2} armElsewhere held={<Clave c={side(s.rest)} angle={0} len={CL} d={CLV_DIMS.d.mm} hollow={hollow} endOn />} />
      <StrikerArc s={s} />
      <HeldHand view="side" S={R.S} E={R.E} sk={H.strike} cyl={H.strikeCyl} held={striker} />
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
    { id: 'player', text: '← PLAYER', u: -380, v: -880, align: 'center', tone: 'muted', point: { u: -6000, v: -880 } },
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
