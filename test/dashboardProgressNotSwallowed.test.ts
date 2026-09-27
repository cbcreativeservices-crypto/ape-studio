/**
 * GUARD — a signed-in member's Study dashboard must never be silently replaced
 * by "nothing studied" (audit 2026-09-27).
 *
 * `fetchEnrollmentDashboard` powers the Dashboard's panels. Two ways it used to
 * turn a transient failure into an authoritative zero:
 *
 *   · it took ANY null from `myUserRow()` to mean "guest" and skipped the
 *     progress reads. `myUserRow()` never throws — it returns null on a
 *     getUser() network failure, on its 5 s stall timeout, and on the
 *     cold-start race where the first read goes out as anon.
 *   · it destructured `{ data: prog }` / `{ data: mRows }` and dropped
 *     `error`. supabase-js RESOLVES with `{ data: null, error }`, so an outage
 *     read as an empty result (the house rule in statePagingGuards).
 *
 * The Dashboard keeps its on-screen data only when the fetch THROWS, so both
 * paths powered every panel off and then CACHED the empty board for next
 * launch. Source-text guards, like their siblings: the function cannot be
 * imported without the real Supabase client.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function fetchEnrollmentBody(): string {
  const code = strip(read('src', 'features', 'dashboard', 'api.ts'));
  const start = code.indexOf('export async function fetchEnrollmentDashboard');
  assert.ok(start >= 0, 'fetchEnrollmentDashboard moved or was renamed — re-point this guard');
  const fn = code.slice(start);
  return fn.slice(0, fn.indexOf('\n}\n') + 1);
}

describe('fetchEnrollmentDashboard does not swallow errors as empty progress', () => {
  test('both progress reads keep and throw their error', () => {
    const body = fetchEnrollmentBody();
    for (const table of ['student_achievement_progress', 'student_method_progress']) {
      assert.ok(body.includes(`.from('${table}')`), `the ${table} read moved — re-verify this guard`);
    }
    assert.match(
      body,
      /\{ data: prog, error: (\w+) \}/,
      'the topic-progress read dropped its error again — an outage reads as "nothing studied"',
    );
    assert.match(
      body,
      /\{ data: mRows, error: (\w+) \}/,
      'the method-progress read dropped its error again — every panel powers off on a blip',
    );
    const progErr = body.match(/\{ data: prog, error: (\w+) \}/)![1];
    const mErr = body.match(/\{ data: mRows, error: (\w+) \}/)![1];
    assert.match(body, new RegExp(`if \\(${progErr}\\) throw ${progErr};`), 'the topic-progress error is no longer thrown');
    assert.match(body, new RegExp(`if \\(${mErr}\\) throw ${mErr};`), 'the method-progress error is no longer thrown');
  });

  test('a real session without a users row throws user_not_found (after one retry)', () => {
    const body = fetchEnrollmentBody();
    // Only a REAL account session can be the race; a guest (no session, or an
    // anonymous device key) must keep the empty-progress path.
    assert.match(
      body,
      /safeSession\(supabase\.auth\.getSession\(\)/,
      'the missing-row branch no longer asks getSession() whether this is a signed-in member',
    );
    assert.match(body, /isRealAccount\(/, 'a session is no longer checked with isRealAccount — an anonymous device key would throw');
    assert.ok(
      (body.match(/myUserRow</g) ?? []).length >= 2,
      'the users row is no longer retried once after getSession() — the cold-start race fails the first read',
    );
    assert.match(
      body,
      /throw new Error\('user_not_found'\)/,
      'a signed-in member with no users row is silently shown as a guest again',
    );
  });

  test('the old swallow-everything shape is gone', () => {
    const body = fetchEnrollmentBody();
    assert.doesNotMatch(
      body,
      /catch \{\s*\}/,
      'fetchEnrollmentDashboard has an empty catch again — it hides the account read failing',
    );
  });

  test('the Dashboard still maps user_not_found and keeps data on a failed silent refresh', () => {
    // The throws above are only worth anything because the consumer handles them.
    const screen = strip(read('src', 'screens', 'dashboard', 'DashboardScreen.tsx'));
    assert.ok(screen.includes("'user_not_found'"), 'DashboardScreen no longer recognises user_not_found');
    assert.match(screen, /if \(dataRef\.current \|\| .*\) return;/, 'a failed silent refresh replaces good content again');
  });
});

describe('an account switch clears the local mirror before the dashboard reloads', () => {
  test('EntitlementProvider emits only after clearAllLocalMethodStates settles', () => {
    const code = strip(read('src', 'features', 'commercial', 'EntitlementProvider.tsx'));
    assert.match(
      code,
      /clearAllLocalMethodStates\(\)[\s\S]{0,80}\.then\(emitStudyProgress\)/,
      'the progress emit no longer waits for the clear — a reload can read the previous account\'s mirror',
    );
  });
});

describe('offline replays run one pass at a time', () => {
  for (const [rel, label] of [
    [['src', 'features', 'quiz', 'api.ts'], 'quiz'],
    [['src', 'features', 'finalExam', 'api.ts'], 'final exam'],
  ] as const) {
    test(`the ${label} replay joins a pass already in flight`, () => {
      const code = strip(read(...rel));
      // A concurrent second pass re-submitted the same queued attempt and
      // showed the "Offline … submitted" notice twice.
      assert.match(
        code,
        /if \(\w*[rR]eplayInFlight\) return \w*[rR]eplayInFlight\.then\(/,
        `the ${label} replay no longer joins the pass in flight — concurrent loads submit twice`,
      );
    });
  }
});
