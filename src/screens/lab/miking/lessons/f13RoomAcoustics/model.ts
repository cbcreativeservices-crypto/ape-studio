/**
 * F13 ROOM ACOUSTICS AND REVERBERATION — the recommended starting points
 * (charter §2 layer 1). Source keys: measurement_mics/SOURCES.md §0. Frame:
 * F13 geometry.ts (the test source's centre at the origin).
 *
 * ROOM ONLY (the omni test source):
 *   ra.A     receiver A, a seat mid-audience, at a seated ear height (1.2 m,
 *            MEYER-MAPP) — the worked example
 *   ra.B     receiver B, a seat near the back: move only the receiver
 *   ra.side  a side seat about 1 m from the side wall: a seat that differs
 *            in its boundaries (the 1 m is the proposal's drawing default)
 * SYSTEM + ROOM (the installed PA):
 *   ra.paA / ra.paB   the same kind of listener seats, measured from the PA
 *
 * The method sets the real counts, spacing and heights (F13 L23: "there is
 * no universal microphone height or source distance"); every distance band
 * here is a drawing default round a seat of the drawn room.
 */
import type { DocumentedZone, MicPose, Vec3 } from '../../engine/model/types.ts';
import { aimAt, ill, src } from '../shared/measure/measureModel.ts';
import { EAR, earY, PA_REF } from './geometry.ts';

const SEATED = { line: 'floor', min: EAR - 100, max: EAR + 100, prov: src('MEYER-MAPP', '1.2 m (~4 ft.) for seated audience') };
const RX = ['measRI', 'measFF'];
const SRC0: Vec3 = { x: 0, y: 0, z: 0 };
const at = (x: number, z: number): Vec3 => ({ x, y: earY, z });
const toward = (p: Vec3, q: Vec3): MicPose => ({ p, ...aimAt(p, q) });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const F13_START = { A: at(4300, 1500), B: at(7000, -2100), side: at(5200, 2700), paA: at(5200, -1500), paB: at(7000, -900) } as const;
const band = (p: Vec3, ref: Vec3, half: number) => ({ min: Math.round(dist(p, ref) - half), max: Math.round(dist(p, ref) + half) });

export const F13_ZONES: DocumentedZone[] = [
  {
    id: 'ra.A',
    label: 'Receiver A: a seat mid-audience',
    band: 'Start at a seat in the middle of the audience, the mic at a seated ear height — about 1.2 m (4 ft) — and its position marked so a second pass can find it.',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'mic heights "1.2 m (~4 ft.) for seated audience"; F13 L23 "Select receiver positions across relevant listeners"',
    bandProv: ill('the seat is a drawing default; the distance band is ±0.75 m round it'),
    refSurface: 'src',
    side: 'either',
    distance: band(F13_START.A, SRC0, 750),
    radial: SEATED,
    box: { min: { x: 3000, y: -5000, z: -3200 }, max: { x: 5800, y: 5000, z: 3200 }, prov: ill('in the middle rows of the drawn seating') },
    requires: { variant: 'room', micTypeIds: RX },
    drawn: { side: { u0: 3000, u1: 5800, v0: earY - 100, v1: earY + 100 }, top: { u0: 3000, u1: 5800, v0: -3200, v1: 3200 } },
    start: toward(F13_START.A, SRC0),
    tendency: 'The direct sound, the early reflections and the decay as a mid-audience listener meets them — for this seat, this source position and this room state.',
    checks: ['Height, distance and orientation written down', 'People and stands out of the direct path', 'The room state logged: doors, curtains, air handling'],
  },
  {
    id: 'ra.B',
    label: 'Receiver B: a seat near the back',
    band: 'Then move only the receiver: a seat near the back, the same height and set-up, the source left where it was.',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'F13 L48 "Move only the receiver to position B, document the difference and repeat"; seated 1.2 m',
    bandProv: ill('the seat is a drawing default; the distance band is ±0.75 m round it'),
    refSurface: 'src',
    side: 'either',
    distance: band(F13_START.B, SRC0, 750),
    radial: SEATED,
    box: { min: { x: 6100, y: -5000, z: -3200 }, max: { x: 7600, y: 5000, z: 3200 }, prov: ill('in the back rows of the drawn seating') },
    requires: { variant: 'room', micTypeIds: RX },
    drawn: { side: { u0: 6100, u1: 7600, v0: earY - 100, v1: earY + 100 }, top: { u0: 6100, u1: 7600, v0: -3200, v1: 3200 } },
    start: toward(F13_START.B, SRC0),
    tendency: 'Farther from the source: the direct sound weaker against the room, the decay more of the picture. Compare it with A band by band.',
    checks: ['Only the receiver moved', 'The same settings and room state as A', 'A repeat run at each position'],
  },
  {
    id: 'ra.side',
    label: 'A side seat, about 1 m from the wall',
    band: 'Try a seat near a side wall — about 1 m from it — at the same height: a listener whose nearest wall changes the early reflections.',
    kind: 'trial',
    src: 'F13-LESSON',
    quote: 'F13 L23 "including locations likely to differ in distance, boundaries and coverage … Avoid … an unrepresentative wall/corner unless that position itself is the target"',
    bandProv: ill('about 1 m from the wall (0.7–1.2 m) is the proposal’s drawing default for the wall-proximity flag'),
    refSurface: 'src',
    side: 'either',
    distance: band(F13_START.side, SRC0, 900),
    radial: SEATED,
    box: { min: { x: 3000, y: -5000, z: 2300 }, max: { x: 7600, y: 5000, z: 2800 }, prov: ill('0.7–1.2 m from the side wall') },
    requires: { variant: 'room', micTypeIds: RX },
    drawn: { side: { u0: 3000, u1: 7600, v0: earY - 100, v1: earY + 100 }, top: { u0: 3000, u1: 7600, v0: 2300, v1: 2800 } },
    start: toward(F13_START.side, SRC0),
    tendency: 'A real seat with a wall close by: a strong early reflection, and a decay that can differ from mid-audience. Keep it in the set; do not average it away.',
    checks: ['Its distance from the wall written down', 'Not pushed into a corner', 'The same set-up as A and B'],
  },
  {
    id: 'ra.paA',
    label: 'A listener seat, the PA as the source',
    band: 'With the installed PA as the source, start at a listener seat in its coverage, the mic at a seated ear height — and label the result “system + room”.',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'F13 L40 "Measure at listener positions with the actual speaker path, preset and safe test procedure"; seated 1.2 m',
    bandProv: ill('the seat is a drawing default; the distance band is ±0.75 m round it'),
    refSurface: 'pa',
    side: 'either',
    distance: band(F13_START.paA, PA_REF, 750),
    radial: SEATED,
    box: { min: { x: 3000, y: -5000, z: -3200 }, max: { x: 6200, y: 5000, z: 0 }, prov: ill('in the PA’s half of the seating') },
    requires: { variant: 'pa', micTypeIds: RX },
    drawn: { side: { u0: 3000, u1: 6200, v0: earY - 100, v1: earY + 100 }, top: { u0: 3000, u1: 6200, v0: -3200, v1: 0 } },
    start: toward(F13_START.paA, PA_REF),
    tendency: 'The house system and the room together, as this seat hears them: the loudspeaker’s aim, its processing and its coverage are all in it. Not a room-only figure.',
    checks: ['The PA, its preset and its processing named', 'The measurement mic routed to the analyzer only', 'Unrelated program muted; the venue told'],
  },
  {
    id: 'ra.paB',
    label: 'A seat near the back, the PA as the source',
    band: 'Then a seat near the back, the same height and set-up, the PA and its preset unchanged.',
    kind: 'sourced',
    src: 'MEYER-MAPP',
    quote: 'Meyer: place mics "in logical order, e.g., front to back"; seated 1.2 m',
    bandProv: ill('the seat is a drawing default; the distance band is ±0.75 m round it'),
    refSurface: 'pa',
    side: 'either',
    distance: band(F13_START.paB, PA_REF, 750),
    radial: SEATED,
    box: { min: { x: 6100, y: -5000, z: -3200 }, max: { x: 7600, y: 5000, z: 0 }, prov: ill('in the back rows of the PA’s half') },
    requires: { variant: 'pa', micTypeIds: RX },
    drawn: { side: { u0: 6100, u1: 7600, v0: earY - 100, v1: earY + 100 }, top: { u0: 6100, u1: 7600, v0: -3200, v1: 0 } },
    start: toward(F13_START.paB, PA_REF),
    tendency: 'The system and the room farther back: how the coverage holds up the room. Compare band by band with the seat nearer the front.',
    checks: ['The same PA preset as the first seat', 'Seats measured front to back, in order', 'The label: system + room'],
  },
];
