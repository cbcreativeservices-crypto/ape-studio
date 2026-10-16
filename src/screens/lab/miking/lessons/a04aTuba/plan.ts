/**
 * A04a's WHERE IT SITS plan (LowBrassSettingPage draws it; the plans'
 * overlap test reads it): a seated tuba player — the bell up or to the
 * front, as the lesson's variant — a music stand, a euphonium player beside;
 * a main pair in the studio. Positions are a typical layout, ILLUSTRATIVE.
 */
import type { LowBrassPlanLayout } from '../shared/lowbrass/lowBrassPlanModel.ts';
import { EUPH, TUBA } from '../shared/lowbrass/lowBrassSpec.ts';

export const A04A_PLAN: LowBrassPlanLayout = {
  spec: TUBA,
  objects: [
    { id: 'tuba', kind: 'self', at: { x: 0, z: 0 }, r: 420, label: 'tuba', scene: 'all', mix: { at: { x: -450, z: -500 } } },
    { id: 'stand', kind: 'stand', at: { x: 760, z: -600 }, r: 250, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'euph', kind: 'brass', spec: EUPH, orient: 'up', at: { x: 60, z: -1400 }, r: 480, label: 'euphonium beside', short: 'euphonium', scene: 'kit', mix: { at: { x: -750, z: -1700 } } },
    { id: 'main', kind: 'pair', at: { x: 2500, z: 0 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -1300, u1: 1400, v0: -1800, v1: 1500 },
  wide: { u0: -1500, u1: 3100, v0: -2200, v1: 2000 },
  cue: [{ wall: 'v0', hubAt: -1000, who: ['player', 'euph'] }],
};
