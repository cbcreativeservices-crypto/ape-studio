/**
 * Launch feedback 2026-11-05: an interrupted first viewing of the 2:35 intro
 * video restarted from zero with no way past it. The first viewing stays
 * no-skip; any later viewing offers Skip. New accounts still get the video.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const video = read('src/screens/onboarding/IntroVideoScreen.tsx');
const attempt = read('src/features/intro/introVideoAttempt.ts');
const wipe = read('src/features/account/clearLocalAccountData.ts');
const flow = read('src/features/intro/onboardingFlow.ts');
const intros = read('src/features/intro/screenIntros.ts');
const auth = read('src/screens/auth/AuthScreen.tsx');

test('Skip shows only on a later viewing, never on a replay', () => {
  assert.match(video, /\{replay \? \([\s\S]*?\) : canSkip \? \(\s*<Pressable/);
  assert.match(video, /useState\(false\);\n\s+useEffect/, 'canSkip starts false');
});

test('the prior read comes first, so the first viewing cannot offer Skip', () => {
  assert.match(video, /useState\(\(\) => introVideoStartedBefore\(\)/);
  assert.match(video, /startedBefore\.then\(\(\) => markIntroVideoStarted\(\)\)/);
  assert.match(attempt, /!store\.isUnreadable\(\) && store\.get\(\)\.started/);
});

test('a video that never played does not count as started', () => {
  assert.match(video, /status === 'readyToPlay'\) \{\s*startedRef\.current = true;\s*if \(!replay\) void startedBefore/);
});

test('Skip counts as seen and goes on to the landing page', () => {
  assert.match(video, /onPress=\{\(\) => finish\(true\)\}/);
  assert.match(video, /accessibilityLabel="Skip video"/);
});

test('the mark survives the wipe and the new-account resets', () => {
  assert.match(attempt, /key: 'ape:onboarding:introVideoStarted'/);
  assert.match(wipe, /k\.startsWith\('ape:onboarding:'\)/);
  assert.match(flow, /multiRemove\(\[COMPLETE_KEY, VISITED_KEY\]\)/);
  assert.match(intros, /k\.startsWith\(INTRO_STORAGE_PREFIX\)/);
  assert.doesNotMatch(attempt, /ape:intro:/);
});

test('every new account still gets the video (owner 2026-10-23)', () => {
  assert.match(auth, /result\.created[\s\S]{0,300}resetScreenIntros/);
});

test('the orientation notice shows on every viewing and takes no taps', () => {
  assert.match(video, /Orientation video: the Academy is huge/);
  assert.match(video, /<View pointerEvents="none" style=\{\[styles\.notice, \{ bottom: insets\.bottom \+ 12 \}\]\}>/);
});
