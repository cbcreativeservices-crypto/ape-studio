/** Plan cases: the plucked-string plans (C01, C03, C05A, C05B, C05C, C07 — guitars/StagePlan). */
import { lessonById } from '../../../data/lessons.ts';
import { C01_BUILT } from '../../c01Guitar/geometry.ts';
import { C03_BUILT } from '../../c03Resonator/geometry.ts';
import { C05A_BUILT } from '../../c05aBanjo/geometry.ts';
import { C05B_BUILT } from '../../c05bMandolin/geometry.ts';
import { C05C_BUILT } from '../../c05cUkulele/geometry.ts';
import { C07_BUILT } from '../../c07AcousticBass/geometry.ts';
import type { BuiltGuitarModel } from '../guitars/guitarModel.ts';
import { GUITAR_PLANS, GUITAR_ROOM, guitarCue, guitarPlanCables, guitarPlanFoots, stringsPlan } from '../guitars/stagePlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { markAt, type PlanCase } from './types.ts';

const BUILT: Record<keyof typeof GUITAR_PLANS, BuiltGuitarModel> = { C01: C01_BUILT, C03: C03_BUILT, C05A: C05A_BUILT, C05B: C05B_BUILT, C05C: C05C_BUILT, C07: C07_BUILT };

export function guitarsCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, opts] of Object.entries(GUITAR_PLANS) as [keyof typeof GUITAR_PLANS, (typeof GUITAR_PLANS)[keyof typeof GUITAR_PLANS]][]) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const built = BUILT[id];
    for (const [variant, sc] of Object.entries(built.scenes)) {
      const objects = stringsPlan(sc, opts);
      const performers = [{ id: 'player', group: 'player' }];
      // the dashed audience edge and the AUDIENCE words beyond it (StagePlan)
      const aud = objects.find((o) => o.kind === 'audience')!;
      const audience = { axis: 'v' as const, dir: 1 as const, lip: aud.at.z - 260, kind: 'direction' as const, marks: [markAt(aud.at.x, aud.at.z, 300, 90)] };
      out.push({ lesson: id, scene: 'stage', family: 'guitars', variant, audience, foots: guitarPlanFoots(sc, built.model.parts, objects, 'stage', lesson.live.wedges), cables: guitarPlanCables(sc, objects, 'stage'), cue: [], performers });
      const cue = guitarCue(sc);
      out.push({ lesson: id, scene: 'studio', family: 'guitars', variant, room: GUITAR_ROOM, foots: guitarPlanFoots(sc, built.model.parts, objects, 'studio', lesson.live.wedges), cables: [...guitarPlanCables(sc, objects, 'studio'), ...cueCables(cue)], cue: [cue], performers });
    }
  }
  return out;
}
