/**
 * "Do this soon, off the current render" — the replacement for
 * `InteractionManager.runAfterInteractions` (RN research, 2026-10-04).
 *
 * In RN 0.86 bridgeless, InteractionManager is a deprecated stub on
 * `setImmediate`, which is shimmed with `queueMicrotask`: its callback ran in
 * the SAME tick, before the render step, and never waited for anything. Expo
 * SDK 58 (RN 0.88) removes it. This helper gives each call site the timing
 * its comment always claimed:
 *  - `runSoon(cb)` → a real macrotask (`setTimeout 0`), after the current
 *    render step. Use for "off the render path" and for work that should run
 *    as soon as possible.
 *  - `runSoon(cb, { idleTimeoutMs })` → when the JS thread is next idle
 *    (`requestIdleCallback`), and no later than `idleTimeoutMs`. Use for
 *    pre-warming that must not compete with a transition or first paint.
 *
 * A ratchet (test/afterInteractions_20261004.test.ts) bans InteractionManager
 * in src/.
 */
export type SoonHandle = { cancel: () => void };

type IdleApi = {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function runSoon(cb: () => void, opts?: { idleTimeoutMs?: number }): SoonHandle {
  const g = globalThis as unknown as IdleApi;
  if (
    opts?.idleTimeoutMs != null &&
    typeof g.requestIdleCallback === 'function' &&
    typeof g.cancelIdleCallback === 'function'
  ) {
    const cancelIdle = g.cancelIdleCallback;
    const id = g.requestIdleCallback(cb, { timeout: opts.idleTimeoutMs });
    return { cancel: () => cancelIdle(id) };
  }
  const t = setTimeout(cb, 0);
  return { cancel: () => clearTimeout(t) };
}
