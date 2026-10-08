/**
 * F16 SCIENTIFIC ARRAYS AND SPECIALIZED SENSORS — the recommended starting
 * points (charter §2 layer 1). Source keys: measurement_mics/SOURCES.md §0;
 * the lesson's claims: scientific_arrays/SOURCES.md. Frame: F16 geometry.ts
 * (the marked origin at the baseline's centre).
 *
 *   ar.L / ar.R     the two elements of the baseline, 25 cm either side of
 *                   the origin on the baseline axis (b = 0.5 m, drawing
 *                   default), both aimed toward the source line
 *   ar.L2 / ar.R2   a wider baseline, 0.5 m either side (1 m)
 *   ar.back         a third element 25 cm behind the origin, off the line —
 *                   the alternative layout that breaks the front/back mirror
 *                   (F16 L64 "sketch how a larger array or alternative
 *                   viewpoint could resolve an ambiguity")
 *
 * The specialist kit (the intensity probe, the acoustic camera, the
 * hydrophone, the ultrasonic detector) is drawn as objects with a qualified
 * operator, never placed by hand here (D-6B-4).
 */
import type { DocumentedZone, MicPose, Vec3 } from '../../engine/model/types.ts';
import { aimAt, ill } from '../shared/measure/measureModel.ts';
import { BASE, CENTRE_PT } from './geometry.ts';

const toward = (p: Vec3): MicPose => ({ p, ...aimAt(p, { x: p.x + 1000, y: p.y, z: p.z }) });
const AIM = { maxOffAxis: 10, dir: { x: 1, y: 0, z: 0 }, prov: ill('toward the source line, within 10° (the elements are omni; the lab’s tolerance)') };
const ON_LINE = (prov: string) => ({ line: 'baseline', max: 15, prov: ill(prov) });
const OMNI = ['measFF', 'measRI'];
const el = (z: number): Vec3 => ({ x: 0, y: 0, z });

export const F16_START = { L: el(-BASE.b / 2), R: el(BASE.b / 2), L2: el(-BASE.wide / 2), R2: el(BASE.wide / 2), back: { x: -250, y: 0, z: 0 } } as const;
const S = F16_START;
const elBox = (z: number) => ({ min: { x: -40, y: -40, z: z - 40 }, max: { x: 40, y: 40, z: z + 40 }, prov: ill('at the logged coordinate, within 4 cm') });
const elDraw = (z: number) => ({ side: { u0: -40, u1: 40, v0: -40, v1: 40, round: true }, top: { u0: -40, u1: 40, v0: z - 40, v1: z + 40, round: true } });

export const F16_ZONES: DocumentedZone[] = [
  {
    id: 'ar.L',
    label: 'Element L, 25 cm left of the origin',
    band: 'Start the left element on the baseline axis 25 cm (10 in) left of the marked origin — this drawing’s baseline is 50 cm — aimed toward the source line, and its coordinate written down.',
    kind: 'trial',
    src: 'F16-LESSON',
    quote: 'Fix two omni capsules at a measured baseline, label left/right, record both on one synchronized clock (F16 L12)',
    bandProv: ill('drawing default: b = 0.5 m (scientific_arrays/GEOMETRY_PROPOSAL.md §2), ±1 cm on the coordinate'),
    refSurface: 'origin',
    side: 'either',
    distance: { min: 240, max: 260 },
    radial: ON_LINE('on the baseline axis: within 1.5 cm'),
    box: elBox(S.L.z),
    drawn: elDraw(S.L.z),
    requires: { micTypeIds: OMNI },
    aim: AIM,
    start: toward(S.L),
    tendency: 'One element of the pair: on its own a pressure at one logged point — a time difference needs its partner, on the same clock.',
    checks: ['Its coordinate written from the origin', 'Labelled L, its channel mapped', 'On the same recorder as R'],
  },
  {
    id: 'ar.R',
    label: 'Element R, 25 cm right of the origin',
    band: 'The right element mirrors it: 25 cm right of the origin on the same axis, the same height and aim, on the same recorder.',
    kind: 'trial',
    src: 'F16-LESSON',
    quote: 'Fix two omni capsules at a measured baseline, label left/right (F16 L12)',
    bandProv: ill('drawing default: b = 0.5 m, ±1 cm on the coordinate'),
    refSurface: 'origin',
    side: 'either',
    distance: { min: 240, max: 260 },
    radial: ON_LINE('on the baseline axis: within 1.5 cm'),
    box: elBox(S.R.z),
    drawn: elDraw(S.R.z),
    requires: { micTypeIds: OMNI },
    aim: AIM,
    start: toward(S.R),
    tendency: 'With L, a baseline: which side heard a click first, and by how much — a time difference, not yet a direction.',
    checks: ['Its coordinate written from the origin', 'Labelled R, its channel mapped', 'Matched and checked with L'],
  },
  {
    id: 'ar.L2',
    label: 'A wider baseline: the left end',
    band: 'For a wider baseline, try the left element 50 cm (20 in) from the origin — a 1 m baseline — the same height and aim.',
    kind: 'trial',
    src: 'F16-LESSON',
    quote: 'a larger aperture can improve angular resolution at a given wavelength (F16 L21)',
    bandProv: ill('drawing default: a 1 m baseline, ±1 cm on the coordinate'),
    refSurface: 'origin',
    side: 'either',
    distance: { min: 490, max: 510 },
    radial: ON_LINE('on the baseline axis: within 1.5 cm'),
    box: elBox(S.L2.z),
    drawn: elDraw(S.L2.z),
    requires: { micTypeIds: OMNI },
    aim: AIM,
    start: toward(S.L2),
    tendency: 'A wider pair: larger time differences for the same source angle — and the same front/back mirror.',
    checks: ['The new baseline written down', 'Both ends on one clock', 'The origin unchanged'],
  },
  {
    id: 'ar.R2',
    label: 'A wider baseline: the right end',
    band: 'And the right element 50 cm from the origin on the other side, the same height and aim.',
    kind: 'trial',
    src: 'F16-LESSON',
    quote: 'a larger aperture can improve angular resolution at a given wavelength (F16 L21)',
    bandProv: ill('drawing default: a 1 m baseline, ±1 cm on the coordinate'),
    refSurface: 'origin',
    side: 'either',
    distance: { min: 490, max: 510 },
    radial: ON_LINE('on the baseline axis: within 1.5 cm'),
    box: elBox(S.R2.z),
    drawn: elDraw(S.R2.z),
    requires: { micTypeIds: OMNI },
    aim: AIM,
    start: toward(S.R2),
    tendency: 'With the wider left end, a 1 m baseline: twice the time difference for the same source.',
    checks: ['The new baseline written down', 'Both ends on one clock', 'The origin unchanged'],
  },
  {
    id: 'ar.back',
    label: 'A third element, off the line',
    band: 'To break the front/back mirror, try a third element 25 cm (10 in) behind the origin, off the baseline — on the same clock as the pair.',
    kind: 'trial',
    src: 'F16-LESSON',
    quote: 'Sketch how a larger array or alternative viewpoint could resolve an ambiguity (F16 L64)',
    bandProv: ill('drawing default: 25 cm behind the origin, ±4 cm'),
    refSurface: 'origin',
    side: 'either',
    distance: { min: 230, max: 270 },
    box: { min: { x: -290, y: -40, z: -40 }, max: { x: -210, y: 40, z: 40 }, prov: ill('behind the origin, on the axis toward the source') },
    drawn: { side: { u0: -290, u1: -210, v0: -40, v1: 40, round: true }, top: { u0: -290, u1: -210, v0: -40, v1: 40, round: true } },
    requires: { micTypeIds: OMNI },
    aim: AIM,
    start: toward(S.back),
    tendency: 'A source in front reaches it last, one behind reaches it first: what the straight pair could not tell, it can.',
    checks: ['On the same clock as L and R', 'Its coordinate written from the origin', 'Matched and checked with the pair'],
  },
];

export { CENTRE_PT };
