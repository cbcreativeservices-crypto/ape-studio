/**
 * I05d GÜIRO — the look (charter §2 layer 3), drawn ONLY from the states in
 * model.ts, in millimetres of the view's (u, v): side u = x, v = y; top u = x,
 * v = z.
 *
 *   SIDE  the güiro END-ON (its length runs across the player), ridges up,
 *         cradled in the left hand (fingers through the holes underneath);
 *         the scraper in the right hand, its tip on the ridges.
 *   TOP   the güiro lying across the player's front, its ridged top seen from
 *         above, the scraper crossing it from the right; the scraper's whole
 *         travel — both ways, past each end — is a pale dashed line.
 * Nothing moves.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { make } from '../shared/concert/paths.ts';
import { gripCylinder, h3, type Cylinder, type HandSkeleton } from '../shared/hand/anatomy/anatomy.ts';
import { cradleHand } from '../shared/smallperc/percGrip.ts';
import { HeldHand } from '../shared/smallperc/HeldHand';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { Guiro, Stick, WOOD_HANDLE } from '../shared/smallperc/objects';
import { P0, v3 } from '../shared/smallperc/geom.ts';
import { GL, GR, GU_DIMS, RIDGE_HALF, stateOf, type GuState } from './model.ts';

type Pt = readonly [number, number];
const PLASTIC = ['#f2f4f7', '#c9ced6', '#8d939d', '#565b64'];
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];

/** The scraper's travel in the top view: along the ridges, past each end. */
function Travel() {
  const p = useMemo(() => {
    const q = make();
    const z = RIDGE_HALF + GU_DIMS.over.mm;
    const x = P0.x - GR - 18;
    q.moveTo(x, -z);
    q.lineTo(x, z);
    for (const s of [-1, 1]) {
      q.moveTo(x - 10, s * (z - 14));
      q.lineTo(x, s * z);
      q.lineTo(x + 10, s * (z - 14));
    }
    return q;
  }, []);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color="#ffc64d" opacity={0.7}>
      <DashPathEffect intervals={[14, 9]} />
    </Path>
  );
}

/**
 * THE HANDS (hands redesign 2026-10-24) — the shared Miking hand, posed in 3-D:
 *   HOLD    the LEFT hand palm up under the body's left end, the fingertips
 *           curled up round its front and the thumb on its near side;
 *   SCRAPE  the RIGHT hand holding the scraper near its end like a pencil
 *           held loosely — thumb on top, the fingers closed round it, the
 *           tip out past the thumb onto the ridges.
 */
type GuHands = { hold: HandSkeleton; scrape: HandSkeleton; bodyCyl: Cylinder; scrapeCyl: Cylinder };
const handsCache = new Map<GuState, GuHands>();
export function guiroHands(s: GuState): GuHands {
  const hit = handsCache.get(s);
  if (hit) return hit;
  const c = s.c;
  const z0 = s.hold.G.z;
  const pads = [22, 3, -16, -34].map((dz) => v3(c.x + GR * 0.72, c.y + GR * 0.66, z0 + dz));
  const thumb = v3(c.x - GR * 0.8, c.y + GR * 0.55, z0 + 30);
  const hold = cradleHand(v3(c.x - 22, c.y + GR + 30, z0 - 4), v3(1, 0, 0.12), pads, thumb);
  const scrapeCyl: Cylinder = { c: s.scrape.G, axis: h3.sub(s.scraper.a, s.scraper.b), r: 4.5, tipward: true, slide: 8 };
  const scrape = gripCylinder(scrapeCyl, { thumbSign: 1, wrist: s.scrape.W, elbow: s.scrape.E, angle: [40, 62], back: v3(-0.2, -1, 0.3), close: 0.95 }).sk;
  const h = { hold, scrape, bodyCyl: { c, axis: v3(0, 0, 1), r: GR }, scrapeCyl };
  handsCache.set(s, h);
  return h;
}

export function GuiroArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const glass = s.id === 'fiberglass';
  const L = s.hold;
  const R = s.scrape;
  const H = guiroHands(s);
  const P = view === 'side' ? side : top;
  const scraper = <Stick a={P(s.scraper.b)} b={P(s.scraper.a)} w={9} colors={glass ? PLASTIC : WOOD_HANDLE} />;
  const body = { len: GL, dMax: GU_DIMS.dMax.mm, dMin: GU_DIMS.dMin.mm, fiberglass: glass };
  if (view === 'top') {
    return (
      <Group>
        <PlayerTop />
        <HeldHand view="top" S={L.S} E={L.E} sk={H.hold} cyl={H.bodyCyl} halfLength={GL / 2} held={<Guiro c={top(s.c)} angle={90} {...body} />} />
        <Travel />
        <HeldHand view="top" S={R.S} E={R.E} sk={H.scrape} cyl={H.scrapeCyl} held={scraper} />
      </Group>
    );
  }
  return (
    <Group>
      <Arm2D s={side(L.S)} e={side(L.E)} w={side(H.hold.frame.o)} />
      <PlayerSide />
      <HeldHand view="side" S={L.S} E={L.E} sk={H.hold} cyl={H.bodyCyl} halfLength={GL / 2} armElsewhere held={<Guiro c={side(s.c)} angle={0} {...body} endOn />} />
      <HeldHand view="side" S={R.S} E={R.E} sk={H.scrape} cyl={H.scrapeCyl} held={scraper} />
    </Group>
  );
}

export function guiroLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  if (view === 'top') {
    return [
      { id: 'body', text: s.id === 'fiberglass' ? 'FIBERGLASS GÜIRO' : 'GOURD GÜIRO', short: 'GÜIRO', u: s.c.x + GR + 30, v: s.c.z - GL / 2 + 30, align: 'left' },
      { id: 'ridges', text: 'RIDGES', u: s.c.x + GR + 30, v: s.c.z + 10, align: 'left', tone: 'muted' },
      { id: 'travel', text: 'SCRAPER TRAVEL ⇅', short: 'TRAVEL', u: P0.x - GR - 40, v: -RIDGE_HALF - GU_DIMS.over.mm - 30, align: 'right', tone: 'illustrative' },
      { id: 'player', text: 'PLAYER', u: -380, v: 320, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'body', text: 'GÜIRO (END-ON)', short: 'GÜIRO', u: s.c.x + GR + 30, v: s.c.y + 20, align: 'left' },
    { id: 'ridges', text: 'RIDGES ON TOP', short: 'RIDGES', u: s.c.x + GR + 30, v: s.c.y - GR - 10, align: 'left', tone: 'muted' },
    { id: 'scraper', text: 'SCRAPER', u: (s.scraper.a.x + s.scraper.b.x) / 2 + 30, v: (s.scraper.a.y + s.scraper.b.y) / 2 - 50, align: 'left', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: -380, v: -880, align: 'center', tone: 'muted', point: { u: -6000, v: -880 } },
  ];
}

export function guiroHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const c = view === 'side' ? side(s.c) : top(s.c);
  const a = view === 'side' ? side(s.scraper.a) : top(s.scraper.a);
  const b = view === 'side' ? side(s.scraper.b) : top(s.scraper.b);
  const t = Math.max(0, Math.min(1, ((u - a[0]) * (b[0] - a[0]) + (v - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)));
  if (Math.hypot(u - (a[0] + t * (b[0] - a[0])), v - (a[1] + t * (b[1] - a[1]))) <= 8 + tol) return `gui.scraper.${s.id}`;
  if (view === 'side') {
    const d = Math.hypot(u - c[0], v - c[1]);
    if (d <= GR + tol) {
      if (v < c[1] - GR * 0.6) return `gui.ridges.${s.id}`;
      if (v > c[1] + GR * 0.6) return `gui.holes.${s.id}`;
      return `gui.body.${s.id}`;
    }
    return null;
  }
  if (Math.abs(u - c[0]) <= GR + tol && Math.abs(v - c[1]) <= GL / 2 + tol) return Math.abs(v - c[1]) <= RIDGE_HALF ? `gui.ridges.${s.id}` : `gui.body.${s.id}`;
  return null;
}

export const GU_ART: LessonArt = { Instrument: GuiroArt, labels: guiroLabels, hitTest: guiroHitTest };
