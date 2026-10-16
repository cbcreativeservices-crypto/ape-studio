/**
 * C09a's WHERE IT SITS plan (BowedSettingPage draws it; the plans' overlap
 * test reads it): a violinist standing, a music stand in front clear of the
 * bow's sweep, a second violin and a viola seated beside; the main pair in
 * the studio, and each player's headphone mixer fed from the CONTROL ROOM
 * on the top wall. Positions are a typical layout, ILLUSTRATIVE.
 */
import type { BowedPlanLayout } from '../shared/bowed/bowedPlanModel.ts';
import { underChin } from '../shared/bowed/posture.ts';
import { VIOLA } from '../shared/bowed/bowedSpec.ts';
import { SPEC, STANDING } from './geometry.ts';

// The neighbours on the plan: a second violin and a viola (the same family's art).
const VIOLA_P = underChin(VIOLA, 20, true);
const VIOLIN2_P = underChin(SPEC, 0, true);

export const C09A_PLAN: BowedPlanLayout = {
  P: STANDING,
  objects: [
    { id: 'violin', kind: 'self', at: { x: 0, z: 0 }, r: 260, label: 'violin', scene: 'all' },
    { id: 'bow', kind: 'self', at: { x: STANDING.bow.frog.x + 120, z: STANDING.bow.frog.z + 120 }, r: 200, label: 'bow', scene: 'kit' },
    { id: 'head', kind: 'self', at: { x: STANDING.player.head.x, z: STANDING.player.head.z }, r: 120, label: 'head', scene: 'kit' },
    { id: 'stand', kind: 'stand', at: { x: 980, z: -380 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'violin2', kind: 'bowed', posture: VIOLIN2_P, at: { x: 150, z: 1100 }, yaw: 0, r: 380, label: 'violin 2', scene: 'kit' },
    { id: 'viola', kind: 'bowed', posture: VIOLA_P, at: { x: 1300, z: 1030 }, yaw: -60, r: 380, label: 'viola', scene: 'kit' },
    { id: 'main', kind: 'pair', at: { x: 2550, z: 300 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -1200, u1: 2000, v0: -900, v1: 1700 },
  wide: { u0: -1400, u1: 3200, v0: -1500, v1: 1750 },
  cue: {
    wall: 'v0',
    hubAt: 400,
    spots: {
      self: { at: { x: -820, z: -380 } },
      violin2: { at: { x: -620, z: 1150 } },
      viola: { at: { x: 2100, z: 1200 } },
    },
  },
};
