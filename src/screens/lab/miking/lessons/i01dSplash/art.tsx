/**
 * I01d SPLASH CYMBAL — the look (charter §2 layer 3), from the shared
 * families (cymbals/CymbalArt, the Lab 2 additions in CymbalFxArt, the kit
 * around it: CymbalKitArt), in mm of the view's (u, v): side u = x, v = y;
 * top u = x, v = z (the kit frame).
 *
 *   ON AN ARM: the 10 in splash on its Z-shaped rod, clamped to the tom
 *              holder's post, over the 10 in tom, its swing dashed; the 16 in
 *              crash above; the stick near its edge.
 *   ON THE CRASH: the 8 in splash upside down on top of the 18 in crash, the
 *              felts between, one rod and one wing nut; the 12 in tom below.
 * Nothing moves (D8).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { KIT } from '../shared/kitPlanModel.ts';
import { BoomStandSide, BoomStandTop } from '../shared/cymbals/CymbalArt';
import { KitAround, PlateGlow, StickTo, kitShow, type KitPiece } from '../shared/cymbals/CymbalKitArt';
import { PiggybackSide, PiggybackTop, SplashArmSide, SplashArmTop } from '../shared/cymbals/CymbalFxArt';
import { kitHitTest } from '../shared/kitScene/KitSceneArt';
import { CymbalSettingPlan } from '../shared/cymbals/CymbalSettingPlan';
import { CYMBAL_PAGES } from '../shared/cymbals/CymbalSound';
import { splashArmPoints } from '../shared/cymbals/cymbalFx.ts';
import { ARM, PIGGY, R10, R8, STRIKE_ARM, STRIKE_PIG } from './model.ts';

const DEG = Math.PI / 180;
const isPig = (v: VariantId) => v === 'piggy';
const C1 = KIT.cymbals.crash1;
const C2 = KIT.cymbals.crash2;

export function SplashArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  if (isPig(variant)) {
    const near: Partial<Record<KitPiece, number>> = { tom1: 0.4, kick: 0.5, holder: 0.5, tom2: 0.75, floor: 0.5, ride: 0.45 };
    const around = view === 'side' ? near : kitShow(['crash2'], near);
    if (view === 'side') {
      const own = (
        <Group>
          <PlateGlow c={PIGGY.c} tiltDeg={PIGGY.tiltDeg} R={R8} rise={PIGGY.spec.rise.mm} />
          <BoomStandSide id="crash2" />
          <PiggybackSide splash={PIGGY} swing />
          <StickTo from={{ x: STRIKE_PIG.x - 280, y: STRIKE_PIG.y - 230 }} to={{ x: STRIKE_PIG.x - 4, y: STRIKE_PIG.y - 4 }} />
        </Group>
      );
      return <KitAround view="side" show={around} own={own} ownZ={C2.c.z} />;
    }
    return (
      <Group>
        <KitAround view="top" show={around} />
        <BoomStandTop id="crash2" />
        <PiggybackTop splash={PIGGY} />
        <StickTo from={{ x: STRIKE_PIG.x - 250, y: STRIKE_PIG.z - 150 }} to={{ x: STRIKE_PIG.x - 4, y: STRIKE_PIG.z }} />
      </Group>
    );
  }
  const near: Partial<Record<KitPiece, number>> = { hihat: 0.4, snare: 0.5, tom1: 0.85, kick: 0.55, holder: 0.85, tom2: 0.55 };
  const around = view === 'side' ? near : kitShow(['crash1'], near);
  if (view === 'side') {
    const own = (
      <Group>
        <PlateGlow c={ARM.c} tiltDeg={ARM.tiltDeg} R={R10} rise={ARM.spec.rise.mm} />
        <SplashArmSide place={ARM} swing />
        <StickTo from={{ x: STRIKE_ARM.x - 280, y: STRIKE_ARM.y - 220 }} to={{ x: STRIKE_ARM.x - 4, y: STRIKE_ARM.y - 4 }} />
      </Group>
    );
    return (
      <Group>
        <KitAround view="side" show={around} own={own} ownZ={-100} />
        <KitAround view="side" show={{ crash1: 0.5 }} />
      </Group>
    );
  }
  return (
    <Group>
      <KitAround view="top" show={around} />
      <SplashArmTop place={ARM} />
      <StickTo from={{ x: STRIKE_ARM.x - 250, y: STRIKE_ARM.z + 120 }} to={{ x: STRIKE_ARM.x - 4, y: STRIKE_ARM.z }} />
      <KitAround view="top" show={{ crash1: 0.42 }} />
    </Group>
  );
}

export function splashLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (isPig(variant)) {
    if (view === 'side') {
      return [
        { id: 'splash', text: 'SPLASH, UPSIDE DOWN', short: 'SPLASH', u: PIGGY.c.x + R8 + 60, v: PIGGY.c.y - 40, align: 'left' },
        { id: 'crash', text: '18 IN CRASH', short: 'CRASH', u: C2.c.x + 60, v: C2.c.y + 90, align: 'left' },
        { id: 'tom', text: '12 IN TOM', short: 'TOM', u: KIT.drums.tom2.c.x, v: KIT.drums.tom2.c.y + 160, align: 'center', tone: 'muted' },
        { id: 'stick', text: 'STICK', u: STRIKE_PIG.x - 240, v: STRIKE_PIG.y - 260, align: 'center', tone: 'illustrative' },
      ];
    }
    return [
      { id: 'splash', text: 'SPLASH ON THE CRASH', short: 'SPLASH', u: PIGGY.c.x, v: PIGGY.c.z + C2.d / 2 + 50, align: 'center' },
      { id: 'player', text: '← PLAYER', u: PIGGY.c.x - 260, v: PIGGY.c.z - 280, align: 'center', tone: 'muted' },
    ];
  }
  const a = splashArmPoints();
  if (view === 'side') {
    return [
      { id: 'splash', text: '10 IN SPLASH', short: 'SPLASH', u: ARM.c.x - R10 - 30, v: ARM.c.y - 30, align: 'right' },
      { id: 'arm', text: 'ARM', u: (a.up.x + a.elbow.x) / 2, v: a.up.y + 34, align: 'center' },
      { id: 'clamp', text: 'CLAMP', u: a.clamp.x + 40, v: a.clamp.y + 10, align: 'left', tone: 'muted' },
      { id: 'crash', text: '16 IN CRASH', short: 'CRASH', u: C1.c.x - 120, v: C1.c.y - 70, align: 'center', tone: 'muted' },
      { id: 'tom', text: '10 IN TOM', short: 'TOM', u: KIT.drums.tom1.c.x + 30, v: KIT.drums.tom1.c.y + 130, align: 'center', tone: 'muted' },
      { id: 'stick', text: 'STICK', u: STRIKE_ARM.x - 240, v: STRIKE_ARM.y - 250, align: 'center', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'splash', text: 'SPLASH', u: ARM.c.x, v: ARM.c.z + R10 + 46, align: 'center' },
    { id: 'crash', text: 'CRASH (ABOVE)', short: 'CRASH', u: C1.c.x, v: C1.c.z - 120, align: 'center', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: ARM.c.x - 330, v: ARM.c.z + 200, align: 'center', tone: 'muted' },
  ];
}

export function splashHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const pig = isPig(variant);
  const p = pig ? PIGGY : ARM;
  const R = p.spec.d.mm / 2;
  const id = pig ? 'piggy.plate' : 'splash.plate';
  if (view === 'side') {
    const t = p.tiltDeg * DEG;
    const dx = u - p.c.x;
    const dy = v - p.c.y;
    const lx = dx * Math.cos(t) - dy * Math.sin(t);
    const ly = dx * Math.sin(t) + dy * Math.cos(t);
    if (Math.abs(lx) <= R + tol && Math.abs(ly) <= p.spec.rise.mm + 12 + tol) return id;
    if (!pig) {
      const a = splashArmPoints();
      if (Math.abs(v - a.up.y) <= 14 + tol && u >= Math.min(a.elbow.x, a.up.x) - tol && u <= Math.max(a.elbow.x, a.up.x) + tol) return 'splash.arm';
      if (Math.abs(u - a.clamp.x) <= 30 + tol && v >= a.up.y - tol && v <= a.clamp.y + 40) return 'splash.arm';
    }
  } else {
    const ct = Math.cos(p.tiltDeg * DEG);
    if (Math.hypot((u - p.c.x) / ct, v - p.c.z) <= R + tol) return id;
  }
  return kitHitTest(view, u, v, tol);
}

export const SPLASH_ART: LessonArt = {
  Instrument: SplashArt,
  labels: splashLabels,
  hitTest: splashHitTest,
  plan: { own: 'cymbal.own' },
  SettingPlan: CymbalSettingPlan('splash'),
  pages: CYMBAL_PAGES,
  stepCounts: { sound: 4 },
};
