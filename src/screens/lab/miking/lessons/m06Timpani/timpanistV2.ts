/**
 * M06 TIMPANI — the timpanist in the new look (figure V2, wave 3 set 3b of
 * D78, 2026-11-24). Pure: no React, no Skia.
 *
 * The same standing player as the current picture (metalFigure's standing
 * body, moved by PLAYER_SHIFT / PLAYER_Z), the same two mallets (malletPose:
 * the left at the stroke on the 29 in head, the right raised), held as the
 * approved kit drummer holds his sticks (owner 2026-11-24, "the elbows and
 * hands (many) are odd": reuse what passed): each arm solved in 3-D from its
 * shoulder (playersStick: upper arm 300 mm, forearm 290 mm, the elbow hanging
 * below and a little outside the shoulder-to-hand line), the hand closed on
 * the shaft by the drummer's solver (the American grip, between palm-down and
 * thumb-up — the grip most timpanists use, the mallet carrying on the
 * forearm's line), drawn with the drummer's arm and his authored stick fist,
 * its fulcrum ON the lesson's hand point. Nothing moves a mallet, a drum or a
 * measured point.
 */
import { BODY } from '../shared/players/playerPose.ts';
import { metalSidePose, metalTopPose } from '../shared/metal/metalFigure.ts';
import { castFor } from '../shared/figureV2/cast';
import { shiftPose } from '../shared/figureV2/playersPlan.ts';
import { stickArm3, stickSidePlan, stickTopPlan, type StickArm3 } from '../shared/figureV2/playersStick.ts';
import { malletArmAt, malletSidePlan, malletStickArm, palmFistArm, type MalletArmPose } from '../shared/figureV2/malletPlaced.ts';
import { PLAYER_SHIFT, PLAYER_Z, TIMP_MALLETS } from './malletPose.ts';

export const TIMPANIST = castFor('player.timpani');

/** The standing player in the lesson's own frame (side: u = x, v = y; top: u = x, v = z). */
const SIDE0 = shiftPose(metalSidePose([[TIMP_MALLETS[0].hand.x - PLAYER_SHIFT, TIMP_MALLETS[0].hand.y], [TIMP_MALLETS[1].hand.x - PLAYER_SHIFT, TIMP_MALLETS[1].hand.y]]), PLAYER_SHIFT, 0);
const TOP0 = shiftPose(metalTopPose([[TIMP_MALLETS[0].hand.x - PLAYER_SHIFT, TIMP_MALLETS[0].hand.z - PLAYER_Z], [TIMP_MALLETS[1].hand.x - PLAYER_SHIFT, TIMP_MALLETS[1].hand.z - PLAYER_Z]]).pose, PLAYER_SHIFT, PLAYER_Z);

/** The shoulders in 3-D: the side pose's height and depth, the shoulders' half-width across. */
const SH_R = { x: SIDE0.shoulderR.u, y: SIDE0.shoulderR.v, z: PLAYER_Z + BODY.shoulderHalf };
const SH_L = { x: SIDE0.shoulderL.u, y: SIDE0.shoulderL.v, z: PLAYER_Z - BODY.shoulderHalf };

const FWD = { x: 1, y: 0, z: 0 };
/**
 * (owner 2026-11-24, "Raise the hands") The RIGHT (near) hand is the APPROVED MALLET HAND (malletHandBack.tsx: the
 * back of the hand to the camera, the thumb on top, a straight wrist): its arm re-posed so the forearm runs along
 * the drawing's own line — level, the elbow at the side (malletPlaced.ts). Null only if no arm reaches it.
 */
export const TIMP_NEAR_POSE: MalletArmPose | null = malletArmAt(TIMP_MALLETS[1].hand, TIMP_MALLETS[1].ball, SH_R, false);
/** R: the right (near) hand, its mallet raised (the forearm lifted, level); L: the left (far) hand at the stroke —
 *  its PALM side to this camera: the drummer's palm-side fist, until a palm-side mallet hand is approved. */
export const TIMP_STICKS: { R: StickArm3; L: StickArm3 } = {
  R: TIMP_NEAR_POSE
    ? malletStickArm('R', TIMP_NEAR_POSE, SH_R, { x: 0, y: 0, z: 1 })
    : stickArm3({ hand: 'R', fulcrum: TIMP_MALLETS[1].hand, bead: TIMP_MALLETS[1].ball, shoulder: SH_R, out: { x: 0, y: 0, z: 1 }, fwd: FWD, level: 0.6 }),
  // (owner 2026-11-24, the left arm "look like a broken arm": the side plan bent the forearm into a banana toward a
  // fist pointing far off the elbow's line) the drummer's palm-side fist, its elbow chosen so the forearm runs
  // STRAIGHT into it (malletPlaced.palmFistArm); with the near hand at elbow height the fists no longer overlap
  L: palmFistArm({ grip: TIMP_MALLETS[0].hand, head: TIMP_MALLETS[0].ball, shoulder: SH_L, out: { x: 0, y: 0, z: -1 }, fwd: FWD }).arm,
};
/** (kept for callers that read the arms by their earlier name) */
export const TIMP_ARMS = TIMP_STICKS;

export const timpanistSidePlan = () =>
  TIMP_NEAR_POSE ? malletSidePlan(SIDE0, TIMPANIST, { near: TIMP_STICKS.R, nearPose: TIMP_NEAR_POSE, far: TIMP_STICKS.L, nod: 10 }) : stickSidePlan(SIDE0, TIMPANIST, { near: TIMP_STICKS.R, far: TIMP_STICKS.L, nod: 10 });
export const timpanistTopPlan = () => stickTopPlan(TOP0, TIMPANIST, TIMP_STICKS.R, TIMP_STICKS.L);
