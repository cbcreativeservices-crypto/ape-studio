/** Every plan case of every Miking plan family (test/mikingPlanCollisions_20261015). */
import type { PlanCase } from './types.ts';
import { backlineCases } from './backline.ts';
import { kitPlanCases } from './kitPlan.ts';
import { handDrumsCases } from './handDrums.ts';
import { handCases } from './hand.ts';
import { guitarsCases } from './guitars.ts';
import { lutesCases } from './lutes.ts';
import { pstageCases } from './pstage.ts';
import { spkCases } from './spk.ts';
import { keysCases } from './keys.ts';
import { orchestraCases } from './orchestra.ts';
import { brassCases } from './brass.ts';
import { lowBrassCases } from './lowBrass.ts';
import { saxCases } from './sax.ts';
import { windsCases } from './winds.ts';
import { bowedCases } from './bowed.ts';
import { m10RoomCases } from './m10Room.ts';

export type { PlanCase } from './types.ts';

export const PLAN_FAMILIES: Record<string, () => PlanCase[]> = {
  backline: backlineCases,
  kitPlan: kitPlanCases,
  handDrums: handDrumsCases,
  hand: handCases,
  guitars: guitarsCases,
  lutes: lutesCases,
  pstage: pstageCases,
  spk: spkCases,
  keys: keysCases,
  orchestra: orchestraCases,
  brass: brassCases,
  lowBrass: lowBrassCases,
  sax: saxCases,
  winds: windsCases,
  bowed: bowedCases,
  m10Room: m10RoomCases,
};

export function allPlanCases(): PlanCase[] {
  return Object.values(PLAN_FAMILIES).flatMap((f) => f());
}
