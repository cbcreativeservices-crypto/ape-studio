/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';
import { CoupledHeads, StrikeSequence } from '../lessons/m01Kick/soundArt';
import { orchestraPlanFor } from '../lessons/shared/concert/OrchestraPlan';
import { TimpaniArt, timpaniHitTest, timpaniLabels } from '../lessons/m06Timpani/art';
import { TimpaniCoupled, TimpaniStrike } from '../lessons/m06Timpani/soundArt';
import { ConcertBassDrumArt, concertBassDrumHitTest, concertBassDrumLabels } from '../lessons/m07aConcertBassDrum/art';
import { ConcertBassDrumCoupled, ConcertBassDrumStrike } from '../lessons/m07aConcertBassDrum/soundArt';
import { ConcertSnareArt, concertSnareHitTest, concertSnareLabels } from '../lessons/m07bConcertSnare/art';
import { ConcertSnareCoupled, ConcertSnareStrike } from '../lessons/m07bConcertSnare/soundArt';
import { TambourineArt, tambourineHitTest, tambourineLabels } from '../lessons/m08HeadedTambourine/art';
import { TambourineCoupled, TambourineStrike } from '../lessons/m08HeadedTambourine/soundArt';

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
  M06: { Instrument: TimpaniArt, labels: timpaniLabels, hitTest: timpaniHitTest, StrikeSequence: TimpaniStrike, CoupledHeads: TimpaniCoupled, SettingPlan: orchestraPlanFor('timpani') },
  M07a: { Instrument: ConcertBassDrumArt, labels: concertBassDrumLabels, hitTest: concertBassDrumHitTest, StrikeSequence: ConcertBassDrumStrike, CoupledHeads: ConcertBassDrumCoupled, SettingPlan: orchestraPlanFor('bassDrum') },
  M07b: { Instrument: ConcertSnareArt, labels: concertSnareLabels, hitTest: concertSnareHitTest, StrikeSequence: ConcertSnareStrike, CoupledHeads: ConcertSnareCoupled, SettingPlan: orchestraPlanFor('snare') },
  M08: { Instrument: TambourineArt, labels: tambourineLabels, hitTest: tambourineHitTest, StrikeSequence: TambourineStrike, CoupledHeads: TambourineCoupled, SettingPlan: orchestraPlanFor('tambourine') },
};

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}
