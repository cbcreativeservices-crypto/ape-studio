/**
 * C09b's WHERE IT SITS plan (BowedSettingPage draws it; the plans' overlap
 * test reads it): a violist standing, a music stand in front clear of the
 * bow's sweep, a violin on one side and a cello on the other; the main pair
 * in the studio, and each player's headphone mixer fed from the CONTROL ROOM.
 * Positions are a typical layout, ILLUSTRATIVE.
 */
import type { BowedPlanLayout } from '../shared/bowed/bowedPlanModel.ts';
import { seated, underChin } from '../shared/bowed/posture.ts';
import { CELLO, VIOLIN } from '../shared/bowed/bowedSpec.ts';
import { STANDING } from './geometry.ts';

// The neighbours on the plan: a violin and a cello (the same family's art).
const VIOLIN_P = underChin(VIOLIN, 0, true);
const CELLO_P = seated(CELLO);

export const C09B_PLAN: BowedPlanLayout = {
  P: STANDING,
  objects: [
    { id: 'viola', kind: 'self', at: { x: 0, z: 0 }, r: 270, label: 'viola', scene: 'all' },
    { id: 'bow', kind: 'self', at: { x: STANDING.bow.frog.x + 120, z: STANDING.bow.frog.z + 120 }, r: 200, label: 'bow', scene: 'kit' },
    { id: 'head', kind: 'self', at: { x: STANDING.player.head.x, z: STANDING.player.head.z }, r: 120, label: 'head', scene: 'kit' },
    { id: 'stand', kind: 'stand', at: { x: 980, z: -380 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'violin', kind: 'bowed', posture: VIOLIN_P, at: { x: 300, z: -1350 }, yaw: 35, r: 380, label: 'violin', scene: 'kit' },
    { id: 'cello', kind: 'bowed', posture: CELLO_P, at: { x: 350, z: 1150 }, yaw: -35, r: 420, label: 'cello', scene: 'kit' },
    { id: 'main', kind: 'pair', at: { x: 2550, z: 300 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -1200, u1: 1900, v0: -2000, v1: 1900 },
  wide: { u0: -2000, u1: 3200, v0: -2100, v1: 2000 },
  cue: {
    wall: 'u0',
    hubAt: 0,
    spots: {
      self: { at: { x: -750, z: -100 } },
      violin: { at: { x: -500, z: -1500 } },
      cello: { at: { x: -600, z: 1300 } },
    },
  },
};
