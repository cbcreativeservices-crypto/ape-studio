/**
 * THE SAXOPHONE FAMILY — the drawing's GEOMETRY (pure: no React, no Skia;
 * the tests reach it). Everything is built in 3-D from the posture and
 * projected orthographically into a view's (u, v) millimetres — the same
 * projection the engine's scene uses (side: u = x, v = y, seen from the
 * player's right; top: u = x, v = z, seen from above) — so the keys, the
 * hands and the zones sit exactly where the solids are.
 *
 * The art (SaxArt.tsx) turns these polygons into paint.
 */
import type { Vec3, ViewId } from '../../../engine/model/types.ts';
import { add, dot, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { holesOf, pathOf, radiusAt, type Fingering, type SaxRow } from './saxSpec.ts';
import { centre, holeAngle, onTube, tubeDir, type PlaneAxes } from './saxPosture.ts';

export type P2 = [number, number];
/** What a drawing needs of a posture: the row and the plane's axes. */
export type Placed = { row: SaxRow; ax: PlaneAxes };

/** The view's projection, and the direction toward its camera. */
export const prj = (view: ViewId, p: Vec3): P2 => [p.x, view === 'side' ? p.y : p.z];
export const TO_VIEWER: Record<ViewId, Vec3> = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } };
export const depthOf = (view: ViewId, p: Vec3) => dot(p, TO_VIEWER[view]);
/** The light, from the upper left of the screen. */
const LIGHT: P2 = (() => {
  const l = Math.hypot(1, 1.25);
  return [-1 / l, -1.25 / l];
})();

/** Two unit vectors across a direction (for circles in 3-D). */
export function across(axis: Vec3): [Vec3, Vec3] {
  const a = norm(axis);
  const helper = Math.abs(a.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const e1 = norm(sub(helper, scale(a, dot(helper, a))));
  const e2 = norm({ x: a.y * e1.z - a.z * e1.y, y: a.z * e1.x - a.x * e1.z, z: a.x * e1.y - a.y * e1.x });
  return [e1, e2];
}

/** A circle in 3-D (centre, axis, radius), projected: a polygon (ellipse). */
export function circle2(view: ViewId, c: Vec3, axis: Vec3, r: number, n = 28): P2[] {
  const [e1, e2] = across(axis);
  const out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    out.push(prj(view, add(c, add(scale(e1, r * Math.cos(t)), scale(e2, r * Math.sin(t))))));
  }
  return out;
}

/* ── the tube ── */

export type TubeSample = { u: number; c: P2; n: P2; r: number; s: number; depth: number };

/** The tube between two stations, sampled for one view: the projected
 *  centre, its screen normal (smoothed), the radius and how much the normal
 *  faces the light (s, −1…1). */
export function tubeSamples(P: Placed, view: ViewId, u0: number, u1: number, step = 5, rOf?: (u: number) => number): TubeSample[] {
  const out: TubeSample[] = [];
  const n = Math.max(2, Math.ceil((u1 - u0) / step));
  let last: P2 = [0, -1];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const c3 = centre(P, u);
    const a = prj(view, centre(P, Math.max(u0, u - 9)));
    const b = prj(view, centre(P, Math.min(u1, u + 9)));
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty);
    let nn: P2 = last;
    if (tl > 1.5) {
      tx /= tl;
      ty /= tl;
      nn = [-ty, tx];
      // Keep the normal's sense continuous along the tube.
      if (out.length && nn[0] * last[0] + nn[1] * last[1] < 0) nn = [-nn[0], -nn[1]];
    }
    last = nn;
    out.push({ u, c: prj(view, c3), n: nn, r: rOf ? rOf(u) : radiusAt(P.row, u), s: nn[0] * LIGHT[0] + nn[1] * LIGHT[1], depth: depthOf(view, c3) });
  }
  return out;
}

/** The tube's silhouette (a closed polygon), and two bands along it: offset
 *  `o0`…`o1` × r along the normal (signed by the light when `lit`). */
export function silhouette(S: TubeSample[]): P2[] {
  const left = S.map((q) => [q.c[0] + q.n[0] * q.r, q.c[1] + q.n[1] * q.r] as P2);
  const right = S.map((q) => [q.c[0] - q.n[0] * q.r, q.c[1] - q.n[1] * q.r] as P2);
  return [...left, ...right.reverse()];
}
export function band(S: TubeSample[], centreK: (q: TubeSample) => number, halfK: number): P2[] {
  const a: P2[] = [];
  const b: P2[] = [];
  for (const q of S) {
    const m = centreK(q) * q.r;
    const h = halfK * q.r;
    a.push([q.c[0] + q.n[0] * (m + h), q.c[1] + q.n[1] * (m + h)]);
    b.push([q.c[0] + q.n[0] * (m - h), q.c[1] + q.n[1] * (m - h)]);
  }
  return [...a, ...b.reverse()];
}

/* ── the keys ── */

export type CupGeom = {
  k: number;
  /** The cup's top (a projected disc), its side skirt, the hole beneath. */
  top: P2[];
  skirt: P2[];
  hole: P2[];
  pad: P2[] | null;
  /** Does it face the camera (else it is hidden behind the tube)? */
  visible: boolean;
  open: boolean;
  /** Its centre (projected) and the arm to the rod. */
  c: P2;
  arm: [P2, P2];
  r: number;
  depth: number;
};

/** The holes' cups for a fingering (closed = seated on the hole, open =
 *  lifted and tilted toward its hinge). */
export function cupsOf(P: Placed, view: ViewId, f: Pick<Fingering, 'open'> | null): CupGeom[] {
  const H = holesOf(P.row);
  const open = new Set(f?.open ?? []);
  const toV = TO_VIEWER[view];
  return H.map((h) => {
    const ang = holeAngle(P.row, h.k);
    const m = tubeDir(P, h.u, ang);
    const isOpen = open.has(h.k);
    const base = onTube(P, h.u, ang, 0);
    const lift = isOpen ? h.cupR * 0.55 + 6 : 2.5;
    // An open cup tilts on its hinge (toward the rod side, +ang).
    const hingeSide = tubeDir(P, h.u, ang + 90);
    const mTilt = isOpen ? norm(add(m, scale(hingeSide, -0.42))) : m;
    const cupC = add(add(base, scale(m, lift)), scale(hingeSide, isOpen ? h.cupR * 0.18 : 0));
    const top = circle2(view, cupC, mTilt, h.cupR, 26);
    const skirt = circle2(view, sub(cupC, scale(mTilt, 5)), mTilt, h.cupR * 0.98, 26);
    const hole = circle2(view, add(base, scale(m, 0.6)), m, h.r, 22);
    const pad = isOpen ? circle2(view, sub(cupC, scale(mTilt, 4)), mTilt, h.cupR * 0.86, 22) : null;
    const rodP = onTube(P, h.u, ang + 72, 7);
    return {
      k: h.k,
      top,
      skirt,
      hole,
      pad,
      visible: dot(m, toV) > -0.12,
      open: isOpen,
      c: prj(view, cupC),
      arm: [prj(view, cupC), prj(view, rodP)],
      r: h.cupR,
      depth: depthOf(view, cupC),
    };
  });
}

/** The two key rods along the body's camera-front edge, with their posts. */
export function rodsOf(P: Placed, view: ViewId): { line: P2[]; posts: { c: P2; r: number }[] }[] {
  const H = holesOf(P.row).filter((h) => h.on === 'body');
  if (H.length < 4) return [];
  const S = pathOf(P.row);
  const groups = [H.filter((h) => h.k > H[Math.floor(H.length / 2)].k), H.filter((h) => h.k <= H[Math.floor(H.length / 2)].k)];
  return groups
    .filter((g) => g.length)
    .map((g) => {
      const u0 = Math.min(...g.map((h) => h.u)) - 18;
      const u1 = Math.min(S.bodyEnd - 6, Math.max(...g.map((h) => h.u)) + 18);
      const line: P2[] = [];
      for (let u = u0; u <= u1; u += 6) {
        const a = holeAngle(P.row, g[0].k) + 72;
        line.push(prj(view, onTube(P, u, a, 7)));
      }
      const posts = [u0 + 4, (u0 + u1) / 2, u1 - 4].map((u) => ({ c: prj(view, onTube(P, u, holeAngle(P.row, g[0].k) + 72, 5)), r: 4.2 }));
      return { line, posts };
    });
}

/** The six pearl touches under the fingertips (the left hand's three on the
 *  upper stack, the right hand's on the lower), on the tube's front. */
export function pearlsOf(P: Placed, view: ViewId): { c: P2; r: number; hand: 'L' | 'R'; p3: Vec3; base: P2 }[] {
  const H = holesOf(P.row).filter((h) => h.on === 'body');
  const n = H.length;
  if (n < 7) return [];
  const pick = (i: number) => H[Math.max(0, Math.min(n - 1, i))];
  const L = [pick(n - 2), pick(n - 4), pick(n - 5)];
  const R = [pick(4), pick(2), pick(1)];
  const rr = Math.max(5.5, P.row.mpR * 0.55);
  return [...L.map((h) => ({ h, hand: 'L' as const })), ...R.map((h) => ({ h, hand: 'R' as const }))].map(({ h, hand }) => {
    const p3 = onTube(P, h.u + 9, -8, 7);
    return { c: prj(view, p3), r: rr, hand, p3, base: prj(view, onTube(P, h.u + 4, 10, 0)) };
  });
}

/** Guards over the bell's lowest cups: a curved plate's outline. */
export function bellGuard(P: Placed, view: ViewId): P2[] | null {
  const H = holesOf(P.row).filter((h) => h.on === 'bell');
  if (H.length < 2) return null;
  const lo = Math.min(...H.map((h) => h.u)) - 10;
  const hi = Math.max(...H.slice(0, 3).map((h) => h.u)) + 14;
  const pts: P2[] = [];
  for (let u = lo; u <= hi; u += 6) pts.push(prj(view, onTube(P, u, 52, 22)));
  for (let u = hi; u >= lo; u -= 6) pts.push(prj(view, onTube(P, u, 52, 12)));
  return pts;
}

/** A thin decorative engraving on the bell's outside (a scroll of leaves). */
export function engraving(P: Placed, view: ViewId): P2[][] {
  const S = pathOf(P.row);
  const u0 = S.bellStart + (S.U - S.bellStart) * 0.22;
  const u1 = S.U - P.row.rimR.v * 0.6;
  if (u1 - u0 < 40) return [];
  const lines: P2[][] = [];
  const main: P2[] = [];
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const u = u0 + (u1 - u0) * t;
    main.push(prj(view, onTube(P, u, 110 + 22 * Math.sin(t * Math.PI * 3), 0.5)));
  }
  lines.push(main);
  for (let i = 1; i <= 4; i++) {
    const t0 = i / 5;
    const leaf: P2[] = [];
    for (let s = 0; s <= 1.0001; s += 0.1) {
      const u = u0 + (u1 - u0) * (t0 + 0.06 * s);
      leaf.push(prj(view, onTube(P, u, 110 + 22 * Math.sin(t0 * Math.PI * 3) + (i % 2 ? 1 : -1) * 26 * Math.sin(s * Math.PI), 0.5)));
    }
    lines.push(leaf);
  }
  return lines;
}
