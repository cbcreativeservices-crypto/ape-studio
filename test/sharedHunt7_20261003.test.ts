/**
 * Shared area, hunt 7 (2026-10-03) — receipts.
 *
 * 1 · safeSessionResult: auth-js does NOT reject when the token refresh cannot
 *     reach the server. An expired access token on a dead connection resolves
 *     `{ data: { session: null }, error: AuthRetryableFetchError }` (the
 *     session stays stored — GoTrueClient.__loadSession). Final round D's
 *     `timedOut` only caught a stall or a rejection, so an offline signed-in
 *     member was still told "sign in" (Redeem), "no Academy sign-in" (Tube
 *     reference) and "create a free account" (award progress).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

type Fn = (p: Promise<unknown>, w: string) => Promise<{ result: unknown; timedOut: boolean }>;

async function load(): Promise<Fn> {
  const mod = (await import('../src/lib/getSessionSafe.ts')) as Record<string, unknown>;
  return mod.safeSessionResult as Fn;
}

function retryable(): Error {
  const e = new Error('Failed to fetch');
  e.name = 'AuthRetryableFetchError';
  return e;
}

test('1 · a refresh that could not reach the server is an unknown identity, not a sign-out', async () => {
  const fn = await load();
  const r = await fn(Promise.resolve({ data: { session: null }, error: retryable() }), 'test');
  assert.equal(r.timedOut, true);
});

test('1 · a dead refresh token (non-retryable error) is still a real sign-out', async () => {
  const fn = await load();
  const dead = new Error('Invalid Refresh Token');
  dead.name = 'AuthApiError';
  const r = await fn(Promise.resolve({ data: { session: null }, error: dead }), 'test');
  assert.equal(r.timedOut, false);
});

test('1 · plain signed-out and signed-in reads are unchanged', async () => {
  const fn = await load();
  assert.equal((await fn(Promise.resolve({ data: { session: null }, error: null }), 'test')).timedOut, false);
  assert.equal((await fn(Promise.resolve({ data: { session: { user: {} } }, error: null }), 'test')).timedOut, false);
  // A session handed back WITH an error is still a session (never "unknown").
  assert.equal((await fn(Promise.resolve({ data: { session: { user: {} } }, error: retryable() }), 'test')).timedOut, false);
});
