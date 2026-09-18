/**
 * Every server refusal the exam can raise must be recognised AND worded.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * There are two lists in `src/features/finalExam/api.ts` and only ONE of them
 * is checked by the compiler:
 *
 *   EXAM_START_ERROR_COPY  is `Record<ExamStartError, string>` — miss a key and
 *                          tsc fails. Safe.
 *   KNOWN_ERRORS           is `ExamStartError[]` — a plain array. Miss a member
 *                          and NOTHING complains.
 *
 * `parseStartError` scans KNOWN_ERRORS for a substring of the server's message.
 * A code that is in the union and in the copy table but missing from
 * KNOWN_ERRORS is never matched, so it falls through to 'unknown' and the
 * learner is told "Could not start the Final Exam. Try again." — in front of a
 * refusal that has perfectly good words written for it three lines above.
 *
 * That is precisely what would have happened to `result_held` (added
 * 2026-09-18 with the tenure rule): the compiler would have been satisfied, the
 * copy would have existed, and a learner whose paper was being held would have
 * been told to try again — which is the one thing they must not do, because
 * trying again is what the guard exists to stop.
 *
 * Derived from the source rather than restated, because a restated list drifts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const API = readFileSync(new URL('../src/features/finalExam/api.ts', import.meta.url), 'utf8');

/** Members of the `ExamStartError` union, read from its declaration. */
function unionMembers(): string[] {
  const start = API.indexOf('export type ExamStartError');
  assert.ok(start >= 0, 'could not find the ExamStartError declaration');
  const decl = API.slice(start, API.indexOf(';', start));
  // Only the union arms: `| 'name'`. Doc comments between arms are skipped
  // because they never match this shape.
  return [...decl.matchAll(/\|\s*'([a-z_]+)'/g)].map((m) => m[1]);
}

/** Entries of the KNOWN_ERRORS array. */
function knownErrors(): string[] {
  const start = API.indexOf('const KNOWN_ERRORS');
  assert.ok(start >= 0, 'could not find KNOWN_ERRORS');
  const body = API.slice(start, API.indexOf('];', start));
  return [...body.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

/**
 * The two codes that are produced by the CLIENT, not raised by the server, so
 * they have no business being matched against a server message.
 */
const CLIENT_ONLY = ['offline', 'unknown'];

describe('every server-raised exam refusal is recognised', () => {
  const union = unionMembers();
  const known = knownErrors();

  it('both lists were actually parsed', () => {
    // Without this, a broken regex makes every assertion below pass vacuously.
    assert.ok(union.length >= 8, `expected the union, got ${JSON.stringify(union)}`);
    assert.ok(known.length >= 8, `expected KNOWN_ERRORS, got ${JSON.stringify(known)}`);
    assert.ok(union.includes('already_earned'), 'sanity: already_earned should be in the union');
  });

  it('KNOWN_ERRORS covers every server code — none silently becomes "unknown"', () => {
    const serverCodes = union.filter((c) => !CLIENT_ONLY.includes(c));
    const missing = serverCodes.filter((c) => !known.includes(c));
    assert.deepEqual(
      missing,
      [],
      'these refusals have copy written for them but parseStartError will never match them, ' +
        'so the learner gets the generic "try again" instead:\n  ' +
        missing.join('\n  '),
    );
  });

  it('KNOWN_ERRORS contains nothing the union does not', () => {
    const orphans = known.filter((c) => !union.includes(c));
    assert.deepEqual(orphans, [], `KNOWN_ERRORS lists codes that are not in the union: ${orphans.join(', ')}`);
  });

  it('the client-only codes are NOT matched against server messages', () => {
    // 'unknown' is the fallback and 'offline' is decided by a network regex.
    // Either one in KNOWN_ERRORS would let a server message containing the
    // literal word "unknown" or "offline" hijack the result.
    for (const c of CLIENT_ONLY) {
      assert.ok(!known.includes(c), `${c} is client-produced and must not be in KNOWN_ERRORS`);
    }
  });
});

describe('the held-paper refusal is worded for a learner who did nothing wrong', () => {
  it('result_held exists and does not tell them to try again', () => {
    assert.ok(unionMembers().includes('result_held'), 'result_held must be a known refusal');
    const start = API.indexOf('result_held:');
    assert.ok(start >= 0, 'result_held needs its own copy entry');
    const copy = API.slice(start, API.indexOf('\n', API.indexOf("',", start)));
    // The guard exists to stop them re-sitting. Copy that invites a retry would
    // send them straight back into the refusal.
    assert.ok(!/try again/i.test(copy), 'held copy must not invite a retry — retrying is what is refused');
  });

  it('no copy promises a release date the client cannot know', () => {
    // The release date depends on member_since, which can move when a
    // membership lapses and restarts. Only the server can compute it.
    const start = API.indexOf('result_held:');
    const copy = API.slice(start, API.indexOf('\n', API.indexOf("',", start)));
    assert.ok(!/\bdays?\b|\bweeks?\b|\b\d+\/\d+/.test(copy), 'held copy must not name a date or a countdown');
  });
});
