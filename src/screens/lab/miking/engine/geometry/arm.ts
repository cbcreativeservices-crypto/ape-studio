/**
 * MIC ARMS, drawn (Lab 7 group 1, broadcast speech). Pure; worklets; tested
 * (test/mikingLab7Broadcast.test.ts).
 *
 * The collision model keeps a clip mount's ONE straight arm capsule from the
 * mic's tail to its grip (collision.assembly, piece 'arm': never tested
 * against solids, its length capped by the type's `clip.reach`). What a real
 * desk arm or gooseneck LOOKS like is drawn from the same two end points:
 *
 *   elbowOf      a desk-clamped spring arm: two rigid segments `a` (grip →
 *                elbow) and `b` (elbow → tail), the elbow raised (−y) in the
 *                vertical plane through the two ends — the usual way such an
 *                arm is set, its springs above. Stretched past a + b, the
 *                elbow sits on the straight line (the arm cannot reach: the
 *                engine already turns the arm red).
 *   gooseneckPts a flexible neck: a cubic from the base rising straight up,
 *                bending over to leave along the mic's own axis into its tail.
 * Lengths are the mic type's drawing defaults (never readouts).
 */
import type { Vec3 } from '../model/types.ts';

/** The elbow of a two-segment arm from `grip` to `tail` (segments a, b). */
export function elbowOf(grip: Vec3, tail: Vec3, a: number, b: number): Vec3 {
  'worklet';
  const dx = tail.x - grip.x;
  const dy = tail.y - grip.y;
  const dz = tail.z - grip.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (d < 1e-6) return { x: grip.x, y: grip.y - a, z: grip.z };
  const ux = dx / d;
  const uy = dy / d;
  const uz = dz / d;
  if (d >= a + b) {
    const t = (a / (a + b)) * d;
    return { x: grip.x + ux * t, y: grip.y + uy * t, z: grip.z + uz * t };
  }
  // The foot of the elbow on the grip→tail line, and its height off it.
  let t = (a * a - b * b + d * d) / (2 * d);
  t = Math.max(-a, Math.min(a, t));
  const h = Math.sqrt(Math.max(0, a * a - t * t));
  // "Up" (−y) with its part along the line removed: the raised side.
  let nx = -ux * -uy;
  let ny = -1 - uy * -uy;
  let nz = -uz * -uy;
  let nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (nl < 1e-6) {
    // The arm runs straight up or down: bend toward +x (out from the talker).
    nx = 1 - ux * ux;
    ny = -uy * ux;
    nz = -uz * ux;
    nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  }
  return { x: grip.x + ux * t + (nx / nl) * h, y: grip.y + uy * t + (ny / nl) * h, z: grip.z + uz * t + (nz / nl) * h };
}

/** A gooseneck's centre line as a cubic (four control points): up from the
 *  base, over, and into the mic's tail along its axis `aim` (unit). */
export function gooseneckPts(base: Vec3, tail: Vec3, aim: Vec3): [Vec3, Vec3, Vec3, Vec3] {
  'worklet';
  const dx = tail.x - base.x;
  const dy = tail.y - base.y;
  const dz = tail.z - base.z;
  const k = Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.42;
  return [base, { x: base.x, y: base.y - k, z: base.z }, { x: tail.x - aim.x * k, y: tail.y - aim.y * k, z: tail.z - aim.z * k }, tail];
}
