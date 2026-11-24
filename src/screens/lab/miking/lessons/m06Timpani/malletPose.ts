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
/**
 * THE HANDS RAISED (owner 2026-11-24, "Raise the hands": the forearms about level, as the approved kit drummer's, so
 * the approved mallet hand — a straight wrist, the shaft 15° below the forearm — can hold them). Each ball stays
 * exactly where it was (the stroke's on the head; the raised one where the raise put it); each hand moves round its
 * ball on the mallet's own length (the test checks these numbers):
 *   • the RIGHT (raised) hand: the approved mallet hand; the grip malletPlaced.malletGripFor finds — up 219 mm to
 *     elbow height, the forearm level (2°); the shaft now runs 17° DOWN from the hand to the ball (the whole forearm
 *     lifted, not the ball tipped up over the wrist);
 *   • the LEFT (stroke) hand: its palm to the camera, the drummer's palm-side fist. The drum's head is too low for a
 *     level forearm on a standing player with a 31 cm mallet; raised 43 mm the elbow had to come up and forward and
 *     the forearm bent into the fist (owner: "look like a broken arm"). Its grip is where that fist takes a STRAIGHT
 *     wrist on a relaxed arm (malletPlaced.palmFistArm: the elbow 266 mm below the shoulder, 100 mm forward, the
 *     forearm 57° down): the shaft 20° to the head, the hand 12 cm over it (the playing standard) — 58 mm LOWER than
 *     before.
 */
export const RAISED_HANDS = { stroke: { x: -534.75, y: -882.19, z: PLAYER_Z - 150 }, raised: { x: -516.6, y: -1169.3, z: PLAYER_Z + 150 } } as const;
/** The same ball, the hand moved round it on the mallet's length (toward `hand`). */
function regrip(m: MalletPose3, hand: P3): MalletPose3 {
  const L = TIMP_MALLET.len - TIMP_MALLET.butt;
  const d = { x: m.ball.x - hand.x, y: m.ball.y - hand.y, z: m.ball.z - hand.z };
  const n = Math.hypot(d.x, d.y, d.z);
  const u = { x: d.x / n, y: d.y / n, z: d.z / n };
  const h = add(m.ball, u, -L);
  return { butt: add(h, u, -TIMP_MALLET.butt), hand: h, ball: m.ball };
}
/** (before 2026-11-24: the hands as low over the head as the standing figure could hold them) */
export const TIMP_MALLETS_LOW: readonly MalletPose3[] = [
  mallet(ballOn(-80), -940, PLAYER_Z - 150, null),
  mallet(ballOn(80), -950, PLAYER_Z + 150, TIMP_MALLET.raisedDeg),
];
export const TIMP_MALLETS: readonly MalletPose3[] = [regrip(TIMP_MALLETS_LOW[0], RAISED_HANDS.stroke), regrip(TIMP_MALLETS_LOW[1], RAISED_HANDS.raised)];

