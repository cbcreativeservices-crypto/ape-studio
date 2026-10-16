/**
 * AUDIENCE CHAIRS — the pure sizes and row layout (no Skia), so the plans'
 * overlap test (test/mikingPlanCollisions_20261015) can read them in node.
 * audienceChairs.tsx draws them and re-exports these.
 *
 * Real stacking-chair dimensions, in millimetres: 460 wide, 430 seat depth,
 * seat 450 high, back 880 high.
 */
import { aboveRotation } from './headIconGeometry.ts';

export const CHAIR_MM = { w: 460, seatD: 430, backD: 60, seatH: 450, backH: 880 } as const;
/** Centre-to-centre spacing of chairs in a row (a seat plus elbow room). */
export const CHAIR_PITCH_MM = 520;
/** Clear floor between a stage's downstage lip and the front row's seat
 *  edges (owner 2026-10-15: an audience is drawn only where one fits — a
 *  walkway in front of the stage and the PA's throw over the front rows,
 *  never chairs pressed against the deck). */
export const FRONT_ROW_GAP_MM = 1200;
/** The front row's chair-centre depth for a stage whose downstage lip is at
 *  `lip` (the chairs face the stage, so their seat front is nearest it). */
export function frontRowAt(lip: number): number {
  return lip + FRONT_ROW_GAP_MM + CHAIR_MM.seatD / 2;
}

/** One row of chairs across v ∈ [v0, v1] at depth u, all facing −u (the stage). */
export function chairRowFacingStage(u: number, v0: number, v1: number): { x: number; y: number; rotation: number }[] {
  const n = Math.max(1, Math.floor((v1 - v0) / CHAIR_PITCH_MM) + 1);
  const span = (n - 1) * CHAIR_PITCH_MM;
  const start = (v0 + v1) / 2 - span / 2;
  return Array.from({ length: n }, (_, i) => ({ x: u, y: start + i * CHAIR_PITCH_MM, rotation: aboveRotation(-1, 0) }));
}

/** The plan box of one chair turned by `rotation` (seat + backrest, mm). */
export function chairRect(c: { x: number; y: number; rotation: number }): { u0: number; u1: number; v0: number; v1: number } {
  const { w, seatD, backD } = CHAIR_MM;
  // local box: x ∈ [−w/2, w/2], y ∈ [−seatD/2 − backD, seatD/2]; turned and moved
  const pts = [
    [-w / 2, -seatD / 2 - backD],
    [w / 2, -seatD / 2 - backD],
    [w / 2, seatD / 2],
    [-w / 2, seatD / 2],
  ].map(([x, y]) => ({ u: c.x + x * Math.cos(c.rotation) - y * Math.sin(c.rotation), v: c.y + x * Math.sin(c.rotation) + y * Math.cos(c.rotation) }));
  return { u0: Math.min(...pts.map((p) => p.u)), u1: Math.max(...pts.map((p) => p.u)), v0: Math.min(...pts.map((p) => p.v)), v1: Math.max(...pts.map((p) => p.v)) };
}
