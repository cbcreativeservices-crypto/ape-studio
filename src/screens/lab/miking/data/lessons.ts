/**
 * Lesson CONTENT by id (the host resolves the lesson here). Separate from
 * registry.ts so the catalog never loads lesson data. A lesson that fails
 * validateLesson is never served (the model tests pin each lesson valid).
 */
import type { Lesson } from '../engine/model/types.ts';
import { M01_LESSON } from '../lessons/m01Kick/lesson.ts';
import { M02_LESSON } from '../lessons/m02Snare/lesson.ts';
import { M03_LESSON } from '../lessons/m03Toms/lesson.ts';

const LESSON_CONTENT: Record<string, Lesson> = { M01: M01_LESSON, M02: M02_LESSON, M03: M03_LESSON };

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}
