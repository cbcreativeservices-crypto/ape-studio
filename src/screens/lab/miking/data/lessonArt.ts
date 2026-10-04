/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';

const ART: Record<string, LessonArt> = {
  M01: { Instrument: KickArt, labels: kickLabels, hitTest: kickHitTest },
};

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}
