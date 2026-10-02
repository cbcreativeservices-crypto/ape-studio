/**
 * GUARD — study-area fixes from "toddler + cat" bug pass 3 of 2026-09-30 (day).
 *
 * Source-reading checks: the screens import React Native, which node --test
 * cannot load.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');

test('Dashboard: UNLOCK waits for the study-access sheet to go before presenting the Paywall', () => {
  const src = read('screens', 'dashboard', 'DashboardScreen.tsx');
  // One pending hand-off at a time, waiting HOST_DISMISS_MS, cleared on
  // unmount — the shared useModalHandoff since pattern P5 (2026-10-02); its
  // behaviour is proven in test/patternP5_20261002.
  assert.match(src, /const afterPopupCloses = useModalHandoff\(\);/);
  // The Paywall is never navigated to in the same tap that closes the sheet.
  assert.match(src, /setUpgradeOpen\(false\);\s*\/\/[^\n]*\n\s*afterPopupCloses\(\(\) => \(navigation as any\)\.navigate\('Paywall'\)\);/);
  assert.ok(!/setUpgradeOpen\(false\);\s*\(navigation as any\)\.navigate\('Paywall'\)/.test(src));
});

test('Dashboard: a locked Custom List opens the study-access sheet only after the term list has gone', () => {
  const src = read('screens', 'dashboard', 'DashboardScreen.tsx');
  const at = src.indexOf('label="STUDY FLASHCARDS"');
  const body = src.slice(at, src.indexOf('/>', src.indexOf('navigation.navigate(', at)));
  assert.match(body, /setTermsOpen\(false\);/);
  assert.match(body, /if \(customListLocked\) \{[^}]*afterPopupCloses\(\(\) => setUpgradeOpen\(true\)\);/);
});

test('Scenarios: one advance per answer — a double NEXT cannot finish the round twice', () => {
  const src = read('screens', 'study', 'ScenariosScreen.tsx');
  const at = src.indexOf('const advance = useCallback(() => {');
  const body = src.slice(at, src.indexOf('}, [idx, roundQuestions', at));
  const guard = body.indexOf('if (answeredItemRef.current === null) return;');
  assert.ok(guard > 0, 'advance must bail when no answer is pending');
  assert.ok(guard < body.indexOf('clearInteraction();'), 'the latch is read before it is released');
});

test('Flashcards: the term list opens only after the T3 tutorial Modal has gone', () => {
  const src = read('screens', 'study', 'FlashcardsScreen.tsx');
  assert.match(src, /import \{ HOST_DISMISS_MS \} from '\.\.\/\.\.\/components\/DimModal';/);
  const at = src.indexOf('const dismissTutorial = useCallback(');
  const body = src.slice(at, src.indexOf('}, []);', at));
  assert.match(body, /tutorialRef\.current = null;/);
  assert.match(body, /if \(done\) setTimeout\(done, HOST_DISMISS_MS\);/);
  assert.ok(!/onDone\?\.\(\)/.test(body), 'the follow-on must not run in the same tick as the dismissal');
});

test('Enrollment progress: a failed refetch keeps the bars already on screen', () => {
  const src = read('features', 'enrollment', 'enrollmentProgress.ts');
  const at = src.indexOf('const d = await fetchEnrollmentDashboard(');
  const tail = src.slice(at, src.indexOf('return () => {', at));
  const c = tail.lastIndexOf('} catch {');
  assert.ok(c > 0);
  assert.ok(!/setMap\(new Map\(\)\)/.test(tail.slice(c)), 'the catch must not wipe earned progress to 0%');
});
