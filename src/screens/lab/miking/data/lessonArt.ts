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

// Lab 4, the guitar family (each lesson on its own line: lessons are built in parallel).
ART.C01 = C01_ART;
ART.C05C = C05C_ART;
ART.C05B = C05B_ART;
ART.C05A = C05A_ART;
ART.C03 = C03_ART;
ART.C07 = C07_ART;

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}

/* Lab 1 hand drums (M04a–c, M05): appended so other lessons merge cleanly. */
import { HAND_DRUM_ART } from '../lessons/shared/handdrums/artRegistry';
Object.assign(ART, HAND_DRUM_ART);

/* Lab 2 cymbals (I01a–e): appended so other lessons merge cleanly. */
import { CYMBAL_ART } from '../lessons/shared/cymbals/artRegistry';
Object.assign(ART, CYMBAL_ART);
