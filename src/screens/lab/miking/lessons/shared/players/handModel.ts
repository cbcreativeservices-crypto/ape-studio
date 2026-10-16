/**
 * THE HAND — one adult hand with real joints (figure pass 3, owner
 * 2026-10-15: "check that the hand is correctly positioned, placed, bent,
 * fingers and digits accounted for"). Pure: no React, no Skia, so the tests
 * measure the very hand the drawing paints (PlayerFigure.drawHand3).
 *
 * ONE MODEL, POSED PER INSTRUMENT. The hand is a 3-D skeleton in its own
 * frame — the wrist crease at the origin, +x along the hand to the knuckles,
 * +y across the palm toward the LITTLE finger, +z out of the BACK of the hand
 * (the nail side) — placed in any world by a frame (wrist, along, dorsal,
 * toward-the-thumb). No cross product is ever taken, so a left-handed world
 * (the lesson frame: +y down) and a right-handed one pose the same hand.
 *
 * THE BONES (mm, joint centre to joint centre, an adult of the house size:
 * hand 186 mm wrist crease → middle fingertip ≈ 0.82 of the 228 mm head;
 * ratios from adult hand anthropometry — each finger's proximal : middle :
 * distal phalanx ≈ 1 : 0.6 : 0.45, the middle finger longest, then the ring,
 * the index, the little):
 *   • the knuckles (MCP) on an arc, the middle furthest out (100 mm from the
 *     wrist crease), the four ≈ 19 mm apart (the hand ≈ 84 mm across them);
 *   • each finger three phalanges, ≈ 21 mm wide at the base tapering to
 *     ≈ 15 mm at the pad;
 *   • the thumb from its saddle joint (CMC) at the base of the palm: a
 *     metacarpal inside the thenar mass, then two phalanges, ≈ 24 mm wide.
 * JOINTS bend where a hand bends and only as far: the knuckle (MCP) −20…90°,
 * the middle joint (PIP) 0…110°, the end joint (DIP) 0…80° (coupled to the
 * PIP, ≈ 0.7 of it, as a curling finger does), spread at the knuckle ±26°
 * (index), ±17° (middle), ±21° (ring), ±32° (little);
 * the thumb's MCP 0…60°, IP −10…80°.
 *
 * POSING: `reachFinger` / `reachThumb` solve each digit so its pad lands on a
 * target (a string at a fret, a key, a valve button, a tone hole) — or the
 * digit curls by a given amount. `handOn` builds a whole hand from a frame
 * and its targets. Every solved hand reports how far each pad missed (the
 * tests hold the misses to millimetres: the hand is ON what it plays).
 */

export type V3 = { x: number; y: number; z: number };
export const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const mul = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit = (a: V3): V3 => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
export const h3 = { add, sub, mul, dot, len, unit };

export type FingerName = 'index' | 'middle' | 'ring' | 'little';
export type DigitName = 'thumb' | FingerName;
export const FINGER_NAMES: readonly FingerName[] = ['index', 'middle', 'ring', 'little'];

/**
 * THE ADULT HAND (mm). `mcp`: the knuckle's centre in the hand frame (x along,
 * y across toward the little finger). `seg`: proximal, middle, distal
 * phalanges (the distal to the centre of the pad's end). `r`: the digit's
 * half-width at the knuckle, the middle joint, the end joint and the tip.
 */
export const HAND = {
  fingers: [
    { name: 'index', mcp: { x: 96, y: -27 }, seg: [38, 22, 17], r: [10.6, 9.9, 8.9, 7.8] },
    { name: 'middle', mcp: { x: 100, y: -8.5 }, seg: [43, 26, 17], r: [11.0, 10.3, 9.3, 8.1] },
    { name: 'ring', mcp: { x: 96, y: 9.5 }, seg: [40, 25, 17], r: [10.4, 9.7, 8.8, 7.7] },
    { name: 'little', mcp: { x: 86, y: 26 }, seg: [32, 19, 16], r: [9.2, 8.6, 7.8, 6.9] },
  ],
  /** The thumb: its saddle joint in the hand frame (on the palm side of the
   *  wrist's thumb edge), its metacarpal, proximal and distal (to the pad). */
  thumb: { cmc: { x: 24, y: -24, z: -10 }, seg: [44, 31, 26], r: [15, 12.4, 11.2, 9.6] },
  /** The palm: ≈ 84 mm across the knuckles, ≈ 58 mm across the wrist crease,
   *  ≈ 28 mm thick (its two faces at z = ±14 round the bones' plane). */
  thick: 28,
  wristHalf: 27.5,
} as const;

/** A finger's flexion and spread (radians; flexion bends toward the palm). */
export type FingerPose = { abd: number; mcp: number; pip: number; dip: number };
/** The thumb: its metacarpal's direction from the saddle joint — `yaw` away
 *  from the index along the palm (toward the thumb side), `pitch` out of the
 *  palm's plane toward the palm side (palmar abduction, opposition) — then
 *  the MCP and IP flexions, bending toward the palm's middle. */
export type ThumbPose = { yaw: number; pitch: number; mcp: number; ip: number };

/** Where a hand is and which way it faces. `x`: wrist → knuckles; `z`: out
 *  of the back of the hand; `y`: across toward the little finger. */
export type HandFrame = { o: V3; x: V3; y: V3; z: V3 };

/** A frame from the wrist, the way the hand points, the way its back faces
 *  and the side the thumb is on (only its sign across the hand counts). */
export function handFrame(wrist: V3, along: V3, dorsal: V3, thumbSide: V3): HandFrame {
  const x = unit(along);
  const z = unit(sub(dorsal, mul(x, dot(dorsal, x))));
  let y = sub(thumbSide, add(mul(x, dot(thumbSide, x)), mul(z, dot(thumbSide, z))));
  y = mul(unit(y), -1); // toward the little finger
  return { o: wrist, x, y, z };
}

/** A point of the hand's own frame, in the world. */
export const inFrame = (f: HandFrame, x: number, y: number, z: number): V3 => add(f.o, add(mul(f.x, x), add(mul(f.y, y), mul(f.z, z))));
/** A direction of the hand's own frame, in the world. */
export const dirIn = (f: HandFrame, x: number, y: number, z: number): V3 => add(mul(f.x, x), add(mul(f.y, y), mul(f.z, z)));

/** Joint limits (radians). */
export const LIMITS = {
  /** Spread at the knuckle, per finger (index … little): the outer fingers spread furthest. */
  abd: [0.46, 0.3, 0.36, 0.56],
  mcp: [-0.35, 1.57],
  pip: [0, 1.92],
  dip: [0, 1.4],
  thumbMcp: [0, 1.05],
  thumbIp: [-0.17, 1.4],
} as const;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
/** The end joint follows the middle joint as a curling finger does. */
export const DIP_RATIO = 0.7;

export type Digit = {
  name: DigitName;
  /** Joint centres base → pad: fingers MCP, PIP, DIP, tip; the thumb CMC, MCP, IP, tip. */
  joints: V3[];
  /** Half-widths at those joints. */
  r: number[];
  /** Each bone's nail-side (dorsal) normal. */
  dorsal: V3[];
};

export type HandSkeleton = {
  frame: HandFrame;
  fingers: Digit[];
  thumb: Digit;
  /** The palm's outline points (both faces), for the drawing's hull. */
  palm: V3[];
  /** How far each digit's pad missed its target (mm; index … little, thumb). */
  miss: number[];
};

/** A finger's joints from its pose. */
export function fingerJoints(f: HandFrame, i: number, p: FingerPose): Digit {
  const F = HAND.fingers[i];
  const m = inFrame(f, F.mcp.x, F.mcp.y, 0);
  const b = add(mul(f.x, Math.cos(p.abd)), mul(f.y, Math.sin(p.abd)));
  const joints: V3[] = [m];
  const dorsal: V3[] = [];
  let phi = 0;
  let at = m;
  const bends = [p.mcp, p.pip, p.dip];
  for (let k = 0; k < 3; k++) {
    phi += bends[k];
    const d = sub(mul(b, Math.cos(phi)), mul(f.z, Math.sin(phi)));
    dorsal.push(add(mul(f.z, Math.cos(phi)), mul(b, Math.sin(phi))));
    at = add(at, mul(d, F.seg[k]));
    joints.push(at);
  }
  return { name: F.name as FingerName, joints, r: [...F.r], dorsal };
}

/** The thumb's joints from its pose. Its flexion bends toward the palm's
 *  middle (the pad turns to meet the fingers). */
export function thumbJoints(f: HandFrame, p: ThumbPose): Digit {
  const T = HAND.thumb;
  const c = inFrame(f, T.cmc.x, T.cmc.y, T.cmc.z);
  // The metacarpal: from along the index, turned `yaw` toward the thumb side and `pitch` toward the palm.
  const d0 = unit(dirIn(f, Math.cos(p.yaw) * Math.cos(p.pitch), -Math.sin(p.yaw) * Math.cos(p.pitch), -Math.sin(p.pitch)));
  // The bend's direction: toward the palm's centre, square to the bone.
  const toPalm = sub(inFrame(f, 70, 0, -16), c);
  let n = sub(toPalm, mul(d0, dot(toPalm, d0)));
  n = len(n) < 1e-6 ? mul(f.z, -1) : unit(n);
  const joints: V3[] = [c];
  const dorsal: V3[] = [];
  let at = c;
  let phi = 0;
  const bends = [0, p.mcp, p.ip];
  for (let k = 0; k < 3; k++) {
    phi += bends[k];
    const d = add(mul(d0, Math.cos(phi)), mul(n, Math.sin(phi)));
    // The nail faces away from the pad (the pad turns toward n).
    dorsal.push(sub(mul(d0, Math.sin(phi)), mul(n, Math.cos(phi))));
    at = add(at, mul(d, T.seg[k]));
    joints.push(at);
  }
  return { name: 'thumb', joints, r: [...T.r], dorsal };
}

/** A relaxed finger, curled by `c` (0 straight … 1 a loose fist). */
export const curled = (c: number, abd = 0): FingerPose => ({ abd, mcp: 0.55 * c * 1.2, pip: 1.1 * c * 1.2, dip: 1.1 * c * 1.2 * DIP_RATIO });
/** A relaxed thumb beside the index. */
export const THUMB_REST: ThumbPose = { yaw: 0.62, pitch: 0.42, mcp: 0.15, ip: 0.15 };

/**
 * A finger solved so its PAD (the end of the distal phalanx) lands on
 * `target` (world): the spread from the target's direction across the palm,
 * then the middle joint's flexion from the knuckle-to-target distance (the
 * end joint following at DIP_RATIO, or `dipRatio`), then the knuckle's
 * flexion. Out of reach: the finger points straight at it; too close: as
 * curled as it goes.
 */
export function reachFinger(f: HandFrame, i: number, target: V3, dipRatio = DIP_RATIO): { pose: FingerPose; miss: number } {
  const F = HAND.fingers[i];
  const m = inFrame(f, F.mcp.x, F.mcp.y, 0);
  const r = sub(target, m);
  const rx = dot(r, f.x);
  const ry = dot(r, f.y);
  const rz = dot(r, f.z);
  // The spread: the finger's plane (its bones and the back of the hand's
  // normal) turned about the knuckle to hold the target — tan(abd) = ry / rx,
  // whether the pad lies ahead of the knuckle or curled back behind it.
  const lim = LIMITS.abd[i];
  const abd = Math.abs(rx) > 4 ? clamp(Math.atan(ry / rx), -lim, lim) : Math.sign(ry) * lim;
  const b = add(mul(f.x, Math.cos(abd)), mul(f.y, Math.sin(abd)));
  const a = dot(r, b);
  const c = -rz; // toward the palm
  const D = Math.hypot(a, c);
  const [L1, L2, L3] = F.seg;
  // The chain's reach for a middle-joint flexion q (the end joint following).
  const reach = (q: number) => {
    const q3 = Math.min(LIMITS.dip[1], q * dipRatio);
    const x = L1 + L2 * Math.cos(q) + L3 * Math.cos(q + q3);
    const y = L2 * Math.sin(q) + L3 * Math.sin(q + q3);
    return { d: Math.hypot(x, y), ang: Math.atan2(y, x), q3 };
  };
  let lo: number = LIMITS.pip[0];
  let hi: number = LIMITS.pip[1];
  if (D >= reach(lo).d) hi = lo;
  else if (D <= reach(hi).d) lo = hi;
  else
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (reach(mid).d > D) lo = mid;
      else hi = mid;
    }
  const q = (lo + hi) / 2;
  const R = reach(q);
  const mcp = clamp(Math.atan2(c, a) - R.ang, LIMITS.mcp[0], LIMITS.mcp[1]);
  const pose: FingerPose = { abd, mcp, pip: q, dip: R.q3 };
  const tip = fingerJoints(f, i, pose).joints[3];
  return { pose, miss: len(sub(tip, target)) };
}

/** The thumb solved so its pad lands on `target` (a small search over its
 *  metacarpal's direction and its flexion; MCP and IP bend together). */
export function reachThumb(f: HandFrame, target: V3, from: ThumbPose = THUMB_REST): { pose: ThumbPose; miss: number } {
  // A coarse sweep of the thumb's whole range first (the search is local),
  // then the best start refined; a natural thumb (near `from`) wins a tie.
  const err = (p: ThumbPose) => len(sub(thumbJoints(f, p).joints[3], target));
  let start = from;
  let e0 = err(from);
  for (let a = -0.2; a <= 1.41; a += 0.2)
    for (let b = -0.3; b <= 1.46; b += 0.25)
      for (let m = 0; m <= 1.06; m += 0.35)
        for (let q = 0; q <= 1.41; q += 0.35) {
          const p = { yaw: a, pitch: b, mcp: m, ip: q };
          const e = err(p) + 0.5 * (Math.abs(a - from.yaw) + Math.abs(b - from.pitch));
          if (e < e0) {
            e0 = e;
            start = p;
          }
        }
  return refineThumb(f, target, start);
}

function refineThumb(f: HandFrame, target: V3, from: ThumbPose): { pose: ThumbPose; miss: number } {
  const err = (p: ThumbPose) => len(sub(thumbJoints(f, p).joints[3], target));
  let best = { ...from };
  let e = err(best);
  const steps = [0.3, 0.15, 0.07, 0.03, 0.012];
  for (const s of steps) {
    for (let it = 0; it < 30; it++) {
      let moved = false;
      for (const key of ['yaw', 'pitch', 'mcp', 'ip'] as const) {
        for (const dd of [s, -s]) {
          const p = { ...best, [key]: best[key] + dd };
          p.yaw = clamp(p.yaw, -0.2, 1.4);
          p.pitch = clamp(p.pitch, -0.35, 1.45);
          p.mcp = clamp(p.mcp, LIMITS.thumbMcp[0], LIMITS.thumbMcp[1]);
          p.ip = clamp(p.ip, LIMITS.thumbIp[0], LIMITS.thumbIp[1]);
          const ee = err(p);
          if (ee < e - 1e-4) {
            best = p;
            e = ee;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  }
  return { pose: best, miss: e };
}

/** The palm's outline points (both faces): the wrist, the thumb's base, the
 *  knuckle row, the heel under the little finger. */
export function palmPoints(f: HandFrame): V3[] {
  const ring: [number, number][] = [
    [0, -HAND.wristHalf],
    [34, -38],
    [70, -36],
    [96, -35],
    [103, -8.5],
    [99, 11],
    [89, 34],
    [52, 37],
    [14, 32],
    [0, HAND.wristHalf],
  ];
  const out: V3[] = [];
  for (const z of [HAND.thick / 2, -HAND.thick / 2]) for (const [x, y] of ring) out.push(inFrame(f, x, y, z * (x < 10 ? 0.9 : 1)));
  return out;
}

/** What each digit does: a target for its pad, or a curl (0 … 1). */
export type DigitGoal = V3 | { curl: number; abd?: number } | FingerPose;
export type ThumbGoal = V3 | ThumbPose;
const isV3 = (g: unknown): g is V3 => typeof (g as V3).x === 'number' && typeof (g as V3).z === 'number';
const isFingerPose = (g: unknown): g is FingerPose => typeof (g as FingerPose).pip === 'number';

/**
 * A whole hand: the frame, then each finger (index … little) to its goal and
 * the thumb to its own. `dipRatio`: how far the end joints follow the middle
 * joints (0.7 a curling finger; less for a finger pressing flat on its pad).
 */
export function handOn(frame: HandFrame, fingers: readonly DigitGoal[], thumb: ThumbGoal = THUMB_REST, dipRatio = DIP_RATIO): HandSkeleton {
  const miss: number[] = [];
  const fs = HAND.fingers.map((_, i) => {
    const g = fingers[i] ?? { curl: 0.3 };
    if (isV3(g)) {
      const s = reachFinger(frame, i, g, dipRatio);
      miss.push(s.miss);
      return fingerJoints(frame, i, s.pose);
    }
    miss.push(0);
    if (isFingerPose(g)) return fingerJoints(frame, i, g);
    return fingerJoints(frame, i, curled(g.curl, g.abd ?? (i - 1.5) * 0.05));
  });
  let tp: ThumbPose;
  if (isV3(thumb)) {
    const s = reachThumb(frame, thumb);
    miss.push(s.miss);
    tp = s.pose;
  } else {
    miss.push(0);
    tp = thumb;
  }
  return { frame, fingers: fs, thumb: thumbJoints(frame, tp), palm: palmPoints(frame), miss };
}

/** Rotate v about the unit axis k by a (Rodrigues; the sense of a does not
 *  matter to the search below, which tries both). */
function rot(v: V3, k: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const kxv = { x: k.y * v.z - k.z * v.y, y: k.z * v.x - k.x * v.z, z: k.x * v.y - k.y * v.x };
  return add(add(mul(v, c), mul(kxv, s)), mul(k, dot(k, v) * (1 - c)));
}
const rotFrame = (f: HandFrame, k: V3, a: number): HandFrame => ({ o: f.o, x: rot(f.x, k, a), y: rot(f.y, k, a), z: rot(f.z, k, a) });

/**
 * THE HAND FITTED TO WHAT IT PLAYS: from a starting frame, the hand is turned
 * (about the wrist) — and, within `slide` mm, moved — until every pad lands on
 * its target with the fingers in a natural curl (the middle joints near
 * `curl` radians), the wrist within `maxWrist`° of the forearm (from `elbow`),
 * the thumb on its own target. A small deterministic search, run once per pose.
 */
export function fitHand(
  start: HandFrame,
  fingers: readonly DigitGoal[],
  thumb: ThumbGoal,
  opts: { elbow?: V3; maxWrist?: number; slide?: number; curl?: number; dipRatio?: number; keep?: (f: HandFrame) => number } = {},
): HandSkeleton {
  const maxW = ((opts.maxWrist ?? 68) * Math.PI) / 180;
  const curl = opts.curl ?? 0.95;
  const slide = opts.slide ?? 0;
  const cost = (f: HandFrame) => {
    const sk = handOn(f, fingers, thumb, opts.dipRatio);
    let c = 0;
    for (const m of sk.miss) c += m * m;
    sk.fingers.forEach((d, i) => {
      if (!isV3(fingers[i])) return;
      const b = jointBendsDeg(d);
      c += 0.02 * ((b[1] * Math.PI) / 180 - curl) ** 2 * 1000;
    });
    if (opts.elbow) {
      const fore = unit(sub(f.o, opts.elbow));
      const a = Math.acos(clamp(dot(fore, f.x), -1, 1));
      if (a > maxW) c += 4000 * (a - maxW) ** 2 * 100;
    }
    if (opts.keep) c += opts.keep(f);
    return c;
  };
  const axes = (f: HandFrame) => [f.x, f.y, f.z];
  let best = start;
  let e = cost(best);
  for (const s of [0.24, 0.12, 0.06, 0.03, 0.012]) {
    for (let it = 0; it < 24; it++) {
      let moved = false;
      for (let k = 0; k < 3; k++)
        for (const dd of [s, -s]) {
          const f = rotFrame(best, axes(best)[k], dd);
          const ee = cost(f);
          if (ee < e - 1e-6) {
            best = f;
            e = ee;
            moved = true;
          }
        }
      if (slide > 0)
        for (const ax of [v3(1, 0, 0), v3(0, 1, 0), v3(0, 0, 1)])
          for (const dd of [s * 40, -s * 40]) {
            const o = add(best.o, mul(ax, dd));
            if (len(sub(o, start.o)) > slide) continue;
            const f = { ...best, o };
            const ee = cost(f);
            if (ee < e - 1e-6) {
              best = f;
              e = ee;
              moved = true;
            }
          }
      if (!moved) break;
    }
  }
  return handOn(best, fingers, thumb, opts.dipRatio);
}

/* ── measures (the tests' and the drawing's own checks) ── */

/** Each digit's length (sum of its bones, base joint → pad; the thumb from its saddle joint). */
export function digitLength(d: Digit): number {
  let s = 0;
  for (let k = 1; k < d.joints.length; k++) s += len(sub(d.joints[k], d.joints[k - 1]));
  return s;
}

/** The hand's reach: wrist crease → the middle fingertip, the finger straight. */
export const HAND_LENGTH = HAND.fingers[1].mcp.x + HAND.fingers[1].seg.reduce((a, b) => a + b, 0);

/** The wrist's bend (degrees) between the forearm (elbow → wrist) and the hand (wrist → knuckles). */
export function wristBendDeg(sk: HandSkeleton, elbow: V3): number {
  const fore = unit(sub(sk.frame.o, elbow));
  return (Math.acos(clamp(dot(fore, sk.frame.x), -1, 1)) * 180) / Math.PI;
}

/** Each joint's flexion (degrees) along a digit: the angle between successive bones. */
export function jointBendsDeg(d: Digit): number[] {
  const out: number[] = [];
  for (let k = 1; k < d.joints.length - 1; k++) {
    const a = unit(sub(d.joints[k], d.joints[k - 1]));
    const b = unit(sub(d.joints[k + 1], d.joints[k]));
    out.push((Math.acos(clamp(dot(a, b), -1, 1)) * 180) / Math.PI);
  }
  return out;
}

/** A finger's flexion at its three joints (degrees): the knuckle (MCP) from
 *  the back of the hand's plane (negative = bent back), then the middle and
 *  end joints (the angle between successive bones). */
export function fingerFlexDeg(f: HandFrame, d: Digit): { mcp: number; pip: number; dip: number; spread: number } {
  const p = unit(sub(d.joints[1], d.joints[0]));
  const inPlane = sub(p, mul(f.z, dot(p, f.z)));
  const b = len(inPlane) > 1e-6 ? unit(inPlane) : f.x;
  const mcp = (Math.atan2(-dot(p, f.z), dot(p, b)) * 180) / Math.PI;
  const spread = (Math.atan2(dot(b, f.y), dot(b, f.x)) * 180) / Math.PI;
  const [pip, dip] = jointBendsDeg(d);
  return { mcp, pip, dip, spread };
}

/** Which side of the hand the thumb is on, along the frame's y (−1 = the thumb side, as built). */
export function thumbSide(sk: HandSkeleton): number {
  return Math.sign(dot(sub(sk.thumb.joints[1], sk.frame.o), sk.frame.y));
}

/** The wrist placed a palm's length behind a knuckle-row point, along `along`
 *  (for posers that know where the knuckles go). */
export function wristBehind(knuckles: V3, along: V3): V3 {
  return sub(knuckles, mul(unit(along), HAND.fingers[1].mcp.x - 2));
}

/* ── a view of the hand: an orthographic projection ── */

/** A view: where a world point lands in the picture (u, v) and how near it is (d: + toward the viewer). */
export type HandView = (p: V3) => { u: number; v: number; d: number };
