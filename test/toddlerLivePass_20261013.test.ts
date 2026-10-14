/**
 * Live emulator toddler pass 2026-10-13 (guest, Android three-button bar,
 * 1080×1920) — the fixes for what only a real device showed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('UpgradeSheet: NOT NOW clears the Android button bar (bottom inset)', () => {
  const s = read('src/features/commercial/UpgradeSheet.tsx');
  assert.match(s, /const insets = useSafeAreaInsets\(\);\n\s*if \(!visible\) return null;/, 'hook before the early return');
  assert.match(s, /style=\{\[styles\.sheet, \{ paddingBottom: 28 \+ insets\.bottom \}\]\}/);
});

test('IntroVideo: resumes on return to the app, and never traps (falls through to landing)', () => {
  const s = read('src/screens/onboarding/IntroVideoScreen.tsx');
  assert.match(s, /AppState\.addEventListener\('change'/);
  assert.match(s, /if \(!player\.playing\) player\.play\(\);/);
  assert.match(s, /if \(!doneRef\.current && !player\.playing\) finish\(false\);/);
});

test('study sync: a DEFINITELY anonymous (guest) session never queues or sends', () => {
  const s = read('src/features/study/sync.ts');
  assert.match(s, /if \(data\.session\?\.user\?\.is_anonymous === true\) \{\n\s*this\.events\.splice\(0\);/);
});

test('Help: the empty-search note no longer claims entries matched', () => {
  const s = read('src/screens/help/HelpScreen.tsx');
  assert.match(s, /\{noResults\n\s*\? 'Nothing matched that search/);
});
