/**
 * C01 ACOUSTIC GUITAR — the look (charter §2 layer 3): the shared guitar
 * family's drawing of each body, its HOW-IT-SOUNDS page (a plucked string,
 * not a struck head) and its stage plan (a seated singer-guitarist, not the
 * drum kit).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { makeStringSoundPage } from '../shared/guitars/StringSound';
import { makeStagePlanPage, STRINGS_HEARING, type PlanObject } from '../shared/guitars/StagePlan';
import { C01_BUILT, C01_ZONES } from './geometry.ts';

const sc = C01_BUILT.scenes.steel;
const m = sc.fit.mouth;

/** The plan's objects (lesson frame x, z): a typical layout. */
export const C01_PLAN: PlanObject[] = [
  { id: 'player', kind: 'player', at: { x: sc.fit.head.c.x, z: sc.fit.head.c.z }, scene: 'all', r: 320 },
  { id: 'chair', kind: 'chair', at: { x: sc.fit.head.c.x, z: sc.fit.head.c.z - 40 }, scene: 'kit', r: 220 },
  { id: 'vocal', kind: 'vocal', at: { x: m.x, z: m.z + 90 }, faces: { x: m.x - 60, z: 520 }, scene: 'kit', r: 140 },
  { id: 'di', kind: 'di', at: { x: -520, z: 260 }, scene: 'kit', r: 120 },
  { id: 'bassAmp', kind: 'bassAmp', at: { x: 1500, z: -1250 }, scene: 'stage', r: 330 },
  { id: 'kit', kind: 'kit', at: { x: -900, z: -1700 }, scene: 'stage', r: 800 },
  { id: 'paL', kind: 'pa', at: { x: -2000, z: 1950 }, scene: 'stage', r: 300 },
  { id: 'paR', kind: 'pa', at: { x: 2100, z: 1950 }, scene: 'stage', r: 300 },
  { id: 'audience', kind: 'audience', at: { x: 0, z: 1650 }, scene: 'stage', r: 300 },
  { id: 'room', kind: 'room', at: { x: -2100, z: -2250 }, scene: 'studio', r: 300 },
];

export const C01_ART: LessonArt = {
  ...makeGuitarArt(C01_BUILT, { zones: C01_ZONES }),
  pages: {
    sound: makeStringSoundPage(C01_BUILT),
    setting: makeStagePlanPage(C01_BUILT, { objects: C01_PLAN, stageEdgeZ: 1650, hearing: STRINGS_HEARING }),
  },
  stepCounts: { sound: 4, setting: 3 },
};
