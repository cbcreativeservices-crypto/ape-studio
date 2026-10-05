/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';
import { CoupledHeads, StrikeSequence } from '../lessons/m01Kick/soundArt';
import { KICK_GEOM } from '../lessons/m01Kick/geometry.ts';

const ART: Record<string, LessonArt> = {
  M01: {
    Instrument: KickArt,
    labels: kickLabels,
    hitTest: kickHitTest,
    StrikeSequence,
    CoupledHeads,
    plan: { drum: { u0: KICK_GEOM.hoopX.batter[0], u1: KICK_GEOM.hoopX.reso[1], halfW: KICK_GEOM.hoopOut }, pedal: { u0: KICK_GEOM.pedal.x0, u1: KICK_GEOM.pedal.x1, halfW: 45 } },
  },
};

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}
