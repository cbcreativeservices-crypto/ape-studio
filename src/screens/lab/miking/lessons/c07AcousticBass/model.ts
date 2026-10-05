/**
 * C07 ACOUSTIC BASS GUITAR — the technical truth (charter §2 layer 1). A
 * hollow-body bass played like a guitar: a 34 in scale whose neck meets a
 * cutaway body at the 17th fret (acoustic_bass_guitar/SOURCES.md MAR-BC16E);
 * the body sizes are drawing defaults (the maker page gives none).
 *
 * The starting points (acoustic_bass_guitar/GEOMETRY_PROPOSAL.md): the
 * lesson's own 20–45 cm teaching trial at the upper body / neck joint (no
 * bass-specific source gives a distance — the app says "a place to begin"),
 * an engineer's guitar start used by analogy (the treble side of the upper
 * bout, about 30 cm — correction AB-01 adds the metric and "treble side"),
 * and a clip on the body edge (the 35–122 mm fit rule; this depth 115 mm).
 */
import type { Provenance } from '../../engine/model/types.ts';
import { BASS_BC16 } from '../shared/guitars/guitarSpec.ts';
import type { GVariant, GuitarScene, ZoneSpec } from '../shared/guitars/guitarModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const C07_VARIANTS: GVariant[] = [
  { id: 'bass', label: 'BASS', blurb: 'A four-string acoustic bass guitar with a cutaway body; the neck meets the body at the 17th fret.', phrase: 'an acoustic bass guitar', spec: BASS_BC16, posture: 'seated' },
];

const STAND = ['sdcCard', 'instDynCard'];
const NEAR = ill('"near": within 9 cm of the point’s line — the lab’s drawing');
const AIMED = ill('aimed at the region: the axis meets the top within 13 cm of the point — the lab’s tolerance');

export function c07ZoneSpecs(sc: GuitarScene): ZoneSpec[] {
  const g = sc.g;
  const clipX0 = g.hole.x + g.hole.r * 0.5;
  const clipX1 = g.edge - 24;
  return [
    {
      id: 'neck',
      label: 'The upper body, near where the neck meets it',
      band: 'Start about 20–45 cm (8–18 in) out from where the neck meets the body, angled to take in the top and the strings — not straight into the sound hole.',
      kind: 'trial',
      src: 'LESSON',
      quote: 'Begin with one mic roughly 20–45 cm (8–18 in) from the upper body/neck-joint or neck-to-hole region, with its axis angled to include top and strings without pointing straight into the opening.',
      bandProv: { kind: 'trial', src: 'LESSON', note: 'a teaching trial: no bass-specific source gives a distance (acoustic_bass_guitar/SOURCES.md)' },
      surface: 'joint',
      distance: { min: 203.2, max: 457.2 },
      radial: { max: 90, prov: NEAR },
      aimAtR: { r: 130, prov: AIMED },
      micTypeIds: STAND,
      start: { d: 300, dx: -40, aimAt: { x: g.edge - 70, y: 0, z: 0 } },
      tendency: 'Pitch, finger attack and some body together — a balanced first view. Too far toward the neck can turn it all string and finger; check the lowest notes, too.',
      checks: ['Clear of the fretting hand and the long neck’s path', 'The lowest string, across its whole range', 'How it changes as the player moves'],
    },
    {
      id: 'upper',
      label: 'The treble side of the upper bout (the cutaway)',
      band: 'Start about 30 cm (12 in) out from the treble side of the upper bout, by the cutaway.',
      kind: 'trial',
      src: 'TAY-REC',
      quote: 'aimed at the treble side of the upper bout of the guitar — the cutaway region — from approximately 12 inches away',
      bandProv: { kind: 'trial', src: 'TAY-REC', note: 'a guitar start used by analogy (the lesson says so); "approximately 12 inches" drawn as 25–36 cm' },
      surface: 'upper',
      distance: { min: 254, max: 355.6 },
      radial: { max: 90, prov: NEAR },
      aimAtR: { r: 130, prov: AIMED },
      micTypeIds: STAND,
      start: { d: 300 },
      tendency: 'A broader view of the top with less of the hole — a guitar starting point, worth trying here. If the low end booms, turn a little away from the sound hole.',
      checks: ['The fretting hand round the cutaway', 'Boom on the low notes: turn away from the hole', 'Compare with the neck-joint start at matched levels'],
    },
    {
      id: 'clip',
      label: 'Clipped on, between the neck joint and the sound hole',
      band: 'Start with the mini mic about 3–9 cm (1–3.5 in) over the top, between where the neck meets the body and the sound hole, aimed at the top.',
      kind: 'sourced',
      src: 'DPA-MOUNT',
      quote: 'body depth between 35 mm (1.4 in) and 122 mm (4.8 in)',
      bandProv: ill('no source gives a height: 3–9 cm over the top is the lab’s drawing of a clip-held capsule'),
      surface: 'top',
      distance: { min: 30, max: 90 },
      aimMax: { deg: 55, prov: ill('aimed at the top: within 55° of straight onto it (the lab’s tolerance)') },
      micTypeIds: ['clipCond'],
      boxG: { min: { x: clipX0, y: -55, z: 30 }, max: { x: clipX1, y: 55, z: 90 }, prov: ill('between the neck joint and the sound hole, over the strings: the lab’s drawing') },
      start: { dx: (clipX0 + clipX1) / 2, d: 60, aimAt: { x: (clipX0 + clipX1) / 2 - 20, y: 0, z: 0 } },
      tendency: 'A close, steady view that moves with the bass — handy on a stage. It hears a small local part of the top; check the low notes and finger noise.',
      checks: ['A clip made for this body depth, with the owner’s OK', 'The plucking hand and the strings', 'The cable, strain-relieved and clear of the strap and feet'],
    },
  ];
}
