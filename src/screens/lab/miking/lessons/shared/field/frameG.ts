/**
 * FRAME G — the FIELD SITE frame (Lab 6 group 2, lab6-g2; field_ambience/
 * GEOMETRY_PROPOSAL.md §1): F06 ambience, F07 wildlife, F08 pass-bys, and
 * later outdoor scenes. Pure (no React), so the tests reach it.
 *
 *   origin  the LISTENING POINT on the ground — the foot of the array's
 *           stand, the recordist's permitted observation point
 *   +x      the array's FRONT (bearing 0): toward the scene
 *   +y      DOWN (the ground is y = 0; a height h is y = −h)
 *   +z      the array's RIGHT (facing +x, +z is on the right: the engine's
 *           left-handed triple)
 *   millimetres in the model, metres on screen (`fmtMetres`, rounded to
 *   the scale of the number — sceneFrame.ts, Lab 6 group 4).
 *
 * AS BUILT (logged, CORRECTIONS_LOG.md L6G2-G1): the proposal asked for frame
 * S's axes. The engine draws a side view u = x, v = y; in frame S's axes that
 * view would look at the array from behind, the distance to the scene
 * invisible — the same reason group 1 turned frame F a quarter turn (L6G1-F1).
 * So frame G is frame F's orientation at a field site: the side view is a
 * SECTION along the array's front line (height and distance both show) and
 * the plan (top) view has the scene to the right. Lab 5's stereo-array tool
 * still drops in unchanged: an array facing bearing b in frame G is
 * `arrayCapsules(id, params, { c, face: faceS(b) })` with faceS(b) = 90 + b —
 * planDir(90 + b) = (cos b, 0, sin b), its left −z (tested).
 *
 * A BEARING is degrees from the array's front toward its RIGHT (+z): 0 ahead,
 * +90 hard right, −90 hard left, as a listener facing the scene says it.
 * Pages that draw their own plan turn it FRONT-UP (`frontUp`): the scene at
 * the top, the array's right on the screen's right — how a field sketch reads.
 */
import type { MicPose, Vec3 } from '../../../engine/model/types.ts';
import { aimAt } from '../measure/measureModel.ts';
import { fmtMetres, m, MM_PER_FT } from './sceneFrame.ts';

export { fmtMetres, m, MM_PER_FT };

const DEG = Math.PI / 180;
/** One yard in millimetres (exact). */
export const MM_PER_YD = 914.4;
/** Yards → millimetres. */
export const yd = (n: number): number => n * MM_PER_YD;

/** The ground of frame G. */
export const GROUND_Y = 0;

/** A point `range` mm away (in plan) at `bearing` degrees, `h` mm above the ground. */
export function atBearing(range: number, bearing: number, h = 0): Vec3 {
  return { x: range * Math.cos(bearing * DEG), y: GROUND_Y - h, z: range * Math.sin(bearing * DEG) };
}

/** A point's bearing (deg, −180…180) from `from` (default the listening point). */
export function bearingOf(p: Vec3, from: Vec3 = { x: 0, y: 0, z: 0 }): number {
  return Math.atan2(p.z - from.z, p.x - from.x) / DEG;
}

/** Plan distance (mm) between two points, ignoring height. */
export function planRange(a: Vec3, b: Vec3 = { x: 0, y: 0, z: 0 }): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** A height above frame G's ground. */
export const heightAbove = (p: Vec3): number => GROUND_Y - p.y;

/** Lab 5's `face` (frame S) for an array facing `bearing` in frame G. */
export const faceS = (bearing: number): number => 90 + bearing;

/** A mic pose at `p` aimed at `target`. */
export function poseToward(p: Vec3, target: Vec3): MicPose {
  const a = aimAt(p, target);
  const r = (x: number) => Math.round(x * 10) / 10;
  return { p, az: r(a.az), el: r(a.el) };
}

/** A pose at `p` facing `bearing` in plan (level). The engine's aim:
 *  az 0 faces −x, so a mic facing +x (bearing 0) has az 180; facing +z
 *  (bearing 90) has az 90. */
export function poseFacing(p: Vec3, bearing: number, el = 0): MicPose {
  let az = 180 - bearing;
  if (az > 180) az -= 360;
  return { p, az, el };
}

/** A FRONT-UP plan for a page's own drawing: the scene at the top, the
 *  array's right on the right (u = z, v = −x). */
export function frontUp(p: Vec3): { u: number; v: number } {
  return { u: p.z, v: -p.x };
}

/** Left / right / ahead in words, as the listener facing the scene says it. */
export function sideWordsG(bearing: number, centre = 8): string {
  if (Math.abs(bearing) <= centre) return 'straight ahead';
  const side = bearing > 0 ? 'right' : 'left';
  const a = Math.abs(bearing);
  return a >= 150 ? `behind, to the ${side}` : a >= 60 ? `to the ${side}` : `ahead, to the ${side}`;
}

/** A length with its imperial value, for a field drawing: "23 m (75 ft)". */
export const fmtField = (mm: number): string => fmtMetres(mm, true);
