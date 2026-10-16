/**
 * A04b's WHERE IT SITS plan (LowBrassSettingPage draws it; the plans'
 * overlap test reads it): a seated euphonium player — the bell up or to the
 * front, as the lesson's variant — a music stand, a tuba player beside; a
 * main pair in the studio. Positions are a typical layout, ILLUSTRATIVE.
 */
import type { LowBrassPlanLayout } from '../shared/lowbrass/lowBrassPlanModel.ts';
import { EUPH, TUBA } from '../shared/lowbrass/lowBrassSpec.ts';

export const A04B_PLAN: LowBrassPlanLayout = {
  spec: EUPH,
  objects: [
    { id: 'euph', kind: 'self', at: { x: 0, z: 0 }, r: 400, label: 'euphonium', scene: 'all', mix: { at: { x: -450, z: -500 } } },
    { id: 'stand', kind: 'stand', at: { x: 760, z: -600 }, r: 250, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'tuba', kind: 'brass', spec: TUBA, orient: 'up', at: { x: 60, z: 1250 }, r: 500, label: 'tuba beside', short: 'tuba', scene: 'kit', mix: { at: { x: -650, z: 1300 } } },
    { id: 'main', kind: 'pair', at: { x: 2500, z: 0 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -1300, u1: 1400, v0: -1500, v1: 1900 },
  wide: { u0: -1500, u1: 3100, v0: -2100, v1: 2200 },
  cue: [{ wall: 'v0', hubAt: -1000, who: ['player', 'tuba'] }],
};
