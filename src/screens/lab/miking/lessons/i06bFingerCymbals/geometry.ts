/**
 * I06b FINGER CYMBALS — where things are (charter §2 layer 2), frame H
 * (model.ts). Built from model.ts's numbers, so the drawing, the zones and
 * the collision agree.
 *
 *   P0    the held pair (ORCHESTRAL): one cymbal flat in front of the chest
 *   P0D   the dancer's hands (DANCE): the centre of the route
 *   The starting points are cones round +x (toward the audience), on the
 *   UPPER side: a mic a little above sees both cymbals and the release.
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { approachPose, v3 } from '../shared/handGeom.ts';
import { conePolys } from '../shared/metal/metalGeom.ts';
import { FC, P0, P0D, RA, RB } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const trial = (note: string): Provenance => ({ kind: 'trial', src: 'LESSON-FC', note });
export const N: Vec3 = v3(1, 0, 0);
export const UP: Vec3 = v3(0, -1, 0);

/** ORCHESTRAL: the held cymbal (flat, dome up) and the dropped one above it,
 *  tipped edge-first toward the player's right hand. */
export const HELD_C: Vec3 = P0;
export const DROP_C: Vec3 = v3(0, P0.y - FC.drop.mm, 18);
export const DROP_TILT = 35; // degrees, edge-first (a drawing choice)
/** DANCE: a pair on each hand, the hands apart. */
export const HAND_L: Vec3 = v3(40, P0D.y, -330);
export const HAND_R: Vec3 = v3(40, P0D.y, 330);

const CLEAR = { mm: 20, prov: ill('the cymbals move with the hands: 20 mm is the lab’s margin (no source gives one)') };
const parts: Part[] = [
  { id: 'fc.held', label: 'held cymbal', short: 'held cymbal', role: 'One cymbal held flat — parallel to the floor — by its strap. It is struck, and it rings.', solid: { kind: 'cyl', a: HELD_C, b: v3(HELD_C.x, HELD_C.y - FC.h.mm * 0.7, HELD_C.z), r: RA }, clearance: CLEAR, moving: true, variants: ['orchestral'], prov: { kind: 'sourced', src: 'PAS-ECV0220', quote: 'For classical percussion use, the finger cymbals will be held parallel to the floor.' } },
  { id: 'fc.drop', label: 'dropped cymbal', short: 'dropped cymbal', role: 'The other cymbal, dropped edge-first into the held one: its edge meets the held cymbal near its edge, then it lifts away so both ring.', solid: { kind: 'cyl', a: DROP_C, b: v3(DROP_C.x, DROP_C.y - FC.h.mm * 0.6, DROP_C.z + 10), r: RB }, clearance: CLEAR, moving: true, variants: ['orchestral'], prov: { kind: 'sourced', src: 'PAS-ECV0220', quote: 'While suspending one cymbal in one hand, strike with the other by dropping one edge of one cymbal into the other.' } },
  { id: 'fc.strap', label: 'strap or loop', short: 'strap', role: 'A leather strap or elastic loop through each cymbal’s centre hole: held by it, or worn on a thumb and a finger. Check it before playing — a loose cymbal can fly from the hand.', prov: { kind: 'sourced', src: 'MET-TAL', quote: 'Brass, leather' } },
  { id: 'fc.thumb', label: 'cymbal on the thumb', short: 'thumb cymbal', role: 'Worn on the thumb, it meets its partner on a finger of the same hand.', variants: ['dance'], prov: { kind: 'sourced', src: 'PAS-ECV0220', quote: 'Traditionally, finger cymbals are attached to the index finger and thumb' } },
  { id: 'fc.finger', label: 'cymbal on the finger', short: 'finger cymbal', role: 'Worn on a finger, opposite the thumb cymbal — a pair on each hand, played in rhythm while dancing.', variants: ['dance'], prov: { kind: 'sourced', src: 'PAS-ECV0220', quote: 'played in a manner reminiscent of Arabic music and dance' } },
  { id: 'fc.route', label: 'the dancer’s route', short: 'route', role: 'Where the dancer moves across the stage. A fixed mic hears the cymbals come and go along it — the route is part of the playing space.', variants: ['dance'], prov: ill('a drawing default: a 3 m line across the stage') },
];

const envelopes: Envelope[] = [
  { id: 'env.player', label: 'the player', shape: { kind: 'box', min: v3(-560, -1800, -290), max: v3(-240, 0, 290) }, prov: ill('a standing player: chest front at x = −250 (the family’s drawing default)'), variants: ['orchestral'] },
  { id: 'env.hands', label: 'the hands and the drop', shape: { kind: 'box', min: v3(-240, P0.y - FC.drop.mm - 70, -170), max: v3(110, P0.y + 80, 210) }, prov: ill('both hands and the dropped cymbal’s path, plus a margin: a drawing default'), variants: ['orchestral'] },
  { id: 'env.dance', label: 'the dancer’s moving space', shape: { kind: 'box', min: v3(-FC.danceR.mm, -FC.danceTop.mm, -FC.route.mm - FC.danceR.mm), max: v3(FC.danceR.mm, 0, FC.route.mm + FC.danceR.mm) }, prov: ill('the dance envelope (r 700 round the dancer, up to the raised hands) swept along the route: a drawing default'), variants: ['dance'] },
];

/* ── SUGGESTED STARTING POINTS: the lesson's own trials (internal kind
 *    'trial'), 30–60 cm for a still player — never closer than the general
 *    30 cm floor — and a wider, higher view for a dancer. ── */
const z = (o: Omit<DocumentedZone, 'kind' | 'src' | 'side' | 'draw'> & { c: Vec3; dA: [number, number] }): DocumentedZone => {
  const { c, dA, ...rest } = o;
  return { ...rest, kind: 'trial', src: 'LESSON-FC', side: 'outside', draw: conePolys(c, N, UP, o.distance.min, o.distance.max, dA[0], dA[1]) };
};
const BOTH = ['sdcCard', 'smallDynCard'];

export const FC_ZONES: DocumentedZone[] = [
  z({
    id: 'fc.A',
    label: 'In front, a little above the pair',
    band: 'Start about 30–45 cm (12–18 in) from the middle of the playing area, in front and a little above — where the mic sees both cymbals and their release.',
    quote: 'audition a cardioid condenser or another suitable microphone about 30–60 cm (1–2 ft) from the center of the repeated playing area, at a height that hears both cymbals and their release',
    refSurface: 'pair',
    distance: { min: 300, max: 450 },
    cone: { min: 10, max: 45, toward: UP, prov: trial('"at a height that hears both cymbals and their release": 10–45° above the line to the audience is the lab’s drawing of it') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the playing area: within 25° is the lab’s tolerance') },
    requires: { variant: 'orchestral', micTypeIds: BOTH },
    start: approachPose(P0, N, UP, 370, 25),
    c: P0,
    dA: [10, 45],
    tendency: 'Each attack clear and close, with less of the room. Listen for the bright attack drowning the ring — and for the level jumping if the hands move.',
    checks: ['Both hands’ whole path, the drop included', 'Every stroke audible, soft ones too', 'No clipping on the brightest accent'],
  }),
  z({
    id: 'fc.B',
    label: 'A little farther back',
    band: 'Try about 45–60 cm (18–24 in) from the playing area, from the same side and height.',
    quote: 'about 30–60 cm … Compare a direct view with a slightly offset view and a modestly wider position, at matched monitoring level.',
    refSurface: 'pair',
    distance: { min: 450, max: 600 },
    cone: { min: 10, max: 45, toward: UP, prov: trial('the same view, farther back') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the playing area: within 25° is the lab’s tolerance') },
    requires: { variant: 'orchestral', micTypeIds: BOTH },
    start: approachPose(P0, N, UP, 525, 25),
    c: P0,
    dA: [10, 45],
    tendency: 'Attack and ring more blended, with more of the room and steadier level if the hands move a little. Compare at matched level.',
    checks: ['Matched level when you compare', 'The ring after each accent', 'Spill from louder neighbours'],
  }),
  z({
    id: 'fc.high',
    label: 'High and in front, outside the dance',
    band: 'For a dancer, try a mic high and in front, well outside the whole route — in this drawing about 1.3–1.9 m (4–6 ft) from the dancer’s hands.',
    quote: 'for dance, a wider or overhead position may be safer and more consistent … A safe overhead or broader pickup may cover the performance better if the stage is quiet enough',
    refSurface: 'dance',
    distance: { min: 1300, max: 1900 },
    cone: { min: 35, max: 65, toward: UP, prov: trial('"a wider or overhead position": 35–65° above the line to the audience, outside the dance envelope, is the lab’s drawing of it') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the middle of the route: within 30° is the lab’s tolerance') },
    requires: { variant: 'dance', micTypeIds: BOTH },
    start: approachPose(P0D, N, UP, 1550, 50),
    c: P0D,
    dA: [35, 65],
    tendency: 'Steadier level along the route, with more of the stage and the room. Check the whole route — and the feedback margin — before relying on it.',
    checks: ['The whole route and every turn', 'Level at both ends of the route', 'Spill and feedback margin on stage'],
  }),
  z({
    id: 'fc.far',
    label: 'Farther out, a wider view',
    band: 'Or try a wider view a little above the dancer, covering the whole route — in this drawing about 1.9–2.6 m (6–8½ ft) away.',
    quote: 'Increase coverage or use a safe elevated position; mark the playing zone.',
    refSurface: 'dance',
    distance: { min: 1900, max: 2600 },
    cone: { min: 15, max: 45, toward: UP, prov: trial('a broader pickup farther out: the lab’s drawing') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the middle of the route: within 30° is the lab’s tolerance') },
    requires: { variant: 'dance', micTypeIds: BOTH },
    start: approachPose(P0D, N, UP, 2200, 28),
    c: P0D,
    dA: [15, 45],
    tendency: 'The whole route covered, with even more of the room and the stage — a picture of the performance rather than a close spot.',
    checks: ['Coverage at both ends of the route', 'How much stage spill it hears', 'Mono with any other mic'],
  }),
];

export const FC_MODEL: InstrumentModel = {
  id: 'fingerCymbals',
  name: 'pair of finger cymbals (5.5 and 4.8 cm)',
  parts,
  regions: [
    { id: 'r.pair', partId: 'fc.strap', label: 'the held pair', anchor: P0, prov: FC.dA.prov, note: 'The pair where it is played in front of the chest: both cymbals ring after each stroke.' },
    { id: 'r.hands', partId: 'fc.strap', label: 'the dancer’s hands', anchor: P0D, prov: ill('the hands’ usual height while dancing: a drawing default'), note: 'The pairs on the dancer’s hands, moving along the route.' },
  ],
  surfaces: [
    { id: 'pair', partId: 'fc.strap', label: 'the playing area', point: P0, normal: N, target: true, variants: ['orchestral'] },
    { id: 'dance', partId: 'fc.strap', label: 'the dancer’s hands', point: P0D, normal: N, target: true, variants: ['dance'] },
  ],
  lines: [
    { id: 'face', label: 'the line toward the audience', point: P0, dir: N, variants: ['orchestral'] },
    { id: 'faceD', label: 'the line toward the audience', point: P0D, dir: N, variants: ['dance'] },
  ],
  envelopes,
  variants: [
    { id: 'orchestral', label: 'HELD STILL', blurb: 'One cymbal held flat, the other dropped edge-first into it — a classical way of playing, with the player standing still.' },
    { id: 'dance', label: 'DANCE', blurb: 'A pair on the thumb and a finger of each hand, played in rhythm while dancing — the traditional way. The source moves.' },
  ],
  defaultVariant: 'orchestral',
  views: {
    side: { u0: -620, u1: 1000, v0: -1700, v1: -720 },
    top: { u0: -620, u1: 1000, v0: -700, v1: 700 },
  },
  viewsByVariant: {
    dance: { side: { u0: -1000, u1: 2700, v0: -3050, v1: 120 }, top: { u0: -1000, u1: 2700, v0: -2500, v1: 2500 } },
  },
  viewTags: { side: 'FROM THE SIDE', top: 'FROM ABOVE' },
  yFloor: { mm: 0, prov: ill('frame H: the floor is y = 0') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { orchestral: null, dance: null },
};
