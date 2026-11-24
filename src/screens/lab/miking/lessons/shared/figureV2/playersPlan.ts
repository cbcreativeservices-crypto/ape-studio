/**
 * FIGURE V2 — A CAST MEMBER PLAYING WITH STICKS OR MALLETS (wave 3, sets
 * 3b–3d of D78, 2026-11-24: the shared figure seen from the side — the
 * timpanist, the concert bass drummer, Foley performers with a tool, …).
 * Pure: no React, no Skia.
 *
 * Each held stick or mallet is given in 3-D in the lesson's own frame (+x
 * forward, +y DOWN, +z toward the side-view camera) as the lesson already
 * poses it: the point the hand closes on (the fulcrum) and the far end (the
 * ball or bead). The arm is solved in 3-D from the person's shoulder (an
 * adult two-bone arm, the elbow hanging down and back, a little out from the
 * ribs), the hand closed on the stick with the APPROVED stick grip (grip.ts
 * stickHold: the drummer's hand, one 3-D grip — fingers round one side, the
 * thumb's pad on the other, the stick through the fist), and the person drawn
 * by the approved renderers in both views from the same 3-D arm:
 *   side  sidePlan on the lesson's side pose, its elbows and wrists replaced
 *         by the solved arm (the head, body and legs are the pose's own);
 *   top   the cast member from above (topPerson) with these arms (the
 *         drummer's top-view arm: sleeve, cuff, the back of the hand).
 * A hand that holds nothing hangs at the side (the approved resting hand).
 * Nothing here moves a stick, a mallet or any measured point.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import type { V3 } from '../players/handModel.ts';
import { stickHold, type StickHold } from './grip.ts';
import { armPlan, sidePlan, type SidePlan, type Sole } from './sidePlan.ts';
import { personTopPlan } from './topPerson.ts';
import { placeHand, type PlacedHand } from './authoredHands.ts';
import type { TopPlan } from './topPlan.ts';
import { crossZ, P, sub, unit, type Pt } from './geom.ts';
import type { CastMember } from './cast';

/** A pose moved by (du, dv) in its view (every joint; an 'above' pose turns about its neck, which moves too). */
export function shiftPose(pose: PlayerPose, du: number, dv: number): PlayerPose {
  const m = (q: Pt): Pt => P(q.u + du, q.v + dv);
  return {
    ...pose,
    head: { ...pose.head, c: m(pose.head.c) },
    neck: m(pose.neck),
    shoulderR: m(pose.shoulderR),
    shoulderL: m(pose.shoulderL),
    elbowR: m(pose.elbowR),
    elbowL: m(pose.elbowL),
    handR: { ...pose.handR, wrist: m(pose.handR.wrist) },
    handL: { ...pose.handL, wrist: m(pose.handL.wrist) },
    hipR: m(pose.hipR),
    hipL: m(pose.hipL),
    kneeR: m(pose.kneeR),
    kneeL: m(pose.kneeL),
    footR: m(pose.footR),
    footL: m(pose.footL),
    floor: pose.floor === null ? null : pose.floor + dv,
    ...(pose.strapTo ? { strapTo: m(pose.strapTo) } : {}),
  };
}

/** A side pose mirrored about u = c (the player turned to face the other way along u). */
export function mirrorPoseU(pose: PlayerPose, c: number, dv = 0): PlayerPose {
  const m = (q: Pt): Pt => P(2 * c - q.u, q.v + dv);
  return {
    ...pose,
    facing: -(pose.facing ?? 1),
    head: { ...pose.head, c: m(pose.head.c) },
    neck: m(pose.neck),
    shoulderR: m(pose.shoulderR),
    shoulderL: m(pose.shoulderL),
    elbowR: m(pose.elbowR),
    elbowL: m(pose.elbowL),
    handR: { ...pose.handR, wrist: m(pose.handR.wrist), dir: Math.PI - pose.handR.dir },
    handL: { ...pose.handL, wrist: m(pose.handL.wrist), dir: Math.PI - pose.handL.dir },
    hipR: m(pose.hipR),
    hipL: m(pose.hipL),
    kneeR: m(pose.kneeR),
    kneeL: m(pose.kneeL),
    footR: m(pose.footR),
    footL: m(pose.footL),
    floor: pose.floor === null ? null : pose.floor + dv,
    ...(pose.strapTo ? { strapTo: m(pose.strapTo) } : {}),
  };
}

/** One held stick: which hand, where it closes (the fulcrum) and the far end (bead / ball centre). */
export type Held3 = { hand: 'R' | 'L'; fulcrum: V3; bead: V3 };

/** One solved arm. */
export type Arm3 = { hand: 'R' | 'L'; shoulder: V3; elbow: V3; wrist: V3; hold: StickHold };

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub3 = (a: V3, b: V3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add3 = (a: V3, b: V3) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul3 = (a: V3, k: number) => v3(a.x * k, a.y * k, a.z * k);
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit3 = (a: V3) => mul3(a, 1 / (len3(a) || 1));

/** An adult arm (mm): shoulder → elbow, elbow → the pose's wrist (metalFigure METAL_ARM). */
export const PLAYER_ARM = { upper: 310, fore: 260 } as const;
/** The pose's wrist sits this far behind the fulcrum along the stick (the
 *  drummer's pose: stickPose, 100 mm — a compact fist with the forearm in line). */
export const WRIST_BACK = 100;

/**
 * A two-bone arm from `sh` toward `w`: the wrist kept in reach (98.5 % of the
 * arm), the elbow where both bones keep their lengths, bent toward `hint`.
 */
export function solveArm3(sh: V3, w: V3, hint: V3): { elbow: V3; wrist: V3 } {
  const U = PLAYER_ARM.upper;
  const F = PLAYER_ARM.fore;
  const d = sub3(w, sh);
  const L = len3(d) || 1;
  const n = mul3(d, 1 / L);
  const Lc = Math.max(Math.abs(U - F) + 40, Math.min((U + F) * 0.985, L));
  const wrist = add3(sh, mul3(n, Lc));
  const a = (U * U - F * F + Lc * Lc) / (2 * Lc);
  const r = Math.sqrt(Math.max(0, U * U - a * a));
  let pv = sub3(hint, sh);
  pv = sub3(pv, mul3(n, dot3(pv, n)));
  const pl = len3(pv) || 1;
  return { elbow: add3(add3(sh, mul3(n, a)), mul3(pv, r / pl)), wrist };
}

/**
 * The arm that holds `h` from `shoulder`: the pose's wrist WRIST_BACK behind
 * the fulcrum along the stick, the elbow solved (hanging down and back from
 * the shoulder, `out` mm out from the ribs on the arm's own side `side`: +1
 * toward +z), and the hand closed on the stick (stickHold). `level`: see below.
 */
export function heldArm3(h: Held3, shoulder: V3, side: 1 | -1, o: { out?: number; back?: number; level?: number; /** the way the player faces along x (default +1) */ facing?: 1 | -1 } = {}): Arm3 {
  const s = unit3(sub3(h.bead, h.fulcrum));
  // (`level` 0–1: the forearm runs that much nearer the level than the stick does — a stick raised by
  // the wrist, the forearm staying low: the wrist bends back by the rest)
  const flat = unit3(v3(s.x, 0, s.z));
  const k = o.level ?? 0;
  const wd = unit3(add3(mul3(s, 1 - k), mul3(flat, k)));
  const w0 = sub3(h.fulcrum, mul3(wd, WRIST_BACK));
  const hint = add3(shoulder, v3(-(o.facing ?? 1) * (o.back ?? 90), 320, side * (o.out ?? 70)));
  const { elbow, wrist } = solveArm3(shoulder, w0, hint);
  const hold = stickHold({ hand: h.hand, elbow, wrist, fulcrum: h.fulcrum, bead: h.bead });
  return { hand: h.hand, shoulder, elbow, wrist, hold };
}

/** The forearm's tilt toward the side-view camera (+z): the sine of its angle out of the picture. */
const tiltOf = (a: Arm3) => {
  const d = sub3(a.wrist, a.elbow);
  return d.z / (len3(d) || 1);
};
/** The forearm's rise toward a camera ABOVE (y grows downward): the sine. */
const riseOf = (a: Arm3) => {
  const d = sub3(a.wrist, a.elbow);
  return -d.y / (len3(d) || 1);
};

export type PlayerSideOpts = {
  /** The near (R) and far (L) arms, when they hold something; a missing arm hangs at rest. */
  near?: Arm3 | null;
  far?: Arm3 | null;
  soleR?: Sole;
  soleL?: Sole;
  nod?: number;
  seatV?: number;
};

const sideCache = new WeakMap<PlayerPose, Map<string, { pose: PlayerPose; plan: SidePlan }>>();

/** The side-view pose with its arms replaced by the solved ones (memoised: sidePlan caches by pose). */
export function playerSidePlan(pose: PlayerPose, who: CastMember, o: PlayerSideOpts = {}): SidePlan {
  let m = sideCache.get(pose);
  if (!m) {
    m = new Map();
    sideCache.set(pose, m);
  }
  const key = JSON.stringify({ w: who.id, n: o.near ? [o.near.elbow, o.near.hold.fulcrum, o.near.hold.dir] : null, f: o.far ? [o.far.elbow, o.far.hold.fulcrum, o.far.hold.dir] : null, sr: o.soleR ?? null, sl: o.soleL ?? null, nd: o.nod ?? 0, s: o.seatV ?? null });
  const hit = m.get(key);
  if (hit) return hit.plan;
  const p2 = (q: V3): Pt => P(q.x, q.y);
  const posed: PlayerPose = {
    ...pose,
    ...(o.near ? { elbowR: p2(o.near.elbow), handR: { ...pose.handR, wrist: p2(o.near.wrist), kind: 'grip' as const } } : {}),
    ...(o.far ? { elbowL: p2(o.far.elbow), handL: { ...pose.handL, wrist: p2(o.far.wrist), kind: 'grip' as const } } : {}),
  };
  const plan = sidePlan(posed, {
    head: who.head,
    body: who.body,
    holdR: o.near?.hold ?? null,
    holdL: o.far?.hold ?? null,
    ...(o.near ? {} : { restR: 'restSide' as const }),
    ...(o.far ? {} : { restL: 'restSide' as const }),
    // (a forearm runs AWAY — behind its own elbow, the hand tucked behind the cuff seen end-on — only
    // when it points well into the picture, over 30°: a forearm turned only a little away is drawn across)
    awayR: o.near ? tiltOf(o.near) < -0.5 : false,
    awayL: o.far ? tiltOf(o.far) < -0.5 : false,
    tiltR: o.near ? tiltOf(o.near) : 0,
    tiltL: o.far ? tiltOf(o.far) : 0,
    ...(o.soleR ? { soleR: o.soleR } : {}),
    ...(o.soleL ? { soleL: o.soleL } : {}),
    ...(o.nod ? { nod: o.nod } : {}),
    ...(o.seatV !== undefined ? { seatV: o.seatV } : {}),
  });
  m.set(key, { pose: posed, plan });
  return plan;
}

/** The hand from above on its stick (as topPlan's drummer: authoredHands 'backTop', the thumb under the hand). */
export function placedTop(h: StickHold): PlacedHand {
  const d = h.dir;
  const Q = (k: number) => P(h.fulcrum.x + d.x * k, h.fulcrum.z + d.z * k);
  const F = Q(0);
  const W = P(h.poseWrist.x, h.poseWrist.z);
  const sx = Math.max(0.45, Math.min(1, Math.hypot(h.sk.frame.x.x, h.sk.frame.x.z)));
  const axis = unit(P(h.sk.frame.x.x, h.sk.frame.x.z));
  const tip = h.sk.thumb.joints[h.sk.thumb.joints.length - 1];
  const mirror = crossZ(axis, sub(P(tip.x, tip.z), W)) < 0;
  return placeHand('backTop', W, F, Q(-116), Q(290), sx, { mirror });
}

const topCache = new WeakMap<PlayerPose, Map<string, TopPlan>>();

/**
 * The cast member from above (the 'above' pose, as topPerson draws it) with
 * the solved arms: each from its 3-D shoulder through its elbow to the hand on
 * its stick. `near` is the person's right (+z) arm, `far` the left.
 */
export function playerTopPlan(pose: PlayerPose, who: CastMember, near: Arm3 | null, far: Arm3 | null): TopPlan {
  let m = topCache.get(pose);
  if (!m) {
    m = new Map();
    topCache.set(pose, m);
  }
  const key = JSON.stringify({ w: who.id, n: near ? [near.elbow, near.hold.fulcrum, near.hold.dir] : null, f: far ? [far.elbow, far.hold.fulcrum, far.hold.dir] : null });
  const hit = m.get(key);
  if (hit) return hit;
  const base = personTopPlan(pose, who, {});
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const xz = (q: V3): Pt => P(q.x, q.z);
  const arm = (a: Arm3 | null, keep: TopPlan['arms']['near']) => {
    if (!a) return keep;
    const placed = placedTop(a.hold);
    return armPlan(xz(a.shoulder), xz(a.elbow), placed.wrist, a.hold, false, placed, riseOf(a), null, true, armB);
  };
  const plan: TopPlan = { ...base, arms: { near: arm(near, base.arms.near), far: arm(far, base.arms.far) } };
  m.set(key, plan);
  return plan;
}
