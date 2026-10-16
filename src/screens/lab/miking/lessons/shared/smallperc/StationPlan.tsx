/**
 * THE SETTING for the SMALL-PERCUSSION family (LESSON_JOURNEY §6 stage 3,
 * §8): the percussion station from above — the lesson's own art (the player
 * and the instrument, top view) at the station, the neighbours as illustrated
 * real objects (a drum kit, an amp, other percussion, a vocal mic, floor
 * monitors, the audience and PA, or a studio room). It REUSES the hand-drum
 * family's plan drawing (shared/handdrums/HandPlan) — one plan, never a copy —
 * through the SettingPlan contract PSetting uses.
 */
import { useMemo, type ReactElement } from 'react';
import type { LessonArt, SettingPlanProps } from '../../../engine/scene/sceneTypes.ts';
import type { InstrumentModel, VariantId } from '../../../engine/model/types.ts';
import { HandPlan } from '../handdrums/HandPlan';
import { modelArtPlan } from '../handdrums/handPlanModel.ts';
import type { SpExtra } from './family.ts';

/** `model`: the lesson's model — the art (player and instrument) draws from
 *  it, so its footprint on the plan does too (handPlanModel modelArtPlan). */
export function stationPlanFor(plan: SpExtra['plan'], model: InstrumentModel, Instrument: LessonArt['Instrument']): (p: SettingPlanProps) => ReactElement {
  const Drums = Instrument as unknown as (p: { view: 'top'; variant: VariantId }) => ReactElement;
  return function StationPlan({ w, h, scene, variant, items, highlight, onTap, accessibilityLabel }: SettingPlanProps) {
    const shortOf = (id: string) => items.find((i) => i.id === id)?.short ?? id.toUpperCase();
    const art = useMemo(() => modelArtPlan(model, variant, true), [variant]);
    // On the station view ('kit') only the always-there neighbours; STAGE and
    // STUDIO add their own (HandPlan shows each scene's).
    return <HandPlan w={w} h={h} scene={scene} variant={variant} Drums={Drums} things={plan.things} box={plan.box} art={art} cue={plan.cue} shortOf={shortOf} highlight={highlight} onTap={onTap} accessibilityLabel={accessibilityLabel} />;
  };
}
