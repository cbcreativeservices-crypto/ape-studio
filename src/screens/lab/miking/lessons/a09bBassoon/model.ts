/**
 * A09b BASSOON — the suggested starting points (charter §2 layer 1). Source
 * keys point into docs/labs/miking/bassoon/SOURCES.md and the reed family's
 * keys in soprano_clarinet/SOURCES.md §0; corrections A9B-01 … (CORRECTIONS_LOG).
 *
 *   dpa    facing the keys a third of the way DOWN from the bell, 15–20 cm
 *          (DPA-BSN's template, CONFIRMED in meaning — family §0.1);
 *   foot   about a foot from the sound holes (S-REC, CONFIRMED);
 *   side   3–4 ft on the player's right, aimed 45° down at the keys (MDAT, ADD);
 *   bell   a higher view toward the bell (the lesson's comparison; MDAT "add
 *          more microphones … at the top by the bell"): 12–30 cm, a drawing
 *          default;
 *   clip   a miniature on the bell joint, pointing DOWN toward the keys
 *          (DPA-BSN, CONFIRMED).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneSection } from '../shared/bowed/bowedModel.ts';
import { keySidePoint } from '../shared/woodwinds/windModel.ts';
import { A, BASSOON_MODEL, BELL_AXIS, DOWN_INSTRUMENT, FORWARD, N_HOLES, N_THIRD, SEATED, SIDE_DIR } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const VARIANTS = ['seated', 'standing'] as const;
const draws = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number) => ({ side: zoneSection('side', target, axis, cone, r0, r1), top: zoneSection('top', target, axis, cone, r0, r1) });
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<MicPose>): DocumentedZone => ({ ...z, start: firstClear(BASSOON_MODEL, z, VARIANTS, gen, MIC_TYPES) } as DocumentedZone);

const DPA_Z: Omit<DocumentedZone, 'start'> = {
  id: 'bsn.dpa',
  label: 'Facing the keys, a third of the way down from the bell',
  band: 'Try about 15–20 cm (6–8 in) from the long joint, one third of the way down from the bell, aimed at the keys — so the holes and some bell are heard.',
  kind: 'sourced',
  src: 'DPA-BSN',
  quote: 'Aim the mic at the fingering holes, a third of the length up from the bell, at a distance of 15-20 cm.',
  bandProv: ill('DPA writes "up from the bell" on all three pages; on a bassoon (bell at the top) the point one third along the instrument from the bell lies BELOW it — the lesson’s "down" (soprano_clarinet/SOURCES.md §0.1)'),
  refSurface: 'third',
  side: 'outside',
  distance: { min: 150, max: 200 },
  cone: { min: 0, max: 40, prov: ill('facing the keys: within 40° of the key side’s outward line') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the keys: within 30°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.third, N_THIRD, 40, 150, 200),
  tendency: 'A focused spot: the open holes below and some of the bell above, with key action present. Compare the very lowest note with middle and high passages.',
  checks: ['The bell beside the head, the hands and the pivot stay clear of the mic and boom', 'The lowest note against middle and high passages', 'Key action at this distance'],
};

const FOOT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'bsn.foot',
  label: 'About a foot from the sound holes',
  band: 'For a balanced sound: try about 25–35 cm (about a foot) in front of the finger holes on the boot, facing them.',
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
  draw: draws(A.holes, N_HOLES, 45, 250, 350),
  tendency: 'A balanced bassoon: the holes up close, the bell from farther off, with more room than the close spot. Check the lowest note.',
  checks: ['The stand clear of the seat strap, the knees and the right hand', 'The lowest note: is the bell still heard?', 'Room and neighbours at this distance'],
};

const SIDE_Z: Omit<DocumentedZone, 'start'> = {
  id: 'bsn.side',
  label: 'On the player’s right, 45° down at the keys',
  band: 'For a room-friendly view: try about 0.9–1.2 m (3–4 ft) away on the player’s right side, up high, aimed about 45° down at the keys.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'Bassoon — Place the microphone 3-4 feet away on the player’s right side. Aim the microphone 45 degrees down at the keys. You can add more microphones if needed such as at the top by the bell.',
  bandProv: ill('3–4 ft converted: 914–1219 mm, drawn 900–1220; "45 degrees down" drawn as within 30° of a line 45° up and out on the right'),
  refSurface: 'keys',
  side: 'outside',
  distance: { min: 900, max: 1220 },
  cone: { min: 0, max: 30, prov: ill('up and out on the player’s right: within 30° of that line') },
  aim: { maxOffAxis: 25, prov: ill('aimed at the keys: within 25°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.holes, SIDE_DIR, 30, 900, 1220),
  tendency: 'The whole bassoon from its right side, the holes and the bell blending, with the room. Farther from the keys’ clicks; more of the neighbours.',
  checks: ['The stand clear of the aisle and the next chair', 'The bell’s lowest note from this side', 'How much of the neighbours it hears'],
};

const BELL_Z: Omit<DocumentedZone, 'start'> = {
  id: 'bsn.bell',
  label: 'Higher, toward the bell',
  band: 'To compare: try a mic about 12–30 cm from the bell’s top, aimed at it — then play the whole range, not only the lowest note.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'You can add more microphones if needed such as at the top by the bell.',
  bandProv: ill('no distance is given: 12–30 cm from the bell’s rim is the lab’s drawing (the lesson’s "higher bell-facing view")'),
  refSurface: 'bell',
  side: 'outside',
  distance: { min: 120, max: 300 },
  cone: { min: 0, max: 45, prov: ill('above the bell: within 45° of its axis') },
  aim: { maxOffAxis: 35, prov: ill('aimed at the bell: within 35°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.bell, BELL_AXIS, 45, 120, 300),
  tendency: 'More of the very lowest note — every hole closed, it leaves from here — and less of the open holes. A comparison or a second mic, not a whole-bassoon view on its own.',
  checks: ['The lowest note against everything above it', 'The bell’s movement as the player breathes', 'The stand and boom clear of the player’s head'],
};

const CLIP_Z: Omit<DocumentedZone, 'start'> = {
  id: 'bsn.clip',
  label: 'Miniature on the bell joint, aimed down at the keys',
  band: 'On a strap round the bell joint, bring the capsule about 3–13 cm out and aim it DOWN the instrument toward the keys — not into the bell. With a longer gooseneck, look farther down toward the wing joint’s keys.',
  kind: 'sourced',
  src: 'DPA-BSN',
  quote: 'fixed around the bassoon at the top, close to the bell, but not necessarily pointed into the bell! Point it downward, toward the keys (DPA-MOUNT: … the 4099U bassoon … point it towards the upper joint)',
  bandProv: ill('no distance is given: 3–13 cm from the bell joint is the lab’s drawing'),
  refSurface: 'clip',
  side: 'outside',
  distance: { min: 30, max: 130 },
  cone: { min: 0, max: 75, prov: ill('on the key side of the bell joint') },
  aim: { maxOffAxis: 45, dir: DOWN_INSTRUMENT, prov: ill('aimed down the instrument, toward the keys: within 45°') },
  requires: { micTypeIds: ['wwMini'] },
  draw: draws(A.clip, N_THIRD, 75, 30, 130),
  tendency: 'A steady close sound that moves with the bassoon — isolation for a loud stage. It can overstate some keys and miss the bell’s lowest note; aimed farther down the instrument, the range tends to even out.',
  checks: ['A clip made for this bassoon, with the player’s agreement — never on the bocal', 'Nothing over an open hole, a rod, a pad or a joint', 'The cable clear of the hands and the seat strap'],
};

const DOWN_KEYS: Vec3 = keySidePoint(SEATED, 2100);
export const BASSOON_ZONES: DocumentedZone[] = [
  start(DPA_Z, around(A.third, N_THIRD, [175, 165, 185, 158, 192], 36, A.third, FORWARD)),
  start(FOOT_Z, around(A.holes, N_HOLES, [300, 280, 320, 260, 340], 40, A.holes, FORWARD)),
  start(SIDE_Z, around(A.holes, SIDE_DIR, [1050, 1000, 1100, 950, 1150], 24, A.holes, FORWARD)),
  start(BELL_Z, around(A.bell, BELL_AXIS, [200, 180, 220, 160, 250, 140, 280], 40, A.bell, FORWARD)),
  start(CLIP_Z, around(A.clip, N_THIRD, [60, 70, 50, 80, 90, 45, 100, 110], 60, DOWN_KEYS, DOWN_INSTRUMENT)),
];
