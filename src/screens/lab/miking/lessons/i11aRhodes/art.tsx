/**
 * I11a RHODES (TINE PIANO) — the art the engine draws with: the speaker
 * family's combo (shared/speakers/ampArt.tsx) for the placement scene, and
 * the electric pianos' own pages (shared/keys/keysPages.tsx).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ampLessonArt } from '../shared/speakers/ampArt';
import { I11A_PAGES } from './pages';

export const I11A_ART: LessonArt = { ...ampLessonArt('combo'), pages: I11A_PAGES };
