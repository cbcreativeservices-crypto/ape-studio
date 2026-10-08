/**
 * F12 SOUND LEVEL AND ENVIRONMENTAL NOISE — the recommended starting points
 * (charter §2 layer 1). Source keys: measurement_mics/SOURCES.md §0. Frame:
 * F12 geometry.ts (the ground at the facade; +x toward the road).
 *
 *   sl.open    an open position on the lawn, clear of the house, at the
 *              method's height — 1.5 m (5 ft) in the highway example
 *              (FHWA-FG, CONFIRMED); the distance back from the road is a
 *              drawing default (the question names the receiver) — the
 *              worked example, receiver A
 *   sl.facade  2 m (6.6 ft) out from the facade's midpoint, the same height
 *              (FHWA-FG, CONFIRMED: one of the method's building positions)
 *              — receiver B
 *   sl.wall    at the facade, close to but not touching it (FHWA-FG); "close"
 *              drawn 6–30 cm (a drawing default); the meter pointed up, as
 *              its data says for a position by a wall (PRACTICE)
 *
 * The meter is aimed as its data says: a free-field meter toward the road
 * (PRACTICE, F11's orientation rule — the lesson names no meter class).
 */
import type { DocumentedZone, MicPose, Vec3 } from '../../engine/model/types.ts';
import { ill, src } from '../shared/measure/measureModel.ts';
import { FACADE_MID_Z, METHOD_HEIGHT } from './geometry.ts';

const HEIGHT = { line: 'ground', min: METHOD_HEIGHT - 100, max: METHOD_HEIGHT + 100, prov: src('FHWA-FG', 'Set microphone height at 5 ft (1.5 m) above the ground') };
const TOWARD_ROAD = { maxOffAxis: 25, dir: { x: 1, y: 0, z: 0 }, prov: ill('a free-field meter pointed at the source as its data says (PRACTICE): within 25° of the road’s direction') };
const at = (x: number, z: number): Vec3 => ({ x, y: -METHOD_HEIGHT, z });
const towardRoad = (p: Vec3): MicPose => ({ p, az: 180, el: 0 });

export const F12_START = { A: at(3500, 2500), B: at(2000, FACADE_MID_Z), wall: at(180, FACADE_MID_Z) } as const;

export const F12_ZONES: DocumentedZone[] = [
  {
    id: 'sl.open',
    label: 'Receiver A: in the open, at the method’s height',
    band: 'Start on open ground, clear of the house — this drawing is 3–4.5 m back from the road’s edge — with the meter at the method’s height: 1.5 m (5 ft) above the ground in the highway example. Your question names the receiver.',
    kind: 'sourced',
    src: 'FHWA-FG',
    quote: 'Set microphone height at 5 ft (1.5 m) above the ground; FHWA distinguishes exterior facade positions from more open positions',
    bandProv: ill('the distance back from the road and the spot on the lawn are drawing defaults; only the height is the method’s'),
    refSurface: 'road',
    side: 'either',
    distance: { min: 3000, max: 4500 },
    radial: HEIGHT,
    box: { min: { x: 1500, y: -5000, z: 1200 }, max: { x: 6000, y: 0, z: 4200 }, prov: ill('on the lawn beside the house, clear of its walls (drawing default)') },
    requires: { micTypeIds: ['slm'] },
    aim: TOWARD_ROAD,
    drawn: { side: { u0: 2500, u1: 4000, v0: -1600, v1: -1400 }, top: { u0: 2500, u1: 4000, v0: 1200, v1: 4200 } },
    start: towardRoad(F12_START.A),
    tendency: 'The traffic with little of the house in it: what an open spot at this distance receives. It stands for this spot and this time — not for every listener nearby, or a worker’s day.',
    checks: ['The height and the distance written down', 'The windscreen on; the wind noted', 'You and the tripod clear of the meter'],
  },
  {
    id: 'sl.facade',
    label: 'Receiver B: 2 m out from the facade',
    band: 'For a building position, try 2 m (6.6 ft) out from the middle of the facade, at the same height — one method’s position, named as such.',
    kind: 'sourced',
    src: 'FHWA-FG',
    quote: 'building positions: 6.6 ft from the facade midpoint',
    bandProv: ill('2 m ± 10 cm, within 30 cm of the midpoint (the lab’s tolerance)'),
    refSurface: 'facade',
    side: 'either',
    distance: { min: 1900, max: 2100 },
    radial: HEIGHT,
    box: { min: { x: 0, y: -5000, z: FACADE_MID_Z - 300 }, max: { x: 5000, y: 0, z: FACADE_MID_Z + 300 }, prov: ill('at the facade’s midpoint: within 30 cm') },
    requires: { micTypeIds: ['slm'] },
    aim: TOWARD_ROAD,
    drawn: { side: { u0: 1900, u1: 2100, v0: -1600, v1: -1400 }, top: { u0: 1900, u1: 2100, v0: FACADE_MID_Z - 300, v1: FACADE_MID_Z + 300 } },
    start: towardRoad(F12_START.B),
    tendency: 'The traffic plus its reflection off the facade: usually a little more than in the open. Name it a facade position — never an open-field reading.',
    checks: ['The distance from the facade written down', 'The same height and settings as receiver A', 'Both meters on one clock'],
  },
  {
    id: 'sl.wall',
    label: 'At the facade, close to but not touching',
    band: 'Where the method asks for it, try a position right at the facade — close to it but not touching it (this drawing: 6–30 cm) — at the same height.',
    kind: 'sourced',
    src: 'FHWA-FG',
    quote: 'one "close to but not touching" the facade',
    bandProv: ill('"close to but not touching": 6–30 cm is the lab’s drawing; the meter pointed up, as its data says by a wall (PRACTICE)'),
    refSurface: 'facade',
    side: 'either',
    distance: { min: 60, max: 300 },
    radial: HEIGHT,
    box: { min: { x: 0, y: -5000, z: FACADE_MID_Z - 1000 }, max: { x: 400, y: 0, z: FACADE_MID_Z + 1000 }, prov: ill('along the facade, within 1 m of its midpoint') },
    requires: { micTypeIds: ['slm'] },
    drawn: { side: { u0: 60, u1: 300, v0: -1600, v1: -1400 }, top: { u0: 60, u1: 300, v0: FACADE_MID_Z - 1000, v1: FACADE_MID_Z + 1000 } },
    start: { p: F12_START.wall, az: 0, el: 90 },
    tendency: 'The direct sound and the wall’s reflection arriving almost together: the most the facade can add. A method that asks for it corrects for it; never call it a free-field reading.',
    checks: ['Close, but nothing touching the wall', 'The method’s correction for a facade position', 'The tripod clear of anyone’s path'],
  },
];
