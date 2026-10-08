/**
 * FRAME F — the Foley stage frame every Lab 6 Foley lesson shares (F01–F05,
 * later F09). Pure; tested (test/mikingLab6Foley.test.ts). Built once by
 * group 1 (lab6-g1). Research: foley_footsteps/GEOMETRY_PROPOSAL.md §1.
 *
 *   origin  the centre of the ACTIVE AREA on the walking surface (F01: the
 *           central footfall area — the lesson's own reference, "capsule to
 *           the central active footfall area"; F02: the active fabric; F03:
 *           the prop's sounding part; F04: the impact point / the water
 *           entry). The stage floor and the pit's surface are y = 0.
 *   +x      toward the MICROPHONE side: the performer faces +x (the walker's
 *           front line, toward the picture and the control-room glass)
 *   +y      DOWN (a height h is y = −h)
 *   +z      the PERFORMER's right
 *   mm and degrees.
 *
 * AS BUILT (logged, CORRECTIONS_LOG.md L6G1-F1): the proposal asked for frame
 * S's axes (+x the recordist's right, +z toward the recordist). The engine
 * draws two views — side (u = x, v = y) and top (u = x, v = z) — so in frame
 * S a footstep mic "in front" of the walker would sit straight in front of
 * the figure in the side view, its distance invisible. Frame F therefore
 * turns frame S a quarter turn about the vertical (as Lab 2's frame H does:
 * the player faces +x, toward the mic): the side view is a SECTION through
 * the walker's front line, where the mic's distance and height both show.
 * `toFrameS` / `fromFrameS` convert, so the Lab 5 stereo-array tool (frame
 * S) drops in unchanged:
 *
 *   frame S (x, y, z) = (−z_F, y_F, x_F)        frame F = (z_S, y_S, −x_S)
 *
 * (the recordist looks back at the performer along −x_F, so their right is
 * −z_F = +x_S; toward the recordist is +x_F = +z_S).
 *
 * The VIEWS (u right, v down on the screen):
 *   side  u = x, v = y   a section through the walker's front line, seen from
 *                        the performer's right — the performer at the left,
 *                        the mics to the right, the pit cut open below
 *   top   u = x, v = z   from above, the performer at the left facing right
 */
import type { MicPose, Vec3 } from '../../../engine/model/types.ts';
import { add, aimTo, DEG, dotp, length, mul, sub, unit, v3 } from '../handGeom.ts';

export { add, aimTo, DEG, dotp, length, mul, sub, unit, v3 };

/** A height above the floor as frame-F y. */
export const up = (h: number): number => -h;

/** Frame F → frame S (Lab 5's stage frame): (−z, y, x). */
export function toFrameS(p: Vec3): Vec3 {
  return { x: -p.z, y: p.y, z: p.x };
}
/** Frame S → frame F: (z, y, −x). */
export function fromFrameS(p: Vec3): Vec3 {
  return { x: p.z, y: p.y, z: -p.x };
}

/** A plan direction in frame F: `deg` from the walker's front line (+x)
 *  toward the performer's right (+z), level. */
export function planDirF(deg: number): Vec3 {
  return v3(Math.cos(deg * DEG), 0, Math.sin(deg * DEG));
}

/**
 * A point `d` mm from `c`, at `bearing` degrees in plan off the walker's
 * front line (toward the performer's right) and `elev` degrees above the
 * horizontal — the way a Foley starting point is described ("in front and/or
 * to the side, only about 15 degrees", a mic "aimed down toward the contact
 * zone").
 */
export function around(c: Vec3, d: number, bearing: number, elev: number): Vec3 {
  const ce = Math.cos(elev * DEG);
  return v3(c.x + d * ce * Math.cos(bearing * DEG), c.y - d * Math.sin(elev * DEG), c.z + d * ce * Math.sin(bearing * DEG));
}

/** A mic pose at `around(c, …)`, aimed at `target` (default: c). */
export function poseAround(c: Vec3, d: number, bearing: number, elev: number, target: Vec3 = c): MicPose {
  const p = around(c, d, bearing, elev);
  const a = aimTo(p, target);
  const r = (x: number) => Math.round(x * 10) / 10;
  return { p: v3(r(p.x), r(p.y), r(p.z)), az: r(a.az), el: r(a.el) };
}

/** The angle (deg) between (p − c) and +x — what a zone's `cone` tests. */
export function offFront(c: Vec3, p: Vec3): number {
  const d = unit(sub(p, c));
  return Math.acos(Math.max(-1, Math.min(1, d.x))) / DEG;
}

/** mm in the app's dual style for a stage dimension: "1.2 m (3.9 ft)" / "45 cm (17.7 in)". */
export function fmtStageF(mm: number): string {
  if (mm >= 1000) return `${(Math.round(mm / 50) * 50 / 1000).toFixed(mm < 10000 ? 2 : 1).replace(/0$/, '')} m (${(mm / 304.8).toFixed(1)} ft)`;
  return `${Math.round(mm / 10)} cm (${(mm / 25.4).toFixed(1)} in)`;
}

export { length as len3 };
export const dist3 = (a: Vec3, b: Vec3): number => length(sub(a, b));
export const mid3 = (a: Vec3, b: Vec3): Vec3 => mul(add(a, b), 0.5);
export const dot3 = dotp;
