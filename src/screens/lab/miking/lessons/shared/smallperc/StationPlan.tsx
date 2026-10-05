/**
 * THE SETTING for the SMALL-PERCUSSION family (LESSON_JOURNEY §6 stage 3,
 * §8): the percussion station from above — the lesson's own art (the player
 * and the instrument, top view) at the station, the neighbours as illustrated
 * real objects (a drum kit, an amp, other percussion, a vocal mic, floor
 * monitors, the audience and PA, or a studio room). It REUSES the hand-drum
 * family's plan drawing (shared/handdrums/HandPlan) — one plan, never a copy —
 * through the SettingPlan contract PSetting uses.
 */
import type { ReactElement } from 'react';
import type { LessonArt, SettingPlanProps } from '../../../engine/scene/sceneTypes.ts';
import type { VariantId, ViewBox } from '../../../engine/model/types.ts';
import { HandPlan } from '../handdrums/HandPlan';
import type { PlanThing } from './family.ts';

export function stationPlanFor(things: readonly PlanThing[], box: ViewBox, Instrument: LessonArt['Instrument']): (p: SettingPlanProps) => ReactElement {
  const Drums = Instrument as unknown as (p: { view: 'top'; variant: VariantId }) => ReactElement;
  return function StationPlan({ w, h, scene, variant, items, highlight, onTap, accessibilityLabel }: SettingPlanProps) {
    const shortOf = (id: string) => items.find((i) => i.id === id)?.short ?? id.toUpperCase();
    // On the station view ('kit') only the always-there neighbours; STAGE and
    // STUDIO add their own.
    const shown = things.filter((t) => (scene === 'kit' ? t.scene === 'all' : t.scene === 'all' || t.scene === scene));
    return <HandPlan w={w} h={h} scene={scene} variant={variant} Drums={Drums} things={shown} box={box} shortOf={shortOf} highlight={highlight} onTap={onTap} accessibilityLabel={accessibilityLabel} />;
  };
}
