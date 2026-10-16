/** Plan cases: the saxophone plans (A05a–A05d — SaxSettingPage; the page
 *  draws the standing player). */
import { lessonById } from '../../../data/lessons.ts';
import { saxCue, saxFoots, saxPerformers, saxRoom, type SaxPlanLayout } from '../sax/saxPlanModel.ts';
import type { SaxPosture } from '../sax/saxPosture.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { A05A_PLAN } from '../../a05aSopranoSax/plan.ts';
import { A05B_PLAN } from '../../a05bAltoSax/plan.ts';
import { A05C_PLAN } from '../../a05cTenorSax/plan.ts';
import { A05D_PLAN } from '../../a05dBaritoneSax/plan.ts';
import { SOPRANO_SAX } from '../../a05aSopranoSax/geometry.ts';
import { ALTO_SAX } from '../../a05bAltoSax/geometry.ts';
import { TENOR_SAX } from '../../a05cTenorSax/geometry.ts';
import { BARITONE_SAX } from '../../a05dBaritoneSax/geometry.ts';
import { offPlanAudience, type PlanCase } from './types.ts';

const PLANS: Record<string, [SaxPlanLayout, SaxPosture]> = {
  A05a: [A05A_PLAN, SOPRANO_SAX.STANDING],
  A05b: [A05B_PLAN, ALTO_SAX.STANDING],
  A05c: [A05C_PLAN, TENOR_SAX.STANDING],
  A05d: [A05D_PLAN, BARITONE_SAX.STANDING],
};

export function saxCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, [L, P]] of Object.entries(PLANS)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const wedges = lesson.live.wedges;
    out.push({ lesson: id, scene: 'stage', family: 'sax', audience: offPlanAudience(L.wide), foots: saxFoots(L, P, 'stage', wedges), cables: [], cue: [], performers: saxPerformers(L, 'stage') });
    const cue = saxCue(L, P);
    out.push({ lesson: id, scene: 'studio', family: 'sax', room: saxRoom(L), foots: saxFoots(L, P, 'studio', wedges), cables: cue.flatMap(cueCables), cue, performers: saxPerformers(L, 'studio') });
  }
  return out;
}
