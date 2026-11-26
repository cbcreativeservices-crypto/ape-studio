/**
 * THE REED PIANO'S PLAYER — the shared figure's joints (pure; the anatomy
 * ratchet reaches it). Figure pass 2026-10-15 (owner on I11b: "shoulder and
 * head merge, proportions are off"): the player was a hand-built set of
 * capsules — a round-topped torso that rose past the chin, a 200 mm head
 * sunk into it. It is now the house PlayerFigure (the acoustic pianist's
 * figure, C11) on an adult skeleton (a 1.62 m adult; the head 220 mm,
 * ≈ 1/7.4 of the height — the authored frame's top, 1330 above the floor,
 * holds a seated adult of this size, not a taller one):
 *
 *   • seated on the bench (top 480 above the floor), the hip joint 85 above
 *     the seat, the collar ≈ 575 above it, the head's centre 150 above the
 *     collar — a clear neck between the chin and the shoulders;
 *   • an upright back leaning ≈ 10° toward the keys from the hips;
 *   • upper arms 300, forearms 250 (ARM 325 / 265 is the adult maximum), the
 *     forearms LEVEL with the key tops (elbows ≈ 40 above them), the hands
 *     curved down onto the keys near their front edge;
 *   • thighs ≈ 400 forward from the hip, sloping a little to the knee (the
 *     seat is above the knee's crease), the near foot on the sustain pedal,
 *     the far foot flat on the floor.
 *
 * Every joint is a DRAWING DEFAULT (no source gives a player's geometry);
 * the model's keep-outs (wurliModel PLAYER envelopes) are unchanged.
 *
 * SEAT (owner ruling 2026-11-26, a pianist: "a little far back from the keys,
 * the forearms sloping"): the bench and the whole seated body moved
 * WURLI_SEAT_CLOSER = 100 mm toward the keys (the hip 627 → 527 behind the
 * key fronts, the bench 470–800 → 370–700), so the upper arms hang near the
 * body (≈ 14–16° off vertical, was ≈ 25°) and the elbows bend ≈ 92–95°. An
 * upper arm that HANGS puts the elbow ≈ 300 below the shoulder, so the elbow's
 * height is set by the seat: at 480 it sat 6–18 mm BELOW the 720 key tops
 * (keysSpec WURLI.keyTop, a drawing default) and lower would be worse — so the
 * seat is 490 (WURLI_SEAT_LIFT = 10 up; a typical bench is 480–500, C11's is
 * 480, pianoSpec PIANIST_DIMS.seatH): the elbows at the key tops, the forearm
 * as level as the C11 pianist's test asks. Not higher: the crown must stay
 * inside the side view's frame (1330). The pedal foot, the pedal, the hands'
 * wrists and every keep-out stay where they were; the knees come in under
 * the keys' front (the near knee 17 lower so the shin keeps its length to the
 * pedal), clear of the case's underside (640 up).
 * Coordinates: the section's mm, +x toward the player, y DOWN (side); from
 * above (x, z) with z as the drawing's v.
 */
import { BODY, pt, type PlayerPose } from '../players/playerPose.ts';

/** The bench's top (KeysArt draws the bench there). */
export const WURLI_SEAT_Y = -490;
/** How far the bench and the seated body moved toward the keys (owner ruling 2026-11-26). */
export const WURLI_SEAT_CLOSER = 100;
/** How far the seat (and the body on it) rose with that move: 480 → 490 (see above). */
export const WURLI_SEAT_LIFT = 10;
/** The bench (side: its top's front and back edges, x; KeysArt draws it): 470–800 before the move. */
export const WURLI_BENCH = { x0: 470 - WURLI_SEAT_CLOSER, x1: 800 - WURLI_SEAT_CLOSER, legs: [490 - WURLI_SEAT_CLOSER, 760 - WURLI_SEAT_CLOSER], halfZ: 380 } as const;
const KEY_TOP_Y = -720;
const HEAD_R = 110;
const C = WURLI_SEAT_CLOSER;
const H = WURLI_SEAT_LIFT;

const hip = pt(627 - C, WURLI_SEAT_Y - 85);
const neck = pt(541 - C, -1052 - H);

/** In profile, facing the keys (−x). R = the near side. */
export const WURLI_PLAYER_SIDE: PlayerPose = {
  view: 'side',
  posture: 'seated',
  facing: -1,
  head: { c: pt(neck.u - 18, neck.v - 150), r: HEAD_R },
  neck,
  shoulderR: pt(549 - C, -1002 - H),
  shoulderL: pt(562 - C, -1012 - H),
  // (the elbows and wrists here are the old figure's only — the drawn arms are solved at the keys, wurliPlayerV2)
  elbowR: pt(370, -761),
  elbowL: pt(386, -770),
  handR: { wrist: pt(120, KEY_TOP_Y - 45), dir: Math.PI - 0.12, kind: 'keys' },
  handL: { wrist: pt(138, KEY_TOP_Y - 52), dir: Math.PI - 0.12, kind: 'keys' },
  hipR: hip,
  hipL: pt(hip.u + 10, hip.v - 4),
  // (the knees in with the bench; the near one 17 lower so its shin keeps its length down to the pedal)
  kneeR: pt(230 - C, -488),
  kneeL: pt(252 - C, -492),
  // the near foot's sole on the pedal's top (≈ 56 above the floor), where it
  // was; the far foot flat on the floor, drawn back under the knee so the two
  // shoes read apart (in with the knee)
  footR: pt(255, -56),
  footL: pt(345 - C, 0),
  floor: 0,
};

/** From above (authored chest toward +v round the collar, turned to face −x). */
const topNeck = pt(neck.u, 0);
const L = (right: number, fwd: number) => pt(topNeck.u - right, topNeck.v + fwd);
const fwd = (x: number) => topNeck.u - x;
export const WURLI_PLAYER_TOP: PlayerPose = {
  view: 'above',
  posture: 'seated',
  facing: Math.PI,
  head: { c: L(0, -18), r: HEAD_R },
  neck: topNeck,
  shoulderR: L(BODY.shoulderHalf, 4),
  shoulderL: L(-BODY.shoulderHalf, 4),
  // the elbows a little out from the ribs, the hands ≈ 340 apart on the keys
  elbowR: L(228, fwd(370)),
  elbowL: L(-228, fwd(386)),
  handR: { wrist: L(170, fwd(120)), dir: Math.PI / 2, kind: 'above' },
  handL: { wrist: L(-170, fwd(138)), dir: Math.PI / 2, kind: 'above' },
  hipR: L(106, -40),
  hipL: L(-106, -40),
  kneeR: L(128, fwd(230 - C)),
  kneeL: L(-128, fwd(252 - C)),
  footR: L(132, fwd(255)),
  footL: L(-132, fwd(345 - C)),
  floor: null,
};
