/**
 * A08a B♭ CLARINET — the recommended starting points (charter §2 layer 1).
 * Source keys point into docs/labs/miking/soprano_clarinet/SOURCES.md (the
 * reed family's keys in its §0); the geometry is its GEOMETRY_PROPOSAL.md on
 * the shared woodwind family. Corrections A8A-01 … (CORRECTIONS_LOG).
 *
 *   dpa      facing the holes a third of the way up from the bell, 15–20 cm
 *            (DPA-CL, CONFIRMED) — angled so the bell is heard too;
 *   front    0.6–1.2 m in front, aimed at the middle (MDAT 2–4 ft, ADD);
 *   section  between two players at about head height, pointing straight
 *            down (DPA-CL's section spot, CONFIRMED) — an ensemble choice;
 *   clip     a miniature on a strap just above the bell, aimed back up at the
 *            keys, not into the bell (DPA-CL / DPA-MOUNT, CONFIRMED).
 * Every start is found once at load: the first pose (in order of preference)
 * inside the zone and clear of every solid, seated AND standing.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneSection } from '../shared/bowed/bowedModel.ts';
import { keySidePoint } from '../shared/woodwinds/windModel.ts';
import { A, CLARINET_MODEL, FORWARD, N_THIRD, SEATED, UP_INSTRUMENT } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const VARIANTS = ['seated', 'standing'] as const;
const draws = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number) => ({ side: zoneSection('side', target, axis, cone, r0, r1), top: zoneSection('top', target, axis, cone, r0, r1) });
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<MicPose>): DocumentedZone => ({ ...z, start: firstClear(CLARINET_MODEL, z, VARIANTS, gen, MIC_TYPES) } as DocumentedZone);
const rect = (u0: number, u1: number, v0: number, v1: number) => [{ poly: [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] as [number, number][] }];

/** The section spot's box: beside the player toward a neighbour on the
 *  left, at about head height (drawing default). */
const SECTION = { min: { x: 230, y: -260, z: -150 }, max: { x: 560, y: 60, z: 450 } };

const DPA_Z: Omit<DocumentedZone, 'start'> = {
  id: 'cl.dpa',
  label: 'Facing the holes, a third of the way up from the bell',
  band: 'Try about 15–20 cm (6–8 in) from the holes on the lower joint, one third of the way up from the bell, aimed at them so the bell is heard too.',
  kind: 'sourced',
  src: 'DPA-CL',
  quote: 'Aim the mic at the fingering holes, a third of the length up from the bell, at a distance of 15-20 cm.',
  refSurface: 'third',
  side: 'outside',
  distance: { min: 150, max: 200 },
  cone: { min: 0, max: 40, prov: ill('facing the holes: within 40° of the key side’s outward line (the lab’s drawing)') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the holes: within 30° (the lab’s tolerance)') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.third, N_THIRD, 40, 150, 200),
  tendency: 'A balance of the open holes and the bell, with some key and breath detail. Play the low notes, the throat notes and the top register: the colour can change as the open holes move.',
  checks: ['The hands, the keys and the bell’s swing stay clear of the mic and its boom', 'Low, middle and high passages — not one held note', 'Key clicks and breath at this distance'],
};

const FRONT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'cl.front',
  label: 'In front, a little farther back',
  band: 'For a more blended sound: try about 0.6–1.2 m (2–4 ft) in front, aimed at the middle of the clarinet — in a room that sounds good.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'Clarinet/Oboe — Place the microphone 2-4 feet in front of the instrument. Aim the microphone at the center of the instrument … Miking directly at the bell won’t pick up the rest of the notes.',
  bandProv: ill('2–4 ft converted: 610–1220 mm, drawn 600–1200'),
  refSurface: 'front',
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 0, max: 35, prov: ill('in front: within 35° of the audience’s direction') },
  aim: { maxOffAxis: 25, prov: ill('aimed at the middle of the clarinet: within 25°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.mid, FORWARD, 35, 600, 1200),
  tendency: 'The whole clarinet blended — holes, bell and some of the room. More of the room and the neighbours come with it; the player’s movement matters less.',
  checks: ['How much room and how many neighbours it hears', 'Quiet passages against the noise floor', 'The stand’s base clear of the feet and the aisle'],
};

const SECTION_Z: Omit<DocumentedZone, 'start'> = {
  id: 'cl.section',
  label: 'Above, between two players, pointing down',
  band: 'For a section: at about head height, between this player and the next, pointing straight down at the floor — a floor that is not carpeted.',
  kind: 'sourced',
  src: 'DPA-CL',
  quote: 'Place the microphone between the two instruments, at about head height, and pointing straight down at the floor, which should not be carpeted.',
  bandProv: ill('"between the two instruments, at about head height": a 33 × 32 × 60 cm box beside the player (drawing default)'),
  refSurface: 'mid',
  side: 'outside',
  distance: { min: 300, max: 1000 },
  box: { ...SECTION, prov: ill('beside the player toward the next chair, about head height (drawing default)') },
  aim: { maxOffAxis: 20, dir: { x: 0, y: 1, z: 0 }, prov: ill('pointing straight down: within 20°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: { side: rect(SECTION.min.x, SECTION.max.x, SECTION.min.y, SECTION.max.y), top: rect(SECTION.min.x, SECTION.max.x, SECTION.min.z, SECTION.max.z) },
  tendency: 'Two players together, with the sound that comes off a hard floor. An ensemble choice: the main pickup first — this is not a close position for one clarinet.',
  checks: ['A hard floor under the pair (carpet changes the reflection)', 'Both players’ sightlines to the conductor and the music', 'The balance of the two players by ear'],
};

const CLIP_Z: Omit<DocumentedZone, 'start'> = {
  id: 'cl.clip',
  label: 'Miniature on a clip above the bell, aimed at the keys',
  band: 'On a strap just above the bell, bring the capsule about 3–13 cm out and aim it back up at the keys — not into the bell. With a longer gooseneck, look back toward the upper joint.',
  kind: 'sourced',
  src: 'DPA-CL',
  quote: 'fixed around the clarinet at the top, close to the bell, but not necessarily pointed into the bell! Point it toward the keys instead (DPA-MOUNT: extend the gooseneck … point it towards the upper joint)',
  bandProv: ill('no distance is given: 3–13 cm from the top of the bell is the lab’s drawing'),
  refSurface: 'joint',
  side: 'outside',
  distance: { min: 30, max: 130 },
  cone: { min: 0, max: 75, prov: ill('on the key side of the bell joint (the lab’s drawing)') },
  aim: { maxOffAxis: 45, dir: UP_INSTRUMENT, prov: ill('aimed back up the instrument, toward the keys: within 45°') },
  requires: { micTypeIds: ['wwMini'] },
  draw: draws(A.joint, N_THIRD, 75, 30, 130),
  tendency: 'A steady close sound that moves with the clarinet — good isolation on a loud stage. Very close, its narrow view can make some notes stand out: aimed farther up toward the upper joint, the range tends to even out.',
  checks: ['A clip made for this clarinet, with the player’s agreement', 'Nothing on a ring key, a rod, a pad or across a joint', 'The cable clear of the fingers; phantom power through its adapter'],
};

const UP_KEYS: Vec3 = keySidePoint(SEATED, 380);
export const CLARINET_ZONES: DocumentedZone[] = [
  start(DPA_Z, around(A.third, N_THIRD, [175, 165, 185, 158, 192], 36, A.third, FORWARD)),
  start(FRONT_Z, around(A.mid, FORWARD, [850, 750, 950, 700, 1050, 650, 1150], 30, A.mid, { x: 0, y: -1, z: 0 })),
  start(SECTION_Z, sectionPoses()),
  start(CLIP_Z, around(A.joint, N_THIRD, [60, 70, 50, 80, 90, 45, 100, 110], 60, UP_KEYS, UP_INSTRUMENT)),
];

function* sectionPoses(): Generator<MicPose> {
  for (const x of [400, 360, 440, 320, 480, 280, 520])
    for (const z of [150, 100, 200, 50, 250, 300, 0])
      for (const y of [-120, -80, -160, -40, -200]) yield { p: { x, y, z }, az: 0, el: -90 };
}
