/**
 * Lesson CONTENT by id (the host resolves the lesson here). Separate from
 * registry.ts so the catalog never loads lesson data. A lesson that fails
 * validateLesson is never served (the model tests pin each lesson valid).
 */
import type { Lesson } from '../engine/model/types.ts';
import { M01_LESSON } from '../lessons/m01Kick/lesson.ts';
import { M02_LESSON } from '../lessons/m02Snare/lesson.ts';
import { M03_LESSON } from '../lessons/m03Toms/lesson.ts';
import { C01_LESSON } from '../lessons/c01Guitar/lesson.ts';
import { C03_LESSON } from '../lessons/c03Resonator/lesson.ts';
import { C07_LESSON } from '../lessons/c07AcousticBass/lesson.ts';
import { C13_LESSON } from '../lessons/c13Oud/lesson.ts';
import { C14_LESSON } from '../lessons/c14Sitar/lesson.ts';
import { C15_LESSON } from '../lessons/c15Veena/lesson.ts';

const LESSON_CONTENT: Record<string, Lesson> = { M01: M01_LESSON, M02: M02_LESSON, M03: M03_LESSON };
// Lab 4, the guitar family (each lesson on its own line: lessons are built in parallel).
LESSON_CONTENT.C01 = C01_LESSON;
LESSON_CONTENT.C03 = C03_LESSON;
LESSON_CONTENT.C07 = C07_LESSON;
// Lab 4, the lute family (oud, sitar, veena).
LESSON_CONTENT.C13 = C13_LESSON;
LESSON_CONTENT.C14 = C14_LESSON;
LESSON_CONTENT.C15 = C15_LESSON;

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}
