/**
 * C03 RESONATOR GUITAR — the look: the shared guitar family's drawing (the
 * coverplate, ports and cone; lap style face up, or upright), its plucked-
 * string HOW IT SOUNDS page and its stage plan.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { GUITAR_PLANS } from '../shared/guitars/stagePlanModel.ts';
import { C03_BUILT, C03_ZONES } from './geometry.ts';

export const C03_ART: LessonArt = {
  ...makeGuitarArt(C03_BUILT, { zones: C03_ZONES }),
  pages: {
    sound: makeStringSoundPage(C03_BUILT),
    setting: makeStagePlanPage(C03_BUILT, { plan: GUITAR_PLANS.C03, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
