/**
 * A08b BASS CLARINET — where things are (charter §2 layer 2): the shared
 * woodwind family's bass clarinet (windSpec.ts bassClarinetSpec: every
 * dimension a DRAWING DEFAULT — bass_clarinet/SOURCES.md "Dimensions …
 * UNKNOWN"), seated, near-upright between the knees on its floor peg, the
 * curved neck to the lips, the bell turned up and forward. The variant is
 * the MODEL: to low E♭, or extended to low C (Y-YCL622) — three more
 * semitones of tube on the lower joint and a deeper bow (DERIVED).
 *
 * Reference points: `front` (the body's middle, from the audience — MDAT's
 * "2-4 feet in front … at the center"), `blend` (between the lower body and
 * the bell, from in front and a little to the side — the lesson's own
 * inference from DPA's bell-and-holes description), `bell` (its rim, its
 * axis), `low` (the lowest keys, for the clip between bell and keywork).
 */
import type { InstrumentModel, ReferenceSurface, Rim, Vec3 } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { mergeVariants } from '../shared/bowed/bowedModel.ts';
import { bassClarinetLayout, frameAt, type Layout } from '../shared/woodwinds/windPosture.ts';
import { keySidePoint, windModel, windRegions, type WindPartWords } from '../shared/woodwinds/windModel.ts';
import { bassClarinetSpec, radiusAt, type BassClarinetModel } from '../shared/woodwinds/windSpec.ts';

export const LAYOUTS: Record<BassClarinetModel, Layout> = {
  eflat: bassClarinetLayout(bassClarinetSpec('eflat')),
  lowc: bassClarinetLayout(bassClarinetSpec('lowc')),
};
export const layoutOf = (v: string): Layout => (v === 'lowc' ? LAYOUTS.lowc : LAYOUTS.eflat);
const L = LAYOUTS.eflat;
export const SPEC = L.spec;
const lower = SPEC.pieces.find((p) => p.id === 'lower')!;

const fE = frameAt(L, SPEC.end);
export const A = {
  mid: keySidePoint(L, 650),
  low: keySidePoint(L, lower.s1 - 40),
  bell: fE.p,
  blend: scale(add(keySidePoint(L, lower.s1 - 40), fE.p), 0.5),
};
export const FORWARD: Vec3 = { x: 0, y: 0, z: 1 };
export const BELL_AXIS = fE.t;
/** In front and a little to the player's right (the lesson's "slightly to the side"). */
export const BLEND_DIR: Vec3 = norm({ x: -0.4, y: -0.15, z: 1 });

export const BASS_CLARINET_VIEWS = {
  side: { u0: -620, u1: 640, v0: -300, v1: 1250 },
  top: { u0: -620, u1: 640, v0: -460, v1: 1360 },
};

const surfaces = (m: BassClarinetModel): ReferenceSurface[] => {
  const Lm = LAYOUTS[m];
  const lo = Lm.spec.pieces.find((p) => p.id === 'lower')!;
  const e = frameAt(Lm, Lm.spec.end);
  return [
    { id: 'front', partId: 'ww.upper', label: 'the middle of the bass clarinet (from in front)', point: keySidePoint(Lm, 650), normal: FORWARD, target: true },
    { id: `blend.${m}`, partId: 'ww.bell', label: 'between the lower body and the bell', point: scale(add(keySidePoint(Lm, lo.s1 - 40), e.p), 0.5), normal: BLEND_DIR, target: true, variants: [m] },
    { id: `bell.${m}`, partId: 'ww.bell', label: 'the bell', point: e.p, normal: e.t, target: true, variants: [m] },
    { id: `low.${m}`, partId: 'ww.lower', label: 'the lowest keys', point: keySidePoint(Lm, lo.s1 - 40), normal: frameAt(Lm, lo.s1 - 40).n, target: true, variants: [m] },
  ];
};
const rims = (m: BassClarinetModel): Rim[] => {
  const e = frameAt(LAYOUTS[m], LAYOUTS[m].spec.end - 6);
  return [{ id: `clip.bell.${m}`, label: 'a clip on the bell’s rim', c: e.p, axis: norm(e.t), r: radiusAt(LAYOUTS[m].spec, LAYOUTS[m].spec.end) + 1, variants: [m] }];
};

export const WORDS: WindPartWords = {
  roles: {
    mouthpiece: 'The mouthpiece and single reed — larger than a clarinet’s — held in the lips from below.',
    neck: 'The curved metal neck from the mouthpiece to the body. Never a mount: nothing is clamped to it.',
    upper: 'The upper joint, under the left hand: tone holes, ring keys and the long keys of the low register.',
    lower: 'The lower joint, under the right hand, and the thumb keys behind; on a low C model it is longer, with extra keys at the bottom.',
    bow: 'The metal U-bend at the bottom that turns the tube upward. The floor peg sits under it.',
    bell: 'The metal bell, turned up and forward. The lowest notes leave mainly here — but the bass clarinet’s sound is a blend of bell and holes.',
  },
  keys: 'About two dozen keys and seven covered holes along the body. As the player fingers each note, the first open hole moves — and much of the sound leaves there, blended with the bell.',
  exciter: { label: 'mouthpiece and reed', short: 'reed', role: 'The single reed on the mouthpiece. Close to it, a mic hears the reed, the breath and the tonguing.' },
  hands: 'Both hands on the keys — the left high, the right low, the thumbs behind on more keys. Nothing may sit in their way.',
  player: 'The bass clarinettist, seated, the instrument between the knees on its peg.',
  head: 'The player’s head, the mouthpiece at the lips. Keep a boom clear of the face and the neck of the instrument.',
};

function model(m: BassClarinetModel): InstrumentModel {
  const Lt = LAYOUTS[m];
  return windModel(Lt, {
    id: 'bassClarinet',
    name: 'bass clarinet',
    views: BASS_CLARINET_VIEWS,
    words: WORDS,
    surfaces: [...surfaces('eflat'), ...surfaces('lowc').filter((s) => s.id !== 'front')],
    rims: [...rims('eflat'), ...rims('lowc')],
    regions: windRegions(Lt, {
      holes: 'Most notes leave from the open tone holes, which move up the body as the pitch rises — blended with the bell.',
      end: 'The upturned bell: the lowest notes leave mainly here, and it adds to many others.',
      exciter: 'The reed and the breath: a mic close to the mouthpiece hears them.',
    }),
    variants: [
      { id: 'eflat', label: 'TO LOW E♭', blurb: 'A bass clarinet whose lowest written note is E♭ (sounding about 69 Hz).' },
      { id: 'lowc', label: 'TO LOW C', blurb: 'An extended model down to written low C (sounding about 58 Hz): a longer lower joint and a deeper bow.' },
    ],
  });
}

export const BASS_CLARINET_MODEL: InstrumentModel = mergeVariants([
  { variant: 'eflat', model: model('eflat') },
  { variant: 'lowc', model: model('lowc') },
]);
