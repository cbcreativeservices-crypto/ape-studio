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
import { malletPlanFor, type MalletPlanSpec } from '../shared/mallets/MalletPlan';
import { MALLET_PAGES } from '../shared/mallets/pages';
import { VIBE_FAM } from './model.ts';

/** The plan (u → the audience, v down; mm): the vibraphone, a drum kit and
 *  a bass amp beside it, a piano, a wedge in front of the player, a side
 *  fill on stage left — the two monitors the Studio-or-live page uses. */
export const VIBE_PLAN: MalletPlanSpec = {
  box: { u0: -2700, u1: 3300, v0: -2900, v1: 2700 },
  things: [
    { id: 'vibe', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1500, v: -1900, scene: 'all' },
    { id: 'bass', kind: 'amp', u: -1700, v: 1500, face: 0, scene: 'all' },
    { id: 'piano', kind: 'keys', u: -400, v: 1950, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1300, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -2400, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2600, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
};

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
