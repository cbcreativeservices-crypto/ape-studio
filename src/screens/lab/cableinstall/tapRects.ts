/**
 * Tap squares that never sit on top of each other (SH-49, owner 2026-11-15:
 * "build waves 1 thru 3"; D62 adoption plan, wave 1).
 *
 * The capstone's numbered markers (Stage 13) each had a 44-pt tap square
 * centred on them. Where two markers sit close (the rack's six findings are
 * 7-20 pt apart at phone width), the squares overlapped and the one drawn last
 * took every tap: the marker under it could not be hit.
 *
 * Each square starts at `size` × `size` around its marker. Where it would
 * overlap a neighbour's square, both are cut at the midline between the two
 * markers, along the axis on which the markers are further apart. Both sides
 * of a pair make the same cut, so no two squares overlap, and every marker
 * stays inside its own square. A marker with room keeps its full square.
 *
 * Pure numbers, no React, so the rule is node-testable.
 */
export type TapPoint = { x: number; y: number };
export type TapRect = { left: number; top: number; width: number; height: number };

export function splitTapRects(points: readonly TapPoint[], size = 44): TapRect[] {
  const half = size / 2;
  return points.map((p, i) => {
    let left = p.x - half;
    let right = p.x + half;
    let top = p.y - half;
    let bottom = p.y + half;
    points.forEach((q, j) => {
      if (j === i) return;
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      // Squares of equal size overlap only when both gaps are under `size`.
      if (Math.abs(dx) >= size || Math.abs(dy) >= size) return;
      if (Math.abs(dx) >= Math.abs(dy)) {
        const mid = p.x + dx / 2;
        if (dx > 0) right = Math.min(right, mid);
        else left = Math.max(left, mid);
      } else {
        const mid = p.y + dy / 2;
        if (dy > 0) bottom = Math.min(bottom, mid);
        else top = Math.max(top, mid);
      }
    });
    return { left, top, width: right - left, height: bottom - top };
  });
}
