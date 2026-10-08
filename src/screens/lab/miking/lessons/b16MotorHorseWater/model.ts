/**
 * B16 MOTORSPORT, EQUESTRIAN AND AQUATIC EVENTS — the suggested starting
 * points (charter §2 layer 1) on the shared practice room (frame P,
 * practiceScenes.ts `practiceSmall`, the same scene as B15). Research:
 * docs/labs/miking/motorsport_equestrian_aquatic/SOURCES.md and
 * GEOMETRY_PROPOSAL.md §1–§3; words from the owner's lesson
 * (source_text/B16-…; "L<n>" in comments only).
 *
 * ENGINE ZONES (frame: practiceModels.smallModel):
 *   mo.sg.B    a short shotgun at M1, capsule 1 m, aimed across the walk at
 *              B (2 m) — the worked example (L264, L267)
 *   mo.obl     the same place, aimed obliquely along the walk toward A
 *              (L63: "aim obliquely along the selected segment")
 *   mo.cmp.B   a compact directional at M1 on B (L270)
 *   mo.far.B   the double range: M1 at (4, 2), 4 m from B (L269)
 *   mo.m2.B    the second mic at M2 on B — the pass-by pair (L271)
 * The circuit, the arena, the pool and the optional hydrophone's container
 * (D7-4 default: kept, as ONE optional ANOTHER START, every connector on the
 * dry side) are drawn on the lesson's own pages.
 */
import type { DocumentedZone, MicPose, Provenance } from '../../engine/model/types.ts';
import { engineAim, p2, toEngine, type P2 } from '../shared/sports/venuePlan.ts';
import { PS } from '../shared/sports/practiceScenes.ts';
import { containerPlan, sportPlan } from '../shared/sports/sportPlans.ts';
import { CONTAINER, withInsetRoom } from '../shared/sports/arenaPlans.ts';
import type { CoverageTask, PlanZone, SportMic, SportSetup } from '../shared/sports/sportsPages';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const H = PS.h;

const pose = (at: P2, h: number, to: P2, hTo: number): MicPose => ({ p: toEngine(at, h), ...engineAim(at, h, to, hTo) });
const box = (c: P2, h0: number, h1: number) => ({ min: { x: (c.x - 0.7) * 1000, y: -h1 * 1000, z: (-c.y - 0.6) * 1000 }, max: { x: (c.x + 0.7) * 1000, y: -h0 * 1000, z: (-c.y + 0.6) * 1000 }, prov: ill('round the mark in its equipment area (the lab’s box)') });

function zone(o: { id: string; label: string; band: string; type: string; at: P2; t: 'A' | 'B' | 'C'; dist: [number, number]; tendency: string; checks: string[]; quote: string }): DocumentedZone {
  return {
    id: o.id,
    label: o.label,
    band: o.band,
    kind: 'trial',
    src: 'LESSON-B16',
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

export const B16_ZONES: DocumentedZone[] = [
  zone({ id: 'mo.sg.B', label: 'At M1, a short shotgun across the walk', band: 'In equipment area M1, 2 m from B: the capsule about 1 m up, aimed straight across the walk at B.', type: 'shotgunShort', at: PS.M1, t: 'B', dist: [1750, 2250], tendency: 'A short, strong sector where the source passes in front; it leaves the axis quickly on either side.', checks: ['In its equipment area, out of the walking path', 'The gain fixed for the whole walk', 'Peaks logged before matching loudness'], quote: 'Capsule height 1 m; clap/speech reference height 1 m. M1 to B is 2 m horizontally (L264); keep the microphone fixed and aimed at B (L268)' }),
  zone({ id: 'mo.obl', label: 'At M1, aimed along the walk', band: 'The same place, aimed obliquely along the walk toward the approach at A, about 2.83 m.', type: 'shotgunShort', at: PS.M1, t: 'A', dist: [2550, 3100], tendency: 'The approach stays on the axis longer — and more of whatever lies beyond it.', checks: ['The same approved place', 'The new aim logged', 'What else now sits on the axis'], quote: 'Aim obliquely along the selected segment when that improves approach/departure continuity, or across it when a short contact region is the intended detail (L63)' }),
  zone({ id: 'mo.cmp.B', label: 'At M1, a compact directional on B', band: 'A small supercardioid, no tube, at the same place on B — the same walk, its own gain logged.', type: 'scSupercard', at: PS.M1, t: 'B', dist: [1750, 2250], tendency: 'Kinder to a moving source and to reflections, with more of the room.', checks: ['The same walk and phrase', 'Its own gain logged', 'Its rear pickup toward the room'], quote: 'If available, substitute compact directional for shotgun from M1 and repeat (L270)' }),
  zone({ id: 'mo.far.B', label: 'Twice as far, the shotgun on B', band: 'If a second approved point allows: the same aim at B from 4 m.', type: 'shotgunShort', at: PS.M1far, t: 'B', dist: [3750, 4250], tendency: 'About 6 dB less of the source against the same room; the walk changes its level less.', checks: ['The source action unchanged', 'Matched loudness before judging', 'The range not carried into a live course'], quote: 'If an approved second equipment point permits, double range to B and repeat (L269)' }),
  zone({ id: 'mo.m2.B', label: 'At M2, a second shotgun on B', band: 'The second equipment area, across the walk, also on B — compared solo and summed at A, B and C.', type: 'shotgunShort', at: PS.M2, t: 'B', dist: [1750, 2250], tendency: 'Two fixed mics on one moving source: the sum changes as the source walks.', checks: ['Solo, then summed in mono', 'Polarity tried as a diagnostic only', 'A dominant feed chosen'], quote: 'Compare M1 and M2 solo and summed at A/B/C (L271)' }),
];

/* ═════════ the plan setups ═════════ */

const m = (id: string, kind: SportMic['kind'], label: string, at: P2, h: number, aimAt: P2, aimH: number, pattern: SportMic['pattern'] = null): SportMic => ({ id, kind, label, at, h, aimAt, aimH, pattern });
export const SG_B = m('sg', 'shotgun', 'short shotgun at M1', PS.M1, H, PS.B, H, 'shotgun');
export const OBL_A = m('obl', 'shotgun', 'shotgun aimed along the walk', PS.M1, H, PS.A, H, 'shotgun');
export const SG2_B = m('sg2', 'shotgun', 'second shotgun at M2', PS.M2, H, PS.B, H, 'shotgun');
export const CMP_B = m('cmp', 'compact', 'compact directional at M1', PS.M1, H, PS.B, H, 'supercardioid');
export const FAR_B = m('far', 'shotgun', 'shotgun twice as far', PS.M1far, H, PS.B, H, 'shotgun');

const CIR = sportPlan('circuit');
const JMP = sportPlan('jumping');
const POOL = sportPlan('pool');
const TANK = containerPlan();
const ctr = (s: ReturnType<typeof sportPlan>, id: string): P2 => {
  const r = s.footprints.find((f) => f.id === id)!.rect;
  return p2((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
};
export const MEDIA_SG = m('pb', 'shotgun', 'pass-by shotgun', ctr(CIR, 'media'), 1.2, p2(12, 12), 0.6, 'shotgun');
export const HYDRO = m('hy', 'hydrophone', 'hydrophone in still water', CONTAINER.sensor, 0, p2(0.1, 0.4), 0);

export const B16_SETUPS: SportSetup[] = [
  { id: 'su.one', role: 'ONE MIC', core: true, title: 'Circuit: a fixed shotgun at the approved media point', type: 'a short shotgun in a shock mount and windshield, on a stand behind the barrier', start: 'At the organizer’s approved media point behind the barrier, aimed obliquely along the straight toward the approach — plus a stable ambience.', line: 'The approach and the pass in one sector; the nearest pass needs the most headroom. A barrier may screen the path.', mics: [MEDIA_SG], scene: CIR, noRange: true, noCloseUp: true },
  { id: 'su.two', role: 'TWO MICS', core: true, title: 'M1 and M2 on one walking source', type: 'two short shotguns, one in each equipment area', start: 'M1 and M2 either side of the walk, both on B; the source walks from A through B to C and back.', line: 'Placed as mirror images, they hear the walk in time; move one and the delay changes from point to point.', mics: [SG_B, SG2_B] },
  { id: 'su.close', role: 'CLOSE · LIVE', core: true, title: 'Jumping: a perimeter directional on a landing region', type: 'a short shotgun on an independent support outside the arena fence', start: 'At an assigned perimeter position, aimed at a selected landing region — beyond every approach, landing and recovery envelope.', line: 'Selected landings and hoof contact; soft footing and the horse’s turn change it — a wider feed keeps the round’s rhythm.', mics: [m('jp', 'shotgun', 'arena shotgun', ctr(JMP, 'p1'), 1.0, p2(52, 10), 0.3, 'shotgun')], scene: JMP, noRange: true, noCloseUp: true },
  { id: 'su.far', role: 'FARTHER BACK · STUDIO', core: true, title: 'Pool: a coincident stereo pair across the water', type: 'two small cardioids, crossed, on one stand at a dry approved place', start: 'At an approved dry position across the pool, aimed over the water — the steady venue view under every start, turn and splash.', line: 'The whole pool and its crowd; less detail of one lane. Check its orientation and the mono downmix.', mics: [m('ps', 'xy', 'stereo pair', ctr(POOL, 'far'), 1.6, p2(25, 12.5), 1.0, 'cardioid')], scene: POOL, noRange: true, noCloseUp: true },
  { id: 'su.hydro', role: 'ANOTHER START', core: false, title: 'An optional hydrophone in a container of still water', type: 'a hydrophone, its cable strain-relieved to the dry side', start: 'In a stable container with no people or animals in the water; the recorder and every connector on the dry side; one variable at a time.', line: 'Underwater pressure — a different medium and a different listening perspective, not the default aquatic mic.', mics: [HYDRO], scene: TANK, box: withInsetRoom(TANK.frame), noRange: true },
  { id: 'su.obl', role: 'ANOTHER START', core: false, title: 'M1 aimed along the walk', type: 'the same short shotgun, aimed toward the approach', start: 'From the same place, aimed obliquely along the walk toward A instead of across it at B.', line: 'A longer useful sector on the approach — and more of whatever lies beyond the path on the axis.', mics: [OBL_A] },
  { id: 'su.cmp', role: 'ANOTHER START', core: false, title: 'A compact directional at M1, on B', type: 'a small supercardioid, no tube', start: 'The same place and aim, the same walk — its own gain logged.', line: 'More forgiving of a moving source and of reflections off walls and water; more of the room.', mics: [CMP_B] },
  { id: 'su.dbl', role: 'ANOTHER START', core: false, title: 'Twice as far: the shotgun 4 m from B', type: 'the same short shotgun at the second approved point', start: 'If a second approved point allows, M1 at (4, 2): the same aim at B.', line: 'About 6 dB less source against the room, and a gentler change in level along the walk.', mics: [FAR_B] },
  { id: 'su.pool', role: 'ANOTHER START', core: false, title: 'Pool: a fixed directional at the start end', type: 'a short shotgun at an approved dry deck position', start: 'At an approved dry deck position beside the start end, aimed at the start region — clear of the blocks, the timing, the officials and every exit.', line: 'Starts and entry splashes; splash and whistles need headroom, and a farther approved place may be the steadier choice.', mics: [m('pd', 'shotgun', 'deck shotgun', ctr(POOL, 'side'), 1.2, p2(3, 6), 0.4, 'shotgun')], scene: POOL, noRange: true, noCloseUp: true },
];

/* ═════════ the Placement Studio's zones ═════════ */

const NEAR = { x0: PS.M1.x - 0.6, y0: PS.M1.y - 0.6, x1: PS.M1.x + 0.6, y1: PS.M1.y + 0.6 };
const FAR = { x0: PS.M1far.x - 0.6, y0: PS.M1far.y - 0.4, x1: PS.M1far.x + 0.6, y1: PS.M1far.y + 0.4 };
const K = ['shotgun', 'compact'] as const;
export const B16_PLACE: PlanZone[] = [
  { id: 'pz.B', label: 'At M1, across the walk', band: 'About 1 m up, aimed across the walk at B, 2 m away.', tendency: 'A short, strong sector where the source passes in front.', rect: NEAR, h: [0.9, 1.1], target: 'B', tol: 6, kinds: K },
  { id: 'pz.A', label: 'At M1, along the walk toward A', band: 'The same place, aimed obliquely toward the approach.', tendency: 'The approach stays on the axis longer.', rect: NEAR, h: [0.9, 1.1], target: 'A', tol: 6, kinds: K },
  { id: 'pz.C', label: 'At M1, along the walk toward C', band: 'Aimed the other way, toward the departure.', tendency: 'The departure stays on the axis longer instead.', rect: NEAR, h: [0.9, 1.1], target: 'C', tol: 6, kinds: K },
  { id: 'pz.far', label: 'Twice as far, on B', band: 'The second approved point, 4 m from B.', tendency: 'More room, and a gentler change in level along the walk.', rect: FAR, h: [0.9, 1.1], target: 'B', tol: 6, kinds: K },
];

/* ═════════ the coverage map ═════════ */

const zoneOf = (id: string, label: string, short: string, c: P2, r: number, ok: CoverageTask['ok'], handoff: string, why: string, tag: CoverageTask['tag'] = 'detail'): CoverageTask => ({ id, label, short, c, r, tag, ok, handoff, why });
export const B16_COVERAGE: CoverageTask[] = [
  zoneOf('cB', 'The closest point (B)', 'PASS', PS.B, 0.5, ['detail'], 'M2, then the wider fallback', 'The pass in front of M1: the strongest point — and the one that needs the most headroom.', 'ambience'),
  zoneOf('cA', 'The approach (A)', 'APPROACH', PS.A, 0.5, ['detail', 'ambience'], 'M1 aimed along the walk, or the wider fallback', 'Farther and off an across-the-walk axis: detail if the aim favours it, else the wider view.'),
  zoneOf('cC', 'The departure (C)', 'DEPART', PS.C, 0.5, ['detail', 'ambience'], 'M2, or the wider fallback', 'As far as the approach, on the other side of the axis — test it; do not assume it.'),
  zoneOf('cX', 'Past C, at the room’s end', 'END', p2(5.3, 0), 0.4, ['ambience', 'unavailable'], 'the wider fallback — and say the gap', 'Off every axis and beyond the walk: ambience only, or nothing. Never move a mic into the path to chase it.'),
];

/** The pass-by (TWO MICS page): the walk A → C, M1 and M2, the two aims. */
export const B16_PASS = { path: [PS.A, PS.C], m1: SG_B, far: FAR_B, m2: SG2_B, aims: { across: PS.B, oblique: PS.A } } as const;
