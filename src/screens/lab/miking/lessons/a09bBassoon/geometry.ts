/**
 * A09b BASSOON — where things are (charter §2 layer 2): the shared woodwind
 * family's bassoon (windSpec.ts BASSOON: 1350 mm tall, 2600 mm of bore
 * unfolded, bell Ø 40 inside — Yamaha; the split between the joints a
 * drawing default) held across the body — the boot at the right hip on a
 * seat strap, the bell above the head to the left (bassoon/GEOMETRY_
 * PROPOSAL.md, ILLUSTRATIVE) — SEATED, or STANDING on a harness.
 *
 * Reference points:
 *   third  DPA's template on the BASSOON: one third of the 1350 mm length from
 *          the bell end, measured DOWN the long joint toward the reed — 450 mm
 *          below the bell's top (DERIVED; soprano_clarinet/SOURCES.md §0.1:
 *          "up" in DPA's wording, "down" in the lesson's — the same point);
 *   holes  the finger holes on the boot (Shure's "about 1 foot from sound
 *          holes");
 *   keys   the boot's keys, for MDAT's "3–4 feet away on the player's right
 *          side … 45 degrees down at the keys";
 *   bell   the bell's rim, its axis (up);
 *   clip   the key side of the bell joint, where the clip's capsule looks
 *          DOWN the instrument ("Point it downward, toward the keys").
 */
import type { InstrumentModel, Part, ReferenceSurface, Rim, Vec3 } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { mergeVariants } from '../shared/bowed/bowedModel.ts';
import { BSN, bassoonAxes, bassoonLayout, frameAt, oneThirdS, type Layout } from '../shared/woodwinds/windPosture.ts';
import { CLEAR, keySidePoint, windModel, windRegions, type WindPartWords } from '../shared/woodwinds/windModel.ts';
import { BASSOON, radiusAt } from '../shared/woodwinds/windSpec.ts';

export const SPEC = BASSOON;
export const SEATED = bassoonLayout('seated', SPEC);
export const STANDING = bassoonLayout('standing', SPEC);
export const layoutOf = (v: string): Layout => (v === 'standing' ? STANDING : SEATED);
const L = SEATED;

export const S_THIRD = oneThirdS(SPEC)!;
export const S_HOLES = 1000;
export const S_CLIP = 2390;
const fE = frameAt(L, SPEC.end);
export const A = {
  third: keySidePoint(L, S_THIRD),
  holes: keySidePoint(L, S_HOLES),
  bell: fE.p,
  clip: keySidePoint(L, S_CLIP),
  strap: frameAt(L, 2330).p,
};
export const N_THIRD = frameAt(L, S_THIRD).n;
export const N_HOLES = frameAt(L, S_HOLES).n;
export const BELL_AXIS = fE.t;
/** Down the instrument from the bell joint, toward the keys. */
export const DOWN_INSTRUMENT: Vec3 = scale(frameAt(L, S_CLIP).t, -1);
/** MDAT's side position: up and out on the player's right, 45° above the keys. */
export const SIDE_DIR: Vec3 = norm({ x: -0.72, y: -0.72, z: 0.25 });
export const FORWARD: Vec3 = { x: 0, y: 0, z: 1 };

export const BASSOON_VIEWS = {
  side: { u0: -1150, u1: 800, v0: -900, v1: 880 },
  top: { u0: -1150, u1: 800, v0: -520, v1: 1250 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'third', partId: 'ww.long', label: 'the long joint, a third of the way down from the bell', point: A.third, normal: N_THIRD, target: true },
  { id: 'holes', partId: 'ww.boot', label: 'the finger holes on the boot', point: A.holes, normal: N_HOLES, target: true },
  { id: 'keys', partId: 'ww.boot', label: 'the keys on the boot (from the side)', point: A.holes, normal: SIDE_DIR, target: true },
  { id: 'bell', partId: 'ww.bell', label: 'the bell', point: A.bell, normal: BELL_AXIS, target: true },
  { id: 'clip', partId: 'ww.bell', label: 'the bell joint', point: A.clip, normal: frameAt(L, S_CLIP).n, target: true },
];
const rims: Rim[] = [{ id: 'clip.bell', label: 'a strap round the bell joint', c: A.strap, axis: norm(frameAt(L, 2330).t), r: radiusAt(SPEC, 2330) + 1.5 }];

export const WORDS: WindPartWords = {
  roles: {
    reed: 'Two cane blades bound with wire and thread: the double reed, held in the lips. The breath sets the blades closing and opening.',
    bocal: 'The thin, curved metal tube from the reed to the wing joint — delicate. Nothing is ever clamped to it.',
    wing: 'The wing joint, running down from the bocal: the left hand’s finger holes, drilled at a slant through its thick wall.',
    boot: 'The boot joint at the bottom: two bores side by side, joined by a U-tube under it — the air goes down and comes back up. The right hand’s holes are here.',
    long: 'The long joint, rising beside the wing joint: the left thumb’s keys for the low notes. One third of the way down from the bell sits here.',
    bell: 'The bell joint at the top, above the player’s head. Only the very lowest note — every hole closed — comes mainly from here.',
  },
  keys: 'Finger holes and keys spread down the folded tube — the left hand on the wing joint, the right on the boot, both thumbs working long rods. As the pitch rises, the first open hole moves farther down the instrument, round the boot and up the wing — and the sound leaves there.',
  exciter: { label: 'double reed and bocal', short: 'reed', role: 'The double reed at the lips on its curved bocal. Close to it, a mic hears the reed’s edge, the breath and the tonguing — and it is the most delicate part.' },
  hands: 'Both hands on the keys — the left high on the wing joint, the right low on the boot — and both thumbs working keys behind. Nothing may sit in their way.',
  player: 'The bassoonist, on a seat strap (or a harness, standing). The bassoon pivots a little as they breathe and phrase.',
  head: 'The player’s head, the reed at the lips. Keep a mic and its boom clear of the face, the bocal and the bell beside the head.',
};

function model(Lt: Layout): InstrumentModel {
  const m = windModel(Lt, {
    id: 'bassoon',
    name: 'bassoon',
    views: BASSOON_VIEWS,
    words: WORDS,
    surfaces,
    rims,
    regions: windRegions(Lt, {
      holes: 'Most notes leave from the first open hole — farther down the instrument the higher the note: down the long joint, round the boot, up the wing joint.',
      end: 'The very lowest note — every hole closed — leaves from the bell at the top; above about 400–500 Hz, the bell carries some of every note.',
      exciter: 'The double reed and the breath: a mic close to the reed hears its edge and the tonguing.',
    }),
    variants: [
      { id: 'seated', label: 'SEATED', blurb: 'The bassoonist sits on a seat strap that holds the boot: the instrument across the body, the bell above the head to the left.' },
      { id: 'standing', label: 'STANDING', blurb: 'The bassoonist stands, on a harness: the same hold, the floor and the legs farther away.' },
    ],
  });
  // The boot is one wide body round its two bores.
  const { L: ax, W: wx } = bassoonAxes();
  const boot: Part = {
    id: 'ww.bootBody',
    label: 'boot joint',
    short: 'boot',
    role: WORDS.roles.boot,
    prov: SPEC.length.prov,
    clearance: CLEAR,
    listIn: [],
    solid: { kind: 'capsule', a: scale(add(ax(20), wx(20)), 0.5), b: scale(add(ax(BSN.bootTop), wx(BSN.bootTop)), 0.5), r: 46 },
  };
  return { ...m, parts: [...m.parts, boot] };
}

export const BASSOON_MODEL: InstrumentModel = mergeVariants([
  { variant: 'seated', model: model(SEATED) },
  { variant: 'standing', model: model(STANDING) },
]);
