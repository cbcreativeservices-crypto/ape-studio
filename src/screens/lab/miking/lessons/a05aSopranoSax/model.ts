/**
 * A05a SOPRANO SAXOPHONE — the recommended starting points, on the shared
 * family's zone kinds (lessons/shared/sax/saxZones.ts; research
 * soprano_sax/SOURCES.md and alto_sax/SOURCES.md §2). The soprano is the
 * exception: its bell does not curve up, so a mic at the middle of the body
 * will not hear the holes and the bell together (S-REC, S-LIVE) — no
 * mid-body "natural" zone is offered.
 *
 *   ss.above   a few inches from the bell on its upper side, aimed up the
 *              body toward the sound holes (L10, L14) — the worked example;
 *   ss.into    a few inches from and into the bell — bright, isolated;
 *   ss.holes   a few inches from the upper/body tone holes — warm (L34);
 *   ss.far     the clip as far from the bell as it reaches, aimed back at
 *              the upper keys — rounder, warmer (DPA-MOUNT);
 *   ss.bite    the clip in front of the bell — harder, more bite (DPA-MOUNT);
 *   ss.front   a little more distance in front: 45–60 cm, aimed between the
 *              bell and the left-hand keys (MDAT, ADDED).
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { saxZone } from '../shared/sax/saxZones.ts';
import { SOPRANO_SAX } from './geometry.ts';

const F = SOPRANO_SAX;

export const SOPRANO_ZONES: DocumentedZone[] = [
  saxZone(F, 'above', 'ss.above', {
    label: 'A few centimetres above the bell, aimed up toward the sound holes',
    band: 'Try about 5–10 cm (2–4 in) from the bell rim, on its upper side, aimed up the body toward the sound holes — a place to begin that hears some of the holes and the bell.',
    tendency: 'A blend of the bell and the lower holes; less of the upper holes than on a curved sax. Compare it with the bell and with a little more distance.',
    checks: ['The horn’s swing as the player moves', 'Upper notes, which leave high on the body', 'Reed and breath noise'],
  }),
  saxZone(F, 'into', 'ss.into', {
    label: 'A few centimetres from the bell, aimed into it',
    band: 'Try about 5–10 cm (2–4 in) from the bell rim, on its axis — in front of and below the bell — aimed into it: bright, with the least spill.',
    tendency: 'Bright, direct and isolated, with a good margin before feedback; it can sound narrow, nasal or hard, and it misses much of the upper holes.',
    checks: ['Upper notes for harshness', 'Middle notes for thinness', 'The player’s knees and the swing of the straight horn'],
  }),
  saxZone(F, 'holes', 'ss.holes', {
    label: 'A few centimetres from the sound holes',
    band: 'Try about 5–10 cm (2–4 in) from the middle of the key stack, aimed at the holes and away from the bell’s axis — warmer and fuller.',
    tendency: 'Warm and full, the body and the reed together, with more key and pad noise. Back off, or aim across the body, if the clicks take over.',
    checks: ['Key and pad noise', 'The hands — nothing within their reach', 'The lowest notes, which leave at the bell'],
  }),
  saxZone(F, 'sopFar', 'ss.far', {
    label: 'Clip far from the bell, aimed back at the upper keys',
    band: 'With a clip made for this bell, bring the capsule as far back from the bell as its gooseneck reaches, and aim it up the body toward the upper keys — rounder and warmer.',
    tendency: 'A rounder, warmer close sound that moves with the horn. Farther from the bell means less of its edge; check that the upper notes do not get thin.',
    checks: ['A clip made for this bell, with the player’s agreement', 'The right hand and the keys — the gooseneck stays clear of them', 'Handling noise as the player moves'],
  }),
  saxZone(F, 'sopFront', 'ss.bite', {
    label: 'Clip in front of the bell, for bite',
    band: 'With the same clip, bring the capsule round in front of the bell, a few centimetres off the rim and aimed into it — a harder sound with more bite.',
    tendency: 'Harder and brighter, with more edge and isolation — useful against a loud band; it can turn shrill on high notes.',
    checks: ['High notes for shrillness', 'The capsule clear of the rim and of the player’s knees', 'Wind from the bell'],
  }),
  saxZone(F, 'front', 'ss.front', {
    label: 'About 45–60 cm in front, aimed between the bell and the left-hand keys',
    band: 'Try about 45–60 cm (18–24 in) in front of the horn, aimed between the bell and the left-hand keys — a little distance blends the straight bell and the body.',
    tendency: 'The bell and the holes blend into one horn, with less mechanical detail and more of the room; more spill, and level changes as the player moves.',
    checks: ['How much room it hears', 'The player’s movement against the mic’s zone', 'The stand’s base clear of the horn’s swing'],
  }),
];
