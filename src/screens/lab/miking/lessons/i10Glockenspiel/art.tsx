/**
 * I10 GLOCKENSPIEL — the look (charter §2 layer 3): the mallet-bar family's
 * art (shared/mallets/MalletArt) for this lesson's glockenspiel — bright
 * steel bars, short tubes, the gas-spring legs and the damper pedal; or the
 * case model on its table with the lid open — the family's own pages, and
 * THE SETTING: the percussion section on the shared plan (ILLUSTRATIVE).
 *
 * The CLOSE EXAMPLE (model.ts CLOSE_EXAMPLE: one mic 4–6 in above the bars)
 * is drawn as a red band over the played bars, under the mallets' hatched
 * travel: the conflict the lesson teaches, never a place a mic can rest.
 */
import type { ReactElement } from 'react';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import type { MalletArt } from '../shared/mallets/family.ts';
import { ConflictBand, malletHitTest, malletInstrument, malletLabels } from '../shared/mallets/MalletArt';
import { malletPlanFor, type MalletPlanSpec } from '../shared/mallets/MalletPlan';
import { MALLET_PAGES } from '../shared/mallets/pages';
import { CLOSE_EXAMPLE, GLOCK_FAM } from './model.ts';
import { GLOCK_GEOM } from './geometry.ts';

export const GLOCK_PLAN: MalletPlanSpec = {
  box: { u0: -2400, u1: 3000, v0: -2300, v1: 2300 },
  things: [
    { id: 'glock', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'perc', kind: 'perc', u: -1200, v: -1600, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1300, v: 1650, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1100, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -1900, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2200, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
};

const Base = malletInstrument(GLOCK_FAM);
const baseLabels = malletLabels(GLOCK_FAM);

function GlockInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  const L = GLOCK_GEOM.layouts[variant] ?? GLOCK_GEOM.layouts[GLOCK_FAM.variants[0].row.id];
  return (
    <>
      <Base view={view} variant={variant} />
      <ConflictBand view={view} u0={L.span.lo} u1={L.span.hi} y0={L.yNat - CLOSE_EXAMPLE.max} y1={L.yNat - CLOSE_EXAMPLE.min} z0={L.zNat} z1={L.zAcc} />
    </>
  );
}

function glockLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const L = GLOCK_GEOM.layouts[variant] ?? GLOCK_GEOM.layouts[GLOCK_FAM.variants[0].row.id];
  const out = baseLabels(view, variant).filter((l) => l.id !== 'bars');
  if (view === 'side') out.push({ id: 'close', text: 'CLOSE 10–15 cm: INSIDE THE MALLETS’ PATH', short: 'CLOSE: IN MALLET PATH', u: 0, v: L.yNat - CLOSE_EXAMPLE.max - 70, align: 'center', tone: 'muted' });
  return out;
}

export const I10_ART: MalletArt = {
  Instrument: GlockInstrument,
  labels: glockLabels,
  hitTest: malletHitTest(GLOCK_FAM),
  pages: MALLET_PAGES,
  stepCounts: { sound: 4 },
  SettingPlan: malletPlanFor(GLOCK_FAM, GLOCK_PLAN),
  malletFam: GLOCK_FAM,
};
