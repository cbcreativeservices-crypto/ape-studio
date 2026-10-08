/**
 * B14 COURT, RACKET AND ICE SPORTS — the look: the practice line as the
 * engine's scene (shared/sports/sportsArt) and the lesson's own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { venueLessonArt } from '../shared/sports/sportsArt';
import { PRACTICE_LINE } from '../shared/sports/practiceScenes.ts';
import { B14_PAGES, B14_STEP_COUNTS } from './pages';

export const B14_ART: LessonArt = venueLessonArt(PRACTICE_LINE, (id) => `pl.${id}`, B14_PAGES, B14_STEP_COUNTS);
