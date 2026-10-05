/**
 * I01b RIDE CYMBAL — the look (charter §2 layer 3), from the shared families
 * only (cymbals/CymbalArt's ride and boom stand; the kit around it:
 * CymbalKitArt), in mm of the view's (u, v): side u = x, v = y; top u = x,
 * v = z (the kit frame).
 *
 *   SIDE: the 20 in ride on its boom stand, tilted toward the player, its
 *         swing fan dashed; the stick's tip on the bow; the floor tom below
 *         and the 18 in crash beside, dimmed; the drummer's keep-out.
 *   TOP:  the ride from above with its bell, bow and edge rings, its stand;
 *         the floor tom under it, the crash beside (translucent); the stick.
 * Nothing moves (D8).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { KIT } from '../shared/kitPlanModel.ts';
import { BoomStandSide, BoomStandTop, CymbalSide, CymbalTop } from '../shared/cymbals/CymbalArt';
import { KitAround, PlateGlow, StickTo, SwingFan, kitShow, plateTransform } from '../shared/cymbals/CymbalKitArt';
import { kitHitTest } from '../shared/kitScene/KitSceneArt';
import { CymbalSettingPlan } from '../shared/cymbals/CymbalSettingPlan';
import { CYMBAL_PAGES } from '../shared/cymbals/CymbalSound';
import { boomStandPoints } from '../shared/cymbals/cymbalSpec.ts';
import { AREAS, FLOOR, RIDE, RIDE_R, RIDE_RISE, STRIKE_BOW } from './model.ts';

const C = RIDE.c;
const CR2 = KIT.cymbals.crash2;
const DEG = Math.PI / 180;

export function RideArt({ view }: { view: ViewId; variant: VariantId }) {
  if (view === 'side') {
    const own = (
      <Group>
        <PlateGlow c={C} tiltDeg={RIDE.tiltDeg} R={RIDE_R} rise={RIDE_RISE} />
        <BoomStandSide id="ride" />
        <Group transform={plateTransform(C, RIDE.tiltDeg)}>
          <SwingFan R={RIDE_R} rise={RIDE_RISE} />
        </Group>
        <CymbalSide spec={RIDE.spec} cx={C.x} cy={C.y} tiltDeg={RIDE.tiltDeg} />
        <StickTo from={{ x: STRIKE_BOW.x - 300, y: STRIKE_BOW.y - 250 }} to={{ x: STRIKE_BOW.x - 4, y: STRIKE_BOW.y - 6 }} />
      </Group>
    );
    return <KitAround view="side" show={{ floor: 0.8, crash2: 0.5, tom2: 0.35, kick: 0.3 }} own={own} ownZ={C.z} />;
  }
  return (
    <Group>
      <KitAround view="top" show={kitShow(['ride', 'crash1', 'crash2', 'hihat'], { floor: 0.85 })} />
      <BoomStandTop id="ride" />
      <CymbalTop spec={RIDE.spec} cx={C.x} cz={C.z} tiltDeg={RIDE.tiltDeg} areas dim={0.92} />
      <StickTo from={{ x: STRIKE_BOW.x - 260, y: STRIKE_BOW.z - 200 }} to={{ x: STRIKE_BOW.x - 4, y: STRIKE_BOW.z - 3 }} />
      <KitAround view="top" show={{ hihat: 0.3, crash1: 0.3, crash2: 0.42 }} />
    </Group>
  );
}

export function rideLabels(view: ViewId): ArtLabel[] {
  const st = boomStandPoints('ride');
  if (view === 'side') {
    return [
      { id: 'bell', text: 'BELL', u: C.x - 10, v: C.y - RIDE_RISE - 50, align: 'center' },
      { id: 'bow', text: 'BOW', u: C.x + AREAS.bow[1] * 0.6, v: C.y - 70, align: 'center' },
      { id: 'edge', text: 'EDGE', u: C.x + RIDE_R + 40, v: C.y - 70, align: 'left' },
      { id: 'floor', text: 'FLOOR TOM', short: 'FLOOR', u: FLOOR.c.x + 20, v: FLOOR.c.y + 110, align: 'center', tone: 'muted' },
      { id: 'crash', text: 'CRASH', u: CR2.c.x + 60, v: CR2.c.y - 70, align: 'center', tone: 'muted' },
      { id: 'stand', text: 'BOOM STAND', short: 'STAND', u: st.foot.x + 40, v: st.joint.y + 120, align: 'left', tone: 'muted' },
      { id: 'stick', text: 'STICK', u: STRIKE_BOW.x - 260, v: STRIKE_BOW.y - 290, align: 'center', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'ride', text: 'RIDE', u: C.x, v: C.z + RIDE_R + 50, align: 'center' },
    { id: 'bell', text: 'BELL', u: C.x, v: C.z - 70, align: 'center', tone: 'muted' },
    { id: 'floor', text: 'FLOOR TOM (BELOW)', short: 'FLOOR', u: FLOOR.c.x - 120, v: FLOOR.c.z - 30, align: 'center', tone: 'muted' },
    { id: 'crash', text: 'CRASH (ABOVE)', short: 'CRASH', u: CR2.c.x + 40, v: CR2.c.z - 150, align: 'center', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: C.x - 520, v: C.z - 280, align: 'center', tone: 'muted' },
  ];
}

/** The part under a model point (u, v); `tol` in mm. */
export function rideHitTest(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): string | null {
  const area = (r: number) => (r <= AREAS.bell[1] ? 'ride.bell' : r <= AREAS.edge[0] ? 'ride.bow' : 'ride.edge');
  if (view === 'side') {
    const t = RIDE.tiltDeg * DEG;
    const dx = u - C.x;
    const dy = v - C.y;
    const lx = dx * Math.cos(t) - dy * Math.sin(t);
    const ly = dx * Math.sin(t) + dy * Math.cos(t);
    if (Math.abs(lx) <= RIDE_R + tol && ly >= -RIDE_RISE - 14 - tol && ly <= 10 + tol) return area(Math.abs(lx));
    if (ly > 10 && ly < 90 && Math.abs(lx) < 30 + tol) return 'ride.mount';
  } else {
    const ct = Math.cos(RIDE.tiltDeg * DEG);
    const r = Math.hypot((u - C.x) / ct, v - C.z);
    if (r <= RIDE_R + tol) return area(r);
  }
  const k = kitHitTest(view, u, v, tol);
  return k === 'cym.ride' ? 'ride.bow' : k;
}

export const RIDE_ART: LessonArt = {
  Instrument: RideArt,
  labels: (view) => rideLabels(view),
  hitTest: rideHitTest,
  plan: { own: 'ride' },
  SettingPlan: CymbalSettingPlan('ride'),
  pages: CYMBAL_PAGES,
  stepCounts: { sound: 4 },
};
