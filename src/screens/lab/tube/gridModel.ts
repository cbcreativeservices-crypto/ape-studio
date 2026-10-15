/**
 * gridModel — the control-grid lane of the Vacuum Tube lab, as pure numbers
 * (no React, so the tests can import it).
 *
 * The GRID V lane rides 0 (grid most negative) … 1 (least negative), linear in
 * grid voltage. Below GRID_CUTOFF the grid's field turns EVERY electron back:
 * the tube is cut off and no plate current flows (slider audit hold #10, owner
 * 2026-10-14: the readout says "cut off — no current flows", so the plate
 * current and the drawing must both read zero there — before, PLATE I showed
 * the lane % and electrons still crossed at "cutoff"). Above cutoff the plate
 * current follows the triode's three-halves power law, I ∝ (Vg − Vco)^1.5
 * (Child–Langmuir), normalised to 1 at the top of the lane.
 */
export const GRID_CUTOFF = 0.15;
export const GRID_FULL_FLOW = 0.85;

/** Lane-readout word at cutoff (owner wording, hold #10). */
export const CUTOFF_WORDS = 'cut off — no current flows';

/** Plate current, 0..1 of full, for a lane position 0..1. Exactly 0 at and
 *  below cutoff. */
export function plateCurrentFrac(x: number): number {
  if (x <= GRID_CUTOFF) return 0;
  const u = Math.min(1, (x - GRID_CUTOFF) / (1 - GRID_CUTOFF));
  return Math.pow(u, 1.5);
}

/** The words after the lane %. */
export function gridWord(x: number): string {
  return x <= GRID_CUTOFF ? CUTOFF_WORDS : x > GRID_FULL_FLOW ? 'barely negative — full flow' : 'partly negative';
}

/** The bezel's short state. */
export function gridState(x: number): 'CUT OFF' | 'FULL FLOW' | 'PARTIAL' {
  return x <= GRID_CUTOFF ? 'CUT OFF' : x > GRID_FULL_FLOW ? 'FULL FLOW' : 'PARTIAL';
}
