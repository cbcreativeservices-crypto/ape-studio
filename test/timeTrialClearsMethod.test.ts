/**
 * A passed Time Trial clears the method — in the formula the app actually uses.
 *
 * ⛔ THIS TEST REPLACES ONE THAT TESTED DEAD CODE.
 *
 * The first version of this fix went into `features/dashboard/gates.ts`, whose
 * header describes it as the Dashboard's mirror of the server gate and which
 * carried a careful comment about having been corrected for `trial_passed`.
 * Nothing imported it. `gateReadout` was exported and never called, so the fix
 * was real, the tests passed, and not one pixel changed. It was found by an
 * independent hunt a day later, and the file has been deleted rather than left
 * to catch the next person the same way.
 *
 * The live formula is `smoothMethodPct` in `features/dashboard/topicPct.ts`,
 * shared by the Dashboard rack, Enrollments, Profile and the Directory.
 *
 * WHY 100 IS THE RIGHT ANSWER: the server already treats a passed trial as
 * clearing the method — `start_quiz_attempt` reads `trial_passed`, and
 * `build_study_snapshot` returns
 *   gate_pass = COALESCE(trial_passed,false) OR (completion AND time AND accuracy)
 * Reporting anything less would leave the app refusing to light a stage the
 * server would have allowed, right after telling the learner they had cleared it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

// topicPct imports `../study/api` (which pulls in the Supabase client) and
// `../study/scenarioExempt`. Neither is reached by the branch under test, so
// they are stubbed rather than dragged in.
const STUB = new URL('./_stub-topicpct-deps.mjs', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('study/api') || specifier.endsWith('study/scenarioExempt')) {
      return { url: STUB, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { smoothMethodPct } = await import('../src/features/dashboard/topicPct.ts');
type MethodPctRow = Parameters<typeof smoothMethodPct>[0];

const TOPIC = 'topic-with-scenarios';
const row = (over: Partial<NonNullable<MethodPctRow>> = {}): MethodPctRow => ({
  item_states: {},
  completion_pct: 0,
  trial_passed: null,
  ...over,
});

test('a passed trial reads as cleared, even with nothing studied', () => {
  assert.equal(smoothMethodPct(row({ trial_passed: true }), 50, 'matching', TOPIC, 1), 100);
});

test('it clears every method, not just one', () => {
  for (const key of ['flashcards', 'fill_in_blank', 'matching', 'scenarios']) {
    assert.equal(
      smoothMethodPct(row({ trial_passed: true }), 50, key, TOPIC, 1),
      100,
      `${key} should read cleared after a passed trial`,
    );
  }
});

test('false or null is NOT a pass — fail closed', () => {
  assert.equal(smoothMethodPct(row({ trial_passed: false }), 50, 'matching', TOPIC, 1), 0);
  assert.equal(smoothMethodPct(row({ trial_passed: null }), 50, 'matching', TOPIC, 1), 0);
  assert.equal(smoothMethodPct(row(), 50, 'matching', TOPIC, 1), 0);
});

test('a missing row is still 0, not a pass', () => {
  assert.equal(smoothMethodPct(undefined, 50, 'matching', TOPIC, 1), 0);
});

test('without a trial, the ordinary formula is untouched', () => {
  // scenarios reads its server completion_pct straight through.
  assert.equal(smoothMethodPct(row({ completion_pct: 67 }), 50, 'scenarios', TOPIC, 1), 67);
  assert.equal(smoothMethodPct(row({ completion_pct: 0 }), 50, 'scenarios', TOPIC, 1), 0);
});

test('SOURCE GUARD: the dead mirror stays deleted', () => {
  // It described itself as the Dashboard's gate mirror and had no callers, so
  // anyone fixing "the gate" edited it and changed nothing. Twice is enough.
  let exists = true;
  try {
    readFileSync(new URL('../src/features/dashboard/gates.ts', import.meta.url));
  } catch {
    exists = false;
  }
  assert.equal(
    exists,
    false,
    'features/dashboard/gates.ts is back. It has no callers and impersonates the real gate — ' +
      'the live formula is smoothMethodPct in topicPct.ts.',
  );
});
