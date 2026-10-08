/**
 * B07 VOICEOVER, NARRATION AND BROADCAST GUESTS — the look (charter §2 layer
 * 3): the scene (scene.tsx: the booth with its script stand, the guest desk)
 * and the lesson's own pages (pages.tsx: MEET IT's head turn and script
 * reflection; STARTING SETUPS' routing and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B07Instrument, b07FigureAt, b07HitTest, b07Labels } from './scene';
import { B07_ZONES } from './model.ts';
import { B07_PAGES, B07_STEP_COUNTS } from './pages';

export const B07_ART: LessonArt = {
  Instrument: B07Instrument,
  labels: b07Labels,
  hitTest: b07HitTest,
  figureAt: b07FigureAt,
  labelObstacles: voiceLabelObstacles(B07_ZONES),
  labelsYieldToMic: true,
  pages: B07_PAGES,
  stepCounts: B07_STEP_COUNTS,
};
