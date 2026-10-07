/**
 * FRAME S — the stage frame every Lab 5 ensemble lesson shares (E02–E16).
 * Pure; tested (test/mikingLab5Arrays.test.ts).
 *
 * docs/labs/miking/full_orchestra/GEOMETRY_PROPOSAL.md §1 proposed frame S
 * with +x upstage and +z toward the conductor's LEFT. As BUILT (logged,
 * CORRECTIONS_LOG.md E14-F1) the axes are turned so the engine's two views
 * draw the stage the way a seating plan is read — the conductor at the
 * bottom of the plan, looking up at the ensemble — and nothing is mirrored
 * (the engine's frame is left-handed: facing +x, +z is on the right):
 *
 *   origin  on the FLOOR, at the front of the front row, on the centre line
 *           (the front desks' line for an orchestra, the front riser edge for
 *           a choir, the front of a quartet's arc)
 *   +x      toward the CONDUCTOR'S RIGHT (and the audience's right): across
 *   +y      DOWN (the floor is y = 0; a height h is y = −h)
 *   +z      DOWNSTAGE: toward the conductor, the podium and the hall
 *           (the ensemble sits at z < 0)
 *   mm and degrees.
 *
 * THE THREE VIEWS (u right, v down on the screen):
 *   plan     u = x,  v = z   from above, the conductor's view (upstage at
 *                            the top) — the engine's 'top' view
 *   front    u = x,  v = y   from the hall, as the audience sees it — the
 *                            engine's 'side' view
 *   section  u = −z, v = y   cut along the centre line, seen from the
 *                            conductor's right: the hall at the left, the
 *                            back rows at the right (Lab 5's own pages)
 *
 * The CONDUCTOR'S-VIEW words (`sideWords`) are always said as the conductor
 * faces the ensemble: −x is the conductor's left.
 */
import type { MicPose, Vec3 } from '../../../engine/model/types.ts';

export type StageView = 'plan' | 'front' | 'section';
export const STAGE_VIEWS: readonly StageView[] = ['plan', 'section', 'front'];

export const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const mul = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const length = (a: Vec3): number => Math.sqrt(dot(a, a));
export const dist = (a: Vec3, b: Vec3): number => length(sub(a, b));
export const unit = (a: Vec3): Vec3 => mul(a, 1 / (length(a) || 1));
export const DEG = Math.PI / 180;

/** Screen (u, v) of a point in a view (mm). */
export function uv(view: StageView, p: Vec3): { u: number; v: number } {
  if (view === 'plan') return { u: p.x, v: p.z };
  if (view === 'front') return { u: p.x, v: p.y };
  return { u: -p.z, v: p.y };
}
/** A direction's (u, v) in a view (not normalised: a foreshortened axis). */
export function uvDir(view: StageView, d: Vec3): { u: number; v: number } {
  if (view === 'plan') return { u: d.x, v: d.z };
  if (view === 'front') return { u: d.x, v: d.y };
  return { u: -d.z, v: d.y };
}
/** The engine view a stage view is drawn in (the section is Lab 5's own). */
export const engineView = (view: StageView): 'top' | 'side' | null => (view === 'plan' ? 'top' : view === 'front' ? 'side' : null);

/** A height above the floor as frame-S y. */
export const up = (h: number): number => -h;

/** The engine's aim (az, el) for a unit direction d (engine/geometry/vec.ts:
 *  aimVec = (−cos az·cos el, −sin el, sin az·cos el)). */
export function aimOf(d: Vec3): { az: number; el: number } {
  const u = unit(d);
  const el = Math.asin(Math.max(-1, Math.min(1, -u.y)));
  const az = Math.atan2(u.z, -u.x);
  return { az: az / DEG, el: el / DEG };
}
/** The unit direction of an engine aim (az, el). */
export function dirOf(az: number, el: number): Vec3 {
  const a = az * DEG;
  const e = el * DEG;
  return { x: -Math.cos(a) * Math.cos(e), y: -Math.sin(e), z: Math.sin(a) * Math.cos(e) };
}
/** A mic pose at p aimed at a target point. */
export function poseAt(p: Vec3, target: Vec3): MicPose {
  return { p, ...aimOf(sub(target, p)) };
}

/** Plan direction (x, z) a player or an array faces, as an angle in degrees
 *  from UPSTAGE (−z) toward the conductor's right (+x): 0 = facing upstage,
 *  180 = facing the conductor and the hall. */
export function planDir(deg: number): Vec3 {
  return { x: Math.sin(deg * DEG), y: 0, z: -Math.cos(deg * DEG) };
}

/** Where a point is as the conductor sees it: left, centre or right. */
export function sideOf(p: Vec3, centre = 600): 'left' | 'centre' | 'right' {
  return p.x < -centre ? 'left' : p.x > centre ? 'right' : 'centre';
}
export function sideWords(p: Vec3, centre = 600): string {
  const s = sideOf(p, centre);
  return s === 'centre' ? 'in the middle, as the conductor faces the ensemble' : `on the conductor’s ${s}`;
}

/** mm as m with one decimal ("3.2 m"). */
export const fmtM = (mm: number): string => `${(mm / 1000).toFixed(1)} m`;
/** mm in the app's dual style for a stage dimension: "3.2 m (10.5 ft)". */
export function fmtStage(mm: number): string {
  const ft = mm / 304.8;
  return mm >= 1000 ? `${(mm / 1000).toFixed(mm < 10000 ? 1 : 0)} m (${ft.toFixed(ft < 10 ? 1 : 0)} ft)` : `${Math.round(mm / 10)} cm (${(mm / 25.4).toFixed(1)} in)`;
}
