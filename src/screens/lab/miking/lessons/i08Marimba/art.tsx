/**
 * I08 MARIMBA — the look (charter §2 layer 3): the mallet-bar family's art
 * (shared/mallets/MalletArt) for this lesson's marimba — rosewood bars over
 * dark pipes, the wide boxes under the lowest notes — the family's own
 * pages, and THE SETTING: a percussion ensemble on the shared band plan
 * (positions ILLUSTRATIVE).
 */
import type { MalletArt } from '../shared/mallets/family.ts';
import { malletDrawnAt, malletHitTest, malletInstrument, malletLabels } from '../shared/mallets/MalletArt';
import { malletPlanFor, type MalletPlanSpec } from '../shared/mallets/MalletPlan';
import { MALLET_PAGES } from '../shared/mallets/pages';
import { MARIMBA_FAM } from './model.ts';

export const MARIMBA_PLAN: MalletPlanSpec = {
  box: { u0: -3000, u1: 3400, v0: -3300, v1: 3100 },
  things: [
    { id: 'marimba', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'perc', kind: 'perc', u: -1500, v: -2300, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1700, v: 2200, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1500, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -2800, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2700, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
};

export const I08_ART: MalletArt = {
  Instrument: malletInstrument(MARIMBA_FAM),
  labels: malletLabels(MARIMBA_FAM),
  hitTest: malletHitTest(MARIMBA_FAM),
  figureAt: malletDrawnAt(MARIMBA_FAM),
  pages: MALLET_PAGES,
  stepCounts: { sound: 4 },
  SettingPlan: malletPlanFor(MARIMBA_FAM, MARIMBA_PLAN),
  malletFam: MARIMBA_FAM,
};
