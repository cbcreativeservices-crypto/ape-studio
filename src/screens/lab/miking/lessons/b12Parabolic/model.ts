/**
 * B12 PARABOLIC AND TRACKED ACTION PICKUP — the suggested starting points
 * (charter §2 layer 1) on the shared practice field (frame P). Research:
 * docs/labs/miking/parabolic/SOURCES.md and GEOMETRY_PROPOSAL.md §3–§4; words
 * from the owner's lesson (source_text/B12-…; "L<n>" in comments only).
 *
 * ENGINE ZONES (frame: practiceModels.fieldModel):
 *   pb.dish.A   the dish from the operator's place M, its axis on A — ONE MIC
 *               and the worked example (geometry §4 "ONE MIC: dish aimed at a
 *               fixed target zone from the operator box")
 *   pb.dish.B   the same, turned to B (inside the arc)
 *   pb.dish.C   the same, on C
 *   pb.sg.F     a fixed perimeter shotgun at the approved place F, on B — the
 *               fallback the dish hands off to (L35; F a drawing default)
 *   pb.amb.E    the separate ambience at E (L50)
 * The dish's axis height and F are DRAWING DEFAULTS (unknowns in lesson.ts).
 */
import type { DocumentedZone, MicPose, Provenance } from '../../engine/model/types.ts';
import { engineAim, p2, toEngine } from '../shared/sports/venuePlan.ts';
import { PF, PF_ARC, PF_CREW, SPEECH_H } from '../shared/sports/practiceScenes.ts';
import { sportPlan } from '../shared/sports/sportPlans.ts';
import type { PlanZone, SportMic, SportSetup } from '../shared/sports/sportsPages';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
/** The dish's axis height (m) at the operator's chest — a drawing default. */
export const DISH_H = 1.3;
/** The fixed fallback mic's place in the crew strip (m) — a drawing default. */
export const F = p2(7, -6);
export const AMB_H = 1.5;

const pose = (at: { x: number; y: number }, h: number, to: { x: number; y: number }, hTo: number): MicPose => ({ p: toEngine(at, h), ...engineAim(at, h, to, hTo) });
const box = (c: { x: number; y: number }, half: number, h0: number, h1: number) => ({ min: { x: (c.x - half) * 1000, y: -h1 * 1000, z: -PF_CREW.y1 * 1000 }, max: { x: (c.x + half) * 1000, y: -h0 * 1000, z: -PF_CREW.y0 * 1000 }, prov: ill('on the crew strip at the mark (the lab’s box)') });

function dishZone(id: string, t: 'A' | 'B' | 'C', dist: [number, number], label: string, band: string, tendency: string): DocumentedZone {
  return {
    id,
    label,
    band,
    kind: 'trial',
    src: 'LESSON-B12',
    quote: 'Set up at a permitted mark … use the product’s aiming reference or dish axis, then make small turns (L27); move smoothly within the approved arc (L28)',
    bandProv: ill('the dish’s axis height at M is a drawing default (1.3 m)'),
    refSurface: `t${t}`,
    side: 'either',
    distance: { min: dist[0], max: dist[1] },
    aimAt: { surface: `t${t}`, r: 700, prov: ill('the dish’s axis on the target within about 0.7 m (the lab’s tolerance)') },
    box: box(PF.M, 1.5, 1.0, 1.7),
    requires: { micTypeIds: ['spDish'] },
    start: pose(PF.M, DISH_H, PF[t], SPEECH_H),
    tendency,
    checks: ['The element at the maker’s focal reference', 'Turned only inside the arc', 'Headphones at a safe level, a crew member watching'],
  };
}

export const B12_ZONES: DocumentedZone[] = [
  dishZone('pb.dish.A', 'A', [9300, 10800], 'From the operator’s place, the dish on A', 'At the approved operating place, the dish’s axis on the chosen target — A, about 10 m away. Small turns to find the useful action and the least background.', 'The most high-frequency detail from what is on its axis; low sound mostly reaches the element directly.'),
  dishZone('pb.dish.B', 'B', [18300, 19600], 'The dish turned to B', 'The same place, turned smoothly 32° left to B, about 18.9 m — still inside the approved arc.', 'Distant detail for as long as the dish stays on it; off the axis the high frequencies fade first.'),
  dishZone('pb.dish.C', 'C', [23300, 24700], 'The dish on C', 'On C, about 24 m straight ahead.', 'The farthest target: the crowd or anything beyond C is on the axis too.'),
  {
    id: 'pb.sg.F',
    label: 'A fixed perimeter shotgun at F, on B',
    band: 'A fixed mic at a second approved place in the crew strip, its axis on B — the source the dish hands off to.',
    kind: 'trial',
    src: 'LESSON-B12',
    quote: 'Approved perimeter shotgun/boom: action passes a known closer zone (L34–L35); compare with one approved fixed or perimeter microphone (L50)',
    bandProv: ill('F is a drawing default (7, −6); the capsule at about 1.2 m as B13'),
    refSurface: 'tB',
    side: 'either',
    distance: { min: 15000, max: 17500 },
    aimAt: { surface: 'tB', r: 900, prov: ill('the axis on B within about 0.9 m (the lab’s tolerance)') },
    box: box(F, 1.5, 0.9, 1.6),
    requires: { micTypeIds: ['shotgunShort'] },
    start: pose(F, 1.2, PF.B, SPEECH_H),
    tendency: 'A known zone covered without anyone turning: dependable, but it hears only where it points, and no distant mic rejects what is behind its target.',
    checks: ['Its own approved place', 'Its gain set for the loudest event', 'A smooth handoff from the dish'],
  },
  {
    id: 'pb.amb.E',
    label: 'The ambience at E',
    band: 'A separate ambience source at the approved mark E, aimed into the field — the bed when tracking fails.',
    kind: 'trial',
    src: 'LESSON-B12',
    quote: 'Wider ambience pair or fixed effects: tracking fails or atmosphere is the editorial goal (L40–L42)',
    bandProv: ill('E’s place and the height are drawing defaults'),
    refSurface: 'ground',
    side: 'either',
    distance: { min: 1000, max: 2500 },
    aim: { maxOffAxis: 35, dir: { x: 0, y: 0, z: -1 }, prov: ill('into the field within 35° (the lab’s tolerance)') },
    box: box(PF.E, 2, 1.0, 2.5),
    requires: { micTypeIds: ['arrCard'] },
    start: pose(PF.E, AMB_H, { x: PF.E.x, y: 10 }, AMB_H),
    tendency: 'A clearer venue perspective, less isolated action detail — label it as ambience.',
    checks: ['A place that represents the listening side', 'No single loud spectator beside it', 'Checked in mono'],
  },
];

const m = (id: string, kind: SportMic['kind'], label: string, at: { x: number; y: number }, h: number, aimAt: { x: number; y: number }, aimH: number, pattern: SportMic['pattern'] = null): SportMic => ({ id, kind, label, at, h, aimAt, aimH, pattern });
export const DISH_A = m('dish', 'dish', 'parabolic dish', PF.M, DISH_H, PF.A, SPEECH_H);
export const SG_F = m('sgF', 'shotgun', 'fixed perimeter shotgun', F, 1.2, PF.B, SPEECH_H, 'shotgun');
export const AMB_E = m('amb', 'xy', 'ambience pair', PF.E, AMB_H, { x: PF.E.x, y: 10 }, AMB_H, 'cardioid');
const BB = sportPlan('basketball');
const CORNER = BB.footprints.find((f) => f.id === 'corner')!.rect;

export const B12_SETUPS: SportSetup[] = [
  { id: 'su.one', role: 'ONE MIC', core: true, title: 'A dish from the operator’s place, on a target zone', type: 'a parabolic dish, its omni element at the focus, hand-held', start: 'At the approved place M, the dish’s axis on A; small turns to find the action and the least background; the arc marked.', line: 'Selected distant detail — the high frequencies of whatever is on its axis.', mics: [DISH_A] },
  { id: 'su.two', role: 'TWO MICS', core: true, title: 'The dish plus a fixed perimeter shotgun', type: 'the dish at M; a short shotgun on a stand at the approved place F', start: 'The dish tracks inside its arc; the fixed shotgun covers B — the zone to hand off to.', line: 'Tracked detail with a dependable fallback; both open on one source can double the attack.', mics: [DISH_A, SG_F] },
  {
    id: 'su.close',
    role: 'CLOSE · LIVE',
    core: true,
    title: 'Indoors: a close permitted perimeter mic instead',
    type: 'a short shotgun at an approved corner, beyond the court’s clear band',
    start: 'In a reflective indoor venue, an approved closer perimeter place may give more natural detail than a long-distance dish.',
    line: 'Decide by the target against the background and the tone you hear — not by the equipment’s label.',
    mics: [m('sgc', 'shotgun', 'perimeter shotgun', { x: (CORNER.x0 + CORNER.x1) / 2, y: (CORNER.y0 + CORNER.y1) / 2 }, 1.2, { x: 4, y: 7.5 }, 1.2, 'shotgun')],
    scene: BB,
    noRange: true,
  },
  { id: 'su.far', role: 'FARTHER BACK · STUDIO', core: true, title: 'A wider ambience pair at E', type: 'two small cardioids, crossed, on one stand', start: 'At the approved mark E, aimed into the field — the bed when tracking fails or atmosphere is the goal.', line: 'A clearer venue perspective, less isolated action — labelled as ambience.', mics: [AMB_E] },
  { id: 'su.feet', role: 'ANOTHER START', core: false, title: 'An idea to try: aim toward a distant player’s feet', type: 'the dish, its axis a little below the target', start: 'At M, the axis toward C’s feet, so the pickup takes in the player and less of the crowd beyond; raise it as the player comes nearer.', line: 'Less crowd beyond the target, perhaps — test it with your own dish and geometry; it is not a fixed angle.', mics: [m('dfeet', 'dish', 'dish, aimed low', PF.M, DISH_H, PF.C, 0.1)] },
  { id: 'su.second', role: 'ANOTHER START', core: false, title: 'A second dish at a second approved place', type: 'two dishes, two operators, two zones', start: 'A second operator at F covers the far zone; the two hand off with radio coordination.', line: 'Separate action zones — at the cost of coordination, and a doubled transient if both are open.', mics: [DISH_A, m('d2', 'dish', 'second dish', F, DISH_H, PF.B, SPEECH_H)] },
];

const AT = (c: { x: number; y: number }) => ({ x0: c.x - 1.2, y0: PF_CREW.y0, x1: c.x + 1.2, y1: PF_CREW.y1 });
export const B12_PLACE: PlanZone[] = [
  { id: 'pz.dA', label: 'From M, the dish on A', band: 'The axis on A, about 10 m.', tendency: 'The most detail from the near target.', rect: AT(PF.M), h: [1.0, 1.6], target: 'A', tol: 4, kinds: ['dish'] },
  { id: 'pz.dB', label: 'From M, the dish on B', band: 'Turned to B, 32° left — inside the arc.', tendency: 'B’s detail while the dish holds it.', rect: AT(PF.M), h: [1.0, 1.6], target: 'B', tol: 4, kinds: ['dish'] },
  { id: 'pz.dC', label: 'From M, the dish on C', band: 'On C, about 24 m.', tendency: 'Distant detail; the crowd beyond is on the axis too.', rect: AT(PF.M), h: [1.0, 1.6], target: 'C', tol: 4, kinds: ['dish'] },
  { id: 'pz.sgB', label: 'The fixed shotgun at F, on B', band: 'At F, about 1.2 m up, its axis on B.', tendency: 'The dependable fallback for B.', rect: AT(F), h: [1.0, 1.4], target: 'B', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.sgA', label: 'The fixed shotgun at F, on A', band: 'At F, re-aimed at A.', tendency: 'A second angle on A — off the dish’s path.', rect: AT(F), h: [1.0, 1.4], target: 'A', tol: 6, kinds: ['shotgun'] },
];

/** The tracking walk: A → B → C → past the arc to the near-left corner. */
export const TRACK_PATH = [PF.A, PF.B, PF.C, p2(2, 2)] as const;
export { PF_ARC };
/** The overlap pair: the dish at M and the fixed shotgun at F, the source A → B → C. */
export const B12_OVERLAP = { a: DISH_A, b: SG_F, path: [PF.A, PF.B, PF.C] } as const;
