/**
 * B13 FIELD AND DIAMOND SPORTS — the suggested starting points (charter §2
 * layer 1): the engine's zones (for the shared pages' data and tests), the
 * lesson's STARTING SETUPS drawn on the plan, the Placement Studio's zones,
 * the coverage-map tasks and the overlap pair. Research: docs/labs/miking/
 * field_diamond/SOURCES.md and GEOMETRY_PROPOSAL.md §3; words from the owner's
 * lesson (source_text/B13-…; "L<n>" in comments only).
 *
 * ENGINE ZONES (frame: geometry.ts):
 *   fd.sg.A     the perimeter shotgun at M, capsule about 1.2 m, axis on A
 *               (10 m) — ONE MIC and the worked example (L136, L141)
 *   fd.sg.B     the same, on B (18.9 m, 32° left) (L142)
 *   fd.sg.C     the same, on C (24 m) (L142)
 *   fd.sg.low   the shotgun at about 0.6 m, re-aimed at A (L143)
 *   fd.dish.A   the parabolic at M on A, compared one at a time (L140) — the
 *               dish's height is not given: a drawing default
 *   fd.amb.E    the fixed ambience at E (a cardioid, the mono fallback; the
 *               XY pair is drawn on the lesson's own pages) — E a drawing default
 */
import type { DocumentedZone, MicPose, Provenance } from '../../engine/model/types.ts';
import { engineAim, toEngine, type CoverageZone } from '../shared/sports/venuePlan.ts';
import { PF, PF_CREW, SPEECH_H } from '../shared/sports/practiceScenes.ts';
import { sportPlan } from '../shared/sports/sportPlans.ts';
import type { CoverageTask, PlanZone, SportMic, SportSetup } from '../shared/sports/sportsPages';
import { CREW_BOX } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
/** The dish's axis height at M (m): a drawing default (the lesson: "log the
 *  parabolic capsule and dish-axis height separately" — no number). */
export const DISH_H = 1.3;
/** The ambience mic's height at E (m): a drawing default. */
export const AMB_H = 1.5;

const pose = (at: { x: number; y: number }, h: number, to: { x: number; y: number }, hTo: number): MicPose => ({ p: toEngine(at, h), ...engineAim(at, h, to, hTo) });
const atM = (hMin: number, hMax: number) => ({ min: { x: CREW_BOX.min.x + 13000, y: -hMax * 1000, z: CREW_BOX.min.z }, max: { x: CREW_BOX.max.x - 13000, y: -hMin * 1000, z: CREW_BOX.max.z }, prov: ill('at mark M in the crew strip (the lab’s box: ±4 m along it)') });

function shotgunZone(id: string, label: string, band: string, t: 'A' | 'B' | 'C', dist: [number, number], h: number, hRange: [number, number], tendency: string, checks: string[], quote: string): DocumentedZone {
  const T = PF[t];
  return {
    id,
    label,
    band,
    kind: 'trial',
    src: 'LESSON-B13',
    quote,
    refSurface: `t${t}`,
    side: 'either',
    distance: { min: dist[0], max: dist[1] },
    aimAt: { surface: `t${t}`, r: 900, prov: ill('the axis on the target within about 0.9 m at its distance (the lab’s tolerance)') },
    box: atM(hRange[0], hRange[1]),
    requires: { micTypeIds: ['shotgunShort'] },
    start: pose(PF.M, h, T, SPEECH_H),
    tendency,
    checks,
  };
}

export const B13_ZONES: DocumentedZone[] = [
  shotgunZone(
    'fd.sg.A',
    'At mark M, the shotgun on A',
    'From the approved mark M, about 10 m from A: the capsule about 1.2 m up if that mount is approved, its axis on A. Log the capsule-to-target distance, the height and the aim.',
    'A',
    [9500, 10700],
    PF.hHigh,
    [0.9, 1.6],
    'Aimed detail from a closer permitted place. Off its axis the tone changes and higher frequencies fade first; it does not zoom.',
    ['The mark approved, nothing in a route', 'The axis on the target, the PA and crowd off it', 'The suspension and wind cover working'],
    'Start the fixed shotgun at approximately 1.2 metres capsule height only if that mount is approved (L136); A (15, 4) 10.0 m 0° (L125–L127)',
  ),
  shotgunZone('fd.sg.B', 'At mark M, the shotgun on B', 'The same mark, re-aimed 32° to the left at B, about 18.9 m away. Keep the gain fixed within the distance sequence.', 'B', [18300, 19600], PF.hHigh, [0.9, 1.6], 'Farther and turned: quieter, more of the place, the tone changing with the angle. Moving the aim is not moving closer.', ['The new aim logged', 'The same gain as at A', 'What else now sits on the axis'], 'B (5, 10) 18.9 m 32 degrees left (L128–L131); repeat at B and C (L142)'),
  shotgunZone('fd.sg.C', 'At mark M, the shotgun on C', 'The same mark on C, about 24 m straight ahead.', 'C', [23400, 24700], PF.hHigh, [0.9, 1.6], 'The farthest target: much more background against the target. Raising the gain raises both.', ['The same gain as at A', 'Target against background at similar loudness', 'Repeat A to check'], 'C (15, 18) 24.0 m 0 degrees (L132–L135)'),
  shotgunZone('fd.sg.low', 'Lower at M, on A', 'An idea to try: the capsule about 0.6 m up, re-aimed at A — the support kept out of the source path.', 'A', [9500, 10700], PF.hLow, [0.4, 0.8], 'Low may favour shoe or ball detail and grass noise; it is also easier to strike. Height is a trial, not a rule.', ['Re-aimed at the same source', 'The support out of the path', 'Splash and grass noise'], 'compare the shotgun near 1.2 metres and approximately 0.6 metres capsule height, with the axis re-aimed at the same source (L143)'),
  {
    id: 'fd.dish.A',
    label: 'The dish at M, on A',
    band: 'The correctly assembled dish at M, its axis on A, about 10 m away — compared one at a time with the shotgun, never assumed to share its point.',
    kind: 'trial',
    src: 'LESSON-B13',
    quote: 'Compare the two action microphones sequentially at M; do not assume their capsules share a coordinate (L140)',
    bandProv: ill('the dish’s axis height at M is a drawing default (1.3 m)'),
    refSurface: 'tA',
    side: 'either',
    distance: { min: 9300, max: 10800 },
    aimAt: { surface: 'tA', r: 700, prov: ill('the dish’s axis on the target within about 0.7 m (the lab’s tolerance)') },
    box: atM(1.0, 1.7),
    requires: { micTypeIds: ['spDish'] },
    start: pose(PF.M, DISH_H, PF.A, SPEECH_H),
    tendency: 'Selected distant detail, its high frequencies most of all; aim and focus are critical, and it hears whatever else is on its axis.',
    checks: ['The focus from the maker’s reference', 'Turned only inside the marked arc', 'Headphones at a safe level'],
  },
  {
    id: 'fd.amb.E',
    label: 'The fixed ambience at E',
    band: 'A stable ambience source at the separately approved mark E in the crew strip, aimed into the field — the bed the action mics sit on.',
    kind: 'trial',
    src: 'LESSON-B13',
    quote: 'fixed ambience mark E in the authorized crew strip (L118); a coincident XY cardioid pair is a useful starting comparison; a single broad microphone is a simpler mono fallback (L49)',
    bandProv: ill('E’s place and the mic’s height are drawing defaults'),
    refSurface: 'ground',
    side: 'either',
    distance: { min: 1000, max: 2500 },
    aim: { maxOffAxis: 35, dir: { x: 0, y: 0, z: -1 }, prov: ill('into the field within 35° (the lab’s tolerance)') },
    box: { min: { x: PF.E.x * 1000 - 2000, y: -2500, z: CREW_BOX.min.z }, max: { x: PF.E.x * 1000 + 2000, y: -1000, z: CREW_BOX.max.z }, prov: ill('at E (the lab’s box)') },
    requires: { micTypeIds: ['arrCard'] },
    start: pose(PF.E, AMB_H, { x: PF.E.x, y: 10 }, AMB_H),
    tendency: 'Continuity: the venue and its audience, steady through every play — less action isolation; one nearby spectator or the PA can dominate it.',
    checks: ['It represents the intended listening side', 'No single nearby voice or loudspeaker dominating', 'Checked in mono'],
  },
];

/* ═════════ the plan setups (the lesson's own STARTING SETUPS page) ═════════ */

const m = (id: string, kind: SportMic['kind'], label: string, at: { x: number; y: number }, h: number, aimAt: { x: number; y: number }, aimH: number, pattern: SportMic['pattern'] = null): SportMic => ({ id, kind, label, at, h, aimAt, aimH, pattern });
export const SG_A = m('sg', 'shotgun', 'perimeter shotgun', PF.M, PF.hHigh, PF.A, SPEECH_H, 'shotgun');
export const DISH_A = m('dish', 'dish', 'parabolic dish', PF.M, DISH_H, PF.A, SPEECH_H);
export const AMB_E = m('amb', 'xy', 'XY ambience pair', PF.E, AMB_H, { x: PF.E.x, y: 10 }, AMB_H, 'cardioid');
const BASE = sportPlan('baseball');
const BACK = BASE.footprints.find((f) => f.id === 'back')!.rect;
const SOC = sportPlan('soccer');
const NEAR = SOC.footprints.find((f) => f.id === 'near')!.rect;

export const B13_SETUPS: SportSetup[] = [
  {
    id: 'su.one',
    role: 'ONE MIC',
    core: true,
    title: 'A perimeter shotgun at M, aimed at A',
    type: 'a short shotgun in a shock mount and basket windshield, on a stand',
    start: 'From the approved mark M, about 10 m from A, the capsule about 1.2 m up if that mount is approved, its axis on A.',
    line: 'Aimed detail from a permitted place; off its axis the tone changes — it has no acoustic zoom.',
    mics: [SG_A],
  },
  {
    id: 'su.two',
    role: 'TWO MICS',
    core: true,
    title: 'One action mic and a fixed ambience bed',
    type: 'the shotgun at M, and an XY pair of small cardioids at E',
    start: 'The shotgun at M on the prioritized zone; the ambience pair at the approved mark E, aimed into the field.',
    line: 'The place carried steadily, one zone in detail — add a channel only when a tested gap justifies it.',
    mics: [SG_A, AMB_E],
  },
  {
    id: 'su.close',
    role: 'CLOSE · LIVE',
    core: true,
    title: 'Baseball: a plate-area shotgun from behind the backstop',
    type: 'a short shotgun on a stand, entirely on the protected side of the screen',
    start: 'From the approved position behind the backstop screen, aimed at the plate area — never through the screening into live-ball space.',
    line: 'Bat contact and the catcher’s glove; test both batters’ sides, and whether the catcher, umpire or netting changes it.',
    mics: [m('sgp', 'shotgun', 'plate-area shotgun', { x: (BACK.x0 + BACK.x1) / 2, y: (BACK.y0 + BACK.y1) / 2 }, PF.hHigh, { x: 0, y: 0 }, 1.0, 'shotgun')],
    scene: BASE,
    box: { x0: -30, y0: -26, x1: 30, y1: 34 },
    noRange: true,
  },
  {
    id: 'su.far',
    role: 'FARTHER BACK · STUDIO',
    core: true,
    title: 'A fixed XY ambience pair at E',
    type: 'two small cardioids, crossed, on one stand',
    start: 'At the approved mark E in the crew strip, aimed into the field — or a single broad mic as a simpler mono fallback.',
    line: 'A stable mono or stereo sense of the venue and its audience — less isolated action; check it in mono.',
    mics: [AMB_E],
  },
  {
    id: 'su.dish',
    role: 'ANOTHER START',
    core: false,
    title: 'A dish at M, tracking A → B → C',
    type: 'a parabolic dish with its omni element at the focus, hand-held',
    start: 'At M, inside the marked turn arc; turn smoothly from A toward B and C, and hand off to the fixed sources when tracking stops working.',
    line: 'Selected distant detail where an operator can stay clear; a dish that improves one kick may miss the next pass.',
    mics: [m('dsh', 'dish', 'parabolic dish', PF.M, DISH_H, PF.B, SPEECH_H)],
  },
  {
    id: 'su.low',
    role: 'ANOTHER START',
    core: false,
    title: 'The shotgun lower, at about 0.6 m',
    type: 'the same short shotgun, re-aimed at A',
    start: 'At M, the capsule about 0.6 m up, re-aimed at the same source; the support out of the source path.',
    line: 'Low may favour shoe or ball detail — and grass noise, splash and strikes. Height is a trial.',
    mics: [m('sgl', 'shotgun', 'shotgun, lower', PF.M, PF.hLow, PF.A, SPEECH_H, 'shotgun')],
  },
  {
    id: 'su.soccer',
    role: 'ANOTHER START',
    core: false,
    title: 'Soccer: a fixed mic into a named sector',
    type: 'a short shotgun at an approved perimeter position',
    start: 'At the approved near-side position, aimed into a named sector of the pitch — nothing clipped to a goal, a net or a flagpost.',
    line: 'Overlapping fixed sectors carry continuity; a dish follows only where an operator stays clear of officials and players.',
    mics: [m('sgs', 'shotgun', 'perimeter shotgun', { x: (NEAR.x0 + NEAR.x1) / 2, y: (NEAR.y0 + NEAR.y1) / 2 }, PF.hHigh, { x: 16.5, y: 34 - 20.16 + 8 }, 0.5, 'shotgun')],
    scene: SOC,
    box: { x0: 4, y0: -15, x1: 50, y1: 27 },
    noRange: true,
  },
];

/* ═════════ the Placement Studio's zones (plan) ═════════ */

const AT_M = { x0: PF.M.x - 1.2, y0: PF_CREW.y0, x1: PF.M.x + 1.2, y1: PF_CREW.y1 };
export const B13_PLACE: PlanZone[] = [
  { id: 'pz.A', label: 'At M, the shotgun on A', band: 'About 1.2 m up, the axis on A, about 10 m away.', tendency: 'The baseline: the most target detail of the three.', rect: AT_M, h: [1.0, 1.4], target: 'A', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.B', label: 'At M, the shotgun on B', band: 'The same mark, turned 32° left to B, about 18.9 m.', tendency: 'Quieter, more of the place; listen for the tone changing with the angle.', rect: AT_M, h: [1.0, 1.4], target: 'B', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.C', label: 'At M, the shotgun on C', band: 'About 24 m straight ahead.', tendency: 'The farthest: background rises against the target.', rect: AT_M, h: [1.0, 1.4], target: 'C', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.low', label: 'Lower at M, on A', band: 'About 0.6 m up, re-aimed at A.', tendency: 'More shoe and ball detail, perhaps — and grass, splash and strikes.', rect: AT_M, h: [0.5, 0.7], target: 'A', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.dA', label: 'The dish at M, on A', band: 'The dish’s axis on A, inside the arc.', tendency: 'The most high-frequency detail from the target in front.', rect: AT_M, h: [1.0, 1.6], target: 'A', tol: 4, kinds: ['dish'] },
  { id: 'pz.dB', label: 'The dish at M, on B', band: 'Turned smoothly to B, 32° left — still inside the arc.', tendency: 'B’s detail, for as long as the dish stays on it.', rect: AT_M, h: [1.0, 1.6], target: 'B', tol: 4, kinds: ['dish'] },
  { id: 'pz.dC', label: 'The dish at M, on C', band: 'On C, about 24 m away.', tendency: 'Distant detail, the high frequencies first; the crowd beyond C is on the axis too.', rect: AT_M, h: [1.0, 1.6], target: 'C', tol: 4, kinds: ['dish'] },
];

/* ═════════ the coverage map (L51) ═════════ */

const zone = (id: string, label: string, short: string, c: { x: number; y: number }, r: number, ok: CoverageTask['ok'], handoff: string, why: string, tag: CoverageZone['tag'] = 'detail'): CoverageTask => ({ id, label, short, c, r, tag, ok, handoff, why });
export const B13_COVERAGE: CoverageTask[] = [
  zone('cA', 'Around A (near, straight ahead)', 'A', PF.A, 2.6, ['detail'], 'the dish at M, then the ambience at E', 'About 10 m, on the shotgun’s axis: the fair place to expect usable detail — confirmed by listening on the day.', 'ambience'),
  zone('cB', 'Around B (18.9 m, 32° left)', 'B', PF.B, 2.6, ['detail', 'ambience'], 'the dish turned to B, else the ambience at E', 'Off the fixed shotgun’s axis, but inside the dish’s arc: detail if the dish reaches it, else ambience only.'),
  zone('cC', 'Around C (24 m)', 'C', PF.C, 2.6, ['ambience', 'detail'], 'the ambience at E', 'The farthest: perhaps some detail from the dish; mostly the ambience bed. Raising gain raises the background too.'),
  zone('cX', 'The near-left corner (58° left)', 'CORNER', { x: 2, y: 2 }, 2.2, ['ambience', 'unavailable'], 'the ambience at E — and say the gap', 'Outside the dish’s safe turn arc and far off the shotgun’s axis: ambience only, or unavailable. Never step out of the arc to chase it.'),
];

/** The overlap pair (TWO MICS page): the shotgun at M and the ambience at E,
 *  the source walking A → B → C. */
export const B13_OVERLAP = { a: SG_A, b: AMB_E, path: [PF.A, PF.B, PF.C] } as const;
