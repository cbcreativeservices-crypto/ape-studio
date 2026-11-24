/**
 * M13 TABLA — the player in the new look (figure V2, wave 3 set 3d of D78,
 * 2026-11-24). Pure: no React, no Skia.
 *
 * Ana of the cast, sitting cross-legged on the floor, barefoot (floorSeat.ts:
 * sukhasana — each foot under the opposite knee), on the same joints as the
 * current picture (tablaPose: hips, knees, shoulders, elbows and wrists), the
 * same drums where the lesson puts them. The hands lie on the heads as the
 * lesson's seating lets them reach: the right hand palm down on the dayan,
 * its fingers over the near rim (the kinar, where the index finger strikes
 * Na and Tin) onto the head toward the black patch (the syahi, whose border
 * the ring finger touches); the left hand palm down on the bayan, its fingers
 * on the maidan by the off-centre patch (Ge, Ghe), the heel of the hand on the
 * head's near edge to press the pitch up. Each hand along its head's tilt.
 * Seen from the player's right: the right hand's little-finger edge
 * (authoredHands 'restFlat'), the left hand's thumb side ('restFlatThumb');
 * from above, the backs of both hands ('restTop'), thumbs toward the midline.
 */
import type { PlayerPose } from '../shared/players/playerPose.ts';
import { castFor } from '../shared/figureV2/cast';
import { placeRest, type PlacedHand } from '../shared/figureV2/authoredHands.ts';
import { armPlan, sidePlan } from '../shared/figureV2/sidePlan.ts';
import { personTopPlan } from '../shared/figureV2/topPerson.ts';
import type { TopPlan } from '../shared/figureV2/topPlan.ts';
import { add, P, sub, type Pt } from '../shared/figureV2/geom.ts';
import { floorSidePlan, floorTopLegs, type FloorSide, type FloorTop } from '../shared/figureV2/floorSeat.ts';
import { tablaPose } from './art';
import { BAYAN, DAYAN } from './geometry.ts';

export const TABLA_PLAYER = castFor('player.tabla');

/** The palm's side of each hand: into its head (the head's inward normal, from its tilt). */
const palmInto = (d: typeof DAYAN) => {
  const n = Math.hypot(d.u.x, d.u.y);
  return P(-d.u.x / n, -d.u.y / n);
};

let sideHit: FloorSide | null = null;
export function tablaSide(): FloorSide {
  if (sideHit) return sideHit;
  const pose = tablaPose('side');
  const who = TABLA_PLAYER;
  const R: PlacedHand = placeRest('restFlat', pose.handR.wrist, Math.atan2(DAYAN.ex.y, DAYAN.ex.x), palmInto(DAYAN));
  const L: PlacedHand = placeRest('restFlatThumb', pose.handL.wrist, Math.atan2(BAYAN.ex.y, BAYAN.ex.x), palmInto(BAYAN));
  const base = sidePlan(pose, { head: who.head, body: who.body, placedR: R, placedL: L, seatV: 0, nod: 10 });
  sideHit = floorSidePlan(base, pose, who.body, 0);
  return sideHit;
}

/** The hips and knees from above, in the view's own millimetres (u = x, v = z): the side pose's knees out wide. */
function topJoints(side: PlayerPose, top: PlayerPose): { hips: [Pt, Pt]; knees: [Pt, Pt] } {
  const hipX = (side.hipR.u + side.hipL.u) / 2;
  void top;
  // (knees ≈ 55 cm apart, as a person sitting cross-legged; forward of the hips by the side view's own knees)
  return { hips: [P(hipX, 106), P(hipX, -106)], knees: [P(side.kneeR.u, 275), P(side.kneeL.u, -275)] };
}

let topHit: FloorTop | null = null;
export function tablaTop(): FloorTop {
  if (topHit) return topHit;
  const pose = tablaPose('top');
  const side = tablaPose('side');
  const who = TABLA_PLAYER;
  const base = personTopPlan(pose, who, { desk: true });
  const a = (pose.facing ?? 0) - Math.PI / 2;
  const W = (q: Pt): Pt => {
    const d = sub(q, pose.neck);
    return add(pose.neck, P(d.u * Math.cos(a) - d.v * Math.sin(a), d.u * Math.sin(a) + d.v * Math.cos(a)));
  };
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  // the backs of the hands from above, at the side view's wrists, over each drum, thumbs toward the midline
  const R: PlacedHand = placeRest('restTop', P(side.handR.wrist.u, DAYAN.H.z + 6), 0, P(0, -1));
  const L: PlacedHand = placeRest('restTop', P(side.handL.wrist.u, BAYAN.H.z - 6), 0, P(0, 1));
  const arm = (s: Pt, e: Pt, pl: PlacedHand) => armPlan(W(s), W(e), pl.wrist, null, false, pl, 0, null, true, armB);
  const plan: TopPlan = { ...base, arms: { near: arm(pose.shoulderR, pose.elbowR, R), far: arm(pose.shoulderL, pose.elbowL, L) } };
  const j = topJoints(side, pose);
  topHit = floorTopLegs(plan, j.hips, j.knees, B);
  return topHit;
}
