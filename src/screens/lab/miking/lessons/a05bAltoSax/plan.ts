/**
 * A05b's WHERE IT SITS plan (SaxSettingPage draws it; the plans' overlap
 * test reads it): a standing alto player in a saxophone section — a tenor on
 * one side and a second alto on the other — a music stand, the rhythm
 * section's drums behind; a main pair in the studio. Positions are a typical
 * layout, ILLUSTRATIVE.
 */
import type { SaxPlanLayout } from '../shared/sax/saxPlanModel.ts';
import { ALTO, TENOR } from '../shared/sax/saxSpec.ts';
import { saxPosture } from '../shared/sax/saxPosture.ts';

const TENOR_P = saxPosture(TENOR, 'standing');
const ALTO2 = saxPosture(ALTO, 'standing');

export const A05B_PLAN: SaxPlanLayout = {
  objects: [
    { id: 'sax', kind: 'self', at: { x: 80, z: 120 }, r: 300, label: 'alto', scene: 'all', mix: { at: { x: -650, z: 100 } } },
    { id: 'stand', kind: 'stand', at: { x: 760, z: -580 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'n1', kind: 'sax', posture: TENOR_P, at: { x: 40, z: -900 }, r: 420, label: 'tenor', scene: 'kit', mix: { at: { x: -650, z: -900 } } },
    { id: 'n2', kind: 'sax', posture: ALTO2, at: { x: 60, z: 1000 }, r: 380, label: 'alto 2', scene: 'kit', mix: { at: { x: -650, z: 1000 } } },
    { id: 'kit', kind: 'kit', at: { x: -1800, z: -300 }, r: 700, label: 'drums', scene: 'kit', mix: { at: { x: -2550, z: 520 } } },
    { id: 'main', kind: 'pair', at: { x: 1450, z: 250 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -2950, u1: 1300, v0: -1450, v1: 1560 },
  wide: { u0: -3000, u1: 1900, v0: -1550, v1: 1900 },
  cue: [
    { wall: 'v0', hubAt: 0, layout: 'row', rowSide: -1, who: ['n1', 'player', 'n2'] },
    { id: 'drums', wall: 'u0', hubAt: 520, hubLabel: null, who: ['kit'] },
  ],
};
