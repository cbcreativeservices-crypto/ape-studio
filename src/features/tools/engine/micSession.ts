/**
 * micSession — the ONE shared capture-stream owner for the whole Tools &
 * Analysis section (perf rev 22, owner-approved warm-handoff design 2026-08-19).
 *
 * The problem it solves: opening a tool used to STOP the mic (hub teardown) and
 * then COLD-START it (the tool's own engine). Re-opening the audio HAL costs
 * SECONDS on Android (and is not free on iOS) — that was the 5-10 s tool-open.
 *
 * The key native fact: `ApeDsp.setEngineConfig()` is a live DSP reconfig that
 * does NOT touch capture — verified on both platforms (Android
 * nativeSetEngineConfig; iOS core.setEngineConfig — both separate from
 * start/stopCapture). So we can keep ONE capture stream warm across the section
 * and simply re-point its config for each tool.
 *
 * Mechanism: a refcount-free stream with a DEBOUNCED release. Blurring a tools
 * screen schedules a stop; the next tools screen that mounts within the window
 * CANCELS it — so the mic never actually stops between screens and the opened
 * tool ADOPTS the warm stream instantly. Leaving the section (nothing
 * re-acquires) lets the stop fire. An intermediate screen (ToolInfo) holds the
 * session across the user's dwell via holdMicWarm().
 *
 * Integrity: acquireMic only ADOPTS a stream that is actually alive; a stream
 * flagged open but with dead/stalled capture is torn down and restarted, so the
 * dead-capture watchdog (never present frozen frames as live, §1.7) still heals.
 * Permission is gated by the CALLER (useDspEngine) before acquire — this module
 * never prompts.
 */
import { ApeDsp, type EngineConfig } from '../../../../modules/ape-dsp';
import { setMicActive } from '../../audio/audioOutputStore';

/** Warm window. Must comfortably exceed the blur→(re)acquire gap across a push
 *  transition, including the opened tool's InteractionManager-deferred start. */
const RELEASE_DEBOUNCE_MS = 1500;

type StreamState = 'stopped' | 'starting' | 'open';
let streamState: StreamState = 'stopped';
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let startInFlight: Promise<void> | null = null;

function cancelPendingRelease(): void {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
}

function doStop(): void {
  cancelPendingRelease();
  if (streamState === 'stopped') return;
  streamState = 'stopped';
  setMicActive(false); // mic released → the feedback interlock disarms
  void ApeDsp.stop();
}

/** True when a currently-open stream is actually delivering live frames (not an
 *  externally-killed/stalled session masquerading as running). */
function captureAlive(): boolean {
  const m = ApeDsp.getMeterFrame();
  return !!m && m.running && !m.captureStalled;
}

/**
 * Ensure the shared stream is open with `cfg` applied, adopting a warm+alive
 * stream if one exists (instant — no HAL re-open). The caller MUST have secured
 * mic permission first. Resolves once capture is live; rejects if start fails.
 *
 * `forceRestart` tears the stream fully down and re-opens it even if it looks
 * warm — the HUB uses this on resume so it never adopts a stream that iOS is
 * reporting as running but has actually stopped delivering frames (the frozen-
 * preview bug on returning to the tools menu). Tools omit it and adopt.
 */
export async function acquireMic(cfg: EngineConfig, forceRestart = false): Promise<void> {
  cancelPendingRelease();
  ApeDsp.setEngineConfig(cfg); // live reconfig — cheap, never restarts capture
  if (forceRestart && streamState !== 'stopped') {
    // Race-safe hard reset: let any in-flight start settle, then fully stop
    // (awaited) so the fresh open below can't overlap a half-torn-down HAL.
    if (startInFlight) {
      try {
        await startInFlight;
      } catch {
        /* fall through to the stop + fresh start */
      }
    }
    streamState = 'stopped';
    startInFlight = null;
    await ApeDsp.stop();
  }
  if (streamState === 'open') {
    if (captureAlive()) {
      setMicActive(true);
      return;
    }
    // Flagged open but capture is dead — fall through to a real restart.
    streamState = 'stopped';
    void ApeDsp.stop();
  }
  if (streamState === 'starting') return startInFlight ?? Promise.resolve();
  streamState = 'starting';
  startInFlight = (async () => {
    try {
      await ApeDsp.start();
      streamState = 'open';
      setMicActive(true); // mic now capturing → the interlock arms
    } catch (e) {
      streamState = 'stopped';
      setMicActive(false);
      throw e;
    } finally {
      startInFlight = null;
    }
  })();
  return startInFlight;
}

/** Schedule a debounced stop. Cancelled if acquireMic/holdMicWarm lands within
 *  the window — that cancellation is what keeps the mic warm across navigation. */
export function releaseMic(): void {
  cancelPendingRelease();
  if (streamState === 'stopped') return;
  releaseTimer = setTimeout(doStop, RELEASE_DEBOUNCE_MS);
}

/** Stop capture immediately (backgrounding / a hard leave). */
export function releaseMicNow(): void {
  doStop();
}

/**
 * Cancel a pending release WITHOUT starting anything — an intermediate screen
 * (ToolInfo) holds an already-warm session across the user's dwell so the next
 * tool adopts it. Returns true if a warm stream is being held (false if the mic
 * was not open, e.g. permission declined — the tool then starts it on open).
 */
export function holdMicWarm(): boolean {
  if (streamState === 'stopped') return false;
  cancelPendingRelease();
  return true;
}

export function isMicOpen(): boolean {
  return streamState === 'open';
}
