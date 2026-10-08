/**
 * A07 PICCOLO — the suggested starting points (charter §2 layer 1). Every
 * distance is the FLUTE's, transferred as the lesson itself says — "a useful
 * comparison, not a piccolo-specific optimum" (L26; piccolo/SOURCES.md:
 * "The above techniques apply to both flutes, recorders, and other variants
 * of the flute family" — DPA-FLUTE). No clip zone: the lesson makes no clip
 * fit claim for the piccolo (L26). Corrections A7-01 … (CORRECTIONS_LOG).
 *
 *   close    5–10 cm, between the lip plate and the left hand, off the jet;
 *   behind   behind and slightly above the head, at the finger holes;
 *   front    0.6–1.2 m in front at about head height (a good room);
 *   headset  a headset capsule beside the lips (a moving player).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneSection } from '../shared/bowed/bowedModel.ts';
import { A, BEHIND_DIR, FORWARD, HEADSET_DIR, N_KEYS, PICCOLO_MODEL } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const VARIANTS = ['standing', 'seated'] as const;
const draws = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number) => ({ side: zoneSection('side', target, axis, cone, r0, r1), top: zoneSection('top', target, axis, cone, r0, r1) });
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<MicPose>): DocumentedZone => ({ ...z, start: firstClear(PICCOLO_MODEL, z, VARIANTS, gen, MIC_TYPES) } as DocumentedZone);
const TRANSFER = 'the flute’s figure, transferred — not a piccolo-specific optimum (L26)';

const CLOSE_Z: Omit<DocumentedZone, 'start'> = {
  id: 'pc.close',
  label: 'Close, between the lip plate and the left hand',
  band: 'Try about 5–10 cm (2–4 in) from the piccolo, aimed between the lip plate and the first keys — the flute’s starting point, a comparison to begin with — angled out of the air jet.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'Approx. 5-10 cm away from the instrument, aim the mic halfway between the mouthpiece and the left hand … The above techniques apply to both flutes, recorders, and other variants of the flute family.',
  bandProv: ill(TRANSFER),
  refSurface: 'between',
  side: 'outside',
  distance: { min: 50, max: 100 },
  cone: { min: 0, max: 65, toward: FORWARD, prov: ill('above and in front, on the audience side: within 65° of the key side') },
  aim: { maxOffAxis: 30, prov: ill('aimed between the lip plate and the first keys: within 30°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.between, N_KEYS, 65, 50, 100),
  tendency: 'Isolation and detail — and more breath and key action than you hear a few feet away. Vary the distance and angle while the player runs low to high.',
  checks: ['The capsule out of the air jet', 'Harshness: compare a neutral angle at matched level', 'The head’s turn and the piccolo clear of the mic'],
};

const BEHIND_Z: Omit<DocumentedZone, 'start'> = {
  id: 'pc.behind',
  label: 'Behind and slightly above the head',
  band: 'Try a mic a few inches behind and a little above the player’s head (about 8–22 cm from it), aimed past the head at the finger holes.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'spot-miked behind and slightly above the head of the player, pointing at the finger holes',
  bandProv: ill(`${TRANSFER}; "a few inches" drawn 190–330 mm from the head’s centre`),
  refSurface: 'head',
  side: 'outside',
  distance: { min: 190, max: 330 },
  cone: { min: 0, max: 35, prov: ill('behind and slightly above: within 35°') },
  aimAt: { surface: 'holes', r: 160, prov: ill('aimed at the finger holes: the mic’s axis meets their plane within 16 cm of them') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.head, BEHIND_DIR, 35, 190, 330),
  tendency: 'Less of the direct air jet and another balance. Check the mic’s real pattern, the head’s movement and the neighbours.',
  checks: ['The boom clear of a turning head', 'Balance as the player moves', 'Spill from the flutes beside'],
};

const FRONT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'pc.front',
  label: 'In front, at about head height',
  band: 'In a good room: try about 0.6–1.2 m (2–4 ft) in front, at about head height — the flute’s farther view. Not the default for a loud stage.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'miking the flute from the front with a vertical elevation at head level and about a meter away. This noticeably reduces mechanical sounds.',
  bandProv: ill(`${TRANSFER}; 600–1200 mm, head height drawn as a band`),
  refSurface: 'front',
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 0, max: 35, prov: ill('in front: within 35° of the audience’s direction') },
  box: { min: { x: -1500, y: -420, z: 0 }, max: { x: 900, y: 230, z: 2000 }, prov: ill('about head height (the lab’s band)') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the piccolo: within 30°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.mid, FORWARD, 35, 600, 1200),
  tendency: 'Key clicks and breath gusts fall back; more room and ensemble. Less isolation, and position changes become audible.',
  checks: ['The room and the spill', 'Level changes as the player moves', 'Not for a loud stage or a very live room'],
};

const HEADSET_Z: Omit<DocumentedZone, 'start'> = {
  id: 'pc.headset',
  label: 'A headset capsule beside the lips',
  band: 'For a moving player: a properly fitted headset, the capsule about 4–9 cm from the embouchure hole, beside the lips on the left, out of the air jet.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'The headset gives a fixed position',
  bandProv: ill('no distance is given: 40–95 mm from the embouchure hole is the lab’s drawing'),
  refSurface: 'emb',
  side: 'outside',
  distance: { min: 40, max: 95 },
  cone: { min: 0, max: 45, prov: ill('beside the lips on the left (the lab’s drawing)') },
  aim: { maxOffAxis: 40, prov: ill('aimed at the embouchure hole: within 40°') },
  requires: { micTypeIds: ['wwHeadset'] },
  draw: draws(A.emb, HEADSET_DIR, 45, 40, 95),
  tendency: 'Consistency as the player moves — but it favours the head joint: more air and attack. Test the whole register and the feedback margin.',
  checks: ['The capsule out of the air jet', 'A headset the player agrees to wear', 'Feedback and piercing pickup at show level'],
};

export const PICCOLO_ZONES: DocumentedZone[] = [
  start(CLOSE_Z, around(A.between, N_KEYS, [75, 70, 80, 65, 85, 60, 90], 60, A.between, FORWARD)),
  start(BEHIND_Z, around(A.head, BEHIND_DIR, [260, 240, 280, 220, 300, 210, 320], 30, A.holes, { x: -1, y: 0, z: 0 })),
  start(FRONT_Z, around(A.mid, FORWARD, [850, 750, 950, 700, 1050, 650, 1150], 30, A.between, { x: 0, y: -1, z: 0 })),
  start(HEADSET_Z, around(A.emb, HEADSET_DIR, [65, 60, 70, 55, 75, 50, 80, 85], 40, A.emb, FORWARD)),
];
