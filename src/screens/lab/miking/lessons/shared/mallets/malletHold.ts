/**
 * THE MALLET HAND WITH AN EASY WRIST (figure V2, the mallet keyboards,
 * 2026-11-24). Pure: no React, no Skia.
 *
 * The SAME approved stick grip as the drummer's (figureV2/grip.ts stickHold:
 * the shaft pinched at its fulcrum between the thumb's pad and the side of
 * the index's middle bone, across the palm, out under the heel, the other
 * fingers curled round it; the same hand frame and the same closing of the
 * fingers — copied here because grip.ts keeps them private) with ONE change
 * in the search: the wrist's bend from the forearm is held to ≈ 30° (the
 * drummer's search allows ≈ 38–44°). A raised mallet is lifted by the wrist
 * AND by turning the hand toward thumb-up (the French side of the roll), so
 * the search may roll the hand further toward thumb-up (up to 80°) instead of
 * bending the wrist. The fulcrum and the mallet's line are the lesson's;
 * only the hand's own wrist crease (where the drawn forearm ends) moves.
 */
import { h3, HAND, handFrame, handOn, type DigitGoal, type HandFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { gripRolls, rollOf, STICK_R, type ArmIn, type StickHold } from '../figureV2/grip.ts';

const { add, sub, mul, dot, len, unit } = h3;
const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const DEG = Math.PI / 180;

const AT = { x: 82, y: 2 } as const;
const PALM_Z = -(HAND.thick / 2 + STICK_R + 1.5);

function frameFor(grip: V3, s: V3, back: V3, thumbSign: 1 | -1, ang: number): HandFrame {
  const z = unit(sub(back, mul(s, dot(back, s))));
  const q = mul(unit(cross(s, z)), thumbSign);
  const x = sub(mul(s, Math.cos(ang)), mul(q, Math.sin(ang)));
  const f0 = handFrame(v3(0, 0, 0), x, z, q);
  const o0 = sub(grip, add(mul(f0.x, AT.x), add(mul(f0.y, AT.y), mul(f0.z, PALM_Z))));
  const idx = HAND.fingers[0];
  const m = add(o0, add(mul(f0.x, idx.mcp.x), mul(f0.y, idx.mcp.y)));
  const t0 = (dot(sub(m, grip), s) + 6) * 0.5;
  return { ...f0, o: sub(o0, mul(s, t0)) };
}

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

const cache = new Map<string, StickHold>();

/** The hand on its mallet with the wrist within `maxBend`° of the forearm (default 30). */
export function malletHold(a: ArmIn, maxBend = 30): StickHold {
  const key = JSON.stringify([a, maxBend]);
  const hit = cache.get(key);
  if (hit) return hit;
  const s = unit(sub(a.bead, a.fulcrum));
  const thumbSign: 1 | -1 = a.hand === 'R' ? 1 : -1;
  const { zG, zF } = gripRolls(s, thumbSign);
  const pref = unit(add(zG, zF));
  const foreLen = len(sub(a.wrist, a.elbow));
  const ref0 = Math.abs(s.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
  const e1 = unit(sub(ref0, mul(s, dot(ref0, s))));
  const e2 = unit(cross(s, e1));
  let best: { cost: number; f: HandFrame } | null = null;
  const lim = maxBend * DEG;
  for (let phi = 0; phi < 360; phi += 3)
    for (let ang = 5; ang <= 55; ang += 2.5) {
      const back = add(mul(e1, Math.cos(phi * DEG)), mul(e2, Math.sin(phi * DEG)));
      const f = frameFor(a.fulcrum, s, back, thumbSign, ang * DEG);
      const fore = sub(f.o, a.elbow);
      const fl = len(fore);
      const bend = Math.acos(Math.max(-1, Math.min(1, dot(unit(fore), f.x))));
      let cost = len(sub(f.o, a.wrist)) ** 2;
      cost += 4 * (fl - foreLen) ** 2;
      if (bend > lim) cost += 1e7 * (bend - lim) ** 2;
      cost += 20000 * (1 - dot(f.z, pref));
      const roll = Math.atan2(dot(f.z, zF), dot(f.z, zG));
      if (roll < 0) cost += 1e6 * roll * roll;
      if (roll > 80 * DEG) cost += 1e6 * (roll - 80 * DEG) ** 2;
      if (!best || cost < best.cost) best = { cost, f };
    }
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
  cache.set(key, res);
  return res;
}
