/**
 * FIGURE V2 — THE JACKET, PLANNED (wave 3 of D78, piece 2; coordinator round
 * 2026-11-23: "THE JACKET … a cast dress variant"). Pure: no React, no Skia.
 *
 * A real garment over the shirt, built from the person's own plan (sidePlan /
 * topPerson) — nothing of the person moves:
 *   • its own outline a little outside the shirt's (the cloth's thickness and
 *     ease, JACKET_EASE): standing, the back hangs STRAIGHT from the shoulder
 *     blades to below the seat; seated, it follows the back (bridging the
 *     small of the back a little, never standing off like a shell) and its
 *     skirt breaks over the chair at the back and onto the lap in front;
 *   • the shoulder a little squarer (a flatter cap on the sleeve's top);
 *   • ONE sleeve from the shoulder to the cuff, a little fuller than the
 *     shirt's, ending SHIRT_CUFF_SHOWS mm short of the shirt's cuff so the
 *     shirt's cuff shows at the wrist; a soft fold at the elbow;
 *   • in profile: the FRONT FOLD (the lapel's roll) from the top button —
 *     at about the bottom of the breastbone — up to the neck and on round it
 *     as the collar's crease; the lapel and the collar turned back behind it
 *     (their cut edge, the notch where they meet); the shirt and its collar
 *     showing in the V in front of the fold; one button; a pocket line;
 *   • from above: the shoulders squarer, the collar round the neck, the
 *     lapels as a V toward the chest with the shirt showing in it.
 * The lav clip points the lessons use (bodyWorn.ts) are not moved: the
 * sternum point lies on the shirt in the V, just in front of the fold; the
 * lapel point on the fold (tests: test/figureV2Jacket_20261123).
 */
import { add, crossZ, dist, dot, lerp, limbOutline, mul, P, perp, sub, unit, type Poly, type Pt } from './geom.ts';
import { lens, type ArmPlan, type BodyBuild, type Ellipse, type SidePlan } from './sidePlan.ts';
import { SLEEVE_R } from './sidePlan.ts';
import type { TopPlan } from './topPlan.ts';

/** The cloth's thickness and ease over the shirt (mm). */
export const JACKET_EASE = 8;
/** How much of the shirt's cuff shows beyond the jacket's sleeve (mm). */
export const SHIRT_CUFF_SHOWS = 10;
/** The cloth's ease over the upper back and the shoulder blade (mm): close, a few millimetres. */
export const BACK_EASE = 3;
/** The top button, along the torso (hip → neck): about the bottom of the breastbone. */
export const BUTTON_T = 0.585;

export type JacketSleevePlan = {
  outline: Poly;
  /** The sleeve's end, its near rim (open), and the end's centre, radius and direction (toward the hand). */
  endRim: Poly;
  end: Pt;
  endR: number;
  df: Pt;
  root: Pt;
  elbow: Pt;
  upperAxis: [Pt, Pt];
  foreAxis: [Pt, Pt];
  /** Soft folds: in the crook of the elbow, and the cloth's break above the end. */
  folds: Poly[];
};

export type JacketSidePlan = {
  facing: 1 | -1;
  /** The whole garment's silhouette (the collar and lapel inside it). */
  body: Poly;
  /** The lapel and the collar turned back (closed). */
  face: Poly;
  /** Their cut edge, the lapel's from the button up to the notch and the collar's round the neck (open). */
  cutEdge: Poly;
  /** The front fold from the button up to the neck and round it as the collar's crease (open). */
  fold: Poly;
  /** The notch where collar and lapel meet (closed, small). */
  notch: Poly;
  button: Ellipse;
  /** A pocket line (open; full detail only): the breast pocket on the wearer's left, a hip pocket's flap on the right. */
  pocket: Poly;
  /** The hem's edge (open). */
  hem: Poly;
  folds: Poly[];
  sleeves: { near: JacketSleevePlan; far: JacketSleevePlan };
  axis: [Pt, Pt];
  standing: boolean;
};

/* ── the torso's frame: (t along hip → neck, f toward the face) ── */

type TF = { t: number; f: number };

function frameOf(plan: SidePlan) {
  const o = plan.along(0, 0);
  const A = sub(plan.along(1, 0), o);
  const N = sub(plan.along(0, 1), o);
  const AA = dot(A, A);
  const toTF = (p: Pt): TF => {
    const d = sub(p, o);
    return { t: dot(d, A) / AA, f: dot(d, N) };
  };
  return { toTF };
}

/** Where the closed polygons cross the line t = const (their f values). */
function crossingsAt(polys: readonly TF[][], t: number): number[] {
  const out: number[] = [];
  for (const q of polys)
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      const b = q[(i + 1) % q.length];
      if ((a.t - t) * (b.t - t) <= 0 && a.t !== b.t) out.push(a.f + ((b.f - a.f) * (t - a.t)) / (b.t - a.t));
    }
  return out;
}

/** Linear interpolation in a table of [x, y] sorted by x (descending or ascending). */
function interp(tab: readonly (readonly [number, number])[], x: number): number {
  const s = [...tab].sort((a, b) => a[0] - b[0]);
  if (x <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++)
    if (x <= s[i][0]) {
      const k = (x - s[i - 1][0]) / (s[i][0] - s[i - 1][0]);
      return s[i - 1][1] + (s[i][1] - s[i - 1][1]) * k;
    }
  return s[s.length - 1][1];
}

/** The ray from c along dir: how far to the polygon's last crossing (0 if none). */
function rayHit(poly: Poly, c: Pt, dir: Pt): number {
  let best = 0;
  const n = perp(dir);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = dot(sub(a, c), n);
    const db = dot(sub(b, c), n);
    if (da * db > 0 || da === db) continue;
    const q = lerp(a, b, da / (da - db));
    const s = dot(sub(q, c), dir);
    if (s > best) best = s;
  }
  return best;
}

/* ── the sleeve ── */

/** A cap at the sleeve's root, flatter than a half circle (a shoulder pad's line): from −perp to +perp through −d. */
function squareCap(c: Pt, d: Pt, r: number, depth: number): Poly {
  const n = perp(d);
  const out: Poly = [];
  const p = 3.2;
  for (let i = 1; i < 12; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / 12;
    const x = -depth * Math.abs(Math.cos(th)) ** (2 / p);
    const y = r * Math.sign(Math.sin(th)) * Math.abs(Math.sin(th)) ** (2 / p);
    out.push(add(c, add(mul(d, x), mul(n, y))));
  }
  return out;
}

/** Every sharp corner of an outline (a turn over 20°: the crook of a bent elbow) rounded into a soft
 *  curve — cloth over a bend has no notch (coordinator round 2026-11-23: "the dip … just past the elbow"). */
function fillet(poly: Poly, keep: (p: Pt) => boolean = () => false): Poly {
  const n = poly.length;
  const out: Poly = [];
  for (let i = 0; i < n; i++) {
    const v = poly[i];
    const a = poly[(i - 1 + n) % n];
    const b = poly[(i + 1) % n];
    const d0 = unit(sub(v, a));
    const d1 = unit(sub(b, v));
    const turn = Math.acos(Math.max(-1, Math.min(1, dot(d0, d1))));
    if (i === 0 || i === n - 1 || keep(v) || turn < (20 * Math.PI) / 180) {
      out.push(v);
      continue;
    }
    const r = Math.min(30, 0.4 * dist(v, a), 0.4 * dist(v, b));
    const p0 = sub(v, mul(d0, r));
    const p1 = add(v, mul(d1, r));
    for (let k = 0; k <= 6; k++) {
      const s = k / 6;
      out.push(add(add(mul(p0, (1 - s) ** 2), mul(v, 2 * s * (1 - s))), mul(p1, s * s)));
    }
  }
  return out;
}

/** The jacket's sleeve over an arm (the shirt's one sleeve, a little fuller; ending short of the shirt's cuff). */
export function jacketSleeve(a: ArmPlan, B: BodyBuild | undefined, facing: 1 | -1, trim = false): JacketSleevePlan {
  const k = B?.shoulder ?? 1;
  const kf = B?.limb ?? 1;
  const last = a.line.length - 1;
  const df = unit(sub(a.line[last], a.line[last - 1]));
  const du = unit(sub(a.elbow, a.shoulder));
  const far = !!a.behind;
  const root = far ? add(a.shoulder, mul(P(facing, 0), a.behind!.shift)) : sub(a.shoulder, mul(du, 28));
  // (the shirt's cuff ends 16 mm short of the wrist: the jacket's sleeve ends SHIRT_CUFF_SHOWS short of that)
  const end = sub(a.wrist, mul(df, 16 + SHIRT_CUFF_SHOWS));
  const mid = a.line.slice(1, last).filter((q) => dot(sub(q, end), df) < -(trim ? 14 : 8));
  const eR = SLEEVE_R.elbow * kf + 6;
  const endR = SLEEVE_R.cuff + 4;
  const pts = [root, lerp(root, a.elbow, 0.36), lerp(root, a.elbow, 0.74), a.elbow, ...mid, end];
  const rs = [far ? 36 : SLEEVE_R.top * k + 5, far ? SLEEVE_R.bicep + 3 : SLEEVE_R.delt * k + 5, (SLEEVE_R.bicep * (k + kf)) / 2 + 7, eR, ...mid.map((_, i) => eR - ((eR - endR) * (i + 1)) / (mid.length + 1)), endR];
  // (the end's two corners stay: the sleeve's mouth is cut square)
  const tube = fillet(limbOutline(pts, rs, { capStart: false, capEnd: false }), (p) => dist(p, end) < endR * 1.6);
  // limbOutline: the +perp side start → end, then the −perp side end → start (the sides' lengths
  // differ where a joint rounds over: split at the end's +perp point)
  const dLast = unit(sub(end, pts[pts.length - 2]));
  const endL = add(end, mul(perp(dLast), endR));
  let iEnd = 0;
  tube.forEach((q, i) => {
    if (dist(q, endL) < dist(tube[iEnd], endL)) iEnd = i;
  });
  const L = tube.slice(0, iEnd + 1);
  const R = tube.slice(iEnd + 1);
  // the end: the near rim of the sleeve's mouth, a shallow curve bowed toward the hand (the cloth wraps round)
  const endRim: Poly = [];
  const nE = perp(dLast);
  for (let i = 0; i <= 10; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / 10;
    endRim.push(add(end, add(mul(dLast, 5 * Math.cos(th)), mul(nE, endR * Math.sin(th)))));
  }
  const d0 = unit(sub(pts[1], pts[0]));
  const outline: Poly = [...L, ...[...endRim].reverse(), ...R, ...squareCap(root, d0, rs[0], far ? rs[0] : rs[0] * 0.62)];
  // folds: the crook of the elbow (on the inside of the bend), and the cloth's break above the end
  const folds: Poly[] = [];
  const turn = crossZ(du, df);
  if (Math.abs(turn) > 0.12) {
    const inner = Math.sign(turn) || 1;
    const nIn = unit(add(perp(du), perp(df)));
    const crook = add(a.elbow, mul(nIn, inner * eR * 0.72));
    const across = unit(sub(a.elbow, crook));
    folds.push(lens(add(crook, mul(du, -30)), add(add(crook, mul(across, 26)), mul(du, -10)), 7, inner * 3));
    folds.push(lens(add(crook, mul(df, 6)), add(add(crook, mul(across, 22)), mul(df, 20)), 6, -inner * 3));
  } else {
    // a nearly straight arm: one long soft fold across the inside of the elbow
    folds.push(lens(add(a.elbow, mul(perp(du), -eR * 0.6)), add(a.elbow, add(mul(perp(du), eR * 0.2), mul(du, 14))), 5, 2));
  }
  folds.push(lens(add(sub(end, mul(df, 22)), mul(nE, endR * 0.7)), add(sub(end, mul(df, 34)), mul(nE, -endR * 0.6)), 4.5, 2));
  return { outline, endRim, end, endR, df, root, elbow: a.elbow, upperAxis: [root, a.elbow], foreAxis: [a.line[last - 1], end], folds };
}

/* ── the side view ── */

// The front fold's offset from the shirt's front (mm) by t: well behind it at the neck
// (the V open), reaching the jacket's own front (the ease) a little below the sternum.
const FOLD_OFF: readonly (readonly [number, number])[] = [
  [0.945, -28],
  [0.9, -21],
  [0.86, -15],
  [0.82, -9.5],
  [0.79, -6.5],
  [0.763, -4],
  [0.745, -1],
  [0.73, 3],
  [0.71, 6.5],
  [0.68, JACKET_EASE],
];
// The collar's crease round the neck, (t, f) — below the shirt's collar (which shows above it).
const CREASE: readonly (readonly [number, number])[] = [
  [0.965, 44],
  [0.995, 31],
  [1.035, 8],
  [1.072, -19],
  [1.104, -44],
];
// The collar's cut (outer) edge, from the back of the neck forward to the notch.
const COLLAR_EDGE: readonly (readonly [number, number])[] = [
  [1.074, -70],
  [1.045, -46],
  [1.005, -16],
  [0.965, 12],
];

const cache = new WeakMap<SidePlan, JacketSidePlan>();

/** The jacket on a person's side plan (memoised per plan). `body`: the person's build. */
export function jacketSidePlan(plan: SidePlan, B: BodyBuild | undefined, standing: boolean): JacketSidePlan {
  const hit = cache.get(plan);
  if (hit) return hit;
  const out = build(plan, B, standing);
  cache.set(plan, out);
  return out;
}

function build(plan: SidePlan, B: BodyBuild | undefined, standing: boolean): JacketSidePlan {
  const E = JACKET_EASE;
  const fc = plan.facing;
  const A = plan.along;
  const { toTF } = frameOf(plan);
  const shirtTF = plan.shirt.map(toTF);
  const seatTF = plan.seat.map(toTF);
  // (the shirt's and the seat's own range: below the waist the seat is the body)
  const ts = [...shirtTF, ...seatTF].map((q) => q.t);
  const tLo = Math.min(...ts);
  const tHi = Math.max(...ts);
  /** The body's front / back at t (the shirt, and below the waist the seat). */
  const frontAt = (t: number) => {
    const c = crossingsAt([shirtTF, seatTF], Math.max(tLo + 0.002, Math.min(tHi - 0.002, t)));
    return c.length ? Math.max(...c) : 100;
  };
  const backAt = (t: number) => {
    const c = crossingsAt([shirtTF, seatTF], Math.max(tLo + 0.002, Math.min(tHi - 0.002, t)));
    return c.length ? Math.min(...c) : -110;
  };
  const Fz = (t: number) => frontAt(Math.min(t, 0.9));

  // THE FRONT FOLD: from the button up to the neck, then the collar's crease round it
  const foldTs = [BUTTON_T, 0.62, 0.66, 0.7, 0.73, 0.76, 0.79, 0.82, 0.86, 0.9, 0.935];
  const foldF = (t: number) => (t > 0.9 ? Fz(0.9) + (t - 0.9) * ((60 - Fz(0.9)) / 0.065) : Fz(t)) + interp(FOLD_OFF, t);
  // (under a crew neck — no shirt collar to show above it — the jacket's collar sits a little lower behind
  // the neck, so the crew band shows above it as a shirt collar would)
  const crew = B?.collar === 'crew';
  const crewDrop = (t: number, f: number) => (crew ? t - 0.035 * Math.max(0, Math.min(1, (44 - f) / 88)) : t);
  const foldUp: Poly = [...foldTs.map((t) => A(t, foldF(t))), ...CREASE.map(([t, f]) => A(crewDrop(t, f), f))];

  // THE LAPEL'S CUT EDGE: behind the fold, from the button (where they meet) up to the notch
  const tN = 0.895;
  const w = (t: number) => 31 * Math.max(0, (t - BUTTON_T) / (tN - BUTTON_T)) ** 0.85;
  const cutTs = [BUTTON_T, 0.63, 0.68, 0.73, 0.78, 0.83, 0.87, tN];
  const lapelCut: Poly = cutTs.map((t) => A(t, foldF(t) - w(t)));
  // the notch: the lapel's point, the notch's inner corner, the collar's end
  const nPeak = A(tN + 0.008, foldF(tN) - w(tN) - 3);
  const nIn = A(tN + 0.014, foldF(tN + 0.014) - 21);
  const nCollar = A(tN + 0.03, foldF(tN + 0.03) - 30);
  const collarEdge: Poly = [nCollar, ...[...COLLAR_EDGE].reverse().map(([t, f]) => A(crewDrop(t, f), f))];
  const cutEdge: Poly = [...lapelCut, nPeak, nIn, ...collarEdge];
  const face: Poly = [...foldUp, ...[...cutEdge].reverse()];
  const notch: Poly = [nPeak, nIn, nCollar, A(tN + 0.012, foldF(tN + 0.012) - 31)];

  // THE BACK, from the collar down (coordinator round 2026-11-23: "hunched and barrel-shaped … the
  // collar sits close on the back of the neck"): the collar close on the neck, the cloth CLOSE over the
  // approved body's upper back and shoulder blade (BACK_EASE) — no shelf behind the neck, no dome
  const bk = (t: number) => backAt(t) - E;
  const bkT = (t: number) => backAt(t) - BACK_EASE;
  const collarBack = crew ? A(1.066, bkT(1.066)) : A(1.09, Math.min(-52, bkT(1.09)));
  const upperBack: Poly = [collarBack, ...[1.06, 1.02, 0.97, 0.91, 0.86, 0.81].filter((t) => t < (crew ? 1.05 : 1.08)).map((t) => A(t, bkT(t)))];
  const tBlade = 0.74;
  const blade = A(tBlade, Math.min(bkT(0.74), bkT(0.69), bkT(0.78)) - 1);

  let lower: Poly;
  let hem: Poly;
  const folds: Poly[] = [];
  if (standing) {
    // STANDING: the front below the button over the body, the quarters rounding back to the hem;
    // the back hanging STRAIGHT (plumb) from the blades to below the seat
    // (the hem about level with the knuckles of the hanging hand: below the seat)
    const tHem = -0.33;
    // (below the belly the front hangs straight: it does not follow the body in under the seat)
    const fLow = Math.max(frontAt(0.06), frontAt(0.14), frontAt(0.22));
    const front: Poly = [0.54, 0.46, 0.38, 0.3, 0.22, 0.14, 0.06, -0.02, -0.08, -0.15].map((t) => A(t, (t < 0.22 ? fLow : frontAt(t)) + E));
    const quarter: Poly = [A(-0.22, fLow + E - 5), A(-0.27, fLow - 6), A(-0.305, fLow - 26), A(tHem + 0.004, fLow - 52)];
    // the hem back corner: plumb under the blade unless the body needs it further back
    const vH = A(tHem, 0).v;
    const bodyBack = [...plan.shirt, ...plan.seat].filter((q) => q.v > blade.v + 1 && q.v < vH && fc * (q.u - A(toTF(q).t, 0).u) < 0);
    let hb = -fc * blade.u; // "behind" = −facing·u
    for (const q of bodyBack) {
      const need = -fc * q.u + BACK_EASE;
      const k = (q.v - blade.v) / (vH - blade.v);
      if (k > 0.02) hb = Math.max(hb, -fc * blade.u + (need - -fc * blade.u) / k);
    }
    const backHem = P(-fc * hb, vH);
    const hemFront = A(tHem, fLow - 64);
    hem = [quarter[quarter.length - 1], hemFront, lerp(hemFront, backHem, 0.5), backHem];
    lower = [...front, ...quarter, hemFront, lerp(hemFront, backHem, 0.5), backHem, lerp(backHem, blade, 0.5)];
  } else {
    // SEATED: the front over the belly, the skirt onto the lap (over the top of the thigh), the hem
    // across the thigh's side down to the seat, where the back skirt breaks over the chair
    const L = plan.legs.near;
    const td = unit(sub(L.knee, L.hip));
    let up = perp(td);
    if (up.v > 0) up = mul(up, -1);
    const along = (s: number) => lerp(L.hip, L.knee, s);
    const topAt = (s: number) => add(along(s), mul(up, rayHit(L.outline, along(s), up)));
    const front: Poly = [0.54, 0.46, 0.38, 0.3, 0.24].map((t) => A(t, frontAt(t) + E));
    const rUp = (s: number) => rayHit(L.outline, along(s), up);
    const rDn = (s: number) => rayHit(L.outline, along(s), mul(up, -1));
    // the front skirt falls onto the lap: over the top of the thigh, its corner rounding down its side
    const lap: Poly = [A(0.17, frontAt(0.19) + E + 2), add(topAt(0.15), mul(up, E + 5)), add(topAt(0.25), mul(up, E + 2)), add(topAt(0.35), mul(up, E)), add(topAt(0.42), mul(up, E - 3)), add(along(0.455), mul(up, 0.62 * rUp(0.455)))];
    const seatBottom = Math.max(...plan.seat.map((q) => q.v));
    // the hem crosses the thigh's side, down and back to the seat
    const c2 = add(along(0.42), mul(up, 0.2 * rUp(0.42)));
    const c3 = add(along(0.27), mul(up, -0.3 * rDn(0.27)));
    const sideLow = add(along(0.1), mul(up, -0.72 * rDn(0.1)));
    const backV = seatBottom - 1;
    // the back: ONE STRAIGHT LINE from the shoulder blade down to the seat (coordinator round 2026-11-23:
    // "the back line runs almost straight … down to the chair"), as close as the body allows
    const bf = toTF(blade).f;
    const te = 0.02;
    // (round the seat the cloth keeps a little more ease: the seat's smoothed curve must not show past it)
    const bkS = (t: number) => bkT(t) - 3;
    let ef = bkS(te);
    // (the blade's own curve is covered by the blade point; the run below it must clear the body)
    for (let t = te + 0.02; t < 0.62; t += 0.02) ef = Math.min(ef, bf + (((t < 0.2 ? bkS(t) : bkT(t)) - bf) * (tBlade - te)) / (tBlade - t));
    const seatTop = A(te, ef);
    // then close down the seat's curve, and the tail folds onto the seat pad just behind the hip
    // ("a small soft fold, nothing sticking out behind the chair's back plane")
    const tail = P(A(-0.135, bkT(-0.135) - 12).u, backV);
    hem = [lap[lap.length - 1], c2, c3, sideLow, P(lerp(sideLow, tail, 0.5).u, backV + 1), tail];
    lower = [...front, ...lap, c2, c3, sideLow, P(lerp(sideLow, tail, 0.5).u, backV + 1), tail, A(-0.1, bkS(-0.1)), A(-0.04, bkS(-0.04)), seatTop];
    // a soft fold at the seated waist, and where the skirt breaks onto the lap
    folds.push(lens(A(0.25, frontAt(0.25) + E - 4), A(0.31, frontAt(0.31) - 46), 6, -3 * fc));
    folds.push(lens(A(0.17, frontAt(0.17) + E - 6), add(topAt(0.06), mul(up, E + 10)), 6, 3 * fc));
    folds.push(lens(A(-0.08, bkT(-0.08) + 10), P(tail.u + fc * 30, backV - 8), 4.5, 2 * fc));
  }
  const body: Poly = [...foldUp, ...upperBack, blade, ...[...lower].reverse()];

  // the button (seen edge-on from the side), just inside the front at the fold's foot
  const button: Ellipse = { c: A(BUTTON_T - 0.008, foldF(BUTTON_T) - 3.5), rx: 2.6, ry: 6.5, rot: Math.atan2(sub(A(1, 0), A(0, 0)).v, sub(A(1, 0), A(0, 0)).u) };
  // the pocket: a near side that is the wearer's LEFT (facing −1) shows the breast pocket's welt;
  // the right side shows the hip pocket's flap (a real jacket's breast pocket is on the left only)
  const pocket: Poly =
    fc < 0
      ? [A(0.8, Fz(0.8) - 16), A(0.795, Fz(0.8) - 44), A(0.79, Fz(0.8) - 72)]
      : standing
        ? [A(0.12, frontAt(0.12) - 18), A(0.115, frontAt(0.12) - 60), A(0.11, frontAt(0.12) - 100)]
        : [A(0.2, frontAt(0.2) - 20), A(0.19, frontAt(0.2) - 58)];
  const sleeves = {
    near: jacketSleeve(plan.arms.near, B, fc),
    far: jacketSleeve(plan.arms.far, B, fc),
  };
  return { facing: fc, body, face, cutEdge, fold: foldUp, notch, button, pocket, hem, folds, sleeves, axis: [plan.hip, plan.neck], standing };
}

/* ── from above ── */

export type JacketTopPlan = {
  slab: Poly;
  /** The lapels either side of the V (closed), and their cut edges (open). */
  lapels: Poly[];
  collar: Poly;
  sleeves: { near: JacketSleevePlan; far: JacketSleevePlan } | null;
  axis: [Pt, Pt];
};

const topCache = new WeakMap<TopPlan, JacketTopPlan>();

/** The jacket from above on a person's top plan. `desk`: the forearms on a desk (their sleeves drawn). */
export function jacketTopPlan(plan: TopPlan, B: BodyBuild | undefined, desk: boolean): JacketTopPlan {
  const hit = topCache.get(plan);
  if (hit) return hit;
  const E = JACKET_EASE;
  const a0 = plan.torsoAxis[0];
  const a1 = plan.torsoAxis[1];
  const mid = lerp(a0, a1, 112 / 236);
  const T = (x: number, y: number): Pt => add(mid, add(mul(plan.left, x), mul(plan.f, y)));
  const local = (p: Pt) => ({ x: dot(sub(p, mid), plan.left), y: dot(sub(p, mid), plan.f) });
  const sh = B?.shoulder ?? 1;
  const deep = B ? (B.back + B.chest) / 2 : 1;
  // the half width at the shoulders, read from the plan's own slab (its widest point)
  const half = Math.max(...plan.torso.map((p) => Math.abs(local(p).x))) - 40 * sh;
  const side = (s: 1 | -1): Poly => {
    const x = (dx: number) => s * (half + dx * sh + E);
    // (the shoulder squarer: a fuller corner at the shoulder's point)
    return [T(x(-70), -108 * deep - E), T(x(-8), -90 * deep - E), T(x(38), -56), T(x(46), -24), T(x(46), 10), T(x(32), 54 * deep), T(x(-12), 88 * deep)];
  };
  const L = side(1);
  const R = side(-1);
  const fr = 124 * deep + E;
  // the front: the lapels' rolls stand a little forward of the shirt; between them, the V (the shirt shows)
  const front: Poly = [T(-96, 118 * deep + 4), T(-62, fr + 4), T(-28, fr + 8), T(0, 104 * deep), T(28, fr + 8), T(62, fr + 4), T(96, 118 * deep + 4)];
  const slab: Poly = [T(0, -112 * deep - E), ...R, ...front, ...[...L].reverse()];
  // (each lapel from the collar at the side of the neck to the V at the chest; its fold the V's side, its
  // cut edge outward, toward the shoulder)
  const lapels: Poly[] = ([1, -1] as const).map((s) => [T(s * 44, 20), T(s * 28, fr + 8), T(s * 50, fr + 5), T(s * 86, 98 * deep), T(s * 104, 40), T(s * 92, 18)]);
  const collar: Poly = [];
  for (let i = 0; i <= 12; i++) {
    const th = (Math.PI * i) / 12;
    collar.push(T(94 * Math.cos(th), 22 - 96 * Math.sin(th)));
  }
  for (let i = 12; i >= 0; i--) {
    const th = (Math.PI * i) / 12;
    collar.push(T(60 * Math.cos(th), 18 - 70 * Math.sin(th)));
  }
  const fc: 1 | -1 = 1;
  const out: JacketTopPlan = {
    slab,
    lapels,
    collar,
    sleeves: desk ? { near: jacketSleeve(plan.arms.near, B, fc, true), far: jacketSleeve(plan.arms.far, B, fc, true) } : null,
    axis: [a0, a1],
  };
  topCache.set(plan, out);
  return out;
}

/** (tests) The jacket's distance outside a point of the body, along the ray from the torso's axis (mm). */
export const _internal = { frameOf, crossingsAt, rayHit, dist };

/**
 * Where a lav clip is DRAWN on a cast figure (coordinator round 2026-11-23: "the clip must sit ON the
 * cloth"): the lesson's grip point at its own HEIGHT, brought along the horizontal onto the garment —
 * the shirt's front (the sternum, in the jacket's V) or the jacket's fold (the lapel). The lesson's
 * measured point is not moved: this is the drawing only. (mm, the view's u/v.)
 */
export function clipOnCloth(plan: SidePlan, J: JacketSidePlan | null, grip: { x: number; y: number }, on: 'shirt' | 'lapel'): Pt {
  // the garment's front along the horizontal line v = grip.y
  const crossU = (poly: Poly | readonly Pt[], closed: boolean): number[] => {
    const out: number[] = [];
    const m = closed ? poly.length : poly.length - 1;
    for (let i = 0; i < m; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if ((a.v - grip.y) * (b.v - grip.y) <= 0 && a.v !== b.v) out.push(a.u + ((b.u - a.u) * (grip.y - a.v)) / (b.v - a.v));
    }
    return out;
  };
  const fc = plan.facing;
  const us = on === 'lapel' && J ? crossU(J.fold, false) : crossU(plan.shirt, true);
  if (!us.length) return P(grip.x, grip.y);
  const front = fc > 0 ? Math.max(...us) : Math.min(...us);
  // (the clip's grip 1 mm off the cloth, as the lessons' own grip: CHEST_X + 1)
  return P(front + fc * 1, grip.y);
}
