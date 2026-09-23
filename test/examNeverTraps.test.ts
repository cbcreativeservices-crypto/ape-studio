/**
 * GUARD — the Final Exam must never be a screen with no way out.
 *
 * Found by the 2026-09-23 overnight navigation hunt, then verified in source.
 *
 * `FinalExam` is a ROOT-stack route. The root navigator sets
 * `headerShown: false, gestureEnabled: false` and the route re-asserts the
 * gesture, so there is no header and no edge-swipe. The screen's Android
 * hardware-back interceptor deliberately skips the waiting branch
 * (`if (!payload || submitting) return`), which leaves Android's system back
 * working — and left **iOS with no exit at all**: no header, no swipe, no
 * button, on the graded capstone that issues the credential. Force-quit only.
 *
 * Two distinct halves, fixed two different ways:
 *
 *  - START HUNG (`!payload`): nothing has been graded, so the screen offers a
 *    GO BACK once the wait stops being brief. Answers are drafted on every tap
 *    anyway, so a resumed attempt rejoins where it left off.
 *
 *  - SUBMIT HUNG (`submitting`): an escape here would ABANDON A GRADED SITTING,
 *    because `enqueueExamSubmission` lives in the caller's CATCH and a stall
 *    never reaches it. So the submit is bounded instead — the stall becomes the
 *    failure the caller already handles, and the screen resolves itself. Safe
 *    because `submit_final_exam` is idempotent server-side
 *    (`IF a.result_payload IS NOT NULL THEN RETURN a.result_payload`), read
 *    from the live function definition rather than assumed.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const screen = strip(read('src', 'screens', 'exam', 'FinalExamScreen.tsx'));
const api = strip(read('src', 'features', 'finalExam', 'api.ts'));

describe('the Final Exam never strands the learner', () => {
  test('the waiting state offers a way out', () => {
    assert.match(screen, /function ExamHold/, 'ExamHold is gone — the waiting branch has no exit again');
    assert.match(screen, /<ExamHold submitting=\{submitting\} onBack=/, 'the waiting branch no longer renders ExamHold');
    assert.match(screen, /GO BACK/, 'the escape button is gone');
  });

  test('the escape NEVER shows while submitting', () => {
    // Answers are in flight; leaving would abandon a graded sitting.
    assert.match(screen, /slow && !submitting \?/, 'the escape can now appear mid-submit — that abandons a graded exam');
  });

  test('the graded submit is bounded', () => {
    assert.match(api, /const SUBMIT_TIMEOUT_MS = \d+/, 'the submit timeout is gone');
    assert.match(api, /Promise\.race\(/, 'submitFinalExam no longer races a deadline');
    assert.match(api, /submitFinalExamUnbounded/, 'the inner unbounded call is gone');
    // It must REJECT, not resolve — the caller's catch is what queues the answers.
    assert.match(api, /reject\(new Error\('submit_timeout'\)\)/, 'a timed-out submit no longer rejects, so the catch never queues the answers');
  });

  test('a timed-out submit still reaches the offline queue', () => {
    // The whole safety of bounding it rests on this path existing.
    assert.match(screen, /enqueueExamSubmission\(/, 'the submit catch no longer queues the attempt');
  });

  test('the iOS announcement is kept', () => {
    // accessibilityLiveRegion is Android-only; without this a VoiceOver user
    // never learns the wait turned slow or that a button appeared.
    assert.match(screen, /Platform\.OS !== 'ios'/, 'the iOS-only announcement guard is gone');
    assert.match(screen, /announceForAccessibility\(/, 'the slow-wait announcement is gone');
  });
});
