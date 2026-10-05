/**
 * M05 DJEMBE — where things are (charter §2 layer 2), in frame H, built from
 * model.ts. The goblet is three capped cones from one PROFILE (the upper
 * bowl, the lower bowl to the waist, the flaring foot), shared by the drawing
 * and the collision. Two setups:
 *   FLOOR   upright on the floor: the opening rests on it — nothing goes under;
 *   RAISED  upright on four foam blocks (a build default, 200 mm), the floor
 *           200 mm lower: the opening clear, a mic can go beside or under it.
 * The hands work over the player's half of the head (ILLUSTRATIVE envelope).
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { box, headCentre, headPart, ill, rimOf, src, UP, DOWN } from '../shared/handdrums/handDrumModel.ts';
import { BELLY, COP_DIST, DIAG_N, DJEMBE, DJ_DIMS as D, HEAD_Y, PROFILE, R, R_FOOT, R_OPEN, R_WAIST, SUPPORT, WAIST_Y } from './model.ts';

/** The four foam blocks of the raised setup (ILLUSTRATIVE size 70 × 70 mm). */
export const BLOCKS = [45, 135, 225, 315].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const cx = Math.cos(a) * 125;
  const cz = Math.sin(a) * 125;
  return box({ x: cx - 35, y: 0, z: cz - 35 }, { x: cx + 35, y: SUPPORT, z: cz + 35 });
});

const ring = DJEMBE.rim;
const parts: Part[] = [
  headPart(DJEMBE, 'A goat-skin head, struck with the hands: bass strokes near the centre, tones and slaps closer to the edge.', D.headClear),
  { id: 'djembe.bowl', label: 'bowl', short: 'BOWL', role: 'The carved bowl under the head. With the narrow waist and the open foot below it, the air inside sets the deep bass note.', prov: src('MEINL-HDJ500', 'Siam Oak'), solid: { kind: 'frustum', a: { x: 0, y: HEAD_Y - ring.rise, z: 0 }, b: { x: 0, y: BELLY.y, z: 0 }, ra: R + ring.t, rb: BELLY.r } },
  { id: 'djembe.bowlLow', label: 'bowl', short: 'BOWL', role: 'The carved bowl under the head.', prov: D.bowlDepth.prov, solid: { kind: 'frustum', a: { x: 0, y: BELLY.y, z: 0 }, b: { x: 0, y: WAIST_Y, z: 0 }, ra: BELLY.r, rb: R_WAIST } },
  { id: 'djembe.foot', label: 'foot', short: 'FOOT', role: 'The flaring foot below the waist, open at the bottom: a lot of the bass leaves here.', prov: D.footD.prov, solid: { kind: 'frustum', a: { x: 0, y: WAIST_Y, z: 0 }, b: { x: 0, y: 0, z: 0 }, ra: R_WAIST, rb: R_FOOT } },
  { id: 'djembe.ropes', label: 'rope tuning', short: 'ROPES', role: 'Ropes laced between two rings pull the head tight: the tuning. Clamp nothing to them.', prov: src('MEINL-HDJ500', 'Pre-stretched nylon PP ropes') },
  ...BLOCKS.map<Part>((b, i) => ({ id: `djembe.block${i + 1}`, label: 'foam support', short: 'SUPPORT', role: 'Four foam blocks lift the drum so its opening is clear of the floor — room for a mic beside or under it. Keep the stand and cable off them.', variants: ['raised'], prov: { kind: 'sourced', src: 'COPPINGER', quote: 'we set the djembe on four pieces of foam' }, solid: b })),
];

export const HANDS_BOX = box({ x: -R - 20, y: HEAD_Y - D.handsUp.mm, z: -R - 20 }, { x: 0, y: HEAD_Y - 2, z: R + 20 });

export const DJ_MODEL: InstrumentModel = {
  id: 'djembe125',
  name: 'djembe (12½ in head)',
  parts,
  regions: [
    { id: 'r.head', partId: 'djembe.head', label: 'the head', anchor: headCentre(DJEMBE), prov: D.headD.prov, note: 'The hands strike the head: the slaps, tones and the attack of the bass start here.' },
    { id: 'r.bottom', partId: 'djembe.foot', label: 'the bottom opening', anchor: { x: 0, y: 0, z: 0 }, prov: D.openingD.prov, note: 'A lot of bass resonates out of the bottom of the drum.' },
  ],
  surfaces: [
    { id: 'head', partId: 'djembe.head', label: 'the head', point: headCentre(DJEMBE), normal: UP, minus: { words: 'below', key: 'BELOW' } },
    { id: 'diag', partId: 'djembe.head', label: 'the head’s centre', point: headCentre(DJEMBE), normal: DIAG_N, minus: { words: 'behind', key: 'BEHIND' } },
    { id: 'opening', partId: 'djembe.foot', label: 'the bottom opening', point: { x: 0, y: 0, z: 0 }, normal: DOWN, minus: { words: 'above', key: 'ABOVE' } },
    { id: 'floorR', partId: 'djembe.foot', label: 'the floor', point: { x: 0, y: SUPPORT, z: 0 }, normal: UP, minus: { words: 'below', key: 'BELOW' } },
  ],
  lines: [
    { id: 'axis', label: 'the centre line', point: headCentre(DJEMBE), dir: { x: 0, y: 1, z: 0 } },
    { id: 'diag', label: 'the aim line', point: headCentre(DJEMBE), dir: DIAG_N },
  ],
  envelopes: [
    { id: 'env.hands', label: 'the player’s hands', shape: HANDS_BOX, prov: ill('the hands over the player’s half of the head, up to 30 cm above it (the geometry file’s illustrative envelope)') },
    { id: 'env.player', label: 'the player', shape: box({ x: -760, y: -1700, z: -400 }, { x: -320, y: 400, z: 400 }), prov: ill('the player behind the drum; no source gives the reach') },
  ],
  variants: [
    { id: 'floor', label: 'FLOOR', blurb: 'Upright on the floor: the opening rests on it. Nothing goes under the drum — a mic beneath a drum on the floor is not an option.' },
    { id: 'raised', label: 'RAISED', blurb: 'Upright on four foam blocks: the opening is clear of the floor, with room for a mic beside or under it.' },
  ],
  defaultVariant: 'floor',
  views: {
    side: { u0: -560, u1: 760, v0: -1120, v1: 250 },
    top: { u0: -560, u1: 760, v0: -460, v1: 460 },
  },
  yFloor: { mm: 0, prov: ill('the floor is the frame’s origin (frame H)') },
  floorByVariant: { raised: SUPPORT },
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  ports: { floor: null, raised: null },
  mountRule: { boom: 'level', fallback: { x: 1, y: 0, z: 0 }, length: 300 },
  rims: [rimOf(DJEMBE)],
  words: {
    subject: {
      floor: 'a djembe standing upright on the floor, its opening resting on it',
      raised: 'a djembe raised on four foam blocks, its opening clear of the floor',
    },
    viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
    axes: {
      x: { label: 'FRONT–BACK', blurb: 'Toward the audience (front) or toward the player (back), measured from the drum’s centre (x).', plus: 'front of', minus: 'behind', from: 'centre' },
      y: { label: 'HEIGHT', blurb: 'Up or down, measured from the drum’s foot. Distances in the bezel are read from the surface the zone names.', plus: 'below', minus: 'above', from: 'the foot' },
      z: { label: 'ACROSS', blurb: 'Toward the player’s left or right.', plus: 'right of', minus: 'left of', from: 'centre' },
    },
    where: { inside: 'inside the drum', outside: 'outside the drum' },
  },
};

/** For the tests and the art: the Coppinger line's mic point. */
export const COP_POINT = { x: DIAG_N.x * COP_DIST, y: HEAD_Y + DIAG_N.y * COP_DIST, z: 0 };
export { PROFILE, R_OPEN };
