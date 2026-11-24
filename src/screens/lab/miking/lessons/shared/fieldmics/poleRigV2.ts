/**
 * THE HAND-HELD BOOM POLE'S OPERATOR IN THE NEW LOOK — the rig (figure V2,
 * builder "Foley3", 2026-11-24; F02 Clothing and F08 Pass-bys, the only
 * lessons with the engine's 'pole' mount). Pure: no React, no Skia.
 *
 * The engine (PlacementScene PoleMount, collision.ts) owns the pole: from the
 * mic's tail, away from its aim, POLE_LEN long, to the operator's hands at
 * POLE_HANDS_H above the floor (higher only when the mic is very high), the
 * operator's body column OPERATOR_BACK behind the hands. It draws the operator
 * in a LOCAL frame: the pole's end (the rear fist) at the origin, the body
 * behind it along +u, facing −u toward the mic; side view v = 0 the floor.
 * Nothing here moves the mic, the pole, the hands' point or the body column.
 *
 * GEOMETRY CHECKED FIRST (the coordinator's rule after another lesson's pole
 * ran through its operator's head): this pole ends at the hands, in FRONT of
 * the body, and runs from there toward the mic, away from the body — it can
 * never cross the operator's head or face, in either view (test). So the
 * pole's drawn direction is the engine's own and is not changed.
 *
 * The hold (researched: Rode, "What you need to know about boompole usage";
 * No Film School, "6 boom pole positions"): the pole's end is at chest to
 * shoulder height here (the engine's 1.4 m), so the operator holds it LOW and
 * in front, the pole rising (or falling) to the mic — the "fishing" hold:
 * the rear hand at the pole's end, the front hand a little up the pole, both
 * hands in the approved two-handed power grip (boomGrip.ts: fingers round one
 * side, the thumb round the other), the elbows bent, out and down. The near
 * arm (the operator's left, toward the viewer) takes the rear hand — the far
 * arm reaches forward behind the pole, so no arm ever crosses the face.
 * Telescoping pole: the hands hold the thickest (rear) section; a twist-lock
 * collar where the thinner sections the engine draws carry on to the mic.
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { operatorSide, operatorTop } from '../measure/measureModel.ts';
import { BOOM_ARM, REACH_MAX, SHOULDER_TRAVEL } from '../figureV2/boomGrip.ts';
import type { V3 } from '../figureV2/heldHands.ts';
import { POLE_HANDS_H } from '../../../engine/geometry/collision.ts';

/** The pole as the engine draws it, seen in a view: its slope at the hands (degrees, + rising toward the mic;
 *  side view the projected slope, from above the true one) and the hands' height above the floor (mm). */
export type PoleShape = { slopeDeg: number; handsH: number; /** the engine mirrors the side view (the mic toward −x): the rig
 *  is authored facing +u here and drawn mirrored back, so the figure itself is never seen in a mirror (its light stays
 *  from the upper left) */ flip?: boolean };

/** A rig as BoomV2's BoomRig needs it. */
export type PoleRig = {
  side: PlayerPose;
  top: PlayerPose;
  front: V3;
  rear: V3;
  pole: { a: V3; b: V3 };
  rearArm: 'L' | 'R';
  /** (drawn) the operator's neck x behind the rear fist, the hands' gap along the pole, the collar (world) */
  back: number;
  gap: number;
  collar: { at: V3; dir: V3 };
  /** authored facing +x: the drawing mirrors it back */
  flip: boolean;
};

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const len = (a: V3) => Math.hypot(a.x, a.y, a.z);
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);

/** The body stands this far behind the rear fist (mm, the collar's x): the engine's body column is
 *  OPERATOR_BACK = 320 behind the hands; the drawn neck a little in front of that column's middle. */
export const POLE_BACK = 300;
/** The thick rear section runs this far past the front fist to its collar, and this far behind the rear fist. */
export const SECTION_PAST = 170;
export const SECTION_TAIL = 70;
/** The hands' widest and narrowest gap along the pole (mm): a little more than shoulder width when the reach
 *  allows, never closer than a hand's breadth and a half. */
export const GAP_MAX = 420;
export const GAP_MIN = 160;

/** The shoulders as BoomV2.rigFrame places them (facing −x, s = 1: their right is −z; facing +x: +z). */
function shoulders(neck: V3, k: number, s: 1 | -1): { L: V3; R: V3 } {
  const base = add(neck, v3(0, 30, 0));
  const w = 168 * (0.6 + 0.4 * k);
  return { R: add(base, v3(0, 0, -w * s)), L: add(base, v3(0, 0, w * s)) };
}

const cache = new Map<string, PoleRig>();

/**
 * The rig for a pole shape and a person's shoulder build (`k`, cast BodyBuild.shoulder). The rear fist at the
 * origin (the engine's hands point), the pole in the operator's middle plane (z = 0, the engine's plan line),
 * toward the mic along (−cos θ, −sin θ).
 */
export function poleRig(shape: PoleShape, k = 1): PoleRig {
  const th = Math.max(-80, Math.min(85, Math.round(shape.slopeDeg)));
  const H = Math.max(900, Math.min(2100, Math.round(shape.handsH / 10) * 10));
  // s = 1: facing −x (the engine's local frame); −1: authored facing +x, drawn mirrored back
  const s: 1 | -1 = shape.flip ? -1 : 1;
  const key = `${th}:${H}:${k}:${s}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = (th * Math.PI) / 180;
  const dir = v3(-s * Math.cos(t), -Math.sin(t), 0);
  const rear = v3(0, -H, 0);
  // the near arm goes up to a rear fist held high: the body steps back so that arm rises at a gentle slope,
  // passing under the chin (never across the face)
  // (a far-reaching front hand wins over that: the body steps no farther back than the far arm still reaches
  // the pole a hand's breadth and a half up from the rear fist — an arm is never stretched)
  const reach = REACH_MAX * (BOOM_ARM.upper + BOOM_ARM.fore) + SHOULDER_TRAVEL * 0.5;
  const solve = (back: number) => {
    const side = operatorSide(s * back, 0, (-s) as 1 | -1);
    const neck = v3(side.neck.u, side.neck.v, 0);
    const sh = shoulders(neck, k, s);
    // the front fist as far up the pole as the far arm reaches (nearly straight, the shoulder's travel allowed)
    let gap = GAP_MAX;
    while (gap > GAP_MIN && len(sub(add(rear, mul(dir, gap)), sh.R)) > reach) gap -= 10;
    const ok = len(sub(add(rear, mul(dir, gap)), sh.R)) <= reach && len(sub(rear, sh.L)) <= reach;
    return { side, gap, ok };
  };
  let back = Math.max(POLE_BACK, Math.round(1.4 * (H - 1440) - 20));
  let sol = solve(back);
  while (!sol.ok && back > 160) {
    back -= 10;
    sol = solve(back);
  }
  const side = sol.side;
  const gap = sol.gap;
  const top = operatorTop(s * back, 0, (-s) as 1 | -1);
  const front = add(rear, mul(dir, gap));
  const a = add(front, mul(dir, SECTION_PAST));
  const b = add(rear, mul(dir, -SECTION_TAIL));
  // the NEAR arm (toward the viewer at +z) on the rear hand: facing −x that is the left
  const rig: PoleRig = { side, top, front, rear, pole: { a, b }, rearArm: s === 1 ? 'L' : 'R', back, gap, collar: { at: a, dir }, flip: s === -1 };
  cache.set(key, rig);
  return rig;
}

/**
 * The elbow of an arm holding the pole LOW in front (not BoomV2's overhead hold, whose elbows go out beside the
 * head): on the circle the upper arm and forearm allow, the point most DOWN, then a little out to the arm's own
 * side (never in across the chest) and forward.
 */
export function lowElbow(shoulder: V3, fist: V3, outward: V3, F: V3, a = BOOM_ARM.upper, b = BOOM_ARM.fore): { elbow: V3; reach: number } {
  const sf = sub(fist, shoulder);
  const d = len(sf);
  const u = mul(sf, 1 / (d || 1));
  if (d >= a + b - 1) return { elbow: add(shoulder, mul(u, (a / (a + b)) * d)), reach: d / (a + b) };
  const t = (a * a - b * b + d * d) / (2 * d);
  const r = Math.sqrt(Math.max(0, a * a - t * t));
  const c = add(shoulder, mul(u, t));
  const cross = (p: V3, q: V3): V3 => v3(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
  let e1 = cross(u, v3(0, 1, 0));
  if (len(e1) < 1e-3) e1 = cross(u, v3(1, 0, 0));
  e1 = mul(e1, 1 / len(e1));
  const e2 = cross(u, e1);
  const dot = (p: V3, q: V3) => p.x * q.x + p.y * q.y + p.z * q.z;
  let best = c;
  let score = -Infinity;
  for (let k = 0; k < 360; k++) {
    const ph = (k * Math.PI) / 180;
    const dir = add(mul(e1, Math.cos(ph)), mul(e2, Math.sin(ph)));
    if (dot(dir, outward) < -0.15) continue;
    const sc = 1.0 * dir.y + 0.45 * dot(dir, outward) + 0.1 * dot(dir, F);
    if (sc > score) {
      score = sc;
      best = add(c, mul(dir, r));
    }
  }
  return { elbow: best, reach: d / (a + b) };
}

/** The operator's two arms on the pole (world): the shoulders as BoomV2.rigFrame places them, a shoulder that
 *  must reach rising toward the fist (as boomGrip.boomArms), the elbows low (`lowElbow`). */
export function poleArms(rig: PoleRig, k = 1): { side: 'L' | 'R'; shoulder: V3; elbow: V3; fist: V3; reach: number; lift: V3 }[] {
  const s: 1 | -1 = rig.flip ? -1 : 1;
  const neck = v3(rig.side.neck.u, rig.side.neck.v, rig.top.neck.v);
  const sh = shoulders(neck, k, s);
  const R = v3(0, 0, -s);
  const F = v3(-s, 0, 0);
  return (['L', 'R'] as const).map((side) => {
    const fist = side === rig.rearArm ? rig.rear : rig.front;
    const outward = side === 'R' ? R : mul(R, -1);
    const s0 = sh[side];
    const want = REACH_MAX * (BOOM_ARM.upper + BOOM_ARM.fore);
    const d0 = len(sub(fist, s0));
    const travel = Math.max(0, Math.min(SHOULDER_TRAVEL, d0 - want));
    const sh1 = add(s0, mul(sub(fist, s0), travel / (d0 || 1)));
    const { elbow, reach } = lowElbow(sh1, fist, outward, F);
    return { side, shoulder: sh1, elbow, fist, reach, lift: sub(sh1, s0) };
  });
}

/** The shape the engine's starting pole has when nothing is known yet: level, the hands at POLE_HANDS_H. */
export const LEVEL_POLE: PoleShape = { slopeDeg: 0, handsH: POLE_HANDS_H };
