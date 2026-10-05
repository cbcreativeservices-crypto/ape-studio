/**
 * THE AIR COLUMN AND THE BELL — the physics the low-brass HOW IT SOUNDS
 * pages draw (LESSON_JOURNEY §7, "air columns": open/closed pipe standing
 * waves; bell directivity in words). Pure; node-tested. FULLY SILENT: these
 * numbers place shapes and paths on screen, never a sound.
 *
 *   pipeShape     the IDEAL pipe closed at the lips and open at the bell: the
 *                 pressure of standing wave n is cos((2n − 1)·π·x / 2L)
 *                 (x = 0 at the lips, L at the bell) — a pressure maximum at
 *                 the lips, a pressure still point at the open end;
 *   pipeRatio     its frequencies in a plain tube: 1, 3, 5, … (odd only). A
 *                 real brass bore — the flare and the mouthpiece — moves these
 *                 toward a nearly complete whole-number series, which the
 *                 page says in words (UNSW brass acoustics; no bore model is
 *                 drawn as data);
 *   stillPoints   where shape n's pressure stands still: x = (2k − 1)L/(2n − 1);
 *   reflection    the bell and a WALL (the horn's rear wall): the image-source
 *                 path from the bell to a listener by way of the wall, the
 *                 direct path, the extra distance and its delay at 343 m/s;
 *   spread        WHERE the sound leaves the bell, in words and as a cone:
 *                 the low notes nearly all round, the higher ones concentrated
 *                 along the bell's axis (the measured brass trend: tuba
 *                 "≈ 90° at 1 kHz"; horn "limited to the bell direction above
 *                 1 kHz") — a picture of where, never of how much.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { C_SOUND } from './lowBrassSpec.ts';

/** Pressure of the ideal closed–open pipe's shape n at fraction x (0..1). */
export function pipeShape(n: number, x: number): number {
  return Math.cos(((2 * n - 1) * Math.PI * x) / 2);
}

/** Shape n's frequency in the ideal closed–open pipe, as a multiple of shape 1's. */
export function pipeRatio(n: number): number {
  return 2 * n - 1;
}

/** Shape n's pressure still points (fractions of the length, the last at the bell). */
export function stillPoints(n: number): number[] {
  const out: number[] = [];
  for (let k = 1; k <= n; k++) out.push((2 * k - 1) / (2 * n - 1));
  return out;
}

/** The lowest frequency of the ideal closed–open pipe of length L (m): c / 4L. */
export function pipeLowestHz(Lm: number): number {
  return C_SOUND / (4 * Lm);
}

const d3 = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/**
 * A rear wall square to x at `wallX`: the sound from the bell reaches a
 * listener directly and by way of the wall (the image source mirrored in
 * the wall). Distances in mm, the delay in ms.
 */
export function reflection(bell: Vec3, listener: Vec3, wallX: number): { direct: number; viaWall: number; extra: number; delayMs: number; hit: Vec3 } {
  const image: Vec3 = { x: 2 * wallX - bell.x, y: bell.y, z: bell.z };
  const direct = d3(bell, listener);
  const viaWall = d3(image, listener);
  // Where the reflected path meets the wall (on the line image → listener).
  const t = (wallX - image.x) / (listener.x - image.x);
  const hit = { x: wallX, y: image.y + (listener.y - image.y) * t, z: image.z + (listener.z - image.z) * t };
  const extra = viaWall - direct;
  return { direct, viaWall, extra, delayMs: (extra / 1000 / C_SOUND) * 1000, hit };
}

export type Register = 'low' | 'mid' | 'high';
/**
 * The half-angle (deg) of the cone the page draws round the bell's axis for
 * each register: LOW — all round (180°); MIDDLE — a wide cone; HIGH — the
 * main lobe ≈ 90° wide (±45°), the tuba's measured figure at 1 kHz, used as
 * the brass trend. A picture of WHERE, not a level.
 */
export function spreadHalfAngle(r: Register): number {
  return r === 'low' ? 180 : r === 'mid' ? 90 : 45;
}
