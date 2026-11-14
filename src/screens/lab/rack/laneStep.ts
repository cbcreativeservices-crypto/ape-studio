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
/** One tap when the readout cannot be trusted: 5 % of the travel, the same
 *  step as the lane's own accessibility increment (ParamLane). */
export const LANE_FALLBACK_STEP = 0.05;
/** The farthest one tap may walk looking for the next readout value. A lane
 *  whose readout does not change within this is treated as untrusted. */
export const LANE_MAX_WALK = 0.34;
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

/**
 * ONE TAP IS ONE STEP, NEVER A JUMP TO THE END (checker C4, FAIL-5, 2026-11-14:
 * Bass FRET went OPEN → "12 of 12" on one tap). Many labs' `format` ignores
 * its argument and prints the CURRENT state (`format: () => …`), so walking
 * "until the readout changes" never stopped before the end. Now:
 *   • `steps` (the fader's own count of positions) wins: one tap = 1 / steps;
 *   • a readout that reads the same at 0, ½, 1 and here is UNTRUSTED: one tap
 *     = LANE_FALLBACK_STEP (a stepped lab with ≤ 20 positions still lands on
 *     its next one);
 *   • otherwise the walk looks for the next readout value no farther than
 *     LANE_MAX_WALK; not found there = LANE_FALLBACK_STEP.
 * Holding the key is what jumps to an end (RackUnit LaneStepKey).
 */
export function laneStepValue(value: number, dir: -1 | 1, format?: (v: number) => string, steps?: number): number {
  const cur = clamp01(value);
  if (steps && Number.isFinite(steps) && steps >= 1) return clamp01(cur + dir / steps);
  const now = said(format, cur);
  const fallback = clamp01(cur + dir * LANE_FALLBACK_STEP);
  if (now == null) return fallback;
  const lo = said(format, 0);
  const mid = said(format, 0.5);
  const hi = said(format, 1);
  if (lo === now && mid === now && hi === now) return fallback; // the format ignores its value
  let next = clamp01(cur + dir * LANE_MIN_STEP);
  while (Math.abs(next - cur) <= LANE_MAX_WALK + 1e-9) {
    if (said(format, next) !== now) return next;
    if (next === 0 || next === 1) break;
    next = clamp01(next + dir * WALK);
  }
  return fallback;
}
/**
 * The values one tap TRIES, in order (C4 FAIL-5). A stepped lab rounds the
 * lane to its positions, so a small step can snap straight back (a 6-position
 * lane ignores 5 %). The key applies the first; if the lab's value has not
 * moved a beat later it applies the next, each twice as far, never farther
 * than LANE_MAX_WALK from where the tap began: the smallest move the lab
 * accepts, which is at most one of its positions. With `steps` there is one.
 */
export function laneStepTries(value: number, dir: -1 | 1, format?: (v: number) => string, steps?: number): number[] {
  const cur = clamp01(value);
  const first = laneStepValue(cur, dir, format, steps);
  if (steps && Number.isFinite(steps) && steps >= 1) return [first];
  const out = [first];
  let d = Math.abs(first - cur);
  while (d > 0 && d * 2 <= LANE_MAX_WALK + 1e-9) {
    d *= 2;
    const v = clamp01(cur + dir * d);
    if (v === out[out.length - 1]) break;
    out.push(v);
  }
  return out;
}

/** Spoken name of a step key. */
export function laneStepA11y(label: string, dir: -1 | 1): string {
  return dir < 0 ? `${label}: one step down. Hold for the lowest setting.` : `${label}: one step up. Hold for the highest setting.`;
}
