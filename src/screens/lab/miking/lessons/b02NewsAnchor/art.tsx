/**
 * B02 NEWS ANCHORS AND SEATED INTERVIEWS — the look (charter §2 layer 3): the
 * scene (scene.tsx: the anchor and the guest at the desk, the gooseneck base,
 * the camera and its frame, the PA in public) and the lesson's own pages
 * (pages.tsx: MEET IT's chest or head, the frame line, the desk, the open
 * mics; STARTING SETUPS' routing and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B02Instrument, b02FigureAt, b02HitTest, b02Labels } from './scene';
import { B02_ZONES } from './model.ts';
import { B02_PAGES, B02_STEP_COUNTS } from './pages';

export const B02_ART: LessonArt = {
  Instrument: B02Instrument,
  labels: b02Labels,
  hitTest: b02HitTest,
  figureAt: b02FigureAt,
  labelObstacles: voiceLabelObstacles(B02_ZONES),
  labelsYieldToMic: true,
  pages: B02_PAGES,
  stepCounts: B02_STEP_COUNTS,
};
