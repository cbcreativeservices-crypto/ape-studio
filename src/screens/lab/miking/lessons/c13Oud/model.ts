/**
 * C13 OUD — the technical truth (charter §2 layer 1). Every dimension is a
 * DRAWING DEFAULT (oud/SOURCES.md: no oud dimension was read); the anatomy is
 * sourced — three rosettes, a fretless neck, the risha (MFA-NAHAT).
 *
 * THE STARTING POINTS come from the oud's OWN research (oud/SOURCES.md), not
 * from the lesson's trial table, which the research found copied word for
 * word into the veena lesson (35–60 / 20–35 / 70–120 cm) and partly resting
 * on a forum page that no longer answers (correction C13-01):
 *   • the upper face, 30–45 cm — a player-engineer's "a foot to a foot and
 *     half away, pointed roughly around the space in between the soundhole
 *     and neck" (MO-13902);
 *   • closer to the face, about 20 cm — "maybe 8 inches from the face. It
 *     could be more or less." (MO-13902), drawn ± 5 cm;
 *   • on stage, within about 13 cm of the main rose, angled slightly down —
 *     "about 5 inches or less from the main rose, and angled slightly
 *     downward" (MO-14024).
 * A wider room view stays in words: no oud source gives a far distance.
 */
import type { Provenance } from '../../engine/model/types.ts';
import type { LuteScene, LuteZoneSpec } from '../shared/lutes/luteModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v = (x: number, y: number, z: number) => ({ x, y, z });
const STAND = ['sdcCard', 'instDynCard'];

export function c13ZoneSpecs(sc: LuteScene): LuteZoneSpec[] {
  const at = sc.at;
  return [
    {
      id: 'upper',
      label: 'The upper face, between the main rose and the neck',
      band: 'Start about 30–45 cm (12–18 in) out from the upper face, aimed at the space between the main rose and the neck.',
      kind: 'sourced',
      src: 'MO-13902',
      quote: 'I find a mic about a foot to a foot and half away, pointed roughly around the space in between the soundhole and neck (where an extended fingerboard would be)',
      surface: 'upper',
      distance: { min: 304.8, max: 457.2 },
      radial: { max: 110, prov: ill('"pointed roughly around the space": within 11 cm of the point’s line — the lab’s drawing') },
      aimAt: { surface: 'upper', r: 110, prov: ill('aimed at that space: the axis meets the face within 11 cm of it — the lab’s tolerance') },
      micTypeIds: STAND,
      start: { p: v(at.upper.x - 40, -30, 380), aimAt: at.upper },
      tendency: 'A balanced first view: the risha’s articulation and the oud’s body together. Turn toward the neck and the left hand’s slides and finger noise grow; toward the main rose, more body — and, close in, more bloom. Move it and listen.',
      checks: ['Clear of the risha’s arc, the left hand and the pegbox', 'Quiet ornaments and the loudest phrase, both', 'Finger noise against body'],
    },
    {
      id: 'face',
      label: 'Closer, facing the soundboard',
      band: 'Start about 15–25 cm (6–10 in) from the face, between the small roses and the main rose.',
      kind: 'sourced',
      src: 'MO-13902',
      quote: 'maybe 8 inches from the face. It could be more or less.',
      bandProv: ill('"maybe 8 inches … more or less": 20 cm ± 5 cm is the lab’s drawing of it'),
      surface: 'face',
      distance: { min: 150, max: 250 },
      radial: { max: 100, prov: ill('facing the face’s middle: within 10 cm of its line — the lab’s drawing') },
      aimAt: { surface: 'face', r: 110, prov: ill('aimed at the face: the axis meets it within 11 cm of the point — the lab’s tolerance') },
      micTypeIds: STAND,
      start: { p: v(at.face.x, -20, 200), aimAt: at.face },
      tendency: 'More definition and more of the risha’s click; with a directional mic, more bass from proximity — and more change every time the player moves. Useful when other instruments crowd in.',
      checks: ['The risha’s arc and the plucking arm', 'Proximity bass on the low courses', 'How much the tone shifts as the player moves'],
    },
    {
      id: 'rose',
      label: 'On stage: close to the main rose, angled down',
      band: 'Start within about 13 cm (5 in) of the main rose, a little above it and angled slightly down.',
      kind: 'sourced',
      src: 'MO-14024',
      quote: 'with the mike about 5 inches or less from the main rose, and angled slightly downward',
      bandProv: ill('"5 inches or less": up to 12.7 cm; 6 cm is the lab’s nearest, for clearance'),
      surface: 'rose',
      distance: { min: 60, max: 127 },
      radial: { max: 90, prov: ill('close to the rose: within 9 cm of its line — the lab’s drawing') },
      aimAt: { surface: 'rose', r: 60, prov: ill('aimed at the rose: the axis meets the face within 6 cm of its centre — the lab’s tolerance') },
      aim: { minOffAxis: 5, maxOffAxis: 40, prov: ill('"angled slightly downward": 5–40° off straight-on — the lab’s tolerance') },
      box: { min: v(-3000, -3000, -3000), max: v(3000, -5, 3000), prov: ill('"angled slightly downward": the mic sits above the rose') },
      micTypeIds: ['instDynCard', 'sdcCard'],
      start: { p: v(at.rose.x, -45, 95), aimAt: at.rose },
      drawHalf: 55,
      tendency: 'A close stage view with level to spare before feedback. The rose is where the bowl’s air breathes, so some notes can bloom or hum — if one booms, angle off the rose or back away a little.',
      checks: ['The risha’s arc and the face: no contact', 'Boom or hum on the low notes', 'Feedback headroom with the monitor up'],
    },
  ];
}
