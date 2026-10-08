/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the look (charter §2 layer
 * 3): the scene (scene.tsx: the guest and the reporter face to face, the
 * camera, the street, the local loudspeaker) and the lesson's own pages
 * (pages.tsx: MEET IT's one-mic interview and the wind; STARTING SETUPS'
 * routing and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B03Instrument, b03FigureAt, b03HitTest, b03Labels } from './scene';
import { B03_ZONES } from './model.ts';
import { B03_PAGES, B03_STEP_COUNTS } from './pages';

export const B03_ART: LessonArt = {
  Instrument: B03Instrument,
  labels: b03Labels,
  hitTest: b03HitTest,
  figureAt: b03FigureAt,
  labelObstacles: voiceLabelObstacles(B03_ZONES),
  labelsYieldToMic: true,
  pages: B03_PAGES,
  stepCounts: B03_STEP_COUNTS,
};
