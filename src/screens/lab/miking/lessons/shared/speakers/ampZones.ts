/**
 * THE AMPLIFIED CHAIN — the SUGGESTED STARTING POINTS on an amp's speaker,
 * in frame C (origin at the miked speaker's centre on the baffle; +x out
 * toward the mic). Shared by the electric-guitar (C02) and steel (C04)
 * lessons — both mic a guitar-type combo — and the electric-bass lesson (C08).
 *
 * Learner-facing words (label, band, tendency, checks) are plain starting
 * points (owner ruling 2026-10-04); `kind`, `src`, `quote` and every `prov`
 * are the INTERNAL record (docs/labs/miking/electric_guitar_amp/SOURCES.md,
 * electric_bass_amp/SOURCES.md), never shown.
 *
 * ONE VARIABLE AT A TIME: the three close guitar zones (dust-cap edge,
 * centre, toward the edge) share ONE distance band and differ only across
 * the cone, so sliding across keeps the distance (the lesson's procedure,
 * step 3). Distances are measured from the GRILLE CLOTH (as in the
 * speaker module, SPK-04: "from speaker" rows read as "at the cloth").
 *
 * CENTRE vs EDGE (D-EG1): most of the research puts the BRIGHTER sound toward
 * the centre and the DULLER / mellower / smoother one toward the edge; one
 * guide's table states the opposite. The words follow the majority and say
 * "a tendency to check".
 */
import type { DocumentedZone, Provenance } from '../../../engine/model/types.ts';
import { CONE_SPOTS, GRILLE_X, SPEAKER_12, speakerScale } from './speakerModel.ts';
import { COMBO, backX, withBands, type AmpRig } from './ampModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const G = GRILLE_X.mm;
const IN = 25.4;
/** The lab's tolerance for "aimed at …" (no source gives one). */
const AIM_TIGHT = { maxOffAxis: 20, prov: ill('"aim at the line / the centre / on-axis": ±20° is the lab’s tolerance') };
const AIM_LOOSE = { maxOffAxis: 45, prov: ill('"aim towards the center … or towards the edge": ±45° covers both aims; the lab’s tolerance') };
/** The radial band drawn round a named spot (the lab's tolerance). */
const TOL = 15;

/* ═══ the guitar-type combo (C02, C04): one 12 in speaker ═══ */
const R12 = SPEAKER_12.rCone.mm;
const MIDWAY = (SPEAKER_12.rDust.mm + SPEAKER_12.rSurroundIn.mm) / 2;
/** The close band the three lateral zones share: ½–2 in from the cloth. */
const CLOSE = { min: 0.5 * IN, max: 2 * IN };

export const GUITAR_ZONES: readonly DocumentedZone[] = [
  {
    id: 'eg.boundary',
    label: 'Close, at the edge of the dust cap',
    band: 'Start about 1.5–5 cm (½–2 in) from the grille, aimed at the line where the dust cap meets the cone.',
    kind: 'sourced',
    src: 'S-MILLS',
    quote: 'place the mic right on the line between the dust cover and the speaker cone … Both mics are about 1/2 inch from the grill cloth (KSM27 "about 1 to 2 inches away from the line")',
    refSurface: 'grille',
    side: 'outside',
    distance: CLOSE,
    bandProv: ill('½ in (the engineer’s grille distance) to 2 in: the lab’s close band, shared by the three lateral zones'),
    radial: { line: 'axis', min: CONE_SPOTS.boundary - TOL, max: CONE_SPOTS.boundary + TOL, prov: ill('"on the line between the dust cover and the speaker cone": the dust-cap radius (a drawing default, 50 mm) ± 15 mm') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 30, y: -CONE_SPOTS.boundary, z: 0 }, az: 0, el: 0 },
    tendency: 'A focused sound that suits clean and driven tones alike — a good first place to listen. From here, slide toward the centre for brighter or toward the edge for smoother, keeping the distance.',
    checks: ['The grille is not touched', 'The speaker that is really sounding', 'Pick attack and fizz on the loudest passage'],
  },
  {
    id: 'eg.midway',
    label: 'Close, half-way out across the cone',
    band: 'Start about 1.5–5 cm (½–2 in) from the grille, half-way between the dust cap and the cone’s edge; you can turn it a little toward the edge.',
    kind: 'sourced',
    src: 'SN-906',
    quote: 'B "directed towards the middle between dome and edge … good starting position … If necessary, turn the microphone by approx. 30° towards the edge" (e 906 manual 07/2020 p.4, archived; online manual v1.3 04/2026)',
    refSurface: 'grille',
    side: 'outside',
    distance: CLOSE,
    bandProv: { kind: 'unknown', needed: 'the maker gives no distance for this position: the lab uses its shared close band' },
    radial: { line: 'axis', min: MIDWAY - TOL, max: MIDWAY + TOL, prov: ill('"the middle between dome and edge": half-way between the dust-cap radius (50) and the surround (128), both drawing defaults → 89 ± 15 mm') },
    aim: { maxOffAxis: 40, prov: ill('facing the cone, or turned up to about 30° toward the edge (the maker’s option): ±40° is the lab’s tolerance') },
    start: { p: { x: G + 30, y: -MIDWAY, z: 0 }, az: 0, el: 0 },
    tendency: 'A balanced place between the brighter middle and the smoother edge — another good first listen. Turned about 30° toward the edge it tends to soften a little more.',
    checks: ['The grille is not touched', 'Definition in the full mix', 'One change at a time: position OR angle'],
  },
  {
    id: 'eg.centre',
    label: 'Close, on the centre of the cone',
    band: 'Start about 1.5–5 cm (½–2 in) from the grille, on the centre of the speaker (the dust cap).',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: '2.5 cm (1 in.) from speaker, on-axis with center of speaker cone (Sharp attack; extended bass) — and S-MILLS "The more you move a mic toward the center of the speaker, the brighter it will sound"',
    refSurface: 'grille',
    side: 'outside',
    distance: CLOSE,
    radial: { line: 'axis', max: TOL, prov: ill('"on-axis with center": within 15 mm of the cone axis is the lab’s tolerance') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 30, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'Most often the brightest, most forward spot: pick attack and upper mids. With heavy distortion it can turn harsh or fizzy — a tendency to check on this speaker.',
    checks: ['The grille is not touched', 'Fizz or harshness on driven passages', 'Low end lifted by the closeness'],
  },
  {
    id: 'eg.edge',
    label: 'Close, toward the edge of the cone',
    band: 'Start about 1.5–5 cm (½–2 in) from the grille, over the outer part of the cone.',
    kind: 'sourced',
    src: 'S-MILLS',
    quote: '"the more you move it to the edge, the duller it will sound" (also S-PGA27 "towards the edge of the speaker for a mellow sound", SN-906 C "less trebles, more lower mids, smoother"; the SM57 guide states the opposite direction — D-EG1)',
    refSurface: 'grille',
    side: 'outside',
    distance: CLOSE,
    radial: { line: 'axis', min: CONE_SPOTS.edge - TOL, max: CONE_SPOTS.edge + TOL, prov: ill('"toward the edge": 10 mm inside the surround (a drawing default) ± 15 mm') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 30, y: -CONE_SPOTS.edge, z: 0 }, az: 0, el: 0 },
    tendency: 'Most often smoother and darker, with more low-mid weight — a tendency to check. Listen that the guitar keeps its definition in the band.',
    checks: ['The grille is not touched', 'Definition still clear in the mix', 'That it is still the active speaker'],
  },
  {
    id: 'eg.close',
    label: 'Close in front of the speaker',
    band: 'Start about 2–15 cm (1–6 in) from the grille, in front of the speaker, aimed at its centre or toward its edge.',
    kind: 'sourced',
    src: 'S-PGA27',
    quote: 'Amplifiers 1-6 inches (2-15 cm) Aim towards the center of the speaker for a clear, aggressive sound, or towards the edge of the speaker for a mellow sound.',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 20, max: 150 },
    radial: { line: 'axis', max: R12, prov: ill('"in front of the speaker": within the cone’s own radius (141.5 mm) of its axis') },
    aim: AIM_LOOSE,
    start: { p: { x: G + 90, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'The speaker itself, with little of the room: isolation on a loud stage or in a dense mix. Aimed at the centre it tends to sound clearer and more aggressive; toward the edge, mellower.',
    checks: ['One variable at a time: keep the distance while you move across', 'Room and stage spill', 'The level on the loudest passage'],
  },
  {
    id: 'eg.mid',
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
    tendency: 'A softer attack and a fuller, more balanced sound, with a little of the cabinet and the room. More spill from a loud stage.',
    checks: ['Room and neighbouring instruments', 'Monitor and PA spill on a stage', 'Matched level when you compare'],
  },
  {
    id: 'eg.far',
    label: 'Well back, for the amp and the room',
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
    tendency: 'A softer attack and less low end; more of the whole amp and the room. A studio choice when the room is worth hearing — usually blended under a close mic.',
    checks: ['The room is worth hearing', 'Other instruments and PA spill', 'The pair checked in mono with the close mic'],
  },
];

/** Behind the combo's OPEN back. The research gives no distance; the band
 *  starts outside the 6 in the maker asks for behind the amp (EG-06). */
export function guitarRearZone(): DocumentedZone {
  const vent = COMBO.ventBehind.mm;
  return {
    id: 'eg.rear',
    label: 'Behind the open back',
    band: 'Try about 15–30 cm (6–12 in) behind the open back, on the speaker’s axis — outside the air space the amp needs — and switch this mic’s polarity.',
    kind: 'trial',
    src: 'S-MILLS',
    quote: 'place a mic on the back of the cabinet … very dull, but thick … Don’t forget to swap the polarity (no distance given)',
    refSurface: 'back',
    side: 'outside',
    distance: { min: vent + 3, max: 300 },
    bandProv: { kind: 'unknown', needed: 'a rear-mic distance: none in the research; 15–30 cm is a drawing default that starts outside the 6 in (15.25 cm) the maker asks for behind the unit' },
    radial: { line: 'axis', max: R12, prov: ill('behind the speaker: within the cone’s radius of its axis') },
    requires: { variant: 'open' },
    aim: { maxOffAxis: 30, prov: ill('facing the back of the speaker: ±30° is the lab’s tolerance') },
    start: { p: { x: backX('combo') - 220, y: 0, z: 0 }, az: 180, el: 0 },
    tendency: 'The back of the cone: thicker and duller, with less bite. It is opposite in polarity to the front, so flip this mic’s polarity before you blend it — then check the pair in mono. It is also farther from the cone than the front mic, so a delay remains after the flip: listen in mono and move it if the low mids thin out.',
    checks: ['This mic’s polarity switched', 'The pair checked in mono, at matched levels', 'The stand clear of the vents, valves and walkway'],
  };
}

/* ═══ the bass cabinet (C08): four 10 in woofers and a horn ═══ */
const K10 = speakerScale(10);
const B = {
  rCone: R12 * K10,
  rDust: SPEAKER_12.rDust.mm * K10,
  edge: CONE_SPOTS.edge * K10,
};

export const BASS_ZONES: readonly DocumentedZone[] = [
  {
    id: 'bass.boundary',
    label: 'Close, at the edge of the dust cap',
    band: 'Start about 2.5–15 cm (1–6 in) from the grille, on ONE woofer, aimed where its dust cap meets the cone.',
    kind: 'sourced',
    src: 'S-PGA27',
    quote: 'Amplifiers 1-6 inches (2-15 cm) — the dust-cap/cone line itself is S-MILLS (guitar), borrowed for the bass start (CORRECTIONS_LOG BA-02)',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 25.4, max: 152.4 },
    radial: { line: 'axis', min: B.rDust - TOL, max: B.rDust + TOL, prov: ill('the 10 in woofer’s dust-cap radius (the 12 in drawing default × 10/12) ± 15 mm') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 60, y: -B.rDust, z: 0 }, az: 0, el: 0 },
    tendency: 'A focused first listen: the fundamental, low-mid punch and note definition. From here, move toward the centre for more bite or toward the edge for warmth, keeping the distance.',
    checks: ['The grille is not touched', 'One woofer, not the gap between two', 'Input headroom on the hardest notes'],
  },
  {
    id: 'bass.centre',
    label: 'Close, toward the centre — more bite',
    band: 'Start about 2.5–15 cm (1–6 in) from the grille, aimed at the middle of the woofer.',
    kind: 'sourced',
    src: 'S-BASSREC',
    quote: 'pointing it directly at the centre will give you more \'bite\'',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 25.4, max: 152.4 },
    radial: { line: 'axis', max: TOL, prov: ill('"directly at the centre": within 15 mm of the axis is the lab’s tolerance') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 60, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'More upper-mid attack — pick, slap and fretless articulation read more clearly. It can exaggerate clank or fizz on driven tones: a tendency to check.',
    checks: ['Clank or fizz on slap and drive', 'Lowest notes still even', 'Matched level when you compare'],
  },
  {
    id: 'bass.edge',
    label: 'Close, toward the edge — warmer',
    band: 'Start about 2.5–15 cm (1–6 in) from the grille, over the outer part of the woofer’s cone.',
    kind: 'sourced',
    src: 'S-BASSREC',
    quote: 'positioning the mic toward the speaker cone edge will produce a warm tone',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 25.4, max: 152.4 },
    radial: { line: 'axis', min: B.edge - TOL, max: B.edge + TOL, prov: ill('"toward the speaker cone edge": the 12 in edge spot × 10/12 ± 15 mm') },
    aim: AIM_TIGHT,
    start: { p: { x: G + 60, y: -B.edge, z: 0 }, az: 0, el: 0 },
    tendency: 'Most often warmer and smoother. Check that the bass keeps its pitch and definition beside the kick and the keys.',
    checks: ['Notes still defined in the band', 'That it is still the active woofer', 'The grille is not touched'],
  },
  {
    id: 'bass.breathing',
    label: 'A little farther — room to breathe',
    band: 'Start about 10–45 cm (4–18 in) from the grille, in front of one woofer.',
    kind: 'sourced',
    src: 'S-BASSREC',
    quote: 'somewhere between 4 - 18 inches will usually work depending on preference',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 4 * IN, max: 18 * IN },
    radial: { line: 'axis', max: B.rCone, prov: ill('"in front of the speaker": within the woofer’s own radius of its axis') },
    aim: AIM_LOOSE,
    start: { p: { x: G + 300, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'The woofer with more of the cabinet and a little of the room: the low notes have space to develop. On a loud stage it also hears more of the drums.',
    checks: ['Drum and wedge spill', 'Low-note evenness from note to note', 'The pair checked in mono with the DI'],
  },
  {
    id: 'bass.far',
    label: 'Farther back, for the cabinet and the room',
    band: 'In a good, quiet room, try about 60–100 cm (2–3.3 ft) back — usually as a second mic under the close one.',
    kind: 'trial',
    src: 'S-BASSREC',
    quote: 'a specialised kick/bass dynamic mic up close alongside a condenser mic placed further away … check the phase relationships (no distance given)',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 600, max: 1000 },
    bandProv: { kind: 'unknown', needed: '"further away": no distance in the research; 60–100 cm is a drawing default' },
    radial: { line: 'axis', max: 150, prov: ill('"on-axis": within 150 mm of the axis is the lab’s tolerance at this distance') },
    aim: AIM_LOOSE,
    start: { p: { x: G + 800, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'The cabinet and the room together — useful only when the room helps. Blended under the close mic and the DI, check it in mono: it arrives later.',
    checks: ['The room is worth hearing', 'The lowest notes in mono with the close mic', 'Drum spill'],
  },
];

/** The zones for a rig, with their drawings. */
export function zonesFor(rig: AmpRig, set: 'guitar' | 'bass'): DocumentedZone[] {
  const xb = backX(rig);
  if (set === 'bass') return BASS_ZONES.map((z) => withBands(z, xb, B.rCone));
  return [...GUITAR_ZONES, guitarRearZone()].map((z) => withBands(z, xb, R12));
}

export const BASS_SPOTS = B;
