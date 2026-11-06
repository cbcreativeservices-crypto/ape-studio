/**
 * Flashcards: holding the card no longer opens full screen (owner 2026-11-05:
 * "it occasionally randomly opens into full screen"). A resting thumb counted
 * as a long press. The green key and the Study Sheet are the ways in.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const SRC = readFileSync(new URL('../src/screens/study/FlashcardsScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('nothing on the card opens full screen by a hold', () => {
  assert.doesNotMatch(SRC, /onLongPress=\{\(\) => setFullscreen\(true\)\}/);
  assert.doesNotMatch(SRC, /delayLongPress=\{850\}/);
});

test('the green key and the Study Sheet still open it', () => {
  assert.equal(SRC.match(/setFullscreen\(true\)/g)?.length, 2);
  assert.match(SRC, /onPress=\{\(\) => setFullscreen\(true\)\}/);
  assert.match(SRC, /setReviewMode\(true\);\n\s+setFullscreen\(true\);/);
});

test('a tap on the definition still moves on', () => {
  assert.match(SRC, /<CardTextPress onPress=\{canAdvance \? onTap : pageDown\}>/);
});
