/**
 * THE BOOM — Lab 7 (broadcast). Built once by group 2 (B04 boom and camera,
 * B02 news anchors); group 3 and the later sports lessons reuse it. Pure: no
 * React (test/mikingLab7BodyCamera.test.ts).
 *
 * Research: docs/labs/miking/boom_camera/GEOMETRY_PROPOSAL.md §2 ("pole length
 * and operator height: UNKNOWN → drawing defaults; the operator's reach is a
 * keep-out"), SOURCES.md (R-BOOM "boom from above, or below if absolutely
 * necessary"; S-SHOTGUN "slightly above, below, or to the side"). Internal
 * record only.
 *
 * TWO WAYS TO HOLD A BOOM MIC (both reuse what Lab 6 built):
 *   • a HAND-HELD POLE: the mic types on a pole are the location kit's
 *     (shared/field/fieldMics.ts: locBoomSg, locBoomHyper, locBoomFur — an
 *     engine 'clip' mount whose grip is the operator's front hand, its reach
 *     the pole's 2.5 m). The operator stands outside the frame at a fixed,
 *     rehearsed place (`operatorAt`); the scene draws them with the location
 *     kit's BoomOperator (LocationArt.operatorPoses).
 *   • a FIXED BOOM STAND for a predictable seated talker: the short shotgun on
 *     a stand (fieldmics SHOTGUN_SHORT, 'stand' mount) or the compact
 *     hypercardioid (broadcastMics.compactHyper) whose boom arm runs LEVEL
 *     from the mic's tail along one fixed direction (`standBoomRule`: the
 *     model's mountRule, `fixed`), then the stand drops to the floor — out of
 *     the shot to the talker's side. "Rigged and secured by qualified crew
 *     before anyone sits beneath it" is said in words; no rigging is drawn.
 *
 * WHAT IS HERE
 *   POLE_REACH, STAND_BOOM          the drawing defaults;
 *   operatorAt(grip, floorY)        where the operator's feet go under a grip;
 *   operatorColumn(...)             the operator as a column (for the frame
 *                                   test: an operator in the shot is a fail);
 *   poleClearance(cam, grip, tail)  the least frame clearance along the pole
 *                                   (cameraFrame.segmentClearance);
 *   standBoomRule(dir)              the fixed stand boom's mountRule;
 *   boomSwing(p, a, b)              the angle the boom turns through to aim
 *                                   from one mouth to another (two talkers);
 *   SAFETY                          the plain-words rules.
 */
import type { MountRule, Vec3 } from '../../../engine/model/types.ts';
import { dd } from '../voice/voiceSpec.ts';
import { segmentClearance, type BroadcastCamera } from './cameraFrame.ts';

const DEG = Math.PI / 180;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);

/** The hand-held pole's reach from the operator's front hand: the location
 *  kit's boom types reach 2.5 m (fieldMics.ts POLE — the same drawing default). */
export const POLE_REACH = dd(2500, 'a boom pole’s reach from the operator’s front hand (the location kit’s 2.5 m drawing default)');
/** The operator: their front hand's height above the floor and how tall they
 *  stand (the shared adult figure; drawing defaults). */
export const OPERATOR = {
  height: dd(1750, 'a boom operator’s standing height (the shared adult figure)'),
  radius: dd(220, 'a boom operator’s body, from above (a column)'),
} as const;
/** The fixed boom stand: its level arm from the mic's tail to the stand, and
 *  the stand's column (drawing defaults — no stand's size was read). */
export const STAND_BOOM = {
  arm: dd(850, 'a fixed boom stand’s arm from the mic to the stand’s column (drawing default)'),
} as const;

/** The operator's feet under a grip: `back` mm behind the front hand, away
 *  from the mic along the pole's plan direction (the hands hold the pole in
 *  front of the chest). */
export function operatorAt(grip: Vec3, mic: Vec3, floorY: number, back = 260): Vec3 {
  const h = v3(grip.x - mic.x, 0, grip.z - mic.z);
  const l = Math.hypot(h.x, h.z) || 1;
  return v3(grip.x + (h.x / l) * back, floorY, grip.z + (h.z / l) * back);
}

/** The operator as a column from the feet to the top of the head (for the
 *  frame test and drawing bounds). */
export function operatorColumn(feet: Vec3): { a: Vec3; b: Vec3; r: number } {
  return { a: feet, b: v3(feet.x, feet.y - OPERATOR.height.mm, feet.z), r: OPERATOR.radius.mm };
}

/** The least clearance from the frame along the pole, the grip to the mic's
 *  tail: every part of the pole counts, not only the mic (+ = out of shot). */
export function poleClearance(cam: BroadcastCamera, grip: Vec3, tail: Vec3): number {
  return segmentClearance(cam, grip, tail);
}
/** The operator's column clear of the frame (its axis by its radius). */
export function operatorClearance(cam: BroadcastCamera, feet: Vec3): number {
  const c = operatorColumn(feet);
  return segmentClearance(cam, c.a, c.b) - c.r;
}

/** A fixed boom stand's mountRule: the level arm always runs along `dir`
 *  (from the mic's tail, whatever its aim), then the stand drops. */
export function standBoomRule(dir: Vec3): MountRule {
  const l = len(dir) || 1;
  return { boom: 'level', fallback: v3(dir.x / l, dir.y / l, dir.z / l), length: STAND_BOOM.arm.mm, fixed: true };
}

/** The angle (deg) a boom at `p` turns through to aim from mouth `a` to
 *  mouth `b` — the cue between two talkers. */
export function boomSwing(p: Vec3, a: Vec3, b: Vec3): number {
  const da = sub(a, p);
  const db = sub(b, p);
  const c = (da.x * db.x + da.y * db.y + da.z * db.z) / (len(da) * len(db) || 1);
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
}

/** The boom's plain-words safety (exact; every boom page uses these). */
export const SAFETY = {
  overPeople: 'Never let a mic, a clamp or a cable swing above people. Check every lock, joint and the cable before moving over anyone.',
  rigged: 'A boom fixed overhead is rigged and secured by qualified crew for that venue before anyone sits or stands beneath it, with a clear path kept while it goes up.',
  powerLines: 'Never hold or raise a conductive pole near overhead power lines. If you are unsure, the pole stays down.',
  weather: 'Windscreens and suspensions are not waterproof: keep a mic or recorder that is not rated for it out of rain, and stop or move when the weather, the access or the rigging is unsafe.',
  fatigue: 'Plan relief for the operator, and shorten the reach rather than stretch to the limit — a tired arm drifts into the shot.',
} as const;
