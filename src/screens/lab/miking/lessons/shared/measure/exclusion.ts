/**
 * THE EXCLUSION ZONE round a running device (F15; shared with F16 and any
 * lesson with a guarded machine — BATCH6_RESEARCH_SUMMARY_PART2.md §3.8).
 * Built by Lab 6 group 5 (branch lab6-g5). Pure; tested.
 *
 * Two keep-outs, both HARD (a mic, its stand and your hands never enter):
 *
 *   zone      a ring round the device: the guard's own reach plus a margin
 *             (drawing default 0.3 m beyond the guard — machinery_sound/
 *             GEOMETRY_PROPOSAL.md §2). The source text: keep hair,
 *             clothing, cables, stands and people clear of intakes, blades,
 *             pinch points; never reach through a guard (F15 L24, L47).
 *   airflow   the exhaust stream ahead of the device: a cone from the guard's
 *             face along the airflow (drawing default: 15° each side of the
 *             axis — a 30° cone — and 2 m long). Not a body hazard for a
 *             desk fan; a capsule in a moving airstream reads WIND, not the
 *             device (F15 L24: "moving airflow where wind turbulence can
 *             dominate").
 *
 * The engine stops a mic at both (`exclusionSolids`); the pages explain which
 * one stopped it (`exclusionHit`). Every number is a drawing default; the
 * device's own instructions and the site set the real ones.
 */
import type { Shape3, Vec3 } from '../../../engine/model/types.ts';

export type Exclusion = {
  /** The device's centre (its hub) and the guard's radius about it (mm). */
  hub: Vec3;
  guardR: number;
  /** How far the guard reaches behind the hub (the motor housing, mm). */
  back: number;
  /** How far the guard's face stands ahead of the hub (mm). */
  front: number;
  /** The margin beyond the guard (mm). */
  margin: number;
  /** The airflow's direction (unit vector), its half-angle (deg) and length (mm). */
  flow: Vec3;
  flowHalfDeg: number;
  flowLen: number;
  /** The surface the device stands on (y, y-down) — the zone runs from it up. */
  standY: number;
};

const DEG = Math.PI / 180;
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const add = (a: Vec3, b: Vec3, k = 1): Vec3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });

/** The zone's radius in plan about the hub: the guard's farthest reach plus the margin. */
export function zoneRadius(e: Exclusion): number {
  return Math.max(e.guardR, e.back, e.front) + e.margin;
}

/** Where the airflow cone starts: on the guard's face. */
export function flowStart(e: Exclusion): Vec3 {
  return add(e.hub, e.flow, e.front);
}

/** The cone's radius at a distance `t` (mm) along the flow from the guard's face. */
export function flowRadius(e: Exclusion, t: number): number {
  return e.guardR + Math.max(0, t) * Math.tan(e.flowHalfDeg * DEG);
}

/** Which keep-out a point is in: the zone, the airflow, or neither. */
export function exclusionHit(e: Exclusion, p: Vec3): 'zone' | 'airflow' | null {
  const R = zoneRadius(e);
  const plan = Math.hypot(p.x - e.hub.x, p.z - e.hub.z);
  const top = e.hub.y - R;
  if (plan <= R && p.y >= top && p.y <= e.standY) return 'zone';
  const s = flowStart(e);
  const d = sub(p, s);
  const t = dot(d, e.flow);
  if (t >= 0 && t <= e.flowLen) {
    const radial = Math.hypot(d.x - e.flow.x * t, d.y - e.flow.y * t, d.z - e.flow.z * t);
    if (radial <= flowRadius(e, t)) return 'airflow';
  }
  return null;
}

/** The two keep-outs as engine solids (the engine stops a mic and its stand at them). */
export function exclusionSolids(e: Exclusion): { zone: Shape3; airflow: Shape3 } {
  const R = zoneRadius(e);
  const s = flowStart(e);
  return {
    zone: { kind: 'cyl', a: { x: e.hub.x, y: e.standY, z: e.hub.z }, b: { x: e.hub.x, y: e.hub.y - R, z: e.hub.z }, r: R },
    airflow: { kind: 'frustum', a: s, b: add(s, e.flow, e.flowLen), ra: e.guardR, rb: flowRadius(e, e.flowLen) },
  };
}
