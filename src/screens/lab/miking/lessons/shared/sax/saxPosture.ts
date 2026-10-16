/**
 * THE SAXOPHONIST AND THE SAXOPHONE IN THE ROOM — the family's posture
 * (alto_sax/GEOMETRY_PROPOSAL.md §2 "Player pose", §4), every number a
 * DRAWING DEFAULT (no source gives a player's geometry). Placed in the
 * LESSON FRAME of the miking engine (engine/model/types.ts): origin at the
 * REED TIP (where the mouthpiece meets the lips), +x toward the audience,
 * +y DOWN, +z toward the player's RIGHT. The player faces +x.
 *
 *   The instrument's plane (a forward, b down, c across) is turned `yaw`
 *   toward the player's right (the bell faces forward and a little right)
 *   and rolled `roll` so the low end hangs to the player's right — an alto
 *   or tenor on a neck strap beside the right thigh, a baritone on a
 *   harness at the hip, a straight soprano held down and forward
 *   ("a downward-looking position", Y-HUB-SAX).
 *   STANDING or SEATED: the instrument stays where it is in the frame (the
 *   mouthpiece at the lips); the floor, the legs and the chair move —
 *   seated, the floor comes 390 mm closer and the thighs run forward.
 *
 * Pure: plain numbers. The solids (saxModel.ts), the art and the tests read
 * the same posture, so the drawing, the collisions and the zones agree.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { holesOf, pathOf, pointAt, radiusAt, type SaxRow } from './saxSpec.ts';

export type SaxPostureKind = 'standing' | 'seated';

/** The instrument plane's axes in the lesson frame: a (forward), b (down),
 *  n (across, toward the camera side — the player's right). */
export type PlaneAxes = { a: Vec3; b: Vec3; n: Vec3 };

export type SaxSkeleton = {
  head: Vec3;
  headR: number;
  neck: Vec3;
  chest: Vec3;
  pelvis: Vec3;
  shoulderL: Vec3;
  shoulderR: Vec3;
  elbowL: Vec3;
  elbowR: Vec3;
  /** Wrists and the hands' palms on the key stacks. */
  wristL: Vec3;
  wristR: Vec3;
  handL: Vec3;
  handR: Vec3;
  hipL: Vec3;
  hipR: Vec3;
  kneeL: Vec3;
  kneeR: Vec3;
  ankleL: Vec3;
  ankleR: Vec3;
  toeL: Vec3;
  toeR: Vec3;
};

export type SaxPosture = {
  row: SaxRow;
  kind: SaxPostureKind;
  ax: PlaneAxes;
  player: SaxSkeleton;
  floorY: number;
  /** The chair (seated): its seat (a box) and four legs. */
  chair: { seat: { min: Vec3; max: Vec3 }; legs: [Vec3, Vec3][] } | null;
  /** The neck strap: from the back of the player's neck to the strap ring. */
  strap: { from: Vec3; to: Vec3 };
  /** Each hand's frame on its key stack (figure pass 3 — saxHands.ts starts
   *  the 3-D hand here): the station u, the wrist, the way the hand points,
   *  the way its back faces, toward its thumb. */
  hands: { L: HandAt; R: HandAt };
};

export type HandAt = { u: number; wrist: Vec3; along: Vec3; dorsal: Vec3; thumbSide: Vec3 };
/** A direction or offset in the tube's own frame at u: along it toward the
 *  bell (t), out of its front (f, away from the player), across it toward
 *  the player's right (c). */
export type TubeLocal = readonly [t: number, f: number, c: number];
/** A hand held on the body: its knuckle row's centre K, the way it points
 *  (wrist → knuckles), its back, its thumb — tube-local at u. */
export type SaxHold = { K: TubeLocal; along: TubeLocal; dorsal: TubeLocal; thumb: TubeLocal };

/**
 * THE HOLDS (figure pass 3, drawing defaults found by fitting the shared hand
 * to the pearls — saxHands.ts): each palm on its own side of the body (the
 * left on the player's left, the right on the player's right), the fingers
 * round its front onto the pearls, the thumbs behind (the left on its rest
 * under the octave key, the right under the thumb hook). Per row, from the
 * tube's radius when not tuned.
 */
const SAX_HOLDS: Partial<Record<SaxRow['id'], { L: SaxHold; R: SaxHold }>> = {
  soprano: {
    L: { K: [22.6, 7.6, -49.2], along: [0.22, 0.8, 0.56], dorsal: [-0.01, 0.58, -0.82], thumb: [-0.98, 0.17, 0.14] },
    R: { K: [32.5, -5.6, 45.3], along: [0.6, 0.63, -0.48], dorsal: [0.29, 0.39, 0.87], thumb: [-0.74, 0.67, -0.05] },
  },
  alto: {
    L: { K: [24.3, 2.2, -54.2], along: [0.22, 0.81, 0.55], dorsal: [0.12, 0.54, -0.84], thumb: [-0.97, 0.25, 0.03] },
    R: { K: [37.8, 1.9, 47.2], along: [0.71, 0.63, -0.31], dorsal: [0.33, 0.09, 0.94], thumb: [-0.62, 0.77, 0.14] },
  },
  tenor: {
    L: { K: [46.4, 1.3, -57.1], along: [0.15, 0.84, 0.52], dorsal: [-0.02, 0.53, -0.85], thumb: [-0.99, 0.12, 0.1] },
    R: { K: [60.8, 17.2, 50.8], along: [-0.1, 0.89, -0.45], dorsal: [-0.46, 0.36, 0.81], thumb: [-0.88, -0.29, -0.37] },
  },
  baritone: {
    L: { K: [47.4, 27.9, -66.7], along: [-0.07, 0.82, 0.56], dorsal: [-0.58, 0.43, -0.7], thumb: [-0.81, -0.37, 0.44] },
    R: { K: [79.1, 20.6, 56.8], along: [0.01, 0.84, -0.54], dorsal: [-0.44, 0.49, 0.76], thumb: [-0.9, -0.23, -0.37] },
  },
};
function holdsOf(row: SaxRow, r: number): { L: SaxHold; R: SaxHold } {
  return (
    SAX_HOLDS[row.id] ?? {
      L: { K: [10, 4, -(r + 26)], along: [0.22, 0.8, 0.56], dorsal: [-0.05, 0.58, -0.81], thumb: [-1, 0, 0] },
      R: { K: [-5, -12, r + 24], along: [0.21, 0.81, -0.55], dorsal: [0.4, 0.45, 0.8], thumb: [-0.89, 0.39, 0.23] },
    }
  );
}
const PALM_TO_KNUCKLES = 95;
function placeHold(P: Pick<SaxPosture, 'row' | 'ax'>, u: number, h: SaxHold): HandAt {
  const t = tangent(P, u);
  const f = frontNormal(P, u);
  const c = P.ax.n;
  const loc = (q: TubeLocal) => add(scale(t, q[0]), add(scale(f, q[1]), scale(c, q[2])));
  const along = norm(loc(h.along));
  const wrist = sub(add(centre(P, u), loc(h.K)), scale(along, PALM_TO_KNUCKLES));
  return { u, wrist, along, dorsal: norm(loc(h.dorsal)), thumbSide: norm(loc(h.thumb)) };
}

const DEG = Math.PI / 180;
/** The lips (the reed tip) above the floor: standing, seated. */
export const MOUTH_HEIGHT = { standing: 1560, seated: 1170 } as const;

function crossM(p: Vec3, q: Vec3): Vec3 {
  // The ordinary (right-handed) cross product, used only to find the plane's
  // across axis; its sign is then fixed by the camera (n.z > 0).
  return { x: p.y * q.z - p.z * q.y, y: p.z * q.x - p.x * q.z, z: p.x * q.y - p.y * q.x };
}

/** The plane's axes for a row (yaw to the right, roll the low end right). */
export function planeAxes(row: SaxRow): PlaneAxes {
  const y = row.yaw * DEG;
  const r = row.roll * DEG;
  const a = { x: Math.cos(y), y: 0, z: Math.sin(y) };
  const b = norm({ x: -Math.sin(r) * Math.sin(y), y: Math.cos(r), z: Math.sin(r) * Math.cos(y) });
  let n = norm(crossM(a, b));
  if (n.z < 0) n = scale(n, -1);
  return { a, b, n };
}

/** An instrument-plane point (a, b, c) in the lesson frame. */
export function toLesson(ax: PlaneAxes, a: number, b: number, c: number): Vec3 {
  return add(add(scale(ax.a, a), scale(ax.b, b)), scale(ax.n, c));
}

/** The centre line at u, in the lesson frame. */
export function centre(P: Pick<SaxPosture, 'row' | 'ax'>, u: number): Vec3 {
  const q = pointAt(P.row, u);
  return toLesson(P.ax, q.a, q.b, q.c);
}

/** The path's unit tangent at u (lesson frame). */
export function tangent(P: Pick<SaxPosture, 'row' | 'ax'>, u: number): Vec3 {
  const U = pathOf(P.row).U;
  const a = centre(P, Math.max(0, u - 3));
  const b = centre(P, Math.min(U, u + 3));
  return norm(sub(b, a));
}

/** The in-plane normal at u, on the tube's FRONT (the side away from the
 *  player, where the key cups and the pearl touches sit). */
export function frontNormal(P: Pick<SaxPosture, 'row' | 'ax'>, u: number): Vec3 {
  const t = tangent(P, u);
  // In the plane, perpendicular to the tangent: rotate (ta, tb) by 90°.
  const ta = dot(t, P.ax.a);
  const tb = dot(t, P.ax.b);
  let m = norm(add(scale(P.ax.a, -tb), scale(P.ax.b, ta)));
  // "Front" = away from the player's body (+a), or up the bell's outside.
  const toward = add(P.ax.a, scale(P.ax.b, -0.2));
  if (dot(m, toward) < 0) m = scale(m, -1);
  return m;
}

/** A point on the tube's surface at u: `ang` degrees round from the front
 *  (+90 = the camera side, the player's right), `off` mm out from it. */
export function onTube(P: Pick<SaxPosture, 'row' | 'ax'>, u: number, ang: number, off = 0): Vec3 {
  const c = centre(P, u);
  const f = frontNormal(P, u);
  const dir = norm(add(scale(f, Math.cos(ang * DEG)), scale(P.ax.n, Math.sin(ang * DEG))));
  return add(c, scale(dir, radiusAt(P.row, u) + off));
}

/** The outward direction of the tube at u and angle `ang` (as onTube). */
export function tubeDir(P: Pick<SaxPosture, 'row' | 'ax'>, u: number, ang: number): Vec3 {
  const f = frontNormal(P, u);
  return norm(add(scale(f, Math.cos(ang * DEG)), scale(P.ax.n, Math.sin(ang * DEG))));
}

/** Where each hole's cup faces, round the tube from the front (deg). The
 *  bell's holes face the camera side; the palm keys' holes sit higher up the
 *  front; the main stacks face front and a little right. ILLUSTRATIVE. */
export function holeAngle(row: SaxRow, k: number): number {
  const H = holesOf(row);
  const K = H.length;
  const h = H[k - 1];
  if (h.on === 'bell') return 40 + (k % 2) * 25;
  if (k >= K - 2) return 75;
  return 18 + (k % 3) * 22;
}

/** Two-bone reach: the elbow for a shoulder S and a wrist W (upper arm a,
 *  forearm b), bent toward `pole`. */
export function elbowOf(S: Vec3, W: Vec3, a: number, b: number, pole: Vec3): Vec3 {
  const dv = sub(W, S);
  const dl = Math.max(1e-6, Math.min(a + b - 1, len(dv)));
  const e = norm(dv);
  // Distance along S→W to the elbow's foot, and the elbow's height off it.
  const x = (a * a - b * b + dl * dl) / (2 * dl);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  let p = sub(pole, scale(e, dot(pole, e)));
  p = len(p) < 1e-6 ? { x: 0, y: 1, z: 0 } : norm(p);
  return add(add(S, scale(e, x)), scale(p, h));
}

/** The family's anchors on the instrument (lesson frame). */
export type SaxAnchors = {
  /** The bell rim's centre and its axis (out of the bell), its radius. */
  rimC: Vec3;
  bellAxis: Vec3;
  rimR: number;
  /** The middle of the tone-hole field on the body (on the front, at the
   *  surface) and its outward direction. */
  holesC: Vec3;
  holesN: Vec3;
  /** The left hand's (upper) key stack, and the right hand's (lower). */
  upperKeys: Vec3;
  lowerKeys: Vec3;
  /** A third of the way up the horn from its lowest point (on the body). */
  third: Vec3;
  /** The horn's highest and lowest points (its top and its bottom). */
  top: Vec3;
  bottom: Vec3;
  /** The reed tip (the lesson frame's origin) and the strap ring. */
  reed: Vec3;
  ring: Vec3;
};

export function anchorsOf(P: Pick<SaxPosture, 'row' | 'ax'>): SaxAnchors {
  const row = P.row;
  const S = pathOf(row);
  const H = holesOf(row);
  const rimC = centre(P, S.U);
  const bellAxis = tangent(P, S.U - 1);
  const bodyHoles = H.filter((h) => h.on === 'body');
  const mid = bodyHoles[Math.floor(bodyHoles.length / 2)] ?? H[Math.floor(H.length / 2)];
  const holesN = tubeDir(P, mid.u, 30);
  const holesC = onTube(P, mid.u, 30);
  const up = bodyHoles[bodyHoles.length - 4] ?? H[H.length - 4];
  const lo = bodyHoles[2] ?? H[2];
  // Top and bottom: the highest and lowest centre-line points (y-down).
  let top = centre(P, 0);
  let bottom = centre(P, 0);
  for (let u = 0; u <= S.U; u += 8) {
    const q = centre(P, u);
    if (q.y < top.y) top = q;
    if (q.y > bottom.y) bottom = q;
  }
  // A third of the way up from the lowest point, on the body.
  const yThird = bottom.y - (bottom.y - top.y) / 3;
  let third = centre(P, S.tenon);
  let best = Infinity;
  for (let u = S.tenon; u <= S.bodyEnd; u += 4) {
    const q = centre(P, u);
    const e = Math.abs(q.y - yThird);
    if (e < best) {
      best = e;
      third = q;
    }
  }
  return {
    rimC,
    bellAxis,
    rimR: row.rimR.v,
    holesC,
    holesN,
    upperKeys: onTube(P, up.u, 20),
    lowerKeys: onTube(P, lo.u, 40),
    third,
    top,
    bottom,
    reed: { x: 0, y: 0, z: 0 },
    ring: onTube(P, S.tenon + 70, 180, 6),
  };
}

/** The player and the instrument for one row, standing or seated. */
export function saxPosture(row: SaxRow, kind: SaxPostureKind): SaxPosture {
  const ax = planeAxes(row);
  const P0 = { row, ax };
  const S = pathOf(row);
  const H = holesOf(row);
  // The torso stands behind the mouth; a baritone's player stands a little
  // further back from the horn (it hangs at the hip on a harness).
  const back = row.id === 'baritone' ? 25 : 0;
  const head = { x: -78 - back, y: -42, z: 0 };
  const neck = { x: -104 - back, y: 128, z: 0 };
  const shoulderL = { x: -112 - back, y: 178, z: -182 };
  const shoulderR = { x: -112 - back, y: 178, z: 182 };
  const chest = { x: -122 - back, y: 300, z: 0 };
  const pelvis = { x: -128 - back, y: 650, z: 0 };
  const hipL = { x: pelvis.x, y: 672, z: -95 };
  const hipR = { x: pelvis.x, y: 672, z: 95 };
  // The hands on the key stacks: the left on the upper stack (the far side
  // of the body), the right on the lower stack (round the near side).
  const body = H.filter((h) => h.on === 'body');
  const lhU = body[body.length - 3]?.u ?? (S.tenon + S.bodyEnd) / 2;
  const rhU = body[Math.min(body.length - 1, 3)]?.u ?? S.bodyEnd - 80;
  // (figure pass 3) Each hand from its hold: the wrist a palm behind the
  // knuckles, `hand` the palm's centre (the keep-outs' hand capsule).
  const H0 = holdsOf(row, radiusAt(row, lhU));
  const HL = placeHold(P0, lhU, H0.L);
  const HR = placeHold(P0, rhU, holdsOf(row, radiusAt(row, rhU)).R);
  const wristL = HL.wrist;
  const wristR = HR.wrist;
  const handL = add(wristL, scale(HL.along, 60));
  const handR = add(wristR, scale(HR.along, 60));
  // The elbows hang out to each side and a little back (a relaxed hold).
  const elbowL = elbowOf(shoulderL, wristL, 290, 255, { x: -0.25, y: 0.75, z: -1 });
  const elbowR = elbowOf(shoulderR, wristR, 290, 255, { x: -0.3, y: 0.4, z: 1 });
  const yFloor = MOUTH_HEIGHT[kind];
  let kneeL: Vec3;
  let kneeR: Vec3;
  let ankleL: Vec3;
  let ankleR: Vec3;
  let toeL: Vec3;
  let toeR: Vec3;
  let chair: SaxPosture['chair'] = null;
  if (kind === 'standing') {
    kneeL = { x: pelvis.x + 14, y: 1100, z: -102 };
    kneeR = { x: pelvis.x + 14, y: 1100, z: 102 };
    ankleL = { x: pelvis.x - 4, y: yFloor - 75, z: -108 };
    ankleR = { x: pelvis.x - 4, y: yFloor - 75, z: 108 };
    toeL = { x: pelvis.x + 150, y: yFloor - 30, z: -116 };
    toeR = { x: pelvis.x + 150, y: yFloor - 30, z: 116 };
  } else {
    // Seated: the thighs run forward and a little toward the player's left,
    // so the low end of the horn hangs clear beside the right knee — or,
    // for the straight soprano, the knees part and the bell sits between.
    const zl = row.id === 'soprano' ? -235 : -170;
    const zr = row.id === 'soprano' ? 235 : 60;
    kneeL = { x: pelvis.x + 430, y: 690, z: zl };
    kneeR = { x: pelvis.x + 425, y: 690, z: zr };
    ankleL = { x: kneeL.x + 30, y: yFloor - 75, z: zl - 5 };
    ankleR = { x: kneeR.x + 30, y: yFloor - 75, z: zr + 10 };
    toeL = { x: ankleL.x + 150, y: yFloor - 30, z: zl - 8 };
    toeR = { x: ankleR.x + 150, y: yFloor - 30, z: zr + 14 };
    const seatTop = 724;
    const x0 = pelvis.x - 200;
    const x1 = pelvis.x + 260;
    chair = {
      seat: { min: { x: x0, y: seatTop, z: -220 }, max: { x: x1, y: seatTop + 40, z: 220 } },
      legs: [
        [{ x: x0 + 30, y: seatTop + 40, z: -190 }, { x: x0 + 20, y: yFloor, z: -200 }],
        [{ x: x0 + 30, y: seatTop + 40, z: 190 }, { x: x0 + 20, y: yFloor, z: 200 }],
        [{ x: x1 - 30, y: seatTop + 40, z: -190 }, { x: x1 - 20, y: yFloor, z: -200 }],
        [{ x: x1 - 30, y: seatTop + 40, z: 190 }, { x: x1 - 20, y: yFloor, z: 200 }],
      ],
    };
  }
  const anchors = anchorsOf(P0);
  return {
    row,
    kind,
    ax,
    player: { head, headR: 102, neck, chest, pelvis, shoulderL, shoulderR, elbowL, elbowR, wristL, wristR, handL, handR, hipL, hipR, kneeL, kneeR, ankleL, ankleR, toeL, toeR },
    floorY: yFloor,
    chair,
    strap: { from: { x: neck.x - 30, y: neck.y - 20, z: 0 }, to: anchors.ring },
    hands: { L: HL, R: HR },
  };
}
