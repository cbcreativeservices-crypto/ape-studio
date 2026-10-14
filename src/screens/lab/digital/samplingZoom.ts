/**
 * SAMPLING module ZOOM lane → what the glass shows (slider audit 2026-10-14).
 *
 * The lane used to map straight to a sample count (12 … 420) and THEN clamp
 * the result to 0.3 … 60 cycles. Near Nyquist (a few samples per cycle — the
 * very place the lesson sends you) the 60-cycle ceiling arrived after the
 * first fifth of the travel, so the other four fifths changed nothing; at a
 * low tone the 0.3-cycle floor did the same at the bottom. Now the lane spans
 * only the window that is actually reachable for THIS samples-per-cycle, so
 * every bit of travel zooms. Same limits, same linear feel — no dead zones.
 * Pure: no physics, only the view window.
 */
export const ZOOM_MIN_SAMPLES = 12;
export const ZOOM_MAX_SAMPLES = 420;
export const ZOOM_MIN_CYCLES = 0.3;
export const ZOOM_MAX_CYCLES = 60;

/** zoomV ∈ [0,1] (0 = individual samples, 1 = looks continuous); spc = fs / f. */
export function samplingZoom(zoomV: number, spc: number): { cycles: number; nShown: number } {
  const z = Math.max(0, Math.min(1, Number.isFinite(zoomV) ? zoomV : 0));
  const s = spc > 0 && Number.isFinite(spc) ? spc : 1;
  const lo = Math.max(ZOOM_MIN_SAMPLES, ZOOM_MIN_CYCLES * s);
  // When even the 0.3-cycle floor needs more than 420 samples (a very low
  // tone at 192 kHz) there is one honest view: hi = lo.
  const hi = Math.max(lo, Math.min(ZOOM_MAX_SAMPLES, ZOOM_MAX_CYCLES * s));
  const target = lo + z * (hi - lo);
  return { cycles: target / s, nShown: Math.round(target) };
}
