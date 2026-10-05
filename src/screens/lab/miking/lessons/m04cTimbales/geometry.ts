/**
 * M04c TIMBALES — where things are (charter §2 layer 2), in frame H, built
 * from model.ts. Two setups: WITH A BELL (a cowbell on the bracket between
 * the drums, the default) and NO BELL. A standing player at −x; the stick
 * envelope covers the player's half of both heads and the shells' near sides
 * (heads, rimshots, cáscara) — ILLUSTRATIVE, from the geometry file.
 * The stand (a column, three legs, the bracket) is ILLUSTRATIVE.
 */
import type { InstrumentModel, Part, Vec3 } from '../../engine/model/types.ts';
import { axisLine, box, headCentre, headPart, headSurface, ill, rimOf, shellPart, src, UP } from '../shared/handdrums/handDrumModel.ts';
import { BELL, BETWEEN, HEAD_Y, LARGE, LOW_NORMAL, SMALL, TIMB_DIMS as D } from './model.ts';

export const DRUMS = [SMALL, LARGE] as const;
/** The gap between the two rims at x = 0, where the bracket rises. */
const GAP_Z = (SMALL.c.z + SMALL.R + SMALL.rim.t + (LARGE.c.z - LARGE.R - LARGE.rim.t)) / 2;
export const STAND = (() => {
  const top: Vec3 = { x: 0, y: SMALL.bottomY + 10, z: 0 };
  const hub: Vec3 = { x: 0, y: -320, z: 0 };
  const legs = [Math.PI / 3, Math.PI, (5 * Math.PI) / 3].map((a) => ({ a: hub, b: { x: Math.cos(a) * 330, y: 0, z: Math.sin(a) * 330 } as Vec3 }));
  const bracket = { a: { x: 0, y: SMALL.bottomY + 10, z: GAP_Z } as Vec3, b: { x: BELL.x + 40, y: BELL.y + 30, z: GAP_Z } as Vec3 };
  return { top, hub, legs, bracket };
})();
/** The cowbell (a drawing default size: 150 × 80 × 70 mm, mouth toward the player). */
export const BELL_BOX = box({ x: BELL.x - 110, y: BELL.y - 35, z: -40 }, { x: BELL.x + 40, y: BELL.y + 35, z: 40 });

const ROLE = {
  small: 'The smaller, higher drum — on the player’s left here. Struck with sticks on the head, the rim and the shell.',
  large: 'The larger, lower drum — on the player’s right here.',
} as const;
const SHELL_ROLE = 'A shallow brass shell, open at the bottom. Players strike its side for the cáscara pattern — a metal sound, not the head’s.';

const parts: Part[] = [
  ...DRUMS.flatMap((d) => [headPart(d, ROLE[d.id as 'small' | 'large'], D.headClear), shellPart(d, SHELL_ROLE)]),
  { id: 'timb.stand', label: 'stand', short: 'STAND', role: 'The heavy-duty stand holds the pair at playing height. Its legs and the floor around them are no place for a mic stand’s base or a cable.', prov: src('LP-257', 'Heavy-duty stand with adjustable timbale mount'), solid: { kind: 'capsule', a: STAND.top, b: STAND.hub, r: 14 } },
  ...STAND.legs.map<Part>((l, i) => ({ id: `timb.leg${i + 1}`, label: 'stand', short: 'STAND', role: 'The heavy-duty stand holds the pair at playing height.', prov: src('LP-257', 'Heavy-duty stand with adjustable timbale mount'), solid: { kind: 'capsule', a: l.a, b: l.b, r: 11 } })),
  { id: 'timb.bracket', label: 'cowbell bracket', short: 'BRACKET', role: 'A bracket rising between the drums to hold a cowbell — an accessory the player may or may not use.', variants: ['bell'], prov: src('LP-257', 'Cowbell bracket (cowbells sold separately)'), solid: { kind: 'capsule', a: STAND.bracket.a, b: STAND.bracket.b, r: 7 } },
  { id: 'timb.bell', label: 'cowbell', short: 'BELL', role: 'A loud metal bell on the bracket. Its own lesson is in the percussion lab; here it matters because it spills into every timbale mic.', variants: ['bell'], prov: ill('a cowbell is optional and its size varies; drawn at a drawing-default size'), solid: BELL_BOX },
];

export const TIMB_MODEL: InstrumentModel = {
  id: 'timbalePair',
  name: 'pair of timbales (14 and 15 in)',
  parts,
  regions: [
    { id: 'r.small', partId: 'small.head', label: 'the 14 in head', anchor: headCentre(SMALL), prov: D.smallD.prov, note: 'The stick on the head: the drum tone and its attack.' },
    { id: 'r.large', partId: 'large.head', label: 'the 15 in head', anchor: headCentre(LARGE), prov: D.largeD.prov, note: 'The larger, lower head.' },
    { id: 'r.shell', partId: 'small.shell', label: 'the shell (cáscara)', anchor: { x: -SMALL.R, y: HEAD_Y + 60, z: SMALL.c.z }, prov: src('LP-257', 'classic tone with biting cascara'), note: 'The stick on the brass shell’s side: the cáscara, a metal sound.' },
    { id: 'r.bell', partId: 'timb.bell', label: 'the cowbell', anchor: { x: BELL.x, y: BELL.y, z: BELL.z }, prov: ill('a drawing-default bell'), variants: ['bell'], note: 'A loud, ringing accessory close to every mic on the pair.' },
  ],
  surfaces: [
    { id: 'pair', partId: 'large.head', label: 'the heads', point: { x: 0, y: HEAD_Y, z: 0 }, normal: UP, minus: { words: 'below', key: 'BELOW' } },
    headSurface(LARGE),
    headSurface(SMALL),
    ...DRUMS.map((d) => ({ id: `${d.id}.low`, partId: `${d.id}.shell`, label: `the ${d.name}’s lower edge`, point: { x: d.c.x, y: d.bottomY, z: d.c.z }, normal: LOW_NORMAL, minus: { words: 'above', key: 'ABOVE' } })),
  ],
  lines: [
    { id: 'between', label: 'the centre line', point: { x: BETWEEN.x, y: HEAD_Y, z: BETWEEN.z }, dir: { x: 0, y: 1, z: 0 } },
    { id: 'centre', label: 'the pair’s centre', point: { x: 0, y: HEAD_Y, z: 0 }, dir: { x: 0, y: 1, z: 0 } },
    axisLine(LARGE),
    axisLine(SMALL),
  ],
  envelopes: [
    { id: 'env.sticks', label: 'the sticks', shape: box({ x: -LARGE.R - 20, y: HEAD_Y - D.sticksUp.mm, z: SMALL.c.z - SMALL.R - 30 }, { x: 0, y: HEAD_Y - 2, z: LARGE.c.z + LARGE.R + 30 }), prov: ill('the sticks over the player’s half of both heads, up to 40 cm above them (the geometry file’s illustrative envelope)') },
    { id: 'env.cascara', label: 'the sticks on the shells', shape: box({ x: -LARGE.R - 70, y: HEAD_Y - 60, z: SMALL.c.z - SMALL.R - 30 }, { x: -LARGE.R + 30, y: SMALL.bottomY, z: LARGE.c.z + LARGE.R + 30 }), prov: ill('the cáscara strokes on the shells’ near sides (illustrative)') },
    { id: 'env.bell', label: 'the stick on the bell', shape: box({ x: BELL.x - 150, y: BELL.y - 230, z: -90 }, { x: BELL.x + 20, y: BELL.y - 36, z: 90 }), variants: ['bell'], prov: ill('the stick over the bell (illustrative)') },
    { id: 'env.player', label: 'the player', shape: box({ x: -780, y: -1800, z: -420 }, { x: -330, y: 0, z: 420 }), prov: ill('a standing player behind the pair; no source gives the reach') },
  ],
  variants: [
    { id: 'bell', label: 'BELL', blurb: 'With a cowbell on the bracket between the drums — loud, and close to every mic on the pair.' },
    { id: 'plain', label: 'NO BELL', blurb: 'The pair alone, no accessory on the bracket.' },
  ],
  defaultVariant: 'bell',
  views: {
    side: { u0: -560, u1: 760, v0: -1420, v1: 60 },
    top: { u0: -560, u1: 760, v0: -480, v1: 480 },
  },
  yFloor: { mm: 0, prov: ill('the floor is the frame’s origin (frame H)') },
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  ports: { bell: null, plain: null },
  mountRule: { boom: 'level', fallback: { x: 1, y: 0, z: 0 }, length: 300 },
  rims: DRUMS.map(rimOf),
  words: {
    subject: {
      bell: 'a pair of timbales on their stand with a cowbell on the bracket — the 14 in on the player’s left, the 15 in on the right',
      plain: 'a pair of timbales on their stand — the 14 in on the player’s left, the 15 in on the right',
    },
    viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
    axes: {
      x: { label: 'FRONT–BACK', blurb: 'Toward the audience (front) or toward the player (back), measured from the drums’ centres (x).', plus: 'front of', minus: 'behind', from: 'centre' },
      y: { label: 'HEIGHT', blurb: 'Up or down, measured from the floor. Distances in the bezel are read from the head or edge the zone names.', plus: 'below', minus: 'above', from: 'the floor' },
      z: { label: 'ACROSS', blurb: 'Toward the player’s left (14 in) or right (15 in).', plus: 'right of', minus: 'left of', from: 'centre' },
    },
    where: { inside: 'inside a drum', outside: 'outside the drums' },
  },
};
