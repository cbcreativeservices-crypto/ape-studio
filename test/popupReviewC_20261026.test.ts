/**
 * Popup copy review, group C (owner OK 2026-10-26, Downloads/
 * 2026-10-26_POPUP_COPY_REVIEW): owner-approved texts that had drifted from
 * the app, brought back in line. Pinned so they don't drift again.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const intros = read('src/features/intro/screenIntros.ts');
const sheet = read('src/features/commercial/StudyAccessSheet.tsx');
// glossaryCap.ts imports the Supabase client, so it is read, not imported.
const GLOSSARY_WEEKLY_LIMIT = Number(read('src/features/glossary/glossaryCap.ts').match(/export const GLOSSARY_WEEKLY_LIMIT = (\d+);/)![1]);

test('C1–C5: Flashcards / Trophy Case / Commitment intros name what the app has', () => {
  assert.doesNotMatch(intros, /Show All|favorites|reassign terms|annoying pop-ups/);
  assert.match(intros, /Tap the eye button to see the term and its definition together \(FULL VIEW\)/);
  assert.match(intros, /Use FILTER to choose which parts of each definition appear/);
  assert.match(intros, /BEG, INT, ADV, KNOWN, Bookmarks or Custom list/);
  assert.match(intros, /then pass its Final Exam to earn it/);
});

test('C6: the study-access sheet never tells a guest their progress is saved', () => {
  assert.match(sheet, /\{guest \? 'With an account and membership, your progress is saved' : 'Your progress is saved'\}/);
});

test('C6: the sheet’s glossary number mirrors GLOSSARY_WEEKLY_LIMIT (kept literal: the start graph)', () => {
  const m = sheet.match(/glossary for free \((\d+) definitions a/);
  assert.ok(m, 'allowance sentence present');
  assert.equal(Number(m![1]), GLOSSARY_WEEKLY_LIMIT);
});

test('C9: the manage-subscription fallback names the phone’s own store', () => {
  for (const f of ['src/features/exit/api.ts', 'src/screens/commercial/PaywallScreen.tsx']) {
    const s = read(f);
    assert.doesNotMatch(s, /App Store or Play Store/, f);
    assert.match(s, /Open the \$\{storeNameFor\(Platform\.OS\)\} app and look under Subscriptions/, f);
  }
});
