/**
 * GUARD — study-area fixes from the "toddler + cat" bug pass of 2026-09-30.
 * Source-reading checks (the screens import React Native, which node --test
 * cannot load). The scenario-round fix has its own behavioural test in
 * scenarioRoundZeroNotSaved.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');

test('Results: Retake / Back to Dashboard reset the root only once', () => {
  const src = read('screens', 'results', 'ResultsScreen.tsx');
  assert.match(src, /const leavingRef = useRef\(false\);/);
  for (const fn of ['const toDashboard = useCallback(', 'const retake = useCallback(']) {
    const at = src.indexOf(fn);
    assert.ok(at > 0, `${fn} missing`);
    const guard = src.indexOf('if (leavingRef.current) return;', at);
    const reset = src.indexOf('navigation.reset(', at);
    assert.ok(guard > at && guard < reset, `${fn} must latch before it resets`);
  }
});

test('Quiz + Final Exam: a Leave & wipe answered after the submit does nothing', () => {
  for (const file of [['screens', 'quiz', 'QuizScreen.tsx'], ['screens', 'exam', 'FinalExamScreen.tsx']]) {
    const src = read(...file);
    const at = src.indexOf("'Leave & wipe',");
    const guard = src.indexOf('if (submitted.current) return;', at);
    const back = src.indexOf('safeGoBack(navigation);', at);
    assert.ok(at > 0 && guard > at && guard < back, `${file.at(-1)}: the stale confirm must bail before goBack`);
  }
});

test('Matching: a wrong-pair flash only clears what it set', () => {
  const src = read('screens', 'study', 'MatchingScreen.tsx');
  assert.match(src, /setWrongPair\(\(w\) => \(w === wrong \? null : w\)\);/);
  assert.match(src, /setSelectedLeft\(\(cur\) => \(cur === wrong\.left \? null : cur\)\);/);
});

test('Scenarios: multi-select choices freeze once the question is judged', () => {
  const src = read('screens', 'study', 'ScenariosScreen.tsx');
  const at = src.indexOf(': isMulti');
  const frozen = src.indexOf('!feedback &&', at);
  const set = src.indexOf('setMultiSel((cur)', at);
  assert.ok(at > 0 && frozen > at && frozen < set);
});

test('Flashcards: the session-timer banner waits for focus, Low-Light and fullscreen', () => {
  const src = read('screens', 'study', 'FlashcardsScreen.tsx');
  assert.match(src, /\{tutorialBlocked \? null : <SessionTimerBanner timer=\{sessionTimer\} \/>\}/);
  assert.doesNotMatch(src, /^\s*<SessionTimerBanner timer=\{sessionTimer\} \/>\s*$/m);
});

test('Terms exemption is hydrated wherever topic % is computed', () => {
  const dash = read('screens', 'dashboard', 'DashboardScreen.tsx');
  assert.match(dash, /^\s*useTermsExempt\(\);/m);
  // Above the early returns (the hook-order rule at "THE LAST HOOK").
  assert.ok(dash.indexOf('useTermsExempt();') < dash.indexOf('if (loading && !data) {'));
  const prog = read('features', 'enrollment', 'enrollmentProgress.ts');
  assert.match(prog, /const termsExemptVersion = useTermsExempt\(\);/);
  assert.match(prog, /\[key, exemptVersion, termsExemptVersion(?:, identityVersion)?\]/);
});
