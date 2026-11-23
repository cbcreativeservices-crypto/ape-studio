/**
 * THE KIT DRUMMER'S STICKS, SOLVED ONCE IN 3-D (owner 2026-11-22, on the
 * Concert Snare screenshot "drumstickhasunrealisticangle": "look for other
 * labs with drum sticks and make sure they are not all crazy like this
 * example. It should look like normal stick tech. usage").
 *
 * Pure (no React Native): the art (stickPlayer.tsx, KitSceneArt.tsx) and the
 * test (test/stickTechniqueKit_20261122.test.ts) read the SAME numbers.
 *
 * Frame: the kit frame K (kitPlanModel.ts): +x toward the audience, +y DOWN,
 * +z the drummer's right; mm. The side view draws (x, y), the view from
 * above (x, z). Both views are projections of ONE 3-D pose, so the side and
 * the top of a stick always agree (they were solved apart and disagreed by
 * up to 20 cm).
 *
 * A STICK (a 5B-type, 16 in / 406 mm): held a third of the way up from the
 * butt — the fulcrum (thumb and first finger) 290 mm from the bead, 116 mm
 * of butt behind it, under the heel of the hand. The wrist joint sits
 * 70 mm behind the fulcrum along the stick (the fist's length). A stick is
 * never stretched: what is drawn is the 406 mm stick projected.
 *
 * A STROKE (matched grip, relaxed, at the moment of the stroke): the bead (or,
 * for a crash or a China, the stick's SHOULDER) on the struck spot, the stick
 * at a low angle to the struck surface; the fist is where that puts it; the
 * elbow solves the two-bone arm (shoulder → elbow → wrist) and hangs down and
 * out, a little forward of the torso. A RAISED stick pivots at the wrist:
 * the hand stays, the tip comes up.
 *
 * THE BODY: the kit scene's seated drummer (the throne, the head, the
 * shoulders, the hips — KitSceneArt's pose, now in 3-D). A far cymbal is
 * reached the way a player reaches it: the upper body leans forward about
 * the hips (`lean`, degrees) and the shoulder girdle comes forward toward the
 * target (`reach`, mm) — never a longer stick.
 */
import { KIT, KIT_DRUMS, yAt } from '../kitPlanModel.ts';
import { pt, type PlayerPose, type Pt } from '../players/playerPose.ts';
import { DRUMMER, S0 } from './kitSceneModel.ts';

export type V3 = { x: number; y: number; z: number };
type P2 = { x: number; y: number };

const DEG = Math.PI / 180;
const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit = (a: V3): V3 => mul(a, 1 / (len3(a) || 1));
export const dist3 = (a: V3, b: V3) => len3(sub(a, b));

/** The stick (mm). `shoulder`: the taper's shoulder, back from the tip. */
export const STICK = { len: 406, hold: 290, butt: 116, wrist: 70, shoulder: 45 } as const;
/** The drawn drummer's arm (mm, 3-D): the kit figure is a little under adult
 *  size (seat to head top 800 mm), so its bones are too (adult ≈ 325 / 265). */
export const DRUM_ARM = { upper: 300, fore: 262 } as const;

/** A struck surface: a point on it and its unit normal toward the stick. */
export type Surface = { c: V3; n: V3; R: number; kind: 'drum' | 'cymbal' };

/** One hand's stroke. */
export type StrokeSpec = {
  /** Where the stick touches: the bead, or (crash, China) its shoulder. */
  at: V3;
  contact: 'bead' | 'shoulder';
  surface: Surface;
  /** Plan direction of the stick, fulcrum → bead (degrees, atan2(dz, dx)). */
  heading: number;
  /** The stick's slope: + = it falls from the fist to the bead (degrees). */
  elev: number;
  /** A raised stick (the hand not striking): the tip up this many degrees
   *  about the wrist from the stroke above, the hand where it was. */
  raise?: number;
  /** The elbow's hint (offset from the shoulder, mm, K). */
  pole?: V3;
};

/** The whole drummer's moment: both hands; the upper body's forward `lean`
 *  and `twist` (degrees; + turns the chest toward the drummer's left, the
 *  hi-hat side) about the hips; each shoulder girdle's `reach` toward its
 *  target (mm, protraction). */
export type DrummerSpec = { right: StrokeSpec; left: StrokeSpec; lean?: number; twist?: number; reachR?: number; reachL?: number };

export type ArmSolve = {
  hand: 'R' | 'L';
  shoulder: V3;
  elbow: V3;
  wrist: V3;
  fulcrum: V3;
  bead: V3;
  butt: V3;
  /** Unit stick direction, butt → bead. */
  u: V3;
  /** The wrist was pulled in to the arm's reach (the stroke as specified
   *  was out of reach): the test refuses this. */
  pulled: boolean;
  spec: StrokeSpec;
};

export type DrummerPose3 = {
  spec: DrummerSpec;
  head: V3;
  neck: V3;
  shoulderR: V3;
  shoulderL: V3;
  R: ArmSolve;
  L: ArmSolve;
};

/* ── the body (KitSceneArt's seated drummer, in 3-D) ── */

/**
 * WHERE THE DRUMMER SITS (2026-11-22). The kit puts the snare's centre only
 * 34 cm in front of the old figure's shoulders and its head 34 cm below
 * them, so no natural stroke reached it: the fists rose 15–19 cm over the
 * head and the sticks came down at 46–56°. Two corrections at the source:
 *   • the figure is an adult sitting up (head top 1390 mm, seat + 890; the
 *     shoulders ≈ 1070) — kitSceneModel's DRUMMER, its keep-out with it;
 *   • it sits a little back on the throne (`SEAT_BACK`, the hips 45 mm
 *     behind the seat's centre, mid-seat), the knees where they were.
 * The throne itself (kitPlanModel) is unchanged.
 */
export const SEAT_BACK = 50;
// (6 mm under the keep-out's top: the head sits back with the seat, inside env.drummer.)
const HEAD = v3(DRUMMER.headTop.x - SEAT_BACK, DRUMMER.headTop.y + 118, DRUMMER.headTop.z);
/** The neck's base, the shoulders and the hips' midpoint (the lean's pivot). */
export const BODY3 = {
  head: HEAD,
  neck: v3(HEAD.x - 18, HEAD.y + 158, HEAD.z),
  shoulderR: v3(HEAD.x - 14, HEAD.y + 212, HEAD.z + 200),
  shoulderL: v3(HEAD.x - 20, HEAD.y + 206, HEAD.z - 200),
  hip: v3(KIT.throne.c.u + 5 - SEAT_BACK, yAt(KIT.throne.seatH) - 90, KIT.throne.c.v),
} as const;

/**
 * The right foot on the kick pedal (2026-11-22, after M01's pedal was
 * redrawn with the beater 8° off the head and the axle nearer the drum): the
 * heel on the heel plate, the ball of the foot (PlayerFigure's foot point:
 * the heel 96 mm behind it, the toe 150 ahead) a third of the way up the
 * footboard, on the pedal's centre line from above — the same point in both
 * views. The shin then leans a little forward from the knee to the pedal.
 */
export const RIGHT_BALL = { x: KIT.kick.pedal.u0 + 30 + 96, z: 0 } as const;

/** The kit scene's neck before the seat moved back (the legs are placed
 *  round it, from above). */
const KIT_NECK0 = v3(DRUMMER.headTop.x - 16, 0, KIT.throne.c.v);

/** The upper body turned about the hips: `twist` about the vertical (+ the
 *  chest toward −z, the drummer's left), then `lean` forward about the
 *  hips' transverse axis. */
function bodyAbout(p: V3, lean: number, twist: number): V3 {
  const h = BODY3.hip;
  let q = p;
  if (twist) {
    // Facing +x, turning left (toward −z): the right side (+z) comes forward.
    const a = twist * DEG;
    const dx = q.x - h.x;
    const dz = q.z - h.z;
    q = v3(h.x + dx * Math.cos(a) + dz * Math.sin(a), q.y, h.z - dx * Math.sin(a) + dz * Math.cos(a));
  }
  if (lean) {
    const a = lean * DEG;
    const dx = q.x - h.x;
    const dy = q.y - h.y;
    // Forward (+x) for a point above the hips (dy < 0): x' = x − dy sin a.
    q = v3(h.x + dx * Math.cos(a) - dy * Math.sin(a), h.y + dx * Math.sin(a) + dy * Math.cos(a), q.z);
  }
  return q;
}

/* ── one stroke ── */

/** The stick direction (unit, fulcrum → bead) for a heading and slope. */
export function stickDir(heading: number, elev: number): V3 {
  const h = heading * DEG;
  const e = elev * DEG;
  return v3(Math.cos(e) * Math.cos(h), Math.sin(e), Math.cos(e) * Math.sin(h));
}

/** Two-bone arm in 3-D: the elbow for shoulder S, wrist W, bones a, b, bent
 *  toward the hint point P. The wrist is pulled in to 98.5 % of the reach. */
function solveArm3(S: V3, W: V3, a: number, b: number, P: V3): { e: V3; w: V3; pulled: boolean } {
  let d = sub(W, S);
  let L = len3(d);
  const reach = (a + b) * 0.985;
  let w = W;
  let pulled = false;
  if (L > reach) {
    w = add(S, mul(d, reach / L));
    d = sub(w, S);
    L = reach;
    pulled = true;
  }
  L = Math.max(L, Math.abs(a - b) + 20);
  const ax = unit(d);
  // Along the shoulder–wrist axis to the elbow circle's centre, then out
  // toward the hint, perpendicular to the axis.
  const along = (a * a - b * b + L * L) / (2 * L);
  const r = Math.sqrt(Math.max(0, a * a - along * along));
  const toP = sub(P, S);
  let perp = sub(toP, mul(ax, dot(toP, ax)));
  if (len3(perp) < 1e-6) perp = cross(ax, v3(0, 0, 1));
  const e = add(add(S, mul(ax, along)), mul(unit(perp), r));
  return { e, w, pulled };
}

/** One hand's stroke from its shoulder S (exported for the tuning and the test). */
export function solveStroke(hand: 'R' | 'L', S: V3, sp: StrokeSpec): ArmSolve {
  const u0 = stickDir(sp.heading, sp.elev);
  const bead0 = sp.contact === 'shoulder' ? add(sp.at, mul(u0, STICK.shoulder)) : sp.at;
  const fulcrum0 = sub(bead0, mul(u0, STICK.hold));
  const wrist = sub(fulcrum0, mul(u0, STICK.wrist));
  // A raised stick: the same hand, the stick turned tip-up about the wrist
  // (in the stick's own vertical plane).
  const u = sp.raise ? stickDir(sp.heading, sp.elev - sp.raise) : u0;
  const fulcrum = add(wrist, mul(u, STICK.wrist));
  const bead = add(fulcrum, mul(u, STICK.hold));
  const butt = sub(fulcrum, mul(u, STICK.butt));
  const side = hand === 'R' ? 1 : -1;
  const pole = add(S, sp.pole ?? v3(-60, 300, side * 140));
  const arm = solveArm3(S, wrist, DRUM_ARM.upper, DRUM_ARM.fore, pole);
  return { hand, shoulder: S, elbow: arm.e, wrist: arm.w, fulcrum, bead, butt, u, pulled: arm.pulled, spec: sp };
}

/** A shoulder joint with the body turned and its girdle brought forward
 *  `reach` mm toward the stroke's target, in plan (protraction). */
export function shoulderOf(hand: 'R' | 'L', sp: StrokeSpec, lean = 0, twist = 0, reach = 0): V3 {
  const s = bodyAbout(hand === 'R' ? BODY3.shoulderR : BODY3.shoulderL, lean, twist);
  if (!reach) return s;
  const d = unit(v3(sp.at.x - s.x, 0, sp.at.z - s.z));
  return add(s, mul(d, reach));
}

const poseCache = new Map<string, DrummerPose3>();
/** The drummer's 3-D moment for a spec (cached by its numbers). */
export function drummerPose(spec: DrummerSpec): DrummerPose3 {
  const key = JSON.stringify(spec);
  const hit = poseCache.get(key);
  if (hit) return hit;
  const lean = spec.lean ?? 0;
  const twist = spec.twist ?? 0;
  const head = bodyAbout(BODY3.head, lean, twist);
  const neck = bodyAbout(BODY3.neck, lean, twist);
  const shoulderR = shoulderOf('R', spec.right, lean, twist, spec.reachR);
  const shoulderL = shoulderOf('L', spec.left, lean, twist, spec.reachL);
  const out: DrummerPose3 = { spec, head, neck, shoulderR, shoulderL, R: solveStroke('R', shoulderR, spec.right), L: solveStroke('L', shoulderL, spec.left) };
  poseCache.set(key, out);
  return out;
}

/* ── the measures the standard is written in (the test reads these) ── */

/** Angle between the stick and the struck surface (degrees, ≥ 0). */
export function angleToSurface(a: ArmSolve): number {
  return Math.asin(Math.min(1, Math.abs(dot(a.u, a.spec.surface.n)))) / DEG;
}
/** The fulcrum's height above the struck surface's plane (mm). */
export function fistAbove(a: ArmSolve): number {
  return dot(sub(a.fulcrum, a.spec.surface.c), a.spec.surface.n);
}
/** Elbow interior angle (degrees: 180 = straight). */
export function elbowAngle(a: ArmSolve): number {
  const p = unit(sub(a.shoulder, a.elbow));
  const q = unit(sub(a.wrist, a.elbow));
  return Math.acos(Math.max(-1, Math.min(1, dot(p, q)))) / DEG;
}
/** The wrist's bend: forearm (elbow → wrist) against the stick (degrees). */
export function wristBend(a: ArmSolve): number {
  const f = unit(sub(a.wrist, a.elbow));
  return Math.acos(Math.max(-1, Math.min(1, dot(f, a.u)))) / DEG;
}
/** The forearm's slope from the elbow to the wrist (+ = down, degrees). */
export function forearmSlope(a: ArmSolve): number {
  const f = sub(a.wrist, a.elbow);
  return Math.atan2(f.y, Math.hypot(f.x, f.z)) / DEG;
}

/* ── the two drawings: a pose and the sticks per view ── */

/** The fist's own axis (3-D): between the forearm and the stick — in a
 *  matched grip the stick crosses the palm from the heel of the hand to the
 *  thumb and first finger, so the hand turns only part of the way from the
 *  forearm to the stick. Drawn along this, a fist seen end-on to its stick
 *  (a stick running across the body) still reads as a hand on its forearm;
 *  the stick (through the fulcrum, 70 mm out) stays inside the fist. */
export function handAxis(a: ArmSolve): V3 {
  const f = unit(sub(a.wrist, a.elbow));
  return unit(add(f, a.u));
}

/** A drawn stick in a view: butt, fulcrum (the fist's grip) and bead. */
export type Stick2 = { butt: P2; from: P2; to: P2 };
export type ViewDrummer = { pose: PlayerPose; stick: Stick2; farStick: Stick2 };

/** Project a K point into a view's (u, v) as {x, y}. */
export const proj = (view: 'side' | 'top', p: V3): P2 => (view === 'side' ? { x: p.x, y: p.y } : { x: p.x, y: p.z });

function stick2(view: 'side' | 'top', a: ArmSolve): Stick2 {
  return { butt: proj(view, a.butt), from: proj(view, a.fulcrum), to: proj(view, a.bead) };
}

const viewCache = new WeakMap<DrummerPose3, Partial<Record<'side' | 'top', ViewDrummer>>>();

/** The drummer drawn in a view (PlayerFigure's pose) and its two sticks. */
export function viewDrummer(d: DrummerPose3, view: 'side' | 'top'): ViewDrummer {
  let byView = viewCache.get(d);
  if (!byView) {
    byView = {};
    viewCache.set(d, byView);
  }
  const hit = byView[view];
  if (hit) return hit;
  const t = KIT.throne;
  let pose: PlayerPose;
  if (view === 'side') {
    const P = (p: V3) => pt(p.x, p.y);
    const dirOf = (u: V3) => Math.atan2(u.y, u.x);
    const seatY = yAt(t.seatH);
    const hip = pt(t.c.u + 10 - SEAT_BACK, seatY - 90);
    // The knees stay over the pedals (the thigh 475 mm).
    const kneeR = pt(t.c.u + 430, yAt(520));
    pose = {
      view: 'side',
      posture: 'seated',
      facing: 1,
      head: { c: P(d.head), r: 110 },
      neck: P(d.neck),
      shoulderR: P(d.shoulderR),
      shoulderL: P(d.shoulderL),
      elbowR: P(d.R.elbow),
      elbowL: P(d.L.elbow),
      handR: { wrist: P(d.R.wrist), dir: dirOf(handAxis(d.R)), kind: 'grip' },
      handL: { wrist: P(d.L.wrist), dir: dirOf(handAxis(d.L)), kind: 'grip' },
      hipR: hip,
      hipL: pt(hip.u - 10, hip.v - 4),
      kneeR,
      kneeL: pt(kneeR.u - 40, kneeR.v - 8),
      footR: pt(RIGHT_BALL.x, yAt(0)),
      footL: pt(KIT.hihatPedal.u0 + 100, yAt(0)),
      floor: yAt(0),
    };
  } else {
    // From above the pose is authored chest toward +v round the neck and
    // turned to face +x (`facing` 0, PlayerFigure's aboveTurn): a world point
    // (x, z) is authored at (n.u − (z − n.v), n.v + (x − n.u)).
    const n = pt(d.neck.x, d.neck.z);
    const A = (x: number, z: number): Pt => pt(n.u - (z - n.v), n.v + (x - n.u));
    const P = (p: V3) => A(p.x, p.z);
    const dirOf = (u: V3) => Math.atan2(u.x, -u.z);
    // The legs stay where the kit scene put them (world plan points round
    // the kit scene's neck, before the seat moved back); the hips sit back.
    const n0 = { u: KIT_NECK0.x, v: KIT_NECK0.z };
    const W = (right: number, fwd: number) => A(n0.u + fwd, n0.v + right);
    pose = {
      view: 'above',
      posture: 'seated',
      facing: 0,
      head: { c: P(d.head), r: 110 },
      neck: n,
      shoulderR: P(d.shoulderR),
      shoulderL: P(d.shoulderL),
      elbowR: P(d.R.elbow),
      elbowL: P(d.L.elbow),
      handR: { wrist: P(d.R.wrist), dir: dirOf(handAxis(d.R)), kind: 'grip' },
      handL: { wrist: P(d.L.wrist), dir: dirOf(handAxis(d.L)), kind: 'grip' },
      hipR: W(106, -40 - SEAT_BACK),
      hipL: W(-106, -40 - SEAT_BACK),
      kneeR: W(190, 400),
      kneeL: W(-190, 400),
      footR: A(RIGHT_BALL.x, RIGHT_BALL.z),
      footL: W(-190, 470),
      floor: null,
    };
  }
  const out: ViewDrummer = { pose, stick: stick2(view, d.R), farStick: stick2(view, d.L) };
  byView[view] = out;
  return out;
}

/* ── the strokes the lessons draw ── */

const DRUM = (c: V3, tiltDeg: number, R: number): Surface => {
  const t = tiltDeg * DEG;
  return { c, n: v3(-Math.sin(t), -Math.cos(t), 0), R, kind: 'drum' };
};

const SN = KIT_DRUMS.snare;
/** The snare's batter head (a bead's centre sits 5 mm over it). */
export const SNARE_HEAD = DRUM(S0, 0, SN.spec.d.mm / 2);
