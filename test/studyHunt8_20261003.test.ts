/**
 * STUDY area, toddler hunt 8 (2026-10-03).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed files
 * were copied aside, the HEAD ones written back, this file run, the fixes put
 * back and checked with cmp).
 *
 *   1. features/study/timeTrial.ts — `hasAccount()` read the session through
 *      `safeSession`, which answers a STALLED read and an offline token
 *      refresh (AuthRetryableFetchError, null session) as "signed out". A
 *      member whose 15:00 trial ended offline — the case the credit retry
 *      exists for — was marked 'no_account': `credit_time_trial` was never
 *      sent or retried, the method stayed uncleared, and the panel told them
 *      to sign in. "Could not tell" now goes on to the credit as before.
 *   2. features/enrollment/enrollmentStore.ts — scheduleServerSync returned
 *      on the same "signed out" answer with NO retry, so an ENROLL tapped
 *      while the session read stalled / could not refresh never reached
 *      `sync_my_enrollments`, and the server master list (which gates study
 *      and the quiz) refused that topic until some later edit. It now takes
 *      the retry backoff like any other failed sync.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const g = globalThis as Record<string, unknown>;
g.__H8_STORE__ = new Map<string, string>();
g.__H8_RPC__ = [] as { fn: string; args: unknown }[];
/** Queued getSession answers; when empty, a real signed-in session. */
g.__H8_SESSIONS__ = [] as unknown[];
const REAL = { data: { session: { user: { id: 'u1', is_anonymous: false } } }, error: null };
const OFFLINE_REFRESH = { data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } };

const STORAGE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`const s = globalThis.__H8_STORE__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, v); },
    async removeItem(k) { s.delete(k); },
  };`);
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`const REAL = ${JSON.stringify(REAL)};
  export const supabase = {
    auth: { async getSession() { const q = globalThis.__H8_SESSIONS__; return q.length ? q.shift() : REAL; } },
    async rpc(fn, args) { globalThis.__H8_RPC__.push({ fn, args }); return { data: null, error: null }; },
    from() { return { select() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; },
  };`);
const PACE_STUB = 'data:text/javascript,' + encodeURIComponent(`export const SEC_PER_Q = { quiz: 20 };`);
const SYNC_STUB = 'data:text/javascript,' + encodeURIComponent(`export function emitStudyProgress() {}`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_STUB, shortCircuit: true };
    if (context.parentURL?.includes('features/study/timeTrial')) {
      if (specifier === './paceStore') return { url: PACE_STUB, shortCircuit: true };
      if (specifier === './sync') return { url: SYNC_STUB, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rpcs = () => g.__H8_RPC__ as { fn: string; args: unknown }[];

test('a time-trial pass that ends offline (token refresh unreachable) is still credited', async () => {
  const tt = await import('../src/features/study/timeTrial.ts');
  rpcs().length = 0;
  (g.__H8_SESSIONS__ as unknown[]).push(OFFLINE_REFRESH);
  tt.startTimeTrial('fill_in_blank', 'topic-A');
  for (let i = 0; i < tt.TIME_TRIAL_NEEDED; i++) tt.registerTrialAnswer('fill_in_blank', true, 'topic-A');
  const realNow = Date.now;
  Date.now = () => realNow() + (tt.TIME_TRIAL_SECONDS + 5) * 1000; // the clock reaches 0:00
  try {
    await sleep(1300); // the trial's 1 s tick finalizes it
  } finally {
    Date.now = realNow;
  }
  await sleep(50);
  tt.resetTimeTrials();
  assert.ok(
    rpcs().some((c) => c.fn === 'credit_time_trial'),
    'an unreadable session is "could not tell", not "no account" — the pass must be sent',
  );
});

test('an ENROLL tapped while the session read cannot refresh still reaches the server list', async () => {
  const es = await import('../src/features/enrollment/enrollmentStore.ts');
  await es.getEnrollment(); // hydrate (seeded free topics)
  await sleep(1200); // let any seed sync settle
  rpcs().length = 0;
  (g.__H8_SESSIONS__ as unknown[]).length = 0;
  (g.__H8_SESSIONS__ as unknown[]).push(OFFLINE_REFRESH);
  await es.addTopic(4200);
  await sleep(800 + 1500 + 600); // debounce, the failed read, the first retry
  const pushes = rpcs().filter((c) => c.fn === 'sync_my_enrollments');
  assert.ok(pushes.length >= 1, 'the sync must retry, not treat an unreadable session as a guest');
  const items = (pushes[pushes.length - 1].args as { p_items: { gs: number }[] }).p_items;
  assert.ok(items.some((i) => i.gs === 4200), 'the pushed list carries the new topic');
});
