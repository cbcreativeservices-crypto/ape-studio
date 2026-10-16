/**
 * A02's WHERE IT SITS plan (BrassSettingPage draws it; the plans' overlap
 * test reads it): a trombone in a horn section — a second trombone and a
 * trumpet along the row, the drum kit behind; the main pair in the studio.
 * Positions are a typical layout, ILLUSTRATIVE.
 */
import type { BrassPlanLayout } from '../shared/brass/brassPlanModel.ts';
import { slidePose, valvedPose } from '../shared/brass/brassPosture.ts';
import { TENOR, TRUMPET } from '../shared/brass/brassSpec.ts';
import { TB } from './geometry.ts';

// The neighbours on the plan: a second trombone and a trumpet (the same family's art).
const TB2 = slidePose(TENOR);
const TP_N = valvedPose(TRUMPET);

export const A02_PLAN: BrassPlanLayout = {
  P: TB,
  objects: [
    { id: 'horn', kind: 'self', at: { x: 0, z: 0 }, r: 250, label: 'trombone', scene: 'all', mix: { at: { x: -950, z: -100 } } },
    { id: 'stand', kind: 'stand', at: { x: 330, z: -700 }, yaw: 180, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'tb2', kind: 'brass', pose: TB2, at: { x: 40, z: 1000 }, yaw: 0, r: 460, label: 'second trombone', short: 'trombone 2', scene: 'kit', mix: { at: { x: -950, z: 1000 } } },
    { id: 'tp', kind: 'brass', pose: TP_N, at: { x: 0, z: -1650 }, yaw: 0, r: 420, label: 'trumpet', scene: 'kit', mix: { at: { x: -950, z: -1750 } } },
    { id: 'kit', kind: 'kit', at: { x: -2200, z: 300 }, yaw: 0, r: 950, label: 'drum kit', short: 'drums', scene: 'kit', mix: { at: { x: -3050, z: -550 } } },
    { id: 'main', kind: 'pair', at: { x: 2200, z: 300 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -3400, u1: 2450, v0: -2100, v1: 1700 },
  wide: { u0: -3500, u1: 3300, v0: -2300, v1: 2100 },
  cue: [
    { wall: 'v0', hubAt: 0, layout: 'row', rowSide: -1, who: ['tp', 'player', 'tb2'] },
    { id: 'drums', wall: 'u0', hubAt: -550, hubLabel: null, who: ['kit'] },
  ],
};
