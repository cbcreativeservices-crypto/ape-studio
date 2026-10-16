/**
 * A05a's WHERE IT SITS plan (SaxSettingPage draws it; the plans' overlap
 * test reads it): a standing soprano player in a saxophone section — an alto
 * on one side and a tenor on the other — a music stand, the rhythm section's
 * drums behind; a main pair in the studio. Positions are a typical layout,
 * ILLUSTRATIVE.
 */
import type { SaxPlanLayout } from '../shared/sax/saxPlanModel.ts';
import { ALTO, TENOR } from '../shared/sax/saxSpec.ts';
import { saxPosture } from '../shared/sax/saxPosture.ts';

const ALTO_P = saxPosture(ALTO, 'standing');
const TENOR_P = saxPosture(TENOR, 'standing');

export const A05A_PLAN: SaxPlanLayout = {
  objects: [
    { id: 'sax', kind: 'self', at: { x: 200, z: 0 }, r: 300, label: 'soprano', scene: 'all', mix: { at: { x: -650, z: 0 } } },
    { id: 'stand', kind: 'stand', at: { x: 860, z: -580 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
    { id: 'n1', kind: 'sax', posture: ALTO_P, at: { x: -60, z: -950 }, r: 400, label: 'alto', scene: 'kit', mix: { at: { x: -650, z: -950 } } },
    { id: 'n2', kind: 'sax', posture: TENOR_P, at: { x: -60, z: 900 }, r: 420, label: 'tenor', scene: 'kit', mix: { at: { x: -650, z: 900 } } },
    { id: 'kit', kind: 'kit', at: { x: -1800, z: -300 }, r: 700, label: 'drums', scene: 'kit', mix: { at: { x: -2550, z: 520 } } },
    { id: 'main', kind: 'pair', at: { x: 1450, z: 150 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
  ],
  near: { u0: -2950, u1: 1300, v0: -1450, v1: 1500 },
  wide: { u0: -3000, u1: 1900, v0: -1550, v1: 1900 },
  cue: [
    { wall: 'v0', hubAt: 0, layout: 'row', rowSide: -1, who: ['n1', 'player', 'n2'] },
    { id: 'drums', wall: 'u0', hubAt: 520, hubLabel: null, who: ['kit'] },
  ],
};
