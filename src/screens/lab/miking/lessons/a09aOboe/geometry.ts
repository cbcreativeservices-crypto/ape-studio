/**
 * A09a OBOE — where things are (charter §2 layer 2): the shared woodwind
 * family's oboe (windSpec.ts OBOE: the 545 mm body, bell Ø 57, a double reed
 * 45 mm out — Met TRIAL / drawing default) held 40° out from the body, the
 * bell a little higher than a clarinet's (oboe/GEOMETRY_PROPOSAL.md),
 * SEATED or STANDING. The lips are the origin; the oboe and the upper body
 * stay put between postures.
 *
 * Reference points: `third` (the key side one third of the 545 mm body up
 * from the bell, 181.7 mm — DERIVED, DPA's template), `holes` (the middle of
 * the hole field, Shure's "about 1 foot from sound holes"), `bell` (its rim,
 * its axis), `front` (the middle, seen from the audience), `joint` (the top
 * of the bell, for the clip's capsule).
 */
import type { InstrumentModel, ReferenceSurface, Rim, Vec3 } from '../../engine/model/types.ts';
import { norm, scale } from '../../engine/geometry/vec.ts';
import { mergeVariants } from '../shared/bowed/bowedModel.ts';
import { frameAt, oneThirdS, straightReedLayout, type Layout } from '../shared/woodwinds/windPosture.ts';
import { holeFieldS, keySidePoint, windModel, windRegions, type WindPartWords } from '../shared/woodwinds/windModel.ts';
import { OBOE, radiusAt } from '../shared/woodwinds/windSpec.ts';

export const SPEC = OBOE;
export const SEATED = straightReedLayout(SPEC, 'seated', 40);
export const STANDING = straightReedLayout(SPEC, 'standing', 40);
export const layoutOf = (v: string): Layout => (v === 'standing' ? STANDING : SEATED);
const L = SEATED;

export const S_THIRD = oneThirdS(SPEC)!;
export const S_HOLES = holeFieldS(SPEC);
export const S_JOINT = 470;
const fE = frameAt(L, SPEC.end);
export const A = {
  third: keySidePoint(L, S_THIRD),
  holes: keySidePoint(L, S_HOLES),
  mid: keySidePoint(L, SPEC.end / 2),
  bell: fE.p,
  joint: keySidePoint(L, S_JOINT),
  strap: frameAt(L, 463).p,
};
export const N = frameAt(L, S_THIRD).n;
export const BELL_AXIS = fE.t;
export const UP_INSTRUMENT: Vec3 = scale(frameAt(L, S_JOINT).t, -1);
export const FORWARD: Vec3 = { x: 0, y: 0, z: 1 };

export const OBOE_VIEWS = {
  side: { u0: -560, u1: 660, v0: -300, v1: 760 },
  top: { u0: -560, u1: 660, v0: -440, v1: 1320 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'third', partId: 'ww.lower', label: 'the holes a third of the way up from the bell', point: A.third, normal: N, target: true },
  { id: 'holes', partId: 'ww.upper', label: 'the tone holes (the middle of them)', point: A.holes, normal: N, target: true },
  { id: 'front', partId: 'ww.upper', label: 'the middle of the oboe (from in front)', point: A.mid, normal: FORWARD, target: true },
  { id: 'bell', partId: 'ww.bell', label: 'the bell', point: A.bell, normal: BELL_AXIS, target: true },
  { id: 'joint', partId: 'ww.bell', label: 'the top of the bell', point: A.joint, normal: N, target: true },
];
const rims: Rim[] = [{ id: 'clip.bell', label: 'a strap round the oboe just above the bell', c: A.strap, axis: norm(frameAt(L, 463).t), r: radiusAt(SPEC, 463) + 1.5 }];

export const WORDS: WindPartWords = {
  roles: {
    reed: 'Two thin blades of cane tied on a small tube: the double reed. The player’s lips press it; the breath sets the two blades closing and opening against each other.',
    upper: 'The upper joint, under the left hand: small tone holes, ring keys and the octave keys that lift the oboe an octave. It narrows toward the reed — the bore is a cone.',
    lower: 'The lower joint, under the right hand. One third of the way up from the bell sits here, among the lower holes.',
    bell: 'The flared end, with a small vent hole. Only the lowest notes — every hole closed — leave mainly from here.',
  },
  keys: 'A dense keywork over small tone holes (the smallest about 2 mm across): rings, plates and padded keys on long rods. As the player fingers each note, the first open hole moves — and the sound leaves there.',
  exciter: { label: 'double reed', short: 'reed', role: 'Two cane blades vibrating against each other. Close up, a mic hears their edge, the breath and the tonguing.' },
  hands: 'Both hands on the keys — the left above, the right below, the thumbs under. Nothing may sit in the fingers’ way.',
  player: 'The oboist, seated or standing. The oboe pivots as the player breathes or reads — leave room.',
  head: 'The player’s head: the reed is held in the lips. Keep a mic and its boom clear of the face and the reed.',
};

function model(Lt: Layout): InstrumentModel {
  return windModel(Lt, {
    id: 'oboe',
    name: 'oboe',
    views: OBOE_VIEWS,
    words: WORDS,
    surfaces,
    rims,
    regions: windRegions(Lt, {
      holes: 'Most notes leave from the first open tone holes, which move up the body as the pitch rises.',
      end: 'The lowest notes — every hole closed — leave mainly from the bell; above about 1.5 kHz, some of every note does too.',
      exciter: 'The double reed and the breath: a mic very close to the reed hears its edge and the tonguing.',
    }),
    variants: [
      { id: 'seated', label: 'SEATED', blurb: 'The oboist sits, as in an orchestra: the oboe 40° out from the body, the bell a little above the knees.' },
      { id: 'standing', label: 'STANDING', blurb: 'The oboist stands, as for a solo: the same hold, the floor and the legs farther away.' },
    ],
  });
}

export const OBOE_MODEL: InstrumentModel = mergeVariants([
  { variant: 'seated', model: model(SEATED) },
  { variant: 'standing', model: model(STANDING) },
]);
