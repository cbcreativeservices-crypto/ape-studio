/**
 * M06 TIMPANI — the mallets and the timpanist's place (pure; the art, the
 * keep-outs and the tests read the same numbers).
 */
import { drumOf, HEAD_Y, R29 } from './model.ts';

/**
 * THE MALLETS, posed in 3D so the side and top views agree (owner
 * 2026-11-22: "look for other labs with drum sticks and make sure they are
 * not all crazy like this example. It should look like normal stick tech.
 * usage"). Both mallets play the 29 in drum, the hands about shoulder width
 * apart: the LEFT mallet at the stroke, its ball on the head about 10 cm in
 * from the rim nearest the player; the RIGHT one raised, turned up about its
 * hand (the ball above the hand) from a stroke 11 cm along the rim. A real
 * timpani mallet: 355 mm from the butt to the ball's centre (≈ 37 cm with
 * the ball), held 45 mm from the butt. Drawing defaults (no source gives a
 * pose).
 *
 * The hands are as low over the heads as the standing figure can hold them
 * (18–19 cm above the head) without the arm over-reaching or the hands
 * coming in front of the pelvis (the figure standard): the stroke's shaft
 * runs about 31° to the head (it was a 456 mm mallet at 29°, the fist 24 cm
 * over the head at its very end).
 */
type P3 = { x: number; y: number; z: number };
export type MalletPose3 = { butt: P3; hand: P3; ball: P3 };
/** len: butt to the ball's centre (the mallet 374 mm with its ball); butt: the hand's distance from the butt. */
export const TIMP_MALLET = { len: 355, butt: 45, ballR: 19, inFromRim: 105, raisedDeg: 25 } as const;
/** Where the timpanist stands (the figure's centre, z): behind the 29 in drum it is playing. */
export const PLAYER_Z = -380;
/** The metal family's standing figure (at u ≈ −362) is moved this far along x. */
export const PLAYER_SHIFT = -440;
const D29 = drumOf('t29');
const add = (a: P3, b: P3, k = 1): P3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
/** A ball on the 29 in head `inFromRim` in from its rim, `along` mm round it
 *  (+ toward +z) from the line to the player. */
function ballOn(along: number): P3 {
  const toward = Math.atan2(PLAYER_Z - D29.c.z, -900 - D29.c.x);
  const r = R29 - TIMP_MALLET.inFromRim;
  const a = toward - along / r;
  return { x: D29.c.x + Math.cos(a) * r, y: HEAD_Y - TIMP_MALLET.ballR, z: D29.c.z + Math.sin(a) * r };
}
/** One mallet: its ball at the stroke on the head, its hand at height
 *  `handY` and across at `handZ` (the hand's distance back from the ball is
 *  the mallet's). `raisedDeg`: the mallet turned up about the hand, the ball
 *  that far above it. */
function mallet(ballAtStroke: P3, handY: number, handZ: number, raisedDeg: number | null): MalletPose3 {
  const L = TIMP_MALLET.len - TIMP_MALLET.butt;
  const rise = ballAtStroke.y - handY;
  const plan = Math.sqrt(L * L - rise * rise);
  const dz = handZ - ballAtStroke.z;
  const hand: P3 = { x: ballAtStroke.x - Math.sqrt(plan * plan - dz * dz), y: handY, z: handZ };
  let u = { x: (ballAtStroke.x - hand.x) / L, y: (ballAtStroke.y - hand.y) / L, z: (ballAtStroke.z - hand.z) / L };
  if (raisedDeg != null) {
    // Turned about the hand: the same heading from above, the ball raisedDeg above the hand.
    const hz = Math.hypot(u.x, u.z);
    const e = (raisedDeg * Math.PI) / 180;
    u = { x: (u.x / hz) * Math.cos(e), y: -Math.sin(e), z: (u.z / hz) * Math.cos(e) };
  }
  return { butt: add(hand, u, -TIMP_MALLET.butt), hand, ball: add(hand, u, L) };
}
export const TIMP_MALLETS: readonly MalletPose3[] = [
  mallet(ballOn(-80), -940, PLAYER_Z - 150, null),
  mallet(ballOn(80), -950, PLAYER_Z + 150, TIMP_MALLET.raisedDeg),
];

