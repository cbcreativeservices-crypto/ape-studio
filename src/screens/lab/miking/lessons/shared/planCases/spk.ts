/** Plan cases: the speaker module's stage / studio plan (SPK — speakers/StagePlan.tsx). */
import { lessonById } from '../../../data/lessons.ts';
import { DECK_EDGE_U, DI_CABLE, PLAN_BOX, SPK_ROOM, spkCue, spkFoots } from '../speakers/stagePlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { turnCase, type PlanCase } from './types.ts';

export function spkCases(): PlanCase[] {
  const lesson = lessonById('SPK');
  if (!lesson) return [];
  const performers = [
    { id: 'guitarist', group: 'player:guitarist' },
    // the organ's bench (no figure drawn): the organist's seat
    { id: 'organist', group: 'organ' },
  ];
  const cue = spkCue();
  const stageFoots = spkFoots('stage', lesson.live.wedges);
  const audience = { axis: 'u' as const, dir: 1 as const, lip: DECK_EDGE_U, kind: 'seats' as const, marks: stageFoots.filter((f) => f.kind === 'audienceChair') };
  return [
    turnCase({ lesson: 'SPK', scene: 'stage', family: 'spk', audience, deck: { u0: PLAN_BOX.stage.u0, u1: DECK_EDGE_U, v0: PLAN_BOX.stage.v0, v1: PLAN_BOX.stage.v1 }, foots: stageFoots, cables: [DI_CABLE], cue: [], performers }),
    { lesson: 'SPK', scene: 'studio', family: 'spk', room: SPK_ROOM, foots: spkFoots('studio', lesson.live.wedges), cables: [DI_CABLE, ...cueCables(cue)], cue: [cue], performers },
  ];
}
