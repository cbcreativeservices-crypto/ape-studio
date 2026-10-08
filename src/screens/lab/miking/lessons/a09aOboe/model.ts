/**
 * A09a OBOE — the suggested starting points (charter §2 layer 1). Source
 * keys point into docs/labs/miking/oboe/SOURCES.md and the reed family's
 * keys in soprano_clarinet/SOURCES.md §0; corrections A9A-01 … (CORRECTIONS_LOG).
 *
 *   dpa    facing the holes a third of the way up from the bell, 15–20 cm
 *          (DPA-OB "1/3 of the length up from the bell", CONFIRMED);
 *   foot   about a foot from the sound holes, for a balanced sound (S-REC,
 *          CONFIRMED);
 *   bell   a few inches from the bell, bright and isolated (S-REC/S-LIVE,
 *          CONFIRMED words; the 5–11 cm band is a drawing default);
 *   front  0.6–1.2 m in front, aimed at the middle (MDAT, ADD);
 *   clip   a miniature on a strap just above the bell, aimed back up at the
 *          keys (DPA-OB / DPA-MOUNT, CONFIRMED).
 * Every start is found once at load, clear of every solid, seated AND standing.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneSection } from '../shared/bowed/bowedModel.ts';
import { keySidePoint } from '../shared/woodwinds/windModel.ts';
import { A, BELL_AXIS, FORWARD, N, OBOE_MODEL, SEATED, UP_INSTRUMENT } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const VARIANTS = ['seated', 'standing'] as const;
const draws = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number) => ({ side: zoneSection('side', target, axis, cone, r0, r1), top: zoneSection('top', target, axis, cone, r0, r1) });
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<MicPose>): DocumentedZone => ({ ...z, start: firstClear(OBOE_MODEL, z, VARIANTS, gen, MIC_TYPES) } as DocumentedZone);

const DPA_Z: Omit<DocumentedZone, 'start'> = {
  id: 'ob.dpa',
  label: 'Facing the holes, a third of the way up from the bell',
  band: 'Try about 15–20 cm (6–8 in) from the holes on the lower joint, one third of the way up from the bell, aimed at them.',
  kind: 'sourced',
  src: 'DPA-OB',
  quote: 'Aim the mic at the fingering holes, 1/3 of the length up from the bell, at a distance of 15-20 cm.',
  refSurface: 'third',
  side: 'outside',
  distance: { min: 150, max: 200 },
  cone: { min: 0, max: 40, prov: ill('facing the holes: within 40° of the key side’s outward line') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the holes: within 30°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.third, N, 40, 150, 200),
  tendency: 'A natural spot sound: the holes and some bell together, the reed’s edge and the keys present but not leading. Play low, middle and high — the colour can change as the open holes move.',
  checks: ['The hands, the keys and the oboe’s pivot stay clear of the mic and boom', 'Low, middle and high passages — not one held note', 'Key clicks and reed edge at this distance'],
};

const FOOT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'ob.foot',
  label: 'About a foot from the sound holes',
  band: 'For a balanced sound: try about 25–35 cm (about a foot) from the tone holes, facing them.',
  kind: 'sourced',
  src: 'S-REC',
  quote: 'Oboe, Bassoon, Etc.: About 1 foot from sound holes — Natural — Provides well-balanced sound.',
  bandProv: ill('"about 1 foot" (304.8 mm): drawn 250–350'),
  refSurface: 'holes',
  side: 'outside',
  distance: { min: 250, max: 350 },
  cone: { min: 0, max: 45, prov: ill('facing the holes: within 45°') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the holes: within 30°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.holes, N, 45, 250, 350),
  tendency: 'A little more blend than the close spot — holes, bell and reed together — with more of the room and the neighbours.',
  checks: ['The room and the neighbours at this distance', 'Quiet passages against the noise floor', 'The stand’s base clear of the feet'],
};

const BELL_Z: Omit<DocumentedZone, 'start'> = {
  id: 'ob.bell',
  label: 'A few inches from the bell',
  band: 'For a bright, isolated live sound: try a few centimetres from the bell (about 5–11 cm), a little off its axis — and play the whole range.',
  kind: 'sourced',
  src: 'S-REC',
  quote: 'A few inches from bell — Bright — Minimizes feedback and leakage.',
  bandProv: ill('"a few inches" has no number: 50–110 mm from the bell’s rim is the lab’s drawing'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 50, max: 110 },
  cone: { min: 0, max: 60, prov: ill('beyond the bell: within 60° of its axis') },
  aim: { maxOffAxis: 40, prov: ill('aimed at the bell, slightly off its axis allowed: within 40°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.bell, BELL_AXIS, 60, 50, 110),
  tendency: 'Bright and isolated — less of the stage and the monitors. The lowest notes leave mainly from here, so the balance can tilt toward them and away from the open holes: compare it with a view of the holes.',
  checks: ['The bell’s movement as the player breathes and phrases', 'Low notes against the rest of the range', 'Brightness: compare a hole-facing view at matched level'],
};

const FRONT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'ob.front',
  label: 'In front, a little farther back',
  band: 'For a more blended sound: try about 0.6–1.2 m (2–4 ft) in front, aimed at the middle of the oboe — in a room that sounds good.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'Clarinet/Oboe — Place the microphone 2-4 feet in front of the instrument. Aim the microphone at the center of the instrument',
  bandProv: ill('2–4 ft converted: 610–1220 mm, drawn 600–1200'),
  refSurface: 'front',
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 0, max: 35, prov: ill('in front: within 35° of the audience’s direction') },
  aim: { maxOffAxis: 25, prov: ill('aimed at the middle of the oboe: within 25°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.mid, FORWARD, 35, 600, 1200),
  tendency: 'The whole oboe blended with the room — reed, holes and bell together, the keys falling back. More of the room and the neighbours come with it.',
  checks: ['How much room and how many neighbours it hears', 'Quiet passages against the noise floor', 'The stand clear of the player’s sightline'],
};

const CLIP_Z: Omit<DocumentedZone, 'start'> = {
  id: 'ob.clip',
  label: 'Miniature on a clip above the bell, aimed at the keys',
  band: 'On a strap just above the bell, bring the capsule about 3–13 cm out and aim it back up at the keys — not into the bell. With a longer gooseneck, look back toward the upper joint.',
  kind: 'sourced',
  src: 'DPA-OB',
  quote: 'fixed around the oboe at the top, close to the bell, but not necessarily pointed into the bell! Point it toward the keys instead (DPA-MOUNT: extend the gooseneck … point it towards the upper joint)',
  bandProv: ill('no distance is given: 3–13 cm from the top of the bell is the lab’s drawing'),
  refSurface: 'joint',
  side: 'outside',
  distance: { min: 30, max: 130 },
  cone: { min: 0, max: 75, prov: ill('on the key side of the bell joint') },
  aim: { maxOffAxis: 45, dir: UP_INSTRUMENT, prov: ill('aimed back up the instrument, toward the keys: within 45°') },
  requires: { micTypeIds: ['wwMini'] },
  draw: draws(A.joint, N, 75, 30, 130),
  tendency: 'A steady close sound that moves with the oboe — isolation for a loud stage. Its narrow view can make some notes stand out; aimed farther up toward the upper joint, the range tends to even out.',
  checks: ['A clip made for this oboe, with the player’s agreement', 'Nothing on the reed, a ring key, a rod, a pad or a joint', 'The cable clear of the fingers; phantom power through its adapter'],
};

const UP_KEYS: Vec3 = keySidePoint(SEATED, 300);
export const OBOE_ZONES: DocumentedZone[] = [
  start(DPA_Z, around(A.third, N, [175, 165, 185, 158, 192], 36, A.third, FORWARD)),
  start(FOOT_Z, around(A.holes, N, [300, 280, 320, 260, 340], 40, A.holes, FORWARD)),
  start(BELL_Z, around(A.bell, BELL_AXIS, [80, 70, 90, 60, 100], 54, A.bell, FORWARD)),
  start(FRONT_Z, around(A.mid, FORWARD, [850, 750, 950, 700, 1050, 650, 1150], 30, A.mid, { x: 0, y: -1, z: 0 })),
  start(CLIP_Z, around(A.joint, N, [60, 70, 50, 80, 90, 45, 100, 110], 60, UP_KEYS, UP_INSTRUMENT)),
];
