/**
 * STUDY area, hunt 12 (2026-10-04). Each test FAILED against HEAD c0debb14
 * (R2: the fixed files were copied aside, `git show HEAD:<path>` written back,
 * this file run, the fixes restored and cmp'd).
 *
 *   1. finalExam/api — the offline exam queue stamped its owner through
 *      `getUser()`, a round trip to the auth server, on the branch entered
 *      BECAUSE the network had failed: almost every queued capstone was
 *      stamped null ("whoever is here"). Now the stored session's uid.
 *   2. quiz/api — a start refused as `user_not_found` while the session read
 *      was UNKNOWN (token refresh unreached) told a member "Sign out and back
 *      in". Now 'unknown' ("Could not start the quiz. Try again.").
 *   3. finalExam/api — the exam start had no cold-start retry at all (the
 *      quiz twin's 2026-09-20 fix) and the same false "Sign out and back in".
 *   4. EnrollmentScreen — an unread progress map printed "0%" on every row,
 *      "0 of N complete" and "CONTINUE LEARNING · 0%" (source-pinned: the
 *      screen imports React Native).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__SH12_AS__ = AS;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__SH12_AS__;
     export default {
       async getItem(k) { return s.has(k) ? s.get(k) : null; },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
       async multiGet(keys) { return keys.map((k) => [k, s.has(k) ? s.get(k) : null]); },
       async multiRemove(keys) { for (const k of keys) s.delete(k); },
     };`,
  );
const CRYPTO =
  'data:text/javascript,' +
  encodeURIComponent(`let n = 0; export function randomUUID() { n += 1; return 'minted-' + n; }`);
// getSession / getUser / rpc are swapped per test through globals.
const SUPABASE =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: {
      async getSession() { return globalThis.__SH12_SESSION__(); },
      async getUser() { return globalThis.__SH12_USER__(); },
    },
    async rpc(name, args) { return globalThis.__SH12_RPC__(name, args); },
  };`);
const TELEMETRY = 'data:text/javascript,' + encodeURIComponent(`export function trackEvent() {}`);
const REACT =
  'data:text/javascript,' +
  encodeURIComponent(`export function useSyncExternalStore(sub, get) { sub(() => {}); return get(); }
    export default {};`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'react') return { url: REACT, shortCircuit: true };
    if (specifier === './sync') return { url: new URL('./_stub-sync.mjs', import.meta.url).href, shortCircuit: true };
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier === 'expo-crypto') return { url: CRYPTO, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE, shortCircuit: true };
    if (specifier.endsWith('telemetry/telemetry')) return { url: TELEMETRY, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const exam = await import('../src/features/finalExam/api.ts');
const quiz = await import('../src/features/quiz/api.ts');
const scenarios = await import('../src/features/study/scenarioHomework.ts');

const signedIn = (uid: string) => () => ({ data: { session: { user: { id: uid }, access_token: 't' } }, error: null });
/** auth-js on an expired token + unreachable refresh: no session, retryable error. */
const refreshUnreached = () => ({
  data: { session: null },
  error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' },
});
const offlineUser = () => ({ data: { user: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } });

function fresh(): void {
  AS.clear();
  g.__SH12_SESSION__ = signedIn('auth-A');
  g.__SH12_USER__ = offlineUser;
  g.__SH12_RPC__ = () => ({ data: null, error: { message: 'no handler' } });
}
const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

// ── 1. Offline exam queue owner stamp ─────────────────────────────────────

test('an exam queued OFFLINE is stamped with its owner (stored session), not null', async () => {
  fresh();
  // The network is down: getUser() cannot reach the auth server. The stored
  // session (a valid, unexpired token) is still on the device.
  const ok = await exam.enqueueExamSubmission({
    attemptId: 'att-1',
    answers: {},
    submittedAt: '2026-10-04T00:00:00Z',
    submittedOffline: false,
    focusLossCount: 0,
    focusLossDuration: 0,
    awardType: 'certificate',
    awardId: 'cert-1',
  });
  assert.equal(ok, true);
  const rows = JSON.parse(AS.get('ape:finalExamQueue') ?? '[]') as { attemptId: string; userId: string | null }[];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, 'auth-A', 'the owner stamp was lost — the row now replays under whoever signs in');
});

test("a queued exam is NOT replayed under a different account's session", async () => {
  fresh();
  await exam.enqueueExamSubmission({
    attemptId: 'att-2',
    answers: {},
    submittedAt: '2026-10-04T00:00:00Z',
    submittedOffline: false,
    focusLossCount: 0,
    focusLossDuration: 0,
    awardType: 'certificate',
    awardId: 'cert-1',
  });
  // Back online, but B is now signed in on this phone.
  g.__SH12_SESSION__ = signedIn('auth-B');
  g.__SH12_USER__ = () => ({ data: { user: { id: 'auth-B' } }, error: null });
  const sent: string[] = [];
  g.__SH12_RPC__ = (name: string, args: { p_attempt_id?: string }) => {
    if (name === 'submit_final_exam') sent.push(String(args.p_attempt_id));
    return { data: { outcome: 'pass' }, error: null };
  };
  const done = await exam.replayExamSubmissions();
  assert.deepEqual(sent, [], "A's graded exam was submitted under B's session");
  assert.equal(done.length, 0);
  const rows = JSON.parse(AS.get('ape:finalExamQueue') ?? '[]') as { attemptId: string }[];
  assert.ok(rows.some((r) => r.attemptId === 'att-2'), "A's exam must stay queued for A");
});

// ── 2. Quiz start while the session is unknown ────────────────────────────

test('quiz start refused as user_not_found while the session is UNKNOWN is not "sign out and back in"', async () => {
  fresh();
  g.__SH12_SESSION__ = refreshUnreached;
  let calls = 0;
  g.__SH12_RPC__ = (name: string) => {
    if (name === 'start_quiz_attempt') calls += 1;
    return { data: null, error: { message: 'user_not_found' } };
  };
  await assert.rejects(quiz.startQuizAttempt('ach-1'), (e: unknown) => {
    assert.equal((e as { code?: string }).code, 'unknown');
    return true;
  });
  assert.equal(calls, 2, 'the one retry still runs');
});

test('quiz start: a genuinely signed-out caller still gets user_not_found (no change)', async () => {
  fresh();
  g.__SH12_SESSION__ = () => ({ data: { session: null }, error: null });
  g.__SH12_RPC__ = () => ({ data: null, error: { message: 'user_not_found' } });
  await assert.rejects(quiz.startQuizAttempt('ach-2'), (e: unknown) => (e as { code?: string }).code === 'user_not_found');
});

// ── 3. Final Exam start: cold-start retry + unknown session ───────────────

test('exam start retries once when the first call went out before the session loaded', async () => {
  fresh();
  let calls = 0;
  g.__SH12_RPC__ = (name: string) => {
    if (name !== 'start_final_exam') return { data: null, error: { message: 'no handler' } };
    calls += 1;
    return calls === 1
      ? { data: null, error: { message: 'user_not_found' } }
      : { data: { attempt_id: 'e1', items: [], started_at: '2026-10-04T00:00:00Z', time_limit_seconds: 600 }, error: null };
  };
  const p = await exam.startFinalExam('certificate', 'cert-9');
  assert.equal(p.attempt_id, 'e1');
  assert.equal(calls, 2);
});

test('exam start refused while the session is UNKNOWN is not "sign out and back in"', async () => {
  fresh();
  g.__SH12_SESSION__ = refreshUnreached;
  g.__SH12_RPC__ = () => ({ data: null, error: { message: 'user_not_found' } });
  await assert.rejects(exam.startFinalExam('certificate', 'cert-8'), (e: unknown) => {
    assert.equal((e as { code?: string }).code, 'unknown');
    return true;
  });
});

// ── 5. Scenario queue: an anon-role refusal is not a try ──────────────────

test('a queued scenario answer refused 42501 (sent without a token) is kept, not discarded as poison', async () => {
  fresh();
  // Five earlier server refusals already on the head: one more counted try
  // reaches MAX_TRIES (6) and the drain discards it.
  AS.set(
    'ape:scenarioQueue',
    JSON.stringify([
      { kind: 'answer', achievementId: 'a1', questionId: 'q1', round: 1, correct: true, at: 1, tries: 5 },
    ]),
  );
  g.__SH12_RPC__ = () => ({
    data: null,
    error: { code: '42501', message: 'permission denied for function record_scenario_answer' },
  });
  const left = await scenarios.flushScenarioQueue();
  assert.equal(left, 1, "the learner's answer was discarded as permanently failing");
  const stored = JSON.parse(AS.get('ape:scenarioQueue') ?? '[]') as { tries?: number }[];
  assert.equal(stored.length, 1);
  assert.equal(stored[0].tries, 5, 'a call that never reached the server as the learner costs no try');
});

test('a real server refusal still counts toward giving up (unchanged)', async () => {
  // The store is module-level; the previous test left its one item queued.
  g.__SH12_RPC__ = () => ({ data: null, error: { message: 'invalid input syntax for type uuid' } });
  const left = await scenarios.flushScenarioQueue();
  assert.equal(left, 0, 'six real refusals still give the call up');
});

// ── 4. Enrollments: unread progress is a dash, not 0% ─────────────────────

test('EnrollmentScreen never prints 0% for a topic whose progress was not read', () => {
  const s = src('screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /const pctText = \(gs: number\) => \(prog\.has\(gs\) \? `\$\{pctFor\(gs\)\}%` : '—'\)/);
  assert.doesNotMatch(s, /\{labPct\}%/, 'the lab row printed an unread % as 0%');
  assert.doesNotMatch(s, /\{pct\}%<\/Text>/, 'a topic row printed an unread % as 0%');
  assert.doesNotMatch(s, /CONTINUE LEARNING · \{resume\.pct\}%/, 'the resume banner printed an unread % as 0%');
  assert.match(s, /if \(all\.some\(\(r\) => !prog\.has\(r\.gs\)\)\) return `— of \$\{all\.length\} complete`;/);
});
