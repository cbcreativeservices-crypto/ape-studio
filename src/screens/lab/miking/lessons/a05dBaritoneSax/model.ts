/**
 * A05d BARITONE SAXOPHONE — the suggested starting points, on the shared
 * family's zone kinds (lessons/shared/sax/saxZones.ts; research
 * baritone_sax/SOURCES.md and alto_sax/SOURCES.md §2):
 *
 *   bs.above     a few inches above the bell, aimed at the sound holes (the
 *                worked example);
 *   bs.into      a few inches from and into the bell — focused, isolated;
 *   bs.holes     a few inches from the sound holes — warm, key noise;
 *   bs.clip      the bell clip, angled between the bell and the keys — on a
 *                big horn one capsule covers fewer holes (DPA-SAX);
 *   bs.third     30–60 cm from the bell, aimed a third of the way up
 *                (Sweetwater, 2024 archive; SX-03);
 *   bs.triangle  the equilateral triangle: as far from the top and the bottom
 *                of the horn as the horn is long (Hill, S-SAX; DERIVED).
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { saxZone } from '../shared/sax/saxZones.ts';
import { BARITONE_SAX } from './geometry.ts';

const F = BARITONE_SAX;

export const BARITONE_ZONES: DocumentedZone[] = [
  saxZone(F, 'above', 'bs.above', {
    label: 'A few centimetres above the bell, aimed at the sound holes',
    band: 'Try about 5–10 cm (2–4 in) above the bell rim, aimed down across the body at the sound holes — a natural place to begin, though on a big horn it hears only the lower holes well.',
    tendency: 'A blend of the bell and the lower body, with weight. The upper holes are far away on a baritone: compare a farther spot that takes in more of the horn.',
    checks: ['The bell’s swing as the player turns', 'The lowest notes the part uses — and the highest', 'Proximity lift on the low notes'],
  }),
  saxZone(F, 'into', 'bs.into', {
    label: 'A few centimetres from the bell, aimed into it',
    band: 'Try about 5–10 cm (2–4 in) from the bell rim, on its axis, aimed into the bell — focused, with the least spill.',
    tendency: 'Focused presence beside a loud rhythm section, with the least spill; it can sound nasal or favour one register, and a directional mic this close lifts the lows.',
    checks: ['Low notes for boom (proximity)', 'Middle notes for a nasal edge', 'The bell’s swing as the player turns'],
  }),
  saxZone(F, 'holes', 'bs.holes', {
    label: 'A few centimetres from the sound holes',
    band: 'Try about 5–10 cm (2–4 in) from the middle of the key stack, aimed at the holes — warmer and fuller; on a baritone, aiming at one small key area can favour a few notes.',
    tendency: 'Warm and full, with more key and pad noise; some notes jump out, others fade. Back off or aim across the body if one area takes over.',
    checks: ['Key and pad noise', 'Note-to-note evenness up and down the part', 'The hands — nothing within their reach'],
  }),
  saxZone(F, 'clip', 'bs.clip', {
    label: 'Miniature on the bell rim — it covers fewer holes on a big horn',
    band: 'With a clip made for this bell, on the rim at the player’s right-hand side, angle the capsule back between the bell and the keys — not straight down the bell.',
    tendency: 'A steady, isolated close sound that moves with the horn — but one capsule hears only part of the baritone’s widely spaced holes, and the bell can sound too “midrange”.',
    checks: ['A clip made for this bell, fitted with the player’s agreement', 'The harness, the right hand and the cable as the player moves', 'A wireless pack’s 80 Hz cut against the lowest notes'],
  }),
  saxZone(F, 'third', 'bs.third', {
    label: 'About 30–60 cm from the bell, aimed a third of the way up the horn',
    band: 'Try about 30–60 cm (12–24 in) from the bell, in front and to the player’s right, aimed at the body a third of the way up from the bottom — lower on a baritone than on an alto.',
    tendency: 'More of the horn in one mic: the lower holes, the bell and some of the room blend; more spill and level change than a close spot.',
    checks: ['The player’s turn — the stand clear of the horn', 'The lowest line with any filter in and out', 'How much of the band it hears'],
  }),
  saxZone(F, 'triangle', 'bs.triangle', {
    label: 'The triangle: as far away as the horn is long',
    band: 'In a good room, try a mic in front about as far from the top of the horn as from the bottom — each roughly the horn’s own length, about a metre — aimed at the middle of the horn.',
    tendency: 'The whole baritone, top to bottom, with the room: the most even across the range, and the most spill. Often paired with a close mic, judged in mono.',
    checks: ['The room and the band it brings in', 'Low-note weight against the close mic', 'Mono with any second mic'],
  }),
];
