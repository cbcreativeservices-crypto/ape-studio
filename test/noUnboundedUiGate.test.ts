/**
 * GUARD — a call that gates the UI must have a deadline.
 *
 * The recurring failure of this project, by some distance. A request that HANGS
 * is not one that FAILS: `try/catch` catches a rejection, but a promise that
 * never settles is never caught, `finally` never runs, and any loading flag set
 * before it stays true for the life of the screen. Airplane-mode testing passes
 * it completely; only a stalled connection reveals it.
 *
 * Shipped instances, all the same shape:
 *   2026-09-22  glossary meter          screen stuck on its loading card
 *   2026-09-23  graded exam submit      no exit on iOS, capstone
 *   2026-09-23  graded quiz submit      COMPLETED ATTEMPT DESTROYED
 *   2026-09-23  glossary gateway        a tap did literally nothing, all tiers
 *   2026-09-23  calc meter              button stuck on "CALCULATING…"
 *   2026-09-23  directory search        spinner, no message, no retry
 *   2026-09-23  delete account          button permanently disabled
 *
 * This pins the FIX rather than any one site: the shared helper exists and the
 * known offenders route through it. A list of filenames would rot; what must
 * not regress is that these particular calls stay bounded.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('UI-gating calls are bounded', () => {
  test('the shared helper exists and offers BOTH shapes', () => {
    const lib = strip(read('src', 'lib', 'boundedCall.ts'));
    assert.match(lib, /export async function withDeadline/, 'withDeadline is gone');
    assert.match(lib, /export async function softDeadline/, 'softDeadline is gone');
    // Confusing the two is how a timeout becomes silent data loss: a graded
    // submit that RESOLVES to a fallback looks successful and is discarded.
    assert.match(lib, /reject\(new Error\(`\$\{label\} timeout/, 'withDeadline no longer rejects');
    assert.match(lib, /resolve\(fallback\)/, 'softDeadline no longer resolves to its fallback');
  });

  test('the "timeout" wording is preserved — a rescue depends on it', () => {
    // QuizScreen's offline rescue tests the error MESSAGE to decide whether to
    // save a finished attempt. Reword this and a graded quiz is silently lost.
    const lib = strip(read('src', 'lib', 'boundedCall.ts'));
    assert.match(lib, /timeout after/, 'the rejection no longer contains "timeout"');
    const quiz = strip(read('src', 'screens', 'quiz', 'QuizScreen.tsx'));
    assert.match(quiz, /timeout\|timed out/, 'QuizScreen no longer treats a timeout as transient');
  });

  const bounded: [string, string[], string][] = [
    ['graded quiz submit', ['src', 'features', 'quiz', 'api.ts'], 'submit_quiz'],
    ['glossary definition gateway', ['src', 'features', 'glossary', 'glossaryGateway.ts'], 'get_glossary_definition'],
    ['calculator meter', ['src', 'features', 'lab', 'calcUsage.ts'], 'calc_consume'],
    ['directory search', ['src', 'features', 'directory', 'api.ts'], 'directory_search'],
    ['delete account', ['src', 'features', 'settings', 'DeleteAccountButton.tsx'], 'delete_my_account'],
  ];

  for (const [label, path, rpc] of bounded) {
    test(`${label} stays bounded`, () => {
      const code = strip(read(...path));
      assert.ok(code.includes(rpc), `${rpc} is gone from ${path.join('/')} — re-verify this guard`);
      assert.ok(
        /withDeadline\(|softDeadline\(/.test(code),
        `${label} no longer uses a deadline — a stalled ${rpc} will freeze its screen again`,
      );
    });
  }

  test('the graded exam submit keeps its own bound', () => {
    // Bounded before the shared helper existed; left as-is rather than churned.
    const exam = strip(read('src', 'features', 'finalExam', 'api.ts'));
    assert.match(exam, /SUBMIT_TIMEOUT_MS/, 'the exam submit timeout is gone');
    assert.match(exam, /Promise\.race\(/, 'the exam submit no longer races a deadline');
  });
});
