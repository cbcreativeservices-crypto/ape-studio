/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';
import { CoupledHeads, StrikeSequence } from '../lessons/m01Kick/soundArt';
import { SNARE_ART } from '../lessons/m02Snare/art';
import { TOMS_ART } from '../lessons/m03Toms/art';
import { VIOLIN_ART } from '../lessons/c09aViolin/art';
import { VIOLA_ART } from '../lessons/c09bViola/art';
import { CELLO_ART } from '../lessons/c09cCello/art';
import { BASS_PLUCKED_ART } from '../lessons/c06aBassPlucked/art';
import { BASS_BOWED_ART } from '../lessons/c06bBassBowed/art';

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
};

ART.C09a = VIOLIN_ART;
ART.C09b = VIOLA_ART;
ART.C09c = CELLO_ART;
ART.C06a = BASS_PLUCKED_ART;
ART.C06b = BASS_BOWED_ART;

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}
