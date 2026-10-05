/**
 * A07 PICCOLO — where things are (charter §2 layer 2): the shared woodwind
 * family's piccolo (windSpec.ts PICCOLO: "approximately 13 inches", half a
 * flute — Y-HUB-PICC; a wooden body with a silver head joint and keys, the
 * commonest modern build, a drawing default), held like a flute, STANDING or
 * SEATED. The flute's starting points are transferred as the lesson says —
 * not piccolo-specific optimums (L26); no clip-fit claim (L26).
 *
 * Reference points: `between` (halfway from the lip plate to the left hand),
 * `head` (the player's head), `holes` (the finger holes), `front` (the
 * piccolo's middle, seen from the audience), `emb` (the embouchure hole).
 */
import type { InstrumentModel, ReferenceSurface, Rim, Vec3 } from '../../engine/model/types.ts';
import { add, norm } from '../../engine/geometry/vec.ts';
import { mergeVariants } from '../shared/bowed/bowedModel.ts';
import { fluteLayout, frameAt, type Layout } from '../shared/woodwinds/windPosture.ts';
import { holeFieldS, keySidePoint, windModel, windRegions, type WindPartWords } from '../shared/woodwinds/windModel.ts';
import { PICCOLO } from '../shared/woodwinds/windSpec.ts';

export const SPEC = PICCOLO;
export const STANDING = fluteLayout(SPEC, 'standing');
export const SEATED = fluteLayout(SPEC, 'seated');
export const layoutOf = (v: string): Layout => (v === 'seated' ? SEATED : STANDING);
const L = STANDING;

export const S_BETWEEN = L.handL.s / 2;
export const S_HOLES = holeFieldS(SPEC);
export const A = {
  between: keySidePoint(L, S_BETWEEN),
  holes: keySidePoint(L, S_HOLES),
  mid: frameAt(L, 160).p,
  emb: frameAt(L, 0).p,
  head: L.body.head.c,
  ear: add(L.body.head.c, { x: 86, y: 12, z: 6 }),
};
export const N_KEYS = frameAt(L, S_BETWEEN).n;
export const BEHIND_DIR: Vec3 = norm({ x: -0.15, y: -0.62, z: -0.77 });
export const HEADSET_DIR: Vec3 = norm({ x: 0.75, y: -0.15, z: 0.62 });
export const FORWARD: Vec3 = { x: 0, y: 0, z: 1 };

export const PICCOLO_VIEWS = {
  side: { u0: -440, u1: 340, v0: -340, v1: 400 },
  top: { u0: -560, u1: 500, v0: -560, v1: 1320 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'between', partId: 'ww.headjoint', label: 'the piccolo between the lip plate and the left hand', point: A.between, normal: N_KEYS, target: true },
  { id: 'head', partId: 'ww.head', label: 'the player’s head', point: A.head, normal: BEHIND_DIR, target: true },
  { id: 'holes', partId: 'ww.body', label: 'the finger holes', point: A.holes, normal: frameAt(L, S_HOLES).n },
  { id: 'front', partId: 'ww.body', label: 'the middle of the piccolo (from in front)', point: A.mid, normal: FORWARD, target: true },
  { id: 'emb', partId: 'ww.exciter', label: 'the embouchure hole', point: A.emb, normal: HEADSET_DIR, target: true },
];
const rims: Rim[] = [{ id: 'clip.ear', label: 'a headset over the left ear', c: A.ear, axis: { x: 1, y: 0, z: 0 }, r: 0 }];

export const WORDS: WindPartWords = {
  roles: {
    headjoint: 'The head joint, often silver: the lip plate with its small embouchure hole. The player blows across the hole; its far edge splits the air jet.',
    body: 'The body — here wood, with silver keys; piccolos are also made of plastic or metal. About half a flute’s length, with small tone holes under padded keys. There is no separate foot joint.',
  },
  keys: 'Small tone holes under padded keys, close together. As the player fingers each note, the first open hole moves — and much of the sound leaves there, with the embouchure hole.',
  exciter: { label: 'lip plate and embouchure hole', short: 'embouchure', role: 'The air jet crosses the small embouchure hole and strikes its edge. The hole radiates for every note — and the jet blows straight out past it.' },
  hands: 'Both hands close together on the short body, the left near the head joint. Nothing may sit in the fingers’ way.',
  player: 'The piccolo player, standing or seated. The piccolo sits right by their right ear — and moves with the head.',
  head: 'The player’s head, the lips at the embouchure — and the right ear close to the loud piccolo. Keep a boom clear of a turning head.',
};

function model(Lt: Layout): InstrumentModel {
  return windModel(Lt, {
    id: 'piccolo',
    name: 'piccolo',
    views: PICCOLO_VIEWS,
    words: WORDS,
    surfaces,
    rims,
    regions: windRegions(Lt, {
      holes: 'Much of each note leaves from the first open hole, which moves as the fingering changes.',
      end: 'The open end: the lowest notes — every hole closed — leave here too.',
      exciter: 'The embouchure hole radiates for every note — and the air jet’s breath starts here.',
    }),
    variants: [
      { id: 'standing', label: 'STANDING', blurb: 'The piccolo player stands, as for a solo: the piccolo at the lips, out to the right.' },
      { id: 'seated', label: 'SEATED', blurb: 'The player sits at the end of the flutes, as in an orchestra or a band: the same hold, the floor closer.' },
    ],
  });
}

export const PICCOLO_MODEL: InstrumentModel = mergeVariants([
  { variant: 'standing', model: model(STANDING) },
  { variant: 'seated', model: model(SEATED) },
]);
