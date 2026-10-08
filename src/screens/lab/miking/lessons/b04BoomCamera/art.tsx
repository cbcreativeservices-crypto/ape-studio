/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — the look (charter §2 layer 3): the
 * scene (scene.tsx: the talker, the camera and its frame, the boom operator,
 * the PA live) and the lesson's own pages (pages.tsx: MEET IT's frame line,
 * chest or head, two talkers; STARTING SETUPS' routing and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B04Instrument, b04FigureAt, b04HitTest, b04Labels } from './scene';
import { B04_ZONES } from './model.ts';
import { B04_PAGES, B04_STEP_COUNTS } from './pages';

export const B04_ART: LessonArt = {
  Instrument: B04Instrument,
  labels: b04Labels,
  hitTest: b04HitTest,
  figureAt: b04FigureAt,
  labelObstacles: voiceLabelObstacles(B04_ZONES),
  labelsYieldToMic: true,
  pages: B04_PAGES,
  stepCounts: B04_STEP_COUNTS,
};
