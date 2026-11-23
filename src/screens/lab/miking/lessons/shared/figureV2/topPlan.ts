/**
 * FIGURE V2 — THE KIT DRUMMER FROM ABOVE (wave 1 of D78, 2026-11-23; the
 * owner approved the side view: "Drummer passes", then "all the others can
 * then match the approved example"). Pure: no React, no Skia; the tests read
 * these points.
 *
 * The same 3-D drummer (stickPose.drummerPose) and the same pose the kit scene
 * draws from above (stickPose.viewDrummer 'top', whose joints are authored
 * round the neck and turned to face +x): this plan works in the TOP VIEW's own
 * millimetres (u = x forward toward the audience, v = z, the player's right
 * down the picture), so it needs no turn. What it draws is the approved
 * look's, seen from above:
 *   • the head: the skull, the ears close to it, the tip of the nose (as the
 *     old top head shows), and the hair over the crown with the same hairline
 *     — the forehead's skin in front of it, the sideburns down to the ears;
 *   • the shirt: the shoulders and back as one cloth (a rounded slab ≈ 456 mm
 *     across the deltoids), the shoulder blades' soft fold; the sleeves, cuffs
 *     and hands as the side view's (sidePlan.armPlan: the same sleeve radii,
 *     the cuff's opening split into its halves by the forearm's rise toward
 *     the viewer, the authored hand on its stick — here the back of the hand,
 *     authoredHands 'backTop');
 *   • the legs: the thighs and knees in the same one cloth, the shins under
 *     them, the shoes on their pedals (the right on the kick pedal, the left
 *     along the hi-hat pedal, turned by its yaw).
 */
import { drummerPose, viewDrummer, type DrummerPose3, type DrummerSpec } from '../kitScene/stickPose.ts';
import { KIT_GROOVE } from '../kitScene/kitStrokes.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { add, crossZ, dist, lerp, limbOutline, mul, P, perp, sub, unit, type Poly, type Pt } from './geom.ts';
import { placeHand, type PlacedHand } from './authoredHands.ts';
import { kitHolds } from './kitHolds.ts';
import type { StickHold } from './grip.ts';
import { armPlan, lens, type ArmPlan, type Ellipse } from './sidePlan.ts';

export type TopPlan = {
  /** The neck, the chest's facing (unit, +x mostly) and the player's left (unit). */
  n: Pt;
  f: Pt;
  left: Pt;
  head: { c: Pt; skull: Poly; ears: Poly[]; nose: Poly; hair: Poly; clumps: Poly[]; sheen: Ellipse };
  torso: Poly;
  /** The shoulder blades' soft fold (a lens). */
  blades: Poly;
  torsoAxis: [Pt, Pt];
  arms: { near: ArmPlan; far: ArmPlan };
  /** Which surface of each hand faces up, from its 3-D frame (handModel: +z out
   *  of the back of the hand, +y toward the little finger): 'back' — the back
   *  of the hand (drawn: authoredHands 'backTop', the thumb under the hand) —
   *  or 'thumb', the thumb's side. With the up-components. */
  faces: { near: { up: 'back' | 'thumb'; back: number; thumb: number }; far: { up: 'back' | 'thumb'; back: number; thumb: number } };
  legs: { thighs: [Poly, Poly]; shins: [Poly, Poly]; thighAxes: [[Pt, Pt], [Pt, Pt]]; knees: [Ellipse, Ellipse] };
  /** The shoes (R on the kick pedal, L along the hi-hat pedal): the upper, its sole's rim, the laces (open). */
  shoes: { upper: Poly; sole: Poly; laces: Poly; axis: [Pt, Pt] }[];
};

/** The 'above' pose's authored point → the top view (undo the turn about the neck). */
const worldOf = (pose: PlayerPose) => {
  const n = pose.neck;
  return (a: Pt): Pt => P(n.u + (a.v - n.v), n.v - (a.u - n.u));
};
const xz = (p: { x: number; z: number }): Pt => P(p.x, p.z);

/** The hand from above on its stick (authoredHands 'backTop'). */
function placedTop(h: StickHold, view: 'backTop' | 'thumbTop'): PlacedHand {
  const d = h.dir;
  const Q = (k: number) => P(h.fulcrum.x + d.x * k, h.fulcrum.z + d.z * k);
  const F = Q(0);
  const W = P(h.poseWrist.x, h.poseWrist.z);
  // foreshortened along its length as the hand's own axis is from above
  const sx = Math.max(0.45, Math.min(1, Math.hypot(h.sk.frame.x.x, h.sk.frame.x.z)));
  // the thumb's side of the hand as the eye sees it from above
  const axis = unit(P(h.sk.frame.x.x, h.sk.frame.x.z));
  const tip = h.sk.thumb.joints[h.sk.thumb.joints.length - 1];
  const mirror = crossZ(axis, sub(xz(tip), W)) < 0;
  return placeHand(view, W, F, Q(-116), Q(290), sx, { mirror });
}

/** The forearm's rise toward a viewer ABOVE (y grows downward): the sine. */
const riseOf = (a: { elbow: { x: number; y: number; z: number }; wrist: { x: number; y: number; z: number } }) => {
  const dx = a.wrist.x - a.elbow.x;
  const dy = a.wrist.y - a.elbow.y;
  const dz = a.wrist.z - a.elbow.z;
  return -dy / (Math.hypot(dx, dy, dz) || 1);
};

/** A local frame round `c`: x across (toward the player's left), y forward. */
const frameAt = (c: Pt, left: Pt, f: Pt, k = 1) => (x: number, y: number): Pt => add(c, add(mul(left, x * k), mul(f, y * k)));
const XY = (F: (x: number, y: number) => Pt, xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => F(x, y));

// The head from above (the old top head's numbers: PlayerFigure.headAbove), x across, y forward.
const SKULL: readonly (readonly [number, number])[] = [[0, -98], [62, -80], [80, -10], [70, 60], [36, 92], [0, 98], [-36, 92], [-70, 60], [-80, -10], [-62, -80]];
const HAIR: readonly (readonly [number, number])[] = [
  [0, -101], [64, -83], [83, -12], [80, 14], [74, 22], [70, 36], [58, 48], [40, 54], [20, 60], [0, 62], [-20, 60], [-40, 54], [-58, 48], [-70, 36], [-74, 22], [-80, 14], [-83, -12], [-64, -83],
];
const EAR: readonly (readonly [number, number])[] = [[73, -14], [86, -8], [90, 6], [88, 18], [77, 26]];
const NOSE: readonly (readonly [number, number])[] = [[-12, 88], [-7, 104], [0, 113], [7, 104], [12, 88]];

const planCache = new WeakMap<DrummerPose3, TopPlan>();

/** The kit drummer playing `spec`, drawn from above (memoised per pose). */
export function kitDrummerTopPlan(spec: DrummerSpec = KIT_GROOVE): TopPlan {
  const d = drummerPose(spec);
  const hit = planCache.get(d);
  if (hit) return hit;
  const pose = viewDrummer(d, 'top').pose;
  const W = worldOf(pose);
  const holds = kitHolds(d);
  const sR = xz(d.shoulderR);
  const sL = xz(d.shoulderL);
  const n = xz(d.neck);
  const left = unit(sub(sL, sR));
  let f = perp(left);
  if (f.u < 0) f = mul(f, -1);
  const mid = lerp(sR, sL, 0.5);

  // THE SHIRT FROM ABOVE: the back nearly flat across the shoulder blades, the
  // deltoids rounded at the sides, the chest a little fuller than the back.
  const T = frameAt(mid, left, f);
  const half = dist(sR, sL) / 2;
  const side = (s: 1 | -1): Poly => {
    // s = +1 the left shoulder, −1 the right; ordered from the back round to the front
    const x = (dx: number) => s * (half + dx);
    return [T(x(-70), -108), T(x(-10), -88), T(x(34), -50), T(x(40), 4), T(x(30), 52), T(x(-14), 84)];
  };
  const L = side(1);
  const R = side(-1);
  const torso: Poly = [T(0, -112), ...R, T(-90, 116), T(0, 124), T(90, 116), ...[...L].reverse()];
  const blades: Poly = lens(T(-112, -74), T(112, -74), 7, -14);

  // THE HEAD
  const hc = xz(d.head);
  const H = frameAt(hc, left, f, 110 / 110);
  const skull = XY(H, SKULL);
  const hair = XY(H, HAIR);
  const ears = [XY(H, EAR), XY((x, y) => H(-x, y), EAR)];
  const nose = XY(H, NOSE);
  // the hair's growth from the crown: soft clumps toward the front and sides
  const crown = H(0, -34);
  const clumps: Poly[] = [
    lens(crown, H(-30, 50), 9, 3),
    lens(crown, H(16, 54), 8, -2),
    lens(crown, H(-62, 18), 8, 3),
    lens(crown, H(58, 24), 8, -3),
    lens(crown, H(-50, -74), 7, 2),
    lens(crown, H(44, -80), 7, -2),
  ];
  const sheen: Ellipse = { c: H(-24, 6), rx: 26, ry: 40, rot: Math.atan2(f.v, f.u) };

  // THE ARMS: the side view's sleeve, cuff and hand, from above
  const arm = (a: DrummerPose3['R'], h: StickHold, s: Pt) => {
    const placed = placedTop(h, faceOf(h).up === 'thumb' ? 'thumbTop' : 'backTop');
    return armPlan(s, xz(a.elbow), placed.wrist, h, false, placed, riseOf(a), null, true);
  };
  // which surface faces up (y grows downward: up is −y)
  const faceOf = (h: StickHold) => {
    const back = -h.sk.frame.z.y;
    const thumb = h.sk.frame.y.y; // the thumb's side is −y of the hand frame
    // (what faces up MORE is drawn: the back of the hand, or the thumb's side)
    return { up: (back >= thumb ? 'back' : 'thumb') as 'back' | 'thumb', back, thumb };
  };
  const near = arm(d.R, holds.R, sR);
  const far = arm(d.L, holds.L, sL);

  // THE LEGS (the 'above' pose's own hips, knees and feet)
  const hipR = W(pose.hipR);
  const hipL = W(pose.hipL);
  const kneeR = W(pose.kneeR);
  const kneeL = W(pose.kneeL);
  // The shoes (PlayerFigure.buildAbove's shoe, its toe turned by its yaw), authored then carried over.
  const shoeOf = (foot: Pt, th: number) => {
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const Pa = (du: number, dv: number) => W(P(foot.u + du * c - dv * sn, foot.v + du * sn + dv * c));
    const upper: Poly = [Pa(-34, -96), Pa(34, -96), Pa(46, -20), Pa(48, 60), Pa(34, 128), Pa(0, 150), Pa(-34, 128), Pa(-48, 60), Pa(-46, -20)];
    const sole: Poly = [Pa(-38, -100), Pa(38, -100), Pa(51, -20), Pa(53, 60), Pa(38, 132), Pa(0, 156), Pa(-38, 132), Pa(-53, 60), Pa(-51, -20)];
    const laces: Poly = [Pa(0, -40), Pa(0, 36)];
    return { upper, sole, laces, axis: [Pa(0, -96), Pa(0, 150)] as [Pt, Pt], ankle: Pa(0, -62) };
  };
  const shoeR = shoeOf(pose.footR, 0.14);
  const shoeL = shoeOf(pose.footL, pose.shoeL?.yaw ?? -0.14);
  const thighs: [Poly, Poly] = [limbOutline([hipR, kneeR], [82, 62]), limbOutline([hipL, kneeL], [82, 62])];
  const shins: [Poly, Poly] = [limbOutline([kneeR, shoeR.ankle], [56, 40]), limbOutline([kneeL, shoeL.ankle], [56, 40])];
  const kneeE = (k: Pt, h: Pt): Ellipse => {
    const u = unit(sub(k, h));
    return { c: sub(k, mul(u, 14)), rx: 34, ry: 26, rot: Math.atan2(u.v, u.u) };
  };

  const plan: TopPlan = {
    n,
    f,
    left,
    head: { c: hc, skull, ears, nose, hair, clumps, sheen },
    torso,
    blades,
    torsoAxis: [T(0, -112), T(0, 124)],
    arms: { near, far },
    faces: { near: faceOf(holds.R), far: faceOf(holds.L) },
    legs: { thighs, shins, thighAxes: [[hipR, kneeR], [hipL, kneeL]], knees: [kneeE(kneeR, hipR), kneeE(kneeL, hipL)] },
    shoes: [shoeR, shoeL].map((s) => ({ upper: s.upper, sole: s.sole, laces: s.laces, axis: s.axis })),
  };
  planCache.set(d, plan);
  return plan;
}
