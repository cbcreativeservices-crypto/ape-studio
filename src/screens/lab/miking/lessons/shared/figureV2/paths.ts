/**
 * FIGURE V2 — the plan's control points as Skia paths (D78, 2026-11-22).
 * Built ONCE per plan (a WeakMap on the plan object, itself memoised per pose
 * in sidePlan.ts): nothing is rebuilt per frame or per render.
 */
import { PathOp, Skia } from '@shopify/react-native-skia';
import type { HandSkeleton, HandView, V3 } from '../players/handModel.ts';
import { handLayers, type HandLayers } from '../hand/anatomy/drawAnatomy.ts';
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
};

function handBuilt(sk: HandSkeleton, view: HandView, fore: number, fulcrum: V3, dir: V3): HandBuilt {
  const o = view({ x: 0, y: 0, z: 0 }).d;
  const toward = {
    x: view({ x: 1, y: 0, z: 0 }).d - o,
    y: view({ x: 0, y: 1, z: 0 }).d - o,
    z: view({ x: 0, y: 0, z: 1 }).d - o,
  };
  const k = toward.x * dir.x + toward.y * dir.y + toward.z * dir.z;
  const endOn = Math.abs(k) > 0.72;
  if (!endOn) {
    let n = {
      x: toward.x - dir.x * k,
      y: toward.y - dir.y * k,
      z: toward.z - dir.z * k,
    };
    const l = Math.hypot(n.x, n.y, n.z) || 1;
    n = { x: n.x / l, y: n.y / l, z: n.z / l };
    return {
      L: handLayers(sk, view, {
        fore,
        cut: { p: fulcrum, n },
        bare: true,
        wristBack: 4,
        v2: true,
      }),
      endOn,
      buttShow: null,
    };
  }
  const L = handLayers(sk, view, { fore, bare: true, wristBack: 4, v2: true });
  // The half of the picture on the butt's side of the fulcrum, less the fist.
  const f = view(fulcrum);
  const b = view({
    x: fulcrum.x - dir.x * 100,
    y: fulcrum.y - dir.y * 100,
    z: fulcrum.z - dir.z * 100,
  });
  const du = b.u - f.u;
  const dv = b.v - f.v;
  const dl = Math.hypot(du, dv) || 1;
  const ux = du / dl;
  const uy = dv / dl;
  const half = make();
  half.moveTo(f.u - uy * 600, f.v + ux * 600);
  half.lineTo(f.u + uy * 600, f.v - ux * 600);
  half.lineTo(f.u + uy * 600 + ux * 600, f.v - ux * 600 + uy * 600);
  half.lineTo(f.u - uy * 600 + ux * 600, f.v + ux * 600 + uy * 600);
  half.close();
  const fist = L.behind ? op(L.front, L.behind, PathOp.Union) : L.front;
  return { L, endOn, buttShow: op(half, fist, PathOp.Difference) };
}

export type ArmPaths = {
  upper: SkPath;
  foreSleeve: SkPath;
  cuff: SkPath;
  wristSkin: SkPath;
  ulna: SkPath;
  folds: SkPath;
  armhole: SkPath;
  hand: HandBuilt | null;
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
};

const many = (ps: readonly Poly[], closed = true): SkPath => {
  const p = make();
  for (const q of ps) p.addPath(closed ? smoothClosed(q) : smoothOpen(q));
  return p;
};

function armPaths(a: SidePlan['arms']['near'], view: HandView): ArmPaths {
  const fore = Math.atan2(a.wrist.v - a.elbow.v, a.wrist.u - a.elbow.u);
  return {
    upper: smoothClosed(a.upper),
    foreSleeve: smoothClosed(a.foreSleeve),
    cuff: smoothClosed(a.cuff),
    wristSkin: smoothClosed(a.wristSkin),
    ulna: ellipsePath(a.ulna),
    folds: many(a.folds),
    armhole: smoothOpen(a.armhole),
    hand: a.hold ? handBuilt(a.hold.sk, view, fore, a.hold.fulcrum, a.hold.dir) : null,
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
    belt: op(smoothClosed(plan.belt, 0.1), unionOf(shirt, seat), PathOp.Intersect),
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
  };
  pathCache.set(plan, out);
  return out;
}
