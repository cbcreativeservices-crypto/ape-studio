/**
 * ARENA PLANS — the sports of Lab 7 part 2, group 3 (lab7-g6): track,
 * gymnastics, boxing, wrestling, judo (B15); a motorsport circuit, a jumping
 * arena, a pool (B16); an indoor arena with its seating bowl (B17). Frame P
 * (venuePlan.ts); registered beside group 2's in sportPlans.ts (`sportPlan`).
 * Pure; tested (test/mikingLab7SportsG3.test.ts).
 *
 * OWNER DECISION D7-2 (default): simple plan outlines at common dimensions.
 * Not one of these dimensions was read from a rulebook in the research pass
 * (track_gym_combat/ and motorsport_equestrian_aquatic/ SOURCES.md: "common,
 * not read") — every one is a DRAWING DEFAULT, listed in `defaults`, never
 * printed as a number. The one clearance READ from a rule (UWW 2026 Art. 4:
 * a 9 m wrestling area and a 1.50 m border — Medium, secondary) is drawn and
 * said ONLY as "typical clear zone — check your event's rules" (owner
 * decision D7-1, default), with no rulebook named. Judo: NO numbers (the
 * adopted rules were not retrievable) — its safety area is a drawing default
 * labelled "check the event plan".
 *
 * OWNER DECISION D7-3 (default): horses and vehicles as PLAN SILHOUETTES only
 * (`tokens`, drawn to scale by ArenaArt.tsx) — no detailed animal or car art,
 * no people drawn on a plan.
 */
import { CLEAR_ZONE_WORDS, bandAround, p2, type Badge, type KeepClear, type P2, type PlanRect, type Sector, type VenueScene } from './venuePlan.ts';

export type ArenaSportId = 'track' | 'gymnastics' | 'boxing' | 'wrestling' | 'judo' | 'circuit' | 'jumping' | 'pool' | 'arena';

const rect = (r: PlanRect): P2[] => [p2(r.x0, r.y0), p2(r.x1, r.y0), p2(r.x1, r.y1), p2(r.x0, r.y1)];
const line = (...pts: P2[]) => ({ pts });
function band(id: string, r: PlanRect, w: number, label: string, basis: KeepClear['basis'], note: string): KeepClear[] {
  return bandAround(r, w).map((poly, i) => ({ id: `${id}.${i}`, label, short: 'KEEP CLEAR', poly, basis, note }));
}
const crowd = (id: string, label: string, r: PlanRect, h = 3): Sector => ({ id, label, short: 'CROWD', kind: 'crowd', c: p2((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2), h, poly: rect(r) });
const pa = (id: string, c: P2, h = 8, label = 'a PA loudspeaker'): Sector => ({ id, label, short: 'PA', kind: 'pa', c, h, poly: rect({ x0: c.x - 0.8, y0: c.y - 0.8, x1: c.x + 0.8, y1: c.y + 0.8 }) });
/** A circle as a polygon (n sides, counter-clockwise). */
export function circlePts(c: P2, r: number, n = 40): P2[] {
  return Array.from({ length: n }, (_, i) => p2(c.x + r * Math.cos((2 * Math.PI * i) / n), c.y + r * Math.sin((2 * Math.PI * i) / n)));
}
/** A ring (annulus) as ONE polygon: the outer circle, a bridge, the inner
 *  circle the other way round — even-odd inside tests and a winding fill
 *  both leave the hole open. */
export function ringPts(c: P2, rIn: number, rOut: number, n = 40): P2[] {
  const o = circlePts(c, rOut, n);
  const i = circlePts(c, rIn, n).reverse();
  return [...o, o[0], i[i.length - 1], ...i];
}
const noAttach = (id: string, p: P2, label: string): Badge => ({ id, label, short: 'NO ATTACHING', p, kind: 'noAttach' });
const approval = (id: string, p: P2, label: string): Badge => ({ id, label, short: 'APPROVAL ONLY', p, kind: 'approvalOnly' });

/* ── B15: track, gymnastics, combat ── */

function track(): VenueScene {
  const lanes = 8;
  const lw = 1.22; // a common lane width — a drawing default (not read)
  const W = lanes * lw;
  const f = { x0: -4, y0: 0, x1: 46, y1: W };
  return {
    id: 'track',
    label: 'Track start',
    blurb: 'The start cue, the block departure, footfalls and the finish — a start mic hears the runners for only a moment before they leave it.',
    play: rect(f),
    surface: 'track',
    markings: [{ pts: rect(f), closed: true }, ...Array.from({ length: lanes - 1 }, (_, i) => line(p2(f.x0, (i + 1) * lw), p2(f.x1, (i + 1) * lw))), line(p2(0, 0), p2(0, W))],
    keepClear: [
      { id: 'start', label: 'the start area: blocks, the start group and the starter', short: 'KEEP CLEAR', poly: rect({ x0: -9, y0: -1.2, x1: -4, y1: W + 1.2 }), basis: 'drawing', note: 'Behind the line: the blocks, the athletes in their warm-up and the start group. Nothing is set or moved there during the ready period — and the start equipment and its loudspeakers are never touched for audio.' },
      ...band('lanes', f, 1.2, 'the margin along the lanes', 'drawing', 'A margin along the lanes: no stand leg, cable loop or windshield reaches toward a runner.').slice(0, 2),
    ],
    routes: [
      { id: 'starter', label: 'the starter’s and officials’ route', short: 'OFFICIALS', pts: [p2(-8, -2.4), p2(6, -2.4)], kind: 'officials' },
      { id: 'med', label: 'the medical route', short: 'MEDICAL', pts: [p2(30, -6), p2(30, -1.4)], kind: 'medical' },
      { id: 'rail', label: 'the tracking camera’s rail', short: 'CAMERA RAIL', pts: [p2(-2, W + 2.6), p2(46, W + 2.6)], kind: 'crew' },
    ],
    footprints: [
      { id: 'start', label: 'an approved stationary position beside the start', short: 'APPROVED', rect: { x0: -8.5, y0: -5.2, x1: -5.5, y1: -3.4 } },
      { id: 'seg', label: 'an approved perimeter position along the straight', short: 'APPROVED', rect: { x0: 17, y0: -5.2, x1: 21, y1: -3.4 } },
    ],
    cameras: [{ id: 'cam', label: 'the start camera', p: p2(9, -7), dirDeg: 64, halfDeg: 20, reach: 15 }],
    sectors: [crowd('cr.far', 'the crowd across the track', { x0: -6, y0: W + 5, x1: 46, y1: W + 10 }), pa('pa1', p2(20, W + 4.2))],
    targets: [],
    marks: [],
    badges: [noAttach('blocks', p2(-1.2, W / 2), 'the blocks, the start system and its lane loudspeakers'), noAttach('timing', p2(44, -0.6), 'the timing and finish equipment')],
    barriers: [],
    frame: { x0: -11, y0: -9, x1: 48, y1: W + 12 },
    defaults: ['lane width 1.22 m', 'eight lanes', 'straight length', 'start area', 'margin', 'routes', 'footprints', 'camera', 'crowd', 'PA'],
  };
}

function gymnastics(): VenueScene {
  const F = 12; // a common floor-exercise square — a drawing default (not read)
  const f = { x0: 0, y0: 0, x1: F, y1: F };
  const run = { x0: 15, y0: 5.5, x1: 31, y1: 6.5 };
  const mat = { x0: 33, y0: 3.5, x1: 39, y1: 8.5 };
  return {
    id: 'gymnastics',
    label: 'Gymnastics',
    blurb: 'Run-up, board, hands on the table, the landing and the routine’s music — separate contributors; the apparatus carries its own rattles.',
    play: rect(f),
    surface: 'mat',
    markings: [{ pts: rect(f), closed: true }, { pts: rect(run), closed: true }, { pts: rect({ x0: 31.6, y0: 5.4, x1: 32.6, y1: 6.6 }), closed: true }, { pts: rect(mat), closed: true }],
    keepClear: [
      ...band('border', f, 1, 'the floor’s border', 'drawing', 'The border round the floor area, and room for a gymnast to step out: no stand or cable in it.'),
      { id: 'vault', label: 'the vault: run-up, board, table, landing and recovery', short: 'KEEP CLEAR', poly: rect({ x0: 14.5, y0: 2.5, x1: 41, y1: 9.5 }), basis: 'drawing', note: 'The whole run-up, the board, the table and its padding, the landing mats and the recovery space past them. A mic beyond all of it, never beside the table.' },
    ],
    routes: [
      { id: 'judges', label: 'the judges’ places', short: 'JUDGES', pts: [p2(2, -3), p2(10, -3)], kind: 'officials' },
      { id: 'med', label: 'the medical route', short: 'MEDICAL', pts: [p2(26, -2.5), p2(26, 1.6)], kind: 'medical' },
      { id: 'march', label: 'the gymnasts’ route', short: 'GYMNASTS', pts: [p2(13.5, 14), p2(42, 14)], kind: 'players' },
    ],
    footprints: [
      { id: 'land', label: 'an approved position beyond the landing and recovery space', short: 'APPROVED', rect: { x0: 42.5, y0: 5, x1: 44.5, y1: 7 } },
      { id: 'corner', label: 'an approved perimeter position by the floor', short: 'APPROVED', rect: { x0: -3.6, y0: -3.6, x1: -1.6, y1: -1.6 } },
    ],
    cameras: [{ id: 'cam', label: 'a camera platform', p: p2(36, 13), dirDeg: 150, halfDeg: 20, reach: 9 }],
    sectors: [crowd('cr', 'the crowd', { x0: -2, y0: 17, x1: 44, y1: 21 }), pa('pa1', p2(14, 16.3), 8, 'the routine-music loudspeaker')],
    targets: [],
    marks: [],
    badges: [noAttach('table', p2(32.1, 6), 'the vault table, its board and its safety collar'), approval('app', p2(6, -1.2), 'the apparatus and its supports')],
    barriers: [],
    frame: { x0: -5, y0: -5, x1: 46, y1: 22 },
    defaults: ['12 × 12 m floor', 'border', 'run-up length', 'table', 'landing mats', 'recovery space', 'routes', 'footprints', 'camera', 'crowd', 'music loudspeaker'],
  };
}

function boxing(): VenueScene {
  const R = 6.1; // a common ring size inside the ropes — a drawing default (not read)
  const ring = { x0: 0, y0: 0, x1: R, y1: R };
  const apron = { x0: -0.6, y0: -0.6, x1: R + 0.6, y1: R + 0.6 };
  return {
    id: 'boxing',
    label: 'Boxing ring',
    blurb: 'Gloves, footwork, ropes and canvas, the officials’ cues — the bell and the PA can peak louder than the detail you want.',
    play: rect(ring),
    surface: 'canvas',
    markings: [],
    keepClear: [
      ...bandAround(ring, 0.6).map((poly, i) => ({ id: `apron.${i}`, label: 'the apron', short: 'KEEP CLEAR', poly, basis: 'drawing' as const, note: 'The apron and the corners are the seconds’, the officials’ and the medical team’s — not spare audio space.' })),
      ...band('ringside', apron, 1.4, 'the ringside working space', 'drawing', 'Steps, judges’ views, towels, water, cleaning and medical access all live here.'),
    ],
    routes: [
      { id: 'red', label: 'a corner team’s route to its corner', short: 'CORNER', pts: [p2(-4, -4), p2(-0.8, -0.8)], kind: 'bench' },
      { id: 'blue', label: 'a corner team’s route to its corner', short: 'CORNER', pts: [p2(R + 4, R + 4), p2(R + 0.8, R + 0.8)], kind: 'bench' },
      { id: 'med', label: 'the medical route and the steps', short: 'MEDICAL', pts: [p2(R + 4.2, -1), p2(R + 0.8, 1.2)], kind: 'medical' },
      { id: 'judges', label: 'the judges’ places', short: 'JUDGES', pts: [p2(1, -2.6), p2(R - 1, -2.6)], kind: 'officials' },
    ],
    footprints: [
      { id: 'rs1', label: 'an assigned ringside position', short: 'APPROVED', rect: { x0: -4.4, y0: 2.2, x1: -2.8, y1: 3.9 } },
      { id: 'rs2', label: 'an assigned ringside position, opposite side', short: 'APPROVED', rect: { x0: R + 2.8, y0: 2.2, x1: R + 4.4, y1: 3.9 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(R / 2, -6.2), dirDeg: 0, halfDeg: 26, reach: 9 }],
    sectors: [crowd('cr.a', 'the crowd', { x0: -6, y0: R + 3.5, x1: R + 6, y1: R + 6.5 }), crowd('cr.b', 'the crowd', { x0: -9, y0: -4, x1: -5.4, y1: R + 3 }), pa('pa1', p2(R / 2, R + 3))],
    targets: [],
    marks: [],
    badges: [noAttach('ropes', p2(R + 0.3, R / 2), 'the ropes, their tension and the corner pads'), noAttach('bell', p2(-1.6, -1.6), 'the bell'), approval('frame', p2(-0.3, R / 2), 'the ring’s structure')],
    barriers: [{ id: 'ropes', label: 'the ropes', pts: [...rect(ring), p2(0, 0)] }],
    frame: { x0: -10, y0: -8, x1: R + 7, y1: R + 7.5 },
    defaults: ['6.1 m ring', 'apron', 'ringside space', 'routes', 'footprints', 'camera', 'crowd', 'PA'],
  };
}

/** The wrestling area and its protection border (UWW 2026 Art. 4, Medium,
 *  secondary): a 9 m area, a 1.50 m border — the one rule clearance here. */
export const WRESTLING = { r: 4.5, border: 1.5 } as const;

function wrestling(): VenueScene {
  const c = p2(0, 0);
  const { r, border } = WRESTLING;
  return {
    id: 'wrestling',
    label: 'Wrestling mat',
    blurb: 'Feet, grips, mat contact and the referee — quiet sounds with strong transients, and bodies that block one mic and then another.',
    play: circlePts(c, r),
    surface: 'mat',
    markings: [{ pts: [], circle: { c, r: r - 1 } }, { pts: [], circle: { c, r: 0.5 } }],
    keepClear: [
      { id: 'protect', label: 'the protection border', short: 'KEEP CLEAR', poly: ringPts(c, r, r + border), basis: 'rule', note: `A ${CLEAR_ZONE_WORDS}: about 9 m across for the wrestling area, with about 1.5 m of protection border round it at top events. The action can carry on into the border before a stop — it is never a mic strip.` },
      { id: 'open', label: 'the open space round the mat', short: 'KEEP CLEAR', poly: ringPts(c, r + border, r + border + 1.5), basis: 'drawing', note: 'Open space round the whole mat: officials, coaches and the medical team move through it.' },
    ],
    routes: [
      { id: 'coachA', label: 'a coach’s corner', short: 'COACH', pts: [p2(-7.6, -5.2), p2(-6.2, -4.2)], kind: 'bench' },
      { id: 'table', label: 'the officials’ table', short: 'OFFICIALS', pts: [p2(-2.4, -8.6), p2(2.4, -8.6)], kind: 'officials' },
      { id: 'med', label: 'the medical route', short: 'MEDICAL', pts: [p2(8.8, -2), p2(7.6, -1)], kind: 'medical' },
    ],
    footprints: [
      { id: 'p1', label: 'an assigned position outside the mat and its open space', short: 'APPROVED', rect: { x0: -1, y0: 7.8, x1: 1, y1: 9.4 } },
      { id: 'p2', label: 'an assigned position, another side', short: 'APPROVED', rect: { x0: 7.8, y0: 3.6, x1: 9.4, y1: 5.6 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(-6, -10), dirDeg: -30, halfDeg: 24, reach: 9 }],
    sectors: [crowd('cr', 'the crowd', { x0: -12, y0: 10.6, x1: 12, y1: 13.6 })],
    targets: [],
    marks: [],
    badges: [noAttach('mat', p2(-r + 0.4, 0), 'the mat and its joints')],
    barriers: [],
    frame: { x0: -12.5, y0: -12, x1: 12.5, y1: 14.2 },
    defaults: ['open space width', 'passivity marking', 'routes', 'footprints', 'camera', 'crowd'],
  };
}

function judo(): VenueScene {
  const S = 8; // a drawing default — no judo number is asserted (rules not retrievable)
  const f = { x0: 0, y0: 0, x1: S, y1: S };
  return {
    id: 'judo',
    label: 'Judo',
    blurb: 'Grips, throws and landings on the tatami — the same independent-perimeter idea as wrestling, checked against judo’s own layout.',
    play: rect(f),
    surface: 'mat',
    markings: [{ pts: rect(f), closed: true }],
    keepClear: band('safety', f, 3, 'the safety area', 'drawing', 'The safety area round the competition area. Its size here is a drawing only — check the event plan; nothing hard is hidden at a tile joint and no cable runs under active tatami.'),
    routes: [
      { id: 'ref', label: 'the referees’ and judges’ places', short: 'OFFICIALS', pts: [p2(-2.6, -3.6), p2(-3.6, -2.6)], kind: 'officials' },
      { id: 'med', label: 'the medical route', short: 'MEDICAL', pts: [p2(S + 5.5, S / 2), p2(S + 3.4, S / 2)], kind: 'medical' },
    ],
    footprints: [
      { id: 'p1', label: 'an assigned position beyond the safety area', short: 'APPROVED', rect: { x0: S / 2 - 1, y0: -5.4, x1: S / 2 + 1, y1: -3.6 } },
      { id: 'p2', label: 'an assigned position, another side', short: 'APPROVED', rect: { x0: -5.4, y0: S - 2, x1: -3.6, y1: S } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(S + 5, -5), dirDeg: 45, halfDeg: 24, reach: 9 }],
    sectors: [crowd('cr', 'the crowd', { x0: -6, y0: S + 5, x1: S + 6, y1: S + 8 })],
    targets: [],
    marks: [],
    badges: [noAttach('tatami', p2(S + 0.3, 1), 'the tatami, its joints and its edges')],
    barriers: [],
    frame: { x0: -7, y0: -7.5, x1: S + 7, y1: S + 8.6 },
    defaults: ['competition area size', 'safety area width', 'routes', 'footprints', 'camera', 'crowd'],
  };
}

/* ── B16: motorsport, equestrian, aquatic ── */

/** The circuit's centreline: a straight, then a left-hand bend. */
const CIRCUIT_LINE: P2[] = [p2(-10, 12), p2(40, 12), ...Array.from({ length: 9 }, (_, i) => {
  const a = (-90 + (i + 1) * 7.5) * (Math.PI / 180);
  return p2(40 + 30 * Math.cos(a), 42 + 30 * Math.sin(a));
})];
function offsetLine(pts: readonly P2[], d: number): P2[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const l = Math.hypot(tx, ty) || 1;
    return p2(p.x - (ty / l) * d, p.y + (tx / l) * d);
  });
}
export const CIRCUIT_PATH: readonly P2[] = CIRCUIT_LINE;

function circuit(): VenueScene {
  // Outside the left-hand bend is the near side (−y): the run-off, then the barrier.
  const near = offsetLine(CIRCUIT_LINE, -6);
  const far = offsetLine(CIRCUIT_LINE, 6);
  const fence = offsetLine(CIRCUIT_LINE, -14);
  const inside = offsetLine(CIRCUIT_LINE, 9);
  return {
    id: 'circuit',
    label: 'Circuit',
    blurb: 'Acceleration, braking, the corner and the departure — one mic hears the distance, the angle and the engine’s state all changing together.',
    play: [...near, ...far.slice().reverse()],
    surface: 'asphalt',
    markings: [{ pts: near }, { pts: far }],
    keepClear: [
      { id: 'runoff', label: 'the run-off outside the bend', short: 'KEEP CLEAR', poly: [...near, ...fence.slice().reverse()], basis: 'drawing', note: 'The run-off between the track and the barrier: where a car goes when it leaves the track, and the marshals’ working space. Nobody from audio stands in it, at any time.' },
      { id: 'inside', label: 'the verge inside the bend', short: 'KEEP CLEAR', poly: [...far, ...inside.slice().reverse()], basis: 'drawing', note: 'The verge inside the bend: part of the track’s safety space, never a mic place.' },
    ],
    routes: [
      { id: 'escape', label: 'the marshals’ escape route', short: 'MARSHALS', pts: [p2(22, -2.6), p2(22, -7.4)], kind: 'exit' },
      { id: 'med', label: 'the rescue and medical route', short: 'RESCUE', pts: [p2(-8, -2.8), p2(14, -2.8)], kind: 'medical' },
    ],
    footprints: [{ id: 'media', label: 'an approved media point behind the barrier', short: 'MEDIA POINT', rect: { x0: 31, y0: -6.2, x1: 37, y1: -3.4 } }],
    cameras: [{ id: 'cam', label: 'a trackside camera', p: p2(8, -5), dirDeg: -62, halfDeg: 18, reach: 28 }],
    sectors: [crowd('cr', 'the spectator bank', { x0: -8, y0: -15, x1: 50, y1: -9 }), pa('pa1', p2(44, -8.2), 6, 'the commentary loudspeaker')],
    targets: [],
    marks: [],
    badges: [noAttach('barrier', p2(46, -2), 'the safety barrier and the flag post')],
    barriers: [{ id: 'barrier', label: 'the safety barrier', pts: fence }],
    tokens: [
      { id: 'car1', kind: 'car', p: p2(4, 13.5), dirDeg: -90, label: 'a car on the straight' },
      { id: 'car2', kind: 'car', p: p2(60, 21), dirDeg: -45, label: 'a car in the bend' },
    ],
    frame: { x0: -12, y0: -16, x1: 84, y1: 46 },
    defaults: ['track width', 'bend radius', 'run-off', 'verge', 'barrier line', 'routes', 'media point', 'camera', 'spectator bank', 'commentary loudspeaker'],
  };
}

function jumping(): VenueScene {
  const L = 70;
  const W = 45; // a drawing default (not read)
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  const fences: P2[] = [p2(14, 12), p2(32, 9), p2(52, 14), p2(58, 32), p2(38, 36), p2(18, 32)];
  const fenceLine = (c: P2) => line(p2(c.x - 2, c.y), p2(c.x + 2, c.y));
  return {
    id: 'jumping',
    label: 'Jumping arena',
    blurb: 'Hoof rhythm, take-off, the landing and a rail touched — on soft footing, from outside the arena only; the arena is closed while a horse competes.',
    play: rect(f),
    surface: 'sand',
    markings: fences.map(fenceLine),
    keepClear: fences.map((c, i) => ({ id: `env.${i}`, label: 'a fence’s approach, landing and recovery', short: 'KEEP CLEAR', poly: rect({ x0: c.x - 3.2, y0: c.y - 6, x1: c.x + 3.2, y1: c.y + 6 }), basis: 'drawing' as const, note: 'Each fence’s approach, take-off, landing, refusal, run-out and recovery: nothing inside the arena, and nothing that changes a fence.' })),
    routes: [
      { id: 'gate', label: 'the in-gate and out-gate', short: 'GATE', pts: [p2(L - 6, -0.4), p2(L - 6, -6)], kind: 'exit' },
      { id: 'vet', label: 'the veterinary and medical route', short: 'VET · MEDICAL', pts: [p2(-0.4, W - 8), p2(-6, W - 8)], kind: 'medical' },
      { id: 'crew', label: 'the course crew’s route', short: 'COURSE CREW', pts: [p2(4, -2.6), p2(40, -2.6)], kind: 'crew' },
    ],
    footprints: [
      { id: 'p1', label: 'an assigned perimeter position outside the arena fence', short: 'APPROVED', rect: { x0: 46, y0: -5.4, x1: 50, y1: -3.4 } },
      { id: 'p2', label: 'an assigned perimeter position, the long side', short: 'APPROVED', rect: { x0: L + 3.4, y0: 28, x1: L + 5.4, y1: 32 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2, W + 7), dirDeg: 180, halfDeg: 32, reach: 30 }],
    sectors: [crowd('cr', 'the stands', { x0: 2, y0: W + 9, x1: L - 2, y1: W + 14 }), pa('pa1', p2(-4, W / 2), 6, 'the arena loudspeaker')],
    targets: [],
    marks: [],
    badges: [noAttach('fence', p2(52, 14), 'a fence, its cups and its rails')],
    barriers: [{ id: 'fence', label: 'the arena fence', pts: [...rect({ x0: -0.8, y0: -0.8, x1: L + 0.8, y1: W + 0.8 }), p2(-0.8, -0.8)] }],
    tokens: [{ id: 'horse', kind: 'horse', p: p2(46, 12), dirDeg: -80, label: 'a horse on the course' }],
    frame: { x0: -8, y0: -8, x1: L + 8, y1: W + 15 },
    defaults: ['70 × 45 m arena', 'course and fences', 'envelopes', 'gates', 'routes', 'footprints', 'camera', 'stands', 'loudspeaker'],
  };
}

function pool(): VenueScene {
  const L = 50;
  const W = 25; // a common pool size, 10 lanes — drawing defaults (not read)
  const lanes = 10;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  return {
    id: 'pool',
    label: 'Pool',
    blurb: 'Starts, the entry splash, strokes near the surface, turns and whistles — on a wet, reflective deck where the officiating systems come first.',
    play: rect(f),
    surface: 'water',
    markings: Array.from({ length: lanes - 1 }, (_, i) => line(p2(0.4, ((i + 1) * W) / lanes), p2(L - 0.4, ((i + 1) * W) / lanes))),
    keepClear: [
      { id: 'starts', label: 'the start end: blocks, officials and the swimmers’ access', short: 'KEEP CLEAR', poly: rect({ x0: -3.5, y0: -1, x1: 0, y1: W + 1 }), basis: 'drawing', note: 'The blocks, the start system, the timing and the officials: no stand, cable or mic — and no exposed cable on the deck at all.' },
      { id: 'turns', label: 'the turn end', short: 'KEEP CLEAR', poly: rect({ x0: L, y0: -1, x1: L + 3, y1: W + 1 }), basis: 'drawing', note: 'The turn end, its touch panels and the turn judges.' },
    ],
    routes: [
      { id: 'deck', label: 'the swimmers’ and officials’ deck route', short: 'DECK ROUTE', pts: [p2(2, -1.6), p2(L - 2, -1.6)], kind: 'officials' },
      { id: 'rescue', label: 'the rescue route and the pool exit', short: 'RESCUE', pts: [p2(L / 2, -0.4), p2(L / 2, -5.6)], kind: 'medical' },
    ],
    footprints: [
      { id: 'side', label: 'an approved dry deck position beside the start end', short: 'APPROVED · DRY', rect: { x0: 4, y0: -5.6, x1: 8, y1: -3.4 } },
      { id: 'far', label: 'an approved dry position, the far side', short: 'APPROVED · DRY', rect: { x0: 30, y0: W + 3.2, x1: 34, y1: W + 5.2 } },
    ],
    cameras: [{ id: 'cam', label: 'a camera at the start end', p: p2(-6, W + 4), dirDeg: -120, halfDeg: 22, reach: 20 }],
    sectors: [crowd('cr', 'the stands', { x0: 2, y0: W + 7, x1: L - 2, y1: W + 12 }), pa('pa1', p2(L / 2, W + 6.2))],
    targets: [],
    marks: [],
    badges: [noAttach('blocks', p2(-1.6, W / 2), 'the blocks, the start loudspeakers and the touch panels')],
    barriers: [],
    frame: { x0: -8, y0: -8, x1: L + 5, y1: W + 13 },
    defaults: ['50 × 25 m pool', '10 lanes', 'start and turn ends', 'deck routes', 'footprints', 'camera', 'stands', 'PA'],
  };
}

/** The hydrophone's container (B16's optional ANOTHER START, D7-4 default:
 *  kept) — a plan of a still-water container in a dry equipment area, every
 *  connector on the dry side. Drawing defaults throughout (never printed). */
export const CONTAINER = { tank: { x0: 0, y0: 0, x1: 1.2, y1: 0.8 }, dry: { x0: 1.6, y0: -0.4, x1: 2.8, y1: 1.2 }, sensor: p2(0.55, 0.4), depth: 0.25, water: 0.5 } as const;

function container(): VenueScene {
  return {
    id: 'container',
    label: 'Still-water container',
    blurb: 'A stable container of still water in a dry equipment area — no people or animals in the water; the recorder and every connector on the dry side.',
    play: rect(CONTAINER.tank),
    surface: 'water',
    markings: [{ pts: rect(CONTAINER.tank), closed: true }],
    keepClear: band('splash', CONTAINER.tank, 0.3, 'the splash zone round the container', 'drawing', 'No mains equipment, plug or connector here — only the sensor’s cable, secured, on its way to the dry side.'),
    routes: [{ id: 'cable', label: 'the sensor cable, strain-relieved, to the dry side', short: 'CABLE', pts: [p2(0.7, 0.4), p2(1.9, 0.4)], kind: 'crew' }],
    footprints: [{ id: 'dry', label: 'the dry equipment area', short: 'DRY SIDE', rect: CONTAINER.dry }],
    cameras: [],
    sectors: [],
    targets: [],
    marks: [],
    badges: [],
    barriers: [],
    frame: { x0: -0.6, y0: -0.7, x1: 3.1, y1: 1.5 },
    defaults: ['container size', 'water depth', 'sensor depth', 'dry area', 'cable route'],
  };
}

/* ── B17: the indoor arena ── */

function arena(): VenueScene {
  const L = 28;
  const W = 15;
  const f = { x0: 0, y0: 0, x1: L, y1: W };
  return {
    id: 'arena',
    label: 'Arena',
    blurb: 'A court inside a seating bowl: the action on the floor, the audience all round, the PA overhead and every camera’s frame — the complete picture.',
    play: rect(f),
    surface: 'court',
    markings: [{ pts: rect(f), closed: true }, line(p2(L / 2, 0), p2(L / 2, W)), { pts: [], circle: { c: p2(L / 2, W / 2), r: 1.8 } }],
    keepClear: band('band', f, 2, 'the clear band round the court', 'drawing', 'The clear band round the floor: benches, officials and players chasing a ball use it.'),
    routes: [
      { id: 'bench', label: 'the benches and the officials’ table', short: 'BENCH · TABLE', pts: [p2(L / 2 - 8, -2.8), p2(L / 2 + 8, -2.8)], kind: 'bench' },
      { id: 'tunnel', label: 'the players’ tunnel and the medical route', short: 'TUNNEL · MEDICAL', pts: [p2(L + 2.4, W / 2), p2(L + 6.2, W / 2)], kind: 'medical' },
      { id: 'aisle', label: 'a spectator aisle', short: 'AISLE', pts: [p2(-3.2, W + 3.2), p2(-6.4, W + 6.4)], kind: 'exit' },
    ],
    footprints: [
      { id: 'main', label: 'an approved platform for the main ambience array', short: 'MAIN ARRAY', rect: { x0: L / 2 - 1.5, y0: W + 7.6, x1: L / 2 + 1.5, y1: W + 8.8 } },
      { id: 'spotL', label: 'an approved audience-spot position', short: 'SPOT', rect: { x0: 2, y0: -7.2, x1: 4.4, y1: -6.2 } },
      { id: 'spotR', label: 'an approved audience-spot position, the other end', short: 'SPOT', rect: { x0: L - 4.4, y0: -7.2, x1: L - 2, y1: -6.2 } },
      { id: 'action', label: 'an approved action position beyond the band', short: 'ACTION', rect: { x0: -4.6, y0: -4.6, x1: -2.6, y1: -2.6 } },
      { id: 'comm', label: 'the commentary position', short: 'COMMENTARY', rect: { x0: L / 2 + 3, y0: -7.4, x1: L / 2 + 7, y1: -6.2 } },
    ],
    cameras: [{ id: 'cam', label: 'the main camera', p: p2(L / 2 - 3, -6.6), dirDeg: 0, halfDeg: 40, reach: 18 }],
    sectors: [
      crowd('cr.far', 'the far side of the bowl', { x0: -4, y0: W + 3.4, x1: L + 4, y1: W + 7.2 }),
      crowd('cr.near', 'the near side of the bowl', { x0: -4, y0: -11.6, x1: L + 4, y1: -7.8 }),
      crowd('cr.endL', 'one end of the bowl', { x0: -9.6, y0: -3, x1: -5.4, y1: W + 3 }),
      crowd('cr.endR', 'the other end of the bowl', { x0: L + 5.4, y0: -3, x1: L + 9.6, y1: W + 3 }),
      pa('pa1', p2(L / 2, W / 2), 12, 'the centre-hung PA cluster'),
    ],
    targets: [],
    marks: [],
    badges: [approval('b0', p2(1.2, W / 2), 'the baskets and their supports')],
    barriers: [],
    frame: { x0: -10.5, y0: -12.5, x1: L + 10.5, y1: W + 9.8 },
    defaults: ['court', 'clear band', 'bowl sectors', 'PA cluster', 'routes', 'footprints', 'camera'],
  };
}

export const ARENA_BUILD: Readonly<Record<ArenaSportId | 'container', () => VenueScene>> = { track, gymnastics, boxing, wrestling, judo, circuit, jumping, pool, arena, container };
export const TRACK_GYM_COMBAT: readonly ArenaSportId[] = ['track', 'gymnastics', 'boxing', 'wrestling', 'judo'];
export const MOTOR_HORSE_WATER: readonly ArenaSportId[] = ['circuit', 'jumping', 'pool'];

/** A view box with room on the right for a setup's corner close-up (the
 *  inset takes the top-right 38 % × 46 % of the display). */
export function withInsetRoom(r: PlanRect): PlanRect {
  const w = r.x1 - r.x0;
  const h = r.y1 - r.y0;
  // A wide plan gets the room above it (it sits low, under the box); a squarer one to its right.
  return w / h > 1.4 ? { ...r, y0: r.y0 - h * 0.08, y1: r.y1 + h } : { ...r, x1: r.x1 + w * 0.62 };
}
