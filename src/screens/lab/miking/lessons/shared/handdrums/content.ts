/**
 * HAND-DRUM FAMILY — lesson CONTENT by id (node-safe: data only, no drawings).
 * Appended to data/lessons.ts's table.
 */
import type { Lesson } from '../../../engine/model/types.ts';
import { M04A_LESSON } from '../../m04aCongas/lesson.ts';
import { M04B_LESSON } from '../../m04bBongos/lesson.ts';
import { M04C_LESSON } from '../../m04cTimbales/lesson.ts';
import { M05_LESSON } from '../../m05Djembe/lesson.ts';

export const HAND_DRUM_CONTENT: Record<string, Lesson> = {
  M04a: M04A_LESSON,
  M04b: M04B_LESSON,
  M04c: M04C_LESSON,
  M05: M05_LESSON,
};
