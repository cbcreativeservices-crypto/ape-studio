/**
 * F10 SPATIAL FIELD PICKUP — the look (charter §2 layer 3): the scene
 * (scene.tsx: the square or the event, the listener's point, the sources,
 * the rigs) and the lesson's own pages (pages.tsx). The engine draws the
 * MICROPHONES page's first step and the TWO MICROPHONES page on this scene.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { SpatialInstrument, spatialFigureAt, spatialHitTest, spatialLabels } from './scene';
import { F10_PAGES, F10_STEP_COUNTS } from './pages';

export const F10_ART: LessonArt = {
  Instrument: SpatialInstrument,
  labels: spatialLabels,
  hitTest: spatialHitTest,
  figureAt: spatialFigureAt,
  labelsYieldToMic: true,
  pages: F10_PAGES,
  stepCounts: F10_STEP_COUNTS,
};
