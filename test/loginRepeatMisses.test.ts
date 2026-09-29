/**
 * Repeated wrong-password LOGIN (Supabase auth logs 2026-09-29: 12 misses in
 * 3 minutes from one person, each answered only "incorrect"). From the second
 * miss for the same email the screen points at "Reset via email".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/screens/auth/AuthScreen.tsx', 'utf8');

test('misses are counted per typed email', () => {
  assert.match(src, /loginMisses\.current\.email !== typed\) loginMisses\.current = \{ email: typed, n: 0 \}/);
  assert.match(src, /loginMisses\.current\.n \+= 1/);
});

test('the second miss names the reset link that is actually on screen', () => {
  assert.match(src, /wrong && loginMisses\.current\.n >= 2/);
  assert.match(src, /Tap “Reset via email” below/);
  assert.match(src, />Reset via email</);
});

test('the refused-signup message still wins', () => {
  assert.ok(src.indexOf('signupRefused && wrong') < src.indexOf('wrong && loginMisses.current.n >= 2'));
});
