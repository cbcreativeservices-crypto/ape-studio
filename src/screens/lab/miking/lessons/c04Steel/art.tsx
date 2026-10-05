/**
 * C04 PEDAL STEEL AND LAP STEEL — the art the engine draws with: the combo
 * standing in for the steel's amp (shared/speakers/ampArt.tsx) and this
 * lesson's pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ampLessonArt } from '../shared/speakers/ampArt';
import { C04_PAGES } from './pages';

export const C04_ART: LessonArt = { ...ampLessonArt('combo'), pages: C04_PAGES };
