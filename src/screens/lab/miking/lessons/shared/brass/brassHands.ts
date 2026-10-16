/**
 * THE BRASS FAMILY'S HANDS, for the tests (figure pass 3, owner 2026-10-15:
 * "check that the hand is correctly positioned, placed, bent, fingers and
 * digits accounted for"). Every hand the A01 and A02 figures draw — posed
 * bone by bone on the horn in brassPosture.ts — with the elbow its forearm
 * comes from, the digits that must touch what they play (0 index … 3 little,
 * 4 thumb) and where the thumb works. One skeleton serves both views (from the
 * player's right and from above): the views only project it.
 *
 *   • TRUMPET / FLUGELHORN, right: the index, middle and ring pads on the 1st,
 *     2nd and 3rd valve buttons, the little finger on the finger hook, the
 *     thumb under the leadpipe between the 1st and 2nd valves (flugelhorn:
 *     against the casings there, where its leadpipe has turned down into the
 *     valves). Left: round the valve casings under the bell tube — index,
 *     middle and ring wrapped round the front casing, the little finger
 *     curled under, the thumb at the 1st slide's saddle.
 *   • TROMBONE (tenor, bass), left: the index on the inner slide's upper tube
 *     at the receiver, the middle on the inner slide's brace, the ring and
 *     little round the lower tube by the brace, the thumb round the bell
 *     brace (bass: on the F valve trigger). Right: thumb behind the outer
 *     slide's brace, index and middle round its front, ring and little
 *     relaxed below — at 1st position, as drawn.
 *
 * Pure: no React, no Skia.
 */
import type { HandSkeleton, V3 } from '../players/handModel.ts';
import { slidePose, valvedPose, type HornPose } from './brassPosture.ts';
import { BASS_TB, FLUGELHORN, TENOR, TRUMPET } from './brassSpec.ts';

export type HandCase = { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: string };

/** Every posed hand of the brass figures (A01 trumpet + flugelhorn, A02 tenor + bass trombone). */
export function handCases(): HandCase[] {
  const out: HandCase[] = [];
  const add = (lesson: string, P: HornPose) => {
    for (const side of ['L', 'R'] as const) {
      const h = P.hands[side];
      out.push({ name: `${lesson} ${P.spec.id} ${side === 'L' ? 'left' : 'right'} hand`, sk: h.sk, elbow: h.elbow, contact: [...h.contact], thumb: h.thumb });
    }
  };
  add('A01', valvedPose(TRUMPET));
  add('A01', valvedPose(FLUGELHORN));
  add('A02', slidePose(TENOR));
  add('A02', slidePose(BASS_TB));
  return out;
}
