/**
 * GUARD — the two graded screens (topic quiz + final exam), bug hunt 2026-09-29.
 *
 *  - Android BACK while submitting is swallowed, not handed to the system (it
 *    popped the screen mid-submit and the result was lost).
 *  - "Skip question" is latched like a real answer: a double tap skipped a real
 *    question or ran past the end into an endless spinner.
 *  - The advance is clamped to the last question.
 *  - The resume draft saves the NEXT index, so a resume never reopens an
 *    answered question.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const screens = [
  { name: 'QuizScreen', list: 'questions', src: readFileSync(join(process.cwd(), 'src', 'screens', 'quiz', 'QuizScreen.tsx'), 'utf8') },
  { name: 'FinalExamScreen', list: 'items', src: readFileSync(join(process.cwd(), 'src', 'screens', 'exam', 'FinalExamScreen.tsx'), 'utf8') },
];

for (const { name, list, src } of screens) {
  test(`${name}: hardware back is swallowed while submitting`, () => {
    assert.doesNotMatch(src, /if \(!payload \|\| submitting\) return;\s*const sub = BackHandler/);
    assert.match(src, /if \(submitting\) return true;\s*if \(submitted\.current\) return false;/);
  });

  test(`${name}: skip is latched and goes through recordAndAdvance`, () => {
    const at = src.indexOf('const skipQuestion = useCallback(');
    assert.ok(at > 0);
    const body = src.slice(at, src.indexOf('}, [', at));
    assert.match(body, /if \(!question \|\| pickedRef\.current\) return;/);
    assert.match(body, /pickedRef\.current = true;/);
    assert.match(body, /recordAndAdvance\(question\.slot_index, ''\);/);
    assert.doesNotMatch(body, /\badvance\(\);/);
  });

  test(`${name}: advance is clamped and the draft saves the next index`, () => {
    assert.ok(src.includes(`setQIdx((i) => Math.min(i + 1, payload.${list}.length - 1));`));
    assert.ok(src.includes(`qIdx: Math.min(qIdx + 1, payload.${list}.length - 1),`));
    assert.doesNotMatch(src, /saveAttemptDraft\(payload\.attempt_id, \{ answers: answers\.current, qIdx \}\)/);
  });
}
