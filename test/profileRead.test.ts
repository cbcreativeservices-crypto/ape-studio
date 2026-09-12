/**
 * Profile ID read classification (2026-09-13).
 *
 * The defect: `fetchProfile` threw ONE opaque `user_not_found` whether the read
 * failed or there was simply no account, and ProfileScreen turned every one of
 * those into "Couldn’t load your ID — check your connection." A GUEST has no
 * account, so every guest who opened Profile was told to fix a connection that
 * was fine, under a RETRY that could only fail again.
 *
 * ⚠️ WHAT THIS SUITE IS REALLY GUARDING. The first fix classified the guest by
 * ERROR CODE, on the assumption that RLS would filter `users` to zero rows and
 * `.single()` would report PGRST116. A probe in the running app proved that
 * wrong: a guest gets `42501 · permission denied for table users`, because
 * `anon` has no SELECT grant and the denial happens before RLS. 42501 is also
 * the code of the real GRANTs-dropped outage that hits SIGNED-IN users. So the
 * code cannot separate the two and the session check in `fetchProfile` is
 * load-bearing, not decoration. These cases pin what is left for the code to
 * decide once a session is known to exist.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyProfileRead } from '../src/features/profile/profileRead.ts';

const ROW = { id: 'u1', nickname: 'Anorak', first_name: 'C', last_name_initial: 'B', photo_url: null };

test('a row read back is a profile', () => {
  assert.equal(classifyProfileRead(null, ROW), 'profile');
});

test('42501 with a session is an OUTAGE, not a guest — it keeps the RETRY', () => {
  // The GRANTs-dropped incident (handoff standing rule 1). A retry after the
  // repair SQL genuinely fixes it, so the banner must stay. Misreading this as
  // "no account" would hide a live outage behind a blank card.
  assert.equal(
    classifyProfileRead({ code: '42501', message: 'permission denied for table users' }, null),
    'unavailable',
  );
});

test('other failures a retry can fix also keep the RETRY', () => {
  assert.equal(classifyProfileRead({ code: 'PGRST301', message: 'JWT expired' }, null), 'unavailable');
  // Transport: supabase-js resolves with an error carrying no PostgREST code.
  assert.equal(classifyProfileRead({ message: 'Network request failed' }, null), 'unavailable');
  assert.equal(classifyProfileRead({ code: null, message: 'fetch failed' }, null), 'unavailable');
});

test('PGRST116 — signed in, but no row — is an empty card, not an error', () => {
  // Nothing to retry: no amount of retrying conjures a `users` row.
  assert.equal(
    classifyProfileRead({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }, null),
    'none',
  );
});

test('an error WINS over a row, so a partial result is never shown as fact', () => {
  assert.equal(classifyProfileRead({ code: '42501', message: 'permission denied' }, ROW), 'unavailable');
});

test('no error and no row is an absence, not a failure', () => {
  assert.equal(classifyProfileRead(null, null), 'none');
  assert.equal(classifyProfileRead(null, undefined), 'none');
});
