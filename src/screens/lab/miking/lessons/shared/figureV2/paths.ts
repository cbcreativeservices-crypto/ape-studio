/**
 * FIGURE V2 — the plan's control points as Skia paths (D78, 2026-11-22).
 * Built ONCE per plan (a WeakMap on the plan object, itself memoised per pose
 * in sidePlan.ts): nothing is rebuilt per frame or per render.
 */
import { PathOp, Skia } from '@shopify/react-native-skia';
import { HAND, type HandSkeleton, type HandView, type V3 } from '../players/handModel.ts';
import { handAsMass, handLayers, type HandLayers } from '../hand/anatomy/drawAnatomy.ts';
import type { Ellipse, SidePlan } from './sidePlan.ts';
import { LIGHT, type Poly, type Pt } from './geom.ts';

export type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

/** A smooth closed outline through control points (Catmull-Rom as cubics). */
export function smoothClosed(raw: readonly Pt[], tension = 0.5): SkPath {
  const p = make();
  // Repeated points (a joint met from both sides) would kink the curve.
  const points = raw.filter((q, i) => {
    const r = raw[(i + raw.length - 1) % raw.length];
    return Math.hypot(q.u - r.u, q.v - r.v) > 0.05;
  });
  const n = points.length;
  if (n < 3) return p;
  const at = (i: number) => points[(i + n) % n];
  p.moveTo(points[0].u, points[0].v);
  const k = tension / 3;
  // A handle never longer than ~half its own segment: a long side meeting a
  // short end (a hem, a cuff) turns the corner without flicking past it.
  const handle = (du: number, dv: number, seg: number) => {
    const l = Math.hypot(du, dv) * k;
    const m = seg * 0.5;
    return l > m && l > 0 ? m / l : 1;
  };
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const seg = Math.hypot(p2.u - p1.u, p2.v - p1.v);
    const a = handle(p2.u - p0.u, p2.v - p0.v, seg);
    const b = handle(p3.u - p1.u, p3.v - p1.v, seg);
    p.cubicTo(p1.u + (p2.u - p0.u) * k * a, p1.v + (p2.v - p0.v) * k * a, p2.u - (p3.u - p1.u) * k * b, p2.v - (p3.v - p1.v) * k * b, p2.u, p2.v);
  }
  p.close();
  return p;
}

/** An open smooth curve through points (ends held). */
export function smoothOpen(points: readonly Pt[]): SkPath {
  const p = make();
  const n = points.length;
  if (!n) return p;
  p.moveTo(points[0].u, points[0].v);
  const at = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    p.cubicTo(p1.u + (p2.u - p0.u) / 6, p1.v + (p2.v - p0.v) / 6, p2.u - (p3.u - p1.u) / 6, p2.v - (p3.v - p1.v) / 6, p2.u, p2.v);
  }
  return p;
}

export function ellipsePath(e: Ellipse): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(-e.rx, -e.ry, e.rx * 2, e.ry * 2));
  const m = Skia.Matrix();
  m.translate(e.c.u, e.c.v);
  m.rotate(e.rot);
  p.transform(m);
  return p;
}

export const op = (a: SkPath, b: SkPath, o: PathOp): SkPath => Skia.Path.MakeFromOp(a, b, o) ?? a;
export const unionOf = (...ps: SkPath[]): SkPath => ps.reduce((a, b) => op(a, b, PathOp.Union));

/** The lit edge of a mass: the path less itself moved away from the light. */
const rimCache = new WeakMap<SkPath, Map<number, SkPath>>();
export function rimOf(path: SkPath, w: number): SkPath {
  let m = rimCache.get(path);
  if (!m) {
    m = new Map();
    rimCache.set(path, m);
  }
  const hit = m.get(w);
  if (hit) return hit;
  const q = path.copy();
  q.offset(-LIGHT.u * w, -LIGHT.v * w);
  const r = op(path, q, PathOp.Difference);
  m.set(w, r);
  return r;
}

/** One hand on its stick: the anatomical layers (painted by HandV2) and how
 *  the stick passes through the fist in this view.
 *   • ACROSS the view (the stick seen side-on): the plane through the stick's
 *     axis, square to the viewer, splits the hand — the fingers wrapped round
 *     the stick's far side are painted before it, the thumb and the fingers in
 *     front after it;
 *   • END-ON (the stick runs away from the viewer, as the right hand's does
 *     toward the hi-hat): the stick is painted under the whole fist, and only
 *     its butt, where it leaves the heel of the hand toward the viewer, is
 *     painted again over it (`buttShow`). */
export type HandBuilt = {
  L: HandLayers;
  endOn: boolean;
  buttShow: SkPath | null;
  /** ONE SKIN FORM per side of the stick: every part (the palm with the
   *  webbing between the fingers' roots, each digit) united — the silhouette
   *  that is filled first; the shading goes inside it. */
  formFront: SkPath;
  formBack: SkPath | null;
  /** Where one part lies over another, and the joints' creases: soft creases
   *  inside the form, never outlines. */
  creases: SkPath;
  /** The knuckles (on the back of the hand and at the middle joints) and the
   *  fingertips: where the skin is a touch warmer and redder. */
  warmFront: SkPath;
  warmBack: SkPath;
  /** The stick's own line through the grip (butt → bead), for its shadow on the hand. */
  stickLine: SkPath;
  /** The stick's body there (Ø 14 mm), as a shape (the hand's shadow falls on it). */
  stickBody: SkPath;
  /** The hand's own forms that face the viewer, each with its light (+) or
   *  shade (−) from the key light: the thenar pad, the hollow of the palm, the
   *  hypothenar edge and the heel, the tendons fanning on the back of the hand
   *  to the knuckles. Soft shapes, drawn inside the palm. */
  formsLight: SkPath;
  formsDark: SkPath;
  tendons: SkPath;
  /** The palm's own creases where the palm faces the viewer (soft). */
  palmLines: SkPath;
  /** Across the palm from the back of the hand (a) to the palm's face (b):
   *  the two big planes of the hand turn in the light along it. */
  palmAxis: { a: Pt; b: Pt };
};

/** The webbing between neighbouring fingers' roots (the skin that joins them
 *  above the knuckles' palm side): a quad from each knuckle to ≈ 40 % along
 *  each proximal bone. */
function webbing(sk: HandSkeleton, P: (q: V3) => Pt): SkPath {
  const out = make();
  for (let i = 0; i < 3; i++) {
    const a = sk.fingers[i].joints;
    const b = sk.fingers[i + 1].joints;
    const at = (j: V3[], t: number) => P({ x: j[0].x + (j[1].x - j[0].x) * t, y: j[0].y + (j[1].y - j[0].y) * t, z: j[0].z + (j[1].z - j[0].z) * t });
    const q = [P(a[0]), at(a, 0.42), at(b, 0.42), P(b[0])];
    out.moveTo(q[0].u, q[0].v);
    for (const r of q.slice(1)) out.lineTo(r.u, r.v);
    out.close();
  }
  return out;
}

function handBuilt(sk: HandSkeleton, view: HandView, fore: number, fulcrum: V3, dir: V3): HandBuilt {
  const o = view({ x: 0, y: 0, z: 0 }).d;
  const toward = { x: view({ x: 1, y: 0, z: 0 }).d - o, y: view({ x: 0, y: 1, z: 0 }).d - o, z: view({ x: 0, y: 0, z: 1 }).d - o };
  const k = toward.x * dir.x + toward.y * dir.y + toward.z * dir.z;
  const endOn = Math.abs(k) > 0.72;
  let L: HandLayers;
  if (!endOn) {
    let n = { x: toward.x - dir.x * k, y: toward.y - dir.y * k, z: toward.z - dir.z * k };
    const l = Math.hypot(n.x, n.y, n.z) || 1;
    n = { x: n.x / l, y: n.y / l, z: n.z / l };
    L = handLayers(sk, view, { fore, cut: { p: fulcrum, n }, bare: true, wristBack: 4, v2: true });
  } else {
    L = handLayers(sk, view, { fore, bare: true, wristBack: 4, v2: true });
  }
  const P = (q: V3): Pt => {
    const r = view(q);
    return { u: r.u, v: r.v };
  };
  // The palm carries the webbing (one skin with the fingers' roots).
  const web = webbing(sk, P);
  const parts = L.parts.map((p) => (p.kind === 'palm' ? { ...p, path: op(p.path, web, PathOp.Union) } : p));
  const L2: HandLayers = { ...L, parts };
  const front = parts.filter((p) => !p.back).map((p) => p.path);
  const back = parts.filter((p) => p.back).map((p) => p.path);
  const formFront = front.length ? unionOf(...front) : make();
  const formBack = back.length ? unionOf(...back) : null;
  const mass = handAsMass(L2);
  // Warm spots: the knuckle heads (the back of the hand), the middle joints, the fingertips.
  const warm = (keep: (q: V3) => boolean) => {
    const w = make();
    for (const f of sk.fingers) {
      const j = f.joints;
      for (const [q, r] of [
        [j[0], f.r[0] * 0.9],
        [j[1], f.r[1] * 0.8],
        [j[3], f.r[3] * 0.9],
      ] as const) {
        if (!keep(q)) continue;
        const c = P(q);
        w.addCircle(c.u, c.v, r);
      }
    }
    const t = sk.thumb.joints;
    const c = P(t[3]);
    w.addCircle(c.u, c.v, sk.thumb.r[3] * 0.9);
    return w;
  };
  const cutN = !endOn ? { x: toward.x - dir.x * k, y: toward.y - dir.y * k, z: toward.z - dir.z * k } : null;
  const isBack = (q: V3) => (cutN ? (q.x - fulcrum.x) * cutN.x + (q.y - fulcrum.y) * cutN.y + (q.z - fulcrum.z) * cutN.z < 0 : false);
  const a = P({ x: fulcrum.x - dir.x * 116, y: fulcrum.y - dir.y * 116, z: fulcrum.z - dir.z * 116 });
  const b = P({ x: fulcrum.x + dir.x * 290, y: fulcrum.y + dir.y * 290, z: fulcrum.z + dir.z * 290 });
  const stickLine = make();
  stickLine.moveTo(a.u, a.v);
  stickLine.lineTo(b.u, b.v);
  const sl = Math.hypot(b.u - a.u, b.v - a.v) || 1;
  const nx = (-(b.v - a.v) / sl) * 7;
  const ny = ((b.u - a.u) / sl) * 7;
  const stickBody = make();
  stickBody.moveTo(a.u + nx, a.v + ny);
  stickBody.lineTo(b.u + nx, b.v + ny);
  stickBody.lineTo(b.u - nx, b.v - ny);
  stickBody.lineTo(a.u - nx, a.v - ny);
  stickBody.close();
  let buttShow: SkPath | null = null;
  if (endOn) {
    // The half of the picture on the butt's side of the fulcrum, less the fist.
    const f = view(fulcrum);
    const bb = view({ x: fulcrum.x - dir.x * 100, y: fulcrum.y - dir.y * 100, z: fulcrum.z - dir.z * 100 });
    const du = bb.u - f.u;
    const dv = bb.v - f.v;
    const dl = Math.hypot(du, dv) || 1;
    const ux = du / dl;
    const uy = dv / dl;
    const half = make();
    half.moveTo(f.u - uy * 600, f.v + ux * 600);
    half.lineTo(f.u + uy * 600, f.v - ux * 600);
    half.lineTo(f.u + uy * 600 + ux * 600, f.v - ux * 600 + uy * 600);
    half.lineTo(f.u - uy * 600 + ux * 600, f.v + ux * 600 + uy * 600);
    half.close();
    buttShow = op(half, formBack ? unionOf(formFront, formBack) : formFront, PathOp.Difference);
  }
  // THE HAND'S OWN FORMS (hand frame: x along the hand from the wrist crease,
  // y toward the little finger, z out of the back), each drawn where it faces
  // the viewer, light where it faces the key light (upper left, a little
  // toward the viewer), shade where it turns away.
  const f = sk.frame;
  const inF = (x: number, y: number, z: number): V3 => ({ x: f.o.x + f.x.x * x + f.y.x * y + f.z.x * z, y: f.o.y + f.x.y * x + f.y.y * y + f.z.y * z, z: f.o.z + f.x.z * x + f.y.z * y + f.z.z * z });
  const dirF = (x: number, y: number, z: number): V3 => {
    const q = { x: f.x.x * x + f.y.x * y + f.z.x * z, y: f.x.y * x + f.y.y * y + f.z.y * z, z: f.x.z * x + f.y.z * y + f.z.z * z };
    const l = Math.hypot(q.x, q.y, q.z) || 1;
    return { x: q.x / l, y: q.y / l, z: q.z / l };
  };
  const tw = Math.hypot(toward.x, toward.y, toward.z) || 1;
  const cam = { x: toward.x / tw, y: toward.y / tw, z: toward.z / tw };
  const l3 = (() => {
    // The key light in the view's own terms: up-left on the picture, a little toward the viewer.
    const u = { x: view({ x: 1, y: 0, z: 0 }).u - view({ x: 0, y: 0, z: 0 }).u, y: view({ x: 0, y: 1, z: 0 }).u - view({ x: 0, y: 0, z: 0 }).u, z: view({ x: 0, y: 0, z: 1 }).u - view({ x: 0, y: 0, z: 0 }).u };
    const v = { x: view({ x: 1, y: 0, z: 0 }).v - view({ x: 0, y: 0, z: 0 }).v, y: view({ x: 0, y: 1, z: 0 }).v - view({ x: 0, y: 0, z: 0 }).v, z: view({ x: 0, y: 0, z: 1 }).v - view({ x: 0, y: 0, z: 0 }).v };
    const q = { x: u.x * LIGHT.u + v.x * LIGHT.v + cam.x * 0.5, y: u.y * LIGHT.u + v.y * LIGHT.v + cam.y * 0.5, z: u.z * LIGHT.u + v.z * LIGHT.v + cam.z * 0.5 };
    const l = Math.hypot(q.x, q.y, q.z) || 1;
    return { x: q.x / l, y: q.y / l, z: q.z / l };
  })();
  const d3 = (a3: V3, b3: V3) => a3.x * b3.x + a3.y * b3.y + a3.z * b3.z;
  const formsLight = make();
  const formsDark = make();
  const FORMS: { p: [number, number, number]; n: [number, number, number]; r: number; hollow?: boolean }[] = [
    { p: [34, -22, -15], n: [0, -0.45, -0.9], r: 15 }, // the thenar pad
    { p: [62, 4, -15], n: [0, 0, -1], r: 14, hollow: true }, // the hollow of the palm
    { p: [42, 30, -9], n: [0, 0.75, -0.65], r: 13 }, // the hypothenar edge
    { p: [14, 22, -6], n: [-0.3, 0.6, -0.7], r: 12 }, // the heel of the hand
    { p: [56, 36, 2], n: [0, 1, 0], r: 12 }, // the little finger's edge
  ];
  for (const F of FORMS) {
    const nW = dirF(...F.n);
    if (d3(nW, cam) < 0.22) continue;
    const c = P(inF(...F.p));
    const lit = !F.hollow && d3(nW, l3) > 0.05;
    (lit ? formsLight : formsDark).addCircle(c.u, c.v, F.r);
  }
  const tendons = make();
  if (d3(dirF(0, 0, 1), cam) > 0.22) {
    // The back of the hand: the extensor tendons fanning from the wrist to each knuckle.
    for (const g of sk.fingers) {
      const k0 = g.joints[0];
      const w0 = P(inF(12, (HAND.fingers[sk.fingers.indexOf(g)].mcp.y as number) * 0.35, HAND.thick / 2));
      const k1 = P({ x: k0.x + f.z.x * (HAND.thick / 2), y: k0.y + f.z.y * (HAND.thick / 2), z: k0.z + f.z.z * (HAND.thick / 2) });
      tendons.moveTo(w0.u, w0.v);
      tendons.lineTo(w0.u + (k1.u - w0.u) * 0.85, w0.v + (k1.v - w0.v) * 0.85);
    }
  }
  const palmLines = make();
  if (d3(dirF(0, 0, -1), cam) > 0.3) {
    // The distal palmar crease under the fingers' roots, and the crease that runs
    // in from the index side across the palm (soft lines, not drawn ones).
    const crease = (pts: [number, number][]) => {
      const q = pts.map(([x, y]) => P(inF(x, y, -HAND.thick / 2 - 0.5)));
      palmLines.moveTo(q[0].u, q[0].v);
      for (let i = 1; i < q.length; i++) {
        const m = { u: (q[i - 1].u + q[i].u) / 2, v: (q[i - 1].v + q[i].v) / 2 };
        palmLines.quadTo(q[i - 1].u, q[i - 1].v, m.u, m.v);
      }
      palmLines.lineTo(q[q.length - 1].u, q[q.length - 1].v);
    };
    crease([[86, -30], [82, -8], [76, 14], [66, 32]]);
    crease([[80, -36], [66, -14], [52, 10]]);
  }
  const palmAxis = { a: P(inF(50, 4, HAND.thick / 2 + 6)), b: P(inF(50, 4, -HAND.thick / 2 - 6)) };
  return { L: L2, endOn, buttShow, formFront, formBack, formsLight, formsDark, tendons, palmLines, palmAxis, creases: mass.lines, warmFront: warm((q) => !isBack(q)), warmBack: warm(isBack), stickLine, stickBody };
}

/** An authored hand (authoredHands.ts), as paths: each part's outline (far
 *  to near), the united silhouette behind and in front of the stick, its
 *  creases, nails, warm spots and soft lights and darks, and the stick's
 *  body and its butt stub (the part nearer the viewer than the fist). */
export type ArtPaths = {
  parts: { path: SkPath; axis: [Pt, Pt]; layer: 'back' | 'front'; kind: string; name: string; edge?: SkPath | null; shade?: [Pt, Pt] | null }[];
  /** The parts' own drawn lines (a thumb's outer edge and gap line), for the lite level. */
  edges: SkPath | null;
  back: SkPath | null;
  front: SkPath;
  all: SkPath;
  creases: SkPath;
  nails: SkPath[];
  warm: SkPath;
  lights: SkPath[];
  darks: SkPath[];
  stickBody: SkPath;
  stickLine: SkPath;
  stub: SkPath | null;
  stubCap: SkPath | null;
  endOn: boolean;
  /** The stick lies UNDER the whole hand (the view from above: the back of the hand over it). */
  stickUnder: boolean;
  /** A hand holding nothing (at rest: wave 3 of D78). */
  rest: boolean;
  /** (wave 3) The gaps between the fingers of one group (thin wedges, darkest at the tips). */
  gaps: SkPath | null;
  /** (wave 3) Soft contact shadows on what the hand rests on. */
  contact: SkPath | null;
};

function bar(a: Pt, b: Pt, r: number): SkPath {
  const l = Math.hypot(b.u - a.u, b.v - a.v) || 1;
  const nx = (-(b.v - a.v) / l) * r;
  const ny = ((b.u - a.u) / l) * r;
  const p = make();
  p.moveTo(a.u + nx, a.v + ny);
  p.lineTo(b.u + nx, b.v + ny);
  p.lineTo(b.u - nx, b.v - ny);
  p.lineTo(a.u - nx, a.v - ny);
  p.close();
  return p;
}

function artPaths(h: NonNullable<SidePlan['arms']['near']['placed']>, wrist: { poly: Poly; axis: [Pt, Pt]; bones: Ellipse[] } | null): ArtPaths {
  // The visible wrist is the hand's first part: one skin, one light with the
  // palm it widens into (no seam, no change of value at the join).
  const wristPart = wrist ? [{ path: smoothClosed(wrist.poly, 0.5), axis: wrist.axis, layer: 'back' as const, kind: 'wrist', name: 'wrist' }] : [];
  // Every part — each digit too — is ONE closed outline (owner 2026-11-23: "i see 9 fingers"):
  // a finger is a single form, never a union of bones and joint discs.
  const parts = [...wristPart, ...h.parts.map((q) => ({ path: smoothClosed(q.placed, q.kind === 'palm' ? 0.45 : 0.5), axis: q.placedAxis, layer: q.layer, kind: q.kind, name: q.name, edge: q.placedEdge ? smoothOpen(q.placedEdge) : null, shade: q.placedShade }))];
  const edgeList = parts.map((q) => ('edge' in q ? q.edge : null)).filter((e): e is SkPath => !!e);
  const edges = edgeList.length ? (() => {
    const e = make();
    for (const q of edgeList) e.addPath(q);
    return e;
  })() : null;
  const backs = parts.filter((q) => q.layer === 'back').map((q) => q.path);
  const fronts = parts.filter((q) => q.layer === 'front').map((q) => q.path);
  const back = backs.length ? unionOf(...backs) : null;
  const front = fronts.length ? unionOf(...fronts) : make();
  const warm = make();
  for (const w of h.warm) warm.addCircle(w.c.u, w.c.v, w.r);
  const stickLine = make();
  stickLine.moveTo(h.butt.u, h.butt.v);
  stickLine.lineTo(h.bead.u, h.bead.v);
  const endOn = h.art.view === 'fistEdge';
  let stub: SkPath | null = null;
  let stubCap: SkPath | null = null;
  if (endOn) {
    // The shaft from where it leaves the fist to its end: one round-ended form (a capsule),
    // the end itself a disc (the stick points almost at the viewer).
    const endA = make();
    endA.addCircle(h.stubEnd.u, h.stubEnd.v, 7);
    stub = unionOf(bar(h.butt, h.stubEnd, 7), endA);
    stubCap = make();
    stubCap.addCircle(h.butt.u, h.butt.v, 7);
    stub = unionOf(stub, stubCap);
  }
  return {
    parts,
    edges,
    back,
    front,
    all: back ? unionOf(back, front) : front,
    creases: many(h.creases, false),
    nails: h.nails.map((n) => smoothClosed(n, 0.5)),
    warm,
    lights: [...h.lights, ...(wrist ? wrist.bones : [])].map(ellipsePath),
    darks: h.darks.map(ellipsePath),
    stickBody: bar(h.butt, h.bead, 7),
    stickLine,
    stub,
    stubCap,
    endOn,
    stickUnder: h.art.view === 'backTop' || h.art.view === 'holdSide',
    rest: h.art.view === 'restSide' || h.art.view === 'restFlat' || h.art.view === 'restFlatThumb' || h.art.view === 'restTop',
    gaps: h.gaps && h.gaps.length ? many(h.gaps) : null,
    contact: h.contact && h.contact.length ? (() => {
      const c = make();
      for (const e of h.contact) c.addPath(ellipsePath(e));
      return c;
    })() : null,
  };
}

export type ArmPaths = {
  /** The cuff's opening (sidePlan `opening`): the ellipse's area; the cuff's
   *  cloth (opaque, ending at the near half of the rim); the rim's near and far
   *  halves and the seam (open curves); `toViewer`: the inside shows. */
  opening: SkPath;
  cuffCloth: SkPath;
  /** (from above) the cuff's open edge: its sides and near rim only. */
  cuffEdge: SkPath | null;
  rimNear: SkPath;
  rimFar: SkPath | null;
  seam: SkPath;
  toViewer: boolean;
  /** The half of the picture behind the sleeve's mouth (toward the elbow), for an arm running away. */
  behindMouth: SkPath | null;
  upper: SkPath;
  foreSleeve: SkPath;
  cuff: SkPath;
  wristSkin: SkPath;
  ulna: SkPath;
  folds: SkPath;
  armhole: SkPath;
  hand: HandBuilt | null;
  art: ArtPaths | null;
};
export type ShoePaths = { upper: SkPath; sole: SkPath; laces: SkPath; contact: SkPath };
export type SidePaths = {
  skull: SkPath;
  neck: SkPath;
  jaw: SkPath;
  jawShadow: SkPath;
  scm: SkPath;
  hair: SkPath;
  clumps: SkPath[];
  sheen: SkPath;
  ear: SkPath;
  earRim: SkPath;
  earFold: SkPath;
  earBowl: SkPath;
  brow: SkPath;
  eye: SkPath;
  iris: SkPath;
  lid: SkPath;
  lidCrease: SkPath;
  socket: SkPath;
  noseSide: SkPath;
  ala: SkPath;
  alaCrease: SkPath;
  nostril: SkPath;
  nasolabial: SkPath;
  lips: SkPath;
  mouth: SkPath;
  underLip: SkPath;
  cheekShade: SkPath;
  lights: SkPath[];
  shirt: SkPath;
  collar: SkPath;
  /** The collar's own shadow on the shirt below it, and the neck's darkening above it. */
  collarShadow: SkPath;
  neckOcclusion: SkPath;
  belt: SkPath;
  beltTop: SkPath;
  beltLoop: SkPath;
  buckle: SkPath;
  blouse: SkPath;
  waistFolds: SkPath;
  trousersNear: SkPath;
  legFar: SkPath;
  legFoldsNear: SkPath;
  legFoldsFar: SkPath;
  shinNear: SkPath;
  shinFar: SkPath;
  kneeNear: SkPath;
  kneeFar: SkPath;
  near: ArmPaths;
  far: ArmPaths;
  shoeNear: ShoePaths;
  shoeFar: ShoePaths;
  seatShadow: SkPath | null;
  /** The near arm's shadow on the shirt (the arm moved away from the light, kept on the shirt). */
  armShadow: SkPath;
  /** (wave 3) A collared shirt's placket (open). */
  placket: SkPath | null;
};

const many = (ps: readonly Poly[], closed = true): SkPath => {
  const p = make();
  for (const q of ps) p.addPath(closed ? smoothClosed(q) : smoothOpen(q));
  return p;
};

const FLAT_VIEWS = new Set(['restFlat', 'restFlatThumb', 'restTop']);

export function armPaths(a: SidePlan['arms']['near'], view: HandView): ArmPaths {
  const fore = Math.atan2(a.wrist.v - a.elbow.v, a.wrist.u - a.elbow.u);
  return {
    opening: ellipsePath(a.opening.e),
    // Turned toward the viewer the end of the tube IS the opening (the cloth stops at
    // the near rim); turned away, the cloth wraps over it up to the near rim.
    cuffCloth: smoothClosed(a.cuff, 0.3),
    cuffEdge: a.cuffEdge ? smoothOpen(a.cuffEdge) : null,
    rimNear: smoothOpen(a.opening.rimNear),
    rimFar: a.opening.rimFar ? smoothOpen(a.opening.rimFar) : null,
    seam: smoothOpen(a.opening.seam),
    toViewer: a.opening.toViewer,
    behindMouth: a.mouth
      ? (() => {
          const { p, n } = a.mouth;
          const t = { u: -n.v, v: n.u };
          const q = make();
          q.moveTo(p.u + t.u * 900, p.v + t.v * 900);
          q.lineTo(p.u - t.u * 900, p.v - t.v * 900);
          q.lineTo(p.u - t.u * 900 - n.u * 900, p.v - t.v * 900 - n.v * 900);
          q.lineTo(p.u + t.u * 900 - n.u * 900, p.v + t.v * 900 - n.v * 900);
          q.close();
          // the sleeve's mouth is an ellipse seen at the forearm's angle: its lip bulges toward the hand
          return op(q, ellipsePath(a.opening.e), PathOp.Union);
        })()
      : null,
    upper: smoothClosed(a.upper),
    foreSleeve: smoothClosed(a.foreSleeve),
    cuff: smoothClosed(a.cuff),
    wristSkin: smoothClosed(a.wristSkin),
    ulna: ellipsePath(a.ulna),
    folds: many(a.folds),
    armhole: smoothOpen(a.armhole),
    hand: a.hold && !a.placed ? handBuilt(a.hold.sk, view, fore, a.hold.fulcrum, a.hold.dir) : null,
    // (a hand on a desk carries its own forearm on under the cuff: no separate wrist piece, which stood up as a block)
    art: a.placed ? artPaths(a.placed, a.away || FLAT_VIEWS.has(a.placed.art.view) ? null : { poly: a.wristSkin, axis: a.foreAxis, bones: [a.ulna, a.radiusBone] }) : null,
  };
}

function shoePaths(s: SidePlan['shoes']['near']): ShoePaths {
  const laces = make();
  for (const l of s.laces) {
    laces.moveTo(l[0].u, l[0].v);
    laces.lineTo(l[1].u, l[1].v);
  }
  return { upper: smoothClosed(s.upper, 0.35), sole: smoothClosed(s.sole, 0.2), laces, contact: ellipsePath(s.contact) };
}

const pathCache = new WeakMap<SidePlan, SidePaths>();

const moved = (p: SkPath, du: number, dv: number) => {
  const q = p.copy();
  q.offset(du, dv);
  return q;
};

/** Every path of the figure for a plan (built once per plan). */
export function sidePaths(plan: SidePlan): SidePaths {
  const hit = pathCache.get(plan);
  if (hit) return hit;
  const h = plan.head;
  const skull = smoothClosed(h.skull, 0.5);
  const neck = smoothClosed(h.neck, 0.5);
  const shirt = smoothClosed(plan.shirt, 0.5);
  const near = armPaths(plan.arms.near, plan.view);
  const legNear = unionOf(smoothClosed(plan.legs.near.outline, 0.5), smoothClosed(plan.legs.near.lower, 0.4));
  const legFar = unionOf(smoothClosed(plan.legs.far.outline, 0.5), smoothClosed(plan.legs.far.lower, 0.4));
  const seat = smoothClosed(plan.seat, 0.5);
  const collar = smoothClosed(plan.collar, 0.5);
  const shadow = near.upper.copy();
  shadow.offset(-LIGHT.u * 22, -LIGHT.v * 22);
  const out: SidePaths = {
    skull,
    neck,
    jaw: smoothOpen(h.jaw),
    jawShadow: smoothClosed(h.jawShadow, 0.5),
    scm: smoothClosed(h.scm, 0.5),
    hair: smoothClosed(h.hair, 0.45),
    clumps: h.clumps.map((c) => smoothClosed(c, 0.5)),
    sheen: smoothOpen(h.sheen),
    ear: smoothClosed(h.ear, 0.55),
    earRim: smoothOpen(h.earRim),
    earFold: smoothOpen(h.earFold),
    earBowl: smoothClosed(h.earBowl, 0.55),
    brow: smoothClosed(h.brow, 0.5),
    eye: smoothClosed(h.eye, 0.45),
    iris: smoothClosed(h.iris, 0.45),
    lid: smoothClosed(h.lid, 0.4),
    lidCrease: smoothOpen(h.lidCrease),
    socket: ellipsePath(h.socket),
    noseSide: smoothClosed(h.noseSide, 0.5),
    ala: smoothClosed(h.ala, 0.5),
    alaCrease: smoothOpen(h.alaCrease),
    nostril: smoothClosed(h.nostril, 0.5),
    nasolabial: smoothOpen(h.nasolabial),
    lips: smoothClosed(h.lips, 0.5),
    mouth: smoothOpen(h.mouth),
    underLip: ellipsePath(h.underLip),
    cheekShade: ellipsePath(h.cheekShade),
    lights: h.lights.map(ellipsePath),
    shirt,
    collar,
    collarShadow: op(moved(collar, -LIGHT.u * 7, -LIGHT.v * 7), collar, PathOp.Difference),
    neckOcclusion: op(neck, moved(collar, 0, -12), PathOp.Intersect),
    belt: op(smoothClosed(plan.belt, 0.35), unionOf(shirt, seat), PathOp.Intersect),
    beltTop: smoothOpen(plan.beltTop),
    beltLoop: op(smoothClosed(plan.beltLoop, 0.2), unionOf(shirt, seat), PathOp.Intersect),
    buckle: op(smoothClosed(plan.buckle, 0.2), unionOf(shirt, seat), PathOp.Intersect),
    blouse: op(smoothClosed(plan.blouse, 0.4), shirt, PathOp.Intersect),
    waistFolds: many(plan.waistFolds),
    trousersNear: unionOf(seat, legNear),
    legFar,
    legFoldsNear: many(plan.legs.near.folds),
    legFoldsFar: many(plan.legs.far.folds),
    shinNear: op(legNear, smoothClosed(plan.legs.near.shinSide, 0), PathOp.Intersect),
    shinFar: op(legFar, smoothClosed(plan.legs.far.shinSide, 0), PathOp.Intersect),
    kneeNear: ellipsePath(plan.legs.near.kneeLight),
    kneeFar: ellipsePath(plan.legs.far.kneeLight),
    near,
    far: armPaths(plan.arms.far, plan.view),
    shoeNear: shoePaths(plan.shoes.near),
    shoeFar: shoePaths(plan.shoes.far),
    seatShadow: plan.seatShadow ? ellipsePath(plan.seatShadow) : null,
    armShadow: op(shadow, shirt, PathOp.Intersect),
    placket: plan.dress?.placket ? smoothOpen(plan.dress.placket) : null,
  };
  pathCache.set(plan, out);
  return out;
}
