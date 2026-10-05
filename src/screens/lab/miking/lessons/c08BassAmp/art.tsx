/**
 * C08 ELECTRIC BASS — the art the engine draws with: the speaker family's bass
 * cabinet with its head (shared/speakers/ampArt.tsx) and this lesson's pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ampLessonArt } from '../shared/speakers/ampArt';
import { C08_PAGES } from './pages';

export const C08_ART: LessonArt = { ...ampLessonArt('bass'), pages: C08_PAGES };
