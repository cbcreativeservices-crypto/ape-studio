/**
 * I01a HI-HAT — the look (charter §2 layer 3), from the shared families only
 * (cymbals/CymbalArt's hi-hat, the kit around it: CymbalKitArt), in mm of the
 * view's (u, v): side u = x, v = y; top u = x, v = z (the kit frame).
 *
 *   SIDE: the pair (closed, or ½ in apart) on its clutch, pull rod, stand,
 *         tripod and pedal; the air burst at the edges (dashed); the stick at
 *         its spot; the snare in front and the crash above, dimmed; the
 *         drummer's keep-out.
 *   TOP:  the pair from above with its clutch, tripod and pedal; the snare
 *         and the crash above (translucent); the air ring; the stick.
 * Nothing moves (D8).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { KIT, KIT_DRUMS, KIT_FLOOR_Y } from '../shared/kitPlanModel.ts';
import { HiHatSide, HiHatTop } from '../shared/cymbals/CymbalArt';
import { HIHAT_HARDWARE as HH } from '../shared/cymbals/cymbalSpec.ts';
import { AirRing, KitAround, StickTo } from '../shared/cymbals/CymbalKitArt';
import { kitHitTest } from '../shared/kitScene/KitSceneArt';
import { CymbalSettingPlan } from '../shared/cymbals/CymbalSettingPlan';
import { CYMBAL_PAGES } from '../shared/cymbals/CymbalSound';
import { GAP, HAT, HAT_R, HAT_RISE, STRIKE } from './model.ts';

const C = HAT.c;
const gapOf = (v: VariantId) => (v === 'open' ? GAP.open : GAP.closed);
const SNARE = KIT_DRUMS.snare;
const CR1 = KIT.cymbals.crash1;

export function HiHatArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const open = variant === 'open';
  const gap = gapOf(variant);
  if (view === 'side') {
    const own = (
      <Group>
        <AirRing view="side" cx={C.x} cy={C.y} cz={C.z} R={HAT_R} width={HH.airWidth.mm} above={HH.airAbove.mm} below={gap + HAT_RISE * 0.5} />
        <HiHatSide open={open} />
        <StickTo from={{ x: STRIKE.x - 330, y: STRIKE.y - 230 }} to={{ x: STRIKE.x - 4, y: STRIKE.y - 6 }} />
      </Group>
    );
    return <KitAround view="side" show={{ snare: 0.62, crash1: 0.5 }} own={own} ownZ={C.z} />;
  }
  const own = (
    <Group>
      <AirRing view="top" cx={C.x} cy={C.y} cz={C.z} R={HAT_R} width={HH.airWidth.mm} above={0} below={0} />
      <HiHatTop />
      <StickTo from={{ x: STRIKE.x - 250, y: STRIKE.z + 250 }} to={{ x: STRIKE.x - 4, y: STRIKE.z + 3 }} />
    </Group>
  );
  return (
    <Group>
      <KitAround view="top" show={{ snare: 0.75 }} />
      {own}
      <KitAround view="top" show={{ crash1: 0.45 }} />
    </Group>
  );
}

export function hiHatLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const gap = gapOf(variant);
  if (view === 'side') {
    return [
      { id: 'top', text: 'TOP CYMBAL', short: 'TOP', u: C.x - HAT_R - 30, v: C.y - 40, align: 'right' },
      { id: 'bottom', text: 'BOTTOM CYMBAL', short: 'BOTTOM', u: C.x - HAT_R - 30, v: C.y + gap + 40, align: 'right' },
      { id: 'clutch', text: 'CLUTCH', u: C.x + 40, v: C.y - HAT_RISE - 70, align: 'left' },
      { id: 'air', text: 'AIR BURST', short: 'AIR', u: C.x + HAT_R + 20, v: C.y + gap + 70, align: 'left', tone: 'illustrative' },
      { id: 'snare', text: 'SNARE', u: SNARE.c.x + 60, v: SNARE.c.y + 110, align: 'center', tone: 'muted' },
      { id: 'crash', text: 'CRASH', u: CR1.c.x - 40, v: CR1.c.y - 60, align: 'center', tone: 'muted' },
      { id: 'stick', text: 'STICK', u: STRIKE.x - 250, v: STRIKE.y - 250, align: 'center', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'hats', text: 'HI-HATS', u: C.x, v: C.z - HAT_R - 50, align: 'center' },
    { id: 'snare', text: 'SNARE', u: SNARE.c.x + 40, v: SNARE.c.z + 40, align: 'center', tone: 'muted' },
    { id: 'crash', text: 'CRASH (ABOVE)', short: 'CRASH', u: CR1.c.x + 60, v: CR1.c.z - 120, align: 'center', tone: 'muted' },
    { id: 'pedal', text: 'PEDAL', u: (KIT.hihatPedal.u0 + KIT.hihatPedal.u1) / 2, v: KIT.hihatPedal.v + 90, align: 'center', tone: 'muted' },
    { id: 'air', text: 'AIR BURST', short: 'AIR', u: C.x + HAT_R + 50, v: C.z - 120, align: 'left', tone: 'illustrative' },
    { id: 'player', text: '← PLAYER', u: C.x - 300, v: C.z + 330, align: 'center', tone: 'muted' },
  ];
}

/** The part under a model point (u, v); `tol` in mm. */
export function hiHatHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const gap = gapOf(variant);
  const dx = u - C.x;
  if (view === 'side') {
    if (Math.abs(dx) <= 22 + tol && v >= C.y - HAT_RISE - HH.clutchH.mm - 30 && v <= C.y - HAT_RISE + 2) return 'hat.clutch';
    if (Math.abs(dx) <= HAT_R + tol && v >= C.y - HAT_RISE - 6 - tol && v <= C.y + gap * 0.5 + 2) return 'hat.top';
    if (Math.abs(dx) <= HAT_R + tol && v > C.y + gap * 0.5 + 2 && v <= C.y + gap + HAT_RISE + 8 + tol) return 'hat.bottom';
    if (u >= KIT.hihatPedal.u0 - tol && u <= KIT.hihatPedal.u1 + tol && v >= KIT_FLOOR_Y - 80) return 'hat.pedal';
    if (Math.abs(dx) <= 30 + tol && v > C.y + gap + HAT_RISE && v <= KIT_FLOOR_Y) return 'hat.stand';
  } else {
    const r = Math.hypot(dx, v - C.z);
    if (r <= 24 + tol) return 'hat.clutch';
    if (r <= HAT_R + tol) return 'hat.top';
    const p = KIT.hihatPedal;
    if (u >= p.u0 - tol && u <= p.u1 + tol && Math.abs(v - p.v) <= p.halfW + tol) return 'hat.pedal';
  }
  const k = kitHitTest(view, u, v, tol);
  return k === 'cym.hihat' ? 'hat.top' : k;
}

export const HIHAT_ART: LessonArt = {
  Instrument: HiHatArt,
  labels: hiHatLabels,
  hitTest: hiHatHitTest,
  plan: { own: 'hihat' },
  SettingPlan: CymbalSettingPlan('hihat'),
  pages: CYMBAL_PAGES,
  stepCounts: { sound: 4 },
};
