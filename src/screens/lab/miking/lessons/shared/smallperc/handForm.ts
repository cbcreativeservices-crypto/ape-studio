/**
 * THE POSED 2-D HAND'S FORMS (figure realism pass, second wave, 2026-11-23).
 * Pure: no React, no Skia; the drawing is Hand.tsx and the tests read these
 * points (test/handDrumHands_20261123.test.ts).
 *
 * The owner approved the kit drummer's hands on 2026-11-23 ("Hands pass",
 * "Drummer passes"); figureV2/authoredHands.ts is the standard these follow:
 *   • ONE FINGER = ONE SHAPE ("i see 9 fingers"): each digit is one closed,
 *     tapering outline with a rounded tip (never a chain of beads or tubes);
 *     the palm is one more shape, and nothing else is;
 *   • the thumb comes from the base of the palm, and its root, like each
 *     finger's, melts into the palm: the edge that separates a digit from
 *     what lies under it (`edge`) starts past its root, so no digit reads as
 *     a part plugged on;
 *   • a nail only where a nail faces the viewer, painted with its own digit
 *     (a nail of a hidden finger is hidden with it);
 *   • joint creases and knuckle lights kept quiet.
 * The POSE (where each joint is, how the hand meets the drum) is hands.ts's
 * and is not changed here: this builds the forms round it.
 *
 * Two views: 'back' (the back of the hand toward the viewer, from above: the
 * fingers side by side, the knuckles and nails shown) and 'side' (edge-on,
 * from the thumb side: the nearest finger in front, the fingers beyond it
 * behind the palm's near side, only their tips past it showing).
 */
import { limbOutline, P } from '../figureV2/geom.ts';
import type { FingerGeo, HandGeo, Pt } from './hands.ts';

export type DigitName = 'thumb' | 'index' | 'middle' | 'ring' | 'little';
export const FINGER_NAMES = ['index', 'middle', 'ring', 'little'] as const;

export type FormPart = {
  name: string;
  kind: 'palm' | 'digit';
  digit?: DigitName;
  /** The form's closed outline (local mm). */
  outline: Pt[];
  /** The contour that separates this form from what lies under it (open; a
   *  digit's root left out, so its root melts into the palm). */
  edge: Pt[];
  /** The form's long axis (its cylinder light is laid across it). */
  axis: [Pt, Pt];
  /** Its half-width (the cylinder light's span). */
  r: number;
  /** A nail that faces the viewer (closed, inside the digit), or none. */
  nail: Pt[] | null;
  /** Soft joint creases across the digit (open curves). */
  creases: Pt[][];
  /** Where the digit leaves the palm: the paint fades it in from `fade[0]`
   *  (transparent) to `fade[1]` (opaque), so its root melts into the palm. */
  fade: [Pt, Pt] | null;
  /** A finger seen from the back of the hand GROWS out of it (owner review
   *  2026-11-23: "four sausages stuck onto a palm"): its own form begins at the
   *  knuckle row (`at`, along `dir`); behind that it is the back of the hand. */
  grow: { at: Pt; dir: Pt } | null;
};

export type HandForm = {
  view: 'back' | 'side';
  /** Far to near: the paint order. */
  parts: FormPart[];
  /** The wrist's two edges where the forearm joins the hand (local). */
  wrist: [Pt, Pt];
  /** The thumb's root (its first bone, in the thenar mass): part of the palm's
   *  form, so the thumb grows out of the palm (closed outline). */
  thenar: Pt[];
  /** Soft lights (knuckles, the back of the hand's top plane) and darks (the palm turning under). */
  lights: { c: Pt; rx: number; ry: number; rot: number }[];
  darks: { c: Pt; rx: number; ry: number; rot: number }[];
  /** Warmer, redder skin: knuckles and fingertips. */
  warm: { c: Pt; r: number }[];
  /** The extensor tendons, faint, from the wrist toward the knuckles (back view). */
  tendons: Pt[][];
};

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Which digit a FingerGeo is. */
export function digitOf(g: HandGeo, f: FingerGeo): DigitName {
  if (f === g.thumb) return 'thumb';
  if (f.k != null) return FINGER_NAMES[f.k];
  // (an older pose without `k`: the fingers listed nearest-first by their length)
  const i = [...g.fingers].sort((a, b) => b.layer - a.layer).indexOf(f);
  return FINGER_NAMES[Math.max(0, Math.min(3, i))];
}

/** The radii along a digit's joints: tapering from base to tip, the knuckles a
 *  little fuller, the pad at the tip round. */
export function digitRadii(f: FingerGeo): number[] {
  const n = f.pts.length;
  const L: number[] = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + dist(f.pts[i], f.pts[i - 1]));
  const total = L[n - 1] || 1;
  return f.pts.map((_, i) => {
    const t = L[i] / total;
    const r = (f.w0 + (f.w1 - f.w0) * t) / 2;
    if (i === n - 1) return r * 0.98;
    return i > 0 ? r * 1.03 : r;
  });
}

/** A digit's closed outline: one tapering form round its joints (geom.limbOutline, the approved hands' own). */
export function digitOutline(f: FingerGeo): Pt[] {
  const rs = digitRadii(f);
  return limbOutline(
    f.pts.map((p) => P(p[0], p[1])),
    rs,
  ).map((q) => [q.u, q.v] as Pt);
}

/** The part of a closed outline farther than `r` from `c`, as one open run
 *  (the contour past a digit's root). */
export function openEdge(outline: readonly Pt[], c: Pt, r: number): Pt[] {
  const n = outline.length;
  const keep = outline.map((p) => dist(p, c) > r);
  if (keep.every(Boolean)) return [...outline, outline[0]];
  if (!keep.some(Boolean)) return [];
  let s = 0;
  while (!(keep[s] && !keep[(s - 1 + n) % n])) s++;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const j = (s + i) % n;
    if (!keep[j]) break;
    out.push(outline[j]);
  }
  return out;
}

/** How far past its knuckle a finger's separating edge begins, seen from the
 *  back of the hand: the web between neighboring fingers (mm). */
export const WEB = 14;

/** The part of a closed outline more than `d` past `at` along `dir`, as one
 *  open run (a finger's contour beyond the knuckle row). */
export function beyondEdge(outline: readonly Pt[], at: Pt, dir: Pt, d: number): Pt[] {
  const n = outline.length;
  const keep = outline.map((p) => (p[0] - at[0]) * dir[0] + (p[1] - at[1]) * dir[1] > d);
  if (!keep.some(Boolean)) return [];
  let s = 0;
  while (!(keep[s] && !keep[(s - 1 + n) % n])) s = (s + 1) % n;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const j = (s + i) % n;
    if (!keep[j]) break;
    out.push(outline[j]);
  }
  return out;
}

/** A nail seen from its side (the thumb's, in a view of the back of the
 *  hand: it faces mostly sideways): a sliver along the digit's outer edge. */
function sideSliver(nail: readonly Pt[], f: FingerGeo): Pt[] {
  const c = centroid(nail);
  const [dx, dy] = f.tipDir;
  // (outward: the side of the thumb away from the fingers, −y in the hand's frame)
  let nx = -dy;
  let ny = dx;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const hw = Math.max(...nail.map((p) => Math.abs((p[0] - c[0]) * nx + (p[1] - c[1]) * ny)));
  return nail.map((p) => {
    const u = (p[0] - c[0]) * dx + (p[1] - c[1]) * dy;
    const v = (p[0] - c[0]) * nx + (p[1] - c[1]) * ny;
    const v2 = v * 0.3 + hw * 0.62;
    return [c[0] + dx * u * 0.9 + nx * v2, c[1] + dy * u * 0.9 + ny * v2] as Pt;
  });
}

/** A soft crease across a digit at joint `i` (≈ ⅗ of its width, a slight arc). */
function jointCrease(f: FingerGeo, rs: number[], i: number, along = 0): Pt[] {
  const q = f.pts[i];
  const a = f.pts[i - 1];
  const b = f.pts[i + 1];
  const l = dist(a, b) || 1;
  const d: Pt = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  const n: Pt = [-d[1], d[0]];
  const w = rs[i] * 0.6;
  const c: Pt = [q[0] + d[0] * along, q[1] + d[1] * along];
  return [
    [c[0] - n[0] * w, c[1] - n[1] * w],
    [c[0] + d[0] * 0.9, c[1] + d[1] * 0.9],
    [c[0] + n[0] * w, c[1] + n[1] * w],
  ];
}

const centroid = (ps: readonly Pt[]): Pt => {
  let x = 0;
  let y = 0;
  for (const p of ps) {
    x += p[0];
    y += p[1];
  }
  return [x / (ps.length || 1), y / (ps.length || 1)];
};

const cache = new WeakMap<HandGeo, HandForm>();

/** The forms of a posed hand (cached per pose object: built once). */
export function handForm(g: HandGeo): HandForm {
  const hit = cache.get(g);
  if (hit) return hit;
  const view: 'back' | 'side' = g.view ?? (g.nails && (g.nailAlpha ?? 1) < 0.5 && g.knuckles.length >= 4 ? 'back' : 'side');
  const digits = [...g.fingers, g.thumb];
  // Each given nail belongs to the digit whose tip is nearest it.
  const nailOf = new Map<FingerGeo, Pt[]>();
  for (const nl of g.nails ?? []) {
    const c = centroid(nl);
    let best: FingerGeo | null = null;
    let bd = Infinity;
    for (const f of digits) {
      const d = dist(f.tip, c);
      if (d < bd) {
        bd = d;
        best = f;
      }
    }
    if (best && !nailOf.has(best)) nailOf.set(best, nl);
  }
  const nearest = Math.max(...g.fingers.map((f) => f.layer));
  const digitPart = (f: FingerGeo): FormPart => {
    const name = digitOf(g, f);
    const rs = digitRadii(f);
    const outline = digitOutline(f);
    const n = f.pts.length;
    const thumb = f === g.thumb;
    // The root: where the digit leaves the palm (its separating edge starts past it).
    const root = view === 'back' && !thumb && n >= 5 ? f.pts[1] : f.pts[0];
    const rootR = thumb ? f.w0 * (view === 'back' ? 1.0 : 1.25) : view === 'back' ? f.w0 * 1.05 : f.w0 * 0.75;
    const creases: Pt[][] = [];
    // joint creases: a finger's middle and end joints, the thumb's end joint
    const joints = thumb ? [n - 2] : [n - 3, n - 2];
    for (const i of joints) if (i >= 1 && i < n - 1) creases.push(jointCrease(f, rs, i));
    // The fade: a finger seen from the back fades in over the bone hidden in the
    // palm (its first point to ¾ of the way to the knuckle); the thumb, and a
    // side view's nearest finger, over the first part of their first bone.
    const a = f.pts[0];
    const b = f.pts[1];
    const span = view === 'back' && !thumb && n >= 5 ? 0.75 : thumb ? 0.45 : 0.3;
    const fade: [Pt, Pt] = [a, [a[0] + (b[0] - a[0]) * span, a[1] + (b[1] - a[1]) * span]];
    // Seen from the back, a finger has no root on the back of the hand: its edge
    // and its own light begin past the knuckle row, at the web between fingers.
    const backFinger = view === 'back' && !thumb && n >= 5;
    const dl = dist(f.pts[1], f.pts[2]) || 1;
    const dir: Pt = [(f.pts[2][0] - f.pts[1][0]) / dl, (f.pts[2][1] - f.pts[1][1]) / dl];
    return {
      name,
      kind: 'digit',
      digit: name,
      outline,
      edge: backFinger ? beyondEdge(outline, f.pts[1], dir, WEB) : openEdge(outline, root, rootR),
      grow: backFinger ? { at: f.pts[1], dir } : null,
      axis: [f.pts[0], f.tip],
      r: Math.max(...rs),
      nail: nailOf.get(f) ?? null,
      creases,
      fade: backFinger ? null : fade,
    };
  };
  const body = g.body;
  const wrist: [Pt, Pt] = [body[0], body[body.length - 1]];
  const bx = body.map((p) => p[0]);
  const by = body.map((p) => p[1]);
  const palm: FormPart = {
    name: 'palm',
    kind: 'palm',
    outline: [...body],
    edge: [...body.slice(1, -1)],
    axis: view === 'back' ? [[0, (Math.min(...by) + Math.max(...by)) / 2], [Math.max(...bx), (Math.min(...by) + Math.max(...by)) / 2]] : [[0, 0], [Math.max(...bx), 0]],
    r: (Math.max(...by) - Math.min(...by)) / 2,
    nail: null,
    creases: [],
    fade: null,
    grow: null,
  };
  const fingersFar = [...g.fingers].sort((a, b) => a.layer - b.layer);
  let order: FormPart[];
  if (view === 'back') {
    // Seen from above, the back of the hand is nearer than the thumb (owner
    // 2026-11-23: "make sure when viewed from above, the thumb is correctly
    // placed under the hand ... it looks like it pivot's point is on top,
    // this current looks like the thumb from below"): the thumb is painted
    // FIRST and the back of the hand over it, so the hand's index-side edge
    // runs unbroken and the thumb comes out from under it, low on the hand.
    const th = digitPart(g.thumb);
    th.fade = null;
    if (th.nail) th.nail = sideSliver(th.nail, g.thumb);
    order = [th, palm, ...fingersFar.map(digitPart)];
  } else {
    // Seen edge-on: the fingers beyond the nearest one lie behind the palm's near side.
    const far = fingersFar.filter((f) => f.layer < nearest).map(digitPart);
    const near = fingersFar.filter((f) => f.layer === nearest).map(digitPart);
    order = [...far, palm, ...near, digitPart(g.thumb)];
  }
  const lights: HandForm['lights'] = [];
  const darks: HandForm['darks'] = [];
  const warm: HandForm['warm'] = [];
  const tendons: Pt[][] = [];
  if (view === 'back') {
    for (const f of g.fingers) {
      const k = f.pts.length >= 5 ? f.pts[1] : f.pts[0];
      lights.push({ c: [k[0] - 2, k[1] - 2], rx: 6, ry: 5, rot: 0 });
      warm.push({ c: k, r: 6 });
      tendons.push([
        [22, k[1] * 0.5],
        [k[0] - 18, k[1] * 0.97],
      ]);
    }
    // the back of the hand's broad plane toward the light
    lights.push({ c: [48, Math.min(...by) * 0.35], rx: 30, ry: 14, rot: 0 });
    // CUPPED (a slap, fingertip strokes): each finger's middle joint raised
    // toward the viewer and the light, its end bone turning down and away
    if ((g.curl ?? 0) >= 30)
      for (const f of g.fingers) {
        const n = f.pts.length;
        const pip = f.pts[n - 3];
        const a = f.pts[n - 2];
        const b = f.pts[n - 1];
        lights.push({ c: [pip[0] - 1, pip[1] - 1], rx: 7, ry: 6, rot: 0 });
        darks.push({ c: [(a[0] + b[0]) / 2 + 2, (a[1] + b[1]) / 2], rx: Math.max(5, dist(a, b) * 0.7), ry: f.w1 * 0.42, rot: Math.atan2(b[1] - a[1], b[0] - a[0]) });
      }
  } else {
    const top = Math.min(...by);
    const bottom = Math.max(...by);
    lights.push({ c: [48, top + 7], rx: 30, ry: 4.5, rot: 0.06 });
    darks.push({ c: [50, bottom - 6], rx: 30, ry: 7, rot: -0.05 });
    const nf = g.fingers.find((f) => f.layer === nearest);
    if (nf) warm.push({ c: [nf.pts[0][0] + 2, nf.pts[0][1] - 4], r: 6 });
  }
  for (const f of g.fingers) if (f.layer === nearest || view === 'back') warm.push({ c: [f.tip[0] - f.tipDir[0] * 4, f.tip[1] - f.tipDir[1] * 4], r: 5 });
  const th = g.thumb;
  const thenar = limbOutline([P(th.pts[0][0], th.pts[0][1]), P(th.pts[1][0], th.pts[1][1])], [th.w0 / 2, (th.w0 / 2) * 0.96]).map((q) => [q.u, q.v] as Pt);
  const out: HandForm = { view, parts: order, wrist, thenar, lights, darks, warm, tendons };
  cache.set(g, out);
  return out;
}

/** The digits a form shows (one part each). */
export const digitParts = (h: HandForm) => h.parts.filter((p) => p.kind === 'digit');
