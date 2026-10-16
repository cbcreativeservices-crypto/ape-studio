/**
 * C05b MANDOLIN — the look: the shared guitar family's A- and F-style
 * mandolins, the plucked-string HOW IT SOUNDS page and a bluegrass stage plan.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { GUITAR_PLANS } from '../shared/guitars/stagePlanModel.ts';
import { C05B_BUILT, C05B_ZONES } from './geometry.ts';

export const C05B_ART: LessonArt = {
  ...makeGuitarArt(C05B_BUILT, { zones: C05B_ZONES }),
  pages: {
    sound: makeStringSoundPage(C05B_BUILT),
    setting: makeStagePlanPage(C05B_BUILT, { plan: GUITAR_PLANS.C05B, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
