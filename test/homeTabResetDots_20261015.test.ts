/**
 * UX review 2026-10-15: tapping HOME resets the Home carousel to its default
 * card, and the dot row under the cards can be dragged to move through them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync('src/screens/courses/CourseSelectionScreen.tsx', 'utf8');

test('HOME tab press resets the carousel to the default card', () => {
  assert.match(home, /addListener\?\.\('tabPress'/);
  assert.match(home, /lastCenteredId = null;/);
  assert.match(home, /sessionLanded = false;/);
  assert.match(home, /const target = defaultLandingIdx\(deck\);\s*setActiveIdx\(target\);\s*listRef\.current\?\.scrollToIndex/);
});

test('the dot row is draggable and maps a finger position to a card', () => {
  assert.match(home, /onResponderMove=\{\(e\) => scrubDots\(e\.nativeEvent\.pageX\)\}/);
  assert.match(home, /onStartShouldSetResponder=\{\(\) => \(displayDeck\?\.length \?\? 0\) > 1\}/);
  assert.match(home, /const contentW = n \* dotFit\.size \+ 11 \+ \(n - 1\) \* dotFit\.gap;/);
});
