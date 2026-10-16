/**
 * I09 XYLOPHONE — the look (charter §2 layer 3): the mallet-bar family's art
 * (shared/mallets/MalletArt) for this lesson's xylophone — rosewood bars, a
 * tan frame and tubes, tubes under only some sharps and flats on the
 * 3½-octave model — the family's own pages, and THE SETTING: the percussion
 * section of a band or orchestra on the shared plan (positions ILLUSTRATIVE).
 */
import type { MalletArt } from '../shared/mallets/family.ts';
import { malletDrawnAt, malletHitTest, malletInstrument, malletLabels } from '../shared/mallets/MalletArt';
import { malletPlanFor } from '../shared/mallets/MalletPlan';
import { XYLO_PLAN } from './plan.ts';
import { MALLET_PAGES } from '../shared/mallets/pages';
import { XYLO_FAM } from './model.ts';

export const I09_ART: MalletArt = {
  Instrument: malletInstrument(XYLO_FAM),
  labels: malletLabels(XYLO_FAM),
  hitTest: malletHitTest(XYLO_FAM),
  figureAt: malletDrawnAt(XYLO_FAM),
  pages: MALLET_PAGES,
  stepCounts: { sound: 4 },
  SettingPlan: malletPlanFor(XYLO_FAM, XYLO_PLAN),
  malletFam: XYLO_FAM,
};
