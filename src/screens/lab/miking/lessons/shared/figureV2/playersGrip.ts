/**
 * FIGURE V2 — A CAST MEMBER'S HAND CLOSED ROUND A ROD (independent review of
 * the percussion and Foley pictures, 2026-11-24: "fists drawn as blocks or
 * mittens with a sausage thumb laid on top, fingers as separate outlined pills,
 * sitting ON the object instead of closed ROUND it"). Pure: no React, no Skia.
 *
 * Every hand that holds a mallet, a pole, a chair post, a door handle, a jug's
 * handle … is the APPROVED held-mic hand (heldHands.ts placeGrip, read only):
 * ONE 3-D hand round the rod, projected in each view — the rod in the palm
 * across the base of the fingers, the four fingers round one edge, the thumb
 * round the OTHER, their ends meeting on the rod's far side; the fingers told
 * apart by shallow creases from the tips, the knuckles low swells in one edge.
 * The rod passes THROUGH the fist (painted between the hand's parts behind it
 * and the parts in front of it).
 *
 * THE HAND ON A STICK OR MALLET (the timpanist, the bass drummer): the shaft
 * lies across the palm from under the heel of the hand to between the thumb's
 * pad and the side of the index at its first joint; the head end comes out
 * past the thumb and index, the butt a little past the little finger's edge.
 * The grip model takes the shaft 62° off the hand's own line (its largest
 * tilt, 28°); the wrist bends toward the little finger by `ulnar` (a stick
 * grip's real wrist), so the forearm runs between the hand's line and the
 * shaft — the mallet reads as the forearm carried on.
 *
 * Which side of the hand faces where: the lesson says where the BACK of the
 * hand faces (`back`: palm-down = up; the timpani grip between palm-down and
 * thumb-up = up and out). From that and the shaft the hand's whole frame
 * follows (heldHands gripFrame: N = h × e₂).
 *
 * LEFT AND RIGHT. The grip model is a right hand in a left-handed frame (its
 * own). The lessons' frames have +y DOWN: in one that is right-handed for the
 * person, the model is a LEFT hand — that hand is built in the mirror (about
 * the person's own middle plane) and drawn back through it (boomGrip's way).
 *
 * Nothing here moves a rod, a grip point or any measured point: `fist` IS the
 * lesson's grip point (the rod's centre line in the middle of the fist).
 */
import { placeGrip, type PlacedGrip, type V3 } from './heldHands.ts';
import { armPlan, sidePlan, type ArmPlan, type SidePlan, type Sole } from './sidePlan.ts';
import { personTopPlan } from './topPerson.ts';
import type { TopPlan } from './topPlan.ts';
import { P, type Pt } from './geom.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import type { CastMember } from './cast';

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub3 = (a: V3, b: V3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add3 = (a: V3, b: V3) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul3 = (a: V3, k: number) => v3(a.x * k, a.y * k, a.z * k);
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross3 = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit3 = (a: V3) => mul3(a, 1 / (len3(a) || 1));

/** The grip model's largest tilt of the rod toward the knuckles (heldHands gripFrame). */
const BETA = (28 * Math.PI) / 180;
/** An adult arm (mm): the same as the players' (playersPlan PLAYER_ARM). */
export const GRIP_ARM = { upper: 310, fore: 260 } as const;

/** The person's sagittal plane (a point on it and the person's right, unit): a geometric left hand is built
 *  in the mirror about it. */
export type Mirror = { c: V3; n: V3 };
const mirP = (m: Mirror | null, p: V3): V3 => (m ? sub3(p, mul3(m.n, 2 * dot3(sub3(p, m.c), m.n))) : p);
const mirV = (m: Mirror | null, d: V3): V3 => (m ? sub3(d, mul3(m.n, 2 * dot3(d, m.n))) : d);

/** One arm closed on a rod, in the lesson's world. */
export type GripArm3 = {
  hand: 'R' | 'L';
  shoulder: V3;
  elbow: V3;
  /** The rod's centre line in the middle of the fist (the lesson's grip point). */
  fist: V3;
  /** Where the forearm meets the heel of the hand (the cuff's end lies just short of it). */
  wrist: V3;
  /** The rod's direction toward the thumb's side (a mallet: toward its head). */
  rod: V3;
  /** The back of the hand (unit). */
  back: V3;
  /** The rod's radius where the hand closes (mm). */
  R: number;
  mirror: Mirror | null;
  /** The upper arm and the forearm cannot reach the wrist: drawn at full reach (reported, never hidden). */
  far: boolean;
  /** How far the wrist bends off the forearm (degrees). */
  wristBend: number;
  /** The rod's tilt toward the knuckles (radians; 0 = square across the palm, a bar or a rail; 28° = a stick
   *  lying diagonally across the palm). */
  beta: number;
};

export type GripArmIn = {
  hand: 'R' | 'L';
  /** The lesson's grip point (the rod's centre in the middle of the fist) and a point on the rod toward the
   *  thumb's side (a mallet's head). */
  fist: V3;
  toward: V3;
  shoulder: V3;
  /** Where the BACK of the hand faces (world; made square to the rod). */
  back: V3;
  /** The person: facing, right, a point on the middle plane (world). */
  fwd: V3;
  right: V3;
  centre: V3;
  /** The rod's radius at the hand (mm). */
  R: number;
  /** The wrist's bend toward the little finger (degrees; the forearm turned that far from the hand's line
   *  toward the rod). Default 22. */
  ulnar?: number;
  /** How the rod lies across the palm (degrees toward the knuckles): 28 (default, the grip model's most) for a
   *  stick or a mallet running diagonally from the heel of the hand out between the thumb and the index; about
   *  0–8 for a bar, a rail or a handle held square across the palm (a power grip). */
  tilt?: number;
  /** The elbow hangs toward here (world; default: down, a little back and out from the shoulder). */
  elbowHint?: V3;
  /** The world's up (default −y: the lessons' +y is down). */
  up?: V3;
};

/**
 * The two-bone arm from `sh` to `w` (the wrist kept where the grip puts it): of the elbows both bones allow (a
 * circle), the one whose forearm runs nearest `fd` (the wrist easy), never in through the chest (`outw`: the
 * arm's own side; at most `inMax` mm in of the shoulder), never higher than `upMin` mm below the shoulder
 * (`up`: the world's up); with `hint`, the elbow nearest it instead.
 */
function solve(sh: V3, w: V3, fd: V3, outw: V3, up: V3, hint: V3 | null, inMax = 10, upMin = 140): { elbow: V3; far: boolean } {
  const U = GRIP_ARM.upper;
  const F = GRIP_ARM.fore;
  const d = sub3(w, sh);
  const L = len3(d) || 1;
  const n = mul3(d, 1 / L);
  if (L >= (U + F) * 0.995) return { elbow: add3(sh, mul3(n, (U / (U + F)) * L)), far: L > U + F };
  const a = (U * U - F * F + L * L) / (2 * L);
  const r = Math.sqrt(Math.max(0, U * U - a * a));
  const c = add3(sh, mul3(n, a));
  let e1 = cross3(n, up);
  if (len3(e1) < 1e-3) e1 = cross3(n, outw);
  e1 = unit3(e1);
  const e2 = unit3(cross3(n, e1));
  let best: V3 | null = null;
  let score = Infinity;
  for (let k = 0; k < 360; k++) {
    const ph = (k * Math.PI) / 180;
    const e = add3(c, add3(mul3(e1, r * Math.cos(ph)), mul3(e2, r * Math.sin(ph))));
    const rel = sub3(e, sh);
    const inward = -dot3(rel, outw);
    const below = -dot3(rel, up);
    // (and never winged out: an elbow more than ~70 mm out past its shoulder reads as a crab's claw from above)
    const sc = hint ? len3(sub3(e, hint)) : Math.acos(Math.max(-1, Math.min(1, dot3(unit3(sub3(w, e)), fd)))) * 57.3 + 0.4 * Math.max(0, inward - inMax) + 0.2 * Math.max(0, upMin - below) + 0.25 * Math.max(0, -inward - 70);
    if (sc < score) {
      score = sc;
      best = e;
    }
  }
  return { elbow: best ?? c, far: false };
}

/**
 * The arm closed on a rod: the hand's frame from the rod and where its back faces, the wrist where the grip
 * model puts it, the forearm turned `ulnar` from the hand's line toward the rod, the elbow solved from the
 * shoulder (both bones their lengths), hanging toward `elbowHint`.
 */
export function gripArm3(o: GripArmIn): GripArm3 {
  const up = o.up ?? v3(0, -1, 0);
  // (the grip model is a right hand in a LEFT-handed frame — heldHands' own: x forward, y right, z up, the
  // back of the right hand facing h × f. Is this lesson's frame left-handed for this person (forward × up
  // pointing to the person's LEFT)? Then the model is the person's right hand as it is; otherwise it is the
  // left, and the right is built in the mirror.)
  const leftHanded = dot3(cross3(o.fwd, up), o.right) < 0;
  const geomRight = (o.hand === 'R') === leftHanded;
  const m: Mirror | null = geomRight ? null : { c: o.centre, n: unit3(o.right) };
  // in the model's space (the mirror for a geometric left hand)
  const s = unit3(mirV(m, sub3(o.toward, o.fist)));
  let n = mirV(m, o.back);
  n = unit3(sub3(n, mul3(s, dot3(n, s))));
  const e2 = cross3(n, s);
  const beta = Math.max(0, Math.min(BETA, (((o.tilt ?? 28) as number) * Math.PI) / 180));
  const Uh = unit3(add3(mul3(s, Math.sin(beta)), mul3(e2, Math.cos(beta))));
  const Wh = unit3(sub3(mul3(s, Math.cos(beta)), mul3(e2, Math.sin(beta))));
  const fist = mirP(m, o.fist);
  // the wrist (heldHands: where the forearm's skin meets the heel of the hand, l3(−78, −1, R + 14))
  const wrist = add3(fist, add3(mul3(Uh, -78), add3(mul3(Wh, -1), mul3(n, o.R + 14))));
  // the forearm: from the hand's line toward the rod by the ulnar bend
  const ul = ((o.ulnar ?? 22) * Math.PI) / 180;
  const fd = unit3(add3(mul3(Uh, Math.cos(ul)), mul3(unit3(sub3(s, mul3(Uh, dot3(s, Uh)))), Math.sin(ul))));
  const sh = mirP(m, o.shoulder);
  // (the elbow: the forearm as near the hand's line turned by the ulnar bend as the arm allows — never in
  // through the chest, never raised to the shoulder)
  const outw = mirV(m, mul3(unit3(o.right), o.hand === 'R' ? 1 : -1));
  const { elbow, far } = solve(sh, wrist, fd, outw, mirV(m, up), o.elbowHint ? mirP(m, o.elbowHint) : null);
  const fa = unit3(sub3(wrist, elbow));
  const wristBend = (Math.acos(Math.max(-1, Math.min(1, dot3(fa, Uh)))) * 180) / Math.PI;
  return {
    hand: o.hand,
    shoulder: o.shoulder,
    elbow: mirP(m, elbow),
    fist: o.fist,
    wrist: mirP(m, wrist),
    rod: unit3(sub3(o.toward, o.fist)),
    back: unit3(o.back),
    R: o.R,
    mirror: m,
    far,
    wristBend,
    beta,
  };
}

/** A view: the unit vector toward the viewer and the page projection (world → page, mm). */
export type GripView = { toward: V3; proj: (p: V3) => Pt };

/**
 * The hand as a view sees it (heldHands placeGrip: the approved 3-D grip), `wristFrom2` where the forearm's
 * skin starts on the page (the cuff's opening).
 */
export function gripInView(a: GripArm3, vs: GripView, wristFrom2?: Pt): PlacedGrip {
  const m = a.mirror;
  const fist = mirP(m, a.fist);
  const s = mirV(m, a.rod);
  let n = mirV(m, a.back);
  n = unit3(sub3(n, mul3(s, dot3(n, s))));
  const e2 = cross3(n, s);
  const Uh = unit3(add3(mul3(s, Math.sin(a.beta)), mul3(e2, Math.cos(a.beta))));
  // (heldFrame's own inputs: f the hand's line, h the rod — the frame gripFrame rebuilds is (Uh, Wh, n))
  const fr = { f: Uh, h: s, d: n };
  const proj = (p: V3) => vs.proj(mirP(m, p));
  const placed = placeGrip(fist, fr, mirV(m, vs.toward), proj, a.R, { ...(wristFrom2 ? { wristFrom2 } : {}), back: true });
  // (round 3) the hand's own frame on the page, as boomGrip's: the fist painter's separate finger forms
  const g = placed.frame;
  GRIP_PAGE.set(placed, (l) => proj(add3(fist, add3(mul3(g.U, l.u), add3(mul3(g.W, l.w), mul3(g.N, l.n))))));
  return placed;
}

const GRIP_PAGE = new WeakMap<PlacedGrip, (l: { u: number; w: number; n: number }) => Pt>();
/** (round 3) A grip placed by `gripInView`: a point of the hand's own frame (u wrist → knuckles, w toward the
 *  thumb, n palm → back) on the page — through the mirror for a left hand. Null for a grip placed elsewhere. */
export const gripToPage = (g: PlacedGrip) => GRIP_PAGE.get(g) ?? null;

/** The forearm's tilt toward a viewer (the sine). */
export const tiltTo = (a: GripArm3, t: V3) => dot3(unit3(sub3(a.wrist, a.elbow)), t);

export const SIDE_VIEW: GripView = { toward: v3(0, 0, 1), proj: (p) => P(p.x, p.y) };
export const TOP_VIEW: GripView = { toward: v3(0, -1, 0), proj: (p) => P(p.x, p.z) };

/** The cuff's opening, a little out toward the hand: where the wrist's skin starts. */
export const openingOf = (a: ArmPlan): Pt => P(a.opening.e.c.u + a.opening.out.u * 2, a.opening.e.c.v + a.opening.out.v * 2);

export type GripSide = { plan: SidePlan; near: PlacedGrip | null; far: PlacedGrip | null };
export type GripSideOpts = { near?: GripArm3 | null; far?: GripArm3 | null; soleR?: Sole; soleL?: Sole; nod?: number; seatV?: number; view?: GripView };

const sideCache = new WeakMap<PlayerPose, Map<string, GripSide>>();
const keyOf = (a: GripArm3 | null | undefined) => (a ? [a.elbow, a.fist, a.rod, a.back] : null);

/**
 * The side view: the pose's own head, body and legs; each holding arm from its shoulder through the solved
 * elbow to the wrist (the sleeve with no hand of its own), the hand round the rod drawn by the art
 * (PlayerSideV2's stick slot: `GripHand`). A missing arm hangs at rest.
 */
export function playerGripSidePlan(pose: PlayerPose, who: CastMember, o: GripSideOpts = {}): GripSide {
  let c = sideCache.get(pose);
  if (!c) {
    c = new Map();
    sideCache.set(pose, c);
  }
  const key = JSON.stringify({ w: who.id, n: keyOf(o.near), f: keyOf(o.far), sr: o.soleR ?? null, sl: o.soleL ?? null, nd: o.nod ?? 0, s: o.seatV ?? null });
  const hit = c.get(key);
  if (hit) return hit;
  const vs = o.view ?? SIDE_VIEW;
  const p2 = (q: V3): Pt => vs.proj(q);
  const posed: PlayerPose = {
    ...pose,
    ...(o.near ? { elbowR: p2(o.near.elbow), handR: { ...pose.handR, wrist: p2(o.near.wrist) } } : {}),
    ...(o.far ? { elbowL: p2(o.far.elbow), handL: { ...pose.handL, wrist: p2(o.far.wrist) } } : {}),
  };
  const plan = sidePlan(posed, {
    head: who.head,
    body: who.body,
    ...(o.near ? {} : { restR: 'restSide' as const }),
    ...(o.far ? {} : { restL: 'restSide' as const }),
    awayR: o.near ? tiltTo(o.near, vs.toward) < -0.5 : false,
    awayL: o.far ? tiltTo(o.far, vs.toward) < -0.5 : false,
    tiltR: o.near ? tiltTo(o.near, vs.toward) : 0,
    tiltL: o.far ? tiltTo(o.far, vs.toward) : 0,
    ...(o.soleR ? { soleR: o.soleR } : {}),
    ...(o.soleL ? { soleL: o.soleL } : {}),
    ...(o.nod ? { nod: o.nod } : {}),
    ...(o.seatV !== undefined ? { seatV: o.seatV } : {}),
  });
  const out: GripSide = {
    plan,
    near: o.near ? gripInView(o.near, vs, openingOf(plan.arms.near)) : null,
    far: o.far ? gripInView(o.far, vs, openingOf(plan.arms.far)) : null,
  };
  c.set(key, out);
  return out;
}

export type GripTop = { plan: TopPlan; near: PlacedGrip | null; far: PlacedGrip | null };
const topCache = new WeakMap<PlayerPose, Map<string, GripTop>>();

/**
 * From above: the cast member (topPerson) with each holding arm from its 3-D shoulder through its elbow to
 * the wrist (one sleeve, the cuff round the wrist), the hand round the rod. `near` is the person's right arm
 * in the plan's naming (the pose's R), `far` the left.
 */
export function playerGripTopPlan(pose: PlayerPose, who: CastMember, near: GripArm3 | null, far: GripArm3 | null, view: GripView = TOP_VIEW): GripTop {
  let c = topCache.get(pose);
  if (!c) {
    c = new Map();
    topCache.set(pose, c);
  }
  const key = JSON.stringify({ w: who.id, n: keyOf(near), f: keyOf(far) });
  const hit = c.get(key);
  if (hit) return hit;
  const base = personTopPlan(pose, who, {});
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const arm = (a: GripArm3 | null, keep: TopPlan['arms']['near']) => (a ? armPlan(view.proj(a.shoulder), view.proj(a.elbow), view.proj(a.wrist), null, false, null, tiltTo(a, view.toward), null, true, armB) : keep);
  const arms = { near: arm(near, base.arms.near), far: arm(far, base.arms.far) };
  const plan: TopPlan = headOverNeck({ ...base, arms });
  const out: GripTop = {
    plan,
    near: near ? gripInView(near, view, openingOf(arms.near)) : null,
    far: far ? gripInView(far, view, openingOf(arms.far)) : null,
  };
  c.set(key, out);
  return out;
}

/**
 * FROM ABOVE, THE HEAD OVER THE NECK (review 2026-11-24: "the head sits at the front edge of the shoulders with
 * the face poking out past the body"): the head's every piece moved back along the chest's facing until its
 * centre lies no more than `ahead` mm before the neck (as the approved top view, /topclose). Then the nose's tip.
 */
export function headOverNeck(plan: TopPlan, ahead = 30): TopPlan {
  const h = plan.head;
  const d = (h.c.u - plan.n.u) * plan.f.u + (h.c.v - plan.n.v) * plan.f.v;
  if (d <= ahead) return noseTip(plan);
  const k = d - ahead;
  const mv = (q: Pt): Pt => P(q.u - plan.f.u * k, q.v - plan.f.v * k);
  const mp = (ps: Pt[]) => ps.map(mv);
  return noseTip({
    ...plan,
    head: { ...h, c: mv(h.c), skull: mp(h.skull), ears: h.ears.map(mp), nose: mp(h.nose), hair: mp(h.hair), clumps: h.clumps.map(mp), sheen: { ...h.sheen, c: mv(h.sheen.c) } },
  });
}

/**
 * FROM ABOVE, ONLY THE NOSE'S TIP (review 2026-11-24: "the nose a sharp triangle sticking out past the hair — a
 * beak"): seen from above a nose shows only as a small tip just past the brow. The plan's nose is pulled in
 * toward the skull: what stands past the skull's outline keeps `k` of its length (its base, on the face, stays).
 */
export function noseTip<T extends { head: { skull: Pt[]; nose: Pt[] } }>(plan: T, k = 0.4): T {
  const sk = plan.head.skull;
  if (!sk.length || !plan.head.nose.length) return plan;
  const c = sk.reduce((a, q) => P(a.u + q.u / sk.length, a.v + q.v / sk.length), P(0, 0));
  // the skull's radius toward a direction: its farthest point within ±12° of it
  const rAt = (a: number) => {
    let r = 0;
    for (const q of sk) {
      const d = Math.atan2(q.v - c.v, q.u - c.u);
      if (Math.abs(Math.atan2(Math.sin(d - a), Math.cos(d - a))) < 0.21) r = Math.max(r, Math.hypot(q.u - c.u, q.v - c.v));
    }
    return r;
  };
  const nose = plan.head.nose.map((q) => {
    const a = Math.atan2(q.v - c.v, q.u - c.u);
    const d = Math.hypot(q.u - c.u, q.v - c.v);
    const r = rAt(a);
    if (!r || d <= r) return q;
    const d2 = r + (d - r) * k;
    return P(c.u + Math.cos(a) * d2, c.v + Math.sin(a) * d2);
  });
  return { ...plan, head: { ...plan.head, nose } };
}
