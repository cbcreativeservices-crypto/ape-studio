/**
 * C05c UKULELE — the look: the shared guitar family's soprano ukulele, the
 * plucked-string HOW IT SOUNDS page and a singer-player's stage plan.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { stringsPlan } from '../shared/guitars/stringsContent.ts';
import { C05C_BUILT, C05C_ZONES } from './geometry.ts';

export const C05C_ART: LessonArt = {
  ...makeGuitarArt(C05C_BUILT, { zones: C05C_ZONES }),
  pages: {
    sound: makeStringSoundPage(C05C_BUILT),
    setting: makeStagePlanPage(C05C_BUILT, { objects: stringsPlan(C05C_BUILT.scenes.soprano, { chair: true, vocal: true, di: true }), stageEdgeZ: 1650, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
