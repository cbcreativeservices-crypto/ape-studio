/**
 * iPhone edge swipe-back on tab roots (owner 2026-10-25): Profile and Progress
 * get it (iOS has no swipe from a tab back to Home; Android's BACK already
 * retraces the tabs). Owner, same message: Study and the Explore pager keep
 * their own behaviour — "dont blanket apply to all".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

test('Profile and the Progress hub are wrapped; nothing else is', () => {
  const tabs = read('src/navigation/MainTabs.tsx');
  const ach = read('src/navigation/AchievementsStack.tsx');
  assert.match(tabs, /Profile: lazyScreen\(\(\) => withTabEdgeSwipeBack\(require\('\.\.\/screens\/profile\/ProfileScreen'\)\.ProfileScreen\)\)/);
  assert.match(ach, /const AchievementsHomeSwipe = withTabEdgeSwipeBack\(AchievementsHomeScreen\)/);
  assert.match(ach, /name="AchievementsHome" component=\{AchievementsHomeSwipe\}/);
  // Exactly those two uses across the app.
  assert.equal((tabs.match(/withTabEdgeSwipeBack\(/g) ?? []).length, 1);
  assert.equal((ach.match(/withTabEdgeSwipeBack\(/g) ?? []).length, 1);
  assert.doesNotMatch(read('src/navigation/StudyStack.tsx'), /TabEdgeSwipeBack/);
  assert.doesNotMatch(read('src/screens/courses/CourseSelectionScreen.tsx'), /TabEdgeSwipeBack/);
  assert.doesNotMatch(read('src/screens/awards/AwardsScreen.tsx'), /TabEdgeSwipeBack/);
});

test('iOS only, left edge only, does what Android BACK does', () => {
  const s = read('src/navigation/TabEdgeSwipeBack.tsx');
  assert.match(s, /if \(Platform\.OS !== 'ios'\) return <>\{children\}<\/>;/);
  assert.match(s, /\.hitSlop\(\{ left: 0, width: EDGE_PT \}\)/);
  assert.match(s, /\.failOffsetY\(/);
  assert.match(s, /if \(!safeGoBack\(navigation\) && navigation\.isFocused\(\)\) navigation\.navigate\('Home'\);/);
});
