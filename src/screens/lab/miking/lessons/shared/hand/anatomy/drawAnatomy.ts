/**
 * THE MIKING HAND — the drawing's geometry (hands redesign 2026-10-24).
 *
 * A posed skeleton (players/handModel.ts) projected into a view and built as
 * the parts an illustrator draws, painted back to front:
 *   • the PALM MASS — the wrist column tapering out to the heel of the hand,
 *     the palm, the thenar pad at the thumb's base and the four knuckle heads
 *     (one form, no seams);
 *   • each FINGER BONE as a tapered form — fuller at its joints, a fleshy pad
 *     on the palm side, the fingertip rounded past the last joint — the bones
 *     of one finger joined into one form wherever nothing passes between them;
 *   • the THUMB's two phalanges the same way.
 * Parts are sorted by depth (the nearest painted last), so a finger that
 * wraps BEHIND what the hand holds is hidden by it, and every finger in
 * front overlaps its neighbour with its own edge. Each part carries its own
 * detail — the knuckle creases on a finger's back, the soft light on the
 * knuckle heads, the nail on the last bone — so whatever covers a part also
 * covers its detail.
 *
 * Built once per pose and view (callers memoise); nothing moves (D8).
 */
import { PathOp, Skia } from '@shopify/react-native-skia';
import { h3, HAND, type Digit, type HandSkeleton, type HandView, type V3 } from '../../players/handModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P2 = { u: number; v: number };
const make = () => Skia.Path.Make();
const p2 = (u: number, v: number): P2 => ({ u, v });

/** The sleeve's cuff ends this far behind the wrist crease (PlayerFigure ARM.cuffGap). */
const CUFF_GAP = 16;

/* ── 2-D primitives ── */

function capsule(a: P2, b: P2, ra: number, rb: number): SkPath {
  const p = make();
  const d = Math.hypot(b.u - a.u, b.v - a.v);
  if (d <= Math.abs(ra - rb) + 0.5) {
    const big = ra >= rb ? { c: a, r: ra } : { c: b, r: rb };
    p.addCircle(big.c.u, big.c.v, big.r);
    return p;
  }
  const th = Math.atan2(b.v - a.v, b.u - a.u);
  const ph = Math.acos((ra - rb) / d);
  const deg = 180 / Math.PI;
  const a1 = [a.u + ra * Math.cos(th + ph), a.v + ra * Math.sin(th + ph)];
  const b1 = [b.u + rb * Math.cos(th + ph), b.v + rb * Math.sin(th + ph)];
  const a2 = [a.u + ra * Math.cos(th - ph), a.v + ra * Math.sin(th - ph)];
  p.moveTo(a1[0], a1[1]);
  p.lineTo(b1[0], b1[1]);
  p.arcToOval(Skia.XYWHRect(b.u - rb, b.v - rb, rb * 2, rb * 2), (th + ph) * deg, -2 * ph * deg, false);
  p.lineTo(a2[0], a2[1]);
  p.arcToOval(Skia.XYWHRect(a.u - ra, a.v - ra, ra * 2, ra * 2), (th - ph) * deg, -(360 - 2 * ph * deg), false);
  p.close();
  return p;
}
function circle(c: P2, r: number): SkPath {
  const p = make();
  p.addCircle(c.u, c.v, r);
  return p;
}
function boundsHold(outer: SkPath, inner: SkPath): boolean {
  const a = outer.computeTightBounds();
  const b = inner.computeTightBounds();
  if (b.width <= 0 && b.height <= 0) return true;
  return a.x <= b.x + 1 && a.y <= b.y + 1 && a.x + a.width >= b.x + b.width - 1 && a.y + a.height >= b.y + b.height - 1;
}
/** A robust union (Skia's path ops can return a wrong result for some exact
 *  coordinates: checked against both bounds, retried, nudged). */
function unite(a: SkPath, b: SkPath): SkPath {
  const ok = (r: SkPath | null): r is SkPath => !!r && boundsHold(r, a) && boundsHold(r, b);
  const r1 = Skia.Path.MakeFromOp(a, b, PathOp.Union);
  if (ok(r1)) return r1;
  const r2 = Skia.Path.MakeFromOp(b, a, PathOp.Union);
  if (ok(r2)) return r2;
  for (const [dx, dy] of [
    [0.11, -0.07],
    [-0.13, 0.17],
    [0.29, 0.23],
  ]) {
    const bb = b.copy();
    bb.offset(dx, dy);
    const r3 = Skia.Path.MakeFromOp(a, bb, PathOp.Union);
    if (ok(r3)) return r3;
  }
  return r1 ?? a;
}
export function unionAll(ps: readonly (SkPath | null | undefined)[]): SkPath {
  let out: SkPath | null = null;
  for (const p of ps) {
    if (!p) continue;
    out = out ? unite(out, p) : p;
  }
  return out ?? make();
}
const minus = (a: SkPath, b: SkPath | null): SkPath => (b ? (Skia.Path.MakeFromOp(a, b, PathOp.Difference) ?? a) : a);
const inter = (a: SkPath, b: SkPath): SkPath => Skia.Path.MakeFromOp(a, b, PathOp.Intersect) ?? make();

/** A smooth closed outline through points (Catmull–Rom as cubics). */
function smoothClosed(pts: P2[], tension = 0.5): SkPath {
  const p = make();
  const n = pts.length;
  if (n < 3) return p;
  const at = (i: number) => pts[(i + n) % n];
  p.moveTo(pts[0].u, pts[0].v);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const q = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 3;
    p.cubicTo(p1.u + (q.u - p0.u) * k, p1.v + (q.v - p0.v) * k, q.u - (p3.u - p1.u) * k, q.v - (p3.v - p1.v) * k, q.u, q.v);
  }
  p.close();
  return p;
}
/** An open smooth stroke (Catmull–Rom, the ends held). */
function curveOpen(pts: P2[]): SkPath {
  const p = make();
  p.moveTo(pts[0].u, pts[0].v);
  if (pts.length === 2) {
    p.lineTo(pts[1].u, pts[1].v);
    return p;
  }
  const n = pts.length;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const q = at(i + 1);
    const p3 = at(i + 2);
    const k = 1 / 6;
    p.cubicTo(p1.u + (q.u - p0.u) * k, p1.v + (q.v - p0.v) * k, q.u - (p3.u - p1.u) * k, q.v - (p3.v - p1.v) * k, q.u, q.v);
  }
  return p;
}
/** The convex hull of picture points (monotone chain). */
function hull(points: P2[]): P2[] {
  const p = [...points].sort((a, b) => a.u - b.u || a.v - b.v);
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) => (a.u - o.u) * (b.v - o.v) - (a.v - o.v) * (b.u - o.u);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/* ── the parts ── */

export type HandPartKind = 'palm' | 'finger' | 'thumb';
export type HandPart = {
  kind: HandPartKind;
  /** The digit (fingers 0 … 3 index … little; the thumb 4); −1 the palm. */
  digit: number;
  path: SkPath;
  /** Larger = nearer the viewer. */
  depth: number;
  /** Behind the held object's plane (painted before the object). */
  back: boolean;
  /** Fine lines drawn with the part (knuckle creases, the thenar crease). */
  lines: SkPath;
  /** Soft light on the part (the knuckle heads). */
  glints: SkPath;
  /** Soft shade on the part (the valleys between the metacarpals). */
  soft: SkPath;
  /** The nail on this part, if its back faces the viewer. */
  nail: SkPath | null;
};

export type HandLayers = {
  parts: HandPart[];
  /** Every part in front of the cut, as one outline (the contour, the shadow). */
  front: SkPath;
  /** The parts behind the cut, as one outline (null when none). */
  behind: SkPath | null;
  /** The whole hand's bounds (one light for every part). */
  box: { x: number; y: number; width: number; height: number };
  /** The wrist column's run in the picture: from its back end to the wrist
   *  crease (the paint fades the hand in along it over a bare forearm). */
  wristRun: { a: { u: number; v: number }; b: { u: number; v: number } } | null;
};

export type DrawOpts = {
  /** The forearm's direction in the picture (radians): the wrist column runs
   *  back along it to the cuff's edge, cut square there. */
  fore?: number;
  /** A forearm reaching toward the viewer: no wrist column runs back. */
  foreshortened?: boolean;
  /** The plane through what the hand holds: parts behind it are `back`. */
  cut?: { p: V3; n: V3 };
  /** A bare forearm drawn by the art itself (no sleeve): the wrist column is
   *  not cut at a cuff and runs back only `wristBack` mm (default 0), so the
   *  hand meets the art's own forearm at the wrist crease. */
  bare?: boolean;
  wristBack?: number;
};

/** The wrist trimmed square at the cuff's edge (CUFF_GAP behind the crease). */
function trimAtCuff(path: SkPath, w: P2, fore: number): SkPath {
  const c = Math.cos(fore);
  const s = Math.sin(fore);
  const P = (x: number, y: number) => [w.u + x * c - y * s, w.v + x * s + y * c] as const;
  const back = -CUFF_GAP;
  const q = make();
  const a = P(back, -400);
  const b = P(back, 400);
  const d = P(back - 600, 400);
  const e = P(back - 600, -400);
  q.moveTo(a[0], a[1]);
  q.lineTo(b[0], b[1]);
  q.lineTo(d[0], d[1]);
  q.lineTo(e[0], e[1]);
  q.close();
  return minus(path, q);
}

/**
 * The hand as painted parts, back to front. Pure geometry (Skia paths); the
 * paint is AnatomicalHand.tsx (and PlayerFigure.drawHand3 for the art that
 * paints the hand as one mass).
 */
export function handLayers(sk: HandSkeleton, view: HandView, opts: DrawOpts = {}): HandLayers {
  const P = (q: V3): P2 => {
    const r = view(q);
    return p2(r.u, r.v);
  };
  const D = (q: V3) => view(q).d;
  const f = sk.frame;
  const o0 = D(v3z());
  const toward: V3 = {
    x: D({ x: 1, y: 0, z: 0 }) - o0,
    y: D({ x: 0, y: 1, z: 0 }) - o0,
    z: D({ x: 0, y: 0, z: 1 }) - o0,
  };
  const facing = (n: V3) => h3.dot(n, toward); // > 0: n points at the viewer
  const behindOf = (q: V3) => (opts.cut ? h3.dot(h3.sub(q, opts.cut.p), opts.cut.n) < 0 : false);
  const at = (x: number, y: number, z: number) => h3.add(f.o, h3.add(h3.mul(f.x, x), h3.add(h3.mul(f.y, y), h3.mul(f.z, z))));
  const shift = (q: V3, n: V3, k: number) => h3.add(q, h3.mul(n, k));

  /* THE PALM MASS: wrist column → heel → palm → knuckle heads, the thenar pad. */
  const w1 = P(f.o);
  const heel = P(at(24, 0, 0));
  const palmPts = sk.palm.map(P);
  const palmHull = smoothClosed(hull(palmPts), 0.3);
  const pieces: SkPath[] = [palmHull];
  // The wrist: an oval ≈ 55 mm across and ≈ 38 mm thick (never a round
  // column: seen from the side it is thinner than it is wide), narrower than
  // the heel of the hand (≈ 66 × 34 mm), widening into it over ≈ 24 mm.
  const ring = (x: number, hw: number, ht: number) => {
    const out: P2[] = [];
    for (let k = 0; k < 16; k++) {
      const t = (k / 16) * Math.PI * 2;
      out.push(P(at(x, Math.cos(t) * hw, Math.sin(t) * ht)));
    }
    return out;
  };
  let wristRun: HandLayers['wristRun'] = null;
  const wr = HAND.wristHalf;
  const wristRing = ring(0, wr, 19);
  pieces.push(smoothClosed(hull([...wristRing, ...ring(24, wr + 5, 17)]), 0.3));
  if (!opts.foreshortened) {
    // The column back toward the forearm, along the forearm's own picture
    // direction (the wrist bends at its joint), as wide as the oval seen that way.
    const runBack = opts.bare ? (opts.wristBack ?? 0) : CUFF_GAP + 26;
    const fd = opts.fore ?? Math.atan2(heel.v - w1.v, heel.u - w1.u);
    const nU = -Math.sin(fd);
    const nV = Math.cos(fd);
    let half = 0;
    for (const q of wristRing) half = Math.max(half, Math.abs((q.u - w1.u) * nU + (q.v - w1.v) * nV));
    const back = p2(w1.u - Math.cos(fd) * runBack, w1.v - Math.sin(fd) * runBack);
    wristRun = {
      a: back,
      b: p2(w1.u + Math.cos(fd) * 10, w1.v + Math.sin(fd) * 10),
    };
    if (runBack > 1) {
      let col = capsule(back, w1, half - 0.5, half);
      if (opts.fore !== undefined && !opts.bare) col = trimAtCuff(col, w1, opts.fore);
      pieces.push(col);
    }
  }
  // The thenar pad: the thumb's metacarpal inside the fleshy mound at its base.
  const tj = sk.thumb.joints;
  pieces.push(capsule(P(tj[0]), P(tj[1]), sk.thumb.r[0] - 1, sk.thumb.r[1]));
  // The four knuckle heads (the metacarpal heads): rounded where each finger leaves the palm.
  for (const dg of sk.fingers) {
    // A flexed knuckle stands out: the metacarpal head rounds the fist's edge.
    const bend = Math.max(0, h3.dot(h3.unit(h3.sub(dg.joints[1], dg.joints[0])), h3.mul(f.z, -1)));
    pieces.push(circle(P(shift(shift(dg.joints[0], f.z, 1.5 + 2.2 * bend), f.x, 1.5 * bend)), dg.r[0] + 0.6 + 0.6 * bend));
  }
  const palmPath = unionAll(pieces);
  const pc = sk.palm.reduce((s, q) => h3.add(s, h3.mul(q, 1 / sk.palm.length)), { x: 0, y: 0, z: 0 });
  // Its depth: its centre, brought forward by the palm's half-thickness when
  // a face (back or palm) turns to the viewer.
  const palmDepth = D(pc) + Math.abs(facing(f.z)) * (HAND.thick / 2 + 2);
  const palmLines = make();
  const palmGlints = make();
  const palmSoft = make();
  if (facing(f.z) > 0.35) {
    // The back of the hand: soft light on each knuckle head, and the soft
    // valleys between the metacarpals running back from between the
    // knuckles toward the wrist (what makes a back of the hand read as one;
    // short and soft — never stripes).
    for (const dg of sk.fingers) {
      const k = P(shift(dg.joints[0], f.z, dg.r[0] * 0.9));
      const e = P(shift(shift(dg.joints[0], f.z, dg.r[0] * 0.9), h3.unit(h3.sub(dg.joints[1], dg.joints[0])), 6));
      palmGlints.addPath(curveOpen([p2(k.u - (e.u - k.u) * 0.5, k.v - (e.v - k.v) * 0.5), k]));
    }
    for (let i = 0; i < 3; i++) {
      const A = sk.fingers[i].joints[0];
      const B = sk.fingers[i + 1].joints[0];
      const m = h3.mul(h3.add(A, B), 0.5);
      const g0 = shift(shift(m, f.z, HAND.thick / 2 + 1), f.x, -8);
      const g1 = shift(shift(m, f.z, HAND.thick / 2), f.x, -30);
      palmSoft.addPath(curveOpen([P(g0), P(g1)]));
    }
  } else if (facing(f.z) < -0.45) {
    // The palm: the thenar crease, round the base of the thumb (one line, no stripes).
    const a = P(at(84, -30, -HAND.thick / 2));
    const b = P(at(56, -18, -HAND.thick / 2 - 2));
    const c = P(at(26, -10, -HAND.thick / 2 - 1));
    palmLines.addPath(curveOpen([a, b, c]));
  }
  const parts: HandPart[] = [
    {
      kind: 'palm',
      digit: -1,
      path: palmPath,
      depth: palmDepth,
      back: behindOf(pc),
      lines: palmLines,
      glints: palmGlints,
      soft: palmSoft,
      nail: null,
    },
  ];

  /* THE DIGITS, bone by bone. */
  const digits: Digit[] = [...sk.fingers, sk.thumb];
  type Bone = {
    digit: number;
    k: number;
    path: SkPath;
    depth: number;
    back: boolean;
    lines: SkPath;
    nail: SkPath | null;
  };
  const bones: Bone[] = [];
  digits.forEach((dg, di) => {
    const isThumb = di === 4;
    const js = dg.joints;
    for (let k = isThumb ? 1 : 0; k < 3; k++) {
      const a = js[k];
      const b = js[k + 1];
      const L = h3.len(h3.sub(b, a)) || 1;
      const dir = h3.mul(h3.sub(b, a), 1 / L);
      const palmar = h3.mul(dg.dorsal[k], -1);
      const ra = dg.r[k];
      const rb = dg.r[k + 1];
      // The bone: a tapered form, a touch fuller at its joints.
      const shapes: SkPath[] = [capsule(P(a), P(b), ra * 1.02, rb * 1.0)];
      // The pad on the palm side, in the middle of the bone.
      const mid = h3.add(a, h3.mul(dir, L * 0.52));
      shapes.push(circle(P(shift(mid, palmar, (ra + rb) * 0.07)), (ra + rb) * 0.46));
      // The knuckle on the back of a bent joint (the head of the bone before).
      if (k > 0 || isThumb) shapes.push(circle(P(shift(a, dg.dorsal[k - 1] ?? dg.dorsal[k], ra * 0.06)), ra * 1.0));
      if (k === 2) {
        // The fingertip: rounded just past the last joint's centre, a little
        // narrower than the pad behind it (no ball on the end).
        const tip = h3.add(b, h3.mul(dir, rb * 0.55));
        shapes.push(capsule(P(h3.add(a, h3.mul(dir, L * 0.5))), P(tip), (ra + rb) * 0.5, rb * 0.82));
      }
      const path = unionAll(shapes);
      const lines = make();
      // Creases over a joint whose back faces the viewer: the middle joint's
      // two short folds, the end joint's one (curved round the finger).
      if (k > 0 && !isThumb) {
        const n = dg.dorsal[k];
        if (facing(n) > 0.3) {
          const across = h3.unit(h3.sub(h3.sub(f.y, h3.mul(dir, h3.dot(f.y, dir))), h3.mul(n, h3.dot(f.y, n))));
          const hw = ra * 0.5;
          const folds = k === 1 ? [-2.2, 1.4] : [0];
          for (const off of folds) {
            const c = shift(shift(a, dir, off), n, ra * 0.95);
            const q0 = P(shift(c, across, -hw));
            const q1 = P(shift(shift(c, dir, 1.4), n, 0.5));
            const q2 = P(shift(c, across, hw));
            lines.addPath(curveOpen([q0, q1, q2]));
          }
        }
      }
      // The palm side of a joint facing the viewer: one flexion crease.
      if (k > 0 && !isThumb) {
        const n = h3.mul(dg.dorsal[k], -1);
        if (facing(n) > 0.45) {
          const across = h3.unit(h3.sub(h3.sub(f.y, h3.mul(dir, h3.dot(f.y, dir))), h3.mul(n, h3.dot(f.y, n))));
          const c = shift(a, n, ra * 0.9);
          lines.addPath(curveOpen([P(shift(c, across, -ra * 0.55)), P(shift(c, dir, -0.8)), P(shift(c, across, ra * 0.55))]));
        }
      }
      // The nail: on the last bone's back, its free edge toward the tip.
      let nail: SkPath | null = null;
      if (k === 2) {
        const n = dg.dorsal[2];
        if (facing(n) > 0.15) {
          const acr0 = h3.sub(h3.sub(f.y, h3.mul(dir, h3.dot(f.y, dir))), h3.mul(n, h3.dot(f.y, n)));
          const acr = h3.len(acr0) > 1e-3 ? h3.unit(acr0) : f.y;
          const rT = dg.r[3];
          const c = h3.add(h3.add(a, h3.mul(dir, L * 0.66)), h3.mul(n, rT * 0.78));
          const hl = Math.min(L * 0.34, rT * 1.05);
          const hw = rT * 0.7;
          const ring: P2[] = [];
          for (let s = 0; s < 14; s++) {
            const t = (s / 14) * Math.PI * 2;
            const ct = Math.cos(t);
            // Squarer at the cuticle, rounder at the free edge.
            const al = Math.sign(ct) * Math.pow(Math.abs(ct), ct > 0 ? 0.9 : 0.6) * hl;
            const ac = Math.sin(t) * hw * (ct > 0 ? 0.94 : 1);
            ring.push(P(h3.add(c, h3.add(h3.mul(dir, al), h3.mul(acr, ac)))));
          }
          nail = inter(smoothClosed(ring, 0.5), path);
        }
      }
      const midD = h3.mul(h3.add(a, b), 0.5);
      bones.push({
        digit: di,
        k,
        path,
        depth: D(midD),
        back: behindOf(midD),
        lines,
        nail,
      });
    }
  });
  // ONE FORM PER DIGIT (on each side of the cut): its bones joined, no seam
  // at a joint; a digit's own curl hides its own far bones. Its depth: the
  // mean of its bones' (a curled finger seen from the back of the hand sits
  // behind the palm and shows past the knuckles; seen from the palm side it
  // lies in front of it).
  const merged: HandPart[] = [];
  for (let di = 0; di < 5; di++)
    for (const back of [true, false]) {
      const bs = bones.filter((b) => b.digit === di && b.back === back);
      if (!bs.length) continue;
      const lines = make();
      let nail: SkPath | null = null;
      for (const b of bs) {
        lines.addPath(b.lines);
        if (b.nail) nail = b.nail;
      }
      merged.push({
        kind: di === 4 ? 'thumb' : 'finger',
        digit: di,
        path: unionAll(bs.map((b) => b.path)),
        depth: bs.reduce((s2, b) => s2 + b.depth, 0) / bs.length,
        back,
        lines,
        glints: make(),
        soft: make(),
        nail,
      });
    }
  const all: { depth: number; part: HandPart }[] = [];
  for (const p of [...parts, ...merged]) all.push({ depth: p.depth, part: p });
  // Behind-the-cut first, then by depth.
  all.sort((x, y) => Number(y.part.back) - Number(x.part.back) || x.depth - y.depth);
  const ordered = all.map((e) => e.part);
  // A digit's nail shows only where nothing nearer covers it.
  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i];
    if (!p.nail) continue;
    const later = ordered.slice(i + 1).filter((q) => q.back === p.back);
    if (later.length) p.nail = minus(p.nail, unionAll(later.map((q) => q.path)));
  }
  const frontParts = ordered.filter((p) => !p.back);
  const backParts = ordered.filter((p) => p.back);
  const front = unionAll(frontParts.map((p) => p.path));
  const behind = backParts.length ? unionAll(backParts.map((p) => p.path)) : null;
  const bAll = (behind ? unionAll([front, behind]) : front).computeTightBounds();
  return {
    parts: ordered,
    front,
    behind,
    box: { x: bAll.x, y: bAll.y, width: bAll.width, height: bAll.height },
    wristRun,
  };
}
const v3z = (): V3 => ({ x: 0, y: 0, z: 0 });

/** The runs of `path`'s outline where `keep` holds just outside it, as open
 *  strokes added to `out` (sampled every ≈ 2 mm). */
export function edgeOver(path: SkPath, keep: (u: number, v: number) => boolean, out: SkPath): void {
  const it = Skia.ContourMeasureIter(path, true, 1);
  let guard = 0;
  for (let c = it.next(); c && guard < 256; c = it.next(), guard++) {
    const L = Number(c.length());
    if (!(L > 0)) continue;
    const n = Math.max(4, Math.ceil(L / 2));
    let open = false;
    for (let i = 0; i <= n; i++) {
      const pt2 = c.getPosTan((i / n) * L);
      const pos = pt2?.[0];
      const tan = pt2?.[1];
      if (!pos || !tan || typeof pos.x !== 'number') return;
      const q1 = [pos.x + tan.y * 2.5, pos.y - tan.x * 2.5] as const;
      const q2 = [pos.x - tan.y * 2.5, pos.y + tan.x * 2.5] as const;
      const outside = path.contains(q1[0], q1[1]) ? q2 : q1;
      const k = keep(outside[0], outside[1]);
      if (k && !open) {
        out.moveTo(pos.x, pos.y);
        open = true;
      } else if (k) out.lineTo(pos.x, pos.y);
      else open = false;
    }
  }
}

/**
 * The hand as ONE mass plus its lines (the shape PlayerFigure.drawHand3 has
 * always returned, for art that paints a hand with one FigureMass): the
 * outline in front of the cut, the outline behind it, every inner edge where
 * a part lies over another (a finger over its neighbour, the thumb over the
 * palm) with the parts' own creases, and the nails.
 */
export function handAsMass(L: HandLayers): {
  path: SkPath;
  behind: SkPath | null;
  lines: SkPath;
  nails: SkPath;
} {
  const lines = make();
  const nails = make();
  for (const back of [true, false]) {
    const group = L.parts.filter((p) => p.back === back);
    for (let i = 0; i < group.length; i++) {
      const p = group[i];
      // What is drawn later covers this part's lines and edges.
      const later = group.slice(i + 1);
      const cover = later.length ? unionAll(later.map((q) => q.path)) : null;
      if (i > 0) {
        const under = unionAll(group.slice(0, i).map((q) => q.path));
        const edge = make();
        edgeOver(p.path, (u, v) => under.contains(u, v) && !(cover?.contains(u, v) ?? false), edge);
        if (!back) lines.addPath(edge);
      }
      if (!back) {
        const own = cover ? clipStroke(p.lines, cover) : p.lines;
        lines.addPath(own);
        if (p.nail) nails.addPath(p.nail);
      }
    }
  }
  return { path: L.front, behind: L.behind, lines, nails };
}

/** Open strokes minus what lies under a covering outline (sampled). */
function clipStroke(s: SkPath, cover: SkPath): SkPath {
  const out = make();
  const it = Skia.ContourMeasureIter(s, false, 1);
  let guard = 0;
  for (let c = it.next(); c && guard < 256; c = it.next(), guard++) {
    const L = Number(c.length());
    if (!(L > 0)) continue;
    const n = Math.max(3, Math.ceil(L / 1.5));
    let open = false;
    for (let i = 0; i <= n; i++) {
      const pt2 = c.getPosTan((i / n) * L);
      const pos = pt2?.[0];
      if (!pos || typeof pos.x !== 'number') return out;
      const keep = !cover.contains(pos.x, pos.y);
      if (keep && !open) {
        out.moveTo(pos.x, pos.y);
        open = true;
      } else if (keep) out.lineTo(pos.x, pos.y);
      else open = false;
    }
  }
  return out;
}

/** The light and shade of one part (its lit crescent toward the upper left,
 *  its core shadow toward the lower right), cached per path. */
const lookCache = new WeakMap<SkPath, { rim: SkPath; core: SkPath }>();
export function partLook(path: SkPath, rimW = 3.2, coreW = 9): { rim: SkPath; core: SkPath } {
  const hit = lookCache.get(path);
  if (hit) return hit;
  const shifted = (dx: number, dy: number) => {
    const q = path.copy();
    q.offset(dx, dy);
    return q;
  };
  const look = {
    rim: minus(path, shifted(rimW * 0.8, rimW)),
    core: minus(path, shifted(-coreW * 0.75, -coreW)),
  };
  lookCache.set(path, look);
  return look;
}
