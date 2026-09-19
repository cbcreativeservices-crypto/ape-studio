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

/** How long after launch a reload is still unobtrusive. */
const RELOAD_WINDOW_MS = 12_000;

export type AutoUpdateOutcome = 'disabled' | 'none' | 'reloaded' | 'deferred' | 'failed';

/**
 * Wait for the NATIVE downloader to report a pending update, then reload.
 *
 * @param onPending subscribe to the native state; call back when an update is
 *   pending. Returns an unsubscribe.
 * @param settle run work off the render path (InteractionManager in the app).
 */
export function watchForPendingUpdate(deps: {
  isEnabled: boolean;
  /** True at call time — the native check may already have finished. */
  pendingNow: () => boolean;
  onPending: (cb: () => void) => () => void;
  settle: (cb: () => void) => void;
  reload: () => Promise<void>;
  now: () => number;
  onOutcome?: (o: AutoUpdateOutcome) => void;
}, windowMs: number = RELOAD_WINDOW_MS): () => void {
  if (!deps.isEnabled) {
    deps.onOutcome?.('disabled');
    return () => {};
  }

  const startedAt = deps.now();
  let done = false;

  const apply = () => {
    if (done) return;
    done = true;
    // ⛔ The window is checked HERE, at the moment of applying — not when the
    // download started. A 40MB bundle on a slow connection finishes long after
    // the user has started reading.
    if (deps.now() - startedAt > windowMs) {
      deps.onOutcome?.('deferred');
      return;
    }
    // ⛔ Off the render path. See the crash note above: this exact call, made
    // inline, tore the runtime down inside RuntimeScheduler::updateRendering.
    deps.settle(() => {
      deps.reload().then(
        () => deps.onOutcome?.('reloaded'),
        () => deps.onOutcome?.('failed'),
      );
    });
  };

  const unsubscribe = deps.onPending(apply);
  // The native check can beat us to it — a bundle downloaded on the previous
  // launch is already pending before anything subscribes.
  if (deps.pendingNow()) apply();
  else if (!done) deps.onOutcome?.('none');

  return () => {
    done = true;
    unsubscribe();
  };
}
