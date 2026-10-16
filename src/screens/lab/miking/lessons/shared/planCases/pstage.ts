/** Plan cases: the Lab 4 string-instrument plans (PStagePlan — C10 Harp,
 *  C11 Piano, C12 Clavinet), every variant on the stage and in the studio. */
import type { VariantId } from '../../../engine/model/types.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { HARP_ROOM, harpCue, harpPlanFoots } from '../../c10Harp/planModel.ts';
import { pianoCue, pianoPlanFoots, pianoRoom } from '../../c11Piano/planModel.ts';
import { CLAV_ROOM, clavCue, clavPlanFoots } from '../../c12Clavinet/planModel.ts';
import type { PlanCase } from './types.ts';

export function pstageCases(): PlanCase[] {
  const out: PlanCase[] = [];
  const fam = 'pstage';
  for (const v of ['pedal', 'lever'] as VariantId[]) {
    const performers = [{ id: 'harpist', group: 'harpist' }];
    out.push({ lesson: 'C10', scene: 'stage', family: fam, variant: v, foots: harpPlanFoots(v, 'stage'), cables: [], cue: [], performers });
    const cue = harpCue();
    out.push({ lesson: 'C10', scene: 'studio', family: fam, variant: v, room: HARP_ROOM, foots: harpPlanFoots(v, 'studio'), cables: cueCables(cue), cue: [cue], performers });
  }
  for (const v of ['grand', 'short', 'baby', 'upright', 'uprightFront'] as VariantId[]) {
    const performers = [
      { id: 'pianist', group: 'pianist' },
      { id: 'singer', group: 'singer' },
    ];
    out.push({ lesson: 'C11', scene: 'stage', family: fam, variant: v, foots: pianoPlanFoots(v, 'stage'), cables: [], cue: [], performers });
    const cue = pianoCue(v);
    out.push({ lesson: 'C11', scene: 'studio', family: fam, variant: v, room: pianoRoom(v), foots: pianoPlanFoots(v, 'studio'), cables: cueCables(cue), cue: [cue], performers });
  }
  for (const v of ['combo', 'cab'] as VariantId[]) {
    const performers = [{ id: 'keys', group: 'keys' }];
    out.push({ lesson: 'C12', scene: 'stage', family: fam, variant: v, foots: clavPlanFoots(v, 'stage'), cables: [], cue: [], performers });
    const cue = clavCue();
    out.push({ lesson: 'C12', scene: 'studio', family: fam, variant: v, room: CLAV_ROOM, foots: clavPlanFoots(v, 'studio'), cables: cueCables(cue), cue: [cue], performers });
  }
  return out;
}
