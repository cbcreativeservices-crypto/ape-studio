/**
 * FIGURE V2 — A PLAYER'S ARM AND FIST ON A STICK OR MALLET, DRAWN WITH THE
 * APPROVED KIT DRUMMER'S PIECES (owner 2026-11-24 on /players3b: "the elbows
 * and hands (many) are odd"). Pure: no React, no Skia.
 *
 * The cure is reuse, not a new hand: a mallet shaft is a stick, and the kit
 * drummer's stick fists and arms passed the owner ("Hands pass", "Drummer
 * passes", "Top view passes"). Here, for any lesson player holding a stick,
 * a mallet or a beater:
 *   1. THE ARM in 3-D from the shoulder: upper arm 300 mm, forearm 290 mm
 *      (to the pose's wrist, 100 mm behind the grip point along the shaft, as
 *      the drummer's stickPose), the elbow on the circle both bones allow,
 *      turned toward DOWN and a little OUT (and a little back): it hangs below
 *      and slightly outside the shoulder-to-hand line, so the side view and the
 *      view from above show the same arm, two arms leaving two shoulders.
 *   2. THE HAND closed on the shaft by the drummer's own solver (grip.ts
 *      stickHold: the American grip, the wrist bent no more than ≈ 40°).
 *   3. THE DRAWING the drummer's: sidePlan / armPlan (the sleeve with its
 *      deltoid, taper, elbow and cuff, the forearm turning into the hand) and
 *      the authored stick fist (authoredHands) placed at the lesson's grip
 *      point and turned along the shaft:
 *        side   seen along the shaft → 'fistEdge' (the drummer's crossing
 *               right hand); the palm side toward the camera → 'palmThumb'
 *               (the drummer's left hand); the BACK of the hand toward the
 *               camera → 'backTop' placed by its stick (the drummer's fist from
 *               above; the same art as the approved mic fist from the side);
 *        above  'backTop' (the drummer's top view, playersPlan placedTop).
 * Nothing here moves a grip point, a stick, a mallet or any measured point:
 * the fist's fulcrum IS the lesson's grip point.
 */
import type { V3 } from '../players/handModel.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { stickHold, type StickHold } from './grip.ts';
import { handArt, placeHand, placeRest, type PlacedHand } from './authoredHands.ts';
import { sidePlan, type SidePlan, type Sole } from './sidePlan.ts';
import { crossZ, P, sub, unit, type Pt } from './geom.ts';
import { playerTopPlan, type Arm3 } from './playersPlan.ts';
import { headOverNeck } from './playersGrip.ts';
import type { TopPlan } from './topPlan.ts';
import type { CastMember } from './cast';

/** An adult arm (mm): shoulder → elbow, elbow → the wrist. */
export const STICK_ARM = { upper: 300, fore: 290 } as const;
/** The pose's wrist this far behind the grip point along the shaft (the drummer's stickPose). */
export const STICK_WRIST_BACK = 100;

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub3 = (a: V3, b: V3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add3 = (a: V3, b: V3) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul3 = (a: V3, k: number) => v3(a.x * k, a.y * k, a.z * k);
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit3 = (a: V3) => mul3(a, 1 / (len3(a) || 1));

/**
 * A two-bone arm from `sh` to `w` (bones `U`, `F`): the wrist kept in reach (99 % of the arm), the elbow on
 * the circle both bones allow, turned toward `pole` (a direction).
 */
export function twoBone(sh: V3, w: V3, pole: V3, U: number = STICK_ARM.upper, F: number = STICK_ARM.fore): { elbow: V3; wrist: V3; reach: boolean } {
  const d = sub3(w, sh);
  const L = len3(d) || 1;
  const n = mul3(d, 1 / L);
  const reach = L <= (U + F) * 0.99;
  const Lc = Math.max(Math.abs(U - F) + 40, Math.min((U + F) * 0.99, L));
  const wrist = add3(sh, mul3(n, Lc));
  const a = (U * U - F * F + Lc * Lc) / (2 * Lc);
  const r = Math.sqrt(Math.max(0, U * U - a * a));
  let pv = sub3(pole, mul3(n, dot3(pole, n)));
  if (len3(pv) < 1e-6) pv = v3(0, 1, 0);
  return { elbow: add3(add3(sh, mul3(n, a)), mul3(unit3(pv), r)), wrist, reach };
}

export type StickArmIn = {
  hand: 'R' | 'L';
  /** The lesson's grip point on the shaft (the fist's fulcrum) and the far end (the mallet's ball, the bead). */
  fulcrum: V3;
  bead: V3;
  shoulder: V3;
  /** The arm's own outward side (unit: the person's right for 'R', left for 'L') and the way the person faces. */
  out: V3;
  fwd: V3;
  /** The world's down (default +y: the lessons' +y is down). */
  down?: V3;
  /** 0–1: the forearm runs that much nearer the level than the shaft does (a mallet raised by the wrist). */
  level?: number;
  /** How far the elbow turns out and back from straight down (the pole's weights; defaults 0.35 and 0.2). */
  outK?: number;
  backK?: number;
};

/** One arm on its stick, solved: the shoulder, the elbow, the pose's wrist and the drummer's hold. */
export type StickArm3 = Arm3 & { reach: boolean; out: V3 };

/** The arm that holds a stick at the lesson's grip point (see the header). */
export function stickArm3(o: StickArmIn): StickArm3 {
  const s = unit3(sub3(o.bead, o.fulcrum));
  const down = o.down ?? v3(0, 1, 0);
  const k = o.level ?? 0;
  const flat = unit3(sub3(s, mul3(down, dot3(s, down))));
  const wd = unit3(add3(mul3(s, 1 - k), mul3(flat, k)));
  const w0 = sub3(o.fulcrum, mul3(wd, STICK_WRIST_BACK));
  const pole = add3(add3(down, mul3(unit3(o.out), o.outK ?? 0.35)), mul3(unit3(o.fwd), -(o.backK ?? 0.2)));
  const { elbow, wrist, reach } = twoBone(o.shoulder, w0, pole);
  const hold = stickHold({ hand: o.hand, elbow, wrist, fulcrum: o.fulcrum, bead: o.bead });
  return { hand: o.hand, shoulder: o.shoulder, elbow, wrist, hold, reach, out: unit3(o.out) };
}

/** A view of the 3-D world: toward the viewer and the page projection. */
export type StickView = { toward: V3; proj: (p: V3) => Pt };
export const STICK_SIDE: StickView = { toward: v3(0, 0, 1), proj: (p) => P(p.x, p.y) };
export const STICK_TOP: StickView = { toward: v3(0, -1, 0), proj: (p) => P(p.x, p.z) };

/** Which approved fist a view sees of a hold (see the header). */
export function fistViewOf(h: StickHold, vs: StickView = STICK_SIDE): 'fistEdge' | 'palmThumb' | 'backTop' {
  if (Math.abs(dot3(h.dir, vs.toward)) > 0.72) return 'fistEdge';
  return dot3(h.sk.frame.z, vs.toward) > 0.15 ? 'backTop' : 'palmThumb';
}

/**
 * The drummer's fist from the back of the hand ('backTop'), placed by its stick in any view (as playersPlan
 * placedTop does from above): its fulcrum on the grip point, turned along the shaft, foreshortened as the
 * hand's own axis is, the thumb's side the side the hand's thumb really lies on.
 */
export function placedBack(h: StickHold, vs: StickView): PlacedHand {
  const d = h.dir;
  const Q = (k: number) => vs.proj(add3(h.fulcrum, mul3(d, k)));
  const F = Q(0);
  const W = vs.proj(h.poseWrist);
  const ax3 = h.sk.frame.x;
  const o = vs.proj(v3(0, 0, 0));
  const ax2 = sub(vs.proj(ax3), o);
  const sx = Math.max(0.45, Math.min(1, Math.hypot(ax2.u, ax2.v)));
  const axis = unit(ax2);
  const tip = h.sk.thumb.joints[h.sk.thumb.joints.length - 1];
  const mirror = crossZ(axis, sub(vs.proj(tip), W)) < 0;
  return placeHand('backTop', W, F, Q(-116), Q(290), sx, { mirror });
}

export type StickSideOpts = { near?: StickArm3 | null; far?: StickArm3 | null; soleR?: Sole; soleL?: Sole; nod?: number; seatV?: number };

/** The forearm's tilt toward a viewer (the sine: + = the hand end nearer). */
const tiltOf = (a: Arm3, t: V3) => dot3(unit3(sub3(a.hold.wrist, a.elbow)), t);

const sideCache = new WeakMap<PlayerPose, Map<string, SidePlan>>();

/**
 * The side view: the pose's own head, body and legs; each holding arm from its shoulder through the solved
 * elbow to the drawn hand's wrist, the approved fist on the shaft (sidePlan's own stick-hand path). `near` is the
 * pose's R arm (on the camera's side), `far` its L. A missing arm hangs at rest.
 */
export function stickSidePlan(pose: PlayerPose, who: CastMember, o: StickSideOpts = {}): SidePlan {
  let m = sideCache.get(pose);
  if (!m) {
    m = new Map();
    sideCache.set(pose, m);
  }
  const keyArm = (a: StickArm3 | null | undefined) => (a ? [a.elbow, a.hold.fulcrum, a.hold.dir] : null);
  const key = JSON.stringify({ w: who.id, n: keyArm(o.near), f: keyArm(o.far), sr: o.soleR ?? null, sl: o.soleL ?? null, nd: o.nod ?? 0, s: o.seatV ?? null });
  const hit = m.get(key);
  if (hit) return hit;
  const vs = STICK_SIDE;
  const p2 = (q: V3): Pt => vs.proj(q);
  const posed: PlayerPose = {
    ...pose,
    ...(o.near ? { elbowR: p2(o.near.elbow), handR: { ...pose.handR, wrist: p2(o.near.wrist), kind: 'grip' as const } } : {}),
    ...(o.far ? { elbowL: p2(o.far.elbow), handL: { ...pose.handL, wrist: p2(o.far.wrist), kind: 'grip' as const } } : {}),
  };
  const back = (a: StickArm3 | null | undefined) => (a && fistViewOf(a.hold, vs) === 'backTop' ? placedBack(a.hold, vs) : null);
  const pr = back(o.near);
  const pl = back(o.far);
  // (a forearm runs AWAY — behind its own elbow — only when it points well into the picture, as the players)
  const away = (a: StickArm3 | null | undefined) => (a ? tiltOf(a, vs.toward) < -0.5 : false);
  const planWith = (placedL: PlacedHand | null) => sidePlan(posed, {
    head: who.head,
    body: who.body,
    holdR: o.near?.hold ?? null,
    holdL: o.far?.hold ?? null,
    ...(pr ? { placedR: pr } : {}),
    ...(placedL ? { placedL } : {}),
    ...(o.near ? {} : { restR: 'restSide' as const }),
    ...(o.far ? {} : { restL: 'restSide' as const }),
    awayR: away(o.near),
    awayL: away(o.far),
    tiltR: o.near ? tiltOf(o.near, vs.toward) : 0,
    tiltL: o.far ? tiltOf(o.far, vs.toward) : 0,
    ...(o.soleR ? { soleR: o.soleR } : {}),
    ...(o.soleL ? { soleL: o.soleL } : {}),
    ...(o.nod ? { nod: o.nod } : {}),
    ...(o.seatV !== undefined ? { seatV: o.seatV } : {}),
  });
  const plan = planWith(pl);
  // TWO FISTS ALMOST EXACTLY ONE BEHIND THE OTHER (coordinator review 2026-11-24, M06: "the far fist drawn above
  // the near fist with its fingers pointing down onto it — one clasped pair of hands"). The authored palm-side fist
  // is placed by its shaft, the shaft crossing it at a fixed angle; on the stroke mallet that set the far hand ≈ 45°
  // up from the near one, its wrist and cuff high above it. At the stroke the forearm stays about level (the mallet
  // pivots at the fulcrum between the thumb and the index), so the far hand lies PARALLEL to the near one, about
  // 30 cm behind it: its fist is placed along the near fist's own line, its fulcrum on its own grip point, the far
  // forearm running to its wrist behind the near forearm. What shows past the near hand is drawn by behindFist.
  const fa = plan.arms.far;
  const na = plan.arms.near;
  const inLine = !!(o.near && o.far && fa.placed && na.placed && Math.hypot(fa.placed.F.u - na.placed.F.u, fa.placed.F.v - na.placed.F.v) < IN_LINE_MM);
  let out: SidePlan = plan;
  if (inLine) {
    const along = placeAlong(fa.placed!.art.view, fa.placed!.F, na.placed!.ex);
    const p2 = planWith(along);
    out = { ...p2, arms: { near: p2.arms.near, far: { ...p2.arms.far, placed: behindFist(p2.arms.far.placed!) } } };
  }
  m.set(key, out);
  return out;
}

/** An authored stick fist placed with its grip point on `F` and its own wrist → knuckles line along `ex` (the palm
 *  side down the picture), rather than by its stick. */
export function placeAlong(view: PlacedHand['art']['view'], F: Pt, ex: Pt): PlacedHand {
  const a = Math.atan2(ex.v, ex.u);
  const e = P(Math.cos(a), Math.sin(a));
  let ey = P(-e.v, e.u);
  if (ey.v < 0) ey = P(-ey.u, -ey.v);
  const A = handArt(view).F;
  const wrist = P(F.u - e.u * A.u - ey.u * A.v, F.v - e.v * A.u - ey.v * A.v);
  return placeRest(view as 'restSide', wrist, a, P(0, 1));
}

/** Two fists whose grip points project closer than this (mm) lie one almost exactly behind the other. */
export const IN_LINE_MM = 40;
/** The fist behind is drawn this much smaller about its own grip point (depth). */
export const BEHIND_K = 0.94;

/**
 * (coordinator review 2026-11-24, M06: "the far fist drawn above the near fist with its fingers pointing down onto
 * it — the two read as one clasped pair of hands") A fist lying almost exactly BEHIND the near one, seen from the
 * side: the near hand hides its curled fingers (they wrap the shaft at the grip point, which the near fist covers);
 * what shows past the near hand is the far palm's edge and heel, its shaft leaving from behind the near fist. The
 * approved authored fist with its four curled fingers left off (the thumb, the palm and their own creases kept),
 * drawn `k` smaller about its grip point. The grip point itself does not move.
 */
export function behindFist(p: PlacedHand, k: number = BEHIND_K): PlacedHand {
  const F = p.F;
  const sc = (q: Pt): Pt => P(F.u + (q.u - F.u) * k, F.v + (q.v - F.v) * k);
  const scE = <E extends { c: Pt; rx: number; ry: number; rot: number }>(e: E): E => ({ ...e, c: sc(e.c), rx: e.rx * k, ry: e.ry * k });
  const keep = p.parts.filter((q) => q.kind !== 'digit' || q.digit === 'thumb');
  const inside = (poly: Pt[], q: Pt) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if (a.v > q.v !== b.v > q.v && q.u < ((b.u - a.u) * (q.v - a.v)) / (b.v - a.v || 1e-9) + a.u) c = !c;
    }
    return c;
  };
  // (a crease, nail or warm spot is kept only on what is kept: its middle inside a kept part)
  const kept = (line: Pt[]) => {
    const mid = line.reduce((s, q) => P(s.u + q.u / line.length, s.v + q.v / line.length), P(0, 0));
    return keep.some((q) => inside(q.placed, mid)) && !p.parts.some((q) => q.kind === 'digit' && q.digit !== 'thumb' && inside(q.placed, mid));
  };
  return {
    ...p,
    at: (q: Pt) => sc(p.at(q)),
    wrist: sc(p.wrist),
    parts: keep.map((q) => ({
      ...q,
      placed: q.placed.map(sc),
      placedAxis: [sc(q.placedAxis[0]), sc(q.placedAxis[1])] as [Pt, Pt],
      placedChain: q.placedChain ? { pts: q.placedChain.pts.map(sc), r: q.placedChain.r.map((r) => r * k) } : null,
      placedEdge: q.placedEdge ? q.placedEdge.map(sc) : null,
      placedShade: q.placedShade ? ([sc(q.placedShade[0]), sc(q.placedShade[1])] as [Pt, Pt]) : null,
    })),
    creases: p.creases.filter(kept).map((c) => c.map(sc)),
    ...(p.gaps ? { gaps: p.gaps.filter(kept).map((c) => c.map(sc)) } : {}),
    ...(p.contact ? { contact: p.contact.map(scE) } : {}),
    nails: p.nails.filter(kept).map((c) => c.map(sc)),
    warm: p.warm.filter((w) => kept([w.c])).map((w) => ({ c: sc(w.c), r: w.r * k })),
    lights: p.lights.map(scE),
    darks: p.darks.map(scE),
    thumbTip: p.thumbTip ? sc(p.thumbTip) : null,
    knuckle: sc(p.knuckle),
  };
}

/**
 * From above: the cast member (topPerson) with each holding arm from its 3-D shoulder through its elbow to the
 * drummer's fist from above on its stick (playersPlan playerTopPlan: the drummer's top-view arm), the head over
 * the neck. `near` is the pose's R arm, `far` its L.
 */
export function stickTopPlan(pose: PlayerPose, who: CastMember, near: StickArm3 | null, far: StickArm3 | null): TopPlan {
  const base = playerTopPlan(pose, who, near, far);
  let t = topCache.get(base);
  if (!t) {
    t = headOverNeck(base);
    topCache.set(base, t);
  }
  return t;
}
const topCache = new WeakMap<TopPlan, TopPlan>();
