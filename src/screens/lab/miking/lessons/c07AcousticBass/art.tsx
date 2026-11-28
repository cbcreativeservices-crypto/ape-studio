/**
 * C07 ACOUSTIC BASS GUITAR — the look: the shared guitar family's drawing,
 * its plucked-string HOW IT SOUNDS page and its stage plan.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { GUITAR_PLANS } from '../shared/guitars/stagePlanModel.ts';
import { C07_BUILT, C07_ZONES } from './geometry.ts';
import { figureV2On } from '../shared/figureV2/figureV2Config';

/** The new look (figure V2, wave 3 set 3c): the player as a cast member, the hands as each instrument is played. */
export const V2 = figureV2On('sidePlayers');

export const C07_ART: LessonArt = {
  ...makeGuitarArt(C07_BUILT, { zones: C07_ZONES, v2: V2 }),
  pages: {
    sound: makeStringSoundPage(C07_BUILT),
    setting: makeStagePlanPage(C07_BUILT, { plan: GUITAR_PLANS.C07, hearing: STRINGS_HEARING, v2: V2 }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
