/**
 * Vec3 operations and the AIM convention (blueprint §4.3). Pure, and every
 * function is a worklet so the gesture can call it on the UI thread.
 *
 * aimVec(az, el): az = 0, el = 0 points the mic's FRONT along −x (toward the
 * instrument's reference head). +el tilts the front UP (−y, because +y is
 * down); +az swings it toward +z (the player's right).
 *
 *   aimVec = (−cos az·cos el, −sin el, sin az·cos el)
 *
 * No cross products anywhere (the frame is left-handed; tests pin every
 * formula so a sign cannot flip silently).
 */
import type { Vec3 } from '../model/types.ts';

export const DEG = Math.PI / 180;

export function v3(x: number, y: number, z: number): Vec3 {
  'worklet';
  return { x, y, z };
}
export function add(a: Vec3, b: Vec3): Vec3 {
  'worklet';
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
export function sub(a: Vec3, b: Vec3): Vec3 {
  'worklet';
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
export function scale(a: Vec3, k: number): Vec3 {
  'worklet';
  return { x: a.x * k, y: a.y * k, z: a.z * k };
}
export function dot(a: Vec3, b: Vec3): number {
  'worklet';
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
export function len(a: Vec3): number {
  'worklet';
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}
export function dist(a: Vec3, b: Vec3): number {
  'worklet';
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
export function norm(a: Vec3): Vec3 {
  'worklet';
  const l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  return l > 1e-12 ? { x: a.x / l, y: a.y / l, z: a.z / l } : { x: 0, y: 0, z: 0 };
}
export function clamp(v: number, lo: number, hi: number): number {
  'worklet';
  return v < lo ? lo : v > hi ? hi : v;
}

/** The mic's front axis as a unit vector (see the header). */
export function aimVec(azDeg: number, elDeg: number): Vec3 {
  'worklet';
  const az = azDeg * DEG;
  const el = elDeg * DEG;
  return { x: -Math.cos(az) * Math.cos(el), y: -Math.sin(el), z: Math.sin(az) * Math.cos(el) };
}

/** Angle between two directions, degrees (0..180). */
export function angleBetween(a: Vec3, b: Vec3): number {
  'worklet';
  const la = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  const lb = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
  if (la < 1e-12 || lb < 1e-12) return 0;
  const c = (a.x * b.x + a.y * b.y + a.z * b.z) / (la * lb);
  return Math.acos(c < -1 ? -1 : c > 1 ? 1 : c) / DEG;
}

/** Distance from point p to the infinite line through `point` along `dir`. */
export function distToLine(p: Vec3, point: Vec3, dir: Vec3): number {
  'worklet';
  const d = norm(dir);
  const w = sub(p, point);
  const t = dot(w, d);
  return len(sub(w, scale(d, t)));
}
