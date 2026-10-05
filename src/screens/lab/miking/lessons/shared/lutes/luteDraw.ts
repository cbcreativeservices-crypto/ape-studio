/**
 * Drawing helpers for the lute family's art: instrument-frame points
 * projected through the posture into a view (front = engine x, y; above =
 * engine x, z), smooth outlines, convex silhouettes of the round bodies
 * (bowls and gourds), and the point tests the hit areas use — so the art,
 * the hit areas and the model share one geometry. No React.
 */
import { Skia } from '@shopify/react-native-skia';
import type { Vec3, ViewId } from '../../../engine/model/types.ts';
import type { LuteScene } from './luteModel.ts';

export type Pt = [number, number];
export type SkPath = ReturnType<typeof Skia.Path.Make>;
export const make = (): SkPath => Skia.Path.Make();
export const DEG = Math.PI / 180;

/** An instrument-frame point in a view's (u, v). */
export function vp(sc: LuteScene, view: ViewId, p: Vec3): Pt {
  const e = sc.posture.P(p);
  return view === 'side' ? [e.x, e.y] : [e.x, e.z];
}
/** An ENGINE point in a view's (u, v). */
export function ep(view: ViewId, e: Vec3): Pt {
  return view === 'side' ? [e.x, e.y] : [e.x, e.z];
}

export function poly(pts: Pt[], close = true): SkPath {
  const p = make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.close();
  return p;
}
/** A smooth closed curve through the points (quadratic midpoints). */
export function smooth(pts: Pt[]): SkPath {
  const p = make();
  const n = pts.length;
  const mid = (i: number): Pt => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    p.quadTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  p.close();
  return p;
}
/** A smooth OPEN curve through the points. */
export function curve(pts: Pt[]): SkPath {
  const p = make();
  p.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) {
    p.lineTo(pts[1][0], pts[1][1]);
    return p;
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const m: Pt = i === pts.length - 2 ? pts[i + 1] : [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    p.quadTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  return p;
}
export function rr(x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
export function oval(cx: number, cy: number, rx: number, ry: number): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}
export function circ(cx: number, cy: number, r: number): SkPath {
  const p = make();
  p.addCircle(cx, cy, r);
  return p;
}

/** Convex hull (monotone chain), counter-clockwise. */
export function hull(pts: Pt[]): Pt[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (s.length < 3) return s;
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  for (const p of s) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: Pt[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** A circle in the instrument frame's (x, y) plane at height z, projected. */
export function ringPts(sc: LuteScene, view: ViewId, cx: number, cy: number, r: number, z: number, n = 48, a0 = 0, a1 = Math.PI * 2): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    out.push(vp(sc, view, { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t), z }));
  }
  return out;
}

/** The silhouette of a (truncated) ellipsoid body — centre (cx, 0, zc), radii
 *  (a, a, c), cut at z = zTop — in a view. */
export function bodySilhouette(sc: LuteScene, view: ViewId, cx: number, a: number, c: number, zc: number, zTop: number): Pt[] {
  const pts: Pt[] = [];
  const zBot = zc - c;
  for (let i = 0; i <= 24; i++) {
    const z = zTop - ((zTop - zBot) * i) / 24;
    const r = a * Math.sqrt(Math.max(0, 1 - ((z - zc) / c) ** 2));
    for (let k = 0; k < 36; k++) {
      const t = (k / 36) * Math.PI * 2;
      pts.push(vp(sc, view, { x: cx + r * Math.cos(t), y: r * Math.sin(t), z }));
    }
  }
  return hull(pts);
}

export function bounds(pts: Pt[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** Is (u, v) inside the polygon, or within `tol` of its edge? */
export function hitPoly(pts: Pt[], u: number, v: number, tol: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi + 1e-12) + xi) inside = !inside;
  }
  if (inside) return true;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if (segDist(u, v, pts[j], pts[i]) <= tol) return true;
  return false;
}
/** Is (u, v) within `tol` of the polyline? */
export function hitLine(pts: Pt[], u: number, v: number, tol: number): boolean {
  for (let i = 1; i < pts.length; i++) if (segDist(u, v, pts[i - 1], pts[i]) <= tol) return true;
  return false;
}
function segDist(u: number, v: number, a: Pt, b: Pt): number {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const ll = vx * vx + vy * vy;
  let t = ll > 1e-12 ? ((u - a[0]) * vx + (v - a[1]) * vy) / ll : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(u - (a[0] + vx * t), v - (a[1] + vy * t));
}

/** A hit area: a polygon or a polyline, tested in order (topmost first). */
export type HitArea = { id: string; pts: Pt[]; line?: boolean; tol?: number };
export function hitAreas(areas: HitArea[], u: number, v: number, tol: number): string | null {
  for (const a of areas) {
    const t = tol + (a.tol ?? 0);
    if (a.line ? hitLine(a.pts, u, v, t) : hitPoly(a.pts, u, v, Math.min(t, 6 + tol * 0.4))) return a.id;
  }
  return null;
}

/* ── palette: material ramps lit from the upper left ── */
export const PAL = {
  spruce: ['#f2dcaa', '#e3c487', '#cfa868', '#b48a4c'],
  maple: ['#e6c590', '#cfa66a', '#a97f45'],
  walnut: ['#6b4126', '#4f2e1a', '#351d10'],
  ebony: ['#2c2622', '#1a1613', '#0e0b09'],
  rosewood: ['#4a2618', '#331a10', '#22110a'],
  bone: ['#fbf7ec', '#e9e1cd', '#c8bc9f'],
  toon: ['#e9c891', '#d6a865', '#b9874a', '#946535'],
  lacquer: ['#6b3a22', '#43200f', '#25110a', '#140905'],
  jack: ['#b5683a', '#93502a', '#6f3a1d', '#4c2612'],
  jackLight: ['#d79b62', '#c0814a', '#a06636'],
  brass: ['#fbe7a6', '#e2bd5c', '#b48a2c', '#7d5d17'],
  gold: ['#fff1b8', '#f0c95a', '#c9962a', '#8a6214'],
  steel: '#e6eaf0',
  bronze: '#d9b26a',
  nylon: '#f3efe3',
  gut: '#d9c69a',
  wax: ['#2b2b2e', '#141416', '#050506'],
  inlay: '#f4ead2',
  hole: ['#1a120c', '#0b0806', '#040302'],
  red: ['#c4442e', '#922a1c', '#5c170e'],
  fig: ['#2b2f38', '#20232a', '#16181d'],
  figEdge: '#4a505c',
  skin: ['#3a3e48', '#2c3038', '#22252c'],
  rug: ['#5a2026', '#3f151a', '#2a0d11'],
  ink: '#08080a',
} as const;
