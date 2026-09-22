/**
 * A passed Time Trial clears the method, and the Dashboard must say so.
 *
 * ⛔ WHAT THIS PINS. The Dashboard's gate readout is a MIRROR of the server's
 * quiz gate. The server honours a passed trial — `start_quiz_attempt` reads
 * `trial_passed`, and `build_study_snapshot` returns
 *
 *     gate_pass = COALESCE(trial_passed,false) OR (completion AND time AND accuracy)
 *
 * — while `gateReadout` looked only at `completion_pct`, and the Dashboard's
 * query did not even SELECT the column. So a learner who passed a trial was
 * shown "NEED 100%" on a method the server had already cleared: the readout
 * contradicting the thing it exists to reflect.
 *
 * It was invisible because the WRITE was broken too. `credit_time_trial` only
 * ever implemented the retired course model — its first eligibility check is
 * `IF v_course IS NULL THEN RAISE EXCEPTION 'not_enrolled'` and all 175 v3
 * topics have `course_id IS NULL` — so the flag was never set for anyone and
 * the mirror was never observably wrong. `recordTimeTrialPass` swallows the
 * error by design, so nothing surfaced. Migration 2026092102 fixes the write;
 * these pin the read, because fixing one without the other just moves which
 * half is wrong.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gateReadout } from '../src/features/dashboard/gates.ts';
import type { MethodProgressRow, StudyMethodConfig } from '../src/features/dashboard/api.ts';

const cfg = { key: 'matching', name: 'Matching' } as StudyMethodConfig;

const row = (over: Partial<MethodProgressRow>): MethodProgressRow => ({
  achievement_id: 'a1',
  method_key: 'matching',
  completion_pct: 0,
  engagement_seconds: 0,
  answered_count: 0,
  correct_count: 0,
  item_states: null,
  trial_passed: null,
  ...over,
});

test('a passed trial clears the method even at 0% complete', () => {
  const g = gateReadout(cfg, row({ completion_pct: 0, trial_passed: true }));
  assert.equal(g.gatePass, true, 'the server already treats this method as cleared');
});

test('and the readout stops demanding 100% — no contradiction on screen', () => {
  const g = gateReadout(cfg, row({ completion_pct: 40, trial_passed: true }));
  assert.deepEqual(g.lines, [], 'telling the learner "NEED 100%" here contradicts the quiz');
});

test('the real percentage is still reported — the trial does not fake progress', () => {
  const g = gateReadout(cfg, row({ completion_pct: 40, trial_passed: true }));
  assert.equal(g.pct, 40, 'a cleared gate must not overstate how much was studied');
});

test('no trial: completion still governs, exactly as before', () => {
  assert.equal(gateReadout(cfg, row({ completion_pct: 99 })).gatePass, false);
  assert.equal(gateReadout(cfg, row({ completion_pct: 100 })).gatePass, true);
});

test('trial_passed false or null is not a pass — fail closed', () => {
  assert.equal(gateReadout(cfg, row({ completion_pct: 10, trial_passed: false })).gatePass, false);
  assert.equal(gateReadout(cfg, row({ completion_pct: 10, trial_passed: null })).gatePass, false);
});

test('a missing row is still fail-closed', () => {
  const g = gateReadout(cfg, undefined);
  assert.equal(g.gatePass, false);
  assert.equal(g.pct, 0);
});
