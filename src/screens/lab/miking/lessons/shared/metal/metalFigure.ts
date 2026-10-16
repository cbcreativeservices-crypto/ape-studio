/**
 * THE METAL-PERCUSSION PLAYER as the shared figure (pure; the anatomy
 * ratchet reaches it). Figure pass 2026-10-15: the triangle, finger-cymbal,
 * bar-chime and gong lessons drew a stick figure — stroked lines for the
 * body and arms, no hands, the figure's skin head on top. The same calls
 * (playerSide / playerTop / playerFront with the hand points) now give a
 * PlayerPose for the house PlayerFigure: a standing adult (1.77 m, head
 * 228 = 1/7.8), arms of adult length solved at the elbow, a hand closed on
 * what it holds (a clip, a strap, a beater) or hanging at the side.
 *
 * Frame H (metalArt): +x toward the audience, +y DOWN, floor y = 0, +z the
 * player's right; chest front plane at x = −250.
 *   side  (u = x, v = y): in profile, facing +x;
 *   top   (u = x, v = z): from above, the chest toward +x;
 *   front (u = −z, v = y): seen from the audience.
 * Every joint is a drawing default (no source gives a player's geometry).
 */
import { BODY, pt, type Hand, type PlayerPose, type Pt } from '../players/playerPose.ts';

type H2 = readonly (readonly [number, number])[];

/** Adult arm lengths for the solved arm (mm): shoulder → elbow, elbow → wrist. */
export const METAL_ARM = { upper: 310, fore: 260 } as const;
/** The wrist sits this far back from the point a closed hand holds. */
const GRIP_BACK = 70;

/** The elbow of a two-bone arm from `sh` to `w`, bent toward `prefer`
 *  (a direction); a wrist out of reach is pulled back into reach. */
export function solveArm(sh: Pt, w: Pt, prefer: Pt): { elbow: Pt; wrist: Pt } {
  const U = METAL_ARM.upper;
  const F = METAL_ARM.fore;
  let dx = w.u - sh.u;
  let dy = w.v - sh.v;
  let L = Math.max(1, Math.hypot(dx, dy));
  const maxL = (U + F) * 0.985;
  const minL = Math.abs(U - F) + 40;
  if (L > maxL || L < minL) {
    const k = (L > maxL ? maxL : minL) / L;
    dx *= k;
    dy *= k;
    L = Math.hypot(dx, dy);
  }
  const wrist = pt(sh.u + dx, sh.v + dy);
  const a = (U * U - F * F + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, U * U - a * a));
  const nx = dx / L;
  const ny = dy / L;
  let px = -ny;
  let py = nx;
  if (px * prefer.u + py * prefer.v < 0) {
    px = -px;
    py = -py;
  }
  return { elbow: pt(sh.u + nx * a + px * h, sh.v + ny * a + py * h), wrist };
}

/**
 * The arm in the drawing's plane as a seen arm moves: the upper arm HANGS
 * from the shoulder and swings toward the hand only as far as it must for the
 * forearm to reach (a hand held close in front of the chest keeps its elbow
 * at the side, the forearm coming toward the viewer and so drawn shorter —
 * never an elbow thrown out behind the back). `side`: +1 / −1, the way the
 * upper arm may swing (forward in profile, outward from the front).
 */
export function hangingArm(sh: Pt, w: Pt, side: number): { elbow: Pt; wrist: Pt } {
  const U = METAL_ARM.upper;
  const F = METAL_ARM.fore;
  for (let deg = 0; deg <= 150; deg += 2) {
    const a = (deg * Math.PI) / 180;
    const e = pt(sh.u + side * Math.sin(a) * U, sh.v + Math.cos(a) * U);
    if (Math.hypot(w.u - e.u, w.v - e.v) > F) continue;
    // …and never folded flat on itself (≥ 30° between the bones as drawn).
    const fold = Math.abs(Math.atan2(Math.sin(Math.atan2(sh.v - e.v, sh.u - e.u) - Math.atan2(w.v - e.v, w.u - e.u)), Math.cos(Math.atan2(sh.v - e.v, sh.u - e.u) - Math.atan2(w.v - e.v, w.u - e.u))));
    if (Math.hypot(w.u - e.u, w.v - e.v) < 120 || fold >= (30 * Math.PI) / 180) return { elbow: e, wrist: w };
  }
  return solveArm(sh, w, pt(-side * 0.3, 1));
}

/** A closed hand on the point it holds: the wrist GRIP_BACK behind it along the forearm. */
function gripArm(sh: Pt, at: readonly [number, number], side: number): { elbow: Pt; hand: Hand } {
  // First reach the held point to find the forearm's line, then set the
  // wrist back along it so the fist closes on the point.
  const first = hangingArm(sh, pt(at[0], at[1]), side);
  const dir = Math.atan2(at[1] - first.elbow.v, at[0] - first.elbow.u);
  const w = pt(at[0] - Math.cos(dir) * GRIP_BACK, at[1] - Math.sin(dir) * GRIP_BACK);
  const s = hangingArm(sh, w, side);
  return { elbow: s.elbow, hand: { wrist: s.wrist, dir: Math.atan2(at[1] - s.wrist.v, at[0] - s.wrist.u), kind: 'grip' } };
}

const HEAD_R = BODY.headH / 2;

/** In profile, facing +x. hands[0] → the far (left) hand, hands[1] → the near (right). */
export function metalSidePose(hands: H2): PlayerPose {
  const neck = pt(-362, -1490);
  const shR = pt(-380, -1445);
  const shL = pt(-392, -1455);
  const hang = (sh: Pt, back: number): { elbow: Pt; hand: Hand } => ({ elbow: pt(sh.u - 14 - back, sh.v + 300), hand: { wrist: pt(sh.u - 4 - back, sh.v + 560), dir: Math.PI / 2, kind: 'rest' } });
  const near = hands.length >= 2 ? hands[1] : hands[0];
  const far = hands.length >= 2 ? hands[0] : null;
  const R = near ? gripArm(shR, near, 1) : hang(shR, 0);
  const Lh = far ? gripArm(shL, far, 1) : hang(shL, 10);
  return {
    view: 'side',
    posture: 'standing',
    facing: 1,
    head: { c: pt(-345, -1650), r: HEAD_R },
    neck,
    shoulderR: shR,
    shoulderL: shL,
    elbowR: R.elbow,
    elbowL: Lh.elbow,
    handR: R.hand,
    handL: Lh.hand,
    hipR: pt(-372, -930),
    hipL: pt(-382, -934),
    kneeR: pt(-352, -490),
    kneeL: pt(-366, -492),
    footR: pt(-322, 0),
    footL: pt(-344, 0),
    floor: 0,
  };
}

/** Seen from the audience. A hand at u < 0 is the player's right. */
export function metalFrontPose(hands: H2): PlayerPose {
  const shR = pt(-BODY.shoulderHalf, -1445);
  const shL = pt(BODY.shoulderHalf, -1445);
  const hang = (sh: Pt): { elbow: Pt; hand: Hand } => {
    const s = Math.sign(sh.u);
    return { elbow: pt(sh.u + s * 34, sh.v + 300), hand: { wrist: pt(sh.u + s * 44, sh.v + 560), dir: Math.PI / 2, kind: 'rest' } };
  };
  const right = hands.find((h) => h[0] < 0) ?? null;
  const left = hands.find((h) => h[0] >= 0) ?? null;
  const R = right ? gripArm(shR, right, Math.sign(right[0] - shR.u) || -1) : hang(shR);
  const Lh = left ? gripArm(shL, left, Math.sign(left[0] - shL.u) || 1) : hang(shL);
  return {
    view: 'front',
    posture: 'standing',
    head: { c: pt(0, -1650), r: HEAD_R },
    neck: pt(0, -1490),
    shoulderR: shR,
    shoulderL: shL,
    elbowR: R.elbow,
    elbowL: Lh.elbow,
    handR: R.hand,
    handL: Lh.hand,
    hipR: pt(-100, -930),
    hipL: pt(100, -930),
    kneeR: pt(-96, -490),
    kneeL: pt(96, -490),
    footR: pt(-104, 0),
    footL: pt(104, 0),
    floor: 0,
  };
}

/** From above, the chest toward +x. Returns the pose (authored chest toward
 *  +v round the collar and turned by `facing` 0) and whether hands show. */
export function metalTopPose(hands: H2): { pose: PlayerPose; handsShown: boolean } {
  const n = pt(-362, 0);
  // world (x, z) → authored (n.u − z, n.v + (x − n.u)) (turned −90° when drawn)
  const A = (x: number, z: number) => pt(n.u - z, n.v + (x - n.u));
  const shW = (s: number) => [n.u - 4, s * BODY.shoulderHalf] as const;
  const arm = (s: number, at: readonly [number, number] | null) => {
    const [sx, sz] = shW(s);
    if (!at) return { elbow: A(sx + 20, s * (BODY.shoulderHalf + 30)), hand: { wrist: A(sx + 30, s * (BODY.shoulderHalf + 34)), dir: Math.PI / 2, kind: 'above' as const } };
    const [hx, hz] = at;
    // the elbow out from the ribs, a little short of halfway to the hand
    const ex = sx + (hx - sx) * 0.45;
    const ez = sz + (hz - sz) * 0.45 + s * 60;
    const wx = hx - (hx - ex) * 0.22;
    const wz = hz - (hz - ez) * 0.22;
    return { elbow: A(ex, ez), hand: { wrist: A(wx, wz), dir: Math.atan2(hx - wx, -(hz - wz)) + 0, kind: 'above' as const } };
  };
  const right = hands.length >= 2 ? hands[1] : (hands[0] && hands[0][1] >= 0 ? hands[0] : null);
  const left = hands.length >= 2 ? hands[0] : (hands[0] && hands[0][1] < 0 ? hands[0] : null);
  const R = arm(1, right ?? null);
  const Lh = arm(-1, left ?? null);
  const pose: PlayerPose = {
    view: 'above',
    posture: 'standing',
    facing: 0,
    head: { c: pt(n.u, n.v - 14), r: HEAD_R },
    neck: n,
    shoulderR: A(...shW(1)),
    shoulderL: A(...shW(-1)),
    elbowR: R.elbow,
    elbowL: Lh.elbow,
    handR: R.hand,
    handL: Lh.hand,
    hipR: A(n.u - 10, 100),
    hipL: A(n.u - 10, -100),
    kneeR: A(n.u + 10, 100),
    kneeL: A(n.u + 10, -100),
    footR: A(n.u + 90, 110),
    footL: A(n.u + 90, -110),
    floor: null,
  };
  return { pose, handsShown: hands.length > 0 };
}
