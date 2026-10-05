/**
 * WOODWIND FAMILY — lesson CONTENT by id (node-safe: data only, no
 * drawings). Appended to data/lessons.ts's table (Lab 3, Winds).
 */
import type { Lesson } from '../../../engine/model/types.ts';
import { A06_LESSON } from '../../a06Flute/lesson.ts';
import { A07_LESSON } from '../../a07Piccolo/lesson.ts';
import { A08A_LESSON } from '../../a08aClarinet/lesson.ts';
import { A08B_LESSON } from '../../a08bBassClarinet/lesson.ts';
import { A09A_LESSON } from '../../a09aOboe/lesson.ts';
import { A09B_LESSON } from '../../a09bBassoon/lesson.ts';

export const WOODWIND_CONTENT: Record<string, Lesson> = {
  A06: A06_LESSON,
  A07: A07_LESSON,
  A08a: A08A_LESSON,
  A08b: A08B_LESSON,
  A09a: A09A_LESSON,
  A09b: A09B_LESSON,
};
