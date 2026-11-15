/**
 * suggestSetups — the SUGGESTED SETUPS module's search (owner request
 * 2026-11-14: "3 suggested possible setups that have been calculated to be
 * better results … designs optimized for the user using the calculations of
 * the room they have"; plan agreed the same day, Downloads/2026-11-14_ROOM_
 * DESIGN_SUGGESTED_SETUPS_PLAN).
 *
 * PURE, like roomModel: no React. It invents no physics — every number is a
 * roomModel function the lab already prints (analyze → modes, modePressure,
 * the front-wall SBIR notch, stereoGeometry, earlyUntreatedWallReflections,
 * placementConflicts), and every warning threshold is the one suggest() uses.
 *
 * Three goals, each its own search over positions inside the learner's room:
 *   bass   the fewest length modes up to 150 Hz with the seat in a null or on
 *          a peak (the lab's own < 20 % / > 80 % zones); the desk may move
 *          with the chair; a sub flagged "mid-room" goes to a front corner.
 *   image  the imaging checks the Review page makes (center line, L/R match,
 *          side walls, 50–70°, tweeter height), then the fewest strong early
 *          wall reflections; equilateral, toe-in aimed at the ears.
 *   least  the fewest "!" then "▸" placement items, with the smallest total
 *          move; the desk never moves.
 * A setup is offered only when it beats the current layout on its own goal,
 * adds no new "!" item and no new placement problem, and stands at least
 * SETUP_MIN_DIFF_M from the setups before it. A goal with no such setup says
 * why in words — never a number it cannot stand behind.
 */
import {
  analyze,
  bounds,
  capLayoutHeights,
  clampInside,
  distToEdge,
  earlyUntreatedWallReflections,
  FIELD_RANGE_M,
  fmtHz,
  fmtLen,
  modePressure,
  placementConflicts,
  pointInPolygon,
  SBIR_MAX_HZ,
  surroundPosition,
  SYM_TOL,
  type Analysis,
  type Feature,
  type Layout,
  type Pt,
  type Room,
  type RoomDesign,
  type Speaker,
  type Tier,
  type Units,
} from './roomModel.ts';

export type SetupGoal = 'bass' | 'image' | 'least';

/** Length modes counted for the bass goal: up to 150 Hz, the same ceiling the
 *  lab's coincident-mode rule uses (above it the modes are dense). */
export const BASS_MAX_HZ = 150;
/** Two setups are "genuinely different" when the seat or a speaker stands at
 *  least this far apart (plan, agreed 2026-11-14). */
export const SETUP_MIN_DIFF_M = 0.25;
/** A speaker's baffle no nearer a wall than placementConflicts allows. */
const WALL_CLEAR_M = 0.2;
/** …and the woofer no nearer the FRONT wall than this (audio review
 *  2026-11-14): the cabinet's back sits a cabinet-depth closer, and a rear
 *  port needs the clearance its maker gives. */
export const FRONT_CLEAR_M = 0.35;
/** The search's dip and peak zones carry a MARGIN over the Review page's
 *  20 % / 80 % (audio review 2026-11-14): the seat counts as out of a mode's
 *  dip only above 30 % of its pressure and out of its peak only below 70 %,
 *  so no setup wins by a hair (0.134 → 0.224 is still a deep dip). */
export const DIP_BELOW = 0.3;
export const PEAK_ABOVE = 0.7;
/** The search grid, metres. */
const STEP_M = 0.05;
/** How many prefiltered candidates per goal get the full analysis. */
const FINALISTS = 36;
/** "Least change" moves the seat at most this far along the room. */
const LEAST_SEAT_RANGE_M = 0.3;

/* ─────────────────────────────── the flags ──────────────────────────────── */

/** The placement items suggest() raises, keyed — same thresholds. `check` is
 *  the Review page's "!", `try` its "▸". */
export type FlagKey = 'no-triangle' | 'lr-mismatch' | 'side-mismatch' | 'rear-wall' | 'length-mode' | 'off-center' | 'angle' | 'tweeter-height' | 'front-notch';
export const FLAG_LEVEL: Record<FlagKey, 'check' | 'try'> = {
  'no-triangle': 'check',
  'lr-mismatch': 'check',
  'side-mismatch': 'check',
  'rear-wall': 'check',
  'length-mode': 'check',
  'off-center': 'try',
  angle: 'try',
  'tweeter-height': 'try',
  'front-notch': 'try',
};
/** The same items as short names, for "Cleared: …" lines. */
export const FLAG_NAME: Record<FlagKey, string> = {
  'no-triangle': 'no stereo triangle (the seat is not in front of both speakers)',
  'lr-mismatch': 'left and right at different distances from your ears',
  'side-mismatch': 'side-wall distances that do not match',
  'rear-wall': 'seat within 1 m (3′ 3″) of the rear wall',
  'length-mode': 'seat in a null or on a peak of the first length mode',
  'off-center': 'seat off the room’s center line',
  angle: 'listening angle outside 50–70°',
  'tweeter-height': 'tweeters off ear height',
  'front-notch': 'front-wall bounce cancelling low bass at the seat',
};
const IMAGE_FLAGS: FlagKey[] = ['no-triangle', 'lr-mismatch', 'side-mismatch', 'off-center', 'angle', 'tweeter-height'];

/** suggest()'s front-wall band: between 0.4 and 1.4 m the bounce cancels
 *  in the low bass at the seat. */
const inFrontBand = (front: number) => front > 0.4 && front < 1.4;
/** …and what suggest() says IS worth testing: tight to the wall (under about
 *  0.5 m — the notch moves up, where directivity and ordinary panels tame it)
 *  or well away (over about 2 m). The bass goal scores against this, the
 *  stricter of the two, so "out of the band" by a centimetre never counts. */
export const frontWallOk = (front: number) => front < 0.5 || front > 2.0;

/* ─────────────────────────────── the metrics ────────────────────────────── */

export type BassHit = { n: number; f: number; zone: 'peak' | 'null' };

export type SetupMetrics = {
  rectangular: boolean;
  /** Length modes up to BASS_MAX_HZ and the ones whose null or peak the seat sits in. */
  bassModes: number;
  bassHits: BassHit[];
  /** The first length mode's pressure at the ears, 0..1 (null when there is none). */
  firstLengthP: number | null;
  /** Seat along the room from the front wall, % of the length. */
  seatPct: number;
  firstLength: { f: number; zone: 'peak' | 'null' | 'between' } | null;
  /** The lower of the L / R front-wall cancellations at the seat; null = none at or below SBIR_MAX_HZ. */
  frontNotchHz: number | null;
  /** Mean L / R distance from the front wall. */
  frontDist: number;
  stereo: Analysis['stereo'];
  earlyStrong: number;
  /** Every reflection inside 15 ms, strong or weak — what Explore's EARLY <15ms counts. */
  earlyAll: number;
  /** Early (< 15 ms) wall reflections that meet treatment. */
  treatedEarly: number;
  conflicts: string[];
  flags: FlagKey[];
};

export function setupMetrics(d: RoomDesign, a: Analysis = analyze(d)): SetupMetrics {
  const lay = d.layouts[d.active] ?? d.layouts[0];
  const b = a.bounds;
  const { L, W, H } = a.modalDims;
  const lis = lay.listener;
  const lengthModes = a.modes.filter((m) => m.kind === 'axial' && m.axis === 'L' && m.f <= BASS_MAX_HZ);
  const bassHits: BassHit[] = [];
  for (const m of lengthModes) {
    const p = modePressure(L, W, H, m, lis.y - b.minY, lis.x - b.minX, lis.earZ);
    if (p < DIP_BELOW) bassHits.push({ n: m.nx, f: m.f, zone: 'null' });
    else if (p > PEAK_ABOVE) bassHits.push({ n: m.nx, f: m.f, zone: 'peak' });
  }
  const zL = a.listenerZones.find((z) => z.mode.axis === 'L');
  const s = a.stereo;
  const front = (role: 'L' | 'R') => a.sbir.find((n) => n.speaker === role && n.surface === 'front wall');
  const nL = front('L');
  const nR = front('R');
  const notches = [nL, nR].filter((n): n is NonNullable<typeof n> => !!n && n.notchHz <= SBIR_MAX_HZ).map((n) => n.notchHz);
  const flags: FlagKey[] = [];
  if (s) {
    if (Math.abs(s.axisOffset) > 0.1) flags.push('off-center');
    if (s.pathDiff > SYM_TOL) flags.push('lr-mismatch');
    if (Math.abs(s.wallL.side - s.wallR.side) > 0.15) flags.push('side-mismatch');
    if (!s.inFront) flags.push('no-triangle');
    else if (s.angleDeg < 50 || s.angleDeg > 70) flags.push('angle');
    if (Math.abs(s.heightDiff) > 0.1) flags.push('tweeter-height');
    if (s.listenerRear < 1) flags.push('rear-wall');
    if ((inFrontBand(s.wallL.front) && nL) || (inFrontBand(s.wallR.front) && nR)) flags.push('front-notch');
  }
  if (zL && zL.zone !== 'between') flags.push('length-mode');
  const early = a.reflections.filter((r) => r.surface.kind === 'wall' && r.delayMs < 15);
  return {
    rectangular: a.rectangular,
    bassModes: lengthModes.length,
    bassHits,
    firstLengthP: zL ? zL.pressure : null,
    seatPct: b.length > 0 ? ((lis.y - b.minY) / b.length) * 100 : NaN,
    firstLength: zL ? { f: zL.mode.f, zone: zL.zone } : null,
    frontNotchHz: notches.length ? Math.min(...notches) : null,
    frontDist: s ? (s.wallL.front + s.wallR.front) / 2 : NaN,
    stereo: s,
    earlyStrong: earlyUntreatedWallReflections(a.reflections).length,
    earlyAll: a.reflections.filter((r) => r.delayMs < 15).length,
    treatedEarly: early.filter((r) => r.treatedBy).length,
    conflicts: placementConflicts(d, a).map((c) => c.text),
    flags,
  };
}

/** The first length mode in a dip or on a peak, with the search's margin. */
const firstModeBad = (m: SetupMetrics) => (m.firstLengthP != null && (m.firstLengthP < DIP_BELOW || m.firstLengthP > PEAK_ABOVE) ? 1 : 0);
/** The flags the SEARCH scores against: the Review page's, except that the
 *  first length mode counts until the seat is clear of it by the margin. */
const scoreFlags = (m: SetupMetrics): FlagKey[] => {
  const f = m.flags.filter((x) => x !== 'length-mode');
  return firstModeBad(m) ? [...f, 'length-mode'] : f;
};
const checks = (m: SetupMetrics) => m.flags.filter((f) => FLAG_LEVEL[f] === 'check');
const scoreChecks = (m: SetupMetrics) => scoreFlags(m).filter((f) => FLAG_LEVEL[f] === 'check');
const scoreTries = (m: SetupMetrics) => scoreFlags(m).filter((f) => FLAG_LEVEL[f] === 'try');
const tries = (m: SetupMetrics) => m.flags.filter((f) => FLAG_LEVEL[f] === 'try');

/** The goal's own score, lowest best, compared left to right. */
export function goalScore(goal: SetupGoal, m: SetupMetrics): number[] {
  if (goal === 'bass') return [firstModeBad(m), m.bassHits.filter((h) => h.zone === 'null').length, m.bassHits.filter((h) => h.zone === 'peak').length, m.stereo && !frontWallOk(m.frontDist) ? 1 : 0];
  if (goal === 'image') return [m.flags.filter((f) => IMAGE_FLAGS.includes(f)).length, m.earlyStrong];
  return [scoreChecks(m).length, scoreTries(m).length];
}
/** How many of goalScore's entries are the goal itself; the rest only rank. */
export const CORE_LEN: Record<SetupGoal, number> = { bass: 3, image: 2, least: 2 };

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (Math.abs(d) > 1e-9) return d;
  }
  return 0;
}

/* ────────────────────────────── the candidates ──────────────────────────── */

type Candidate = { lay: Layout; room: Room; deskId: string | null; deskFrom: Pt | null; deskTo: Pt | null; moved: number; pre: number[] };

/** The desk the learner sits at: the nearest desk within 1.5 m of the seat. */
export function seatDesk(room: Room, lis: Pt): Feature | null {
  let best: Feature | null = null;
  let bestD = 1.5;
  for (const f of room.features) {
    if (f.kind !== 'desk') continue;
    const dd = Math.hypot(f.x - lis.x, f.y - lis.y);
    if (dd <= bestD) {
      best = f;
      bestD = dd;
    }
  }
  return best;
}

const inside = (p: Pt, room: Room) => pointInPolygon(p, room.vertices);
function wallClear(p: Pt, room: Room): number {
  const v = room.vertices;
  let best = Infinity;
  for (let i = 0; i < v.length; i++) {
    const e = distToEdge(p, v, i);
    if (e.t >= 0 && e.t <= 1) best = Math.min(best, e.dist);
  }
  return best;
}
const inFootprint = (p: Pt, f: Feature) => Math.abs(p.x - f.x) <= f.w / 2 && Math.abs(p.y - f.y) <= f.d / 2;
function deskFits(room: Room, f: Feature): boolean {
  return [-1, 1].every((sx) => [-1, 1].every((sy) => inside({ x: f.x + (sx * f.w) / 2, y: f.y + (sy * f.d) / 2 }, room)));
}
function plainMoved(a: Layout, b: Layout): number {
  let m = Math.hypot(b.listener.x - a.listener.x, b.listener.y - a.listener.y);
  for (const s of b.speakers) {
    const p = a.speakers.find((q) => q.role === s.role);
    if (p) m += Math.hypot(s.x - p.x, s.y - p.y);
  }
  return m;
}
/** Seat or speaker separation between two layouts (the "different" rule). */
export function layoutSeparation(a: Layout, b: Layout): number {
  let m = Math.hypot(b.listener.x - a.listener.x, b.listener.y - a.listener.y);
  for (const s of b.speakers) {
    const p = a.speakers.find((q) => q.role === s.role);
    if (p) m = Math.max(m, Math.hypot(s.x - p.x, s.y - p.y));
  }
  return m;
}

/** The centre, C and surrounds follow a new L / R pair and seat. */
function withFollowers(room: Room, base: Layout, L: Speaker, R: Speaker, listener: Layout['listener'], sub?: Speaker): Layout {
  const two: Layout = { ...base, speakers: [L, R], listener };
  const speakers: Speaker[] = [L, R];
  for (const s of base.speakers) {
    if (s.role === 'L' || s.role === 'R') continue;
    if (s.role === 'SUB') speakers.push(sub ?? s);
    else if (s.role === 'C') speakers.push({ ...s, x: (L.x + R.x) / 2, y: (L.y + R.y) / 2, z: (L.z + R.z) / 2, toeDeg: 0 });
    else speakers.push({ ...s, ...surroundPosition(room, two, s.role as 'LS' | 'RS') });
  }
  return capLayoutHeights({ ...base, speakers, listener }, room);
}

/** A symmetric pair on the plan's center line: the seat at `lisY`, each
 *  speaker `dist` from the ears, `angle` the listening angle, tweeters at ear
 *  height and toed in to aim at the ears. */
function symmetric(room: Room, base: Layout, cx: number, lisY: number, dist: number, angleDeg: number, sub?: Speaker): Layout {
  const half = (angleDeg * Math.PI) / 360;
  const hx = dist * Math.sin(half);
  const depth = dist * Math.cos(half);
  const earZ = base.listener.earZ;
  const L0 = base.speakers.find((s) => s.role === 'L')!;
  const R0 = base.speakers.find((s) => s.role === 'R')!;
  const L: Speaker = { ...L0, x: cx - hx, y: lisY - depth, z: earZ, toeDeg: angleDeg / 2 };
  const R: Speaker = { ...R0, x: cx + hx, y: lisY - depth, z: earZ, toeDeg: angleDeg / 2 };
  return withFollowers(room, base, L, R, { ...base.listener, x: cx, y: lisY }, sub);
}

/** Positions a learner could actually use: inside the walls, the speakers
 *  clear of them, nothing standing in furniture (the moved desk included). */
function usable(lay: Layout, room: Room): boolean {
  if (!inside(lay.listener, room)) return false;
  for (const f of room.features) if (inFootprint(lay.listener, f)) return false;
  for (const s of lay.speakers) {
    if (!inside(s, room)) return false;
    if (s.role !== 'SUB' && wallClear(s, room) < WALL_CLEAR_M) return false;
    if ((s.role === 'L' || s.role === 'R' || s.role === 'C') && distToEdge(s, room.vertices, 0).dist < FRONT_CLEAR_M) return false;
  }
  return true;
}

/** placementConflicts' furniture rule, cheap: a speaker standing on a piece
 *  of furniture (tweeter under 60 cm above its top) or inside it below the
 *  top. Used to rank candidates before the full analysis. */
function furnitureClashes(lay: Layout, room: Room): number {
  let n = 0;
  for (const s of lay.speakers) {
    if (s.role === 'SUB') continue;
    for (const f of room.features) if (inFootprint(s, f) && (s.z <= f.h || s.z - f.h < 0.6)) n += 1;
  }
  return n;
}

function fieldRange(d: RoomDesign): [number, number] {
  return FIELD_RANGE_M[d.monitoring.field] ?? [FIELD_RANGE_M.nearfield![0], FIELD_RANGE_M.midfield![1]];
}

/** A sub the lab flags as "near the middle of the room" goes to the front
 *  corner nearer to it (placementConflicts' own advice); otherwise it stays. */
function subForBass(room: Room, base: Layout, b: ReturnType<typeof bounds>): Speaker | undefined {
  const sub = base.speakers.find((s) => s.role === 'SUB');
  if (!sub) return undefined;
  const midX = Math.abs(sub.x - (b.minX + b.maxX) / 2) < b.width * 0.15;
  const midY = Math.abs(sub.y - (b.minY + b.maxY) / 2) < b.length * 0.15;
  if (!(midX && midY)) return sub;
  const v = room.vertices;
  const corner = Math.hypot(sub.x - v[0].x, sub.y - v[0].y) <= Math.hypot(sub.x - v[1].x, sub.y - v[1].y) ? 0 : 1;
  const c = v[corner];
  const p = clampInside({ x: c.x + (corner === 0 ? 0.3 : -0.3), y: c.y + 0.3 }, room, sub, 0.3);
  return { ...sub, x: p.x, y: p.y };
}

function placeDesk(d: RoomDesign, base: Layout, lay: Layout, moveDesk: boolean): Omit<Candidate, 'lay' | 'moved' | 'pre'> | null {
  const desk = seatDesk(d.room, base.listener);
  if (!desk || !moveDesk) return { room: d.room, deskId: null, deskFrom: null, deskTo: null };
  const dx = lay.listener.x - base.listener.x;
  const dy = lay.listener.y - base.listener.y;
  if (Math.hypot(dx, dy) < 0.005) return { room: d.room, deskId: null, deskFrom: null, deskTo: null };
  // The desk goes along the room with the chair and centers on it (A and B
  // put the seat on the center line; a desk left off to one side reads wrong).
  const moved: Feature = { ...desk, x: lay.listener.x, y: desk.y + dy };
  const room: Room = { ...d.room, features: d.room.features.map((f) => (f.id === desk.id ? moved : f)) };
  if (!deskFits(room, moved)) return null;
  return { room, deskId: desk.id, deskFrom: { x: desk.x, y: desk.y }, deskTo: { x: moved.x, y: moved.y } };
}

function candidates(d: RoomDesign, goal: SetupGoal): Candidate[] {
  const base = d.layouts[d.active] ?? d.layouts[0];
  const room = d.room;
  const b = bounds(room);
  const cx = (b.minX + b.maxX) / 2;
  const [dMin, dMax] = fieldRange(d);
  const out: Candidate[] = [];
  const pushIf = (lay: Layout, moveDesk: boolean, pre: (lay: Layout, r: Room) => number[]) => {
    const placed = placeDesk(d, base, lay, moveDesk);
    if (!placed) return;
    const fixed = capLayoutHeights(lay, placed.room);
    if (!usable(fixed, placed.room)) return;
    const deskMove = placed.deskFrom && placed.deskTo ? Math.hypot(placed.deskTo.x - placed.deskFrom.x, placed.deskTo.y - placed.deskFrom.y) : 0;
    const moved = plainMoved(base, fixed) + deskMove;
    out.push({ ...placed, lay: fixed, moved, pre: [furnitureClashes(fixed, placed.room), ...pre(fixed, placed.room), moved / 100] });
  };
  if (goal === 'bass' || goal === 'image') {
    const angles = goal === 'bass' ? [55, 60, 65] : [60];
    const sub = goal === 'bass' ? subForBass(room, base, b) : undefined;
    // The prefilter: bass ranks by the length modes at the seat (cheap
    // modePressure), image by the distance to the nearer side wall.
    const a0 = analyze(d);
    const lengthModes = a0.modes.filter((m) => m.kind === 'axial' && m.axis === 'L' && m.f <= BASS_MAX_HZ);
    for (let lisY = b.minY + 1.0; lisY <= b.maxY - 0.5 + 1e-9; lisY += STEP_M) {
      for (let dist = dMin; dist <= dMax + 1e-9; dist += 0.1) {
        for (const ang of angles) {
          const lay = symmetric(room, base, cx, lisY, dist, ang, sub);
          pushIf(lay, true, (l) => {
            if (goal === 'bass') {
              const { L: mL, W: mW, H: mH } = a0.modalDims;
              const hits = lengthModes.filter((m) => {
                const p = modePressure(mL, mW, mH, m, l.listener.y - b.minY, l.listener.x - b.minX, l.listener.earZ);
                return p < 0.2 || p > 0.8;
              }).length;
              const front = (l.speakers.find((s) => s.role === 'L')!.y - b.minY);
              return [hits, frontWallOk(front) ? 0 : 1, Math.abs(ang - 60) / 100];
            }
            const Ls = l.speakers.find((s) => s.role === 'L')!;
            const Rs = l.speakers.find((s) => s.role === 'R')!;
            const rear = b.maxY - l.listener.y;
            return [rear < 1 ? 1 : 0, -Math.min(wallClear(Ls, room), wallClear(Rs, room))];
          });
        }
      }
    }
  } else {
    // LEAST CHANGE: the seat stays near where it is (desk fixed); the pair
    // either stays, is evened about the seat, or is rebuilt equilateral at
    // the current spread; tweeters stay or go to ear height.
    const L0 = base.speakers.find((s) => s.role === 'L')!;
    const R0 = base.speakers.find((s) => s.role === 'R')!;
    const spread = Math.hypot(R0.x - L0.x, R0.y - L0.y);
    for (const lisX of [...new Set([base.listener.x, cx])]) {
      for (let dy = -LEAST_SEAT_RANGE_M; dy <= LEAST_SEAT_RANGE_M + 1e-9; dy += STEP_M) {
        const listener = { ...base.listener, x: lisX, y: base.listener.y + dy };
        for (const pair of ['keep', 'even', 'triangle'] as const) {
          for (const ears of [false, true]) {
            let L = L0;
            let R = R0;
            if (pair === 'even') {
              const y = (L0.y + R0.y) / 2;
              const hx = (R0.x - L0.x) / 2;
              L = { ...L0, x: lisX - hx, y };
              R = { ...R0, x: lisX + hx, y };
            } else if (pair === 'triangle') {
              const depth = (spread * Math.sqrt(3)) / 2;
              L = { ...L0, x: lisX - spread / 2, y: listener.y - depth, toeDeg: 30 };
              R = { ...R0, x: lisX + spread / 2, y: listener.y - depth, toeDeg: 30 };
            }
            if (ears) {
              L = { ...L, z: listener.earZ };
              R = { ...R, z: listener.earZ };
            }
            pushIf(withFollowers(room, base, L, R, listener), false, () => []);
          }
        }
      }
    }
  }
  return out;
}

/* ────────────────────────────────── output ──────────────────────────────── */

export type SetupRow = { label: string; before: string; after: string; tier: Tier; better: boolean | null };

export type Setup = {
  goal: SetupGoal;
  letter: string;
  title: string;
  goalLine: string;
  /** The design as this setup would leave it — one layout, active — for the drawing and the report. */
  design: RoomDesign;
  layout: Layout;
  deskMoved: { from: Pt; to: Pt } | null;
  /** What to move, in plain distances. */
  moves: string[];
  /** The card's "better than now" lines (2–3). */
  better: string[];
  rows: SetupRow[];
  why: string[];
  tradeoffs: string[];
  metrics: SetupMetrics;
};

export type SetupResult = {
  base: SetupMetrics;
  setups: Setup[];
  /** A goal with no setup, and why, in words. */
  missing: { goal: SetupGoal; text: string }[];
  /** The whole mode cannot run (no L / R pair). */
  blocked: string | null;
};

/** Each goal keeps its letter (the plan's table): a missing goal leaves a
 *  gap rather than re-lettering, so "Setup A" always means smoothest bass —
 *  also after TRY, when the list is worked out again from the tried setup. */
export const GOAL_LETTER: Record<SetupGoal, string> = { bass: 'A', image: 'B', least: 'C' };
export const GOAL_TITLE: Record<SetupGoal, string> = { bass: 'Smoother bass', image: 'Clearer stereo image', least: 'Least change' };
export const GOAL_LINE: Record<SetupGoal, string> = {
  bass: 'Fewer length-mode dips and peaks at your seat (up to 150 Hz) than now.',
  image: 'A true 60° triangle, matched left and right, with fewer strong early reflections than now.',
  least: 'The smallest moves that clear the Review page’s “!” warnings.',
};

export function suggestSetups(d: RoomDesign): SetupResult {
  const base = d.layouts[d.active] ?? d.layouts[0];
  const hasPair = !!base && base.speakers.some((s) => s.role === 'L') && base.speakers.some((s) => s.role === 'R');
  const baseA = analyze(d);
  const bm = setupMetrics(d, baseA);
  if (!hasPair) return { base: bm, setups: [], missing: [], blocked: 'Suggested setups need a left and a right speaker. Add them in Monitoring setup.' };
  const picked: { goal: SetupGoal; lay: Layout; cand: Candidate; m: SetupMetrics; d: RoomDesign }[] = [];
  const missing: SetupResult['missing'] = [];
  const baseChecks = new Set(scoreChecks(bm));
  for (const goal of ['bass', 'image', 'least'] as SetupGoal[]) {
    const all = candidates(d, goal).sort((x, y) => cmp(x.pre, y.pre));
    const finals: { cand: Candidate; m: SetupMetrics; d: RoomDesign; key: number[] }[] = [];
    for (const cand of all.slice(0, goal === 'least' ? all.length : FINALISTS)) {
      const dd: RoomDesign = { ...d, room: cand.room, layouts: [{ ...cand.lay, name: base.name }], active: 0 };
      const m = setupMetrics(dd);
      finals.push({ cand, m, d: dd, key: [...goalScore(goal, m), ...tieBreak(goal, m, cand)] });
    }
    finals.sort((x, y) => cmp(x.key, y.key));
    const baseScore = goalScore(goal, bm);
    // A setup must win on its goal's CORE — the first two scores (bass: fewer
    // dips and peaks, or the first length mode out of its null/peak; image:
    // fewer imaging items, or fewer strong early reflections; least: fewer
    // "!", or fewer "▸"). A later score (bass: the front-wall distance)
    // only ranks, so "Smoother bass" never offers the same bass.
    const core = (x: number[]) => x.slice(0, CORE_LEN[goal]);
    const beats = finals.filter((f) => cmp(core(goalScore(goal, f.m)), core(baseScore)) < 0);
    const safe = beats.filter((f) => scoreChecks(f.m).every((c) => baseChecks.has(c)) && checks(f.m).every((c) => checks(bm).includes(c)) && f.m.conflicts.length <= bm.conflicts.length);
    const ok = safe.find((f) => picked.every((p) => differs(p.cand, f.cand)));
    if (ok) picked.push({ goal, lay: ok.cand.lay, cand: ok.cand, m: ok.m, d: ok.d });
    else {
      const twin = safe.length ? picked.find((p) => !differs(p.cand, safe[0].cand)) : undefined;
      const why: MissingWhy = twin ? { kind: 'same', as: GOAL_TITLE[twin.goal] } : beats.length ? { kind: 'blocked' } : { kind: 'none' };
      missing.push({ goal, text: missingText(goal, bm, why) });
    }
  }
  const setups = picked.map((p) => buildSetup(d, base, bm, p.goal, GOAL_LETTER[p.goal], p.cand, p.m, p.d));
  // Least change can reach the same bass with fewer moves: Smoother bass
  // says so, and what it adds (learner review 2026-11-14).
  const sa = setups.find((s) => s.goal === 'bass');
  const sc = setups.find((s) => s.goal === 'least');
  if (sa && sc && sc.metrics.bassHits.length <= sa.metrics.bassHits.length) {
    sa.why.push(
      `Setup C (Least change) also reaches ${sc.metrics.bassHits.length} bass dip${sc.metrics.bassHits.length === 1 ? '' : 's'} and peak${sc.metrics.bassHits.length === 1 ? '' : 's'}, with fewer moves. ${sa.metrics.stereo && frontWallOk(sa.metrics.frontDist) && !frontWallOk(sc.metrics.frontDist) ? 'This setup also takes the front-wall bass dip out of the low bass.' : 'Compare the two reports and pick the one your room allows.'}`,
    );
  }
  return { base: bm, setups, missing, blocked: null };
}

/** Genuinely different: the seat or a speaker at least SETUP_MIN_DIFF_M
 *  apart, or one moves the desk and the other does not (audio review). */
function differs(a: Candidate, b: Candidate): boolean {
  if (layoutSeparation(a.lay, b.lay) >= SETUP_MIN_DIFF_M) return true;
  return !!a.deskFrom !== !!b.deskFrom;
}

function tieBreak(goal: SetupGoal, m: SetupMetrics, c: Candidate): number[] {
  const s = m.stereo;
  const angleOff = s ? Math.abs(s.angleDeg - 60) : 99;
  const side = s ? -Math.min(s.wallL.side, s.wallR.side) : 0;
  if (goal === 'bass') return [checks(m).length, tries(m).length, angleOff / 10, c.moved];
  if (goal === 'image') return [checks(m).length, side, angleOff, c.moved];
  return [c.moved];
}

type MissingWhy = { kind: 'none' } | { kind: 'blocked' } | { kind: 'same'; as: string };

function missingText(goal: SetupGoal, bm: SetupMetrics, why: MissingWhy): string {
  const blockedBy = 'Positions the model found that do better would add a new warning or a placement problem, so none is suggested.';
  if (why.kind === 'same') return `${GOAL_TITLE[goal]}: the best position the model found for this goal is the same as the ${why.as} setup above, so it is not shown twice.`;
  const onlyBlocked = why.kind === 'blocked';
  if (goal === 'bass') {
    if (bm.bassModes === 0) return 'Smoother bass: this room has no length mode at or below 150 Hz to place the seat against, so there is no bass setup to suggest.';
    if (onlyBlocked) return `Smoother bass: ${blockedBy}`;
    return bm.bassHits.length === 0
      ? `Smoother bass: your seat already sits clear of the peaks and nulls of every length mode up to 150 Hz — nothing to improve on this goal.`
      : `Smoother bass: no seat this model can reach in this room lands on fewer length-mode peaks and nulls than yours does now.`;
  }
  if (goal === 'image') {
    if (onlyBlocked) return `Clearer stereo image: ${blockedBy}`;
    const open = bm.flags.filter((f) => IMAGE_FLAGS.includes(f));
    return open.length
      ? `Clearer stereo image: no symmetric position the model can fit in this room does better than yours on the imaging checks (${open.map((f) => FLAG_NAME[f]).join('; ')}).`
      : 'Clearer stereo image: your speakers already pass every imaging check here (center line, left/right match, side walls, angle, tweeter height), and no position the model tried has fewer strong early reflections.';
  }
  if (checks(bm).length + tries(bm).length === 0) return 'Least change: the Review page raises no placement warning for this layout, so there is nothing to fix.';
  if (onlyBlocked) return `Least change: ${blockedBy}`;
  return 'Least change: the warnings left on the Review page cannot be cleared with small moves while the desk stays where it is — try the other setups, or treatment.';
}

/* ───────────────────────────── words and rows ───────────────────────────── */

const pct = (v: number) => (Number.isFinite(v) ? `${Math.round(v)} %` : '—');
const zoneWord = (z: 'peak' | 'null' | 'between') => (z === 'peak' ? 'on a peak' : z === 'null' ? 'in a null' : 'between peak and null');

function hitsWord(m: SetupMetrics): string {
  if (m.bassModes === 0) return 'no length mode up to 150 Hz';
  return `${m.bassHits.length}`;
}
/** The same, rounded to the hertz for a card line. */
/** An ESTIMATED notch, rounded to what the model can stand behind (audio
 *  review: "≈ 101.9 Hz" is false precision): to 10 Hz from 100 Hz up.
 *  ≈, not ~: in the readout's mono face a tilde reads as a minus sign. */
function notchWord(m: SetupMetrics): string {
  if (m.frontNotchHz == null) return `above ${SBIR_MAX_HZ} Hz (outside the bass range shown)`;
  const f = m.frontNotchHz;
  return `≈ ${f >= 100 ? Math.round(f / 10) * 10 : Math.round(f)} Hz`;
}
const notchShort = notchWord;

function rowsFor(bm: SetupMetrics, m: SetupMetrics, u: Units): SetupRow[] {
  const modeTier: Tier = bm.rectangular ? 'CALCULATED' : 'ESTIMATED';
  const len = (v: number) => fmtLen(v, u, { small: true });
  const lower = (a: number, b: number, tol = 1e-6): boolean | null => (Math.abs(a - b) <= tol ? null : b < a);
  const rows: SetupRow[] = [];
  if (bm.bassModes > 0) rows.push({ label: 'Bass dips and peaks at your seat (length modes up to 150 Hz)', before: hitsWord(bm), after: hitsWord(m), tier: modeTier, better: lower(bm.bassHits.length, m.bassHits.length) });
  rows.push({ label: 'Seat along the room (front wall = 0 %; the usual guide is 35–40 %)', before: pct(bm.seatPct), after: pct(m.seatPct), tier: 'CALCULATED', better: null });
  if (bm.firstLength && m.firstLength) {
    const bad = (z: string) => (z === 'between' ? 0 : 1);
    rows.push({ label: `At the first length mode (${fmtHz(bm.firstLength.f)})`, before: zoneWord(bm.firstLength.zone), after: zoneWord(m.firstLength.zone), tier: modeTier, better: lower(bad(bm.firstLength.zone), bad(m.firstLength.zone)) });
  }
  const bs = bm.stereo;
  const s = m.stereo;
  if (bs && s) {
    const fw = (x: SetupMetrics) => (frontWallOk(x.frontDist) ? 0 : 1);
    rows.push({ label: `Speakers from the front wall (to the woofer; under ${fmtLen(0.5, u, { small: true })} or over ${fmtLen(2, u)} is the usual test)`, before: len(bm.frontDist), after: len(m.frontDist), tier: 'CALCULATED', better: lower(fw(bm), fw(m)) });
    rows.push({ label: 'Front-wall bass cancellation at the seat', before: notchWord(bm), after: notchWord(m), tier: 'ESTIMATED', better: lower(fw(bm), fw(m)) });
    const angle = (g: NonNullable<SetupMetrics['stereo']>) => (g.inFront ? `${g.angleDeg.toFixed(0)}°` : 'no triangle');
    const angleOff = (g: NonNullable<SetupMetrics['stereo']>) => (g.inFront ? Math.abs(g.angleDeg - 60) : 999);
    rows.push({ label: 'Listening angle (the equilateral triangle is 60°)', before: angle(bs), after: angle(s), tier: 'CALCULATED', better: lower(Math.round(angleOff(bs)), Math.round(angleOff(s))) });
    rows.push({ label: 'Left vs right distance to your ears', before: len(bs.pathDiff), after: len(s.pathDiff), tier: 'CALCULATED', better: lower(Math.round(bs.pathDiff * 100), Math.round(s.pathDiff * 100)) });
    rows.push({ label: 'Seat off the center line', before: len(Math.abs(bs.axisOffset)), after: len(Math.abs(s.axisOffset)), tier: 'CALCULATED', better: lower(Math.round(Math.abs(bs.axisOffset) * 100), Math.round(Math.abs(s.axisOffset) * 100)) });
    const side = (g: NonNullable<SetupMetrics['stereo']>) => Math.abs(g.wallL.side - g.wallR.side);
    rows.push({ label: 'Side-wall distances, left vs right', before: len(side(bs)), after: len(side(s)), tier: 'CALCULATED', better: lower(Math.round(side(bs) * 100), Math.round(side(s) * 100)) });
    rows.push({ label: 'Seat from the rear wall', before: len(bs.listenerRear), after: len(s.listenerRear), tier: 'CALCULATED', better: lower(bs.listenerRear < 1 ? 1 : 0, s.listenerRear < 1 ? 1 : 0) });
    rows.push({ label: 'Tweeters vs ear height', before: len(Math.abs(bs.heightDiff)), after: len(Math.abs(s.heightDiff)), tier: 'CALCULATED', better: lower(Math.round(Math.abs(bs.heightDiff) * 100), Math.round(Math.abs(s.heightDiff) * 100)) });
  }
  rows.push({ label: 'Strong early wall reflections, untreated (within 15 ms, within 12 dB)', before: `${bm.earlyStrong}`, after: `${m.earlyStrong}`, tier: 'ESTIMATED', better: lower(bm.earlyStrong, m.earlyStrong) });
  rows.push({ label: 'Review warnings: “!” to look at first / “▸” worth testing', before: `${checks(bm).length} / ${tries(bm).length}`, after: `${checks(m).length} / ${tries(m).length}`, tier: 'CALCULATED', better: lower(checks(bm).length * 100 + tries(bm).length, checks(m).length * 100 + tries(m).length) });
  rows.push({ label: 'Placement problems (outside the walls, against a wall or standing in furniture)', before: `${bm.conflicts.length}`, after: `${m.conflicts.length}`, tier: 'CALCULATED', better: lower(bm.conflicts.length, m.conflicts.length) });
  return rows;
}

/** "65 cm toward the front wall and 10 cm to the left" — nothing under 1 cm. */
/** "65 cm toward the front wall and 10 cm toward the left wall" — left and
 *  right as you sit facing the speakers; a move onto or toward the room's
 *  center line says so. Nothing under 1 cm. */
function moveWords(from: Pt, to: Pt, u: Units, cx: number): string | null {
  const dy = to.y - from.y;
  const dx = to.x - from.x;
  const parts: string[] = [];
  if (Math.abs(dy) >= 0.01) parts.push(`${fmtLen(Math.abs(dy), u, { small: true })} toward the ${dy < 0 ? 'front' : 'rear'} wall`);
  if (Math.abs(dx) >= 0.01) {
    const inward = Math.abs(to.x - cx) < Math.abs(from.x - cx) - 0.005;
    parts.push(`${fmtLen(Math.abs(dx), u, { small: true })} ${inward ? (Math.abs(to.x - cx) < 0.01 ? 'onto the center line' : 'toward the center line') : `toward the ${dx < 0 ? 'left' : 'right'} wall`}`);
  }
  return parts.length ? parts.join(' and ') : null;
}

const ROLE_NAME: Record<string, string> = { L: 'left speaker', R: 'right speaker', C: 'center speaker', LS: 'left surround', RS: 'right surround', SUB: 'subwoofer' };

function movesFor(base: Layout, lay: Layout, desk: Candidate, u: Units, cx: number): string[] {
  const out: string[] = [];
  const seat = moveWords(base.listener, lay.listener, u, cx);
  out.push(seat ? `Move your chair ${seat}.` : 'Your chair stays where it is.');
  if (desk.deskFrom && desk.deskTo) {
    const w = moveWords(desk.deskFrom, desk.deskTo, u, cx);
    if (w) out.push(`Move the desk with it: ${w}.`);
  }
  for (const s of lay.speakers) {
    const p = base.speakers.find((q) => q.role === s.role);
    if (!p) continue;
    const w = moveWords(p, s, u, cx);
    if (w) out.push(`Move the ${ROLE_NAME[s.role]} ${w}.`);
  }
  const L0 = base.speakers.find((s) => s.role === 'L');
  const L1 = lay.speakers.find((s) => s.role === 'L');
  if (L0 && L1 && Math.abs(L1.z - L0.z) >= 0.01) out.push(`${L1.z > L0.z ? 'Raise' : 'Lower'} the left and right tweeters ${fmtLen(Math.abs(L1.z - L0.z), u, { small: true })}, to ${fmtLen(L1.z, u)}${Math.abs(L1.z - lay.listener.earZ) < 0.01 ? ' (ear height)' : ''}.`);
  if (L0 && L1 && Math.abs(L1.toeDeg - L0.toeDeg) >= 1) out.push(`Toe-in ${Math.round(L0.toeDeg)}° → ${Math.round(L1.toeDeg)}°, so each speaker aims at your ears.`);
  if (lay.speakers.some((s) => s.role === 'LS' || s.role === 'C')) out.push('The center and surround speakers follow the new seat (surrounds on the ±110° circle).');
  return out;
}

function buildSetup(d: RoomDesign, base: Layout, bm: SetupMetrics, goal: SetupGoal, letter: string, cand: Candidate, m: SetupMetrics, dd: RoomDesign): Setup {
  const u = d.room.units;
  const rows = rowsFor(bm, m, u);
  const better = betterLines(goal, bm, m, u);
  return {
    goal,
    letter,
    title: GOAL_TITLE[goal],
    goalLine: GOAL_LINE[goal],
    design: dd,
    layout: cand.lay,
    deskMoved: cand.deskFrom && cand.deskTo ? { from: cand.deskFrom, to: cand.deskTo } : null,
    moves: movesFor(base, cand.lay, cand, u, (bounds(d.room).minX + bounds(d.room).maxX) / 2),
    better,
    rows,
    // Multichannel: the center and surrounds follow the seat (audio review).
    why: whyLines(goal, bm, m, u).map((w) => (w === 'Everything else stays where it is, the desk included.' && cand.lay.speakers.some((s) => s.role === 'C' || s.role === 'LS') ? 'The desk stays where it is; the center and surround speakers follow the seat.' : w)),
    tradeoffs: tradeoffLines(d, bm, m, rows, cand),
    metrics: m,
  };
}

function betterLines(goal: SetupGoal, bm: SetupMetrics, m: SetupMetrics, u: Units): string[] {
  const out: string[] = [];
  const add = (cond: boolean, text: string) => {
    if (cond && out.length < 3 && !out.includes(text)) out.push(text);
  };
  const bassLine = `Bass dips and peaks at your seat: ${bm.bassHits.length} → ${m.bassHits.length}`;
  const warn = `Review warnings to look at first (“!”): ${checks(bm).length} → ${checks(m).length}`;
  const warnTry = `Review items worth testing (“▸”): ${tries(bm).length} → ${tries(m).length}`;
  const early = `Strong early wall reflections: ${bm.earlyStrong} → ${m.earlyStrong}`;
  const fixedFlags = bm.flags.filter((f) => !m.flags.includes(f));
  // Cleared only by the search's margin (the Review page never flagged it):
  // say what moved, or a card that won on it has no line at all.
  const marginLine = firstModeBad(bm) && !firstModeBad(m) && !bm.flags.includes('length-mode') && bm.firstLengthP != null && m.firstLengthP != null && bm.firstLength
    ? `First length mode (${fmtHz(bm.firstLength.f)}): your seat moves clear of its ${bm.firstLengthP < DIP_BELOW ? 'dip' : 'peak'} (${Math.round(bm.firstLengthP * 100)} % → ${Math.round(m.firstLengthP * 100)} % of its full pressure)`
    : null;
  const order: [boolean, string][] =
    goal === 'bass'
      ? [
          [m.bassHits.length < bm.bassHits.length, bassLine],
          [bm.flags.includes('length-mode') && !m.flags.includes('length-mode'), `First length mode: ${zoneWord(bm.firstLength!.zone)} → ${zoneWord(m.firstLength!.zone)}`],
          [!!marginLine, marginLine ?? ''],
          [!!m.stereo && !frontWallOk(bm.frontDist) && frontWallOk(m.frontDist), m.frontDist < 0.5 ? `Front-wall bass dip moved up out of the low bass: ${notchShort(bm)} → ${notchShort(m)}` : `Front-wall bass dip moved down, speakers well away from the wall: ${notchShort(bm)} → ${notchShort(m)}`],
          [m.earlyStrong < bm.earlyStrong, early],
        ]
      : goal === 'image'
        ? [
            ...fixedFlags.filter((f) => IMAGE_FLAGS.includes(f)).map((f): [boolean, string] => [true, `Cleared: ${FLAG_NAME[f]}`]),
            [m.earlyStrong < bm.earlyStrong, early],
            [!!bm.stereo && !!m.stereo && Math.min(m.stereo.wallL.side, m.stereo.wallR.side) > Math.min(bm.stereo.wallL.side, bm.stereo.wallR.side) + 0.05, `Speakers from the side walls: ${fmtLen(Math.min(bm.stereo?.wallL.side ?? NaN, bm.stereo?.wallR.side ?? NaN), u, { small: true })} → ${fmtLen(Math.min(m.stereo?.wallL.side ?? NaN, m.stereo?.wallR.side ?? NaN), u, { small: true })}`],
            [m.bassHits.length < bm.bassHits.length, bassLine],
          ]
        : [
            [checks(m).length < checks(bm).length, warn],
            [!!marginLine, marginLine ?? ''],
            [checks(m).length === checks(bm).length && tries(m).length < tries(bm).length, warnTry],
            [m.bassHits.length < bm.bassHits.length, bassLine],
            [m.earlyStrong < bm.earlyStrong, early],
            ...fixedFlags.map((f): [boolean, string] => [true, `Cleared: ${FLAG_NAME[f]}`]),
          ];
  for (const [c, t] of order) add(c, t);
  return out;
}

function whyLines(goal: SetupGoal, bm: SetupMetrics, m: SetupMetrics, u: Units): string[] {
  const out: string[] = [];
  const list = (hits: BassHit[]) => hits.map((h) => `${fmtHz(h.f)} ${h.zone === 'null' ? 'null' : 'peak'}`).join(', ');
  if (goal === 'bass') {
    out.push(`Now your seat sits in a null or on a peak of ${bm.bassHits.length} of the ${bm.bassModes} length modes up to 150 Hz${bm.bassHits.length ? ` (${list(bm.bassHits)})` : ''}. At ${pct(m.seatPct)} of the room length it is ${m.bassHits.length === 0 ? 'none' : m.bassHits.length} of ${m.bassModes}${m.bassHits.length ? ` (${list(m.bassHits)})` : ''}. In a dip that note drops sharply at the seat, and EQ cannot fill it; on a peak it booms. (A dip here means under ${Math.round(DIP_BELOW * 100)}% of the mode's full pressure and a peak over ${Math.round(PEAK_ABOVE * 100)}% — a little stricter than the Review page, so no setup wins by a hair.)`);
    const p = m.seatPct;
    out.push(p >= 35 && p <= 40 ? 'This seat is inside the usual 35–40 % starting point (the “38 % rule”).' : `The usual starting point is about 35–40 % of the length (the “38 % rule”). In this room the model finds fewer dips and peaks at ${pct(p)}, so it suggests that instead — the rule is a starting point, not a law.`);
    if (m.stereo && frontWallOk(m.frontDist)) {
      out.push(
        m.frontDist < 0.5
          ? `The speakers stand ${fmtLen(m.frontDist, u, { small: true })} from the front wall (to the woofer). That close, the wall's bounce cancels higher up (${notchWord(m)}) instead of in the low bass, where thick absorption (${fmtLen(0.1, u, { small: true })} or more) behind the speakers can reduce it.`
          : `The speakers stand ${fmtLen(m.frontDist, u, { small: true })} from the front wall. That far out, the bounce off the wall arrives late and weaker, and its cancellation drops low (${notchWord(m)}), often below what nearfield monitors play. The seat ends up farther back too, so check the rear-wall row.`,
      );
    }
  } else if (goal === 'image') {
    const st = m.stereo;
    const ok = (f: FlagKey) => !m.flags.includes(f);
    const parts: string[] = [];
    if (ok('lr-mismatch')) parts.push('both speakers are the same distance from your ears');
    if (ok('side-mismatch')) parts.push('the same distance from their side walls');
    if (ok('off-center')) parts.push('you sit on the center line');
    if (st && ok('angle') && ok('no-triangle')) parts.push(`the listening angle is ${st.angleDeg.toFixed(0)}°${Math.abs(st.angleDeg - 60) < 1 ? ' (the equilateral triangle)' : ''}`);
    if (parts.length) out.push(`In this setup ${parts.join(', ')}, so a centered voice stays in the middle.`);
    out.push(`Each speaker aims at your ears (toe-in ${m.stereo ? Math.round((m.stereo.angleDeg || 60) / 2) : 30}°), so the sound that reaches the side walls leaves from off to the side of where the speaker points, where it is quieter in the mids and highs (in the bass every speaker radiates all around). Strong early wall reflections: ${bm.earlyStrong} now, ${m.earlyStrong} with this setup.`);
    if (m.stereo && Math.abs(m.frontDist - bm.frontDist) >= 0.05) out.push(`The speakers stand ${fmtLen(m.frontDist, u, { small: true })} from the front wall (now ${fmtLen(bm.frontDist, u, { small: true })}), so the bounce off that wall cancels at your seat near ${notchWord(m)} instead of ${notchWord(bm)}.`);
  } else {
    const fixed = scoreFlags(bm).filter((f) => !scoreFlags(m).includes(f));
    out.push(fixed.length ? `These are the smallest moves the model found that clear: ${fixed.map((f) => FLAG_NAME[f]).join('; ')}.` : 'These are the smallest moves the model found that reduce the Review page’s warnings.');
    out.push('Everything else stays where it is, the desk included.');
  }
  return out;
}

function tradeoffLines(d: RoomDesign, bm: SetupMetrics, m: SetupMetrics, rows: SetupRow[], cand: Candidate): string[] {
  const out: string[] = [];
  for (const r of rows) if (r.better === false) out.push(`${r.label}: ${r.before} → ${r.after}.`);
  if (m.earlyAll > bm.earlyAll) out.push(`All reflections inside 15 ms, strong or weak (what Explore's EARLY <15ms counts): ${bm.earlyAll} → ${m.earlyAll}. The added ones are weak — more than 12 dB below the direct sound, or already meeting treatment.`);
  const newTries = tries(m).filter((f) => !tries(bm).includes(f));
  for (const f of newTries) out.push(`New “▸” item: ${FLAG_NAME[f]}.`);
  if (d.treatment.some((t) => t.enabled) && m.treatedEarly < bm.treatedEarly) out.push(`Your treatment meets ${bm.treatedEarly} of the early wall reflections now and ${m.treatedEarly} with this setup — the reflection points move with the speakers and the seat. Move the panels to the new marks in Add treatment.`);
  if (m.stereo && bm.stereo && m.frontDist < bm.frontDist - 0.05 && m.frontDist < 0.5) out.push(`The speakers move close to the front wall. Measured to the woofer, so the cabinet's back is a cabinet-depth closer: keep the rear-port clearance the maker gives. Close to a wall the bass also gets louder — use the monitor's boundary (wall) switch or EQ.`);
  const sub0 = d.layouts[d.active]?.speakers.find((s) => s.role === 'SUB');
  const sub1 = cand.lay.speakers.find((s) => s.role === 'SUB');
  if (sub0 && sub1 && Math.hypot(sub1.x - sub0.x, sub1.y - sub0.y) > 0.01) out.push('In a corner the sub plays louder and can make some peaks bigger: set its level again, then fine-tune its spot with a “sub crawl” (play bass from the seat position and listen where it sounds even). The sub’s position is not part of this score.');
  if (cand.deskFrom) out.push('The desk moves with the chair. In this model the desk is part of the room, so trying this setup moves it for every kept layout.');
  if (!bm.rectangular) out.push('This room is not a simple rectangle with a flat ceiling, so the mode numbers come from the bounding box and the mean height — LESS reliable; measure.');
  out.push('Bass at other seats changes too: this is about your one listening position. The model uses a generic speaker spread, not your monitors’ measured data.');
  return out;
}

/* ─────────────────────────────── TRY THIS SETUP ───────────────────────── */

export type TrySlot = 'Option A' | 'Option B';

/** The kept slot a TRY fills without asking: OPTION A, else OPTION B; null
 *  when both already hold positions (then the learner picks which goes). */
export function freeTrySlot(d: Pick<RoomDesign, 'layouts'>): TrySlot | null {
  if (!d.layouts.some((l) => l.name === 'Option A')) return 'Option A';
  if (!d.layouts.some((l) => l.name === 'Option B')) return 'Option B';
  return null;
}

/** (Pure, so node tests it.) The design with the setup in `slot`, showing — START and the other slot
 *  are never touched. The room comes with it (a moved desk is part of the
 *  room, the trade-off the report states). */
export function applySetup(d: RoomDesign, s: Pick<Setup, 'layout' | 'design'>, slot: TrySlot): RoomDesign {
  const lay: Layout = { ...s.layout, name: slot, speakers: s.layout.speakers.map((x) => ({ ...x })), listener: { ...s.layout.listener } };
  const idx = d.layouts.findIndex((l) => l.name === slot);
  const layouts = idx >= 0 ? d.layouts.map((l, i) => (i === idx ? lay : l)) : [...d.layouts, lay];
  return { ...d, room: s.design.room, layouts, active: idx >= 0 ? idx : layouts.length - 1 };
}
