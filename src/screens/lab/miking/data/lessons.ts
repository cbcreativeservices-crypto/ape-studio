/**
 * Lesson CONTENT by id (the host resolves the lesson here). Separate from
 * registry.ts so the catalog never loads lesson data. A lesson that fails
 * validateLesson is never served (the model tests pin each lesson valid).
 */
import type { Lesson } from '../engine/model/types.ts';
import { M01_LESSON } from '../lessons/m01Kick/lesson.ts';
import { M02_LESSON } from '../lessons/m02Snare/lesson.ts';
import { M03_LESSON } from '../lessons/m03Toms/lesson.ts';
import { C09A_LESSON } from '../lessons/c09aViolin/lesson.ts';
import { C09B_LESSON } from '../lessons/c09bViola/lesson.ts';
import { C09C_LESSON } from '../lessons/c09cCello/lesson.ts';
import { C06A_LESSON } from '../lessons/c06aBassPlucked/lesson.ts';
import { C06B_LESSON } from '../lessons/c06bBassBowed/lesson.ts';

const LESSON_CONTENT: Record<string, Lesson> = { M01: M01_LESSON, M02: M02_LESSON, M03: M03_LESSON };
LESSON_CONTENT.C09a = C09A_LESSON;
LESSON_CONTENT.C09b = C09B_LESSON;
LESSON_CONTENT.C09c = C09C_LESSON;
LESSON_CONTENT.C06a = C06A_LESSON;
LESSON_CONTENT.C06b = C06B_LESSON;

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}
