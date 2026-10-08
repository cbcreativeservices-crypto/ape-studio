/**
 * F11 MEASUREMENT MICROPHONES AND CALIBRATION — the suggested starting
 * points (charter §2 layer 1). Source keys: measurement_mics/SOURCES.md §0.
 * Frame: F11 geometry.ts (the loudspeaker's reference point at the origin).
 *
 *   mm.axis   on the loudspeaker's axis at the LOGGED distance — drawn at
 *             1 m (the proposal's drawing default; the method sets the real
 *             one), a free-field mic pointed at the reference point as its
 *             data says ("often 0°": PRACTICE, F11 L13) — the worked example
 *   mm.far    the same axis, farther: a second logged distance (2 m drawing)
 *   mm.off    the same distance, swung about 30° to one side: an off-axis
 *             reading logged as such (30° a drawing default)
 *   mm.room   a random-incidence mic out in the room, where sound arrives
 *             from many directions (GRAS-FF definitions; hand-off to F13)
 *
 * Aim tolerances and band widths are the lab's (ILLUSTRATIVE): a method
 * names its own.
 */
import type { DocumentedZone, MicPose, Vec3 } from '../../engine/model/types.ts';
import { aimAt, ill, src } from '../shared/measure/measureModel.ts';

const REF: Vec3 = { x: 0, y: 0, z: 0 };
const pose = (p: Vec3): MicPose => ({ p, ...aimAt(p, REF) });
const FF_TYPES = ['measFF', 'measQuarter'];
const LOGGED = ill('drawing default: the method gives the real distance; the lab draws 1 m (measurement_mics/GEOMETRY_PROPOSAL.md §4) with ±5 cm of room to rest the mic');
const ON_AXIS = { maxOffAxis: 5, prov: ill('"use the model’s defined incidence angle, often 0° on axis" (F11 L13, PRACTICE): within 5° is the lab’s tolerance') };

export const F11_START = {
  axis: { x: 1000, y: 0, z: 0 },
  far: { x: 2000, y: 0, z: 0 },
  off: { x: 1000 * Math.cos(Math.PI / 6), y: 0, z: 1000 * Math.sin(Math.PI / 6) },
  room: { x: 2500 * Math.cos((40 * Math.PI) / 180), y: 0, z: 2500 * Math.sin((40 * Math.PI) / 180) },
} as const;

export const F11_ZONES: DocumentedZone[] = [
  {
    id: 'mm.axis',
    label: 'On the axis, at the logged distance',
    band: 'Start on the loudspeaker’s axis at the distance your method names — this drawing uses 1 m (3.3 ft) — the mic pointed at the reference point, and the distance written down.',
    kind: 'trial',
    src: 'GRAS-FF',
    quote: 'free-field mics "measure the sound pressure as it was before the microphone was introduced"; incidence "often 0° on axis" (F11 L13)',
    bandProv: LOGGED,
    refSurface: 'baffle',
    side: 'either',
    distance: { min: 950, max: 1050 },
    radial: { line: 'axis', max: 50, prov: ill('on the axis: within 5 cm of it is the lab’s tolerance') },
    requires: { micTypeIds: FF_TYPES },
    aim: ON_AXIS,
    start: pose(F11_START.axis),
    tendency: 'A free-field reading of this loudspeaker from one logged place: a stable mic and fixed settings let you compare a change at the same spot. Without a calibrated chain and a named method it stays a relative reading.',
    checks: ['The distance and height written down', 'The mic pointed as its data says', 'You and the stand out of the path'],
  },
  {
    id: 'mm.far',
    label: 'Farther on the same axis',
    band: 'Try a second logged distance on the same axis — this drawing uses 2 m (6.6 ft) — same height, same aim, and write the new distance down.',
    kind: 'trial',
    src: 'F11-LESSON',
    quote: 'Record a reproducible reference point, height, distance from the source and boundaries, orientation (F11 L35)',
    bandProv: ill('drawing default: a second logged distance, 2 m ± 5 cm'),
    refSurface: 'baffle',
    side: 'either',
    distance: { min: 1950, max: 2050 },
    radial: { line: 'axis', max: 50, prov: ill('on the axis: within 5 cm') },
    requires: { micTypeIds: FF_TYPES },
    aim: ON_AXIS,
    start: pose(F11_START.far),
    tendency: 'More of the room’s reflections arrive with the direct sound the farther you go; the level drops with distance. One change at a time — then return to the first spot to check it repeats.',
    checks: ['Only the distance changed', 'Floor and wall reflections now nearer in time to the direct sound', 'A return to the first spot repeats'],
  },
  {
    id: 'mm.off',
    label: 'Off the axis, at a logged angle',
    band: 'Try the same logged distance swung about 30° to one side, still pointed at the reference point — an off-axis reading, written down with its angle.',
    kind: 'trial',
    src: 'F11-LESSON',
    quote: 'Choose and document orientation … repeat with one position or orientation change (F11 L44, L46)',
    bandProv: ill('drawing default: 30° (25–35°) is an example angle, 1 m ± 5 cm; the method names its own angles'),
    refSurface: 'ref',
    side: 'either',
    distance: { min: 950, max: 1050 },
    cone: { min: 25, max: 35, toward: { x: 0, y: 0, z: 1 }, prov: ill('25–35° off the loudspeaker’s axis, on one side') },
    drawn: { side: { u0: 800, u1: 925, v0: -100, v1: 100 }, top: { cu: 0, cv: 0, r0: 950, r1: 1050, a0: 25, a1: 35 } },
    box: { min: { x: -5000, y: -100, z: -5000 }, max: { x: 5000, y: 100, z: 5000 }, prov: ill('at the reference height: within 10 cm') },
    requires: { micTypeIds: FF_TYPES },
    aim: { maxOffAxis: 5, prov: ill('pointed at the reference point: within 5°') },
    start: pose(F11_START.off),
    tendency: 'The loudspeaker’s sound off its axis, not the mic’s: keep the mic pointed at the source so the reading changes only because the angle to the loudspeaker did.',
    checks: ['The angle and distance written down', 'The mic still pointed at the reference point', 'The same height as on the axis'],
  },
  {
    id: 'mm.room',
    label: 'Out in the room, random incidence',
    band: 'Where the method assumes sound from many directions, try a random-incidence mic out in the room — this drawing places it about 2.5 m (8 ft) out at the same height — set up as its data says.',
    kind: 'sourced',
    src: 'GRAS-FF',
    quote: 'random incidence "sound comes from many directions"',
    bandProv: ill('drawing default: 2.2–2.8 m from the reference point, 30–60° off the axis, the reference height ± 10 cm'),
    refSurface: 'ref',
    side: 'either',
    distance: { min: 2200, max: 2800 },
    cone: { min: 30, max: 60, toward: { x: 0, y: 0, z: 1 }, prov: ill('well off the loudspeaker’s axis: 30–60°, on one side (drawing default)') },
    drawn: { side: { u0: 1100, u1: 2425, v0: -100, v1: 100 }, top: { cu: 0, cv: 0, r0: 2200, r1: 2800, a0: 30, a1: 60 } },
    box: { min: { x: -5000, y: -100, z: -5000 }, max: { x: 5000, y: 100, z: 5000 }, prov: ill('at the reference height: within 10 cm') },
    requires: { micTypeIds: ['measRI'] },
    start: pose(F11_START.room),
    tendency: 'More of the room than of the loudspeaker: reflections from every side reach the capsule. A real room is diffuse only as far as the method needs, and not at every frequency.',
    checks: ['The mic’s field response matches the method', 'Its position, height and orientation written down', 'You clear of the capsule'],
  },
];

/** The sourced calibrator facts the pages print (kept beside the zones). */
export const F11_SRC = { cal: src('NTI-CAL', 'delivers 94 or 114 dB at a frequency of 1 kHz') };
