/**
 * Flashcards list-icon flash (owner 2026-10-24, "like in Glossary now"):
 * bookmarking a term, or adding/removing it on the Custom list, flashes that
 * list's icon in the filter row once — the same shared AckFlash Glossary uses.
 * A refused toggle (the saved list could not be read) never flashes.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const fc = read('src/screens/study/FlashcardsScreen.tsx');
const gl = read('src/screens/glossary/GlossaryScreen.tsx');

test('one shared flash for Glossary and Flashcards', () => {
  assert.match(fc, /import \{ AckFlash \} from '\.\.\/\.\.\/components\/AckFlash';/);
  assert.match(gl, /import \{ AckFlash \} from '\.\.\/\.\.\/components\/AckFlash';/);
  assert.doesNotMatch(gl, /function AckFlash\(/, 'Glossary must not keep its own copy');
});

test('the filter-row Bookmark and Custom list icons flash', () => {
  assert.match(fc, /<AckFlash n=\{ack\.fav\}>\n\s+<BookmarkIcon color=\{c\} filled=\{bookmarkedOnly\} \/>/);
  assert.match(fc, /<AckFlash n=\{ack\.custom\}>\n\s+<DeckIcon color=\{colors\.customList\} size=\{17\} \/>/);
});

test('a card toggle flashes only when it was not refused', () => {
  assert.match(fc, /if \(toggleBookmark\(achievementId, card\.id\) !== null\) ackList\('fav'\);/);
  assert.match(fc, /if \(toggleTermList\('starred', card\.id\) !== null\) ackList\('custom'\);/);
  assert.doesNotMatch(fc, /setInTermList\('starred', card\.id, !starred\.has\(card\.id\)\)/);
});

test('in full screen the flash waits for the filter row to come back', () => {
  assert.match(fc, /rowHiddenRef\.current = fullscreen;/);
  assert.match(fc, /if \(fullscreen \|\| !pendingAck\.current\) return;/);
});
