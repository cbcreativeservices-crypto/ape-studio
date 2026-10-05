/**
 * C12 CLAVINET — the starting points (charter §2 layer 1), all on the
 * AMPLIFIER'S speaker (frame C, ampSpec.ts). The lesson gives no number of
 * its own; its moves map onto the amp guides (clavinet/GEOMETRY_PROPOSAL.md):
 * the centre, the dust-cap line, the edge, turned off axis, a little farther
 * back, and behind an open back. Source keys: speaker_leslie/SOURCES.md,
 * electric_guitar_amp/SOURCES.md, SOURCES_SHARED.md.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { ampBox, GRILLE_X, SPEAKER } from './ampSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const MICS = ['instDynCard', 'sdcCard'];
const BOTH = ['combo', 'cab'];
const G = GRILLE_X;
const R_DUST = SPEAKER.rDust.mm;
const R_SUR = SPEAKER.rSurround.mm;
const COMBO = ampBox('combo');

export const CLAV_ZONES: DocumentedZone[] = [
  {
    id: 'cl.line',
    label: 'At the grille, on the dust-cap line',
    band: 'Start one close mic at the grille — within about 5 cm (2 in) of it — aimed straight in, on the line between the dust cap and the cone.',
    kind: 'sourced',
    src: 'S-MILLS',
    quote: 'place the mic right on the line between the dust cover and the speaker cone',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 5, max: 50 },
    bandProv: ill('“at the grille”: 0.5–5 cm out from the grille cloth, the lab’s drawing'),
    radial: { line: 'axis', min: R_DUST - 20, max: R_DUST + 20, prov: ill('the dust-cap line ±2 cm (the dust cap’s radius is a drawing default)') },
    requires: { variants: BOTH, micTypeIds: MICS },
    aim: { maxOffAxis: 15, prov: ill('aimed straight at the speaker: within 15°') },
    drawn: {
      side: { u0: G + 5, u1: G + 50, v0: -R_DUST - 20, v1: -R_DUST + 20 },
      top: { u0: G + 5, u1: G + 50, v0: -R_DUST - 20, v1: R_DUST + 20 },
    },
    start: { p: { x: G + 25, y: -R_DUST, z: 0 }, az: 0, el: 0 },
    tendency: 'A balanced, tight start between bite and body — the place to come back to. Mark it before you move anything.',
    checks: ['Clear of the grille: the mic never touches it', 'A stable stand that cannot tip into the speaker', 'Mark the position so it can be repeated'],
  },
  {
    id: 'cl.centre',
    label: 'Close, at the centre of the speaker',
    band: 'Try the mic 2–15 cm (1–6 in) from the grille, aimed at the centre of the speaker.',
    kind: 'sourced',
    src: 'S-PGA27',
    quote: 'Aim towards the center of the speaker for a clear, aggressive sound',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 20, max: 150 },
    bandProv: ill('Shure prints “2-15 cm” for amplifiers'),
    radial: { line: 'axis', min: 0, max: 30, prov: ill('“towards the center”: within 3 cm of the speaker’s centre line') },
    requires: { variants: BOTH, micTypeIds: MICS },
    aim: { maxOffAxis: 15, prov: ill('aimed at the centre: within 15°') },
    drawn: {
      side: { u0: G + 20, u1: G + 150, v0: -30, v1: 30 },
      top: { u0: G + 20, u1: G + 150, v0: -30, v1: 30 },
    },
    start: { p: { x: G + 60, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'More bite and upper-mid edge — the clavinet’s attack forward. It can turn sharp or abrasive with a bright pickup setting or a fuzz.',
    checks: ['Compare with the dust-cap line at matched level', 'Listen to the loudest passages: still not harsh?'],
  },
  {
    id: 'cl.edge',
    label: 'Close, toward the cone’s edge',
    band: 'Try the mic 2–15 cm (1–6 in) from the grille, moved out toward the edge of the cone.',
    kind: 'sourced',
    src: 'S-PGA27',
    quote: 'towards the edge of the speaker for a mellow sound',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 20, max: 150 },
    bandProv: ill('Shure prints “2-15 cm” for amplifiers'),
    radial: { line: 'axis', min: R_SUR - 40, max: R_SUR + 10, prov: ill('“towards the edge”: 9–14 cm off the centre (the surround’s radius is a drawing default)') },
    requires: { variants: BOTH, micTypeIds: MICS },
    aim: { maxOffAxis: 20, prov: ill('still aimed straight in: within 20°') },
    drawn: {
      side: { u0: G + 20, u1: G + 150, v0: -R_SUR - 10, v1: -R_SUR + 40 },
      top: { u0: G + 20, u1: G + 150, v0: -R_SUR - 10, v1: R_SUR + 10 },
    },
    start: { p: { x: G + 60, y: -110, z: 0 }, az: 0, el: 0 },
    tendency: 'A smoother, rounder attack — but the percussive bite the part may need can go with it.',
    checks: ['Does the attack still cut through the band?', 'Move back toward the centre a little at a time'],
  },
  {
    id: 'cl.angle',
    label: 'Turned off axis, at the same distance',
    band: 'From the dust-cap line, keep the distance and turn the mic about 30° toward the edge.',
    kind: 'sourced',
    src: 'SN-906-2020',
    quote: 'turn the microphone by approx. 30° towards the edge',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 5, max: 150 },
    bandProv: ill('close to the grille, as the positions it turns from'),
    radial: { line: 'axis', min: 20, max: 110, prov: ill('between the centre and the edge, the lab’s drawing') },
    requires: { variants: BOTH, micTypeIds: MICS },
    aim: { minOffAxis: 20, maxOffAxis: 45, prov: ill('“approx. 30°”: 20–45° off square to the grille') },
    drawn: {
      side: { u0: G + 5, u1: G + 150, v0: -110, v1: -20 },
      top: { u0: G + 5, u1: G + 150, v0: -110, v1: 110 },
    },
    start: { p: { x: G + 60, y: -70, z: 0 }, az: 0, el: 30 },
    tendency: 'A softer top end at the same distance. Position and pattern interact: change the angle alone and listen.',
    checks: ['Only the angle changed?', 'Spill from the side the mic now faces'],
  },
  {
    id: 'cl.back',
    label: 'A little farther back',
    band: 'Try the mic 15–30 cm (6–12 in) back from the speaker, on its axis.',
    kind: 'sourced',
    src: 'S-SM57-UG',
    quote: '15 to 30 cm (6 to 12 in.) away from speaker and on-axis with speaker cone',
    refSurface: 'grille',
    side: 'outside',
    distance: { min: 150, max: 300 },
    radial: { line: 'axis', min: 0, max: 60, prov: ill('“on-axis with speaker cone”: within 6 cm of its centre line') },
    requires: { variants: BOTH, micTypeIds: MICS },
    aim: { maxOffAxis: 15, prov: ill('on axis: within 15°') },
    drawn: {
      side: { u0: G + 150, u1: G + 300, v0: -60, v1: 60 },
      top: { u0: G + 150, u1: G + 300, v0: -60, v1: 60 },
    },
    start: { p: { x: G + 220, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'More of the cabinet and the room, a fuller and less pointed sound — and more spill and feedback risk on a stage.',
    checks: ['How much of the band and the monitors is in it now?', 'Compare with the close mic at matched level, in mono'],
  },
  {
    id: 'cl.rear',
    label: 'Behind the open back',
    band: 'With an open-backed amp, and only where the back is safe: a mic behind it, aimed at the back of the speaker — then check its polarity against the front mic.',
    kind: 'sourced',
    src: 'S-MILLS',
    quote: 'Don\'t forget to swap the polarity',
    refSurface: 'back',
    side: 'outside',
    distance: { min: 50, max: 150 },
    bandProv: ill('no source gives a distance: 5–15 cm behind the back, the lab’s drawing'),
    radial: { line: 'axis', min: 0, max: 90, prov: ill('behind the speaker, within 9 cm of its centre line') },
    requires: { variants: ['combo'], micTypeIds: MICS },
    aim: { maxOffAxis: 30, prov: ill('aimed at the back of the speaker: within 30°') },
    drawn: {
      side: { u0: COMBO.x0 - 150, u1: COMBO.x0 - 50, v0: -90, v1: 90 },
      top: { u0: COMBO.x0 - 150, u1: COMBO.x0 - 50, v0: -90, v1: 90 },
    },
    start: { p: { x: COMBO.x0 - 100, y: 0, z: 0 }, az: 180, el: 0 },
    tendency: 'Thicker and duller than the front, and its polarity is the opposite of a front mic’s — flip one of them, then judge the blend in mono.',
    checks: ['Clear of the hot chassis and the tubes', 'Clear of the wall behind', 'Polarity checked against the front mic'],
  },
];
