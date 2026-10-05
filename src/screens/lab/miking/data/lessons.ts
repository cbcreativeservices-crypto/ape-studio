/**
 * Lesson CONTENT by id (the host resolves the lesson here). Separate from
 * registry.ts so the catalog never loads lesson data. A lesson that fails
 * validateLesson is never served (the model test pins M01 valid).
 */
import type { Lesson } from '../engine/model/types.ts';
import { M01_LESSON } from '../lessons/m01Kick/lesson.ts';
import { M06_LESSON } from '../lessons/m06Timpani/lesson.ts';
import { M07B_LESSON } from '../lessons/m07bConcertSnare/lesson.ts';

const LESSON_CONTENT: Record<string, Lesson> = {
  M01: M01_LESSON,
  M06: M06_LESSON,
  M07b: M07B_LESSON,
};

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}
