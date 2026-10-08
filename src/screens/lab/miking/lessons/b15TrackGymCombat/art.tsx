/**
 * B15 TRACK, GYMNASTICS AND COMBAT SPORTS — the look: the practice room as
 * the engine's scene (shared/sports/sportsArt) and the lesson's own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { venueLessonArt } from '../shared/sports/sportsArt';
import { PRACTICE_SMALL } from '../shared/sports/practiceScenes.ts';
import { B15_PAGES, B15_STEP_COUNTS } from './pages';

export const B15_ART: LessonArt = venueLessonArt(PRACTICE_SMALL, (id) => `ps.${id}`, B15_PAGES, B15_STEP_COUNTS);
