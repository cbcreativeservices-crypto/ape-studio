/**
 * B14 COURT, RACKET AND ICE SPORTS — the recommended starting points (charter
 * §2 layer 1) on the shared practice line (frame P). Research: docs/labs/
 * miking/court_ice/SOURCES.md and GEOMETRY_PROPOSAL.md §3; words from the
 * owner's lesson (source_text/B14-…; "L<n>" in comments only).
 *
 * ENGINE ZONES (frame: practiceModels.lineModel):
 *   cl.sg.B     a short shotgun at M, capsule about 1 m, aimed at B (8 m) —
 *               ONE MIC and the worked example (geometry §3, L182)
 *   cl.sg.A/C   the same on A (5 m) and C (11 m) (L182)
 *   cl.cmp.B    a compact directional (a small supercardioid, no tube) at M
 *               on B — the comparison of L182
 *   cl.sg2.B    a second approved position overlapping at B (L186; M2 a
 *               drawing default) — the TWO MICS pair with cl.sg.B
 * The boundary mic at M on the floor, the plant and the contact sensor are
 * drawn on the lesson's own pages (shared/sports/BoundaryArt).
 */
import type { DocumentedZone, MicPose, Provenance } from '../../engine/model/types.ts';
import { engineAim, p2, toEngine } from '../shared/sports/venuePlan.ts';
import { PL, PL_OUTSIDE } from '../shared/sports/practiceScenes.ts';
import { sportPlan } from '../shared/sports/sportPlans.ts';
import type { PlanZone, SportMic, SportSetup } from '../shared/sports/sportsPages';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const H = PL.h;
/** The ambience pair's place beside the mock line (m) — a drawing default. */
export const AMB_AT = p2(-5.5, -3.8);
export const AMB_H = 1.5;

const pose = (at: { x: number; y: number }, h: number, to: { x: number; y: number }, hTo: number): MicPose => ({ p: toEngine(at, h), ...engineAim(at, h, to, hTo) });
const box = (c: { x: number; y: number }, h0: number, h1: number) => ({ min: { x: (c.x - 1) * 1000, y: -h1 * 1000, z: -PL_OUTSIDE.y1 * 1000 }, max: { x: (c.x + 1) * 1000, y: -h0 * 1000, z: -PL_OUTSIDE.y0 * 1000 }, prov: ill('at the mark in the outside zone (the lab’s box)') });

function zone(o: { id: string; label: string; band: string; type: string; at: { x: number; y: number }; t: 'A' | 'B' | 'C'; dist: [number, number]; tendency: string; checks: string[]; quote: string; bandProv?: Provenance }): DocumentedZone {
  return {
    id: o.id,
    label: o.label,
    band: o.band,
    kind: 'trial',
    src: 'LESSON-B14',
    quote: o.quote,
    ...(o.bandProv ? { bandProv: o.bandProv } : {}),
    refSurface: `t${o.t}`,
    side: 'either',
    distance: { min: o.dist[0], max: o.dist[1] },
    aimAt: { surface: `t${o.t}`, r: 600, prov: ill('the axis on the source point within about 0.6 m (the lab’s tolerance)') },
    box: box(o.at, 0.7, 1.3),
    requires: { micTypeIds: [o.type] },
    start: pose(o.at, H, PL[o.t], H),
    tendency: o.tendency,
    checks: o.checks,
  };
}

export const B14_ZONES: DocumentedZone[] = [
  zone({ id: 'cl.sg.B', label: 'At M, a short shotgun on B', band: 'From the mic mark 3 m outside the line, about 8 m from B: the capsule about 1 m up, aimed at a gentle clap made at the same height.', type: 'shotgunShort', at: PL.M, t: 'B', dist: [7600, 8400], tendency: 'Selected action from a permitted place; its rejection varies with frequency and angle, and reflected arrivals change the tone.', checks: ['In the outside zone, out of every route', 'The axis on the contact height, not the floor', 'Gain unchanged between A, B and C'], quote: 'At M, set the shotgun and compact directional capsule about 1 m above the floor, aimed at a consistent gentle handclap made at the same height (L182)' }),
  zone({ id: 'cl.sg.A', label: 'At M, the shotgun on A', band: 'The same mark on A, 5 m away.', type: 'shotgunShort', at: PL.M, t: 'A', dist: [4600, 5400], tendency: 'The nearest point: the most detail against the room.', checks: ['The same gain as at B', 'Peaks logged before matching loudness', 'The capsule height logged'], quote: 'Repeat three claps at A, B and C with unchanged gain per mic (L182); 5 m, 8 m and 11 m (L180)' }),
  zone({ id: 'cl.sg.C', label: 'At M, the shotgun on C', band: 'The same mark on C, 11 m away.', type: 'shotgunShort', at: PL.M, t: 'C', dist: [10600, 11400], tendency: 'The far point: much more of the room — an end mic sounds close at one end and distant at the other.', checks: ['The same gain as at A', 'Room and spill noted', 'Tone noted separately from level'], quote: '5 m, 8 m and 11 m in plan view (L180)' }),
  zone({ id: 'cl.cmp.B', label: 'At M, a compact directional on B', band: 'A small supercardioid with no tube at the same mark, about 1 m up, on B — one mic at a time if the stands would crowd the zone.', type: 'scSupercard', at: PL.M, t: 'B', dist: [7600, 8400], tendency: 'Broader aim tolerance than many shotguns, and more spill: a workable compromise when the contact point moves.', checks: ['The same clap at the same height', 'The same gain sequence', 'Its rear pickup toward the room'], quote: 'Compact cardioid or supercardioid … broader aim tolerance than many shotguns; more spill (L33–L35)' }),
  zone({ id: 'cl.sg2.B', label: 'At M2, a second shotgun on B', band: 'A second approved position along the line, its axis on B too — overlapping coverage at B.', type: 'shotgunShort', at: PL.M2, t: 'B', dist: [8500, 9400], tendency: 'Two open mics on one point: listen solo and summed in mono for a hollow tone or a doubled attack.', checks: ['Solo, then summed in mono', 'Polarity checked as a diagnostic', 'A dominant feed chosen'], quote: 'Use a second approved mic position to create overlapping coverage at B, then at A and C (L186)', bandProv: ill('M2 is a drawing default (4 m along the line)') }),
];

const m = (id: string, kind: SportMic['kind'], label: string, at: { x: number; y: number }, h: number, aimAt: { x: number; y: number }, aimH: number, pattern: SportMic['pattern'] = null): SportMic => ({ id, kind, label, at, h, aimAt, aimH, pattern });
export const SG_B = m('sg', 'shotgun', 'short shotgun', PL.M, H, PL.B, H, 'shotgun');
export const SG2_B = m('sg2', 'shotgun', 'second shotgun', PL.M2, H, PL.B, H, 'shotgun');
export const CMP_B = m('cmp', 'compact', 'compact directional', PL.M, H, PL.B, H, 'supercardioid');
export const BND_M = m('bnd', 'boundary', 'boundary mic on the floor', PL.M, 0, PL.B, H);
export const AMB = m('amb', 'xy', 'ambience pair', AMB_AT, AMB_H, { x: 0, y: 5 }, AMB_H, 'cardioid');
const BB = sportPlan('basketball');
const END = BB.footprints.find((f) => f.id === 'end')!.rect;
const CORNER = BB.footprints.find((f) => f.id === 'corner')!.rect;

export const B14_SETUPS: SportSetup[] = [
  { id: 'su.one', role: 'ONE MIC', core: true, title: 'A short shotgun at M, aimed at B', type: 'a short shotgun in a shock mount, on a stand', start: 'At the mark 3 m outside the line, the capsule about 1 m up, aimed at B, 8 m away — at the contact height, not automatically at the floor.', line: 'Selected action from a permitted place; the tone and the rejection change with frequency and angle.', mics: [SG_B] },
  { id: 'su.two', role: 'TWO MICS', core: true, title: 'A second approved position overlapping at B', type: 'two short shotguns, at M and at M2', start: 'A second mic at another approved place along the line, both on B — then the overlap tried at A and C.', line: 'Wider coverage, but two open mics on one point: choose a dominant feed per sector, or hand off.', mics: [SG_B, SG2_B] },
  { id: 'su.close', role: 'CLOSE · LIVE', core: true, title: 'Basketball: an approved floor boundary beyond the clear band', type: 'a boundary mic on an approved surface, its cable beyond the band too', start: 'Only where the venue authorizes a protected place on a suitable surface — beyond the court’s clear band, out of every route.', line: 'Nearby bounce and shoe detail; it can pick up footfalls through the floor, and low profile is not safe for contact.', mics: [m('bc', 'boundary', 'floor boundary', { x: (END.x0 + END.x1) / 2, y: (END.y0 + END.y1) / 2 }, 0, { x: 24, y: 7.5 }, 0)], scene: BB, noRange: true },
  { id: 'su.far', role: 'FARTHER BACK · STUDIO', core: true, title: 'A fixed ambience pair', type: 'two small cardioids, crossed, on one stand', start: 'Beside the area, out of every route, aimed across it — the continuous venue perspective under every sector change.', line: 'Room and audience through changing action; less individual detail — check the stereo downmix.', mics: [AMB] },
  { id: 'su.cmp', role: 'ANOTHER START', core: false, title: 'A compact directional at M, on B', type: 'a small supercardioid, no tube', start: 'The same mark, about 1 m up, the same clap at B — compared one at a time with the shotgun.', line: 'Broader aim tolerance, more spill: a workable compromise when the contact point moves.', mics: [CMP_B] },
  { id: 'su.bnd', role: 'ANOTHER START', core: false, title: 'A boundary mic at M, on the floor', type: 'a boundary plate, its capsule at the surface', start: 'At M on its intended large hard surface; log the capsule height and the surface; compare with the directional mic on the same target.', line: 'Nearby airborne detail without the comb of a raised mic — and the floor’s own footfalls with it.', mics: [BND_M] },
  { id: 'su.plant', role: 'ANOTHER START', core: false, title: 'Basketball: an isolated plant near the basket', type: 'a small airborne mic on an isolated, approved fixture', start: 'Only with express approval, on a reviewed fixture installed by qualified venue people — never on the rim, the net or the breakaway.', line: 'Scoring detail at a repeatable place; rattles come through a rigid clamp.', mics: [m('pl', 'compact', 'basket plant', { x: 1.6, y: 7.5 }, 2.5, { x: 6, y: 7.5 }, 1.5, 'supercardioid')], scene: BB, noRange: true },
  { id: 'su.corner', role: 'ANOTHER START', core: false, title: 'Basketball: a short shotgun from an approved corner', type: 'a short shotgun beyond the clear band', start: 'From an approved corner beyond the band, aimed toward a named lane or the basket area.', line: 'An end sector: close at one end, distant at the other — hand off to the other sector.', mics: [m('cs', 'shotgun', 'corner shotgun', { x: (CORNER.x0 + CORNER.x1) / 2, y: (CORNER.y0 + CORNER.y1) / 2 }, 1.0, { x: 4, y: 7.5 }, 1.2, 'shotgun')], scene: BB, noRange: true },
];

const AT = (c: { x: number; y: number }) => ({ x0: c.x - 0.8, y0: c.y - 0.6, x1: c.x + 0.8, y1: c.y + 0.6 });
export const B14_PLACE: PlanZone[] = [
  { id: 'pz.B', label: 'At M, the shotgun on B', band: 'About 1 m up, on B, 8 m away.', tendency: 'The middle point: the reference for A and C.', rect: AT(PL.M), h: [0.8, 1.2], target: 'B', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.A', label: 'At M, the shotgun on A', band: 'On A, 5 m away.', tendency: 'The nearest: the most detail against the room.', rect: AT(PL.M), h: [0.8, 1.2], target: 'A', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.C', label: 'At M, the shotgun on C', band: 'On C, 11 m away.', tendency: 'The farthest: more of the room.', rect: AT(PL.M), h: [0.8, 1.2], target: 'C', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.M2', label: 'At M2, the shotgun on B', band: 'The second approved position, on B.', tendency: 'Overlap at B with the mic at M.', rect: AT(PL.M2), h: [0.8, 1.2], target: 'B', tol: 6, kinds: ['shotgun'] },
  { id: 'pz.cB', label: 'At M, the compact on B', band: 'About 1 m up, on B.', tendency: 'Broader tolerance, more spill.', rect: AT(PL.M), h: [0.8, 1.2], target: 'B', tol: 10, kinds: ['compact'] },
  { id: 'pz.cA', label: 'At M, the compact on A', band: 'About 1 m up, on A.', tendency: 'The near point with a broader pickup.', rect: AT(PL.M), h: [0.8, 1.2], target: 'A', tol: 10, kinds: ['compact'] },
  { id: 'pz.bB', label: 'At M, the boundary on the floor', band: 'At the surface, facing the source area.', tendency: 'No comb from the floor; the floor’s own vibration instead.', rect: AT(PL.M), h: [0, 0.02], target: 'B', tol: 30, kinds: ['boundary'] },
  { id: 'pz.bA', label: 'At M2, the boundary on the floor', band: 'At the second position, on the floor.', tendency: 'Another floor perspective.', rect: AT(PL.M2), h: [0, 0.02], target: 'B', tol: 40, kinds: ['boundary'] },
];

/** The overlap pair: the shotguns at M and M2, the source A → B → C. */
export const B14_OVERLAP = { a: SG_B, b: SG2_B, path: [PL.A, PL.B, PL.C] } as const;
