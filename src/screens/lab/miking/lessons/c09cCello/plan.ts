/**
 * C09c's WHERE IT SITS plan (BowedSettingPage draws it; the plans' overlap
 * test reads it): a cellist seated, a music stand in front, a viola and a
 * violin beside; the main pair in the studio, and each player's headphone
 * mixer fed from the CONTROL ROOM on the top wall. Positions are a typical
 * layout, ILLUSTRATIVE.
 */
import type { BowedPlanLayout } from '../shared/bowed/bowedPlanModel.ts';
import { underChin } from '../shared/bowed/posture.ts';
import { VIOLA, VIOLIN } from '../shared/bowed/bowedSpec.ts';
import { POSTURE as P } from './model.ts';

/** Neighbours on the plan: a viola and a violin of the same family, a stand. */
const VIOLA_P = underChin(VIOLA, 20);
const VIOLIN_P = underChin(VIOLIN);

export const C09C_PLAN: BowedPlanLayout = {
  P,
  objects: [
    { id: 'cello', kind: 'self', at: { x: 0, z: 0 }, r: 300, label: 'cello', scene: 'all' },
    { id: 'bow', kind: 'self', at: { x: P.bow.frog.x, z: P.bow.frog.z }, r: 160, label: 'bow', scene: 'kit' },
    { id: 'endpin', kind: 'self', at: { x: P.endpinTip!.x, z: P.endpinTip!.z }, r: 140, label: 'endpin', scene: 'kit' },
    { id: 'stand', kind: 'stand', at: { x: 760, z: -420 }, yaw: 160, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'viola', kind: 'bowed', posture: VIOLA_P, at: { x: 0, z: 1300 }, yaw: -40, r: 380, label: 'viola', scene: 'kit' },
    { id: 'violin', kind: 'bowed', posture: VIOLIN_P, at: { x: 1950, z: 1250 }, yaw: -95, r: 380, label: 'violin', scene: 'kit' },
    { id: 'main', kind: 'pair', at: { x: 2600, z: 250 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -1300, u1: 2400, v0: -950, v1: 1850 },
  wide: { u0: -2000, u1: 3200, v0: -1500, v1: 2000 },
  cue: {
    wall: 'u0',
    hubAt: 400,
    spots: {
      self: { at: { x: -900, z: 0 } },
      viola: { at: { x: -650, z: 1450 } },
      violin: { at: { x: 2600, z: 1300 }, via: [{ x: 2600, z: 1800 }] },
    },
  },
};
