/**
 * Owner flashcard changes 2026-10-26 (must-do D0e–D0g):
 * - D0e "Don't see a term?" — DAW (the free topic) only, once ever, at the
 *   ALL list open 7 s (drawn inside that list's Modal) or the 30th card shown.
 * - D0f the ALL chip opens its list on a plain tap.
 * - D0g the red eye's FULL VIEW label, exact text.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const fc = read('src/screens/study/FlashcardsScreen.tsx');
const note = read('src/features/intro/topicScopeNote.ts');
const intros = read('src/features/intro/screenIntros.ts');

test('D0e: the note is DAW-only, once, at 7 s in the ALL list or the 30th card', () => {
  assert.match(note, /export const TOPIC_SCOPE_CARDS = 30;/);
  assert.match(note, /export const TOPIC_SCOPE_LIST_MS = 7000;/);
  assert.match(note, /OFFICIAL_TOPIC_NAMES\[DAW_GS\]/);
  assert.match(note, /const DAW_GS = 3970;/);
  // Counted across visits, in the device-level family the wipe keeps.
  assert.match(note, /key: 'ape:onboarding:dawFlashcardsShown'/);
  // One seen flag for both triggers.
  assert.match(fc, /markTutorialSeen\('flashcardsTopicScope'\)/);
  assert.match(fc, /k\.endsWith\('flashcardsTopicScope'\)\) scopeDone\.current = true/);
  // Trigger 1 draws INSIDE the list Modal (iOS refuses a second root Modal).
  const at = fc.indexOf('visible={!!termList}');
  const list = fc.slice(at, fc.indexOf('</Modal>', at));
  assert.match(list, /\{scopeInList \? \(/);
  // Trigger 2 goes through showTutorial (all the blocks/deferrals apply).
  assert.match(fc, /showTutorialRef\.current\('flashcardsTopicScope'\)/);
});

test('D0e: the copy names the live active topics and closes on OK', () => {
  const i = intros.indexOf('flashcardsTopicScope: {');
  const entry = intros.slice(i, intros.indexOf('},', i));
  assert.match(entry, /title: 'Don’t See a Term\?'/);
  assert.match(entry, /Equalization \(EQ\)/);
  assert.match(entry, /Dynamics — Compression, Limiting & Gating \(Core\)/);
  assert.match(entry, /button: 'OK'/);
});

test('D0f: a plain tap on ALL opens the ALL list', () => {
  const i = fc.indexOf('label="ALL"');
  const chip = fc.slice(i, fc.indexOf('/>', i));
  assert.match(chip, /onPress=\{\(\) => \{[\s\S]*openTermList\('All terms', 'all'\);[\s\S]*\}\}/);
});

test('D0g: FULL VIEW label while the red eye is on', () => {
  const i = fc.indexOf('{soloReveal ? (\n                  // Open study view');
  assert.ok(i > 0);
  assert.match(fc.slice(i, i + 600), /FULL VIEW: Term \+ Definition Together/);
});
