/**
 * QUIZ multi_select latch + skipped answer wording in the review (2026-11-05).
 *
 * (a) `confirmMulti` had no `pickedRef` latch and `toggleMulti` stayed live, so
 *     during the 350 ms highlight after Confirm a tap moved the highlight away
 *     from the saved answer, and a second Confirm overwrote it.
 * (b) `skipQuestion` records '', but `fmtAnswer` mapped only null to
 *     '(no answer)', so the review read "Your answer: " with nothing after it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const quiz = read('src/screens/quiz/QuizScreen.tsx');
const results = read('src/screens/results/ResultsScreen.tsx');

/** The text of a `const name = useCallback(...)` block, up to its closing deps. */
function callback(name: string): string {
  const start = quiz.indexOf(`const ${name} = useCallback(`);
  assert.ok(start >= 0, `${name} not found`);
  const end = quiz.indexOf('\n  }, [', start);
  assert.ok(end > start, `${name} has no end`);
  return quiz.slice(start, end);
}

test('confirmMulti is single-fire: it refuses a latched press, then latches', () => {
  const body = callback('confirmMulti');
  const guard = body.search(/if \([^)]*pickedRef\.current[^)]*\) return;/);
  const latch = body.indexOf('pickedRef.current = true;');
  const record = body.indexOf('recordAndAdvance(');
  assert.ok(guard >= 0, 'confirmMulti must return when pickedRef is set');
  assert.ok(latch > guard, 'confirmMulti must set pickedRef after the guard');
  assert.ok(record > latch, 'the latch must be set before the answer is recorded');
});

test('an empty Confirm does not close the latch', () => {
  const body = callback('confirmMulti');
  assert.ok(
    body.indexOf('multiSel.size === 0') < body.indexOf('pickedRef.current = true;'),
    'the latch must come after the empty-selection refusal',
  );
});

test('toggleMulti is dead once the answer is confirmed', () => {
  const body = callback('toggleMulti');
  const guard = body.indexOf('if (pickedRef.current) return;');
  assert.ok(guard >= 0, 'toggleMulti must return when pickedRef is set');
  assert.ok(guard < body.indexOf('setMultiSel('), 'the guard must come before the state change');
});

test('advance still reopens the latch for the next question', () => {
  assert.match(callback('advance'), /pickedRef\.current = false;/);
});

test('a skipped answer reads as (no answer) in the review', () => {
  const start = results.indexOf('function fmtAnswer(');
  const end = results.indexOf('\n}\n', start);
  assert.ok(start >= 0 && end > start, 'fmtAnswer not found');
  const js = ts.transpileModule(results.slice(start, end + 2), {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const fmtAnswer = new Function(`${js}; return fmtAnswer;`)() as (v: unknown) => string;

  assert.equal(fmtAnswer(''), '(no answer)');
  assert.equal(fmtAnswer(null), '(no answer)');
  assert.equal(fmtAnswer(undefined), '(no answer)');
  assert.equal(fmtAnswer('Ribbon'), 'Ribbon');
  assert.equal(fmtAnswer(['a', 'b']), 'a, b');
});

test('skipQuestion still records the empty string the review relies on', () => {
  assert.match(callback('skipQuestion'), /recordAndAdvance\(question\.slot_index, ''\)/);
});
