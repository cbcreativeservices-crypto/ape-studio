/**
 * SPEAKER COVERAGE — the level model (pure; no Skia, so the tests reach it).
 * Moved out of micspeaker/viz.tsx in the fix pass 2026-10-16, unchanged
 * except for the pattern edge (smoothEdge): CONCEPTUAL coverage, never an SPL
 * prediction — but the directions, the spreads and the distance law are the
 * real ones:
 *   • distance   intensity ∝ 1/d² (inverse-square: −6 dB per doubling);
 *   • pattern    the rated coverage angle is the −6 dB angle (smoothEdge);
 *   • directivity the same power in a narrower wedge is louder on axis
 *                (dirGain), at every distance;
 *   • several boxes add as power (incoherent sum: +3 dB where two equal
 *                beams overlap — the comb filtering of the real overlap is
 *                taught in words, not painted).
 */

/** Conceptual level → colormap position. Same honesty rules as ever: this is
 *  an ILLUSTRATIVE dB-ish scale (10·log10 of the summed conceptual energy),
 *  mapped so the old class thresholds land in sensible colormap zones
 *  (red ≥ 1.7 → hot reds · green ≥ 0.5 → greens/yellows · < 0.26 → blues). */
export function coverageT(lvl: number): number {
  const db = 10 * Math.log10(Math.max(1e-4, lvl));
  return Math.max(0, Math.min(1, (db + 16) / 21));
}

/** Directivity (owner 2026-08-31): the same acoustic power squeezed into a
 *  NARROWER wedge is louder on axis — and a wider wedge is quieter at EVERY
 *  distance, near and far alike (both fall at the same −6 dB per doubling;
 *  width never makes a box "fall off faster"). Intensity on axis ∝ 1 / the
 *  wedge's angle in the view's plane; normalized to each view's all-rounder
 *  (refHalfDeg) so the default look holds. */
export function dirGain(halfDeg: number, refHalfDeg: number): number {
  return refHalfDeg / Math.max(14, halfDeg);
}

/** Pattern gain (intensity, re on-axis) at `offDeg` off the box's axis.
 *
 *  ⛔ PHYSICS FIX 2026-10-16: a loudspeaker's rated coverage angle is its
 *  −6 dB angle — at the edge of the nominal wedge the level is ALREADY 6 dB
 *  down from on-axis (how coverage is specified). The old curve held full
 *  level right out to the edge and only then rolled off, so every wedge
 *  painted as a flat-topped slab 6 dB too loud at its edges. Now: a smooth
 *  beam, −6·(θ / half)² dB — 0 dB on axis, −6 dB at the rated edge, −13.5 dB
 *  at 1.5× the half-angle — floored at −20 dB (a typical box's rejection
 *  to the side and rear). Exported so the tests can pin the −6 dB edge. */
export function smoothEdge(offDeg: number, halfDeg: number): number {
  const r = offDeg / Math.max(1, halfDeg);
  const db = Math.max(-20, -6 * r * r);
  return Math.pow(10, db / 10);
}

/** Conceptual level from one speaker to one point (top view): the pattern
 *  (smoothEdge) × inverse-square distance × directivity (`scale`). The heat
 *  map's inner loop inlines this same expression with the per-source
 *  constants hoisted. (The old banded `topLevel`, unused and on a 1/d^1.5
 *  law, was deleted in the fix pass 2026-10-16.) */
export function topLevelSmooth(
  sx: number,
  sy: number,
  aimDeg: number,
  hDeg: number,
  px: number,
  py: number,
  refD: number,
  scale: number,
): number {
  const vx = px - sx;
  const vy = py - sy;
  const d = Math.max(12, Math.hypot(vx, vy));
  const th = (aimDeg * Math.PI) / 180;
  const ax = Math.sin(th);
  const ay = Math.cos(th);
  const cosA = (vx * ax + vy * ay) / d;
  const ang = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
  // ^2 = true inverse-square (−6 dB per doubling under coverageT's 10·log10)
  // — the old ^1.5 kept yellow alive across the whole room (owner 2026-08-31).
  // `scale` carries the pattern's directivity (dirGain) where it applies.
  return scale * smoothEdge(ang, hDeg / 2) * Math.pow(refD / d, 2);
}

/** Side-plane conceptual level (vertical pattern × distance, smooth edge).
 *  Exported as the readable reference for the side heat map, whose inner loop
 *  inlines this same expression with the per-source constants hoisted. */
export function sideLevelSmooth(
  sx: number,
  sy: number,
  axisRad: number,
  halfDeg: number,
  px: number,
  py: number,
  refD: number,
  scale: number,
): number {
  const vx = px - sx;
  const vy = py - sy;
  const d = Math.max(12, Math.hypot(vx, vy));
  // Wrapped to ±180° (a point behind the box is 180° off, never 300°).
  let off = Math.atan2(vy, vx) - axisRad;
  if (off > Math.PI) off -= 2 * Math.PI;
  else if (off < -Math.PI) off += 2 * Math.PI;
  const offDeg = (Math.abs(off) * 180) / Math.PI;
  // ^2 = true inverse-square — see topLevelSmooth.
  return scale * smoothEdge(offDeg, halfDeg) * Math.pow(refD / d, 2);
}
