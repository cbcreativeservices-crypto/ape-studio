/**
 * A REFLECTION OFF A FLAT SURFACE — the desk, a table, a script stand
 * (Lab 7 broadcast speech; radio_host/GEOMETRY_PROPOSAL.md §6). Built once by
 * group 1 (B01 desk, B07 script stand, B06 table and lectern); used by B02.
 * Pure: no React (test/mikingLab7Broadcast.test.ts).
 *
 * THE MODEL (real physics, simplified on purpose — said once on screen as "a
 * simplified picture"): the mouth is one point; the surface is a hard, flat,
 * finite plate that reflects all of the sound like a mirror (the IMAGE
 * SOURCE: the mouth mirrored through the surface's plane); straight paths in
 * open air. The mic hears the direct sound and, later, the reflection:
 *
 *   direct path   r₁ = |P − M|
 *   reflected     r₂ = |P − M′|,  M′ = M mirrored in the plane
 *   Δd = r₂ − r₁,  Δt = Δd / c  (engine/physics/twoMic: c from the calculator)
 *   first notch   f₁ = 1 / (2 Δt)  (the same comb as two mics, twoMic.notchesHz)
 *   level         the reflection arrives 20·log10(r₂ / r₁) dB lower by
 *                 distance alone, and the mic's ideal pattern weighs each
 *                 arrival by the angle it comes from (engine/physics/polar).
 * The reflection exists only where its mirror point lands ON the plate
 * (inside its rectangle); off the plate there is none.
 * Real desks absorb and scatter some sound, and real voices are not points:
 * read the notch POSITION, treat its depth as illustrative.
 */
import type { MicPose, PatternId, Vec3 } from '../../../engine/model/types.ts';
import { C20, deltaTms, notchDepthDb, notchesHz } from '../../../engine/physics/twoMic.ts';
import { arrivalAngle, gain } from '../../../engine/physics/polar.ts';

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const len = (a: Vec3) => Math.sqrt(dot(a, a));

/**
 * A flat plate: its centre, its unit normal (the side the talker is on), two
 * unit in-plane axes `u`, `w` and its half-sizes along them. A desk top:
 * normal (0, −1, 0) (up, y-down frame), u = x, w = z.
 */
export type Plate = { c: Vec3; n: Vec3; u: Vec3; w: Vec3; hu: number; hw: number };

/** A horizontal desk or table top at height `y` (frame V: y down), spanning
 *  x0…x1 and z0…z1 — its normal points up, toward the talker. */
export function deskPlate(y: number, x0: number, x1: number, z0: number, z1: number): Plate {
  return { c: { x: (x0 + x1) / 2, y, z: (z0 + z1) / 2 }, n: { x: 0, y: -1, z: 0 }, u: { x: 1, y: 0, z: 0 }, w: { x: 0, y: 0, z: 1 }, hu: (x1 - x0) / 2, hw: (z1 - z0) / 2 };
}

/** The mouth mirrored through the plate's plane (the image source). */
export function imageSource(m: Vec3, p: Plate): Vec3 {
  const d = dot(sub(m, p.c), p.n);
  return sub(m, mul(p.n, 2 * d));
}

/** Where the reflected path meets the plane (the segment from the image to
 *  the mic crosses it), or null when the mic is on the far side. */
export function reflectionPoint(m: Vec3, mic: Vec3, p: Plate): Vec3 | null {
  const im = imageSource(m, p);
  const a = dot(sub(im, p.c), p.n);
  const b = dot(sub(mic, p.c), p.n);
  if (a * b >= 0 || Math.abs(a - b) < 1e-9) return null;
  const t = a / (a - b);
  return add(im, mul(sub(mic, im), t));
}

/** Whether a point of the plane lies on the plate. */
export function onPlate(q: Vec3, p: Plate): boolean {
  const r = sub(q, p.c);
  return Math.abs(dot(r, p.u)) <= p.hu && Math.abs(dot(r, p.w)) <= p.hw;
}

export type Reflection = {
  /** False when the mirror point falls off the plate (no reflection). */
  exists: boolean;
  /** The bounce point on the plate (null: none). */
  at: Vec3 | null;
  image: Vec3;
  /** Direct and reflected path lengths (mm), and their difference. */
  r1: number;
  r2: number;
  dMm: number;
  /** The arrival-time difference (ms) and the first comb notch (Hz, null above 20 kHz). */
  dtMs: number;
  firstNotchHz: number | null;
  /** The reflection's level against the direct sound: by distance alone,
   *  and with the mic's ideal pattern (null in its null). */
  distDb: number;
  patternDb: number | null;
  /** The notch depth the two arrivals would make (dB, −40 floor; illustrative). */
  depthDb: number;
};

/** The desk reflection a mic at `pose` (pattern `pattern`) hears from a
 *  mouth at `m`, off the plate `p`. */
export function deskReflection(m: Vec3, pose: MicPose, pattern: PatternId, p: Plate): Reflection {
  const image = imageSource(m, p);
  const at = reflectionPoint(m, pose.p, p);
  const exists = !!at && onPlate(at, p) && dot(sub(m, p.c), p.n) > 0;
  const r1 = len(sub(pose.p, m));
  const r2 = len(sub(pose.p, image));
  const dMm = r2 - r1;
  const dtMs = deltaTms(dMm, C20);
  const first = notchesHz(dtMs, 1, 20000, 1)[0] ?? null;
  const distDb = 20 * Math.log10(Math.max(1, r2) / Math.max(1, r1));
  const gD = Math.abs(gain(pattern, arrivalAngle(pose, m)));
  // The reflection arrives from the bounce point, not from the image's side.
  const gR = at ? Math.abs(gain(pattern, arrivalAngle(pose, at))) : 0;
  const patternDb = gD < 0.03 || gR < 0.03 ? null : 20 * Math.log10(gD / gR);
  // Pressure at the mic: each arrival ∝ pattern gain / path length.
  const aD = gD / Math.max(1, r1);
  const aR = exists ? gR / Math.max(1, r2) : 0;
  return { exists, at, image, r1, r2, dMm, dtMs, firstNotchHz: exists ? first : null, distDb, patternDb, depthDb: notchDepthDb(aD, aR) };
}
