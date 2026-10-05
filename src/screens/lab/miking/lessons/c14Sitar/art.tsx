/**
 * C14 SITAR — the look: the shared lute family's drawing, its HOW IT SOUNDS
 * page (with the sympathetic strings) and its setting plan (a rug, the
 * tabla, a tanpura).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeLuteArt } from '../shared/lutes/LuteArt';
import { LUTE_SOUND_STEPS, makeLuteSoundPage } from '../shared/lutes/LuteSound';
import { makeLutePlanPage } from '../shared/lutes/LutePlan';
import { LUTE_HEARING, sitarPlan } from '../shared/lutes/lutesContent.ts';
import { C14_BUILT } from './geometry.ts';

export const C14_ART: LessonArt = {
  ...makeLuteArt(C14_BUILT),
  pages: {
    sound: makeLuteSoundPage(C14_BUILT),
    setting: makeLutePlanPage(C14_BUILT, { objects: sitarPlan(C14_BUILT.scene), near: { u0: -720, u1: 1250, v0: -1180, v1: 640 }, stageEdgeZ: 1650, hearing: LUTE_HEARING }),
  },
  stepCounts: { sound: LUTE_SOUND_STEPS(C14_BUILT.scene), setting: 3 },
};
