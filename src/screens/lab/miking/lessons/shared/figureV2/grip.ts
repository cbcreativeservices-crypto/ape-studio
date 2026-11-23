/**
 * FIGURE V2 — A HAND ON A STICK (the owner's figure realism pass, D78,
 * 2026-11-22). Pure: no React, no Skia; the test measures what the art draws.
 *
 * The matched grip, solved on the shared adult hand skeleton
 * (players/handModel.ts): the stick is pinched at its FULCRUM between the
 * thumb's pad (on top of the stick) and the side of the index finger's middle
 * bone; it runs diagonally across the palm, under the base of the fingers, and
 * its butt leaves the fist under the heel of the hand; the middle, ring and
 * little fingers curl loosely round it. The stick passes THROUGH the grip: in
 * front of the palm, behind the curled fingers.
 *
 * The pose (stickPose.ts) gives the elbow, the wrist, the fulcrum and the
 * stick's direction, and those never move. The hand is turned round the stick
 * (its roll) and set at an angle across it (25–55°) until its own wrist crease
 * lands as near the pose's wrist as an adult hand allows, the wrist bent no
 * more than ≈ 40° from the forearm and the forearm kept near its own length.
 * The drawing ends the forearm at that wrist crease. (The pose puts its wrist
 * only 70 mm behind the fulcrum — a compact fist; an adult hand's wrist crease
 * sits ≈ 100 mm behind the pinch, so the drawn wrist lands 4–5 cm from the
 * pose's point; the elbow, the fulcrum and the stick are the pose's own.)
 */
import { h3, HAND, handFrame, handOn, type DigitGoal, type HandFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';

const { add, sub, mul, dot, len, unit } = h3;
const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const DEG = Math.PI / 180;

/** A drumstick's radius at the grip (Ø 14 mm). */
export const STICK_R = 7;

/** One hand's stroke as the pose gives it (3-D, the kit frame: +x toward the
 *  audience, +y down, +z the player's right). */
export type ArmIn = {
  hand: 'R' | 'L';
  elbow: V3;
  wrist: V3;
  fulcrum: V3;
  bead: V3;
};

export type StickHold = {
  sk: HandSkeleton;
  /** The hand's own wrist crease (where the drawn forearm ends). */
  wrist: V3;
  /** Distance from the pose's wrist (mm). */
  wristMiss: number;
  /** The wrist's bend: forearm (elbow → wrist) against the hand's length (deg). */
  bend: number;
  /** The drawn forearm's length (mm). */
  fore: number;
  /** The stick's axis through the grip: the fulcrum and the unit direction
   *  toward the bead (for the occlusion plane and the tests). */
  fulcrum: V3;
  dir: V3;
  /** The grip's roll about the stick (degrees): 0 = German (palm down, the
   *  back of the hand up), 90 = French (the thumb on top, the palm to the
   *  side); the American grip most players use sits near 45. */
  roll: number;
  /** The pose's own wrist (stickPose: 100 mm behind the fulcrum along the
   *  stick, the fist pointing from it to the fulcrum) — where the drawing
   *  places the hand's root. */
  poseWrist: V3;
};

/** The German grip's back-of-hand (up, square to the stick) and the French
 *  grip's (turned so the thumb is on top), for a stick direction s. */
export function gripRolls(s: V3, thumbSign: 1 | -1): { zG: V3; zF: V3 } {
  const up = v3(0, -1, 0);
  const zG = unit(sub(up, mul(s, dot(up, s))));
  let zF = unit(cross(s, zG));
  // French: the thumb (thumbSign · s × z) points up.
  if (dot(mul(unit(cross(s, zF)), thumbSign), up) < 0) zF = mul(zF, -1);
  return { zG, zF };
}

/** The roll (degrees) of a back-of-hand direction z between German (0) and French (90). */
export function rollOf(z: V3, s: V3, thumbSign: 1 | -1): number {
  const { zG, zF } = gripRolls(s, thumbSign);
  return Math.atan2(dot(z, zF), dot(z, zG)) / DEG;
}

/** Where the stick crosses the hand frame: under the knuckle row, against the
 *  palm (x along the hand from the wrist crease, z out of the back). */
const AT = { x: 82, y: 2 } as const;
const PALM_Z = -(HAND.thick / 2 + STICK_R + 1.5);

function frameFor(grip: V3, s: V3, back: V3, thumbSign: 1 | -1, ang: number): HandFrame {
  const z = unit(sub(back, mul(s, dot(back, s))));
  const q = mul(unit(cross(s, z)), thumbSign);
  // The hand's length: back from the tip's direction, turned toward the little finger.
  const x = sub(mul(s, Math.cos(ang)), mul(q, Math.sin(ang)));
  const f0 = handFrame(v3(0, 0, 0), x, z, q);
  const o0 = sub(grip, add(mul(f0.x, AT.x), add(mul(f0.y, AT.y), mul(f0.z, PALM_Z))));
  // Slid along the stick toward the index finger's crossing (the pinch of
  // the thumb and the first finger is the fulcrum): half way, which keeps the
  // thumb's pad ≈ 2–3 cm from the fulcrum and the forearm its adult length.
  const idx = HAND.fingers[0];
  const m = add(o0, add(mul(f0.x, idx.mcp.x), mul(f0.y, idx.mcp.y)));
  const t0 = (dot(sub(m, grip), s) + 6) * 0.5;
  return { ...f0, o: sub(o0, mul(s, t0)) };
}

/** The fingers and thumb closed on the stick held in frame f (as
 *  anatomy.stickGrip: the index's middle bone at the fulcrum, the pads on the
 *  stick's far side, the thumb's pad on top just past the index). */
function closeOn(f: HandFrame, grip: V3, s: V3, thumbSign: 1 | -1): HandSkeleton {
  const along = (t: number) => add(grip, mul(s, t));
  const crossAt = (i: number) => {
    const F = HAND.fingers[i];
    const m = add(f.o, add(mul(f.x, F.mcp.x), mul(f.y, F.mcp.y)));
    return dot(sub(m, grip), s);
  };
  const wrapDir = unit(add(mul(f.z, -0.95), mul(f.x, -0.3)));
  const fingers: DigitGoal[] = [0, 1, 2, 3].map((i) => add(along(crossAt(i) + (i === 0 ? 6 : 0)), mul(wrapDir, STICK_R + 7.5)));
  const q = mul(unit(cross(s, f.z)), thumbSign);
  const thumb = add(add(along(crossAt(0) + 14), mul(f.z, STICK_R + 6)), mul(q, 3));
  return handOn(f, fingers, thumb, 0.7);
}

const holdCache = new Map<string, StickHold>();

/**
 * The hand on its stick for one arm of the pose (cached by its numbers).
 * `back`: the preferred way the back of the hand faces (a matched grip: up,
 * a little outward).
 */
export function stickHold(a: ArmIn): StickHold {
  const key = JSON.stringify(a);
  const hit = holdCache.get(key);
  if (hit) return hit;
  const s = unit(sub(a.bead, a.fulcrum));
  const thumbSign: 1 | -1 = a.hand === 'R' ? 1 : -1;
  // THE AMERICAN GRIP (what most players use): the hand rolled ≈ 45° about
  // the stick from palm-down (German) toward thumb-up (French) — the thumb on
  // the upper side of the stick, the back of the hand turned outward.
  const { zG, zF } = gripRolls(s, thumbSign);
  const pref = unit(add(zG, zF));
  const foreLen = len(sub(a.wrist, a.elbow));
  const ref0 = Math.abs(s.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
  const e1 = unit(sub(ref0, mul(s, dot(ref0, s))));
  const e2 = unit(cross(s, e1));
  let best: { cost: number; f: HandFrame } | null = null;
  const tryOne = (phi: number, ang: number) => {
    const back = add(mul(e1, Math.cos(phi)), mul(e2, Math.sin(phi)));
    const f = frameFor(a.fulcrum, s, back, thumbSign, ang);
    const fore = sub(f.o, a.elbow);
    const fl = len(fore);
    const bend = Math.acos(Math.max(-1, Math.min(1, dot(unit(fore), f.x))));
    let cost = len(sub(f.o, a.wrist)) ** 2;
    cost += 4 * (fl - foreLen) ** 2;
    if (bend > 38 * DEG) cost += 1e6 * (bend - 38 * DEG) ** 2;
    if (bend > 44 * DEG) cost += 1e7 * (bend - 44 * DEG) ** 2;
    cost += 20000 * (1 - dot(f.z, pref));
    // Never past palm-down the other way (the thumb under the stick).
    const roll = Math.atan2(dot(f.z, zF), dot(f.z, zG));
    if (roll < 0) cost += 1e6 * roll * roll;
    if (!best || cost < best.cost) best = { cost, f };
  };
  for (let phi = 0; phi < 360; phi += 3) for (let ang = 5; ang <= 55; ang += 2.5) tryOne(phi * DEG, ang * DEG);
  const f = (best as { cost: number; f: HandFrame } | null)!.f;
  const sk = closeOn(f, a.fulcrum, s, thumbSign);
  const fore = sub(f.o, a.elbow);
  const res: StickHold = {
    sk,
    wrist: f.o,
    wristMiss: len(sub(f.o, a.wrist)),
    bend: Math.acos(Math.max(-1, Math.min(1, dot(unit(fore), f.x)))) / DEG,
    fore: len(fore),
    fulcrum: a.fulcrum,
    dir: s,
    roll: rollOf(f.z, s, thumbSign),
    poseWrist: a.wrist,
  };
  holdCache.set(key, res);
  return res;
}
