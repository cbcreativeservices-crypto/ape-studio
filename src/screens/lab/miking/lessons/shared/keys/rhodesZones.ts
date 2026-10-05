/**
 * THE TINE PIANO'S AMP (I11a) — the RECOMMENDED STARTING POINTS on the combo
 * it plays through, in the speaker family's FRAME C (origin at the speaker's
 * centre on the baffle; +x out toward the mic). The combo is the Lab 4
 * amplified chain's (shared/speakers/ampModel.ts), reused unchanged:
 * rhodes/GEOMETRY_PROPOSAL.md §1 "rig.mono".
 *
 * Learner words are plain starting points (owner ruling 2026-10-04); `kind`,
 * `src`, `quote` and every `prov` are the INTERNAL record
 * (docs/labs/miking/rhodes/SOURCES.md, speaker_leslie/SOURCES.md).
 *
 * ONE VARIABLE AT A TIME: the three close spots (dust-cap edge, centre,
 * toward the edge) share the research's ONE close band — 1–6 in (2–15 cm),
 * a general amplifier figure, measured by the lab from the grille cloth
 * (correction RH-02) — and differ only across the cone.
 */
import type { DocumentedZone, Provenance } from '../../../engine/model/types.ts';
import { CONE_SPOTS, GRILLE_X, SPEAKER_12 } from '../speakers/speakerModel.ts';
import { backX, withBands } from '../speakers/ampModel.ts';
import { guitarRearZone } from '../speakers/ampZones.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const G = GRILLE_X.mm;
const IN = 25.4;
const R12 = SPEAKER_12.rCone.mm;
const TOL = 15;
/** "Amplifiers 1-6 inches (2-15 cm)": the research's close band, exactly. */
export const RH_CLOSE = { min: 1 * IN, max: 6 * IN };
const AIM_TIGHT = { maxOffAxis: 20, prov: ill('"aimed near the transition / at the centre": ±20° is the lab’s tolerance') };
const AIM_LOOSE = { maxOffAxis: 45, prov: ill('"aim towards the center … or towards the edge": ±45° covers both aims; the lab’s tolerance') };

const RHODES_ZONES: readonly DocumentedZone[] = [
  {
    id: 'rh.boundary',
    label: 'Close, at the edge of the dust cap',
    band: 'Start about 2.5–15 cm (1–6 in) from the grille, aimed where the dust cap meets the cone.',
    kind: 'sourced',
    src: 'S-MILLS',
    quote: 'place the mic right on the line between the dust cover and the speaker cone — with S-PGA27 "Amplifiers 1-6 inches (2-15 cm)" for the distance (general amplifier guidance, measured by the lab from the grille cloth: RH-02)',
    refSurface: 'grille',
    side: 'outside',
    distance: RH_CLOSE,
    radial: { line: 'axis', min: CONE_SPOTS.boundary - TOL, max: CONE_SPOTS.boundary + TOL, prov: ill('"between the dust cover and the speaker cone": the dust-cap radius (a drawing default, 50 mm) ± 15 mm') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 40, y: -CONE_SPOTS.boundary, z: 0 }, az: 0, el: 0 },
    tendency: 'A dependable first listen for chords and melody: the tine’s attack with the amp’s body. From here, slide toward the centre for more bark or toward the edge for warmer comping, keeping the distance.',
    checks: ['The grille is not touched', 'Soft chords and hard accents', 'Bass notes and top notes'],
  },
  {
    id: 'rh.centre',
    label: 'Close, on the centre of the cone',
    band: 'Start about 2.5–15 cm (1–6 in) from the grille, on the centre of the speaker (the dust cap).',
    kind: 'sourced',
    src: 'S-GTR',
    quote: 'the closer the mic is to the speaker’s center, the more brightness you’ll get (and S-MILLS "The more you move a mic toward the center of the speaker, the brighter it will sound")',
    refSurface: 'grille',
    side: 'outside',
    distance: RH_CLOSE,
    radial: { line: 'axis', max: TOL, prov: ill('"the speaker’s center": within 15 mm of the axis is the lab’s tolerance') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 40, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'Most often the brightest, most forward spot — more of the bark on hard notes. If it turns brittle in the upper mids, slide outward: a tendency to check on this speaker.',
    checks: ['Brittle upper mids on accents', 'The amp’s own drive versus the mic overloading', 'Matched level when you compare'],
  },
  {
    id: 'rh.edge',
    label: 'Close, toward the edge of the cone',
    band: 'Start about 2.5–15 cm (1–6 in) from the grille, over the outer part of the cone.',
    kind: 'sourced',
    src: 'S-GTR',
    quote: 'Moving the mic outward away from the center of the speaker will give you more bass. / moving it toward the edge adds warmth and bass (S-MILLS "the more you move it to the edge, the duller it will sound"; S-PGA27 "mellow")',
    refSurface: 'grille',
    side: 'outside',
    distance: RH_CLOSE,
    radial: { line: 'axis', min: CONE_SPOTS.edge - TOL, max: CONE_SPOTS.edge + TOL, prov: ill('"toward the edge": 10 mm inside the surround (a drawing default) ± 15 mm') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 40, y: -CONE_SPOTS.edge, z: 0 }, az: 0, el: 0 },
    tendency: 'Most often warmer and rounder — full chords for comping. Check that the notes keep their definition in the band.',
    checks: ['Note definition in full chords', 'That it is still the speaker that sounds', 'The grille is not touched'],
  },
  {
    id: 'rh.close',
    label: 'Close in front of the speaker',
    band: 'Start about 2.5–15 cm (1–6 in) from the grille, in front of the speaker, aimed at its centre or toward its edge.',
    kind: 'sourced',
    src: 'S-PGA27',
    quote: 'Amplifiers 1-6 inches (2-15 cm) Aim towards the center of the speaker for a clear, aggressive sound, or towards the edge of the speaker for a mellow sound.',
    refSurface: 'grille',
    side: 'outside',
    distance: RH_CLOSE,
    radial: { line: 'axis', max: R12, prov: ill('"in front of the speaker": within the cone’s own radius (141.5 mm) of its axis') },
    aim: AIM_LOOSE,
    start: { p: { x: G + 90, y: -90, z: 0 }, az: 0, el: 0 },
    tendency: 'The speaker itself, with little of the room: isolation on a loud stage. Toward the centre tends to be clearer and more aggressive; toward the edge, mellower.',
    checks: ['One change at a time: keep the distance while you move across', 'Stage spill from drums and wedges', 'The level on the strongest accents'],
  },
  {
    id: 'rh.room',
    label: 'Well back, for the amp and the room',
    band: 'In a good room, try about 60–90 cm (2–3 ft) back from the grille, on the speaker’s axis — usually as a second mic under the close one.',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: '60 to 90 cm (2 to 3 ft.) back from speaker, on-axis with speaker cone (Softer attack; reduced bass)',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 600, max: 900 },
    radial: { line: 'axis', max: 80, prov: ill('"on-axis": within 80 mm of the axis is the lab’s tolerance at this distance') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 750, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'A softer attack with more of the amp and the room. A studio perspective after a reliable close mic — rarely a help on a loud stage.',
    checks: ['The room is worth hearing', 'Spill from the band', 'The pair in mono with the close mic'],
  },
];

/** Behind the combo's open back (the speaker family's rear zone, renamed). */
function rhodesRear(): DocumentedZone {
  const z = guitarRearZone();
  return { ...z, id: 'rh.rear', tendency: 'The back of the cone: thicker and duller. It is opposite in polarity to the front — flip this mic’s polarity before you blend, then judge the pair in mono. Only where the cabinet is open and safe to reach from outside.' };
}

/** The tine piano's zones on the combo, with their drawings. */
export function rhodesZones(): DocumentedZone[] {
  const xb = backX('combo');
  return [...RHODES_ZONES, rhodesRear()].map((z) => withBands(z, xb, R12));
}
