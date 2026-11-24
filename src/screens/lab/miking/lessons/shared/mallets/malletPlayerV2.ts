/**
 * THE MALLET-KEYBOARD PLAYER in the new look (figure V2, D78; the Players
 * builder, 2026-11-24). Pure: no React, no Skia.
 *
 * How a two-mallet player stands and holds (researched: the standard marimba
 * and vibraphone method books' set-up — a standing player square to the
 * keyboard, a slight bend at the hips, the upper arms hanging relaxed near
 * the sides, the forearms angled down to the bars; each mallet in a matched
 * grip much like the timpani grip: held about a third of the way up from its
 * end, the fulcrum between the thumb and the index finger, the other fingers
 * wrapped loosely round it, the mallet a continuation of the forearm, the
 * back of the hand turned up and out, about half-way between palm-down and
 * thumb-up). The lessons draw TWO mallets (MalletArt.malletPoses: the right
 * hand at the stroke on a natural, the left raised); the four-mallet grips
 * (Stevens, Burton) are not drawn by any lesson.
 *
 * The hand is the APPROVED STICK GRIP (grip.ts stickHold — the drummer's
 * matched grip, "Hands pass"): the shaft pinched at its fulcrum between the
 * thumb's pad on top and the side of the index finger, running diagonally
 * across the palm and out under the heel, the other fingers curled loosely
 * round it, the hand rolled about half-way from palm-down to thumb-up — solved
 * in 3-D on the lesson's own grip point (MalletPose.hand) and head, and drawn
 * from any view in the approved hands' language (figureV2/familyHand.ts: one
 * silhouette out of the cuff, the thumb grown from its mound, one finger = one
 * shape, the parts beyond the shaft behind it). The arm: the cast member's
 * shoulder, the elbow solved on the circle the upper arm and the forearm
 * allow, as low and close to the side as it can be; the forearm in line with
 * the mallet, a little below it at the raised stroke (the wrist lifts it). The mallets, the
 * bars and every measured point are the lesson's; nothing here moves them.
 *
 * Frame (the mallet family's): +x toward the low end (the player's left), +y
 * down, +z toward the audience; the player behind the keyboard at z = zPlayer,
 * facing +z. Views: 'side' — the lesson's front elevation as the audience sees
 * it (u = x, v = y); 'top' — the plan (u = x, v = z).
 */
import type { Layout } from './malletSpec.ts';
import type { MalletPose } from './MalletArt';

/** The lesson's two mallets (MalletArt.malletPoses: [0] the right hand at the stroke, [1] the left raised). */
export type MalletPair = readonly [MalletPose, MalletPose];
import type { PlayerPose } from '../players/playerPose.ts';
import { BODY, pt } from '../players/playerPose.ts';
import { metalFrontPose } from '../metal/metalFigure.ts';
import type { V3 } from '../players/handModel.ts';
import type { StickHold } from '../figureV2/grip.ts';
import { malletHold } from './malletHold.ts';
import { gripArm3, type GripArm3 } from '../figureV2/playersGrip.ts';
import { operatorFrame, type OperatorFrame } from '../figureV2/boomGrip.ts';
import type { Pt } from '../figureV2/geom.ts';

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit = (a: V3): V3 => mul(a, 1 / (len(a) || 1));

/** The arm (mm): shoulder → elbow, elbow → the wrist (metalFigure METAL_ARM, playersPlan PLAYER_ARM). */
export const MALLET_ARM = { upper: 310, fore: 260 } as const;
/** The pose's wrist behind the fulcrum along the forearm (the drummer's pose: 100 mm). */
export const MALLET_WRIST_BACK = 100;
/** How much nearer the level the forearm runs than a raised mallet (the wrist lifts the rest). */
export const MALLET_LEVEL = 0.6;

export type MalletView = 'side' | 'top';
export type MalletArm3 = { side: 'L' | 'R'; shoulder: V3; elbow: V3; wrist: V3; fist: V3; head: V3; reach: number; hold: StickHold };

/** The player's frame: facing the audience (+z), the base of the neck. */
export function playerFrame(L: Layout, yF: number): OperatorFrame {
  return operatorFrame(v3(0, yF - 1490, L.zPlayer), v3(0, 0, 1));
}

/** The shoulders (world): the standing front pose's, at the player's depth; `lean` the shoulders lowered and
 *  carried toward the keyboard by a bow at the hips. */
export function shoulders3(L: Layout, yF: number, k = 1, lean: Lean = NO_LEAN): { R: V3; L: V3 } {
  const h = BODY.shoulderHalf * (0.94 + 0.06 * k);
  return { R: v3(-h, yF - 1445 + lean.drop, L.zPlayer + 10 + lean.fwd), L: v3(h, yF - 1445 + lean.drop, L.zPlayer + 10 + lean.fwd) };
}

/** The player lowered (mm) by a soft bend of the knees: the shoulders `drop` lower (and `fwd` nearer the keyboard — 0). */
export type Lean = { drop: number; fwd: number };
const NO_LEAN: Lean = { drop: 0, fwd: 0 };
/**
 * The player's stance at a LOW keyboard (posture only — the bars, the mallets and every lesson point stay):
 * where the mallets lie so low that an upright player's arm would hang nearly straight (a case glockenspiel
 * on a table), the player softens the knees and sinks a little — never bowing the shoulders out over the
 * bars. The smallest sink (in 5 mm steps, at most 90 mm) that leaves each arm at most 88% of its full reach.
 */
export function malletLean(L: Layout, yF: number, poses: MalletPair, k = 1): Lean {
  const reach = (le: Lean) => {
    const S = shoulders3(L, yF, k, le);
    return Math.max(...[S.R, S.L].map((s, i) => len(sub(v3(poses[i].hand.x, poses[i].hand.y, poses[i].hand.z), s)) / (MALLET_ARM.upper + MALLET_ARM.fore)));
  };
  for (let d = 0; d <= 90; d += 5) if (reach({ drop: d, fwd: 0 }) <= 0.88) return { drop: d, fwd: 0 };
  return { drop: 90, fwd: 0 };
}

/**
 * The elbow: on the circle the two bones allow between the shoulder and the fist, as LOW as it can hang and
 * close to the body — a relaxed arm — then a little out to its own side and back (never forward of the
 * shoulder–fist line, never across the body). At or past full reach: on the straight line.
 */
export function malletElbow(shoulder: V3, fist: V3, outward: V3, F: V3, a = MALLET_ARM.upper, b = MALLET_ARM.fore): { elbow: V3; reach: number } {
  const sf = sub(fist, shoulder);
  const d = len(sf);
  const u = unit(sf);
  if (d >= a + b - 1) return { elbow: add(shoulder, mul(u, (a / (a + b)) * d)), reach: d / (a + b) };
  const t = (a * a - b * b + d * d) / (2 * d);
  const r = Math.sqrt(Math.max(0, a * a - t * t));
  const c = add(shoulder, mul(u, t));
  let e1 = cross(u, v3(0, 1, 0));
  if (len(e1) < 1e-3) e1 = cross(u, v3(1, 0, 0));
  e1 = unit(e1);
  const e2 = unit(cross(u, e1));
  const down = v3(0, 1, 0);
  let best = c;
  let score = -Infinity;
  for (let k = 0; k < 360; k += 1) {
    const ph = (k * Math.PI) / 180;
    const dir = add(mul(e1, Math.cos(ph)), mul(e2, Math.sin(ph)));
    const sc = dot(dir, down) + 0.12 * dot(dir, outward) - 0.2 * dot(dir, F);
    if (sc > score) {
      score = sc;
      best = add(c, mul(dir, r));
    }
  }
  return { elbow: best, reach: d / (a + b) };
}

/** Both arms (world) on the lesson's two mallets: [0] the right hand at the stroke, [1] the left raised. */
export function malletArms(L: Layout, yF: number, poses: MalletPair, k = 1): MalletArm3[] {
  const o = playerFrame(L, yF);
  const S = shoulders3(L, yF, k, malletLean(L, yF, poses, k));
  const [mA, mB] = poses;
  const one = (side: 'L' | 'R', m: MalletPose): MalletArm3 => {
    const outward = side === 'R' ? o.R : mul(o.R, -1);
    const s = S[side];
    const fist = v3(m.hand.x, m.hand.y, m.hand.z);
    const head = v3(m.head.x, m.head.y, m.head.z);
    // the pose's wrist: behind the fulcrum along the mallet, the forearm a little nearer the level than a raised one
    const r = unit(sub(head, fist));
    const flat = unit(v3(r.x, 0, r.z));
    const wd = r.y < 0 ? unit(add(mul(r, 1 - MALLET_LEVEL), mul(flat, MALLET_LEVEL))) : r;
    const w0 = sub(fist, mul(wd, MALLET_WRIST_BACK));
    const { elbow, reach } = malletElbow(s, w0, outward, o.F);
    // (the approved stick grip, its wrist held to ≈ 30° — malletHold.ts)
    const hold = malletHold({ hand: side, elbow, wrist: w0, fulcrum: fist, bead: head });
    return { side, shoulder: s, elbow, wrist: w0, fist, head, reach, hold };
  };
  return [one('R', mA), one('L', mB)];
}

/**
 * THE MALLET HELD (review 2026-11-24, KeysGuitar3: "the shaft drawn across the FRONT of the fist; from above the
 * mallet comes out of the fingertips like an extra finger"). Each hand is now the APPROVED held grip
 * (playersGrip.gripArm3 → heldHands placeGrip, as M06 timpani): the shaft between the thumb's pad and the side of
 * the index at its first joint about a third up from its end, the other three fingers curled round it, the butt
 * in the heel of the palm — the shaft through the fist in every view. The back of the hand up and out
 * (`MALLET_BACK_DEG` from palm-down toward thumb-up: the two-mallet "matched" grip of the marimba and vibraphone
 * method books, between German and French). The fist IS the lesson's grip point, the rod runs to the lesson's
 * head; the shoulders are malletArms' (the stance and the soft knees); the elbow is solved by the grip model,
 * hanging near the side.
 */
export const MALLET_BACK_DEG = 20;
/** The mallet's shaft radius at the hand (mm: a rattan or birch shaft ≈ 9 mm across). */
export const MALLET_SHAFT_R = 4.5;
export function malletGrips(L: Layout, yF: number, poses: MalletPair, k = 1): GripArm3[] {
  const S = malletArms(L, yF, poses, k);
  const a = (MALLET_BACK_DEG * Math.PI) / 180;
  const person = { fwd: v3(0, 0, 1), right: v3(-1, 0, 0), centre: v3(0, 0, L.zPlayer) };
  return S.map((s) => {
    const out = s.side === 'R' ? -1 : 1;
    // (the grip model's own elbow: hanging near the side, a little forward — from above the upper arm shows
    // foreshortened, ≈ 100–150 mm on the plan of its 310; the test pins it under 160)
    return gripArm3({ hand: s.side, fist: s.fist, toward: s.head, shoulder: s.shoulder, back: v3(out * Math.sin(a), -Math.cos(a), 0), R: MALLET_SHAFT_R, ...person });
  });
}

/** A view's projection (u, v on the page, d toward the viewer) and its direction to the viewer. */
export function malletViewOf(view: MalletView): { proj: (p: V3) => Pt; hv: (p: V3) => { u: number; v: number; d: number }; toward: V3 } {
  if (view === 'side') return { proj: (p) => ({ u: p.x, v: p.y }), hv: (p) => ({ u: p.x, v: p.y, d: p.z }), toward: v3(0, 0, 1) };
  return { proj: (p) => ({ u: p.x, v: p.z }), hv: (p) => ({ u: p.x, v: p.z, d: -p.y }), toward: v3(0, -1, 0) };
}

/** The plane through a held shaft, square to the view: the fingers wrapped beyond it go behind the shaft. */
export function shaftCut(toward: V3, a: V3, b: V3): { p: V3; n: V3 } {
  const u = unit(sub(b, a));
  const n = unit(sub(toward, mul(u, dot(toward, u))));
  return { p: mul(add(a, b), 0.5), n };
}

/** The player's body poses: from the front (the lesson's 'side' view, the floor at yF) and from above
 *  (chest toward the audience, +v; `facing` π/2 so the cast top view draws it unturned). */
export function malletBodyPoses(L: Layout, yF: number, poses: MalletPair): { front: PlayerPose; top: PlayerPose } {
  const [mA, mB] = poses;
  const f0 = metalFrontPose([[mA.hand.x, mA.hand.y - yF], [mB.hand.x, mB.hand.y - yF]]);
  const m = (q: Pt): Pt => pt(q.u, q.v + yF);
  // (a soft knee bend at a low keyboard: from the front the whole body above the knees a little lower, the
  // knees sinking half as far)
  const le = malletLean(L, yF, poses);
  const up = (q: Pt): Pt => pt(q.u, q.v + yF + le.drop);
  const half = (q: Pt): Pt => pt(q.u, q.v + yF + le.drop / 2);
  const front: PlayerPose = {
    ...f0,
    head: { ...f0.head, c: up(f0.head.c) },
    neck: up(f0.neck),
    shoulderR: up(f0.shoulderR),
    shoulderL: up(f0.shoulderL),
    elbowR: up(f0.elbowR),
    elbowL: up(f0.elbowL),
    handR: { ...f0.handR, wrist: up(f0.handR.wrist) },
    handL: { ...f0.handL, wrist: up(f0.handL.wrist) },
    hipR: up(f0.hipR),
    hipL: up(f0.hipL),
    kneeR: half(f0.kneeR),
    kneeL: half(f0.kneeL),
    footR: m(f0.footR),
    footL: m(f0.footL),
    floor: yF,
  };
  // THE DAMPER PEDAL (a vibraphone; the pedal glockenspiel): played with the RIGHT foot, the heel on the floor
  // and the ball of the foot over the pedal bar, pressing it down to let the bars ring (the method books' set-up;
  // the left foot stays flat). The pedal is the lesson's (malletModel: the centre of the player's side, its top
  // ≈ 46 mm up); only the foot goes to it: from the front the right shoe sits on the pedal's top, a little
  // right of its centre (the player's right is −x), the knee lifted with it.
  if (L.row.extras.damper === 'pedal') {
    front.footR = pt(-70, yF - 46);
    front.kneeR = pt(front.kneeR.u + 12, front.kneeR.v - 28);
  }
  const zP = L.zPlayer;
  const top: PlayerPose = {
    view: 'above',
    posture: 'standing',
    facing: Math.PI / 2,
    head: { c: pt(0, zP - 14 + le.fwd * 1.15), r: BODY.headH / 2 },
    neck: pt(0, zP + le.fwd),
    shoulderR: pt(-BODY.shoulderHalf, zP + 4 + le.fwd),
    shoulderL: pt(BODY.shoulderHalf, zP + 4 + le.fwd),
    elbowR: pt(-240, zP + 120),
    elbowL: pt(240, zP + 120),
    handR: { wrist: pt(mA.hand.x, mA.hand.z), dir: Math.PI / 2, kind: 'grip' },
    handL: { wrist: pt(mB.hand.x, mB.hand.z), dir: Math.PI / 2, kind: 'grip' },
    hipR: pt(-100, zP - 10),
    hipL: pt(100, zP - 10),
    kneeR: pt(-100, zP + 10),
    kneeL: pt(100, zP + 10),
    footR: pt(-110, zP + 90),
    footL: pt(110, zP + 90),
    floor: null,
  };
  return { front, top };
}

/**
 * (the damper pedal, from the front) The right shoe set ON the pedal's top: the front figure stands both shoes
 * on the floor, so its right shoe is lifted `lift` mm (the pedal's top) and the trouser leg below the knee
 * shortened by the same amount (the knee raised with it, the shin unchanged in shape) — the plan's own
 * outlines, moved; nothing else of the figure changes. Pure.
 */
export function liftRightFoot<F extends { legs: { side: number; outline: Pt[]; axis: [Pt, Pt]; crease: Pt[]; folds: Pt[][] }[]; shoes: { upper: Pt[]; sole: Pt[]; toeLight: { c: Pt }; contact: { c: Pt }; axis: [Pt, Pt] }[] }>(F: F, kneeV: number, floor: number, lift: number): F {
  const ankleV = floor - 60;
  const legI = F.legs.findIndex((l) => l.side < 0);
  if (legI < 0 || !F.shoes[0]) return F;
  const k = (q: Pt): Pt => {
    const t = Math.max(0, Math.min(1, (q.v - kneeV) / (ankleV - kneeV)));
    return { u: q.u, v: q.v - lift * t };
  };
  const up = (q: Pt): Pt => ({ u: q.u, v: q.v - lift });
  const L = F.legs[legI];
  const legs = F.legs.map((l, i) => (i === legI ? { ...L, outline: L.outline.map(k), axis: [k(L.axis[0]), k(L.axis[1])] as [Pt, Pt], crease: L.crease.map(k), folds: L.folds.map((f) => f.map(k)) } : l));
  const S = F.shoes[0];
  const shoes = [{ ...S, upper: S.upper.map(up), sole: S.sole.map(up), toeLight: { ...S.toeLight, c: up(S.toeLight.c) }, contact: { ...S.contact, c: up(S.contact.c) }, axis: [up(S.axis[0]), up(S.axis[1])] as [Pt, Pt] }, ...F.shoes.slice(1)];
  return { ...F, legs, shoes };
}
/** The damper pedal's top above the floor, as MalletArt draws it (mm). */
export const PEDAL_TOP = 46;
