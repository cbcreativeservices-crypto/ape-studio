/**
 * SMALL PERCUSSION — every posed hand (figure pass 3), for the anatomy tests
 * (test/figureAnatomy): the skeleton, its elbow in the same frame (frame H)
 * and the digits that must touch what they hold (their pads within 3 mm).
 * The poses themselves are percGrip.ts; the lessons' models place them.
 */
import type { HandSkeleton, V3 } from '../players/handModel.ts';
import { STATES as BELL } from '../../i05aCowbell/model.ts';
import { STATES as BLOCK } from '../../i05cWoodblock/model.ts';

export type HandCase = { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: string };

const ALL = [0, 1, 2, 3, 4];

export function handCases(): HandCase[] {
  const out: HandCase[] = [];
  for (const s of Object.values(BELL)) {
    out.push({ name: `I05a ${s.id} stick hand`, sk: s.hands.stick, elbow: s.arm.E, contact: ALL, thumb: 'on the stick, opposite the index' });
    if (s.hands.holder && s.holder) out.push({ name: `I05a ${s.id} holding hand`, sk: s.hands.holder, elbow: s.holder.E, contact: ALL, thumb: 'on the bell’s near wall' });
  }
  for (const s of Object.values(BLOCK)) {
    out.push({ name: `I05c ${s.id} mallet hand`, sk: s.hands.stick, elbow: s.arm.E, contact: ALL, thumb: 'on the handle, opposite the index' });
    if (s.hands.holder && s.holder) out.push({ name: `I05c ${s.id} holding hand`, sk: s.hands.holder, elbow: s.holder.E, contact: ALL, thumb: 'at the foot of the front face' });
  }
  return out;
}
