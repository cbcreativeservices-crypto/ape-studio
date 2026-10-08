/**
 * THE FOLEY PERFORMER (frame F) — the shared player figure (players/
 * PlayerFigure, the head drawn as part of the body) posed for Foley: walking
 * in a pit, holding or wearing a garment, handling a prop. Pure (no React):
 * the tests reach it. Built once by group 1 (lab6-g1); research:
 * foley_footsteps/GEOMETRY_PROPOSAL.md §3.
 *
 * A pose is authored ONCE in 3-D (frame F: +x the performer's front, +y
 * down, +z the performer's right) and projected to the engine's two views —
 * side (u = x, v = y; in profile, facing +x, the near side the performer's
 * right) and top (u = x, v = z; from above) — so the figure, the hands and
 * the keep-outs agree in both. Every joint is a DRAWING DEFAULT (no source
 * gives a Foley artist's geometry; adult proportions from players/BODY).
 *
 * KEEP-OUTS (the safety model, F01 L69 exact: "Mark the complete foot, arm
 * and body envelope, including a sudden pivot or missed step … keep stands,
 * mic housings and cables out of the landing and exit paths"):
 *   motion envelope  the footfall area plus the body's sweep — a box over the
 *                    pit and beyond its edges on the walking sides (450 mm,
 *                    a drawing default), 2000 mm high;
 *   exit path        a 600 mm strip from the active area to the stage door
 *                    (the performer's left), the full body's height;
 *   gesture arc      (F02) the hands' and the garment's sweep from the
 *                    shoulders, arm reach 750 mm (a drawing default);
 *   body column      the standing performer, head to floor.
 */
import type { Dim, Envelope, Provenance, Vec3 } from '../../../engine/model/types.ts';
import type { HandKind, PlayerPose } from '../players/playerPose.ts';
import { poseHit, pt } from '../players/playerPose.ts';
import { v3 } from './frameF.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const dd = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

export const PERFORMER_DIMS = {
  /** Beyond the pit's edges on the walking sides (z). */
  sweep: dd(450, 'the walker’s arm and body sweep beyond the pit on the walking sides (450 mm drawn; no source gives a clearance)'),
  /** The motion envelope's height (the body column). */
  height: dd(2000, 'the motion envelope’s height (a 2000 mm body column drawn)'),
  /** The exit path's width. */
  exit: dd(600, 'the exit path’s width (600 mm drawn)'),
  /** An adult's arm reach from the shoulder (F02's gesture arc). */
  reach: dd(750, 'an adult’s arm reach from the shoulder (750 mm drawn)'),
} as const;

/** One body in 3-D (frame F). Hands: their kind and, optionally, the
 *  direction they point (3-D); default: on along the forearm. */
export type Body3 = {
  head: Vec3;
  neck: Vec3;
  shR: Vec3;
  shL: Vec3;
  elR: Vec3;
  elL: Vec3;
  wrR: Vec3;
  wrL: Vec3;
  hipR: Vec3;
  hipL: Vec3;
  knR: Vec3;
  knL: Vec3;
  ftR: Vec3;
  ftL: Vec3;
  kindR: HandKind;
  kindL: HandKind;
  /** The floor's y under the body. */
  floorY: number;
  headR?: number;
};

const HEAD_R = 114;

/** In profile, facing +x: u = x, v = y; the near side is the right (+z). */
export function sidePose(b: Body3): PlayerPose {
  const dirOf = (e: Vec3, w: Vec3) => Math.atan2(w.y - e.y, w.x - e.x);
  return {
    view: 'side',
    posture: 'standing',
    facing: 1,
    head: { c: pt(b.head.x, b.head.y), r: b.headR ?? HEAD_R },
    neck: pt(b.neck.x, b.neck.y),
    shoulderR: pt(b.shR.x, b.shR.y),
    shoulderL: pt(b.shL.x, b.shL.y),
    elbowR: pt(b.elR.x, b.elR.y),
    elbowL: pt(b.elL.x, b.elL.y),
    handR: { wrist: pt(b.wrR.x, b.wrR.y), dir: dirOf(b.elR, b.wrR), kind: b.kindR },
    handL: { wrist: pt(b.wrL.x, b.wrL.y), dir: dirOf(b.elL, b.wrL), kind: b.kindL },
    hipR: pt(b.hipR.x, b.hipR.y),
    hipL: pt(b.hipL.x, b.hipL.y),
    kneeR: pt(b.knR.x, b.knR.y),
    kneeL: pt(b.knL.x, b.knL.y),
    footR: pt(b.ftR.x, b.ftR.y),
    footL: pt(b.ftL.x, b.ftL.y),
    floor: b.floorY,
  };
}

/**
 * From above: u = x, v = z. The shared figure authors a plan with the chest
 * toward +v round the neck and turns it by `facing`; facing 0 sends local
 * (right, fwd) to world (fwd, right) from the neck — so a joint at world
 * (x, z) is authored at local (N.u − (z − N.v), N.v + (x − N.u)), and the
 * performer's right lands at +z, as in frame F.
 */
export function topPose(b: Body3): PlayerPose {
  const N = pt(b.neck.x, b.neck.z);
  const L = (p: Vec3) => pt(N.u - (p.z - N.v), N.v + (p.x - N.u));
  const dirOf = (e: Vec3, w: Vec3) => Math.atan2(w.x - e.x, -(w.z - e.z));
  return {
    view: 'above',
    posture: 'standing',
    facing: 0,
    head: { c: L(b.head), r: b.headR ?? HEAD_R },
    neck: N,
    shoulderR: L(b.shR),
    shoulderL: L(b.shL),
    elbowR: L(b.elR),
    elbowL: L(b.elL),
    handR: { wrist: L(b.wrR), dir: dirOf(b.elR, b.wrR), kind: b.kindR === 'rest' ? 'rest' : 'above' },
    handL: { wrist: L(b.wrL), dir: dirOf(b.elL, b.wrL), kind: b.kindL === 'rest' ? 'rest' : 'above' },
    hipR: L(b.hipR),
    hipL: L(b.hipL),
    kneeR: L(b.knR),
    kneeL: L(b.knL),
    footR: L(b.ftR),
    footL: L(b.ftL),
    floor: null,
  };
}

/**
 * A STANDING body round a neck point (frame F), arms and legs given as
 * offsets: the shared adult proportions. `floorY` is the floor under it.
 */
export function standing(o: {
  floorY: number;
  /** The neck's x and z (its height follows from the floor: 1440 mm). */
  x: number;
  z?: number;
  wrR: Vec3;
  wrL: Vec3;
  elR?: Vec3;
  elL?: Vec3;
  kindR?: HandKind;
  kindL?: HandKind;
  /** The feet: forward (x) offsets of the right and left foot, and their lift. */
  stepR?: number;
  stepL?: number;
  liftL?: number;
  liftR?: number;
  /** A forward bend at the hips, degrees (the upper body — neck, shoulders,
   *  head — turns forward about the hips; figure review 2026-10-08: a hand
   *  that works low in front of the body reaches by bending, never by a
   *  stretched arm). Default 0 (upright). */
  lean?: number;
}): Body3 {
  const f = o.floorY;
  const x = o.x;
  const z = o.z ?? 0;
  const h = (mm: number) => f - mm;
  const sR = o.stepR ?? 20;
  const sL = o.stepL ?? 0;
  const ftR = v3(x + sR, h(o.liftR ?? 0), z + 100);
  const ftL = v3(x + sL, h(o.liftL ?? 0), z - 100);
  const hipR = v3(x - 10, h(910), z + 104);
  const hipL = v3(x - 24, h(916), z - 104);
  // The upper body, turned forward about the hips by `lean`.
  const pivot = v3(x - 17, h(913), z);
  const th = ((o.lean ?? 0) * Math.PI) / 180;
  const bend = (p: Vec3): Vec3 => {
    const dx = p.x - pivot.x;
    const dy = p.y - pivot.y;
    return v3(pivot.x + dx * Math.cos(th) - dy * Math.sin(th), pivot.y + dx * Math.sin(th) + dy * Math.cos(th), p.z);
  };
  const neck = bend(v3(x, h(1440), z));
  const shR = bend(v3(x - 4, h(1382), z + 176));
  const shL = bend(v3(x - 18, h(1392), z - 176));
  const knee = (hip: Vec3, ft: Vec3, bendK: number) => v3((hip.x + ft.x) / 2 + bendK, (hip.y + ft.y) / 2, (hip.z + ft.z) / 2);
  const mid = (a: Vec3, b: Vec3, out: number, drop: number) => v3((a.x + b.x) / 2 + out, (a.y + b.y) / 2 + drop, (a.z + b.z) / 2);
  // Each arm is a true two-bone chain from its OWN shoulder (figure review
  // 2026-10-08): the upper arm and the forearm keep their adult lengths, the
  // elbow bends toward the authored elbow (only a hint), and a hand never
  // reaches past the arm's length.
  const armR = armChain(shR, o.wrR, o.elR ?? mid(shR, o.wrR, -40, 40));
  const armL = armChain(shL, o.wrL, o.elL ?? mid(shL, o.wrL, -40, 40));
  return {
    // The head stays nearly upright over the collar (it looks down a little
    // as the body bends; a head turned with the whole torso juts forward).
    head: (() => {
      const t = th * 0.6;
      return v3(neck.x + 16 * Math.cos(t) + 158 * Math.sin(t), neck.y + 16 * Math.sin(t) - 158 * Math.cos(t), z);
    })(),
    neck,
    shR,
    shL,
    elR: armR.el,
    elL: armL.el,
    wrR: armR.wr,
    wrL: armL.wr,
    hipR,
    hipL,
    knR: knee(hipR, ftR, sR > 60 ? 20 : sR < -60 ? -30 : 12),
    knL: knee(hipL, ftL, sL > 60 ? 20 : sL < -60 ? -30 : 12),
    ftR,
    ftL,
    kindR: o.kindR ?? 'rest',
    kindL: o.kindL ?? 'rest',
    floorY: f,
  };
}

/** The adult arm (mm; a 1.71 m figure): upper arm ≈ 0.19 × height, forearm
 *  (elbow to wrist) ≈ 0.155 × height — drawing defaults. */
export const ARM = { upper: 325, fore: 265 } as const;

/**
 * A two-bone arm from a shoulder toward a wrist target: the wrist held within
 * the arm's reach (98.5 % of full length, never locked straight), the elbow
 * where both bones keep their lengths, bent toward `hint`.
 */
export function armChain(sh: Vec3, wrist: Vec3, hint: Vec3): { el: Vec3; wr: Vec3 } {
  const U = ARM.upper;
  const F = ARM.fore;
  let d = v3(wrist.x - sh.x, wrist.y - sh.y, wrist.z - sh.z);
  let L = Math.hypot(d.x, d.y, d.z);
  const max = (U + F) * 0.985;
  const min = Math.abs(U - F) + 40;
  if (L < 1e-6) {
    d = v3(0, 1, 0);
    L = 1;
  }
  const n = v3(d.x / L, d.y / L, d.z / L);
  const Lc = Math.max(min, Math.min(max, L));
  const wr = v3(sh.x + n.x * Lc, sh.y + n.y * Lc, sh.z + n.z * Lc);
  // The elbow: `a` along the shoulder→wrist line, `r` off it toward the hint.
  const a = (U * U - F * F + Lc * Lc) / (2 * Lc);
  const r = Math.sqrt(Math.max(0, U * U - a * a));
  let pv = v3(hint.x - sh.x, hint.y - sh.y, hint.z - sh.z);
  const along = pv.x * n.x + pv.y * n.y + pv.z * n.z;
  pv = v3(pv.x - n.x * along, pv.y - n.y * along, pv.z - n.z * along);
  // An elbow flexes one way: a hand below the shoulder never has its elbow
  // pointing FORWARD (+x) of the shoulder–wrist line. A hint ahead of the
  // line is turned back (figure review 2026-10-08: the walker's far elbow
  // jutted out in front of the chest). Raised arms keep their hint.
  if (pv.x > 0 && n.y > 0.3) {
    pv = v3(-pv.x, pv.y, pv.z);
    const again = pv.x * n.x + pv.y * n.y + pv.z * n.z;
    pv = v3(pv.x - n.x * again, pv.y - n.y * again, pv.z - n.z * again);
  }
  let pl = Math.hypot(pv.x, pv.y, pv.z);
  if (pl < 1e-6) {
    // No usable hint: bend back and down (behind the arm's line).
    const back = v3(-1, 0.4, 0);
    const b2 = back.x * n.x + back.y * n.y + back.z * n.z;
    pv = v3(back.x - n.x * b2, back.y - n.y * b2, back.z - n.z * b2);
    pl = Math.hypot(pv.x, pv.y, pv.z) || 1;
  }
  const el = v3(sh.x + n.x * a + (pv.x / pl) * r, sh.y + n.y * a + (pv.y / pl) * r, sh.z + n.z * a + (pv.z / pl) * r);
  return { el, wr };
}

/** The motion envelope over a pit (F01): the footfall area and the body's
 *  sweep beyond its edges on the walking sides. */
export function motionEnvelope(o: { hx: number; hz: number; floorY: number; variants?: string[] }): Envelope {
  const s = PERFORMER_DIMS.sweep.mm;
  return {
    id: 'env.motion',
    label: 'the performer’s whole movement',
    shape: { kind: 'box', min: v3(-o.hx, o.floorY - PERFORMER_DIMS.height.mm, -o.hz - s), max: v3(o.hx, o.floorY, o.hz + s) },
    prov: ill('the footfall area (the pit) and the body’s sweep beyond it on the walking sides — 450 mm and a 2 m column, drawing defaults (no source gives a clearance, F01 L126)'),
    ...(o.variants ? { variants: o.variants } : {}),
  };
}

/** The exit path: a strip from the active area to the stage door (−z). */
export function exitPath(o: { from: number; to: number; floorY: number; x?: number; variants?: string[] }): Envelope {
  const w = PERFORMER_DIMS.exit.mm / 2;
  const x = o.x ?? 0;
  return {
    id: 'env.exit',
    label: 'the exit path',
    shape: { kind: 'box', min: v3(x - w, o.floorY - PERFORMER_DIMS.height.mm, -o.to), max: v3(x + w, o.floorY, -o.from) },
    prov: ill('a 600 mm path from the active area to the stage door, the performer’s left (drawing default; F01 L69 "keep stands … out of the landing and exit paths")'),
    ...(o.variants ? { variants: o.variants } : {}),
  };
}

/** The standing body as a keep-out: a column from the floor to above the head. */
export function bodyColumn(o: { x: number; z?: number; floorY: number; r?: number; variants?: string[] }): Envelope {
  const z = o.z ?? 0;
  return {
    id: 'env.body',
    label: 'the performer',
    shape: { kind: 'capsule', a: v3(o.x, o.floorY - 1780, z), b: v3(o.x, o.floorY - 120, z), r: o.r ?? 230 },
    prov: ill('the standing performer, head to floor (the shared adult figure; drawing default)'),
    ...(o.variants ? { variants: o.variants } : {}),
  };
}

/**
 * Whether the drawn figure covers (u, v) in a view (for the hit tests and the
 * label manners). A plan pose is AUTHORED chest toward +v round the neck and
 * turned at draw time (PlayerFigure aboveTurn, facing 0 = a quarter turn), so
 * a plan point is turned back into the authored frame before the pose's
 * capsules test it: local = (N.u − (v − N.v), N.v + (u − N.u)).
 */
export function poseCovers(pose: PlayerPose, u: number, v: number, tol = 0): boolean {
  if (pose.view !== 'above') return poseHit(pose, u, v, tol);
  const N = pose.neck;
  return poseHit(pose, N.u - (v - N.v), N.v + (u - N.u), tol);
}
