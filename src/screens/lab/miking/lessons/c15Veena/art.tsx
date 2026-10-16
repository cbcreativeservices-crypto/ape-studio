/**
 * C15 SARASWATI VEENA — the look: the shared lute family's drawing, its HOW
 * IT SOUNDS page and its setting plan (a rug, the mridangam, a tanpura, a
 * side-fill monitor).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeLuteArt } from '../shared/lutes/LuteArt';
import { LUTE_SOUND_STEPS, makeLuteSoundPage } from '../shared/lutes/LuteSound';
import { makeLutePlanPage } from '../shared/lutes/LutePlan';
import { LUTE_HEARING } from '../shared/lutes/lutesContent.ts';
import { LUTE_PLANS } from '../shared/lutes/lutePlanModel.ts';
import { C15_BUILT } from './geometry.ts';

export const C15_ART: LessonArt = {
  ...makeLuteArt(C15_BUILT),
  pages: {
    sound: makeLuteSoundPage(C15_BUILT),
    setting: makeLutePlanPage(C15_BUILT, { plan: LUTE_PLANS.C15, hearing: LUTE_HEARING }),
  },
  stepCounts: { sound: LUTE_SOUND_STEPS(C15_BUILT.scene), setting: 3 },
};
