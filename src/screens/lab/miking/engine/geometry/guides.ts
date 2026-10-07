/**
 * SETUP GUIDES — what a STARTING SETUPS drawing adds to a placed mic (owner
 * restructure 2026-10-06: "mic body, stand/clip, aim line, distance shown
 * with a dimension"). Pure; tested in node.
 *
 *   DIMENSION  from the mic's FRONT (the readouts' reference point) to the
 *              surface its starting point is measured from: the foot of the
 *              perpendicular on a plane (a head, a grille, the strings), the
 *              point itself for a TARGET surface ("30 cm from the bell").
 *              Its length is the readout's distance — one number, one source.
 *   AIM        where the mic's front axis goes: to the plane it is measured
 *              from when it points at it, else as far as the dimension.
 */
import type { MicPose, ReferenceSurface, Vec3, ViewId } from '../model/types.ts';
import { aimVec, dot, sub } from './vec.ts';

export type Guide = {
  /** The mic's front (where the dimension starts). */
  front: Vec3;
  /** The point the distance is measured to. */
  foot: Vec3;
  /** The distance, mm (≥ 0): what the readouts print. */
  distance: number;
  /** Where the aim line ends. */
  aimEnd: Vec3;
};

const add = (a: Vec3, b: Vec3, k: number): Vec3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });

/** The guide for a mic at `pose` measured from `s`. */
export function guideFor(s: ReferenceSurface, pose: MicPose): Guide {
  const p = pose.p;
  const a = aimVec(pose.az, pose.el);
  let foot: Vec3;
  let distance: number;
  if (s.target) {
    foot = s.point;
    const d = sub(p, s.point);
    distance = Math.sqrt(dot(d, d));
  } else {
    const d = dot(sub(p, s.point), s.normal);
    foot = add(p, s.normal, -d);
    distance = Math.abs(d);
  }
  // The aim: to the plane when the front faces it, within a sensible reach.
  const reach = Math.max(80, distance);
  let t = reach;
  if (!s.target) {
    const den = dot(a, s.normal);
    if (Math.abs(den) > 1e-6) {
      const hit = dot(sub(s.point, p), s.normal) / den;
      if (hit > 20 && hit < reach * 3) t = hit;
    }
  } else {
    // Toward a target point: as far along the aim as the point is away.
    t = Math.max(80, distance);
  }
  return { front: p, foot, distance, aimEnd: add(p, a, t) };
}

/** The guide's dimension as seen in a view (mm on the view's u, v). */
export function projected(g: Guide, view: ViewId): { u0: number; v0: number; u1: number; v1: number; len: number } {
  const v = (q: Vec3) => (view === 'side' ? q.y : q.z);
  const u0 = g.front.x;
  const v0 = v(g.front);
  const u1 = g.foot.x;
  const v1 = v(g.foot);
  return { u0, v0, u1, v1, len: Math.hypot(u1 - u0, v1 - v0) };
}

/** The view that shows a guide's dimension best (the longer projection). */
export function bestView(guides: readonly Guide[], both: boolean): ViewId {
  if (!both || !guides.length) return 'side';
  const side = guides.reduce((n, g) => n + projected(g, 'side').len / Math.max(1, g.distance), 0);
  const top = guides.reduce((n, g) => n + projected(g, 'top').len / Math.max(1, g.distance), 0);
  return top > side * 1.25 ? 'top' : 'side';
}
