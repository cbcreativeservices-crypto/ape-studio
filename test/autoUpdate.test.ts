/**
 * Applying an OTA on the launch that finds it.
 *
 * ⛔ WHY IT MATTERS THAT THIS IS RIGHT. A reload discards JS state. Get the
 * window wrong and the app restarts under someone mid-task; skip the reload
 * and we are back to the open-wait-kill-open dance that cost the owner an
 * afternoon and sent them to TestFlight looking for a JavaScript update.
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

const { runAutoUpdate } = await import('../src/features/updates/autoUpdate.ts');

/** A clock the test moves by hand, so no test ever waits. */
function rig(opts: { available?: boolean; checkMs?: number; fetchMs?: number; throwOn?: 'check' | 'fetch' | 'reload' } = {}) {
  let t = 0;
  const calls = { check: 0, fetch: 0, reload: 0 };
  return {
    calls,
    deps: {
      isEnabled: true,
      now: () => t,
      check: async () => {
        calls.check++;
        if (opts.throwOn === 'check') throw new Error('offline');
        t += opts.checkMs ?? 0;
        return { isAvailable: opts.available ?? false };
      },
      fetch: async () => {
        calls.fetch++;
        if (opts.throwOn === 'fetch') throw new Error('download failed');
        t += opts.fetchMs ?? 0;
        return {};
      },
      reload: async () => {
        calls.reload++;
        if (opts.throwOn === 'reload') throw new Error('reload refused');
      },
    },
  };
}

describe('runAutoUpdate', () => {
  it('downloads and reloads when an update is waiting', async () => {
    const r = rig({ available: true, checkMs: 400, fetchMs: 2000 });
    assert.equal(await runAutoUpdate(r.deps), 'reloaded');
    assert.deepEqual(r.calls, { check: 1, fetch: 1, reload: 1 });
  });

  it('does nothing at all when already current', async () => {
    const r = rig({ available: false });
    assert.equal(await runAutoUpdate(r.deps), 'current');
    assert.equal(r.calls.fetch, 0, 'must not download when there is nothing new');
    assert.equal(r.calls.reload, 0, 'must never reload without an update');
  });

  it('⛔ keeps a slow update but does NOT reload into it', async () => {
    // The whole safety argument: past the window someone may be using the
    // app, so the bundle waits for the next launch — the old behaviour, which
    // is never worse than what we had.
    const r = rig({ available: true, fetchMs: 60_000 });
    assert.equal(await runAutoUpdate(r.deps), 'deferred');
    assert.equal(r.calls.fetch, 1, 'the download is still kept');
    assert.equal(r.calls.reload, 0, 'but nothing restarts under the user');
  });

  it('counts a slow CHECK against the window too, not just the download', async () => {
    const r = rig({ available: true, checkMs: 30_000, fetchMs: 100 });
    assert.equal(await runAutoUpdate(r.deps), 'deferred');
    assert.equal(r.calls.reload, 0);
  });

  it('is inert in dev, where the native module is disabled', async () => {
    const r = rig({ available: true });
    assert.equal(await runAutoUpdate({ ...r.deps, isEnabled: false }), 'disabled');
    assert.deepEqual(r.calls, { check: 0, fetch: 0, reload: 0 }, 'must not touch expo-updates at all');
  });

  it('never lets a failure escape into the launch path', async () => {
    for (const stage of ['check', 'fetch', 'reload'] as const) {
      const r = rig({ available: true, throwOn: stage });
      assert.equal(await runAutoUpdate(r.deps), 'failed', `${stage} threw and was not contained`);
    }
  });

  it('cannot loop: a current app performs no work', async () => {
    // After a reload the new bundle is the running one, so the next launch
    // takes this path. Nothing to reset, no counter to keep.
    const r = rig({ available: false });
    for (let i = 0; i < 5; i++) await runAutoUpdate(r.deps);
    assert.equal(r.calls.reload, 0);
    assert.equal(r.calls.check, 5);
  });
});
