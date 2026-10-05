/**
 * Hand-drum GEOMETRY helpers (pure; tested) for the lessons whose drums are
 * held or stood at an angle (tonbak, tabla): frame H (congas/GEOMETRY_
 * PROPOSAL.md) — origin on the floor, +x toward the audience, +y DOWN (floor
 * y = 0), +z to the player's right; the player sits at −x.
 *
 *   aimTo        the (az, el) that points a mic's front from one point at
 *                another (vec.ts's aim convention, inverted)
 *   approach     a point at distance d from a target, angle φ off its normal,
 *                toward a side (the "25–40 cm, 30–45° off the head" trials)
 *   sectorPolys  a zone's region in the plane of (normal, side), mapped into
 *                the side view (x, y) and the top view (x, z): exact for the
 *                points of that plane — where the zone's start poses lie
 */
import type { MicPose, Vec3 } from '../../engine/model/types.ts';

export const DEG = Math.PI / 180;
export const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const mul = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const dotp = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const length = (a: Vec3): number => Math.sqrt(dotp(a, a));
export const unit = (a: Vec3): Vec3 => mul(a, 1 / (length(a) || 1));

/** The (az, el) whose aim vector (−cos az·cos el, −sin el, sin az·cos el)
 *  points from `from` toward `to`. */
export function aimTo(from: Vec3, to: Vec3): { az: number; el: number } {
  const d = unit(sub(to, from));
  const el = Math.asin(Math.max(-1, Math.min(1, -d.y)));
  const az = Math.atan2(d.z, -d.x);
  return { az: az / DEG, el: el / DEG };
}

/** The in-plane direction toward `side`, square to `n` (unit). */
export function sideDir(n: Vec3, side: Vec3): Vec3 {
  return unit(sub(side, mul(n, dotp(side, n))));
}

/** A point `d` from `c`, φ degrees off the normal `n`, toward `side`. */
export function approach(c: Vec3, n: Vec3, side: Vec3, d: number, phiDeg: number): Vec3 {
  const t = sideDir(n, side);
  return add(c, mul(add(mul(t, Math.sin(phiDeg * DEG)), mul(n, Math.cos(phiDeg * DEG))), d));
}

/** A mic pose at that point, aimed at `aimAt` (default: the target itself). */
export function approachPose(c: Vec3, n: Vec3, side: Vec3, d: number, phiDeg: number, aimAt: Vec3 = c): MicPose {
  const p = approach(c, n, side, d, phiDeg);
  return { p, ...aimTo(p, aimAt) };
}

/** The (d, φ) sector's outline, in the side (x, y) and top (x, z) views. */
export function sectorPolys(c: Vec3, n: Vec3, side: Vec3, dMin: number, dMax: number, aMin: number, aMax: number): { side: { poly: [number, number][] }[]; top: { poly: [number, number][] }[] } {
  // The zone is every point dMin–dMax from c, aMin–aMax off n, on the `side`
  // half (zones.ts: the cone has no azimuth). A view that looks square onto
  // the plane of n and `side` shows the exact cut through that plane; a view
  // across it shows the half-ring swept round n (outer rim, then inner rim).
  const t = sideDir(n, side);
  const b = v3(n.y * t.z - n.z * t.y, n.z * t.x - n.x * t.z, n.x * t.y - n.y * t.x);
  const N = 12;
  const cut: Vec3[] = [];
  for (let i = 0; i <= N; i++) cut.push(approach(c, n, side, dMin, aMin + ((aMax - aMin) * i) / N));
  for (let i = 0; i <= N; i++) cut.push(approach(c, n, side, dMax, aMax - ((aMax - aMin) * i) / N));
  const at = (d: number, a: number, psi: number) => add(c, mul(add(mul(n, Math.cos(a * DEG)), mul(add(mul(t, Math.cos(psi)), mul(b, Math.sin(psi))), Math.sin(a * DEG))), d));
  const ring: Vec3[] = [];
  const M = 24;
  for (let i = 0; i <= M; i++) ring.push(at(dMax, aMax, -Math.PI / 2 + (Math.PI * i) / M));
  for (let i = M; i >= 0; i--) ring.push(at(dMin, aMin, -Math.PI / 2 + (Math.PI * i) / M));
  // |b| along the view's depth axis (side: z; top: y) = the cut faces the view.
  const sideCut = Math.abs(b.z) > 0.7;
  const topCut = Math.abs(b.y) > 0.7;
  return {
    side: [{ poly: (sideCut ? cut : ring).map((p) => [p.x, p.y] as [number, number]) }],
    top: [{ poly: (topCut ? cut : ring).map((p) => [p.x, p.z] as [number, number]) }],
  };
}

/** A band of plane distances [dMin, dMax] above a head (centre c, normal n,
 *  radius r), drawn in both views as the head's extent swept along n. */
export function headBandPolys(c: Vec3, n: Vec3, r: number, dMin: number, dMax: number): { side: { poly: [number, number][] }[]; top: { poly: [number, number][] }[] } {
  // Two in-head directions square to n, for the side (x–y) and top (x–z) cuts.
  const inSide = unit(sub(v3(1, 0, 0), mul(n, n.x)));
  const inTop = unit(sub(v3(0, 0, 1), mul(n, n.z)));
  const quad = (u: Vec3) => [add(add(c, mul(u, -r)), mul(n, dMin)), add(add(c, mul(u, r)), mul(n, dMin)), add(add(c, mul(u, r)), mul(n, dMax)), add(add(c, mul(u, -r)), mul(n, dMax))];
  const sq = quad(inSide);
  if (Math.abs(n.y) <= 0.5) {
    const tq = quad(inSide);
    return { side: [{ poly: sq.map((p) => [p.x, p.y] as [number, number]) }], top: [{ poly: tq.map((p) => [p.x, p.z] as [number, number]) }] };
  }
  // A head facing up is seen from above nearly face-on: the band is the head's
  // disc at dMin and at dMax, and everything between (their convex hull).
  const ring: [number, number][] = [];
  const N = 32;
  for (const d of [dMin, dMax]) {
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 2 * Math.PI;
      const p = add(add(c, add(mul(inSide, Math.cos(a) * r), mul(inTop, Math.sin(a) * r))), mul(n, d));
      ring.push([p.x, p.z]);
    }
  }
  return { side: [{ poly: sq.map((p) => [p.x, p.y] as [number, number]) }], top: [{ poly: hull(ring) }] };
}

/** Convex hull (monotone chain), counter-clockwise. */
function hull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Point-in-polygon (even–odd), for the tests and the hit tests. */
export function inPoly(poly: readonly (readonly [number, number])[], u: number, v: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ui, vi] = poly[i];
    const [uj, vj] = poly[j];
    if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) inside = !inside;
  }
  return inside;
}
