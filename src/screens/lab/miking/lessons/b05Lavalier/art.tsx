/**
 * B05 LAVALIER, HEADSET AND CONCEALED PICKUP — the look (charter §2 layer 3):
 * the scene (scene.tsx: the presenter in a jacket, the bodypack, the camera
 * in the studio, the lectern and the PA live) and the lesson's own pages
 * (pages.tsx: MEET IT's chest or head, the loops, the breath; STARTING
 * SETUPS' routing and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B05Instrument, b05FigureAt, b05HitTest, b05Labels } from './scene';
import { B05_ZONES } from './model.ts';
import { B05_PAGES, B05_STEP_COUNTS } from './pages';

export const B05_ART: LessonArt = {
  Instrument: B05Instrument,
  labels: b05Labels,
  hitTest: b05HitTest,
  figureAt: b05FigureAt,
  labelObstacles: voiceLabelObstacles(B05_ZONES),
  labelsYieldToMic: true,
  pages: B05_PAGES,
  stepCounts: B05_STEP_COUNTS,
};
