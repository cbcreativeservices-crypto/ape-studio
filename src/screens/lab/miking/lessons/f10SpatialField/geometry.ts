/**
 * F10 SPATIAL AND SPECIALIST FIELD PICKUP — where things are (charter §2
 * layer 2). FRAME F10 (scene frame F's axes, in the engine's convention):
 * origin ON THE GROUND under the LISTENER'S POINT; +x toward the SCENE FRONT;
 * +y DOWN (the ground is y = 0, a height h is y = −h); +z to the listener's
 * RIGHT. Millimetres. The engine's side view looks from the listener's right
 * (u = x, v = y), its top view from above (u = x, v = z): the scene front is
 * to the right of the glass in both.
 *
 * Two scenes (the variants):
 *   plaza  A CITY SQUARE: a street singer 6 m in front (the stationary front
 *          source), a public footpath crossing between them with a walker on
 *          it (the moving source), a building's wall 3.5 m behind.
 *   event  AN OUTDOOR EVENT: a performer on a small stage 7 m in front, a PA
 *          loudspeaker on a pole either side of the stage facing the
 *          audience — the listener's point in the audience.
 *
 * The listener's ears: 1.7 m above the ground standing, 1.2 m seated (the
 * listener-height convention one sound-system maker uses for its measurement
 * mics, MEYER-MAPP — CONFIRMED; spatial_field/GEOMETRY_PROPOSAL §2 aligns the
 * dummy head to it). Every other place and size is a DRAWING DEFAULT
 * (unknowns in lesson.ts). Array geometry comes from
 * lessons/shared/ensemble/stereoArray.ts (its frame S turned into this one by
 * `fromS`).
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Shape3, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { EAR, EAR_HALF } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (spatial_field/GEOMETRY_PROPOSAL.md §2)');

/** The listener's ears above the ground: standing and seated (MEYER-MAPP). */
export const EAR_STANDING = 1700;
export const EAR_SEATED = 1200;
/** The listener's point: the middle of the ears, standing. */
export const LISTENER = v3(0, -EAR_STANDING, 0);

/* ── frame S (stereoArray) ↔ frame F10 ── */
/** Frame S: +x the conductor's right, +y down, +z downstage (toward the
 *  hall); an array facing 0° faces −z. Turned so that facing 0° faces +x
 *  here: x_F = −z_S, z_F = x_S. */
export const fromS = (p: Vec3): Vec3 => v3(-p.z, p.y, p.x);
export const toS = (p: Vec3): Vec3 => v3(p.z, p.y, -p.x);

/* ── a standing figure (the voice family's) turned to face −x at a place ── */
/** Frame V (a figure facing +x, lips at the origin, floor at +1550) → frame
 *  F10, the figure facing −x (toward the listener), its lips at `mouth`. */
export function figureToF(mouth: Vec3, p: Vec3): Vec3 {
  return v3(mouth.x - p.x, mouth.y + p.y, mouth.z - p.z);
}
/** The voice family's body solids (frame V) turned into frame F10 for a
 *  figure whose lips are at `mouth`, facing −x: a box's x and z bounds swap
 *  ends under the half turn. */
export function figureSolids(mouth: Vec3): Record<'head' | 'neck' | 'torso' | 'legs', Shape3> {
  const S = SINGER_SOLIDS;
  const box = (b: Shape3): Shape3 => {
    if (b.kind !== 'box') return b;
    const a = figureToF(mouth, b.min);
    const c = figureToF(mouth, b.max);
    return { kind: 'box', min: v3(Math.min(a.x, c.x), Math.min(a.y, c.y), Math.min(a.z, c.z)), max: v3(Math.max(a.x, c.x), Math.max(a.y, c.y), Math.max(a.z, c.z)) };
  };
  const cap = (s: Shape3): Shape3 => (s.kind === 'capsule' ? { kind: 'capsule', a: figureToF(mouth, s.a), b: figureToF(mouth, s.b), r: s.r } : s);
  return { head: cap(S.head), neck: cap(S.neck), torso: box(S.torso), legs: box(S.legs) };
}

/* ── the plaza ── */
export const PLAZA = {
  /** The street singer's lips (1.55 m up), 6 m from the listener's point. */
  singerMouth: v3(5900, -1550, 0),
  /** The public footpath across the square (its centre line along z). */
  path: { x0: 2200, x1: 3600 },
  /** The walker's walk along the path (left to right of the listener). */
  walk: { a: v3(2900, -1550, -5500), b: v3(2900, -1550, 5500) },
  /** The building's wall behind the listener (its face). */
  wallX: -3500,
} as const;
/** The walker's default place along the walk (where the drawings and the
 *  model's solid put them: 1.75 m to the listener's left). */
export const WALKER_AT = (-1750 - PLAZA.walk.a.z) / (PLAZA.walk.b.z - PLAZA.walk.a.z);

/* ── the event ── */
export const EVENT = {
  stage: { min: v3(6500, -800, -3500), max: v3(9600, 0, 3500) },
  /** The performer's lips on the stage (1.55 m above the stage). */
  perfMouth: v3(7300, -800 - 1550, 0),
  /** The PA loudspeakers (box centres), on poles either side of the stage. */
  pa: [v3(6800, -2600, -3200), v3(6800, -2600, 3200)] as const,
  paSize: { x: 450, y: 700, z: 450 },
} as const;

const paBox = (c: Vec3) => ({ min: v3(c.x - EVENT.paSize.x / 2, c.y - EVENT.paSize.y / 2, c.z - EVENT.paSize.z / 2), max: v3(c.x + EVENT.paSize.x / 2, c.y + EVENT.paSize.y / 2, c.z + EVENT.paSize.z / 2) });
export const PA_BOXES = EVENT.pa.map(paBox);

export const F10_VARIANTS: Variant[] = [
  { id: 'plaza', label: 'CITY SQUARE', blurb: 'A city square: a street singer 6 m in front, a public footpath between with a walker on it, a building’s wall behind.', phrase: 'in a city square' },
  { id: 'event', label: 'OUTDOOR EVENT', blurb: 'An outdoor event: a performer on a small stage 7 m in front, a PA loudspeaker either side facing the audience — the listener’s point among the audience.', phrase: 'at an outdoor event' },
];

/** The engine's views (side: from the listener's right; top: from above). */
export const F10_VIEWS: Record<'plaza' | 'event', { side: ViewBox; top: ViewBox }> = {
  plaza: { side: { u0: -1100, u1: 6600, v0: -2900, v1: 250 }, top: { u0: -1100, u1: 6600, v0: -3600, v1: 3600 } },
  event: { side: { u0: -1100, u1: 8000, v0: -3400, v1: 250 }, top: { u0: -1100, u1: 8000, v0: -4200, v1: 4200 } },
};

const SING = figureSolids(PLAZA.singerMouth);
const PERF = figureSolids(EVENT.perfMouth);
/** A figure's three further solids as unlisted parts (the head is the named part). */
const bodyParts = (id: string, label: string, f: ReturnType<typeof figureSolids>, variant: string): Part[] =>
  (['neck', 'torso', 'legs'] as const).map((k) => ({ id: `${id}.${k}`, label, short: label.split(' ').slice(-1)[0], role: '', solid: f[k], variants: [variant], listIn: [], prov: DD }));

const parts: Part[] = [
  { id: 'sp.listener', label: 'the listener’s point', short: 'listener', role: 'Where a listener would be: the middle of the ears, at standing (1.7 m) or seated (1.2 m) height, facing the scene front. A spatial mic starts here.', prov: { kind: 'sourced', src: 'MEYER-MAPP', quote: 'mic heights 1.2 m (~4 ft.) for seated audience, 1.7 m (~5.6 ft.) for standing audience' } },
  { id: 'sp.singer', label: 'the street singer (the front source)', short: 'singer', role: 'The stationary source in front. Every spatial mic hears it — with the square, the traffic and the walker around it. A close mic on the singer is a separate channel.', solid: SING.head, variants: ['plaza'], prov: DD },
  ...bodyParts('sp.singer', 'the street singer', SING, 'plaza'),
  { id: 'sp.walker', label: 'a walker on the footpath (a moving source)', short: 'walker', role: 'A moving source: a spatial capture should carry the walker across from one side to the other. Walk the route yourself at a safe distance to check it.', solid: { kind: 'box', min: v3(2700, -1760, -2000), max: v3(3100, 0, -1500) }, variants: ['plaza'], prov: DD },
  { id: 'sp.wall', label: 'a building’s wall behind', short: 'wall', role: 'A hard wall reflects the scene back to the listener’s point, a few milliseconds late. Part of the place — and part of every capture there.', solid: { kind: 'box', min: v3(PLAZA.wallX - 400, -7000, -9000), max: v3(PLAZA.wallX, 0, 9000) }, variants: ['plaza'], prov: DD },
  { id: 'sp.stage', label: 'the stage', short: 'stage', role: 'A small outdoor stage. The performer on it is the front source; the PA beside it is what the audience mostly hears.', solid: { kind: 'box', ...EVENT.stage }, variants: ['event'], prov: DD },
  { id: 'sp.performer', label: 'the performer', short: 'performer', role: 'The front source at the event. For intelligible speech or song, a close mic on the performer — the spatial mic is the audience’s view.', solid: PERF.head, variants: ['event'], prov: DD },
  ...bodyParts('sp.performer', 'the performer', PERF, 'event'),
  { id: 'sp.pa', label: 'a PA loudspeaker', short: 'PA', role: 'The PA faces the audience — and every open mic in front of it. A spatial array near it hears it loudly: keep the array out of the PA’s own feed, or it can make a feedback path.', solid: { kind: 'box', ...PA_BOXES[0] }, variants: ['event'], prov: DD },
  { id: 'sp.pa.r', label: 'a PA loudspeaker', short: 'PA', role: 'The PA on the other side of the stage.', solid: { kind: 'box', ...PA_BOXES[1] }, variants: ['event'], listIn: [], prov: DD },
];

const envelopes: Envelope[] = [
  { id: 'sp.path', label: 'the public footpath (keep it clear)', shape: { kind: 'box', min: v3(PLAZA.path.x0, -2400, -9000), max: v3(PLAZA.path.x1, 0, 9000) }, prov: ill('do not block a public route with a stand or an array (the lesson L43); the path’s place a drawing default'), variants: ['plaza'] },
];

/** The performer's headset grips over their right ear (the voice family's ear). */
const rims: Rim[] = [{ id: 'clip.ear', label: 'a headset over the performer’s right ear', c: figureToF(EVENT.perfMouth, v3(EAR.x, EAR.y, EAR_HALF)), axis: v3(0, 0, 1), r: 0, variants: ['event'], types: ['vocHeadset'] }];

export const F10_MODEL: InstrumentModel = {
  rims,
  id: 'f10-spatial',
  name: 'an outdoor scene and its listener’s point',
  parts,
  regions: [
    { id: 'r.singer', partId: 'sp.singer', label: 'the street singer', anchor: PLAZA.singerMouth, prov: DD, variants: ['plaza'], note: 'The front source: a voice from 6 m in front of the listener’s point, facing it.' },
    { id: 'r.walker', partId: 'sp.walker', label: 'the walker', anchor: v3(2900, -1550, -1750), prov: DD, variants: ['plaza'], note: 'A moving source on the footpath, crossing in front of the listener’s point from left to right.' },
    { id: 'r.perf', partId: 'sp.performer', label: 'the performer', anchor: EVENT.perfMouth, prov: DD, variants: ['event'], note: 'The front source on the stage, 7 m in front.' },
    { id: 'r.pa', partId: 'sp.pa', label: 'the PA on the left', anchor: v3(EVENT.pa[0].x - EVENT.paSize.x / 2, EVENT.pa[0].y, EVENT.pa[0].z), prov: DD, variants: ['event'], note: 'The left PA loudspeaker, facing the audience.' },
  ],
  surfaces: [
    { id: 'ground', partId: 'sp.listener', label: 'the ground', point: v3(0, 0, 0), normal: v3(0, -1, 0), plus: { words: 'above', key: 'ABOVE' } },
    { id: 'mouthF', partId: 'sp.singer', label: 'the singer’s lips', point: PLAZA.singerMouth, normal: v3(-1, 0, 0), target: true, plus: { words: 'from', key: 'FROM' }, variants: ['plaza'] },
    { id: 'mouthE', partId: 'sp.performer', label: 'the performer’s lips', point: EVENT.perfMouth, normal: v3(-1, 0, 0), target: true, plus: { words: 'from', key: 'FROM' }, variants: ['event'] },
  ],
  lines: [{ id: 'front', label: 'the scene front, from the listener’s point', point: LISTENER, dir: v3(1, 0, 0), words: { plus: 'off the front line', minus: 'off the front line', keyPlus: 'OFF FRONT', keyMinus: 'OFF FRONT' } }],
  envelopes,
  variants: F10_VARIANTS,
  defaultVariant: 'plaza',
  views: F10_VIEWS.plaza,
  viewsByVariant: { plaza: F10_VIEWS.plaza, event: F10_VIEWS.event },
  // The scene is the subject: every view keeps its authored box (the
  // listener's point and the sources both on the glass).
  fitAuthored: { side: true, top: true },
  yFloor: { mm: 0, prov: ill('the ground: the frame’s origin') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { plaza: null, event: null },
  // A spatial mic stands on a stand straight under its centre: a zero-length
  // level boom, the stand rising to the mic's tail (its centre: fieldMics.ts).
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 0, fixed: true },
  // The mics face the scene front (+x): the aim lane turns about that home.
  aimHome: { az: 180, el: 0 },
  // STARTING SETUPS' engine drawings (MICROPHONES) keep to the listener's
  // point: a head on a stand, not the whole square.
  setupFrameMax: { side: { u0: -700, u1: 900, v0: -2350, v1: 200 }, top: { u0: -700, u1: 900, v0: -800, v1: 800 } },
  viewTags: { side: 'SIDE · FROM THE LISTENER’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.04,
};
