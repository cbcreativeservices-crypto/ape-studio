/**
 * FIGURE V2 — A PLAYER WHO HOLDS AN INSTRUMENT (wave 5 of D78, the families
 * with their own geometry, 2026-11-24). The families that build their player
 * as a 3-D skeleton round the instrument (bowed strings first; brass, low
 * brass, saxophones, woodwinds, lutes and free reeds share the shape) keep
 * every joint, every posed hand and every contact; only the DRAWING is new:
 *   • the body is the approved cast person (personV2 / sidePlan, topPerson)
 *     on the skeleton's own joints — the head, the hair, the shirt, the
 *     trousers, the shoes — in profile or from above;
 *   • each arm is the approved sleeve (FigureV2Side.Arm: one sleeve from the
 *     shoulder through a real elbow to the cuff) on the skeleton's own
 *     shoulder, elbow and wrist;
 *   • each hand is the skeleton's own posed hand (the bow hold, the stopping
 *     hand…) drawn in the approved look (familyHand.ts), its wrist one skin
 *     with the palm out of the cuff.
 * The person is drawn WHOLE behind the instrument (base); where the
 * skeleton's parts lie nearer the viewer than the instrument (a bow arm, the
 * fingers over a fingerboard, the near knee in front of a cello) the same
 * person is drawn again over it, clipped to those parts (front) — so the
 * figure is one drawing, never parts at different looks.
 */
import { memo, type ReactNode } from 'react';
import { ColorMatrix, FillType, Group, LinearGradient, Mask, Paint, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import type { HandSkeleton, V3 } from '../players/handModel.ts';
import type { PlayerPose, Pt } from '../players/playerPose.ts';
import { add, lerp, LIGHT, mul, P, sub, unit, type Poly } from './geom.ts';
import { armPlan, sidePlan, type ArmPlan, type SidePlan } from './sidePlan.ts';
import { armPaths, op, sidePaths, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths.ts';
import { Arm, FAR_DIM, FAR_SKIN_DIM, FigureV2Side, type Torso } from './FigureV2Side';
import { ArmLite, SideLite, TopLite } from './lite';
import { DrummerTopLegsV2, topPaths } from './FigureV2Top';
import { personTopPlan } from './topPerson.ts';
import type { TopPlan } from './topPlan.ts';
import { Blur, FigureScale, levelOf, useFigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { Soft, across } from './paint';
import type { CastMember } from './cast';
import { FULL_HEAD_PT, PersonTopV2 } from './personV2';
import { PersonFrontV2, frontPaths, personFrontPlan } from './FigureV2Front';
import { familyHand, type FamHand } from './familyHand.ts';
import { FamilyHandV2, familyHandSilhouette } from './familyHandV2';

/** The joints a family's player is built from (bowed/posture.ts `Skeleton`), lesson frame, mm. */
export type FamSkeleton = {
  head: V3;
  headR: number;
  face: V3;
  neck: V3;
  /** The chest (its depth decides the torso's place against the instrument; default between neck and pelvis). */
  chest?: V3;
  pelvis: V3;
  shoulderL: V3;
  shoulderR: V3;
  hipL: V3;
  hipR: V3;
  kneeL: V3;
  kneeR: V3;
  ankleL: V3;
  ankleR: V3;
  toeL: V3;
  toeR: V3;
};

/** One arm: the posed hand, the elbow and shoulder the arm is drawn through, and what the hand holds. */
export type FamArmIn = {
  sk: HandSkeleton;
  elbow: V3;
  shoulder: V3;
  /** A plane through what the hand holds, square to the view: the hand's parts behind it go behind. */
  cut?: { p: V3; n: V3 } | null;
  /** Whether the hand (its front layer) lies over the instrument (default true): false keeps the whole hand
   *  behind it (the trumpet's left hand round the valve casings, seen from the player's right). */
  front?: boolean;
  /** The hand is drawn elsewhere (the horn's right hand inside the bell, seen only through the opening): the
   *  arm ends at its cuff. */
  handElsewhere?: boolean;
};

/** 'side': in profile from the player's right; 'top': from above; 'front': face-on (the woodwinds' lesson frame:
 *  u = x across the player — the player's right on the viewer's left —, v = y down, d = z toward the viewer). */
export type FamView = 'side' | 'top' | 'front';

export type FamIn = {
  /** A key that names this figure (the memo cache). */
  key: string;
  s: FamSkeleton;
  view: FamView;
  who: CastMember;
  seated: boolean;
  floorY: number;
  /** The seat's top (lesson y), seated. */
  seatY?: number;
  arms: { L: FamArmIn; R: FamArmIn };
  /** (a wind player) where the front of the mouth is — the lips on the mouthpiece: the head is drawn there. */
  lip?: V3;
  /** (a player seated cross-legged on the floor) the legs drawn by the family in the approved materials in place of
   *  the figure's own: face-on (the body above `clipAboveV` is the front figure's) and from above. */
  lowerOverride?: { front?: { node: ReactNode; clipAboveV: number }; top?: ReactNode };
};

/** The view's projection: side looks from +z (u = x, v = y), top looks down (u = x, v = z). */
export const famProj = (view: FamView) => (p: V3) => (view !== 'top' ? { u: p.x, v: p.y, d: p.z } : { u: p.x, v: p.z, d: -p.y });
const toward = (view: FamView): V3 => (view !== 'top' ? { x: 0, y: 0, z: 1 } : { x: 0, y: -1, z: 0 });
const sub3 = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add3 = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul3 = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const unit3 = (a: V3): V3 => mul3(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
const mid3 = (a: V3, b: V3): V3 => mul3(add3(a, b), 0.5);

export type FamArmPlan = {
  side: 'L' | 'R';
  arm: ArmPlan;
  hand: FamHand;
  /** Drawn first (the far side, behind the body) and on the far side's value step. */
  far: boolean;
  /** The skeleton's depths of the upper arm, the forearm (toward the viewer). */
  dUpper: number;
  dFore: number;
  elbow2: Pt;
  handFront: boolean;
  handElsewhere: boolean;
  /** (face-on) the shoulder's cap as the front figure draws it — the deltoid flowing on from the trapezius — in
   *  which the sleeve's own round root is hidden. */
  cap: Poly | null;
  /** (face-on) where the sleeve is not drawn: above the deltoid's line (its round root) and its first few mm. */
  capHide: Poly[] | null;
  /** (face-on) the cap's outer line (the shoulder's silhouette from the shirt's top to the sleeve's edge). */
  capTop: Poly | null;
  /** (face-on) the front figure's own shoulder point the sleeve hangs from. */
  f0?: Pt | null;
};

export type FamPlan = {
  in: FamIn;
  /** The body: in profile (the far arm tucked out of sight, the near arm not drawn), or from above. */
  side: { pose: PlayerPose; plan: SidePlan } | null;
  /** (the woodwinds' face-on view) the body from the front, its arms drawn by the family. */
  front: { pose: PlayerPose } | null;
  top: { pose: PlayerPose; plan: TopPlan; headPose: PlayerPose } | null;
  /** The arms in paint order. */
  arms: FamArmPlan[];
  depth: { head: number; chest: number; neck: number; legNear: number; legFar: number; nearSide: 'L' | 'R' };
};

const planCache = new Map<string, FamPlan>();

/** The figure's plan (memoised by key and view). */
/** A closed polygon's path (straight sides). */
function polyPath(pts: readonly Pt[]): SkPath {
  const p = Skia.Path.Make();
  pts.forEach((q, i) => (i ? p.lineTo(q.u, q.v) : p.moveTo(q.u, q.v)));
  p.close();
  return p;
}

/** (face-on) the upper arm's OUTER edge's normal — the edge that carries on from the trapezius: facing up and out
 *  (`sg` the arm's side, +1 the viewer's right). A hanging arm's outer side, a raised arm's top, never the
 *  underside of an arm held near level (the old rule flipped there on a hair of slope). */
function outerNormal(du: Pt, sg: number): Pt {
  const n = P(-du.v, du.u);
  // (an upper arm heading IN across the chest: its outer side, the deltoid curving down into it — never its top
  // edge, which drew the shoulder as a square block over the chest — the flute's left arm)
  if (du.u * sg < -0.2) return n.u * sg >= 0 ? n : mul(n, -1);
  return n.u * sg - n.v >= 0 ? n : mul(n, -1);
}

/**
 * (face-on) THE SHOULDER: the deltoid flowing on from the trapezius into the sleeve, whatever the arm's angle
 * (owner's bar: one continuous silhouette, never a ball above the shoulder's line, never a notch). The line
 * leaves the shirt's own shoulder (on its top edge, just in from the joint), carries on along the trapezius's
 * slope and bends — one curve — into the sleeve's outer edge 40 mm down from its root, meeting it tangent.
 * The cap fills under that line in the shirt's light; the sleeve is not drawn above it (its round root), nor
 * in its first 22 mm (its end, inside the cap).
 */
function frontCap(fi: { F0: Pt; shirt: SkPath; sg: number }, arm: ArmPlan): { cap: Poly; capHide: Poly[]; capTop: Poly } {
  const { F0, shirt, sg } = fi;
  const S = arm.shoulder;
  const du = unit(sub(arm.elbow, S));
  const n = outerNormal(du, sg);
  let hw = 0;
  for (const p of arm.upper) {
    const d = sub(p, S);
    const al = d.u * du.u + d.v * du.v;
    // (measured on the OUTER side, about where the curve meets the edge — 26 mm down: a width taken further down or
    // on the far side left the curve ending a few mm inside the edge, a small step at the shoulder)
    const dn = d.u * n.u + d.v * n.v;
    if (al > 16 && al < 56 && dn > 0) hw = Math.max(hw, dn);
  }
  // (an upper arm is ≈ 80–100 mm across at the deltoid: the cap's outer line meets the sleeve's edge there — a
  // stray outline point far off the arm, measured as the arm's width, drew the cap out as a wing past the shoulder)
  hw = Math.max(32, Math.min(54, hw || 42));
  // (the front figure's own shoulder line: its sleeve's top on the trapezius — FigureV2Front's outer side —
  // reached from the shirt's own top edge further in by one straight slope: no step where the two meet)
  const T0 = P(F0.u - sg * 30, F0.v - 28);
  const T1 = P(F0.u - sg * 4, F0.v - 19);
  const uIn = F0.u - sg * 78;
  let vIn: number | null = null;
  for (let v = F0.v - 90; v < F0.v + 80; v += 2)
    if (shirt.contains(uIn, v)) {
      vIn = v + 2;
      break;
    }
  const Tin = vIn !== null && vIn > T0.v ? P(uIn, vIn) : null;
  const st = 26;
  // (the curve ends ON the sleeve's drawn outer edge, arriving along that edge's own direction — the deltoid's
  // swell is not parallel to the arm's axis: ended a few mm off it, the edge stood out past the curve as a step)
  const M = add(S, mul(du, st));
  let Q = add(M, mul(n, hw));
  let eDir = du;
  {
    const up = arm.upper;
    let best = -1;
    for (let i = 0; i < up.length; i++) {
      const a0 = up[i];
      const b0 = up[(i + 1) % up.length];
      const e = sub(b0, a0);
      const den = n.u * e.v - n.v * e.u;
      if (Math.abs(den) < 1e-9) continue;
      const w = sub(a0, M);
      const tt = (w.u * e.v - w.v * e.u) / den;
      const ss = (w.u * n.v - w.v * n.u) / den;
      if (ss < 0 || ss > 1 || tt <= 0 || tt > 70) continue;
      if (tt > best) {
        best = tt;
        const el = Math.hypot(e.u, e.v) || 1;
        eDir = P(e.u / el, e.v / el);
      }
    }
    if (best > 20) {
      Q = add(M, mul(n, best));
      if (eDir.u * du.u + eDir.v * du.v < 0) eDir = mul(eDir, -1);
      if (eDir.u * du.u + eDir.v * du.v < 0.7) eDir = du;
    } else eDir = du;
  }
  // (then ON THE DRAWN SLEEVE itself — smoothed, with the elbow's closing fold — walked out along the edge's normal:
  // the plan's outline can sit a few mm inside what is painted, which left a small step where the hidden region's
  // side crossed the sleeve)
  const drawn = elbowClosed(arm, armPaths(arm, famProj('front'))).upper;
  const edgeAt = (al: number): Pt | null => {
    const m = add(S, mul(du, al));
    if (!drawn.contains(m.u, m.v)) return null;
    for (let k = 1; k <= 110; k++) if (!drawn.contains(m.u + n.u * k, m.v + n.v * k)) return k > 12 ? add(m, mul(n, k - 0.5)) : null;
    return null; // (never left the sleeve: no edge found here)
  };
  const along: Pt[] = [];
  {
    const q0 = edgeAt(st);
    if (q0) {
      Q = q0;
      const q1 = edgeAt(st + 14);
      if (q1) {
        const d1 = unit(sub(q1, q0));
        if (d1.u * du.u + d1.v * du.v > 0.7) eDir = d1;
      }
      for (const al of [st + 14, st + 30, st + 48, st + 70]) {
        const q = edgeAt(al);
        if (!q) break;
        along.push(q);
      }
    }
  }
  const Qin = add(M, mul(n, -hw));
  const t = unit(sub(T1, T0));
  // (one curve, tangent at both ends: leaving the trapezius along its slope, arriving along the sleeve's edge)
  const L = Math.hypot(Q.u - T1.u, Q.v - T1.v) * 0.42;
  const C1 = add(T1, mul(t, L));
  const C2 = sub(Q, mul(eDir, L));
  const curve: Pt[] = [];
  for (let i = 0; i <= 14; i++) {
    const k = i / 14;
    const a = (1 - k) * (1 - k) * (1 - k);
    const b = 3 * (1 - k) * (1 - k) * k;
    const c = 3 * (1 - k) * k * k;
    const d = k * k * k;
    curve.push(P(a * T1.u + b * C1.u + c * C2.u + d * Q.u, a * T1.v + b * C1.v + c * C2.v + d * Q.v));
  }
  const cap: Poly = Tin ? [Tin, T0, ...curve, Qin, P(F0.u - sg * 44, F0.v + 40), P(uIn, F0.v + 40)] : [T0, ...curve, Qin, P(F0.u - sg * 44, F0.v + 40), P(F0.u - sg * 44, F0.v + 2)];
  const capTop: Poly = Tin ? [Tin, T0, ...curve] : [T0, ...curve];
  const far = 600;
  // (and on along the edge's own tangent for 40 mm past where the curve meets it: the drawn sleeve — smoothed, with
  // the elbow's closing fold — can stand a few mm proud of its plan there, a small step and hook at the shoulder;
  // the upper sleeve tapers in toward the elbow, so its true edge lies inside that tangent)
  // (where the drawn edge was found further down, the hidden region follows it point by point, 0.5 mm outside)
  const tail = along.length ? along.map((p) => add(p, mul(n, 0.5))) : [add(Q, mul(eDir, 40))];
  const Q2 = tail[tail.length - 1];
  const out = add(Q2, mul(n, far));
  const above: Poly = [P(capTop[0].u, T0.v - far), ...capTop, ...tail, out, P(out.u, Math.min(out.v, T0.v) - far)];
  const r0 = add(S, mul(du, 22));
  const end: Poly = [add(r0, mul(n, hw + 30)), add(add(r0, mul(n, hw + 30)), mul(du, -120)), add(add(r0, mul(n, -hw - 30)), mul(du, -120)), add(r0, mul(n, -hw - 30))];
  // (the sleeve's first few mm are not cut off on a straight line — that drew the cap's light against the sleeve's
  // along a hard edge across the arm, a cape: the sleeve fades in over the cap instead, FamArm)
  void end;
  return { cap, capHide: [above], capTop };
}

export function famPlan(fi: FamIn): FamPlan {
  const k = `${fi.key}|${fi.view}|${fi.who.id}`; // (a neighbor is another person: its own plan)
  const hit = planCache.get(k);
  if (hit && hit.in.s === fi.s && hit.in.arms.L.sk === fi.arms.L.sk && hit.in.arms.R.sk === fi.arms.R.sk) return hit;
  const built = buildPlan(fi);
  planCache.set(k, built);
  return built;
}

function buildPlan(fi: FamIn): FamPlan {
  const { s, view, who } = fi;
  const pr = famProj(view);
  const q = (p: V3): Pt => {
    const r = pr(p);
    return P(r.u, r.v);
  };
  const D = (p: V3) => pr(p).d;
  const tw = toward(view);
  const B = who.body;
  const build = B ? { one: true, k: B.shoulder, fore: B.limb } : { one: true };
  const nearSide: 'L' | 'R' = D(s.shoulderR) >= D(s.shoulderL) ? 'R' : 'L';

  // THE ARMS, on the skeleton's own shoulder, elbow and the posed hand's wrist
  // (in profile each sleeve's root is held inside the shirt: a shoulder joint the skeleton sets toward the back
  // never pushes a knob of sleeve out past the back's line — the drawing only, the joint is unchanged)
  const hip2 = q(mid3(s.hipL, s.hipR));
  const neck2 = q(s.neck);
  const axU = unit(sub(neck2, hip2));
  let fwdN = P(-axU.v, axU.u);
  if (Math.sign(fwdN.u || 1) !== Math.sign(s.face.x || 1)) fwdN = mul(fwdN, -1);
  const torsoLen = Math.hypot(neck2.u - hip2.u, neck2.v - hip2.v) || 1;
  const rootInside = (S0: Pt, lift = false): Pt => {
    let S = S0;
    const off = (S.u - hip2.u) * fwdN.u + (S.v - hip2.v) * fwdN.v;
    // (and never forward of the chest's middle: a reaching arm's sleeve head stays inside the shirt's front,
    // flowing from the shoulder's line into the upper arm — no rounded cap standing in front of the chest)
    const lo = -48;
    const hi = 30;
    if (off < lo) S = add(S, mul(fwdN, lo - off));
    else if (off > hi) S = sub(S, mul(fwdN, off - hi));
    // (and below the shoulder's line: the sleeve's cap stays under the shirt's top, never a ball above it)
    const t = ((S.u - hip2.u) * axU.u + (S.v - hip2.v) * axU.v) / torsoLen;
    // (an arm raised forward from the shoulder: its root at the TOP of the shoulder, so the sleeve's upper line
    // leaves the shoulder's own line — the deltoid — not the middle of the chest; its round top is cut off behind a
    // line across the arm and faded into the shirt over the body, FamArm/rootOf: no ball shows)
    const tMax = lift ? 0.95 : 0.86;
    if (t > tMax) S = sub(S, mul(axU, (t - tMax) * torsoLen));
    return S;
  };
  // (face-on: each sleeve hangs from the front figure's own shoulder — the trapezius's end, inside the shirt's
  // shoulder line — so no cap stands above or outside it)
  const frontShoulder = (side: 'L' | 'R'): { at: Pt; shirt: SkPath } => {
    const want = q(side === 'L' ? s.shoulderL : s.shoulderR);
    const pose0: PlayerPose = {
      view: 'front',
      posture: fi.seated ? 'seated' : 'standing',
      head: { c: q(s.head), r: s.headR },
      neck: q(s.neck),
      shoulderR: q(s.shoulderR),
      shoulderL: q(s.shoulderL),
      elbowR: q(fi.arms.R.elbow),
      elbowL: q(fi.arms.L.elbow),
      handR: { wrist: q(fi.arms.R.sk.frame.o), dir: Math.PI / 2, kind: 'rest' },
      handL: { wrist: q(fi.arms.L.sk.frame.o), dir: Math.PI / 2, kind: 'rest' },
      hipR: q(s.hipR),
      hipL: q(s.hipL),
      kneeR: q(s.kneeR),
      kneeL: q(s.kneeL),
      footR: P(s.ankleR.x, fi.floorY),
      footL: P(s.ankleL.x, fi.floorY),
      floor: fi.floorY,
    };
    const F = personFrontPlan(pose0, who, {});
    const shirt = frontPaths(F).shirt;
    let best = want;
    let d = Infinity;
    for (const fa of F.arms) {
      const dd = Math.hypot(fa.shoulder.u - want.u, fa.shoulder.v - want.v);
      if (dd < d) {
        d = dd;
        best = fa.shoulder;
      }
    }
    // (the shoulder point never higher than the shirt's own shoulder: a skeleton whose shoulders sit high under the
    // neck — the lutes', 30 mm below it — put the sleeve's line 30 mm above the shirt's trapezius, a step that ended
    // in a pointed tip at each shoulder. The front figure's sleeve line crosses its shirt's trapezius 18 mm in from
    // the shoulder point 24 mm above that point: the point is set down to keep that. Drawing only; no joint moves.)
    const sg = best.u >= q(s.neck).u ? 1 : -1;
    const u18 = best.u - sg * 18;
    let topV = Infinity;
    const sp = F.shirt;
    for (let i = 0; i < sp.length; i++) {
      const a0 = sp[i];
      const b0 = sp[(i + 1) % sp.length];
      if ((a0.u - u18) * (b0.u - u18) > 0 || a0.u === b0.u) continue;
      const k = (u18 - a0.u) / (b0.u - a0.u);
      topV = Math.min(topV, a0.v + (b0.v - a0.v) * k);
    }
    if (Number.isFinite(topV) && best.v < topV + 24) best = P(best.u, topV + 24);
    return { at: best, shirt };
  };
  const armOf = (side: 'L' | 'R', a: FamArmIn): FamArmPlan => {
    const o = a.sk.frame.o;
    const fore = unit3(sub3(o, a.elbow));
    const away = dot3(fore, tw) < -0.35;
    const tilt = Math.max(-1, Math.min(1, dot3(fore, tw)));
    const E = q(a.elbow);
    // (face-on: the sleeve's cap — 22 mm above its root, 47 mm round — is set down the arm so its top meets the
    // shirt's shoulder line instead of standing above it)
    let cap: Poly | null = null;
    let capHide: Poly[] | null = null;
    let capTop: Poly | null = null;
    let fInfo: { F0: Pt; shirt: SkPath; sg: number } | null = null;
    let f0: Pt | null = null;
    const liftRoot = view === 'side' && (E.u - q(a.shoulder).u) * (s.face.x >= 0 ? 1 : -1) > 0.35 * Math.hypot(E.u - q(a.shoulder).u, E.v - q(a.shoulder).v);
    const S = view === 'side' ? rootInside(q(a.shoulder), liftRoot) : view === 'front' ? (() => {
      const { at: F0, shirt } = frontShoulder(side);
      f0 = F0;
      const sg = F0.u >= q(s.neck).u ? 1 : -1;
      const du = unit(sub(E, F0));
      // (an upper arm in the picture's plane — hanging, or out to the side — takes the deltoid's line into the
      // sleeve's edge; one coming toward the viewer, foreshortened, keeps the front figure's own cap)
      const len3 = Math.hypot(a.elbow.x - a.shoulder.x, a.elbow.y - a.shoulder.y, a.elbow.z - a.shoulder.z) || 1;
      // (and not heading in across the chest: an arm reaching in front of the body keeps the cap, never a flap
      // swung out past the shoulder)
      const flat = Math.hypot(E.u - q(a.shoulder).u, E.v - q(a.shoulder).v) / len3 > 0.8 && sg * du.u > -0.12;
      if (flat && du.v > 0.75) {
        // (a HANGING upper arm: the sleeve hangs from the front figure's own shoulder point and takes the front
        // figure's own approved shoulder line — the trapezius flowing into the deltoid's gentle swell — everything
        // of the sleeve above and outside that line hidden. No cap of cloth is added: an added cap, or a root set
        // down an arm that swings out, drew a cape past the shoulder.)
        const kk = B?.shoulder ?? 1;
        const mid1 = lerp(F0, E, 0.36);
        const mid2 = lerp(F0, E, 0.74);
        const line: Poly = [P(F0.u - sg * 30, F0.v - 28), P(F0.u - sg * 4, F0.v - 19 * kk), P(F0.u + sg * 18 * kk, F0.v - 10), P(F0.u + sg * 32 * kk, F0.v + 4), P(F0.u + sg * 39 * kk, F0.v + 26), P(lerp(F0, mid1, 0.62).u + sg * 41 * kk, lerp(F0, mid1, 0.62).v), P(mid1.u + sg * 40.5 * kk, mid1.v), P(mid2.u + sg * 40 * kk, mid2.v), P(E.u + sg * 40, E.v)];
        const far = 600;
        const last = line[line.length - 1];
        // (and everything of the sleeve above the trapezius inward of the line's start, toward the neck: the
        // sleeve's round root never shows as a pointed tip above the shirt's shoulder)
        // (a box only 60 mm in and 100 mm up: a hand raised to the mouth is never inside it)
        capHide = [[P(line[0].u - sg * 60, line[0].v), ...line, P(last.u + sg * far, last.v), P(last.u + sg * far, F0.v - far), P(line[0].u, F0.v - far), P(line[0].u, F0.v - 128), P(line[0].u - sg * 60, F0.v - 128)]];
        return F0;
      }
      // (EVERY arm that does not hang — out to the side, forward and foreshortened, or in across the chest: the
      // deltoid's own line, one curve from the trapezius tangent into the sleeve's outer edge (frontCap), the sleeve
      // grows out of it, its root faded into the shirt over the body and cut behind a line across the shoulder off
      // it (FamArm, BoomV2's shoulderRoot rule). The old fixed cap for a forward arm ended in a ball below and, cut
      // by a level line outside, in a pointed tip at the shoulder — reviewer 2026-11-24, the oud and every guitar.)
      fInfo = { F0, shirt, sg };
      // (the sleeve's root set so its outer edge just touches the front figure's own shoulder contour — the
      // trapezius's end and the deltoid's swell — in the direction the edge faces: an arm raised out to the side has
      // its top at the shoulder's line, not 20 mm above it where it stood up as a block cut by a level edge; a hanging
      // arm's root stays at the shoulder point)
      const kk = B?.shoulder ?? 1;
      const n = outerNormal(du, sg);
      const contour = [P(-4, -19 * kk), P(18 * kk, -10), P(32 * kk, 4), P(39 * kk, 26), P(40 * kk, 52)].map((c) => P(F0.u + sg * c.u, F0.v + c.v));
      const reach = Math.max(...contour.map((c) => (c.u - F0.u) * n.u + (c.v - F0.v) * n.v));
      return add(add(F0, mul(n, reach - 41 * kk)), mul(du, 14));
    })() : (() => {
      // (from above the deltoid is wider than the arm below it: the sleeve's root is set in toward the neck so
      // its outer edge steps in from the shoulders' outer edge — never one continuous top edge)
      const S0 = q(a.shoulder);
      const n2 = q(s.neck);
      const toN = unit(sub(n2, S0));
      return add(S0, mul(toN, 18));
    })();
    // (the sleeve is drawn to a point 16 mm on the page past the wrist: its cuff, 16 mm short of that, ends AT
    // the wrist crease — no band of bare forearm between the cuff and the hand)
    const o2 = q(o);
    const fd = unit(sub(o2, E));
    // (the cuff ends just short of the wrist crease (≤ 8 mm, the coordinator's rule): the wrist, narrower than the cuff and the
    // heel, shows the hand as its own form — never one column from the sleeve to the knuckles)
    const W = away ? q(sub3(o, mul3(fore, 4))) : add(o2, mul(fd, 9.5));
    // (in profile, an upper arm raised forward from the shoulder: the deltoid fuller than the elbow — the sleeve
    // tapers from the shoulder's form to the elbow, never an even rod)
    const raised = view === 'side' && (E.u - S.u) * (s.face.x >= 0 ? 1 : -1) > 0.35 * Math.hypot(E.u - S.u, E.v - S.v);
    const arm = armPlan(S, E, W, null, away, null, tilt, null, view === 'top', raised ? { ...build, k: (build.k ?? 1) * 1.14 } : build);
    if (fInfo) ({ cap, capHide, capTop } = frontCap(fInfo, arm));
    const { e, out } = arm.opening;
    const from = P(e.c.u + out.u * 2, e.c.v + out.v * 2);
    const hand = familyHand(a.sk, pr, `${fi.key}|${view}|${side}`, { cut: a.cut ?? null, from });
    const far = view === 'side' ? side !== nearSide : false;
    return { side, arm, hand, far, dUpper: D(mid3(a.shoulder, a.elbow)), dFore: D(mid3(a.elbow, o)), elbow2: E, handFront: a.front !== false && !a.handElsewhere, handElsewhere: !!a.handElsewhere, cap, capHide, capTop, f0 };
  };
  const L = armOf('L', fi.arms.L);
  const R = armOf('R', fi.arms.R);
  // side: the far arm first (behind the body); from above: the lower arm first (both under the shoulders' cloth)
  const arms = view === 'side' ? (L.far ? [L, R] : [R, L]) : D(fi.arms.L.elbow) <= D(fi.arms.R.elbow) ? [L, R] : [R, L];
  let front: FamPlan['front'] = null;

  const hipMid = mid3(s.hipL, s.hipR);
  const posture = fi.seated ? 'seated' : 'standing';
  let side: FamPlan['side'] = null;
  let top: FamPlan['top'] = null;
  if (view === 'side') {
    const facing = s.face.x >= 0 ? 1 : -1;
    const n = q(s.neck);
    const hip = q(hipMid);
    // (the body's own arms are not drawn: the near arm is switched off, the far one tucked inside the torso's
    // outline, painted before the shirt — the family draws both arms on their skeleton)
    const tuckE = lerp(hip, n, 0.6);
    const tuckW = lerp(hip, n, 0.36);
    const foot = (ankle: V3, toe: V3): Pt => {
      const A = q(ankle);
      const T2 = q(toe);
      const fs = Math.sign(T2.u - A.u) || facing;
      return P(A.u + fs * 40, T2.v > A.v ? T2.v + 22 : A.v + 80);
    };
    const nearArm = nearSide === 'R' ? R : L;
    const pose: PlayerPose = {
      view: 'side',
      posture,
      head: { c: q(s.head), r: s.headR },
      neck: n,
      shoulderR: q(nearSide === 'R' ? s.shoulderR : s.shoulderL),
      shoulderL: lerp(hip, n, 0.9),
      elbowR: nearArm.elbow2,
      elbowL: tuckE,
      handR: { wrist: nearArm.arm.wrist, dir: 0, kind: 'rest' },
      handL: { wrist: tuckW, dir: Math.PI / 2, kind: 'rest' },
      hipR: q(nearSide === 'R' ? s.hipR : s.hipL),
      hipL: q(nearSide === 'R' ? s.hipL : s.hipR),
      kneeR: q(nearSide === 'R' ? s.kneeR : s.kneeL),
      kneeL: q(nearSide === 'R' ? s.kneeL : s.kneeR),
      footR: nearSide === 'R' ? foot(s.ankleR, s.toeR) : foot(s.ankleL, s.toeL),
      footL: nearSide === 'R' ? foot(s.ankleL, s.toeL) : foot(s.ankleR, s.toeR),
      floor: fi.floorY,
      facing,
    };
    // (TWO LEGS: a far leg exactly behind the near one would vanish — a real seated or standing player's legs
    // are never in one line; the far knee and foot are set a little forward of the near ones so the far leg
    // shows beyond them. The legs are drawing defaults, never a measured point.)
    {
      const dk = (pose.kneeL.u - pose.kneeR.u) * facing;
      const df = (pose.footL.u - pose.footR.u) * facing;
      if (Math.abs(dk) < 45 && Math.abs(df) < 60) {
        const kk = 55 - dk;
        const ff = 75 - df;
        pose.kneeL = P(pose.kneeL.u + facing * kk, pose.kneeL.v - 6);
        pose.footL = P(pose.footL.u + facing * ff, pose.footL.v);
      }
    }
    // the head's nod: the face's fall below level (degrees, + = the face down)
    const fl = Math.hypot(s.face.x, s.face.z) || 1;
    const nod = Math.max(-10, Math.min(28, (Math.atan2(s.face.y, fl) * 180) / Math.PI));
    const plan = sidePlan(pose, { head: who.head, body: B, nod, ...(fi.lip ? { lip: q(fi.lip) } : {}), ...(fi.seated && fi.seatY !== undefined ? { seatV: fi.seatY } : {}) });
    side = { pose, plan };
  } else if (view === 'front') {
    // face-on: the body as the front figure draws it (frontPlan), its arms off — the family draws both
    const pose: PlayerPose = {
      view: 'front',
      posture,
      head: { c: q(s.head), r: s.headR },
      neck: q(s.neck),
      shoulderR: q(s.shoulderR),
      shoulderL: q(s.shoulderL),
      elbowR: q(fi.arms.R.elbow),
      elbowL: q(fi.arms.L.elbow),
      handR: { wrist: R.arm.wrist, dir: Math.PI / 2, kind: 'rest' },
      handL: { wrist: L.arm.wrist, dir: Math.PI / 2, kind: 'rest' },
      hipR: q(s.hipR),
      hipL: q(s.hipL),
      kneeR: q(s.kneeR),
      kneeL: q(s.kneeL),
      footR: P(s.ankleR.x, fi.floorY),
      footL: P(s.ankleL.x, fi.floorY),
      floor: fi.floorY,
    };
    front = { pose };
  } else {
    // the body's facing from the hips (the shoulders turn with a reaching arm; the hips stay square)
    const hr = q(s.hipR);
    const hl = q(s.hipL);
    const across = unit(sub(hr, hl));
    const fwd = P(-across.v, across.u);
    // (player's right toward +v when facing +u: the chest is the right-hand turn of left → right… checked by the test)
    const fwdOk = fwd.u * (s.face.x) + fwd.v * s.face.z >= 0 ? fwd : mul(fwd, -1);
    const facing = Math.atan2(fwdOk.v, fwdOk.u);
    const n = q(s.neck);
    const unturn = (a: Pt, f = facing): Pt => {
      const t = Math.PI / 2 - f;
      const d = sub(a, n);
      return add(n, P(d.u * Math.cos(t) - d.v * Math.sin(t), d.u * Math.sin(t) + d.v * Math.cos(t)));
    };
    const pose: PlayerPose = {
      view: 'above',
      posture,
      head: { c: unturn(q(s.head)), r: s.headR },
      neck: n,
      shoulderR: unturn(q(s.shoulderR)),
      shoulderL: unturn(q(s.shoulderL)),
      elbowR: unturn(q(fi.arms.R.elbow)),
      elbowL: unturn(q(fi.arms.L.elbow)),
      handR: { wrist: unturn(R.arm.wrist), dir: 0, kind: 'rest' },
      handL: { wrist: unturn(L.arm.wrist), dir: 0, kind: 'rest' },
      hipR: unturn(hr),
      hipL: unturn(hl),
      kneeR: unturn(q(s.kneeR)),
      kneeL: unturn(q(s.kneeL)),
      footR: unturn(q(lerp3(s.ankleR, s.toeR, 0.35))),
      footL: unturn(q(lerp3(s.ankleL, s.toeL, 0.35))),
      floor: null,
      facing,
    };
    // the head turned to the face (its own facing from above)
    const fh = Math.atan2(s.face.z, s.face.x);
    const headPose: PlayerPose = { ...pose, facing: fh, head: { c: unturn(q(s.head), fh), r: s.headR } };
    top = { pose, plan: personTopPlan(pose, who, {}), headPose };
  }
  const legD = (hip: V3, knee: V3) => D(mid3(hip, knee));
  const nearHip = nearSide === 'R' ? s.hipR : s.hipL;
  const farHip = nearSide === 'R' ? s.hipL : s.hipR;
  const nearKnee = nearSide === 'R' ? s.kneeR : s.kneeL;
  const farKnee = nearSide === 'R' ? s.kneeL : s.kneeR;
  return {
    in: fi,
    side,
    top,
    front,
    arms,
    depth: { head: D(s.head), neck: D(s.neck), chest: D(s.chest ?? mid3(s.neck, s.pelvis)), legNear: legD(nearHip, nearKnee), legFar: legD(farHip, farKnee), nearSide },
  };
}
const lerp3 = (a: V3, b: V3, t: number): V3 => add3(a, mul3(sub3(b, a), t));
/** The lip point on the page (face-on: the middle of the mouth). */
const famLip = (fp: FamPlan): Pt => {
  const r = famProj(fp.in.view)(fp.in.lip!);
  return P(r.u, r.v);
};

/* ── drawing ── */

const dimLayer = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);
const FAR = dimLayer(FAR_DIM);
const FAR_SKIN = dimLayer(FAR_SKIN_DIM);
/** (from above) an arm below the shoulders: a small value step down from them. */
const UNDER = dimLayer(0.86);

function torsoOf(path: SkPath, axis: [Pt, Pt]): Torso {
  const b = path.getBounds();
  return { axis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: path };
}

/**
 * THE ELBOW CLOSED (reviewer 2026-11-24: a sharp V notch, see-through, where the upper sleeve meets the forearm's
 * in a bent arm). The bend is filled with cloth: a disc as wide as the sleeve at the elbow joins the upper sleeve,
 * so the two tubes meet in one closed fold in every pose. Drawing only; the elbow is the skeleton's own.
 */
const elbowCache = new WeakMap<object, ReturnType<typeof armPaths>>();
function elbowClosed(arm: ArmPlan, P0: ReturnType<typeof armPaths>): ReturnType<typeof armPaths> {
  const hit = elbowCache.get(P0);
  if (hit) return hit;
  const d1 = unit(sub(arm.elbow, arm.shoulder));
  const d2 = unit(sub(arm.wrist, arm.elbow));
  let out = P0;
  if (d1.u * d2.u + d1.v * d2.v < 0.94) {
    const disc = Skia.Path.Make();
    disc.addCircle(arm.elbow.u, arm.elbow.v, 34);
    out = { ...P0, upper: unionOf(P0.upper, disc) };
  }
  elbowCache.set(P0, out);
  return out;
}

function FamArm({ a, t, lite, view, hideIn, under }: { a: FamArmPlan; t: Torso; lite: boolean; view: FamView; /** (face-on) the shirt round the shoulder: the sleeve's cap is hidden there, so the sleeve leaves the shirt's own shoulder */ hideIn?: SkPath; /** (from above) the sleeve a value step down (the hand keeps its skin) */ under?: boolean }) {
  const P2 = elbowClosed(a.arm, armPaths(a.arm, famProj(view)));
  const hand = a.handElsewhere ? null : <FamilyHandV2 h={a.hand} />;
  // (face-on the sleeve keeps the front figure's own cloth light at every size, as its own arms do)
  const body = lite && view !== 'front' ? (
    <Group layer={a.far ? FAR : under ? UNDER : undefined}>
      <ArmLite a={a.arm} P={P2} stick={hand} />
    </Group>
  ) : (
    <Arm a={a.arm} P={P2} t={t} stick={hand} cloth={a.far ? FAR : under ? UNDER : undefined} skin={a.far ? FAR_SKIN : undefined} />
  );
  if (hideIn) {
    if (view === 'front' && a.capTop && a.cap) {
      // (face-on, out of the deltoid's cap — BoomV2's shoulderRoot rule: the body is the shirt with the cap; off it,
      // nothing of the sleeve behind a line across the shoulder is drawn; over it the sleeve's first 34 mm fade into
      // the shirt's cloth — no straight edge across the arm, no cap, no tip)
      const R0 = rootOf(a.arm, unionOf(t.body, smoothClosed(a.cap, 0.35)), 34);
      return (
        <Group clip={hideIn} invertClip>
          <Group layer={<Paint />}>
            {body}
            <Path path={R0.behindOff} color="black" blendMode="dstOut" />
            <Group clip={R0.body}>
              <Path path={R0.near} blendMode="dstOut">
                <LinearGradient start={vec(R0.from.u, R0.from.v)} end={vec(R0.to.u, R0.to.v)} colors={['black', 'rgba(0,0,0,0)']} />
              </Path>
            </Group>
          </Group>
        </Group>
      );
    }
    return (
      <Group clip={hideIn} invertClip>
        {body}
      </Group>
    );
  }
  // (the sleeve grows out of the shoulder — the boom figure's rule, BoomV2 shoulderRoot: near the shoulder,
  // nothing of the arm behind a line across it, square to the upper arm, is drawn off the body; over the body
  // the sleeve's first 34 mm fade into the shirt — no round cap stuck on the shoulder)
  const R0 = rootOf(a.arm, t.body);
  if (lite) return <Group clip={R0.clip}>{body}</Group>;
  return (
    <Group>
      <Group layer={<Paint />}>
        {body}
        <Path path={R0.behindOff} color="black" blendMode="dstOut" />
        <Group clip={t.body}>
          <Path path={R0.near} blendMode="dstOut">
            <LinearGradient start={vec(R0.from.u, R0.from.v)} end={vec(R0.to.u, R0.to.v)} colors={['black', 'rgba(0,0,0,0)']} />
          </Path>
        </Group>
      </Group>
      {view === 'side' && !a.far ? <UpperOverBody a={a} upper={unionOf(P2.upper, P2.foreSleeve)} body={t.body} /> : null}
    </Group>
  );
}

/**
 * (in profile) AN UPPER ARM LYING OVER THE CHEST (the trombone's slide arm, reviewer 2026-11-24: "a lighter band
 * with a firm upper edge across the chest"): the sleeve turns away from the light at both its edges — a soft
 * darkening inside its outline — and lays a soft occlusion shadow on the shirt beside it, so the arm reads as a
 * round limb in front of the body, never a flat band with a ruled edge. Past the shoulder only (faded in over its
 * first 80 mm: the deltoid stays the shirt's one cloth). Drawing only.
 */
function UpperOverBody({ a, upper, body }: { a: FamArmPlan; upper: SkPath; body: SkPath }) {
  const { MAT } = useLook();
  const S = a.arm.shoulder;
  const du = unit(sub(a.arm.elbow, S));
  const g0 = add(S, mul(du, 20));
  const g1 = add(S, mul(du, 95));
  const inside = op(upper, body, PathOp.Intersect);
  const beside = op(body, upper, PathOp.Difference);
  const bb = upper.getBounds();
  return (
    <Mask
      mode="alpha"
      mask={
        <Path path={polyPath([P(bb.x - 200, bb.y - 200), P(bb.x + bb.width + 200, bb.y - 200), P(bb.x + bb.width + 200, bb.y + bb.height + 200), P(bb.x - 200, bb.y + bb.height + 200)])}>
          <LinearGradient start={vec(g0.u, g0.v)} end={vec(g1.u, g1.v)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']} />
        </Path>
      }
    >
      <Group clip={inside}>
        <Path path={upper} style="stroke" strokeWidth={18} color={MAT.shirt.deep} opacity={0.34}>
          <Blur mm={6} />
        </Path>
      </Group>
      <Group clip={beside}>
        <Path path={upper} style="stroke" strokeWidth={12} color={MAT.shirt.deep} opacity={0.3}>
          <Blur mm={5} />
        </Path>
      </Group>
    </Mask>
  );
}

/** The shoulder's root zone (see FamArm): within 85 mm of the shoulder only — a hand raised to the mouth is
 *  never touched. */
function rootOf(a: ArmPlan, body: SkPath, fade = 52): { clip: SkPath; behindOff: SkPath; near: SkPath; from: Pt; to: Pt; body: SkPath } {
  const sh = a.shoulder;
  const du = unit(sub(a.elbow, sh));
  const n = P(-du.v, du.u);
  const o = sub(sh, mul(du, 6));
  const far = 5000;
  const half = Skia.Path.Make();
  half.moveTo(o.u + n.u * far, o.v + n.v * far);
  half.lineTo(o.u + n.u * far + du.u * far, o.v + n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far + du.u * far, o.v - n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far, o.v - n.v * far);
  half.close();
  const disc = Skia.Path.Make();
  disc.addCircle(sh.u, sh.v, 85);
  const behind = op(disc, half, PathOp.Difference);
  const behindOff = op(behind, body, PathOp.Difference);
  const all = Skia.Path.Make();
  all.addRect(Skia.XYWHRect(sh.u - far, sh.v - far, 2 * far, 2 * far));
  return { clip: op(all, behindOff, PathOp.Difference), behindOff, near: disc, from: o, to: add(o, mul(du, fade)), body };
}

/** (face-on) the front figure's own cloth light (FigureV2Front's torso light: across the body's axis, a little
 *  darker toward the hem) on a piece of the shirt. */
function FrontCloth({ path, axis, box }: { path: SkPath; axis: [Pt, Pt]; box: { x: number; y: number; width: number; height: number } }) {
  const { MAT } = useLook();
  const [s0, e0] = across(axis[0], axis[1], 190);
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(s0.u, s0.v)} end={vec(e0.u, e0.v)} colors={MAT.shirt.form} positions={MAT.shirt.pos} />
      </Path>
      <Path path={path}>
        <LinearGradient start={vec(box.x, box.y)} end={vec(box.x, box.y + box.height)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']} />
      </Path>
    </Group>
  );
}

/** The page above a height (v < v0). */
function aboveV(v0: number): SkPath {
  const p = Skia.Path.Make();
  p.addRect(Skia.XYWHRect(-20000, -20000, 40000, v0 + 20000));
  return p;
}

/**
 * (face-on) THE HORN ZONE: above the shirt and inward of the shoulder point (toward the neck), within a box
 * 80 mm in and 110 mm up — where neither cap nor sleeve may show (reviewer 2026-11-24: pointed hooked flaps above
 * the shoulders when the front figure's shoulder line sits lower than the sleeve's root). The hand is never in it.
 */
function hornZone(a: FamArmPlan, shirt: SkPath): SkPath {
  const F0 = a.f0;
  const z = Skia.Path.Make();
  if (!F0) return z;
  const sg = a.arm.elbow.u >= F0.u ? 1 : -1;
  const u0 = Math.min(F0.u + sg * 6, F0.u - sg * 80);
  const u1 = Math.max(F0.u + sg * 6, F0.u - sg * 80);
  z.addRect(Skia.XYWHRect(u0, F0.v - 110, u1 - u0, 110 + 4));
  const sil = a.handElsewhere ? null : familyHandSilhouette(a.hand);
  const minus = op(z, shirt, PathOp.Difference);
  return sil ? op(minus, sil, PathOp.Difference) : minus;
}

/**
 * (face-on, an arm coming toward the viewer under the front figure's own cap) everything of the sleeve ABOVE and
 * OUTSIDE the cap's shoulder line: the sleeve's round root, set down the arm, otherwise stood up past the cap as a
 * pointed, hooked flap (reviewer 2026-11-24, every seated guitar, the oud). The hand is never in it.
 */
function capAbove(a: FamArmPlan): SkPath {
  const z = Skia.Path.Make();
  if (!a.cap || a.capTop || !a.f0) return z;
  const F0 = a.f0;
  const sg = a.cap[4].u >= F0.u ? 1 : -1;
  const line = a.cap.slice(0, 5);
  const last = line[line.length - 1];
  const far = 600;
  const poly = polyPath([P(F0.u - sg * 60, line[0].v), ...line, P(last.u + sg * far, last.v), P(last.u + sg * far, F0.v - far), P(F0.u - sg * 60, F0.v - far)]);
  const sil = a.handElsewhere ? null : familyHandSilhouette(a.hand);
  return sil ? op(poly, sil, PathOp.Difference) : poly;
}

/** (face-on) the shirt within a hand's breadth of the sleeve's root. */
function shoulderZone(shirt: SkPath, at: Pt): SkPath {
  const d = Skia.Path.Make();
  d.addCircle(at.u, at.v, 80);
  return op(shirt, d, PathOp.Intersect);
}

/** The whole person (behind the instrument). */
export const FamilyFigureV2 = memo(function FamilyFigureV2({ fp, assumePtPerMm }: { fp: FamPlan; assumePtPerMm?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const lite = level === 'lite';
  const who = fp.in.who;
  let body: ReactNode = null;
  if (fp.side) {
    const { plan, pose } = fp.side;
    const SP = sidePaths(plan);
    const t = torsoOf(SP.shirt, [plan.hip, plan.neck]);
    const headPt = (ptPerMm ?? 0) * 228 * (pose.head.r / 110);
    const far = fp.arms.filter((a) => a.far);
    const near = fp.arms.filter((a) => !a.far);
    body = (
      <Group>
        {far.map((a) => (
          <FamArm key={a.side} a={a} t={t} lite={lite} view="side" />
        ))}
        {lite ? (
          <SideLite
            plan={plan}
            P={SP}
            noArm="near"
            fullHead={
              headPt >= FULL_HEAD_PT ? (
                <FigureScale ptPerMm={ptPerMm} level="full">
                  <FigureV2Side plan={plan} part="head" />
                </FigureScale>
              ) : undefined
            }
          />
        ) : (
          <FigureV2Side plan={plan} noArm="near" />
        )}
        {near.map((a) => (
          <FamArm key={a.side} a={a} t={t} lite={lite} view="side" />
        ))}
      </Group>
    );
  } else if (fp.front) {
    const F = personFrontPlan(fp.front.pose, who, fp.in.lip ? { lip: famLip(fp) } : {});
    const FP = frontPaths(F);
    const t = torsoOf(FP.shirt, F.axis);
    body = (
      <Group>
        {fp.in.lowerOverride?.front ? fp.in.lowerOverride.front.node : null}
        {fp.in.lowerOverride?.front ? (
          <Group clip={aboveV(fp.in.lowerOverride.front.clipAboveV)}>
            <PersonFrontV2 pose={fp.front.pose} who={who} opts={fp.in.lip ? { lip: famLip(fp) } : {}} arms={false} />
          </Group>
        ) : (
          <PersonFrontV2 pose={fp.front.pose} who={who} opts={fp.in.lip ? { lip: famLip(fp) } : {}} arms={false} />
        )}
        {/* each shoulder's cap in the shirt's own light (the deltoid flowing on from the trapezius), its line only
            where it is the figure's edge; then the sleeve out of it, its own round root hidden inside the cap */}
        {fp.arms.map((a) => {
          if (!a.cap) return null;
          const c = a.capTop ? smoothClosed(a.cap, 0.35) : op(smoothClosed(a.cap, 0.35), hornZone(a, FP.shirt), PathOp.Difference);
          return (
            <Group key={`cap${a.side}`}>
              <FrontCloth path={c} axis={F.axis} box={FP.shirt.getBounds()} />
              <Group clip={FP.shirt} invertClip>
                <Path path={a.capTop ? smoothOpen(a.capTop) : c} style="stroke" strokeWidth={1} color={who.look.MAT.shirt.edge} opacity={0.5} />
              </Group>
            </Group>
          );
        })}
        {fp.arms.map((a) => {
          if (a.cap && a.capTop) {
            // (above and outside the deltoid's line, and the horn zone: never the forearm or the hand, wherever it is)
            const AP = armPaths(a.arm, famProj('front'));
            const sil = a.handElsewhere ? null : familyHandSilhouette(a.hand);
            const keep = unionOf(AP.foreSleeve, AP.cuffCloth, ...(sil ? [sil] : []));
            const hide = op(unionOf(...(a.capHide ?? []).map(polyPath)), keep, PathOp.Difference);
            return <FamArm key={a.side} a={a} t={t} lite={lite} view="front" hideIn={hide} />;
          }
          if (a.cap || !a.f0)
            return <FamArm key={a.side} a={a} t={t} lite={lite} view="front" hideIn={unionOf(...(a.capHide ?? []).map(polyPath), shoulderZone(FP.shirt, a.arm.shoulder), hornZone(a, FP.shirt), capAbove(a))} />;
          // (a hanging arm: the sleeve is drawn OVER the shirt's shoulder as the front figure's own sleeve is — the
          // armless shirt's square shoulder corner never shows as a horn — and its cap takes the shirt's own light,
          // fading into the sleeve's below the shoulder, so the shoulder is one cloth)
          // (no horn zone here: with the shoulder point set down to the shirt's own shoulder (frontShoulder) the line's
          // hidden region already takes everything above the trapezius; the zone's box, reaching 4 mm below the point,
          // cut a V notch beside the shirt's corner and left a flap of sleeve outside it — guitars, 2026-11-24)
          // (never the hand: the region runs out level from the elbow, and a hand raised past the elbow's height —
          // the guitar's fretting fingertips over the board — was cut along that level line, FamilyHands3 2026-11-24)
          const handSil = a.handElsewhere ? null : familyHandSilhouette(a.hand);
          const hide0 = unionOf(...(a.capHide ?? []).map(polyPath));
          const hide = handSil ? op(hide0, handSil, PathOp.Difference) : hide0;
          const up = op(unionOf(armPaths(a.arm, famProj('front')).upper), hide, PathOp.Difference);
          const disc = Skia.Path.Make();
          disc.addCircle(a.f0.u, a.f0.v + 20, 95);
          const capArea = op(up, disc, PathOp.Intersect);
          return (
            <Group key={a.side}>
              <FamArm a={a} t={t} lite={lite} view="front" hideIn={hide} />
              <Mask
                mode="alpha"
                mask={
                  <Path path={capArea}>
                    <LinearGradient start={vec(a.f0.u, a.f0.v - 10)} end={vec(a.f0.u, a.f0.v + 90)} colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0)']} />
                  </Path>
                }
              >
                <FrontCloth path={capArea} axis={F.axis} box={FP.shirt.getBounds()} />
              </Mask>
              <Group clip={disc}>
                <Group clip={FP.shirt} invertClip>
                  <Path path={up} style="stroke" strokeWidth={1} color={who.look.MAT.shirt.edge} opacity={0.5} />
                </Group>
              </Group>
            </Group>
          );
        })}
      </Group>
    );
  } else if (fp.top) {
    const { plan, pose, headPose } = fp.top;
    const T = topPaths(plan);
    const t = torsoOf(T.torso, plan.torsoAxis);
    body = (
      <Group>
        {fp.in.seated ? fp.in.lowerOverride?.top ?? (lite ? <TopLite plan={plan} T={T} part="legs" /> : <DrummerTopLegsV2 plan={plan} />) : null}
        {/* the arms below the shoulders' height first, under the shoulders' cloth */}
        {/* (lower than the shoulders, so a value step down from them, and in the shoulders' soft shadow where they
            leave them: the sleeve head reads as its own form under the shoulder's edge) */}
        {fp.arms
          .filter((a) => a.dUpper <= fp.depth.neck - 60)
          .map((a) => {
            const AP = armPaths(a.arm, famProj('top'));
            const dx = a.arm.elbow.u - a.arm.shoulder.u;
            const dy = a.arm.elbow.v - a.arm.shoulder.v;
            const dl = Math.hypot(dx, dy) || 1;
            return (
              <Group key={a.side}>
                <FamArm a={a} t={t} lite={lite} view="top" under />
                <Group clip={AP.upper}>
                  <Group transform={[{ translateX: (dx / dl) * 16 }, { translateY: (dy / dl) * 16 }]}>
                    <Soft path={T.torso} color={who.look.MAT.shirt.deep} opacity={0.6} blur={lite ? 0 : 8} />
                  </Group>
                </Group>
              </Group>
            );
          })}
        <PersonTopV2 pose={pose} who={who} part="upper" head="none" />
        {/* an arm raised to the shoulders' height lies ON them: each sleeve head its own form over the shoulder,
            with its soft shadow on the shirt beside it (never one slab of cloth with the upper arms) */}
        {fp.arms
          .filter((a) => a.dUpper > fp.depth.neck - 60)
          .map((a) => {
            const AP = armPaths(a.arm, famProj('top'));
            return (
              <Group key={a.side}>
                <Group clip={T.torso}>
                  <Group transform={[{ translateX: -LIGHT.u * 7 }, { translateY: -LIGHT.v * 7 }]}>
                    <Soft path={AP.upper} color={who.look.MAT.shirt.deep} opacity={0.5} blur={lite ? 0 : 6} />
                  </Group>
                </Group>
                <FamArm a={a} t={t} lite={lite} view="top" />
                <Path path={AP.upper} style="stroke" strokeWidth={1.2} color={who.look.MAT.shirt.edge} opacity={0.55} />
              </Group>
            );
          })}
        <PersonTopV2 pose={headPose} who={who} head="only" />
      </Group>
    );
  }
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>{body}</FigureLook>
    </FigureScale>
  );
});

/** The half of the page on the elbow's shoulder side (`toWrist` false) or its wrist side. */
function halfAt(a: FamArmPlan, toWrist: boolean): SkPath {
  const S = a.arm.shoulder;
  const E = a.arm.elbow;
  const W = a.arm.wrist;
  const d1 = unit(sub(E, S));
  const d2 = unit(sub(W, E));
  let m = add(d1, d2);
  m = Math.hypot(m.u, m.v) > 1e-3 ? unit(m) : P(-d1.v, d1.u);
  const n = P(-m.v, m.u);
  const s = toWrist ? 1 : -1;
  const at = (x: number, y: number) => add(E, add(mul(m, x), mul(n, y)));
  const p = Skia.Path.Make();
  const B = 4000;
  [at(0, -B), at(0, B), at(s * B, B), at(s * B, -B)].forEach((pt, i) => (i ? p.lineTo(pt.u, pt.v) : p.moveTo(pt.u, pt.v)));
  p.close();
  return p;
}

const regionCache = new WeakMap<FamPlan, Map<string, SkPath | null>>();

/**
 * The parts of the person nearer the viewer than the instrument (at `instDepth`): the old figure's own depth
 * rule, part by part — the head, the torso, each leg, each upper arm and forearm (a stopping hand's forearm can
 * be held behind: `foreBehind`), and every hand's front layer.
 */
export function famFrontRegion(fp: FamPlan, instDepth: number, o: { foreBehind?: ('L' | 'R')[]; /** the head and neck nearer than the instrument whatever the joint's depth (a neck passing beside the far ear) */ headFront?: boolean } = {}): SkPath | null {
  let m = regionCache.get(fp);
  if (!m) {
    m = new Map();
    regionCache.set(fp, m);
  }
  const key = `${instDepth}|${(o.foreBehind ?? []).join('')}|${o.headFront ? 'h' : ''}`;
  if (m.has(key)) return m.get(key) ?? null;
  const ps: SkPath[] = [];
  const D = fp.depth;
  const view = fp.in.view;
  if (fp.side) {
    const SP = sidePaths(fp.side.plan);
    // (the whole head: the skull, the face's own profile — jaw, nose, lips — the hair, the neck, the ear)
    if (D.head > instDepth || o.headFront) ps.push(SP.skull, SP.jaw, SP.noseSide, SP.ala, SP.lips, SP.underLip, SP.hair, ...SP.clumps, SP.neck, SP.scm, SP.ear);
    if (D.chest > instDepth) ps.push(SP.shirt, SP.collar, SP.belt);
    if (D.legNear > instDepth) ps.push(SP.trousersNear, SP.shoeNear.upper);
    if (D.legFar > instDepth) ps.push(SP.legFar, SP.shoeFar.upper);
  } else if (fp.front) {
    const FP = frontPaths(personFrontPlan(fp.front.pose, fp.in.who, fp.in.lip ? { lip: famLip(fp) } : {}));
    if (D.head > instDepth || o.headFront) ps.push(FP.skull, FP.hair, FP.neck);
    if (D.chest > instDepth) ps.push(FP.shirt, FP.collar);
    if (D.legNear > instDepth) ps.push(FP.trousers);
  } else if (fp.top) {
    const T = topPaths(fp.top.plan);
    const H = topPaths(personTopPlan(fp.top.headPose, fp.in.who, {}));
    if (D.head > instDepth) ps.push(H.skull, H.hair);
    if (D.chest > instDepth) ps.push(T.torso);
    if (fp.in.seated && D.legNear > instDepth) ps.push(...T.thighs, ...T.shins);
  }
  for (const a of fp.arms) {
    const P2 = armPaths(a.arm, famProj(view));
    const sleeve = unionOf(P2.upper, P2.foreSleeve, P2.cuffCloth);
    if (a.dUpper > instDepth) ps.push(op(sleeve, halfAt(a, false), PathOp.Intersect));
    if (a.dFore > instDepth && !(o.foreBehind ?? []).includes(a.side)) ps.push(op(sleeve, halfAt(a, true), PathOp.Intersect));
    const hf = a.handFront ? familyHandSilhouette(a.hand, 'front') : null;
    if (hf) ps.push(hf);
  }
  // (each part as a plain winding fill before the union: a part built as an even-odd or inverse fill would
  // leave the head or a knee out of the clip)
  const r = ps.length ? unionOf(...ps.map(windingOf)) : null;
  m.set(key, r);
  return r;
}

function windingOf(p: SkPath): SkPath {
  const c = p.copy();
  c.setFillType(FillType.Winding);
  return Skia.Path.MakeFromOp(c, c, PathOp.Union) ?? c;
}

/** The person again, over the instrument, only where its parts are nearer the viewer. */
export function FamilyFigureFrontV2({ fp, region, assumePtPerMm }: { fp: FamPlan; region: SkPath | null; assumePtPerMm?: number }) {
  if (!region) return null;
  return (
    // (in its own layer: the figure's painters composite inside it — a blend over the instrument's pixels would
    // let the instrument show through the head or a knee)
    <Group clip={region} layer={<Paint />}>
      <FamilyFigureV2 fp={fp} assumePtPerMm={assumePtPerMm} />
    </Group>
  );
}

/** The person's page points the tests read. */
export function famPoints(fp: FamPlan): { wrists: Pt[]; elbows: Pt[] } {
  return { wrists: fp.arms.map((a) => a.hand.wrist), elbows: fp.arms.map((a) => a.elbow2) };
}
