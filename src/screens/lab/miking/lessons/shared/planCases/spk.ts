/** Plan cases: the speaker module's stage / studio plan (SPK — speakers/StagePlan.tsx). */
import { lessonById } from '../../../data/lessons.ts';
import { DI_CABLE, SPK_ROOM, spkCue, spkFoots } from '../speakers/stagePlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import type { PlanCase } from './types.ts';

export function spkCases(): PlanCase[] {
  const lesson = lessonById('SPK');
  if (!lesson) return [];
  const performers = [
    { id: 'guitarist', group: 'player:guitarist' },
    // the organ's bench (no figure drawn): the organist's seat
    { id: 'organist', group: 'organ' },
  ];
  const cue = spkCue();
  return [
    { lesson: 'SPK', scene: 'stage', family: 'spk', foots: spkFoots('stage', lesson.live.wedges), cables: [DI_CABLE], cue: [], performers },
    { lesson: 'SPK', scene: 'studio', family: 'spk', room: SPK_ROOM, foots: spkFoots('studio', lesson.live.wedges), cables: [DI_CABLE, ...cueCables(cue)], cue: [cue], performers },
  ];
}
