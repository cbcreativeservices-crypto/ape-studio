/**
 * IDEAL FIRST-ORDER POLAR PATTERNS (blueprint §6.1; docs/labs/miking/
 * SOURCES_SHARED.md §3). Pure; worklets.
 *
 *   g(θ) = A + B·cos θ,  A + B = 1,  θ = 3-D angle between the mic's front
 *   axis and the arrival direction.
 *   REE = A² + B²/3,  DI = −10·log10(REE).
 *
 * The SUPERCARDIOID is the exact maximum front-to-back member, A = (√3 − 1)/2
 * (null 125.26°). Published figures differ (Shure 120° / 126°, Wikipedia
 * 126.9° for a 5:3 mix) — logged as D-SC; the lab labels this shape IDEAL.
 *
 * 'unstated' and 'halfCardioid' (a boundary plate) have NO free-field lobe:
 * the scene draws none and the gain functions answer 1 with `modelled: false`.
 */
import type { MicPattern, MicPose, PatternId, Vec3 } from '../model/types.ts';
import { DEG, aimVec, angleBetween, sub } from '../geometry/vec.ts';

const SQRT3 = Math.sqrt(3);

export const PATTERN_COEFFS: Record<PatternId, { a: number; b: number }> = {
  omni: { a: 1, b: 0 },
  cardioid: { a: 0.5, b: 0.5 },
  supercardioid: { a: (SQRT3 - 1) / 2, b: (3 - SQRT3) / 2 },
  hypercardioid: { a: 0.25, b: 0.75 },
  figure8: { a: 0, b: 1 },
};

export const PATTERN_LABELS: Record<MicPattern, string> = {
  omni: 'omnidirectional',
  cardioid: 'cardioid',
  supercardioid: 'supercardioid',
  hypercardioid: 'hypercardioid',
  figure8: 'figure-8',
  unstated: 'pattern not drawn',
  halfCardioid: 'half-cardioid (boundary)',
};

export function isModelled(p: MicPattern): p is PatternId {
  'worklet';
  return p === 'omni' || p === 'cardioid' || p === 'supercardioid' || p === 'hypercardioid' || p === 'figure8';
}

function coeffs(p: PatternId): { a: number; b: number } {
  'worklet';
  const S3 = Math.sqrt(3);
  switch (p) {
    case 'omni':
      return { a: 1, b: 0 };
    case 'cardioid':
      return { a: 0.5, b: 0.5 };
    case 'supercardioid':
      return { a: (S3 - 1) / 2, b: (3 - S3) / 2 };
    case 'hypercardioid':
      return { a: 0.25, b: 0.75 };
    case 'figure8':
      return { a: 0, b: 1 };
  }
}

/** Signed relative pickup at θ degrees (negative = inverted lobe). */
export function gain(p: PatternId, thetaDeg: number): number {
  'worklet';
  const c = coeffs(p);
  return c.a + c.b * Math.cos(thetaDeg * DEG);
}

/** |g| in dB, floored at −60 dB for display. */
export function gainDb(p: PatternId, thetaDeg: number): number {
  'worklet';
  const g = Math.abs(gain(p, thetaDeg));
  return g < 1e-3 ? -60 : Math.max(-60, 20 * Math.log10(g));
}

/** Null angles in 0..180 (none for omni). */
export function nullAngles(p: PatternId): number[] {
  const c = PATTERN_COEFFS[p];
  if (c.b === 0) return [];
  const x = -c.a / c.b;
  if (x < -1 || x > 1) return [];
  return [Math.acos(x) / DEG];
}

export function ree(p: PatternId): number {
  const c = PATTERN_COEFFS[p];
  return c.a * c.a + (c.b * c.b) / 3;
}

export function di(p: PatternId): number {
  return -10 * Math.log10(ree(p));
}

/** Angle between the mic's front axis and the direction to `point` (deg). */
export function arrivalAngle(pose: MicPose, point: Vec3): number {
  'worklet';
  return angleBetween(aimVec(pose.az, pose.el), sub(point, pose.p));
}

/** Relative pickup of a point source at `point` by an ideal pattern (dB). */
export function rejectionAt(p: PatternId, pose: MicPose, point: Vec3): number {
  'worklet';
  return gainDb(p, arrivalAngle(pose, point));
}

/** Is θ within ±tol degrees of one of the pattern's nulls? */
export function nearNull(p: PatternId, thetaDeg: number, tolDeg: number): boolean {
  const ns = nullAngles(p);
  for (const n of ns) if (Math.abs(thetaDeg - n) <= tolDeg) return true;
  return false;
}
