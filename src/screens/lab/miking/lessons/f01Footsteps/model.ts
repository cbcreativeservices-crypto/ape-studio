/**
 * F01 FOLEY FOOTSTEPS AND SURFACES — the recommended starting points (charter
 * §2 layer 1). Keys point into docs/labs/miking/foley_footsteps/SOURCES.md
 * (§0 the Lab 6 register); geometry from GEOMETRY_PROPOSAL.md §5. Every
 * distance is from the CAPSULE (a shotgun's capsule sits at the back of its
 * tube) to the middle of the footfall area.
 *
 *   f01.roesch  0.9–1.8 m (3–6 ft), in front or a little to the side —
 *               "only about 15 degrees" read as 15° off the walker's front
 *               line in plan (O-4) — the worked example (ONE MIC);
 *   f01.close   0.8–1.0 m, aimed across or down at the contact zone: the
 *               lesson's own suggested trial (O-1: shown as a suggested
 *               starting point) — CLOSE · LIVE, and the live booth's start;
 *   f01.mid     1.5–2 m (one stage's two-shotgun comparison on concrete,
 *               wood, leaves and gravel) — FARTHER BACK · STUDIO;
 *   (3.5 m)     one fight scene on gravel judged in the mix (FF-HP) is
 *               taught in WORDS and a check, not drawn: a 3.5 m zone would
 *               shrink every drawing of the pit to fit it (L6G1-F01-08);
 *   f01.room    the room mic of the close + room pair, about 3 m out and 2 m
 *               up (a drawing default; the method is sourced) — TWO MICS.
 * Heights are drawing defaults (no source gives one): the start poses sit
 * low for the close mic, higher farther out, always aimed at the footfall
 * area, always outside the motion envelope.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { foleyZone } from '../shared/foley/foleyZones.ts';
import { STUDIO_VARIANTS } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const FT = 304.8;
const ALL = [...STUDIO_VARIANTS, 'live'];
const STUDIO = [...STUDIO_VARIANTS];
const DIR = ['shotgunShort', 'scSupercard'];

export const F01_ZONES: DocumentedZone[] = [
  foleyZone({
    id: 'f01.roesch',
    label: 'In front, a little to one side',
    band: 'Start about 0.9–1.8 m (3–6 ft) from the middle of the steps, in front of the walker or a little to one side — about 15° off their front line — aimed down at where the feet land.',
    kind: 'sourced',
    src: 'MIX-2005',
    quote: 'between three and six feet away on a mic stand, in front and/or to the side, but only about 15 degrees or so',
    surface: 'steps',
    d: [3 * FT, 6 * FT],
    a: [20, 65],
    aimTol: 25,
    start: { d: 1400, bearing: 15, elev: 50 },
    variants: ALL,
    micTypeIds: DIR,
    bandProv: ill('"about 15 degrees" read as 15° off the walker’s front line in plan (O-4); the height is a drawing default — the zone takes 20–65° off the front line, any mix of height and bearing'),
    tendency: 'The shoe and the surface together, with a little of the room — a balanced footstep for a medium shot. Listen for whether the near and far steps stay even.',
    checks: ['Even level across the near and far steps', 'Clothing and breath against the steps', 'The stand and cable outside the movement and the exit path'],
  }),
  foleyZone({
    id: 'f01.close',
    label: 'Close, in front or to one side',
    band: 'A suggested trial: start about 0.8–1.0 m from the middle of the steps, in front or to one side, aimed across or down at where the feet land — and farther back if any part of the movement comes near it.',
    kind: 'trial',
    src: 'LESSON-F01',
    quote: 'place a securely supported directional capsule roughly 0.8–1.0 m from the center of a bounded step area … This range is an exercise design, not a published rule.',
    surface: 'steps',
    d: [800, 1000],
    a: [20, 50],
    aimTol: 25,
    start: { d: 980, bearing: 0, elev: 30 },
    variants: ALL,
    micTypeIds: DIR,
    bandProv: ill('the lesson’s own trial (O-1: shown as a suggested starting point); its height a drawing default'),
    tendency: 'More sole contact and surface texture, less room — but the nearest step jumps out and pants or breath come closer too. On a live stage the closer mic also keeps more of the PA out.',
    checks: ['Contact and texture against pants and breath noise', 'The nearest and farthest steps', 'Clearance from the whole movement, a pivot or a missed step included'],
  }),
  foleyZone({
    id: 'f01.mid',
    label: 'Farther back, more of the room',
    band: 'Start about 1.5–2 m (5–6.5 ft) from the middle of the steps, in front, aimed at where the feet land. One stage compared two shotguns this way on concrete, wood, leaves and gravel — and moved one about half a metre closer when the steps needed more articulation.',
    kind: 'sourced',
    src: 'FF-KMR',
    quote: 'both shotguns at "1.5-2 meters" on concrete steps, hardwood steps, dry leaves, gravel; one mic needed "half a meter closer"',
    surface: 'steps',
    d: [1500, 2000],
    a: [20, 60],
    aimTol: 25,
    start: { d: 1750, bearing: 0, elev: 38 },
    variants: STUDIO,
    micTypeIds: DIR,
    bandProv: ill('the height is a drawing default'),
    tendency: 'The steps sit in more of the room, the near and far steps more even — but quiet steps can sink under room noise. Recreate it only where the room and the walking area allow.',
    checks: ['Room noise under the quiet steps', 'Articulation: half a metre closer if it blurs', 'Shoe body and texture against the room'],
  }),
  foleyZone({
    id: 'f01.room',
    label: 'The room mic, higher and farther back',
    band: 'With the close mic kept, a second mic about 3 m (10 ft) out and about 2 m (6.5 ft) up, aimed at the pit — recorded on its own channel.',
    kind: 'sourced',
    src: 'MIX-2005',
    quote: 'KMR 82 shotguns close, "a Neumann U67 functioning as room microphone"; another stage used "two mics: one close and one far away"',
    surface: 'steps',
    d: [2700, 3300],
    a: [30, 60],
    aimTol: 30,
    start: { d: 3000, bearing: -20, elev: 41.8 },
    variants: STUDIO,
    micTypeIds: ['ldcRoom'],
    bandProv: ill('the room mic’s place (3 m out, 2 m up) is a drawing default; the close + room method is sourced'),
    tendency: 'The room around the steps, on its own channel, to blend under the close mic for the perspective a scene needs. Check the pair in mono.',
    checks: ['The pair together in mono, at its real level', 'Whether the room layer helps this scene', 'Its stand and cable out of the exit path'],
  }),
];
