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

// ── NO SIGNAL — the other per-run verdict ───────────────────────────────────
// Lives here, beside the per-run clip baseline, rather than in a file of its
// own: useDspEngine sits in the app-start graph and that graph is capped
// (perfStartTrim_20261004), so a new module there costs a start-up slot.

/**
 * noSignal — the verdict for a capture that OPENED but never delivered a live
 * frame (iPad pass 2026-10-07).
 *
 * ⛔ OWNER iPAD REPORT 2026-10-06: "Most audio tools are not working.
 * Spectrogram and SPL wheel meter both did not work at all."
 *
 * Every dead-capture check the tools had measured a gap FROM THE LAST LIVE
 * FRAME (the SPL meter's STALE_FRAME_MS, the spectrogram's live gate). A
 * capture that reports RUNNING but whose mic tap never delivers a single
 * buffer has no last live frame — so nothing ever fired: the SPL meter sat on
 * blank readouts and the spectrogram on "waiting for first spectrum frames…"
 * forever, with no message and no way forward. That is exactly "did not work
 * at all".
 *
 * Now: running for NO_SIGNAL_MS without one live frame is a failure the
 * screen states plainly, with TRY AGAIN (EngineGate's `noSignal`). The window
 * covers two turns of the native recovery watchdog (2 s each), so a capture
 * the native side heals by itself never shows the card.
 */
export const NO_SIGNAL_MS = 4000;

/** True once a capture has been RUNNING for NO_SIGNAL_MS without ever
 *  delivering a live frame. `runningSinceMs` 0 = not running. */
export function noSignalVerdict(runningSinceMs: number, nowMs: number, sawLive: boolean): boolean {
  if (sawLive || runningSinceMs <= 0) return false;
  return nowMs - runningSinceMs >= NO_SIGNAL_MS;
}
