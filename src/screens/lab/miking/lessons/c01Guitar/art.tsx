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
import { figureV2On } from '../shared/figureV2/figureV2Config';

/** The new look (figure V2, wave 3 set 3c): the player as a cast member, the hands as each instrument is played. */
export const V2 = figureV2On('sidePlayers');

export const C01_ART: LessonArt = {
  ...makeGuitarArt(C01_BUILT, { zones: C01_ZONES, v2: V2 }),
  pages: {
    sound: makeStringSoundPage(C01_BUILT),
    setting: makeStagePlanPage(C01_BUILT, { plan: GUITAR_PLANS.C01, hearing: STRINGS_HEARING, v2: V2 }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
