/**
 * HOME + SHELL — toddler HUNT 10 (2026-10-03).
 *
 * C1 (correction to hunt 9's Dashboard sign-out flush). Hunt 9 copied the
 *    FIRST half of Settings › Log out's rule: send the offline study / quiz /
 *    scenario queues before signing out. It left out the second half: count
 *    what is STILL queued after that bounded send and say so before
 *    discarding it. The send can fail while the sign-out succeeds (flaky
 *    connection, a send past the 15 s bound, a refused replay), and the
 *    SIGNED_OUT wipe then dropped the work silently — under "Your saved
 *    progress stays with your account". Now the Dashboard names the count
 *    and asks, like Settings; NOT NOW keeps the work queued.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('[R2] Dashboard sign-out counts what the flush could not send and asks before discarding it', () => {
  const src = read('src/screens/dashboard/DashboardScreen.tsx');
  const fn = src.slice(src.indexOf('async function signOutOrSay'), src.indexOf('export function DashboardScreen'));
  const flush = fn.indexOf('Promise.allSettled([replayQueue(), replayQuizSubmissions(), flushScenarioQueue()])');
  const count = fn.search(
    /getQueuedBatches\(\)\.length \+ getQueuedSubmissions\(\)\.length \+ \(await pendingScenarioCount\(\)\.catch\(\(\) => 0\)\)/,
  );
  const signOut = fn.indexOf("supabase.auth.signOut({ scope: 'local' })");
  assert.ok(flush >= 0 && count > flush, 'the stranded count is taken after the flush');
  assert.ok(signOut > count, 'and before the sign-out');
  // A stranded queue asks (destructive) and returns — the sign-out only runs on YES.
  const guard = fn.slice(count, fn.indexOf('async function finishSignOut'));
  assert.match(guard, /if \(stranded > 0\) \{[\s\S]*confirmDialog\([\s\S]*DISCARDS[\s\S]*finishSignOut\(onDone\)[\s\S]*destructive: true[\s\S]*return;\s*\}/);
  assert.match(src, /import \{ getQueuedBatches \} from '\.\.\/\.\.\/features\/study\/studyQueueStorage';/);
  assert.match(src, /import \{ getQueuedSubmissions \} from '\.\.\/\.\.\/features\/quiz\/submissionQueueStorage';/);
});

test('the sign-out itself still marks, checks the error and only then navigates', () => {
  const src = read('src/screens/dashboard/DashboardScreen.tsx');
  const fn = src.slice(src.indexOf('async function finishSignOut'), src.indexOf('export function DashboardScreen'));
  assert.ok(fn.length > 0);
  const mark = fn.indexOf('markIntentionalSignOut()');
  const so = fn.indexOf("supabase.auth.signOut({ scope: 'local' })");
  const err = fn.indexOf('consumeIntentionalSignOut()');
  const done = fn.indexOf('onDone()');
  assert.ok(mark >= 0 && so > mark && err > so && done > err);
});
