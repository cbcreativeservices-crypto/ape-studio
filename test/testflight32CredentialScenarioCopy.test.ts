/**
 * TestFlight build 32 reports (2026-09-30):
 *  1. Owner, "Analog Electronics for Audio" credential popup: sideways scrolling
 *     jumped to another credential or dragged the hero image sideways.
 *  2. Frank (iPhone SE): Scenarios read 0% while nearly through round one.
 *  3. Owner: "Enrollment is not free. That statement is confusing."
 * Source-reading + pure-function regressions (RN screens do not load under node:test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

const src = (p: string) => readFileSync(p, 'utf8');

// topicPct's imports pull in Supabase / AsyncStorage — stub them (same as
// timeTrialClearsMethod.test.ts). The scenarios branch never reaches them.
const STUB = new URL('./_stub-topicpct-deps.mjs', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.endsWith('study/api') ||
      specifier.endsWith('study/scenarioExempt') ||
      specifier.endsWith('study/termsExempt')
    ) {
      return { url: STUB, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { methodDisplayPct, scenarioAnsweredCounts, scenarioAnsweredPct, SCENARIO_ANSWERED_KEY, SCENARIO_TOTAL_KEY } =
  await import('../src/features/dashboard/topicPct.ts');

const mirror = (answered: number, total: number) => ({
  [SCENARIO_ANSWERED_KEY]: { attempts: answered },
  [SCENARIO_TOTAL_KEY]: { attempts: total },
});

// ── 1. credential popup: no sideways pager ─────────────────────────────────
test('Credential popup: no horizontal swipe pager (one credential, vertical scroll only)', () => {
  const s = src('src/screens/awards/CredentialDetailModal.tsx');
  assert.doesNotMatch(s, /import \{ DetailPager \}/, 'the pager is not imported');
  assert.doesNotMatch(s, /<DetailPager/, 'the pager is not rendered');
  assert.doesNotMatch(s, /\bhorizontal\b\s*\n?\s*pagingEnabled/);
  assert.match(s, /\{renderPage\(credential\)\}/);
});

// ── 2. scenarios mid-round progress ────────────────────────────────────────
test('Scenarios: mid-round answers move the display % off 0', () => {
  // Nearly through round 1 of 3 (9 of 10 answered, 30 items total) → 30%.
  assert.equal(methodDisplayPct({ completion_pct: 0, item_states: mirror(9, 30) }, 0, 'scenarios', 2), 30);
});

test('Scenarios: the server round step still wins when it is higher', () => {
  assert.equal(methodDisplayPct({ completion_pct: 33, item_states: mirror(2, 30) }, 0, 'scenarios', 2), 33);
  assert.equal(methodDisplayPct({ completion_pct: 100, item_states: mirror(0, 30) }, 0, 'scenarios', 2), 100);
});

test('Scenarios: the local share can never read complete (quiz gate stays server-owned)', () => {
  assert.equal(methodDisplayPct({ completion_pct: 67, item_states: mirror(30, 30) }, 0, 'scenarios', 2), 99);
  assert.equal(methodDisplayPct({ completion_pct: 0, item_states: mirror(40, 30) }, 0, 'scenarios', 2), 99);
});

test('Scenarios: no mirror / no row still reads the server value', () => {
  assert.equal(methodDisplayPct(undefined, 0, 'scenarios', 2), 0);
  assert.equal(methodDisplayPct({ completion_pct: 33 }, 0, 'scenarios', 2), 33);
  assert.equal(scenarioAnsweredPct({ [SCENARIO_ANSWERED_KEY]: { attempts: 5 } }), 0, 'no total → 0');
});

test('Scenarios: answered counts span all rounds', () => {
  const rounds = [[{ id: 'a' }, { id: 'b' }], [{ id: 'c' }], []];
  assert.deepEqual(scenarioAnsweredCounts(rounds, { a: { round: 1, correct: true } }), { answered: 1, total: 3 });
});

test('Scenarios screen mirrors the answered count on load and on every answer', () => {
  const s = src('src/screens/study/ScenariosScreen.tsx');
  assert.match(s, /scenarioAnsweredCounts\(hwRef\.current\?\.rounds \?\? \[\], answersRef\.current\)/);
  // Once in judge (before the save) and once after the server answers are loaded.
  assert.equal((s.match(/mirrorAnswered\(\);\s*\n\s*void saveLocalMethodStates\(achievementId, 'scenarios'/g) ?? []).length, 2);
});

// ── 3. enrollment is not free ──────────────────────────────────────────────
test('Copy: the enroll line never claims enrolling is free', async () => {
  const s = src('src/lib/copy.ts');
  const line = s.match(/enrollFreeLine: '([^']*)'/)?.[1] ?? '';
  assert.ok(line.length > 0);
  assert.doesNotMatch(line, /free|costs nothing|no cost/i);
  assert.match(line, /membership/i);
});
