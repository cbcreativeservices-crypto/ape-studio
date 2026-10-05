/**
 * C02 ELECTRIC GUITAR AND GUITAR AMPLIFIERS — the art the engine draws with:
 * the speaker family's combo (shared/speakers/ampArt.tsx) and this lesson's
 * own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ampLessonArt } from '../shared/speakers/ampArt';
import { C02_PAGES } from './pages';

export const C02_ART: LessonArt = { ...ampLessonArt('combo'), pages: C02_PAGES };
