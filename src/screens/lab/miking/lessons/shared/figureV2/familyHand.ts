/**
 * FIGURE V2 — A POSED 3-D HAND, IN THE APPROVED LOOK (wave 5 of D78, the
 * families with their own geometry, 2026-11-24). Pure: no React, no Skia.
 *
 * The families that hold an instrument (bowed strings, brass, saxophones,
 * woodwinds, lutes, free reeds) already pose ONE adult hand bone by bone on
 * what it plays (players/handModel.ts: each pad solved onto its string, key or
 * valve; the bow hold, the stopping hand, researched and passed on 2026-10-10
 * and 2026-10-15). That skeleton is kept exactly — every contact stays where
 * it is — and only its DRAWING is new, in the language of the passed hands
 * (authoredHands, heldHands):
 *   • ONE silhouette from the cuff: the wrist's skin runs out of the sleeve's
 *     opening into the heel of the hand (no square patch, no gap);
 *   • the palm is one form with its knuckle row (the knuckles are the edge of
 *     one convex form — never a row of round bumps) and the thumb's mound;
 *   • the thumb GROWS out of that mound (its metacarpal is the mound itself);
 *     its own line is open where it leaves the palm;
 *   • ONE FINGER = ONE SHAPE: each finger a single tapering form through its
 *     three joints (no beads at the joints); where two touching fingers bend
 *     side by side their bends are bridged, so the row reads as one gentle
 *     edge, and they are told apart by the nearer finger's own line, drawn
 *     from the middle joint out to the tip (the gap starts at the tip);
 *   • a hand split by what it holds (the thumb under a bow's stick, behind a
 *     neck): its parts in two layers, behind and in front of the instrument.
 * View-agnostic: any orthographic projection (u, v on the page, d toward the
 * viewer).
 */
import { HAND, h3, inFrame, type HandSkeleton, type HandView, type V3 } from '../players/handModel.ts';
import { add, dist, hull, inPoly, limbOutline, mul, P, sub, unit, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';

export type FamPartName = 'palm' | 'thumb' | 'index' | 'middle' | 'ring' | 'little';
export type FamLayer = 'behind' | 'front';

export type FamPart = {
  name: FamPartName;
  layer: FamLayer;
  /** toward the viewer (larger = nearer) */
  depth: number;
  /** Outlines united into the part's one silhouette. */
  pieces: Poly[];
  /** The part's own form (no bridges): the outline its line is read from. */
  form: Poly;
  /** The form's axis on the page (its across-light runs square to it) and width. */
  axis: [Pt, Pt];
  w: number;
  kind: 'palm' | 'digit';
  /** (a digit growing out of the hand — its run starts at its root joint) where it grows from, and its first bone's length on the page */
  root?: Pt;
  rootLen?: number;
  /** (a digit whose end bone slopes away from the viewer) from its end joint to its tip on the page, and how much
   *  it slopes away (0–1): the painter shades it softly toward the tip. */
  tipAway?: { from: Pt; to: Pt; k: number };
};

export type FamHand = {
  /** Paint order: the behind layer far → near, then the front layer far → near. */
  parts: FamPart[];
  /** Open runs: a part's own line where it lies over a farther part of the hand. */
  edges: { layer: FamLayer; pts: Poly }[];
  /** Between two neighboring fingers: a shallow crease from the tips back toward the knuckles (`w` its
   *  strength: 1 at the tips, fading). */
  creases: { layer: FamLayer; pts: Poly; w: number }[];
  /** The nails turned toward the viewer (very faint). */
  nails: { layer: FamLayer; pts: Poly }[];
  /** Soft lights: the knuckles' low swells when the back of the hand faces the viewer. */
  lights: { layer: FamLayer; e: Ellipse }[];
  /** The wrist on the page (the hand's frame origin). */
  wrist: Pt;
  box: { u0: number; v0: number; u1: number; v1: number };
};

type Opts = {
  /** A plane through what the hand holds, square to the view: parts on its −n side are BEHIND. */
  cut?: { p: V3; n: V3 } | null;
  /** Where the wrist's skin comes out of the cuff (the opening's centre, a little out): on the page. */
  from?: Pt | null;
};

/**
 * The palm as a VOLUME (hand frame: x wrist → knuckles, y across toward the little finger, z out of the back):
 * the back nearly flat and a little rounded at its edges; the palm side carrying the heel's pads (thicker than
 * the wrist, ≈ 40 mm through the heel), thinning to the finger roots (≈ 26 mm). Seen from its edge the hand is
 * a wedge with the heel's swell — never an even column (a flat 28 mm slab read as a paddle). The skeleton's
 * own points are kept inside it (the hull takes both).
 */
function palmVolume(f: HandSkeleton['frame']): V3[] {
  const ringXY: [number, number][] = [
    [2, -26],
    [34, -38],
    [70, -36],
    [96, -35],
    [103, -8.5],
    [99, 11],
    [89, 34],
    [52, 37],
    [14, 31],
    [2, 26],
  ];
  // (the palm side's depth along the hand: the wrist, the heel's pads, the hollow, the finger roots' pads)
  const palmar = (x: number) => (x < 8 ? -12 : x < 22 ? -12 - ((x - 8) / 14) * 9 : x < 58 ? -21 : x < 88 ? -21 + ((x - 58) / 30) * 7 : -14);
  const out: V3[] = [];
  for (const [x, y] of ringXY) {
    const edge = Math.abs(y) > 30 ? 0.7 : 1;
    out.push(inFrame(f, x, y, (x < 8 ? 11 : 13) * edge));
    out.push(inFrame(f, x, y * 0.92, palmar(x) * (Math.abs(y) > 30 ? 0.8 : 1)));
  }
  // the heel's two pads (the thumb's mound is its own form; the little finger's side here)
  out.push(inFrame(f, 30, 22, -23), inFrame(f, 46, 8, -22));
  return out;
}

const ring = (c: Pt, r: number, k = 16): Poly => Array.from({ length: k }, (_, i) => P(c.u + r * Math.cos((2 * Math.PI * i) / k), c.v + r * Math.sin((2 * Math.PI * i) / k)));

/** Outward normal-ish sample points round a closed outline (every ≈ `step` mm). */
function samples(poly: Poly, step = 2): { q: Pt; n: Pt }[] {
  const out: { q: Pt; n: Pt }[] = [];
  // orientation: positive area = counter-clockwise in (u, v)
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    area += a.u * b.v - b.u * a.v;
  }
  const sgn = area >= 0 ? 1 : -1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const d = dist(a, b);
    if (d < 1e-6) continue;
    const t = unit(sub(b, a));
    // (counter-clockwise: the outside is to the right of travel)
    const n = mul(P(t.v, -t.u), sgn);
    const k = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < k; j++) out.push({ q: add(a, mul(sub(b, a), j / k)), n });
  }
  return out;
}

const cache = new WeakMap<HandSkeleton, Map<string, FamHand>>();

/** The hand's parts, edges and lights for one view (memoised per skeleton, view key and options). */
export function familyHand(sk: HandSkeleton, view: HandView, key: string, o: Opts = {}): FamHand {
  let m = cache.get(sk);
  if (!m) {
    m = new Map();
    cache.set(sk, m);
  }
  const k = `${key}|${o.from ? `${o.from.u.toFixed(1)},${o.from.v.toFixed(1)}` : '-'}|${o.cut ? 'c' : '-'}`;
  const hit = m.get(k);
  if (hit) return hit;
  const built = build(sk, view, o);
  m.set(k, built);
  return built;
}

function build(sk: HandSkeleton, view: HandView, o: Opts): FamHand {
  const Pp = (q: V3): Pt => {
    const r = view(q);
    return P(r.u, r.v);
  };
  const D = (q: V3) => view(q).d;
  const f = sk.frame;
  const behind = (q: V3) => (o.cut ? h3.dot(h3.sub(q, o.cut.p), o.cut.n) < 0 : false);
  const layerOf = (q: V3): FamLayer => (behind(q) ? 'behind' : 'front');
  const toViewer = (q: V3, n: V3) => D(h3.add(q, n)) - D(q);

  /* ── the palm: the heel, the knuckle row as one convex edge, the thumb's mound, the wrist out of the cuff ── */
  const pc = sk.palm.reduce((a, q) => h3.add(a, h3.mul(q, 1 / sk.palm.length)), { x: 0, y: 0, z: 0 } as V3);
  const palmLayer = layerOf(pc);
  const knuckles = sk.fingers.map((d) => ({ c: Pp(d.joints[0]), r: d.r[0] }));
  const T = sk.thumb;
  const cmc = Pp(T.joints[0]);
  const tmcp = Pp(T.joints[1]);
  // (the mound: the thumb's metacarpal inside the palm, fuller toward the wrist)
  // (the thumb's metacarpal inside the hand's volume — the heel's pads carry the thenar's swell — so seen from the
  // little finger's side no lobe hangs below the hand: no teardrop, no skin tag)
  const mound = limbOutline([cmc, tmcp], [T.r[0] + 1, T.r[1] + 0.5]);
  const palmHull = hull([...palmVolume(f).map(Pp), ...knuckles.flatMap((kn) => ring(kn.c, kn.r, 14))]);
  const w1 = Pp(f.o);
  const w2 = Pp(h3.add(f.o, h3.mul(f.x, 24)));
  const wristFrom = o.from ?? Pp(h3.add(f.o, h3.mul(f.x, -40)));
  // The wrist is an oval in section (≈ 55 mm across the palm's width, ≈ 36 mm thick), the heel ≈ 63 × 30: its
  // width on the page is its section seen square to the column — narrow where the hand is seen edge-on, so the
  // column never bulges past a palm seen from its edge.
  const sectionHalf = (along: Pt, half: number, thick: number) => {
    const n = unit(P(-along.v, along.u));
    const py = sub(Pp(h3.add(f.o, f.y)), w1);
    const pz = sub(Pp(h3.add(f.o, f.z)), w1);
    return Math.max(thick * 0.85, Math.hypot(half * (py.u * n.u + py.v * n.v), thick * (pz.u * n.u + pz.v * n.v)));
  };
  const colDir = dist(wristFrom, w2) > 1 ? sub(w2, wristFrom) : sub(Pp(h3.add(f.o, f.x)), w1);
  // (the wrist a little narrower than the heel it carries, both across and through: the hand reads as its own
  // form out of the forearm, never one column with it)
  const rW = sectionHalf(colDir, HAND.wristHalf - 2, 15.5);
  const rH = sectionHalf(colDir, HAND.wristHalf + 4, 15);
  const wristPieces: Poly[] = dist(wristFrom, w1) > 2 ? [limbOutline([wristFrom, w1, w2], [rW - 1, rW, rH])] : [limbOutline([w1, w2], [rW, rH])];
  // (the palm's width on the page square to its axis: an edge-on palm turns across its own ≈ 35 mm, not a face-on
  // palm's 80 — so it reads round, lit along the back and shaded on the palm side, never a flat paddle)
  const pAx = Pp(h3.add(f.o, h3.mul(f.x, 100)));
  const pN = (() => {
    const d = unit(sub(pAx, w1));
    return P(-d.v, d.u);
  })();
  const acrossW = (() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const q of palmHull) {
      const t = (q.u - w1.u) * pN.u + (q.v - w1.v) * pN.v;
      lo = Math.min(lo, t);
      hi = Math.max(hi, t);
    }
    return hi - lo;
  })();
  const palm: FamPart = {
    name: 'palm',
    layer: palmLayer,
    depth: D(pc),
    pieces: [palmHull, mound, ...wristPieces],
    form: palmHull,
    axis: [w1, pAx],
    w: Math.max(30, Math.min(90, acrossW)),
    kind: 'palm',
  };

  /* ── the digits: one tapering form each, split only where the cut crosses them ── */
  const parts: FamPart[] = [palm];
  const tubes: { name: FamPartName; layer: FamLayer; depth: number; poly: Poly; root: Pt; rootR: number; joints: Pt[]; j3: V3[]; r: number[]; idx: number[] }[] = [];
  const digits = [...sk.fingers.map((d) => ({ d, from: 0, r: d.r })), { d: T, from: 1, r: [T.r[1] + 1, T.r[2], T.r[3]] as number[] }];
  /** Fingers curled hard (end bone turned back against the first): a fist's. */
  const fist = new Set<string>();
  for (const { d, from, r } of digits) {
    const js = d.joints.slice(from);
    // (a TUCKED tip — FamilyHands3 2026-11-24, the fists on a beater seen face-on: "a row of rounded fingertips". A
    // finger curled hard (its end bone turned back against its first) whose end bone runs mostly AWAY from the
    // viewer has its tip against the palm, behind the finger's own middle bone: drawn at its full page length it
    // stood out past the curled fingers as a round bump, one per finger, in a row. Drawn only a short way past the
    // end joint, the backs of the curled fingers read as one surface. Drawing only: the skeleton is the pose's.)
    if (d !== T && js.length === 4) {
      const prox = h3.sub(js[1], js[0]);
      const end = h3.sub(js[3], js[2]);
      const lp = h3.len(prox) || 1;
      const le = h3.len(end) || 1;
      const curled = h3.dot(prox, end) / (lp * le) < -0.5;
      const away = (D(js[2]) - D(js[3])) / le > 0.6;
      if (curled && away) js[3] = h3.add(js[2], h3.mul(end, 0.3));
      if (curled) fist.add(d.name as string);
    }
    // bones' layers; runs of the same layer
    const runs: { layer: FamLayer; a: number; b: number }[] = [];
    for (let i = 0; i < js.length - 1; i++) {
      const lay = layerOf(h3.mul(h3.add(js[i], js[i + 1]), 0.5));
      const last = runs[runs.length - 1];
      if (last && last.layer === lay) last.b = i + 1;
      else runs.push({ layer: lay, a: i, b: i + 1 });
    }
    for (const run of runs) {
      const idx: number[] = [];
      for (let i = run.a; i <= run.b; i++) idx.push(i);
      const pts = idx.map((i) => Pp(js[i]));
      const rs = idx.map((i) => r[i]);
      // a degenerate run (seen end-on): a disc
      const span = pts.reduce((s, q, i) => (i ? s + dist(q, pts[i - 1]) : 0), 0);
      const poly = span < 1 ? ring(pts[0], rs[0]) : limbOutline(pts, rs);
      const depth = idx.reduce((s, i) => s + D(js[i]), 0) / idx.length;
      tubes.push({ name: d.name as FamPartName, layer: run.layer, depth, poly, root: Pp(js[0]), rootR: r[0], joints: pts, j3: idx.map((i) => js[i]), r: rs, idx });
    }
  }
  for (const t of tubes) {
    // (its end bone, when the run carries it: how far it slopes away from the viewer)
    const n = t.j3.length;
    let tipAway: FamPart['tipAway'];
    if (n >= 2 && t.idx[n - 1] === t.idx[n - 2] + 1 && t.idx[n - 1] === (t.name === 'thumb' ? 2 : 3)) {
      const e3 = h3.sub(t.j3[n - 1], t.j3[n - 2]);
      const k = (D(t.j3[n - 2]) - D(t.j3[n - 1])) / (h3.len(e3) || 1);
      if (k > 0.25 && dist(t.joints[n - 2], t.joints[n - 1]) > 2) tipAway = { from: t.joints[n - 2], to: add(t.joints[n - 1], mul(unit(sub(t.joints[n - 1], t.joints[n - 2])), t.r[n - 1])), k: Math.min(1, k) };
    }
    parts.push({ name: t.name, layer: t.layer, depth: t.depth, pieces: [t.poly], form: t.poly, axis: [t.joints[0], t.joints[t.joints.length - 1]], w: 2 * t.r[0], kind: 'digit', ...(t.idx[0] === 0 && t.joints.length > 1 ? { root: t.joints[0], rootLen: dist(t.joints[0], t.joints[1]) } : {}), ...(tipAway ? { tipAway } : {}) });
  }

  /* ── touching fingers bent side by side: bridge their bends (one gentle edge, no row of bumps) ── */
  const fingerTubes = tubes.filter((t) => t.name !== 'thumb' && t.idx[0] === 0);
  /** Neighbors that lie together (bridged): only these are told apart by a crease from the tips. */
  const together = new Set<number>();
  for (let i = 0; i < fingerTubes.length - 1; i++) {
    const a = fingerTubes[i];
    const b = fingerTubes[i + 1];
    if (a.layer !== b.layer || Math.abs(a.depth - b.depth) > 30) continue;
    const near = a.depth >= b.depth ? a : b;
    const part = parts.find((p) => p.form === near.poly);
    if (!part) continue;
    // (reviewer 2026-11-24: fingers bridged out to their middle joints fused into one paddle — no fingertip per
    // key. Touching fingers now share skin ONLY at the web, a third of the way up the first bone; beyond it each
    // keeps its own outer contour and its own tip, told from its neighbor by the nearer one's own line.)
    if (a.joints.length > 1 && b.joints.length > 1 && h3.len(h3.sub(a.j3[0], b.j3[0])) < (a.r[0] + b.r[0]) * 1.3) {
      const at = (t: typeof a, f: number) => add(t.joints[0], mul(sub(t.joints[1], t.joints[0]), f));
      // (the web reaches about half the first bone — where neighbors' skin really joins — and its edge is a soft U of
      // skin, never a long narrow V of background running down to the knuckles)
      const W1 = 0.5;
      part.pieces.push(hull([...ring(a.joints[0], a.r[0] * 0.95, 12), ...ring(b.joints[0], b.r[0] * 0.95, 12), ...ring(at(a, W1), a.r[0] * 0.85, 12), ...ring(at(b, W1), b.r[0] * 0.85, 12)]));
      const ca = at(a, W1);
      const cb = at(b, W1);
      const gap = dist(ca, cb) - (a.r[0] + b.r[0]) * 0.85;
      if (gap > 0.5) part.pieces.push(ring(add(mul(add(ca, cb), 0.5), mul(sub(add(at(a, W1 + 0.1), at(b, W1 + 0.1)), add(ca, cb)), 0.5)), Math.min(gap * 0.6 + 3, 10), 12));
    }
    // (coordinator 2026-11-24, from the piano pose builder: two fingers are one form only where their surfaces
    // really TOUCH — bone by bone, within 1.05 × their widths in the hand itself; a pianist's 4–7 mm of air between
    // fingers stays air. Where they touch, the nearer finger's own contour is still drawn, web to tip.)
    for (const jj of [0, 1, 2]) {
      if (jj + 1 >= a.joints.length || jj + 1 >= b.joints.length) break;
      // (touching, or under 3 mm of air: at any drawn size such a gap reads as a hairline — the nearer finger's own
      // line — never a dark wedge of two outlines closing on each other)
      const touch = (t: number) => h3.len(h3.sub(a.j3[t], b.j3[t])) <= a.r[t] + b.r[t] + 3;
      if (!touch(jj) || !touch(jj + 1)) continue;
      const pts: Poly = [];
      for (const t of [jj, jj + 1]) pts.push(...ring(a.joints[t], a.r[t] * 0.9, 12), ...ring(b.joints[t], b.r[t] * 0.9, 12));
      part.pieces.push(hull(pts));
    }
  }

  /* ── a FIST (FamilyHands3 2026-11-24, the beaters and mallets face-on: "a row of rounded fingertips"): fingers
     curled hard and lying together — neighbors' middle and end joints close — show the backs of the
     curled fingers as ONE surface (within 10 mm of air: a curled little finger lies a little apart, never a pill
     of its own): one form over their middle and end bones (per layer), the fingers told apart
     only by the nearer one's own line and the creases; no round end per finger on the outline. A fretting or
     plucking hand's spread fingers (end joints apart) are never joined. Drawing only. ── */
  {
    const fs = sk.fingers;
    const pairTight = (i: number) => {
      const a = fs[i];
      const b = fs[i + 1];
      if (!fist.has(a.name) || !fist.has(b.name)) return false;
      return [1, 2].every((t) => h3.len(h3.sub(a.joints[t], b.joints[t])) <= a.r[t] + b.r[t] + 10);
    };
    const members = new Set<string>();
    for (let i = 0; i < fs.length - 1; i++)
      if (pairTight(i)) {
        members.add(fs[i].name);
        members.add(fs[i + 1].name);
      }
    if (members.size >= 2)
      for (const lay of ['behind', 'front'] as FamLayer[]) {
        const ts = tubes.filter((t) => t.layer === lay && t.name !== 'thumb' && members.has(t.name));
        if (new Set(ts.map((t) => t.name)).size < 2) continue;
        const pts: Poly = [];
        for (const t of ts) t.idx.forEach((i, k) => i >= 1 && pts.push(...ring(t.joints[k], t.r[k] * 0.9, 12)));
        if (pts.length < 24) continue;
        const near = ts.reduce((p, q) => (q.depth > p.depth ? q : p));
        parts.find((p) => p.form === near.poly)?.pieces.push(hull(pts));
      }
  }

  /* ── fingers coming out from behind what the hand holds (a stopping hand round a cello's neck, seen from the
     player's side: the palm behind the neck, the finger arches in front): where neighbors come out side by side,
     their first visible bones are bridged — the backs of the fingers read as ONE hand passing behind the neck,
     not short separate pieces floating beside it (FamilyHands3 2026-11-24). Drawing only. ── */
  if (o.cut) {
    const emerging = sk.fingers
      .map((d) => tubes.find((t) => t.name === d.name && t.layer === 'front' && t.idx[0] > 0 && t.joints.length >= 2))
      .filter((t): t is (typeof tubes)[number] => !!t);
    for (let i = 0; i < emerging.length - 1; i++) {
      const a = emerging[i];
      const b = emerging[i + 1];
      if (sk.fingers.findIndex((d) => d.name === b.name) - sk.fingers.findIndex((d) => d.name === a.name) !== 1) continue;
      if (h3.len(h3.sub(a.j3[0], b.j3[0])) > (a.r[0] + b.r[0]) * 1.7) continue;
      const at = (t: typeof a, f: number) => add(t.joints[0], mul(sub(t.joints[1], t.joints[0]), f));
      const near = a.depth >= b.depth ? a : b;
      parts.find((p) => p.form === near.poly)?.pieces.push(hull([...ring(a.joints[0], a.r[0] * 0.95, 12), ...ring(b.joints[0], b.r[0] * 0.95, 12), ...ring(at(a, 0.35), a.r[0] * 0.9, 12), ...ring(at(b, 0.35), b.r[0] * 0.9, 12)]));
    }
  }

  /* ── paint order: the behind layer, then the front; each far → near ── */
  const order = (l: FamLayer) => parts.filter((p) => p.layer === l).sort((p, q) => p.depth - q.depth);
  const ordered = [...order('behind'), ...order('front')];

  /* ── each part's own line where it lies over a farther part of its layer ── */
  const edges: FamHand['edges'] = [];
  for (const p of ordered) {
    const farther = ordered.filter((q) => q !== p && q.layer === p.layer && q.depth < p.depth);
    const nearer = ordered.filter((q) => q !== p && q.layer === p.layer && q.depth > p.depth);
    if (!farther.length) continue;
    const tube = tubes.find((t) => t.poly === p.form);
    // (no line where a digit grows out of the palm: round its root; a finger's line starts at its middle joint)
    // (the palm's own edge never runs across a finger's root: the knuckles are one swell with the fingers they
    // carry, never a ruled line — a line there drew the back of the hand as a box)
    const segD = (q: Pt, a: Pt, b: Pt) => {
      const ab = sub(b, a);
      const L2 = ab.u * ab.u + ab.v * ab.v || 1;
      const t = Math.max(0, Math.min(1, ((q.u - a.u) * ab.u + (q.v - a.v) * ab.v) / L2));
      return dist(q, add(a, mul(ab, t)));
    };
    const rootZone = (q: Pt) => {
      // (and none along the thumb's first bone: the thumb grows from the mound — its own end line separates it)
      if (p.kind === 'palm')
        return (
          fingerTubes.some((t) => t.joints.length > 1 && segD(q, t.joints[0], t.joints[1]) < t.r[0] * 1.25) ||
          tubes.some((t) => t.name === 'thumb' && t.idx[0] === 0 && t.joints.length > 1 && segD(q, t.joints[0], t.joints[1]) < t.r[0] * 1.3)
        );
      if (!tube) return false;
      if (tube.idx[0] !== 0) return false;
      // (the thumb: only its end separates — no line along its hand side, owner 2026-11-23; a finger: from about
      // its middle joint out)
      const zone = tube.name === 'thumb' ? 0.62 * (dist(tube.joints[0], tube.joints[1]) + dist(tube.joints[1], tube.joints[tube.joints.length - 1])) : 0.4 * dist(tube.joints[0], tube.joints[1]) + 0.5 * tube.r[0];
      return dist(q, tube.root) < zone;
    };
    let run: Poly = [];
    const flush = () => {
      if (run.length >= 3) edges.push({ layer: p.layer, pts: run });
      run = [];
    };
    for (const { q, n } of samples(p.form)) {
      const out = add(q, mul(n, 2.5));
      // (over a farther part — or, a finger, over the skin it shares with its touching neighbor: its own contour
      // still separates them there)
      const ownBridge = p.kind === 'digit' && p.pieces.some((pc2) => pc2 !== p.form && inPoly(out, pc2));
      const over = !rootZone(q) && !inPoly(out, p.form) && (ownBridge || farther.some((fp) => fp.pieces.some((pc2) => inPoly(out, pc2))));
      // (a line hidden under a nearer part is not drawn)
      const hidden = nearer.some((np) => np.pieces.some((pc2) => inPoly(q, pc2)));
      if (over && !hidden) run.push(q);
      else flush();
    }
    flush();
  }

  /* ── the knuckles' swells and the nails, where the back of the hand faces the viewer ── */
  const lights: FamHand['lights'] = [];
  if (toViewer(f.o, f.z) > 0.3) {
    for (const d of sk.fingers) {
      const c = Pp(h3.add(d.joints[0], h3.add(h3.mul(f.z, 8), h3.mul(f.x, -4))));
      const ax = sub(Pp(d.joints[1]), Pp(d.joints[0]));
      lights.push({ layer: layerOf(d.joints[0]), e: { c, rx: d.r[0] * 0.95, ry: d.r[0] * 0.6, rot: Math.atan2(ax.v, ax.u) } });
    }
  }
  const nails: FamHand['nails'] = [];
  for (const d of [...sk.fingers, T]) {
    const n = d.dorsal[2];
    // (only a nail turned well toward the viewer: a nail seen at a slant read as a pale disc — a cap — on the tip)
    if (toViewer(d.joints[3], n) < 0.5) continue;
    const a = d.joints[2];
    const b = d.joints[3];
    const L = h3.len(h3.sub(b, a)) || 1;
    const ax = h3.mul(h3.sub(b, a), 1 / L);
    const acr0 = h3.sub(h3.sub(f.y, h3.mul(ax, h3.dot(f.y, ax))), h3.mul(n, h3.dot(f.y, n)));
    const acr = h3.len(acr0) > 1e-3 ? h3.unit(acr0) : f.y;
    const rT = d.r[3];
    const c = h3.add(h3.add(a, h3.mul(ax, L * 0.6)), h3.mul(n, rT * 0.7));
    const hl = Math.min(L * 0.34, rT * 0.9);
    const hw = rT * 0.66;
    const pts: Poly = [];
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      pts.push(Pp(h3.add(c, h3.add(h3.mul(ax, Math.cos(t) * hl), h3.mul(acr, Math.sin(t) * hw)))));
    }
    nails.push({ layer: layerOf(d.joints[3]), pts });
  }

  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const p of parts) for (const pc2 of p.pieces) for (const q of pc2) {
    u0 = Math.min(u0, q.u);
    v0 = Math.min(v0, q.v);
    u1 = Math.max(u1, q.u);
    v1 = Math.max(v1, q.v);
  }
  /* ── the creases between neighboring fingers: from the tips, fading toward the knuckles ── */
  const creases: FamHand['creases'] = [];
  for (let i = 0; i < fingerTubes.length - 1; i++) {
    const a = fingerTubes[i];
    const b = fingerTubes[i + 1];
    if (!together.has(i) || a.layer !== b.layer || a.joints.length < 4 || b.joints.length < 4) continue;
    const pa = parts.find((p) => p.form === a.poly);
    const pb = parts.find((p) => p.form === b.poly);
    if (!pa || !pb) continue;
    const own = [...pa.pieces, ...pb.pieces];
    const others = ordered.filter((p) => p !== pa && p !== pb && p.layer === a.layer && p.depth > Math.min(pa.depth, pb.depth));
    const m = (t: number, j0: number, j1: number) => {
      const qa = add(a.joints[j0], mul(sub(a.joints[j1], a.joints[j0]), t));
      const qb = add(b.joints[j0], mul(sub(b.joints[j1], b.joints[j0]), t));
      return P((qa.u + qb.u) / 2, (qa.v + qb.v) / 2);
    };
    const keep = (q: Pt) => own.some((pc) => inPoly(q, pc)) && !others.some((o) => o.pieces.some((pc) => inPoly(q, pc)));
    // (tip → end joint: plain; end joint → toward the middle joint: fading)
    const runs: { pts: Poly; w: number }[] = [
      { pts: [0.82, 0.6, 0.4, 0.2, 0].map((t) => m(t, 2, 3)), w: 1 },
      { pts: [1, 0.75, 0.5].map((t) => m(t, 1, 2)), w: 0.45 },
    ];
    // (a crease is drawn whole from the tip or not at all — never broken into dashes where it crosses a nearer
    // part; and it runs back from the tips only while the two fingers' pads lie side by side on the page)
    const tipsApart = dist(a.joints[3], b.joints[3]) > (a.r[3] + b.r[3]) * 1.25;
    for (const r of runs) {
      if (tipsApart) break;
      let run: Poly = [];
      for (const q of r.pts) {
        if (keep(q)) run.push(q);
        else break;
      }
      if (run.length >= 2) creases.push({ layer: a.layer, pts: run, w: r.w });
      if (run.length < r.pts.length) break;
    }
  }
  /* ── a bent finger's middle knuckle seen from the back: two short soft folds across it (the cue that reads
     "curled", where the middle and end bones go away behind it) ── */
  for (const t of fingerTubes) {
    if (t.joints.length < 3) continue;
    const d = sk.fingers.find((x) => x.name === t.name);
    if (!d) continue;
    const a3 = h3.unit(h3.sub(t.j3[1], t.j3[0]));
    const b3 = h3.unit(h3.sub(t.j3[2], t.j3[1]));
    // (straighter than ≈ 70°: no folds — a gently curled finger, the pianist's from above, read a stray "))" pair of
    // marks on its root; coordinator 2026-11-24)
    if (h3.dot(a3, b3) > 0.34) continue;
    if (toViewer(t.j3[1], d.dorsal[0]) < 0.3) continue;
    const ax = unit(sub(t.joints[1], t.joints[0]));
    const nn = P(-ax.v, ax.u);
    const rr = t.r[1];
    const owner = parts.find((p) => p.form === t.poly);
    const nearer = ordered.filter((p) => p !== owner && p.layer === t.layer && p.depth > t.depth);
    for (const [back, half, w] of [
      [0.25, 0.55, 0.42],
      [0.62, 0.4, 0.3],
    ] as const) {
      const c = sub(t.joints[1], mul(ax, rr * back));
      const pts: Poly = [-1, -0.5, 0, 0.5, 1].map((s2) => add(add(c, mul(nn, s2 * rr * half)), mul(ax, -Math.abs(s2) * rr * 0.12)));
      if (pts.some((q) => nearer.some((p) => p.pieces.some((pc) => inPoly(q, pc))))) continue;
      creases.push({ layer: t.layer, pts, w });
    }
  }
  return { parts: ordered, edges, creases, nails, lights, wrist: w1, box: { u0, v0, u1, v1 } };
}

/** Whether a page point lies on the hand's layer (for the tests and the hit areas). */
export function familyHandCovers(h: FamHand, q: Pt, layer?: FamLayer): boolean {
  return h.parts.some((p) => (!layer || p.layer === layer) && p.pieces.some((pc) => inPoly(q, pc)));
}
