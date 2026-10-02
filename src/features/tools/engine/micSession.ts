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
/** Generation token for in-flight starts (the guard useDspEngine already uses
 *  as `genRef`). A cold HAL open costs 5-10 s on Android, while releaseMic()
 *  fires doStop() after 1500 ms — so leaving the section during a cold start
 *  used to let ApeDsp.start() resolve AFTER the stop and unconditionally set
 *  `streamState = 'open'` + setMicActive(true). That left a capture stream with
 *  no owner: nothing would ever release it, the OS mic indicator stayed lit,
 *  isSpeakerFeedbackMuted() silenced app audio app-wide, and exposureMonitor's
 *  1 Hz poller kept integrating against a dead stream (perf audit 2026-09-11).
 *  Bumping the token on every stop makes a superseded start close the stream it
 *  just opened instead of claiming it. Behaviour on every un-interrupted path is
 *  unchanged (the token still matches). */
let startGen = 0;
/** See micAcquireSeq(). */
let acquireSeq = 0;
/**
 * A native stop still closing the HAL (night pass 2 2026-10-01). Every stop
 * flips `streamState` to 'stopped' BEFORE ApeDsp.stop() settles, with no
 * start in flight — so an acquire landing inside that await (a tool opening
 * while the hub's forceRestart is closing the stream, or a quick return after
 * releaseMicNow) saw a clean 'stopped' and issued ApeDsp.start() while the
 * stop was still running. Natively the two interleave (iOS runs stop on the
 * main queue and start on a background one, each flipping desiredRunning), so
 * the late stop could kill the fresh stream we then flagged 'open' — RUNNING
 * over a dead mic. A fresh start now waits for this to settle first.
 */
let stopInFlight: Promise<void> | null = null;

/**
 * ⛔ A STOP THAT NEVER SETTLES MUST NOT BLOCK EVERY FUTURE START (night pass 3
 * 2026-10-01). Every acquire waits on `stopInFlight` (and the orphan path on a
 * start whose late close is awaited). A native stop that never resolved — a
 * wedged HAL, a bridge call lost across a reload — would have left the mic
 * unopenable for the rest of the app's life: each tool's START hit its 12 s
 * watchdog, TRY AGAIN joined the same dead wait. Capped: past this, the stop
 * is treated as done (a normal close takes well under a second). Overlapping
 * a truly wedged stop is the lesser harm; the dead-capture checks still catch
 * a stream it kills.
 */
const STOP_SETTLE_CAP_MS = 4000;

/** ApeDsp.stop(), tracked in `stopInFlight` until it settles or the cap
 *  passes. Never rejects. */
function closeStream(): Promise<void> {
  const p: Promise<void> = new Promise<void>((resolve) => {
    const cap = setTimeout(resolve, STOP_SETTLE_CAP_MS);
    const done = () => {
      clearTimeout(cap);
      resolve();
    };
    try {
      ApeDsp.stop().then(done, done); // a rejection = already dead, nothing more to close
    } catch {
      done();
    }
  }).finally(() => {
    if (stopInFlight === p) stopInFlight = null;
  });
  stopInFlight = p;
  return p;
}

/**
 * Was the session RELEASED while an acquire waited on a stop or an orphaned
 * start (full run 1, 2026-10-01)? The forceRestart path already asked this
 * (night pass 2); the three other waits did not. Back to a tool, then Home
 * again inside the wait (releaseMicNow), and the acquire still opened the mic
 * once the old stop settled — capture live in the BACKGROUND with the OS mic
 * indicator lit, for an owner that had already gone, until its debounced
 * release fired. A release bumps startGen and leaves nothing starting; a
 * rival acquire that started meanwhile leaves 'starting', which is joined.
 */
function releasedWhileWaiting(genBefore: number): boolean {
  return startGen !== genBefore && streamState === 'stopped' && !startInFlight;
}

function cancelPendingRelease(): void {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
}

function doStop(): void {
  cancelPendingRelease();
  startGen++; // any start still opening the HAL is now orphaned — disown it
  if (streamState === 'stopped') return;
  streamState = 'stopped';
  setMicActive(false); // mic released → the feedback interlock disarms
  void closeStream();
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
export function acquireMic(cfg: EngineConfig, forceRestart = false): Promise<void> {
  acquireSeq++;
  return acquireInner(cfg, forceRestart);
}

/**
 * How many acquires have been made, by ANY screen. A start superseded by its
 * own stop reads this to tell "nobody wants the stream" from "another screen
 * joined it": the hub's cold start, torn down by stopForNavigation() and then
 * JOINED by the opened tool, used to call releaseMic() when that shared start
 * resolved — arming the 1.5 s stop AFTER the tool's acquire had cancelled the
 * last one, so the mic died under a tool reading RUNNING (2026-09-30).
 */
export function micAcquireSeq(): number {
  return acquireSeq;
}

async function acquireInner(cfg: EngineConfig, forceRestart = false): Promise<void> {
  cancelPendingRelease();
  ApeDsp.setEngineConfig(cfg); // live reconfig — cheap, never restarts capture
  if (forceRestart && streamState !== 'stopped') {
    // Race-safe hard reset: let any in-flight start settle, then fully stop
    // (awaited) so the fresh open below can't overlap a half-torn-down HAL.
    //
    // Released while we wait / while this stop closes (the app backgrounded
    // mid-resume → releaseMicNow; night pass 2 2026-10-01): the owner is gone,
    // so do not reopen. The caller's own generation guard was bumped by that
    // same release.
    const genAtEntry = startGen;
    if (startInFlight) {
      try {
        await startInFlight;
      } catch {
        /* fall through to the stop + fresh start */
      }
      // Released during that wait: the release already stopped the stream.
      if (startGen !== genAtEntry && (streamState as StreamState) === 'stopped' && !startInFlight) return;
    }
    const genAtStop = startGen;
    streamState = 'stopped';
    startInFlight = null;
    await closeStream();
    if (startGen !== genAtStop) return;
  }
  if (streamState === 'open') {
    if (captureAlive()) {
      setMicActive(true);
      return;
    }
    // Flagged open but capture is dead — a real restart. The stop is AWAITED
    // (night pass 2026-10-01), like the forceRestart and orphan paths: fired
    // and forgotten, it raced the start() issued on the next line, and landing
    // second it killed the fresh stream we then flagged 'open' — the exact
    // RUNNING-over-a-dead-mic the orphan handling exists to prevent. Then
    // re-check from the top: another acquire may have started one meanwhile.
    // Tracked in stopInFlight (night pass 2): a second acquire landing inside
    // this await waits for the close instead of starting under it.
    streamState = 'stopped';
    const genAtRestart = startGen;
    await closeStream();
    if (releasedWhileWaiting(genAtRestart)) return;
    return acquireInner(cfg);
  }
  if (streamState === 'starting') return startInFlight ?? Promise.resolve();
  if (startInFlight) {
    // An ORPHANED start (a stop disowned it while the HAL was still opening —
    // Home pressed mid cold-open, then back). Starting again now let its late
    // `ApeDsp.stop()` land AFTER our start and kill the new stream, while we
    // flagged it 'open': a tool reading RUNNING over a dead mic. Let the orphan
    // close its stream first, then acquire afresh (re-checking the state).
    const genAtOrphan = startGen;
    try {
      await startInFlight;
    } catch {
      /* the orphan's failure is not ours */
    }
    if (releasedWhileWaiting(genAtOrphan)) return;
    return acquireInner(cfg);
  }
  if (stopInFlight) {
    // A stop is still closing the HAL (see stopInFlight). Let it finish, then
    // re-check from the top — whoever owned that stop may have started afresh.
    const genAtStopWait = startGen;
    await stopInFlight;
    if (releasedWhileWaiting(genAtStopWait)) return;
    return acquireInner(cfg);
  }
  streamState = 'starting';
  const myGen = ++startGen;
  // eslint-disable-next-line prefer-const -- read inside its own body's finally
  let attempt: Promise<void> | null = null;
  attempt = (async () => {
    try {
      await ApeDsp.start();
      if (myGen !== startGen) {
        // A stop landed while the HAL was still opening. The owner is gone, so
        // close the stream we just opened rather than flagging it open — see
        // the startGen docblock. Awaited, so a waiting acquire starts after it
        // — through closeStream, so a stop that never settles cannot hold this
        // start (and every acquire queued behind it) open forever.
        await closeStream();
        return;
      }
      streamState = 'open';
      setMicActive(true); // mic now capturing → the interlock arms
    } catch (e) {
      if (myGen === startGen) {
        streamState = 'stopped';
        setMicActive(false);
      }
      throw e;
    } finally {
      if (startInFlight === attempt) startInFlight = null;
    }
  })();
  startInFlight = attempt;
  return attempt;
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
