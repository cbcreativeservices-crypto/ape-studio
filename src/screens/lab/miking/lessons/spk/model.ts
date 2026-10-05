/**
 * SPEAKER CABINET & LESLIE MODULE (lesson id SPK) — the technical truth for
 * the CONVENTIONAL cabinet's placement (charter §2 layer 1). The speaker
 * family's facts live in lessons/shared/speakers/speakerModel.ts; this file
 * holds the module's RECOMMENDED STARTING POINTS in frame C.
 *
 * Sources: docs/labs/miking/speaker_leslie/SOURCES.md §c and
 * GEOMETRY_PROPOSAL.md A4. Learner-facing words (label, band, tendency,
 * checks) are plain starting points (owner ruling 2026-10-04); `kind`, `src`,
 * `quote` and every `prov` are the INTERNAL record, never shown.
 *
 * CENTRE vs EDGE (disagreement D-L2, logged): most of the research (two
 * maker guides, an engineer's account, a second maker's tip) puts the
 * BRIGHTER sound toward the centre and the MELLOWER / warmer one toward the
 * edge; one guide's table states the opposite direction. The tendency words
 * follow the majority and say "a tendency to check".
 *
 * DISTANCES are measured from the GRILLE CLOTH (the surface a learner can
 * see and measure from). One guide's rows say "from speaker"; with a cloth in
 * front, the lab reads them as "at the cloth, not touching" (CORRECTIONS_LOG
 * SPK-04).
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { CONE_SPOTS, GRILLE_X, SPEAKER_12 } from '../shared/speakers/speakerModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

const G = GRILLE_X.mm;
const R_CONE = SPEAKER_12.rCone.mm;
/** Any stand mic this module offers can try every front starting point. */
export const SPK_MICS = ['instDynCard', 'sdcCard', 'kickDynCard'] as const;
const ALL = [...SPK_MICS];
/** The lab's tolerance for "aimed at …" (no source gives one). */
const AIM_TIGHT = { maxOffAxis: 20, prov: ill('"aim towards the centre / the edge / on-axis": ±20° is the lab’s tolerance') };
const AIM_LOOSE = { maxOffAxis: 45, prov: ill('"aim towards the center … or towards the edge": ±45° covers both aims; the lab’s tolerance') };
/** The radial band drawn round a named spot on the cone (the lab's tolerance). */
const SPOT_TOL = 15;

/**
 * The front starting points, in the order the readouts test them (the more
 * specific first: the dust-cap edge, the centre and the edge sit inside the
 * broad "close" zone).
 */
export const SPK_FRONT_ZONES: DocumentedZone[] = [
  {
    id: 'cab.boundary',
    label: 'Close, at the edge of the dust cap',
    band: 'Start about 2.5–5 cm (1–2 in) from the grille, aimed at the line where the dust cap meets the cone.',
    kind: 'sourced',
    src: 'S-MILLS',
    quote: 'place the mic right on the line between the dust cover and the speaker cone … about 1 to 2 inches away from the line between the dust cover and speaker cone',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 25.4, max: 50.8 },
    radial: { line: 'axis', min: CONE_SPOTS.boundary - SPOT_TOL, max: CONE_SPOTS.boundary + SPOT_TOL, prov: ill('"on the line between the dust cover and the speaker cone": the dust-cap radius (a drawing default, 50 mm) ± 15 mm is the lab’s drawing of it') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 38, y: -CONE_SPOTS.boundary, z: 0 }, az: 0, el: 0 },
    tendency: 'A tight sound that suits everything from clean to distorted tones — a good first place to listen. From here, move toward the centre or the edge one step at a time.',
    checks: ['The grille is not touched', 'Which speaker is really sounding', 'The level on the loudest passage'],
  },
  {
    id: 'cab.centre',
    label: 'Right at the grille, on the centre of the cone',
    band: 'Start about 2–3 cm (1 in) from the grille, on the centre of the speaker.',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: '2.5 cm (1 in.) from speaker, on-axis with center of speaker cone',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 20, max: 30 },
    radial: { line: 'axis', max: SPOT_TOL, prov: ill('"on-axis with center": within 15 mm of the cone axis is the lab’s tolerance') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 25, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'A sharp attack and, most often, a brighter, more present sound than toward the edge — a tendency to check, not a rule.',
    checks: ['The grille is not touched', 'Harshness or fizz on distorted sounds', 'Low end lifted by the closeness'],
  },
  {
    id: 'cab.edge',
    label: 'Right at the grille, toward the edge of the cone',
    band: 'Start about 2–3 cm (1 in) from the grille, over the outer part of the cone.',
    kind: 'sourced',
    src: 'S-PGA27',
    quote: 'Aim … towards the edge of the speaker for a mellow sound (also S-MILLS "duller", AX-I5 "warmer, fatter"; S-SM57-UG states the opposite direction — D-L2)',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 20, max: 30 },
    radial: { line: 'axis', min: CONE_SPOTS.edge - SPOT_TOL, max: CONE_SPOTS.edge + SPOT_TOL, prov: ill('"toward the edge": 10 mm inside the surround (a drawing default) ± 15 mm') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 25, y: -CONE_SPOTS.edge, z: 0 }, az: 0, el: 0 },
    tendency: 'Most often a mellower, warmer, darker sound than at the centre — a tendency to check on this speaker.',
    checks: ['The grille is not touched', 'Articulation still clear', 'That it is still the active speaker'],
  },
  {
    id: 'cab.close',
    label: 'Close in front of the speaker',
    band: 'Start about 2–15 cm (1–6 in) from the grille, in front of the active speaker, aimed at its centre or toward its edge.',
    kind: 'sourced',
    src: 'S-PGA27',
    quote: 'Amplifiers … 1-6 inches (2-15 cm). Aim towards the center of the speaker for a clear, aggressive sound, or towards the edge of the speaker for a mellow sound.',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 20, max: 150 },
    radial: { line: 'axis', max: R_CONE, prov: ill('"in front of the speaker": within the cone’s own radius (141.5 mm) of its axis') },
    aim: AIM_LOOSE,
    start: { p: { x: G + 80, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'The speaker itself, with little of the room — useful isolation in a dense mix or on a loud stage. Aim toward the centre for a clearer, more aggressive sound, toward the edge for a mellower one.',
    checks: ['One variable at a time: keep the distance while you move across', 'Room and stage spill', 'The level on the loudest passage'],
  },
  {
    id: 'cab.mid',
    label: 'A little farther back, on the speaker’s axis',
    band: 'Start about 15–30 cm (6–12 in) from the grille, on the speaker’s axis.',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: '15 to 30 cm (6 to 12 in.) away from speaker and on-axis with speaker cone (Medium attack; full, balanced sound)',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 150, max: 300 },
    radial: { line: 'axis', max: 50, prov: ill('"on-axis with speaker cone": within 50 mm of the axis is the lab’s tolerance') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 225, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'A softer attack and a fuller, more balanced sound, with a little of the room.',
    checks: ['Room and neighbouring instruments', 'Monitor and PA spill on a stage', 'Matched level when you compare'],
  },
  {
    id: 'cab.far',
    label: 'Well back, for the cabinet and the room',
    band: 'Start about 60–90 cm (2–3 ft) back from the grille, on the speaker’s axis.',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: '60 to 90 cm (2 to 3 ft.) back from speaker, on-axis with speaker cone (Softer attack; reduced bass)',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 600, max: 900 },
    radial: { line: 'axis', max: 80, prov: ill('"on-axis": within 80 mm of the axis is the lab’s tolerance at this distance') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 750, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'A softer attack and less low end; more of the whole cabinet and the room. Suits a good-sounding quiet room more than a loud stage.',
    checks: ['The room is worth hearing', 'Other instruments and PA spill', 'Matched level when you compare'],
  },
];

/** Behind an OPEN back (the 1×12 open variant only). The research gives no
 *  distance: 5–15 cm is a drawing default (CORRECTIONS_LOG SPK-03). */
export function rearZone(xBack: number): DocumentedZone {
  return {
    id: 'cab.rear',
    label: 'Behind the open back',
    band: 'Try about 5–15 cm (2–6 in) behind the open back, on the speaker’s axis — and switch this mic’s polarity.',
    kind: 'trial',
    src: 'S-MILLS',
    quote: 'Don’t forget to swap the polarity … on the rear mic. Otherwise you’ll have a great deal of phase issues.',
    refSurface: 'back',
    side: 'outside',
    distance: { min: 50, max: 150 },
    bandProv: { kind: 'unknown', needed: 'a rear-mic distance: none in the research; 5–15 cm is a drawing default' },
    radial: { line: 'axis', max: R_CONE, prov: ill('behind the speaker: within the cone’s radius of its axis') },
    requires: { variant: 'open' },
    aim: { maxOffAxis: 30, prov: ill('facing the back of the speaker: ±30° is the lab’s tolerance') },
    start: { p: { x: xBack - 100, y: 0, z: 0 }, az: 180, el: 0 },
    tendency: 'The back of the cone: more low-mid body and less bite. Its sound is opposite in polarity to the front, so flip this mic’s polarity before you blend it — then check the pair in mono.',
    checks: ['This mic’s polarity switched', 'The pair checked in mono, at matched levels', 'The cable and stand clear of the back'],
  };
}
