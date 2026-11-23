/**
 * M04a CONGAS — where things are (charter §2 layer 2), in FRAME C (model.ts:
 * +x the player's left, +z the audience). Parts, envelopes, surfaces and lines
 * are BUILT from model.ts; the art (art.tsx) and the labels read only these
 * anchors, so the drawing, the hit areas and the readouts agree at every zoom.
 *
 * A set of three (owner 2026-11-22, "center conga is conga w tumba and quinto
 * on sides"; decision "Three drums"): the 'side' view is the FRONT elevation,
 * from the audience, so all three drums stand side by side in it — none hides
 * another.
 *
 * Variants: ON THE FLOOR (the open lower ends rest on the floor — nothing can
 * go under them) and RAISED ON STANDS (the floor sits 150 mm lower, a drawing
 * default; each drum stands in its own three-legged stand, legs ILLUSTRATIVE).
 */
import type { InstrumentModel, Part, Vec3 } from '../../engine/model/types.ts';
import { axisLine, box, headCentre, headPart, headSurface, ill, rimOf, shellPart, shellRadiusAt, UP, type HandDrum } from '../shared/handdrums/handDrumModel.ts';
import type { HandWords } from '../shared/handdrums/family.ts';
import { AZ_BACK, BETWEEN, CONGA, CONGA_DIMS as D, FRONT, HEAD_Y, LOW, QUINTO, SET, TUMBA, type CongaId } from './model.ts';

/** The three drums, left to right as the front view draws them. */
export const DRUMS = SET;
const RAISE = D.raise.mm;

/** A raised drum's stand (ILLUSTRATIVE): a ring round the shell, three legs
 *  to the floor. The tumba's and the quinto's legs: two toward the front at
 *  ±60° of the audience and one straight back — none in front of the tumba's
 *  opening, where the bottom mic goes. The conga's set is turned a half step
 *  (one leg to the front, two back toward its neighbors' rear), so no leg
 *  meets a neighbor's leg between the drums (tested). Angles in plan from +x
 *  toward +z. */
export const STAND_RING_Y = -260;
export const LEG_ANGLES: Record<CongaId, readonly number[]> = {
  tumba: [Math.PI / 6, (5 * Math.PI) / 6, (3 * Math.PI) / 2],
  conga: [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6],
  quinto: [Math.PI / 6, (5 * Math.PI) / 6, (3 * Math.PI) / 2],
};
/** The leg capsules' radius (mm; the drawing strokes them 22 wide). */
export const LEG_R = 11;
export function standLegs(d: HandDrum): { top: Vec3; foot: Vec3 }[] {
  const rr = shellRadiusAt(d, STAND_RING_Y) + 12;
  return LEG_ANGLES[d.id as CongaId].map((a) => ({
    top: { x: d.c.x + Math.cos(a) * rr, y: STAND_RING_Y, z: d.c.z + Math.sin(a) * rr },
    foot: { x: d.c.x + Math.cos(a) * (d.rBottom + 130), y: RAISE, z: d.c.z + Math.sin(a) * (d.rBottom + 130) },
  }));
}

const HEAD_ROLE: Record<CongaId, string> = {
  quinto: 'The smallest and highest-pitched drum of the set, on the player’s left here. Usually rawhide (some are synthetic), struck with the hands: open tones, slaps, bass and muted strokes.',
  conga: 'The middle drum of the set, in the center, right in front of the player. Same strokes, a voice between the quinto’s and the tumba’s.',
  tumba: 'The largest and lowest drum of the set, on the player’s right here. Same strokes, the deepest voice.',
};
const SHELL_ROLE = 'A tall wooden shell built from staves, open at the bottom. The open lower end lets out a deeper, boomier part of the sound.';

const parts: Part[] = [
  ...DRUMS.flatMap((d) => [headPart(d, HEAD_ROLE[d.id as CongaId], D.headClear), shellPart(d, SHELL_ROLE)]),
  ...DRUMS.flatMap((d) =>
    standLegs(d).map<Part>((l, i) => ({
      id: `${d.id}.leg${i + 1}`,
      label: `${d.name} stand`,
      short: 'STAND',
      role: 'A conga stand lifts the drum so its lower opening is clear of the floor. Its legs and the floor around them are not a place for a mic stand’s base or a cable.',
      variants: ['raised'],
      prov: ill('a generic three-legged conga stand; no source gives its size'),
      solid: { kind: 'capsule', a: l.top, b: l.foot, r: LEG_R },
    })),
  ),
];

/** The hands over the player's half (−z) of all three heads, up to 30 cm above them. */
export const HANDS_BOX = box({ x: TUMBA.c.x - TUMBA.R - 10, y: HEAD_Y - D.handsUp.mm, z: -TUMBA.R - 10 }, { x: QUINTO.c.x + QUINTO.R + 10, y: HEAD_Y, z: 0 });
/** A standing player behind the conga. */
export const PLAYER_BOX = box({ x: -420, y: -1650, z: -720 }, { x: 420, y: 0, z: -250 });

export const CONGA_MODEL: InstrumentModel = {
  id: 'congaSet',
  name: 'set of three congas (11, 11¾ and 12½ in)',
  parts,
  regions: [
    ...DRUMS.map((d) => ({ id: `r.${d.id}`, partId: `${d.id}.head`, label: `the ${d.name} head`, anchor: headCentre(d), prov: d.prov.size, note: d.id === 'quinto' ? 'The quinto’s head, the highest of the set: the hand’s attack and the pitched tone start here.' : d.id === 'conga' ? 'The conga’s head, the middle of the set: the hand’s attack and the pitched tone start here.' : 'The tumba’s head, the lowest of the set: the hand’s attack and the pitched tone start here.' })),
    { id: 'r.bottom', partId: 'tumba.shell', label: 'the tumba’s open lower end', anchor: { x: TUMBA.c.x, y: 0, z: TUMBA.c.z }, prov: D.height.prov, note: 'The open bottom lets out a deeper, boomier part of the sound — on the floor it meets the floor; raised, it radiates freely.' },
  ],
  surfaces: [
    { id: 'set', partId: 'conga.head', label: 'the heads', point: { x: 0, y: HEAD_Y, z: 0 }, normal: UP, minus: { words: 'below', key: 'BELOW' } },
    ...DRUMS.map(headSurface),
    { id: 'tumba.low', partId: 'tumba.shell', label: 'the tumba’s lower opening', point: { x: LOW.x, y: LOW.y, z: LOW.z }, normal: FRONT },
  ],
  lines: [
    { id: 'between', label: 'the center line', point: { x: BETWEEN.x, y: HEAD_Y, z: BETWEEN.z }, dir: { x: 0, y: 1, z: 0 } },
    ...DRUMS.map(axisLine),
    { id: 'tumba.low', label: 'the line through the tumba’s opening', point: { x: LOW.x, y: LOW.y, z: LOW.z }, dir: FRONT },
  ],
  envelopes: [
    { id: 'env.hands', label: 'the player’s hands', shape: HANDS_BOX, prov: ill('the hands over the player’s half of each of the three heads, up to 30 cm above them (the geometry file’s illustrative envelope)') },
    { id: 'env.player', label: 'the player', shape: PLAYER_BOX, prov: ill('a standing player behind the conga; no source gives the reach') },
  ],
  variants: [
    { id: 'floor', label: 'FLOOR', blurb: 'On the floor: all three drums stand on the floor. Their open lower ends sit on it — nothing goes under them.' },
    { id: 'raised', label: 'RAISED', blurb: 'Raised on stands: each drum stands in its own stand, its lower opening lifted clear of the floor — which opens an optional mic near the tumba’s bottom.' },
  ],
  defaultVariant: 'floor',
  views: {
    side: { u0: -800, u1: 760, v0: -1450, v1: 320 },
    top: { u0: -800, u1: 760, v0: -780, v1: 780 },
  },
  viewTags: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  yFloor: { mm: 0, prov: ill('the floor is the frame’s origin (frame C)') },
  floorByVariant: { raised: RAISE },
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  ports: { floor: null, raised: null },
  // A mic faces the player from the audience side (−z); a boom runs level
  // toward the audience, away from the drums.
  aimHome: { az: AZ_BACK, el: 0 },
  mountRule: { boom: 'level', fallback: FRONT, length: 300 },
  rims: DRUMS.map(rimOf),
};

/** The scene's words (the lesson's copy: family.ts handCopy). Every phrase is
 *  true of frame C: the front view is seen FROM THE AUDIENCE, so the
 *  player's left (the quinto) is on the right of that picture. */
export const CONGA_WORDS: HandWords = {
  subject: {
    floor: 'a set of three congas standing on the floor — the quinto on the player’s left, the conga in the center, the tumba on the right',
    raised: 'a set of three congas raised on stands — the quinto on the player’s left, the conga in the center, the tumba on the right',
  },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { label: 'ACROSS', blurb: 'Toward the player’s left (the quinto) or right (the tumba), measured from the conga’s center. From the audience, the player’s left is on your right.', plus: 'to player’s left of', minus: 'to player’s right of', from: 'center' },
    y: { label: 'HEIGHT', blurb: 'Up or down, measured from the drums’ lower edge. Distances in the readouts are measured from the head the zone names.', plus: 'below', minus: 'above', from: 'base' },
    z: { label: 'FRONT–BACK', blurb: 'Toward the audience (front) or toward the player (back), measured from the drums’ centers.', plus: 'front of', minus: 'behind', from: 'center' },
  },
  where: { inside: 'inside a drum', outside: 'outside the drums' },
};
