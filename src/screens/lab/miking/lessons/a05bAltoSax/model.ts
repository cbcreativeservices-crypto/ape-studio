/**
 * A05b ALTO SAXOPHONE — the suggested starting points (charter §2 layer
 * 1), on the shared family's zone kinds (lessons/shared/sax/saxZones.ts;
 * research alto_sax/SOURCES.md §2):
 *
 *   as.above     a few inches above the bell, aimed at the sound holes —
 *                Shure's "natural" position (the worked example);
 *   as.into      a few inches from and into the bell — bright, isolated;
 *   as.holes     a few inches from the sound holes — warm, full, key noise;
 *   as.clip      a miniature on the bell rim, on the player's right-hand side,
 *                angled between the bell and the keys (DPA);
 *   as.front     18–24 in in front, aimed between the bell and the left-hand
 *                keys (MDAT, ADDED);
 *   as.shoulder  over the player's shoulder — what the player hears (S-SAX).
 * "A few inches" has no number: drawn 5–10 cm (SX-04).
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { saxZone } from '../shared/sax/saxZones.ts';
import { ALTO_SAX } from './geometry.ts';

const F = ALTO_SAX;

export const ALTO_ZONES: DocumentedZone[] = [
  saxZone(F, 'above', 'as.above', {
    label: 'A few centimetres above the bell, aimed at the sound holes',
    band: 'Try about 5–10 cm (2–4 in) above the bell rim, aimed down across the body at the sound holes — a natural place to begin, hearing the bell and the holes together.',
    tendency: 'A natural blend of the bell and the body; the most even across low and high notes of the close spots. Move it toward the bell for brightness, or across the body to soften it.',
    checks: ['The bell’s swing as the player moves', 'The lowest and the highest notes the part uses', 'Key noise as the fingers work'],
  }),
  saxZone(F, 'into', 'as.into', {
    label: 'A few centimetres from the bell, aimed into it',
    band: 'Try about 5–10 cm (2–4 in) from the bell rim, on its axis, aimed into the bell — bright and focused, with the least spill.',
    tendency: 'Bright and direct, with the least spill and the most margin before feedback; it can sound narrow or honky, and it hears less of the notes that leave the open holes.',
    checks: ['High notes for harshness', 'Notes in the middle of the range for thinness', 'The bell’s swing as the player moves'],
  }),
  saxZone(F, 'holes', 'as.holes', {
    label: 'A few centimetres from the sound holes',
    band: 'Try about 5–10 cm (2–4 in) from the middle of the key stack, aimed at the holes — warmer and fuller.',
    tendency: 'Warm and full, with more of the keys and pads: clicks and thumps come with it. Back off a little, or aim across the body, if the mechanism takes over.',
    checks: ['Key and pad noise', 'The hands — nothing within their reach', 'Notes that leave far from the mic (the lowest, at the bell)'],
  }),
  saxZone(F, 'clip', 'as.clip', {
    label: 'Miniature on the bell rim, angled between the bell and the keys',
    band: 'With a clip made for this bell, on the rim at the player’s right-hand side, angle the capsule back between the bell and the keys — not straight down the bell.',
    tendency: 'A steady close sound that moves with the horn, so the player can move. Angled between the bell and the keys it is more balanced; aimed into the bell, brighter and narrower.',
    checks: ['A clip made for this bell, fitted with the player’s agreement', 'The strap, the right hand and the cable as the player moves', 'Handling noise; the wireless pack’s low cut against the lowest notes'],
  }),
  saxZone(F, 'front', 'as.front', {
    label: 'About 45–60 cm in front, aimed between the bell and the left-hand keys',
    band: 'Try about 45–60 cm (18–24 in) in front of the horn, aimed between the bell and the left-hand keys — more of the whole horn and some of the room.',
    tendency: 'The holes and the bell blend into one horn, with some of the room; more spill, and level changes if the player moves. A place to begin in a good studio room.',
    checks: ['How much room and how many neighbours it hears', 'The player’s movement against the mic’s zone', 'The stand’s base clear of the bell’s swing'],
  }),
  saxZone(F, 'shoulder', 'as.shoulder', {
    label: 'Over the player’s shoulder',
    band: 'In a good room, try a mic about 15–30 cm from the player’s right ear, above and a little behind the shoulder, looking down at the horn — the sound the player hears.',
    tendency: 'The horn as the player hears it — rounder and more blended than any close spot, with more of the room. A creative choice for a quiet room, not a stage.',
    checks: ['The player’s head and movement — nothing within reach', 'Breath and mouth noise', 'How much room it brings'],
  }),
];
