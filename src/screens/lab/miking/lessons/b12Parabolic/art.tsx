/**
 * B12 PARABOLIC AND TRACKED ACTION PICKUP — the look: the practice field as
 * the engine's scene (shared/sports/sportsArt) and the lesson's own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { venueLessonArt } from '../shared/sports/sportsArt';
import { PRACTICE_FIELD } from '../shared/sports/practiceScenes.ts';
import { B12_PAGES, B12_STEP_COUNTS } from './pages';

export const B12_ART: LessonArt = venueLessonArt(PRACTICE_FIELD, (id) => `pf.${id}`, B12_PAGES, B12_STEP_COUNTS);
