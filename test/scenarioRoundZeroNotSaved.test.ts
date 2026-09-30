/**
 * A `complete_scenario_round` that wrote NOTHING must not be reported as saved.
 *
 * The RPC returns 0 — with no error — when it does nothing (no auth uid, no
 * `users` row yet on a cold start, no homework row), and its own comment says
 * "the client retries". The client read `Number(data) || round`, which turned 0
 * into the round number: the round was reported saved and never queued, so it
 * was never retried and the scenarios meter / quiz gate never moved.
 * (Bug pass 2026-09-30.)
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it, beforeEach } from 'node:test';
import { fileURLToPath } from 'node:url';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) {
      return { url: new URL('./_stub-supabase-rpc.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === './sync') {
      return { url: new URL('./_stub-sync.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const setRpc = (fn: (name: string) => { data: unknown; error: unknown }) => {
  (globalThis as Record<string, unknown>).__RPC__ = fn;
};

const { completeScenarioRound, pendingScenarioCount } = await import('../src/features/study/scenarioHomework.ts');

describe('completeScenarioRound', () => {
  beforeEach(() => store.clear());

  it('a 0 reply (server wrote nothing) is NOT saved, and the call is queued for retry', async () => {
    setRpc(() => ({ data: 0, error: null }));
    const r = await completeScenarioRound('topic-a', 2);
    assert.equal(r.saved, false, 'a round the server did not record must not be reported saved');
    assert.equal(await pendingScenarioCount(), 1, 'it must be queued so it is retried');
  });

  it('a real rounds_completed reply is saved', async () => {
    setRpc(() => ({ data: 2, error: null }));
    const r = await completeScenarioRound('topic-a', 2);
    assert.deepEqual(r, { roundsCompleted: 2, saved: true });
    assert.equal(await pendingScenarioCount(), 0);
  });

  it('an RPC error is still not saved', async () => {
    setRpc(() => ({ data: null, error: { message: 'boom' } }));
    const r = await completeScenarioRound('topic-a', 1);
    assert.equal(r.saved, false);
  });
});
