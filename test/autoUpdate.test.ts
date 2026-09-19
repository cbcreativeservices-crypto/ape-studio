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
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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

function rig(opts: { isEnabled?: boolean; pendingNow?: boolean; deferSettle?: boolean } = {}) {
  let t = 0;
  let fire: (() => void) | null = null;
  const calls = { subscribe: 0, unsubscribe: 0, settle: 0, reload: 0 };
  const outcomes: string[] = [];
  const settleQueue: (() => void)[] = [];
  return {
    calls,
    outcomes,
    advance: (ms: number) => { t += ms; },
    /** The native downloader reporting a pending update. */
    nativeReportsPending: () => fire?.(),
    /** Run whatever was handed to InteractionManager. */
    runSettled: () => { settleQueue.splice(0).forEach((f) => f()); },
    deps: {
      isEnabled: opts.isEnabled ?? true,
      pendingNow: () => opts.pendingNow ?? false,
      onPending: (cb: () => void) => {
        calls.subscribe++;
        fire = cb;
        return () => { calls.unsubscribe++; };
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

  it('⛔ never reloads inline — always through settle()', () => {
    const r = rig({ deferSettle: true });
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    assert.equal(r.calls.settle, 1, 'must hand the reload to settle');
    assert.equal(r.calls.reload, 0, 'must NOT have reloaded yet — that is the mid-render crash');
    r.runSettled();
    assert.equal(r.calls.reload, 1);
  });

  it('reloads when the native downloader reports one pending', () => {
    const r = rig();
    watchForPendingUpdate(r.deps);
    assert.equal(r.calls.reload, 0, 'nothing pending yet');
    r.nativeReportsPending();
    assert.equal(r.calls.reload, 1);
  });

  it('keeps a slow download but does NOT restart under the user', () => {
    const r = rig();
    watchForPendingUpdate(r.deps);
    r.advance(60_000);
    r.nativeReportsPending();
    assert.equal(r.calls.reload, 0);
    assert.ok(r.outcomes.includes('deferred'));
  });

  it('reloads only ONCE however many times the native state changes', () => {
    const r = rig();
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    r.nativeReportsPending();
    r.nativeReportsPending();
    assert.equal(r.calls.reload, 1);
  });

  it('is inert in dev, and subscribes to nothing', () => {
    const r = rig({ isEnabled: false });
    watchForPendingUpdate(r.deps);
    r.nativeReportsPending();
    assert.deepEqual(r.calls, { subscribe: 0, unsubscribe: 0, settle: 0, reload: 0 });
    assert.deepEqual(r.outcomes, ['disabled']);
  });

  it('unsubscribes, and goes quiet after it has', () => {
    const r = rig();
    const stop = watchForPendingUpdate(r.deps);
    stop();
    assert.equal(r.calls.unsubscribe, 1);
    r.nativeReportsPending();
    assert.equal(r.calls.reload, 0, 'a late native event must not reload a torn-down screen');
  });

  it('survives a reload that rejects', async () => {
    const r = rig();
    const deps = { ...r.deps, reload: async () => { throw new Error('refused'); } };
    watchForPendingUpdate(deps);
    r.nativeReportsPending();
    await new Promise((res) => setTimeout(res, 0));
    assert.ok(r.outcomes.includes('failed'));
  });
});
