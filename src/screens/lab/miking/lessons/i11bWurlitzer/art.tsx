/**
 * I11b WURLITZER (REED PIANO) — the art the engine draws with: the reed piano
 * cut through its bass-side speaker (side) and at the speakers' height (top),
 * with the seated player (shared/keys/KeysArt.tsx), and the electric pianos'
 * own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { wurliLessonArt } from '../shared/keys/KeysArt';
import { I11B_PAGES } from './pages';

export const I11B_ART: LessonArt = { ...wurliLessonArt(), pages: I11B_PAGES };
