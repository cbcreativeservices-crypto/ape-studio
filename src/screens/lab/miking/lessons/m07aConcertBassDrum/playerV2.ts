/**
 * M07a CONCERT BASS DRUM — the player in the new look (figure V2, wave 3 set
 * 3b of D78, 2026-11-24). Pure: no React, no Skia.
 *
 * The same standing player as the current picture (metalFigure's standing
 * body beyond the playing head, facing it, −x), the same mallet (geometry
 * MALLET: its head on the playing head, its grip end by the player). The
 * current picture drew the player MIRRORED (a scaleX −1 of a figure facing
 * +x), which lit the figure from the wrong side; here the player is a real
 * person turned to face −x: the side camera (+z) sees the player's LEFT side,
 * and the mallet — on the camera's side of the player — is in the LEFT hand,
 * closed round the handle a few centimetres from its end, the right hand
 * hanging at the side, on the far side.
 * The arm and the fist are the approved kit drummer's (owner 2026-11-24, "the
 * elbows and hands (many) are odd": reuse what passed; playersStick): the arm
 * solved from the shoulder (upper arm 300 mm, forearm 290 mm, the elbow
 * hanging below and a little outside the shoulder-to-hand line), the hand
 * closed on the handle by the drummer's solver, drawn with his arm and his
 * authored stick fist, its fulcrum ON the lesson's grip point.
 * Nothing moves the mallet, the drum or a measured point.
 */
import { BODY } from '../shared/players/playerPose.ts';
import { metalSidePose, metalTopPose } from '../shared/metal/metalFigure.ts';
import { castFor } from '../shared/figureV2/cast';
import { mirrorPoseU, shiftPose } from '../shared/figureV2/playersPlan.ts';
import { stickArm3, stickSidePlan, stickTopPlan } from '../shared/figureV2/playersStick.ts';
import { malletArmAt, malletSidePlan, malletStickArm, type MalletArmPose } from '../shared/figureV2/malletPlaced.ts';
import { MALLET } from './geometry.ts';
import { FLOOR_Y } from './model.ts';

export const BASS_DRUMMER = castFor('player.bassDrum');

/** The current picture's mirror (world u = MIRROR_C − the figure's own u), and where the player stands across (z). */
const MIRROR_C = 258;
const PLAYER_Z = -450;

/** The hand closes this far up the handle from its end. */
const GRIP_IN = 45;
const s0 = { x: MALLET.head.x - MALLET.grip.x, y: MALLET.head.y - MALLET.grip.y, z: MALLET.head.z - MALLET.grip.z };
const L0 = Math.hypot(s0.x, s0.y, s0.z);
export const BASS_FULCRUM = { x: MALLET.grip.x + (s0.x / L0) * GRIP_IN, y: MALLET.grip.y + (s0.y / L0) * GRIP_IN, z: MALLET.grip.z + (s0.z / L0) * GRIP_IN };

/** The standing body in the player's own frame (facing +x), then turned to face −x: the same place as
 *  the current picture (its neck at u = MIRROR_C + 362). */
const SIDE_LOCAL = metalSidePose([[MIRROR_C - MALLET.grip.x, MALLET.grip.y - FLOOR_Y]]);
const SIDE0 = mirrorPoseU(SIDE_LOCAL, MIRROR_C / 2, FLOOR_Y);
/** From above: the same body, its LEFT hand toward the camera's side (+z), turned half round to face −x
 *  about its neck (the metal family's neck is at (−362, 0); here at (MIRROR_C + 362, PLAYER_Z)). */
const TOP_LOCAL = metalTopPose([[MIRROR_C - MALLET.grip.x, PLAYER_Z - MALLET.grip.z]]).pose;
const TOP0 = shiftPose({ ...TOP_LOCAL, facing: Math.PI }, MIRROR_C + 2 * 362, PLAYER_Z);

/** The left shoulder (toward the camera) in 3-D. */
const SH_NEAR = { x: SIDE0.shoulderR.u, y: SIDE0.shoulderR.v, z: PLAYER_Z + BODY.shoulderHalf };

/**
 * (owner 2026-11-24, "Raise the hands") Her left hand is the APPROVED MALLET HAND, mirrored and re-lit
 * (malletHandBack.tsx: the back of the hand to the camera, the thumb on top, a straight wrist): the arm re-posed so
 * the forearm runs along the drawing's own line, the elbow at her side (malletPlaced.ts). Null only if no arm reaches.
 */
export const BASS_NEAR_POSE: MalletArmPose | null = malletArmAt(BASS_FULCRUM, MALLET.head, SH_NEAR, true);
/** The left arm on the mallet (her left is +z; she faces −x). */
export const BASS_ARM = BASS_NEAR_POSE
  ? malletStickArm('L', BASS_NEAR_POSE, SH_NEAR, { x: 0, y: 0, z: 1 })
  : stickArm3({ hand: 'L', fulcrum: BASS_FULCRUM, bead: MALLET.head, shoulder: SH_NEAR, out: { x: 0, y: 0, z: 1 }, fwd: { x: -1, y: 0, z: 0 } });

/** (the side pose's R arm is the one toward the camera — her left: `near`; from above her left arm is the
 *  pose's L — `far` in the plan's naming) */
export const bassSidePlan = () => (BASS_NEAR_POSE ? malletSidePlan(SIDE0, BASS_DRUMMER, { near: BASS_ARM, nearPose: BASS_NEAR_POSE, nod: 8 }) : stickSidePlan(SIDE0, BASS_DRUMMER, { near: BASS_ARM, nod: 8 }));
export const bassTopPlan = () => stickTopPlan(TOP0, BASS_DRUMMER, null, BASS_ARM);
