/**
 * C13 OUD — the look: the shared lute family's drawing, its HOW IT SOUNDS
 * page and its setting plan (a chair, a vocal mic, a frame-drum player).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeLuteArt } from '../shared/lutes/LuteArt';
import { LUTE_SOUND_STEPS, makeLuteSoundPage } from '../shared/lutes/LuteSound';
import { makeLutePlanPage } from '../shared/lutes/LutePlan';
import { LUTE_HEARING } from '../shared/lutes/lutesContent.ts';
import { LUTE_PLANS } from '../shared/lutes/lutePlanModel.ts';
import { C13_BUILT } from './geometry.ts';

export const C13_ART: LessonArt = {
  ...makeLuteArt(C13_BUILT),
  pages: {
    sound: makeLuteSoundPage(C13_BUILT),
    setting: makeLutePlanPage(C13_BUILT, { plan: LUTE_PLANS.C13, hearing: LUTE_HEARING }),
  },
  stepCounts: { sound: LUTE_SOUND_STEPS(C13_BUILT.scene), setting: 3 },
};
