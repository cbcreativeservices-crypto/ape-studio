/**
 * I01c CRASH CYMBAL — the look (charter §2 layer 3), from the shared
 * families only (cymbals/CymbalArt's crashes and boom stands; the kit around
 * them: CymbalKitArt), in mm of the view's (u, v): side u = x, v = y; top
 * u = x, v = z (the kit frame).
 *
 *   SIDE: the crash on its boom stand, tilted toward the player, its swing
 *         dashed; the stick's shoulder on the edge (a glancing blow); the toms,
 *         the hats and the kick around it, dimmed; the drummer's keep-out.
 *   TOP:  the crash from above with its bell, bow and edge rings, its stand;
 *         the drums under it; the stick.
 * Nothing moves (D8).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { KIT } from '../shared/kitPlanModel.ts';
import { BoomStandSide, BoomStandTop, CymbalSide, CymbalTop } from '../shared/cymbals/CymbalArt';
import { KitAround, PlateGlow, StickTo, SwingFan, plateTransform, type KitPiece } from '../shared/cymbals/CymbalKitArt';
import { kitHitTest } from '../shared/kitScene/KitSceneArt';
import { CymbalSettingPlan } from '../shared/cymbals/CymbalSettingPlan';
import { CYMBAL_PAGES } from '../shared/cymbals/CymbalSound';
import { boomStandPoints } from '../shared/cymbals/cymbalSpec.ts';
import { CRASH_OF, STRIKE1, STRIKE2, TOM1, TOM2 } from './model.ts';

const DEG = Math.PI / 180;
const isTwo = (v: VariantId) => v === 'crash2';

export function CrashArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const two = isTwo(variant);
  const c = CRASH_OF(variant);
  const id = two ? 'crash2' : 'crash1';
  const strike = two ? STRIKE2 : STRIKE1;
  const R = c.spec.d.mm / 2;
  const around: Partial<Record<KitPiece, number>> = two
    ? { tom1: 0.45, kick: 0.5, holder: 0.55, tom2: 0.8, floor: 0.6, ride: 0.45, crash1: 0.35 }
    : { hihat: 0.6, snare: 0.6, tom1: 0.8, kick: 0.5, holder: 0.55, tom2: 0.45, crash2: 0.35 };
  if (view === 'side') {
    const own = (
      <Group>
        <PlateGlow c={c.c} tiltDeg={c.tiltDeg} R={R} rise={c.spec.rise.mm} />
        <BoomStandSide id={id} />
        <Group transform={plateTransform(c.c, c.tiltDeg)}>
          <SwingFan R={R} rise={c.spec.rise.mm} />
        </Group>
        <CymbalSide spec={c.spec} cx={c.c.x} cy={c.c.y} tiltDeg={c.tiltDeg} />
        <StickTo from={{ x: strike.x - 290, y: strike.y - 230 }} to={{ x: strike.x - 4, y: strike.y - 4 }} />
      </Group>
    );
    return <KitAround view="side" show={around} own={own} ownZ={c.c.z} />;
  }
  const below: Partial<Record<KitPiece, number>> = Object.fromEntries(Object.entries(around).filter(([k]) => !['crash1', 'crash2', 'ride'].includes(k)));
  const above: Partial<Record<KitPiece, number>> = Object.fromEntries(Object.entries(around).filter(([k]) => ['crash1', 'crash2', 'ride'].includes(k)));
  return (
    <Group>
      <KitAround view="top" show={below} />
      <BoomStandTop id={id} />
      <CymbalTop spec={c.spec} cx={c.c.x} cz={c.c.z} tiltDeg={c.tiltDeg} areas dim={0.92} />
      <StickTo from={{ x: strike.x - 250, y: strike.z + (two ? -170 : 170) }} to={{ x: strike.x - 4, y: strike.z }} />
      <KitAround view="top" show={above} />
    </Group>
  );
}

export function crashLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const two = isTwo(variant);
  const c = CRASH_OF(variant);
  const R = c.spec.d.mm / 2;
  const tom = two ? TOM2 : TOM1;
  const strike = two ? STRIKE2 : STRIKE1;
  const st = boomStandPoints(two ? 'crash2' : 'crash1');
  if (view === 'side') {
    return [
      { id: 'edge', text: 'EDGE', u: c.c.x - R - 30, v: c.c.y + 40, align: 'right' },
      { id: 'bow', text: 'BOW', u: c.c.x + R * 0.5, v: c.c.y - 90, align: 'center' },
      { id: 'bell', text: 'BELL', u: c.c.x, v: c.c.y - c.spec.rise.mm - 50, align: 'center', tone: 'muted' },
      { id: 'tom', text: two ? '12 IN TOM' : '10 IN TOM', short: 'TOM', u: tom.c.x + 40, v: tom.c.y + 150, align: 'center', tone: 'muted' },
      { id: 'stand', text: 'BOOM STAND', short: 'STAND', u: st.foot.x - 30, v: st.joint.y + 60, align: 'right', tone: 'muted' },
      { id: 'stick', text: 'STICK', u: strike.x - 250, v: strike.y - 270, align: 'center', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'crash', text: two ? '18 IN CRASH' : '16 IN CRASH', short: 'CRASH', u: c.c.x, v: c.c.z + (two ? R + 50 : -R - 40), align: 'center' },
    { id: 'tom', text: two ? '12 IN TOM (BELOW)' : '10 IN TOM (BELOW)', short: 'TOM', u: tom.c.x + 60, v: tom.c.z + (two ? -150 : 160), align: 'center', tone: 'muted' },
    two ? { id: 'kick', text: 'KICK (BELOW)', short: 'KICK', u: 380, v: 150, align: 'center', tone: 'muted' } : { id: 'hats', text: 'HI-HATS', short: 'HATS', u: KIT.cymbals.hihat.c.x, v: KIT.cymbals.hihat.c.z - 230, align: 'center', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: c.c.x - 520, v: c.c.z + (two ? -300 : 300), align: 'center', tone: 'muted' },
  ];
}

export function crashHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const c = CRASH_OF(variant);
  const R = c.spec.d.mm / 2;
  const bellR = c.spec.bellD.mm / 2;
  const area = (r: number) => (r <= bellR ? 'crash.bell' : r <= 0.85 * R ? 'crash.bow' : 'crash.edge');
  if (view === 'side') {
    const t = c.tiltDeg * DEG;
    const dx = u - c.c.x;
    const dy = v - c.c.y;
    const lx = dx * Math.cos(t) - dy * Math.sin(t);
    const ly = dx * Math.sin(t) + dy * Math.cos(t);
    if (Math.abs(lx) <= R + tol && ly >= -c.spec.rise.mm - 14 - tol && ly <= 10 + tol) return area(Math.abs(lx));
    if (ly > 10 && ly < 90 && Math.abs(lx) < 30 + tol) return 'crash.mount';
  } else {
    const ct = Math.cos(c.tiltDeg * DEG);
    const r = Math.hypot((u - c.c.x) / ct, v - c.c.z);
    if (r <= R + tol) return area(r);
  }
  const k = kitHitTest(view, u, v, tol);
  return k === (isTwo(variant) ? 'cym.crash2' : 'cym.crash1') ? 'crash.bow' : k;
}

export const CRASH_ART: LessonArt = {
  Instrument: CrashArt,
  labels: crashLabels,
  hitTest: crashHitTest,
  plan: { own: 'crash1' },
  SettingPlan: CymbalSettingPlan('crash'),
  pages: CYMBAL_PAGES,
  stepCounts: { sound: 4 },
};
