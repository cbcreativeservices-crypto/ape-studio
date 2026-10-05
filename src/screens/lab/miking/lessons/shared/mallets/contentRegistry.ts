/**
 * MALLET-BAR FAMILY — lesson CONTENT by id (node-safe: data only, no
 * drawings). Appended to data/lessons.ts's table.
 */
import type { Lesson } from '../../../engine/model/types.ts';
import { I07_LESSON } from '../../i07Vibraphone/lesson.ts';
import { I08_LESSON } from '../../i08Marimba/lesson.ts';
import { I09_LESSON } from '../../i09Xylophone/lesson.ts';
import { I10_LESSON } from '../../i10Glockenspiel/lesson.ts';

export const MALLET_CONTENT: Record<string, Lesson> = {
  I07: I07_LESSON,
  I08: I08_LESSON,
  I09: I09_LESSON,
  I10: I10_LESSON,
};
