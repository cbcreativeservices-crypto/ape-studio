/**
 * SMALL-PERCUSSION FAMILY (Lab 2) — lesson CONTENT by id (node-safe: data
 * only, no drawings). Appended to data/lessons.ts's table.
 */
import type { Lesson } from '../../../engine/model/types.ts';
import { I03A_LESSON } from '../../i03aShaker/lesson.ts';
import { I03B_LESSON } from '../../i03bEgg/lesson.ts';
import { I03C_LESSON } from '../../i03cMaracas/lesson.ts';

export const SMALL_PERC_CONTENT: Record<string, Lesson> = {
  I03a: I03A_LESSON,
  I03b: I03B_LESSON,
  I03c: I03C_LESSON,
};
