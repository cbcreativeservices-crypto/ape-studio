/**
 * F15 MACHINERY AND PRODUCT SOUND — the recommended starting points (charter
 * §2 layer 1). Source keys: measurement_mics/SOURCES.md §0; the lesson's
 * claims: machinery_sound/SOURCES.md. Frame: F15 geometry.ts (the fan's
 * footprint centre on the table top at the origin, the airflow along +x).
 *
 *   mp.A       the user's position: 1 m from the fan (drawing default),
 *              beside the airflow (45° off it), at a seated ear height
 *              (1.2 m — MEYER-MAPP, the proposal's choice for a seated user)
 *   mp.B       the same radius and height, 90° to the other side
 *   mp.C       the same radius and height, behind the fan (its motor and
 *              rear vent)
 *   mp.detail  a close detail mic for a live demo: beside the motor housing,
 *              outside the exclusion zone, kept out of the PA
 *   mp.far     a listener-like Foley perspective about 2 m out, beside the
 *              airflow
 *
 * Every position is outside the exclusion zone and the airflow (tested).
 * The radius, the angles and the heights are drawing defaults: the
 * product's own test code sets real ones (F15 L30).
 */
import type { DocumentedZone, MicPose, Vec3 } from '../../engine/model/types.ts';
import { aimAt, ill, src } from '../shared/measure/measureModel.ts';
import { CENTRE, EAR_Y, HUB, MOTOR } from './geometry.ts';

const DEG = Math.PI / 180;
const toward = (p: Vec3, q: Vec3): MicPose => ({ p, ...aimAt(p, q) });
const at = (deg: number, r = 1000): Vec3 => ({ x: r * Math.cos(deg * DEG), y: EAR_Y, z: r * Math.sin(deg * DEG) });
const SEATED = { line: 'floor', min: 1100, max: 1300, prov: src('MEYER-MAPP', '1.2 m (~4 ft.) for seated audience — reused as a seated user’s ear height (machinery_sound/GEOMETRY_PROPOSAL.md §2)') };
const RING = (a0: number, a1: number) => {
  const xs = [950, 1050].flatMap((r) => [a0, a1].map((a) => r * Math.cos(a * DEG)));
  return { top: { cu: 0, cv: 0, r0: 950, r1: 1050, a0, a1 }, side: { u0: Math.min(...xs) - 60, u1: Math.max(...xs) + 60, v0: EAR_Y - 100, v1: EAR_Y + 100 } };
};
const AIR = ['measFF', 'measRI'];

export const F15_START = {
  A: at(45),
  B: at(-90),
  C: at(180),
  detail: { x: MOTOR.x, y: HUB.y, z: 620 },
  far: at(30, 2000),
} as const;
const S = F15_START;

export const F15_ZONES: DocumentedZone[] = [
  {
    id: 'mp.A',
    label: 'Position A: where the user sits',
    band: 'Start at the user’s position — this drawing puts it 1 m (3.3 ft) from the fan, beside its airflow, at a seated ear height of about 1.2 m (4 ft) — with the height, distance and aim written down.',
    kind: 'trial',
    src: 'F15-LESSON',
    quote: 'Mount a suitable mic at the defined normal listening/work position, with height, orientation, distance and operating state logged (F15 L13)',
    bandProv: ill('drawing default: d = 1 m ± 5 cm, 35–55° off the airflow (machinery_sound/GEOMETRY_PROPOSAL.md §2)'),
    refSurface: 'centre',
    side: 'either',
    distance: { min: 950, max: 1050 },
    radial: SEATED,
    cone: { min: 35, max: 55, toward: { x: 0, y: 0, z: 1 }, prov: ill('beside the airflow: 35–55° off its axis, on the user’s side') },
    drawn: RING(35, 55),
    requires: { micTypeIds: AIR },
    start: toward(S.A, HUB),
    tendency: 'The fan as its user hears it, at this position, this speed and this load: a pressure at one point, not the fan’s total output and not a personal dose.',
    checks: ['Outside the exclusion zone and the airflow', 'Height, distance and aim written down', 'The speed and the load written down'],
  },
  {
    id: 'mp.B',
    label: 'Position B: the same radius, to the side',
    band: 'Then the same 1 m radius and height, a quarter-turn to the other side of the fan — only the angle changes.',
    kind: 'trial',
    src: 'F15-LESSON',
    quote: 'Choose a fixed reference coordinate relative to product housing and a second useful angle at the same documented distance (F15 L14)',
    bandProv: ill('drawing default: d = 1 m ± 5 cm, 80–100° off the airflow on the other side'),
    refSurface: 'centre',
    side: 'either',
    distance: { min: 950, max: 1050 },
    radial: SEATED,
    cone: { min: 80, max: 100, toward: { x: 0, y: 0, z: -1 }, prov: ill('a quarter-turn to the other side: 80–100°') },
    drawn: RING(-100, -80),
    requires: { micTypeIds: AIR },
    start: toward(S.B, HUB),
    tendency: 'The fan from its side: less of the blades’ whoosh, more of the housing. A difference from A belongs to the angle — if the cycle and the room stayed the same.',
    checks: ['Only the angle changed', 'The same gain and the same cycle', 'The fan’s speed unchanged'],
  },
  {
    id: 'mp.C',
    label: 'Position C: behind the fan',
    band: 'And the same radius and height behind the fan, toward the motor and its rear vent — never reaching past the guard to get there.',
    kind: 'trial',
    src: 'F15-LESSON',
    quote: 'Record a safe set of coordinates around an exterior perimeter … include suspected vent and panel directions if accessible without approaching hazards (F15 L15)',
    bandProv: ill('drawing default: d = 1 m ± 5 cm, behind the fan (165–180° off the airflow)'),
    refSurface: 'centre',
    side: 'either',
    distance: { min: 950, max: 1050 },
    radial: SEATED,
    cone: { min: 165, max: 180, prov: ill('behind the fan: 165–180° off the airflow') },
    drawn: { top: { cu: 0, cv: 0, r0: 950, r1: 1050, a0: 165, a1: 195 }, side: { u0: -1060, u1: -900, v0: EAR_Y - 100, v1: EAR_Y + 100 } },
    requires: { micTypeIds: AIR },
    start: toward(S.C, HUB),
    tendency: 'The motor and its vent more than the blades — and the wall behind it, close by. A peak here may be the motor, the vent’s air or a wind artifact.',
    checks: ['Reached without passing the guard', 'The wall’s distance noted', 'Then back to A for a repeat'],
  },
  {
    id: 'mp.detail',
    label: 'A close detail mic, outside the zone',
    band: 'For a live demonstration, try a detail mic beside the motor housing — about 60 cm (2 ft) from it, just outside the exclusion zone — routed to the recorder, kept out of the PA.',
    kind: 'trial',
    src: 'F15-LESSON',
    quote: 'Keep stand, cable and mic outside moving paths; use a receiver perspective that communicates the product without hazardous proximity or feedback into local PA (F15 L38)',
    bandProv: ill('drawing default: 55–70 cm from the motor housing, at its height (outside the 0.49 m zone)'),
    refSurface: 'motor',
    side: 'either',
    distance: { min: 550, max: 700 },
    box: { min: { x: MOTOR.x - 250, y: HUB.y - 100, z: 450 }, max: { x: MOTOR.x + 250, y: HUB.y + 100, z: 800 }, prov: ill('beside the housing, at its height') },
    requires: { micTypeIds: ['sdcCard', 'measFF'] },
    start: toward(S.detail, MOTOR),
    tendency: 'The motor’s hum and the housing far more than the room: one panel’s character, not the whole fan at a listening distance.',
    checks: ['Outside the exclusion zone', 'Out of the PA, so no feedback', 'The cable clear of the fan’s paths'],
  },
  {
    id: 'mp.far',
    label: 'A listener-like perspective, about 2 m out',
    band: 'For a Foley or storytelling perspective, try about 2 m (6.6 ft) out beside the airflow, at a seated ear height — and log the real load and surface.',
    kind: 'trial',
    src: 'F15-LESSON',
    quote: 'Choose a listener-like position and safe exterior detail positions to capture operation and material character; log the actual load and surface (F15 L37)',
    bandProv: ill('drawing default: 1.95–2.1 m from the hub, 25–35° off the airflow'),
    refSurface: 'hub',
    side: 'either',
    distance: { min: 1950, max: 2100 },
    radial: SEATED,
    cone: { min: 25, max: 35, toward: { x: 0, y: 0, z: 1 }, prov: ill('beside the airflow: 25–35° off its axis') },
    drawn: { top: { cu: 0, cv: 0, r0: 1950, r1: 2100, a0: 25, a1: 35 }, side: { u0: 1600, u1: 1900, v0: EAR_Y - 100, v1: EAR_Y + 100 } },
    requires: { micTypeIds: ['sdcCard', 'measFF'] },
    start: toward(S.far, HUB),
    tendency: 'The fan with the room round it, as a listener would meet it — a designed perspective, not an unaltered measurement.',
    checks: ['The load and the surface logged', 'A layered effect labelled as designed', 'Beside the airflow, not in it'],
  },
];

/** The points the pages and the tests use. */
export const F15_POINTS: Readonly<Record<'A' | 'B' | 'C', Vec3>> = { A: S.A, B: S.B, C: S.C };
export { CENTRE };
