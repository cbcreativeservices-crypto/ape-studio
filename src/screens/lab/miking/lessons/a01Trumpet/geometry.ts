/**
 * A01 TRUMPET AND FLUGELHORN — where things are (charter §2 layer 2): the
 * shared brass family's trumpet and flugelhorn rows (lessons/shared/brass/
 * brassSpec.ts) in the player's standing hold (brassPosture.ts: lips 1550
 * mm up, the bell level for the trumpet, dipped 10° for the flugelhorn — a
 * drawing default). One model, the instrument as the variant: the
 * flugelhorn's bell is the larger and dipped, so its bell surface, axis and
 * rim are its own (`bell.flugelhorn`).
 */
import type { InstrumentModel, ViewBox } from '../../engine/model/types.ts';
import { brassModel, mergeBrass } from '../shared/brass/brassModel.ts';
import { valvedPose } from '../shared/brass/brassPosture.ts';
import { FLUGELHORN, TRUMPET } from '../shared/brass/brassSpec.ts';

export const TP = valvedPose(TRUMPET);
export const FH = valvedPose(FLUGELHORN);

/** The views: the player at the left, the bell firing to the right, room in
 *  front for the farther starting points (stage aspect ≈ 1.45). */
const TP_VIEWS: { side: ViewBox; top: ViewBox } = {
  side: { u0: -780, u1: 1300, v0: -740, v1: 695 },
  top: { u0: -780, u1: 1300, v0: -720, v1: 715 },
};
const FH_VIEWS: { side: ViewBox; top: ViewBox } = {
  side: { u0: -780, u1: 1300, v0: -740, v1: 695 },
  top: { u0: -780, u1: 1300, v0: -720, v1: 715 },
};
export const A01_VIEWS = { trumpet: TP_VIEWS, flugelhorn: FH_VIEWS };

const VARIANTS: InstrumentModel['variants'] = [
  { id: 'trumpet', label: 'TRUMPET', blurb: 'A B♭ trumpet: a narrow tube, a bell about 12 cm across, played level.' },
  { id: 'flugelhorn', label: 'FLUGELHORN', blurb: 'A flugelhorn: a wider, more conical tube and a larger bell, about 15 cm across — often held a little lower, the bell angled down.' },
];

export const A01_MODEL: InstrumentModel = mergeBrass(
  [
    { variant: 'trumpet', model: brassModel(TP, { id: 'trumpet', name: 'trumpet', views: TP_VIEWS, variants: VARIANTS }) },
    { variant: 'flugelhorn', model: brassModel(FH, { id: 'flugelhorn', name: 'flugelhorn', views: FH_VIEWS, variants: VARIANTS }) },
  ],
  { trumpet: TP_VIEWS, flugelhorn: FH_VIEWS },
);
