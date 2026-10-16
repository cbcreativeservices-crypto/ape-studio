/** Plan cases: M10's room plan (PRoomSetting) — the room as a stage (LIVE:
 *  the PA, the monitors) and as a studio (the drummer's headphone mix). */
import { cueCables } from '../monitoring/cueMix.ts';
import { M10_PLAN_ROOM, m10Cue, m10Foots } from '../../m10Room/roomPlanModel.ts';
import type { PlanCase } from './types.ts';

export function m10RoomCases(): PlanCase[] {
  const performers = [{ id: 'drummer', group: 'kit' }];
  const cue = m10Cue();
  return [
    { lesson: 'M10', scene: 'stage', family: 'm10Room', foots: m10Foots('live'), cables: [], cue: [], performers },
    { lesson: 'M10', scene: 'studio', family: 'm10Room', room: M10_PLAN_ROOM, foots: m10Foots('studio'), cables: cueCables(cue), cue: [cue], performers },
  ];
}
