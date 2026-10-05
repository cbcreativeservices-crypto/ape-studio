/**
 * Lesson CONTENT by id (the host resolves the lesson here). Separate from
 * registry.ts so the catalog never loads lesson data. A lesson that fails
 * validateLesson is never served (the model tests pin each lesson valid).
 */
import type { Lesson } from '../engine/model/types.ts';
import { M01_LESSON } from '../lessons/m01Kick/lesson.ts';
import { M02_LESSON } from '../lessons/m02Snare/lesson.ts';
import { M03_LESSON } from '../lessons/m03Toms/lesson.ts';
import { M09_LESSON } from '../lessons/m09Overheads/lesson.ts';
import { M10_LESSON } from '../lessons/m10Room/lesson.ts';
import { M11_LESSON } from '../lessons/m11Kit/lesson.ts';
import { M06_LESSON } from '../lessons/m06Timpani/lesson.ts';
import { M07A_LESSON } from '../lessons/m07aConcertBassDrum/lesson.ts';
import { M07B_LESSON } from '../lessons/m07bConcertSnare/lesson.ts';
import { M08_LESSON } from '../lessons/m08HeadedTambourine/lesson.ts';
import { SPK_LESSON } from '../lessons/spk/lesson.ts';
import { M12_LESSON } from '../lessons/m12Tonbak/lesson.ts';
import { M13_LESSON } from '../lessons/m13Tabla/lesson.ts';
import { C01_LESSON } from '../lessons/c01Guitar/lesson.ts';
import { C05C_LESSON } from '../lessons/c05cUkulele/lesson.ts';
import { C05B_LESSON } from '../lessons/c05bMandolin/lesson.ts';
import { C05A_LESSON } from '../lessons/c05aBanjo/lesson.ts';
import { C03_LESSON } from '../lessons/c03Resonator/lesson.ts';
import { C07_LESSON } from '../lessons/c07AcousticBass/lesson.ts';
import { C02_LESSON } from '../lessons/c02GuitarAmp/lesson.ts';
import { C08_LESSON } from '../lessons/c08BassAmp/lesson.ts';
import { C04_LESSON } from '../lessons/c04Steel/lesson.ts';
import { C09A_LESSON } from '../lessons/c09aViolin/lesson.ts';
import { C09B_LESSON } from '../lessons/c09bViola/lesson.ts';
import { C09C_LESSON } from '../lessons/c09cCello/lesson.ts';
import { C06A_LESSON } from '../lessons/c06aBassPlucked/lesson.ts';
import { C06B_LESSON } from '../lessons/c06bBassBowed/lesson.ts';
import { C13_LESSON } from '../lessons/c13Oud/lesson.ts';
import { C14_LESSON } from '../lessons/c14Sitar/lesson.ts';
import { C15_LESSON } from '../lessons/c15Veena/lesson.ts';

const LESSON_CONTENT: Record<string, Lesson> = {
  M01: M01_LESSON,
  M02: M02_LESSON,
  M03: M03_LESSON,
  M09: M09_LESSON,
  M10: M10_LESSON,
  M11: M11_LESSON,
  M06: M06_LESSON,
  M07a: M07A_LESSON,
  M07b: M07B_LESSON,
  M08: M08_LESSON,
};
// Each further lesson on its own line (lessons are built in parallel).
LESSON_CONTENT.SPK = SPK_LESSON;
LESSON_CONTENT.M12 = M12_LESSON;
LESSON_CONTENT.M13 = M13_LESSON;
// Lab 4, the guitar family.
LESSON_CONTENT.C01 = C01_LESSON;
LESSON_CONTENT.C05C = C05C_LESSON;
LESSON_CONTENT.C05B = C05B_LESSON;
LESSON_CONTENT.C05A = C05A_LESSON;
LESSON_CONTENT.C03 = C03_LESSON;
LESSON_CONTENT.C07 = C07_LESSON;
// Lab 4, the amplified chain (each lesson on its own line).
LESSON_CONTENT.C02 = C02_LESSON;
LESSON_CONTENT.C08 = C08_LESSON;
LESSON_CONTENT.C04 = C04_LESSON;
// Lab 4, the bowed strings.
LESSON_CONTENT.C09a = C09A_LESSON;
LESSON_CONTENT.C09b = C09B_LESSON;
LESSON_CONTENT.C09c = C09C_LESSON;
LESSON_CONTENT.C06a = C06A_LESSON;
LESSON_CONTENT.C06b = C06B_LESSON;
// Lab 4, the lute family (oud, sitar, veena).
LESSON_CONTENT.C13 = C13_LESSON;
LESSON_CONTENT.C14 = C14_LESSON;
LESSON_CONTENT.C15 = C15_LESSON;

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}

/* Lab 1 hand drums (M04a–c, M05): appended so other lessons merge cleanly. */
import { HAND_DRUM_CONTENT } from '../lessons/shared/handdrums/content.ts';
Object.assign(LESSON_CONTENT, HAND_DRUM_CONTENT);
