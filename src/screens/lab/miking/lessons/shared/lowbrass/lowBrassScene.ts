/**
 * THE LOW / COILED BRASS FAMILY — where everything is, in 3-D (charter §2
 * layer 2). ONE scene per instrument and bell orientation, from which the
 * collision model (lowBrassModel.ts), the zones (each lesson's model.ts)
 * and the drawing (LowBrassArt.tsx) are all built — so the drawing, the
 * keep-outs and the starting points agree.
 *
 * LESSON FRAME (the engine's, frame H of the hand drums): origin ON THE
 * FLOOR under the centre of the player's seat; +x toward the audience; +y
 * DOWN (the floor is y = 0); +z the player's right. The player sits on a
 * chair facing +x.
 *
 * EVERY position here is a DRAWING DEFAULT (no source gives a player's or a
 * held instrument's geometry; french_horn/, tuba/, euphonium/
 * GEOMETRY_PROPOSAL.md). The sourced facts are the bell diameters, the
 * valve counts and kinds, and the bell DIRECTIONS (the horn's to the rear;
 * a tuba's up, forward or back). Where the proposals' points put the bell
 * through the player's body, the bell was moved out beside it (LB-02).
 *
 * Pure (no React): node-testable.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import type { LowBrassSpec, Orient } from './lowBrassSpec.ts';

export const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const D2R = Math.PI / 180;

/** The seated player's joints (lesson frame, mm). */
export type Joints = {
  pelvis: Vec3;
  hipR: Vec3;
  hipL: Vec3;
  kneeR: Vec3;
  kneeL: Vec3;
  ankleR: Vec3;
  ankleL: Vec3;
  toeR: Vec3;
  toeL: Vec3;
  chest: Vec3;
  neck: Vec3;
  shoulderR: Vec3;
  shoulderL: Vec3;
  elbowR: Vec3;
  elbowL: Vec3;
  /** Wrist and the hand's far end (the fingertips' middle). */
  wristR: Vec3;
  handR: Vec3;
  wristL: Vec3;
  handL: Vec3;
  head: Vec3;
  headR: number;
  /** The lips (where the mouthpiece meets the player). */
  mouth: Vec3;
};

export type Tube = { id: string; pts: Vec3[]; r: number; tone?: 'brass' | 'silver' };
export type Valve = { c: Vec3; axis: Vec3; r: number; h: number; kind: 'rotary' | 'piston'; lever?: Vec3 };
/** The bell: a flare from the throat (radius rT) to the rim (radius R),
 *  straight along `axis` (unit, pointing OUT of the bell). */
export type Bell = { rim: Vec3; axis: Vec3; R: number; throat: Vec3; rT: number };

export type BrassScene = {
  spec: LowBrassSpec;
  orient: Orient;
  J: Joints;
  chair: { seat: { min: Vec3; max: Vec3 }; back: { min: Vec3; max: Vec3 }; legs: [Vec3, Vec3][] };
  bell: Bell;
  tubes: Tube[];
  valves: Valve[];
  /** The instrument's centre: what "from the instrument" is measured from
   *  for a view farther in front. */
  centre: Vec3;
  /** The horn's right hand inside the bell (null for the tuba family). */
  bellHand: { wrist: Vec3; tip: Vec3 } | null;
  /** The bell's rim as it rises in a "bells up" passage (the horn). */
  bellsUp: Vec3 | null;
};

/* ── the seated player (shared: every lesson's player sits the same) ── */
const BASE = {
  pelvis: v(-40, -540, 0),
  hipR: v(-40, -540, 100),
  hipL: v(-40, -540, -100),
  kneeR: v(330, -560, 150),
  kneeL: v(330, -560, -150),
  ankleR: v(370, -95, 165),
  ankleL: v(370, -95, -165),
  toeR: v(520, -35, 180),
  toeL: v(520, -35, -180),
  chest: v(-25, -870, 0),
  neck: v(-35, -1065, 0),
  shoulderR: v(-45, -1025, 190),
  shoulderL: v(-45, -1025, -190),
  head: v(-15, -1195, 0),
  headR: 105,
  mouth: v(92, -1152, 0),
};

/** The chair (drawing default: a 460 mm seat, the house seated height). */
export const CHAIR = {
  seat: { min: v(-260, -470, -230), max: v(200, -445, 230) },
  back: { min: v(-275, -900, -210), max: v(-245, -470, 210) },
  legs: [
    [v(-245, -445, -210), v(-250, 0, -215)],
    [v(-245, -445, 210), v(-250, 0, 215)],
    [v(185, -445, -210), v(195, 0, -215)],
    [v(185, -445, 210), v(195, 0, 215)],
  ] as [Vec3, Vec3][],
};

/** A circle of points about `c` in the plane spanned by unit e1, e2. */
export function ring(c: Vec3, e1: Vec3, e2: Vec3, r: number, a0 = 0, a1 = 2 * Math.PI, n = 40): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(add(c, add(scale(e1, r * Math.cos(a)), scale(e2, r * Math.sin(a)))));
  }
  return out;
}

/** Two unit vectors square to `n` (and to each other), the first as close
 *  to `hint` as it can be. */
export function basis(n: Vec3, hint: Vec3): [Vec3, Vec3] {
  const e1 = norm(sub(hint, scale(n, dot(hint, n))));
  const e2 = v(n.y * e1.z - n.z * e1.y, n.z * e1.x - n.x * e1.z, n.x * e1.y - n.y * e1.x);
  return [e1, norm(e2)];
}

/** A smooth path through control points (Catmull-Rom, `k` samples a span). */
export function spline(pts: Vec3[], k = 8): Vec3[] {
  const out: Vec3[] = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let j = 0; j < k; j++) {
      const t = j / k;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push(v(f(p0.x, p1.x, p2.x, p3.x), f(p0.y, p1.y, p2.y, p3.y), f(p0.z, p1.z, p2.z, p3.z)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** The bell's radius a fraction t (0 = throat … 1 = rim) along its flare:
 *  a brass bell opens slowly, then fast at the end (a drawing profile). */
export function flareR(b: Bell, t: number): number {
  return b.rT + (b.R - b.rT) * Math.pow(Math.max(0, Math.min(1, t)), 3.2);
}

/* ── the horn ── */
function hornScene(spec: LowBrassSpec): BrassScene {
  const R = spec.bell.mm / 2;
  // The coil stands beside the player's right chest, its face to the right.
  const C = v(150, -885, 255);
  const nC = norm(v(0.25, 0, 0.97));
  const [e1, e2] = basis(nC, v(1, 0, 0));
  // The bell: behind and right of the right hip, pointing back, out and a
  // little down (french_horn/GEOMETRY_PROPOSAL.md §1, moved clear of the
  // body: LB-02).
  const axis = norm(v(-0.88, 0.17, 0.44));
  const rim = v(-150, -690, 335);
  const throat = sub(rim, scale(axis, 300));
  const bell: Bell = { rim, axis, R, throat, rT: 24 };
  const loops: Tube[] = [125, 109, 94].map((r, i) => ({ id: `coil${i}`, pts: ring(add(C, scale(nC, (i - 1) * 16)), e1, e2, r, 0, 2 * Math.PI, 56), r: 7.5 + i }));
  // The bell's tail leaves the coil at its lower back and runs to the throat.
  const tailStart = add(C, add(scale(e1, -0.62 * 112), scale(e2, 0.78 * 112)));
  const tail: Tube = { id: 'bellTail', pts: spline([add(C, add(scale(e1, 0.2 * 118), scale(e2, 0.98 * 118))), tailStart, add(throat, scale(axis, -40)), throat], 8), r: 16 };
  const mp0 = add(BASE.mouth, v(6, 0, 0));
  const mp1 = v(178, -1128, 38);
  const valveC = v(205, -912, 178);
  const valves: Valve[] = [0, 1, 2, 3].map((i) => ({ c: add(v(186, -975, 182), scale(v(0.22, 0.97, 0), i * 40)), axis: nC, r: 21, h: 46, kind: 'rotary', lever: v(-40, -10, -30) }));
  const leadpipe: Tube = { id: 'leadpipe', pts: spline([mp1, v(232, -1080, 120), v(250, -1000, 190), v(222, -960, 205)], 8), r: 9 };
  const slides: Tube[] = [
    { id: 'slide1', pts: spline([add(C, scale(e1, 100)), add(add(C, scale(e1, 175)), scale(e2, -20)), add(add(C, scale(e1, 175)), scale(e2, 30)), add(add(C, scale(e1, 100)), scale(e2, 40))], 6), r: 8 },
    { id: 'slide2', pts: spline([add(add(C, scale(e2, -110)), scale(e1, -30)), add(add(C, scale(e2, -170)), scale(e1, -40)), add(add(C, scale(e2, -170)), scale(e1, 20)), add(add(C, scale(e2, -110)), scale(e1, 20))], 6), r: 8 },
  ];
  // The right hand in the bell; the arm bent back to it.
  const wristR = sub(rim, scale(axis, 25));
  const handR = sub(rim, scale(axis, 120));
  const J: Joints = {
    ...BASE,
    elbowR: v(-255, -880, 375),
    wristR,
    handR,
    elbowL: v(110, -850, -150),
    wristL: v(175, -920, 70),
    handL: v(215, -940, 140),
  };
  // Bells up (a drawing default): the rim rises about 40° about the lips.
  const rel = sub(rim, BASE.mouth);
  const ph = 40 * D2R;
  const bellsUp = add(BASE.mouth, v(rel.x * Math.cos(ph) - rel.y * Math.sin(ph), rel.x * Math.sin(ph) + rel.y * Math.cos(ph), rel.z));
  return {
    spec,
    orient: 'back',
    J,
    chair: CHAIR,
    bell,
    tubes: [...loops, tail, leadpipe, ...slides, { id: 'mouthpiece', pts: [mp0, mp1], r: 7, tone: 'silver' }, { id: 'toValves', pts: spline([v(222, -960, 205), valveC, add(C, scale(e2, -60))], 6), r: 8 }],
    valves,
    centre: C,
    bellHand: { wrist: wristR, tip: handR },
    bellsUp,
  };
}

/* ── the tuba and the euphonium: an upright body on the lap, the bell up or
 *    turned to the front ── */
type UprightDims = { k: number; bottomY: number; topY: number; branchR: [number, number]; bellLen: number; rT: number; pistonsAt: Vec3; side?: boolean };

function uprightScene(spec: LowBrassSpec, orient: Orient, d: UprightDims): BrassScene {
  const R = spec.bell.mm / 2;
  const k = d.k;
  // The body: the large bell branch (front) and the small branches (back),
  // joined by the bottom bow, leaning a little back toward the player.
  const bot = v(250, d.bottomY, 165);
  const top = v(215, d.topY, 240);
  const backBot = v(175, d.bottomY - 30 * k, 85);
  const backTop = v(170, d.topY + 140 * k, 70);
  const bow: Tube = { id: 'bottomBow', pts: spline([backTop, backBot, v(205, d.bottomY + 60 * k, 120), bot], 8), r: 46 * k };
  const branch: Tube = { id: 'bellBranch', pts: spline([bot, v(240, (d.bottomY + d.topY) / 2, 200), top], 8), r: d.branchR[1] };
  let bell: Bell;
  let neck: Tube;
  if (orient === 'up') {
    const axis = norm(v(0, -1, 0.17));
    const throat = add(top, scale(axis, 40));
    const rim = add(throat, scale(axis, d.bellLen));
    bell = { rim, axis, R, throat, rT: d.rT };
    neck = { id: 'bellNeck', pts: [top, throat], r: d.rT };
  } else {
    const axis = norm(v(1, -0.09, 0));
    const bend = add(top, v(-10, -130 * k, 10));
    const throat = add(bend, v(70 * k, -20 * k, 0));
    const rim = add(throat, scale(axis, d.bellLen));
    bell = { rim, axis, R, throat, rT: d.rT };
    neck = { id: 'bellNeck', pts: spline([top, add(top, v(-12, -70 * k, 6)), bend, throat], 8), r: d.rT };
  }
  // The pistons stand in a row along z in front of the body; their finger
  // buttons on top.
  const P0 = d.pistonsAt;
  const valves: Valve[] = [0, 1, 2].map((i) => ({ c: add(P0, v(0, 0, i * 34)), axis: v(0, -1, 0), r: 15 * k, h: 120 * k, kind: 'piston' as const }));
  if (spec.valves.n === 4 && !d.side) valves.push({ c: add(P0, v(0, 0, 3 * 34)), axis: v(0, -1, 0), r: 15 * k, h: 120 * k, kind: 'piston' });
  // The euphonium's fourth valve sits at the side, under the left hand.
  if (d.side) valves.push({ c: v(250, -930 + 20 * (1 - k), 52), axis: v(0, 0, -1), r: 15 * k, h: 70, kind: 'piston' });
  const mp0 = add(BASE.mouth, v(6, 0, 0));
  const mp1 = v(185, -1135, 30);
  const leadpipe: Tube = { id: 'leadpipe', pts: spline([mp1, v(250, -1110, 55), add(P0, v(-10, -70 * k, -10)), add(P0, v(-20, 20, -12))], 8), r: 10 * k + 2 };
  const valveLoop: Tube = { id: 'valveLoop', pts: spline([add(P0, v(-30, 60 * k, 0)), add(P0, v(-60, 80 * k, 60)), add(top, v(30, 260 * k, -10))], 8), r: 14 * k };
  const slides: Tube[] = [
    { id: 'slide1', pts: spline([add(P0, v(-40, 30 * k, 110)), add(P0, v(-40, 30 * k, 200 * k + 60)), add(P0, v(-40, 80 * k, 200 * k + 60)), add(P0, v(-40, 80 * k, 110))], 6), r: 13 * k },
    { id: 'slide2', pts: spline([add(backBot, v(0, -120 * k, -10)), add(backBot, v(-70 * k, -120 * k, -40)), add(backBot, v(-70 * k, -200 * k, -40)), add(backBot, v(0, -200 * k, -10))], 6), r: 18 * k },
  ];
  const back: Tube = { id: 'backBranch', pts: spline([backBot, v(172, (d.bottomY + d.topY) / 2, 78), backTop, add(backTop, v(40, -40 * k, 30)), add(P0, v(-40, -40 * k, 0))], 8), r: d.branchR[0] };
  const handR = add(P0, v(15, -d.k * 120 - 45, 50));
  const J: Joints = {
    ...BASE,
    elbowR: v(150, -870, 335),
    wristR: add(handR, v(-40, 30, 70)),
    handR,
    elbowL: v(95, -830, -195),
    wristL: d.side ? v(205, -905, 0) : v(185, -985, 10),
    handL: d.side ? v(245, -925, 40) : v(225, -1010, 55),
  };
  return {
    spec,
    orient,
    J,
    chair: CHAIR,
    bell,
    tubes: [bow, back, branch, neck, valveLoop, ...slides, leadpipe, { id: 'mouthpiece', pts: [mp0, mp1], r: 8, tone: 'silver' }],
    valves,
    centre: v(255, (d.bottomY + d.topY) / 2 - 60, 175),
    bellHand: null,
    bellsUp: null,
  };
}

/** The scene for an instrument and orientation (memoised: the scene is a
 *  pure function of the two, and the art, the model and the zones share it). */
const memo = new Map<string, BrassScene>();
export function brassScene(spec: LowBrassSpec, orient: Orient): BrassScene {
  const key = `${spec.id}:${orient}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const s =
    spec.id === 'horn'
      ? hornScene(spec)
      : spec.id === 'tuba'
        ? uprightScene(spec, orient, { k: 1, bottomY: -700, topY: -1185, branchR: [44, 62], bellLen: 290, rT: 100, pistonsAt: v(335, -1000, 95) })
        : uprightScene(spec, orient, { k: 0.8, bottomY: -735, topY: -1100, branchR: [34, 48], bellLen: 230, rT: 72, pistonsAt: v(310, -1010, 100), side: true });
  memo.set(key, s);
  return s;
}

/** Distance from p to the segment ab (for the tests and the hit tests). */
export function segDist(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const L2 = dot(ab, ab);
  const t = L2 > 0 ? Math.max(0, Math.min(1, dot(sub(p, a), ab) / L2)) : 0;
  return len(sub(p, add(a, scale(ab, t))));
}
