/**
 * Applying an OTA on the launch that downloads it.
 *
 * ⛔ THIS FILE EXISTS BECAUSE THE FIRST VERSION CRASHED A PRODUCTION BUILD.
 * Sentry, iPhone 15 Pro Max / iOS 27, 1.0.0 (24): EXC_BAD_ACCESS on the JS
 * thread inside `RuntimeScheduler_Modern::updateRendering`, two update-server
 * requests 100ms apart immediately before it. The old code ran its own check
 * and fetch alongside the native downloader and called `reloadAsync()` the
 * instant it returned — tearing the runtime down mid-render.
 *
 * So the two properties that matter are not "does it update": they are
 * IT MUST NOT FETCH, and IT MUST NOT RELOAD INLINE.
 *
 * ⛔ AND A THIRD (Sentry APE-STUDIO-D again, build 32, 2026-10-05: same frame,
 * 40 ms after the native download finished, on Splash): IT MUST NEVER RELOAD
 * WHILE THE APP IS IN THE FOREGROUND. A deferred reload still landed in a tick
 * that ended in updateRendering on a runtime being torn down. The reload now
 * waits for the app to go to the background.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { watchForPendingUpdate } = await import('../src/features/updates/autoUpdate.ts');

function rig(opts: { isEnabled?: boolean; pendingNow?: boolean; deferSettle?: boolean; background?: boolean } = {}) {
  let t = 0;
  let fire: (() => void) | null = null;
  let bgFire: (() => void) | null = null;
  let background = opts.background ?? false;
  const calls = { subscribe: 0, unsubscribe: 0, bgSubscribe: 0, bgUnsubscribe: 0, settle: 0, reload: 0 };
  const outcomes: string[] = [];
  const settleQueue: (() => void)[] = [];
  return {
    calls,
    outcomes,
    advance: (ms: number) => { t += ms; },
    /** The native downloader reporting a pending update. */
    nativeReportsPending: () => fire?.(),
    /** The app going to the background (AppState 'background'). */
    goBackground: () => { background = true; bgFire?.(); },
    /** Run whatever was handed to settle (runSoon in the app). */
    runSettled: () => { settleQueue.splice(0).forEach((f) => f()); },
    deps: {
      isEnabled: opts.isEnabled ?? true,
      pendingNow: () => opts.pendingNow ?? false,
      onPending: (cb: () => void) => {
        calls.subscribe++;
        fire = cb;
        return () => { calls.unsubscribe++; fire = null; };
      },
      isBackground: () => background,
      onBackground: (cb: () => void) => {
        calls.bgSubscribe++;
        bgFire = cb;
        return () => { calls.bgUnsubscribe++; bgFire = null; };
      },
      settle: (cb: () => void) => {
        calls.settle++;
        if (opts.deferSettle) settleQueue.push(cb);
        else cb();
      },
      reload: async () => { calls.reload++; },
      now: () => t,
      onOutcome: (o: string) => outcomes.push(o),
    },
  };
}

describe('watchForPendingUpdate', () => {
  it('⛔ never fetches — it has no way to. That race was the crash.', () => {
    // The dependency surface is the guarantee: there is no check and no fetch
    // to call. If someone adds one, this test stops compiling, which is the
    // point.
    const r = rig();
    watchForPendingUpdate(r.deps);
    assert.ok(!('check' in r.deps), 'a check() dependency must not exist');
    assert.ok(!('fetch' in r.deps), 'a fetch() dependency must not exist');
  });

  it('⛔ NEVER reloads while the app is in the foreground (APE-STUDIO-D, build 32)', () => {
    const r = rig();
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    assert.equal(r.calls.settle, 0, 'nothing may even be scheduled while the app is on screen');
    assert.equal(r.calls.reload, 0, 'a foreground reload is the updateRendering crash');
    assert.ok(r.outcomes.includes('waiting'));
  });

  it('reloads the next time the app goes to the background', () => {
    const r = rig();
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    r.advance(5 * 60_000); // they keep studying for five minutes, then leave
    r.goBackground();
    assert.equal(r.calls.reload, 1);
    assert.ok(r.outcomes.includes('reloaded'));
  });

  it('reloads straight away when the bundle lands while already in the background', () => {
    const r = rig({ background: true });
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    assert.equal(r.calls.reload, 1);
    assert.equal(r.calls.bgSubscribe, 0, 'no need to wait for a background it is already in');
  });

  it('⛔ never reloads inline — always through settle()', () => {
    const r = rig({ deferSettle: true });
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    r.goBackground();
    assert.equal(r.calls.settle, 1, 'must hand the reload to settle');
    assert.equal(r.calls.reload, 0, 'must NOT have reloaded yet — that is the mid-render crash');
    r.runSettled();
    assert.equal(r.calls.reload, 1);
  });

  it('keeps a slow download for the next cold launch — no reload, not even in the background', () => {
    const r = rig();
    watchForPendingUpdate(r.deps);
    r.advance(60_000);
    r.nativeReportsPending();
    r.goBackground();
    assert.equal(r.calls.reload, 0);
    assert.ok(r.outcomes.includes('deferred'));
    assert.equal(r.calls.bgSubscribe, 0);
  });

  it('reloads only ONCE however many times the native state or the app state changes', () => {
    const r = rig();
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    r.nativeReportsPending();
    r.goBackground();
    r.goBackground();
    r.nativeReportsPending();
    assert.equal(r.calls.reload, 1);
    assert.equal(r.calls.bgUnsubscribe, 1, 'the background listener is dropped once it has fired');
  });

  it('is inert in dev, and subscribes to nothing', () => {
    const r = rig({ isEnabled: false });
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    r.goBackground();
    assert.deepEqual(r.calls, { subscribe: 0, unsubscribe: 0, bgSubscribe: 0, bgUnsubscribe: 0, settle: 0, reload: 0 });
    assert.deepEqual(r.outcomes, ['disabled']);
  });

  it('unsubscribes everything, and goes quiet after it has', () => {
    const r = rig();
    const stop = watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    stop();
    assert.equal(r.calls.unsubscribe, 1);
    assert.equal(r.calls.bgUnsubscribe, 1);
    r.goBackground();
    assert.equal(r.calls.reload, 0, 'a late app-state event must not reload a torn-down screen');
  });

  it('survives a reload that rejects', async () => {
    const r = rig();
    const deps = { ...r.deps, reload: async () => { throw new Error('refused'); } };
    watchForPendingUpdate(deps);
    r.nativeReportsPending();
    r.goBackground();
    await new Promise((res) => setTimeout(res, 0));
    assert.ok(r.outcomes.includes('failed'));
  });

  it('the app wiring reloads only from AppState "background" and chains nothing after reloadAsync', () => {
    const wiring = readFileSync(new URL('../src/features/updates/startAutoUpdate.ts', import.meta.url), 'utf8');
    assert.match(wiring, /isBackground: \(\) => AppState\.currentState === 'background'/);
    assert.match(wiring, /if \(s === 'background'\) cb\(\);/);
    assert.doesNotMatch(wiring, /checkForUpdateAsync\(|fetchUpdateAsync\(/);
    const rules = readFileSync(new URL('../src/features/updates/autoUpdate.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(rules, /reload\(\)\.then\(/, 'no continuation may be scheduled on a runtime being torn down');
  });
});

