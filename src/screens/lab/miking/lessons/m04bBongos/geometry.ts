/**
 * M04b BONGOS — where things are (charter §2 layer 2), in frame H
 * (handDrumModel.ts), built from model.ts. Two setups:
 *   KNEES  a seated player holds the pair between the knees (heads 560 mm up,
 *          a drawing default): the thighs and lower legs are keep-out
 *          envelopes (ILLUSTRATIVE);
 *   STAND  the pair on a stand (heads 900 mm up, a drawing default): the
 *          floor moves 340 mm down; a column and three legs under the
 *          centre block (ILLUSTRATIVE), a standing player.
 * The hands work over each head "from the front, rear or either side" (the
 * lesson): each head carries a 250 mm hand envelope straight above it.
 */
import type { InstrumentModel, Part, Shape3, Vec3 } from '../../engine/model/types.ts';
import { axisLine, box, headCentre, headPart, headSurface, ill, rimOf, shellPart, src, UP } from '../shared/handdrums/handDrumModel.ts';
import { BETWEEN, BONGO_DIMS as D, HEAD_Y, HEMBRA, MACHO, STAND_FLOOR } from './model.ts';

export const DRUMS = [MACHO, HEMBRA] as const;
const BLOCK_Y0 = HEAD_Y + 22;
const BLOCK_Y1 = MACHO.bottomY - 8;

/** The stand under the centre block (ILLUSTRATIVE). */
export const STAND = (() => {
  const top: Vec3 = { x: 0, y: BLOCK_Y1, z: 0 };
  const hub: Vec3 = { x: 0, y: STAND_FLOOR - 160, z: 0 };
  const legs = [Math.PI / 3, Math.PI, (5 * Math.PI) / 3].map((a) => ({ a: hub, b: { x: Math.cos(a) * 280, y: STAND_FLOOR, z: Math.sin(a) * 280 } as Vec3 }));
  return { top, hub, legs };
})();

const handCyl = (d: (typeof DRUMS)[number]): Shape3 => ({ kind: 'frustum', a: { x: d.c.x, y: d.headY - 2, z: d.c.z }, b: { x: d.c.x, y: d.headY - D.handsUp.mm, z: d.c.z }, ra: d.R, rb: d.R });

/** The seated player's thighs and lower legs either side of the pair (ILLUSTRATIVE). */
export const LEGS = {
  thighL: box({ x: -560, y: -540, z: MACHO.c.z - MACHO.R - 130 }, { x: 40, y: -390, z: MACHO.c.z - MACHO.R - 10 }),
  thighR: box({ x: -560, y: -540, z: HEMBRA.c.z + HEMBRA.R + 10 }, { x: 40, y: -390, z: HEMBRA.c.z + HEMBRA.R + 130 }),
  shinL: box({ x: -30, y: -470, z: MACHO.c.z - MACHO.R - 130 }, { x: 110, y: 0, z: MACHO.c.z - MACHO.R - 10 }),
  shinR: box({ x: -30, y: -470, z: HEMBRA.c.z + HEMBRA.R + 10 }, { x: 110, y: 0, z: HEMBRA.c.z + HEMBRA.R + 130 }),
};

const ROLE = {
  macho: 'The smaller drum, the higher register — on the player’s left here. Rawhide, played with the fingers and hands.',
  hembra: 'The larger drum, the lower register — on the player’s right here.',
} as const;
const SHELL_ROLE = 'A short wooden shell, open at the bottom. The open lower ends and the player’s legs or stand shape part of the sound.';

const parts: Part[] = [
  ...DRUMS.flatMap((d) => [headPart(d, ROLE[d.id as 'macho' | 'hembra'], D.headClear), shellPart(d, SHELL_ROLE)]),
  {
    id: 'bongo.block',
    label: 'centre block',
    short: 'BLOCK',
    role: 'The block that joins the two drums. Clamp nothing to it unless the mount is made for it and the owner agrees.',
    prov: src('LP-GEN2', 'reinforced center block'),
    solid: box({ x: -42, y: BLOCK_Y0, z: MACHO.c.z + MACHO.R }, { x: 42, y: BLOCK_Y1, z: HEMBRA.c.z - HEMBRA.R }),
  },
  { id: 'bongo.stand', label: 'bongo stand', short: 'STAND', role: 'A stand holds the pair for a standing player. Its legs and the floor around them are no place for a mic stand’s base or a cable.', variants: ['stand'], prov: ill('a generic bongo stand; no source gives its size'), solid: { kind: 'capsule', a: STAND.top, b: STAND.hub, r: 13 } },
  // A seated player's legs either side of the pair (KNEES): drawn as legs, and solid to a mic or stand.
  ...(['thighL', 'thighR', 'shinL', 'shinR'] as const).map<Part>((k) => ({ id: `player.${k}`, label: 'the player’s legs', short: 'LEGS', role: 'The player’s knees hold the pair; the legs change position while playing. Leave them room — no stand, boom or cable against them.', variants: ['knees'], prov: ill('a seated player’s legs either side of the pair; no source gives them'), solid: LEGS[k] })),
  ...STAND.legs.map<Part>((l, i) => ({ id: `bongo.leg${i + 1}`, label: 'bongo stand', short: 'STAND', role: 'A stand holds the pair for a standing player.', variants: ['stand'], prov: ill('a generic bongo stand; no source gives its size'), solid: { kind: 'capsule', a: l.a, b: l.b, r: 10 } })),
];

export const BONGO_MODEL: InstrumentModel = {
  id: 'bongoPair',
  name: 'pair of bongos (7¼ and 8⅝ in)',
  parts,
  regions: [
    { id: 'r.macho', partId: 'macho.head', label: 'the macho head', anchor: headCentre(MACHO), prov: D.machoD.prov, note: 'The smaller head: the higher, brighter voice of the pair.' },
    { id: 'r.hembra', partId: 'hembra.head', label: 'the hembra head', anchor: headCentre(HEMBRA), prov: D.hembraD.prov, note: 'The larger head: the lower voice of the pair.' },
    { id: 'r.bottom', partId: 'hembra.shell', label: 'the open lower ends', anchor: { x: HEMBRA.c.x, y: HEMBRA.bottomY, z: HEMBRA.c.z }, prov: D.shellH.prov, note: 'The open bottoms let out part of the sound, near the player’s legs or the stand.' },
  ],
  surfaces: [
    { id: 'pair', partId: 'hembra.head', label: 'the heads', point: { x: 0, y: HEAD_Y, z: BETWEEN.z }, normal: UP, minus: { words: 'below', key: 'BELOW' } },
    headSurface(HEMBRA),
    headSurface(MACHO),
  ],
  lines: [
    { id: 'between', label: 'the centre line', point: { x: BETWEEN.x, y: HEAD_Y, z: BETWEEN.z }, dir: { x: 0, y: 1, z: 0 } },
    axisLine(HEMBRA),
    axisLine(MACHO),
  ],
  envelopes: [
    ...DRUMS.map((d) => ({ id: `env.hands.${d.id}`, label: 'the player’s hands', shape: handCyl(d), prov: ill('the hands over each head, from any side, up to 25 cm above it (the lesson’s illustrative envelope)') })),
    { id: 'env.player', label: 'the player', shape: box({ x: -760, y: -1400, z: -380 }, { x: -300, y: 400, z: 380 }), prov: ill('the player behind the pair; no source gives the reach') },
  ],
  variants: [
    { id: 'knees', label: 'KNEES', blurb: 'Seated, the pair held between the knees: the legs are right beside the drums, and the open ends sit just above them.' },
    { id: 'stand', label: 'STAND', blurb: 'On a stand for a standing player: the open ends hang clear above the stand’s legs.' },
  ],
  defaultVariant: 'knees',
  views: {
    side: { u0: -460, u1: 660, v0: -880, v1: 60 },
    top: { u0: -460, u1: 660, v0: -440, v1: 440 },
  },
  yFloor: { mm: 0, prov: ill('the floor is the frame’s origin (frame H)') },
  floorByVariant: { stand: STAND_FLOOR },
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  ports: { knees: null, stand: null },
  mountRule: { boom: 'level', fallback: { x: 1, y: 0, z: 0 }, length: 300 },
  rims: DRUMS.map(rimOf),
  words: {
    subject: {
      knees: 'a pair of bongos held between a seated player’s knees — the macho on the player’s left, the hembra on the right',
      stand: 'a pair of bongos on a stand — the macho on the player’s left, the hembra on the right',
    },
    viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
    axes: {
      x: { label: 'FRONT–BACK', blurb: 'Toward the audience (front) or toward the player (back), measured from the drums’ centres (x).', plus: 'front of', minus: 'behind', from: 'centre' },
      y: { label: 'HEIGHT', blurb: 'Up or down, measured from the seated player’s floor. Distances in the bezel are read from the head the zone names.', plus: 'below', minus: 'above', from: 'the floor line' },
      z: { label: 'ACROSS', blurb: 'Toward the player’s left (the macho) or right (the hembra).', plus: 'right of', minus: 'left of', from: 'centre' },
    },
    where: { inside: 'inside a drum', outside: 'outside the drums' },
  },
};
