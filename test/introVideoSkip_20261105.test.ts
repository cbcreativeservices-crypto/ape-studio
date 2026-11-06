/**
 * Launch feedback 2026-11-05: an interrupted first viewing of the 2:35 intro
 * video restarted from zero with no way past it. Owner 2026-11-06, "Always show
 * Skip": every viewing can be skipped. New accounts still get the video.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const video = read('src/screens/onboarding/IntroVideoScreen.tsx');
const auth = read('src/screens/auth/AuthScreen.tsx');

test('Skip shows on every viewing that is not a replay, with no condition', () => {
  assert.match(video, /\{replay \? \([\s\S]*?\) : \(\s*<Pressable[\s\S]*?accessibilityLabel="Skip video"/);
  assert.doesNotMatch(video, /canSkip/);
});

test('the old first-viewing tracking is gone', () => {
  assert.doesNotMatch(video, /introVideoAttempt|startedBefore/);
  assert.equal(existsSync(new URL('../src/features/intro/introVideoAttempt.ts', import.meta.url)), false);
});

test('Skip counts as seen and goes on to the landing page', () => {
  assert.match(video, /onPress=\{\(\) => finish\(true\)\}/);
  assert.match(video, /accessibilityLabel="Skip video"/);
});

test('every new account still gets the video (owner 2026-10-23)', () => {
  assert.match(auth, /result\.created[\s\S]{0,300}resetScreenIntros/);
});

test('the orientation notice shows on every viewing and takes no taps', () => {
  assert.match(video, /Orientation video: the Academy is huge/);
  assert.match(video, /<View pointerEvents="none" style=\{\[styles\.notice, \{ bottom: insets\.bottom \+ 12 \}\]\}>/);
});
