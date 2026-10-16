/** Plan cases: the bowed plans (C09a violin, C09b viola, C09c cello, C06a /
 *  C06b double bass — BowedSettingPage's BowedPlan). The setting page draws
 *  the lesson's own posture in every variant, so one case per scene. */
import { lessonById } from '../../../data/lessons.ts';
import { bowedCue, bowedFoots, bowedPerformers, bowedRoom, type BowedPlanLayout } from '../bowed/bowedPlanModel.ts';
import { bassPlan } from '../bowed/bassPlan.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { C09A_PLAN } from '../../c09aViolin/plan.ts';
import { C09B_PLAN } from '../../c09bViola/plan.ts';
import { C09C_PLAN } from '../../c09cCello/plan.ts';
import type { PlanCase } from './types.ts';

const PLANS: Record<string, BowedPlanLayout> = { C09a: C09A_PLAN, C09b: C09B_PLAN, C09c: C09C_PLAN, C06a: bassPlan('pluck'), C06b: bassPlan('bow') };

export function bowedCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, L] of Object.entries(PLANS)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const performers = bowedPerformers(L).map((p) => ({ id: p.id, group: p.group }));
    out.push({ lesson: id, scene: 'stage', family: 'bowed', foots: bowedFoots(L, 'stage', lesson.live.wedges), cables: [], cue: [], performers });
    const cue = bowedCue(L);
    out.push({ lesson: id, scene: 'studio', family: 'bowed', room: bowedRoom(L), foots: bowedFoots(L, 'studio', lesson.live.wedges), cables: cueCables(cue), cue: [cue], performers });
  }
  return out;
}
