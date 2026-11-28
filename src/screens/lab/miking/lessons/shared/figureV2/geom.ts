/**
 * FIGURE V2 — plane geometry for the figure's outlines (D78, 2026-11-22).
 * Pure: points in the view's millimetres (u right, v DOWN). The art
 * (figureV2/paths.ts) turns these control points into smooth Skia paths; the
 * test reads them directly.
 */
import type { Pt } from '../players/playerPose.ts';

export type { Pt };
export type Poly = Pt[];

export const P = (u: number, v: number): Pt => ({ u, v });
export const add = (a: Pt, b: Pt): Pt => P(a.u + b.u, a.v + b.v);
export const sub = (a: Pt, b: Pt): Pt => P(a.u - b.u, a.v - b.v);
export const mul = (a: Pt, k: number): Pt => P(a.u * k, a.v * k);
export const len = (a: Pt) => Math.hypot(a.u, a.v);
export const dist = (a: Pt, b: Pt) => Math.hypot(a.u - b.u, a.v - b.v);
export const lerp = (a: Pt, b: Pt, t: number): Pt => P(a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t);
export const unit = (a: Pt): Pt => {
  const l = len(a) || 1;
  return P(a.u / l, a.v / l);
};
/** The left-hand normal of a direction (u, v) → (v, −u)… as drawn with v down,
 *  `perp` turns a direction a quarter turn clockwise on screen. */
export const perp = (a: Pt): Pt => P(-a.v, a.u);
export const dot = (a: Pt, b: Pt) => a.u * b.u + a.v * b.v;
export const crossZ = (a: Pt, b: Pt) => a.u * b.v - a.v * b.u;

/** THE LIGHT: one key light from the upper left, the same as the drums and
 *  cymbals (DrumArt, CymbalArt). `LIGHT` points toward the light. */
export const LIGHT = unit(P(-0.62, -0.78));

/**
 * A FRAME for authoring a part: local (x forward, y down) → the view, with a
 * facing (+1 toward +u, −1 mirrored), a rotation (radians; + turns the front
 * down, a nod) about `pivot` (local) and an origin.
 */
export function frame2(origin: Pt, facing: number, rot = 0, pivot: Pt = P(0, 0)) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const f = facing >= 0 ? 1 : -1;
  return (x: number, y: number): Pt => {
    const dx = x - pivot.u;
    const dy = y - pivot.v;
    const xr = pivot.u + dx * c - dy * s;
    const yr = pivot.v + dx * s + dy * c;
    return P(origin.u + f * xr, origin.v + yr);
  };
}

/** Map a list of local [x, y] pairs through a frame. */
export const mapPts = (F: (x: number, y: number) => Pt, xs: readonly (readonly [number, number])[]): Poly => xs.map(([x, y]) => F(x, y));

/**
 * A LIMB's outline round a chain of joints with a radius at each: the outer
 * side of a bent joint rounds over it (the point of the elbow, the knee cap),
 * the inner side meets at the crook. Returned as control points of a closed
 * outline (left side forward, round the end, right side back, round the
 * start); `capStart` / `capEnd` false end the outline square (a limb that
 * runs into a garment or a hand).
 */
export function limbOutline(pts: readonly Pt[], rs: readonly number[], opts: { capStart?: boolean; capEnd?: boolean; crook?: number } = {}): Poly {
  const n = pts.length;
  const dirs: Pt[] = [];
  for (let i = 0; i < n - 1; i++) dirs.push(unit(sub(pts[i + 1], pts[i])));
  const side = (s: 1 | -1): Poly => {
    const out: Poly = [];
    for (let i = 0; i < n; i++) {
      const r = rs[i];
      if (i === 0 || i === n - 1) {
        const d = dirs[Math.min(i, n - 2)];
        out.push(add(pts[i], mul(perp(d), s * r)));
        continue;
      }
      const d0 = dirs[i - 1];
      const d1 = dirs[i];
      const turn = crossZ(d0, d1); // > 0: bends toward +perp
      const outer = Math.sign(turn) !== s || Math.abs(turn) < 1e-3;
      if (outer) {
        // Round over the joint: an arc from the incoming to the outgoing normal.
        const a0 = Math.atan2(perp(d0).v * s, perp(d0).u * s);
        let a1 = Math.atan2(perp(d1).v * s, perp(d1).u * s);
        while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
        while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
        const k = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 6)));
        for (let j = 0; j <= k; j++) {
          const a = a0 + ((a1 - a0) * j) / k;
          out.push(P(pts[i].u + Math.cos(a) * r, pts[i].v + Math.sin(a) * r));
        }
      } else {
        // The crook: the two sides meet, pulled a little toward the joint.
        const m = unit(add(perp(d0), perp(d1)));
        const cosH = Math.max(0.35, dot(m, perp(d0)));
        out.push(add(pts[i], mul(m, (s * r * (opts.crook ?? 0.92)) / cosH)));
      }
    }
    return out;
  };
  const L = side(1);
  const R = side(-1).reverse();
  const cap = (c: Pt, d: Pt, r: number, flip: boolean): Poly => {
    // A half circle round c, from the +perp side to the −perp side through +d (or −d).
    const out: Poly = [];
    const base = Math.atan2(perp(d).v, perp(d).u);
    for (let j = 1; j < 6; j++) {
      const a = base + (flip ? 1 : -1) * ((Math.PI * j) / 6);
      out.push(P(c.u + Math.cos(a) * r, c.v + Math.sin(a) * r));
    }
    return out;
  };
  const endD = dirs[n - 2];
  const startD = dirs[0];
  // A square end keeps its line (two points along it, so the smoothing does not round it off).
  // (a gentle convex end: a hem, a cut sleeve — no corners for the smoothing to flick out)
  const square = (c: Pt, d: Pt, r: number): Poly => {
    // A flattened half-ellipse (≈ a quarter of the radius deep): a hem or a cut
    // sleeve, smooth into both sides — no corners for the smoothing to flick out.
    const out: Poly = [];
    const n0 = perp(d);
    for (let j = 1; j < 6; j++) {
      const a = (Math.PI * j) / 6;
      out.push(add(c, add(mul(n0, Math.cos(a) * r), mul(d, Math.sin(a) * r * 0.22))));
    }
    return out;
  };
  const endCap = opts.capEnd === false ? square(pts[n - 1], endD, rs[n - 1]) : cap(pts[n - 1], endD, rs[n - 1], false);
  const startCap = opts.capStart === false ? square(pts[0], mul(startD, -1), rs[0]) : cap(pts[0], mul(startD, -1), rs[0], false);
  return [...L, ...endCap, ...R, ...startCap];
}

/** Whether p is inside the polygon (even–odd). */
export function inPoly(p: Pt, poly: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v || 1e-9) + a.u) inside = !inside;
  }
  return inside;
}

/** A polygon's bounds. */
export function boundsOf(ps: readonly Pt[]): {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
} {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const q of ps) {
    u0 = Math.min(u0, q.u);
    v0 = Math.min(v0, q.v);
    u1 = Math.max(u1, q.u);
    v1 = Math.max(v1, q.v);
  }
  return { u0, v0, u1, v1 };
}

/** The convex hull (for a grip's silhouette in a view). */
export function hull(points: readonly Pt[]): Poly {
  const ps = [...points].sort((a, b) => a.u - b.u || a.v - b.v);
  if (ps.length < 3) return ps;
  const c = (o: Pt, a: Pt, b: Pt) => (a.u - o.u) * (b.v - o.v) - (a.v - o.v) * (b.u - o.u);
  const lo: Pt[] = [];
  for (const p of ps) {
    while (lo.length >= 2 && c(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: Pt[] = [];
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    while (up.length >= 2 && c(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** The side of a limb axis a→b that faces the light (+1 = +perp). */
export function litSide(a: Pt, b: Pt): 1 | -1 {
  return dot(perp(unit(sub(b, a))), LIGHT) >= 0 ? 1 : -1;
}
