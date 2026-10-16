/** Plan cases: the hand plans (shared/hand/HandPlan — M12, M13, I06a/b/c,
 *  I12, A10, A11), every lesson × scene, and the variants that change the
 *  layout (the finger cymbals' dance, the gong's frame). */
import { lessonById } from '../../../data/lessons.ts';
import { HAND_LESSON_IDS, handCue, handFoots, handRoom, PLAYER_GROUP, type HandLessonId } from '../hand/handPlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import type { PlanCase } from './types.ts';

/** The variants whose plan differs (the rest draw one layout). */
const LAYOUT_VARIANTS: Partial<Record<HandLessonId, readonly string[]>> = {
  I06b: ['orchestral', 'dance'],
  I12: ['tamtam', 'bossed'],
};

export function handCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const id of HAND_LESSON_IDS) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const variants = LAYOUT_VARIANTS[id] ?? [lesson.model.defaultVariant];
    for (const variant of variants) {
      const v = LAYOUT_VARIANTS[id] ? variant : undefined;
      const performers = [{ id: 'player', group: PLAYER_GROUP }];
      out.push({ lesson: id, scene: 'stage', family: 'hand', variant: v, foots: handFoots(id, 'stage', variant, lesson.live.wedges), cables: [], cue: [], performers });
      const cue = handCue(id, variant);
      out.push({ lesson: id, scene: 'studio', family: 'hand', variant: v, room: handRoom(id, variant), foots: handFoots(id, 'studio', variant, lesson.live.wedges), cables: cueCables(cue), cue: [cue], performers });
    }
  }
  return out;
}
