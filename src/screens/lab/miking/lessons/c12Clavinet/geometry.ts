/**
 * C12 CLAVINET — where things are (charter §2 layer 2), frame C (ampSpec.ts):
 * the amplifier the clavinet plays through. Two cabinets: an open-backed
 * combo (its chassis along the top, the tubes hanging at the back) and a
 * closed 1×12 cabinet driven by a separate amplifier. The speaker itself
 * (cone, dust cap) sits behind the grille; the cabinet is the solid a mic
 * may not enter, with a small illustrative clearance from the grille.
 */
import type { Dim, InstrumentModel, Part, Provenance, ReferenceSurface, Shape3, VariantId } from '../../engine/model/types.ts';
import { AMP_SIZES, ampBox, dd, FLOOR_Y, FLOOR_Y_CAB, GRILLE_X, SPEAKER, type AmpBox } from './ampSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const dflt = ill('a drawing default (clavinet/GEOMETRY_PROPOSAL.md)');
const box = (b: AmpBox): Shape3 => ({ kind: 'box', min: { x: b.x0, y: b.y0, z: b.z0 }, max: { x: b.x1, y: b.y1, z: b.z1 } });

export const CLAV_CLEAR: Record<string, Dim> = {
  co: dd(5, 'clearance from the grille and the cabinet: the mic never touches them'),
  cb: dd(5, 'clearance from the grille and the cabinet'),
};

export const COMBO = ampBox('combo');
export const CAB = ampBox('cab');
const CO: VariantId[] = ['combo'];
const CB: VariantId[] = ['cab'];

const parts: Part[] = [
  { id: 'grille', label: 'grille cloth', short: 'grille', role: 'The cloth over the front of the cabinet. The speaker sits just behind it; a close mic goes right up to it — never touching it.', prov: dflt },
  { id: 'cone', label: 'speaker cone', short: 'cone', role: 'The paper cone of the 12-inch speaker. The amplifier drives it in and out, turning the clavinet’s signal back into sound — this is what the mic hears.', moving: true, prov: { kind: 'trial', src: 'CEL-V30', note: 'a 12-in speaker’s cut-out, 283 mm' } },
  { id: 'dust', label: 'dust cap', short: 'dust cap', role: 'The dome at the centre of the cone. Toward it the sound tends to be brighter; out toward the cone’s edge, rounder.', prov: { kind: 'unknown', needed: 'the dust cap’s size (drawing default)' } },
  { id: 'co.cab', label: 'cabinet', short: 'cabinet', role: 'The combo amplifier: the amplifier and the speaker in one wooden cabinet. Its back is partly open.', clearance: CLAV_CLEAR.co, variants: CO, prov: { kind: 'trial', src: 'FEN-65DR-MAN', note: 'a real open-backed 1×12 combo’s outer sizes' }, solid: box(COMBO) },
  { id: 'co.panel', label: 'control panel', short: 'controls', role: 'The amplifier’s input jack and knobs along the top front: the clavinet’s cable plugs in here (or the last pedal’s).', variants: CO, prov: dflt },
  { id: 'co.chassis', label: 'chassis and tubes', short: 'chassis', role: 'The amplifier’s chassis inside the top, with its tubes hanging down at the back: hot, and at dangerous voltages. No mic, hand or stand goes in there.', variants: CO, prov: dflt },
  { id: 'co.back', label: 'open back', short: 'open back', role: 'The combo’s back is partly open: the back of the speaker sends sound out here too, in the opposite polarity to the front.', variants: CO, prov: dflt },
  { id: 'cb.cab', label: 'cabinet', short: 'cabinet', role: 'A closed 1×12 speaker cabinet, driven by a separate amplifier: the speaker’s sound comes only from the front.', clearance: CLAV_CLEAR.cb, variants: CB, prov: { kind: 'trial', src: 'MAR-MX112', note: 'a real closed 1×12 cabinet’s sizes' }, solid: box(CAB) },
  { id: 'cb.back', label: 'closed back', short: 'closed back', role: 'The closed back panel: no rear mic position here.', variants: CB, prov: dflt },
];

const surfaces: ReferenceSurface[] = [
  { id: 'grille', partId: 'grille', label: 'the grille', point: { x: GRILLE_X, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, plus: { words: 'out from', key: 'OUT FROM' }, minus: { words: 'inside', key: 'INSIDE' } },
  { id: 'back', partId: 'co.back', label: 'the open back', point: { x: COMBO.x0, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 }, plus: { words: 'behind', key: 'BEHIND' }, minus: { words: 'inside', key: 'INSIDE' }, variants: CO },
];

export const CLAV_MODEL: InstrumentModel = {
  id: 'clavinetAmp',
  name: 'amplifier',
  parts,
  regions: [
    { id: 'r.cone', partId: 'cone', label: 'speaker', anchor: { x: -40, y: 0, z: 0 }, prov: dflt, note: 'The speaker’s cone, driven by the amplifier: the clavinet’s sound in the air starts here.' },
    { id: 'r.back', partId: 'co.back', label: 'open back', anchor: { x: -120, y: 0, z: 0 }, prov: dflt, variants: CO, note: 'The back of the cone, through the open back: the same sound in the opposite polarity.' },
  ],
  surfaces,
  lines: [{ id: 'axis', label: 'the speaker’s centre', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }],
  envelopes: [],
  variants: [
    { id: 'combo', label: 'OPEN-BACK COMBO', blurb: 'A combo amplifier: the amp and one 12-inch speaker in one cabinet, its back partly open.', phrase: 'its open back' },
    { id: 'cab', label: 'CLOSED 1×12 CABINET', blurb: 'A closed cabinet with one 12-inch speaker, driven by a separate amplifier.', phrase: 'its closed back' },
  ],
  defaultVariant: 'combo',
  views: { side: { u0: -560, u1: 560, v0: -420, v1: 230 }, top: { u0: -560, u1: 560, v0: -460, v1: 360 } },
  // The closed cabinet's speaker is centred on its baffle (the shared family's
  // 1×12): it stands 45 mm taller below the speaker, on its own floor line.
  viewsByVariant: { cab: { side: { u0: -560, u1: 560, v0: -420, v1: FLOOR_Y_CAB + 40 } } },
  aimAzLimit: 180,
  yFloor: { mm: FLOOR_Y, prov: { kind: 'illustrative', reason: 'the cabinet on the floor: 190 mm below the combo speaker’s centre (the shared combo12 layout, a drawing default)' } },
  floorByVariant: { cab: FLOOR_Y_CAB },
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  ports: { combo: null, cab: null },
};

export const SPEAKER_R = SPEAKER;
export const CAB_SIZES = AMP_SIZES;
