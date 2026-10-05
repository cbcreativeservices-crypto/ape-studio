/**
 * C09b VIOLA — the recommended starting points (charter §2 layer 1).
 * Source keys: docs/labs/miking/viola/SOURCES.md (and violin/SOURCES.md §0
 * for the family's). Corrections VA-01 … VA-04 (CORRECTIONS_LOG).
 *
 *   front   the lesson's own studio trial, "in front of and somewhat above
 *           the player … about 0.5–1.2 m" (L9, L75) — an audition range the
 *           lesson proposed, kept as a modest suggestion; "1.5–4 ft" → about
 *           1.6–3.9 ft (VA-01);
 *   aimed   a compact cardioid aimed at a chosen area — bridge and top, an
 *           f-hole, the fingerboard's end — to bring out timbre, bow or
 *           finger sounds (DPA); proximity effect can add body. No number:
 *           15–40 cm is the proposal's drawing default;
 *   clip    a miniature on a body clip on the bass-side rib (DPA, the
 *           mic-system clip for violin and viola);
 *   holder  a holder gripping two strings between the tailpiece and the
 *           bridge, the capsule over or under them (DPA).
 * Starts are found once at load: in the zone and clear, standing AND seated.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { add, norm, scale, sub } from '../../engine/geometry/vec.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneDisc, zoneSection } from '../shared/bowed/bowedModel.ts';
import { A, BEHIND, FRONT, STANDING, VIOLA_MODEL } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ax = STANDING.ax;
const VARIANTS = ['standing', 'seated'] as const;
const draws = (target: typeof A.bridgeTop, axis: typeof FRONT, cone: number, r0: number, r1: number) => ({
  side: zoneSection('side', target, axis, cone, r0, r1),
  top: zoneSection('top', target, axis, cone, r0, r1),
});
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<DocumentedZone['start']>): DocumentedZone => ({ ...z, start: firstClear(VIOLA_MODEL, z, VARIANTS, gen, MIC_TYPES) } as DocumentedZone);
const AIMED_DIR = norm(add(ax.z, scale({ x: 1, y: 0, z: 0 }, 0.9)));
const CLIP_DIR = norm(add(ax.z, scale(ax.y, -1.1)));

const FRONT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'va.front',
  label: 'In front of the viola, a little above it',
  band: 'Try about 0.5–1.2 m (about 1.6–3.9 ft) from the bridge, in front of the player and a little above, aimed broadly at the bridge and top — a modest place to begin.',
  kind: 'trial',
  src: 'LESSON',
  quote: 'place a stable stand microphone in front of and somewhat above the player, aimed broadly toward the bridge and top … about 0.5–1.2 m (1.5–4 ft) from the instrument (L9)',
  bandProv: { kind: 'trial', src: 'S-PGA27', note: 'the lesson’s own audition range (L75), inside the published 30 cm–2 m band for strings; "1.5–4 ft" → about 1.6–3.9 ft (VA-01)' },
  refSurface: 'bridge',
  side: 'outside',
  distance: { min: 500, max: 1200 },
  cone: { min: 0, max: 35, prov: ill('in front and a little above: within 35° of a line 20° above the audience-facing direction') },
  aim: { maxOffAxis: 25, prov: ill('aimed broadly at the bridge and top: within 25°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.bridgeTop, FRONT, 35, 500, 1200),
  tendency: 'The whole viola with some room: body, articulation and space together. Hears neighbours and reflections too. A modest place to begin; move it and listen.',
  checks: ['The bow’s full sweep and the bow arm stay clear', 'The low C and the high A, quiet and strong bows', 'Spill from neighbours, and the player’s sway'],
};

const AIMED_Z: Omit<DocumentedZone, 'start'> = {
  id: 'va.aimed',
  label: 'A compact cardioid aimed at one area',
  band: 'Try about 15–40 cm (6–16 in) from the bridge, aimed at the area whose sound you want — the bridge and top, an f-hole, or the end of the fingerboard.',
  kind: 'sourced',
  src: 'DPA-VLA',
  quote: 'Point a 4011C Cardioid Microphone, Compact directly at an area of the instrument and thereby enhance a special sound, i.e. timbre, bow sounds or finger sounds.',
  bandProv: ill('no number is given: 15–40 cm is the proposal’s drawing default'),
  refSurface: 'bridge',
  side: 'outside',
  distance: { min: 150, max: 400 },
  cone: { min: 0, max: 50, prov: ill('in front of the top: within 50° (the lab’s drawing)') },
  aimAt: { surface: 'top', r: 150, prov: ill('aimed at an area of the instrument: the mic’s axis meets the top within 15 cm of the bridge') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.bridgeTop, AIMED_DIR, 50, 150, 400),
  tendency: 'More definition and a focused presence: toward the bridge more bow and attack, toward the body more weight — and close up, proximity effect adds low-end body. A coloured view by design.',
  checks: ['Bow scrape on quiet starts', 'The C string: thin, or boomy?', 'One string much louder than the others'],
};

const CLIP_Z: Omit<DocumentedZone, 'start'> = {
  id: 'va.clip',
  label: 'Miniature on a body clip, over the top',
  band: 'Clip it to the bass-side rib by the lower bout and bring the capsule about 3–9 cm from the bridge’s foot, over the top, aimed at the bridge or toward an f-hole — away from the player’s face.',
  kind: 'sourced',
  src: 'DPA-VC4099',
  quote: 'Connect a 4099 Instrument Microphone to a violin, viola, banjo or mandolin',
  bandProv: ill('no distance is given: 3–9 cm from the bridge’s foot on the bass side is the lab’s drawing'),
  refSurface: 'foot',
  side: 'outside',
  distance: { min: 30, max: 90 },
  cone: { min: 15, max: 80, toward: scale(ax.y, -1), prov: ill('over the top on the bass side (the lab’s drawing)') },
  aim: { maxOffAxis: 50, prov: ill('aimed at the bridge and top, away from the head: within 50°') },
  requires: { micTypeIds: ['strMini'] },
  draw: { side: zoneDisc('side', add(A.bridgeFoot, scale(CLIP_DIR, 55)), 30), top: zoneDisc('top', add(A.bridgeFoot, scale(CLIP_DIR, 55)), 30) },
  tendency: 'A steady close sound as the player turns; it samples only part of the viola, so choose its aim with care. It still hears the stage.',
  checks: ['A clip made for this viola, fitted to its depth, with the player’s agreement', 'Chin rest, shoulder rest and a full bow before it counts as safe', 'Rattles, slips or a cable rubbing'],
};

const HOLDER_Z: Omit<DocumentedZone, 'start'> = {
  id: 'va.holder',
  label: 'Miniature on a holder behind the bridge',
  band: 'On a holder gripping two strings between the tailpiece and the bridge, try the capsule within about 2 cm of the strings just behind the bridge — under them or over them.',
  kind: 'sourced',
  src: 'DPA-MHS',
  quote: 'mounted between the tailpiece and the bridge. It can be turned upwards or downwards so that the mic will be placed either over or under the strings',
  bandProv: ill('no distance is given: within 2 cm of the strings just behind the bridge is the lab’s drawing'),
  refSurface: 'behind',
  side: 'either',
  distance: { min: 0, max: 22 },
  requires: { micTypeIds: ['strMini'] },
  draw: { side: zoneDisc('side', BEHIND, 22), top: zoneDisc('top', BEHIND, 22) },
  tendency: 'Strings and top together, close and steady — a different design from the body clip, with its own colour. Compare under and over the strings.',
  checks: ['The holder gripping two strings, never across the bowing length', 'Contact and cable noise as the player moves', 'The colour: under against over'],
};

const fwdSide = norm(sub({ x: 0, y: 0, z: 1 }, scale(FRONT, FRONT.z)));
export const VIOLA_ZONES: DocumentedZone[] = [
  start(FRONT_Z, around(A.bridgeTop, FRONT, [700, 800, 600, 900, 550, 1000], 30, A.bridgeTop, fwdSide)),
  start(AIMED_Z, around(A.bridgeTop, AIMED_DIR, [250, 220, 280, 200, 320, 180, 360], 45, A.bridgeFoot, ax.y)),
  start(CLIP_Z, around(A.bridgeFoot, CLIP_DIR, [55, 45, 65, 40, 75], 30, A.bridgeFoot, ax.x)),
  start(HOLDER_Z, around(BEHIND, ax.z, [0, 6, 10, 14, 18], 90, A.bridgeFoot, ax.y)),
];
