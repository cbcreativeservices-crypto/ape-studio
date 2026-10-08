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
/* Lab 3 (winds), the saxophones A05a–d (each lesson on its own line). */
import { A05A_LESSON } from '../lessons/a05aSopranoSax/lesson.ts';
LESSON_CONTENT.A05a = A05A_LESSON;
import { A05B_LESSON } from '../lessons/a05bAltoSax/lesson.ts';
LESSON_CONTENT.A05b = A05B_LESSON;
import { A05C_LESSON } from '../lessons/a05cTenorSax/lesson.ts';
LESSON_CONTENT.A05c = A05C_LESSON;
import { A05D_LESSON } from '../lessons/a05dBaritoneSax/lesson.ts';
LESSON_CONTENT.A05d = A05D_LESSON;
/* Lab 3 (winds), the free reeds and the organ: A10–A12 (each lesson on its own line). */
import { A10_LESSON } from '../lessons/a10Harmonica/lesson.ts';
LESSON_CONTENT.A10 = A10_LESSON;
import { A11_LESSON } from '../lessons/a11Accordion/lesson.ts';
LESSON_CONTENT.A11 = A11_LESSON;
import { A12_LESSON } from '../lessons/a12Organ/lesson.ts';
LESSON_CONTENT.A12 = A12_LESSON;
/* Lab 3 (winds), the woodwinds (A06–A09b): appended so other lessons merge cleanly. */
import { WOODWIND_CONTENT } from '../lessons/shared/woodwinds/content.ts';
Object.assign(LESSON_CONTENT, WOODWIND_CONTENT);
/* Lab 5 (ensembles and voice), group 1 — voice I, solo: E01, E03, E07 (each lesson on its own line). */
import { E01_LESSON } from '../lessons/e01LeadVocal/lesson.ts';
LESSON_CONTENT.E01 = E01_LESSON;
import { E03_LESSON } from '../lessons/e03RapVocal/lesson.ts';
LESSON_CONTENT.E03 = E03_LESSON;
import { E07_LESSON } from '../lessons/e07SingerInstrument/lesson.ts';
LESSON_CONTENT.E07 = E07_LESSON;
/* Lab 5 (ensembles), arrays and orchestra (group 3): E14, E13, E11 (each lesson on its own line). */
import { E14_LESSON } from '../lessons/e14FullOrchestra/lesson.ts';
LESSON_CONTENT.E14 = E14_LESSON;
import { E13_LESSON } from '../lessons/e13MixedEnsemble/lesson.ts';
LESSON_CONTENT.E13 = E13_LESSON;
import { E11_LESSON } from '../lessons/e11StringQuartet/lesson.ts';
LESSON_CONTENT.E11 = E11_LESSON;
/* Lab 5 (ensembles and voice), group 2 — voice II, groups: E02, E04, E05, E06 (each lesson on its own line). */
import { E02_LESSON } from '../lessons/e02BackgroundVocals/lesson.ts';
LESSON_CONTENT.E02 = E02_LESSON;
import { E04_LESSON } from '../lessons/e04Duets/lesson.ts';
LESSON_CONTENT.E04 = E04_LESSON;
import { E05_LESSON } from '../lessons/e05Choir/lesson.ts';
LESSON_CONTENT.E05 = E05_LESSON;
import { E06_LESSON } from '../lessons/e06ChildrensChoir/lesson.ts';
LESSON_CONTENT.E06 = E06_LESSON;
/* Lab 5 (ensembles), group 4 — bands & stage plots: E09, E15, E08 (each lesson on its own line). */
import { E09_LESSON } from '../lessons/e09CompleteBand/lesson.ts';
LESSON_CONTENT.E09 = E09_LESSON;
import { E15_LESSON } from '../lessons/e15JazzCombo/lesson.ts';
LESSON_CONTENT.E15 = E15_LESSON;
import { E08_LESSON } from '../lessons/e08AcousticGroup/lesson.ts';
LESSON_CONTENT.E08 = E08_LESSON;
/* Lab 5 (ensembles), group 5 — sections: E10, E16, E12 (each lesson on its own line). */
import { E10_LESSON } from '../lessons/e10HornSection/lesson.ts';
LESSON_CONTENT.E10 = E10_LESSON;
import { E16_LESSON } from '../lessons/e16BigBand/lesson.ts';
LESSON_CONTENT.E16 = E16_LESSON;
import { E12_LESSON } from '../lessons/e12PercussionEnsemble/lesson.ts';
LESSON_CONTENT.E12 = E12_LESSON;
/* Lab 6 (field), group 1 — Foley stage: F01, F02, F03, F04 (each lesson on its own line). */
import { F01_LESSON } from '../lessons/f01Footsteps/lesson.ts';
LESSON_CONTENT.F01 = F01_LESSON;
import { F02_LESSON } from '../lessons/f02Clothing/lesson.ts';
LESSON_CONTENT.F02 = F02_LESSON;
import { F03_LESSON } from '../lessons/f03Props/lesson.ts';
LESSON_CONTENT.F03 = F03_LESSON;
import { F04_LESSON } from '../lessons/f04Impacts/lesson.ts';
LESSON_CONTENT.F04 = F04_LESSON;
/* Lab 6 (field), group 2 — perspective & field: F06, F08, F07, F05 (each lesson on its own line). */
import { F05_LESSON } from '../lessons/f05Perspective/lesson.ts';
LESSON_CONTENT.F05 = F05_LESSON;
import { F06_LESSON } from '../lessons/f06Ambience/lesson.ts';
LESSON_CONTENT.F06 = F06_LESSON;
import { F07_LESSON } from '../lessons/f07Wildlife/lesson.ts';
LESSON_CONTENT.F07 = F07_LESSON;
import { F08_LESSON } from '../lessons/f08Passby/lesson.ts';
LESSON_CONTENT.F08 = F08_LESSON;
/* Lab 6 (field), group 6 — location and spatial: F09, F10 (each lesson on its own line). */
import { F09_LESSON } from '../lessons/f09LocationSpeech/lesson.ts';
LESSON_CONTENT.F09 = F09_LESSON;
import { F10_LESSON } from '../lessons/f10SpatialField/lesson.ts';
LESSON_CONTENT.F10 = F10_LESSON;
/* Lab 6 group 4 — measurement core: F11, F12, F13 (one block; each lesson on its own line). */
import { F11_LESSON } from '../lessons/f11MeasurementMics/lesson.ts';
LESSON_CONTENT.F11 = F11_LESSON;
import { F12_LESSON } from '../lessons/f12SoundLevel/lesson.ts';
LESSON_CONTENT.F12 = F12_LESSON;
import { F13_LESSON } from '../lessons/f13RoomAcoustics/lesson.ts';
LESSON_CONTENT.F13 = F13_LESSON;
/* Lab 6 group 5 — systems, products and sensors: F14, F15, F16 (one block; each lesson on its own line). */
import { F14_LESSON } from '../lessons/f14SystemMeasurement/lesson.ts';
LESSON_CONTENT.F14 = F14_LESSON;
import { F15_LESSON } from '../lessons/f15Machinery/lesson.ts';
LESSON_CONTENT.F15 = F15_LESSON;
import { F16_LESSON } from '../lessons/f16ScientificArrays/lesson.ts';
LESSON_CONTENT.F16 = F16_LESSON;
/* Lab 7 (broadcast), group 1 — desk and studio voice: B01, B07, B06 (each lesson on its own line). */
import { B01_LESSON } from '../lessons/b01RadioHost/lesson.ts';
LESSON_CONTENT.B01 = B01_LESSON;
import { B07_LESSON } from '../lessons/b07Voiceover/lesson.ts';
LESSON_CONTENT.B07 = B07_LESSON;
import { B06_LESSON } from '../lessons/b06Panels/lesson.ts';
LESSON_CONTENT.B06 = B06_LESSON;
/* Lab 7 · part 2 · G2 — action pickup on fields and courts: B12, B13, B14 (one block; each lesson on its own line). */
import { B12_LESSON } from '../lessons/b12Parabolic/lesson.ts';
LESSON_CONTENT.B12 = B12_LESSON;
import { B13_LESSON } from '../lessons/b13FieldDiamond/lesson.ts';
LESSON_CONTENT.B13 = B13_LESSON;
import { B14_LESSON } from '../lessons/b14CourtIce/lesson.ts';
LESSON_CONTENT.B14 = B14_LESSON;
/* Lab 7 · part 2 · G3 — arenas, moving sources, complete coverage: B15, B16, B17 (one block; each lesson on its own line). */
import { B15_LESSON } from '../lessons/b15TrackGymCombat/lesson.ts';
LESSON_CONTENT.B15 = B15_LESSON;
import { B16_LESSON } from '../lessons/b16MotorHorseWater/lesson.ts';
LESSON_CONTENT.B16 = B16_LESSON;
import { B17_LESSON } from '../lessons/b17CrowdComplete/lesson.ts';
LESSON_CONTENT.B17 = B17_LESSON;
