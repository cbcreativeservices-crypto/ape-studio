/**
 * A05c TENOR SAXOPHONE — the recommended starting points, on the shared
 * family's zone kinds (lessons/shared/sax/saxZones.ts; research
 * tenor_sax/SOURCES.md and alto_sax/SOURCES.md §2):
 *
 *   ts.above     a few inches above the bell, aimed at the sound holes (the
 *                worked example);
 *   ts.into      a few inches from and into the bell — bright, isolated;
 *   ts.holes     a few inches from the sound holes — warm, key noise;
 *   ts.clip      the bell clip, angled between the bell and the keys (DPA);
 *   ts.third     12–24 in from the bell, aimed a third of the way up the
 *                horn; seated, about level with the right elbow (Sweetwater,
 *                2024 archived copy — NOT Dave Martin's: SX-03);
 *   ts.shoulder  over the player's shoulder (S-SAX).
 * Dave Martin's "8–15 in, 45° off the bell" is unverifiable today (the live
 * page answers 403; the archived copy lacks it): not offered (SX-03).
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { saxZone } from '../shared/sax/saxZones.ts';
import { TENOR_SAX } from './geometry.ts';

const F = TENOR_SAX;

export const TENOR_ZONES: DocumentedZone[] = [
  saxZone(F, 'above', 'ts.above', {
    label: 'A few centimetres above the bell, aimed at the sound holes',
    band: 'Try about 5–10 cm (2–4 in) above the bell rim, aimed down across the body at the sound holes — a natural place to begin, hearing the bell and the holes together.',
    tendency: 'A natural blend of the bell and the body. Move it toward the bell for focus, or across the body to soften it; the tenor’s honk lives near the bell.',
    checks: ['The bell’s swing as the player moves', 'The lowest and the highest notes the part uses', 'Key noise as the fingers work'],
  }),
  saxZone(F, 'into', 'ts.into', {
    label: 'A few centimetres from the bell, aimed into it',
    band: 'Try about 5–10 cm (2–4 in) from the bell rim, on its axis, aimed into the bell — bright and direct, with the least spill.',
    tendency: 'Direct, punchy and isolated, with a good margin before feedback; it can sound honky or change character from register to register, and it hears less of the open holes.',
    checks: ['Middle notes for thinness or honk', 'High notes for harshness', 'The bell’s swing as the player moves'],
  }),
  saxZone(F, 'holes', 'ts.holes', {
    label: 'A few centimetres from the sound holes',
    band: 'Try about 5–10 cm (2–4 in) from the middle of the key stack, aimed at the holes — warmer and fuller; angle it across the body if the keys get loud.',
    tendency: 'Warm and full, with more key and pad noise. A higher or less direct angle across the body, or a little more distance, can keep the warmth and lose the clatter.',
    checks: ['Key and pad noise', 'The hands — nothing within their reach', 'The lowest notes, which leave at the bell'],
  }),
  saxZone(F, 'clip', 'ts.clip', {
    label: 'Miniature on the bell rim, angled between the bell and the keys',
    band: 'With a clip made for this bell, on the rim at the player’s right-hand side, angle the capsule back between the bell and the keys — not straight down the bell.',
    tendency: 'A steady close sound that moves with the horn. It does not hear every hole equally, and it is not feedback-proof; angled between the bell and the keys it is more balanced.',
    checks: ['A clip made for this bell, fitted with the player’s agreement', 'The strap, the right hand and the cable as the player moves', 'The wireless pack’s low cut against the lowest notes'],
  }),
  saxZone(F, 'third', 'ts.third', {
    label: 'About 30–60 cm from the bell, aimed a third of the way up the horn',
    band: 'Try about 30–60 cm (12–24 in) from the bell, in front and to the player’s right, aimed at the body a third of the way up from the bottom — not into the bell. Seated, start about level with the player’s right elbow.',
    tendency: 'A fuller, more balanced tenor: the holes and the bell blend, with some of the room. More spill and level change than a close spot.',
    checks: ['The player’s movement against the mic’s zone', 'The music stand and the player’s sight line', 'The stand’s base clear of the bell’s swing'],
  }),
  saxZone(F, 'shoulder', 'ts.shoulder', {
    label: 'Over the player’s shoulder',
    band: 'In a good room, try a mic about 15–30 cm from the player’s right ear, above and a little behind the shoulder, looking down at the horn — the sound the player hears.',
    tendency: 'The tenor as the player hears it: rounder and more blended, with more of the room. A creative choice for a quiet room, not an accurate audience view.',
    checks: ['The player’s head and movement — nothing within reach', 'Breath and mouth noise', 'How much room it brings'],
  }),
];
