/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';
import { CoupledHeads, StrikeSequence } from '../lessons/m01Kick/soundArt';
import { SNARE_ART } from '../lessons/m02Snare/art';
import { TOMS_ART } from '../lessons/m03Toms/art';
import { M09_ART } from '../lessons/m09Overheads/art';
import { M10_ART } from '../lessons/m10Room/art';
import { M11_ART } from '../lessons/m11Kit/art';
import { cabArt } from '../lessons/spk/art';
import { SPK_PAGES } from '../lessons/spk/pages';
import { TONBAK_ART, TONBAK_PAGES } from '../lessons/m12Tonbak/pages';
import { TABLA_ART, TABLA_PAGES } from '../lessons/m13Tabla/pages';
import { orchestraPlanFor } from '../lessons/shared/concert/OrchestraPlan';
import { TimpaniArt, timpaniHitTest, timpaniLabels } from '../lessons/m06Timpani/art';
import { TimpaniCoupled, TimpaniStrike } from '../lessons/m06Timpani/soundArt';
import { ConcertBassDrumArt, concertBassDrumHitTest, concertBassDrumLabels } from '../lessons/m07aConcertBassDrum/art';
import { ConcertBassDrumCoupled, ConcertBassDrumStrike } from '../lessons/m07aConcertBassDrum/soundArt';
import { ConcertSnareArt, concertSnareHitTest, concertSnareLabels } from '../lessons/m07bConcertSnare/art';
import { ConcertSnareCoupled, ConcertSnareStrike } from '../lessons/m07bConcertSnare/soundArt';
import { TambourineArt, tambourineHitTest, tambourineLabels } from '../lessons/m08HeadedTambourine/art';
import { TambourineCoupled, TambourineStrike } from '../lessons/m08HeadedTambourine/soundArt';
import { C01_ART } from '../lessons/c01Guitar/art';
import { C05C_ART } from '../lessons/c05cUkulele/art';
import { C05B_ART } from '../lessons/c05bMandolin/art';
import { C05A_ART } from '../lessons/c05aBanjo/art';
import { C03_ART } from '../lessons/c03Resonator/art';
import { C07_ART } from '../lessons/c07AcousticBass/art';
import { C02_ART } from '../lessons/c02GuitarAmp/art';
import { C08_ART } from '../lessons/c08BassAmp/art';
import { C04_ART } from '../lessons/c04Steel/art';
import { VIOLIN_ART } from '../lessons/c09aViolin/art';
import { VIOLA_ART } from '../lessons/c09bViola/art';
import { CELLO_ART } from '../lessons/c09cCello/art';
import { BASS_PLUCKED_ART } from '../lessons/c06aBassPlucked/art';
import { BASS_BOWED_ART } from '../lessons/c06bBassBowed/art';
import { C13_ART } from '../lessons/c13Oud/art';
import { C14_ART } from '../lessons/c14Sitar/art';
import { C15_ART } from '../lessons/c15Veena/art';
import { PIANO_ART } from '../lessons/c11Piano/pages';
import { HARP_ART } from '../lessons/c10Harp/pages';
import { CLAV_ART } from '../lessons/c12Clavinet/pages';
import { I11A_ART } from '../lessons/i11aRhodes/art';
import { I11B_ART } from '../lessons/i11bWurlitzer/art';

const ART: Record<string, LessonArt> = {
  M01: {
    Instrument: KickArt,
    labels: kickLabels,
    hitTest: kickHitTest,
    StrikeSequence,
    CoupledHeads,
    // The kick is the kit frame's origin; its own (cutaway) art draws it on the plan.
    plan: { own: 'kick', useArt: true },
  },
  M02: SNARE_ART,
  M03: TOMS_ART,
  M09: M09_ART,
  M10: M10_ART,
  M11: M11_ART,
  M06: { Instrument: TimpaniArt, labels: timpaniLabels, hitTest: timpaniHitTest, StrikeSequence: TimpaniStrike, CoupledHeads: TimpaniCoupled, SettingPlan: orchestraPlanFor('timpani') },
  M07a: { Instrument: ConcertBassDrumArt, labels: concertBassDrumLabels, hitTest: concertBassDrumHitTest, StrikeSequence: ConcertBassDrumStrike, CoupledHeads: ConcertBassDrumCoupled, SettingPlan: orchestraPlanFor('bassDrum') },
  M07b: { Instrument: ConcertSnareArt, labels: concertSnareLabels, hitTest: concertSnareHitTest, StrikeSequence: ConcertSnareStrike, CoupledHeads: ConcertSnareCoupled, SettingPlan: orchestraPlanFor('snare') },
  M08: { Instrument: TambourineArt, labels: tambourineLabels, hitTest: tambourineHitTest, StrikeSequence: TambourineStrike, CoupledHeads: TambourineCoupled, SettingPlan: orchestraPlanFor('tambourine') },
};
// Each further lesson on its own line (lessons are built in parallel).
ART.SPK = { ...cabArt('1x12'), pages: SPK_PAGES };
ART.M12 = { ...TONBAK_ART, pages: TONBAK_PAGES };
ART.M13 = { ...TABLA_ART, pages: TABLA_PAGES };
// Lab 4, the amplified chain (each lesson on its own line).
ART.C02 = C02_ART;
ART.C08 = C08_ART;
ART.C04 = C04_ART;
// Lab 2 (percussion), the electric pianos (each lesson on its own line).
ART.I11a = I11A_ART;
ART.I11b = I11B_ART;

// Lab 4, the guitar family (each lesson on its own line: lessons are built in parallel).
ART.C01 = C01_ART;
ART.C05C = C05C_ART;
ART.C05B = C05B_ART;
ART.C05A = C05A_ART;
ART.C03 = C03_ART;
ART.C07 = C07_ART;
// Lab 4, the lute family (oud, sitar, veena).
ART.C13 = C13_ART;
ART.C14 = C14_ART;
ART.C15 = C15_ART;

ART.C09a = VIOLIN_ART;
ART.C09b = VIOLA_ART;
ART.C09c = CELLO_ART;
ART.C06a = BASS_PLUCKED_ART;
ART.C06b = BASS_BOWED_ART;
ART.C11 = PIANO_ART;
ART.C10 = HARP_ART;
ART.C12 = CLAV_ART;

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}

/* Lab 1 hand drums (M04a–c, M05): appended so other lessons merge cleanly. */
import { HAND_DRUM_ART } from '../lessons/shared/handdrums/artRegistry';
Object.assign(ART, HAND_DRUM_ART);

/* Lab 2 mallet keyboards (I07–I10): appended so other lessons merge cleanly. */
import { MALLET_ART } from '../lessons/shared/mallets/artRegistry';
Object.assign(ART, MALLET_ART);
/* Lab 2 (percussion), suspended metal: I06a–c, I12 (each lesson on its own line). */
import { TRIANGLE_ART, TRIANGLE_PAGES, TRIANGLE_STEP_COUNTS } from '../lessons/i06aTriangle/pages';
ART.I06a = { ...TRIANGLE_ART, pages: TRIANGLE_PAGES, stepCounts: TRIANGLE_STEP_COUNTS };
import { FINGER_CYMBALS_ART, FINGER_CYMBALS_PAGES, FINGER_CYMBALS_STEP_COUNTS } from '../lessons/i06bFingerCymbals/pages';
ART.I06b = { ...FINGER_CYMBALS_ART, pages: FINGER_CYMBALS_PAGES, stepCounts: FINGER_CYMBALS_STEP_COUNTS };
import { BAR_CHIMES_ART, BAR_CHIMES_PAGES, BAR_CHIMES_STEP_COUNTS } from '../lessons/i06cBarChimes/pages';
ART.I06c = { ...BAR_CHIMES_ART, pages: BAR_CHIMES_PAGES, stepCounts: BAR_CHIMES_STEP_COUNTS };
import { GONG_ART, GONG_PAGES, GONG_STEP_COUNTS } from '../lessons/i12Gong/pages';
ART.I12 = { ...GONG_ART, pages: GONG_PAGES, stepCounts: GONG_STEP_COUNTS };
/* Lab 2 cymbals (I01a–e): appended so other lessons merge cleanly. */
import { CYMBAL_ART } from '../lessons/shared/cymbals/artRegistry';
Object.assign(ART, CYMBAL_ART);
/* Lab 2 small percussion (I02–I05): appended so other lessons merge cleanly. */
import { SMALL_PERC_ART } from '../lessons/shared/smallperc/artRegistry';
Object.assign(ART, SMALL_PERC_ART);
/* Lab 3 (winds), the brass (each lesson on its own line). */
import { A01_ART } from '../lessons/a01Trumpet/art';
ART.A01 = A01_ART;
import { A02_ART } from '../lessons/a02Trombone/art';
ART.A02 = A02_ART;
/* Lab 3 (winds), low / coiled brass: A03 horn, A04a tuba, A04b euphonium (each on its own line). */
import { HORN_ART } from '../lessons/a03Horn/art';
ART.A03 = HORN_ART;
import { TUBA_ART } from '../lessons/a04aTuba/art';
ART.A04a = TUBA_ART;
import { EUPH_ART } from '../lessons/a04bEuphonium/art';
ART.A04b = EUPH_ART;
/* Lab 3 (winds), the saxophones A05a–d (each lesson on its own line). */
import { A05A_ART } from '../lessons/a05aSopranoSax/art';
ART.A05a = A05A_ART;
import { A05B_ART } from '../lessons/a05bAltoSax/art';
ART.A05b = A05B_ART;
import { A05C_ART } from '../lessons/a05cTenorSax/art';
ART.A05c = A05C_ART;
import { A05D_ART } from '../lessons/a05dBaritoneSax/art';
ART.A05d = A05D_ART;
/* Lab 3 (winds), the free reeds and the organ: A10–A12 (each lesson on its own line). */
import { A10_LESSON_ART } from '../lessons/a10Harmonica/pages';
ART.A10 = A10_LESSON_ART;
import { A11_LESSON_ART } from '../lessons/a11Accordion/pages';
ART.A11 = A11_LESSON_ART;
import { A12_LESSON_ART } from '../lessons/a12Organ/pages';
ART.A12 = A12_LESSON_ART;
/* Lab 3 (winds), the woodwinds (A06–A09b): appended so other lessons merge cleanly. */
import { WOODWIND_ART } from '../lessons/shared/woodwinds/artRegistry';
Object.assign(ART, WOODWIND_ART);
