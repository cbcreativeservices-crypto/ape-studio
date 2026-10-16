/** Plan cases: the low-brass plans (A03 horn, A04a tuba, A04b euphonium —
 *  LowBrassSettingPage), one per bell orientation the lesson draws. */
import { lessonById } from '../../../data/lessons.ts';
import { lowBrassCue, lowBrassFoots, lowBrassPerformers, lowBrassRoom, type LowBrassPlanLayout } from '../lowbrass/lowBrassPlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { A03_PLAN } from '../../a03Horn/plan.ts';
import { A04A_PLAN } from '../../a04aTuba/plan.ts';
import { A04B_PLAN } from '../../a04bEuphonium/plan.ts';
import { offPlanAudience, turnCase, type PlanCase } from './types.ts';

const PLANS: Record<string, LowBrassPlanLayout> = { A03: A03_PLAN, A04a: A04A_PLAN, A04b: A04B_PLAN };

export function lowBrassCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, L] of Object.entries(PLANS)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const wedges = lesson.live.wedges;
    for (const orient of L.spec.orients) {
      const variant = L.spec.orients.length > 1 ? orient : undefined;
      // drawn turned: the audience below (planFoot planTurn)
    out.push(turnCase({ lesson: id, scene: 'stage', family: 'lowBrass', variant, audience: offPlanAudience(L.wide), foots: lowBrassFoots(L, 'stage', orient, wedges), cables: [], cue: [], performers: lowBrassPerformers(L, 'stage') }));
      const cue = lowBrassCue(L, orient);
      out.push({ lesson: id, scene: 'studio', family: 'lowBrass', variant, room: lowBrassRoom(L), foots: lowBrassFoots(L, 'studio', orient, wedges), cables: cue.flatMap(cueCables), cue, performers: lowBrassPerformers(L, 'studio') });
    }
  }
  return out;
}
