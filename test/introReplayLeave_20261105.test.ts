/**
 * Bug test report 2026-11-05, item 5: the "Replay intro" video trapped the
 * learner for its full length. A voluntary replay can now be left, by a Close
 * button (iOS has no BACK) and by Android BACK. The first run keeps its owner
 * rule: no skip, no close, BACK does nothing.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const video = read('src/screens/onboarding/IntroVideoScreen.tsx');
const landing = read('src/screens/onboarding/OnboardingLandingScreen.tsx');
const navTypes = read('src/navigation/types.ts');
const root = read('src/navigation/RootNavigator.tsx');

test('Android BACK leaves a replay and is still swallowed on the first run', () => {
  assert.match(video, /if \(replay\) leaveReplay\(\);\s*return true;/);
  assert.doesNotMatch(video, /useBackWhileFocused\(true, useCallback\(\(\) => true, \[\]\)\)/);
});

test('the Close button exists only on a replay', () => {
  assert.match(video, /\{replay \? \(\s*<Pressable[\s\S]*?onPress=\{leaveReplay\}[\s\S]*?accessibilityLabel="Close video"/);
  assert.equal(video.match(/<Pressable/g)?.length, 1, 'no other control on this screen');
});

test('a screen reader can reach Close: the label sits on the video, not the whole screen', () => {
  assert.match(video, /<View style=\{styles\.root\}>\s*<View style=\{styles\.video\} accessibilityLabel="Introduction video" accessible>/);
});

test('leaving returns to where the replay started', () => {
  // The landing page swaps itself for the video, so it has to say so.
  assert.match(landing, /navigation\.replace\('IntroVideo', \{ replay: true, returnTo: 'landing' \}\)/);
  assert.match(navTypes, /IntroVideo: \{ replay\?: boolean; returnTo\?: 'landing' \} \| undefined;/);
  assert.match(video, /if \(!returnToLanding && safeGoBack\(navigation\)\) \{\s*doneRef\.current = true;\s*return;\s*\}\s*finish\(false\);/);
});

test('the first run is unchanged', () => {
  // Leaving is finish(false) or a go-back; only a played first run retires the flag.
  assert.match(video, /if \(played && !replay\) \{\s*dismiss\(\);/);
  assert.match(root, /name="IntroVideo" getComponent=\{Lazy\.IntroVideo\} options=\{\{ animation: 'fade', gestureEnabled: false \}\}/);
});
