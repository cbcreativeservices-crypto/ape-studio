/**
 * The front door when a password is not accepted.
 * Logs 2026-09-29: 12 misses in 3 minutes from one person, each answered only
 * "incorrect". Owner 2026-11-06: locked out of their own old email by the same
 * words on CREATE ACCOUNT, "a pain point i want to remove". The way out now
 * shows on the FIRST miss, and CREATE ACCOUNT says the email has an account.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EMAIL_HAS_ACCOUNT_WRONG_PASSWORD,
  LOGIN_NOT_MATCHED,
  existingAccountSignInError,
  friendlyAuthError,
} from '../src/features/auth/authErrorCopy.ts';

const src = readFileSync('src/screens/auth/AuthScreen.tsx', 'utf8');
const api = readFileSync('src/features/auth/api.ts', 'utf8');

test('the first wrong LOGIN already names every way forward', () => {
  assert.doesNotMatch(src, /loginMisses/);
  assert.match(src, /wrong\s*\?\s*LOGIN_NOT_MATCHED/);
  assert.match(LOGIN_NOT_MATCHED, /Reset via email/);
  assert.match(LOGIN_NOT_MATCHED, /CREATE ACCOUNT/);
  assert.match(src, />Reset via email</);
});

test('the refused-signup message still wins', () => {
  assert.ok(src.indexOf('signupRefused && wrong') > 0);
  assert.ok(src.indexOf('signupRefused && wrong') < src.indexOf('? LOGIN_NOT_MATCHED'));
});

test('CREATE ACCOUNT on a taken email says so, and never "incorrect"', () => {
  const said = existingAccountSignInError({ message: 'Invalid login credentials' });
  assert.equal(said, EMAIL_HAS_ACCOUNT_WRONG_PASSWORD);
  assert.match(said!, /already has an account/);
  assert.match(said!, /Reset via email/);
  assert.doesNotMatch(said!, /incorrect/i);
  assert.match(api, /return existingAccountSignInError\(signIn\.error\)/);
});

test('being offline there still reads as offline, not as a wrong password', () => {
  const m = { message: 'Network request failed' };
  assert.equal(existingAccountSignInError(m), friendlyAuthError(m));
  assert.match(existingAccountSignInError(m)!, /offline/);
});

test('LOGIN still recognises a wrong password from the shared mapping', () => {
  assert.match(friendlyAuthError({ message: 'Invalid login credentials' })!, /incorrect/i);
  assert.match(src, /const wrong = \/incorrect\/i\.test\(err\)/);
});
