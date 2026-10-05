/**
 * C15 SARASWATI VEENA — the look: the shared lute family's drawing, its HOW
 * IT SOUNDS page and its setting plan (a rug, the mridangam, a tanpura, a
 * side-fill monitor).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeLuteArt } from '../shared/lutes/LuteArt';
import { LUTE_SOUND_STEPS, makeLuteSoundPage } from '../shared/lutes/LuteSound';
import { makeLutePlanPage } from '../shared/lutes/LutePlan';
import { LUTE_HEARING, veenaPlan } from '../shared/lutes/lutesContent.ts';
import { C15_BUILT } from './geometry.ts';

export const C15_ART: LessonArt = {
  ...makeLuteArt(C15_BUILT),
  pages: {
    sound: makeLuteSoundPage(C15_BUILT),
    setting: makeLutePlanPage(C15_BUILT, { objects: veenaPlan(C15_BUILT.scene), near: { u0: -560, u1: 1700, v0: -1180, v1: 640 }, stageEdgeZ: 1650, hearing: LUTE_HEARING }),
  },
  stepCounts: { sound: LUTE_SOUND_STEPS(C15_BUILT.scene), setting: 3 },
};
