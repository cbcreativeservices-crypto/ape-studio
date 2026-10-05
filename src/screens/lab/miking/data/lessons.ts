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

const LESSON_CONTENT: Record<string, Lesson> = { M01: M01_LESSON };
// Each further lesson on its own line (lessons are built in parallel).
LESSON_CONTENT.SPK = SPK_LESSON;
LESSON_CONTENT.M12 = M12_LESSON;
LESSON_CONTENT.M13 = M13_LESSON;

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}
