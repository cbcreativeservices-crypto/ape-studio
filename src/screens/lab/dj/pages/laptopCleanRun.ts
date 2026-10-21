/**
 * laptopCleanRun — Screen 16's DROPOUTS count and "n s CLEAN" run, the pure
 * half (tests reach it). Both are measured in BOOTH TIME, chunk by chunk as
 * each rendered chunk starts sounding.
 *
 * Toddler bug 2026-10-19: the old count added each chunk's whole length to
 * the clean run. Any booth change re-renders a fresh 3-second chunk, so a
 * learner tapping the already-selected BUFFER chip seven times read
 * "20 s CLEAN" (and latched "Stable buffer, two decks") about 5 s after
 * choosing it. A re-rendered chunk REPLACES the rest of the one before it,
 * so the run is the booth time from its start to the end of the chunk now
 * sounding, and a dropout is counted once (the model's dropouts are fixed per
 * buffer, so a re-render repeats the ones of the stretch it overlaps).
 */

export type CleanRun = {
  /** The settings this run was measured under (buffer, rate, workload, …). */
  key: string;
  /** Dropouts counted under these settings. */
  count: number;
  /** Booth time up to which dropouts have been counted. */
  coveredTo: number;
  /** Booth time the current clean stretch began (null: not running clean). */
  cleanFrom: number | null;
  /** Seconds of clean audio to the end of the chunk now sounding. */
  clean: number;
};

export const freshCleanRun = (): CleanRun => ({ key: '', count: 0, coveredTo: 0, cleanFrom: null, clean: 0 });

/** One chunk starts sounding: `t0` and `seconds` in booth time, `drops` the
 *  dropout times inside it, `feeding` whether the laptop is sending audio to
 *  the mixer (a deck playing, the mixer's device chosen and its cable in). */
export function stepCleanRun(run: CleanRun, chunk: { t0: number; seconds: number; drops: readonly number[] }, key: string, feeding: boolean): CleanRun {
  const r: CleanRun = run.key === key ? { ...run } : { key, count: 0, coveredTo: chunk.t0, cleanFrom: null, clean: 0 };
  const end = chunk.t0 + chunk.seconds;
  r.count += chunk.drops.filter((d) => d >= r.coveredTo - 1e-9).length;
  r.coveredTo = Math.max(r.coveredTo, end);
  if (!feeding) return { ...r, cleanFrom: null, clean: 0 };
  if (chunk.drops.length) r.cleanFrom = Math.max(...chunk.drops);
  else if (r.cleanFrom == null) r.cleanFrom = chunk.t0;
  r.clean = Math.max(0, end - r.cleanFrom);
  return r;
}
