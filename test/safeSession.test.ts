/**
 * A stalled session read must not hang the caller.
 *
 * ⛔ WHAT THIS PINS. `getSession()` reads the native secure store, and that
 * read can STALL rather than fail — the promise never settles, so a `.catch()`
 * is useless. SplashScreen hit this in QA Wave D (2026-09-10) and its comment
 * names the symptom: "a stalled native secure-store read would leave
 * `await sessionP` pending forever and freeze the app on Splash."
 *
 * It was fixed there and nowhere else. Sixteen other call sites awaited it
 * unguarded, three of which gate a screen's only load — Flashcards (inside a
 * Promise.all of seven, so one stall leaves the screen with no cards and no
 * error), the Dashboard, and Home. A stall there throws nothing, so no error
 * boundary catches it and no message appears: the screen simply never
 * finishes, which a user reports as "it froze" — and since the cause is a
 * stored value, reopening reproduces it exactly.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeSession, hasSafeSession, SESSION_TIMEOUT_MS } from '../src/lib/getSessionSafe.ts';

const SESSION = { data: { session: { user: { id: 'u1' } } } };

test('a resolved session passes straight through', async () => {
  const out = await safeSession(Promise.resolve(SESSION), 'test');
  assert.deepEqual(out, SESSION);
  assert.equal(await hasSafeSession(Promise.resolve(SESSION), 'test'), true);
});

test('a REJECTED read falls back to no session instead of throwing', async () => {
  const out = await safeSession(Promise.reject(new Error('keychain unavailable')), 'test');
  assert.equal(out.data.session, null);
});

test('a STALLED read resolves rather than hanging — the whole point', async () => {
  // A promise that never settles. Before this helper, awaiting it froze the
  // screen permanently; the test would hang here rather than fail.
  const never = new Promise<typeof SESSION>(() => {});
  const started = Date.now();
  const out = await safeSession(never, 'test');
  const waited = Date.now() - started;

  assert.equal(out.data.session, null, 'a stall must read as signed out, never as entitled');
  assert.ok(waited >= SESSION_TIMEOUT_MS - 250, `resolved too early (${waited}ms)`);
  assert.ok(waited < SESSION_TIMEOUT_MS + 2000, `took far too long (${waited}ms)`);
});

test('the timeout fails SAFE — a stall is never reported as signed in', async () => {
  const never = new Promise<typeof SESSION>(() => {});
  assert.equal(await hasSafeSession(never, 'test'), false);
});

test('a slow-but-working read still wins', async () => {
  const slow = new Promise<typeof SESSION>((r) => setTimeout(() => r(SESSION), 200));
  const out = await safeSession(slow, 'test');
  assert.deepEqual(out.data.session, SESSION.data.session, 'a 200ms read must not be discarded');
});
