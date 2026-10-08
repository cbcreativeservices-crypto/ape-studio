/**
 * B15 TRACK, GYMNASTICS AND COMBAT SPORTS — the suggested starting points
 * (charter §2 layer 1) on the shared practice room (frame P,
 * practiceScenes.ts `practiceSmall`). Research: docs/labs/miking/
 * track_gym_combat/SOURCES.md and GEOMETRY_PROPOSAL.md §1–§4; words from the
 * owner's lesson (source_text/B15-…; "L<n>" in comments only).
 *
 * ENGINE ZONES (frame: practiceModels.smallModel):
 *   tg.sg.B    a short shotgun at M1, capsule 1 m, aimed at B (2 m) — ONE
 *              MIC and the worked example (L204, L207)
 *   tg.sg.A/C  the same on A and C (about 2.83 m, 45° either side) (L207)
 *   tg.cmp.B   a compact directional (a small supercardioid, no tube) at M1
 *              on B — the pattern comparison (L209)
 *   tg.far.B   the double range: M1 at (4, 2), 4 m from B (L209)
 *   tg.m2.B    the second mic at M2, on B — the overlap and fallback (L211)
 * The boundary trial (L210), the venue plans and the ringside, landing,
 * start and mat setups are drawn on the lesson's own pages.
 */
import type { DocumentedZone, MicPose, Provenance } from '../../engine/model/types.ts';
import { engineAim, p2, toEngine, type P2 } from '../shared/sports/venuePlan.ts';
import { PS } from '../shared/sports/practiceScenes.ts';
import { sportPlan } from '../shared/sports/sportPlans.ts';
import type { CoverageTask, PlanZone, SportMic, SportSetup } from '../shared/sports/sportsPages';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const H = PS.h;

const pose = (at: P2, h: number, to: P2, hTo: number): MicPose => ({ p: toEngine(at, h), ...engineAim(at, h, to, hTo) });
/** The engine box round a mark in its equipment area (mm). */
const box = (c: P2, h0: number, h1: number) => ({ min: { x: (c.x - 0.7) * 1000, y: -h1 * 1000, z: (-c.y - 0.6) * 1000 }, max: { x: (c.x + 0.7) * 1000, y: -h0 * 1000, z: (-c.y + 0.6) * 1000 }, prov: ill('round the mark in its equipment area (the lab’s box)') });

function zone(o: { id: string; label: string; band: string; type: string; at: P2; t: 'A' | 'B' | 'C'; dist: [number, number]; tendency: string; checks: string[]; quote: string }): DocumentedZone {
  return {
    id: o.id,
    label: o.label,
    band: o.band,
    kind: 'trial',
    src: 'LESSON-B15',
    quote: o.quote,
    refSurface: `t${o.t}`,
    side: 'either',
    distance: { min: o.dist[0], max: o.dist[1] },
    aimAt: { surface: `t${o.t}`, r: 300, prov: ill('the axis on the source point within about 0.3 m (the lab’s tolerance)') },
    box: box(o.at, 0.7, 1.3),
    requires: { micTypeIds: [o.type] },
    start: pose(o.at, H, PS[o.t], H),
    tendency: o.tendency,
    checks: o.checks,
  };
}

export const B15_ZONES: DocumentedZone[] = [
  zone({ id: 'tg.sg.B', label: 'At M1, a short shotgun on B', band: 'In equipment area M1, 2 m from B: the capsule about 1 m up, at the gentle clap’s height, aimed at B.', type: 'shotgunShort', at: PS.M1, t: 'B', dist: [1750, 2250], tendency: 'Detail from one fixed sector: the source in front is clear, the ends of the walk fall off its axis.', checks: ['In its equipment area, out of the walking path', 'Aimed at the source’s height, not the floor', 'Gain unchanged for A, B and C'], quote: 'At capsule height 1 m, aim M1 toward B (L204); three gentle claps at a marked source height of 1 m at A, B and C (L207)' }),
  zone({ id: 'tg.sg.A', label: 'At M1, the shotgun on A', band: 'The same place, re-aimed 45° to A, about 2.83 m away.', type: 'shotgunShort', at: PS.M1, t: 'A', dist: [2550, 3100], tendency: 'An end of the walk: farther, and a different angle — compare before re-aiming.', checks: ['The new aim logged', 'The same gain as at B', 'What else now sits on the axis'], quote: 'Horizontal ranges from M1 are 2 m to B and approximately 2.83 m to A/C (L204)' }),
  zone({ id: 'tg.sg.C', label: 'At M1, the shotgun on C', band: 'The same place, re-aimed 45° the other way to C, about 2.83 m.', type: 'shotgunShort', at: PS.M1, t: 'C', dist: [2550, 3100], tendency: 'The other end: as far as A, on the other side of the axis.', checks: ['The same gain as at B', 'Peaks logged before matching loudness', 'Tone noted apart from level'], quote: 'approximately 2.83 m to A/C (L204)' }),
  zone({ id: 'tg.cmp.B', label: 'At M1, a compact directional on B', band: 'A small supercardioid, no tube, at the same place on B — the same claps, its own gain logged.', type: 'scSupercard', at: PS.M1, t: 'B', dist: [1750, 2250], tendency: 'More forgiving of aim and of a moving source, more of the room — a fair comparison in a reflective arena.', checks: ['The same claps at the same height', 'Its own gain logged', 'Its rear pickup toward the room'], quote: 'Substitute a compact directional microphone for a shotgun at M1; repeat the same actions with model-appropriate gain logged (L209)' }),
  zone({ id: 'tg.far.B', label: 'Twice as far, the shotgun on B', band: 'If a second approved point allows: the same aim at B from 4 m — source and room unchanged.', type: 'shotgunShort', at: PS.M1far, t: 'B', dist: [3750, 4250], tendency: 'About 6 dB less of the source against the same room: less isolation, more of the space.', checks: ['The source and the room unchanged', 'Matched loudness before judging', 'The range not carried into a live sport'], quote: 'If a second approved equipment point permits, double the range to B with source and room unchanged (L209)' }),
  zone({ id: 'tg.m2.B', label: 'At M2, a second shotgun on B', band: 'The second equipment area, across the walk, also aimed at B — the overlap and the fallback.', type: 'shotgunShort', at: PS.M2, t: 'B', dist: [1750, 2250], tendency: 'Two open mics on one source: listen solo, summed in mono and in stereo before choosing a dominant feed.', checks: ['Solo, then summed in mono', 'Polarity tried as a diagnostic only', 'A dominant feed chosen'], quote: 'Use M1 and M2 to cover the same A/B/C actions. Listen solo, summed mono and stereo (L211)' }),
];

/* ═════════ the plan setups (the lesson's own STARTING SETUPS page) ═════════ */

const m = (id: string, kind: SportMic['kind'], label: string, at: P2, h: number, aimAt: P2, aimH: number, pattern: SportMic['pattern'] = null): SportMic => ({ id, kind, label, at, h, aimAt, aimH, pattern });
export const SG_B = m('sg', 'shotgun', 'short shotgun at M1', PS.M1, H, PS.B, H, 'shotgun');
export const SG2_B = m('sg2', 'shotgun', 'second shotgun at M2', PS.M2, H, PS.B, H, 'shotgun');
export const CMP_B = m('cmp', 'compact', 'compact directional at M1', PS.M1, H, PS.B, H, 'supercardioid');
export const FAR_B = m('far', 'shotgun', 'shotgun twice as far', PS.M1far, H, PS.B, H, 'shotgun');
export const BND_M1 = m('bnd', 'boundary', 'boundary mic on a hard floor', p2(PS.M1.x, PS.M1.y + 0.4), 0, PS.B, H);

const BOX = sportPlan('boxing');
const GYM = sportPlan('gymnastics');
const TRK = sportPlan('track');
const WRS = sportPlan('wrestling');
const ctr = (s: ReturnType<typeof sportPlan>, id: string): P2 => {
  const r = s.footprints.find((f) => f.id === id)!.rect;
  return p2((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
};

export const B15_SETUPS: SportSetup[] = [
  { id: 'su.one', role: 'ONE MIC', core: true, title: 'A short shotgun at M1, aimed at B', type: 'a short shotgun in a shock mount, on a stand', start: 'In equipment area M1, 2 m from B: the capsule about 1 m up, at the gentle clap’s height, aimed at B — the gain fixed for A, B and C.', line: 'One useful detail sector: clear in front, weaker and duller toward the ends — its rejection changes with frequency, it does not zoom.', mics: [SG_B] },
  { id: 'su.two', role: 'TWO MICS', core: true, title: 'M1 and M2 on the same actions', type: 'two short shotguns, one in each equipment area', start: 'A second mic at M2, across the walk, also on B — compared solo, summed in mono and in stereo; then a dominant feed and a wider fallback chosen.', line: 'Wider coverage of a moving source; two open mics on one action can double an attack or hollow the tone.', mics: [SG_B, SG2_B] },
  { id: 'su.close', role: 'CLOSE · LIVE', core: true, title: 'Boxing: a fixed directional at an assigned ringside place', type: 'a short shotgun on an independent stand, out of the ringside working space', start: 'At an assigned ringside position, aimed through a permitted path at the selected ring sector — at glove height, not at the platform’s base.', line: 'Gloves and footwork from one sector; the corners, the referee and the bell change it — the opposite sector or the ambience covers the gap.', mics: [m('rs', 'shotgun', 'ringside shotgun', ctr(BOX, 'rs1'), 1.3, p2(2.2, 3.05), 1.6, 'shotgun')], scene: BOX, noRange: true, noCloseUp: true },
  { id: 'su.far', role: 'FARTHER BACK · STUDIO', core: true, title: 'Gymnastics: a stable stereo view of the floor', type: 'two small cardioids, crossed, on one stand', start: 'At an approved perimeter position by the floor, aimed across it — the venue perspective that carries the routine through every gap.', line: 'The whole routine and the room, steady through every change; less isolated contact — and the routine’s music is part of it.', mics: [m('amb', 'xy', 'stereo pair by the floor', ctr(GYM, 'corner'), 1.6, p2(6, 6), 1.2, 'cardioid')], scene: GYM, noRange: true, noCloseUp: true },
  { id: 'su.bnd', role: 'ANOTHER START', core: false, title: 'A boundary mic on a hard floor beside M1', type: 'a boundary plate on a large, hard, approved surface', start: 'On a large solid surface outside the walking path, compared with the raised mic on the same gentle action — not on a soft mat.', line: 'A floor perspective of the gentle action; a soft mat does not give a boundary mic its large flat surface.', mics: [BND_M1] },
  { id: 'su.cmp', role: 'ANOTHER START', core: false, title: 'A compact directional at M1, on B', type: 'a small supercardioid, no tube', start: 'The same place and aim, the same claps — its own gain logged.', line: 'Broader aim tolerance, more spill: a workable choice when the action moves, especially in a reflective arena.', mics: [CMP_B] },
  { id: 'su.dbl', role: 'ANOTHER START', core: false, title: 'Twice as far: the shotgun 4 m from B', type: 'the same short shotgun at the second approved point', start: 'If a second approved point allows, M1 at (4, 2): the same aim at B, the source and the room unchanged.', line: 'About 6 dB less source against the same room — compare after matching loudness.', mics: [FAR_B] },
  { id: 'su.start', role: 'ANOTHER START', core: false, title: 'Track: a fixed mic beside the start', type: 'a short shotgun on a stand at an approved stationary position', start: 'Outside every athlete and official route, aimed at the selected start group — set and checked before the ready period.', line: 'The block departure for a moment; the runners leave its sector almost at once. A clear cue is a separate supplied feed.', mics: [m('st', 'shotgun', 'start shotgun', ctr(TRK, 'start'), 1.0, p2(-1.4, 3.6), 0.5, 'shotgun')], scene: TRK, noRange: true, noCloseUp: true },
  { id: 'su.land', role: 'ANOTHER START', core: false, title: 'Gymnastics: a landing view from beyond the recovery space', type: 'a short shotgun on an independent support', start: 'From beyond the whole landing and recovery envelope, aimed at the expected landing region — normal warm-up only, never repeated hard landings for sound.', line: 'The landing in front; a mic facing the mat’s edge hears a different balance.', mics: [m('ld', 'shotgun', 'landing shotgun', ctr(GYM, 'land'), 1.0, p2(36, 6), 0.4, 'shotgun')], scene: GYM, noRange: true, noCloseUp: true },
  { id: 'su.mat', role: 'ANOTHER START', core: false, title: 'Wrestling: a directional outside the mat’s whole envelope', type: 'a short shotgun on an independent stand', start: 'At an event-assigned place outside the mat and its open space, aimed at the central and edge action — tried at a standing and a low source height.', line: 'Contact texture from one side; bodies block it as they turn — a wider feed carries the gaps.', mics: [m('wr', 'shotgun', 'mat shotgun', ctr(WRS, 'p1'), 1.0, p2(0, 0), 0.6, 'shotgun')], scene: WRS, noRange: true, noCloseUp: true },
];

/* ═════════ the Placement Studio's zones (plan) ═════════ */

const NEAR = { x0: PS.M1.x - 0.6, y0: PS.M1.y - 0.6, x1: PS.M1.x + 0.6, y1: PS.M1.y + 0.6 };
const FAR = { x0: PS.M1far.x - 0.6, y0: PS.M1far.y - 0.4, x1: PS.M1far.x + 0.6, y1: PS.M1far.y + 0.4 };
const K = ['shotgun', 'compact'] as const;
export const B15_PLACE: PlanZone[] = [
  { id: 'pz.B', label: 'At M1, on B', band: 'About 1 m up, aimed at B, 2 m away.', tendency: 'The baseline: the clearest sector, at the clap’s height.', rect: NEAR, h: [0.9, 1.1], target: 'B', tol: 6, kinds: K },
  { id: 'pz.A', label: 'At M1, on A', band: 'Re-aimed 45° to A, about 2.83 m.', tendency: 'The end of the walk — farther and at a new angle.', rect: NEAR, h: [0.9, 1.1], target: 'A', tol: 6, kinds: K },
  { id: 'pz.C', label: 'At M1, on C', band: 'Re-aimed 45° the other way to C.', tendency: 'The other end, as far as A.', rect: NEAR, h: [0.9, 1.1], target: 'C', tol: 6, kinds: K },
  { id: 'pz.low', label: 'Lower at M1, on B', band: 'About 0.6 m up, aimed at B — for a low, gentle contact on the cushion.', tendency: 'More contact texture, perhaps — and the standing voice falls off the axis.', rect: NEAR, h: [0.5, 0.7], target: 'B', tol: 6, kinds: K },
  { id: 'pz.high', label: 'Higher at M1, on B', band: 'About 1.2 m up, aimed at B — for standing speech.', tendency: 'A broader, steadier view of the standing source.', rect: NEAR, h: [1.15, 1.3], target: 'B', tol: 6, kinds: K },
  { id: 'pz.far', label: 'Twice as far, on B', band: 'The second approved point, 4 m from B.', tendency: 'More of the room against the same source.', rect: FAR, h: [0.9, 1.1], target: 'B', tol: 6, kinds: K },
];

/* ═════════ the coverage map (L237) ═════════ */

const zoneOf = (id: string, label: string, short: string, c: P2, r: number, ok: CoverageTask['ok'], handoff: string, why: string, tag: CoverageTask['tag'] = 'detail'): CoverageTask => ({ id, label, short, c, r, tag, ok, handoff, why });
export const B15_COVERAGE: CoverageTask[] = [
  zoneOf('cB', 'Around B (2 m, on the axis)', 'B', PS.B, 0.5, ['detail'], 'M2, then the wider fallback', 'Straight in front of M1 at 2 m: the fair place to expect usable detail — confirmed by listening.', 'ambience'),
  zoneOf('cA', 'Around A (45° off the axis)', 'A', PS.A, 0.5, ['detail', 'ambience'], 'M2, or the wider fallback', 'Farther and 45° off a shotgun’s axis: weaker and duller — detail only if listening says so.'),
  zoneOf('cC', 'Around C (45° the other way)', 'C', PS.C, 0.5, ['detail', 'ambience'], 'M2, or the wider fallback', 'As far as A, on the other side of the axis — test it; do not assume it.'),
  zoneOf('cX', 'Past C, at the room’s end', 'END', p2(5.3, 0), 0.4, ['ambience', 'unavailable'], 'the wider fallback — and say the gap', 'Far off M1’s axis and beyond the walk: ambience only, or nothing. Never move a mic into the path to chase it.'),
];

/** The overlap pair (TWO MICS page): M2 at its place, M1 at its double-range
 *  place — unequal paths, so the delay changes as the source walks A → C. */
export const B15_OVERLAP = { a: SG2_B, b: FAR_B, path: [PS.A, PS.B, PS.C] } as const;
