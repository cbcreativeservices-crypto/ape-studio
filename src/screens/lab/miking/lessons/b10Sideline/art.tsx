/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the look (charter §2 layer 3):
 * the scene (scene.tsx: the sideline, two handhelds, the post-event mark)
 * and the lesson's own pages (pages.tsx: MEET IT's handoff and open mics;
 * STARTING SETUPS' routing — the return, the crowd and the cues).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B10Instrument, b10FigureAt, b10HitTest, b10Labels } from './scene';
import { B10_ZONES } from './model.ts';
import { B10_PAGES, B10_STEP_COUNTS } from './pages';

export const B10_ART: LessonArt = {
  Instrument: B10Instrument,
  labels: b10Labels,
  hitTest: b10HitTest,
  figureAt: b10FigureAt,
  labelObstacles: voiceLabelObstacles(B10_ZONES),
  labelsYieldToMic: true,
  pages: B10_PAGES,
  stepCounts: B10_STEP_COUNTS,
};
