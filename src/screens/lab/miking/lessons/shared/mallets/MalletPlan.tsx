/**
 * MALLET-BAR FAMILY — THE SETTING's plan (LESSON_JOURNEY §6 stage 3, §8): the
 * shared band plan of the hand-drum family (shared/handdrums/HandPlan — its
 * illustrated neighbours, lit from the upper left; reused, not copied) with
 * the lesson's OWN keyboard drawn by its art from above, turned so the
 * player faces the audience at the right of the plan (the low end, the
 * player's left, toward the top). The player is part of the keyboard's art.
 * Positions are ILLUSTRATIVE (the badge says "a typical layout").
 */
import type { ReactElement } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { VariantId } from '../../../engine/model/types.ts';
import type { SettingPlanProps } from '../../../engine/scene/sceneTypes.ts';
import type { PlanThing } from '../handdrums/family.ts';
import { HandPlan } from '../handdrums/HandPlan';
import { malletInstrument } from './MalletArt';
import type { MalletFamily } from './malletModel.ts';

export type MalletPlanSpec = { box: { u0: number; u1: number; v0: number; v1: number }; things: readonly PlanThing[] };

export function malletPlanFor(fam: MalletFamily, plan: MalletPlanSpec) {
  const Instrument = malletInstrument(fam);
  // The family frame (x low end, z audience) onto the plan (u audience →
  // right, v down): (x, z) ↦ (z, −x), a quarter turn.
  function Turned({ variant }: { view: 'top'; variant: VariantId }): ReactElement {
    return (
      <Group transform={[{ rotate: -Math.PI / 2 }]}>
        <Instrument view="top" variant={variant} />
      </Group>
    );
  }
  return function MalletPlan(p: SettingPlanProps) {
    const shortOf = (id: string) => p.items.find((i) => i.id === id)?.short ?? id.toUpperCase();
    return (
      <HandPlan
        w={p.w}
        h={p.h}
        scene={p.scene}
        variant={p.variant}
        Drums={Turned}
        things={plan.things.filter((t) => p.scene !== 'kit' || t.scene === 'all')}
        box={plan.box}
        shortOf={shortOf}
        highlight={p.highlight}
        onTap={p.onTap}
        accessibilityLabel={p.accessibilityLabel}
      />
    );
  };
}
