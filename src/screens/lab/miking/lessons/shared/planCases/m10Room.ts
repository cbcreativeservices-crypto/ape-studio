/** Plan cases: M10's room plan (PRoomSetting) — the room as a stage (LIVE:
 *  the PA, the monitors) and as a studio (the drummer's headphone mix). */
import { cueCables } from '../monitoring/cueMix.ts';
import { M10_AUDIENCE_MARK, M10_PLAN_ROOM, m10Cue, m10Foots } from '../../m10Room/roomPlanModel.ts';
import { turnCase, type PlanCase } from './types.ts';

export function m10RoomCases(): PlanCase[] {
  const performers = [{ id: 'drummer', group: 'kit' }];
  const cue = m10Cue();
  return [
    // LIVE: the same kit on a stage, its front open to the house (the room's
    // front face is the stage's downstage edge)
    turnCase({ lesson: 'M10', scene: 'stage', family: 'm10Room', audience: { axis: 'u', dir: 1, lip: M10_PLAN_ROOM.u1, kind: 'direction', marks: [M10_AUDIENCE_MARK] }, foots: m10Foots('live'), cables: [], cue: [], performers }),
    { lesson: 'M10', scene: 'studio', family: 'm10Room', room: M10_PLAN_ROOM, foots: m10Foots('studio'), cables: cueCables(cue), cue: [cue], performers },
  ];
}
