/**
 * GUARD — every auth failure a real person can hit must SAY WHAT TO DO.
 *
 * ⛔ WHY THIS EXISTS. Owner, 2026-09-25: testers reported "never got the email".
 * The auth log explained it — in the previous 24 hours:
 *
 *     /signup 422  "Password is known to be weak…"   13
 *     /signup 200  (succeeded)                        7
 *
 * Nearly two thirds of everyone trying to create an account was rejected for a
 * breached password, and the copy never mentioned the password: that string
 * matched none of the mapped cases and fell through to the generic "We couldn't
 * complete that". So no account was created, and no email of any kind was ever
 * going to arrive. The report was accurate; the cause was on the signup screen.
 *
 * ⚠️ A CLIENT-SIDE RULE CANNOT PREVENT THIS. `passwordIssue()` checks shape —
 * 8 characters, a capital, a number — and "Password1" passes all three while
 * appearing in every breach corpus there is. Only the server knows. So the
 * mapping is the fix, and this guard is what keeps it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { friendlyAuthError, passwordIssue } from '../src/features/auth/authErrorCopy.ts';

/** Verbatim strings GoTrue/Supabase returns. */
const REAL_SUPABASE_ERRORS = [
  'Password is known to be weak and easy to guess, please choose a different one.',
  'Password should be at least 6 characters',
  'Invalid login credentials',
  'Email not confirmed',
  'Network request failed',
  'User already registered',
  'Email rate limit exceeded',
];

/** The fallback. Anything reaching a user with THIS text is unmapped. */
const GENERIC = friendlyAuthError({ message: 'something nobody has ever seen before xyzzy' });

test('the generic fallback exists and names a support route', () => {
  assert.ok(GENERIC && GENERIC.length > 0);
  assert.match(GENERIC!, /proaudiotrainingacademy\.com/, 'the catch-all must offer a way out');
});

test('every real Supabase auth error maps to specific copy, not the catch-all', () => {
  for (const message of REAL_SUPABASE_ERRORS) {
    const copy = friendlyAuthError({ message });
    assert.ok(copy, `${message}: produced no copy at all`);
    assert.notEqual(
      copy,
      GENERIC,
      `"${message}" falls through to the generic message — the user is not told what to fix`,
    );
  }
});

test('a breached password is named as such, so the person knows to change it', () => {
  const copy = friendlyAuthError({
    message: 'Password is known to be weak and easy to guess, please choose a different one.',
  });
  assert.match(copy!, /breach|different/i);
  // It must not read as a wrong-password-on-login error: this person is
  // CREATING an account and has no existing password to have got wrong.
  assert.doesNotMatch(copy!, /incorrect/i);
});

test('no error maps to null except the absence of an error', () => {
  assert.equal(friendlyAuthError(null), null);
  assert.equal(friendlyAuthError(undefined), null);
});

test('the client rule cannot catch a breached password — which is why mapping matters', () => {
  // "Password1" satisfies every client-side rule and is in every breach list.
  assert.equal(passwordIssue('Password1'), null);
});
