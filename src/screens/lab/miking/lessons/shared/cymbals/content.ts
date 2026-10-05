/**
 * THE CYMBAL LESSONS (Lab 2: I01a–e) — lesson CONTENT by id (node-safe:
 * data only, no drawings). Appended to data/lessons.ts's table.
 */
import type { Lesson } from '../../../engine/model/types.ts';
import { I01A_LESSON } from '../../i01aHiHat/lesson.ts';
import { I01B_LESSON } from '../../i01bRide/lesson.ts';
import { I01C_LESSON } from '../../i01cCrash/lesson.ts';
import { I01D_LESSON } from '../../i01dSplash/lesson.ts';
import { I01E_LESSON } from '../../i01eChina/lesson.ts';

export const CYMBAL_CONTENT: Record<string, Lesson> = {
  I01a: I01A_LESSON,
  I01b: I01B_LESSON,
  I01c: I01C_LESSON,
  I01d: I01D_LESSON,
  I01e: I01E_LESSON,
};
