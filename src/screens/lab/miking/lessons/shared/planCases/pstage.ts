/** Plan cases: the Lab 4 string-instrument plans (PStagePlan — C10 Harp,
 *  C11 Piano, C12 Clavinet), every variant on the stage and in the studio. */
import type { VariantId } from '../../../engine/model/types.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { HARP_AUDIENCE, HARP_ROOM, harpCue, harpPlanFoots } from '../../c10Harp/planModel.ts';
import { pianoAudience, pianoCue, pianoPlanFoots, pianoRoom } from '../../c11Piano/planModel.ts';
import { CLAV_AUDIENCE, CLAV_ROOM, clavCue, clavPlanFoots } from '../../c12Clavinet/planModel.ts';
import { markAt, turnCase, type PlanAudience, type PlanCase } from './types.ts';

/** The stage's dashed downstage edge and the AUDIENCE words beyond it (a
 *  right-aligned word ends at its anchor; a centred one straddles it). A
 *  plan laid out with its audience at +u is drawn turned (planTurn): its
 *  word runs across v there. */
function aud(a: { u: number; v: number; align: 'left' | 'center' | 'right'; lip: { axis: 'u' | 'v'; at: number } }): PlanAudience {
  if (a.lip.axis === 'u') return { axis: 'u', dir: 1, lip: a.lip.at, kind: 'direction', marks: [markAt(a.u, a.v, 90, 400)] };
  const mark = a.align === 'left' ? { u0: a.u, u1: a.u + 800, v0: a.v - 90, v1: a.v + 90 } : a.align === 'right' ? { u0: a.u - 800, u1: a.u, v0: a.v - 90, v1: a.v + 90 } : markAt(a.u, a.v, 400, 90);
  return { axis: a.lip.axis, dir: 1, lip: a.lip.at, kind: 'direction', marks: [mark] };
}

export function pstageCases(): PlanCase[] {
  const out: PlanCase[] = [];
  const fam = 'pstage';
  for (const v of ['pedal', 'lever'] as VariantId[]) {
    const performers = [{ id: 'harpist', group: 'harpist' }];
    out.push(turnCase({ lesson: 'C10', scene: 'stage', family: fam, variant: v, audience: aud(HARP_AUDIENCE), foots: harpPlanFoots(v, 'stage'), cables: [], cue: [], performers }));
    const cue = harpCue();
    out.push({ lesson: 'C10', scene: 'studio', family: fam, variant: v, room: HARP_ROOM, foots: harpPlanFoots(v, 'studio'), cables: cueCables(cue), cue: [cue], performers });
  }
  for (const v of ['grand', 'short', 'baby', 'upright', 'uprightFront'] as VariantId[]) {
    const performers = [
      { id: 'pianist', group: 'pianist' },
      { id: 'singer', group: 'singer' },
    ];
    out.push({ lesson: 'C11', scene: 'stage', family: fam, variant: v, audience: aud(pianoAudience(v)), foots: pianoPlanFoots(v, 'stage'), cables: [], cue: [], performers });
    const cue = pianoCue(v);
    out.push({ lesson: 'C11', scene: 'studio', family: fam, variant: v, room: pianoRoom(v), foots: pianoPlanFoots(v, 'studio'), cables: cueCables(cue), cue: [cue], performers });
  }
  for (const v of ['combo', 'cab'] as VariantId[]) {
    const performers = [{ id: 'keys', group: 'keys' }];
    out.push(turnCase({ lesson: 'C12', scene: 'stage', family: fam, variant: v, audience: aud(CLAV_AUDIENCE), foots: clavPlanFoots(v, 'stage'), cables: [], cue: [], performers }));
    const cue = clavCue();
    out.push({ lesson: 'C12', scene: 'studio', family: fam, variant: v, room: CLAV_ROOM, foots: clavPlanFoots(v, 'studio'), cables: cueCables(cue), cue: [cue], performers });
  }
  return out;
}
