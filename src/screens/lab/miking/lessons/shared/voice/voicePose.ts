/**
 * THE STANDING SINGER in frame V (voiceSpec.ts) — the shared player figure's
 * skeleton (players/playerPose.ts) for the side view (in profile, facing +x)
 * and the plan (from above, facing +x), and the collision solids that stand
 * for the same body. Pure (no React): the tests reach it.
 *
 * Every joint is a DRAWING DEFAULT (no source gives a singer's geometry;
 * lead_vocal/GEOMETRY_PROPOSAL.md §2) placed round the head of voiceSpec —
 * whose mouth IS the lip point — with the shared figure's adult proportions
 * (BODY), the lips 1550 mm above the floor, arms relaxed at the sides.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { pt } from '../players/playerPose.ts';
import type { Shape3, Vec3 } from '../../../engine/model/types.ts';
import { HEAD_C, HEAD_R, VOICE_DIMS } from './voiceSpec.ts';

/** The floor, below the lip point (frame V, y down). */
export const FLOOR_Y = VOICE_DIMS.lipStanding.mm;

/** The TORSO DATUM under the back of the skull: every joint below the neck
 *  (shoulders, elbows, hands, hips, knees) and every body-worn mark (the lav
 *  places, the pack) is measured from it, so none of them moves. */
const NECK: Vec3 = { x: HEAD_C.x - 18, y: HEAD_C.y + 172, z: 0 };
/** How far the drawn COLLAR sits above the torso datum (figure pass 2, owner
 *  2026-10-15: "neck slightly long"). At the datum the profile showed ≈ 85 mm
 *  of neck from the jaw to the shirt and ≈ 136 mm at the nape; an adult in a
 *  shirt shows ≈ 55–60 mm under the jaw. Only the collar (the top of the
 *  shirt, where the neck goes into it) rises — the shoulders, the arms and
 *  the body below stay — so the trapezius rises to the neck as on a real body. */
export const COLLAR_LIFT = 24;
/** The collar: the base of the neck as drawn (the poses' `neck` joint). */
const COLLAR: Vec3 = { x: NECK.x, y: NECK.y - COLLAR_LIFT, z: 0 };

/** In profile, facing +x (the side view: u = x, v = y). The near side is the
 *  singer's RIGHT (+z toward the viewer). */
export const SINGER_SIDE: PlayerPose = {
  view: 'side',
  posture: 'standing',
  facing: 1,
  head: { c: pt(HEAD_C.x, HEAD_C.y), r: HEAD_R },
  neck: pt(COLLAR.x, COLLAR.y),
  shoulderR: pt(NECK.x - 4, NECK.y + 58),
  shoulderL: pt(NECK.x - 18, NECK.y + 48),
  // The arms hang at the sides: the hands beside the thighs, never ahead of
  // them (figure review 2026-10-08 — a hand at the trousers' front edge read
  // as at the groin in profile).
  elbowR: pt(NECK.x - 6, NECK.y + 352),
  elbowL: pt(NECK.x - 16, NECK.y + 342),
  handR: { wrist: pt(NECK.x + 6, NECK.y + 612), dir: Math.PI / 2 - 0.08, kind: 'rest' },
  handL: { wrist: pt(NECK.x - 8, NECK.y + 602), dir: Math.PI / 2 - 0.08, kind: 'rest' },
  hipR: pt(NECK.x - 14, NECK.y + 530),
  hipL: pt(NECK.x - 24, NECK.y + 524),
  kneeR: pt(NECK.x + 4, NECK.y + 980),
  kneeL: pt(NECK.x - 10, NECK.y + 974),
  footR: pt(NECK.x + 22, FLOOR_Y),
  footL: pt(NECK.x + 4, FLOOR_Y),
  floor: FLOOR_Y,
};

/** From above (the plan: u = x, v = z), the chest facing +x. Authored chest
 *  toward +v round the neck and turned by `facing` 0 (PlayerFigure.
 *  aboveTurn): local (right, fwd) lands at world (fwd, right) from the neck —
 *  so the singer's right is +z, as in frame V. */
const N_TOP = pt(NECK.x, 0);
const L = (right: number, fwd: number) => pt(N_TOP.u - right, N_TOP.v + fwd);
export const SINGER_TOP: PlayerPose = {
  view: 'above',
  posture: 'standing',
  facing: 0,
  head: { c: L(0, HEAD_C.x - NECK.x), r: HEAD_R },
  neck: N_TOP,
  // The arms hang straight down: from above, only the tops of the upper arms
  // show beside the shoulders (the hands are under them: VoiceFigure draws
  // the plan without hands).
  shoulderR: L(176, -6),
  shoulderL: L(-176, -6),
  elbowR: L(196, -8),
  elbowL: L(-196, -8),
  handR: { wrist: L(198, -6), dir: Math.PI / 2, kind: 'rest' },
  handL: { wrist: L(-198, -6), dir: Math.PI / 2, kind: 'rest' },
  hipR: L(106, -6),
  hipL: L(-106, -6),
  kneeR: L(110, 6),
  kneeL: L(-110, 6),
  footR: L(104, 70),
  footL: L(-104, 70),
  floor: null,
};

/**
 * The body as collision solids (frame V), the same masses the figure draws:
 *   head    the skull and face (one sphere: its front passes within ~12 mm of
 *           the lips and ~5 mm of the nose tip, its back and crown follow the
 *           profile's) — the head is the source here, so a mic or a screen
 *           that would touch it is stopped;
 *   neck    the neck column, chin to collar;
 *   torso   the chest, the back and the hanging arms (a box);
 *   legs    hips to floor, the shoes' toes included.
 */
export const SINGER_SOLIDS: Record<'head' | 'neck' | 'torso' | 'legs', Shape3> = {
  head: { kind: 'capsule', a: HEAD_C, b: HEAD_C, r: HEAD_R },
  // The neck ends at the drawn collar and the torso's box starts there (both
  // re-derived from the raised collar, figure pass 2: the neck 24 mm shorter,
  // the box's top 24 mm higher; its front, back, sides and bottom unchanged).
  neck: { kind: 'capsule', a: { x: HEAD_C.x + 30, y: HEAD_C.y + 90, z: 0 }, b: { x: COLLAR.x, y: COLLAR.y, z: 0 }, r: 54 },
  torso: { kind: 'box', min: { x: NECK.x - 150, y: COLLAR.y - 10, z: -215 }, max: { x: NECK.x + 112, y: NECK.y + 620, z: 215 } },
  legs: { kind: 'box', min: { x: NECK.x - 130, y: NECK.y + 560, z: -170 }, max: { x: NECK.x + 190, y: FLOOR_Y, z: 170 } },
};

/** The torso datum (the collar before figure pass 2) — the body-worn marks,
 *  the standing talker's joints and the measuring operator are built on it. */
export const SINGER_NECK = NECK;
/** The drawn collar (the poses' neck joint). */
export const SINGER_COLLAR = COLLAR;
