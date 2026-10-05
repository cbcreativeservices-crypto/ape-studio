/**
 * I06a TRIANGLE — where things are (charter §2 layer 2), frame H (model.ts).
 * Every solid, surface, zone and keep-out is BUILT from model.ts's corners,
 * so the drawing, the zones and the collision agree.
 *
 *   P0     the triangle's centre — the playing-zone centre the starting
 *          points are measured from ("from the instrument")
 *   n      +x: the triangle's face looks at the audience and the mic
 *   SIDE   the starting points' side: to the player's LEFT and a little
 *          above (the beater works on the player's right, below)
 */
import type { DocumentedZone, Envelope, InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { approachPose, unit, v3 } from '../shared/handGeom.ts';
import { conePolys } from '../shared/metal/metalGeom.ts';
import { HELD, MOUNTED, P0, ROD_D, rodPath, SIDE, TRI, TRI_H, type Corners } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const trial = (note: string): Provenance => ({ kind: 'trial', src: 'LESSON-TRI', note });
const DRAW = ill('a drawing default (triangle/GEOMETRY_PROPOSAL.md); no source gives it');

/** A plane point (z, y) at x = 0. */
const at = ([z, y]: [number, number], x = 0): Vec3 => v3(x, y, z);
export const N: Vec3 = v3(1, 0, 0);
export const SIDE_DIR: Vec3 = unit(v3(0, -0.35, -1));
const CLEAR = { mm: 25, prov: ill('the triangle swings a little on its line: 25 mm is the lab’s margin (no source gives one)') };

/** The clip and line above the top corner (held), or the two clips (mounted). */
export const CLIP = { h: 34, w: 22 };
const TOP = HELD.top;
export const CLIP_Y = TOP[1] - TRI.line.mm - CLIP.h;
/** The mounted stand: a post behind the triangle and a bar along the top. */
export const STAND = { x: -70, barY: MOUNTED.top[1] - 70, barHalf: SIDE / 2 + 60, r: 9 };

function rodParts(c: Corners, ids: [string, string, string], labels: [string, string, string], roles: [string, string, string], variant: string): Part[] {
  const p = rodPath(c);
  return [0, 1, 2].map((i) => ({
    id: ids[i],
    label: labels[i],
    short: labels[i].split(' (')[0],
    role: roles[i],
    solid: { kind: 'capsule' as const, a: at(p[i]), b: at(p[i + 1]), r: ROD_D / 2 },
    clearance: CLEAR,
    moving: true,
    variants: [variant],
    prov: TRI.side.prov,
  }));
}

const parts: Part[] = [
  ...rodParts(
    HELD,
    ['tri.base', 'tri.side', 'tri.oside'],
    ['base (the bottom bar)', 'side by the closed corner', 'side by the open corner'],
    [
      'The level bar at the bottom. Its middle, struck from the player’s side with a push away, is one of the common playing areas — away from the open corner.',
      'The outside of this side, the one joined to the base at the closed corner, is the other common playing area. Rolls bounce between it and the base inside that corner.',
      'The side that ends at the open corner. Players usually avoid striking here for ordinary playing.',
    ],
    'held',
  ),
  ...rodParts(
    MOUNTED,
    ['tri.sideM', 'tri.topM', 'tri.osideM'],
    ['side to the open corner', 'closed side (on top)', 'other side to the open corner'],
    [
      'One of the two sides that meet at the open corner, now at the bottom. Mounted, two beaters can play the lower sides.',
      'The side between the two closed corners, held level on top by two clips.',
      'The other side down to the open corner.',
    ],
    'mounted',
  ),
  { id: 'tri.open', label: 'open corner', short: 'open corner', role: 'Where the two ends of the bent rod nearly meet — the gap is what lets the bar ring freely round its corners. Held, it is on the player’s left (a right-handed player).', prov: { kind: 'sourced', src: 'PAS-1906', quote: 'If the player is right-handed, the triangle should be suspended so that the open vertex is on the player’s left' } },
  { id: 'tri.corner', label: 'closed corner by the base', short: 'closed corner', role: 'Where the base meets the side. Rolls are played just inside it: the beater bounces between the side and the base.', variants: ['held'], prov: { kind: 'sourced', src: 'PAS-1906', quote: 'They should be executed near the vertex connecting the base and the side of the triangle' } },
  {
    id: 'tri.clip',
    label: 'clip and lines',
    short: 'clip',
    role: 'A clip with a thin, strong line through it holds the triangle by its top corner, so the metal hangs freely and rings; a second “catch line” stops it falling if the first breaks. Holding the metal itself would damp it.',
    solid: { kind: 'box', min: v3(-CLIP.w / 2, CLIP_Y, -CLIP.w / 2), max: v3(CLIP.w / 2, CLIP_Y + CLIP.h, CLIP.w / 2) },
    variants: ['held'],
    prov: { kind: 'sourced', src: 'GROVER-TRI', quote: 'suspended using a very thin, yet strong, mono-filament line … a second "catch line" will prevent the triangle from falling to the floor' },
  },
  {
    id: 'tri.stand',
    label: 'stand and two clips',
    short: 'stand',
    role: 'Mounted on a stand by two clips at the closed corners — for quick changes between instruments or a two-beater passage. Listen for the stand ringing along, or a clip rattling.',
    solid: { kind: 'capsule', a: v3(STAND.x, 0, 0), b: v3(STAND.x, STAND.barY, 0), r: STAND.r },
    variants: ['mounted'],
    prov: { kind: 'sourced', src: 'PAS-1906', quote: 'use two clips at both closed vertices' },
  },
  {
    id: 'tri.bar',
    label: 'the stand’s bar',
    short: 'bar',
    role: 'The bar the two clips hang from.',
    solid: { kind: 'capsule', a: v3(STAND.x, STAND.barY, -STAND.barHalf), b: v3(STAND.x, STAND.barY, STAND.barHalf), r: 7 },
    variants: ['mounted'],
    listIn: [],
    prov: DRAW,
  },
  { id: 'tri.beater', label: 'beater', short: 'beater', role: 'A steel rod about 20–23 cm long; players keep several thicknesses. A heavier beater tends to a fuller sound, a thin one suits quiet playing. Its whole path — and the damping hand — is the player’s space.', prov: TRI.beater.prov },
];

const B = HELD.closed[1]; // the base's height (y)
const envelopes: Envelope[] = [
  { id: 'env.player', label: 'the player', shape: { kind: 'box', min: v3(-560, -1800, -290), max: v3(-240, 0, 290) }, prov: ill('a standing player: chest front at x = −250 (the family’s drawing default)') },
  { id: 'env.beater', label: 'the beater’s path', shape: { kind: 'box', min: v3(-300, B - 90, -130), max: v3(80, B + 90, 260) }, prov: ill('the beater and the striking hand, pushing the base away, plus a margin: no source gives the path'), variants: ['held'] },
  { id: 'env.hand', label: 'the hand holding the clip', shape: { kind: 'box', min: v3(-260, CLIP_Y - 90, -75), max: v3(45, CLIP_Y + 5, 75) }, prov: ill('the left hand at the clip: a drawing default'), variants: ['held'] },
  { id: 'env.beaters', label: 'the two beaters’ paths', shape: { kind: 'box', min: v3(-300, P0.y - 40, -170), max: v3(80, MOUNTED.open[1] + 80, 170) }, prov: ill('two beaters on the lower sides, plus a margin: a drawing default'), variants: ['mounted'] },
];

/* ── RECOMMENDED STARTING POINTS: the lesson's own trials (internal kind
 *    'trial'), 30–60 cm from the instrument, never closer than Shure's
 *    general 30 cm floor; one consistent style on screen. ── */
const z = (o: Omit<DocumentedZone, 'kind' | 'src' | 'side' | 'draw' | 'refSurface'> & { dA: [number, number] }): DocumentedZone => {
  const { dA, ...rest } = o;
  return { ...rest, kind: 'trial', src: 'LESSON-TRI', side: 'outside', refSurface: 'tri', draw: conePolys(P0, N, SIDE_DIR, o.distance.min, o.distance.max, dA[0], dA[1]) };
};
const BOTH = ['sdcCard', 'smallDynCard'];

export const TRI_ZONES: DocumentedZone[] = [
  z({
    id: 'tri.A',
    label: 'In front, a little to one side',
    band: 'Start about 30–45 cm (12–18 in) from the triangle, in front of it and a little to one side, level with it or a little above — aimed at the bars as a whole, away from the beater.',
    quote: 'audition a small diaphragm condenser or another suitable mic roughly 30–60 cm (1–2 ft) from the instrument at or somewhat above its playing height. Aim toward the sounding bars as a whole, away from the beater’s contact path.',
    distance: { min: 300, max: 450 },
    cone: { min: 10, max: 45, toward: SIDE_DIR, prov: trial('"in front of and slightly to one side": 10–45° off the face’s line, toward the player’s left and a little above, is the lab’s drawing of it') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the bars as a whole: within 25° of the triangle’s centre is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: approachPose(P0, N, SIDE_DIR, 370, 28),
    dA: [10, 45],
    tendency: 'More of the direct attack and less of the room or the neighbours. Listen for an exaggerated metallic tick on strong strokes — and check the soft strokes and the cutoff too.',
    checks: ['The beater’s whole path and the damping hand', 'Light stroke, strong stroke, roll and cutoff', 'No clipping on the strongest stroke'],
  }),
  z({
    id: 'tri.B',
    label: 'A little farther back',
    band: 'Try about 45–60 cm (18–24 in) from the triangle, from the same side, at or a little above its height.',
    quote: 'roughly 30–60 cm (1–2 ft) from the instrument … farther away may integrate the sound and room, but can lose isolation',
    distance: { min: 450, max: 600 },
    cone: { min: 10, max: 45, toward: SIDE_DIR, prov: trial('the same view as the first starting point, farther back') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the bars as a whole: within 25° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: approachPose(P0, N, SIDE_DIR, 525, 28),
    dA: [10, 45],
    tendency: 'The attack and the ring more blended, with more of the room — and less isolation from the neighbours. Compare it with the closer spot at matched level.',
    checks: ['Matched level when you compare', 'The ring and the room together', 'Spill from louder neighbours'],
  }),
  z({
    id: 'tri.C',
    label: 'A wider view, for the room',
    band: 'In a good-sounding, quiet room, try about 60–100 cm (2–3 ft) away, seeing the whole triangle — for the full shimmer and its decay.',
    quote: 'Full sustained shimmer: Confirm … suspension and natural decay; compare a slightly wider position in a suitable room.',
    distance: { min: 600, max: 1000 },
    cone: { min: 0, max: 40, toward: SIDE_DIR, prov: trial('"a slightly wider position in a suitable room": 60–100 cm is the lab’s drawing of it') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the triangle: within 30° is the lab’s tolerance') },
    requires: { micTypeIds: BOTH },
    start: approachPose(P0, N, SIDE_DIR, 800, 15),
    dA: [0, 40],
    tendency: 'The overtones and the length of the ring, with the room around them. Useful in a quiet room; on a loud stage it hears far more of everything else.',
    checks: ['The room is worth hearing', 'Quiet details and the cutoff still clear', 'Clip noises in the pauses'],
  }),
];

export const TRI_MODEL: InstrumentModel = {
  id: 'triangle8',
  name: '8 in triangle',
  parts,
  regions: [
    { id: 'r.base', partId: 'tri.base', label: 'the struck bar', anchor: at([0, B]), prov: TRI.side.prov, note: 'Where the beater usually lands: the attack starts here, and the whole rod rings.' },
    { id: 'r.top', partId: 'tri.side', label: 'the top of the triangle', anchor: at(HELD.top), prov: TRI.side.prov, note: 'The far end of the rod from the stroke: the whole bent bar rings, so sound leaves all along it.' },
  ],
  surfaces: [{ id: 'tri', partId: 'tri.base', label: 'the triangle', point: P0, normal: N, target: true }],
  lines: [{ id: 'face', label: 'the line straight out of its face', point: P0, dir: N }],
  envelopes,
  variants: [
    { id: 'held', label: 'HELD', blurb: 'Held by its clip out in front of the chest, the open corner on the player’s left, struck on the base with a push away. Some players hold it at eye level.' },
    { id: 'mounted', label: 'MOUNTED', blurb: 'Hung on a stand by two clips at the closed corners — for quick changes, or two beaters. Listen for the stand ringing along.' },
  ],
  defaultVariant: 'held',
  views: {
    side: { u0: -620, u1: 1080, v0: -1720, v1: -880 },
    top: { u0: -620, u1: 1080, v0: -760, v1: 520 },
  },
  viewTags: { side: 'SIDE · EDGE-ON', top: 'FROM ABOVE' },
  yFloor: { mm: 0, prov: ill('frame H: the floor is y = 0') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { held: null, mounted: null },
};

/** For the art: the triangle's height and the base line. */
export const BASE_Y = B;
export const TOP_Y = HELD.top[1];
export { TRI_H };
