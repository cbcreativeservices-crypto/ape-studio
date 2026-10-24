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
import { cupUnder, h3, stickGripNear, type Cylinder, type HandSkeleton } from '../shared/hand/anatomy/anatomy.ts';
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
 * THE HANDS (grips pass 2026-10-24, owner: "holding the clave sticks … wrong").
 * Real technique (Wikipedia: Claves; Kopf Percussion): the receiving clave is
 * held LIGHTLY by the thumb and fingertips, palm up, so the hollow of the hand
 * is a resonating chamber; the other clave is held near one end like a
 * drumstick and strikes the middle of the first.
 *   CRADLE   the LEFT hand cupped palm up UNDER the supported clave (≈ 22 mm
 *            of air between palm and clave), the fingertips touching its far
 *            side, the thumb its near side — never gripped in a fist;
 *   STRIKER  the RIGHT hand's stick grip near the striker's end: the thumb's
 *            pad on top against the index finger's side (the fulcrum), the
 *            other fingers loosely round it, the striking end out past the
 *            thumb — turned to meet the model's wrist.
 */
type ClvHands = { cradle: HandSkeleton; strike: HandSkeleton; restCyl: Cylinder; strikeCyl: Cylinder };
const handsCache = new Map<ClvState, ClvHands>();
export function clavesHands(s: ClvState): ClvHands {
  const hit = handsCache.get(s);
  if (hit) return hit;
  const cradle = cupUnder(s.rest, v3(0, 0, 1), CR, v3(1, 0, 0), 1, { gap: 22 });
  const strikeCyl: Cylinder = { c: s.strike.G, axis: h3.sub(s.striker.b, s.striker.a), r: CR };
  const strike = stickGripNear(s.strike.G, s.striker.b, 1, s.strike.W, v3(-0.2, -1, 0.3), CR, 0.3);
  const h = { cradle, strike, restCyl: { c: s.rest, axis: v3(0, 0, 1), r: CR }, strikeCyl };
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
      <HeldHand
        view="side"
        S={L.S}
        E={L.E}
        sk={H.cradle}
        cyl={H.restCyl}
        halfLength={CL / 2}
        armElsewhere
        held={<Clave c={side(s.rest)} angle={0} len={CL} d={CLV_DIMS.d.mm} hollow={hollow} endOn />}
      />
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
  if (view === 'side' ? Math.hypot(u - rest[0], v - rest[1]) <= CR + tol : Math.abs(u - rest[0]) <= CR + tol && Math.abs(v - rest[1]) <= CL / 2 + tol)
    return s.id === 'hollow' && view === 'top' && Math.abs(u - rest[0]) < 5 ? `clv.slot.${s.id}` : `clv.rest.${s.id}`;
  const a = view === 'side' ? side(s.striker.a) : top(s.striker.a);
  const b = view === 'side' ? side(s.striker.b) : top(s.striker.b);
  const t = Math.max(0, Math.min(1, ((u - a[0]) * (b[0] - a[0]) + (v - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)));
  if (Math.hypot(u - (a[0] + t * (b[0] - a[0])), v - (a[1] + t * (b[1] - a[1]))) <= CR + tol) return `clv.striker.${s.id}`;
  if (view === 'side' && Math.hypot(u - rest[0], v - (rest[1] + 45)) <= 35 + tol) return `clv.hollow.${s.id}`;
  return null;
}

export const CLV_ART: LessonArt = { Instrument: ClavesArt, labels: clavesLabels, hitTest: clavesHitTest };
