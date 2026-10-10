/**
 * I01e CHINA CYMBAL — the look (charter §2 layer 3), from the shared
 * families (the China in CymbalFxArt; the stand and the kit around it:
 * CymbalArt, CymbalKitArt), in mm of the view's (u, v): side u = x, v = y;
 * top u = x, v = z (the kit frame).
 *
 *   SIDE: the China on the 18 in crash's boom stand, upright (cup up, lip up)
 *         or turned over (cup down, the valley a raised ring), its swing
 *         dashed; the stick on the shoulder (upright) or near the edge
 *         (turned over); the 12 in tom below and the ride beside, dimmed.
 *   TOP:  the China from above — the lathed shoulder, the dark valley ring,
 *         the lighter lip, the flat cup; its stand; the drums below.
 * Nothing moves (D8).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { KIT } from '../shared/kitPlanModel.ts';
import { BoomStandSide, BoomStandTop } from '../shared/cymbals/CymbalArt';
import { KitAround, PlateGlow, StickTo, stickFigureAt, kitShow, type KitPiece } from '../shared/cymbals/CymbalKitArt';
import { ChinaSide, ChinaTop } from '../shared/cymbals/CymbalFxArt';
import { kitHitTest } from '../shared/kitScene/KitSceneArt';
import { CymbalSettingPlan } from '../shared/cymbals/CymbalSettingPlan';
import { CYMBAL_PAGES } from '../shared/cymbals/CymbalSound';
import { boomStandPoints } from '../shared/cymbals/cymbalSpec.ts';
import { AREAS, CHINA_OF, R, STRIKE_INV, STRIKE_UP } from './model.ts';

const DEG = Math.PI / 180;
const isInv = (v: VariantId) => v === 'inverted';
const NEAR: Partial<Record<KitPiece, number>> = { tom1: 0.4, kick: 0.5, holder: 0.5, tom2: 0.8, floor: 0.55, ride: 0.5 };
const AROUND_TOP = kitShow(['crash2'], NEAR);

/** The stick as drawn, per view (also the labels' occupancy). */
function stickSeg(view: ViewId, variant: VariantId) {
  const s = isInv(variant) ? STRIKE_INV : STRIKE_UP;
  return view === 'side'
    ? { from: { x: s.x - 280, y: s.y - 230 }, to: { x: s.x - 4, y: s.y - 4 } }
    : { from: { x: s.x - 250, y: s.z - 170 }, to: { x: s.x - 4, y: s.z } };
}

export function ChinaArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const p = CHINA_OF(variant);
  const s = isInv(variant) ? STRIKE_INV : STRIKE_UP;
  if (view === 'side') {
    const own = (
      <Group>
        <PlateGlow c={p.c} tiltDeg={p.tiltDeg} R={R} rise={20} />
        <BoomStandSide id="crash2" />
        <ChinaSide place={p} swing />
        <StickTo {...stickSeg('side', variant)} />
      </Group>
    );
    return <KitAround view="side" show={NEAR} own={own} ownZ={p.c.z} />;
  }
  return (
    <Group>
      <KitAround view="top" show={AROUND_TOP} />
      <BoomStandTop id="crash2" />
      <ChinaTop place={p} />
      <StickTo {...stickSeg('top', variant)} />
    </Group>
  );
}

export function chinaLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const p = CHINA_OF(variant);
  const inv = isInv(variant);
  const s = inv ? STRIKE_INV : STRIKE_UP;
  const st = boomStandPoints('crash2');
  const tom = KIT.drums.tom2;
  if (view === 'side') {
    return [
      { id: 'cup', text: inv ? 'CUP (DOWN)' : 'CUP', short: 'CUP', u: p.c.x + 10, v: p.c.y + (inv ? 80 : -80), align: 'center' },
      { id: 'valley', text: inv ? 'RAISED RING' : 'VALLEY', short: inv ? 'RING' : 'VALLEY', u: p.c.x + AREAS.lip[0] * 0.95, v: p.c.y + (inv ? -70 : 60), align: 'center' },
      { id: 'lip', text: 'LIP', u: p.c.x + R + 40, v: p.c.y - 40, align: 'left' },
      { id: 'tom', text: '12 IN TOM', short: 'TOM', u: tom.c.x + 30, v: tom.c.y + 140, align: 'center', tone: 'muted' },
      { id: 'stand', text: 'BOOM STAND', short: 'STAND', u: st.foot.x + 40, v: st.joint.y + 100, align: 'left', tone: 'muted' },
      { id: 'stick', text: 'STICK', u: s.x - 240, v: s.y - 260, align: 'center', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'china', text: '18 IN CHINA', short: 'CHINA', u: p.c.x, v: p.c.z + R + 50, align: 'center' },
    { id: 'valley', text: inv ? 'RAISED RING' : 'VALLEY', short: inv ? 'RING' : 'VALLEY', u: p.c.x + 40, v: p.c.z - AREAS.lip[0] + 34, align: 'center', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: p.c.x - 280, v: p.c.z - 300, align: 'center', tone: 'muted', point: { u: -6000, v: p.c.z - 300 } },
  ];
}

export function chinaHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const p = CHINA_OF(variant);
  const area = (r: number) => (r <= AREAS.cup[1] ? 'china.cup' : r <= AREAS.shoulder[1] ? 'china.shoulder' : 'china.lip');
  if (view === 'side') {
    const t = p.tiltDeg * DEG;
    const dx = u - p.c.x;
    const dy = v - p.c.y;
    const lx = dx * Math.cos(t) - dy * Math.sin(t);
    const ly = dx * Math.sin(t) + dy * Math.cos(t);
    if (Math.abs(lx) <= R + tol && Math.abs(ly) <= 40 + tol) return area(Math.abs(lx));
  } else {
    const ct = Math.cos(p.tiltDeg * DEG);
    const r = Math.hypot((u - p.c.x) / ct, v - p.c.z);
    if (r <= R + tol) return area(r);
  }
  const k = kitHitTest(view, u, v, tol);
  return k === 'cym.crash2' ? (isInv(variant) ? 'china.plateI' : 'china.plate') : k;
}

export const CHINA_ART: LessonArt = {
  Instrument: ChinaArt,
  labels: chinaLabels,
  hitTest: chinaHitTest,
  figureAt: stickFigureAt(stickSeg),
  plan: { own: 'cymbal.own' },
  SettingPlan: CymbalSettingPlan('china'),
  pages: CYMBAL_PAGES,
  stepCounts: { sound: 4 },
};
