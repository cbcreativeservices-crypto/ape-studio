/**
 * A08a B♭ CLARINET — where things are (charter §2 layer 2): the shared
 * woodwind family's clarinet (shared/woodwinds/windSpec.ts CLARINET) held
 * 35° out from the body, the bell at about knee height when seated
 * (soprano_clarinet/GEOMETRY_PROPOSAL.md §2 posture, ILLUSTRATIVE), SEATED
 * or STANDING. In the lesson frame the player's lips are the origin; the
 * instrument and the upper body stay put, the legs, the chair and the floor
 * move (windPosture.ts).
 *
 * Reference points (the zones measure from them):
 *   third   the key side at P(U/3): one third of the 629 mm body up from the
 *           bell (209.7 mm, DERIVED) — DPA's "a third of the length up from
 *           the bell", on the lower joint;
 *   mid     the key side at the instrument's middle (MDAT "aim … at the
 *           center of the instrument");
 *   front   the same point, with the audience's direction as its normal (a
 *           stand far in front);
 *   bell    the bell's rim, its axis as the normal;
 *   joint   the key side where the lower joint meets the bell (the clip's
 *           capsule, aimed back up toward the keys).
 * The clip's strap: round the tube just above the bell (DPA "fixed around
 * the clarinet at the top, close to the bell").
 */
import type { InstrumentModel, ReferenceSurface, Rim, Vec3 } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { mergeVariants } from '../shared/bowed/bowedModel.ts';
import { frameAt, oneThirdS, straightReedLayout, type Layout } from '../shared/woodwinds/windPosture.ts';
import { keySidePoint, windModel, windRegions, type WindPartWords } from '../shared/woodwinds/windModel.ts';
import { CLARINET, radiusAt } from '../shared/woodwinds/windSpec.ts';

export const SPEC = CLARINET;
export const SEATED = straightReedLayout(SPEC, 'seated', 35);
export const STANDING = straightReedLayout(SPEC, 'standing', 35);
export const layoutOf = (v: string): Layout => (v === 'standing' ? STANDING : SEATED);
const L = SEATED;

export const S_THIRD = oneThirdS(SPEC)!;
export const S_MID = SPEC.end / 2;
export const S_JOINT = 600;
const fT = frameAt(L, S_THIRD);
const fM = frameAt(L, S_MID);
const fE = frameAt(L, SPEC.end);

export const A = {
  third: keySidePoint(L, S_THIRD),
  mid: keySidePoint(L, S_MID),
  bell: fE.p,
  joint: keySidePoint(L, S_JOINT),
  /** The clip's strap, round the tube just above the bell joint. */
  strap: frameAt(L, 592).p,
};
export const N_THIRD = fT.n;
export const N_MID = fM.n;
export const BELL_AXIS = fE.t;
/** Up the instrument, toward the reed (a clip aimed "toward the keys"). */
export const UP_INSTRUMENT: Vec3 = scale(frameAt(L, S_JOINT).t, -1);
export const FORWARD: Vec3 = { x: 0, y: 0, z: 1 };

export const CLARINET_VIEWS = {
  side: { u0: -560, u1: 660, v0: -300, v1: 800 },
  top: { u0: -560, u1: 660, v0: -440, v1: 1340 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'third', partId: 'ww.lower', label: 'the holes a third of the way up from the bell', point: A.third, normal: N_THIRD, target: true },
  { id: 'mid', partId: 'ww.upper', label: 'the middle of the clarinet', point: A.mid, normal: N_MID, target: true },
  { id: 'front', partId: 'ww.upper', label: 'the middle of the clarinet (from in front)', point: A.mid, normal: FORWARD, target: true },
  { id: 'bell', partId: 'ww.bell', label: 'the bell', point: A.bell, normal: BELL_AXIS, target: true },
  { id: 'joint', partId: 'ww.bell', label: 'the top of the bell', point: A.joint, normal: N_THIRD, target: true },
];

const rims: Rim[] = [{ id: 'clip.bell', label: 'a strap round the clarinet just above the bell', c: A.strap, axis: norm(frameAt(L, 592).t), r: radiusAt(SPEC, 592) + 1.5 }];

export const WORDS: WindPartWords = {
  roles: {
    mouthpiece: 'The mouthpiece, with the single cane reed held against it by the metal ligature. The player’s breath sets the reed vibrating; it lets the air in in puffs, in step with the air column.',
    barrel: 'A short wooden piece between the mouthpiece and the upper joint; pulling it out a little tunes the whole clarinet.',
    upper: 'The upper joint, under the left hand: tone holes, ring keys and the thumb hole behind, and the register key that moves the clarinet up a twelfth.',
    lower: 'The lower joint, under the right hand: the lower tone holes and their keys. One third of the way up from the bell sits on this joint.',
    bell: 'The flared end. Only the lowest notes — every hole closed — leave mainly from here; most notes leave from open holes up the body.',
  },
  keys: 'About twenty tone holes along the body, closed by the fingers, ring keys and padded keys on rods. As the player fingers each note, the first open hole moves — and the sound leaves there.',
  exciter: { label: 'mouthpiece and reed', short: 'reed', role: 'The cane reed vibrates against the mouthpiece. Its edge, the player’s breath and the tonguing are heard close up.' },
  hands: 'Both hands cover the holes and work the keys — the left above, the right below, the thumbs behind. Nothing may sit in the fingers’ way.',
  player: 'The clarinettist, seated or standing. They breathe, phrase and move the bell — leave room.',
  head: 'The player’s head: the mouthpiece is held in the lips. Keep a mic and its boom well clear of the face.',
};

function model(Lt: Layout): InstrumentModel {
  return windModel(Lt, {
    id: 'clarinet',
    name: 'B♭ clarinet',
    views: CLARINET_VIEWS,
    words: WORDS,
    surfaces,
    rims,
    regions: windRegions(Lt, {
      holes: 'Most notes leave from the first open tone holes, which move up the body as the pitch rises.',
      end: 'The lowest notes — every hole closed — leave mainly from the bell; above about 1.5 kHz, some of every note does too.',
      exciter: 'The reed and the player’s breath: a mic very close to the mouthpiece hears the reed’s edge and the tonguing.',
    }),
    variants: [
      { id: 'seated', label: 'SEATED', blurb: 'The clarinettist sits, as in an orchestra or a band: the bell at about knee height, in front of the knees.' },
      { id: 'standing', label: 'STANDING', blurb: 'The clarinettist stands, as for a solo or a gig: the same hold, the floor and the legs farther away.' },
    ],
  });
}

export const CLARINET_MODEL: InstrumentModel = mergeVariants([
  { variant: 'seated', model: model(SEATED) },
  { variant: 'standing', model: model(STANDING) },
]);

export const around3 = (p: Vec3, d: Vec3, k: number) => add(p, scale(norm(d), k));
