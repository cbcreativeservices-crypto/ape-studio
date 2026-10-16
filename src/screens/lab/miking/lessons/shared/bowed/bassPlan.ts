/**
 * C06a / C06b's WHERE IT SITS plan (BowedSettingPage draws it; the plans'
 * overlap test reads it): a bass in a jazz trio — the drummer at the kit to
 * the bassist's right, the pianist at the grand piano to the left, clear of
 * the bow's sweep. STUDIO: each of the three a headphone mixer, fed from the
 * CONTROL ROOM on the left wall. Positions are a typical layout, ILLUSTRATIVE.
 */
import type { BowedPlanLayout, PlanObject } from './bowedPlanModel.ts';
import { BASS_A, BASS_BOW, BASS_PLUCK } from './bass.ts';
import type { BassKind } from './bassWords.ts';

/** The drum kit to the bassist's right, the piano to the left (a typical trio). */
export const BASS_KIT_AT = { x: 250, z: 1300 };
export const BASS_PIANO_AT = { x: -250, z: -2350 };

export function bassPlan(kind: BassKind): BowedPlanLayout {
  const bowed = kind === 'bow';
  const P = bowed ? BASS_BOW : BASS_PLUCK;
  const hands = bowed ? { x: P.bow.frog.x, z: P.bow.frog.z } : { x: P.player.handR.x, z: P.player.handR.z };
  const objects: PlanObject[] = [
    { id: 'bass', kind: 'self', at: { x: BASS_A.bridgeTop.x, z: BASS_A.bridgeTop.z }, r: 360, label: 'bass', scene: 'all' },
    { id: 'hands', kind: 'self', at: hands, r: 170, label: bowed ? 'bow' : 'hands', scene: 'kit' },
    { id: 'endpin', kind: 'self', at: { x: P.endpinTip!.x, z: P.endpinTip!.z }, r: 150, label: 'endpin', scene: 'kit' },
    { id: 'drums', kind: 'kit', at: BASS_KIT_AT, yaw: -90, r: 650, label: 'drum kit', short: 'drums', scene: 'kit' },
    { id: 'piano', kind: 'piano', at: BASS_PIANO_AT, r: 650, label: 'piano', scene: 'kit' },
  ];
  return {
    P,
    hands: kind,
    objects,
    near: { u0: -1500, u1: 2100, v0: -2450, v1: 2450 },
    wide: { u0: -1600, u1: 3700, v0: -2650, v1: 2650 },
    cue: {
      wall: 'u0',
      hubAt: 0,
      spots: {
        self: { at: { x: -760, z: 350 } },
        'drums:drummer': { at: { x: -650, z: 2200 } },
        'piano:pianist': { at: { x: -650, z: -2200 } },
      },
    },
  };
}
