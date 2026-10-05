/**
 * C07 ACOUSTIC BASS GUITAR — the look: the shared guitar family's drawing,
 * its plucked-string HOW IT SOUNDS page and its stage plan.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { stringsPlan } from '../shared/guitars/stringsContent.ts';
import { C07_BUILT } from './geometry.ts';

export const C07_ART: LessonArt = {
  ...makeGuitarArt(C07_BUILT),
  pages: {
    sound: makeStringSoundPage(C07_BUILT),
    setting: makeStagePlanPage(C07_BUILT, { objects: stringsPlan(C07_BUILT.scenes.bass, { chair: true, vocal: true, di: true }), stageEdgeZ: 1650, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
