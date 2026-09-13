/**
 * "Has this person got an ACCOUNT?" (owner 2026-09-13).
 *
 * The glossary asks a guest to accept a temporary device ID so the server can
 * meter their free definitions. That ID is a real Supabase session — an
 * anonymous one — so `!!session`, which twenty call sites used to mean "signed
 * in", stopped being the same question. This suite pins the distinction the
 * whole blast radius now depends on.
 *
 * Each case below corresponds to a place that would have broken silently: see
 * the list in `realAccount.ts`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGuestSession, isRealAccount } from '../src/features/commercial/realAccount.ts';

test('no session is no account', () => {
  assert.equal(isRealAccount(null), false);
  assert.equal(isRealAccount(undefined), false);
  assert.equal(isGuestSession(null), true);
});

test('an anonymous session is a GUEST, however real the session is', () => {
  const key = { user: { id: 'c0ffee', is_anonymous: true } };
  assert.equal(isRealAccount(key), false);
  assert.equal(isGuestSession(key), true);
});

test('a normal session is an account', () => {
  assert.equal(isRealAccount({ user: { id: 'u1', is_anonymous: false } }), true);
});

test('a session from a server that does not send the flag is an account', () => {
  // Older Supabase responses omit `is_anonymous` entirely. Defaulting those to
  // "guest" would sign every real member out of their own tier, so the test is
  // deliberately "anonymous only when it says so".
  assert.equal(isRealAccount({ user: { id: 'u1' } }), true);
  assert.equal(isRealAccount({ user: { id: 'u1', is_anonymous: null } }), true);
});

test('a malformed session is not promoted to an account', () => {
  assert.equal(isRealAccount({ user: null }), true); // a session with no user still signs requests
  assert.equal(isRealAccount({}), true);
});
