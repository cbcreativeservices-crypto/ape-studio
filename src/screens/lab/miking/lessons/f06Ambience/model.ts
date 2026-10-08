/**
 * F06 NATURAL AND URBAN AMBIENCE — the recommended starting points (charter
 * §2 layer 1). Keys: foley_footsteps/SOURCES.md §0 (the Lab 6 register) and
 * field_ambience/SOURCES.md; geometry from field_ambience/
 * GEOMETRY_PROPOSAL.md §3. Distances are read from the water's edge
 * (woodland) or the kerb (plaza) to the mic (an array's centre); every
 * position and the 1.5 m height are DRAWING DEFAULTS — the cited guidance
 * gives no universal height, spacing or distance (F06 L82). The methods are
 * sourced:
 *
 *   one       ONE MIC at the listening point (L12: an omni for all-round
 *             sound, or a directional mic aimed at a region) — the worked
 *             example; its pairs drawn whole on STARTING SETUPS:
 *               ORTF (TWO MICS): 170 mm / 110° included, recording angle 95°
 *                 (RODE-BAR, DPA-STEREO; D-ORTF)
 *               X/Y 90° (DPA-STEREO "90° angle (±45°)", RODE-BAR; F06-C2)
 *               A/B omnis 600 mm apart (O-8 drawing default; D-F06-AB)
 *               M/S (DPA-STEREO L = M + S, R = M − S)
 *   second    the same mic or pair at a SECOND permitted position, farther
 *             from the main bed (L32 "compare a central stereo position with
 *             a second permitted vantage point") — role "A SECOND POSITION"
 *             through SETUP_PICKS (O-14).
 */
import type { DocumentedZone, MicPose, SetupPairData, Vec3 } from '../../engine/model/types.ts';
import { ill } from '../shared/measure/measureModel.ts';
import { arraySetup } from '../shared/field/fieldArrays.ts';
import { PLAZA_KERB_X, STREAM_BANK_X } from '../shared/field/sites.ts';
import { AMB_H } from './geometry.ts';

const HEIGHT = { line: 'ground', min: AMB_H - 250, max: AMB_H + 250, prov: ill('1.5 m ± 25 cm: a drawing default (no source gives an ambience mic height, F06 L82)') };
const at = (x: number, z = 0): Vec3 => ({ x, y: -AMB_H, z });
/** Facing the scene (+x), level: the engine's az 180. */
const facing = (p: Vec3): MicPose => ({ p, az: 180, el: 0 });

type Spec = { types?: string[]; id: string; variant: 'woodland' | 'plaza'; surface: 'water' | 'kerb'; edge: number; x0: number; x1: number; start: number; label: string; band: string; tendency: string; checks: string[]; src: string; quote: string };
function ambZone(s: Spec): DocumentedZone {
  return {
    id: s.id,
    label: s.label,
    band: s.band,
    kind: 'sourced',
    src: s.src,
    quote: s.quote,
    bandProv: ill('the distance band and the spot are drawing defaults: the site is illustrated, the method is sourced'),
    refSurface: s.surface,
    side: 'either',
    distance: { min: s.edge - s.x1, max: s.edge - s.x0 },
    radial: HEIGHT,
    box: { min: { x: s.x0, y: -4000, z: -2500 }, max: { x: s.x1, y: 0, z: 2500 }, prov: ill('within 2.5 m either side of the line of view (drawing default)') },
    requires: { variant: s.variant, micTypeIds: s.types ?? ['arrOmni', 'arrCard'] },
    drawn: { side: { u0: s.x0, u1: s.x1, v0: -AMB_H - 250, v1: -AMB_H + 250 }, top: { u0: s.x0, u1: s.x1, v0: -2500, v1: 2500 } },
    start: facing(at(s.start)),
    tendency: s.tendency,
    checks: s.checks,
  };
}

export const F06_START = { woodland: at(0), plaza: at(0), woodSecond: at(-6000), plazaSecond: at(-5000) } as const;

export const F06_ZONES: DocumentedZone[] = [
  ambZone({
    id: 'amb.wood.one',
    variant: 'woodland',
    surface: 'water',
    edge: STREAM_BANK_X,
    x0: -500,
    x1: 1500,
    start: 0,
    label: 'At the listening point, just off the path',
    band: 'Start with one mic on a stand about 1.5 m up, about 5–7 m back from the water’s edge and just off the path — an omni for the whole place, or a directional mic aimed at the part you want.',
    tendency: 'The stream as a steady bed with the birds above it. A few steps nearer the water and it takes over; a few steps back and the birds come forward.',
    checks: ['The water-to-bird balance, by ear, before the stand is fixed', 'Wind on the capsule — and the protection that stops it', 'The stand and cable off the path'],
    src: 'LESSON-F06',
    quote: 'One mono microphone … Aim a directional mic at the relevant portion of a scene, or use an omni when all-around sound is desired (L12)',
  }),
  ambZone({
    id: 'amb.wood.pair',
    types: ['arrCard', 'arrOmni', 'arrFig8'],
    variant: 'woodland',
    surface: 'water',
    edge: STREAM_BANK_X,
    x0: -400,
    x1: 1200,
    start: 0,
    label: 'A stereo pair at the listening point',
    band: 'For a stereo picture, start with the pair at the same spot — about 1.5 m up, 5–7 m back from the water’s edge, facing the scene — its geometry set and written down.',
    tendency: 'The same balance as one mic, spread between the speakers: the stream across the front, the birds placed left and right. Check the middle, the edges and the mono sum.',
    checks: ['The pair’s geometry — spacing and angle — written down', 'Left and right checked with a known sound', 'The mono sum at the start, middle and end'],
    src: 'DPA-STEREO',
    quote: 'XY 90° (±45°); ORTF 17 cm; AB 20 cm → ±70° example; M/S L = M + S, R = M − S (÷√2)',
  }),
  ambZone({
    id: 'amb.wood.second',
    variant: 'woodland',
    surface: 'water',
    edge: STREAM_BANK_X,
    x0: -7500,
    x1: -4500,
    start: -6000,
    label: 'A second position, farther from the water',
    band: 'For a comparison, try the same mic at a second permitted spot across the path — about 11–14 m back from the water’s edge — and note what changed.',
    tendency: 'Less water, more of the birds and the whole wood: a broader picture. Compare it with the first position, one change at a time.',
    checks: ['The same height and the same mic as the first position', 'The water-to-bird balance against the first take', 'Nothing left on the path between the two'],
    src: 'LESSON-F06',
    quote: 'For a broad site, compare a central stereo position with a second permitted vantage point (L32)',
  }),
  ambZone({
    id: 'amb.plaza.one',
    variant: 'plaza',
    surface: 'kerb',
    edge: PLAZA_KERB_X,
    x0: -2000,
    x1: 2000,
    start: 0,
    label: 'In the open square, off every path',
    band: 'Start with one mic on a stand about 1.5 m up, in the open square about 7–11 m back from the kerb — off the sidewalk, the walkway and the café’s tables.',
    tendency: 'The traffic as a steady bed, the café and the footsteps nearer: the square as a whole. Note the traffic’s direction and any sirens or buses.',
    checks: ['Traffic, café and footsteps — the balance by ear', 'Speech that could be understood, and the permission it needs', 'The stand where nobody walks into it'],
    src: 'LESSON-F06',
    quote: 'Keep microphones and stands off vehicle lanes, walking paths and access routes (L33)',
  }),
  ambZone({
    id: 'amb.plaza.pair',
    types: ['arrCard', 'arrOmni', 'arrFig8'],
    variant: 'plaza',
    surface: 'kerb',
    edge: PLAZA_KERB_X,
    x0: -1600,
    x1: 1600,
    start: 0,
    label: 'A stereo pair at the listening point',
    band: 'For a stereo picture, start with the pair at the same spot — about 1.5 m up, 7.5–10.5 m back from the kerb, facing the scene — its geometry set and written down.',
    tendency: 'The same balance as one mic, spread between the speakers: the traffic across the front, the café and the walkway placed left and right. Check the middle, the edges and the mono sum.',
    checks: ['The pair’s geometry — spacing and angle — written down', 'Left and right checked with a known sound', 'The mono sum at the start, middle and end'],
    src: 'DPA-STEREO',
    quote: 'XY 90° (±45°); ORTF 17 cm; AB 20 cm → ±70° example; M/S L = M + S, R = M − S (÷√2)',
  }),
  ambZone({
    id: 'amb.plaza.second',
    variant: 'plaza',
    surface: 'kerb',
    edge: PLAZA_KERB_X,
    x0: -6500,
    x1: -3500,
    start: -5000,
    label: 'A second position, nearer the facade',
    band: 'For a comparison, try a second spot farther from the road — about 12.5–15.5 m back from the kerb, a few metres in front of the facade — and listen to what the wall adds.',
    tendency: 'Less traffic and more of the square, with the facade’s reflection behind: useful colour, or not — compare it with the first position.',
    checks: ['What the wall’s reflection adds, by ear', 'The same height and mic as the first position', 'The walkway and the door kept clear'],
    src: 'LESSON-F06',
    quote: 'A stable array, shielded from a nearby wall or other reflector only when its coloration is useful (L33)',
  }),
];

/** The pairs at each listening point, drawn whole (O-8: A/B 600 mm). */
const pairs = (zone: string, c: Vec3, variant: 'woodland' | 'plaza'): SetupPairData[] => [
  arraySetup({ label: 'ORTF pair at the listening point (17 cm, 110°)', id: 'ortf', zone, c, bearing: 0, typeA: 'arrCard', variants: [variant], line: 'More side-to-side spread than a coincident pair, from both time and level differences — check the low end and transients in mono.' }),
  arraySetup({ label: 'X/Y pair at the listening point (90°)', id: 'xy', zone, c, bearing: 0, typeA: 'arrCard', variants: [variant], more: true, line: 'Compact and dependable in mono; width is not the same as depth — listen to what lands in the middle and at the edges.' }),
  arraySetup({ label: 'Spaced omnis, 60 cm apart', id: 'ab', zone, c, bearing: 0, typeA: 'arrOmni', params: { spacing: 600 }, variants: [variant], more: true, line: 'A broad, open sense of space and the low end of the place — time differences can comb in a mono sum, so compare each channel too. Wider spacing is common for ambience — check it in mono.' }),
  arraySetup({ label: 'M/S pair at the listening point', id: 'ms', zone, c, bearing: 0, typeA: 'arrCard', typeB: 'arrFig8', variants: [variant], more: true, line: 'Width set later in the matrix; summed to mono the Side cancels and the Mid remains. Keep the raw Mid and Side labelled.' }),
];

export const F06_PAIRS: SetupPairData[] = [...pairs('amb.wood.pair', F06_START.woodland, 'woodland'), ...pairs('amb.plaza.pair', F06_START.plaza, 'plaza')];
