/**
 * B01 RADIO, PODCAST AND STUDIO HOSTS — the look (charter §2 layer 3): the
 * scene (scene.tsx: the hosts at the desk, the arms' clamps, the laptops, the
 * PA live) and the lesson's own pages (pages.tsx: MEET IT's head turn, desk
 * reflection and open mics; STARTING SETUPS' routing and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B01Instrument, b01FigureAt, b01HitTest, b01Labels } from './scene';
import { B01_ZONES } from './model.ts';
import { B01_PAGES, B01_STEP_COUNTS } from './pages';

export const B01_ART: LessonArt = {
  Instrument: B01Instrument,
  labels: b01Labels,
  hitTest: b01HitTest,
  figureAt: b01FigureAt,
  labelObstacles: voiceLabelObstacles(B01_ZONES),
  labelsYieldToMic: true,
  pages: B01_PAGES,
  stepCounts: B01_STEP_COUNTS,
};
