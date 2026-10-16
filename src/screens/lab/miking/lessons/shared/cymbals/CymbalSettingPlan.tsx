/**
 * THE SETTING for a cymbal lesson: the shared 5-piece kit plan (KitPlan,
 * unchanged — every Lab 1 and Lab 2 kit lesson shows THIS kit), with the
 * lesson's own cymbal ringed in amber, and — for a cymbal the shared plan
 * does not draw (the splash on its arm or on top of the crash, the China on
 * the crash's stand) — that cymbal drawn over the plan in its place, in the
 * plan's own transform. The overlay takes no taps (the plan does).
 *
 * Collision pass 2026-10-15: the overlay is drawn INSIDE the kit plan (its
 * `overlay`), and its footprint and its name join the plan's — one label
 * layout, so the overlay's name never sits on the kit or on another name.
 */
import { useMemo, type ReactElement } from 'react';
import type { SettingPlanProps } from '../../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { KitPlan } from '../KitPlan';
import { KIT_CYMBALS, type KitCymbalId } from '../kitPlanModel.ts';
import { fxFoot } from '../kitPlanLayout.ts';
import { PlanRing } from './CymbalKitArt';
import { ChinaTop, PiggybackTop, SplashArmTop } from './CymbalFxArt';
import { CHINA_INVERTED, CHINA_UPRIGHT, SPLASH_ARM, SPLASH_PIGGY } from './cymbalFx.ts';

export type CymbalPlanOwn = 'hihat' | 'ride' | 'crash' | 'splash' | 'china';

/** The kit plan's own id for a lesson and setup (a plan id that matches no
 *  kit item when the lesson's cymbal is not on the shared plan). */
function planOwn(own: CymbalPlanOwn, variant: string): string {
  if (own === 'crash') return variant === 'crash2' ? 'crash2' : 'crash1';
  if (own === 'hihat' || own === 'ride') return own;
  return 'cymbal.own';
}

function Overlay({ own, variant }: { own: CymbalPlanOwn; variant: string }): ReactElement | null {
  if (own === 'splash') return variant === 'piggy' ? <PiggybackTop splash={SPLASH_PIGGY} highlight /> : <SplashArmTop place={SPLASH_ARM} highlight />;
  if (own === 'china') return <ChinaTop place={variant === 'inverted' ? CHINA_INVERTED : CHINA_UPRIGHT} highlight />;
  const id: KitCymbalId = own === 'crash' ? (variant === 'crash2' ? 'crash2' : 'crash1') : own;
  const k = KIT_CYMBALS[id];
  return <PlanRing cx={k.c.x} cz={k.c.z} R={k.d / 2} tiltDeg={k.tiltDeg} />;
}

/** A label for a cymbal the shared plan does not name (`point`: the
 *  cymbal's centre, for a leader when the words move to free space). */
function ownLabel(own: CymbalPlanOwn, variant: string): StaticLabel | null {
  if (own === 'splash') {
    const p = variant === 'piggy' ? SPLASH_PIGGY : SPLASH_ARM;
    return { id: 'own', text: variant === 'piggy' ? 'SPLASH ON THE CRASH' : 'SPLASH', short: 'SPLASH', u: p.c.x + (variant === 'piggy' ? 60 : 0), v: p.c.z + p.spec.d.mm / 2 + 60, align: 'center', point: { u: p.c.x, v: p.c.z }, tone: 'amber' };
  }
  return null;
}

const OWN_WORDS: Readonly<Record<CymbalPlanOwn, string>> = {
  hihat: 'The hi-hats ringed in amber on the kit plan.',
  ride: 'The ride ringed in amber on the kit plan.',
  crash: 'The crash ringed in amber on the kit plan.',
  splash: 'The splash drawn in its place on the kit plan, ringed in amber.',
  china: 'The China drawn in the larger crash’s place on the kit plan, ringed in amber.',
};

export function CymbalSettingPlan(own: CymbalPlanOwn) {
  return function CymbalPlan(p: SettingPlanProps) {
    const lab = ownLabel(own, p.variant);
    const labels = useMemo(() => (lab ? [lab] : []), [lab?.id, lab?.text]); // eslint-disable-line react-hooks/exhaustive-deps
    const foots = useMemo(() => (own === 'splash' || own === 'china' ? [fxFoot(own, p.variant)] : []), [p.variant]);
    return (
      <KitPlan
        w={p.w}
        h={p.h}
        scene={p.scene}
        variant={p.variant}
        items={p.items}
        own={planOwn(own, p.variant)}
        wedges={p.wedges}
        highlight={p.highlight}
        onTap={p.onTap}
        accessibilityLabel={`${p.accessibilityLabel} ${OWN_WORDS[own]}`}
        overlay={<Overlay own={own} variant={p.variant} />}
        overlayFoots={foots}
        overlayLabels={labels}
      />
    );
  };
}
