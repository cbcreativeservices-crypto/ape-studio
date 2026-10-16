/**
 * SMALL PERCUSSION — HANDS POSED ON WHAT THEY HOLD (figure pass 3, owner
 * 2026-10-15: "check that the hand is correctly positioned, placed, bent,
 * fingers and digits accounted for"). Pure: the lessons' models pose the hand
 * and solve the arm back from it here; the art draws these very skeletons
 * (PlayerFigure.drawHand3); percHands.ts lists them for the tests.
 *
 * FRAME H (geom.ts): mm, +x toward the audience, +y DOWN, +z the player's
 * right — a LEFT-handed frame, so a right hand's (along × toward-little) is
 * its back's normal here and a left hand's is the palm's. Built on the shared
 * hand model (players/handModel.ts).
 *
 *   stickHand   a STICK or a MALLET's handle in the RIGHT hand, palm down: the
 *               stick between the thumb's pad and the side of the index
 *               finger's middle bone (the fulcrum), the middle, ring and
 *               little fingers wrapped round it, the butt out under the heel
 *               of the hand. It crosses the hand at 50° to its length, the
 *               tip out past the thumb and index; the back of the hand faces
 *               up (never rolled past palm-down).
 *   cradleHand  the LEFT hand under what it holds, the palm up: the object
 *               on the palm, the fingers curled up its far side, the thumb on
 *               its near side.
 * The ARM is solved back from the hand (armFor): the wrist where the hand's
 * frame starts, the elbow the two-link solution (geom.elbowOf) hanging down
 * beside the body — so from above the forearm reaches forward in front of
 * the chest (the old wrists sat behind the chest: a forearm folded under
 * the upper arm read as a stump).
 */
import { fitHand, h3, handOn, v3, wristBendDeg, type HandFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { elbowOf, SHOULDER_L, SHOULDER_R, type Arm } from './geom.ts';

const DEG = Math.PI / 180;
/** The cross product in frame H's own numbers (used only to tell the hands apart). */
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

/** Where a stick crosses the hand (hand frame: x wrist → knuckles, y toward
 *  the little finger, z out of the back): under the knuckle row against the
 *  palm (its axis 23 mm palm-side of the bones' plane: half the palm's
 *  thickness and the stick's radius), at `angle` to the hand's length. */
export const STICK_IN_HAND = { at: v3(84, 2, -23), angle: 50 * DEG } as const;
/** A stick's radius, and how far a wrapping pad's centre sits from its axis. */
export const STICK_R = 7;
const PAD_OFF = STICK_R + 8;

/** The hand frame holding a stick through `grip` toward `tip`, its back
 *  toward `dorsal` (a hint: only its part square to the stick counts). The
 *  RIGHT hand: the thumb follows from the back and the stick. */
export function stickFrame(grip: V3, tip: V3, dorsal: V3): HandFrame {
  const { add, sub, mul, dot, unit } = h3;
  const s = unit(sub(tip, grip));
  const z = unit(sub(dorsal, mul(s, dot(dorsal, s))));
  // A right hand in frame H: toward the little finger = back × along; in the
  // palm's plane the stick runs (c, −sn) — forward and toward the thumb.
  // With q the in-plane square to the stick toward the thumb: q = s × back.
  const q = unit(cross(s, z));
  const c = Math.cos(STICK_IN_HAND.angle);
  const sn = Math.sin(STICK_IN_HAND.angle);
  const x = sub(mul(s, c), mul(q, sn));
  const y = sub(mul(s, -sn), mul(q, c));
  const A = STICK_IN_HAND.at;
  const o = sub(grip, add(mul(x, A.x), add(mul(y, A.y), mul(z, A.z))));
  return { o, x, y, z };
}

/** A point of a hand's frame in the world. */
const at = (f: HandFrame, p: V3): V3 => h3.add(f.o, h3.add(h3.mul(f.x, p.x), h3.add(h3.mul(f.y, p.y), h3.mul(f.z, p.z))));

/**
 * THE STICK HAND: the right hand holding a stick (or a mallet's handle)
 * through `grip` toward `tip`, its back toward `dorsal`. Every pad on the
 * stick; the thumb's pad on its upper side just past the index finger.
 */
export function stickHand(grip: V3, tip: V3, dorsal: V3): HandSkeleton {
  const f = stickFrame(grip, tip, dorsal);
  const c = Math.cos(STICK_IN_HAND.angle);
  const sn = Math.sin(STICK_IN_HAND.angle);
  const A = STICK_IN_HAND.at;
  const on = (t: number) => v3(A.x + c * t, A.y - sn * t, A.z);
  // Each finger wraps round the stick: its pad on the far side (away from
  // the palm), a little back toward the wrist, as a closed grip is.
  const wrap = h3.unit(v3(-0.3, 0, -0.95));
  const fingers = [-27, -8.5, 9.5, 26].map((ky, i) => at(f, h3.add(on((A.y - ky) / sn + (i === 0 ? 4 : 0)), h3.mul(wrap, PAD_OFF))));
  // The thumb's pad on the stick's upper side, just past the index finger:
  // the stick pinched between it and the index's middle bone.
  const thumb = at(f, h3.add(on((A.y + 27) / sn + 18), v3(0, -4, PAD_OFF - 2)));
  return handOn(f, fingers, thumb);
}

/**
 * THE CRADLE HAND: the LEFT hand under a held object, the palm up, pointing
 * along `along` (level), the middle of the palm under `rest`. `pads`: where
 * the four fingers' pads close on the object (index … little); `thumb`: the
 * thumb's pad. The hand turns (about its wrist) and slides ≤ 20 mm until
 * the pads land, staying palm-up.
 */
export function cradleHand(rest: V3, along: V3, pads: readonly V3[], thumb: V3): HandSkeleton {
  const { sub, mul, unit } = h3;
  const x = unit(along);
  const z = unit(sub(v3(0, 1, 0), mul(x, x.y))); // the back of the hand down
  const y = unit(cross(x, z)); // a LEFT hand in frame H: toward the little finger = along × back
  const o = sub(rest, h3.add(mul(x, 60), mul(z, -16)));
  const f0: HandFrame = { o, x, y, z };
  return fitHand(f0, pads, thumb, { slide: 20, curl: 1.0, keep: (g) => 2500 * (1 - h3.dot(g.z, z)) + 800 * (1 - h3.dot(g.x, x)) });
}

/** An arm solved back from a posed hand: the wrist at the hand's frame, the
 *  elbow hanging down beside the body — `out` > 0 a little away from it,
 *  `fwd` > 0 a little forward. `grip`: the arm's grip point (the keep-outs'
 *  hand capsule runs wrist → grip). */
export function armFor(side: 'R' | 'L', sk: HandSkeleton, grip: V3, out = 0.2, fwd = 0.15): Arm {
  const S = side === 'R' ? SHOULDER_R : SHOULDER_L;
  const W = sk.frame.o;
  const E = elbowOf(S, W, v3(fwd, 1, side === 'R' ? out : -out));
  return { S, E, W, G: grip };
}

/** The wrist's bend for an arm and its hand (degrees). */
export const wristOf = (a: Arm, sk: HandSkeleton): number => wristBendDeg(sk, a.E);

/** Which hand a skeleton is, in frame H (+1 right, −1 left). */
export const handedness = (sk: HandSkeleton): number => Math.sign(h3.dot(cross(sk.frame.x, sk.frame.y), sk.frame.z));
