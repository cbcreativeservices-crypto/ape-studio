/**
 * B16 MOTORSPORT, EQUESTRIAN AND AQUATIC EVENTS — the look: the practice room
 * as the engine's scene (shared/sports/sportsArt) and the lesson's own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { venueLessonArt } from '../shared/sports/sportsArt';
import { PRACTICE_SMALL } from '../shared/sports/practiceScenes.ts';
import { B16_PAGES, B16_STEP_COUNTS } from './pages';

export const B16_ART: LessonArt = venueLessonArt(PRACTICE_SMALL, (id) => `ps.${id}`, B16_PAGES, B16_STEP_COUNTS);
