/**
 * laneStep — the − / + keys at the ends of the shared fader lane (lab fix
 * round 1, 2026-11-14, section 3 row 8: "equal −/+ steps on every lane;
 * larger end targets"; owner: "Begin fixing all bugs found and do obvious ...
 * fixes as you suggested in the report", suggested order item 8).
 *
 * G5b (DJ): "Some lanes have −/+ steps (TRIM, TEMPO, GAIN) and others don't";
 * G5b (Sound Systems): "Give the lane ▲/▼ step buttons ... so the page can be
 * done without a precise drag"; G5c: "fine targets are hard without the −/+
 * steps that only some lanes have".
 *
 * A fader that brings its own `nudges` keeps them (they are the lab's tuned
 * steps). Every other lane gets a − and a + at its ends:
 *   • TAP = one step: at least LANE_MIN_STEP of the travel, and on to the
 *     next value the readout actually shows, so a stepped fader (four
 *     positions) moves to its next position and a fine one never looks dead;
 *   • HOLD = jump to that end (the "larger end target": the lane's ends sit
 *     inside the edge guard and are hard to hit with a finger).
 * Pure; the lane value is the 0..1 position the lab maps itself.
 */

/** The least a tap moves the lane (2 % of its travel). */
export const LANE_MIN_STEP = 0.02;
/** How finely the walk looks for the next readout value. */
const WALK = 0.005;

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

function said(format: ((v: number) => string) | undefined, v: number): string | null {
  if (!format) return null;
  try {
    return String(format(v));
  } catch {
    return null;
  }
}

/** The lane position one step from `value` towards `dir` (−1 / +1). */
export function laneStepValue(value: number, dir: -1 | 1, format?: (v: number) => string): number {
  const cur = clamp01(value);
  let next = clamp01(cur + dir * LANE_MIN_STEP);
  const now = said(format, cur);
  if (now == null) return next;
  // Walk on until the readout changes, or the end is reached.
  for (let i = 0; i < 1 / WALK + 2; i++) {
    if (said(format, next) !== now) return next;
    if (next === 0 || next === 1) return next;
    next = clamp01(next + dir * WALK);
  }
  return next;
}

/** Spoken name of a step key. */
export function laneStepA11y(label: string, dir: -1 | 1): string {
  return dir < 0 ? `${label}: one step down. Hold for the lowest setting.` : `${label}: one step up. Hold for the highest setting.`;
}
