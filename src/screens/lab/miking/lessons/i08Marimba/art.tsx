/**
 * I08 MARIMBA — the look (charter §2 layer 3): the mallet-bar family's art
 * (shared/mallets/MalletArt) for this lesson's marimba — rosewood bars over
 * dark pipes, the wide boxes under the lowest notes — the family's own
 * pages, and THE SETTING: a percussion ensemble on the shared band plan
 * (positions ILLUSTRATIVE).
 */
import type { MalletArt } from '../shared/mallets/family.ts';
import { malletDrawnAt, malletHitTest, malletInstrument, malletLabels } from '../shared/mallets/MalletArt';
import { malletPlanFor } from '../shared/mallets/MalletPlan';
import { MARIMBA_PLAN } from './plan.ts';
import { MALLET_PAGES } from '../shared/mallets/pages';
import { MARIMBA_FAM } from './model.ts';

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
