/**
 * C05b MANDOLIN — the technical truth (charter §2 layer 1). An A-style
 * (oval hole) and an F-style (f-holes, scroll and points) mandolin, eight
 * strings in four pairs, played standing on a strap. The overall length and
 * width are museum instruments' (mandolin/SOURCES.md, TRIAL for a modern
 * one); the scale, body length, depth and openings are drawing defaults
 * (mandolin/GEOMETRY_PROPOSAL.md).
 *
 * Starting points: aimed at where the neck meets the body (DPA's "sweet
 * spot") at 30–40 cm — the lesson's trial reading of DPA's two-omni
 * "distance" (MD-01); toward the opening at about 20 cm (8 in), the
 * recording guide's guitar row that lists the mandolin (TRIAL); and a
 * miniature mic on a violin-type clip (35–55 mm body depth: this drawing's
 * 45 mm fits).
 */
import type { Provenance } from '../../engine/model/types.ts';
import { MANDO_A, MANDO_F } from '../shared/guitars/guitarSpec.ts';
import type { GVariant, GuitarScene, ZoneSpec } from '../shared/guitars/guitarModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const C05B_VARIANTS: GVariant[] = [
  { id: 'a', label: 'A-STYLE', blurb: 'A teardrop body with an oval sound hole — often a rounder, more vocal character.', phrase: 'an A-style mandolin', spec: MANDO_A, posture: 'standing' },
  { id: 'f', label: 'F-STYLE', blurb: 'A carved body with two f-holes, a scroll and points — often more treble attack and percussive chop.', phrase: 'an F-style mandolin', spec: MANDO_F, posture: 'standing' },
];

const STAND = ['sdcCard', 'instDynCard'];

export function c05bZoneSpecs(sc: GuitarScene): ZoneSpec[] {
  const g = sc.g;
  const f = sc.variant.spec.opening.kind === 'fholes';
  const clipX0 = Math.max(g.hole.x + g.hole.r * 0.5, 100);
  const clipX1 = g.edge - 24;
  return [
    {
      id: 'joint',
      label: 'Aimed where the neck meets the body',
      band: 'Start about 30–40 cm (12–16 in) out from where the neck meets the body, aimed at that junction.',
      kind: 'trial',
      src: 'DPA-MANDO',
      quote: 'Try aiming an omni at the sweet spot, which is often where the neck meets the body',
      bandProv: { kind: 'trial', src: 'DPA-MANDO', note: '"place two omnis at 30-40 cm (12-16 in) distance" read as a one-mic distance (the lesson’s trial; "distance" may mean the pair’s spacing)' },
      surface: 'joint',
      distance: { min: 300, max: 400 },
      radial: { max: 100, prov: ill('aimed at the junction from roughly in front: within 10 cm of its line') },
      aimAtR: { r: 110, prov: ill('aimed at the junction') },
      micTypeIds: STAND,
      start: { d: 340, dx: -20 },
      tendency: 'A balance of strings, pick and wood — a first view to compare others against. A small instrument moves: watch the level and tone as the player turns.',
      checks: ['Clear of the picking and fretting hands', 'How it changes as the player moves', 'Chop and tremolo at the player’s real level'],
    },
    {
      id: 'opening',
      label: f ? 'Toward an f-hole, a little closer' : 'Toward the sound hole, a little closer',
      band: `Start about 20 cm (8 in) out from the ${f ? 'f-holes' : 'sound hole'}, a little off the picking hand.`,
      kind: 'trial',
      src: 'S-REC',
      quote: '8 inches from sound hole',
      bandProv: { kind: 'trial', src: 'S-REC', note: 'the recording guide lists the mandolin under its guitar rows; drawn 18–23 cm' },
      surface: 'hole',
      distance: { min: 180, max: 230 },
      radial: { max: 90, prov: ill('near the opening: within 9 cm of its line') },
      aimAtR: { r: 100, prov: ill('aimed toward the opening') },
      micTypeIds: STAND,
      start: { d: 205, dx: 15 },
      tendency: 'A different body resonance and more projection. Straight into the opening and very close, it can favour one resonance and sound uneven or boomy — treat it as an audition.',
      checks: ['The picking hand and its arc', 'Boom or unevenness from note to note', 'Compare with the neck junction at matched levels'],
    },
    {
      id: 'clip',
      label: 'Clipped on, between the neck joint and the opening',
      band: 'Start with the mini mic about 3–9 cm (1–3.5 in) over the top, between where the neck meets the body and the opening, aimed at the top.',
      kind: 'sourced',
      src: 'DPA-MANDO',
      quote: 'VC4099… body depth between 35 mm (1.4 in) and 55 mm (2.1 in)',
      bandProv: ill('no source gives a height: 3–9 cm over the top is the lab’s drawing of a clip-held capsule'),
      surface: 'top',
      distance: { min: 30, max: 90 },
      aimMax: { deg: 55, prov: ill('aimed at the top: within 55° of straight onto it') },
      micTypeIds: ['clipCond'],
      boxG: { min: { x: clipX0, y: -40, z: 30 }, max: { x: clipX1, y: 40, z: 90 }, prov: ill('between the neck joint and the opening, over the strings: the lab’s drawing') },
      start: { dx: (clipX0 + clipX1) / 2, d: 60, aimAt: { x: (clipX0 + clipX1) / 2 - 20, y: 0, z: 0 } },
      tendency: 'Isolation and mobility: it moves with the mandolin. Expect a local colour, and listen for handling and contact noise.',
      checks: ['A clip made for this body depth, with the owner’s OK — never on the scroll, the bridge or an f-hole’s edge', 'The picking hand', 'The cable, strain-relieved'],
    },
  ];
}
