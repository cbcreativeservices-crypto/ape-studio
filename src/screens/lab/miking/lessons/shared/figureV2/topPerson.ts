/**
 * FIGURE V2 — ANY CAST MEMBER FROM ABOVE (wave 3a of D78, 2026-11-23). Pure:
 * no React, no Skia. The approved top view of the kit drummer (topPlan.ts),
 * built from any 'above' PlayerPose (joints authored round the neck, the chest
 * toward +v, turned by `facing` — PlayerFigure.aboveTurn), dressed as the cast
 * member (cast.ts): the shoulders and back as one cloth (narrower or broader
 * with the build), the head with the person's hair seen from above (a short
 * crop, a bob over the ears, a ponytail or a bun behind), the forearms resting
 * on a desk with the approved resting hand seen from above ('restSide': the
 * back of the hand, the thumb toward the body's midline), or — standing — the
 * arms hanging under the shoulders (only their tops show, in the shoulders'
 * cloth); the legs and shoes from the pose.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { add, dist, lerp, limbOutline, mul, P, sub, unit, type Poly, type Pt } from './geom.ts';
import { placeRest } from './authoredHands.ts';
import { armPlan, lens, type Ellipse } from './sidePlan.ts';
import type { TopPlan } from './topPlan.ts';
import type { CastMember } from './cast';

const rot = (a: number) => (d: Pt): Pt => P(d.u * Math.cos(a) - d.v * Math.sin(a), d.u * Math.sin(a) + d.v * Math.cos(a));
const XY = (F: (x: number, y: number) => Pt, xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => F(x, y));

// The head from above (topPlan's numbers), x across (toward the left), y forward.
const SKULL: readonly (readonly [number, number])[] = [[0, -98], [62, -80], [80, -10], [70, 60], [36, 92], [0, 98], [-36, 92], [-70, 60], [-80, -10], [-62, -80]];
const HAIR_SHORT: readonly (readonly [number, number])[] = [
  [0, -101], [64, -83], [83, -12], [80, 14], [74, 22], [70, 36], [58, 48], [40, 54], [20, 60], [0, 62], [-20, 60], [-40, 54], [-58, 48], [-70, 36], [-74, 22], [-80, 14], [-83, -12], [-64, -83],
];
// (a close crop: the same hairline, a thinner layer)
const HAIR_CROP = HAIR_SHORT.map(([x, y]) => [x * 0.97, y < 0 ? y * 0.97 : y] as const);
// (a bob: fuller, falling over the ears and down past them at the sides and behind)
const HAIR_BOB: readonly (readonly [number, number])[] = [
  [0, -110], [68, -92], [94, -22], [96, 18], [90, 40], [76, 46], [62, 50], [40, 56], [20, 62], [0, 64], [-20, 62], [-40, 56], [-62, 50], [-76, 46], [-90, 40], [-96, 18], [-94, -22], [-68, -92],
];
const EAR: readonly (readonly [number, number])[] = [[73, -14], [86, -8], [90, 6], [88, 18], [77, 26]];
const NOSE: readonly (readonly [number, number])[] = [[-12, 88], [-7, 104], [0, 113], [7, 104], [12, 88]];

export type PersonTopOpts = { /** Forearms and hands on a desk (a seated talker). */ desk?: boolean };

const cache = new WeakMap<PlayerPose, Map<string, TopPlan>>();

/** The cast member on an 'above' pose (memoised per pose, person and options). */
export function personTopPlan(pose: PlayerPose, who: CastMember, o: PersonTopOpts = {}): TopPlan {
  let m = cache.get(pose);
  if (!m) {
    m = new Map();
    cache.set(pose, m);
  }
  const key = `${who.id}:${o.desk ? 1 : 0}`;
  const hit = m.get(key);
  if (hit) return hit;
  const plan = build(pose, who, o);
  m.set(key, plan);
  return plan;
}

function build(pose: PlayerPose, who: CastMember, o: PersonTopOpts): TopPlan {
  const n = pose.neck;
  const turn = rot((pose.facing ?? 0) - Math.PI / 2);
  const W = (a: Pt): Pt => add(n, turn(sub(a, n)));
  const f = turn(P(0, 1));
  const left = turn(P(1, 0));
  const B = who.body;
  const sR = W(pose.shoulderR);
  const sL = W(pose.shoulderL);
  const mid = lerp(sR, sL, 0.5);
  const frameAt = (c: Pt, k = 1) => (x: number, y: number): Pt => add(c, add(mul(left, x * k), mul(f, y * k)));

  // THE SHIRT FROM ABOVE (the approved slab), the shoulders' width and the chest's depth by the build
  const T = frameAt(mid);
  const sh = B?.shoulder ?? 1;
  const half = (dist(sR, sL) / 2) * (0.94 + 0.06 * sh);
  const deep = B ? (B.back + B.chest) / 2 : 1;
  const side = (s: 1 | -1): Poly => {
    const x = (dx: number) => s * (half + dx * sh);
    return [T(x(-70), -108 * deep), T(x(-10), -88 * deep), T(x(34), -50), T(x(40), 4), T(x(30), 52 * deep), T(x(-14), 84 * deep)];
  };
  const L = side(1);
  const R = side(-1);
  const torso: Poly = [T(0, -112 * deep), ...R, T(-90, 116 * deep), T(0, 124 * deep), T(90, 116 * deep), ...[...L].reverse()];
  const blades: Poly = lens(T(-112, -74 * deep), T(112, -74 * deep), 7, -14);

  // THE HEAD, with the person's hair from above
  const hc = W(pose.head.c);
  const k = pose.head.r / 110;
  const H = frameAt(hc, k);
  const style = who.head.hair;
  const skull = XY(H, SKULL);
  let hair = XY(H, style === 'bob' ? HAIR_BOB : style === 'crop' ? HAIR_CROP : HAIR_SHORT);
  if (style === 'pony' || style === 'bun') {
    // pulled back: the gathered hair behind the crown — a tail lying back, or a round knot
    const back: Poly =
      style === 'pony'
        ? [H(-18, -96), H(-14, -132), H(-6, -150), H(6, -150), H(14, -132), H(18, -96)]
        : [H(-24, -94), H(-30, -112), H(-22, -132), H(0, -140), H(22, -132), H(30, -112), H(24, -94)];
    // (in place of the outline's back point: one silhouette, from the right side round the back to the left)
    hair = [...back, ...hair.slice(1)];
  }
  const ears = style === 'bob' ? [] : [XY(H, EAR), XY((x, y) => H(-x, y), EAR)];
  const nose = XY(H, NOSE);
  const crown = H(0, -34);
  const clumps: Poly[] = [lens(crown, H(-30, 50), 9, 3), lens(crown, H(16, 54), 8, -2), lens(crown, H(-62, 18), 8, 3), lens(crown, H(58, 24), 8, -3), lens(crown, H(-50, -74), 7, 2), lens(crown, H(44, -80), 7, -2)];
  const sheen: Ellipse = { c: H(-24, 6), rx: 26 * k, ry: 40 * k, rot: Math.atan2(f.v, f.u) };

  // THE ARMS: on a desk, the forearms and the resting hands (the thumb toward the midline); standing,
  // the arms hang under the shoulders (planned, not painted: only their tops show, in the slab)
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const arm = (s: Pt, e: Pt, h: PlayerPose['handR'], thumbSide: Pt) => {
    if (!o.desk) return armPlan(s, add(s, mul(f, 4)), add(s, mul(f, 120)), null, false, null, 0, null, true, armB);
    const w = W(h.wrist);
    const dir = Math.atan2(turn(P(Math.cos(h.dir), Math.sin(h.dir))).v, turn(P(Math.cos(h.dir), Math.sin(h.dir))).u);
    const placed = placeRest('restTop', w, dir, thumbSide);
    return armPlan(s, W(e), placed.wrist, null, false, placed, 0, null, true, armB);
  };
  const near = arm(sR, pose.elbowR, pose.handR, left);
  const far = arm(sL, pose.elbowL, pose.handL, mul(left, -1));

  // THE LEGS (the pose's own hips, knees and feet), fuller by the build
  const lk = B?.limb ?? 1;
  const hipR = W(pose.hipR);
  const hipL = W(pose.hipL);
  const kneeR = W(pose.kneeR);
  const kneeL = W(pose.kneeL);
  const shoeOf = (foot: Pt, th: number) => {
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const Pa = (du: number, dv: number) => W(P(foot.u + du * c - dv * sn, foot.v + du * sn + dv * c));
    return {
      upper: [Pa(-34, -96), Pa(34, -96), Pa(46, -20), Pa(48, 60), Pa(34, 128), Pa(0, 150), Pa(-34, 128), Pa(-48, 60), Pa(-46, -20)],
      sole: [Pa(-38, -100), Pa(38, -100), Pa(51, -20), Pa(53, 60), Pa(38, 132), Pa(0, 156), Pa(-38, 132), Pa(-53, 60), Pa(-51, -20)],
      laces: [Pa(0, -40), Pa(0, 36)],
      axis: [Pa(0, -96), Pa(0, 150)] as [Pt, Pt],
      ankle: Pa(0, -62),
    };
  };
  const shoeR = shoeOf(pose.footR, 0.08);
  const shoeL = shoeOf(pose.footL, -0.08);
  const thighs: [Poly, Poly] = [limbOutline([hipR, kneeR], [86 * lk, 62 * lk]), limbOutline([hipL, kneeL], [86 * lk, 62 * lk])];
  const shins: [Poly, Poly] = [limbOutline([kneeR, shoeR.ankle], [56 * lk, 40]), limbOutline([kneeL, shoeL.ankle], [56 * lk, 40])];
  const kneeE = (kk: Pt, h: Pt): Ellipse => {
    const u = unit(sub(kk, h));
    return { c: sub(kk, mul(u, 14)), rx: 34, ry: 26, rot: Math.atan2(u.v, u.u) };
  };
  const none = { up: 'back' as const, back: 1, thumb: 0 };
  return {
    n,
    f,
    left,
    head: { c: hc, skull, ears, nose, hair, clumps, sheen },
    torso,
    blades,
    torsoAxis: [T(0, -112), T(0, 124)],
    arms: { near, far },
    faces: { near: none, far: none },
    legs: { thighs, shins, thighAxes: [[hipR, kneeR], [hipL, kneeL]], knees: [kneeE(kneeR, hipR), kneeE(kneeL, hipL)] },
    shoes: [shoeR, shoeL].map((s) => ({ upper: s.upper, sole: s.sole, laces: s.laces, axis: s.axis })),
  };
}
