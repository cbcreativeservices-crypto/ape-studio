/** Plan cases: the woodwind section plans (A06 flute, A07 piccolo, A08a
 *  clarinet, A08b bass clarinet, A09a oboe, A09b bassoon — WindPlan). One
 *  case per lesson × scene × variant whose own drawing changes the plan. */
import { lessonById } from '../../../data/lessons.ts';
import { SLOTS, STAGE, STUDIO_ROOM, windCue, windFoots, windLayouts, type SlotId, type WindPlanConfig } from '../woodwinds/windPlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import type { Layout } from '../woodwinds/windPosture.ts';
import { A06_PLAN } from '../../a06Flute/plan.ts';
import { A07_PLAN } from '../../a07Piccolo/plan.ts';
import { A08A_PLAN } from '../../a08aClarinet/plan.ts';
import { A08B_PLAN } from '../../a08bBassClarinet/plan.ts';
import { A09A_PLAN } from '../../a09aOboe/plan.ts';
import { A09B_PLAN } from '../../a09bBassoon/plan.ts';
import type { PlanCase } from './types.ts';

const PLANS: Record<string, WindPlanConfig> = { A06: A06_PLAN, A07: A07_PLAN, A08a: A08A_PLAN, A08b: A08B_PLAN, A09a: A09A_PLAN, A09b: A09B_PLAN };

export function windsCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, cfg] of Object.entries(PLANS)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const seen = new Set<Layout>();
    for (const v of lesson.model.variants.map((x) => x.id)) {
      const L = cfg.layoutOf(v);
      if (seen.has(L)) continue;
      seen.add(L);
      const variant = lesson.model.variants.length > 1 ? v : undefined;
      const lay = windLayouts(cfg, v);
      const performers = [...(Object.keys(SLOTS) as SlotId[]).map((s) => ({ id: s, group: s })), { id: 'conductor', group: 'conductor' }];
      const stageFoots = windFoots(cfg.own, lay, 'stage', lesson.live.wedges);
      const audience = { axis: 'v' as const, dir: 1 as const, lip: STAGE.deckEdge, kind: 'seats' as const, marks: stageFoots.filter((f) => f.kind === 'audienceChair') };
      out.push({ lesson: id, scene: 'stage', family: 'winds', variant, audience, deck: { u0: STAGE.hall.u0, u1: STAGE.hall.u1, v0: STAGE.hall.v0, v1: STAGE.deckEdge }, foots: stageFoots, cables: [], cue: [], performers });
      const cue = windCue(lay);
      out.push({ lesson: id, scene: 'studio', family: 'winds', variant, room: STUDIO_ROOM, foots: windFoots(cfg.own, lay, 'studio', lesson.live.wedges), cables: cue.flatMap(cueCables), cue, performers });
    }
  }
  return out;
}
