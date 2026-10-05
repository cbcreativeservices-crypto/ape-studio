/**
 * C13 OUD — the look: the shared lute family's drawing, its HOW IT SOUNDS
 * page and its setting plan (a chair, a vocal mic, a frame-drum player).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeLuteArt } from '../shared/lutes/LuteArt';
import { LUTE_SOUND_STEPS, makeLuteSoundPage } from '../shared/lutes/LuteSound';
import { makeLutePlanPage } from '../shared/lutes/LutePlan';
import { LUTE_HEARING, oudPlan } from '../shared/lutes/lutesContent.ts';
import { C13_BUILT } from './geometry.ts';

export const C13_ART: LessonArt = {
  ...makeLuteArt(C13_BUILT),
  pages: {
    sound: makeLuteSoundPage(C13_BUILT),
    setting: makeLutePlanPage(C13_BUILT, { objects: oudPlan(C13_BUILT.scene), near: { u0: -620, u1: 1300, v0: -700, v1: 720 }, stageEdgeZ: 1650, hearing: LUTE_HEARING }),
  },
  stepCounts: { sound: LUTE_SOUND_STEPS(C13_BUILT.scene), setting: 3 },
};
