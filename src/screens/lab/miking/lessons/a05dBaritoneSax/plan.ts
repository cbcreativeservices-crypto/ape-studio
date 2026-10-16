/**
 * A05d's WHERE IT SITS plan (SaxSettingPage draws it; the plans' overlap
 * test reads it): a standing baritone player in a saxophone section — a
 * tenor and an alto along the row — a music stand, the rhythm section's
 * drums behind; a main pair in the studio. Positions are a typical layout,
 * ILLUSTRATIVE.
 */
import type { SaxPlanLayout } from '../shared/sax/saxPlanModel.ts';
import { ALTO, TENOR } from '../shared/sax/saxSpec.ts';
import { saxPosture } from '../shared/sax/saxPosture.ts';

const TENOR_P = saxPosture(TENOR, 'standing');
const ALTO_P = saxPosture(ALTO, 'standing');

export const A05D_PLAN: SaxPlanLayout = {
  objects: [
    { id: 'sax', kind: 'self', at: { x: 80, z: 160 }, r: 360, label: 'baritone', scene: 'all', mix: { at: { x: -650, z: 150 } } },
    { id: 'stand', kind: 'stand', at: { x: 900, z: -450 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'n1', kind: 'sax', posture: TENOR_P, at: { x: 40, z: -1000 }, r: 400, label: 'tenor', scene: 'kit', mix: { at: { x: -650, z: -1000 } } },
    { id: 'n2', kind: 'sax', posture: ALTO_P, at: { x: 40, z: -1950 }, r: 380, label: 'alto', scene: 'kit', mix: { at: { x: -650, z: -1950 } } },
    { id: 'kit', kind: 'kit', at: { x: -1900, z: -600 }, r: 700, label: 'drums', scene: 'kit', mix: { at: { x: -2650, z: 220 } } },
    { id: 'main', kind: 'pair', at: { x: 1550, z: -400 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -3050, u1: 1400, v0: -2400, v1: 1100 },
  wide: { u0: -3100, u1: 2000, v0: -2500, v1: 1900 },
  cue: [
    { wall: 'v1', hubAt: 0, layout: 'row', rowSide: -1, who: ['n2', 'n1', 'player'] },
    { id: 'drums', wall: 'u0', hubAt: 220, hubLabel: null, who: ['kit'] },
  ],
};
