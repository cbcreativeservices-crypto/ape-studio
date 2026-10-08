/**
 * F05 FOLEY PERSPECTIVE AND MULTIPLE MICROPHONES — the suggested starting
 * points (charter §2 layer 1). Keys: foley_footsteps/SOURCES.md §0 and
 * foley_perspective/SOURCES.md; geometry from foley_perspective/
 * GEOMETRY_PROPOSAL.md §2. Every distance is from the keys at the middle of
 * the path to the mic's capsule (a pair: to its centre):
 *
 *   f05.mono  ONE MIC — a short shotgun 0.9–1.8 m (3–6 ft) out, in front and
 *             a little to the side (MIX-2005, "about 15 degrees", O-4) — the
 *             worked example; also the close half of the TWO MICS pair
 *   f05.room  the room mic, about 3 m out and 2 m up (a drawing default; the
 *             close + room method is sourced: MIX-2005, HECKER, ASE-CROSS)
 *   f05.xy    an X/Y pair 90° (DPA-STEREO, RODE-BAR; F05-C2) about 1.5 m
 *             out (a drawing default), and the M/S pair at the same place —
 *             ANOTHER START, drawn whole
 *   f05.ortf  an ORTF pair, 170 mm / 110° included, recording angle 95°
 *             (F05-C3), about 2 m out (a drawing default) — ANOTHER START
 *   f05.live  CLOSE · LIVE — one source-proximate directional mic at a fixed
 *             station (S-AUTOMIX, S-LIVE), about 0.8–1.1 m (group 1's close
 *             trial distance, a drawing default here)
 */
import type { DocumentedZone, Provenance, SetupPairData } from '../../engine/model/types.ts';
import { foleyZone } from '../shared/foley/foleyZones.ts';
import { arraySetup } from '../shared/field/fieldArrays.ts';
import { around, v3 } from '../shared/foley/frameF.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const FT = 304.8;

export const F05_ZONES: DocumentedZone[] = [
  foleyZone({
    id: 'f05.mono',
    label: 'One mic, in front and a little to the side',
    band: 'Start with one mic about 0.9–1.8 m (3–6 ft) from the middle of the path, in front of the artist and a little to one side — about 15° — aimed at the middle of the action.',
    kind: 'sourced',
    src: 'MIX-2005',
    quote: 'between three and six feet away on a mic stand, in front and/or to the side, but only about 15 degrees or so',
    surface: 'part',
    d: [3 * FT, 6 * FT],
    a: [10, 50],
    aimTol: 25,
    start: { d: 1400, bearing: 15, elev: 20 },
    variants: ['keys', 'live'],
    micTypeIds: ['shotgunShort', 'scSupercard'],
    bandProv: ill('"about 15 degrees" read as 15° off the artist’s front line in plan (O-4); the height a drawing default'),
    tendency: 'The whole crossing as one mono event: the jingle and a little of the room. Nearer, it grows large and detailed; farther, more of the room — move it to fit the shot.',
    checks: ['The whole crossing, start to finish', 'The detail against the room, for this shot', 'The stand outside the whole lane'],
  }),
  foleyZone({
    id: 'f05.room',
    label: 'The room mic, farther back and higher',
    band: 'With the close mic kept, a second mic about 3 m (10 ft) out and about 2 m (6.5 ft) up, aimed at the action — on its own channel.',
    kind: 'sourced',
    src: 'MIX-2005',
    quote: 'another stage used "two mics: one close and one far away"; a U67 "functioning as room microphone"',
    surface: 'part',
    d: [2700, 3300],
    a: [10, 45],
    aimTol: 30,
    start: { d: 3000, bearing: -20, elev: 19.5 },
    variants: ['keys'],
    micTypeIds: ['ldcRoom'],
    bandProv: ill('3 m out and 2 m up are drawing defaults; the close + room method is sourced'),
    tendency: 'The keys with the room round them: a perspective to blend under the close mic for a wider shot — not a left or right channel.',
    checks: ['Each channel alone, then the sum in mono', 'Whether the room suits the pictured place', 'Its stand outside the lane'],
  }),
  foleyZone({
    id: 'f05.xy',
    label: 'A coincident pair facing the path',
    band: 'For the action’s travel across the picture, try a coincident pair about 1.5 m from the middle of the path, facing it — capsules together, not touching.',
    kind: 'sourced',
    src: 'DPA-STEREO',
    quote: 'a pair of first-order cardioid microphones is arranged at a 90° angle (±45°); no comb filtering summing XY signals to mono',
    surface: 'part',
    d: [1300, 1700],
    a: [0, 35],
    aimTol: 25,
    start: { d: 1500, bearing: 0, elev: 8 },
    variants: ['keys'],
    micTypeIds: ['arrCard', 'arrFig8'],
    bandProv: ill('the 1.5 m distance is a drawing default; the 90° pair is sourced'),
    tendency: 'The keys travel across the image from one side to the other, by level alone; strong in mono. Width depends on the angle and the movement.',
    checks: ['Capsules together, not touching', 'Left and right labels match the travel', 'The mono sum over the whole crossing'],
  }),
  foleyZone({
    id: 'f05.ortf',
    label: 'A near-coincident pair, a little farther back',
    band: 'For a wider image with room in it, try an ORTF pair — 17 cm apart, 110° between the capsules — about 2 m from the middle of the path.',
    kind: 'sourced',
    src: 'RODE-BAR',
    quote: '"the critical 17cm distance for ORTF"; "110 degrees for ORTF placement" (included); recording angle 95°',
    surface: 'part',
    d: [1800, 2200],
    a: [0, 35],
    aimTol: 25,
    start: { d: 2000, bearing: 0, elev: 10 },
    variants: ['keys'],
    micTypeIds: ['arrCard'],
    bandProv: ill('the 2 m distance is a drawing default; the ORTF geometry is sourced'),
    tendency: 'A wider image from level and time; the time differences change through the crossing — check mono over the whole action.',
    checks: ['The geometry exact — never eyeballed', 'Mono over the whole crossing', 'The room it adds, for this scene'],
  }),
  foleyZone({
    id: 'f05.live',
    label: 'Close, at a fixed live station',
    band: 'Live, start with one directional mic about 0.8–1.1 m from the middle of the path at a fixed station — close enough to keep the PA down in it — the wedge in its rejection.',
    kind: 'trial',
    src: 'S-AUTOMIX',
    quote: 'Begin with one stable, source-proximate directional mic at a repeatable station (F05 L35); every open mic reduces gain before feedback',
    surface: 'part',
    d: [800, 1100],
    a: [15, 55],
    aimTol: 25,
    start: { d: 960, bearing: 0, elev: 32 },
    variants: ['live'],
    micTypeIds: ['shotgunShort', 'scSupercard'],
    bandProv: ill('0.8–1.1 m is a drawing default for this station'),
    tendency: 'The keys over the PA: one protected pickup; a moving action still changes its level — rehearse the whole crossing with the operator.',
    checks: ['The whole crossing at show level, with the operator', 'The wedge in the pattern’s rejection', 'Few open mics'],
  }),
];

/** Where a pair's centre sits: its zone's start point. */
const xyC = around(v3(0, 0, 0), 1500, 0, 8);
const ortfC = around(v3(0, 0, 0), 2000, 0, 10);

/** The pairs, drawn whole (facing the action: bearing 180 in frame F). */
export const F05_PAIRS: SetupPairData[] = [
  arraySetup({ label: 'X/Y pair facing the path (90°)', id: 'xy', zone: 'f05.xy', c: xyC, bearing: 180, typeA: 'arrCard', variants: ['keys'], more: true, line: 'The keys travel across the image by level — a strong mono sum. A coincident pair at one place: not two distances.' }),
  arraySetup({ label: 'M/S pair facing the path', id: 'ms', zone: 'f05.xy', c: xyC, bearing: 180, typeA: 'arrCard', typeB: 'arrFig8', variants: ['keys'], more: true, line: 'Width set later in the matrix; summed to mono the Side cancels. Keep the raw Mid and Side labelled — and never call close + room M/S.' }),
  arraySetup({ label: 'ORTF pair a little farther back (17 cm, 110°)', id: 'ortf', zone: 'f05.ortf', c: ortfC, bearing: 180, typeA: 'arrCard', variants: ['keys'], more: true, line: 'A wider image with time differences that change as the keys move — check mono over the whole crossing.' }),
];
