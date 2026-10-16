/** Plan cases: the brass plans (A01 trumpet, A02 trombone — BrassSettingPage). */
import { lessonById } from '../../../data/lessons.ts';
import { brassCue, brassFoots, brassPerformers, brassRoom, type BrassPlanLayout } from '../brass/brassPlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { A01_PLAN } from '../../a01Trumpet/plan.ts';
import { A02_PLAN } from '../../a02Trombone/plan.ts';
import { offPlanAudience, type PlanCase } from './types.ts';

const PLANS: Record<string, BrassPlanLayout> = { A01: A01_PLAN, A02: A02_PLAN };

export function brassCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, L] of Object.entries(PLANS)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const wedges = lesson.live.wedges;
    out.push({ lesson: id, scene: 'stage', family: 'brass', audience: offPlanAudience(L.wide), foots: brassFoots(L, 'stage', wedges), cables: [], cue: [], performers: brassPerformers(L, 'stage') });
    const cue = brassCue(L);
    out.push({ lesson: id, scene: 'studio', family: 'brass', room: brassRoom(L), foots: brassFoots(L, 'studio', wedges), cables: cue.flatMap(cueCables), cue, performers: brassPerformers(L, 'studio') });
  }
  return out;
}
