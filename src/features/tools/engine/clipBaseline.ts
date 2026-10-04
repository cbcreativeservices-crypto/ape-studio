/**
 * Per-tool-run clip baseline (owner ruling 2026-10-04: "clipping clears when
 * moving to another tool").
 *
 * The engine's `clipRuns` counter belongs to the whole CAPTURE — only the
 * native resetMetersLocked() zeroes it (EngineHub.hpp). A tool that adopts the
 * warm mic stream (SPL meter → RTA → Spectrogram …) therefore inherited every
 * run counted in the PREVIOUS tool, lit "input clipping" over a clean signal,
 * and saved that flag into its measurement records.
 *
 * useDspEngine arms one of these each time its start() goes live — a tool
 * opening, adopting the stream, regaining focus after another tool, or a
 * STOP → START — so only clipping during THIS run counts. A counter that drops
 * below the baseline (or a frame sequence that restarts) means a new capture
 * whose runs are all new: the baseline re-bases to zero and keeps following it.
 *
 * Pure (no React, no native) so the arithmetic is unit-tested directly.
 */
export type ClipBaseline = {
  /** Start a new run at the counter's current value. */
  arm(clipRuns: number, sequence?: number): void;
  /** Clip runs counted since arm(). 0 before the first arm — a tool that has
   *  not started has no clipping of its own. */
  runsSince(clipRuns: number, sequence?: number): number;
};

export function createClipBaseline(): ClipBaseline {
  let base: number | null = null;
  let lastSeq: number | null = null;
  return {
    arm(clipRuns, sequence) {
      base = Number.isFinite(clipRuns) && clipRuns > 0 ? clipRuns : 0;
      lastSeq = sequence != null && Number.isFinite(sequence) ? sequence : null;
    },
    runsSince(clipRuns, sequence) {
      if (base == null) return 0;
      if (!Number.isFinite(clipRuns) || clipRuns <= 0) {
        // A zeroed counter is a restarted capture: nothing inherited remains.
        if (clipRuns === 0) base = 0;
        if (sequence != null && Number.isFinite(sequence)) lastSeq = sequence;
        return 0;
      }
      const restarted = clipRuns < base || (sequence != null && lastSeq != null && sequence < lastSeq);
      if (sequence != null && Number.isFinite(sequence)) lastSeq = sequence;
      if (restarted) base = 0; // a new capture — every run it counted is new
      return clipRuns - base;
    },
  };
}
