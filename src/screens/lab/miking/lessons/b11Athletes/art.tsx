/**
 * B11 ATHLETES, COACHES AND OFFICIALS — the look (charter §2 layer 3): the
 * scene (scene.tsx: the coach, the official, the athlete with the body-worn
 * chain and the keep-outs) and the lesson's own pages (pages.tsx: MEET IT's
 * body mic front and side and the head turn; STARTING SETUPS' feeds with the
 * officials' private circuit closed).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B11Instrument, b11FigureAt, b11HitTest, b11Labels } from './scene';
import { B11_ZONES } from './model.ts';
import { B11_PAGES, B11_STEP_COUNTS } from './pages';

export const B11_ART: LessonArt = {
  Instrument: B11Instrument,
  labels: b11Labels,
  hitTest: b11HitTest,
  figureAt: b11FigureAt,
  labelObstacles: voiceLabelObstacles(B11_ZONES),
  labelsYieldToMic: true,
  pages: B11_PAGES,
  stepCounts: B11_STEP_COUNTS,
};
