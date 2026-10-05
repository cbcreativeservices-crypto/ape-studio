/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';
import { CoupledHeads, StrikeSequence } from '../lessons/m01Kick/soundArt';
import { SNARE_ART } from '../lessons/m02Snare/art';
import { TOMS_ART } from '../lessons/m03Toms/art';
import { PIANO_ART } from '../lessons/c11Piano/pages';
import { HARP_ART } from '../lessons/c10Harp/pages';
import { CLAV_ART } from '../lessons/c12Clavinet/pages';

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
ART.C11 = PIANO_ART;
ART.C10 = HARP_ART;
ART.C12 = CLAV_ART;

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}
