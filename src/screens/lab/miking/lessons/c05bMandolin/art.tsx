/**
 * C05b MANDOLIN — the look: the shared guitar family's A- and F-style
 * mandolins, the plucked-string HOW IT SOUNDS page and a bluegrass stage plan.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { stringsPlan } from '../shared/guitars/stringsContent.ts';
import { C05B_BUILT } from './geometry.ts';

export const C05B_ART: LessonArt = {
  ...makeGuitarArt(C05B_BUILT),
  pages: {
    sound: makeStringSoundPage(C05B_BUILT),
    setting: makeStagePlanPage(C05B_BUILT, { objects: stringsPlan(C05B_BUILT.scenes.a, { chair: false, vocal: true, di: false, shared: true }), stageEdgeZ: 1650, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
