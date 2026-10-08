/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — the look (charter §2 layer 3):
 * the scene (scene.tsx: the booth, the open position, the quiet booth) and
 * the lesson's own pages (pages.tsx: MEET IT's head turn and the partner's
 * voice; STARTING SETUPS' feeds — the mic key, the return, the crowd bed).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B09Instrument, b09FigureAt, b09HitTest, b09Labels } from './scene';
import { B09_ZONES } from './model.ts';
import { B09_PAGES, B09_STEP_COUNTS } from './pages';

export const B09_ART: LessonArt = {
  Instrument: B09Instrument,
  labels: b09Labels,
  hitTest: b09HitTest,
  figureAt: b09FigureAt,
  labelObstacles: voiceLabelObstacles(B09_ZONES),
  labelsYieldToMic: true,
  pages: B09_PAGES,
  stepCounts: B09_STEP_COUNTS,
};
