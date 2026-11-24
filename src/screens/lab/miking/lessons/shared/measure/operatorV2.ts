/**
 * THE MEASUREMENT OPERATOR in the new look (figure V2, wave 3 set 3b of D78,
 * 2026-11-24). Pure: no React, no Skia.
 *
 *   • standing, hands at rest (operatorSide / operatorTop: the singer's
 *     standing body): the cast member with the approved resting hand at the
 *     side, the back of the hand toward the viewer — as E01's singer;
 *   • READING THE LOG SHEET (operatorSideReading / operatorTopReading): how a
 *     clipboard is really held to be read standing — both hands at its lower
 *     corners, each closed round the board's side edge (the thumb on the
 *     sheet's face, the fingers curled under the board), the upper arms
 *     hanging close to the body, the forearms rising gently to the board, the
 *     board tilted back toward the eyes. Each hand is the approved stick grip
 *     (grip.ts, the drummer's hand) closed round that edge — the board's 14 mm
 *     edge is the stick's 14 mm; the board's own drawing (MeasureArt Sheet)
 *     passes through the near fist. The arms are solved in 3-D from the
 *     shoulders, so the side view and the view from above show the same arms.
 * Nothing here moves the board, a keep-out or any measured point: the board
 * is where sheetOf puts it, the body where the pose puts it.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import type { V3 } from '../players/handModel.ts';
import { castFor } from '../figureV2/cast';
import { sidePlan, type SidePlan } from '../figureV2/sidePlan.ts';
import { heldArm3, type Arm3 } from '../figureV2/playersPlan.ts';
import { gripArm3, headOverNeck, playerGripSidePlan, playerGripTopPlan, type GripArm3, type GripSide, type GripTop } from '../figureV2/playersGrip.ts';
import { personTopPlan } from '../figureV2/topPerson.ts';
import type { TopPlan } from '../figureV2/topPlan.ts';
import { add, mul, P, sub, unit, type Pt } from '../figureV2/geom.ts';
import { CLIPBOARD, sheetOf } from './measureModel.ts';

/** The person running a measurement (one per lesson). */
export const MEASURE_OP = castFor('operator.measure');

const restCache = new WeakMap<PlayerPose, SidePlan>();
/** A standing operator, hands at rest at the sides (the singer's approved plan). */
export function operatorRestPlan(pose: PlayerPose): SidePlan {
  let p = restCache.get(pose);
  if (!p) {
    p = sidePlan(pose, { head: MEASURE_OP.head, body: MEASURE_OP.body, restR: 'restSide', restL: 'restSide' });
    restCache.set(pose, p);
  }
  return p;
}

const standCache = new WeakMap<PlayerPose, TopPlan>();
/** (review 2026-11-24) A standing operator from above: the head over the neck (only the nose's tip past the
 *  brow), the hanging arms' sleeve heads at the shoulders (PlayerTopV2 `bareArms`). */
export function standingTop(pose: PlayerPose): TopPlan {
  let p = standCache.get(pose);
  if (!p) {
    p = headOverNeck(personTopPlan(pose, MEASURE_OP, {}));
    standCache.set(pose, p);
  }
  return p;
}

/** The hand closes this far up the board's side edge from its lower corner (mm). (Second review 2026-11-24, F14
 *  placement: "the boom arm, clamp and counterweight drawn across Ana's hands": the hands hold the side edges a
 *  little higher — 40 → 110 — so the fists sit clear above a measuring boom at the board's lower edge; the board,
 *  the body and every keep-out stay where they were.) */
export const GRIP_UP = 110;
/** The forearm runs this much nearer the level than the board's edge (playersPlan heldArm3 `level`). */
const FORE_LEVEL = 0.75;

/** personTopPlan's own turn of an 'above' pose's authored points into the top view. */
function topOf(pose: PlayerPose) {
  const a = (pose.facing ?? 0) - Math.PI / 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (q: Pt): Pt => {
    const d = sub(q, pose.neck);
    return add(pose.neck, P(d.u * c - d.v * s, d.u * s + d.v * c));
  };
}

export type ReadingArms = {
  near: Arm3;
  far: Arm3;
  /** (review 2026-11-24) the arms the drawing uses: each hand ONE skin closed round its side edge of the board
   *  (playersGrip → the approved held-mic hand): the palm against the edge, the fingers round onto the board's
   *  back, the thumb on the sheet's face, the board passing through the fist */
  gripNear: GripArm3;
  gripFar: GripArm3;
  /** the board's lower edge centre and its rise (unit, side view) */
  low: Pt;
  up: Pt;
  z: number;
};

const armsCache = new WeakMap<PlayerPose, ReadingArms>();
/**
 * Both arms on the clipboard, for a reading operator's side pose `side` and
 * the same operator's top pose `top` (the board where sheetOf draws it; `z`
 * the operator's place across, the collar's z).
 */
export function readingArms(side: PlayerPose, top: PlayerPose): ReadingArms {
  const hit = armsCache.get(side);
  if (hit) return hit;
  const sh = sheetOf(side);
  if (sh.kind !== 'side') throw new Error('readingArms: a side pose');
  const facing: 1 | -1 = (side.facing ?? 1) >= 0 ? 1 : -1;
  const up = unit(sub(sh.high, sh.low));
  const W = topOf(top);
  const z = top.neck.v;
  // each side edge of the board (the stick's axis inside the fist: the edge's own middle)
  const edge = CLIPBOARD.w / 2 - CLIPBOARD.thick / 2;
  const g = add(sh.low, mul(up, GRIP_UP));
  const held = (s: 1 | -1, hand: 'R' | 'L') => {
    const fulcrum: V3 = { x: g.u, y: g.v, z: z + s * edge };
    return { hand, fulcrum, bead: { x: fulcrum.x + up.u * 200, y: fulcrum.y + up.v * 200, z: fulcrum.z } };
  };
  // the shoulders: from above (x, z), their height from the side
  const sR = W(top.shoulderR);
  const sL = W(top.shoulderL);
  const nearTop = sR.v >= sL.v ? sR : sL;
  const farTop = sR.v >= sL.v ? sL : sR;
  const shoulder = (q: Pt, y: number): V3 => ({ x: q.u, y, z: q.v });
  // the side camera (+z) sees the person's right when they face +x, their left when they face −x
  const nearHand: 'R' | 'L' = facing > 0 ? 'R' : 'L';
  const farHand: 'R' | 'L' = facing > 0 ? 'L' : 'R';
  const near = heldArm3(held(1, nearHand), shoulder(nearTop, side.shoulderR.v), 1, { facing, level: FORE_LEVEL, out: 40, back: 40 });
  const far = heldArm3(held(-1, farHand), shoulder(farTop, side.shoulderL.v), -1, { facing, level: FORE_LEVEL, out: 40, back: 40 });
  // the closed grips: the board's side edge is the rod (its thumb's side up the edge), the back of the hand
  // turned out to its own side of the board; the person faces ±x, their right toward +z when facing +x
  const person = { fwd: { x: facing, y: 0, z: 0 }, right: { x: 0, y: 0, z: facing }, centre: { x: 0, y: 0, z } };
  const grip = (s: 1 | -1, hand: 'R' | 'L', y: number, q: Pt) => {
    const h = held(s, hand);
    return gripArm3({ hand, fist: h.fulcrum, toward: h.bead, shoulder: shoulder(q, y), back: { x: 0, y: -0.45, z: s }, R: CLIPBOARD.thick / 2, tilt: 10, ulnar: 10, ...person });
  };
  const gripNear = grip(1, nearHand, side.shoulderR.v, nearTop);
  const gripFar = grip(-1, farHand, side.shoulderL.v, farTop);
  const out = { near, far, gripNear, gripFar, low: sh.low, up, z };
  armsCache.set(side, out);
  return out;
}

/** The reading operator from the side (the pose's R is the near arm, as sidePlan names it), with the closed
 *  grips (PlayerSideV2 `grips`). */
export function readingSide(side: PlayerPose, top: PlayerPose): GripSide {
  const a = readingArms(side, top);
  return playerGripSidePlan(side, MEASURE_OP, { near: a.gripNear, far: a.gripFar, nod: 14 });
}
export const readingSidePlan = (side: PlayerPose, top: PlayerPose): SidePlan => readingSide(side, top).plan;

/** The reading operator from above (the plan's near/far are the pose's R/L: the person's right and left). */
export function readingTop(side: PlayerPose, top: PlayerPose): GripTop {
  const a = readingArms(side, top);
  const R = a.gripNear.hand === 'R' ? a.gripNear : a.gripFar;
  const L = a.gripNear.hand === 'R' ? a.gripFar : a.gripNear;
  return playerGripTopPlan(top, MEASURE_OP, R, L);
}
export const readingTopPlan = (side: PlayerPose, top: PlayerPose): TopPlan => readingTop(side, top).plan;
