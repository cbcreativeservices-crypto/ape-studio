/**
 * A03's WHERE IT SITS plan (LowBrassSettingPage draws it; the plans' overlap
 * test reads it): a seated horn player, the wall or shell behind, a music
 * stand, a second horn and a low-brass player beside; in the studio a piano
 * (a recital) and a main pair. Positions are a typical layout, ILLUSTRATIVE.
 */
import type { LowBrassPlanLayout } from '../shared/lowbrass/lowBrassPlanModel.ts';
import { HORN, TUBA } from '../shared/lowbrass/lowBrassSpec.ts';

export const A03_PLAN: LowBrassPlanLayout = {
  spec: HORN,
  objects: [
    { id: 'horn', kind: 'self', at: { x: 0, z: 0 }, r: 420, label: 'horn', scene: 'all', mix: { at: { x: -700, z: -400 } } },
    { id: 'wall', kind: 'wall', at: { x: -1500, z: 0 }, r: 1100, label: 'wall or shell behind', short: 'wall', scene: 'all' },
    { id: 'stand', kind: 'stand', at: { x: 880, z: -390 }, r: 250, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'horn2', kind: 'brass', spec: HORN, at: { x: 40, z: -1150 }, r: 480, label: 'second horn', short: 'horn 2', scene: 'kit', mix: { at: { x: -720, z: -1550 } } },
    { id: 'tuba', kind: 'brass', spec: TUBA, orient: 'up', at: { x: -150, z: 1300 }, r: 480, label: 'low brass beside', short: 'low brass', scene: 'kit', mix: { at: { x: -700, z: 1300 } } },
    { id: 'piano', kind: 'piano', at: { x: 2300, z: -2220 }, yaw: 180, r: 900, label: 'piano', scene: 'studio', mix: { at: { x: 2650, z: -1640 } } },
    { id: 'main', kind: 'pair', at: { x: 2500, z: 200 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -1800, u1: 1300, v0: -1800, v1: 1900 },
  wide: { u0: -1900, u1: 3100, v0: -3100, v1: 2000 },
  cue: [
    { wall: 'v0', hubAt: 0, layout: 'row', rowSide: -1, who: ['horn2', 'player', 'tuba'] },
    { id: 'piano', wall: 'u1', hubAt: -1640, hubLabel: null, who: ['piano'] },
  ],
};
