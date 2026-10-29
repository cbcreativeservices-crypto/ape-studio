/**
 * THE WOODWIND FAMILY — where the player and the instrument ARE (charter §2
 * layer 2, pure). One frame for every woodwind lesson, the guitars' frame
 * (shared/guitars/guitarModel.ts), so the shared player figure fits it:
 *
 *   origin  the player's LIPS (the mouth); the instrument's player end is
 *           there (the embouchure hole just in front, or the reed's tip just
 *           inside);
 *   +x      the player's LEFT (the viewer's right, seen from the audience);
 *   +y      DOWN (the floor is at positive y);
 *   +z      toward the AUDIENCE (forward).
 * The engine's SIDE view (u = x, v = y) is then the player seen FROM THE
 * AUDIENCE; its TOP view (u = x, v = z) is from above, the audience down the
 * screen. A mic facing the player points along −z (az = −90°).
 *
 * The upper body and the instrument stay put between a lesson's postures
 * (standing / seated); the legs, the chair and the floor move — the bowed
 * family's rule.
 *
 * EVERY body, posture and hold dimension here is a DRAWING DEFAULT (no
 * source gives a player's geometry — flute/GEOMETRY_PROPOSAL.md §1, the reed
 * family's §2 "Posture … ILLUSTRATIVE"); the instruments' lengths and holes
 * come from windSpec.ts. The flute is held to the player's right, about 10°
 * forward and 8° down at the foot; the clarinet 35° and the oboe 40° out
 * from the body (the bell at about knee height seated); the bass clarinet
 * near-upright between the knees on its floor peg; the bassoon across the
 * body, its boot at the right hip, its bell above the head to the left.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { cross, elbowOf } from '../bowed/posture.ts';
import { BASSOON_S, holeS, type WindSpec } from './windSpec.ts';

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const D = Math.PI / 180;
export type PostureKind = 'standing' | 'seated';

/* ── the body (drawing defaults, an adult's proportions) ── */
export type Body = {
  posture: PostureKind;
  head: { c: Vec3; r: number };
  neck: Vec3;
  shoulderL: Vec3;
  shoulderR: Vec3;
  hipL: Vec3;
  hipR: Vec3;
  kneeL: Vec3;
  kneeR: Vec3;
  ankleL: Vec3;
  ankleR: Vec3;
  toeL: Vec3;
  toeR: Vec3;
  floorY: number;
};
/** The upper body, the same in every posture (the lips at the origin). */
const UPPER = {
  head: { c: v(0, -50, -95), r: 110 },
  neck: v(0, 150, -112),
  shoulderL: v(186, 186, -116),
  shoulderR: v(-186, 186, -116),
  hipL: v(96, 660, -138),
  hipR: v(-96, 660, -138),
};
export const SEATED_FLOOR = 1185;
export const STANDING_FLOOR = 1610;

export function bodyOf(posture: PostureKind, kneeX = 120): Body {
  if (posture === 'seated') {
    const f = SEATED_FLOOR;
    return {
      ...UPPER,
      posture,
      kneeL: v(kneeX, 690, 300),
      kneeR: v(-kneeX, 690, 300),
      ankleL: v(kneeX + 12, f - 72, 318),
      ankleR: v(-kneeX - 12, f - 72, 318),
      toeL: v(kneeX + 18, f - 12, 430),
      toeR: v(-kneeX - 18, f - 12, 430),
      floorY: f,
    };
  }
  const f = STANDING_FLOOR;
  return {
    ...UPPER,
    posture,
    kneeL: v(112, 1118, -122),
    kneeR: v(-112, 1118, -122),
    ankleL: v(118, f - 72, -132),
    ankleR: v(-118, f - 72, -132),
    toeL: v(124, f - 12, -16),
    toeR: v(-124, f - 12, -16),
    floorY: f,
  };
}

/** A firm chair without arms (seated only): the seat 435 mm above the floor. */
export type Chair = { seat: { min: Vec3; max: Vec3 }; back: { min: Vec3; max: Vec3 }; legs: [Vec3, Vec3][] };
export function chairOf(body: Body): Chair | null {
  if (body.posture !== 'seated') return null;
  const top = body.floorY - 435;
  const seat = { min: v(-225, top, -360), max: v(225, top + 32, 110) };
  const back = { min: v(-215, top - 420, -392), max: v(215, top - 40, -366) };
  const legs: [Vec3, Vec3][] = [];
  for (const x of [-205, 205]) for (const z of [-372, 90]) legs.push([v(x, top + 32, z), v(x + Math.sign(x) * 8, body.floorY, z + Math.sign(z) * 8)]);
  return { seat, back, legs };
}

/* ── the instrument's centre line in 3-D ── */
type Line = { kind: 'line'; s0: number; s1: number; a: Vec3; b: Vec3 };
type Cubic = { kind: 'cubic'; s0: number; s1: number; q: [Vec3, Vec3, Vec3, Vec3]; lut: number[] };
export type PathSeg = Line | Cubic;

const bez = (q: Cubic['q'], t: number): Vec3 => {
  const u = 1 - t;
  return add(add(scale(q[0], u * u * u), scale(q[1], 3 * u * u * t)), add(scale(q[2], 3 * u * t * t), scale(q[3], t * t * t)));
};
const bezD = (q: Cubic['q'], t: number): Vec3 => {
  const u = 1 - t;
  return add(add(scale(sub(q[1], q[0]), 3 * u * u), scale(sub(q[2], q[1]), 6 * u * t)), scale(sub(q[3], q[2]), 3 * t * t));
};
const N_LUT = 64;
function lutOf(q: Cubic['q']): number[] {
  const out = [0];
  let prev = q[0];
  for (let i = 1; i <= N_LUT; i++) {
    const p = bez(q, i / N_LUT);
    out.push(out[i - 1] + len(sub(p, prev)));
    prev = p;
  }
  return out;
}
/** A cubic from a (leaving along ta) to b (arriving along tb) whose length
 *  is `target` mm: the handles are found by bisection (so the drawn curve and
 *  the instrument's s agree). */
export function cubicOfLength(a: Vec3, ta: Vec3, b: Vec3, tb: Vec3, target: number): Cubic['q'] {
  const make = (h: number): Cubic['q'] => [a, add(a, scale(norm(ta), h)), sub(b, scale(norm(tb), h)), b];
  let lo = 1;
  let hi = target * 1.2;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    const L = lutOf(make(m))[N_LUT];
    if (L < target) lo = m;
    else hi = m;
  }
  return make((lo + hi) / 2);
}
const line = (s0: number, s1: number, a: Vec3, b: Vec3): Line => ({ kind: 'line', s0, s1, a, b });
const cubic = (s0: number, s1: number, q: Cubic['q']): Cubic => ({ kind: 'cubic', s0, s1, q, lut: lutOf(q) });

/** A hand on the instrument: the wrist, the way the fingers point, and the
 *  station it holds (all drawing defaults). `dorsal`: the way the back of the
 *  hand faces; `thumbSide`: toward its thumb (figure pass 3 — the 3-D hand,
 *  windHands.ts, starts from this frame). */
export type HandPose = { s: number; wrist: Vec3; dir: Vec3; elbow: Vec3; dorsal?: Vec3; thumbSide?: Vec3 };

export type Layout = {
  spec: WindSpec;
  body: Body;
  chair: Chair | null;
  segs: PathSeg[];
  /** The side the keys face, before it is squared to the tube (a hint). */
  keyHint: Vec3;
  handL: HandPose;
  handR: HandPose;
  /** The bass clarinet's floor peg (from the bow to the floor). */
  peg: { a: Vec3; b: Vec3 } | null;
  /** The bassoon's seat strap or harness, as a polyline. */
  strap: Vec3[] | null;
  /** The flute's air jet: from the lips across the embouchure hole. */
  jet: { a: Vec3; dir: Vec3; len: number; half: number } | null;
  /** Where the lips are (the flute's embouchure hole faces them; default the origin). */
  lips?: Vec3;
};

export type Frame = { p: Vec3; t: Vec3; n: Vec3; b: Vec3 };

export function frameAt(L: Layout, s: number): Frame {
  const segs = L.segs;
  let g = segs.find((q) => s >= q.s0 && s <= q.s1);
  if (!g) g = s < segs[0].s0 ? segs[0] : segs[segs.length - 1];
  let p: Vec3;
  let t: Vec3;
  if (g.kind === 'line') {
    const k = (s - g.s0) / Math.max(1e-6, g.s1 - g.s0);
    t = norm(sub(g.b, g.a));
    p = add(g.a, scale(t, k * len(sub(g.b, g.a))));
  } else {
    const want = ((s - g.s0) / Math.max(1e-6, g.s1 - g.s0)) * g.lut[N_LUT];
    let i = 1;
    while (i < N_LUT && g.lut[i] < want) i++;
    const f = (want - g.lut[i - 1]) / Math.max(1e-9, g.lut[i] - g.lut[i - 1]);
    const tt = (i - 1 + Math.max(0, Math.min(1, f))) / N_LUT;
    p = bez(g.q, tt);
    t = norm(bezD(g.q, tt));
  }
  let n = sub(L.keyHint, scale(t, dot(L.keyHint, t)));
  n = len(n) < 1e-6 ? norm(cross(t, v(1, 0, 0))) : norm(n);
  const b = norm(cross(t, n));
  return { p, t, n, b };
}
export const pointAt = (L: Layout, s: number): Vec3 => frameAt(L, s).p;

/** A point at angle `deg` round the tube from its key side, `r` from the axis. */
export function around(L: Layout, s: number, deg: number, r: number): Vec3 {
  const f = frameAt(L, s);
  const a = deg * D;
  return add(f.p, add(scale(f.n, r * Math.cos(a)), scale(f.b, r * Math.sin(a))));
}

/** DPA's one-third rule (soprano_clarinet/SOURCES.md §0.1): one third of the
 *  instrument's length U from the BELL end, measured along the instrument
 *  toward the reed — above the bell on a clarinet and an oboe, below the
 *  bell top on a bassoon (whose bell points up). */
export function oneThirdS(spec: WindSpec): number | null {
  if (!spec.U) return null;
  return spec.end - spec.U.mm / 3;
}

const UPPER_ARM = 290;
const FOREARM = 262;
const meanS = (spec: WindSpec, ks: number[]) => ks.reduce((a, k) => a + holeS(spec, k), 0) / ks.length;

/** A direction or offset in the tube's own frame at s: along the tube toward
 *  its far end (t), out of its key side (n), across it (b). */
export type TubeLocal = readonly [t: number, n: number, b: number];
/**
 * A HAND HELD ON THE TUBE (figure pass 3, owner 2026-10-15): placed by its
 * knuckle row's centre `K` (tube-local, from the axis at s), the way it points
 * from the wrist to the knuckles (`along`), the way its back faces (`dorsal`)
 * and the side its thumb is on (`thumb`), all in the tube's frame at s. The
 * wrist is a palm's length (95 mm) behind the knuckles; the elbow is the
 * adult arm's from the shoulder, bent toward `pole`. windHands.ts then turns
 * the hand about this wrist until every pad is on its key.
 */
export type Hold = { K: TubeLocal; along: TubeLocal; dorsal: TubeLocal; thumb: TubeLocal };
const PALM_TO_KNUCKLES = 95;
function holdHand(L: Pick<Layout, 'segs' | 'keyHint'>, s: number, h: Hold, shoulder: Vec3, pole: Vec3): HandPose {
  const f = frameAt(L as Layout, s);
  const loc = (q: TubeLocal) => add(scale(f.t, q[0]), add(scale(f.n, q[1]), scale(f.b, q[2])));
  const dir = norm(loc(h.along));
  const wrist = sub(add(f.p, loc(h.K)), scale(dir, PALM_TO_KNUCKLES));
  return { s, wrist, dir, elbow: elbowOf(shoulder, wrist, UPPER_ARM, FOREARM, pole), dorsal: norm(loc(h.dorsal)), thumbSide: norm(loc(h.thumb)) };
}

/**
 * EACH INSTRUMENT'S TWO HOLDS (tube-local, mm and unit directions; drawing
 * defaults found by fitting the shared hand to the keys — windHands.ts):
 *   • flute / piccolo: the LEFT hand's knuckles in front of and under the
 *     tube near the head joint, its palm turned up toward the player, the
 *     fingers rising and curling back over the top (the flute on the base of
 *     the index); the RIGHT hand's knuckles behind and under the tube, the
 *     fingers arching forward over the top, the back of the hand toward the
 *     player;
 *   • clarinet, oboe, bass clarinet: each palm on its own side of the tube
 *     (the left on the player's left), the fingers wrapping round its front,
 *     the thumbs behind;
 *   • bassoon: the left palm beside and behind the wing joint (the fingers
 *     onto its open side), the right palm on the boot's right side (the
 *     fingers onto its front face, the thumb onto its back).
 * Every hand: the index nearest the player's end, the thumb on that side.
 */
const HOLDS: Record<'flute' | 'simpleFlute' | 'piccolo' | 'clarinet' | 'oboe' | 'bassClarinet' | 'bassoon', { L: Hold; R: Hold }> = {
  flute: {
    L: { K: [10, -25.7, 11.4], along: [0.25, 0.93, 0.28], dorsal: [0.05, -0.3, 0.95], thumb: [-0.97, 0.22, 0.12] },
    R: { K: [31.8, -21.4, -28.5], along: [0.14, 0.98, 0.14], dorsal: [0.03, 0.14, -0.99], thumb: [-0.99, 0.14, -0.01] },
  },
  simpleFlute: {
    L: { K: [50.3, -30.3, 17.9], along: [0.25, 0.94, 0.25], dorsal: [0.12, -0.28, 0.95], thumb: [-0.96, 0.2, 0.18] },
    R: { K: [79.9, -23.3, -32.6], along: [0.17, 0.95, 0.25], dorsal: [0.03, 0.25, -0.97], thumb: [-0.99, 0.17, 0.01] },
  },
  piccolo: {
    L: { K: [18.7, -4.6, 32.8], along: [0.32, 0.89, 0.32], dorsal: [0, -0.33, 0.94], thumb: [-0.95, 0.3, 0.11] },
    R: { K: [37.6, 17.1, -42], along: [0.06, 0.95, 0.3], dorsal: [0, 0.3, -0.95], thumb: [-1, 0.06, 0.02] },
  },
  clarinet: {
    L: { K: [10.2, 3.7, 45.8], along: [0.22, 0.8, -0.56], dorsal: [-0.05, 0.58, 0.81], thumb: [-0.97, 0.15, -0.17] },
    R: { K: [-4.5, -12.6, -42.6], along: [0.21, 0.81, 0.55], dorsal: [0.4, 0.45, -0.8], thumb: [-0.89, 0.39, -0.23] },
  },
  oboe: {
    L: { K: [17.4, 6, 52], along: [0.15, 0.82, -0.56], dorsal: [0.01, 0.56, 0.83], thumb: [-0.99, 0.13, -0.08] },
    R: { K: [-23.3, -12.4, -47.7], along: [0.07, 0.92, 0.39], dorsal: [-0.04, 0.39, -0.92], thumb: [-1, 0.04, 0.06] },
  },
  bassClarinet: {
    L: { K: [30, 5.1, 50.1], along: [0.32, 0.77, -0.55], dorsal: [0.29, 0.47, 0.84], thumb: [-0.9, 0.42, 0.07] },
    R: { K: [10, -6, -49], along: [0.2, 0.83, 0.52], dorsal: [0.25, 0.47, -0.85], thumb: [-0.95, 0.3, -0.12] },
  },
  bassoon: {
    L: { K: [-14.6, 21.9, 75.2], along: [-0.33, 0.81, -0.5], dorsal: [-0.51, 0.29, 0.81], thumb: [-0.8, -0.52, -0.31] },
    R: { K: [3.8, 45, -60], along: [0.22, 0.7, 0.68], dorsal: [0.13, 0.66, -0.74], thumb: [-0.97, 0.25, 0.02] },
  },
};

/* ── the instruments' holds ── */

/**
 * THE FLUTIST'S SHOULDERS (figure pass 2, owner 2026-10-15: the left upper
 * arm "reads as a band across the shoulder"). With the shoulders square to the
 * audience the left hand, ≈ 30 cm out along the flute to the player's right,
 * was 52 cm from the left shoulder — a nearly straight arm (≈ 37° of elbow
 * bend) whose upper arm ran level across the chest. A flutist does not stand
 * square: the chest turns to the RIGHT and the head turns back LEFT to the
 * flute (the classic flute stance), and the left shoulder comes forward as
 * the arm reaches across. Here the shoulders turn ≈ 25° about the spine (the
 * left one forward, the right one back) and the left one comes ≈ 35 mm
 * forward: the left hand is then ≈ 47 cm from its shoulder, the elbow bends
 * ≈ 65° and hangs in front of the chest, below the line from the shoulder to
 * the hand — the real hold. The head, the hips and the legs stay (the twist is
 * above the waist; the head keeps the lips on the embouchure hole), and the
 * hands stay on the keys where they were. Drawing defaults.
 */
export const FLUTE_TURN_DEG = 25;
export function flutistBody(b: Body): Body {
  const a = FLUTE_TURN_DEG * D;
  const c = Math.cos(a);
  const s = Math.sin(a);
  // About the spine's vertical axis through the base of the neck: +x (the
  // player's left) toward +z (forward).
  const turn = (p: Vec3): Vec3 => {
    const dx = p.x - b.neck.x;
    const dz = p.z - b.neck.z;
    return { x: b.neck.x + dx * c - dz * s, y: p.y, z: b.neck.z + dx * s + dz * c };
  };
  const L = turn(b.shoulderL);
  return { ...b, shoulderL: { x: L.x - 15, y: L.y + 4, z: L.z + 35 }, shoulderR: turn(b.shoulderR) };
}

/** Flute and piccolo: the embouchure hole just under the lower lip, the tube
 *  out to the player's right, ~10° forward and ~8° down at the foot. */
export function fluteLayout(spec: WindSpec, posture: PostureKind): Layout {
  const body = flutistBody(bodyOf(posture));
  const F0 = v(0, 8, 13);
  const a = norm(v(-Math.cos(8 * D) * Math.cos(10 * D), Math.sin(8 * D), Math.cos(8 * D) * Math.sin(10 * D)));
  const segs: PathSeg[] = [line(-29, spec.end, add(F0, scale(a, -29)), add(F0, scale(a, spec.end)))];
  const keyHint = v(0, -1, 0.28);
  const base = { segs, keyHint };
  const small = spec.id === 'piccolo';
  // The left hand holds the head end of the body (the upper holes), the
  // right hand the lower holes; the right little finger reaches the foot keys.
  const sL = meanS(spec, small ? [9, 10, 11, 12] : [10, 11, 12, 13]);
  const sR = meanS(spec, small ? [4, 5, 6, 7] : [5, 6, 7, 8]);
  // (figure pass 3) The 3-D hands' holds, found by windHands' fit and kept here.
  const simple = spec.holes.some((h) => h.kind === 'open');
  const H = small ? HOLDS.piccolo : simple ? HOLDS.simpleFlute : HOLDS.flute;
  const handL = holdHand(base, sL, H.L, body.shoulderL, v(-0.15, 1, 0.55));
  const handR = holdHand(base, sR, H.R, body.shoulderR, v(-0.2, 1, 0));
  return { spec, body, chair: chairOf(body), segs, keyHint, handL, handR, peg: null, strap: null, jet: { a: v(0, 1, 6), dir: norm(add(scale(a, 0.25), v(0, 0.35, 1))), len: 150, half: 15 } };
}

/** Clarinet and oboe: straight out from the lips, `deg` from the body. */
export function straightReedLayout(spec: WindSpec, posture: PostureKind, deg: number): Layout {
  const body = bodyOf(posture);
  const T = v(0, 4, 8);
  const d = v(0, Math.cos(deg * D), Math.sin(deg * D));
  const segs: PathSeg[] = [line(0, spec.end, T, add(T, scale(d, spec.end)))];
  const keyHint = v(0, -Math.sin(deg * D), Math.cos(deg * D));
  const base = { segs, keyHint };
  const hi = spec.id === 'oboe' ? [12, 13, 14, 15] : [11, 12, 13, 14];
  const lo = spec.id === 'oboe' ? [3, 4, 5, 6] : [3, 4, 5, 6];
  const H = spec.id === 'oboe' ? HOLDS.oboe : HOLDS.clarinet;
  const handL = holdHand(base, meanS(spec, hi), H.L, body.shoulderL, v(0.5, 1, -0.3));
  const handR = holdHand(base, meanS(spec, lo), H.R, body.shoulderR, v(-0.5, 1, -0.3));
  return { spec, body, chair: chairOf(body), segs, keyHint, handL, handR, peg: null, strap: null, jet: null };
}

/** Bass clarinet, seated: the mouthpiece into the lips from below and in
 *  front, the curved neck back to the upright body between the knees, the
 *  bow at the bottom and the bell turned up and forward; a floor peg. */
export function bassClarinetLayout(spec: WindSpec): Layout {
  const body = bodyOf('seated', 150);
  const T = v(0, 4, 8);
  const em = norm(v(-0.05, 0.62, 0.78));
  const M = add(T, scale(em, 95));
  // The longer low C model leans a little farther forward (drawing default).
  const lean = spec.end > 1400 ? 15 : 8;
  const db = norm(v(0, Math.cos(lean * D), Math.sin(lean * D)));
  const top = v(-28, 252, 168);
  const pc = spec.pieces;
  const neck = pc.find((p) => p.id === 'neck')!;
  const lower = pc.find((p) => p.id === 'lower')!;
  const bow = pc.find((p) => p.id === 'bow')!;
  const bell = pc.find((p) => p.id === 'bell')!;
  const bottom = add(top, scale(db, lower.s1 - pc.find((p) => p.id === 'upper')!.s0));
  const eb = norm(v(0, -0.86, 0.52));
  const bellStart = add(bottom, v(0, -16, spec.end > 1400 ? 185 : 112));
  const segs: PathSeg[] = [
    line(0, neck.s0, T, M),
    cubic(neck.s0, neck.s1, cubicOfLength(M, em, top, db, neck.s1 - neck.s0)),
    line(neck.s1, lower.s1, top, bottom),
    cubic(bow.s0, bow.s1, cubicOfLength(bottom, db, bellStart, eb, bow.s1 - bow.s0)),
    line(bell.s0, bell.s1, bellStart, add(bellStart, scale(eb, bell.s1 - bell.s0))),
  ];
  const keyHint = v(0, -0.12, 1);
  const base = { segs, keyHint };
  // The right hand's station: its finger plates' (windHands) middle, on the lower joint's upper half.
  const handL = holdHand(base, 470, HOLDS.bassClarinet.L, body.shoulderL, v(0.5, 1, -0.3));
  const handR = holdHand(base, lower.s0 + 64, HOLDS.bassClarinet.R, body.shoulderR, v(-0.3, 1, -0.3));
  // The peg: from the bow's lowest point straight down to the floor.
  let lowest = bottom;
  const g = segs[3] as Cubic;
  for (let i = 0; i <= 32; i++) {
    const p = bez(g.q, i / 32);
    if (p.y > lowest.y) lowest = p;
  }
  const pegTop = add(lowest, v(0, 22, 0));
  return { spec, body, chair: chairOf(body), segs, keyHint, handL, handR, peg: { a: pegTop, b: v(pegTop.x, body.floorY, pegTop.z + 30) }, strap: null, jet: null };
}

/** The bassoon's long-joint axis: from the boot's bottom up toward the bell. */
export const BSN = {
  base: v(-215, 640, 150),
  dir: norm(v(0.48, -0.866, -0.14)),
  /** The wing joint and the boot's down bore sit beside the long joint,
   *  45 mm away (drawing default), SIDE BY SIDE as the audience sees the
   *  bassoon's front: the wing on the player's left of the long joint,
   *  nearest the left hand, its finger holes open to the fingers (art fix
   *  2026-10-16: it sat straight behind the long joint, so the left fingers
   *  could not reach its holes). */
  gap: 45,
  /** Which way the wing joint lies from the long joint (before squaring to
   *  the axis): to the player's left and down, a little back. */
  wingSide: v(0.6, 0.3, -0.75),
  bootTop: 390,
  wingTop: 890,
  longTop: 1000,
  bellTop: 1350,
};
/** `side`: which way the wing joint lies (BSN.wingSide in the scene; the
 *  instrument-alone portraits keep their own picture, BSN_PORTRAIT_SIDE). */
export function bassoonAxes(side: Vec3 = BSN.wingSide) {
  const d = BSN.dir;
  const w = norm(sub(side, scale(d, dot(side, d))));
  const L = (h: number) => add(BSN.base, scale(d, h));
  const W = (h: number) => add(add(BSN.base, scale(w, BSN.gap)), scale(d, h));
  return { d, w, L, W };
}

/** Bassoon: the reed into the lips from the player's left, the bocal's
 *  S-curve up and over to the wing joint, down the wing joint and the boot,
 *  the U-turn at the boot's bottom, up the long joint to the bell. */
const BSN_LH_S = 780;
/** The portraits' wing side (the bassoon alone, on its side): the picture the
 *  HOW IT SOUNDS and ORIENT figures were laid out on — the same instrument,
 *  its bocal curling the same way; only the scene's hold changed. */
export const BSN_PORTRAIT_SIDE = v(0, 0, -1);
export function bassoonLayout(posture: PostureKind, spec: WindSpec, wingSide: Vec3 = BSN.wingSide): Layout {
  const body = bodyOf(posture);
  const { d, w, L, W } = bassoonAxes(wingSide);
  const S = BASSOON_S;
  const T = v(0, 4, 8);
  const er = norm(v(0.78, 0.12, 0.58));
  const reedBase = add(T, scale(er, S.reed));
  const wingTop = W(BSN.wingTop);
  const segs: PathSeg[] = [
    line(0, S.reed, T, reedBase),
    cubic(S.reed, S.bocal, cubicOfLength(reedBase, er, wingTop, scale(d, -1), S.bocal - S.reed)),
    line(S.bocal, S.wing, wingTop, W(BSN.bootTop)),
    line(S.wing, S.bootDown, W(BSN.bootTop), W(0)),
    cubic(S.bootDown, S.turn, cubicOfLength(W(0), scale(d, -1), L(0), d, S.turn - S.bootDown)),
    line(S.turn, S.bootUp, L(0), L(BSN.bootTop)),
    line(S.bootUp, S.long, L(BSN.bootTop), L(BSN.longTop)),
    line(S.long, S.bell, L(BSN.longTop), L(BSN.bellTop)),
  ];
  const keyHint = norm(add(v(0, 0, 1), scale(w, 0.15)));
  const base = { segs, keyHint };
  void spec;
  const handL = holdHand(base, BSN_LH_S, HOLDS.bassoon.L, body.shoulderL, v(1, 0.6, -0.2));
  const handR = holdHand(base, 1040, HOLDS.bassoon.R, body.shoulderR, v(-0.5, 0.8, -0.45));
  // A seat strap from the chair's front edge up round the boot's bottom; a
  // harness from the boot up round the neck when standing (drawing defaults).
  const cup = add(L(0), scale(w, BSN.gap / 2));
  const strap = posture === 'seated' ? [v(cup.x - 60, body.floorY - 435, -60), add(cup, v(0, 30, 0)), v(cup.x + 60, body.floorY - 435, 60)] : [add(W(BSN.bootTop + 60), v(0, 0, -20)), v(-60, 360, -60), body.neck];
  return { spec, body, chair: chairOf(body), segs, keyHint, handL, handR, peg: null, strap, jet: null };
}

/** Sample the center line every `step` mm (for the art and the solids). */
export function samples(Lt: Layout, s0: number, s1: number, step: number): { s: number; f: Frame }[] {
  const out: { s: number; f: Frame }[] = [];
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    out.push({ s, f: frameAt(Lt, s) });
  }
  return out;
}

/**
 * The instrument alone, turned to be READ (ORIENT's figure, HOW IT SOUNDS):
 * its main axis along +x (the player's end at the left), `up` toward −y,
 * the keys toward the viewer (+z, the side view). A rigid turn of the same
 * centre line — the same s, the same holes — so the physics drawn on it is
 * the physics of the scene. Only the keys' roll is chosen for the picture.
 */
export function portraitOf(L: Layout, axis: Vec3, up: Vec3, at: Vec3 = { x: 0, y: 0, z: 0 }, stand: 0 | 1 | -1 = 0): Layout {
  const e1 = norm(axis);
  const e2 = norm(sub(up, scale(e1, dot(up, e1))));
  const e3 = norm(cross(e1, e2));
  const o = frameAt(L, 0).p;
  const T = (p: Vec3): Vec3 => {
    const q = sub(p, o);
    const x = dot(q, e1);
    const y = -dot(q, e2);
    // Stood on end: the main axis down the screen (1) or up it (−1).
    const r = stand === 1 ? { x: -y, y: x } : stand === -1 ? { x: y, y: -x } : { x, y };
    return add(at, { x: r.x, y: r.y, z: -dot(q, e3) });
  };
  const segs: PathSeg[] = L.segs.map((g) => (g.kind === 'line' ? line(g.s0, g.s1, T(g.a), T(g.b)) : cubic(g.s0, g.s1, g.q.map(T) as Cubic['q'])));
  return { ...L, segs, keyHint: v(0, 0, 1), lips: T(L.lips ?? v(0, 0, 0)), jet: null, peg: null, strap: null };
}