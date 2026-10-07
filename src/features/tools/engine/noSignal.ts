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
