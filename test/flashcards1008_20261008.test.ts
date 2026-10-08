/**
 * Tester Terry (2026-10-08) — Pro Audio Safety flashcards, plus the build
 * label testers could not find.
 *  A1 full screen: horizontal swipe on a SECTION moves between this term's
 *     sections (no wrap, never to another term); a tap on a section does nothing.
 *  A2 a vertical drag on a section is never claimed (the text scrolls).
 *  A3 RELATED TERMS lists terms only — never the category name.
 *  About: quiet version / build / update line.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  NO_RELATED_TERMS,
  fsShouldClaim,
  fsSwipeAction,
  relatedTermsText,
  stepSectionLevel,
} from '../src/features/study/flashcardGestures.ts';
import { formatBuildLabel, shortUpdateId } from '../src/features/updates/buildLabel.ts';

const fc = readFileSync('src/screens/study/FlashcardsScreen.tsx', 'utf8');
const gl = readFileSync('src/screens/glossary/GlossaryScreen.tsx', 'utf8');
const about = readFileSync('src/screens/about/AboutHomeSheet.tsx', 'utf8');
const section = { level: 4, studyMode: false };
const term = { level: 0, studyMode: false };

test('A1: horizontal swipe on a section steps sections, never cards', () => {
  assert.equal(fsSwipeAction({ dx: -80, dy: 5, vx: -0.5 }, section), 'nextSection');
  assert.equal(fsSwipeAction({ dx: 80, dy: 5, vx: 0.5 }, section), 'prevSection');
  assert.equal(fsSwipeAction({ dx: -80, dy: 5, vx: -0.5 }, term), 'nextCard');
  assert.equal(fsSwipeAction({ dx: -80, dy: 5, vx: 0 }, { level: 3, studyMode: true }), 'nextCard');
  // a short, slow nudge is not a swipe
  assert.equal(fsSwipeAction({ dx: -20, dy: 2, vx: -0.1 }, section), 'none');
});

test('A1: section stepping clamps — no wrap past the last, right from first goes to the term', () => {
  const lv = [1, 2, 3, 4, 5, 6];
  assert.equal(stepSectionLevel(6, lv, 1), 6);
  assert.equal(stepSectionLevel(1, lv, -1), 0);
  assert.equal(stepSectionLevel(0, lv, -1), 0);
  assert.equal(stepSectionLevel(3, [1, 3, 6], 1), 6);
});

test('A1: a tap on a full-screen section does not advance', () => {
  assert.match(fc, /onPress=\{studyMode \|\| level !== 0 \? undefined : onTap\}/);
  assert.doesNotMatch(fc, /accessibilityHint="Shows the next section"/);
  assert.doesNotMatch(fc, /stepLevel/);
  assert.match(fc, /accessibilityRole="adjustable"/);
});

test('A2: vertical drags on a section belong to the ScrollView; diagonal drags too', () => {
  assert.equal(fsShouldClaim({ dx: 3, dy: 60 }, section), false);
  assert.equal(fsShouldClaim({ dx: 30, dy: 40 }, section), false);
  assert.equal(fsSwipeAction({ dx: 10, dy: -200, vx: 0 }, section), 'none');
  assert.equal(fsShouldClaim({ dx: 40, dy: 5 }, section), true);
  // the bare term face still reveals by ↑/↓
  assert.equal(fsShouldClaim({ dx: 2, dy: -30 }, term), true);
  assert.equal(fsSwipeAction({ dx: 2, dy: -50, vx: 0 }, term), 'revealFirst');
  assert.match(fc, /fsShouldClaim\(g,/);
});

test('A3: RELATED TERMS never shows the category; empty reads honestly', () => {
  const cat = 'Recording, Mixing & Troubleshooting Concepts';
  const t = relatedTermsText({ related_terms: ['Audiometry', 'Ototoxicity'], category: cat });
  assert.equal(t, '• Audiometry\n• Ototoxicity');
  assert.equal(relatedTermsText({ related_terms: [], category: cat }), NO_RELATED_TERMS);
  assert.equal(relatedTermsText({ related_terms: [cat, ' '], category: cat }), NO_RELATED_TERMS);
  assert.doesNotMatch(fc, /item\.category \|\| null/);
  assert.doesNotMatch(gl, /d\.category \|\| null/);
  assert.doesNotMatch(gl, /\{d\.category \? <Text/);
});

test('About: version / build / short update id, one quiet label >= 9 pt', () => {
  assert.equal(
    formatBuildLabel({ version: '1.0', build: '34', updateId: '1a2b3c4d-0000-0000-0000-000000000000', isEmbedded: false }),
    'Version 1.0 (34) · update 1a2b3c',
  );
  assert.equal(formatBuildLabel({ version: '1.0', build: null, updateId: null, isEmbedded: true }), 'Version 1.0 · built-in update');
  assert.equal(shortUpdateId(''), null);
  assert.match(about, /accessibilityLabel=\{buildLabel\}/);
  const size = Number(/buildLine: \{[^}]*fontSize: (\d+(?:\.\d+)?)/.exec(about)?.[1]);
  assert.ok(size >= 9, `build line ${size} pt`);
});
