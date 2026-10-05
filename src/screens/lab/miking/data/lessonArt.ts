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
import { ConcertSnareArt, concertSnareHitTest, concertSnareLabels } from '../lessons/m07bConcertSnare/art';
import { ConcertSnareCoupled, ConcertSnareStrike } from '../lessons/m07bConcertSnare/soundArt';

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
  M07b: { Instrument: ConcertSnareArt, labels: concertSnareLabels, hitTest: concertSnareHitTest, StrikeSequence: ConcertSnareStrike, CoupledHeads: ConcertSnareCoupled, SettingPlan: orchestraPlanFor('snare') },
};

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}
