/**
 * I07 VIBRAPHONE — the look (charter §2 layer 3): the mallet-bar family's
 * art (shared/mallets/MalletArt) for this lesson's vibraphone — satin bars
 * over anodised tubes, the fan shafts at the tube tops, the motor under the
 * low end, the felt damper and its pedal — the family's own pages, and THE
 * SETTING: a small jazz group on the shared band plan (positions
 * ILLUSTRATIVE).
 */
import type { MalletArt } from '../shared/mallets/family.ts';
import { malletDrawnAt, malletHitTest, malletInstrument, malletLabels } from '../shared/mallets/MalletArt';
import { malletPlanFor } from '../shared/mallets/MalletPlan';
import { VIBE_PLAN } from './plan.ts';
import { MALLET_PAGES } from '../shared/mallets/pages';
import { VIBE_FAM } from './model.ts';

export const I07_ART: MalletArt = {
  Instrument: malletInstrument(VIBE_FAM),
  labels: malletLabels(VIBE_FAM),
  hitTest: malletHitTest(VIBE_FAM),
  figureAt: malletDrawnAt(VIBE_FAM),
  pages: MALLET_PAGES,
  // HOW IT SOUNDS has the fans as a fourth rack step.
  stepCounts: { sound: 5 },
  SettingPlan: malletPlanFor(VIBE_FAM, VIBE_PLAN),
  malletFam: VIBE_FAM,
};
