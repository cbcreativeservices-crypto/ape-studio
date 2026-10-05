/**
 * Signed distance to each Shape3 (blueprint §4.4, D3): negative inside the
 * solid, positive outside, in mm. Pure; worklets (the drag calls them on the
 * UI thread).
 *
 * A HEAD with a PORT is `max(disc, −hole)`: a body crossing the head outside
 * the port is inside the solid; one passing through the port is not. No
 * special case anywhere else.
 */
import type { Shape3, Vec3 } from '../model/types.ts';

/** Combine per-axis signed distances like a box SDF. */
function combine2(a: number, b: number): number {
  'worklet';
  const oa = a > 0 ? a : 0;
  const ob = b > 0 ? b : 0;
  const outside = Math.sqrt(oa * oa + ob * ob);
  const m = a > b ? a : b;
  return outside + (m < 0 ? m : 0);
}

function segDist2D(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  'worklet';
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const ll = vx * vx + vy * vy;
  let t = ll > 1e-12 ? (wx * vx + wy * vy) / ll : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = wx - vx * t;
  const dy = wy - vy * t;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Distance from p to the segment a–b. */
export function segDist(p: Vec3, a: Vec3, b: Vec3): number {
  'worklet';
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const vz = b.z - a.z;
  const wx = p.x - a.x;
  const wy = p.y - a.y;
  const wz = p.z - a.z;
  const ll = vx * vx + vy * vy + vz * vz;
  let t = ll > 1e-12 ? (wx * vx + wy * vy + wz * vz) / ll : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = wx - vx * t;
  const dy = wy - vy * t;
  const dz = wz - vz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * A point in a cylinder's own terms: `along` its axis and `radial` distance
 * from it. No `axis` = the legacy x-axis cylinder (along = the ABSOLUTE x,
 * radial from (c.y, c.z)) — the kick's frame, unchanged. With `axis` (unit),
 * along is measured from `c`.
 */
export function cylCoords(c: Vec3, axis: Vec3 | undefined, p: Vec3): { along: number; radial: number } {
  'worklet';
  if (!axis) {
    const dy = p.y - c.y;
    const dz = p.z - c.z;
    return { along: p.x, radial: Math.sqrt(dy * dy + dz * dz) };
  }
  const wx = p.x - c.x;
  const wy = p.y - c.y;
  const wz = p.z - c.z;
  const t = wx * axis.x + wy * axis.y + wz * axis.z;
  const rx = wx - axis.x * t;
  const ry = wy - axis.y * t;
  const rz = wz - axis.z * t;
  return { along: t, radial: Math.sqrt(rx * rx + ry * ry + rz * rz) };
}

export function sdf(shape: Shape3, p: Vec3): number {
  'worklet';
  switch (shape.kind) {
    case 'tube': {
      const q = cylCoords(shape.c, shape.axis, p);
      const dr = Math.max(shape.rIn - q.radial, q.radial - shape.rOut);
      const da = Math.max(shape.x0 - q.along, q.along - shape.x1);
      return combine2(dr, da);
    }
    case 'slab': {
      const q = cylCoords(shape.c, shape.axis, p);
      const disc = combine2(q.radial - shape.r, Math.max(shape.x0 - q.along, q.along - shape.x1));
      if (!shape.hole) return disc;
      const h = cylCoords(shape.hole.c, shape.axis, p);
      const inHole = h.radial - shape.hole.r; // < 0 inside the hole's cylinder
      return Math.max(disc, -inHole);
    }
    case 'sector': {
      // In plan (x–z) a pie slice between radii r0..r1 and angles a0..a1;
      // vertically between y0 and y1.
      const px = p.x - shape.c.x;
      const pz = p.z - shape.c.z;
      const rr = Math.sqrt(px * px + pz * pz);
      let ang = Math.atan2(pz, px);
      // Bring the angle into [a0, a0 + 2π).
      while (ang < shape.a0) ang += Math.PI * 2;
      while (ang >= shape.a0 + Math.PI * 2) ang -= Math.PI * 2;
      let d2: number;
      if (ang <= shape.a1) {
        d2 = Math.max(shape.r0 - rr, rr - shape.r1);
      } else {
        const c0 = Math.cos(shape.a0);
        const s0 = Math.sin(shape.a0);
        const c1 = Math.cos(shape.a1);
        const s1 = Math.sin(shape.a1);
        d2 = Math.min(
          segDist2D(px, pz, c0 * shape.r0, s0 * shape.r0, c0 * shape.r1, s0 * shape.r1),
          segDist2D(px, pz, c1 * shape.r0, s1 * shape.r0, c1 * shape.r1, s1 * shape.r1),
        );
      }
      return combine2(d2, Math.max(shape.y0 - p.y, p.y - shape.y1));
    }
    case 'box': {
      const cx = (shape.min.x + shape.max.x) / 2;
      const cy = (shape.min.y + shape.max.y) / 2;
      const cz = (shape.min.z + shape.max.z) / 2;
      const qx = Math.abs(p.x - cx) - (shape.max.x - shape.min.x) / 2;
      const qy = Math.abs(p.y - cy) - (shape.max.y - shape.min.y) / 2;
      const qz = Math.abs(p.z - cz) - (shape.max.z - shape.min.z) / 2;
      const ox = qx > 0 ? qx : 0;
      const oy = qy > 0 ? qy : 0;
      const oz = qz > 0 ? qz : 0;
      const m = Math.max(qx, qy, qz);
      return Math.sqrt(ox * ox + oy * oy + oz * oz) + (m < 0 ? m : 0);
    }
    case 'capsule':
      return segDist(p, shape.a, shape.b) - shape.r;
    case 'sweep': {
      const px = p.x - shape.pivot.x;
      const py = p.y - shape.pivot.y;
      const rr = Math.sqrt(px * px + py * py);
      const ang = Math.atan2(py, px);
      let d2: number;
      if (ang >= shape.a0 && ang <= shape.a1) {
        d2 = Math.max(shape.r0 - rr, rr - shape.r1);
      } else {
        const c0 = Math.cos(shape.a0);
        const s0 = Math.sin(shape.a0);
        const c1 = Math.cos(shape.a1);
        const s1 = Math.sin(shape.a1);
        d2 = Math.min(
          segDist2D(px, py, c0 * shape.r0, s0 * shape.r0, c0 * shape.r1, s0 * shape.r1),
          segDist2D(px, py, c1 * shape.r0, s1 * shape.r0, c1 * shape.r1, s1 * shape.r1),
        );
      }
      return combine2(d2, Math.abs(p.z - shape.pivot.z) - shape.halfW);
    }
    case 'floor':
      return shape.y - p.y;
    case 'prism': {
      // Into the prism's own frame: undo the hinge turn about the x-parallel
      // line (y, z) = (hinge.y, hinge.z) — the forward turn takes (dz, dy)
      // to (dz·cos + dy·sin, −dz·sin + dy·cos), lifting +z toward −y.
      let py = p.y;
      let pz = p.z;
      const hg = shape.hinge;
      if (hg) {
        const a = (hg.deg * Math.PI) / 180;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const dz = p.z - hg.z;
        const dy = p.y - hg.y;
        pz = hg.z + dz * c - dy * s;
        py = hg.y + dz * s + dy * c;
      }
      // The plan polygon's signed distance, inline (the worklet plugin
      // orders its function factories by itself: a call to a sibling
      // worklet declared later hit the temporal dead zone on web).
      let d2 = Infinity;
      let inside = false;
      const pts = shape.pts;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const ax = pts[j][0];
        const az = pts[j][1];
        const bx = pts[i][0];
        const bz = pts[i][1];
        const e = segDist2D(p.x, pz, ax, az, bx, bz);
        if (e < d2) d2 = e;
        if (bz > pz !== az > pz && p.x < ((ax - bx) * (pz - bz)) / (az - bz) + bx) inside = !inside;
      }
      return combine2(inside ? -d2 : d2, Math.max(shape.y0 - py, py - shape.y1));
    }
  }
}

/** Signed distance to a closed polygon in a plane (negative inside, the
 *  even–odd rule). Build-time only (the art and the piano family's string
 *  fitting); `sdf` computes the same thing inline. */
export function polyDist2D(pts: readonly (readonly [number, number])[], px: number, pz: number): number {
  let d = Infinity;
  let inside = false;
  const n = pts.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = pts[j][0];
    const az = pts[j][1];
    const bx = pts[i][0];
    const bz = pts[i][1];
    const e = segDist2D(px, pz, ax, az, bx, bz);
    if (e < d) d = e;
    if (bz > pz !== az > pz && px < ((ax - bx) * (pz - bz)) / (az - bz) + bx) inside = !inside;
  }
  return inside ? -d : d;
}
