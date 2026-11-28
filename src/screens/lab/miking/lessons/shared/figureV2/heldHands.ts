/**
 * FIGURE V2 — THE HAND ROUND A HAND-HELD MIC (wave 3, the hand-held mic: B03,
 * B10, B09; coordinator rounds 2026-11-23, step A). Pure: no React, no Skia.
 *
 * Round 3 (owner 2026-11-23, "thumb is on wrong side of mic cylinder"): the
 * grip is ONE 3-D hand round the handle, projected in each view, instead of
 * four flat drawings. The anatomy it is built from:
 *   • the handle lies IN the palm, across its far end (the base of the fingers);
 *   • the four fingers leave their knuckles on the back side, come round the
 *     handle's FAR edge (the knuckle side, +u) onto its front (the side away
 *     from the palm) and point back toward the palm;
 *   • the thumb leaves its mound on the palm's thumb side and comes round the
 *     handle's NEAR edge (the wrist side, −u) the OTHER way, onto the front,
 *     where its pad meets the index and middle fingers;
 *   so the handle is enclosed: the palm on one side, the fingers and the thumb
 *   meeting on the other, the fingers and the thumb never round the same edge.
 *
 * The hand's frame (from the arm's real rotation): U along the hand from the
 * wrist to the knuckles (the forearm: the wrist straight), W across it toward
 * the thumb (the handle runs ALONG W, tilted by β toward U where the arm meets
 * the handle obliquely), N the BACK of the hand (h × f for the right hand). The
 * local origin is the handle's centre line in the middle of the fist.
 */
import { add, inPoly, limbOutline, mul, P, perp, sub, unit, hull, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';

export type HeldView = 'heldBack' | 'heldPalm' | 'heldFace' | 'heldEnd';

/* ── vectors ── */

export type V3 = { x: number; y: number; z: number };
const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub3 = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add3 = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul3 = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const cross3 = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const unit3 = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

/* ── which side of the hand the viewer sees ── */

/**
 * The hand's frame from the arm's real rotation: f the forearm (elbow → fist), h the handle toward the
 * mic's head (the thumb's side), d the BACK of the hand. A power grip: the back of the RIGHT hand faces
 * h × f (thumb up a handle held in front, forearm forward: the knuckles face out to the right); the left
 * hand's the other way. Where the handle runs along the forearm (|h·f| > 0.85, the cross is unreliable)
 * the back of the hand faces the side of the arm away from the body, a little up.
 */
export function heldFrame(elbow: V3, fist: V3, aim: V3, hand: 'R' | 'L', outward: V3): { f: V3; h: V3; d: V3 } {
  const f = unit3(sub3(fist, elbow));
  const h = unit3(aim);
  let d = cross3(h, f);
  if (Math.hypot(d.x, d.y, d.z) < 0.4) {
    // (along the forearm: the back of the hand toward the outside of the arm and up, ⟂ the forearm)
    const want = unit3({ x: outward.x, y: outward.y - 0.5, z: outward.z });
    d = sub3(want, { x: f.x * dot3(want, f), y: f.y * dot3(want, f), z: f.z * dot3(want, f) });
  } else if (hand === 'L') d = { x: -d.x, y: -d.y, z: -d.z };
  return { f, h, d: unit3(d) };
}

/** How the viewer sees the hand: the share of each of its faces turned toward the viewer (`toward`: unit). */
export function heldSides(fr: { f: V3; h: V3; d: V3 }, toward: V3) {
  return { back: dot3(fr.d, toward), forearm: dot3(fr.f, toward), thumb: dot3(fr.h, toward) };
}

/** The face most turned toward the viewer (for the words; the drawing is the true projection). */
export function heldViewFor(s: { back: number; forearm: number; thumb: number }): HeldView {
  const a = [
    { v: Math.abs(s.back), k: s.back >= 0 ? ('heldBack' as const) : ('heldPalm' as const) },
    { v: Math.max(0, s.forearm), k: 'heldFace' as const },
    { v: Math.max(0, s.thumb), k: 'heldEnd' as const },
  ];
  a.sort((p, q) => q.v - p.v);
  return a[0].k;
}

/** In words, for the report and the study page. */
export const HELD_SIDE_WORDS: Record<HeldView, string> = {
  heldBack: 'the back of the hand (knuckles along the handle, the thumb on its head side)',
  heldPalm: 'the palm side (the four fingers across the handle, the thumb over the index)',
  heldFace: 'the fist from its knuckle end (the forearm toward the viewer)',
  heldEnd: 'the thumb side, down the handle from the mic head',
};

/* ── the grip, in the hand's own frame (mm) ── */

/** A point in the hand's frame: u wrist → knuckles, w little finger → thumb (along the handle), n palm → back. */
export type L3 = { u: number; w: number; n: number };
const l3 = (u: number, w: number, n: number): L3 => ({ u, w, n });

export type Digit = { name: 'index' | 'middle' | 'ring' | 'little' | 'thumb'; pts: L3[]; r: number[] };

export type GripModel = {
  /** The handle's radius where the hand closes on it. */
  R: number;
  /** The handle's tilt toward the knuckles per mm along it (tan β). */
  tilt: number;
  /** The palm as spheres (centre, radius): its silhouette is their hull. */
  palm: { c: L3; r: number }[];
  /** The knuckles (the metacarpal heads): soft swells on the palm's far end. */
  knuckles: { c: L3; r: number }[];
  fingers: Digit[];
  thumb: Digit;
  wrist: L3;
};

/** The handle's centre line at w (the palm's side of the hand: u along the hand). */
export const axisU = (m: { tilt: number }, w: number) => w * m.tilt;

// (round 4: each knuckle sits the same way over the handle's line, so the bends make ONE even arc down the
// handle's far edge — the middle farthest out, index and ring a little less, the little finger least; the
// fingers lie closed against each other, 16–20 mm thick, overlapping a little: one group)
const FINGERS: { name: Digit['name']; w: number; mcpU: number; flex: number; L: [number, number, number]; r: [number, number, number, number] }[] = [
  { name: 'index', flex: 70, w: 28, mcpU: 22, L: [44, 26, 20], r: [10, 9.4, 9.0, 8.2] },
  { name: 'middle', flex: 70, w: 9.5, mcpU: 24, L: [48, 29, 21], r: [10.4, 9.8, 9.4, 8.4] },
  { name: 'ring', flex: 72, w: -9, mcpU: 22, L: [45, 27, 20], r: [9.8, 9.2, 8.8, 8.0] },
  { name: 'little', flex: 76, w: -27.5, mcpU: 17, L: [35, 21, 18], r: [8.8, 8.4, 8.0, 7.4] },
];
/** The palm's thickness (its skin on the handle to the back of the hand). */
const T = 27;

/**
 * The next joint on a digit wrapped round the handle: on the circle of radius ρ about the handle's centre
 * line (c, in the digit's own u–n plane), `L` from `from`, going round the way `turn` says (−1: over the
 * knuckle side and down, the fingers; +1: over the wrist side and down, the thumb), no further than `stop`.
 */
function wrapNext(from: { u: number; n: number }, c: number, rho: number, L: number, turn: 1 | -1, stop: number): { u: number; n: number; a: number } {
  // (the bone lies along the handle: the joint is the far one of the two at length L, hugging the handle)
  let a = Math.atan2(from.n, from.u - c);
  let near = false;
  let best = { u: c + rho * Math.cos(a), n: rho * Math.sin(a), a, d: Infinity };
  for (let k = 0; k < 1440; k++) {
    a += (turn * Math.PI) / 720;
    const p = { u: c + rho * Math.cos(a), n: rho * Math.sin(a) };
    const d = Math.hypot(p.u - from.u, p.n - from.n);
    if (Math.abs(d - L) < best.d) best = { ...p, a, d: Math.abs(d - L) };
    if (d < L) near = true;
    if (near && d >= L) return { ...p, a };
    if (turn * (a - stop) >= 0) return near ? { ...p, a } : best;
  }
  return best;
}

/**
 * A relaxed power grip round a handle of radius R, tilted by β (radians: + its head end toward the
 * knuckles). The fingers wrap from their knuckles over the far (knuckle) edge; the thumb from its mound
 * over the near (wrist) edge, the other way; their ends meet on the handle's front, the side away from the
 * palm.
 */
export function gripModel(R = 13, beta = 0): GripModel {
  const tilt = Math.tan(beta);
  const skin = R + 1;
  const fingers: Digit[] = FINGERS.map((f) => {
    const c = axisU({ tilt }, f.w);
    const mcp = { u: c + f.mcpU, n: skin + T * 0.45 };
    // round the far edge and down onto the front; a relaxed grip: the tips stay on the front (≤ −165°)
    const stop = (-165 * Math.PI) / 180;
    // the first bone out from the knuckle, forward and down past the handle's far edge (a step beyond the knuckles)
    // (a less bent first bone where the handle sits close under that knuckle: it clears the handle)
    let flex = f.flex;
    let pip = { u: 0, n: 0 };
    for (; flex >= 30; flex -= 2) {
      const a1 = (-flex * Math.PI) / 180;
      pip = { u: mcp.u + f.L[0] * Math.cos(a1), n: mcp.n + f.L[0] * Math.sin(a1) };
      if (Math.hypot(pip.u - c, pip.n) >= R + f.r[1] + 0.5) break;
    }
    const dip = wrapNext(pip, c, R + f.r[2], f.L[1], -1, stop);
    const tip = wrapNext(dip, c, R + f.r[3], f.L[2], -1, stop);
    return { name: f.name, pts: [l3(mcp.u, f.w, mcp.n), l3(pip.u, f.w, pip.n), l3(dip.u, f.w, dip.n), l3(tip.u, f.w, tip.n)], r: [...f.r] };
  });
  // the thumb: from its mound (inside the palm's thenar) round the NEAR edge, the other way, onto the front
  // (it lies OVER the index's front, a little toward the head: its pad on the index and middle)
  const wt = 25;
  const ct = axisU({ tilt }, wt);
  const mcpT = { u: ct - 22, n: skin - 4 };
  const stopT = (292 * Math.PI) / 180;
  const ip = wrapNext(mcpT, ct, R + 12.5, 30, 1, stopT);
  const tipT = wrapNext(ip, ct, R + 12.5, 25, 1, stopT);
  // (its pad on the index's and the middle finger's end bones: the tip between them)
  const thumb: Digit = { name: 'thumb', pts: [l3(mcpT.u, 31, mcpT.n), l3(ip.u, 27, ip.n), l3(tipT.u, 19, tipT.n)], r: [10.8, 10, 8.8] };
  const palm = [
    { c: l3(-82, -20, skin + 14), r: 13 },
    { c: l3(-82, 18, skin + 14), r: 13 },
    { c: l3(-56, -28, skin + 11), r: 14 },
    { c: l3(-56, 22, skin + 7), r: 15 },
    { c: l3(-36, 30, skin + 3), r: 13 },
    { c: l3(-26, -22, skin + 13), r: 14 },
    { c: l3(-26, 8, skin + 13), r: 14 },
    // the thumb's mound round its base (the thumb grows out of it: no lobe past the hand)
    { c: l3(mcpT.u - 7, 29, skin + 2), r: 11.5 },
  ];
  const knuckles = fingers.map((f) => ({ c: l3(f.pts[0].u - 2, f.pts[0].w, f.pts[0].n + 1), r: f.r[0] + 0.6 }));
  return { R, tilt, palm, knuckles, fingers, thumb, wrist: l3(-86, -1, skin + 14) };
}

/** Where each digit comes round the handle (its first joint past the palm's side, n < 0): the fingers
 *  round one edge, the thumb round the other, read from the palm (u against the handle's line). */
export function gripRounds(m: GripModel) {
  const round = (d: Digit) => {
    for (let i = 1; i < d.pts.length; i++) if (d.pts[i].n < 0) return d.pts[i];
    return d.pts[d.pts.length - 1];
  };
  const side = (p: L3) => Math.sign(p.u - axisU(m, p.w));
  return {
    fingers: m.fingers.map((f) => ({ name: f.name, at: round(f), side: side(round(f)) })),
    thumb: { at: round(m.thumb), side: side(round(m.thumb)) },
    /** The digits' ends: all on the handle's front (n < 0, the side away from the palm). */
    tips: [...m.fingers, m.thumb].map((d) => d.pts[d.pts.length - 1]),
  };
}

/* ── the grip in the world, and as a view sees it ── */

export type GripFrame = { U: V3; W: V3; N: V3; beta: number; /** how far the wrist turns off the forearm (deg) */ wristTurn: number };

/**
 * The hand's frame in the world from the arm's frame: U the forearm (the wrist straight), the handle h
 * tilted from W toward U by β; β is held within ±28° (a palm takes a handle that obliquely and no more;
 * beyond it the wrist turns the rest, reported).
 */
export function gripFrame(fr: { f: V3; h: V3; d: V3 }, betaMax = (28 * Math.PI) / 180): GripFrame {
  const h = unit3(fr.h);
  const fh = Math.max(-1, Math.min(1, dot3(fr.f, h)));
  const beta0 = Math.asin(fh);
  const beta = Math.max(-betaMax, Math.min(betaMax, beta0));
  let e2 = sub3(fr.f, mul3(h, fh));
  e2 = Math.hypot(e2.x, e2.y, e2.z) < 1e-6 ? unit3(cross3(fr.d, h)) : unit3(e2);
  const U = unit3(add3(mul3(h, Math.sin(beta)), mul3(e2, Math.cos(beta))));
  const W = unit3(sub3(mul3(h, Math.cos(beta)), mul3(e2, Math.sin(beta))));
  const N = unit3(cross3(W, U));
  return { U, W, N, beta, wristTurn: (Math.abs(beta0 - beta) * 180) / Math.PI };
}

const toWorld = (g: GripFrame, o: V3, p: L3): V3 => add3(o, add3(mul3(g.U, p.u), add3(mul3(g.W, p.w), mul3(g.N, p.n))));
const toLocalDir = (g: GripFrame, v: V3): L3 => l3(dot3(v, g.U), dot3(v, g.W), dot3(v, g.N));

export type GripPart = {
  name: 'palm' | 'fingers' | 'thumb';
  /** Behind the handle (painted before the mic) or in front of it. */
  layer: 'behind' | 'front';
  depth: number;
  /** Outlines united into the part's one silhouette. */
  pieces: Poly[];
  /** (round 5) the part's convex body: every piece stays within ~2 mm of it — no lobe, no notch. */
  body?: Poly;
  axis: [Pt, Pt];
  kind: 'palm' | 'digit';
  w: number;
  /** The part's own line where it is not the silhouette (the thumb, open where it grows from the palm). */
  edge: Poly | null;
  gaps: Poly[];
  lights: Ellipse[];
  darks: Ellipse[];
  nails: Poly[];
};

export type PlacedGrip = {
  /** The paint order; the mic between the two layers (or last, looking down the handle). */
  order: (GripPart | 'MIC')[];
  parts: GripPart[];
  wrist: Pt;
  /** The forearm's direction on the page toward the hand (unit times its foreshortening). */
  forearm: Pt;
  /** The forearm runs away from the viewer behind the fist (the knuckle end toward the viewer). */
  sleeveBehind: boolean;
  /** For the tests: the handle's line on the page, and the screen points the rule reads. */
  axis: [Pt, Pt];
  view: { toward: L3 };
  frame: GripFrame;
  model: GripModel;
  /** (step B) the wrist where the forearm meets the heel of the hand (world). */
  wrist3: V3;
};

/** A hull with its long straight runs cut into short even steps: smoothed, its corners round off softly and
 *  its straight runs stay straight (an uneven polygon overshoots into bumps between its clusters of points). */
function evenHull(points: Poly, step = 2.5): Poly {
  const h = hull(points);
  const out: Poly = [];
  for (let i = 0; i < h.length; i++) {
    const a = h[i];
    const b = h[(i + 1) % h.length];
    const d = Math.hypot(b.u - a.u, b.v - a.v);
    const n = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < n; j++) out.push(P(a.u + ((b.u - a.u) * j) / n, a.v + ((b.v - a.v) * j) / n));
  }
  return out;
}

/**
 * Low broad swells on a hull's edge (round 5): over each joint that lies on the edge, a wide shallow cap — a
 * circle `k` times the joint's radius, set in so it stands `rise` mm proud of the edge — so a row of knuckles or
 * bends reads as gentle swells 15–20 mm wide with shallow valleys between, never a row of round lobes.
 */
function swellsOn(edge: Poly, joints: { c: Pt; r: number }[], rise = 1.4, k = 2.2): Poly[] {
  if (edge.length < 3) return [];
  const out: Poly[] = [];
  for (const j of joints) {
    // the nearest point of the edge and its outward normal (the hull runs counter-clockwise or clockwise: the
    // normal is the side away from the hull's middle)
    let best = { d: Infinity, q: edge[0], i: 0 };
    edge.forEach((q, i) => {
      const d = Math.hypot(q.u - j.c.u, q.v - j.c.v);
      if (d < best.d) best = { d, q, i };
    });
    // only a joint whose rim makes the edge there
    if (Math.abs(best.d - j.r) > 1.2) continue;
    const a = edge[(best.i - 3 + edge.length) % edge.length];
    const b = edge[(best.i + 3) % edge.length];
    const t = unit(sub(b, a));
    let nrm = perp(t);
    if ((best.q.u - j.c.u) * nrm.u + (best.q.v - j.c.v) * nrm.v < 0) nrm = mul(nrm, -1);
    // a straight stretch of edge (±10 mm) or no swell: never a lobe at a corner
    const straight = edge.every((q) => Math.hypot(q.u - best.q.u, q.v - best.q.v) > 10 || Math.abs((q.u - best.q.u) * nrm.u + (q.v - best.q.v) * nrm.v) < 1);
    if (!straight) continue;
    const R2 = j.r * k;
    // (only the cap of that wide circle: what stands above a line 1 mm inside the edge)
    const cc = add(best.q, mul(nrm, rise - R2));
    const cap = ring(cc, R2, 96).filter((q) => (q.u - best.q.u) * nrm.u + (q.v - best.q.v) * nrm.v >= -1);
    if (cap.length >= 3) out.push(cap);
  }
  return out;
}

/** A circle's outline (for the palm's hull). */
const ring = (c: Pt, r: number, k = 14): Poly => Array.from({ length: k }, (_, i) => P(c.u + r * Math.cos((2 * Math.PI * i) / k), c.v + r * Math.sin((2 * Math.PI * i) / k)));

/** A digit's line: its outline less what lies inside the palm (it grows out of it there). */
function openEdge(outline: Poly, hand: Poly): Poly {
  const out = outline.map((q) => !inPoly(q, hand));
  const n = outline.length;
  let best: number[] = [];
  for (let s = 0; s < n; s++) {
    if (!out[s] || out[(s - 1 + n) % n]) continue;
    const run: number[] = [];
    for (let k = 0; k < n && out[(s + k) % n]; k++) run.push((s + k) % n);
    if (run.length > best.length) best = run;
  }
  // (wholly inside the hand's outline: no line of its own)
  if (!best.length) return out.some(Boolean) ? outline : [];
  return best.map((i) => outline[i]);
}

/**
 * The grip as a view sees it: `fist` the handle's centre in the middle of the fist (world), `fr` the arm's
 * frame, `toward` the unit vector to the viewer, `proj` the view's projection onto the page (mm).
 */
export function placeGrip(fist: V3, fr: { f: V3; h: V3; d: V3 }, toward: V3, proj: (p: V3) => Pt, R = 13, opts: { /** (step B, the held arm) the forearm's skin from this point (world, under the cuff) into the hand: one skin with the palm */ wristFrom?: V3; /** …or from this point on the page (the cuff's opening) */ wristFrom2?: Pt; /** (step B round 2, the arm's views only — the hand pages stay as approved) the back of the fist turned to the viewer: its four low knuckle swells, the thumb's base where it shows */ back?: boolean } = {}): PlacedGrip {
  const g = gripFrame(fr);
  const m = gripModel(R, g.beta);
  const S = (p: L3) => proj(toWorld(g, fist, p));
  const v = toLocalDir(g, toward);
  // depth toward the viewer, measured from the handle's centre line
  const depthOf = (p: L3) => (p.u - axisU(m, p.w)) * v.u + p.n * v.n;
  const endOn = Math.abs(v.w) > 0.8;
  const layerOf = (p: L3): 'behind' | 'front' => (endOn ? 'behind' : depthOf(p) >= 0 ? 'front' : 'behind');
  const mid = (a: L3, b: L3) => l3((a.u + b.u) / 2, (a.w + b.w) / 2, (a.n + b.n) / 2);
  const outward = (p: L3) => {
    const o = l3(p.u - axisU(m, p.w), 0, p.n);
    const l = Math.hypot(o.u, o.n) || 1;
    return l3(o.u / l, 0, o.n / l);
  };
  const facing = (o: L3) => o.u * v.u + o.w * v.w + o.n * v.n;
  const ax: [Pt, Pt] = [S(l3(axisU(m, -60), -60, 0)), S(l3(axisU(m, 60), 60, 0))];
  const scrDir = (o: L3) => {
    const a = S(l3(0, 0, 0));
    const b = S(o);
    return P(b.u - a.u, b.v - a.v);
  };
  const ellipseAt = (c: L3, rx: number, ry: number, along: L3): Ellipse => {
    const d = scrDir(along);
    return { c: S(c), rx, ry, rot: Math.atan2(d.v, d.u) };
  };

  // the palm: the hull of its spheres
  // (where the thumb lies behind the handle, its mound and bones are inside the palm's one outline: it grows out
  // of the hand, never a lobe past it)
  const thBehind = layerOf(mid(m.thumb.pts[1], m.thumb.pts[2])) === 'behind' && layerOf(l3(-30, 0, R + 1 + T / 2)) === 'behind';
  const thSpheres = thBehind ? m.thumb.pts.map((c, i) => ({ c, r: m.thumb.r[i] + 0.6 })) : [];
  const palmPoly = evenHull([...m.palm, ...thSpheres, ...m.knuckles.map((k) => ({ c: k.c, r: k.r - 1.5 }))].flatMap((s) => ring(S(s.c), s.r)));
  const palmCentre = l3(-30, 0, R + 1 + T / 2);
  // the web between the index and the thumb (its knuckle, its first bone, the thumb's base and first bone):
  // where the palm lies behind the handle, the handle comes out OVER it, so the index runs into the web as one skin
  const web: Poly[] = [];
  if (layerOf(palmCentre) === 'behind') {
    const ix = m.fingers[0];
    const th0 = m.thumb;
    web.push(evenHull([{ c: ix.pts[0], r: ix.r[0] }, { c: ix.pts[1], r: ix.r[1] }, { c: th0.pts[0], r: th0.r[0] }, { c: th0.pts[1], r: th0.r[1] }].flatMap((q) => ring(S(q.c), q.r))));
  }
  // (step B) the wrist: the forearm's skin from under the cuff into the heel of the hand, in the palm's one outline
  const wFrom = opts.wristFrom2 ?? (opts.wristFrom ? proj(opts.wristFrom) : null);
  // (the wrist is an oval, not a round tube: about 52–60 mm across the hand's width (along the handle), and
  // seen edge-on, from the thumb's side, no thicker than the heel of the hand it runs into — never a lump
  // wider than the hand it carries)
  const vq = Math.hypot(v.n, v.w);
  const wristR = (across: number, thick: number) => (vq < 0.15 ? across : Math.sqrt((across * v.n) ** 2 + (thick * v.w) ** 2) / vq);
  const wristSkin = wFrom ? limbOutline([wFrom, S(l3(-78, -1, R + 1 + 13))], [wristR(26, 17), wristR(30, 14)], { capStart: false }) : null;
  const palm: GripPart = {
    name: 'palm',
    layer: layerOf(palmCentre),
    depth: depthOf(palmCentre),
    // (round 5: the knuckles are low broad swells on the hand's one edge — about 1.5 mm proud of it — never a
    // row of round lobes; and where the palm lies behind the handle, the web between the index and the thumb
    // closes the gap at the handle's exit: skin, not a notch)
    body: web.length || wristSkin ? evenHull([...palmPoly, ...web.flat(), ...(wristSkin ?? [])]) : palmPoly,
    pieces: [...(wristSkin ? [wristSkin] : []), palmPoly, ...(v.n < -0.3 ? [] : swellsOn(palmPoly, m.knuckles.map((k) => ({ c: S(k.c), r: k.r - 1.5 })), opts.back ? 0.6 : 1.4, opts.back ? 3.4 : 2.2)), ...web],
    axis: [S(m.wrist), S(l3(18, 0, R + 1 + T / 2))],
    kind: 'palm',
    w: 40,
    edge: null,
    gaps: [],
    lights: [],
    darks: [],
    nails: [],
  };
  // the back of the hand turned to the light; the palm's hollow
  if (v.n > 0.35) palm.lights.push(ellipseAt(l3(-18, 2, R + 1 + T), 22, 15, l3(1, 0, 0)));
  if (v.n < -0.35) palm.darks.push(ellipseAt(l3(-22, 2, R + 1), 18, 11, l3(1, 0, 0)));
  if (opts.back && v.n > 0.3) {
    // (step B round 2) the back of the fist: one row of four LOW knuckle swells — a soft light on each knuckle's
    // head, a soft dark in each valley between, toward the wrist (the tendons' grooves) — never a plain paddle
    const ks = m.knuckles;
    ks.forEach((k) => palm.lights.push(ellipseAt(l3(k.c.u - 2, k.c.w, k.c.n + k.r * 0.6), k.r * 0.62, k.r * 0.44, l3(0, 1, 0))));
    for (let i = 0; i + 1 < ks.length; i++) {
      const a = ks[i].c;
      const b = ks[i + 1].c;
      palm.darks.push(ellipseAt(l3((a.u + b.u) / 2 - 12, (a.w + b.w) / 2, (a.n + b.n) / 2 + 2), 11, 2.6, l3(1, 0, 0)));
    }
    // the thumb's base: where the thumb lies behind the handle its mound is inside the palm's outline — its edge a
    // soft crease along the first bone, on the side it truly shows (its base turned toward the viewer)
    if (thBehind && depthOf(m.thumb.pts[0]) > -R) palm.darks.push(ellipseAt(mid(m.thumb.pts[0], m.thumb.pts[1]), Math.hypot(m.thumb.pts[1].u - m.thumb.pts[0].u, m.thumb.pts[1].w - m.thumb.pts[0].w, m.thumb.pts[1].n - m.thumb.pts[0].n) / 2 + 4, 2.4, l3(m.thumb.pts[1].u - m.thumb.pts[0].u, m.thumb.pts[1].w - m.thumb.pts[0].w, m.thumb.pts[1].n - m.thumb.pts[0].n)));
  }

  // the fingers: each finger's segments into the layer they lie in, united per layer as ONE group
  const segs = (d: Digit) => d.pts.slice(0, -1).map((a, i) => ({ a, b: d.pts[i + 1], ra: d.r[i], rb: d.r[i + 1], i, layer: layerOf(mid(a, d.pts[i + 1])) }));
  const groups: Record<'behind' | 'front', GripPart> = {
    behind: { name: 'fingers', layer: 'behind', depth: 0, pieces: [], axis: ax, kind: 'digit', w: R + 22, edge: null, gaps: [], lights: [], darks: [], nails: [] },
    front: { name: 'fingers', layer: 'front', depth: 0, pieces: [], axis: ax, kind: 'digit', w: R + 22, edge: null, gaps: [], lights: [], darks: [], nails: [] },
  };
  const depths: Record<'behind' | 'front', number[]> = { behind: [], front: [] };
  for (const f of m.fingers) {
    // consecutive segments in one layer drawn as one chain (a smooth bend, not beads)
    let run: { pts: L3[]; r: number[]; layer: 'behind' | 'front' } | null = null;
    const flush = () => {
      if (run && run.pts.length >= 2) groups[run.layer].pieces.push(limbOutline(run.pts.map(S), run.r, { crook: 0.8 }));
      run = null;
    };
    for (const s of segs(f)) {
      depths[s.layer].push(depthOf(mid(s.a, s.b)));
      if (run && run.layer === s.layer) {
        run.pts.push(s.b);
        run.r.push(s.rb);
      } else {
        const prev: L3[] = (run as { pts: L3[] } | null)?.pts ?? [];
        flush();
        run = { pts: [s.a, s.b], r: [s.ra, s.rb], layer: s.layer };
        // (the front run reaches a little back past the joint where the finger comes round, so the two runs
        // overlap and no edge of the handle shows in the crook between them)
        // (round 5: the layer's hull, with the bend's whole joint in it, closes the crook; no overlap point)
        void prev;
      }
    }
    flush();
  }
  // (the fingers lie closed against each other: neighbouring bones in one layer are bridged, so nothing behind
  // shows between them — the gap wedges alone mark where one finger ends and the next begins)
  for (let i = 0; i < m.fingers.length - 1; i++) {
    const A = m.fingers[i];
    const B = m.fingers[i + 1];
    for (let k = 0; k < A.pts.length - 1; k++) {
      const la = layerOf(mid(A.pts[k], A.pts[k + 1]));
      if (la !== layerOf(mid(B.pts[k], B.pts[k + 1]))) continue;
      void la; // (the layer's hull below closes the group; no bridge quads — smoothed, they bulged)
    }
  }
  // (and the group's inside is solid: the hull of the joints in each layer — no pinhole shows the handle)
  for (const k of ['behind', 'front'] as const) {
    // (a joint where a finger comes round — one bone behind the handle, the next in front — belongs to the front
    // too: the finger runs on over its bend as one skin, no notch where the handle would show)
    // (a joint shared by a bone behind the handle and one in front of it belongs to the front only: the part
    // behind never stands out round the front as a second copy of the same row)
    const segL = (f: Digit, j: number) => (j >= 0 && j < f.pts.length - 1 ? layerOf(mid(f.pts[j], f.pts[j + 1])) : null);
    const at = (f: Digit, i: number) => {
      const a = segL(f, i - 1);
      const b = segL(f, i);
      return k === 'front' ? a === 'front' || b === 'front' : (a === 'behind' || b === 'behind') && a !== 'front' && b !== 'front';
    };
    const js = m.fingers.flatMap((f) => f.pts.flatMap((p, i) => (at(f, i) ? ring(S(p), f.r[i], 20) : [])));
    if (js.length >= 3) {
      const eh = evenHull(js);
      groups[k].pieces.push(eh);
      groups[k].body = eh;
      const jt = m.fingers.flatMap((f) => f.pts.flatMap((p, i) => (at(f, i) ? [{ c: S(p), r: f.r[i] }] : [])));
      // (the arm views: lower, broader swells — never a row of equal bumps on the fist's top)
      groups[k].pieces.push(...(opts.back ? swellsOn(eh, jt, 0.6, 3.4) : swellsOn(eh, jt)));
    }
  }
  for (const k of ['behind', 'front'] as const) groups[k].depth = depths[k].length ? depths[k].reduce((a, b) => a + b, 0) / depths[k].length : 0;

  // the gaps between neighbouring fingers: thin wedges along the seam, widest at the tips, nothing at the
  // knuckles — only where the seam faces the viewer
  // (one wedge per pair of fingers: on the most distal stretch of their seam the viewer sees — it opens at
  // the fingers' visible ends, the tips or the bends, and runs out to nothing)
  for (let i = 0; i < m.fingers.length - 1; i++) {
    const A = m.fingers[i];
    const B = m.fingers[i + 1];
    const seam = A.pts.map((p, k) => mid(p, B.pts[k]));
    for (let k = seam.length - 2; k >= 0; k--) {
      if (facing(outward(mid(seam[k], seam[k + 1]))) < (k === 0 ? (v.n > 0.3 ? 0.08 : 0.6) : 0.2)) continue; // (the first bones' seam only where the back of the hand faces the viewer)
      const lay = layerOf(mid(A.pts[k], A.pts[k + 1]));
      const p1 = S(seam[k + 1]);
      const p0 = S(seam[k]);
      // (the arm views: the crease runs further back from the tip, so a fist seen from its knuckle end reads as four
      // fingers, never a block)
      const q0 = add(p0, mul(sub(p1, p0), opts.back ? 0.12 : 0.4));
      if (Math.hypot(p1.u - q0.u, p1.v - q0.v) < (k === 0 ? 8 : 5)) continue; // (seen end-on: no gap to show there)
      const d = unit(sub(p1, q0));
      const nn = perp(d);
      const wd = opts.back ? 2.6 : 2.0;
      const qm = add(q0, mul(sub(p1, q0), 0.5));
      groups[lay].gaps.push([q0, add(qm, mul(nn, wd * 0.22)), add(p1, mul(nn, wd / 2)), add(p1, mul(d, 0.8)), add(p1, mul(nn, -wd / 2)), add(qm, mul(nn, -wd * 0.22))]);
      break;
    }
  }
  // soft swells of light: the knuckles (the back and the knuckle end), the bends round the handle
  for (const f of m.fingers) {
    const k0 = f.pts[0];
    if (facing(unit3l(l3(1, 0, 1))) > 0.25) {
      // (twice: a swell that reads on the lightest skin too)
      const kl = ellipseAt(l3(k0.u - 3, k0.w, k0.n + 9), 7.5, 7, l3(0, 1, 0));
      palm.lights.push(kl, kl);
    }
    const b = f.pts[1];
    if (facing(outward(b)) > 0.3) groups[layerOf(b)].lights.push(ellipseAt(add3l(b, mul3l(outward(b), f.r[1] * 0.45)), 5.5, 6.5, l3(0, 1, 0)));
  }

  // the valleys between the knuckles, where the back of the hand or the knuckle end faces the viewer
  if (facing(unit3l(l3(1, 0, 1))) > 0.25)
    for (let i = 0; i < m.knuckles.length - 1; i++) {
      const a = m.knuckles[i].c;
      const b = m.knuckles[i + 1].c;
      const vy = ellipseAt(l3((a.u + b.u) / 2 - 7, (a.w + b.w) / 2, (a.n + b.n) / 2 + 10), 12, 3.4, l3(1, 0, 0));
      palm.darks.push(vy, vy);
    }

  // the first finger bones turning away beyond the knuckle row (the back of the hand toward the viewer): a soft
  // dark band, so the short step of fingers reads as one group past the knuckles
  if (v.n > 0.3)
    for (const f of m.fingers) {
      const a = f.pts[0];
      const b = f.pts[1];
      const lay = layerOf(mid(a, b));
      groups[lay].darks.push(ellipseAt(l3(a.u + (b.u - a.u) * 0.45, a.w, a.n + (b.n - a.n) * 0.45), 9, 7, l3(0, 1, 0)));
    }

  // the thumb: its own part (a thumb, not a fifth finger), its line open where it leaves the palm
  const th = m.thumb;
  const thLayer = layerOf(mid(th.pts[1], th.pts[2]));
  const thOut = limbOutline(th.pts.map(S), th.r);
  const thumb: GripPart = {
    name: 'thumb',
    layer: thLayer,
    depth: depthOf(mid(th.pts[1], th.pts[2])) + 0.01,
    // (merged into the palm's outline where both lie behind the handle: the thumb is the mound's own form there)
    pieces: thBehind ? [] : [thOut],
    axis: [S(th.pts[0]), S(th.pts[2])],
    kind: 'digit',
    w: 10,
    edge: (() => {
      const e = openEdge(thOut, palmPoly);
      return e.length >= 2 ? e : null;
    })(),
    gaps: [],
    lights: [],
    darks: [],
    nails: [],
  };
  // a faint nail where the thumb's end turns its back to the viewer
  const tipT = th.pts[2];
  if (facing(outward(tipT)) > 0.45) {
    const a = S(th.pts[1]);
    const b = S(tipT);
    const u = unit(sub(b, a));
    const nn = perp(u);
    const c = add(b, mul(u, -2.5));
    thumb.nails.push(Array.from({ length: 10 }, (_, j) => {
      const t = (2 * Math.PI * j) / 10;
      return add(c, add(mul(u, 5 * Math.cos(t)), mul(nn, 3.4 * Math.sin(t))));
    }));
  }

  const parts = [palm, groups.behind, groups.front, thumb].filter((p) => p.pieces.length);
  const byDepth = (p: GripPart, q: GripPart) => p.depth - q.depth;
  const behind = parts.filter((p) => p.layer === 'behind').sort(byDepth);
  const front = parts.filter((p) => p.layer === 'front').sort(byDepth);
  const wrist = S(m.wrist);
  const fdir = proj(g.U);
  const f0 = proj(v3(0, 0, 0));
  return {
    order: [...behind, 'MIC', ...front],
    parts,
    wrist,
    forearm: P(fdir.u - f0.u, fdir.v - f0.v),
    sleeveBehind: v.u > 0.3,
    axis: ax,
    view: { toward: l3(v.u, v.w, v.n) },
    frame: g,
    model: m,
    wrist3: toWorld(g, fist, l3(-78, -1, R + 1 + 13)),
  };
}

const unit3l = (a: L3): L3 => {
  const l = Math.hypot(a.u, a.w, a.n) || 1;
  return l3(a.u / l, a.w / l, a.n / l);
};
const add3l = (a: L3, b: L3): L3 => l3(a.u + b.u, a.w + b.w, a.n + b.n);
const mul3l = (a: L3, k: number): L3 => l3(a.u * k, a.w * k, a.n * k);

/* ── step B: the arm that carries the hand ── */

export type HeldArm = {
  shoulder: V3;
  elbow: V3;
  fist: V3;
  /** The forearm meets the handle at this angle (degrees, 90 = square across the palm). */
  angle: number;
  /** How far the wrist turns off the forearm (degrees; 0 = straight, the hand along the forearm). */
  wristTurn: number;
  /** The hand cannot reach (the fist beyond upper arm + forearm). */
  far: boolean;
  /** The elbow's height over the shoulder (mm, + = above). */
  elbowRise: number;
};

/**
 * The elbow of an arm holding a mic (step B): of the elbows the same arm can take (upper arm `a`, forearm `b`,
 * shoulder and fist fixed — a circle), the one that is anatomically easiest: never above the shoulder, never
 * through the chest (on the arm's own side, `outward`), the forearm meeting the handle near `want` degrees (the
 * grip model's comfortable angle: the wrist stays straight), the elbow otherwise hanging low.
 */
export function heldArmSolve(shoulder: V3, fist: V3, aim: V3, outward: V3, a = 300, b = 290, want = 75, opts: HeldArmOpts = {}): HeldArm {
  if (opts.drop) return heldArmDrop(shoulder, fist, aim, outward, a, b, opts.drop, want);
  const sf = sub3(fist, shoulder);
  const d = Math.hypot(sf.x, sf.y, sf.z);
  const u = unit3(sf);
  const h = unit3(aim);
  const angleOf = (e: V3) => (Math.acos(Math.min(1, Math.abs(dot3(unit3(sub3(fist, e)), h)))) * 180) / Math.PI;
  const finish = (e: V3, far: boolean): HeldArm => {
    const ang = angleOf(e);
    const g = gripFrame(heldFrame(e, fist, aim, 'R', outward));
    return { shoulder, elbow: e, fist, angle: ang, wristTurn: g.wristTurn, far, elbowRise: shoulder.y - e.y };
  };
  if (d >= a + b - 1) return finish(add3(shoulder, mul3(u, (a / (a + b)) * d)), d > a + b);
  const t = (a * a - b * b + d * d) / (2 * d);
  const r = Math.sqrt(Math.max(0, a * a - t * t));
  const c = add3(shoulder, mul3(u, t));
  let e1 = cross3(u, v3(0, 1, 0));
  if (Math.hypot(e1.x, e1.y, e1.z) < 1e-3) e1 = cross3(u, v3(1, 0, 0));
  e1 = unit3(e1);
  const e2 = unit3(cross3(u, e1));
  const ow = unit3(outward);
  const pick = (strict: number) => {
    let best: V3 | null = null;
    let score = Infinity;
    for (let k = 0; k < 360; k += 1) {
      const ph = (k * Math.PI) / 180;
      const e = add3(c, add3(mul3(e1, r * Math.cos(ph)), mul3(e2, r * Math.sin(ph))));
      const above = shoulder.y - e.y; // (+y is down)
      const inward = -dot3(sub3(e, shoulder), ow);
      if (strict >= 1 && above > 20) continue;
      if (strict >= 2 && inward > 60) continue;
      const sc = Math.abs(angleOf(e) - want) + 0.06 * Math.max(0, -(e.y - (shoulder.y + a * 0.75)));
      if (sc < score) {
        score = sc;
        best = e;
      }
    }
    return best;
  };
  const e = pick(2) ?? pick(1) ?? pick(0)!;
  return finish(e, false);
}

/** (step B round 2) How an arm reaching out may hold: `drop` — the elbow as low as the arm allows. */
export type HeldArmOpts = {
  drop?: {
    /** The most the wrist may turn off the forearm (degrees). */
    wristMax: number;
    /** A real reach brings the shoulder forward (the shoulder blade slides round the ribs): up to this many mm
     *  toward the fist when the fist is far out. */
    reach: number;
  };
};

/** The shoulder a reach brings forward: none while the fist is within 460 mm, then half the extra distance, up to `reach` mm. */
export function reachedShoulder(shoulder: V3, fist: V3, reach: number): V3 {
  const sf = sub3(fist, shoulder);
  const d = Math.hypot(sf.x, sf.y, sf.z);
  const k = Math.max(0, Math.min(reach, (d - 460) * 0.5));
  return add3(shoulder, mul3(unit3(sf), k));
}

/**
 * The elbow dropped (step B round 2, the owner's "chicken wing" at B03's guest): of the elbows the arm can take,
 * the one nearest the grip's comfortable angle that also hangs at least 60 mm below the shoulder (each mm higher
 * costs half a degree), its wrist turning no more than `wristMax`, the forearm meeting the handle at 35°–100°,
 * never through the chest — the shoulder brought forward by a reach. When none qualifies, the usual solve.
 */
function heldArmDrop(shoulder0: V3, fist: V3, aim: V3, outward: V3, a: number, b: number, o: NonNullable<HeldArmOpts['drop']>, want = 75): HeldArm {
  const shoulder = reachedShoulder(shoulder0, fist, o.reach);
  const sf = sub3(fist, shoulder);
  const d = Math.hypot(sf.x, sf.y, sf.z);
  if (d >= a + b - 1) return heldArmSolve(shoulder0, fist, aim, outward, a, b);
  const u = unit3(sf);
  const h = unit3(aim);
  const t = (a * a - b * b + d * d) / (2 * d);
  const r = Math.sqrt(Math.max(0, a * a - t * t));
  const c = add3(shoulder, mul3(u, t));
  let e1 = cross3(u, v3(0, 1, 0));
  if (Math.hypot(e1.x, e1.y, e1.z) < 1e-3) e1 = cross3(u, v3(1, 0, 0));
  e1 = unit3(e1);
  const e2 = unit3(cross3(u, e1));
  const ow = unit3(outward);
  let best: { e: V3; ang: number; wt: number; sc: number } | null = null;
  // (when no elbow keeps the wrist within `wristMax` — a mic pointed along the reach — the elbow that turns it least)
  let least: { e: V3; ang: number; wt: number } | null = null;
  for (let k = 0; k < 360; k += 1) {
    const ph = (k * Math.PI) / 180;
    const e = add3(c, add3(mul3(e1, r * Math.cos(ph)), mul3(e2, r * Math.sin(ph))));
    if (shoulder0.y - e.y > 20) continue;
    if (-dot3(sub3(e, shoulder), ow) > 60) continue;
    const ang = (Math.acos(Math.min(1, Math.abs(dot3(unit3(sub3(fist, e)), h)))) * 180) / Math.PI;
    const wt0 = gripFrame(heldFrame(e, fist, aim, 'R', outward)).wristTurn;
    if (!least || wt0 < least.wt - 0.5 || (Math.abs(wt0 - least.wt) <= 0.5 && e.y > least.e.y)) least = { e, ang, wt: wt0 };
    if (ang < 35 || ang > 100) continue;
    const wt = wt0;
    if (wt > o.wristMax) continue;
    // (and never winged out: each mm the elbow sits out past the shoulder costs 0.15°)
    const sc = Math.abs(ang - want) + 0.06 * Math.max(0, shoulder0.y + a * 0.75 - e.y) + 0.5 * Math.max(0, shoulder0.y + 60 - e.y) + 0.15 * Math.max(0, dot3(sub3(e, shoulder), ow));
    if (!best || sc < best.sc) best = { e, ang, wt, sc };
  }
  if (!best) {
    const base = heldArmSolve(shoulder0, fist, aim, outward, a, b);
    if (!least || least.wt >= base.wristTurn) return base;
    return { shoulder, elbow: least.e, fist, angle: least.ang, wristTurn: least.wt, far: false, elbowRise: shoulder0.y - least.e.y };
  }
  return { shoulder, elbow: best.e, fist, angle: best.ang, wristTurn: best.wt, far: false, elbowRise: shoulder0.y - best.e.y };
}
