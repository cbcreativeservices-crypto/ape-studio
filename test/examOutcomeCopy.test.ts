/**
 * Every exam outcome must have its own words. The fallback is a lie.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * `FinalExamResultScreen` picks its copy with:
 *
 *     const copy = COPY[result.outcome] ?? COPY.no_pass;
 *
 * That fallback is sensible defensive code and it is also the most dangerous
 * line on the screen. An outcome with no entry in COPY renders as **NOT
 * PASSED** — so adding a server-side outcome and forgetting the copy does not
 * crash, does not warn, and does not look broken. It tells a learner they
 * failed the hardest thing in the product.
 *
 * Two outcomes were added on 2026-09-18 (`held`, `discarded`) for the one-month
 * membership rule. Both carry a redacted payload with no score. Had either been
 * missed, someone whose paper was merely being held would have been told they
 * did not pass, with no score shown to contradict it.
 *
 * So: the union and the copy table are read out of the two source files and
 * compared. Derived mechanically, because this is exactly the kind of pairing
 * that drifts silently — the same lesson as membershipGating.test.ts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const API = readFileSync(new URL('../src/features/finalExam/api.ts', import.meta.url), 'utf8');
const SCREEN = readFileSync(
  new URL('../src/screens/exam/FinalExamResultScreen.tsx', import.meta.url),
  'utf8',
);

/** The members of the `ExamOutcome` union, read from its declaration. */
function outcomes(): string[] {
  const start = API.indexOf('export type ExamOutcome');
  assert.ok(start >= 0, 'could not find the ExamOutcome declaration');
  const decl = API.slice(start, API.indexOf(';', start));
  return [...decl.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

/** The keys of the screen's COPY table. */
function copyKeys(): string[] {
  const start = SCREEN.indexOf('const COPY');
  assert.ok(start >= 0, 'could not find the COPY table');
  const body = SCREEN.slice(start, SCREEN.indexOf('\n};', start));
  return [...body.matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]);
}

describe('the exam result screen has words for every outcome', () => {
  const all = outcomes();
  const keys = copyKeys();

  it('both files were actually parsed', () => {
    // If either regex stops matching, every assertion below passes vacuously —
    // which would be worse than the drift it is guarding against.
    assert.ok(all.length >= 4, `expected the ExamOutcome union, got ${JSON.stringify(all)}`);
    assert.ok(keys.length >= 4, `expected the COPY table, got ${JSON.stringify(keys)}`);
    assert.ok(all.includes('pass'), 'the union should contain pass');
    assert.ok(keys.includes('pass'), 'the copy table should contain pass');
  });

  it('EVERY outcome has its own entry — none falls through to NOT PASSED', () => {
    const missing = all.filter((o) => !keys.includes(o));
    assert.deepEqual(
      missing,
      [],
      'these outcomes would render as "NOT PASSED" via the ?? COPY.no_pass fallback:\n  ' +
        missing.join('\n  '),
    );
  });

  it('the two withheld outcomes are present and are NOT worded as a failure', () => {
    // Specifically pinned: these are the ones where a wrong word is worst,
    // because the learner has no score on screen to contradict it.
    for (const o of ['held', 'discarded']) {
      assert.ok(keys.includes(o), `${o} must have its own copy`);
    }
    const block = SCREEN.slice(SCREEN.indexOf('const COPY'), SCREEN.indexOf('\n};', SCREEN.indexOf('const COPY')));
    const held = block.slice(block.indexOf('  held:'));
    assert.ok(!/NOT PASSED/.test(held.slice(0, 200)), 'a held paper must not be titled NOT PASSED');
  });

  it('no copy entry exists for an outcome the server cannot send', () => {
    // The other direction: a leftover key is dead weight and, worse, suggests
    // the server still sends something it does not.
    const orphans = keys.filter((k) => !all.includes(k));
    assert.deepEqual(orphans, [], `copy for outcomes that no longer exist: ${orphans.join(', ')}`);
  });
});

describe('the score block is gated on the result being released', () => {
  it('reads score only behind `graded`, and `graded` requires `released`', () => {
    // The redacted payloads carry no score. If the score block is ever shown
    // for them it renders blank — or, if someone "helpfully" defaults it, a
    // zero the learner did not earn.
    assert.match(
      SCREEN,
      /const graded = released &&/,
      '`graded` must be gated on `released` so held/discarded never reach the score block',
    );
    assert.match(SCREEN, /const released = isReleased\(result\)/, 'released should come from isReleased()');
  });
});
