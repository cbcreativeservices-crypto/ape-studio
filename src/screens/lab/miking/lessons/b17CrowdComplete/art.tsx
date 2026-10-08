/**
 * B17 CROWD AND COMPLETE SPORTS COVERAGE — the look: the mock venue as the
 * engine's scene (shared/sports/sportsArt) and the lesson's own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { venueLessonArt } from '../shared/sports/sportsArt';
import { PRACTICE_CROWD } from '../shared/sports/practiceScenes.ts';
import { B17_PAGES, B17_STEP_COUNTS } from './pages';

export const B17_ART: LessonArt = venueLessonArt(PRACTICE_CROWD, (id) => `pc.${id}`, B17_PAGES, B17_STEP_COUNTS);
