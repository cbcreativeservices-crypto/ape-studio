/**
 * B17 CROWD AND COMPLETE SPORTS COVERAGE — the recommended starting points
 * (charter §2 layer 1) on the shared mock venue (frame P, practiceScenes.ts
 * `practiceCrowd`). Research: docs/labs/miking/crowd_complete/SOURCES.md and
 * GEOMETRY_PROPOSAL.md §1–§5; words from the owner's lesson
 * (source_text/B17-…; "L<n>" in comments only).
 *
 * ENGINE ZONES (frame: practiceModels.crowdModel):
 *   cc.amb.S    the audience pair's centre at S, capsules 1.5 m, aimed at U2
 *               (2.0 m) — ONE MIC and the worked example (L222)
 *   cc.amb.Sc   the closer viewpoint S′, 1 m closer to U2 (L227)
 *   cc.act.D    the action mic at D, 1 m up, aimed at A (2.0 m) (L222)
 * The arrays (XY 90°, ORTF 17 cm / 110°, spaced omnis 0.5 m, M/S with its
 * width), the arena's main ambience and spots and the commentary station
 * are drawn on the lesson's own pages. Immersive arrays stay in words (owner
 * decision D7-5, default: no new preset in the shared array tool).
 */
import type { DocumentedZone, MicPose, Provenance } from '../../engine/model/types.ts';
import { engineAim, p2, toEngine, type P2 } from '../shared/sports/venuePlan.ts';
import { PC, crowdP } from '../shared/sports/practiceScenes.ts';
import { sportPlan } from '../shared/sports/sportPlans.ts';
import type { CoverageTask, PlanZone, SportMic, SportSetup } from '../shared/sports/sportsPages';
import type { MsSource } from '../shared/sports/arenaPages';
import { aimRel } from '../shared/sports/venuePlan.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const pose = (at: P2, h: number, to: P2, hTo: number): MicPose => ({ p: toEngine(at, h), ...engineAim(at, h, to, hTo) });
const box = (c: P2, dx: number, dz: number, h0: number, h1: number) => ({ min: { x: (c.x - dx) * 1000, y: -h1 * 1000, z: (-c.y - dz) * 1000 }, max: { x: (c.x + dx) * 1000, y: -h0 * 1000, z: (-c.y + dz) * 1000 }, prov: ill('round the mark in its footprint (the lab’s box)') });

export const B17_ZONES: DocumentedZone[] = [
  {
    id: 'cc.amb.S',
    label: 'The audience pair at S',
    band: 'The pair’s centre at S, about 2 m behind U2: the capsules about 1.5 m up, aimed at U2 — across the useful audience region, not at the nearest person.',
    kind: 'trial',
    src: 'LESSON-B17',
    quote: 'stereo center S=(0,4), capsule height 1.5 m, aimed toward U2 (L222)',
    refSurface: 'tU2',
    side: 'either',
    distance: { min: 1700, max: 2300 },
    aimAt: { surface: 'tU2', r: 300, prov: ill('the axis on U2 within about 0.3 m (the lab’s tolerance)') },
    box: box(PC.S, 0.6, 0.4, 1.2, 1.8),
    requires: { micTypeIds: ['arrCard'] },
    start: pose(PC.S, PC.hS, PC.U2, PC.hU),
    tendency: 'A broad, stable view of the audience: the venue’s scale and its balance against the PA — fewer single voices.',
    checks: ['In its footprint, no seat or aisle blocked', 'Left and right named from the viewpoint', 'Checked in mono'],
  },
  {
    id: 'cc.amb.Sc',
    label: 'The closer viewpoint S′',
    band: 'The pair moved 1 m closer to U2, at S′ — only if the footprint is clear; the audience and the source unchanged.',
    kind: 'trial',
    src: 'LESSON-B17',
    quote: 'Move only the pair center to a second approved point 1 m closer to U2, if clear (L227)',
    refSurface: 'tU2',
    side: 'either',
    distance: { min: 800, max: 1300 },
    aimAt: { surface: 'tU2', r: 300, prov: ill('the axis on U2 within about 0.3 m (the lab’s tolerance)') },
    box: box(PC.Sclose, 0.6, 0.18, 1.2, 1.8),
    requires: { micTypeIds: ['arrCard'] },
    start: pose(PC.Sclose, PC.hS, PC.U2, PC.hU),
    tendency: 'A local sector: nearby voices, seat noise and movement come forward against the venue’s scale.',
    checks: ['Only if the footprint is clear', 'The ranges logged again', 'Compared with S at matched loudness'],
  },
  {
    id: 'cc.act.D',
    label: 'The action mic at D',
    band: 'The action mic at D, about 1 m up, aimed at A, 2 m away — in its own footprint, beside the action.',
    kind: 'trial',
    src: 'LESSON-B17',
    quote: 'Action microphone D=(2,0), height 1 m, aimed at A (L222)',
    refSurface: 'tA',
    side: 'either',
    distance: { min: 1700, max: 2300 },
    // D faces A side-on to the target's plane (a disc test cannot see it): the angle to A instead.
    aim: { maxOffAxis: 8, prov: ill('the axis on A within about 8° (the lab’s tolerance)') },
    box: box(PC.D, 0.35, 0.5, 0.7, 1.3),
    requires: { micTypeIds: ['shotgunShort'] },
    start: pose(PC.D, PC.hD, PC.A, PC.hA),
    tendency: 'The selected action in detail — and the same clap reaches the audience pair later.',
    checks: ['In its own footprint', 'Solo and with the pair', 'The arrival difference noted'],
  },
];

/* ═════════ the plan setups ═════════ */

const m = (id: string, kind: SportMic['kind'], label: string, at: P2, h: number, aimAt: P2, aimH: number, pattern: SportMic['pattern'] = null): SportMic => ({ id, kind, label, at, h, aimAt, aimH, pattern });
export const MONO_S = m('mono', 'compact', 'mono audience mic', PC.S, PC.hS, PC.U2, PC.hU, 'cardioid');
export const XY_S = m('xy', 'xy', 'XY pair at S', PC.S, PC.hS, PC.U2, PC.hU, 'cardioid');
export const XY_SC = m('xyc', 'xy', 'XY pair at S′', PC.Sclose, PC.hS, PC.U2, PC.hU, 'cardioid');
export const MS_S = m('ms', 'ms', 'M/S pair at S', PC.S, PC.hS, PC.U2, PC.hU, 'cardioid');
export const ORTF_S = m('ortf', 'ortf', 'near-coincident pair at S', PC.S, PC.hS, PC.U2, PC.hU, 'cardioid');
export const AB_S = m('ab', 'ab', 'spaced pair at S', PC.S, PC.hS, PC.U2, PC.hU);
export const ACT_D = m('act', 'shotgun', 'action mic at D', PC.D, PC.hD, PC.A, PC.hA, 'shotgun');

const AR = sportPlan('arena');
const ctr = (id: string): P2 => {
  const r = AR.footprints.find((f) => f.id === id)!.rect;
  return p2((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
};

export const B17_SETUPS: SportSetup[] = [
  { id: 'su.one', role: 'ONE MIC', core: true, title: 'A mono audience mic at S', type: 'a small cardioid condenser on a stand', start: 'At S, about 2 m behind U2, the capsule about 1.5 m up, aimed across the audience at U2 — the simpler mono production.', line: 'A stable sense of the audience and the venue, with less spatial information; it carries the event when the action is lost.', mics: [MONO_S] },
  { id: 'su.two', role: 'TWO MICS', core: true, title: 'An XY pair at S', type: 'two small cardioids, coincident, about 90° apart, on one stand', start: 'The pair’s centre at S, 1.5 m up, its middle aimed at U2; left and right named from that viewpoint.', line: 'Width from level differences alone, so the mono sum stays solid — check the tone off the axis.', mics: [XY_S] },
  { id: 'su.close', role: 'CLOSE · LIVE', core: true, title: 'A local crowd spot at S′, 1 m closer', type: 'the same XY pair, moved to the closer viewpoint', start: 'Only the pair’s centre moves, 1 m closer to U2 — if the footprint is clear; the source action unchanged.', line: 'A specific audience sector: nearby voices and movement come forward. A spot adds to the main bed; it does not replace it.', mics: [XY_SC] },
  {
    id: 'su.far',
    role: 'FARTHER BACK · STUDIO',
    core: true,
    title: 'Arena: a main ambience plus two audience spots',
    type: 'a spaced main ambience pair on an approved platform, and two coincident spots at approved places',
    start: 'The main ambience from a useful permitted viewpoint over the bowl; the spots only where the main ambience leaves a real gap — each aimed across a region, not at one person.',
    line: 'The complete, stable audience picture: the main bed carries the event, the spots fill named gaps. More inputs, more overlap to manage.',
    mics: [m('main', 'ab', 'main ambience', ctr('main'), 2.4, p2(4, -9.7), 1.2), m('spL', 'xy', 'audience spot', ctr('spotL'), 1.6, p2(-2, -10), 1.2, 'cardioid'), m('spR', 'xy', 'audience spot', ctr('spotR'), 1.6, p2(30, -10), 1.2, 'cardioid')],
    scene: AR,
    box: { ...AR.frame, y1: AR.frame.y1 + 3.5 },
    noRange: true,
    noCloseUp: true,
  },
  { id: 'su.ms', role: 'ANOTHER START', core: false, title: 'Mid-Side at S', type: 'a forward cardioid over a side-facing figure-8', start: 'At S, the Mid aimed at U2, the Side’s positive lobe facing the side called left — decoded once, with a modest width.', line: 'The width set after the capture; the mono sum is the Mid alone, whatever the width.', mics: [MS_S] },
  { id: 'su.ortf', role: 'ANOTHER START', core: false, title: 'A near-coincident pair at S', type: 'two small cardioids, 17 cm apart, 110° between their axes', start: 'The same centre and aim as the XY pair; the source sequence unchanged.', line: 'Level and arrival differences together: a wider image — compare the centre and the mono colour.', mics: [ORTF_S] },
  { id: 'su.ab', role: 'ANOTHER START', core: false, title: 'Spaced omnis at S', type: 'two comparable omnis about 0.5 m apart', start: 'Centred on S, oriented as their design wants; the separation logged.', line: 'Spacious, with larger arrival differences — a shared announcement or action transient can colour in mono.', mics: [AB_S] },
  { id: 'su.act', role: 'ANOTHER START', core: false, title: 'The action mic at D', type: 'a short shotgun on a stand in its footprint', start: 'At D, about 1 m up, aimed at A, 2 m away — the action’s detail, on its own fader.', line: 'Detail of the selected action; the same clap reaches the audience pair later — listen to the pair and D together.', mics: [ACT_D] },
];

/* ═════════ the Placement Studio's zones ═════════ */

const K = ['compact', 'xy', 'ms', 'ortf', 'ab'] as const;
export const B17_PLACE: PlanZone[] = [
  { id: 'pz.S', label: 'At S, on U2', band: 'The pair’s centre at S, about 1.5 m up, aimed at U2.', tendency: 'The broad viewpoint: the audience’s scale and the venue’s tone.', rect: { x0: -0.5, y0: -4.45, x1: 0.5, y1: -3.55 }, h: [1.3, 1.7], target: 'U2', tol: 8, kinds: K },
  { id: 'pz.Sc', label: 'At S′, 1 m closer', band: 'The pair moved 1 m closer to U2.', tendency: 'A local sector: nearer voices, more seat and movement noise.', rect: { x0: -0.5, y0: -3.25, x1: 0.5, y1: -2.85 }, h: [1.3, 1.7], target: 'U2', tol: 8, kinds: K },
  { id: 'pz.low', label: 'Lower at S', band: 'The pair at S, about 1 m up, still aimed at U2.', tendency: 'Lower tends to bring the nearest voices forward and lets heads block the far ones.', rect: { x0: -0.5, y0: -4.45, x1: 0.5, y1: -3.55 }, h: [0.8, 1.2], target: 'U2', tol: 8, kinds: K },
];

/* ═════════ the coverage map ═════════ */

const zoneOf = (id: string, label: string, short: string, c: P2, r: number, ok: CoverageTask['ok'], handoff: string, why: string, tag: CoverageTask['tag'] = 'detail'): CoverageTask => ({ id, label, short, c, r, tag, ok, handoff, why });
export const B17_COVERAGE: CoverageTask[] = [
  zoneOf('cA', 'The action at A', 'ACTION', PC.A, 0.45, ['detail'], 'the audience pair, if D is lost', 'Two metres in front of D, on its axis: the selected action in detail.', 'ambience'),
  zoneOf('cAud', 'The audience, U1 to U3', 'AUDIENCE', PC.U2, 1.2, ['ambience'], 'a second spot only for a named gap', 'The pair at S carries the audience as a bed; no action mic is meant to pick out one spectator.', 'detail'),
  zoneOf('cFar', 'Past A, the far end of the action area', 'FAR END', crowdP(-1.2, 0), 0.4, ['detail', 'ambience'], 'the audience pair', 'Farther from D but still near its axis: detail if listening says so, else the pair.'),
];

/** The two-mic page: the action mic D and the audience pair (its mono sum)
 *  at S, the source moved 1 m along the action area either side of A. */
export const B17_OVERLAP = { a: ACT_D, b: MONO_S, path: [crowdP(1, 0), PC.A, crowdP(-1, 0)] } as const;

/** The M/S panel's sources, as seen from S (+ = left of the pair's front). */
export const B17_MS_SOURCES: MsSource[] = [
  { id: 'u3', label: 'U3, the left of the audience', short: 'U3', deg: aimRel(PC.S, PC.U3) },
  { id: 'u2', label: 'U2, the centre', short: 'U2', deg: aimRel(PC.S, PC.U2) },
  { id: 'u1', label: 'U1, the right of the audience', short: 'U1', deg: aimRel(PC.S, PC.U1) },
  { id: 'wide', label: 'A cheer well off to the left', short: 'WIDE L', deg: 60 },
];
