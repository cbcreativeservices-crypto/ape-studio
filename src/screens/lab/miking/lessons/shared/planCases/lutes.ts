/** Plan cases: the lute plans (C13 oud, C14 sitar, C15 veena — lutes/LutePlan). */
import { lessonById } from '../../../data/lessons.ts';
import { C13_BUILT } from '../../c13Oud/geometry.ts';
import { C14_BUILT } from '../../c14Sitar/geometry.ts';
import { C15_BUILT } from '../../c15Veena/geometry.ts';
import type { BuiltLute } from '../lutes/luteModel.ts';
import { LUTE_PLANS, LUTE_ROOM, luteCue, lutePerformers, lutePlanFoots, lutePlanObjects } from '../lutes/lutePlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { markAt, type PlanCase } from './types.ts';

const BUILT: Record<keyof typeof LUTE_PLANS, BuiltLute> = { C13: C13_BUILT, C14: C14_BUILT, C15: C15_BUILT };

export function lutesCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const id of Object.keys(LUTE_PLANS) as (keyof typeof LUTE_PLANS)[]) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const { scene: sc, model } = BUILT[id];
    const objects = lutePlanObjects(sc);
    const performers = lutePerformers(sc);
    const aud = objects.find((o) => o.kind === 'audience')!;
    const audience = { axis: 'v' as const, dir: 1 as const, lip: aud.at.z - 260, kind: 'direction' as const, marks: [markAt(aud.at.x, aud.at.z, 300, 90)] };
    out.push({ lesson: id, scene: 'stage', family: 'lutes', audience, foots: lutePlanFoots(sc, model.parts, objects, 'stage', lesson.live.wedges), cables: [], cue: [], performers });
    const cue = luteCue(sc, model.parts);
    out.push({ lesson: id, scene: 'studio', family: 'lutes', room: LUTE_ROOM, foots: lutePlanFoots(sc, model.parts, objects, 'studio', lesson.live.wedges), cables: cueCables(cue), cue: [cue], performers });
  }
  return out;
}
