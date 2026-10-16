/**
 * A01's WHERE IT SITS plan (BrassSettingPage draws it; the plans' overlap
 * test reads it): a trumpet in a horn section — a second trumpet and a
 * trombone along the row, a singer at a mic, the drum kit behind; the main
 * pair in the studio. Positions are a typical layout, ILLUSTRATIVE.
 */
import type { BrassPlanLayout } from '../shared/brass/brassPlanModel.ts';
import { slidePose, valvedPose } from '../shared/brass/brassPosture.ts';
import { TENOR, TRUMPET } from '../shared/brass/brassSpec.ts';
import { TP } from './geometry.ts';

// The neighbours on the plan: a second trumpet and a trombone (the same family's art).
const TP2 = valvedPose(TRUMPET);
const TB_N = slidePose(TENOR);

export const A01_PLAN: BrassPlanLayout = {
  P: TP,
  objects: [
    { id: 'horn', kind: 'self', at: { x: 0, z: 0 }, r: 250, label: 'trumpet', scene: 'all', mix: { at: { x: -470, z: -545 } } },
    { id: 'stand', kind: 'stand', at: { x: 380, z: -700 }, yaw: 180, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'tp2', kind: 'brass', pose: TP2, at: { x: 40, z: 820 }, yaw: 0, r: 420, label: 'second trumpet', short: 'trumpet 2', scene: 'kit', mix: { at: { x: -1000, z: 700 } } },
    { id: 'tb', kind: 'brass', pose: TB_N, at: { x: -150, z: 1500 }, yaw: 0, r: 380, label: 'trombone', scene: 'kit', mix: { at: { x: -1250, z: 1450 } } },
    { id: 'singer', kind: 'singer', at: { x: 800, z: -1400 }, yaw: 0, r: 300, label: 'singer at a mic', short: 'singer', scene: 'kit', mix: { at: { x: 400, z: -1500 } } },
    { id: 'kit', kind: 'kit', at: { x: -2200, z: 300 }, yaw: 0, r: 950, label: 'drum kit', short: 'drums', scene: 'kit', mix: { at: { x: -3250, z: -550 } } },
    { id: 'main', kind: 'pair', at: { x: 2100, z: 600 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -3400, u1: 2350, v0: -1850, v1: 2050 },
  wide: { u0: -3500, u1: 3300, v0: -2200, v1: 2200 },
  cue: [{ wall: 'v0', hubAt: -2000, who: ['player', 'tp2', 'tb', 'singer', 'kit'] }],
};
