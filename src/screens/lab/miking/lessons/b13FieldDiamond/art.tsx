/**
 * B13 FIELD AND DIAMOND SPORTS — the look (charter §2 layer 3): the practice
 * field as the engine's scene (shared/sports/sportsArt) and the lesson's own
 * pages (pages.tsx).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { venueLessonArt } from '../shared/sports/sportsArt';
import { PRACTICE_FIELD } from '../shared/sports/practiceScenes.ts';
import { B13_PAGES, B13_STEP_COUNTS } from './pages';

export const B13_ART: LessonArt = venueLessonArt(PRACTICE_FIELD, (id) => `pf.${id}`, B13_PAGES, B13_STEP_COUNTS);
