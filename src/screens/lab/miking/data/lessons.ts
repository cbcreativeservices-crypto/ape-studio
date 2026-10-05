/**
 * Lesson CONTENT by id (the host resolves the lesson here). Separate from
 * registry.ts so the catalog never loads lesson data. A lesson that fails
 * validateLesson is never served (the model test pins M01 valid).
 */
import type { Lesson } from '../engine/model/types.ts';
import { M01_LESSON } from '../lessons/m01Kick/lesson.ts';
import { SPK_LESSON } from '../lessons/spk/lesson.ts';
import { M12_LESSON } from '../lessons/m12Tonbak/lesson.ts';
import { M13_LESSON } from '../lessons/m13Tabla/lesson.ts';
import { C02_LESSON } from '../lessons/c02GuitarAmp/lesson.ts';
import { C08_LESSON } from '../lessons/c08BassAmp/lesson.ts';
import { C04_LESSON } from '../lessons/c04Steel/lesson.ts';

const LESSON_CONTENT: Record<string, Lesson> = { M01: M01_LESSON };
// Each further lesson on its own line (lessons are built in parallel).
LESSON_CONTENT.SPK = SPK_LESSON;
LESSON_CONTENT.M12 = M12_LESSON;
LESSON_CONTENT.M13 = M13_LESSON;
// Lab 4, the amplified chain (each lesson on its own line).
LESSON_CONTENT.C02 = C02_LESSON;
LESSON_CONTENT.C08 = C08_LESSON;
LESSON_CONTENT.C04 = C04_LESSON;

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}
