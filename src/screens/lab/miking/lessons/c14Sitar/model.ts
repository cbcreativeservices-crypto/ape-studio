/**
 * C14 SITAR — the technical truth (charter §2 layer 1). The overall size and
 * the string counts are sourced (MET-ADHIKARI: 124.5 × 34.3 × 31 cm; 7
 * melody and 13 sympathetic strings); positions on it are drawing defaults
 * (sitar/GEOMETRY_PROPOSAL.md).
 *
 * THE STARTING POINTS (sitar/SOURCES.md):
 *   • below the bridge, about 20 cm from the soundboard, angled up at the
 *     bridge's top — one engineer's close omni (GEOS, CONFIRMED from the
 *     archived page);
 *   • two mics about 18–20 cm (7–8 in) away, one LOW toward the bridge and
 *     body, one HIGH toward the neck, each angled at the body (S-DUVEL,
 *     CONFIRMED); "most of the sound can be captured by a mic positioned in
 *     front of the bridge" — begin with the low one alone;
 *   • a little farther back across the bridge, 25–45 cm — the lesson's own
 *     teaching trial (kept, and labelled as a place to begin).
 * The 60–100 cm room view and the immersive session's ~40 cm ribbons stay in
 * words (no ribbon type in this lab; the far view needs the room).
 */
import type { Provenance } from '../../engine/model/types.ts';
import type { LuteScene, LuteZoneSpec } from '../shared/lutes/luteModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v = (x: number, y: number, z: number) => ({ x, y, z });
const STAND = ['sdcCard', 'instDynCard'];

export function c14ZoneSpecs(sc: LuteScene): LuteZoneSpec[] {
  const at = sc.at;
  return [
    {
      id: 'jawari',
      label: 'Below the bridge, angled up at its top',
      band: 'Start about 20 cm (8 in) from the soundboard, below the bridge, angled up at the bridge’s top — a close omni.',
      kind: 'sourced',
      src: 'GEOS',
      quote: 'placed approximately 20cm from the tabkadi (soundboard) and pointed diagonally upwards at the jawari (the bone plate that forms the top of the main bridge)',
      bandProv: ill('"approximately 20cm": 17–23 cm is the lab’s drawing of it'),
      surface: 'board',
      distance: { min: 170, max: 230 },
      radial: { max: 230, prov: ill('below the bridge, within 23 cm of the board’s centre line — the lab’s drawing') },
      aimAt: { surface: 'bridge', r: 45, prov: ill('pointed at the bridge’s top: the axis meets the board within 4.5 cm of the bridge — the lab’s tolerance') },
      aim: { minOffAxis: 15, maxOffAxis: 65, prov: ill('"diagonally upwards": 15–65° off straight-on — the lab’s tolerance') },
      box: { min: v(-3000, 0, -3000), max: v(3000, 3000, 3000), prov: ill('below the bridge: the mic is lower than the bridge in front view') },
      micTypeIds: ['sdcCard'],
      start: { p: v(-130, 0, 210), aimAt: at.jawari },
      tendency: 'A close, open view of the bridge and the board — the buzz and the attack up front, with the room still around it. It was chosen in a noisy hall to get close; it is a choice for that room, not a rule.',
      checks: ['Clear of the mizrab hand and the gourd', 'The bridge buzz the player intends — not more', 'What else an omni this close still hears'],
    },
    {
      id: 'low',
      label: 'Low: toward the bridge and the body',
      band: 'Start about 18–20 cm (7–8 in) from the soundboard, toward the bridge and the body, angled in.',
      kind: 'sourced',
      src: 'S-DUVEL',
      quote: 'Two KSM137 mics pointed at the body of the instrument on an angle, about 7–8" away. One \'high\' pointed at the neck and one \'low\' pointed at the bridge and body',
      bandProv: ill('"about 7–8 in": 16.5–21.5 cm is the lab’s drawing of it'),
      surface: 'lower',
      distance: { min: 165, max: 215 },
      radial: { max: 160, prov: ill('toward the bridge and the body: within 16 cm of the lower board’s line — the lab’s drawing') },
      aimAt: { surface: 'bridge', r: 110, prov: ill('pointed at the bridge and body: the axis meets the board within 11 cm of the bridge — the lab’s tolerance') },
      micTypeIds: STAND,
      start: { p: v(-110, -20, 190), aimAt: v(-10, 0, 0) },
      tendency: 'Most of the sitar’s sound in one mic: the main line, the body and the bridge’s edge together. A good place to begin on its own; add the high mic only if it brings something you need.',
      checks: ['Clear of the mizrab hand and the gourd', 'Melody, body and buzz in balance', 'Other instruments nearby'],
    },
    {
      id: 'high',
      label: 'High: toward the neck',
      band: 'Start about 18–20 cm (7–8 in) from the neck, above the gourd, angled in at it.',
      kind: 'sourced',
      src: 'S-DUVEL',
      quote: 'One \'high\' pointed at the neck and one \'low\' pointed at the bridge and body',
      bandProv: ill('"about 7–8 in": 16.5–21.5 cm is the lab’s drawing of it'),
      surface: 'neck',
      distance: { min: 165, max: 215 },
      radial: { max: 160, prov: ill('toward the neck: within 16 cm of the neck line — the lab’s drawing') },
      aimAt: { surface: 'neck', r: 120, prov: ill('pointed at the neck: the axis meets it within 12 cm — the lab’s tolerance') },
      micTypeIds: STAND,
      start: { p: v(390, 0, 190), aimAt: at.neck },
      tendency: 'More string character and, on a sitar that has them, more of the sympathetic strings’ shimmer — and more fret and hand noise. On its own it loses the body; it is the second of a pair.',
      checks: ['Clear of the left hand’s travel along the neck', 'Fret and hand noise', 'The pair in mono with the low mic'],
    },
    {
      id: 'across',
      label: 'A little farther back, across the bridge',
      band: 'Start about 25–45 cm (10–18 in) from the lower soundboard, aimed across the bridge and the board — not into one point.',
      kind: 'trial',
      src: 'LESSON',
      quote: 'start 25–45 cm (10–18 in) from the lower face, aimed across the bridge and adjacent soundboard rather than into one impact point.',
      bandProv: { kind: 'trial', src: 'LESSON', note: 'the lesson’s own teaching trial; no sitar source gives this distance' },
      surface: 'lower',
      distance: { min: 250, max: 450 },
      radial: { max: 220, prov: ill('across the lower board: within 22 cm of its line — the lab’s drawing') },
      aimAt: { surface: 'bridge', r: 130, prov: ill('across the bridge and board: the axis meets the board within 13 cm of the bridge — the lab’s tolerance') },
      micTypeIds: STAND,
      start: { p: v(-60, 0, 330), aimAt: at.bridge },
      tendency: 'A softer, rounder view: less of the nearest attack, more of the whole instrument and its decay — and more of the room and anything near it.',
      checks: ['The quiet opening still clear', 'The decay of the sympathetic strings, if it has them', 'Spill from other instruments'],
    },
  ];
}
