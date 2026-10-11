/**
 * F08 MOVING SOURCES AND PASS-BYS — the suggested starting points (charter
 * §2 layer 1). Keys: foley_footsteps/SOURCES.md §0, field_moving_passby/
 * SOURCES.md; geometry from field_moving_passby/GEOMETRY_PROPOSAL.md §3.
 * Distances are read from the path's centre line to the mic. No source gives
 * a setback, a speed or an angle (L74): every number is a DRAWING DEFAULT;
 * the four arrangements are the lesson's own (L12–L22):
 *
 *   fixed    FIXED MONO beside the path (L12) — the worked example
 *   pair     a COINCIDENT pair at the same spot: X/Y (TWO MICS) or M/S
 *            (DPA-STEREO); an ORTF pair for more breadth (L18) — drawn whole
 *            as ANOTHER START (logged L6G2-F08-01: a pair is never one mic)
 *   track    a TRACKED shotgun from a fixed, safe crew station (L21) — the
 *            "close" role named TRACKED through SETUP_PICKS (O-14)
 *   start/end  two separate mics near each end — two perspectives, not
 *            stereo (L24): ANOTHER START
 * The vehicle variant is a PAPER PLAN: the mics 8–10 m from the route's
 * centre line, behind the crew's setback line (drawing defaults, O-10).
 */
import type { DocumentedZone, MicPose, SetupPairData, Vec3 } from '../../engine/model/types.ts';
import { ill } from '../shared/measure/measureModel.ts';
import { arraySetup } from '../shared/field/fieldArrays.ts';
import { poseToward } from '../shared/field/frameG.ts';
import { ROUTE_X, VEH_X, WALK_SOURCE_H } from '../shared/field/sites.ts';
import { PB_H } from './geometry.ts';

const HEIGHT = { line: 'ground', min: PB_H - 250, max: PB_H + 250, prov: ill('1.5 m ± 25 cm: a drawing default (no source gives one, F08 L74)') };
const at = (x: number, z = 0, h = PB_H): Vec3 => ({ x, y: -h, z });
const facing = (p: Vec3): MicPose => ({ p, az: 180, el: 0 });

type Z = Omit<DocumentedZone, 'kind' | 'side' | 'refSurface' | 'distance' | 'box' | 'drawn' | 'radial' | 'requires'> & { variant: 'walk' | 'vehicle'; x0: number; x1: number; z0: number; z1: number; types: string[]; mount?: 'stand' | 'pole'; h?: { min: number; max: number } };
function pbZone(o: Z): DocumentedZone {
  const line = o.variant === 'walk' ? ROUTE_X : VEH_X;
  const { variant, x0, x1, z0, z1, types, mount, h, ...rest } = o;
  return {
    ...rest,
    kind: 'sourced',
    refSurface: variant === 'walk' ? 'path' : 'route',
    side: 'either',
    distance: { min: line - x1, max: line - x0 },
    radial: h ? { ...HEIGHT, min: h.min, max: h.max } : HEIGHT,
    box: { min: { x: x0, y: -4000, z: z0 }, max: { x: x1, y: 0, z: z1 }, prov: ill('the spot along the path: a drawing default') },
    requires: { variant, micTypeIds: types, ...(mount ? { mount } : {}) },
    drawn: { side: { u0: x0, u1: x1, v0: -(h?.max ?? PB_H + 250), v1: -(h?.min ?? PB_H - 250) }, top: { u0: x0, u1: x1, v0: z0, v1: z1 } },
  };
}

/** The tracked shotgun's capsule: 2.1 m from the path's line, aimed at the closest point. */
export const TRACK_P = at(900, 0, 1500);
export const F08_START = { walk: at(0), veh: at(0), start: at(900, -9000), end: at(900, 9000) } as const;
const walkAim = (p: Vec3, z: number): MicPose => poseToward(p, { x: ROUTE_X, y: -WALK_SOURCE_H, z });

export const F08_ZONES: DocumentedZone[] = [
  pbZone({
    id: 'pb.walk.fixed',
    variant: 'walk',
    x0: -1000,
    x1: 1000,
    z0: -2000,
    z1: 2000,
    types: ['arrOmni', 'arrCard', 'shotgunShort'],
    label: 'Fixed mono, beside the path',
    band: 'Start with one mic on a stand about 1.5 m up, about 2–4 m back from the path’s line and outside its envelope — an omni for broad, steady coverage, or a directional mic aimed at the crossing.',
    src: 'LESSON-F08',
    quote: 'One securely mounted microphone beside the authorized path at a safe setback. Choose an omni for a broad consistent pickup or a directional pattern aimed at the relevant arc (L12)',
    bandProv: ill('2–4 m and the height are drawing defaults: no source gives a setback (L74)'),
    start: facing(F08_START.walk),
    tendency: 'The walk as a stationary listener hears it: the level rises to the closest point and falls away, the tone changing with distance. A narrow mic can make the pass seem to vanish off its axis.',
    checks: ['The whole pass recorded — lead-in, crossing and tail', 'Headroom for the closest, loudest moment', 'The stand and cable outside the envelope'],
  }),
  pbZone({
    id: 'pb.walk.pair',
    variant: 'walk',
    x0: -1000,
    x1: 1000,
    z0: -2000,
    z1: 2000,
    types: ['arrCard', 'arrOmni', 'arrFig8'],
    label: 'A stereo pair at the listening point',
    band: 'For a stereo pass, start with an X/Y or M/S pair at the same spot — about 1.5 m up, 2–4 m back from the path’s line — facing the crossing, its channels labelled.',
    src: 'DPA-STEREO',
    quote: 'XY 90° (±45°), no comb summing to mono; MS mono-compatible; ORTF 17 cm, wider than XY with reasonable mono',
    bandProv: ill('the spot is a drawing default; the pairs’ geometry is sourced'),
    start: facing(F08_START.walk),
    tendency: 'The walker crosses the image from one side to the other without a mono hole — check the channel order and fold it to mono.',
    checks: ['Left and right labelled and checked', 'No hole in the middle as the walker crosses', 'The mono sum over the whole pass'],
  }),
  pbZone({
    id: 'pb.walk.track',
    variant: 'walk',
    x0: 200,
    x1: 1400,
    z0: -1500,
    z1: 1500,
    types: ['shotgunPole'],
    mount: 'pole',
    h: { min: 1250, max: 1800 },
    label: 'Tracked: a shotgun swung from a fixed station',
    band: 'For a tracked perspective, start with a shotgun on a pole about 1.6–2.8 m back from the path’s line, the operator’s feet planted at a fixed, safe station — swing it smoothly to follow the walker.',
    src: 'LESSON-F08',
    quote: 'From a safe fixed crew position, swivel an appropriate directional mic smoothly to follow the subject, without walking into its route (L21)',
    bandProv: ill('the station and the pole are drawing defaults'),
    start: walkAim(TRACK_P, 0),
    tendency: 'It holds the walker in focus across the pass — its level still follows distance, without a fixed mic’s off-axis fall — but handling or off-axis colour can creep in.',
    checks: ['Feet planted: the operator never steps toward the route', 'A smooth swing, no handling noise', 'The take labelled as a tracked, focused perspective'],
  }),
  pbZone({
    id: 'pb.walk.start',
    variant: 'walk',
    x0: 0,
    x1: 1400,
    z0: -11000,
    z1: -7000,
    types: ['arrCard', 'arrOmni'],
    label: 'A start mic near the approach',
    band: 'A second, separate mic near the approach — outside the envelope — one of two perspectives with an end mic.',
    src: 'LESSON-F08',
    quote: 'A start-position mic and an end-position mic are separate perspectives unless … planned as a stereo array (L24)',
    bandProv: ill('its place is a drawing default'),
    start: walkAim(F08_START.start, -6000),
    tendency: 'The approach close up, the departure far away: a perspective of its own, as one of two.',
    checks: ['Outside the envelope at the approach', 'Labelled as its own channel', 'Listened to alone before any blend'],
  }),
  pbZone({
    id: 'pb.walk.end',
    variant: 'walk',
    x0: 0,
    x1: 1400,
    z0: 7000,
    z1: 11000,
    types: ['arrCard', 'arrOmni'],
    label: 'An end mic near the departure',
    band: 'A second, separate mic near the departure — outside the envelope — one of two perspectives with the start mic.',
    src: 'LESSON-F08',
    quote: 'Their independent signals may arrive at different times; if combined, listen for comb filtering (L24)',
    bandProv: ill('its place is a drawing default'),
    start: walkAim(F08_START.end, 6000),
    tendency: 'The departure close up: with the start mic, two perspectives — and a moving comb if they are summed.',
    checks: ['Outside the envelope at the departure', 'Labelled as its own channel', 'Summed only after listening for a comb'],
  }),
  pbZone({
    id: 'pb.veh.fixed',
    variant: 'vehicle',
    x0: -1000,
    x1: 1000,
    z0: -2500,
    z1: 2500,
    types: ['arrOmni', 'arrCard', 'shotgunShort'],
    label: 'Fixed mono, behind the crew’s setback line',
    band: 'On the paper plan, one mic on a stand about 1.5 m up, about 8–10 m from the route’s centre line — behind the crew’s setback line, outside the route’s envelope and stopping room.',
    src: 'LESSON-F08',
    quote: 'A real vehicle session needs a permitted site, a driver, a communicated route, a safety lead and a plan that keeps all people and equipment outside the vehicle envelope (L6)',
    bandProv: ill('8–10 m, the envelope and the setback line are drawing defaults for a paper plan (O-10)'),
    start: facing(F08_START.veh),
    tendency: 'The whole pass from a stationary listener’s place: set the headroom for the loudest moment, not the quiet approach.',
    checks: ['The plan approved by the production’s safety lead', 'Headroom for the loudest moment', 'Hearing protection that keeps awareness'],
  }),
  pbZone({
    id: 'pb.veh.pair',
    variant: 'vehicle',
    x0: -1000,
    x1: 1000,
    z0: -2500,
    z1: 2500,
    types: ['arrCard', 'arrOmni', 'arrFig8'],
    label: 'A stereo pair behind the setback line',
    band: 'On the paper plan, an X/Y or M/S pair at the same spot, facing the route — its channels labelled, its geometry written down.',
    src: 'DPA-STEREO',
    quote: 'XY 90°; MS mono-compatible; ORTF 17 cm',
    bandProv: ill('the spot is a drawing default'),
    start: facing(F08_START.veh),
    tendency: 'The vehicle crosses the image; a fast pass makes time differences in a spaced pair change quickly — check mono over the whole pass.',
    checks: ['Channels labelled', 'Mono over the entire pass', 'The crew behind the line for every pass'],
  }),
];

const pairs = (zone: string, c: Vec3, variant: 'walk' | 'vehicle'): SetupPairData[] => [
  arraySetup({ label: 'X/Y pair facing the crossing (90°)', id: 'xy', zone, c, bearing: 0, typeA: 'arrCard', variants: [variant], line: 'The source crosses the image by level alone — no hole in the middle, a dependable mono sum. Check the channel order.' }),
  arraySetup({ label: 'M/S pair facing the crossing', id: 'ms', zone, c, bearing: 0, typeA: 'arrCard', typeB: 'arrFig8', variants: [variant], more: true, line: 'Decoded to left and right, the pass crosses the image; the width is set later, and in mono the Side cancels.' }),
  arraySetup({ label: 'ORTF pair, for more breadth (17 cm, 110°)', id: 'ortf', zone, c, bearing: 0, typeA: 'arrCard', variants: [variant], more: true, line: 'More lateral breadth from time and level — the time differences change through a fast or broad pass: check mono over all of it.' }),
];

export const F08_PAIRS: SetupPairData[] = [
  ...pairs('pb.walk.pair', F08_START.walk, 'walk'),
  { label: 'Start mic + end mic: two perspectives', A: { zone: 'pb.walk.start' }, B: { zone: 'pb.walk.end' }, variants: ['walk'], more: true, line: 'Two separate perspectives, not a stereo pair: each its own channel — and a moving comb if they are summed.' },
  ...pairs('pb.veh.pair', F08_START.veh, 'vehicle'),
];
