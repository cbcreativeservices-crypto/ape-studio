/**
 * C05a BANJO — the look: the shared guitar family's banjo (the pot, its head
 * on the hooks, the resonator or open back), its HOW IT SOUNDS page — with
 * the head's own shapes, driven off-centre at the bridge (the drum pages'
 * Bessel tables) — and a bluegrass stage plan with a shared mic.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING } from '../shared/guitars/StagePlan';
import { stringsPlan } from '../shared/guitars/stringsContent.ts';
import { C05A_BUILT, C05A_ZONES } from './geometry.ts';

const sp = C05A_BUILT.scenes.reso.variant.spec;
const pot = sp.body.pot!;

export const C05A_ART: LessonArt = {
  ...makeGuitarArt(C05A_BUILT, { zones: C05A_ZONES }),
  pages: {
    sound: makeStringSoundPage(C05A_BUILT, { membrane: { diameterMm: pot.d.mm, hooks: sp.hooks?.mm ?? 24, bridgeMm: Math.abs(pot.cx.mm), label: 'banjo head, from the front' } }),
    setting: makeStagePlanPage(C05A_BUILT, { objects: stringsPlan(C05A_BUILT.scenes.reso, { chair: false, vocal: true, di: false, shared: true }), stageEdgeZ: 1650, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 5, setting: 3 },
};
