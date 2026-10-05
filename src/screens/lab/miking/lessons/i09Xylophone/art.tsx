/**
 * I09 XYLOPHONE — the look (charter §2 layer 3): the mallet-bar family's art
 * (shared/mallets/MalletArt) for this lesson's xylophone — rosewood bars, a
 * tan frame and tubes, tubes under only some sharps and flats on the
 * 3½-octave model — the family's own pages, and THE SETTING: the percussion
 * section of a band or orchestra on the shared plan (positions ILLUSTRATIVE).
 */
import type { MalletArt } from '../shared/mallets/family.ts';
import { malletHitTest, malletInstrument, malletLabels } from '../shared/mallets/MalletArt';
import { malletPlanFor, type MalletPlanSpec } from '../shared/mallets/MalletPlan';
import { MALLET_PAGES } from '../shared/mallets/pages';
import { XYLO_FAM } from './model.ts';

export const XYLO_PLAN: MalletPlanSpec = {
  box: { u0: -2700, u1: 3300, v0: -2600, v1: 2600 },
  things: [
    { id: 'xylo', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'perc', kind: 'perc', u: -1300, v: -1900, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1500, v: 1800, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1300, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -2200, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2500, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
};

export const I09_ART: MalletArt = {
  Instrument: malletInstrument(XYLO_FAM),
  labels: malletLabels(XYLO_FAM),
  hitTest: malletHitTest(XYLO_FAM),
  pages: MALLET_PAGES,
  stepCounts: { sound: 4 },
  SettingPlan: malletPlanFor(XYLO_FAM, XYLO_PLAN),
  malletFam: XYLO_FAM,
};
