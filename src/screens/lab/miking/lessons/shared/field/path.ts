/**
 * THE MOVING-SOURCE PATH TOOL (Lab 6 group 2; field_moving_passby/
 * GEOMETRY_PROPOSAL.md §2): a source the learner SCRUBS along a drawn path
 * with a finger — no loop, no autoplay (D8), FULLY SILENT — and what each
 * microphone sees of it at every point. Pure; tested
 * (test/mikingLab6Field.test.ts). Used in frame G (F07, F08) and on the
 * Foley stage in frame F (F05); any frame works (millimetres, the engine's
 * aim convention).
 *
 * At a path position s ∈ [0, 1] (by length along the polyline), per mic:
 *   • distance r(s) and arrival angle θ(s) off the mic's front axis
 *     (polar.arrivalAngle) — a TRACKED mic's aim follows the source, θ = 0;
 *   • the relative level against the path's closest point,
 *     −20·log10(r / r_min): inverse square, free field, ideal;
 *   • the pattern's gain at θ (polar.gainDb);
 *   • the IDEAL DOPPLER factor for a steady tone and a source moving at
 *     `speedMs` past a still mic: c / (c − v·cos φ), φ the angle between the
 *     source's velocity and the line from the source to the mic (OSX-DOPPLER
 *     eq. 17.18 for the radial component; DERIVED), and its cents; c is the
 *     calculator's speed of sound at 20 °C (twoMic.C20).
 *   • for two separate mics, Δt between them (twoMic.deltaTms).
 * Walking 1.4 m/s (a drawing default) gives about +7.1 / −7.0 cents; the
 * strips are drawn from this model and labelled "a simplified picture".
 */
import type { MicPose, PatternId, Vec3 } from '../../../engine/model/types.ts';
import { arrivalAngle, gainDb } from '../../../engine/physics/polar.ts';
import { C20, deltaTms } from '../../../engine/physics/twoMic.ts';

/** A path: a polyline (no loop), the source's speed (m/s, a drawing
 *  default), and the half-width of its keep-out envelope (mm: the subject's
 *  width plus deviation and stopping room — nothing goes inside). */
export type PathDef = { points: readonly Vec3[]; speedMs: number; envelopeHalfWidth: number };

/** Walking pace (m/s): a DRAWING DEFAULT (no source gives one; O-10). */
export const WALK_SPEED_MS = 1.4;
/** A vehicle on a closed, permitted route (m/s, ≈ 72 km/h): a DRAWING
 *  DEFAULT for the paper plan only (O-10) — never a pass the learner makes. */
export const VEHICLE_SPEED_MS = 20;

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/** The path's total length (mm). */
export function pathLength(path: PathDef): number {
  let L = 0;
  for (let i = 1; i < path.points.length; i++) L += len(sub(path.points[i], path.points[i - 1]));
  return L;
}

/** The segment holding s (by length) and the fraction along it. */
function locate(path: PathDef, s: number): { i: number; t: number } {
  const pts = path.points;
  if (pts.length < 2) return { i: 0, t: 0 };
  const target = clamp01(s) * pathLength(path);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = len(sub(pts[i], pts[i - 1]));
    if (acc + seg >= target || i === pts.length - 1) return { i: i - 1, t: seg > 0 ? clamp01((target - acc) / seg) : 0 };
    acc += seg;
  }
  return { i: pts.length - 2, t: 1 };
}

/** The source's position at s. */
export function pointAt(path: PathDef, s: number): Vec3 {
  const pts = path.points;
  if (pts.length === 1) return pts[0];
  const { i, t } = locate(path, s);
  return lerp(pts[i], pts[i + 1], t);
}

/** The unit direction the source travels at s. */
export function tangentAt(path: PathDef, s: number): Vec3 {
  const pts = path.points;
  if (pts.length < 2) return { x: 0, y: 0, z: 0 };
  const { i } = locate(path, s);
  const d = sub(pts[i + 1], pts[i]);
  const l = len(d) || 1;
  return { x: d.x / l, y: d.y / l, z: d.z / l };
}

/** The point of a segment nearest p, and its fraction. */
function nearestOnSegment(a: Vec3, b: Vec3, p: Vec3, plan: boolean): { q: Vec3; t: number } {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const dd = plan ? ab.x * ab.x + ab.z * ab.z : ab.x * ab.x + ab.y * ab.y + ab.z * ab.z;
  const t = dd > 0 ? clamp01((plan ? ap.x * ab.x + ap.z * ab.z : ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / dd) : 0;
  return { q: lerp(a, b, t), t };
}

/** The path's closest approach to p: the distance (3-D), where (s) and the point. */
export function closestApproach(path: PathDef, p: Vec3): { d: number; s: number; q: Vec3 } {
  const pts = path.points;
  if (pts.length < 2) return { d: len(sub(pts[0], p)), s: 0, q: pts[0] };
  const L = pathLength(path) || 1;
  let best = { d: Infinity, s: 0, q: pts[0] };
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = len(sub(pts[i], pts[i - 1]));
    const { q, t } = nearestOnSegment(pts[i - 1], pts[i], p, false);
    const d = len(sub(q, p));
    if (d < best.d) best = { d, s: (acc + t * seg) / L, q };
    acc += seg;
  }
  return best;
}

/** Plan distance (mm) from p to the path's line (the envelope test). */
export function planDistanceToPath(path: PathDef, p: Vec3): number {
  const pts = path.points;
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const { q } = nearestOnSegment(pts[i - 1], pts[i], p, true);
    best = Math.min(best, Math.hypot(q.x - p.x, q.z - p.z));
  }
  return pts.length === 1 ? Math.hypot(pts[0].x - p.x, pts[0].z - p.z) : best;
}

/** Is p inside the path's keep-out envelope (in plan)? */
export function insideEnvelope(path: PathDef, p: Vec3): boolean {
  return planDistanceToPath(path, p) < path.envelopeHalfWidth;
}

/** The ideal Doppler factor for a source moving at v (m/s) with the
 *  component cos φ toward a still listener: c / (c − v·cos φ). */
export function dopplerFactor(vMs: number, cosPhi: number, c: number = C20): number {
  return c / (c - vMs * cosPhi);
}

/** A frequency ratio in cents (1200 per octave). */
export function centsOf(ratio: number): number {
  return 1200 * Math.log2(ratio);
}

/** A mic for the path tool: its pose, its pattern, and whether an operator
 *  swings it to follow the source (a TRACKED mic: the aim follows, θ = 0). */
export type PathMic = { id: string; pose: MicPose; pattern: PatternId; tracked?: boolean };

export type MicReading = {
  /** mm from the source to the mic. */
  r: number;
  /** mm at the path's closest approach to this mic. */
  rMin: number;
  /** Degrees off the mic's front axis (0 for a tracked mic). */
  thetaDeg: number;
  /** dB against the closest point (≤ 0): inverse square, free field. */
  levelDb: number;
  /** dB from the pattern at θ (≤ 0). */
  patternDb: number;
  /** level + pattern. */
  totalDb: number;
  /** cos φ: + while the source approaches the mic, − once it recedes. */
  cosPhi: number;
  /** The ideal Doppler factor and its cents (a steady tone). */
  factor: number;
  cents: number;
  approaching: boolean;
};

/** The aim of a tracked mic at s: its front on the source. */
export function trackedPose(path: PathDef, s: number, p: Vec3): MicPose {
  const q = pointAt(path, s);
  const d = sub(q, p);
  const l = len(d) || 1;
  const el = (Math.asin(Math.max(-1, Math.min(1, -d.y / l))) * 180) / Math.PI;
  const az = Math.abs(el) > 89.9 ? 0 : (Math.atan2(d.z, -d.x) * 180) / Math.PI;
  return { p, az, el };
}

/** What `mic` sees of the source at s. */
export function readMic(path: PathDef, s: number, mic: PathMic, c: number = C20): MicReading {
  const q = pointAt(path, s);
  const toMic = sub(mic.pose.p, q);
  const r = Math.max(1, len(toMic));
  const rMin = Math.max(1, closestApproach(path, mic.pose.p).d);
  const pose = mic.tracked ? trackedPose(path, s, mic.pose.p) : mic.pose;
  const thetaDeg = mic.tracked ? 0 : arrivalAngle(pose, q);
  const levelDb = -20 * Math.log10(r / rMin);
  const patternDb = mic.pattern === 'omni' ? 0 : gainDb(mic.pattern, thetaDeg);
  const v = tangentAt(path, s);
  const cosPhi = (v.x * toMic.x + v.y * toMic.y + v.z * toMic.z) / r;
  const factor = dopplerFactor(path.speedMs, cosPhi, c);
  return { r, rMin, thetaDeg, levelDb, patternDb, totalDb: levelDb + patternDb, cosPhi, factor, cents: centsOf(factor), approaching: cosPhi > 0 };
}

/** Δt (ms) between two separate mics for the source at s: + = `b` hears it later. */
export function pairDtMs(path: PathDef, s: number, a: Vec3, b: Vec3): number {
  const q = pointAt(path, s);
  return deltaTms(len(sub(b, q)) - len(sub(a, q)));
}

/** The strip under the plan: the mic's readings at n + 1 evenly spaced s. */
export function stripOf(path: PathDef, mic: PathMic, n = 60, c: number = C20): { s: number; levelDb: number; totalDb: number; cents: number }[] {
  const out: { s: number; levelDb: number; totalDb: number; cents: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const s = k / n;
    const m = readMic(path, s, mic, c);
    out.push({ s, levelDb: m.levelDb, totalDb: m.totalDb, cents: m.cents });
  }
  return out;
}

/** A straight path from a to b. */
export function straightPath(a: Vec3, b: Vec3, speedMs: number, envelopeHalfWidth: number): PathDef {
  return { points: [a, b], speedMs, envelopeHalfWidth };
}
