/**
 * SCENE FRAME F — the metre-scale frame every Lab 6 field and measurement
 * scene shares (BATCH6_RESEARCH_SUMMARY_PART2.md §3.1; measurement_mics/
 * GEOMETRY_PROPOSAL.md §5). Built by Lab 6 group 4 (branch lab6-g4) because
 * Lab 6 part 1 had not merged one; part 1 and the other Lab 6 groups import
 * it from this path. Pure: no React, so the tests reach it.
 *
 * The frame is the Miking engine's own (engine/model/types.ts): millimetres,
 * +x the scene's FRONT (from the source toward the listener / receiver),
 * +y DOWN (the ground is at positive y), +z across (a left-handed triple —
 * the engine never takes a cross product). A scene names its ground line
 * `groundY`; a HEIGHT above the ground is `groundY − y`. Plan = the 'top'
 * view (u = x, v = z); section = the 'side' view (u = x, v = y).
 *
 * Distances are DRAWN in metres where a scene is metres wide, so the
 * rounding scales with the number (`fmtMetres`): centimetres under a metre,
 * a tenth of a metre under ten, whole metres beyond — never more digits
 * than a tape measure on site gives.
 */
import type { Vec3 } from '../../../engine/model/types.ts';

/** Millimetres in a metre (the engine's unit is the millimetre). */
export const MM_PER_M = 1000;
/** Millimetres in a foot (exact, international foot). */
export const MM_PER_FT = 304.8;

/** A metre value as engine millimetres. */
export const m = (metres: number): number => metres * MM_PER_M;

/** A scene's ground: the y of the ground line (y-down). */
export type SceneGround = { groundY: number };

/** The point `h` mm above the ground at plan position (x, z). */
export function atHeight(g: SceneGround, x: number, h: number, z = 0): Vec3 {
  return { x, y: g.groundY - h, z };
}

/** A point's height above the ground (mm). */
export function heightOf(g: SceneGround, p: Vec3): number {
  return g.groundY - p.y;
}

/** Plan distance (mm) between two points, ignoring height. */
export function planDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Straight-line distance (mm). */
export function distance3(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * A length in words, rounded to the scale of the number: "45 cm", "1.5 m",
 * "12 m" (with feet in brackets when `feet`). Never NaN on screen (D53): a
 * non-finite or negative length reads "—".
 */
export function fmtMetres(mm: number, feet = false): string {
  if (!Number.isFinite(mm) || mm < 0) return '—';
  const metric = mm < 1000 ? `${Math.round(mm / 10)} cm` : mm < 10000 ? `${(Math.round(mm / 100) / 10).toFixed(1)} m` : `${Math.round(mm / 1000)} m`;
  if (!feet) return metric;
  const ft = mm / MM_PER_FT;
  const imperial = ft < 10 ? `${(Math.round(ft * 10) / 10).toFixed(1)} ft` : `${Math.round(ft)} ft`;
  return `${metric} (${imperial})`;
}
