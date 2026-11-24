/**
 * M12 TONBAK — the player in the new look (figure V2, wave 3 set 3d of D78,
 * 2026-11-24). Pure: no React, no Skia.
 *
 * The same seated player on the same chair as the current picture
 * (tonbakPose: the body's joints; the lesson draws the chair, its seat top at
 * y = −560), Kofi of the cast. How the tonbak (zarb) is played: the goblet drum
 * lies across the lap, its body along the left thigh and held under the left
 * forearm, the head facing the player's right; both hands play the one head
 * with the fingers — the right hand's fingers on the head's face (struck near
 * the rim for the bright "bak", nearer the middle for the deep "tom", snapped
 * for the "peleng"), the left hand over the top of the drum, its fingertips
 * curling onto the head's upper edge.
 *
 * Seen from the player's right (the side view) the head faces the camera:
 *   right hand  palm on the head, so its BACK faces the camera — the approved
 *               back-of-hand (authoredHands 'restTop'), fingers forward across
 *               the head's near half, thumb up;
 *   left hand   palm down on the top of the drum, fingers forward to the head's
 *               upper rim — the approved desk hand seen from its thumb side
 *               ('restFlatThumb').
 * From above:
 *   right hand  standing on edge against the head's face — its thumb side up
 *               ('restFlatThumb', the palm toward the head);
 *   left hand   the back of the hand ('restTop') on the drum's top.
 * Nothing moves the drum or any measured point.
 */
import type { PlayerPose } from '../shared/players/playerPose.ts';
import { castFor } from '../shared/figureV2/cast';
import { placeRest, type PlacedHand } from '../shared/figureV2/authoredHands.ts';
import { armPlan, sidePlan, type SidePlan } from '../shared/figureV2/sidePlan.ts';
import { personTopPlan } from '../shared/figureV2/topPerson.ts';
import type { TopPlan } from '../shared/figureV2/topPlan.ts';
import { add, P, sub, type Pt } from '../shared/figureV2/geom.ts';
import { tonbakPose } from './art';
import { T_H0 } from './geometry.ts';
import { T_R } from './model.ts';

export const TONBAK_PLAYER = castFor('player.tonbak');

/** The chair's seat top (art: the seat's rounded rect from y −560). */
export const SEAT_TOP = -560;

/** The head's top edge in the side view (its face-on ellipse: x ±T_R, y ±T_R·cos tilt round T_H0). */
const HEAD_TOP = T_H0.y - T_R * 0.954;

/** Side view: the right hand's wrist just off the head's near rim, the fingers across the head toward its middle. */
export const R_WRIST_SIDE = P(-T_R - 30, T_H0.y - 30);
/** Side view: the left hand on the top of the drum, its wrist behind the head, fingertips at the head's upper rim
 *  (its palm ≈ 28 mm under the wrist line lies on the drum's top — just under the head's top edge, where the
 *  bowl's top runs back from the rim). */
export const L_WRIST_SIDE = P(-T_R - 60, HEAD_TOP + 14 - 27.8);

/** Side view: where the far (left) elbow is drawn (see tonbakSidePlan). */
export const FAR_ELBOW_SIDE = P(-232, -812);

let sideHit: SidePlan | null = null;
export function tonbakSidePlan(): SidePlan {
  if (sideHit) return sideHit;
  const pose0 = tonbakPose('side');
  // (two legs: the far knee and foot drawn a little behind the near ones — 5 and 9 cm — so the far shin shows
  // beside the near one; a drawing offset only, the lesson's joints and keep-outs are the pose's own)
  // (KeysGuitar3, review 2026-11-24: "the far arm a floating cuff and forearm, no upper arm" — its elbow lay
  // exactly behind the near elbow, so the near arm hid the whole upper arm) the left forearm lies over the drum's
  // top, running from the far side toward the head (toward the camera, so it shows short); its elbow is drawn up
  // and forward of the chest, above the near upper arm, so the far upper arm comes out at the torso's front edge
  // and the arm reads whole. Drawing only, as the far knee: the lesson's joints and keep-outs are the pose's own.
  const pose: PlayerPose = { ...pose0, elbowL: FAR_ELBOW_SIDE, kneeL: P(pose0.kneeL.u - 50, pose0.kneeL.v - 4), footL: P(pose0.footL.u - 90, pose0.footL.v) };
  const who = TONBAK_PLAYER;
  // (the right hand: fingers forward and a little down across the head, the thumb up)
  const R = placeRest('restTop', R_WRIST_SIDE, 0.12, P(0, -1));
  // (the left hand: level on the drum's top, the palm down)
  const L = placeRest('restFlatThumb', L_WRIST_SIDE, 0, P(0, 1));
  // (farBehind false: the far sleeve is not cut to the back's outline — that cut left a pointed spike — it is
  // painted whole before the body, which covers its root)
  sideHit = sidePlan(pose, { head: who.head, body: who.body, placedR: R, placedL: L, seatV: SEAT_TOP, nod: 10, farBehind: false });
  return sideHit;
}

let topHit: TopPlan | null = null;
/** From above: the seated cast member (legs, shoulders, head), both forearms reaching to the drum. */
export function tonbakTopPlan(): TopPlan {
  if (topHit) return topHit;
  const pose = tonbakPose('top');
  const who = TONBAK_PLAYER;
  const base = personTopPlan(pose, who, { desk: true });
  const a = (pose.facing ?? 0) - Math.PI / 2;
  const W = (q: Pt): Pt => {
    const d = sub(q, pose.neck);
    return add(pose.neck, P(d.u * Math.cos(a) - d.v * Math.sin(a), d.u * Math.sin(a) + d.v * Math.cos(a)));
  };
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  // the right hand on edge against the head's face (z = 0), on the camera's side of it, the palm toward it
  const R: PlacedHand = placeRest('restFlatThumb', P(R_WRIST_SIDE.u, 22), 0, P(0, -1));
  // the left hand's back on the drum's top, behind the head, fingers forward, the thumb toward +z
  const L: PlacedHand = placeRest('restTop', P(L_WRIST_SIDE.u, -70), 0, P(0, 1));
  const arm = (s: Pt, e: Pt, pl: PlacedHand) => armPlan(W(s), W(e), pl.wrist, null, false, pl, 0, null, true, armB);
  topHit = { ...base, arms: { near: arm(pose.shoulderR, pose.elbowR, R), far: arm(pose.shoulderL, pose.elbowL, L) } };
  return topHit;
}

/** (the pose, for the label tests) */
export const tonbakPoses = (): { side: PlayerPose; top: PlayerPose } => ({ side: tonbakPose('side'), top: tonbakPose('top') });
