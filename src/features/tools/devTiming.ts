/**
 * Dev-only timing marks for the tools section (owner report 2026-09-05: a
 * tool's start screen took ~15 s to open on the phone). Nothing here runs in a
 * release build; in a dev client the marks print to Metro, which is where
 * Claude reads them — so the NEXT slow open says exactly where the time went:
 *   [tools] tap→navigate    — the tile's press hold + hub mic handoff
 *   [tools] navigate→mount  — React Navigation push + first render of the screen
 *   [tools] mic acquire     — the engine's warm adopt vs cold start
 *
 * And (2026-09-13, owner report: the SPL and tuner tiles "flicker occasionally")
 * the hub's shared capture, because the flicker is a SYMPTOM of the preview
 * engine restarting and we do not know why it restarts on a healthy phone:
 *   [hub] stall recovered   — capture stalled and came back WITHOUT a restart
 *   [hub] watchdog          — the stall lasted long enough to force one
 *   [hub] dark              — the displays actually rested, and for how long
 * Read these off Metro while the phone sits on the Tools hub doing nothing. The
 * question they answer is whether the watchdog fires constantly or rarely, and
 * whether the cause is the engine stopping or capture going quiet underneath it
 * — those are different faults and the log names them.
 */
let tapAt = 0;
let navAt = 0;
let tapTool = '';

export function markToolTap(tool: string): void {
  if (!__DEV__) return;
  tapAt = Date.now();
  navAt = 0;
  tapTool = tool;
}

export function markToolNavigate(tool: string): void {
  if (!__DEV__) return;
  navAt = Date.now();
  if (tapAt) console.log(`[tools] tap→navigate ${tool}: ${navAt - tapAt} ms`);
}

export function markToolMount(screen: string, tool: string): void {
  if (!__DEV__) return;
  const from = navAt || tapAt;
  if (!from || tool !== tapTool) return;
  console.log(`[tools] navigate→mount ${screen}(${tool}): ${Date.now() - from} ms (tap→mount ${Date.now() - tapAt} ms)`);
}

export function markMicAcquire(label: string, startedAt: number, outcome: string): void {
  if (!__DEV__) return;
  console.log(`[tools] mic acquire ${label}: ${Date.now() - startedAt} ms — ${outcome}`);
}

/* ── The hub's shared preview capture ──────────────────────────────────────
 * The tiles rest when frames stop, which is correct and honest; what is NOT
 * understood is why frames stop. These marks measure the gap the user sees,
 * and separate the three reasons the hub goes dark, because only one of them
 * is a fault:
 *   - the app was backgrounded or the screen lost focus  -> expected
 *   - the engine reports it is no longer running         -> a teardown race
 *   - the engine is running but capture has gone quiet   -> a dead mic session
 */
let stallStart = 0;
let stallReason = '';
let stallsRecovered = 0;
let watchdogTrips = 0;
let liveSince = 0;
let darkSince = 0;

/** Called every hub tick with the ALREADY-DECIDED stall verdict, so this can
 *  never disagree with the watchdog it is reporting on. */
export function markHubCaptureTick(stalled: boolean, reason: string): void {
  if (!__DEV__) return;
  if (stalled) {
    if (stallStart === 0) {
      stallStart = Date.now();
      stallReason = reason;
    }
    return;
  }
  if (stallStart !== 0) {
    // Came back on its own. These are the interesting ones: frequent recovered
    // stalls mean the watchdog threshold is the only thing standing between the
    // user and a restart, and it is one bad second away from tripping.
    stallsRecovered++;
    console.log(
      `[hub] stall recovered after ${Date.now() - stallStart} ms (${stallReason}) — ${stallsRecovered} this session`,
    );
    stallStart = 0;
  }
}

/** The watchdog forced a stop: 'retry' is the first cycle, 'lock' gives up. */
export function markHubWatchdog(action: 'retry' | 'lock', stalledTicks: number): void {
  if (!__DEV__) return;
  watchdogTrips++;
  const held = liveSince ? `${Date.now() - liveSince} ms of live capture before it` : 'no live capture yet';
  console.log(
    `[hub] watchdog ${action.toUpperCase()} after ${stalledTicks} stalled ticks (${stallReason || 'unknown'}) — ` +
      `${held}; trip ${watchdogTrips} this session`,
  );
  stallStart = 0;
}

/** The displays going live / resting — the window the user actually sees. */
export function markHubLive(live: boolean, why: { running: boolean; focused: boolean; foreground: boolean }): void {
  if (!__DEV__) return;
  if (live) {
    liveSince = Date.now();
    if (darkSince) {
      console.log(`[hub] dark for ${liveSince - darkSince} ms — displays live again`);
      darkSince = 0;
    }
    return;
  }
  if (darkSince) return; // already dark
  darkSince = Date.now();
  // Drop any stall in progress. The tick loop is torn down while the hub is
  // dark, so a stall timer left running would keep counting wall-clock through
  // a period when nothing was sampling - and then report, say, an 11 SECOND
  // stall that was really "the app was in the background". Stall durations must
  // only ever measure time the loop was actually ticking.
  stallStart = 0;
  // Name the cause, so an expected rest is never mistaken for the fault.
  //
  // ⚠️ "has not started YET" is not "has STOPPED". The hub defers start() by
  // 400 ms on entry, so the engine is legitimately not running on every single
  // mount. Reported as the fault, that line would cry wolf on every load and
  // the one that matters would be lost in it - so the engine-stopped case only
  // counts once capture has actually been live.
  const startingUp = liveSince === 0;
  const cause = !why.foreground
    ? 'app backgrounded (expected)'
    : !why.focused
      ? 'screen lost focus (expected)'
      : startingUp
        ? 'starting up (expected)'
        : !why.running
          ? 'ENGINE STOPPED WHILE IN USE — the fault being hunted'
          : 'unknown';
  const held = startingUp ? 'not yet started' : `${darkSince - liveSince} ms live`;
  console.log(`[hub] dark: ${cause} — after ${held}`);
}

/* ── The SPL tile's needle ─────────────────────────────────────────────────
 * Owner 2026-09-13: the SPL tile still "flickers with the old car gauge style"
 * after the tuner was fixed - and the hub capture marks above came back SILENT
 * through minutes of it sitting live, which rules out the watchdog restart and
 * the tick-0 teardown that were the leading theories. Three things could still
 * do it, and they need different fixes, so name which one actually happens:
 *
 *   MOUNT/UNMOUNT  the skin remounted. `vuRef` resets to 0, so the needle
 *                  restarts at the bottom and sweeps up to the live level over
 *                  about a second - the most gauge-like of the three, and it
 *                  leaves no other trace at all.
 *   RESET          a tick-0 reached the tile (needle snapped to rest). Should
 *                  be impossible without a matching `[hub] dark` line; if this
 *                  appears alone, the store is emitting EMPTY somewhere else.
 *   JUMP           the ballistic itself moved a long way in ONE tick, i.e. the
 *                  integration is skipping steps rather than the needle being
 *                  reset. That would point at renders being discarded, since
 *                  this component integrates during render.
 */
let splMarks = 0;
let splMountedAt = 0;

export function markSplNeedle(what: string): void {
  if (!__DEV__) return;
  splMarks++;
  // Rate-limit: a genuinely broken frame would otherwise print at the tick rate
  // and push everything else out of the Metro scrollback.
  if (splMarks > 40) return;
  console.log(`[spl] ${what}${splMarks === 40 ? ' — (further [spl] marks suppressed)' : ''}`);
}

export function markSplMount(mounted: boolean): void {
  if (!__DEV__) return;
  if (mounted) {
    const gap = splMountedAt ? ` — ${Date.now() - splMountedAt} ms after the last unmount` : '';
    splMountedAt = 0;
    markSplNeedle(`MOUNT: needle restarts at the bottom${gap}`);
    return;
  }
  splMountedAt = Date.now();
  markSplNeedle('UNMOUNT');
}
