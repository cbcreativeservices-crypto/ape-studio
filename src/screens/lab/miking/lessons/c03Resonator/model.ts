/**
 * C03 RESONATOR GUITAR — the technical truth (charter §2 layer 1). Two
 * postures (resonator_dobro/GEOMETRY_PROPOSAL.md): the SQUARE-NECK played
 * lap style, face up (a spider-bridge single cone), and the ROUND-NECK played
 * upright like a guitar (a biscuit-bridge single cone). The body is the steel
 * dreadnought outline (TRIAL: resonator bodies are not sourced); the 9.5 in
 * cone is sourced (NAT-TECH, BEARD); the coverplate, ports and posture are
 * drawing defaults.
 *
 * Starting points: the lesson's 20–45 cm teaching trial facing the
 * coverplate / upper body from a little off the picking path (no published
 * resonator distance — the app says "a place to begin"); a closer view at
 * about 20 cm (8 in), Shure's guitar row that its guide groups the resonator
 * with (TRIAL: the hole read as the cone's centre, correction RS-02); and a
 * clip on the body's edge with the capsule toward the coverplate's edge, not
 * the cone. The lesson's "Dobro" is a maker's name: the app says
 * "square-neck resonator" (RS-04).
 */
import type { Provenance } from '../../engine/model/types.ts';
import { RESO_ROUND, RESO_SINGLE } from '../shared/guitars/guitarSpec.ts';
import type { GVariant, GuitarScene, ZoneSpec } from '../shared/guitars/guitarModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const C03_VARIANTS: GVariant[] = [
  { id: 'lap', label: 'SQUARE NECK', blurb: 'A square-neck resonator played lap style: face up across the player’s lap, the strings stopped with a steel bar. A single cone under a perforated coverplate.', phrase: 'a square-neck resonator played lap style', spec: RESO_SINGLE, posture: 'lap' },
  { id: 'round', label: 'ROUND NECK', blurb: 'A round-neck resonator played upright like a guitar, fretted or with a slide. A single cone under the coverplate.', phrase: 'a round-neck resonator played upright', spec: RESO_ROUND, posture: 'seated' },
];

const STAND = ['sdcCard', 'instDynCard'];

export function c03ZoneSpecs(sc: GuitarScene): ZoneSpec[] {
  const lap = sc.o.lap;
  // Lap style: the mic comes in from the audience side (a boom from the side),
  // so it stands off toward the treble edge (+y) and looks down and in.
  const off = lap ? 200 : 60;
  const radial = lap ? 260 : 140;
  return [
    {
      id: 'close',
      label: 'Closer, facing the cone region',
      band: 'Start about 20 cm (8 in) out from the middle of the coverplate, a little off the picking hand.',
      kind: 'trial',
      src: 'S-REC',
      quote: '8 inches from sound hole',
      bandProv: { kind: 'trial', src: 'S-REC', note: 'Shure groups the resonator with the guitar rows; the sound hole is read here as the cone’s centre (RS-02), drawn 18–23 cm' },
      surface: 'hole',
      distance: { min: 180, max: 230 },
      radial: { max: radial, prov: ill('a little off the picking path: the lab’s drawing') },
      aimAtR: { r: 150, prov: ill('aimed at the coverplate: the axis meets it within 15 cm of its centre') },
      micTypeIds: STAND,
      start: lap ? { d: 200, dy: 150, dx: 30 } : { d: 205, dx: 45 },
      tendency: 'More of the cone’s distinct, metallic projection. Very close on one spot it can turn narrow or piercing — move off it, or change the angle.',
      checks: ['Clear of the picking hand and the bar', 'An overly sharp or narrow tone', 'How it changes as the player moves'],
    },
    {
      id: 'cover',
      label: 'Facing the coverplate and upper body, a little farther',
      band: 'Start about 20–45 cm (8–18 in) out from the coverplate, facing the coverplate and the upper body from a little off the picking hand.',
      kind: 'trial',
      src: 'LESSON',
      quote: 'a mic roughly 20–45 cm (8–18 in) from the instrument, facing the broad coverplate/upper-body area from slightly off the player\'s picking path',
      bandProv: { kind: 'trial', src: 'LESSON', note: 'a teaching trial: no published resonator distance (resonator_dobro/SOURCES.md)' },
      surface: 'hole',
      distance: { min: 231, max: 457.2 },
      radial: { max: radial + 40, prov: ill('a little off the picking path: the lab’s drawing') },
      aimAtR: { r: 170, prov: ill('aimed at the coverplate and upper body: within 17 cm of the coverplate’s centre') },
      micTypeIds: STAND,
      start: lap ? { d: 300, dy: off, dx: 40 } : { d: 320, dx: off },
      tendency: 'A more combined view: the cone, the strings and the body together. Farther back brings the room and the neighbours in, too.',
      checks: ['The bar hand’s and the picking hand’s full reach', 'Room reflections and neighbouring instruments', 'Feedback risk on a stage'],
    },
    {
      id: 'clip',
      label: 'Clipped on, the capsule toward the coverplate’s edge',
      band: 'Start with the mini mic about 3–9 cm (1–3.5 in) over the body near the neck end of the coverplate, aimed at the coverplate’s edge — not at the cone.',
      kind: 'sourced',
      src: 'DPA-MOUNT',
      quote: '4099G Clip Microphone for Guitar, Dobro',
      bandProv: ill('no source gives a height: 3–9 cm is the lab’s drawing of a clip-held capsule'),
      surface: 'top',
      distance: { min: 30, max: 90 },
      aimMax: { deg: 60, prov: ill('aimed at the body: within 60° of straight onto it') },
      micTypeIds: ['clipCond'],
      boxG: { min: { x: 130, y: -60, z: 30 }, max: { x: 215, y: 60, z: 90 }, prov: ill('the neck end of the coverplate, clear of the picking hand: the lab’s drawing') },
      start: { dx: 172, d: 60, aimAt: { x: 110, y: 0, z: 0 } },
      tendency: 'A steady view that moves with the instrument. It hears a small local part: check that it is not all strings, and never let it touch the coverplate.',
      checks: ['A clip made for this body, with the owner’s OK — never on the cone or coverplate', 'The bar and the picking hand', 'The cable, strain-relieved'],
    },
  ];
}
