/**
 * C05c UKULELE — the technical truth (charter §2 layer 1). A soprano ukulele
 * (ukulele/GEOMETRY_PROPOSAL.md: the 34.5 cm string length from a museum
 * soprano, TRIAL for a modern one; the body sizes are drawing defaults — the
 * retailer size chart was a snippet only, never drawn as sourced), played
 * seated. Concert, tenor and baritone sizes are named in words, not drawn.
 *
 * Starting points: the lesson's 20–40 cm teaching trial at the upper body /
 * neck joint, off the strumming arc and a little off the sound hole's axis
 * (the guide does not locate the ukulele's sweet spot: the aim comes from the
 * guitar, and the app says so — UK-01); about 20 cm (8 in) toward the sound
 * hole (the recording guide's guitar row lists the ukulele; TRIAL); and a
 * clip — with no claim about which clip fits, because the depth here is a
 * drawing default (the fit rule is sourced, the depth is not).
 */
import type { Provenance } from '../../engine/model/types.ts';
import { UKE_SOPRANO } from '../shared/guitars/guitarSpec.ts';
import type { GVariant, GuitarScene, ZoneSpec } from '../shared/guitars/guitarModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const C05C_VARIANTS: GVariant[] = [
  { id: 'soprano', label: 'SOPRANO', blurb: 'The smallest common ukulele: four nylon strings over a short neck that meets the body at the 12th fret.', phrase: 'a soprano ukulele', spec: UKE_SOPRANO, posture: 'seated' },
];

const STAND = ['sdcCard', 'instDynCard'];

export function c05cZoneSpecs(sc: GuitarScene): ZoneSpec[] {
  const g = sc.g;
  const clipX0 = g.hole.x + g.hole.r * 0.3;
  const clipX1 = g.edge - 24;
  return [
    {
      id: 'upper',
      label: 'The upper body and neck joint, off the strumming arc',
      band: 'Start about 20–40 cm (8–16 in) out from where the neck meets the body, off the strumming arc and a little off the sound hole’s axis.',
      kind: 'trial',
      src: 'LESSON',
      quote: 'Start with a single mic in front of the upper body/neck-joint area, off the player\'s strumming arc and slightly away from a straight sound-hole axis. A practical quiet-room trial is approximately 20–40 cm (8–16 in)',
      bandProv: { kind: 'trial', src: 'LESSON', note: 'a teaching trial; the cited ukulele guide gives no distance and does not locate the sweet spot (ukulele/SOURCES.md)' },
      surface: 'joint',
      distance: { min: 203.2, max: 406.4 },
      radial: { max: 80, prov: ill('near the joint: within 8 cm of its line') },
      aimAtR: { r: 90, prov: ill('aimed at the upper body and the joint') },
      micTypeIds: STAND,
      start: { d: 290, dx: -15 },
      tendency: 'String definition with some body — a balanced first experiment. Too far toward the fingerboard can turn thin; the player moving changes it.',
      checks: ['Clear of the strumming arc and the fretting hand', 'Thinness toward the fingerboard', 'A singing player’s vocal mic nearby'],
    },
    {
      id: 'hole',
      label: 'Toward the sound hole, a little closer',
      band: 'Start about 20 cm (8 in) out from the sound hole — toward it, but not straight into it from close up.',
      kind: 'trial',
      src: 'S-REC',
      quote: '8 inches from sound hole',
      bandProv: { kind: 'trial', src: 'S-REC', note: 'the recording guide lists the ukulele under its guitar rows; drawn 18–23 cm' },
      surface: 'hole',
      distance: { min: 180, max: 230 },
      radial: { max: 70, prov: ill('near the hole: within 7 cm of its line') },
      aimAtR: { r: 80, prov: ill('aimed toward the hole') },
      micTypeIds: STAND,
      start: { d: 205, dx: -10 },
      tendency: 'More body and low-mid. Straight into the hole from close up it can favour one local resonance and lose the strings — compare with the upper body.',
      checks: ['The strumming hand', 'A boomy or hollow body note', 'Compare the lowest notes with the upper-body start'],
    },
    {
      id: 'clip',
      label: 'Clipped on (a clip whose range fits this body)',
      band: 'Start with the mini mic about 3–8 cm (1–3 in) over the top, between the sound hole and where the neck meets the body, aimed at the top.',
      kind: 'sourced',
      src: 'DPA-UKE',
      quote: 'VC4099 … between 35 mm (1.4 in) and 55 mm (2.1 in); GC4099 … between 35 mm (1.4 in) and 122 mm (4.8 in)',
      bandProv: ill('no source gives a height: 3–8 cm is the lab’s drawing of a clip-held capsule'),
      surface: 'top',
      distance: { min: 30, max: 80 },
      aimMax: { deg: 55, prov: ill('aimed at the top: within 55° of straight onto it') },
      micTypeIds: ['clipCond'],
      boxG: { min: { x: clipX0, y: -35, z: 30 }, max: { x: clipX1, y: 35, z: 80 }, prov: ill('between the hole and the joint, over the strings: the lab’s drawing') },
      start: { dx: (clipX0 + clipX1) / 2, d: 55, aimAt: { x: (clipX0 + clipX1) / 2 - 15, y: 0, z: 0 } },
      tendency: 'A consistent position as the player moves — but it may not keep the same tonal balance as a broader stand mic. Listen for contact noise and local colour.',
      checks: ['Measure the body’s real depth against the clip’s range', 'A finish the clip may mark, and the owner’s OK', 'The strumming hand and the strings'],
    },
  ];
}
