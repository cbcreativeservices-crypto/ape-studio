/**
 * A06 FLUTE — the recommended starting points (charter §2 layer 1). Source
 * keys point into docs/labs/miking/flute/SOURCES.md (the EDGE-TONE family's
 * keys); corrections A6-01 … (CORRECTIONS_LOG).
 *
 *   close    5–10 cm from the flute, aimed halfway between the embouchure and
 *            the left hand, off the air jet (DPA-FLUTE; Shure's "a few
 *            inches … between mouthpiece and first set of finger holes" —
 *            both CONFIRMED);
 *   behind   behind and slightly above the head, aimed at the finger holes
 *            (DPA-FLUTE, S-REC — CONFIRMED; "a few inches" drawn 8–22 cm
 *            from the head's surface);
 *   front    in front at about head height, 0.6–1.2 m (DPA "about a meter",
 *            MDAT 2–4 ft — CONFIRMED / ADD);
 *   clip     a miniature strapped round the foot end, aimed back at the keys
 *            (DPA-FLUTE U-CLIP, CONFIRMED) — keyed flutes only: never over a
 *            simple-system flute's open finger holes (L11, L28);
 *   headset  a headset capsule beside the lips (DPA-FLUTE, CONFIRMED).
 * Every start is found once at load, clear of every solid in every design.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneSection } from '../shared/bowed/bowedModel.ts';
import { keySidePoint } from '../shared/woodwinds/windModel.ts';
import { A, BEHIND_DIR, FLUTE_MODEL, FORWARD, HEADSET_DIR, LAYOUTS, N_KEYS, TOWARD_HEAD } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ALL = ['metal', 'wooden', 'simple'] as const;
const KEYED = ['metal', 'wooden'] as const;
const draws = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number) => ({ side: zoneSection('side', target, axis, cone, r0, r1), top: zoneSection('top', target, axis, cone, r0, r1) });
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<MicPose>, vs: readonly string[] = ALL): DocumentedZone => ({ ...z, start: firstClear(FLUTE_MODEL, z, vs, gen, MIC_TYPES) } as DocumentedZone);
const HEAD_H = { min: -420, max: 230 };

const CLOSE_Z: Omit<DocumentedZone, 'start'> = {
  id: 'fl.close',
  label: 'Close, between the lip plate and the left hand',
  band: 'Try about 5–10 cm (2–4 in) from the flute, aimed halfway between the lip plate and the left hand — angled so the capsule is not in the air jet.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'Approx. 5-10 cm away from the instrument, aim the mic halfway between the mouthpiece and the left hand. Breathing can be a problem in this position, so an omni … may be an advantage',
  refSurface: 'between',
  side: 'outside',
  distance: { min: 50, max: 100 },
  cone: { min: 0, max: 65, toward: FORWARD, prov: ill('above and in front of the flute, on the audience side: within 65° of the key side') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the flute between the lip plate and the left hand: within 30°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.between, N_KEYS, 65, 50, 100),
  tendency: 'Detail and separation: the tone, the attack and some air. Close to the mouth, breath and wind can take over — move a few centimetres and recheck low and high passages; an omni can be less sensitive to wind here.',
  checks: ['The capsule outside the air jet, not blowing into it', 'The head’s turn and the flute’s swing clear of the mic', 'Breath, lips and key clicks against the tone'],
};

const BEHIND_Z: Omit<DocumentedZone, 'start'> = {
  id: 'fl.behind',
  label: 'Behind and slightly above the head',
  band: 'Try a mic a few inches behind and a little above the player’s head (about 8–22 cm from it), aimed past the head at the finger holes.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'spot-miked behind and slightly above the head of the player, pointing at the finger holes … a myriad of places around the head yield very good balance (S-REC: "A few inches behind player’s head, aiming at finger holes — Natural — Reduces breath noise.")',
  bandProv: ill('"a few inches behind": 190–330 mm from the head’s centre (about 8–22 cm from it) is the lab’s drawing'),
  refSurface: 'head',
  side: 'outside',
  distance: { min: 190, max: 330 },
  cone: { min: 0, max: 35, prov: ill('behind and slightly above: within 35° of a line back and up from the head') },
  aimAt: { surface: 'holes', r: 200, prov: ill('aimed at the finger holes: the mic’s axis meets the holes’ plane within 20 cm of them') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.head, BEHIND_DIR, 35, 190, 330),
  tendency: 'A natural balance with less breath — the air jet blows away from the mic. Watch the head’s movement and how much of the neighbours it hears.',
  checks: ['The boom and stand clear of a turning head and the flute’s swing', 'Balance as the player moves their head', 'Spill from neighbours behind the player'],
};

const FRONT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'fl.front',
  label: 'In front, at about head height',
  band: 'In a good room: try about 0.6–1.2 m (2–4 ft) in front, at about head height, aimed between the lip plate and the left hand.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'miking the flute from the front with a vertical elevation at head level and about a meter away. This noticeably reduces mechanical sounds. (MDAT: Place the microphone 2-4 feet in front of the flute. Aim the microphone in between the lip plate and the left hand … Never mic at the end of the flute.)',
  bandProv: ill('"about a meter" and MDAT’s 2–4 ft: 600–1200 mm; "head level": a band 42 cm above to 23 cm below the flute'),
  refSurface: 'front',
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 0, max: 35, prov: ill('in front: within 35° of the audience’s direction') },
  box: { min: { x: -1500, y: HEAD_H.min, z: 0 }, max: { x: 900, y: HEAD_H.max, z: 2000 }, prov: ill('about head height (the lab’s band)') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the flute: within 30°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.mid, FORWARD, 35, 600, 1200),
  tendency: 'More of the whole flute and the room, with the key clicks and breath gusts falling back. More room and spill, and level changes as the player moves — a studio choice when the room is good.',
  checks: ['The room and the spill at this distance', 'Level changes as the player turns', 'Not the default for a loud stage'],
};

const CLIP_Z: Omit<DocumentedZone, 'start'> = {
  id: 'fl.clip',
  label: 'Miniature on a clip round the foot end',
  band: 'On a keyed flute only: a strap round the foot end, the capsule about 3–11 cm out, pointed back along the flute toward the keys.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'The U-CLIP’s … strap can easily be fixed around the flute end. Point it towards the keys',
  bandProv: ill('no distance is given: 3–11 cm from the foot’s keys is the lab’s drawing'),
  refSurface: 'foot',
  side: 'outside',
  distance: { min: 30, max: 110 },
  cone: { min: 0, max: 75, prov: ill('on the key side of the foot (the lab’s drawing)') },
  aim: { maxOffAxis: 45, dir: TOWARD_HEAD, prov: ill('aimed back along the flute, toward the keys: within 45°') },
  requires: { micTypeIds: ['wwMini'], variants: [...KEYED] },
  draw: draws(A.foot, N_KEYS, 75, 30, 110),
  tendency: 'A steady close sound that moves with the flute — useful for a moving player. It can favour the holes and the keys over the embouchure: test the whole register.',
  checks: ['A clip made for this flute, with the player’s agreement', 'Nothing over a hole, a key, a rod, a pad or a joint', 'The cable relieved, clear of the right hand'],
};

const HEADSET_Z: Omit<DocumentedZone, 'start'> = {
  id: 'fl.headset',
  label: 'A headset capsule beside the lips',
  band: 'A headset the player wears: the capsule about 4–9 cm from the embouchure hole, beside the lips on the left, out of the air jet.',
  kind: 'sourced',
  src: 'DPA-FLUTE',
  quote: 'The headset gives a fixed position',
  bandProv: ill('no distance is given: 40–95 mm from the embouchure hole, on the left of the lips, is the lab’s drawing'),
  refSurface: 'emb',
  side: 'outside',
  distance: { min: 40, max: 95 },
  cone: { min: 0, max: 45, prov: ill('beside the lips on the left, forward (the lab’s drawing)') },
  aim: { maxOffAxis: 40, prov: ill('aimed at the embouchure hole: within 40°') },
  requires: { micTypeIds: ['wwHeadset'] },
  draw: draws(A.emb, HEADSET_DIR, 45, 40, 95),
  tendency: 'A fixed view that follows the head — it favours the embouchure: more air and attack, less of the holes. Test feedback and the whole register.',
  checks: ['The capsule out of the air jet', 'A headset the player agrees to wear', 'Feedback with the monitors at show level'],
};

const L = LAYOUTS.metal;
export const FLUTE_ZONES: DocumentedZone[] = [
  start(CLOSE_Z, around(A.between, N_KEYS, [75, 70, 80, 65, 85, 60, 90, 55, 95], 60, A.between, FORWARD)),
  start(BEHIND_Z, around(A.head, BEHIND_DIR, [260, 240, 280, 220, 300, 210, 320], 30, A.holes, { x: -1, y: 0, z: 0 })),
  start(FRONT_Z, around(A.mid, FORWARD, [850, 750, 950, 700, 1050, 650, 1150], 30, A.between, { x: 0, y: -1, z: 0 })),
  start(CLIP_Z, around(A.foot, N_KEYS, [60, 70, 50, 80, 45, 90, 100], 60, keySidePoint(L, 350), TOWARD_HEAD), KEYED),
  start(HEADSET_Z, around(A.emb, HEADSET_DIR, [65, 60, 70, 55, 75, 50, 80, 85], 40, A.emb, FORWARD)),
];
