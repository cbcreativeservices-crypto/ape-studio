/**
 * Single-flight — the guard that stops the glossary minting two device keys
 * for one tap (2026-09-13).
 *
 * ⚠️ THIS IS A REGRESSION TEST FOR SOMETHING THAT ACTUALLY HAPPENED, on the
 * first live run, on the owner's phone. Tapping AGREE called the mint directly;
 * it also wrote the consent record, and that re-render flipped the state
 * machine to 'mint', which fired a SECOND mint before the first had returned.
 * Two anonymous users, created 67 MICROSECONDS apart:
 *
 *   1dfb5b52-…  created_at 17:02:11.064976+00
 *   eacf36f6-…  created_at 17:02:11.064897+00
 *
 * The device keeps one session; the other is a real row in auth.users that
 * nobody is using and that survives until the nightly purge. Nothing in the app
 * looked wrong — which is exactly why it needs a test rather than a memory.
 *
 * The cases below pin the three properties that matter: concurrent callers get
 * ONE call, a later caller gets a NEW one (renewal after the 7-day purge must
 * still work), and a rejection does not wedge the slot forever.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { singleFlight } from '../src/features/glossary/deviceKeyState.ts';

/** A promise we can settle by hand, so the race is deterministic. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('concurrent callers share ONE call — the two-keys bug', async () => {
  const once = singleFlight<string>();
  const d = deferred<string>();
  let calls = 0;
  const run = () => {
    calls += 1;
    return d.promise;
  };

  const a = once(run);
  const b = once(run); // the state machine, racing the AGREE handler
  assert.equal(calls, 1, 'the second caller must not start a second mint');

  d.resolve('key-1');
  assert.equal(await a, 'key-1');
  assert.equal(await b, 'key-1', 'both callers see the same key');
});

test('a LATER call still runs — renewal after the 7-day purge', async () => {
  const once = singleFlight<string>();
  let calls = 0;
  const run = async () => {
    calls += 1;
    return `key-${calls}`;
  };

  assert.equal(await once(run), 'key-1');
  assert.equal(await once(run), 'key-2', 'one-at-a-time, not once-ever');
  assert.equal(calls, 2);
});

test('a rejection clears the slot instead of wedging it', async () => {
  const once = singleFlight<string>();
  const d = deferred<string>();
  let calls = 0;

  const failing = once(() => {
    calls += 1;
    return d.promise;
  });
  d.reject(new Error('network'));
  await assert.rejects(failing, /network/);

  // Without the rejection handler, this would hand back the dead promise and
  // the device could never obtain a key again for the life of the process.
  assert.equal(await once(async () => { calls += 1; return 'key-2'; }), 'key-2');
  assert.equal(calls, 2);
});

test('two independent single-flights do not share a slot', async () => {
  const a = singleFlight<string>();
  const b = singleFlight<string>();
  let calls = 0;
  const run = async () => {
    calls += 1;
    return 'x';
  };
  await Promise.all([a(run), b(run)]);
  assert.equal(calls, 2);
});
