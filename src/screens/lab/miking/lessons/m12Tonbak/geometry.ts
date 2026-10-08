/**
 * M12 TONBAK — where things are (charter §2 layer 2), frame H (model.ts).
 * Anchors are BUILT from model.ts; the art, the taps, the zones and the
 * readouts read only these.
 *
 *   H0  the head's centre, on the player's lap (drawing default height)
 *   n   the head's outward normal: toward the player's right, tilted up
 *   a   the drum's axis, into the body (−n)
 *   F   the centre of the lower opening, at the far end of the axis
 *
 * Solids: three cylinders along the axis (bowl, neck, foot) — the goblet
 * drawn generously, so a mic stops before the real outline.
 */
import type { DocumentedZone, InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { DEG, add, approachPose, mul, sectorPolys, v3 } from '../shared/handGeom.ts';
import { PROFILE, T_LEN, T_R, TONBAK as D } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const trial = (note: string): Provenance => ({ kind: 'trial', src: 'LESSON-M12', note });

const tilt = D.tilt.mm * DEG;
export const T_H0: Vec3 = v3(0, -D.headHeight.mm, 0);
export const T_N: Vec3 = v3(0, -Math.sin(tilt), Math.cos(tilt));
export const T_A: Vec3 = mul(T_N, -1);
export const T_F: Vec3 = add(T_H0, mul(T_A, T_LEN));
/** Along the axis: the point s mm into the drum. */
export const alongAxis = (s: number): Vec3 => add(T_H0, mul(T_A, s));
const AUD = v3(1, 0, 0);

/** Solid extents along the axis (generous round the goblet). */
const maxR = (s0: number, s1: number) => Math.max(...PROFILE.filter(([s]) => s >= s0 - 1e-9 && s <= s1 + 1e-9).map(([, r]) => r));
export const T_SOLIDS = {
  bowl: { s0: 0, s1: 0.4 * T_LEN, r: maxR(0, 0.4 * T_LEN) },
  neck: { s0: 0.4 * T_LEN, s1: 0.86 * T_LEN, r: maxR(0.34 * T_LEN, 0.86 * T_LEN) + 2 },
  foot: { s0: 0.86 * T_LEN, s1: T_LEN, r: maxR(0.84 * T_LEN, T_LEN) },
};
const cyl = (k: keyof typeof T_SOLIDS) => ({ kind: 'cyl' as const, a: alongAxis(T_SOLIDS[k].s0), b: alongAxis(T_SOLIDS[k].s1), r: T_SOLIDS[k].r });
const CLEAR = { mm: 10, prov: ill('keep the mic off the drum: 10 mm is the lab’s margin (no source gives one)') };

const parts: Part[] = [
  { id: 'tb.head', label: 'head (skin)', short: 'head', role: 'The skin head over the wide end. Strokes near the middle give the deep, low sound; strokes at the edge give the bright, ringing one.', prov: D.headD.prov },
  { id: 'tb.rim', label: 'edge of the head', short: 'edge', role: 'Where the edge strokes and much of the quiet finger work land — the bright part of the vocabulary.', prov: D.headD.prov },
  { id: 'tb.bowl', label: 'bowl', short: 'bowl', role: 'The wide upper body under the head. With the air inside, it shapes how the drum resonates.', solid: cyl('bowl'), clearance: CLEAR, prov: D.length.prov },
  { id: 'tb.neck', label: 'neck (waist)', short: 'neck', role: 'The narrow middle of the goblet, between the bowl and the foot.', solid: cyl('neck'), clearance: CLEAR, prov: D.waistD.prov },
  { id: 'tb.foot', label: 'foot', short: 'foot', role: 'The flared lower end, open at the bottom.', solid: cyl('foot'), clearance: CLEAR, prov: D.footD.prov },
  { id: 'tb.opening', label: 'lower opening', short: 'opening', role: 'The open lower end. Sound and air leave here too — a possible extra pickup point, not a second drumhead and not a sure source of bass.', prov: D.openingD.prov },
];

/** The player's space (ILLUSTRATIVE): the hands over the head, the body, the lap. */
const envelopes = [
  { id: 'env.hands', label: 'the player’s hands', shape: { kind: 'box' as const, min: v3(-330, -820, -60), max: v3(40, -470, 210) }, prov: ill('the hands’ reach over the head: a drawing default (no source gives it)') },
  { id: 'env.body', label: 'the player', shape: { kind: 'box' as const, min: v3(-700, -1350, -320), max: v3(-240, -380, 320) }, prov: ill('a seated player: a drawing default') },
  // The legs as the art draws them (the dashed thighs from above): two thighs
  // under the drum and the shins down to the floor.
  { id: 'env.thighL', label: 'the player’s left thigh', shape: { kind: 'box' as const, min: v3(-380, -520, -330), max: v3(180, -330, -110) }, prov: ill('a seated player’s thigh: a drawing default') },
  { id: 'env.thighR', label: 'the player’s right thigh', shape: { kind: 'box' as const, min: v3(-380, -520, 70), max: v3(180, -330, 290) }, prov: ill('a seated player’s thigh: a drawing default') },
  { id: 'env.shins', label: 'the player’s shins and feet', shape: { kind: 'box' as const, min: v3(100, -470, -340), max: v3(270, 0, 300) }, prov: ill('shins and feet of a seated player: a drawing default') },
];

/* ── SUGGESTED STARTING POINTS: the lesson's own trials (internal kind
 *    'trial'); one consistent style on screen (owner ruling). ── */
const z = (o: Omit<DocumentedZone, 'kind' | 'src' | 'side' | 'draw'> & { surfaceC: Vec3; surfaceN: Vec3; dA: [number, number] }): DocumentedZone => {
  const { surfaceC, surfaceN, dA, ...rest } = o;
  return { ...rest, kind: 'trial', src: 'LESSON-M12', side: 'outside', draw: sectorPolys(surfaceC, surfaceN, AUD, o.distance.min, o.distance.max, dA[0], dA[1]) };
};
/** A point between the head's centre and its rim, toward the audience. */
const MID = add(T_H0, mul(AUD, T_R * 0.4));

export const TONBAK_ZONES: DocumentedZone[] = [
  z({
    id: 'tb.B',
    label: 'Closer, beside the hands’ path',
    band: 'Try about 10–20 cm (4–8 in) from the chosen head area — only where the player can still play every stroke comfortably.',
    quote: 'Trial B: approximately 10–20 cm from the chosen head area if the player can complete every gesture comfortably; approach from beside the playing envelope',
    refSurface: 'head',
    distance: { min: 100, max: 200 },
    cone: { min: 35, max: 70, toward: AUD, prov: trial('"approach from beside the playing envelope": 35–70° off the head’s centre line, on the audience side, is the lab’s drawing of it') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the head: ±25° is the lab’s tolerance') },
    start: approachPose(T_H0, T_N, AUD, 150, 55, MID),
    surfaceC: T_H0,
    surfaceN: T_N,
    dA: [35, 70],
    tendency: 'More isolation and more articulation. Listen for contact noise or one stroke taking over; if quiet strokes disappear, check the target and the playing first.',
    checks: ['Every stroke still comfortable for the player', 'Contact and finger noise', 'Whether one articulation now dominates'],
  }),
  z({
    id: 'tb.A',
    label: 'From the audience side, angled at the head',
    band: 'Start about 25–40 cm (10–16 in) from the head, from the audience side, about 30–45° off its centre line, aimed between the centre and the rim.',
    quote: 'Trial A: a cardioid roughly 25–40 cm from the head, approached from the audience side … axis roughly 30–45 degrees from the head normal, directed toward a point between the center and rim',
    refSurface: 'head',
    distance: { min: 250, max: 400 },
    cone: { min: 30, max: 45, toward: AUD, prov: trial('"30–45 degrees from the head normal", "from the audience side"') },
    aim: { maxOffAxis: 20, prov: ill('"directed toward a point between the center and rim": within 20° of the head’s centre is the lab’s tolerance') },
    start: approachPose(T_H0, T_N, AUD, 320, 38, MID),
    surfaceC: T_H0,
    surfaceN: T_N,
    dA: [30, 45],
    tendency: 'A balanced picture of the whole vocabulary — deep strokes, edge strokes and quiet finger work together. If one hand or the edge dominates, move to a different viewpoint rather than only turning the mic.',
    checks: ['The hands’ full paths, vigorous passages too', 'Deep, edge and quiet strokes all present', 'The player’s own idea of the balance'],
  }),
  z({
    id: 'tb.D',
    label: 'Outside the lower opening (an extra mic)',
    band: 'As an extra mic, try about 15–30 cm (6–12 in) outside the lower opening, on its own stand, clear of the player’s legs.',
    quote: 'Trial D: a second microphone 15–30 cm outside the lower opening, on an independent support clear of the player’s legs and movement',
    refSurface: 'opening',
    distance: { min: 150, max: 300 },
    cone: { min: 0, max: 60, toward: AUD, prov: trial('"outside the lower opening": within 60° of the drum’s axis, on the audience side, is the lab’s drawing of it') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the opening: ±25° is the lab’s tolerance') },
    start: approachPose(T_F, T_A, AUD, 220, 35),
    surfaceC: T_F,
    surfaceN: T_A,
    dA: [0, 60],
    tendency: 'Some of the body’s resonance — or too much colour, floor noise or spill. It can support the head mic; it never replaces it. Bring it in quietly and check the pair in mono, both polarity states.',
    checks: ['The opening left unblocked', 'The stand clear of the legs and their movement', 'The pair in mono, both polarity states'],
  }),
  z({
    id: 'tb.C',
    label: 'Farther back, for the room',
    band: 'In a quiet studio, try about 60–100 cm (24–40 in) from the drum, seeing the head and the body, favouring neither hand.',
    quote: 'Trial C: in a suitable quiet studio, compare 60–100 cm from the instrument, selecting a viewpoint that covers the head and body without favoring one hand',
    refSurface: 'head',
    distance: { min: 600, max: 1000 },
    cone: { min: 20, max: 80, toward: AUD, prov: trial('a viewpoint "that covers the head and body": the audience side, 20–80° off the head’s line') },
    aim: { maxOffAxis: 30, prov: ill('aimed at the drum: ±30° is the lab’s tolerance') },
    start: approachPose(T_H0, T_N, AUD, 800, 55, alongAxis(80)),
    surfaceC: T_H0,
    surfaceN: T_N,
    dA: [20, 80],
    tendency: 'More of the room with the drum: useful for a solo in a good room, hard to use beside loud players or with monitors. Compare at matched loudness.',
    checks: ['The room is worth hearing', 'Matched loudness when you compare', 'Pattern and distance changed one at a time'],
  }),
  z({
    id: 'tb.E',
    label: 'A room mic',
    band: 'For solo tonbak in a good room, try a separate mic about 1–2 m (3–6½ ft) away, placed by the room’s sound.',
    quote: 'Trial E: for solo tonbak in a good room, test a separate room pickup approximately 1–2 m away, choosing its position by the room sound',
    refSurface: 'head',
    distance: { min: 1000, max: 2000 },
    cone: { min: 20, max: 85, toward: AUD, prov: trial('placed "by the room sound": the audience side is the lab’s drawing') },
    aim: { maxOffAxis: 35, prov: ill('aimed toward the drum: ±35° is the lab’s tolerance') },
    start: approachPose(T_H0, T_N, AUD, 1250, 65, alongAxis(80)),
    surfaceC: T_H0,
    surfaceN: T_N,
    dA: [20, 85],
    tendency: 'The room’s own sound around the drum. Keep the simpler setup if a second channel adds no useful space.',
    checks: ['The room sound is wanted', 'The mono fold-down', 'Whether it earns its channel'],
  }),
];

export const TONBAK_MODEL: InstrumentModel = {
  id: 'tonbak',
  name: 'tonbak (wooden, 40.6 cm long, 25.4 cm head)',
  parts,
  regions: [
    { id: 'r.head', partId: 'tb.head', label: 'the head', anchor: T_H0, prov: D.headD.prov, note: 'The head radiates most of the sound, toward the player’s right and up.' },
    { id: 'r.edge', partId: 'tb.rim', label: 'the edge', anchor: add(T_H0, mul(v3(-1, 0, 0), T_R * 0.85)), prov: D.headD.prov, note: 'The bright edge strokes and finger work land near the rim.' },
    { id: 'r.opening', partId: 'tb.opening', label: 'the lower opening', anchor: T_F, prov: D.openingD.prov, note: 'Sound and moving air also leave through the open lower end.' },
  ],
  surfaces: [
    { id: 'head', partId: 'tb.head', label: 'the head', point: T_H0, normal: T_N, target: true },
    { id: 'opening', partId: 'tb.opening', label: 'the lower opening', point: T_F, normal: T_A, target: true },
  ],
  lines: [{ id: 'axis', label: 'the drum’s axis', point: T_H0, dir: T_A }],
  envelopes,
  variants: [{ id: 'wood', label: 'WOODEN', blurb: 'A wooden tonbak with a skin head — the example drawn here. Tonbaks vary (one museum example is brass): work with the drum in front of you.' }],
  defaultVariant: 'wood',
  views: { side: { u0: -750, u1: 1250, v0: -1250, v1: 40 }, top: { u0: -750, u1: 1250, v0: -700, v1: 700 } },
  viewTags: { side: 'FROM THE PLAYER’S RIGHT', top: 'FROM ABOVE' },
  yFloor: { mm: 0, prov: ill('frame H: the floor is y = 0') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { wood: null },
};
