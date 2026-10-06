/**
 * A06 FLUTE (metal and wooden) — where things are (charter §2 layer 2): the
 * shared woodwind family's flute in its three DESIGNS (the lesson's variant,
 * "identify the design first"): a metal concert flute (Boehm system, 660 mm,
 * Ø 19 — PL-2010, Y-HUB-PICC), a wooden concert flute (the same keyed design
 * in grenadilla — the lesson's L10, "tone holes sized similarly"), and a
 * simple-system wooden flute (open finger holes, a conical body, 600 mm — a
 * drawing default, one maker's design). Held standing, to the player's right,
 * the embouchure hole under the lower lip (flute/GEOMETRY_PROPOSAL.md frame F;
 * the 10° forward / 8° down hold is a drawing default).
 *
 * Reference points: `between` (the flute halfway between the lip plate and
 * the left hand — DPA's aim), `head` (the player's head, for "behind and
 * slightly above"), `holes` (the finger holes), `front` (the flute's middle
 * seen from the audience), `foot` (the foot joint's keys, for the clip),
 * `emb` (the embouchure hole, for the headset).
 */
import type { InstrumentModel, ReferenceSurface, Rim, Vec3 } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { mergeVariants } from '../shared/bowed/bowedModel.ts';
import { fluteLayout, frameAt, type Layout } from '../shared/woodwinds/windPosture.ts';
import { holeFieldS, keySidePoint, windModel, windRegions, type WindPartWords } from '../shared/woodwinds/windModel.ts';
import { fluteSpec, holeS, radiusAt, type FluteDesign } from '../shared/woodwinds/windSpec.ts';

export const DESIGNS: readonly FluteDesign[] = ['metal', 'wooden', 'simple'];
export const LAYOUTS: Record<FluteDesign, Layout> = {
  metal: fluteLayout(fluteSpec('metal'), 'standing'),
  wooden: fluteLayout(fluteSpec('wooden'), 'standing'),
  simple: fluteLayout(fluteSpec('simple'), 'standing'),
};
export const layoutOf = (v: string): Layout => LAYOUTS[(v as FluteDesign) in LAYOUTS ? (v as FluteDesign) : 'metal'];
const L = LAYOUTS.metal;
export const SPEC = L.spec;

/** Halfway between the lip plate and the left hand (DPA's aim). */
export const S_BETWEEN = L.handL.s / 2;
export const S_HOLES = holeFieldS(SPEC);
export const S_FOOT = 575;
const F0 = frameAt(L, 0).p;
export const A = {
  between: keySidePoint(L, S_BETWEEN),
  holes: keySidePoint(L, S_HOLES),
  mid: frameAt(L, 320).p,
  foot: keySidePoint(L, S_FOOT),
  emb: F0,
  head: L.body.head.c,
  /** The headset's hook over the left ear. */
  ear: add(L.body.head.c, { x: 86, y: 12, z: 6 }),
  strap: frameAt(L, 628).p,
};
export const N_KEYS = frameAt(L, S_BETWEEN).n;
/** Toward the head end, along the flute (a clip on the foot looks this way). */
export const TOWARD_HEAD: Vec3 = scale(frameAt(L, S_FOOT).t, -1);
/** Behind and slightly above the player's head. */
export const BEHIND_DIR: Vec3 = norm({ x: -0.15, y: -0.62, z: -0.77 });
/** Where a headset's capsule sits: by the left corner of the lips, forward. */
export const HEADSET_DIR: Vec3 = norm({ x: 0.75, y: -0.15, z: 0.62 });
export const FORWARD: Vec3 = { x: 0, y: 0, z: 1 };

export const FLUTE_VIEWS = {
  side: { u0: -800, u1: 520, v0: -470, v1: 760 },
  top: { u0: -800, u1: 520, v0: -560, v1: 1320 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'between', partId: 'ww.headjoint', label: 'the flute between the lip plate and the left hand', point: A.between, normal: N_KEYS, target: true },
  { id: 'head', partId: 'ww.head', label: 'the player’s head', point: A.head, normal: BEHIND_DIR, target: true },
  { id: 'holes', partId: 'ww.body', label: 'the finger holes', point: A.holes, normal: frameAt(L, S_HOLES).n },
  { id: 'front', partId: 'ww.body', label: 'the middle of the flute (from in front)', point: A.mid, normal: FORWARD, target: true },
  { id: 'foot', partId: 'ww.body', label: 'the foot’s keys', point: A.foot, normal: frameAt(L, S_FOOT).n, target: true, variants: ['metal', 'wooden'] },
  { id: 'emb', partId: 'ww.exciter', label: 'the embouchure hole', point: A.emb, normal: HEADSET_DIR, target: true },
];
const rims = (): Rim[] => [
  { id: 'clip.foot', label: 'a strap round the flute’s foot end', c: A.strap, axis: norm(frameAt(L, 628).t), r: radiusAt(SPEC, 628) + 1.5, variants: ['metal', 'wooden'] },
  { id: 'clip.ear', label: 'a headset over the left ear', c: A.ear, axis: { x: 1, y: 0, z: 0 }, r: 0 },
];

const WORDS = (design: FluteDesign): WindPartWords => ({
  roles: {
    headjoint:
      design === 'simple'
        ? 'The head: the embouchure hole and, inside, the cork that closes the end. The player blows across the hole; the edge splits the air.'
        : 'The head joint: the lip plate with the embouchure hole, and inside, the cork 17 mm beyond the hole. The player blows across the hole; its far edge splits the air jet.',
    body:
      design === 'simple'
        ? 'A conical wooden body with six open finger holes — the fingers cover them directly — and perhaps a few small keys.'
        : design === 'wooden'
          ? 'The body: a grenadilla tube with the modern keywork — padded cups and five open-hole rings over tone holes sized like a metal flute’s.'
          : 'The body: the tone holes under padded cups and five open-hole rings, worked by both hands. Which hole is open first sets the note.',
    foot: 'The foot joint, under the right little finger: the lowest keys, and the open end — where the lowest notes, every hole closed, also leave.',
  },
  keys:
    design === 'simple'
      ? 'Six open finger holes and a few keys. As the player fingers each note, the first open hole moves — and much of the sound leaves there, with the embouchure hole.'
      : 'About sixteen tone holes under cups and rings. As the player fingers each note, the first open hole moves — and much of the sound leaves there, with the embouchure hole.',
  exciter: { label: 'lip plate and embouchure hole', short: 'embouchure', role: 'The player’s air jet crosses the embouchure hole and strikes its far edge. The hole radiates sound for every note — and the air jet blows straight out past it.' },
  hands: 'The left hand near the head end, palm toward the player; the right hand farther out; both thumbs under. Nothing may sit in the fingers’ way.',
  player: 'The flutist, standing. The flute extends sideways to the right and moves with the head and the breath — leave room.',
  head: 'The player’s head, the lips at the embouchure. The air jet blows out from here: keep a capsule out of it, and a boom clear of a turning head.',
});

function model(design: FluteDesign): InstrumentModel {
  const Lt = LAYOUTS[design];
  return windModel(Lt, {
    id: 'flute',
    name: 'flute',
    views: FLUTE_VIEWS,
    // The wooden flute and the player's arms reach past the modelled parts.
    fitAuthored: { side: true, top: true },
    words: WORDS(design),
    surfaces,
    rims: rims(),
    regions: windRegions(Lt, {
      holes: 'Much of each note leaves from the first open hole, which moves along the flute as the fingering changes.',
      end: 'The open foot: the lowest notes — every hole closed — leave here too.',
      exciter: 'The embouchure hole radiates for every note — and the air jet’s breath noise starts here.',
    }),
    variants: [
      { id: 'metal', label: 'METAL', blurb: 'A metal concert flute: keyed, in a silver colour (plated, nickel-silver or silver — the look does not tell you which).' },
      { id: 'wooden', label: 'WOODEN, KEYED', blurb: 'A wooden concert flute: the same keyed design in dark wood, tone holes sized like a metal flute’s.' },
      { id: 'simple', label: 'SIMPLE-SYSTEM', blurb: 'A simple-system wooden flute: a conical body with open finger holes and few or no keys — a different design.' },
    ],
  });
}

export const FLUTE_MODEL: InstrumentModel = mergeVariants(DESIGNS.map((d) => ({ variant: d, model: model(d) })));

export const holeAtS = (k: number) => holeS(SPEC, k);
