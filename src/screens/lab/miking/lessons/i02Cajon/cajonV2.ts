/**
 * I02 CAJÓN — the seated player in the new look (figure V2, wave 3 set 3b of
 * D78, 2026-11-24). Pure: no React, no Skia.
 *
 * The same seated player on the same joints as the current picture (cajonPose
 * on model.ts SEAT and each state's arms, the joints the keep-outs use): the
 * drummer of the cast, sitting astride the box. How a cajón is played: the
 * hands reach over the box's front edge and strike the front plate from in
 * front, palms and fingers flat on its face — the bass at the centre with the
 * whole hand, the slap at a top corner with the fingers — so each hand lies on
 * the plate's vertical face, fingers down, the palm toward the box.
 * Seen from the player's right (the side view), the right hand on the plate
 * shows its little-finger edge and the left (beyond the box) its thumb side:
 * the approved desk hand (authoredHands restFlat / restFlatThumb), turned to
 * lie on the plate. From above, the hands on the plate are the approved
 * hand-drum hand (smallperc Hand, the back of the hand, foreshortened), as the
 * current picture draws them — the drummer's skin is that hand's skin.
 */
import type { VariantId } from '../../engine/model/types.ts';
import type { PlayerPose } from '../shared/players/playerPose.ts';
import { castFor } from '../shared/figureV2/cast';
import { placeRest } from '../shared/figureV2/authoredHands.ts';
import { armPlan, sidePlan, type ArmPlan, type SidePlan } from '../shared/figureV2/sidePlan.ts';
import { personTopPlan } from '../shared/figureV2/topPerson.ts';
import { noseTip } from '../shared/figureV2/playersGrip.ts';
import { twoBone } from '../shared/figureV2/playersStick.ts';
import type { TopPlan } from '../shared/figureV2/topPlan.ts';
import { add, P, sub, type Pt } from '../shared/figureV2/geom.ts';
import { cajonPose } from './cajonPose.ts';
import { BH, stateOf } from './model.ts';

export const CAJON_PLAYER = castFor('player.cajon');

/**
 * THE ELBOWS (owner 2026-11-24 on /players3b: "the elbows and hands (many) are odd" — from above the arms bent
 * out into a V at winged elbows): each arm solved in 3-D from the model's shoulder to its wrist on the plate
 * (playersStick twoBone: upper arm 300 mm, forearm 290 mm), the elbow hanging below and a little outside the
 * shoulder-to-wrist line (a little back), so both views show the same arm and the shoulders, wrists and hands
 * stay where the lesson puts them. Drawing only: the model's own joints (the keep-outs) are unchanged.
 */
export const CAJON_ELBOW_OUT = 0.35;
export function cajonElbows(variant: VariantId) {
  const s = stateOf(variant);
  const el = (a: typeof s.R, out: 1 | -1) => twoBone(a.S, a.W, { x: -0.1, y: 1, z: CAJON_ELBOW_OUT * out }).elbow;
  return { R: el(s.R, 1), L: el(s.L, -1) };
}

const sideCache = new Map<string, SidePlan>();
/** The side plan: each hand flat on the plate's face, fingers down (its own wrist → fingers line from the pose). */
export function cajonSidePlan(variant: VariantId): SidePlan {
  const hit = sideCache.get(variant);
  if (hit) return hit;
  const pose0 = cajonPose('side', variant);
  const E = cajonElbows(variant);
  const pose: PlayerPose = { ...pose0, elbowR: P(E.R.x, E.R.y), elbowL: P(E.L.x, E.L.y) };
  // (the hands reach over the box's front edge and lie on the plate's face from in front of it: the palm
  // faces back toward the box, −u — `yToward` is the palm's side, as a desk hand's palm faces the desk;
  // the fingers along the pose's own hand direction, down)
  const onPlate = (h: PlayerPose['handR'], view: 'restFlat' | 'restFlatThumb') => placeRest(view, h.wrist, h.dir, P(-1, 0));
  const who = CAJON_PLAYER;
  const plan0 = sidePlan(pose, { head: who.head, body: who.body, placedR: onPlate(pose.handR, 'restFlat'), placedL: onPlate(pose.handL, 'restFlatThumb'), seatV: -BH, nod: 6 });
  // THE FOREARM STRAIGHT TO THE WRIST (the players' check 2026-11-24: the drummer's forearm line turns, in its last
  // stretches, into the drawn hand's own axis — right for a fist on a stick, the wrist nearly straight; on the
  // plate the wrist is bent ≈ 50° (the forearm forward and down, the hand straight down the plate), and that turn
  // folded the sleeve's end into a hook with a spiked cuff). The same armPlan, the hand left off its call (no
  // turn: the forearm straight from the elbow to the wrist, the cuff square to it), then the same placed hand
  // set back on the arm for the painter. The far arm keeps its root behind the torso (the plan's own back line).
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const back = B ? plan0.shirt.slice(plan0.shirt.length - 11) : plan0.shirt.slice(9);
  const straight = (a: ArmPlan, far: boolean): ArmPlan => ({ ...armPlan(a.shoulder, a.elbow, a.wrist, null, false, null, 0, far ? { shirt: plan0.shirt, back, facing: plan0.facing } : null, false, armB), placed: a.placed });
  const plan: SidePlan = { ...plan0, arms: { near: straight(plan0.arms.near, false), far: straight(plan0.arms.far, true) } };
  sideCache.set(variant, plan);
  return plan;
}

const topCache = new Map<string, TopPlan>();
/** From above: the seated cast member (legs, shoulders, head) with both forearms reaching to the plate; the
 *  hands themselves are the art's (on the plate's face). */
export function cajonTopPlan(variant: VariantId): TopPlan {
  const hit = topCache.get(variant);
  if (hit) return hit;
  const pose = cajonPose('top', variant);
  const who = CAJON_PLAYER;
  const base = personTopPlan(pose, who, { desk: true });
  // the pose's authored point → the top view (personTopPlan's own turn about the neck)
  const a = (pose.facing ?? 0) - Math.PI / 2;
  const W = (q: Pt): Pt => {
    const d = sub(q, pose.neck);
    return add(pose.neck, P(d.u * Math.cos(a) - d.v * Math.sin(a), d.u * Math.sin(a) + d.v * Math.cos(a)));
  };
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const arm = (s: Pt, e: Pt, w: Pt) => armPlan(W(s), W(e), W(w), null, false, null, 0, null, true, armB);
  // (the solved 3-D elbow → the pose's authored frame: (right, fwd) about the neck, as the wrists are placed)
  const E = cajonElbows(variant);
  const n = pose.neck;
  const au = (q: { x: number; z: number }) => P(n.u - q.z, n.v + q.x - n.u);
  // (review 2026-11-24: from above only the nose's tip shows past the brow — never a beak)
  const plan: TopPlan = noseTip({ ...base, arms: { near: arm(pose.shoulderR, au(E.R), pose.handR.wrist), far: arm(pose.shoulderL, au(E.L), pose.handL.wrist) } });
  topCache.set(variant, plan);
  return plan;
}
