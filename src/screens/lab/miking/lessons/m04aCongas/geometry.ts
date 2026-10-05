/**
 * M04a CONGAS — where things are (charter §2 layer 2), in frame H
 * (handDrumModel.ts). Parts, envelopes, surfaces and lines are BUILT from
 * model.ts; the art (art.tsx) and the labels read only these anchors, so the
 * drawing, the hit areas and the readouts agree at every zoom.
 *
 * Variants: ON THE FLOOR (the open lower ends rest on the floor — nothing can
 * go under them) and RAISED ON STANDS (the floor sits 150 mm lower, a drawing
 * default; each drum stands in a three-legged stand, legs ILLUSTRATIVE).
 */
import type { InstrumentModel, Part, Vec3 } from '../../engine/model/types.ts';
import { axisLine, box, headCentre, headPart, headSurface, ill, rimOf, shellPart, shellRadiusAt, UP } from '../shared/handdrums/handDrumModel.ts';
import { BETWEEN, CONGA, CONGA_DIMS as D, HEAD_Y, LOW, TUMBA } from './model.ts';

export const DRUMS = [CONGA, TUMBA] as const;
const RAISE = D.raise.mm;

/** A raised drum's stand (ILLUSTRATIVE): a ring round the shell, three legs
 *  to the floor, none on the audience side so the front of the opening stays open. */
export const STAND_RING_Y = -260;
export const LEG_ANGLES = [Math.PI / 3, Math.PI, (5 * Math.PI) / 3];
export function standLegs(d: (typeof DRUMS)[number]): { top: Vec3; foot: Vec3 }[] {
  const rr = shellRadiusAt(d, STAND_RING_Y) + 12;
  return LEG_ANGLES.map((a) => ({
    top: { x: d.c.x + Math.cos(a) * rr, y: STAND_RING_Y, z: d.c.z + Math.sin(a) * rr },
    foot: { x: d.c.x + Math.cos(a) * (d.rBottom + 130), y: RAISE, z: d.c.z + Math.sin(a) * (d.rBottom + 130) },
  }));
}

const HEAD_ROLE = {
  conga: 'The higher-pitched of the pair, on the player’s left here. Rawhide, struck with the hands: open tones, slaps, bass and muted strokes.',
  tumba: 'The larger, lower drum of the pair, on the player’s right here. Same strokes, a deeper voice.',
} as const;
const SHELL_ROLE = 'A tall wooden shell built from staves, open at the bottom. The open lower end lets out a deeper, boomier part of the sound.';

const parts: Part[] = [
  ...DRUMS.flatMap((d) => [headPart(d, HEAD_ROLE[d.id as 'conga' | 'tumba'], D.headClear), shellPart(d, SHELL_ROLE)]),
  ...DRUMS.flatMap((d) =>
    standLegs(d).map<Part>((l, i) => ({
      id: `${d.id}.leg${i + 1}`,
      label: `${d.name} stand`,
      short: 'STAND',
      role: 'A conga stand lifts the drum so its lower opening is clear of the floor. Its legs and the floor around them are not a place for a mic stand’s base or a cable.',
      variants: ['raised'],
      prov: ill('a generic three-legged conga stand; no source gives its size'),
      solid: { kind: 'capsule', a: l.top, b: l.foot, r: 11 },
    })),
  ),
];

export const HANDS_BOX = box({ x: -TUMBA.R, y: HEAD_Y - D.handsUp.mm, z: CONGA.c.z - CONGA.R - 10 }, { x: 0, y: HEAD_Y, z: TUMBA.c.z + TUMBA.R + 10 });
export const PLAYER_BOX = box({ x: -720, y: -1650, z: -420 }, { x: -250, y: 0, z: 420 });

export const CONGA_MODEL: InstrumentModel = {
  id: 'congaPair',
  name: 'pair of congas (11¾ and 12½ in)',
  parts,
  regions: [
    { id: 'r.heads', partId: 'tumba.head', label: 'the heads', anchor: { x: 0, y: HEAD_Y, z: TUMBA.c.z }, prov: D.tumbaD.prov, note: 'The hands strike the heads: the attack and the pitched tone start here.' },
    { id: 'r.conga', partId: 'conga.head', label: 'the conga head', anchor: headCentre(CONGA), prov: D.congaD.prov, note: 'The conga’s head, the higher of the pair.' },
    { id: 'r.bottom', partId: 'tumba.shell', label: 'the open lower end', anchor: { x: TUMBA.c.x, y: 0, z: TUMBA.c.z }, prov: D.height.prov, note: 'The open bottom lets out a deeper, boomier part of the sound — on the floor it meets the floor; raised, it radiates freely.' },
  ],
  surfaces: [
    { id: 'pair', partId: 'tumba.head', label: 'the heads', point: { x: 0, y: HEAD_Y, z: 0 }, normal: UP, minus: { words: 'below', key: 'BELOW' } },
    headSurface(TUMBA),
    headSurface(CONGA),
    { id: 'tumba.low', partId: 'tumba.shell', label: 'the tumba’s lower opening', point: { x: LOW.x, y: LOW.y, z: TUMBA.c.z }, normal: { x: 1, y: 0, z: 0 } },
  ],
  lines: [
    { id: 'between', label: 'the centre line', point: { x: BETWEEN.x, y: HEAD_Y, z: BETWEEN.z }, dir: { x: 0, y: 1, z: 0 } },
    axisLine(TUMBA),
    axisLine(CONGA),
    { id: 'tumba.low', label: 'the line through the tumba’s opening', point: { x: LOW.x, y: LOW.y, z: TUMBA.c.z }, dir: { x: 1, y: 0, z: 0 } },
  ],
  envelopes: [
    { id: 'env.hands', label: 'the player’s hands', shape: HANDS_BOX, prov: ill('the hands over the player’s half of each head, up to 30 cm above it (the geometry file’s illustrative envelope)') },
    { id: 'env.player', label: 'the player', shape: PLAYER_BOX, prov: ill('a standing player behind the drums; no source gives the reach') },
  ],
  variants: [
    { id: 'floor', label: 'FLOOR', blurb: 'On the floor: both drums stand on the floor. Their open lower ends sit on it — nothing goes under them.' },
    { id: 'raised', label: 'RAISED', blurb: 'Raised on stands: each drum stands in a stand, its lower opening lifted clear of the floor — which opens an optional mic near the bottom.' },
  ],
  defaultVariant: 'floor',
  views: {
    side: { u0: -560, u1: 980, v0: -1190, v1: 205 },
    top: { u0: -560, u1: 980, v0: -500, v1: 500 },
  },
  yFloor: { mm: 0, prov: ill('the floor is the frame’s origin (frame H)') },
  floorByVariant: { raised: RAISE },
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  ports: { floor: null, raised: null },
  mountRule: { boom: 'level', fallback: { x: 1, y: 0, z: 0 }, length: 300 },
  rims: DRUMS.map(rimOf),
  words: {
    subject: {
      floor: 'a pair of congas standing on the floor — the conga on the player’s left, the tumba on the right',
      raised: 'a pair of congas raised on stands — the conga on the player’s left, the tumba on the right',
    },
    viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
    axes: {
      x: { label: 'FRONT–BACK', blurb: 'Toward the audience (front) or toward the player (back), measured from the drums’ centres (x).', plus: 'front of', minus: 'behind', from: 'centre' },
      y: { label: 'HEIGHT', blurb: 'Up or down, measured from the drums’ lower edge. Distances in the bezel are read from the head the zone names.', plus: 'below', minus: 'above', from: 'base' },
      z: { label: 'ACROSS', blurb: 'Toward the player’s left (the conga) or right (the tumba).', plus: 'right of', minus: 'left of', from: 'centre' },
    },
    where: { inside: 'inside a drum', outside: 'outside the drums' },
  },
};
