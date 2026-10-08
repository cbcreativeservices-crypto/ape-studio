/**
 * F02 CLOTHING AND BODY MOVEMENT — where things are (charter §2 layer 2), on
 * the shared Foley stage (frame F: the origin at the ACTIVE FABRIC — the held
 * garment's flex point, or the jacket's front where the arm swings past;
 * +x toward the mics, +y down, +z the performer's right; the stage floor
 * 1200 mm below the origin, at y = +1200 — a drawing default).
 *
 * Variants (foley_clothing/GEOMETRY_PROPOSAL.md §1):
 *   held  the Foley artist stands holding a leather jacket in both hands at
 *         chest height, flexing it — the way about nine cloth passes in ten
 *         are done;
 *   worn  the artist wears the jacket and walks in place: the sleeve and
 *         the body move against each other;
 *   live  a theatre performance station: the held jacket, the PA beside the
 *         stage and a wedge in front of the performer.
 * Keep-outs: the GESTURE ENVELOPE (the hands' and the garment's sweep from
 * the shoulders, arm reach 750 mm — a drawing default) and the exit path.
 */
import type { Envelope, InstrumentModel, Part, Provenance, RadiatingRegion, Variant, VariantId } from '../../engine/model/types.ts';
import { bodyColumn, exitPath, PERFORMER_DIMS, sidePose, standing, topPose, type Body3 } from '../shared/foley/performer.ts';
import { v3 } from '../shared/foley/frameF.ts';
import { boothSolids } from '../shared/foley/stage.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });

/** The floor under the active fabric (a drawing default: the garment at chest height). */
export const FLOOR = 1200;

/** HELD: the jacket gathered between the hands at the origin. */
export const HOLDER: Body3 = standing({
  floorY: FLOOR,
  x: -330,
  stepR: 30,
  stepL: -20,
  elR: v3(-300, 95, 205),
  wrR: v3(-80, 15, 170),
  elL: v3(-300, 95, -205),
  wrL: v3(-80, 15, -170),
  kindR: 'grip',
  kindL: 'grip',
});
/** WORN: walking in place in the jacket, the arms swinging past its front. */
export const WEARER: Body3 = standing({
  floorY: FLOOR,
  x: -150,
  stepR: 160,
  stepL: -170,
  liftL: 25,
  elR: v3(-240, 90, 215),
  wrR: v3(-300, 340, 230),
  elL: v3(-60, 95, -215),
  wrL: v3(40, 330, -235),
});
export const bodyOf = (v: VariantId): Body3 => (v === 'worn' ? WEARER : HOLDER);
export const POSES = {
  held: { side: sidePose(HOLDER), top: topPose(HOLDER) },
  worn: { side: sidePose(WEARER), top: topPose(WEARER) },
};
export const posesOf = (v: VariantId) => (v === 'worn' ? POSES.worn : POSES.held);

/** The gesture envelope: the shoulders' line, swept by the arm's reach. */
export function gestureEnvelope(b: Body3, variants: VariantId[]): Envelope {
  return {
    id: `env.gesture.${variants[0]}`,
    label: 'the hands’ and the garment’s whole movement',
    shape: { kind: 'capsule', a: b.shR, b: b.shL, r: PERFORMER_DIMS.reach.mm },
    prov: ill('the arm’s reach (750 mm) swept from the shoulders — a drawing default; F02 L8 "outside the performer’s complete arm and body path"'),
    variants,
  };
}

/** The held jacket's drawn extent (mm about the origin): a drawing default. */
export const JACKET = { hangs: 330, across: 230, thick: 90 } as const;

const VARIANTS: Variant[] = [
  { id: 'held', label: 'HELD', blurb: 'The artist holds a leather jacket in both hands at chest height and flexes it in time with the picture — the usual way a cloth pass is performed.', phrase: 'held in the hands' },
  { id: 'worn', label: 'WORN', blurb: 'The artist wears the jacket and walks in place: the sleeves and the body move against each other — for a whole garment, a heavy coat or winter synthetics.', phrase: 'worn and walked' },
  { id: 'live', label: 'LIVE STAGE', blurb: 'A live theatre: the artist at a fixed station beside the stage, the jacket held, the PA beside the stage and a wedge in front.', phrase: 'at a live station' },
];

function parts(): Part[] {
  return [
    { id: 'f02.artist', label: 'the Foley artist', short: 'artist', role: 'The performer makes the cloth sound in time with the picture — their breath, jewellery, shoes and other clothes are near the mic too.', moving: true, prov: ill('the shared adult figure (drawing default)') },
    { id: 'f02.jacketHeld', label: 'leather jacket, held', short: 'jacket', role: 'A whole jacket, not a swatch: leather and full jackets often need the whole item. Flexed and moved precisely — never just crumpled into a ball.', moving: true, prov: src('FF-CLOTH', 'holding fabric in hands (about "90%" of the time)'), variants: ['held', 'live'] },
    { id: 'f02.jacketWorn', label: 'leather jacket, worn', short: 'jacket', role: 'Worn and walked in: the sleeves brush the body and the coat flaps — the sound of the whole garment on a moving body.', moving: true, prov: src('FF-CLOTH', 'dressing in the clothes ("especially applicable to winter synthetic fabrics")'), variants: ['worn'] },
    { id: 'f02.hands', label: 'the hands', short: 'hands', role: 'The hands set the fold moving. Finger rub and a clasping hand can make their own small sounds close to a mic.', moving: true, prov: ill('the shared figure’s hands (drawing default)') },
    { id: 'f02.room', label: 'the stage room', short: 'room', role: 'Cloth is quiet, so the room is loud by comparison: ventilation, hum, traffic and other noises sit close under it.', prov: ill('a generic Foley stage room (drawing default)') },
    { id: 'f02.pa', label: 'PA loudspeaker, beside the stage', short: 'PA', role: 'The PA faces the audience — and every open mic on stage hears it too: a quiet cloth sound has little margin before feedback.', prov: ill('a typical theatre layout (drawing default)'), variants: ['live'], solid: boothSolids(FLOOR).pa },
    { id: 'f02.booth', label: 'the performance station’s front rail', short: 'station', role: 'A fixed, repeatable station at the side of the stage: the same place, the same distance, every night.', prov: src('ENO-FOLEY', 'A special booth is constructed stage left … so that the foley artist is visible to the audience'), variants: ['live'], solid: boothSolids(FLOOR).rail },
  ];
}

function regions(): RadiatingRegion[] {
  return [
    { id: 'r.flex', partId: 'f02.jacketHeld', label: 'the fold', anchor: v3(0, 0, 0), prov: ill('the jacket’s flex point between the hands — the lesson’s active fabric'), variants: ['held', 'live'], note: 'Where the leather flexes and rubs over itself between the hands: the sharp detail of the cloth pass.' },
    { id: 'r.body', partId: 'f02.jacketHeld', label: 'the hanging jacket', anchor: v3(0, JACKET.hangs * 0.6, 0), prov: ill('the hanging jacket (drawing default)'), variants: ['held', 'live'], note: 'The whole jacket swings and settles below the hands: the body and weight of the garment.' },
    { id: 'r.sleeve', partId: 'f02.jacketWorn', label: 'sleeve against the body', anchor: v3(0, 0, 0), prov: ill('the jacket’s front where the arms swing past — the lesson’s active fabric'), variants: ['worn'], note: 'The sleeves brush the jacket’s body as the arms swing: the rhythm of a walking character’s clothes.' },
    { id: 'r.room', partId: 'f02.room', label: 'the room', anchor: v3(-1700, -600, 0), prov: ill('the stage room (drawing default)'), note: 'A farther mic hears the room as much as the cloth — quiet cloth can sink under it.' },
  ];
}

const VIEWS = {
  side: { u0: -1000, u1: 3000, v0: -1700, v1: FLOOR + 60 },
  top: { u0: -1000, u1: 3000, v0: -1500, v1: 1500 },
};

export const F02_MODEL: InstrumentModel = {
  id: 'foleyClothing',
  name: 'a Foley cloth pass',
  parts: parts(),
  regions: regions(),
  surfaces: [{ id: 'fabric', partId: 'f02.artist', label: 'the active fabric', point: v3(0, 0, 0), normal: v3(1, 0, 0), target: true }],
  lines: [],
  envelopes: [
    gestureEnvelope(HOLDER, ['held', 'live']),
    gestureEnvelope(WEARER, ['worn']),
    { ...bodyColumn({ x: HOLDER.neck.x - 10, floorY: FLOOR, r: 220 }), id: 'env.body.held', variants: ['held', 'live'] },
    { ...bodyColumn({ x: WEARER.neck.x - 10, floorY: FLOOR, r: 220 }), id: 'env.body.worn', variants: ['worn'] },
    exitPath({ from: 900, to: 3200, floorY: FLOOR, x: -500 }),
  ],
  variants: VARIANTS,
  defaultVariant: 'held',
  views: VIEWS,
  viewTags: { side: 'SIDE · FROM THE ARTIST’S RIGHT', top: 'FROM ABOVE' },
  yFloor: { mm: FLOOR, prov: ill('the stage floor 1200 mm below the active fabric (a drawing default: the garment at chest height)') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { held: null, worn: null, live: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  insetAt: 'bottom',
};
