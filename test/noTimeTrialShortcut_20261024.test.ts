/**
 * NO SHORTCUT TO THE QUIZ (owner 2026-10-24): "We need to remove the time trial
 * easy bypass for the quiz… There should be no way for a person to pass
 * without doing the work."
 *
 * A passed 15-minute TIME TRIAL (started from OPEN PACE SETTINGS) called
 * `credit_time_trial`, and the app counted `trial_passed` as a whole study
 * method at 100% toward unlocking the topic quiz. The trial is removed from
 * the app; this ratchet keeps it out. (The server half — `start_quiz_attempt`
 * no longer honouring `trial_passed`, `credit_time_trial` retired — is
 * Comp A's, handoff 2026-10-24.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');

function srcFiles(dir = join(root, 'src')): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...srcFiles(p));
    else if (/\.(tsx?|ts)$/.test(n)) out.push(p);
  }
  return out;
}

test('the time-trial module is gone', () => {
  assert.equal(existsSync(join(root, 'src/features/study/timeTrial.ts')), false);
});

test('no app code starts, scores, credits or reads a time trial', () => {
  const bad: string[] = [];
  for (const f of srcFiles()) {
    const s = readFileSync(f, 'utf8');
    // Code, not the explanatory comments that record the removal.
    const code = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const needle of [
      'timeTrial',
      'TimeTrial',
      'registerTrialAnswer',
      'startTimeTrial',
      "rpc('credit_time_trial'",
      'trial_passed',
      'TIME_TRIAL',
    ]) {
      if (code.includes(needle)) bad.push(`${f.slice(root.length + 1)}: ${needle}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('OPEN PACE SETTINGS has no TIME TRIAL panel or start button', () => {
  const s = read('src/features/study/PaceTimerModal.tsx');
  assert.doesNotMatch(s, />TIME TRIAL</);
  assert.doesNotMatch(s, /START TIME TRIAL/);
  assert.doesNotMatch(s, /handleStartTrial/);
});

test('the dashboard gate formula never treats a trial as a completed method', () => {
  const s = read('src/features/dashboard/topicPct.ts');
  assert.doesNotMatch(s, /trial_passed === true\) return 100/);
  assert.doesNotMatch(read('src/features/dashboard/api.ts'), /trial_passed/);
});
