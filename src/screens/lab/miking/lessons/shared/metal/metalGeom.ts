/**
 * Suspended-metal GEOMETRY helpers (pure; tested). A starting point here is
 * a cone round the instrument's face line: every point d_min…d_max from the
 * target, a_min…a_max off the normal n, on the `toward` half (zones.ts:
 * `cone`). Its OUTLINE in each placement view is the convex hull of the
 * region's points projected into that view — drawn for the learner, never
 * used to decide membership (zones.ts does that from the numbers).
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, DEG, dotp, mul, sideDir, unit, v3 } from '../handGeom.ts';

type Pt = [number, number];

/** Convex hull (monotone chain), counter-clockwise. */
export function hull2(pts: readonly Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** The cone region's points (a sample), in 3-D. */
export function conePoints(c: Vec3, n: Vec3, toward: Vec3 | null, dMin: number, dMax: number, aMin: number, aMax: number): Vec3[] {
  const t = sideDir(n, toward ?? (Math.abs(n.y) < 0.9 ? v3(0, -1, 0) : v3(1, 0, 0)));
  const b = unit(v3(n.y * t.z - n.z * t.y, n.z * t.x - n.x * t.z, n.x * t.y - n.y * t.x));
  const out: Vec3[] = [];
  const ND = 4;
  const NA = 8;
  const NP = 36;
  for (let i = 0; i <= ND; i++) {
    const d = dMin + ((dMax - dMin) * i) / ND;
    for (let j = 0; j <= NA; j++) {
      const a = (aMin + ((aMax - aMin) * j) / NA) * DEG;
      for (let k = 0; k < NP; k++) {
        const psi = (k / NP) * 2 * Math.PI;
        const dir = add(mul(n, Math.cos(a)), mul(add(mul(t, Math.cos(psi)), mul(b, Math.sin(psi))), Math.sin(a)));
        if (toward && dotp(dir, toward) < -1e-9 && a > 1e-9) continue;
        out.push(add(c, mul(dir, d)));
      }
    }
  }
  return out;
}

/** The zone's outline in the side (x, y) and top (x, z) views. */
export function conePolys(c: Vec3, n: Vec3, toward: Vec3 | null, dMin: number, dMax: number, aMin: number, aMax: number): { side: { poly: Pt[] }[]; top: { poly: Pt[] }[] } {
  const pts = conePoints(c, n, toward, dMin, dMax, aMin, aMax);
  return {
    side: [{ poly: hull2(pts.map((p) => [p.x, p.y] as Pt)) }],
    top: [{ poly: hull2(pts.map((p) => [p.x, p.z] as Pt)) }],
  };
}
