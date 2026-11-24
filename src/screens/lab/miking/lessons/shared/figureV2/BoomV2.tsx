/**
 * FIGURE V2 — THE BOOM OPERATOR, DRAWN (wave 4 of D78, builder "FrontAndBoom",
 * 2026-11-24; the grip: boomGrip.ts). A cast member (cast.ts 'operator.boom')
 * with both arms up on the pole: the body drawn with its arms off
 * (PersonSideV2 / PersonTopV2 / PersonFrontV2), each arm the approved sleeve
 * (FigureV2Side.Arm: one sleeve from the shoulder through a bent elbow to the
 * cuff) and the approved 3-D hand (heldHands / heldHandV2) closed round the
 * pole — the pole passing THROUGH each fist (the parts behind it, the pole,
 * the parts in front). In the figure's depth order:
 *   side: the far arm (a value step down), the body, the pole, the near arm;
 *   from above: the body, both arms, the pole over the sleeves;
 *   from the front: the body, both arms, the pole coming toward the viewer.
 * `dim` fades the operator as ONE layer (the old drawing's 0.82: the operator
 * is a figure in the background of a talker's lesson).
 */
import { Fragment, type ReactNode } from 'react';
import { ColorMatrix, Group, LinearGradient, Paint, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import type { PlayerPose } from '../players/playerPose.ts';
import { FigureScale, levelOf, useFigureScale } from './detail';
import { Arm, FAR_DIM, FAR_SKIN_DIM, type Torso } from './FigureV2Side';
import { ArmLite } from './lite';
import { armPaths, type SkPath } from './paths.ts';
import { armPlan, type ArmPlan } from './sidePlan.ts';
import { inPoly, type Pt } from './geom.ts';
import { placeGrip, type V3 } from './heldHands.ts';
import { HeldHand, gripSilhouette } from './heldHandV2';
import { BoomFist, fistSilhouette } from './boomFist';
import { PersonSideV2, PersonTopV2, personPlan } from './personV2';
import { personTopPlan } from './topPerson.ts';
import { topPaths } from './FigureV2Top';
import { sidePaths } from './paths.ts';
import { FigureLook, useLook } from './look';
import { POLE_HAND_CUFF, PoleHandFront, poleHandOutline, poleHandToPage } from './poleHandFront';
import { POLE_HAND_BACK_CUFF, PoleHandBack, poleHandBackOutline, poleHandBackToPage } from './poleHandBack';
import { Blur } from './detail';
import { across } from './paint';
import type { CastMember } from './cast';
import { BOOM_ARM, POLE_R, boomArms, boomHand, boomHandFace, operatorFrame, type BoomArm3, type BoomHandPlan, type ElbowLean, type OperatorFrame } from './boomGrip.ts';
import { PersonFrontV2, frontPaths, personFrontPlan } from './FigureV2Front';
import { FRONT_STANDING } from './frontPlan.ts';

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const unit = (a: V3): V3 => mul(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));

const dimLayer = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);

/** A boom rig: the operator's poses (side and from above, the old drawing's — the body's joints below the
 *  shoulders), the lesson's own hand points on the pole (the middle of each fist), the pole's drawn ends,
 *  which arm takes the rear hand. */
export type BoomRig = {
  side: PlayerPose;
  top: PlayerPose;
  front: V3;
  rear: V3;
  /** The pole as drawn here (its ends, world): from the mic's tail, or the front hand, to its rear end. */
  pole: { a: V3; b: V3 };
  rearArm: 'L' | 'R';
  /** Where the elbows go (optional; default 'forward'): 'beside' for the hands above the head. */
  elbows?: ElbowLean;
  /** (FrontBoom3, optional) from the side the FAR arm takes the rear hand (a stance behind the pole's end). */
  sideRearFar?: boolean;
};

export type BoomView = 'side' | 'top' | 'front';

type ViewSpec = { proj: (p: V3) => Pt; toward: V3 };

/** The operator's frame and shoulders (world) from the rig's poses. */
export function rigFrame(rig: BoomRig, who: CastMember): { o: OperatorFrame; shoulders: { L: V3; R: V3 } } {
  const neck = v3(rig.side.neck.u, rig.side.neck.v, rig.top.neck.v);
  const f = rigFacing(rig);
  const o = operatorFrame(neck, v3(Math.cos(f), 0, Math.sin(f)));
  const k = who.body?.shoulder ?? 1;
  // (the shoulders a little lifted with the arms overhead, as the old drawing had them)
  const base = add(neck, v3(0, 30, 0));
  return { o, shoulders: { R: add(base, mul(o.R, 168 * (0.6 + 0.4 * k))), L: add(base, mul(o.R, -168 * (0.6 + 0.4 * k))) } };
}

/**
 * THE OPERATOR TURNS TO THE POLE (FrontBoom2, review 2026-11-24: "the forearms cross in an X" from the front; "an arm
 * crosses the face" from the side). An overhead boom is held in an H: the pole runs ACROSS the operator, the hands a
 * little more than shoulder-width apart, each arm on its own side. So the operator stands turned to the pole (a
 * drawing default: their stance, never the pole, the mic or a hand point): from their old facing, turned the least
 * that puts the front hand at least SPREAD mm out to the side AWAY from the side view's viewer (their right while they
 * face −x) and the rear hand toward the viewer — the near arm on the rear hand, up and back clear of the face; the far
 * arm reaching forward behind the head. Held low, the old facing.
 */
const SPREAD = 260;
const facingCache = new WeakMap<BoomRig, number>();
export function rigFacing(rig: BoomRig): number {
  const hit = facingCache.get(rig);
  if (hit != null) return hit;
  const f0 = rig.top.facing ?? 0;
  const neckY = rig.side.neck.v;
  let out = f0;
  if (rig.front.y < neckY - 80) {
    const d = v3(rig.front.x - rig.rear.x, 0, rig.front.z - rig.rear.z);
    // (the far side in the side view: −z; the operator's right R = (−sin f, 0, cos f))
    const sep = (f: number) => {
      const R = v3(-Math.sin(f), 0, Math.cos(f));
      const far = R.z < 0 ? 1 : -1;
      return far * dot(d, R);
    };
    if (sep(f0) < SPREAD) {
      let best = f0;
      let bestS = sep(f0);
      for (let k = 1; k <= 80; k++)
        for (const s of [1, -1]) {
          const f = f0 + (s * k * Math.PI) / 180;
          const v = sep(f);
          if (v >= SPREAD && bestS < SPREAD) {
            best = f;
            bestS = v;
          } else if (bestS < SPREAD && v > bestS) {
            best = f;
            bestS = v;
          }
        }
      out = best;
    }
  }
  facingCache.set(rig, out);
  return out;
}
/** The rig's top pose turned to the pole (rigFacing). */
const topTurned = new WeakMap<BoomRig, PlayerPose>();
export function rigTop(rig: BoomRig): PlayerPose {
  const hit = topTurned.get(rig);
  if (hit) return hit;
  const f = rigFacing(rig);
  const out = f === (rig.top.facing ?? 0) ? rig.top : { ...rig.top, facing: f };
  topTurned.set(rig, out);
  return out;
}

/** A view's projection: side (u = x, v = y), from above (u = x, v = z), from the front (the operator facing
 *  the viewer: their right on the viewer's left, placed on the front figure's own neck). */
export function viewOf(view: BoomView, o: OperatorFrame): ViewSpec {
  if (view === 'side') return { proj: (p) => ({ u: p.x, v: p.y }), toward: v3(0, 0, 1) };
  if (view === 'top') return { proj: (p) => ({ u: p.x, v: p.z }), toward: v3(0, -1, 0) };
  return {
    proj: (p) => ({ u: FRONT_STANDING.neck.u - dot(sub(p, o.neck), o.R), v: FRONT_STANDING.neck.v + (p.y - o.neck.y) }),
    toward: o.F,
  };
}

/** One arm and its hand for a view: the sleeve (armPlan) from the drawn shoulder through the elbow to the
 *  wrist, the hand on the pole, its wrist's skin starting at the cuff's opening. */
export type BoomArmPlan = { hand: BoomHandPlan; arm: ArmPlan; far: boolean; /** +1: the pole's mic end comes toward the viewer at this hand; −1 away */ toViewer: 1 | -1; /** (FrontBoom5, front) which approved palm-side picture the hand is */ approved?: string };

export function boomArmPlan(o: OperatorFrame, a: BoomArm3, poleDir: V3, vs: ViewSpec, shoulder2: Pt, far: boolean, /** (FrontBoom5) the front view: each hand the approved mic hand, palm side (approvedFrontArm) */ approved = false): BoomArmPlan {
  if (approved && a.fist.y < a.shoulder.y) return POLE_FRONT_HANDS ? poleFrontArm(a, poleDir, vs, shoulder2, far) : approvedFrontArm(a, poleDir, vs, shoulder2, far);
  const h0 = boomHand(o, a, poleDir, vs.toward, vs.proj);
  const fore = unit(sub(h0.wrist3, a.elbow));
  const arm = armPlan(shoulder2, vs.proj(a.elbow), vs.proj(sub(h0.wrist3, mul(fore, 4))), null, h0.away, null, 0, null, false, { one: true });
  const { e, out } = arm.opening;
  const hand = boomHand(o, a, poleDir, vs.toward, vs.proj, { u: e.c.u + out.u * 2, v: e.c.v + out.v * 2 });
  return { hand, arm, far, toViewer: dot(poleDir, vs.toward) >= 0 ? 1 : -1 };
}

/**
 * THE APPROVED MIC HAND, PALM SIDE (FrontBoom5, owner 2026-11-24 on the front view's hands: "this does not pass").
 * The approved picture on /michand — "B03 · the shared omni … the palm side (the four fingers across the handle, the
 * thumb over the index)" — is a right hand closed round a cylinder seen from the palm side, the forearm leaving it
 * nearly square to the cylinder: exactly an overhead boom hand seen from the front. So the front view draws THAT
 * hand: the same call the study page makes (heldHands.placeGrip with the approved grip frame, seen from the side, the
 * approved painter heldHandV2), the pole's radius for the handle's; the picture turned rigidly on the page so the
 * handle's line lies along the pole and the forearm comes up from below; the operator's LEFT hand its mirror image.
 * The wrist is straight: the sleeve's forearm is laid along the hand's own forearm line (the drawn elbow moved round
 * the wrist to it, the forearm's drawn length kept), and the cuff closes round the wrist as on the approved page.
 */
export type ApprovedPalm = { id: string; plane: 'side' | 'top'; fr: { f: V3; h: V3; d: V3 } };
/**
 * The approved palm-side pictures (/michand side, /michandtop from above), each heldStudy's heldGeo(id).fr seen as that
 * page sees it (the test checks every number against heldStudy). f the forearm toward the fist, h the handle, d the
 * back of the hand. The first is the one the owner named (B03 · the shared omni); the others are the same approved hand
 * and painter with the forearm meeting the handle at another angle, taken only where the rig's forearm needs it (a
 * straight wrist, never a bend the approved pages do not have).
 */
export const APPROVED_PALMS: ApprovedPalm[] = [
  {
    id: 'b3.shared',
    plane: 'side',
    fr: {
      f: { x: -0.9337807732112859, y: 0.28901050325078204, z: 0.21101278774439858 },
      h: { x: -8.659560562354914e-18, y: -0.9899494936611664, z: 0.1414213562373092 },
      d: { x: -0.2583928212692433, y: -0.13661867734072947, z: -0.9563307413851081 },
    },
  },
  {
    id: 'b3.repOwn',
    plane: 'side',
    fr: {
      f: { x: -0.5135789666201961, y: -0.8242065587886233, z: 0.2385795328504676 },
      h: { x: 0.9396926207859084, y: -0.3420201433256686, z: 1.1507915602278503e-16 },
      d: { x: -0.08329399963548004, y: -0.22884838317454334, z: -0.9698920182902435 },
    },
  },
  {
    id: 'b3.handoffOmni',
    plane: 'top',
    fr: {
      f: { x: -0.7338828978937745, y: -0.0507486580599968, z: 0.6773776390494044 },
      h: { x: -0.90630778703665, y: -0.4226182617406995, z: 0 },
      d: { x: -0.39373794120897315, y: 0.8443737397898287, z: -0.3633227507407952 },
    },
  },
  {
    id: 'b10.hand',
    plane: 'top',
    fr: {
      f: { x: 0.5279288709971418, y: -0.33840277934616564, z: 0.7789574225196612 },
      h: { x: -0.9396926207859084, y: -0.34202014332566866, z: 0 },
      d: { x: -0.28806972976824224, y: 0.7914650777666407, z: 0.5390722228673049 },
    },
  },
];
/** The approved pages' own projections and view directions (heldStudy proj / TOWARD). */
const PLANE = {
  side: { proj: (p: V3): Pt => ({ u: p.x, v: p.y }), toward: { x: 0, y: 0, z: 1 } },
  top: { proj: (p: V3): Pt => ({ u: p.x, v: p.z }), toward: { x: 0, y: -1, z: 0 } },
} as const;
/** (degrees) how much nearer the rig's forearm another approved picture must bring the forearm to be taken over the
 *  one the owner named. */
const NAMED_BIAS = 12;
/** How far back from the hand's wrist the sleeve's mouth sits (mm): just under the wrist, so the hand's own wrist runs
 *  into the cuff with no air between (16 left a gap on the right hand). */
const APPROVED_CUFF_BACK = 4;
function approvedFrontArm(a: BoomArm3, poleDir: V3, vs: ViewSpec, shoulder2: Pt, far: boolean): BoomArmPlan {
  const F2 = vs.proj(a.fist);
  const E2 = vs.proj(a.elbow);
  const pd = unit2(sub2(vs.proj(add(a.fist, poleDir)), F2));
  const m = a.side === 'L' ? -1 : 1;
  const up = unit2(sub2(F2, E2));
  const turn = (q: Pt, c: number, s: number) => P2(q.u * c - q.v * s, q.u * s + q.v * c);
  // (of the approved pictures and the two turns of each that lay the handle along the pole, the one whose forearm
  // comes up nearest the rig's own forearm — the owner's named picture first unless another is NAMED_BIAS° nearer)
  let best = { A: APPROVED_PALMS[0], c: 1, s: 0, cost: Infinity };
  APPROVED_PALMS.forEach((A, k) => {
    const pr = PLANE[A.plane].proj;
    const h2 = pr(A.fr.h);
    const f2 = pr(A.fr.f);
    const ha = unit2(P2(m * h2.u, h2.v));
    const fa = unit2(P2(m * f2.u, f2.v));
    for (const t of [pd, mul2(pd, -1)]) {
      const th = Math.atan2(t.v, t.u) - Math.atan2(ha.v, ha.u);
      const c = Math.cos(th);
      const s = Math.sin(th);
      const cost = (Math.acos(Math.max(-1, Math.min(1, dot2(turn(fa, c, s), up)))) * 180) / Math.PI + (k === 0 ? 0 : NAMED_BIAS);
      if (cost < best.cost) best = { A, c, s, cost };
    }
  });
  const A = best.A;
  const pr = PLANE[A.plane].proj;
  // (the approved picture's own page — the fist at the origin — mirrored for a left hand, turned, and set on the fist)
  const page = (p: V3): Pt => {
    const q0 = pr(p);
    const q = turn(P2(m * q0.u, q0.v), best.c, best.s);
    return P2(F2.u + q.u, F2.v + q.v);
  };
  const grip = placeGrip(v3(0, 0, 0), A.fr, PLANE[A.plane].toward, page, POLE_R);
  const fl = Math.hypot(grip.forearm.u, grip.forearm.v) || 1;
  const df = P2(grip.forearm.u / fl, grip.forearm.v / fl);
  const W2 = grip.wrist;
  const L = Math.hypot(E2.u - W2.u, E2.v - W2.v);
  const elbow2 = sub2(W2, mul2(df, L));
  // (the sleeve's mouth set where the approved page's cuff ends: APPROVED_CUFF_BACK short of the hand's wrist, so the
  // hand's own wrist runs into it — never a gap of bare air between the cuff and the hand)
  const plan = (w: Pt) => armPlan(shoulder2, elbow2, w, null, false, null, 0, null, false, { one: true });
  const a0 = plan(W2);
  const off = dot2(sub2(a0.opening.e.c, W2), df);
  const arm = plan(add2(W2, mul2(df, -APPROVED_CUFF_BACK - off)));
  const g = grip.frame;
  const toPage = (l: { u: number; w: number; n: number }) => page(add(mul(g.U, l.u), add(mul(g.W, l.w), mul(g.N, l.n))));
  return { hand: { arm: a, grip, wrist3: a.fist, away: false, endOn: false, toPage, painter: 'held' }, arm, far, toViewer: dot(poleDir, vs.toward) >= 0 ? 1 : -1, approved: A.id };
}

/**
 * THE APPROVED POLE HAND, PALM SIDE (owner 2026-11-24: "Pole hand passes"; poleHandFront.tsx). From the front the
 * overhead hold IS that drawing: a right hand closed on a horizontal pole, the forearm up from below, seen from the
 * palm side; the operator's LEFT hand its mirror image (re-lit: the light stays upper left). Each is turned on the
 * page so its pole axis lies along the rig's pole through the fist, its forearm side toward the elbow. The wrist is
 * straight: the sleeve's forearm is laid along the hand's own forearm line (the drawn elbow moved round the wrist to
 * it, the forearm's drawn length kept), the sleeve's mouth at the drawing's own cuff, the hand's skin ending there.
 * Only the front view; the side and top views keep their hands.
 */
export const POLE_FRONT_HANDS = true;
function poleFrontArm(a: BoomArm3, poleDir: V3, vs: ViewSpec, shoulder2: Pt, far: boolean): BoomArmPlan {
  // (the approved mic hand's plan still made: its grip is the hand's frame the rest of the figure reads)
  const base = approvedFrontArm(a, poleDir, vs, shoulder2, far);
  const F2 = vs.proj(a.fist);
  const E2 = vs.proj(a.elbow);
  const pd = unit2(sub2(vs.proj(add(a.fist, poleDir)), F2));
  let rot = Math.atan2(pd.v, pd.u);
  // (the drawing's +y — toward its wrist — on the elbow's side)
  if (dot2(P2(-Math.sin(rot), Math.cos(rot)), sub2(E2, F2)) < 0) rot += Math.PI;
  const mirror = a.side === 'L';
  const at = { x: F2.u, y: F2.v, rot, mirror };
  const toPage = poleHandToPage({ ...at, s: 1 });
  const W2 = toPage(POLE_HAND_CUFF);
  // (the forearm's direction, elbow → wrist: the drawing's −y on the page)
  const df = P2(Math.sin(rot), -Math.cos(rot));
  const L = Math.hypot(E2.u - W2.u, E2.v - W2.v);
  const elbow2 = sub2(W2, mul2(df, L));
  const plan = (w: Pt) => armPlan(shoulder2, elbow2, w, null, false, null, 0, null, false, { one: true });
  const a0 = plan(W2);
  const offs = dot2(sub2(a0.opening.e.c, W2), df);
  // (the sleeve's mouth on the drawing's cuff rim, a little over the wrist's end)
  const arm = plan(add2(W2, mul2(df, POLE_FRONT_CUFF_IN - offs)));
  return { ...base, arm, hand: { ...base.hand, painter: 'poleFront', poleFront: at } };
}
/** How far the sleeve's mouth sits past the drawing's cuff rim toward the hand (mm). */
const POLE_FRONT_CUFF_IN = 2;

/**
 * THE APPROVED POLE HANDS FROM THE SIDE (2026-11-24, "Boom side": the view the boom lessons draw — B04, B10, B11, F09).
 * The operator stands in profile, the pole across the picture. Which face of each hand the camera sees is read from the
 * rig's own 3-D hand (boomGrip.boomHandFace: the back of the hand square to the forearm and the pole, turned out to the
 * arm's side): its BACK toward the camera → the approved back-of-hand drawing (poleHandBack.tsx); away → the approved
 * palm-side drawing (poleHandFront.tsx). The operator's LEFT hand is the mirror image (re-lit). Each is turned on the
 * page so its pole axis lies along the rig's pole through the middle of the fist (the lesson's grip point), its wrist
 * toward the elbow; the wrist straight: the sleeve's forearm laid along the drawing's own forearm line (the drawn elbow
 * moved round the wrist to it, the forearm's drawn length kept), the sleeve's mouth on the drawing's cuff rim, the
 * hand's skin ending there. The drawings are never squashed or skewed: a hand turned more than SIDE_TURN_MAX from
 * square takes the nearer of the two drawings and is reported (sideFace.turn).
 *
 * WHERE NEITHER DRAWING CAN BE PLACED (SIDE_FIT_GUARD). The drawing's forearm is square to its pole. Where the rig's
 * forearm and pole on the page are far from square (a pole seen steeply, or held low with the forearms coming from
 * behind), a straight wrist puts the drawn elbow where no arm reaches: the upper arm longer on the page than it is
 * (BOOM_ARM.upper), or, overhead, the elbow up beside or above the hand. The drawn elbow may come in along the forearm's
 * line (a forearm turned toward or away from the camera is shorter on the page: down to SIDE_FORE_MIN of its drawn
 * length); if no such elbow is in reach, that rig keeps its old side hands (both hands: one look per figure) and says
 * why (sideFace.fits false) — another drawing of the hand is needed there. Off: every hand forced on.
 * POLE_SIDE_HANDS off: the old side hands (boomFist) everywhere.
 */
export const POLE_SIDE_HANDS = true;
/** (degrees) past this the drawing no longer matches the hand's real turn (the study page and the tests report it). */
export const SIDE_TURN_MAX = 30;
/** A rig whose straight-wrist arm cannot be reached keeps its old side hands (see above). */
export const SIDE_FIT_GUARD = true;
/** The shortest the drawn forearm may get (a share of its projected length) when its elbow comes in to be reached. */
const SIDE_FORE_MIN = 0.6;
/** How much longer than its real length the upper arm may look on the page (a projection is never longer; the drawn
 *  shoulder point and the sleeve's soft root leave a little play — B04's far arm, behind the head, needs 1.11). */
const SIDE_UPPER_SLACK = 1.15;
export type SideFit = { fits: boolean; why?: string };
function poleSideArm(o: OperatorFrame, a: BoomArm3, poleDir: V3, vs: ViewSpec, shoulder2: Pt, far: boolean): { plan: BoomArmPlan; fit: SideFit } {
  // (the 3-D grip still made: its frame is the one the rest of the figure reads)
  const base = boomArmPlan(o, a, poleDir, vs, shoulder2, far);
  const face = boomHandFace(o, a, poleDir, vs.toward);
  const F2 = vs.proj(a.fist);
  const E2 = vs.proj(a.elbow);
  const pd = unit2(sub2(vs.proj(add(a.fist, poleDir)), F2));
  let rot = Math.atan2(pd.v, pd.u);
  // (the drawing's +y — toward its wrist — on the elbow's side)
  if (dot2(P2(-Math.sin(rot), Math.cos(rot)), sub2(E2, F2)) < 0) rot += Math.PI;
  const mirror = a.side === 'L';
  const at = { x: F2.u, y: F2.v, rot, mirror };
  const backSide = face.face === 'back';
  const toPage = (backSide ? poleHandBackToPage : poleHandToPage)({ ...at, s: 1 });
  const W2 = toPage(backSide ? POLE_HAND_BACK_CUFF : POLE_HAND_CUFF);
  // (the forearm's direction, elbow → wrist: the drawing's −y on the page)
  const df = P2(Math.sin(rot), -Math.cos(rot));
  const L = Math.hypot(E2.u - W2.u, E2.v - W2.v);
  // (the elbow on the forearm's line: its projected length if the upper arm reaches it, else the longest that does)
  const S = shoulder2;
  const upperMax = BOOM_ARM.upper * SIDE_UPPER_SLACK;
  const reach = (t: number) => Math.hypot(W2.u - df.u * t - S.u, W2.v - df.v * t - S.v) <= upperMax;
  let t = L;
  if (!reach(t)) {
    t = -1;
    for (let k = L; k >= L * SIDE_FORE_MIN; k -= 2)
      if (reach(k)) {
        t = k;
        break;
      }
  }
  const elbow2 = sub2(W2, mul2(df, t > 0 ? t : L));
  // (overhead: the elbow below the hand, never up beside or above it)
  const overhead = a.fist.y < a.shoulder.y - 80;
  const fit: SideFit = t < 0 ? { fits: false, why: `the upper arm would be ${Math.round(Math.hypot(elbow2.u - S.u, elbow2.v - S.v))} mm on the page (it is ${BOOM_ARM.upper})` } : overhead && elbow2.v < W2.v + 40 ? { fits: false, why: 'the elbow would be up beside or above the hand' } : { fits: true };
  const plan = (w: Pt) => armPlan(shoulder2, elbow2, w, null, false, null, 0, null, false, { one: true });
  const a0 = plan(W2);
  const offs = dot2(sub2(a0.opening.e.c, W2), df);
  const arm = plan(add2(W2, mul2(df, POLE_FRONT_CUFF_IN - offs)));
  const sideFace = { face: face.face, turn: face.turn, foreSquare: face.foreSquare, fits: fit.fits, why: fit.why };
  const hand: BoomHandPlan = backSide ? { ...base.hand, painter: 'poleBack', poleBack: at, sideFace } : { ...base.hand, painter: 'poleFront', poleFront: at, sideFace };
  return { plan: { ...base, arm, hand }, fit };
}

/** The pole: a dark metal tube (≈ 30 mm), its lit edge. */
function PoleSeg({ a, b, proj, cap = 'round', endAt }: { a: V3; b: V3; proj: (p: V3) => Pt; cap?: 'round' | 'butt'; /** (the piece coming out of a fist toward the viewer) its start drawn as the pole's round section seen at this
 *  slant — the pole going INTO the fist, never a square-cut end */ endAt?: { dir: V3; toward: V3 } }) {
  const p = Skia.Path.Make();
  const A = proj(a);
  const B = proj(b);
  p.moveTo(A.u, A.v);
  p.lineTo(B.u, B.v);
  // (the pole's round section at `a`, as the view sees it: across the pole its full width, along it foreshortened)
  const end = (r: number) => {
    if (!endAt) return null;
    const L = Math.hypot(B.u - A.u, B.v - A.v) || 1;
    const k = Math.abs(dot(endAt.dir, endAt.toward));
    const e = Skia.Path.Make();
    e.addOval(Skia.XYWHRect(-r, -r * Math.max(0.08, k), 2 * r, 2 * r * Math.max(0.08, k)));
    const ang = (Math.atan2(B.v - A.v, B.u - A.u) * 180) / Math.PI;
    return { e, t: [{ translateX: A.u }, { translateY: A.v }, { rotate: ((ang + 90) * Math.PI) / 180 }] as const, L };
  };
  const e1 = end(15.5);
  const e2 = end(13.5);
  // (the pole's 30 mm section: a dark rim, the tube, its lit edge)
  return (
    <Group>
      {e1 ? (
        <Group transform={[...e1.t]}>
          <Path path={e1.e} color="#0b0c0f" />
        </Group>
      ) : null}
      <Path path={p} style="stroke" strokeWidth={31} strokeCap={cap} color="#0b0c0f" />
      {e2 ? (
        <Group transform={[...e2.t]}>
          <Path path={e2.e} color="#3a3d45" />
        </Group>
      ) : null}
      <Path path={p} style="stroke" strokeWidth={27} strokeCap={cap} color="#3a3d45" />
      <Group transform={[{ translateX: -1.5 }, { translateY: -2 }]}>
        <Path path={p} style="stroke" strokeWidth={6} strokeCap={cap} color="#d4d8e0" opacity={0.45} />
      </Group>
    </Group>
  );
}
/** Which painter draws a hand on the pole: 'held' the approved mic hand's (heldHandV2), 'fist' boomFist's forms. */
const BOOM_HAND_PAINTER = 'fist' as 'held' | 'fist';
/** (FrontBoom3) a pole seen steeply is hidden inside the closed fist (entering at one edge, leaving at the other); the
 *  piece coming out over the hand toward the viewer read as a pole END laid on a lump — off. */
const NEAR_PIECE = false;
/** (FrontBoom3) from the front: cut a raised sleeve's root below the shoulder (off: the shirt's own shoulder cap then
 *  stood out alone); instead the raised arm's root sits ON the shoulder cap (FRONT_ROOT_SHIFT), covering it. */
const FRONT_ROOT_CUT = true;
/** From the front, where a raised arm's sleeve starts: from the drawn shoulder point, out (mm) and down (mm) — the
 *  middle of the shirt's shoulder cap (the deltoid), so the raised sleeve covers it and grows out of it. */
const FRONT_ROOT_SHIFT = { out: -16, down: 60 };
/** (FrontBoom4, owner 2026-11-24: "pants are extra wide on front view") the body from the front with both arms
 *  raised: the trousers' top follows the hips (nothing hangs beside them to cover the standing figure's wide tops). */
const FRONT_OPTS = { armsUp: true } as const;
/** A pole hand's whole outline (the pole drawn whole outside it). */
export const handSil = (hp: BoomHandPlan): SkPath =>
  hp.painter === 'poleFront' && hp.poleFront ? poleHandOutline({ ...hp.poleFront, s: 1, sleeve: false }) : hp.painter === 'poleBack' && hp.poleBack ? poleHandBackOutline({ ...hp.poleBack, s: 1, sleeve: false }) : BOOM_HAND_PAINTER === 'held' || hp.painter === 'held' ? gripSilhouette(hp.grip) : fistSilhouette(hp.grip, hp.toPage);
/** Half the fist's width along the pole (the little finger's edge to the index's and the thumb's), mm. */
const HAND_HALF = 38;

/** One arm drawn: the sleeve, the cuff, the hand round the pole (the pole's piece through the fist painted
 *  between the hand's parts behind it and in front of it). */
function BoomArmArt({ ap, torso, poleDir, proj, toward, front = false, frontBody, erase }: { ap: BoomArmPlan; torso: Torso; poleDir: V3; proj: (p: V3) => Pt; toward: V3; /** from the front: the raised sleeve's root never hangs below the shoulder outside the body */ front?: boolean; /** (front) the shirt as drawn with the arms raised (its shoulder caps off) */ frontBody?: SkPath; /** (FrontBoom4, front) the sleeve's corner outside the armpit's curve (frontPits), taken off */ erase?: SkPath | null }) {
  const lite = useFigureScale().level === 'lite';
  const P0 = armPaths(ap.arm, (p) => ({ u: p.x, v: p.y, d: p.z }));
  // (FrontBoom4, front, an arm raised: the sleeve's set-in seam would lie as a line across the chest — the sleeve and
  // the shirt are one cloth at the armpit, so no seam is drawn there)
  const P = front && ap.arm.elbow.v < ap.arm.shoulder.v ? { ...P0, armhole: Skia.Path.Make() } : P0;
  const hand = <BoomHandArt ap={ap} poleDir={poleDir} proj={proj} toward={toward} />;
  const root = shoulderRoot(ap.arm, torso);
  // (FrontBoom3, review 2026-11-24: "each upper arm ends in a square corner beside the torso instead of growing out of
  // the shoulder") from the front an arm raised overhead rises OUT of the shoulder: the sleeve's root corner that
  // would hang below the shoulder point, outside the shirt, is cut away — the arm's outer edge runs on from the
  // shirt's side at the shoulder, its inner edge from the shoulder's top line.
  if (FRONT_ROOT_CUT && front && ap.arm.elbow.v < ap.arm.shoulder.v) {
    const s = ap.arm.shoulder;
    const below = Skia.Path.Make();
    // (the root's corner outside the shirt, below the armpit: the line slants up toward the arm's outer side, so
    // the sleeve's outer edge runs into the shirt's side at the armpit)
    const out = ap.arm.elbow.u < s.u ? -1 : 1;
    below.moveTo(s.u - out * 40, s.v + 45);
    below.lineTo(s.u + out * 200, s.v - 115);
    below.lineTo(s.u + out * 260, s.v + 600);
    below.lineTo(s.u - out * 60, s.v + 600);
    below.close();
    const cut = Skia.Path.MakeFromOp(below, frontBody ?? torso.body, PathOp.Difference) ?? below;
    root.behindOff = Skia.Path.MakeFromOp(root.behindOff, cut, PathOp.Union) ?? root.behindOff;
  }
  // (FrontBoom3: B10 from above, "both hands on the pole") an upper arm seen nearly end-on (raised toward the viewer
  // from above) has no direction on the page: the shoulder line's cut would take the forearm and the hand with it
  const shortUpper = Math.hypot(ap.arm.elbow.u - ap.arm.shoulder.u, ap.arm.elbow.v - ap.arm.shoulder.v) < 140;
  if (lite) {
    const clip = shortUpper ? undefined : erase ? Skia.Path.MakeFromOp(root.clip, erase, PathOp.Difference) ?? root.clip : root.clip;
    return (
      <Group layer={ap.far ? dimLayer(FAR_DIM) : undefined} clip={clip}>
        <ArmLite a={ap.arm} P={P} stick={hand} />
      </Group>
    );
  }
  return (
    <Group layer={<Paint />}>
      <Arm a={ap.arm} P={P} t={torso} stick={hand} cloth={ap.far ? dimLayer(FAR_DIM) : undefined} skin={ap.far ? dimLayer(FAR_SKIN_DIM) : undefined} />
      {/* off the body, behind the shoulder line: nothing of the sleeve's round root */}
      {shortUpper ? null : <Path path={root.behindOff} color="black" blendMode="dstOut" />}
      {/* over the body: the sleeve's root fades into the shirt over its first few cm */}
      <Group clip={torso.body}>
        <Path path={root.plane} blendMode="dstOut">
          <LinearGradient start={vec(root.from.u, root.from.v)} end={vec(root.to.u, root.to.v)} colors={['black', 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
      {erase ? <Path path={erase} color="black" blendMode="dstOut" /> : null}
    </Group>
  );
}

/** One hand round the pole (the pole's piece inside the fist between the parts behind it and in front of it). */
function BoomHandArt({ ap, poleDir, proj, toward: vsToward }: { ap: BoomArmPlan; poleDir: V3; proj: (p: V3) => Pt; toward: V3 }) {
  const lite = useFigureScale().level === 'lite';
  const f = ap.hand.arm.fist;
  const sil = handSil(ap.hand);
  // (FrontBoom2, review 2026-11-24: "the pole drawn ACROSS the hand's front") the pole THROUGH the fist, in depth
  // along the pole itself: inside the hand's own outline, only the piece within the fist's width lies between the
  // parts behind it and the parts in front of it; the piece beyond the fist's NEAR end (toward the viewer) comes
  // out of the fist over the hand; the piece beyond its far end lies behind the whole hand (not drawn over it).
  // Outside the hand's outline the pole is the one drawn whole.
  const s = ap.toViewer;
  // (FrontBoom3, review 2026-11-24: "the pole drawn ACROSS the hand's front") only a pole seen nearly END-ON comes out
  // of the fist over the hand; a pole lying across the view passes through the fist: inside the hand's outline the
  // whole pole lies between the parts behind it and the parts in front of it (the fingers that wrap it, the back of
  // the hand), and comes out at the fist's two edges, never laid over the hand.
  const endOn = BOOM_HAND_PAINTER === 'fist' && Math.abs(dot(poleDir, vsToward)) > 0.6;
  const steep = Math.abs(dot(poleDir, vsToward)) > 0.5;
  const seg = (
    <Group clip={sil}>
      <PoleSeg a={add(f, mul(poleDir, (endOn ? -HAND_HALF : -900) * s))} b={add(f, mul(poleDir, (endOn ? HAND_HALF : 900) * s))} proj={proj} cap="butt" />
    </Group>
  );
  const nearPiece = endOn && NEAR_PIECE ? (
    <Group clip={sil}>
      <PoleSeg a={add(f, mul(poleDir, HAND_HALF * s))} b={add(f, mul(poleDir, 900 * s))} proj={proj} cap="butt" endAt={{ dir: poleDir, toward: vsToward }} />
    </Group>
  ) : null;
  const pf = ap.hand.poleFront;
  if (ap.hand.painter === 'poleFront' && pf)
    // (the approved pole hand, palm side: its body behind the pole, the pole's piece inside its outline painted as the
    // scene's pole, the four fingers and the thumb in front; the skin ending at the sleeve's mouth)
    return <PoleHandFront x={pf.x} y={pf.y} s={1} rot={pf.rot} mirror={pf.mirror} sleeve={false} poleLook="boom" ownScale={false} pole={[-70, 70]} />;
  const pb = ap.hand.poleBack;
  if (ap.hand.painter === 'poleBack' && pb)
    // (the approved pole hand from its back: the pole behind the whole hand — the scene's pole outside its outline,
    // the hand's soft shadow on it — the fingers going over the pole)
    return <PoleHandBack x={pb.x} y={pb.y} s={1} rot={pb.rot} mirror={pb.mirror} sleeve={false} poleLook="boom" ownScale={false} pole={[-70, 70]} />;
  const hand = ap.hand.painter === 'held' ? (
    // (FrontBoom5, the front view) the approved mic hand, palm side, as /michand draws it: the parts behind the handle,
    // the pole's piece through the hand where the mic's handle was, the parts in front (the four fingers across it,
    // the thumb over the index)
    <HeldHand h={ap.hand.grip} mic={seg} />
  ) : BOOM_HAND_PAINTER === 'held' ? (
    // (FrontBoom3) the APPROVED mic hand's own painter (heldHandV2, unchanged): the parts behind the pole, the pole's
    // piece inside the hand, the parts in front — the fingers told apart by wedge gaps from the tips, the knuckles
    // low swells, one soft line round each layer. Seen end-on the approved grip already puts the pole in front.
    // A pole seen steeply (coming toward the viewer, or going away) lies INSIDE the closed fist: the fist hides it, the
    // pole entering at one edge and leaving at the other (drawn whole outside the hand) — never laid over the hand.
    <Group>
      <HeldHand h={ap.hand.grip} mic={steep ? null : <Group clip={gripSilhouette(ap.hand.grip)}>{seg}</Group>} />
    </Group>
  ) : (
    <Group>
      <BoomFist g={ap.hand.grip} toPage={ap.hand.toPage} pole={seg} />
      {lite ? null : <KnuckleRow hp={ap.hand} />}
      {nearPiece}
    </Group>
  );
  return hand;
}

/**
 * THE SLEEVE GROWS OUT OF THE SHOULDER (coordinator 2026-11-24, B10 post-event at 3x: "the near sleeve meets
 * the shoulder as a separate round ball"). The approved sleeve starts with a round root a little behind the
 * shoulder point — right for a hanging arm, whose root lies inside the shirt. An arm raised to a pole swings
 * that round root out past the shirt's outline, under the armpit or behind the back, where it reads as a cap
 * stuck on, and its round edge shows over the shirt. The arm is drawn only on the arm's side of a line across
 * the shoulder (square to the upper arm, a few mm back from the shoulder point); over the body's own outline
 * the sleeve's root fades into the shirt across its first few cm (the same cloth: no edge, no cap). The
 * sleeve's cloth then flows on from the shirt's shoulder as one form; nothing of the arm itself moves.
 * (Lite, at the lesson's size: the clip alone.)
 */
const ROOT_FADE = 34;
function shoulderRoot(a: ArmPlan, t: Torso): { clip: SkPath; behindOff: SkPath; plane: SkPath; from: Pt; to: Pt } {
  const s = a.shoulder;
  const ux = a.elbow.u - s.u;
  const uy = a.elbow.v - s.v;
  const L = Math.hypot(ux, uy) || 1;
  const du = { u: ux / L, v: uy / L };
  const n = { u: -du.v, v: du.u };
  const back = 6;
  const far = 5000;
  const o = { u: s.u - du.u * back, v: s.v - du.v * back };
  const half = Skia.Path.Make();
  half.moveTo(o.u + n.u * far, o.v + n.v * far);
  half.lineTo(o.u + n.u * far + du.u * far, o.v + n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far + du.u * far, o.v - n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far, o.v - n.v * far);
  half.close();
  const plane = Skia.Path.Make();
  plane.addRect(Skia.XYWHRect(s.u - far, s.v - far, 2 * far, 2 * far));
  const behind = Skia.Path.MakeFromOp(plane, half, PathOp.Difference) ?? Skia.Path.Make();
  return {
    clip: Skia.Path.MakeFromOp(half, t.body, PathOp.Union) ?? half,
    behindOff: Skia.Path.MakeFromOp(behind, t.body, PathOp.Difference) ?? behind,
    plane,
    from: o,
    to: { u: o.u + du.u * ROOT_FADE, v: o.v + du.v * ROOT_FADE },
  };
}

/**
 * THE KNUCKLE ROW where the back of the hand is turned to the viewer (a pole hand seen from its back: the
 * mic hand's approved back view is the reference): four low broad swells of light along the one edge of the
 * hand over the knuckles, the shallow valleys between them — inside the hand's own outline, nothing past it.
 */
function KnuckleRow({ hp }: { hp: BoomHandPlan }) {
  const { MAT } = useLook();
  const v = hp.grip.view.toward;
  if (v.n < 0.15) return null;
  // (FrontBoom2) seen along the pole the knuckle row is edge-on: nothing to show; across it, the fingers are their own
  // forms (boomFist): only the low swells of light over the knuckles, no dark valleys or creases drawn on top
  if (Math.abs(v.w) > 0.55) return null;
  const ks = hp.grip.model.knuckles;
  const sil = fistSilhouette(hp.grip, hp.toPage);
  const swell = Skia.Path.Make();
  const valley = Skia.Path.Make();
  ks.forEach((k, i) => {
    const c = hp.toPage({ u: k.c.u - 2, w: k.c.w, n: k.c.n + 6 });
    swell.addOval(Skia.XYWHRect(c.u - 7, c.v - 6, 14, 12));
    if (i < ks.length - 1) {
      const n = ks[i + 1];
      const m = hp.toPage({ u: (k.c.u + n.c.u) / 2 - 6, w: (k.c.w + n.c.w) / 2, n: (k.c.n + n.c.n) / 2 + 8 });
      valley.addOval(Skia.XYWHRect(m.u - 2.5, m.v - 5, 5, 10));
    }
  });
  // the shallow creases between neighbouring fingers: along their seam, from the most distal stretch the
  // viewer sees (the tips, or the bend where the fingers go round the far edge) back to the knuckles —
  // only the stretches that face the viewer (the seam's side of the pole toward them)
  const v3 = hp.grip.view.toward;
  const fs = hp.grip.model.fingers;
  const tilt = hp.grip.model.tilt;
  const crease = Skia.Path.Make();
  const creaseTip = Skia.Path.Make();
  for (let i = 0; i < fs.length - 1; i++) {
    const a = fs[i];
    const b = fs[i + 1];
    const seam = a.pts.map((p, j) => {
      const q = b.pts[j];
      const w = (p.w + q.w) / 2;
      const ru = (p.u + q.u) / 2 - w * tilt;
      const rn = (p.n + q.n) / 2;
      const rl = Math.hypot(ru, rn) || 1;
      const r = (a.r[j] + b.r[j]) / 2;
      // (on the fingers' surface, out from the pole's line)
      const s = { u: w * tilt + (ru / rl) * (rl + r * 0.6), w, n: (rn / rl) * (rl + r * 0.6) };
      return { s, faces: ((ru / rl) * v3.u + (rn / rl) * v3.n) > 0.12 };
    });
    // the visible run nearest the tips, back toward the knuckles
    let end = -1;
    for (let j = seam.length - 1; j >= 0; j--)
      if (seam[j].faces) {
        end = j;
        break;
      }
    if (end < 1) continue;
    let start = end;
    while (start > 0 && seam[start - 1].faces) start--;
    if (start === end) continue;
    const P = seam.slice(start, end + 1).map((x) => hp.toPage(x.s));
    crease.moveTo(P[P.length - 1].u, P[P.length - 1].v);
    for (let j = P.length - 2; j >= 0; j--) crease.lineTo(P[j].u, P[j].v);
    // (deepest at the tip end: the crease opens there and runs out toward the knuckles)
    const t0 = P[P.length - 1];
    const t1 = P[P.length - 2];
    creaseTip.moveTo(t0.u, t0.v);
    creaseTip.lineTo(t0.u + (t1.u - t0.u) * 0.45, t0.v + (t1.v - t0.v) * 0.45);
  }
  return (
    <Group clip={sil}>
      <Path path={swell} color={MAT.skin.rim} opacity={0.26}>
        <Blur mm={2.4} />
      </Path>
      <Path path={valley} color={MAT.skin.deep} opacity={0}>
        <Blur mm={1.6} />
      </Path>
      <Path path={crease} style="stroke" strokeWidth={1.3} strokeCap="round" strokeJoin="round" color={MAT.skin.deep} opacity={0}>
        <Blur mm={0.6} />
      </Path>
      <Path path={creaseTip} style="stroke" strokeWidth={2.2} strokeCap="round" color={MAT.skin.deep} opacity={0}>
        <Blur mm={0.7} />
      </Path>
    </Group>
  );
}

const torsoOf = (body: SkPath, axis: [Pt, Pt]): Torso => {
  const b = body.getBounds();
  return { axis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body };
};

/** The rig's plans for a view (memoised per rig, person and view). */
const cache = new WeakMap<BoomRig, Map<string, { arms: BoomArmPlan[]; torso: Torso; vs: ViewSpec; poleDir: V3; o: OperatorFrame; /** the pole as this view draws it (the rig's, except from the front: frontHandsAside) */ pole: { a: V3; b: V3 } }>>();
export function boomPlans(rig: BoomRig, who: CastMember, view: BoomView, /** (dev, the study page's OLD beside NEW) the side view's old hands */ oldSide = false) {
  let m = cache.get(rig);
  if (!m) {
    m = new Map();
    cache.set(rig, m);
  }
  const key = `${who.id}:${view}${oldSide ? ':old' : ''}`;
  const hit = m.get(key);
  if (hit) return hit;
  const turned = rigFrame(rig, who);
  let o = turned.o;
  const shoulders = turned.shoulders;
  let poleDir = unit(sub(rig.pole.a, rig.pole.b)); // (toward the mic's end)
  let pole = rig.pole;
  let arms3 = boomArms(o, shoulders, rig.front, rig.rear, rig.rearArm, rig.elbows);
  let torso: Torso;
  let drawn: (a: BoomArm3) => { s: Pt; far: boolean };
  if (view === 'side') {
    const plan = personPlan(boomSidePose(rig.side), who, {});
    torso = torsoOf(sidePaths(plan).shirt, [plan.hip, plan.neck]);
    // (FrontBoom3, review 2026-11-24: "the near arm rises from the front of the chest"; "the near forearm lies across
    // her hair") the body is drawn in PROFILE, so its arms are solved in the profile's own frame (the pose's facing,
    // never the turn the top view takes) and each from the shoulder AS DRAWN (its page point, its own depth): the
    // upper arm grows out of the drawn shoulder, the elbow out to the arm's own side (toward or away from the viewer),
    // the forearm up to the hand — never swung forward across the face or the hair.
    // (the side pose faces along x: −1 toward −x)
    o = operatorFrame(o.neck, v3(rig.side.facing === 1 ? 1 : -1, 0, 0));
    const k = who.body?.shoulder ?? 1;
    const base = add(o.neck, v3(0, 30, 0));
    const sh0 = { R: add(base, mul(o.R, 168 * (0.6 + 0.4 * k))), L: add(base, mul(o.R, -168 * (0.6 + 0.4 * k))) };
    // (the drawn shoulders are the side plan's: the near one is the arm nearer the viewer)
    const nearSide = dot(sub(sh0.L, sh0.R), { x: 0, y: 0, z: 1 }) > 0 ? 'L' : 'R';
    drawn = (a) => (a.side === nearSide ? { s: plan.arms.near.shoulder, far: false } : { s: plan.arms.far.shoulder, far: true });
    const at = (side: 'L' | 'R'): V3 => {
      const d = side === nearSide ? plan.arms.near.shoulder : plan.arms.far.shoulder;
      return v3(d.u, d.v, sh0[side].z);
    };
    // (a rig may say the FAR arm takes the rear hand from the side: a stance behind the pole's end, where the near
    // arm raised to it would rise across the face)
    // Otherwise (FrontBoom3, review 2026-11-24: "near arm ... over her hair"; "an arm crosses the face") the near arm
    // takes the hand it can reach WITHOUT crossing the face (the head's front half, brow to chin) — the far arm,
    // behind the head, takes the other.
    const hb = plan.head.box;
    const fwd = rig.side.facing === 1 ? 1 : -1;
    const midU = (hb.u0 + hb.u1) / 2;
    // (the face's box reaches down past the chin to the throat: B11, "the near forearm passing just under her chin")
    const face = { u0: Math.min(midU, midU + fwd * (hb.u1 - hb.u0) / 2) - 15, u1: Math.max(midU, midU + fwd * (hb.u1 - hb.u0) / 2), v0: hb.v0 + (hb.v1 - hb.v0) * 0.08, v1: hb.v1 + 45 };
    const crosses = (h: V3) => {
      const s = plan.arms.near.shoulder;
      // (the arm's line from the shoulder to the hand, its elbow sagging a little below it)
      for (let i = 1; i < 24; i++) {
        const t = i / 24;
        const u = s.u + (h.x - s.u) * t;
        const v = s.v + (h.y - s.v) * t + 60 * Math.sin(Math.PI * t);
        if (u > face.u0 && u < face.u1 && v > face.v0 && v < face.v1) return true;
      }
      return false;
    };
    const farSide: 'L' | 'R' = nearSide === 'L' ? 'R' : 'L';
    const cRear = crosses(rig.rear);
    const cFront = crosses(rig.front);
    const force: 'L' | 'R' | undefined = rig.sideRearFar ? farSide : cRear && !cFront ? farSide : cFront && !cRear ? nearSide : undefined;
    arms3 = boomArms(o, { L: at('L'), R: at('R') }, rig.front, rig.rear, rig.rearArm, rig.elbows, force);
  } else if (view === 'top') {
    const plan = personTopPlan(rigTop(rig), who, {});
    torso = torsoOf(topPaths(plan).torso, plan.torsoAxis);
    drawn = (a) => ({ s: vs.proj(a.shoulder), far: false });
  } else {
    const F = personFrontPlan(FRONT_STANDING, who, FRONT_OPTS);
    torso = torsoOf(frontPaths(F).shirt, F.axis);
    // (front view only: an overhead hold seen from the front puts the hands either side of the head)
    const aside = frontHandsAside(rig, o, poleDir);
    if (aside) {
      poleDir = aside.poleDir;
      pole = aside.pole;
      arms3 = boomArms(o, shoulders, aside.front, aside.rear, rig.rearArm, rig.elbows);
    }
    drawn = (a) => {
      const s = F.arms[a.side === 'R' ? 0 : 1].shoulder;
      // (the operator's right on the viewer's left)
      const out = a.side === 'R' ? -1 : 1;
      return a.fist.y < a.shoulder.y ? { s: { u: s.u + out * FRONT_ROOT_SHIFT.out, v: s.v + FRONT_ROOT_SHIFT.down }, far: false } : { s, far: false };
    };
  }
  const vs = viewOf(view, o);
  const at = arms3.map((a) => {
    const d = drawn(a);
    // (a shoulder that rose toward a reach carries the sleeve's root with it)
    const l = a.lift ? vs.proj(add(a.shoulder, mul(a.lift, -1))) : null;
    const lifted = l ? { u: d.s.u + (vs.proj(a.shoulder).u - l.u), v: d.s.v + (vs.proj(a.shoulder).v - l.v) } : d.s;
    return { a, d, lifted };
  });
  let arms = at.map(({ a, d, lifted }) => boomArmPlan(o, a, poleDir, vs, lifted, d.far, view === 'front'));
  if (view === 'side' && POLE_SIDE_HANDS && !oldSide) {
    // (the approved pole hands; a rig where either cannot be placed keeps both old hands, saying why)
    const side = at.map(({ a, d, lifted }) => poleSideArm(o, a, poleDir, vs, lifted, d.far));
    if (!SIDE_FIT_GUARD || side.every((s) => s.fit.fits)) arms = side.map((s) => s.plan);
    else arms = arms.map((p, i) => ({ ...p, hand: { ...p.hand, sideFace: side[i].plan.hand.sideFace } }));
  }
  const out = { arms, torso, vs, poleDir, o, pole };
  m.set(key, out);
  return out;
}

/**
 * THE OVERHEAD HOLD FROM THE FRONT, HANDS EITHER SIDE OF THE HEAD (coordinator 2026-11-24, on the front view: "her
 * left arm rises straight up in front of her face"). In a real overhead hold the arms go up either side of the head.
 * The front view (drawn by no lesson) therefore places the two hands its own way — the rig's lesson points are
 * untouched and the side and top views still use them: centred over the operator (on her neck's line, at the rig's
 * hands' mean height and mean distance in front of her), FRONT_HAND_GAP apart across her, the pole through both,
 * gently sloped as the rig's pole (a quarter of its rise, at most FRONT_MAX_RISE), the mic's end on the same side,
 * the pole's ends as far beyond each hand as the rig's. Held low (the hands not above the neck): unchanged.
 */
export const FRONT_HAND_GAP = 500;
const FRONT_MAX_RISE = 60;
function frontHandsAside(rig: BoomRig, o: OperatorFrame, poleDir0: V3): { front: V3; rear: V3; pole: { a: V3; b: V3 }; poleDir: V3 } | null {
  if (!(rig.front.y < o.neck.y - 80 && rig.rear.y < o.neck.y - 80)) return null;
  const mid = mul(add(rig.front, rig.rear), 0.5);
  const fwd = dot(sub(mid, o.neck), o.F);
  const side = dot(sub(rig.front, rig.rear), o.R) >= 0 ? 1 : -1;
  const across = v3(o.R.x * side, 0, o.R.z * side);
  const C = add(v3(o.neck.x, mid.y, o.neck.z), mul(v3(o.F.x, 0, o.F.z), fwd));
  const rise = Math.max(-FRONT_MAX_RISE, Math.min(FRONT_MAX_RISE, (rig.front.y - rig.rear.y) * 0.25));
  const front = add(C, add(mul(across, FRONT_HAND_GAP / 2), v3(0, rise / 2, 0)));
  const rear = add(C, add(mul(across, -FRONT_HAND_GAP / 2), v3(0, -rise / 2, 0)));
  const dir = unit(sub(front, rear));
  const la = Math.max(0, dot(sub(rig.pole.a, rig.front), poleDir0));
  const lb = Math.max(0, dot(sub(rig.rear, rig.pole.b), poleDir0));
  return { front, rear, poleDir: dir, pole: { a: add(front, mul(dir, la)), b: sub(rear, mul(dir, lb)) } };
}

/**
 * FROM THE FRONT, ARMS RAISED (FrontBoom3, review 2026-11-24: "each upper arm ends in a square corner beside the
 * torso"): the front shirt is cut for hanging arms — its outline runs from the trapezius out over the shoulder cap
 * and back in to the armpit. With the arms up the cap goes up with the sleeve: the region outside the line from the
 * trapezius's end to the armpit (each side) is taken off the shirt, so the torso's side runs straight up into the
 * raised sleeve.
 */
const capsCache = new Map<string, SkPath>();
function frontCapsOff(who: CastMember): SkPath {
  const hit = capsCache.get(who.id);
  if (hit) return hit;
  const F = personFrontPlan(FRONT_STANDING, who, FRONT_OPTS);
  const pts = F.shirt;
  const cx = F.axis[1].u;
  const top = F.axis[1].v;
  const out = Skia.Path.Make();
  for (const s of [-1, 1]) {
    const side = pts.filter((q) => (q.u - cx) * s > 0);
    // (the shoulder's corner: the widest point near the top; the trapezius's end a little above and in; the armpit
    // the side's first point well below the corner)
    const near = side.filter((q) => q.v < top + 260);
    if (!near.length) continue;
    const corner = near.reduce((a, q) => (Math.abs(q.u - cx) > Math.abs(a.u - cx) ? q : a));
    const trap = { u: corner.u - s * 30, v: corner.v - 22 };
    // (down the side: everything outside the shirt's own side points to the chest's lower part — whatever the hanging
    // arm's cut put outside it: the cap, the sleeve's root)
    const down = side.filter((q) => q.v > corner.v + 55 && q.v < corner.v + 320).sort((a, b) => a.v - b.v);
    if (!down.length) continue;
    out.moveTo(trap.u, trap.v);
    for (const q of down) out.lineTo(q.u - s * 1, q.v);
    const last = down[down.length - 1];
    out.lineTo(last.u + s * 400, last.v);
    out.lineTo(trap.u + s * 400, trap.v - 300);
    out.close();
  }
  capsCache.set(who.id, out);
  return out;
}

/**
 * THE ARMPIT AND THE TOP OF THE SHOULDER, ARMS RAISED, FROM THE FRONT (FrontBoom4, owner 2026-11-24: "Both new
 * armpits need better transition"). Where a raised arm leaves the torso the sleeve and the shirt are one cloth: a
 * raised arm pulls the shirt's side seam up into a smooth concave curve under the arm, so from the side of the chest
 * the outline curves up into the underside of the sleeve in ONE soft line; on top the trapezius runs on into the
 * deltoid the same way. Each junction (the torso's side with the sleeve's underside; the trapezius with the sleeve's
 * upper edge) is filled with a fillet: the two outlines' lines meet at a corner, the curve leaves each line tangent to
 * it and bows in toward the corner, and the cloth between the curve and the corner — and over the sleeve's cut root
 * and the shirt's edge there — is the shirt's own cloth in the torso's own light, its inner edges soft. Drawing only.
 */
export type FrontPit = { /** which of the plan's arms */ arm: number; /** the cloth (inner edges soft) */ fill: SkPath; /** the side of the curve the cloth is on */ keep: SkPath; /** the curve (open) */ edge: SkPath; /** (the armpit) the sleeve's corner outside the curve, taken off the arm */ erase: SkPath | null };
const P2 = (u: number, v: number): Pt => ({ u, v });
const add2 = (a: Pt, b: Pt): Pt => P2(a.u + b.u, a.v + b.v);
const sub2 = (a: Pt, b: Pt): Pt => P2(a.u - b.u, a.v - b.v);
const mul2 = (a: Pt, k: number): Pt => P2(a.u * k, a.v * k);
const dot2 = (a: Pt, b: Pt) => a.u * b.u + a.v * b.v;
const cross2 = (a: Pt, b: Pt) => a.u * b.v - a.v * b.u;
const unit2 = (a: Pt): Pt => mul2(a, 1 / (Math.hypot(a.u, a.v) || 1));
/** Where the lines p + t·d and q + s·e meet (null: about parallel). */
function meet(p: Pt, d: Pt, q: Pt, e: Pt): Pt | null {
  const c = cross2(d, e);
  if (Math.abs(c) < 0.12) return null;
  return add2(p, mul2(d, cross2(sub2(q, p), e) / c));
}
/** The farthest (or, `near`, the nearest) point of a closed outline from `c` along the ray `n` (null: it misses). */
function rayHit(poly: readonly Pt[], c: Pt, n: Pt, near = false): Pt | null {
  if (near) {
    let bestN = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const e = sub2(poly[(i + 1) % poly.length], a);
      const den = cross2(n, e);
      if (Math.abs(den) < 1e-9) continue;
      const w = sub2(a, c);
      const x = cross2(w, e) / den;
      const y = cross2(w, n) / den;
      if (y >= 0 && y <= 1 && x > 0 && x < bestN) bestN = x;
    }
    return bestN < Infinity ? add2(c, mul2(n, bestN)) : null;
  }
  let best = -1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const e = sub2(b, a);
    const den = cross2(n, e);
    if (Math.abs(den) < 1e-9) continue;
    const w = sub2(a, c);
    const x = cross2(w, e) / den;
    const y = cross2(w, n) / den;
    if (y >= 0 && y <= 1 && x > best) best = x;
  }
  return best > 0 ? add2(c, mul2(n, best)) : null;
}
const polyPath = (pts: Pt[]) => {
  const p = Skia.Path.Make();
  p.moveTo(pts[0].u, pts[0].v);
  for (const q of pts.slice(1)) p.lineTo(q.u, q.v);
  p.close();
  return p;
};
/**
 * One junction's curve: from A1 (on the first outline, leaving it along `ta`) to B1 (joining the second outline along
 * `tb`), a cubic tangent to each; `inA`, `inB` the material's side of each outline (unit). `erase`: the corner of the
 * drawn sleeve that lies OUTSIDE the curve (the armpit), to be taken off the arm.
 */
function junction(arm: number, A1: Pt, ta: Pt, B1: Pt, tb: Pt, inA: Pt, inB: Pt, k: number, erase: boolean, /** how far the first outline is taken as a straight line past A1 (0: the trapezius, which curves) */ extA = 70): FrontPit {
  const c1 = add2(A1, mul2(ta, k));
  const c2 = sub2(B1, mul2(tb, k));
  const at = (t: number): Pt => {
    const s = 1 - t;
    return P2(s * s * s * A1.u + 3 * s * s * t * c1.u + 3 * s * t * t * c2.u + t * t * t * B1.u, s * s * s * A1.v + 3 * s * s * t * c1.v + 3 * s * t * t * c2.v + t * t * t * B1.v);
  };
  const curve = (p: ReturnType<typeof Skia.Path.Make>) => p.cubicTo(c1.u, c1.v, c2.u, c2.v, B1.u, B1.v);
  const edge = Skia.Path.Make();
  edge.moveTo(A1.u, A1.v);
  curve(edge);
  const M = at(0.5);
  const inM = unit2(add2(inA, inB));
  // (the material's side of the curve, near it: along each outline out past the curve's end, then into the body)
  const keep = Skia.Path.Make();
  const kA = sub2(A1, mul2(ta, extA));
  const kB = add2(B1, mul2(tb, 70));
  keep.moveTo(kA.u, kA.v);
  if (extA > 0) keep.lineTo(A1.u, A1.v);
  curve(keep);
  for (const q of [kB, add2(kB, mul2(inB, 150)), add2(M, mul2(inM, 150)), add2(kA, mul2(inA, 150))]) keep.lineTo(q.u, q.v);
  keep.close();
  // (the cloth: from a little outside the curve — clipped to it — over both outlines' ends and some way in, deep
  // enough that the sleeve's root over the chest dissolves into the shirt)
  const eA = sub2(A1, mul2(ta, Math.min(28, extA)));
  const eB = add2(B1, mul2(tb, 24));
  const fill = polyPath([sub2(eA, mul2(inA, 30)), sub2(M, mul2(inM, 30)), sub2(eB, mul2(inB, 30)), add2(eB, mul2(inB, 55)), add2(M, mul2(inM, 80)), add2(eA, mul2(inA, 70))]);
  let cut: SkPath | null = null;
  if (erase) {
    // (between the curve, the sleeve's underside running on down from B1, and the torso's side running on down from A1)
    const down = mul2(ta, -1);
    const X = meet(B1, tb, A1, down);
    const ok = X && dot2(sub2(X, A1), down) > 0 && dot2(sub2(X, B1), tb) < 0 && Math.hypot(X.u - A1.u, X.v - A1.v) < 400;
    const p = Skia.Path.Make();
    p.moveTo(B1.u, B1.v);
    if (ok && X) p.lineTo(X.u, X.v);
    else {
      const q1 = sub2(B1, mul2(tb, 300));
      const q2 = add2(A1, mul2(down, 300));
      p.lineTo(q1.u, q1.v);
      p.lineTo(q2.u, q2.v);
    }
    p.lineTo(A1.u, A1.v);
    curve(p);
    p.close();
    cut = p;
  }
  return { arm, fill, keep, edge, erase: cut };
}

const pitCache = new WeakMap<object, FrontPit[]>();
/** (dev) the junctions' construction drawn over the figure (the cloth hidden). */
const PIT_DEBUG = false;
const PIT_LINES = true;
/** The junctions' sizes (mm): where on the sleeve's underside the armpit's curve joins it (from the sleeve's root),
 *  how far below the torso's first side point it leaves the side, its tangents' share of the chord; on top, how far
 *  along the trapezius and up the sleeve's edge the curve runs from their corner. */
const PIT = { underAt: 100, pitDown: 0, pitK: 0.42, topA: 30, topB: 40 };
/** Each raised arm's two fillets from the front (none for an arm held low). */
export function frontPits(B: ReturnType<typeof boomPlans>, who: CastMember): FrontPit[] {
  const hit = pitCache.get(B);
  if (hit) return hit;
  const F = personFrontPlan(FRONT_STANDING, who, FRONT_OPTS);
  const cx = F.axis[1].u;
  const top = F.axis[1].v;
  const out: FrontPit[] = [];
  B.arms.forEach((ap, armI) => {
    const a = ap.arm;
    if (!(a.elbow.v < a.shoulder.v)) return;
    const s = a.shoulder;
    const side = s.u < cx ? -1 : 1;
    const du = unit2(sub2(a.elbow, s));
    // (the sleeve's underside: square to the upper arm, toward the arm's own side)
    let nL = P2(-du.v, du.u);
    if (nL.u * side < 0) nL = mul2(nL, -1);
    const nM = mul2(nL, -1);
    const at = (t: number, n: Pt) => rayHit(a.upper, add2(s, mul2(du, t)), n);
    const L0 = at(PIT.underAt, nL);
    const L1 = at(PIT.underAt + 70, nL);
    const M0 = at(110, nM);
    const M1 = at(200, nM);
    // the torso's side below the armpit and the trapezius (the shirt's own points, as frontCapsOff reads them)
    const pts = F.shirt.filter((q) => (q.u - cx) * side > 0);
    const near = pts.filter((q) => q.v < top + 260);
    if (!near.length) return;
    const corner = near.reduce((p, q) => (Math.abs(q.u - cx) > Math.abs(p.u - cx) ? q : p));
    const down = pts.filter((q) => q.v > corner.v + 55 && q.v < corner.v + 320).sort((p, q) => p.v - q.v);
    const trapz = pts.filter((q) => q.v < corner.v - 30 && Math.abs(q.u - cx) > Math.abs(corner.u - cx) * 0.55).sort((p, q) => Math.abs(p.u - cx) - Math.abs(q.u - cx));
    if (L0 && L1 && down.length >= 2) {
      // THE ARMPIT: from the torso's side at the armpit, up and round into the sleeve's underside
      const Ld = unit2(sub2(L1, L0)); // (up the sleeve's underside)
      const Td = unit2(sub2(down[1], down[0])); // (down the torso's side)
      const A1 = add2(down[0], mul2(Td, PIT.pitDown));
      const k = Math.hypot(L0.u - A1.u, L0.v - A1.v) * PIT.pitK;
      out.push(junction(armI, A1, mul2(Td, -1), L0, Ld, P2(-side, 0), nM, k, true));
    }
    if (M0 && M1 && trapz.length >= 2) {
      // THE TOP OF THE SHOULDER (FrontBoom5: read from the drawn outlines themselves, never from straight lines they do
      // not follow): down the sleeve's upper edge to where it meets the shirt's top (J); the curve leaves the shirt's
      // top a little toward the neck from J and runs up into the sleeve's upper edge a little above J
      const Md = unit2(sub2(M1, M0)); // (up the sleeve's upper edge)
      let J: Pt | null = null;
      for (let t = 0; t < 500; t += 2) {
        const q = sub2(M1, mul2(Md, t));
        if (inPoly(q, F.shirt)) {
          J = q;
          break;
        }
      }
      const A1 = J ? rayHit(F.shirt, P2(J.u - side * PIT.topA, J.v - 300), P2(0, 1), true) : null;
      if (J && A1) {
        const B1 = add2(J, mul2(Md, PIT.topB));
        out.push(junction(armI, A1, unit2(sub2(J, A1)), B1, Md, P2(0, 1), nL, Math.hypot(B1.u - A1.u, B1.v - A1.v) * 0.42, false, 0));
      }
    }
  });
  pitCache.set(B, out);
  return out;
}

/** The fillets painted: the shirt's cloth in the torso's own light (frontPlan's TorsoLight: across the torso's axis,
 *  darkening down it), the inner edges soft, the curve the figure's outline. */
function FrontPits({ pits, who }: { pits: FrontPit[]; who: CastMember }) {
  const { MAT } = useLook();
  const lite = useFigureScale().level === 'lite';
  if (!pits.length) return null;
  const F = personFrontPlan(FRONT_STANDING, who, FRONT_OPTS);
  const [s0, e0] = across(F.axis[0], F.axis[1], 190);
  const b = frontPaths(F).shirt.getBounds();
  return (
    <Group>
      {pits.map((p, i) => (
        <Group key={i}>
          <Group clip={p.keep} opacity={PIT_DEBUG ? 0 : 1}>
            <Path path={p.fill}>
              <LinearGradient start={vec(s0.u, s0.v)} end={vec(e0.u, e0.v)} colors={MAT.shirt.form} positions={MAT.shirt.pos} />
              <Blur mm={lite ? 4 : 5} />
            </Path>
            <Path path={p.fill}>
              <LinearGradient start={vec(b.x, b.y)} end={vec(b.x, b.y + b.height)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']} />
              <Blur mm={lite ? 4 : 5} />
            </Path>
          </Group>
          <Path path={p.edge} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
          {PIT_DEBUG && PIT_LINES ? (
            <Group>
              <Path path={p.fill} style="stroke" strokeWidth={2} color="red" />
              <Path path={p.keep} style="stroke" strokeWidth={2} color="cyan" />
              <Path path={p.edge} style="stroke" strokeWidth={3} color="yellow" />
              {p.erase ? <Path path={p.erase} style="stroke" strokeWidth={2} color="magenta" /> : null}
            </Group>
          ) : null}
        </Group>
      ))}
    </Group>
  );
}

/**
 * THE OPERATOR'S STANCE FROM THE SIDE (FrontBoom3, review 2026-11-24: "only one leg visible"; "legs read as one
 * column"): a boom operator stands braced, one foot a little ahead of the other — so from the side both legs show,
 * the front leg toward the way they face. Drawing only: the hips, the body and every lesson point stay.
 */
const stanceCache = new WeakMap<PlayerPose, PlayerPose>();
export function boomSidePose(p: PlayerPose): PlayerPose {
  const hit = stanceCache.get(p);
  if (hit) return hit;
  const fwd = p.facing === 1 ? 1 : -1;
  const out: PlayerPose = {
    ...p,
    kneeR: { u: p.kneeR.u + fwd * 70, v: p.kneeR.v - 6 },
    footR: { u: p.footR.u + fwd * 150, v: p.footR.v },
    kneeL: { u: p.kneeL.u - fwd * 40, v: p.kneeL.v },
    footL: { u: p.footL.u - fwd * 110, v: p.footL.v },
  };
  stanceCache.set(p, out);
  return out;
}

/** The pole runs past the operator's far side (from the side view: behind the body at the body's own x). */
export function poleFarSide(rig: BoomRig): boolean {
  const { a, b } = rig.pole;
  const nx = rig.side.neck.u;
  if (Math.abs(b.x - a.x) < 1) return false;
  const t = (nx - a.x) / (b.x - a.x);
  const z = a.z + (b.z - a.z) * Math.max(-0.5, Math.min(1.5, t));
  const y = a.y + (b.y - a.y) * Math.max(-0.5, Math.min(1.5, t));
  // (only where it passes the body: below the top of the head)
  return y > rig.side.neck.v - 290 && z < rig.top.neck.v - 60;
}

/** The boom operator in the new look. `pole` false: the pole is the scene's own (only the pieces through the
 *  fists are drawn here); `dim` fades the whole operator as one layer. */
export function BoomOperatorV2({ view, rig, who, dim = 0.82, pole = true, assumePtPerMm, part = 'all', debug = false, oldSide = false }: { view: BoomView; rig: BoomRig; who: CastMember; dim?: number; pole?: boolean; assumePtPerMm?: number; /** 'hands': the two fists alone (with the pole's piece inside each), painted again over a pole the engine draws */ part?: 'all' | 'hands'; /** (dev) the rig's points and the solved joints as dots */ debug?: boolean; /** (dev, the study page) the side view's old hands beside the new */ oldSide?: boolean }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const B = boomPlans(rig, who, view, oldSide);
  const proj = B.vs.proj;
  const hands = B.arms.map((a) => handSil(a.hand));
  const handsAll = hands.reduce((acc, p) => {
    const q = acc.copy();
    q.addPath(p);
    return q;
  }, Skia.Path.Make());
  const poleArt = pole ? (
    <Group clip={handsAll} invertClip>
      <PoleSeg a={B.pole.a} b={B.pole.b} proj={proj} />
    </Group>
  ) : null;
  const frontBody = view === 'front' ? Skia.Path.MakeFromOp(B.torso.body, frontCapsOff(who), PathOp.Difference) ?? undefined : undefined;
  const pits = view === 'front' ? frontPits(B, who) : [];
  const eraseOf = (i: number) => pits.filter((p) => p.arm === i && p.erase).reduce<SkPath | null>((acc, p) => (acc ? Skia.Path.MakeFromOp(acc, p.erase!, PathOp.Union) ?? acc : p.erase), null);
  // (FrontBoom5, front) each raised sleeve reads the shirt as reaching into its junctions' curves: no sleeve outline is
  // drawn over the shirt's cloth there
  const torsoFor = (i: number): Torso => {
    const add = pits.filter((p) => p.arm === i).map((p) => Skia.Path.MakeFromOp(p.fill, p.keep, PathOp.Intersect)).filter((p): p is SkPath => !!p);
    if (!add.length) return B.torso;
    const body = add.reduce((acc, p) => Skia.Path.MakeFromOp(acc, p, PathOp.Union) ?? acc, B.torso.body);
    return { ...B.torso, body };
  };
  const arm = (a: BoomArmPlan, i: number) => <BoomArmArt key={i} ap={a} torso={torsoFor(i)} poleDir={B.poleDir} proj={proj} toward={B.vs.toward} front={view === 'front'} frontBody={frontBody} erase={eraseOf(i)} />;
  let body: ReactNode;
  if (part === 'hands') {
    // (a far hand from the side: never over the body or the head that hide it)
    let hide: SkPath | null = null;
    if (view === 'side') {
      const sp = sidePaths(personPlan(boomSidePose(rig.side), who, {}));
      hide = [sp.skull, sp.hair, sp.neck].reduce((acc, p) => {
        const q = acc.copy();
        q.addPath(p);
        return q;
      }, B.torso.body.copy());
    }
    body = (
      <Group>
        {B.arms.map((a, i) => {
          // (only the hand itself, round its fist: nothing else the hand's painter carries)
          const c = proj(a.hand.arm.fist);
          const near = Skia.Path.Make();
          near.addCircle(c.u, c.v, 120);
          return (
            <Group key={i}>
              <Group clip={near}>
                <Group layer={a.far ? dimLayer(FAR_SKIN_DIM) : undefined} clip={a.far && hide ? hide : undefined} invertClip={a.far && !!hide}>
                  <BoomHandArt ap={a} poleDir={B.poleDir} proj={proj} toward={B.vs.toward} />
                </Group>
              </Group>
            </Group>
          );
        })}
      </Group>
    );
  } else if (view === 'side') {
    // (FrontBoom2: a pole held low passes the operator's FAR side — behind the body from this side, never through it)
    const poleBehind = poleFarSide(rig);
    const far = B.arms.filter((a) => a.far);
    const near = B.arms.filter((a) => !a.far);
    body = (
      <Group>
        {far.map(arm)}
        {poleBehind ? poleArt : null}
        <PersonSideV2 pose={boomSidePose(rig.side)} who={who} opts={{ noArm: 'both' }} />
        {poleBehind ? null : poleArt}
        {near.map(arm)}
      </Group>
    );
  } else if (view === 'top') {
    // (the lower hand first)
    const order = [...B.arms].sort((p, q) => q.hand.arm.fist.y - p.hand.arm.fist.y);
    body = (
      <Group>
        <PersonTopV2 pose={rigTop(rig)} who={who} />
        {order.map(arm)}
        {poleArt}
      </Group>
    );
  } else {
    body = (
      <Group>
        <Group layer={<Paint />}>
          <PersonFrontV2 pose={FRONT_STANDING} who={who} opts={FRONT_OPTS} arms={false} />
          {/* (FrontBoom3) arms raised: the shirt's shoulder caps of a hanging arm off (the raised sleeve takes them) */}
          {B.arms.some((a) => a.hand.arm.fist.y < a.hand.arm.shoulder.y) ? <Path path={frontCapsOff(who)} color="black" blendMode="dstOut" /> : null}
        </Group>
        {/* (FrontBoom4) the armpits and the shoulders' tops: one soft line from the shirt into each raised sleeve —
            the shirt's cloth under the sleeves, showing only where neither covers the junction (FrontBoom5: painted
            over the sleeve it showed as a patch of another tone) */}
        <FrontPits pits={pits} who={who} />
        {B.arms.map(arm)}
        {poleArt}
      </Group>
    );
  }
  const dbg = debug
    ? (() => {
        const dot = (p: V3, r: number) => {
          const q = Skia.Path.Make();
          const c = proj(p);
          q.addCircle(c.u, c.v, r);
          return q;
        };
        return (
          <Group>
            <Path path={dot(rig.front, 30)} color="yellow" />
            <Path path={dot(rig.rear, 30)} color="orange" />
            {B.arms.map((a, i) => (
              <Group key={i}>
                <Path path={dot(a.hand.arm.fist, 16)} color={i ? 'blue' : 'red'} />
                <Path path={dot(a.hand.arm.shoulder, 16)} color={i ? 'cyan' : 'magenta'} />
                <Path path={dot(a.hand.arm.elbow, 12)} color="lime" />
              </Group>
            ))}
          </Group>
        );
      })()
    : null;
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={dim < 1 ? <Paint opacity={dim} /> : undefined}>
          <Fragment>{body}</Fragment>
        </Group>
        {dbg}
      </FigureLook>
    </FigureScale>
  );
}
