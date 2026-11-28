/**
 * M13 TABLA — THE PLAYER'S SEAT (owner ruling 2026-11-26). Pure: no React, no
 * Skia, so the side view, the view from above and the tests read ONE set of
 * joints and cannot disagree.
 *
 * Was: the player sat high (the hip joint 17 cm off the floor, the seat
 * hovering, the shins folded under — it read as kneeling back on the heels)
 * and far back, both arms reaching nearly straight out to the drums.
 * Is: a tabla player sitting CROSS-LEGGED on the floor, close to the drums —
 * the seat on the floor, the torso upright with a slight forward lean, the
 * upper arms hanging near the body a little out to the sides, the elbows bent
 * about 90–100°, the forearms sloping down to the heads. The knees sit out to
 * either side and behind the drums (from above). The hands, the drums, their
 * rings and every mic stay where the lesson puts them: only the player moved.
 *
 * Frame H (model.ts): x toward the audience, y down (the floor y = 0), z the
 * player's right. The research (tabla/SOURCES.md, CORRECTIONS TA-05) gives no
 * player geometry: "seated on the floor" is a drawing default the owner checks.
 */

export type J3 = { x: number; y: number; z: number };

/** The figure's upper arm and forearm (the cast figure's own 300 / 265 mm). */
export const UPPER_ARM = 300;
export const FOREARM = 265;

/** The hip joint ≈ 11 cm off the floor: the seat of the trousers rests on the floor. Hips ±106 mm across. */
export const SEAT_HIP = { x: -542, y: -112 } as const;
export const HIP_Z = 106;

/** The torso turned forward from the old (near-upright) drawing about the hip: a slight lean, ≈ 7° from vertical in all. */
export const LEAN_DEG = 5;

/** The old seat (until 2026-11-26) the upper body is carried from: its hip and its upper-body joints. */
const OLD_HIP = { x: -600, y: -170 };
const OLD = {
  head: { x: -560, y: -1000 },
  neck: { x: -577, y: -845 },
  shoulderR: { x: -572, y: -795 },
  shoulderL: { x: -586, y: -805 },
};

/** The upper body: the same figure (its own proportions), leaned forward and set down on the new seat. */
function carry(p: { x: number; y: number }): { x: number; y: number } {
  const a = (LEAN_DEG * Math.PI) / 180;
  const du = p.x - OLD_HIP.x;
  const dv = p.y - OLD_HIP.y;
  return { x: SEAT_HIP.x + du * Math.cos(a) - dv * Math.sin(a), y: SEAT_HIP.y + du * Math.sin(a) + dv * Math.cos(a) };
}

export const HEAD = carry(OLD.head);
export const NECK = carry(OLD.neck);
/** The shoulders, 188 mm either side of the midline (as the view from above has always drawn them). */
export const SHOULDER_R: J3 = { ...carry(OLD.shoulderR), z: 188 };
export const SHOULDER_L: J3 = { ...carry(OLD.shoulderL), z: -188 };

/** The wrists: EXACTLY where the lesson's hands lie on the heads (unchanged; z over each drum's head). */
export const WRIST_R: J3 = { x: -145, y: -441, z: 156 };
export const WRIST_L: J3 = { x: -182, y: -464, z: -176 };

/** The elbows a little out from the body (from above, ≈ 12–13 cm outside the shoulders): the upper arms hang
 *  down and slightly forward and out, so the forearms slope down to the heads. */
export const ELBOW_OUT_Z = { R: 310, L: -322 } as const;

/** The elbow (3D) for a shoulder and a wrist with the arm's true lengths, at a chosen z: the bend below and behind the shoulder–wrist line. */
export function solveElbow(S: J3, W: J3, ez: number, a = UPPER_ARM, b = FOREARM): J3 {
  const rs = Math.sqrt(Math.max(0, a * a - (ez - S.z) ** 2));
  const rw = Math.sqrt(Math.max(0, b * b - (ez - W.z) ** 2));
  const dx = W.x - S.x;
  const dy = W.y - S.y;
  const d = Math.hypot(dx, dy);
  const along = (rs * rs - rw * rw + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, rs * rs - along * along));
  const ux = dx / d;
  const uy = dy / d;
  // (the perpendicular toward +y — below the line, and back toward the body)
  return { x: S.x + ux * along - uy * h, y: S.y + uy * along + ux * h, z: ez };
}

export const ELBOW_R = solveElbow(SHOULDER_R, WRIST_R, ELBOW_OUT_Z.R);
export const ELBOW_L = solveElbow(SHOULDER_L, WRIST_L, ELBOW_OUT_Z.L);

/** The knees low (≈ 11 cm up: each rests over the other leg's foot), out to the sides past the drums and behind them. */
export const KNEE_R: J3 = { x: -238, y: -110, z: 320 };
export const KNEE_L: J3 = { x: -260, y: -118, z: -320 };

/** (tests and the report) the elbow's inside angle in 3D, in degrees. */
export function elbowDeg(S: J3, E: J3, W: J3): number {
  const a = { x: S.x - E.x, y: S.y - E.y, z: S.z - E.z };
  const b = { x: W.x - E.x, y: W.y - E.y, z: W.z - E.z };
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return (Math.acos(dot / (Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z))) * 180) / Math.PI;
}
