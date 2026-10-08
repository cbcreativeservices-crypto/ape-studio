/**
 * B06 PANELS, PRESS CONFERENCES AND GROUPS — the look (charter §2 layer 3):
 * the scene (scene.tsx: the panel table, the lectern and the aisle mic) and
 * the lesson's own pages (pages.tsx: MEET IT's head turn and open mics;
 * STARTING SETUPS' routing with the press feed, and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B06Instrument, b06FigureAt, b06HitTest, b06Labels } from './scene';
import { B06_ZONES } from './model.ts';
import { B06_PAGES, B06_STEP_COUNTS } from './pages';

export const B06_ART: LessonArt = {
  Instrument: B06Instrument,
  labels: b06Labels,
  hitTest: b06HitTest,
  figureAt: b06FigureAt,
  labelObstacles: voiceLabelObstacles(B06_ZONES),
  labelsYieldToMic: true,
  pages: B06_PAGES,
  stepCounts: B06_STEP_COUNTS,
};
