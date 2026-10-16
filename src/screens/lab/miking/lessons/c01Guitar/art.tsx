/**
 * C01 ACOUSTIC GUITAR — the look (charter §2 layer 3): the shared guitar
 * family's drawing of each body, its HOW-IT-SOUNDS page (a plucked string,
 * not a struck head) and its stage plan (a seated singer-guitarist, not the
 * drum kit).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { GUITAR_PLANS } from '../shared/guitars/stagePlanModel.ts';
import { C01_BUILT, C01_ZONES } from './geometry.ts';

export const C01_ART: LessonArt = {
  ...makeGuitarArt(C01_BUILT, { zones: C01_ZONES }),
  pages: {
    sound: makeStringSoundPage(C01_BUILT),
    setting: makeStagePlanPage(C01_BUILT, { plan: GUITAR_PLANS.C01, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
