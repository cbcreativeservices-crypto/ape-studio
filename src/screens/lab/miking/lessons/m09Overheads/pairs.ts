/**
 * M09 — the stereo pairs as geometry (overheads/GEOMETRY_PROPOSAL.md §2):
 * X/Y, ORTF, a spaced pair, the floor-tom method, the shoulder method and
 * Mid-Side, each as two capsules (point, aim, pattern) in the kit frame K.
 * Pure; tested (ORTF 170 mm / 110°, X/Y 90°–135°, the distances to the
 * snare and the kick).
 */
import type { MicPose, PatternId, Vec3 } from '../../engine/model/types.ts';
import { aimVec } from '../../engine/geometry/vec.ts';
import { DRUMMER, O, S0, distMm } from '../shared/kitScene/kitSceneModel.ts';
import { AB_HAT, AB_RIDE, GJ_MAIN, GJ_SIDE, OH, RM_A, RM_B, aimToward } from './model.ts';

export type PairId = 'xy' | 'ortf' | 'spaced' | 'floortom' | 'shoulder' | 'ms';
export type Capsule = { pose: MicPose; pattern: PatternId };
export type Pair = { id: PairId; a: Capsule; b: Capsule };

const DEG = Math.PI / 180;

/**
 * The X/Y and ORTF pairs' centre: over the snare at the floor-tom method's
 * main height (1 m above the snare's centre). The proposal's drawing default
 * — the mono height, 1.6 m off the floor — puts the pair a few millimetres
 * inside the drawing's sticks' reach; the lab draws it at the other height
 * from the same file (logged for the owner).
 */
export const PAIR_C: Vec3 = { ...GJ_MAIN };

/** A pose aimed `tilt` degrees from straight down, toward −z (s = −1) or +z (s = +1). */
function downTilted(p: Vec3, tiltDeg: number, s: 1 | -1): MicPose {
  // aimVec = (−cos az cos el, −sin el, sin az cos el): straight down is el −90;
  // tilting toward ±z keeps az at ±90 and raises el.
  return { p, az: s * 90, el: -(90 - tiltDeg) };
}

/** The pair for a technique; `xyAngle` is the X/Y included angle (90–135°). */
export function pairOf(id: PairId, xyAngle: number = OH.xyAngle): Pair {
  const card = 'cardioid' as const;
  switch (id) {
    case 'xy': {
      const half = Math.max(OH.xyAngle, Math.min(OH.xyAngleMax, xyAngle)) / 2;
      // Coincident, not touching: the fronts 5 mm apart across the kit.
      return { id, a: { pose: downTilted({ ...PAIR_C, z: PAIR_C.z + 2.5 }, half, -1), pattern: card }, b: { pose: downTilted({ ...PAIR_C, z: PAIR_C.z - 2.5 }, half, 1), pattern: card } };
    }
    case 'ortf': {
      const half = OH.ortfAngle / 2;
      const d = OH.ortfSpacing / 2;
      return { id, a: { pose: downTilted({ ...PAIR_C, z: PAIR_C.z - d }, half, -1), pattern: card }, b: { pose: downTilted({ ...PAIR_C, z: PAIR_C.z + d }, half, 1), pattern: card } };
    }
    case 'spaced':
      return { id, a: { pose: { p: AB_HAT, az: 0, el: -90 }, pattern: 'omni' }, b: { pose: { p: AB_RIDE, az: 0, el: -90 }, pattern: 'omni' } };
    case 'floortom': {
      const am = aimToward(GJ_MAIN, S0);
      const as = aimToward(GJ_SIDE, S0);
      return { id, a: { pose: { p: GJ_MAIN, ...am }, pattern: card }, b: { pose: { p: GJ_SIDE, ...as }, pattern: card } };
    }
    case 'shoulder': {
      const ab = aimToward(RM_B, S0);
      return { id, a: { pose: { p: RM_A, az: 0, el: -90 }, pattern: card }, b: { pose: { p: RM_B, ...ab }, pattern: card } };
    }
    case 'ms':
      // Mid down at the kit; Side a figure-8 across it (its axis along ±z).
      return { id, a: { pose: { p: PAIR_C, az: 0, el: -90 }, pattern: card }, b: { pose: { p: { ...PAIR_C, y: PAIR_C.y - 30 }, az: 90, el: 0 }, pattern: 'figure8' } };
  }
}

/** The angle between the two capsules' front axes (deg). */
export function includedAngle(pr: Pair): number {
  const a = aimVec(pr.a.pose.az, pr.a.pose.el);
  const b = aimVec(pr.b.pose.az, pr.b.pose.el);
  const c = a.x * b.x + a.y * b.y + a.z * b.z;
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
}

/** The distance between the two capsules' fronts (mm). */
export const spacing = (pr: Pair): number => distMm(pr.a.pose.p, pr.b.pose.p);

/** B's distance to a source minus A's (mm): > 0 means B hears it later. */
export const pathDiff = (pr: Pair, src: Vec3): number => distMm(pr.b.pose.p, src) - distMm(pr.a.pose.p, src);

/** Distances from each capsule to the snare's centre and to the kick's batter centre. */
export function snareKick(pr: Pair): { snareA: number; snareB: number; kickA: number; kickB: number } {
  return { snareA: distMm(pr.a.pose.p, S0), snareB: distMm(pr.b.pose.p, S0), kickA: distMm(pr.a.pose.p, O), kickB: distMm(pr.b.pose.p, O) };
}

/** How far each capsule is from the drawing's right shoulder, and whether
 *  it sits inside the sticks' reach (a drawing default). */
export function shoulderClearance(pr: Pair): { a: number; b: number; inReach: boolean } {
  const a = distMm(pr.a.pose.p, DRUMMER.shoulderR);
  const b = distMm(pr.b.pose.p, DRUMMER.shoulderR);
  return { a, b, inReach: a < DRUMMER.reach || b < DRUMMER.reach };
}

export const PAIR_IDS: readonly PairId[] = ['xy', 'ortf', 'spaced', 'floortom', 'shoulder', 'ms'];
