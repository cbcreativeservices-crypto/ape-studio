/**
 * HOME + SHELL — toddler HUNT 9 (2026-10-03).
 *
 * 1. The Dashboard's sign-out (error screen "Back to Login", stranded-session
 *    "Sign Out") went straight to `supabase.auth.signOut()`. The SIGNED_OUT
 *    wipe (clearLocalAccountData) drops the offline study / quiz / scenario
 *    queues, and by then there is no session left to send them with.
 *    Settings › Log out sends them FIRST for exactly that reason; the
 *    Dashboard did not. The error screen is reached when a cold load FAILED —
 *    exactly when the launch drain failed too — so a learner who studied
 *    offline, got their connection back and tapped Back to Login ("Your
 *    saved progress stays with your account") lost that work silently. Now
 *    the queues are flushed (bounded, like Settings) before signing out.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('[R2] Dashboard sign-out sends the queued study/quiz/scenario work BEFORE signing out', () => {
  const src = read('src/screens/dashboard/DashboardScreen.tsx');
  const fn = src.slice(src.indexOf('async function signOutOrSay'), src.indexOf('export function DashboardScreen'));
  const flush = fn.search(/Promise\.allSettled\(\[replayQueue\(\), replayQuizSubmissions\(\), flushScenarioQueue\(\)\]\)/);
  const signOut = fn.indexOf("supabase.auth.signOut({ scope: 'local' })");
  assert.ok(flush >= 0, 'the queues are flushed in the sign-out path');
  assert.ok(signOut > flush, 'the flush comes before the sign-out');
  // Bounded, so a send that never answers cannot hold the button forever.
  assert.match(fn, /await softDeadline\(\s*async \(\) => \{\s*await Promise\.allSettled/);
  assert.match(src, /import \{ onStudyProgress, replayQueue \} from '\.\.\/\.\.\/features\/study\/sync';/);
  // (hunt 10 also imports pendingScenarioCount from here — the stranded count.)
  assert.match(src, /import \{ flushScenarioQueue(, pendingScenarioCount)? \} from '\.\.\/\.\.\/features\/study\/scenarioHomework';/);
});


// 2. (lead note, from the Labs B report) Start Here plays through
//    useCourseTone, which now reports a refused native start as `tone.error`
//    (AUDIO_UNAVAILABLE_MESSAGE). Start Here never rendered it, so a failed
//    start was silent there while every other lab on this voice says so.
test('[R2] Start Here shows the tone voice\'s refused-start message', () => {
  const src = read('src/screens/startHere/StartHereScreen.tsx');
  assert.match(src, /\{tone\.error \? <Text style=\{styles\.toneError\}>\{tone\.error\}<\/Text> : null\}/);
  assert.match(src, /toneError: \{[^}]*color: '#ff6b5e'[^}]*fontSize: 12\.5/);
});
