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

export function sdf(shape: Shape3, p: Vec3): number {
  'worklet';
  switch (shape.kind) {
    case 'tube': {
      const dy = p.y - shape.c.y;
      const dz = p.z - shape.c.z;
      const rr = Math.sqrt(dy * dy + dz * dz);
      const dr = Math.max(shape.rIn - rr, rr - shape.rOut);
      const da = Math.max(shape.x0 - p.x, p.x - shape.x1);
      return combine2(dr, da);
    }
    case 'slab': {
      const dy = p.y - shape.c.y;
      const dz = p.z - shape.c.z;
      const rr = Math.sqrt(dy * dy + dz * dz);
      const disc = combine2(rr - shape.r, Math.max(shape.x0 - p.x, p.x - shape.x1));
      if (!shape.hole) return disc;
      const hy = p.y - shape.hole.c.y;
      const hz = p.z - shape.hole.c.z;
      const inHole = Math.sqrt(hy * hy + hz * hz) - shape.hole.r; // < 0 inside the hole's cylinder
      return Math.max(disc, -inHole);
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
    case 'frustum': {
      // Exact capped-cone distance (Quilez), any orientation.
      const bx = shape.b.x - shape.a.x;
      const by = shape.b.y - shape.a.y;
      const bz = shape.b.z - shape.a.z;
      const px = p.x - shape.a.x;
      const py = p.y - shape.a.y;
      const pz = p.z - shape.a.z;
      const rba = shape.rb - shape.ra;
      const baba = bx * bx + by * by + bz * bz;
      const papa = px * px + py * py + pz * pz;
      const paba = (px * bx + py * by + pz * bz) / baba;
      const x = Math.sqrt(Math.max(0, papa - paba * paba * baba));
      const cax = Math.max(0, x - (paba < 0.5 ? shape.ra : shape.rb));
      const cay = Math.abs(paba - 0.5) - 0.5;
      const k = rba * rba + baba;
      let f = (rba * (x - shape.ra) + paba * baba) / k;
      f = f < 0 ? 0 : f > 1 ? 1 : f;
      const cbx = x - shape.ra - f * rba;
      const cby = paba - f;
      const sg = cbx < 0 && cay < 0 ? -1 : 1;
      return sg * Math.sqrt(Math.min(cax * cax + cay * cay * baba, cbx * cbx + cby * cby * baba));
    }
  }
}
