/**
 * Lesson CONTENT by id (the host resolves the lesson here). Separate from
 * registry.ts so the catalog never loads lesson data. A lesson that fails
 * validateLesson is never served (the model test pins M01 valid).
 */
import type { Lesson } from '../engine/model/types.ts';
import { M01_LESSON } from '../lessons/m01Kick/lesson.ts';
import { M09_LESSON } from '../lessons/m09Overheads/lesson.ts';
import { M10_LESSON } from '../lessons/m10Room/lesson.ts';
import { M11_LESSON } from '../lessons/m11Kit/lesson.ts';

const LESSON_CONTENT: Record<string, Lesson> = {
  M01: M01_LESSON,
  M09: M09_LESSON,
  M10: M10_LESSON,
  M11: M11_LESSON,
};

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}
