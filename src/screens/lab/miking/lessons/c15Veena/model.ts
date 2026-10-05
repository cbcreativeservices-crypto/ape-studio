/**
 * C15 SARASWATI VEENA — the technical truth (charter §2 layer 1). The overall
 * length and the resonator's width are sourced (MET-506151: 121.5 cm long,
 * 34 cm wide); four melody and three tala strings (the Met example the
 * lesson cites). Positions are drawing defaults (veena/GEOMETRY_PROPOSAL.md);
 * the posture is the proposal's, from a holding guide whose text could not be
 * read — the owner checks it on the phone.
 *
 * THE STARTING POINTS are derived from the VEENA's own research and geometry
 * (correction C15-01: the lesson's 35–60 / 20–35 / 70–120 cm were the oud
 * lesson's trials copied word for word, with a loose "2–4 ft"):
 *   • the near edge, 30 cm, is where a cardioid's ±30° view first takes in
 *     the whole Ø 34 cm top plate (170 / tan 30° ≈ 29 cm) — DERIVED;
 *   • the far edge, 50 cm, is one of the radii at which the top plate's
 *     radiation was measured (EXT-23505: "R = 0.5 m"), where the study found
 *     the plate mattered most — a radius the research looked at, not a
 *     "best" distance (the study itself says so);
 *   • aimed at a broad area of the plate between the bridge and the body,
 *     or a little toward the bridge for more articulation (the lesson's A
 *     and B, which the research does not contradict).
 * A closer stage spot and a farther room view stay in words.
 */
import type { Provenance } from '../../engine/model/types.ts';
import type { LuteScene, LuteZoneSpec } from '../shared/lutes/luteModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v = (x: number, y: number, z: number) => ({ x, y, z });
const STAND = ['sdcCard', 'instDynCard'];
const BAND: Provenance = { kind: 'trial', src: 'EXT-23505', note: 'DERIVED: 30 cm = a cardioid’s ±30° taking in the Ø 34 cm plate (170 / tan 30°); 50 cm = a radius at which the plate’s radiation was mapped ("R = 0.5 m"). The study gives no best distance.' };

export function c15ZoneSpecs(sc: LuteScene): LuteZoneSpec[] {
  const at = sc.at;
  return [
    {
      id: 'plate',
      label: 'Over the top plate, between the bridge and the body',
      band: 'Start about 30–50 cm (12–20 in) from the top plate, out of the plucking hand’s reach, aimed at a broad area of the plate between the bridge and the body.',
      kind: 'trial',
      src: 'EXT-23505',
      quote: 'Each microphone is kept at a radial distance, R = 0.25 m from the point O; further mapping at R = 0.5 m, R = 0.75 m',
      bandProv: BAND,
      surface: 'plate',
      distance: { min: 300, max: 500 },
      radial: { max: 380, prov: ill('from in front and above: within 38 cm of the plate’s line — the lab’s drawing') },
      aimAt: { surface: 'plate', r: 70, prov: ill('aimed at a broad area of the plate: the axis meets it within 7 cm of the point — the lab’s tolerance') },
      micTypeIds: STAND,
      start: { p: v(at.plate.x, 300, 380), aimAt: at.plate },
      drawHalf: 120,
      tendency: 'A starting blend of melody, body and the bridge’s buzz. Ask the player whether the tala strokes and the gamakas (bends) still sit where they should.',
      checks: ['Outside the plucking hand’s reach and the arm', 'Tala strokes in proportion to the melody', 'The buzz the player intends — not more'],
    },
    {
      id: 'bridge',
      label: 'The same distance, turned toward the bridge',
      band: 'Keep about 30–50 cm (12–20 in) from the plate and turn the mic a little toward the main bridge and the plucking area — without moving into the hand’s path.',
      kind: 'trial',
      src: 'LESSON',
      quote: 'At the same distance, alter aim slightly toward the main bridge and plucking region without invading the hand’s path.',
      bandProv: BAND,
      surface: 'bridge',
      distance: { min: 300, max: 500 },
      radial: { max: 380, prov: ill('from in front and above: within 38 cm of the bridge line — the lab’s drawing') },
      aimAt: { surface: 'bridge', r: 45, prov: ill('turned toward the bridge: the axis meets the plate within 4.5 cm of it — the lab’s tolerance') },
      micTypeIds: STAND,
      start: { p: v(30, 300, 380), aimAt: v(0, 0, 10) },
      drawHalf: 120,
      tendency: 'More of each note’s start — and maybe more pick click or buzz than the music wants. Tell the instrument’s intended buzz apart from what the mic is adding.',
      checks: ['The hand’s path stays clear', 'Buzz: intended, or added by the aim?', 'Compare with the plate aim at matched levels'],
    },
  ];
}
