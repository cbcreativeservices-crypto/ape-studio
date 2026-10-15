/**
 * ampLaneMap — the pure lane ↔ value maps behind the Amp lab's dock faders
 * (AmpRack.faderParam). No React, so the tests can import it.
 *
 * LINEAR (default): the lane's 0..1 rides min..max evenly.
 * LOG (slider audit hold #9, owner 2026-10-14 — Class C TUNE): the lane rides
 * the RATIO min..max on a logarithmic scale, so equal slides are equal
 * musical/frequency ratios. For TUNE (0.5×..2×) the centre of the lane is
 * exactly 1.00× (tuned) and each end is one octave away — linear put 1.00×
 * at a third of the travel and spent two thirds of it above the tuned point.
 * Endpoints are unchanged either way.
 */
export type LaneScale = 'linear' | 'log';

/** Lane position (0..1) for a value in min..max. */
export function laneFromValue(v: number, min: number, max: number, scale: LaneScale = 'linear'): number {
  if (scale === 'log' && min > 0 && max > min) {
    const t = Math.log(Math.max(min, Math.min(max, v)) / min) / Math.log(max / min);
    return Math.max(0, Math.min(1, t));
  }
  const span = max - min || 1;
  return (v - min) / span;
}

/** Raw value (before step snapping) for a lane position 0..1. */
export function valueFromLane(t: number, min: number, max: number, scale: LaneScale = 'linear'): number {
  const c = Math.max(0, Math.min(1, t));
  if (scale === 'log' && min > 0 && max > min) return min * Math.pow(max / min, c);
  return min + c * (max - min || 1);
}
