/**
 * GUARD — study-method fixes from the bug hunt of 2026-09-29.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');

test('Flashcards: tutorials wait for Low-Light, focus and fullscreen', () => {
  const src = read('screens', 'study', 'FlashcardsScreen.tsx');
  // Widened 2026-10-01 (full-app run 1) with the screen's own open Modals.
  assert.match(src, /const tutorialBlocked =\s*overlaysSuppressed \|\| !isFocused \|\| fullscreen[ ;|]/);
  // Deferred, not consumed: the block check comes BEFORE the seen-flag write.
  const show = src.indexOf('const showTutorial = useCallback(');
  const blocked = src.indexOf('if (tutorialBlockedRef.current)', show);
  const persisted = src.indexOf('AsyncStorage.setItem(INTRO_STORAGE_PREFIX + key', show);
  assert.ok(show > 0 && blocked > show && persisted > blocked, 'a blocked tutorial must not be marked seen');
  assert.match(src, /\{tutorial && !tutorialBlocked \? <IntroSheet/);
});

test('Matching: a manual move cancels the board-complete auto-advance', () => {
  const src = read('screens', 'study', 'MatchingScreen.tsx');
  assert.match(src, /autoAdvanceTimer\.current = scheduleFlash\(/);
  const go = src.indexOf('const goBoard = useCallback(');
  assert.ok(src.indexOf('clearTimeout(autoAdvanceTimer.current);', go) > go);
});

test('Fill-in-blank: shake is held while feedback shows; goTo cancels the advance', () => {
  const src = read('screens', 'study', 'FillInBlankScreen.tsx');
  assert.doesNotMatch(src, /onShakePrev=\{\(\) => goTo\(-1\)\}/);
  const go = src.indexOf('const goTo = useCallback(');
  const end = src.indexOf('}, []);', go);
  assert.ok(src.slice(go, end).includes('clearTimeout(advanceTimer.current);'));
});

test('Scenarios: the done screen does not claim the quiz unlocked for an unsaved round', () => {
  const src = read('screens', 'study', 'ScenariosScreen.tsx');
  const done = src.indexOf("if (view === 'done')");
  assert.ok(src.slice(done, done + 1500).includes('roundSaved === false'));
});

test('Dashboard: the term list is a centred fading card, and the deck keeps one topic', () => {
  const dash = read('screens', 'dashboard', 'DashboardScreen.tsx');
  const at = dash.indexOf('visible={termsOpen}');
  assert.match(dash.slice(at, at + 120), /animationType="fade"/);
  assert.match(dash, /termsBackdrop: \{[^}]*justifyContent: 'center'/);
  assert.match(dash, /removeFromDeck\(id, topics\.map\(\(t\) => t\.id\)\)/);
  const store = read('features', 'dashboard', 'deckOrderStore.ts');
  assert.match(store, /export function removeFromDeck\(id: string, deckIds\?: readonly string\[\]\): void/);
  assert.match(store, /if \(left\.length === 0\) return prefs;/);
});
