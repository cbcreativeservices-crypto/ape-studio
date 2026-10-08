/**
 * B08 BROADCAST AUDIENCE AND EVENT SPACE — the look (charter §2 layer 3):
 * the studio audience as the engine's scene (Lab 7b group 2's
 * shared/sports/sportsArt venueLessonArt) and the lesson's own pages
 * (pages.tsx).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { venueLessonArt } from '../shared/sports/sportsArt';
import { STUDIO_SCENE } from '../shared/broadcast/venue.ts';
import { B08_PAGES, B08_STEP_COUNTS } from './pages';

export const B08_ART: LessonArt = venueLessonArt(STUDIO_SCENE, (id) => `au.${id}`, B08_PAGES, B08_STEP_COUNTS);
