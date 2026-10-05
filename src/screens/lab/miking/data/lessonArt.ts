/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';
import { CoupledHeads, StrikeSequence } from '../lessons/m01Kick/soundArt';
import { SNARE_ART } from '../lessons/m02Snare/art';
import { TOMS_ART } from '../lessons/m03Toms/art';
import { C01_ART } from '../lessons/c01Guitar/art';
import { C05B_ART } from '../lessons/c05bMandolin/art';
import { C05A_ART } from '../lessons/c05aBanjo/art';
import { C03_ART } from '../lessons/c03Resonator/art';
import { C07_ART } from '../lessons/c07AcousticBass/art';

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

// Lab 4, the guitar family (each lesson on its own line: lessons are built in parallel).
ART.C01 = C01_ART;
ART.C05B = C05B_ART;
ART.C05A = C05A_ART;
ART.C03 = C03_ART;
ART.C07 = C07_ART;

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}
