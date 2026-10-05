/**
 * OUTLINES of a solid in one view (pure; no React Native, so the tests reach
 * it). A frustum (a capped cone at any orientation) is drawn as the convex
 * hull of its two end circles projected into the view — exactly the
 * silhouette of the solid the collision tests, so the hatched envelope and
 * the highlight sit where the SDF says the solid is.
 */
import type { Shape3, Vec3, ViewId } from '../model/types.ts';

export type UV = { u: number; v: number };

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function scale(a: Vec3, k: number): Vec3 {
  return { x: a.x * k, y: a.y * k, z: a.z * k };
}
function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function unit(a: Vec3): Vec3 {
  const l = Math.sqrt(dot(a, a));
  return l > 1e-12 ? scale(a, 1 / l) : { x: 0, y: 0, z: 0 };
}

/** Two unit vectors perpendicular to `d` and to each other (any rotation about d). */
export function perpBasis(d: Vec3): [Vec3, Vec3] {
  const n = unit(d);
  const e: Vec3 = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = unit(sub(e, scale(n, dot(e, n))));
  // w = n × u (handedness does not matter for a circle).
  const w = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x };
  return [u, w];
}

/** The view's (u, v) of a model point. */
export function toUV(view: ViewId, p: Vec3): UV {
  return { u: p.x, v: view === 'side' ? p.y : p.z };
}

/** Convex hull (Andrew's monotone chain), counter-clockwise. */
export function hull(pts: UV[]): UV[] {
  const ps = [...pts].sort((a, b) => a.u - b.u || a.v - b.v);
  if (ps.length < 3) return ps;
  const cross = (o: UV, a: UV, b: UV) => (a.u - o.u) * (b.v - o.v) - (a.v - o.v) * (b.u - o.u);
  const lower: UV[] = [];
  for (const p of ps) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: UV[] = [];
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

/** A frustum's silhouette in a view: the hull of both end circles (n points each). */
export function frustumOutline(shape: Extract<Shape3, { kind: 'frustum' }>, view: ViewId, n = 36): UV[] {
  const [u, w] = perpBasis(sub(shape.b, shape.a));
  const pts: UV[] = [];
  for (const [c, r] of [
    [shape.a, shape.ra],
    [shape.b, shape.rb],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const t = (i / n) * 2 * Math.PI;
      const p = { x: c.x + (u.x * Math.cos(t) + w.x * Math.sin(t)) * r, y: c.y + (u.y * Math.cos(t) + w.y * Math.sin(t)) * r, z: c.z + (u.z * Math.cos(t) + w.z * Math.sin(t)) * r };
      pts.push(toUV(view, p));
    }
  }
  return hull(pts);
}
