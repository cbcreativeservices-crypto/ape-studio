/**
 * F09 LOCATION SPEECH — the look (charter §2 layer 3): the scene (scene.tsx:
 * the talker on the voice family's figure, the camera and its frame, the
 * counter and the keys, the boom operator, the power line outdoors) and the
 * lesson's own pages (pages.tsx: MEET IT's frame line and head turn, the
 * "before any mic" step).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { LocationInstrument, locationFigureAt, locationHitTest, locationLabels } from './scene';
import { F09_ZONES } from './model.ts';
import { F09_PAGES, F09_STEP_COUNTS } from './pages';

export const F09_ART: LessonArt = {
  Instrument: LocationInstrument,
  labels: locationLabels,
  hitTest: locationHitTest,
  figureAt: locationFigureAt,
  labelObstacles: voiceLabelObstacles(F09_ZONES),
  labelsYieldToMic: true,
  pages: F09_PAGES,
  stepCounts: F09_STEP_COUNTS,
};
