/**
 * GUARD — night bug pass 2 (2026-10-01), study / dashboard / quiz / exam area.
 * Source-reading checks for timing fixes that cannot run without a phone.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

describe('the enrollment server sync is fenced across an account wipe', () => {
  const store = read('src', 'features', 'enrollment', 'enrollmentStore.ts');
  const sync = store.slice(
    store.indexOf('function scheduleServerSync('),
    store.indexOf('async function hydrate('),
  );

  it('the running callback captures the generation before its first await', () => {
    const genAt = sync.indexOf('const gen = generation;');
    // safeSessionResult since hunt 8 (2026-10-03): a stalled read retries.
    const sessionAt = sync.indexOf('await safeSessionResult(');
    assert.ok(genAt > 0 && sessionAt > genAt);
  });

  it('it bails before the push and never re-arms a retry after a wipe', () => {
    const pushAt = sync.indexOf("supabase.rpc('sync_my_enrollments'");
    const beforePush = sync.slice(0, pushAt);
    const afterPush = sync.slice(pushAt);
    assert.match(beforePush, /if \(gen !== generation\) return;/);
    // after the RPC answers, before the error branch can call scheduleServerSync
    const fenceAt = afterPush.indexOf('if (gen !== generation) return;');
    const retryAt = afterPush.indexOf('scheduleServerSync(');
    assert.ok(fenceAt > 0 && retryAt > fenceAt);
    // and the transport-throw branch
    const catchBody = afterPush.slice(afterPush.indexOf('} catch (e) {'));
    assert.ok(catchBody.indexOf('if (gen !== generation) return;') < catchBody.indexOf('scheduleServerSync('));
  });

  it('the server pull neither adopts the departing rows nor latches for the next identity', () => {
    const pull = store.slice(store.indexOf('async function reconcileFromServer('), store.indexOf('function scheduleServerSync('));
    assert.match(pull, /async function reconcileFromServer\(gen: number\)/);
    const readAt = pull.indexOf(".from('user_topic_enrollments')");
    const fenceAt = pull.indexOf('if (gen !== generation) return false;');
    // (the adopted rows go through the shared store's write, 2026-10-02)
    const adoptAt = pull.indexOf('const adopted = rows');
    assert.ok(readAt > 0 && fenceAt > readAt && adoptAt > fenceAt);
    assert.match(pull, /if \(gen === generation\) reconciled = true;/);
    assert.match(sync, /reconcileFromServer\(gen\)/);
  });
});

describe('the graded screens leave once on a double tap of Back', () => {
  it('FinalExam routes every plain back button through one latch', () => {
    const s = read('src', 'screens', 'exam', 'FinalExamScreen.tsx');
    assert.match(s, /const leavingRef = useRef\(false\);/);
    assert.match(s, /if \(leavingRef\.current\) return;\s*leavingRef\.current = true;\s*safeGoBack\(navigation\);/);
    assert.match(s, /<ExamBriefing[\s\S]*?onBack=\{leave\}/);
    assert.match(s, /<ExamHold submitting=\{submitting\} onBack=\{leave\} \/>/);
    assert.doesNotMatch(s, /label="Back"[^\n]*(?:navigation\.goBack\(\)|safeGoBack)/);
    // the latch is a hook, so it must sit above the first early return
    assert.ok(s.indexOf('const leave = useCallback(') < s.indexOf('if (!begun) {'));
  });

  it('Quiz routes its error-state Back buttons through one latch', () => {
    const s = read('src', 'screens', 'quiz', 'QuizScreen.tsx');
    assert.match(s, /if \(leavingRef\.current\) return;\s*leavingRef\.current = true;\s*safeGoBack\(navigation\);/);
    assert.doesNotMatch(s, /label="Back"[^\n]*(?:navigation\.goBack\(\)|safeGoBack)/);
    assert.ok(s.indexOf('const leave = useCallback(') < s.indexOf('if (startError) {'));
  });
});
