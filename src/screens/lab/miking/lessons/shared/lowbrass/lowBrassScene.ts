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

/**
 * A length of tube. `r` is the radius the collision model reads; `rr`, when
 * given, is the DRAWN radius at the tube's start and end (a conical branch
 * widens along its length; drawing only, the model keeps `r`). `draw:
 * false` keeps a tube in the model but out of the picture (the drawing
 * routes the same metal through its own, smoother tube); `art: true` marks
 * a drawing-only tube the model never reads (valve slides).
 */
export type Tube = { id: string; pts: Vec3[]; r: number; tone?: 'brass' | 'silver'; rr?: readonly [number, number]; draw?: false; art?: true };
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
  /** The horn's little-finger hook (where the left little finger rests). */
  hook: Vec3 | null;
  /** The tuba's / euphonium's thumb ring (where the right thumb rests). */
  thumbRing: Vec3 | null;
};

/**
 * THE HORN'S RIGHT HAND IN THE BELL (figure pass 3, owner 2026-10-15): the
 * wrist at the rim, the back of the hand against the bell's FAR wall (the
 * side away from the player's body, turned 0.6 rad toward the top, where the
 * forearm comes in from the raised elbow), the hand pointing into the bell
 * tilted 0.45 rad toward the axis so the cupped fingers follow the flare.
 * Every point of the hand stays inside the metal (≥ 1.5 mm), the back within
 * ≈ 7 mm of the wall. Drawing and keep-out share it (lowBrassHands, lb.hand).
 */
export function hornBellHold(b: Bell): { wrist: Vec3; along: Vec3; dorsal: Vec3; thumbSide: Vec3 } {
  const a = b.axis;
  const far = norm(sub(v(0, 0, 1), scale(a, a.z)));
  const up0 = sub(sub(v(0, -1, 0), scale(a, -a.y)), scale(far, -far.y));
  const up = norm(up0);
  const roll = 0.6;
  const tilt = 0.25;
  const wall = add(scale(far, Math.cos(roll)), scale(up, Math.sin(roll)));
  return {
    wrist: add(b.rim, scale(wall, 55)),
    along: add(scale(a, -Math.cos(tilt)), scale(wall, -Math.sin(tilt))),
    dorsal: add(scale(wall, Math.cos(tilt)), scale(a, -Math.sin(tilt))),
    thumbSide: add(scale(up, Math.cos(roll)), scale(far, -Math.sin(roll))),
  };
}

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

/** A valve slide pulled out level (in the side view's plane): two legs at
 *  heights ya and yb from x0 out to xe, joined by a round crook. */
export function uLoop(x0: number, ya: number, yb: number, xe: number, z: number, n = 10): Vec3[] {
  const rb = Math.abs(yb - ya) / 2;
  const s = Math.sign(xe - x0) || 1;
  const cx = xe - s * rb;
  const cy = (ya + yb) / 2;
  const out: Vec3[] = [v(x0, ya, z), v(cx, ya, z)];
  for (let i = 1; i < n; i++) {
    const a = (Math.PI * i) / n;
    out.push(v(cx + s * rb * Math.sin(a), cy - rb * Math.cos(a) * Math.sign(yb - ya), z));
  }
  out.push(v(cx, yb, z), v(x0, yb, z));
  return out;
}
/** A slide hanging down: two legs at xa and xb from y0 down to ye (y is
 *  down), a round crook at the bottom. */
export function vLoop(xa: number, xb: number, y0: number, ye: number, z: number, n = 10): Vec3[] {
  const rb = Math.abs(xb - xa) / 2;
  const cx = (xa + xb) / 2;
  const cy = ye - rb;
  const out: Vec3[] = [v(xa, y0, z), v(xa, cy, z)];
  for (let i = 1; i < n; i++) {
    const a = Math.PI - (Math.PI * i) / n;
    out.push(v(cx + rb * Math.cos(a), cy + rb * Math.sin(a), z));
  }
  out.push(v(xb, cy, z), v(xb, y0, z));
  return out;
}

/** The bell's radius a fraction t (0 = throat … 1 = rim) along its flare:
 *  a brass bell opens slowly, then fast at the end (a drawing profile). */
export function flareR(b: Bell, t: number): number {
  return b.rT + (b.R - b.rT) * Math.pow(Math.max(0, Math.min(1, t)), 3.2);
}

/* ── the horn ── */
/**
 * THE HORN AS IT IS HELD (art fix 2026-10-16, grading: "the right arm swept
 * far back behind the torso", "the bell floating behind the hip"). The horn
 * sits FORWARD, in front of the right side of the body: the coil ≈ 9 cm in
 * front of the chest, the bell's flare leaving the bottom of the wraps and
 * opening back and out beside the right thigh — "off the leg", its rim just
 * forward of the hip and level with the top of the thigh, the right hand in
 * it. The right arm then hangs from the shoulder (the elbow down and out at
 * the side, a little behind the shoulder) and the forearm comes forward into
 * the bell, as a horn player holds it. The horn's own shape is unchanged:
 * every part keeps its place relative to the coil (HORN_SHIFT moves them
 * together); only the bell's throat is re-seated at the bottom of the wraps.
 */
const HORN_C0 = v(150, -885, 255);
export const HORN_COIL = v(310, -905, 185);
const HORN_SHIFT = sub(HORN_COIL, HORN_C0);
const hs = (x: number, y: number, z: number): Vec3 => add(v(x, y, z), HORN_SHIFT);
/** The two arms the horn player holds it with (lesson frame, mm). */
export const HORN_ARMS = {
  elbowR: v(-137, -756, 286),
  elbowL: v(142, -790, -189),
  wristL: hs(160, -860, 40),
};

function hornScene(spec: LowBrassSpec): BrassScene {
  const R = spec.bell.mm / 2;
  // The coil stands in front of the right side of the chest, its face to the right.
  const C = HORN_COIL;
  const nC = norm(v(0.25, 0, 0.97));
  const [e1, e2] = basis(nC, v(1, 0, 0));
  // The bell: from the bottom of the wraps, back, out and a little down
  // (the sourced fact: it faces the rear; french_horn/GEOMETRY_PROPOSAL.md
  // §1's direction), its rim beside the right thigh, just forward of the hip.
  const axis = norm(v(-0.8, 0.12, 0.58));
  const throat = add(C, v(18, 125, -45));
  const rim = add(throat, scale(axis, 300));
  const bell: Bell = { rim, axis, R, throat, rT: 24 };
  const loops: Tube[] = [125, 109, 94].map((r, i) => ({ id: `coil${i}`, pts: ring(add(C, scale(nC, (i - 1) * 16)), e1, e2, r, 0, 2 * Math.PI, 56), r: 7.5 + i }));
  // The bell's tail leaves the wraps at their lower front and sweeps down
  // and back into the throat.
  const tail: Tube = { id: 'bellTail', pts: spline([add(C, add(scale(e1, 0.62 * 118), scale(e2, 0.78 * 118))), add(C, add(scale(e1, 0.3 * 125), scale(e2, 1.02 * 125))), add(throat, scale(axis, -35)), throat], 8), r: 16, rr: [9.5, 24] };
  const mp0 = add(BASE.mouth, v(6, 0, 0));
  const mp1 = v(178, -1128, 38);
  const valveC = hs(205, -912, 178);
  // THE LEVERS (figure pass 3): the thumb (change) valve's lever from valve
  // 0 to a spatula above and behind the others, where the left thumb rests;
  // valves 1–3's levers converge to three spatulas ≈ 23 mm apart (an adult's
  // finger pitch) on the player's left, in front of the casings — index on
  // top; the little-finger hook just below the ring finger's spatula.
  const SPAT: Vec3[] = [hs(183, -925, 145), hs(250, -952, 138), hs(245, -929, 141), hs(240, -906, 144)];
  const valves: Valve[] = [0, 1, 2, 3].map((i) => {
    const c = add(hs(186, -975, 182), scale(v(0.22, 0.97, 0), i * 40));
    return { c, axis: nC, r: 21, h: 46, kind: 'rotary', lever: sub(SPAT[i], c) };
  });
  const hook = hs(233, -880, 150);
  // The leadpipe: from the mouthpiece down and forward to the valves.
  const leadpipe: Tube = { id: 'leadpipe', pts: spline([mp1, v(270, -1112, 70), hs(232, -1080, 120), hs(250, -1000, 190), hs(222, -960, 205)], 8), r: 9 };
  const slides: Tube[] = [
    { id: 'slide1', pts: spline([add(C, scale(e1, 100)), add(add(C, scale(e1, 175)), scale(e2, -20)), add(add(C, scale(e1, 175)), scale(e2, 30)), add(add(C, scale(e1, 100)), scale(e2, 40))], 6), r: 8 },
    { id: 'slide2', pts: spline([add(add(C, scale(e2, -110)), scale(e1, -30)), add(add(C, scale(e2, -170)), scale(e1, -40)), add(add(C, scale(e2, -170)), scale(e1, 20)), add(add(C, scale(e2, -110)), scale(e1, 20))], 6), r: 8 },
  ];
  // The right hand in the bell (hornBellHold: the back of the hand on the far
  // wall); the upper arm hangs down and out at the side, the forearm comes
  // forward into the bell (upper arm ≈ 300, forearm ≈ 255).
  const hold = hornBellHold(bell);
  const wristR = hold.wrist;
  const handR = add(wristR, scale(hold.along, 120));
  // The left hand on the levers: the wrist in front of the chest, the elbow
  // down and out at the side (upper arm ≈ 300, forearm ≈ 255).
  const J: Joints = {
    ...BASE,
    elbowR: HORN_ARMS.elbowR,
    wristR,
    handR,
    elbowL: HORN_ARMS.elbowL,
    wristL: HORN_ARMS.wristL,
    handL: SPAT[2],
  };
  // The little-finger hook: a half ring under the finger, its stem to valve 3's casing.
  const hookArc: Vec3[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = (Math.PI * i) / 8;
    hookArc.push(add(hook, v(-9 * Math.cos(t) * 0.5, 11 * Math.sin(t), 9 * Math.cos(t))));
  }
  const hookTube: Tube = { id: 'fingerHook', pts: [add(valves[3].c, v(0, 6, -16)), add(hook, v(4, 14, 12)), ...hookArc.slice(2)], r: 2.6, art: true };
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
    tubes: [...loops, tail, leadpipe, ...slides, { id: 'mouthpiece', pts: [mp0, mp1], r: 7, tone: 'silver' }, { id: 'toValves', pts: spline([v(222, -960, 205), valveC, add(C, scale(e2, -60))], 6), r: 8 }, hookTube],
    valves,
    centre: C,
    bellHand: { wrist: wristR, tip: handR },
    bellsUp,
    hook,
    thumbRing: null,
  };
}

/* ── the tuba and the euphonium: an upright body on the lap, the bell up or
 *    turned to the front ── */
/** `arm`: the right arm's elbow and wrist over the pistons and the left
 *  arm's (figure pass 3: the posed hands, lowBrassHands, turn about these
 *  wrists). */
type UprightDims = { k: number; bottomY: number; topY: number; branchR: [number, number]; bellLen: number; rT: number; pistonsAt: Vec3; side?: boolean; arm: { elbowR: Vec3; wristR: Vec3; elbowL: Vec3; wristL: Vec3; handL: Vec3 } };

function uprightScene(spec: LowBrassSpec, orient: Orient, d: UprightDims): BrassScene {
  const R = spec.bell.mm / 2;
  const k = d.k;
  // The body: the large bell branch (front) and the small branches (back),
  // joined by the bottom bow, leaning a little back toward the player.
  const bot = v(250, d.bottomY, 165);
  const top = v(215, d.topY, 240);
  const backBot = v(175, d.bottomY - 30 * k, 85);
  const backTop = v(170, d.topY + 140 * k, 70);
  // ── THE DRAWING (round 2). An upright B-flat tuba from the player's
  // right, real-world sizes (the euphonium the same layout at k = 0.8):
  //   body: one conical tube with no step. The back branch (dia. about
  //   45 -> 100 mm) comes down from the valve section, round the BOTTOM BOW
  //   (tube dia. about 100-115 mm, the U seen open toward the viewer), and up
  //   the bell branch (about 112 -> 185 mm) into the throat; bell rim 443.
  //   valves: FOUR top-action pistons in a row front to back (casing about
  //   dia. 30 mm, about 150 mm tall at a 36 mm pitch; valve 1 nearest the
  //   player, the right hand's fingers across the four buttons).
  //   valve slides: U loops of about 21 mm tube with round crooks hanging
  //   BELOW the cluster: 2nd shortest, 1st, 3rd, and the 4th's long loop.
  //   leadpipe: from the mouthpiece receiver forward and down in front of
  //   the cluster into the MAIN TUNING SLIDE, a big U-crook (tube about
  //   24 mm), then back up over the top into the front casing.
  //   stays: nickel braces between the bell branch, the cluster and the
  //   loops. The collision model keeps its own tubes (draw: false) and radii.
  const rT = d.rT;
  const P0 = d.pistonsAt;
  const VP = 36 * k;
  const vx0 = P0.x - 5 * k;
  const nTop = d.side ? 3 : spec.valves.n;
  // The valve cluster sits on the NEAR (player's right) side of the body,
  // clear of the bell branch (its near surface at about z = top.z + 0.9 rT
  // high up): the casings' centre line just beyond it, so from the player's
  // right the order is body (far) -> cluster and slides -> right arm (near).
  const vz = top.z + 0.25 * d.rT;
  const valves: Valve[] = Array.from({ length: nTop }, (_, i) => ({ c: v(vx0 + i * VP, P0.y, vz), axis: v(0, -1, 0), r: 15 * k, h: 120 * k, kind: 'piston' as const }));
  // The euphonium's fourth valve sits at the side, under the left hand.
  if (d.side) valves.push({ c: v(250, -930 + 20 * (1 - k), 52), axis: v(0, 0, -1), r: 15 * k, h: 70, kind: 'piston' });
  const yb = P0.y + 60 * k; // the casings' bottom caps
  const xs = valves.slice(0, nTop).map((q) => q.c.x);
  const bow: Tube = { id: 'bottomBow', pts: spline([backTop, backBot, v(205, d.bottomY + 60 * k, 120), bot], 8), r: 46 * k, draw: false };
  const branch: Tube = { id: 'bellBranch', pts: spline([bot, v(240, (d.bottomY + d.topY) / 2, 200), top], 8), r: d.branchR[1], draw: false };
  const backX = 215 - 85 * k;
  const bellX = 215 + 67 * k;
  const bowLow = d.bottomY + 58 * k;
  const branchArt: Tube = { id: 'branchArt', pts: spline([v(bellX, d.bottomY + 4, 165), v(bellX - 8, d.bottomY - 160 * k, 185), v(240, (d.bottomY + d.topY) / 2 - 40, 210), top], 8), r: d.branchR[1], rr: [0.56 * rT, 0.92 * rT], art: true };
  const bowArt: Tube = { id: 'bowArt', pts: spline([v(backX, d.bottomY - 10, 95), v(backX + 8, bowLow - 30 * k, 105), v((backX + bellX) / 2, bowLow, 125), v(bellX - 8, bowLow - 30 * k, 150), v(bellX, d.bottomY + 4, 165)], 7), r: 46 * k, rr: [0.5 * rT, 0.56 * rT], art: true };
  const backArt: Tube = {
    id: 'backArt',
    // Behind the bell branch (the far side) from the valve section down.
    pts: spline([v(262, P0.y - 52 * k, 95), v(backX + 25, P0.y - 30 * k, 88), v(backX + 4, P0.y + 60 * k, 88), v(backX, d.bottomY - 10, 95)], 8),
    r: d.branchR[0],
    rr: [0.26 * rT, 0.5 * rT],
    art: true,
  };
  let bell: Bell;
  let neck: Tube;
  if (orient === 'up') {
    const axis = norm(v(0, -1, 0.17));
    const throat = add(top, scale(axis, 40));
    const rim = add(throat, scale(axis, d.bellLen));
    bell = { rim, axis, R, throat, rT: d.rT };
    neck = { id: 'bellNeck', pts: [top, throat], r: d.rT, rr: [0.92 * rT, rT] };
  } else {
    const axis = norm(v(1, -0.09, 0));
    const bend = add(top, v(-10, -130 * k, 10));
    const throat = add(bend, v(70 * k, -20 * k, 0));
    const rim = add(throat, scale(axis, d.bellLen));
    bell = { rim, axis, R, throat, rT: d.rT };
    neck = { id: 'bellNeck', pts: spline([top, add(top, v(-12, -70 * k, 6)), bend, throat], 8), r: d.rT, rr: [0.92 * rT, rT] };
  }
  const mp0 = add(BASE.mouth, v(6, 0, 0));
  const mp1 = v(185, -1135, 30);
  const leadpipe: Tube = { id: 'leadpipe', pts: spline([mp1, v(250, -1110, 55), add(P0, v(-10, -70 * k, -10)), add(P0, v(-20, 20, -12))], 8), r: 10 * k + 2, draw: false };
  const valveLoop: Tube = { id: 'valveLoop', pts: spline([add(P0, v(-30, 60 * k, 0)), add(P0, v(-60, 80 * k, 60)), add(top, v(30, 260 * k, -10))], 8), r: 14 * k, draw: false };
  const slides: Tube[] = [
    { id: 'slide1', pts: spline([add(P0, v(-40, 30 * k, 110)), add(P0, v(-40, 30 * k, 200 * k + 60)), add(P0, v(-40, 80 * k, 200 * k + 60)), add(P0, v(-40, 80 * k, 110))], 6), r: 13 * k, draw: false },
    { id: 'slide2', pts: spline([add(backBot, v(0, -120 * k, -10)), add(backBot, v(-70 * k, -120 * k, -40)), add(backBot, v(-70 * k, -200 * k, -40)), add(backBot, v(0, -200 * k, -10))], 6), r: 18 * k, draw: false },
  ];
  const back: Tube = { id: 'backBranch', pts: spline([backBot, v(172, (d.bottomY + d.topY) / 2, 78), backTop, add(backTop, v(40, -40 * k, 30)), add(P0, v(-40, -40 * k, 0))], 8), r: d.branchR[0], draw: false };
  const tr = 10.5 * k;
  const xf = xs[nTop - 1]; // the front casing
  // The leadpipe and the main tuning slide (in front of the cluster).
  const ms0 = xf + 50 * k;
  const ms1 = xf + 104 * k;
  const msLow = P0.y + 130 * k;
  // The MOUTHPIECE sits in the leadpipe's receiver: from the lips it points
  // out to the player's right, and the leadpipe (tapering about 12 -> 23 mm)
  // runs out on the NEAR side of the bell branch, over the right hand, and
  // down in front of the cluster into the main tuning slide. (The model's
  // own mouthpiece and leadpipe keep-outs are unchanged.)
  const mpEnd = v(mp0.x + 18, mp0.y + 10, mp0.z + 80);
  const mpArt: Tube = { id: 'mpArt', pts: [mp0, mpEnd], r: 8, tone: 'silver', art: true };
  // Its route clears the near arm: it rises from the receiver over the
  // wrist (yHi, about 35 mm above the wrist's top), passes the bell stack on
  // its near side (zClear), then drops in BEHIND the hand (z just beyond the
  // cluster, nearer the body than the hand) and comes down in front of the
  // cluster: no part of it is ever drawn over the right forearm or hand.
  const yHi = P0.y - 199 * k;
  const zClear = top.z + rT + 22;
  const leadArt: Tube = {
    id: 'leadArt',
    pts: spline([mpEnd, v(mpEnd.x - 4, mpEnd.y + 2, 200), v(mpEnd.x + 2, yHi + 15, top.z + 0.6 * rT), v(180, yHi - 4, zClear), v(262, yHi - 4, zClear), v(xs[0], yHi + 4, vz + 30), v(xs[2] + 14 * k, yHi + 6 * k, vz), v(xf + 36 * k, P0.y - 128 * k, vz + 8), v(ms0 - 6 * k, P0.y - 70 * k, vz + 16), v(ms0, P0.y - 20 * k, vz + 20)], 8),
    r: 11 * k,
    rr: [6 * k, 11.5 * k],
    art: true,
  };
  // The valve section's tubing leaves the rear casing and passes behind the
  // bell branch to the back branch.
  const valveExit: Tube = { id: 'valveExit', pts: [v(xs[0] - 10 * k, P0.y - 24 * k, vz - 10), v(xs[0] - 34 * k, P0.y - 30 * k, vz - 52)], r: 10 * k, art: true };
  const art: Tube[] = [
    mpArt,
    leadArt,
    valveExit,
    { id: 'mainSlide', pts: [...vLoop(ms0, ms1, P0.y - 20 * k, msLow, vz + 20).slice(0, -1), v(ms1, P0.y - 40 * k, vz + 20), v(ms1 - 12 * k, P0.y - 66 * k, vz + 14), v(xf + 22 * k, P0.y - 62 * k, vz + 6), v(xf + 12 * k, P0.y - 45 * k, vz)], r: 12 * k, art: true },
    // Valve slides hanging below the cluster, nearest-the-viewer last.
    { id: 'vslide1', pts: vLoop(xs[0] - 13 * k, xs[0] + 13 * k, yb - 6 * k, yb + 110 * k, vz + 26), r: tr, art: true },
    { id: 'vslide2', pts: vLoop(xs[1] - 10 * k, xs[1] + 12 * k, yb - 6 * k, yb + 48 * k, vz + 30), r: tr, art: true },
    { id: 'vslide3', pts: vLoop(xs[2] - 13 * k, xs[2] + 15 * k, yb - 6 * k, yb + 170 * k, vz + 22), r: tr, art: true },
  ];
  if (nTop === 4) art.push({ id: 'vslide4', pts: vLoop(xs[3] - 8 * k, xs[3] + 30 * k, yb - 6 * k, yb + 245 * k, vz + 16), r: tr * 1.12, art: true });
  // Knuckles: the short bent ports joining neighbouring casings, low down.
  for (let i = 0; i < nTop - 1; i++) {
    const a = xs[i] + 12 * k;
    const b = xs[i + 1] - 12 * k;
    art.push({ id: `knuckle${i}`, pts: [v(a, P0.y + 30 * k, vz - 6), v((a + b) / 2, P0.y + 36 * k, vz - 6), v(b, P0.y + 30 * k, vz - 6)], r: 8 * k, art: true });
  }
  // Nickel stays (braces) between the branch, the cluster and the loops.
  const stay = (id: string, a: Vec3, b: Vec3): Tube => ({ id, pts: [a, b], r: 3.2, tone: 'silver', art: true });
  art.push(stay('stayA', v(bellX - 20, P0.y - 30 * k, vz - 10), v(xs[0] - 13 * k, P0.y - 30 * k, vz - 10)));
  art.push(stay('stayB', v(bellX + 10, yb + 95 * k, vz + 10), v(xs[nTop - 1] - 8 * k, yb + 95 * k, vz + 14)));
  art.push(stay('stayC', v(ms0, msLow - 40 * k, vz + 20), v(xf + 22 * k, msLow - 40 * k, vz + 18)));
  // The right hand rests with its fingertips on the four buttons.
  // The fingertips' point: ON the pearl button tops (button top at 94 mm
  // above the casing's centre on the tuba), over valve 3, so the fingers
  // arch forward over valves 1-3 with the little finger free by the 4th.
  const handR = v(xs[Math.min(2, nTop - 1)], P0.y - (94 - 7) * k, vz);
  // (Figure pass 3, owner 2026-10-15.) The right arm comes round on the near
  // side: the elbow low at the side, the forearm rising to the wrist above
  // and out beyond the buttons, the hand arched over them from the player's
  // right — the fingers across the row of pistons, one on each (the old
  // wrist sat behind the cluster, so the fingers could only reach one).
  const J: Joints = {
    ...BASE,
    elbowR: d.arm.elbowR,
    wristR: d.arm.wristR,
    handR,
    elbowL: d.arm.elbowL,
    wristL: d.arm.wristL,
    handL: d.arm.handL,
  };
  // The thumb ring, where the right thumb falls as the hand drapes over the
  // pistons from the player's right (a small ring on a stem from valve 1's
  // casing): the tuba's under the palm on the bell side of the cluster,
  // between valves 1 and 2 just below the buttons; the euphonium's (its hand
  // nearer the player) on the player's side of valve 1.
  const thumbRing = d.side ? v(xs[0] - 22, P0.y - 62, vz + 24) : v(xs[0] + 12 * k, P0.y - 74 * k, vz - 15);
  {
    const [e1, e2] = basis(THUMB_RING_AXIS, v(0, 1, 0));
    const stem0 = d.side ? v(xs[0] - 15 * k + 2, P0.y - 52 * k, vz + 6) : v(xs[0], P0.y - 52 * k, vz - 13 * k);
    art.push({ id: 'thumbRingStem', pts: [stem0, add(thumbRing, scale(e1, 11))], r: 2.4, art: true });
    art.push({ id: 'thumbRing', pts: ring(thumbRing, e1, e2, 11, 0, 2 * Math.PI, 20), r: 2.6, art: true });
  }
  return {
    spec,
    orient,
    J,
    chair: CHAIR,
    bell,
    tubes: [bow, back, branch, backArt, bowArt, branchArt, neck, valveLoop, ...slides, ...art, leadpipe, { id: 'mouthpiece', pts: [mp0, mp1], r: 8, tone: 'silver', draw: false }],
    valves,
    centre: v(255, (d.bottomY + d.topY) / 2 - 60, 175),
    bellHand: null,
    bellsUp: null,
    hook: null,
    thumbRing,
  };
}
/** The thumb ring's axis: along the right thumb's last bone as it lies in the ring. */
const THUMB_RING_AXIS = norm(v(0.2, 0.5, -0.85));

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
        ? uprightScene(spec, orient, { k: 1, bottomY: -700, topY: -1185, branchR: [44, 62], bellLen: 290, rT: 100, pistonsAt: v(335, -1000, 95), arm: { elbowR: v(176, -949, 401), wristR: v(340, -1140, 360), elbowL: v(191, -847, -139), wristL: v(300, -920, 80), handL: v(332, -936, 176) } })
        : uprightScene(spec, orient, { k: 0.8, bottomY: -735, topY: -1100, branchR: [34, 48], bellLen: 230, rT: 72, pistonsAt: v(310, -1010, 100), side: true, arm: { elbowR: v(146, -925, 418), wristR: v(320, -1110, 400), elbowL: v(136, -789, -225), wristL: v(150, -940, -20), handL: v(250, -926, -25) } });
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
