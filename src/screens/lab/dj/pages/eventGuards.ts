/**
 * eventGuards — small PURE guards for screens 17–24 (toddler bug hunt
 * 2026-10-19). No React Native here, so the tests reach every one.
 *
 * FRESH READINGS. A screen's `last` render is the chunk SOUNDING now — it was
 * rendered from the booth as it was BEFORE the learner's latest change, and
 * it stays `last` until the next chunk starts (up to 8 s). A goal that pairs
 * the booth's flags NOW with that old reading can tick on audio that never
 * had the change in it: SET IT UP on Screen 20's "tops behind you" passed at
 * once on the old placement's dose; a voice heard before OPEN THE DOORS
 * passed the capstone's announcement. A reading counts for a goal only when
 * its chunk was rendered after the latest booth change (pages/s1Guards
 * `renderedSince`, shared with screens 1–8).
 */

/**
 * The capstone's (and the changeover's) transition step, with a STALE
 * reading never allowed to finish it: the step may start or fail on any
 * reading, but `done` needs a reading rendered from the booth as it is now.
 */
export function holdDoneUnlessFresh<T extends { done: boolean }>(prev: T, next: T, fresh: boolean): T {
  if (next.done && !prev.done && !fresh) return { ...next, done: false };
  return next;
}

/** Screen 22: the drum machine's own tempo stays on a real machine's dial
 *  (a toddler's forty taps of −1 must never reach 0 or a negative BPM). */
export const INT_BPM_MIN = 40;
export const INT_BPM_MAX = 240;
export const clampIntBpm = (bpm: number): number => (Number.isFinite(bpm) ? Math.round(Math.max(INT_BPM_MIN, Math.min(INT_BPM_MAX, bpm)) * 10) / 10 : 120);

/** Screen 18: a needle drop stays on the record (its first second to 30 s
 *  before the end), however often it is pressed. */
export const clampNeedle = (posSec: number, trackSec: number): number => Math.max(1, Math.min(Math.max(1, trackSec - 30), posSec));
