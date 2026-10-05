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
import { C11_LESSON } from '../lessons/c11Piano/lesson.ts';
import { C10_LESSON } from '../lessons/c10Harp/lesson.ts';
import { C12_LESSON } from '../lessons/c12Clavinet/lesson.ts';
import { I11A_LESSON } from '../lessons/i11aRhodes/lesson.ts';
import { I11B_LESSON } from '../lessons/i11bWurlitzer/lesson.ts';

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
// Lab 4, keyboards and harp.
LESSON_CONTENT.C11 = C11_LESSON;
LESSON_CONTENT.C10 = C10_LESSON;
LESSON_CONTENT.C12 = C12_LESSON;
// Lab 2 (percussion), the electric pianos (each lesson on its own line).
LESSON_CONTENT.I11a = I11A_LESSON;
LESSON_CONTENT.I11b = I11B_LESSON;

export function lessonById(id: string | undefined): Lesson | undefined {
  return id ? LESSON_CONTENT[id] : undefined;
}

/* Lab 1 hand drums (M04a–c, M05): appended so other lessons merge cleanly. */
import { HAND_DRUM_CONTENT } from '../lessons/shared/handdrums/content.ts';
Object.assign(LESSON_CONTENT, HAND_DRUM_CONTENT);

/* Lab 2 mallet keyboards (I07–I10): appended so other lessons merge cleanly. */
import { MALLET_CONTENT } from '../lessons/shared/mallets/contentRegistry.ts';
Object.assign(LESSON_CONTENT, MALLET_CONTENT);
/* Lab 2 (percussion), suspended metal: I06a–c, I12 (each lesson on its own line). */
import { I06A_LESSON } from '../lessons/i06aTriangle/lesson.ts';
LESSON_CONTENT.I06a = I06A_LESSON;
import { I06B_LESSON } from '../lessons/i06bFingerCymbals/lesson.ts';
LESSON_CONTENT.I06b = I06B_LESSON;
import { I06C_LESSON } from '../lessons/i06cBarChimes/lesson.ts';
LESSON_CONTENT.I06c = I06C_LESSON;
import { I12_LESSON } from '../lessons/i12Gong/lesson.ts';
LESSON_CONTENT.I12 = I12_LESSON;
/* Lab 2 cymbals (I01a–e): appended so other lessons merge cleanly. */
import { CYMBAL_CONTENT } from '../lessons/shared/cymbals/content.ts';
Object.assign(LESSON_CONTENT, CYMBAL_CONTENT);
/* Lab 2 small percussion (I02–I05): appended so other lessons merge cleanly. */
import { SMALL_PERC_CONTENT } from '../lessons/shared/smallperc/content.ts';
Object.assign(LESSON_CONTENT, SMALL_PERC_CONTENT);
/* Lab 3 (winds), the brass (each lesson on its own line). */
import { A01_LESSON } from '../lessons/a01Trumpet/lesson.ts';
LESSON_CONTENT.A01 = A01_LESSON;
import { A02_LESSON } from '../lessons/a02Trombone/lesson.ts';
LESSON_CONTENT.A02 = A02_LESSON;
/* Lab 3 (winds), low / coiled brass: A03 horn, A04a tuba, A04b euphonium (each on its own line). */
import { A03_LESSON } from '../lessons/a03Horn/lesson.ts';
LESSON_CONTENT.A03 = A03_LESSON;
import { A04A_LESSON } from '../lessons/a04aTuba/lesson.ts';
LESSON_CONTENT.A04a = A04A_LESSON;
import { A04B_LESSON } from '../lessons/a04bEuphonium/lesson.ts';
LESSON_CONTENT.A04b = A04B_LESSON;
