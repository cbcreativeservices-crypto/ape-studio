/**
 * A08b BASS CLARINET — the recommended starting points (charter §2 layer 1).
 * Source keys point into docs/labs/miking/bass_clarinet/SOURCES.md and the
 * reed family's keys in soprano_clarinet/SOURCES.md §0; corrections A8B-01 …
 *
 *   front  0.6–1.2 m in front, aimed at the middle of the instrument (MDAT,
 *          ADD — replaces the lesson's "no sourced bass-clarinet number");
 *   blend  in front and a little to the side, aimed at the span from the
 *          lower body to the bell (the lesson's inference from DPA-CL's "a
 *          blend of bell and tone hole outputs"; 25–55 cm a drawing default);
 *   bell   closer to the bell, to compare (the lesson's "bell-favoring" view;
 *          15–35 cm a drawing default);
 *   clip   a miniature on the bell's rim, between the bell and the keywork
 *          (DPA-MOUNT's clip "for Saxophones, Bass Clarinet" — the angle a
 *          testable inference, L40).
 * The soprano clarinet's 15–20 cm is NOT transferred (L26). The blend, bell
 * and clip zones exist once per model (the low C model's lower end differs).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneSection } from '../shared/bowed/bowedModel.ts';
import { keySidePoint } from '../shared/woodwinds/windModel.ts';
import { frameAt } from '../shared/woodwinds/windPosture.ts';
import type { BassClarinetModel } from '../shared/woodwinds/windSpec.ts';
import { A, BASS_CLARINET_MODEL, BLEND_DIR, FORWARD, LAYOUTS } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const draws = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number) => ({ side: zoneSection('side', target, axis, cone, r0, r1), top: zoneSection('top', target, axis, cone, r0, r1) });
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<MicPose>, vs: readonly string[]): DocumentedZone => ({ ...z, start: firstClear(BASS_CLARINET_MODEL, z, vs, gen, MIC_TYPES) } as DocumentedZone);

const FRONT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'bcl.front',
  label: 'In front, aimed at the middle',
  band: 'Try about 0.6–1.2 m (2–4 ft) in front, aimed at the middle of the bass clarinet — far enough to hear the whole instrument.',
  kind: 'sourced',
  src: 'MDAT',
  quote: 'Bass Clarinet — Place the microphone 2-4 feet in front of the instrument. Aim the microphone at the center of the instrument … Miking directly at the bell won’t pick up the rest of the notes.',
  bandProv: ill('2–4 ft converted: 610–1220 mm, drawn 600–1200'),
  refSurface: 'front',
  side: 'outside',
  distance: { min: 600, max: 1200 },
  cone: { min: 0, max: 35, prov: ill('in front: within 35° of the audience’s direction') },
  aim: { maxOffAxis: 25, prov: ill('aimed at the middle of the instrument: within 25°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.mid, FORWARD, 35, 600, 1200),
  tendency: 'The whole instrument — the open holes and the upturned bell blending — with some of the room. Move in gradually if the room or the spill asks for it.',
  checks: ['The lowest note of the part, and the low C extension if the model has one', 'Room and spill at this distance', 'The stand clear of the peg, the chair and the feet'],
};

function perModel(m: BassClarinetModel): { blend: Omit<DocumentedZone, 'start'>; bell: Omit<DocumentedZone, 'start'>; clip: Omit<DocumentedZone, 'start'> } {
  const L = LAYOUTS[m];
  const lo = L.spec.pieces.find((p) => p.id === 'lower')!;
  const low = keySidePoint(L, lo.s1 - 40);
  const e = frameAt(L, L.spec.end);
  const blend = scale3(add3(low, e.p), 0.5);
  const sfx = m === 'lowc' ? '.c' : '';
  return {
    blend: {
      id: `bcl.blend${sfx}`,
      label: 'In front, a little to the side, at the lower body and bell',
      band: 'Try about 25–55 cm in front and a little to the side, aimed at the span from the lower body to the bell — not down the bell’s throat. Then move in or out by ear.',
      kind: 'trial',
      src: 'LESSON',
      quote: 'in front of and slightly to the side of the instrument. Aim into the space spanning the lower body and bell rather than directly down the bell throat … a practical inference from DPA’s radiation description, not a published universal distance (L28)',
      bandProv: { kind: 'trial', src: 'DPA-CL', note: 'DPA: "a blend of bell and tone hole outputs"; the 25–55 cm band is the lab’s drawing of "far enough away to hear the composite instrument"' },
      refSurface: `blend.${m}`,
      side: 'outside',
      distance: { min: 250, max: 550 },
      cone: { min: 0, max: 35, prov: ill('in front and a little to the side: within 35°') },
      aim: { maxOffAxis: 30, prov: ill('aimed at the span from the lower body to the bell: within 30°') },
      requires: { micTypeIds: ['sdcCard'], variant: m },
      draw: draws(blend, BLEND_DIR, 35, 250, 550),
      tendency: 'A body-and-bell blend: the open holes and the bell together, more even from low to high than either alone. A place to begin — the lesson’s own inference, checked by ear.',
      checks: ['Low, middle and high phrases at actual dynamics', 'Key noise and the reed at this distance', 'Floor thumps from the peg or the stand'],
    },
    bell: {
      id: `bcl.bell${sfx}`,
      label: 'Closer to the bell, to compare',
      band: 'To compare: about 15–35 cm from the bell, aimed into its mouth from a little off the axis — then play the whole range, not just the low notes.',
      kind: 'trial',
      src: 'LESSON',
      quote: 'Rotate or move toward the bell to assess low-note weight and isolation. Treat the result as one tonal option (L29)',
      bandProv: { kind: 'trial', src: 'MDAT', note: '"Miking directly at the bell won’t pick up the rest of the notes"; 15–35 cm is the lab’s drawing' },
      refSurface: `bell.${m}`,
      side: 'outside',
      distance: { min: 150, max: 350 },
      cone: { min: 0, max: 45, prov: ill('beyond the bell: within 45° of its axis') },
      aim: { maxOffAxis: 35, prov: ill('aimed at the bell: within 35°') },
      requires: { micTypeIds: ['sdcCard'], variant: m },
      draw: draws(e.p, e.t, 45, 150, 350),
      tendency: 'More low-note weight and isolation; the higher passages can thin out. One tonal option — if the low notes jump forward, move toward the keys or back off.',
      checks: ['Low notes against the upper register', 'The bell’s movement and the player’s knees', 'Whether the keys are still heard'],
    },
    clip: {
      id: `bcl.clip${sfx}`,
      label: 'Miniature on the bell’s rim, between bell and keys',
      band: 'On a clip made for this instrument on the bell’s rim, start with the capsule between the bell and the keywork, aimed at the lowest keys — then change the angle while the player plays the whole part.',
      kind: 'sourced',
      src: 'DPA-MOUNT',
      quote: '4099S Clip Microphone for Saxophones, Bass Clarinet (the sax angle between bell and keys is a testable starting inference, L40)',
      bandProv: ill('no distance is given: 6–24 cm from the lowest keys, between them and the bell, is the lab’s drawing'),
      refSurface: `low.${m}`,
      side: 'outside',
      distance: { min: 60, max: 240 },
      cone: { min: 0, max: 80, toward: e.t, prov: ill('between the keys and the bell (the lab’s drawing)') },
      aim: { maxOffAxis: 40, prov: ill('aimed at the lowest keys: within 40°') },
      requires: { micTypeIds: ['wwMini'], variant: m },
      draw: draws(low, frameAt(L, lo.s1 - 40).n, 80, 60, 240),
      tendency: 'A steady close view that moves with the instrument — isolation for a loud stage. Its selective view can exaggerate the bell or one hole region: re-test every register, and the low extension.',
      checks: ['A clip confirmed for this bass clarinet, with the player’s agreement', 'Nothing on a rod, a pad, a tenon or a moving key; it cannot turn into the hands', 'The cable clear of the chair and the peg'],
    },
  };
}
const add3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale3 = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });

function zonesFor(m: BassClarinetModel): DocumentedZone[] {
  const z = perModel(m);
  const L = LAYOUTS[m];
  const lo = L.spec.pieces.find((p) => p.id === 'lower')!;
  const low = keySidePoint(L, lo.s1 - 40);
  const e = frameAt(L, L.spec.end);
  const blend = scale3(add3(low, e.p), 0.5);
  return [
    start(z.blend, around(blend, BLEND_DIR, [400, 350, 450, 300, 500], 30, blend, { x: 0, y: -1, z: 0 }), [m]),
    start(z.bell, around(e.p, e.t, [250, 220, 280, 200, 300, 180, 330], 40, e.p, FORWARD), [m]),
    start(z.clip, around(low, frameAt(L, lo.s1 - 40).n, [120, 100, 140, 160, 90, 180, 200], 70, low, e.t), [m]),
  ];
}

export const BASS_CLARINET_ZONES: DocumentedZone[] = [
  start(FRONT_Z, around(A.mid, FORWARD, [850, 750, 950, 700, 1050, 650, 1150], 30, A.mid, { x: 0, y: -1, z: 0 }), ['eflat', 'lowc']),
  ...zonesFor('eflat'),
  ...zonesFor('lowc'),
];
