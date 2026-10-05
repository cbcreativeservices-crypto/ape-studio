/**
 * C01 ACOUSTIC GUITAR — the technical truth (charter §2 layer 1). Steel-
 * string six-string, twelve-string and nylon-string in ONE lesson with a BODY
 * selector: the research (acoustic_guitar/SOURCES.md) gives the three the
 * same starting points — one 15–30 cm band near the 12th fret or near the
 * sound hole — and differs only in tendencies (attack, chime, softness) and
 * in where the neck meets the body. So the technique does not differ
 * materially; the geometry does, and each body brings its own zones.
 *
 * Source keys point into docs/labs/miking/acoustic_guitar/SOURCES.md; the
 * geometry is acoustic_guitar/GEOMETRY_PROPOSAL.md (§2 bodies, §4 zones, §5
 * player envelopes), built by the shared guitar family (lessons/shared/
 * guitars/). Learner-facing words are starting points (owner ruling
 * 2026-10-04); `kind`, `src`, `quote` and every `prov` are the internal record.
 */
import type { Provenance } from '../../engine/model/types.ts';
import { NYLON_C5, STEEL_DREAD, TWELVE_HD } from '../shared/guitars/guitarSpec.ts';
import type { GVariant, GuitarScene, ZoneSpec } from '../shared/guitars/guitarModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const C01_VARIANTS: GVariant[] = [
  { id: 'steel', label: 'STEEL 6', blurb: 'A steel-string six-string with a large, deep dreadnought body. Its neck meets the body at the 14th fret.', phrase: 'a steel-string dreadnought', spec: STEEL_DREAD, posture: 'seated' },
  { id: 'twelve', label: '12-STRING', blurb: 'Six pairs of strings (courses); in common arrangements the lower pairs are tuned an octave apart. A dreadnought body; the neck meets it at the 14th fret.', phrase: 'a twelve-string dreadnought', spec: TWELVE_HD, posture: 'seated' },
  { id: 'nylon', label: 'NYLON', blurb: 'A classical nylon-string guitar: a smaller, shallower body, a wide flat neck, a tie-block bridge. Its neck meets the body at the 12th fret.', phrase: 'a nylon-string classical guitar', spec: NYLON_C5, posture: 'seated' },
];

const MIC_STAND = ['sdcCard', 'instDynCard'];
const NEAR = ill('"near": within 8 cm of the point’s line — the lab’s drawing of "near"');
const AIMED = ill('aimed at the point: the mic’s axis meets the top within 11 cm of it — the lab’s tolerance');

/** The five recommended starting points on one body (zone ids get the
 *  variant suffix: `fret12.steel`). */
export function c01ZoneSpecs(sc: GuitarScene): ZoneSpec[] {
  const g = sc.g;
  const nylon = g.spec.jointFret?.mm === 12;
  const clipX0 = g.hole.x + g.hole.r * 0.5;
  const clipX1 = g.edge - 24;
  return [
    {
      id: 'fret12',
      label: nylon ? 'Near the 12th fret (here, where the neck meets the body)' : 'Near the 12th fret',
      band: 'Start about 15–30 cm (6–12 in) out from the 12th fret, aimed between the upper top and the nearby strings.',
      kind: 'sourced',
      src: 'S-PGA27',
      quote: 'Acoustic guitar 6-12 inches (15-30 cm) Place near the sound hole for a full sound, or near the 12th fret for a balanced, natural sound.',
      surface: nylon ? 'joint' : 'fret12',
      distance: { min: 152.4, max: 304.8 },
      radial: { max: 80, prov: NEAR },
      aimAtR: { r: 110, prov: AIMED },
      micTypeIds: MIC_STAND,
      start: { d: 225, dx: -20, aimAt: { x: (nylon ? g.edge : g.fret12) - 45, y: 0, z: 0 } },
      tendency: 'A balanced starting view: the strings’ detail with some of the body. Listen for fret and finger noise, and for how the balance shifts when the player moves.',
      checks: ['Clear of the fretting hand, the strumming arm and the player’s sight line', 'Fret noise and finger squeak', 'How the balance changes as the player moves'],
    },
    {
      id: 'hole',
      label: 'Near the sound hole',
      band: 'Start about 15–30 cm (6–12 in) out from the sound hole, facing it.',
      kind: 'sourced',
      src: 'S-PGA27',
      quote: 'Place near the sound hole for a full sound',
      surface: 'hole',
      distance: { min: 152.4, max: 304.8 },
      radial: { max: 80, prov: NEAR },
      aimAtR: { r: 110, prov: AIMED },
      micTypeIds: MIC_STAND,
      start: { d: 235 },
      tendency: 'A fuller sound, with more of the body and its low end. Very close to the hole it can turn boomy — about 8 cm (3 in) away is a common example of too much. Move it and listen.',
      checks: ['Boom and low-mid build-up', 'The strumming hand’s clearance', 'Breath or voice spill from a singing player'],
    },
    {
      id: 'bridge',
      label: 'Toward the bridge',
      band: 'Start about 10–20 cm (4–8 in) out from the bridge.',
      kind: 'sourced',
      src: 'S-REC',
      quote: '4 to 8 inches from bridge',
      surface: 'bridge',
      distance: { min: 101.6, max: 203.2 },
      radial: { max: 70, prov: NEAR },
      aimAtR: { r: 100, prov: AIMED },
      micTypeIds: MIC_STAND,
      start: { d: 165 },
      tendency: 'More of the pick or fingers and the bridge’s bite — often a sharper, more percussive sound. Check for thinness and for pick or nail noise.',
      checks: ['The strumming hand and the pick’s swing', 'Thinness, compared by ear at matched levels', 'Pick or nail noise'],
    },
    {
      id: 'upper',
      label: 'The upper bout, treble side, a little farther',
      band: 'Start about 30 cm (12 in) out from the treble side of the upper bout.',
      kind: 'sourced',
      src: 'TAY-REC',
      quote: 'aimed at the treble side of the upper bout of the guitar — the cutaway region — from approximately 12 inches away',
      bandProv: ill('"approximately 12 inches": drawn as 25–36 cm (10–14 in)'),
      surface: 'upper',
      distance: { min: 254, max: 355.6 },
      radial: { max: 90, prov: NEAR },
      aimAtR: { r: 110, prov: AIMED },
      micTypeIds: MIC_STAND,
      start: { d: 300 },
      tendency: 'A broader view of the top, with less of the hole. Another place engineers begin; if the low end builds up, turn the mic a little away from the sound hole.',
      checks: ['The fretting hand and the neck’s path', 'Room sound, compared with a closer start', 'Boom: turn away from the hole'],
    },
    {
      id: 'clip',
      label: 'Clipped on, between the neck joint and the sound hole',
      band: 'Start with the mini mic about 3–9 cm (1–3.5 in) over the top, between where the neck meets the body and the sound hole, aimed down at the top.',
      kind: 'sourced',
      src: 'DPA-AG',
      quote: 'The spot between the fret board and the sound hole is a good starting position to mount a guitar microphone.',
      bandProv: ill('no source gives a height: 3–9 cm over the top is the lab’s drawing of a clip-held capsule (proposal capsule z 60 mm, drawing default)'),
      surface: 'top',
      distance: { min: 30, max: 90 },
      aimMax: { deg: 55, prov: ill('aimed at the top: within 55° of straight onto it (the lab’s tolerance)') },
      micTypeIds: ['clipCond'],
      boxG: { min: { x: clipX0, y: -55, z: 30 }, max: { x: clipX1, y: 55, z: 90 }, prov: ill('between the neck joint and the sound hole, over the strings: the lab’s drawing') },
      start: { dx: (clipX0 + clipX1) / 2, d: 60, aimAt: { x: (clipX0 + clipX1) / 2 - 25, y: 0, z: 0 } },
      tendency: 'A close, steady view that moves with the guitar. Turning it toward the sound hole tends to give more level and low end; check that it does not overstate one small spot.',
      checks: ['A clip made for this body depth, with the owner’s OK', 'The strumming hand and the strings', 'The cable, strain-relieved and clear of the strap and feet'],
    },
  ];
}
