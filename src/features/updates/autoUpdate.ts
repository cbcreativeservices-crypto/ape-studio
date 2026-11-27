/**
 * Apply an over-the-air update on the launch that downloads it — safely.
 *
 * ⛔ THE FIRST VERSION OF THIS CRASHED THE OWNER'S PHONE. Read this before
 * changing anything here.
 *
 * Sentry, iPhone 15 Pro Max / iOS 27.0, release 1.0.0 (24), 2026-09-19:
 *
 *     EXC_BAD_ACCESS · SIGSEGV · fatal · unhandled
 *     thread com.facebook.react.runtime.JavaScript
 *     facebook::react::RuntimeScheduler_Modern::updateRendering
 *                                      ← runEventLoopTick ← runEventLoop
 *
 * and in the breadcrumbs, in the two seconds before it:
 *
 *     22:33:56.8  GET assets.eascdn.net        18.7 MB   ← native startup
 *     22:33:59.1  GET u.expo.dev              [200]      ← a SECOND check
 *     22:33:59.2  GET u.expo.dev              [200]      ← 100ms later
 *     22:33:59.0  CRASH
 *
 * The native module already checks on every launch (`checkAutomatically` is
 * "always"). The old code ran its OWN check and fetch on top of that, then
 * called `reloadAsync()` the moment it returned — so the JS runtime was torn
 * down from underneath React while it was mid-render, in `updateRendering`.
 * Two downloaders racing, and a teardown at the worst possible instant.
 *
 * ── SO THIS VERSION DOES NOT CHECK, AND DOES NOT FETCH ─────────────────────
 * It only LISTENS. The native layer downloads exactly as it always did; when
 * it reports an update pending, and only then, we reload. No second request,
 * nothing to race with.
 *
 * ⛔ AND THE RELOAD IS DEFERRED, NEVER IMMEDIATE. `reloadAsync()` during the
 * first render is what the crash actually was. `settle()` hands the reload to
 * the caller to run after interactions, off the render path.
 *
 * ⛔ STARTUP ONLY. Past `RELOAD_WINDOW_MS` a person is using the app and a
 * restart would take their work with it. The update stays downloaded and
 * applies on the next launch — the behaviour before any of this, so the late
 * path is never worse than what we had.
 *
 * ⚠️ IMPORTS NOTHING. `expo-updates` is native and the test runner cannot
 * resolve it, so a file that imported it could not be tested at all. The
 * wiring is in `startAutoUpdate.ts`.
 */

/** How long after launch a found update still counts as "this launch's". */
const RELOAD_WINDOW_MS = 12_000;

/*
 * ⛔ AND IT CRASHED AGAIN — Sentry APE-STUDIO-D, build 1.0.0 (32), 2026-10-05,
 * iPhone 17 Pro / iOS 26.6.2, two users across builds 24 and 32: the same
 * EXC_BAD_ACCESS in RuntimeScheduler_Modern::updateRendering, 40 ms after the
 * native downloader finished a 21 MB launch asset, on the Splash screen, 3 s
 * after launch. Build 32 ran the "listen, then reload after interactions"
 * version above, with `InteractionManager` — a same-tick microtask in RN 0.86
 * — so the reload still landed inside the tick whose updateRendering then ran
 * on a runtime being torn down. `runSoon` (a real macrotask, 2026-10-04) only
 * moves the call to the NEXT tick; that tick ends in updateRendering too, and
 * expo-updates tears the host down from the main thread (RelaunchProcedure →
 * RCTTriggerReloadCommandListeners) while the JS thread is still rendering
 * the busiest screen of the app's life: startup.
 *
 * ⛔ SO THE RELOAD NEVER RUNS WHILE THE APP IS IN THE FOREGROUND. An update the
 * native layer reports during the startup window is applied the next time the
 * app goes to the BACKGROUND: nothing is on screen, nobody is mid-gesture, no
 * startup render is in flight — and if anything still went wrong there, iOS
 * simply cold-launches the app next time instead of crashing it in front of
 * the person (or App Review). The tester still gets the new bundle on their
 * very next return. A late find (past the window) still waits for the next
 * cold launch, as before.
 */

/*
 * ⛔ AND NEVER IN THE MIDDLE OF A QUIZ, AN EXAM OR A PURCHASE (fresh-install update
 * audit, 2026-11-27). Going to the background does not end those: a quiz counts a
 * short leave as a focus loss and carries on, and Android's Play sheet sends the
 * app to the background while the person pays. A reload there threw the attempt
 * away. Those flows take a hold (the reload hold, autoUpdate.ts); a background visit while a hold is
 * out is skipped ('held') and the watcher waits for a later one. If none comes
 * free, the update applies on the next cold launch, as it always could.
 */
export type AutoUpdateOutcome = 'disabled' | 'none' | 'waiting' | 'held' | 'reloaded' | 'deferred' | 'failed';

/**
 * The once-per-launch diagnostic (fresh-install update audit, 2026-11-27): is this
 * launch running the bundle inside the store build, a downloaded update, or the
 * emergency fallback after a crash — and how old is that bundle? Enum-shaped props
 * only (telemetry scrub.ts); no update id, no device id. A missing date is a
 * legitimate case and is left out, never guessed.
 */
export function launchEventProps(l: {
  isEmbedded: boolean;
  isEmergency: boolean;
  channel: string | null;
  createdAt: Date | null;
  nowMs: number;
}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {
    embedded: l.isEmbedded,
    emergency: l.isEmergency,
    channel: l.channel?.trim() || 'none',
  };
  const t = l.createdAt?.getTime();
  if (t != null && Number.isFinite(t) && t <= l.nowMs) {
    out.bundle_age_days = Math.floor((l.nowMs - t) / 86_400_000);
  }
  return out;
}

/**
 * Wait for the NATIVE downloader to report a pending update, then reload the
 * next time the app is in the background.
 *
 * @param onPending subscribe to the native state; call back when an update is
 *   pending. Returns an unsubscribe.
 * @param isBackground true while the app is in the background.
 * @param onBackground subscribe to the app going to the background. Returns an
 *   unsubscribe.
 * @param settle run work off the render path (runSoon — a real macrotask — in the app).
 */
export function watchForPendingUpdate(deps: {
  isEnabled: boolean;
  /** True at call time — the native check may already have finished. */
  pendingNow: () => boolean;
  onPending: (cb: () => void) => () => void;
  isBackground: () => boolean;
  onBackground: (cb: () => void) => () => void;
  settle: (cb: () => void) => void;
  reload: () => Promise<void>;
  now: () => number;
  /** True while a quiz, exam or purchase must not be restarted (the reload hold, autoUpdate.ts). */
  isHeld?: () => boolean;
  onOutcome?: (o: AutoUpdateOutcome) => void;
}, windowMs: number = RELOAD_WINDOW_MS): () => void {
  if (!deps.isEnabled) {
    deps.onOutcome?.('disabled');
    return () => {};
  }

  const startedAt = deps.now();
  let found = false;
  let done = false;
  let unsubscribeBg: (() => void) | null = null;

  let heldReported = false;
  const reloadNow = () => {
    if (done) return;
    // A quiz, exam or purchase is in progress: not this background visit. Keep
    // listening — a later one may be free; if not, the next cold launch applies it.
    if (deps.isHeld?.()) {
      if (!heldReported) {
        heldReported = true;
        deps.onOutcome?.('held');
      }
      return;
    }
    done = true;
    unsubscribeBg?.();
    unsubscribeBg = null;
    // ⛔ Off the render path, and only ever from the background (see above).
    deps.settle(() => {
      // Said BEFORE the call: nothing should be scheduled to run on a runtime
      // that is being torn down. Only a refusal comes back.
      deps.onOutcome?.('reloaded');
      deps.reload().catch(() => deps.onOutcome?.('failed'));
    });
  };

  const onFound = () => {
    if (found || done) return;
    found = true;
    // ⛔ The window is checked HERE, when the native layer reports the bundle —
    // not when the download started. A 40 MB bundle on a slow connection
    // finishes long after the person has started reading; that one waits for
    // the next cold launch, as it always did.
    if (deps.now() - startedAt > windowMs) {
      done = true;
      deps.onOutcome?.('deferred');
      return;
    }
    if (deps.isBackground()) {
      reloadNow();
      // Held: wait for a later background visit like any other find.
      if (done) return;
    } else {
      deps.onOutcome?.('waiting');
    }
    unsubscribeBg = deps.onBackground(reloadNow);
  };

  const unsubscribe = deps.onPending(onFound);
  // The native check can beat us to it — a bundle downloaded on the previous
  // launch is already pending before anything subscribes.
  if (deps.pendingNow()) onFound();
  else if (!found) deps.onOutcome?.('none');

  return () => {
    done = true;
    unsubscribe();
    unsubscribeBg?.();
    unsubscribeBg = null;
  };
}

/*
 * ── "NOT NOW": THE RELOAD HOLD ──
 * "Not now" for the background OTA reload (fresh-install update audit, 2026-11-27).
 *
 * `watchForPendingUpdate` (below) applies an update found at startup the
 * next time the app goes to the BACKGROUND. That is safe for the JS runtime, but
 * it restarts the app — and a person can background the app in the middle of
 * something a restart would destroy:
 *  - a timed quiz or the final exam (they tolerate a short leave: QuizScreen /
 *    FinalExamScreen count it as a focus loss, they do not end the attempt);
 *  - a purchase or a restore (on Android the Play sheet is its own activity, so
 *    the app reports 'background' while the person is paying).
 *
 * A screen in one of those states takes a HOLD. While any hold is out, the
 * watcher skips the reload; the update stays downloaded and applies on the next
 * cold launch, exactly as it did before the watcher existed. Never worse.
 *
 */

const holds = new Map<number, string>();
let nextId = 1;
let sessionBlock: string | null = null;

/** Take a hold while `reason` is in progress. Returns the release; releasing twice is harmless. */
export function holdUpdateReload(reason: string): () => void {
  const id = nextId++;
  holds.set(id, reason);
  return () => {
    holds.delete(id);
  };
}

/**
 * No background reload for the rest of this run of the app. For flows whose end
 * the app does not reliably see (a purchase result arrives by listener, maybe
 * never). The next cold launch clears it — a module variable does not survive one.
 */
export function blockUpdateReloadForSession(reason: string): void {
  if (sessionBlock == null) sessionBlock = reason;
}

/** True while any hold or the session block is out. */
export function isUpdateReloadHeld(): boolean {
  return sessionBlock != null || holds.size > 0;
}

/** Tests only. */
export function clearUpdateReloadHoldsForTest(): void {
  holds.clear();
  sessionBlock = null;
  nextId = 1;
}
