/**
 * C14 SITAR — the look: the shared lute family's drawing, its HOW IT SOUNDS
 * page (with the sympathetic strings) and its setting plan (a rug, the
 * tabla, a tanpura).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeLuteArt } from '../shared/lutes/LuteArt';
import { LUTE_SOUND_STEPS, makeLuteSoundPage } from '../shared/lutes/LuteSound';
import { makeLutePlanPage } from '../shared/lutes/LutePlan';
import { LUTE_HEARING } from '../shared/lutes/lutesContent.ts';
import { LUTE_PLANS } from '../shared/lutes/lutePlanModel.ts';
import { C14_BUILT } from './geometry.ts';

export const C14_ART: LessonArt = {
  ...makeLuteArt(C14_BUILT),
  pages: {
    sound: makeLuteSoundPage(C14_BUILT),
    setting: makeLutePlanPage(C14_BUILT, { plan: LUTE_PLANS.C14, hearing: LUTE_HEARING }),
  },
  stepCounts: { sound: LUTE_SOUND_STEPS(C14_BUILT.scene), setting: 3 },
};
