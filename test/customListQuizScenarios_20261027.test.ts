/**
 * MY CUSTOM LIST — scenarios and the practice quiz, app half (must-do D12,
 * owner GO 2026-10-27).
 *
 * The server half went live as Comp A's RPCs (read back, SELECT-only, on
 * 2026-10-27): `start_custom_list_quiz(p_glossary_ids uuid[], p_count int,
 * p_client_attempt_id uuid)`, `submit_custom_list_quiz(…)` and
 * `get_custom_list_scenarios(p_glossary_ids uuid[])` — members only, practice
 * only, no progress stored.
 *
 * What this pins:
 *   1. The list quiz and scenarios call ONLY the custom-list RPCs. The pseudo-id
 *      'flagged' never reaches start_quiz_attempt / submit_quiz /
 *      get_scenario_homework / record_scenario_answer / complete_scenario_round.
 *   2. The WHOLE list goes up with the length, so the server can substitute a
 *      term that has no question (owner: "substitute").
 *   3. Fewer than 30 terms is refused — before BEGIN by the app, by the server
 *      as a backstop (custom_list_too_small has its own words).
 *   4. Resume: the same length rejoins the same sitting; a new length is a
 *      new draw.
 *   5. Practice wording: never "topic complete", never a celebration.
 *   6. The copy names all five methods.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__CLQ_AS__ = AS;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__CLQ_AS__;
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
const SUPABASE =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: { user: { id: 'u' }, access_token: 't' } }, error: null }; } },
    async rpc(name, args) { return globalThis.__CLQ_RPC__(name, args); },
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

const quiz = await import('../src/features/quiz/api.ts');
const scenarios = await import('../src/features/study/scenarioHomework.ts');
const gate = await import('../src/features/commercial/studyGate.ts');
const { HELP_CATEGORIES } = await import('../src/features/help/helpContent.ts');

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const DASH = 'src/screens/dashboard/DashboardScreen.tsx';

type Call = { name: string; args: Record<string, unknown> };
let calls: Call[] = [];
const TOPIC_RPCS = [
  'start_quiz_attempt',
  'submit_quiz',
  'get_scenario_homework',
  'record_scenario_answer',
  'complete_scenario_round',
  'start_scenario_cycle',
];

function fresh(handler: (name: string, args: Record<string, unknown>) => { data: unknown; error: { message: string } | null }) {
  AS.clear();
  calls = [];
  g.__CLQ_RPC__ = (name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    return handler(name, args);
  };
}
const ids = (n: number) => Array.from({ length: n }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`);
const payload = (n: number) => ({
  attempt_id: 'att-1',
  kind: 'custom_list',
  started_at: new Date().toISOString(),
  is_practice: true,
  time_limit_seconds: 20 * n,
  requested_count: n,
  served_count: n,
  questions: [],
});

/* ── 1. Only the custom-list RPCs ─────────────────────────────────────────── */

test('1a. the list quiz starts on start_custom_list_quiz with the WHOLE list, the length and a client attempt id', async () => {
  fresh((name, args) => ({ data: payload(Number(args.p_count)), error: null }));
  const list = new Set(ids(80));
  const p = await quiz.startCustomListQuiz([...list, 'not-a-uuid'], 50);
  assert.equal(p.is_practice, true);
  assert.deepEqual(calls.map((c) => c.name), ['start_custom_list_quiz']);
  const a = calls[0].args;
  // Not a client-side draw: every term goes up, so the server can substitute.
  assert.deepEqual(a.p_glossary_ids, [...list]);
  assert.equal(a.p_count, 50);
  assert.equal(typeof a.p_client_attempt_id, 'string');
  assert.ok(!('p_achievement_id' in a), 'the list has no topic id to send');
});

test('1b. startQuizAttempt refuses the flagged id before any call leaves the phone', async () => {
  fresh(() => ({ data: payload(30), error: null }));
  await assert.rejects(quiz.startQuizAttempt(gate.CUSTOM_LIST_ID), (e: unknown) => (e as { code?: string }).code === 'unknown');
  assert.equal(calls.length, 0);
});

test('1c. the list quiz submits on submit_custom_list_quiz — online and from the offline queue', async () => {
  fresh((name) => ({
    data: { attempt_id: 'att-1', kind: 'custom_list', is_practice: true, score: 31, outcome: 'full_pass', wrong_answers: {} },
    error: null,
  }));
  const args = {
    attemptId: 'att-1',
    answers: { '1': 'A' },
    submittedAt: new Date().toISOString(),
    submittedOffline: false,
    focusLossCount: 0,
    focusLossDuration: 0,
  };
  await quiz.submitCustomListQuiz(args);
  assert.deepEqual(calls.map((c) => c.name), ['submit_custom_list_quiz']);
  // Offline: the queued row carries 'flagged' and replays on the list's own submit.
  calls = [];
  assert.equal(quiz.enqueueSubmission({ ...args, attemptId: 'att-2', achievementId: gate.CUSTOM_LIST_ID }), true);
  assert.equal(quiz.enqueueSubmission({ ...args, attemptId: 'att-3', achievementId: 'topic-uuid' }), true);
  const out = await quiz.replayQuizSubmissions();
  assert.deepEqual(
    calls.map((c) => [c.name, c.args.p_attempt_id]),
    [
      ['submit_custom_list_quiz', 'att-2'],
      ['submit_quiz', 'att-3'],
    ],
  );
  assert.equal(out.length, 2);
});

test('1d. list scenarios come from get_custom_list_scenarios; flagged never reaches a topic scenario RPC', async () => {
  fresh((name) =>
    name === 'get_custom_list_scenarios'
      ? {
          data: {
            kind: 'custom_list',
            assignment: { g1: ['q1', 'q2'] },
            questions: {
              q1: { prompt: 'P1', options: ['a', 'b'], question_type: 'mc', correct_answer: 'a', term: 'T' },
              q2: { prompt: 'P2', options: ['c', 'd'], question_type: 'mc', correct_answer: 'd', term: 'T' },
            },
          },
          error: null,
        }
      : { data: null, error: { message: 'should not be called' } },
  );
  const [g1, g2] = ids(2);
  // Duplicates count once; a malformed stored id is dropped, never sent to a uuid[].
  const hw = await scenarios.fetchCustomListScenarios([g1, g1, g2, 'not-a-uuid']);
  assert.ok(hw);
  assert.equal(hw!.rounds[0].length, 1);
  assert.equal(hw!.rounds[1].length, 1);
  assert.equal(hw!.roundsCompleted, 0, 'nothing stored: always a fresh set');
  assert.deepEqual(hw!.answers, {});
  assert.deepEqual(calls.map((c) => c.name), ['get_custom_list_scenarios']);
  assert.deepEqual(calls[0].args, { p_glossary_ids: [g1, g2] });
  // The topic scenario RPCs refuse the pseudo-id outright.
  calls = [];
  assert.equal(await scenarios.fetchScenarioHomework(gate.CUSTOM_LIST_ID), null);
  assert.equal(await scenarios.recordScenarioAnswer(gate.CUSTOM_LIST_ID, 'q1', 1, true), true);
  assert.deepEqual(await scenarios.completeScenarioRound(gate.CUSTOM_LIST_ID, 1), { roundsCompleted: 1, saved: true });
  assert.equal(calls.length, 0, `called ${calls.map((c) => c.name).join(', ')}`);
  // Server refusal (members only) is the honest "couldn't load" face.
  fresh(() => ({ data: { error: 'academy_required' }, error: null }));
  assert.equal(await scenarios.fetchCustomListScenarios([g1]), null);
});

test('1e. the screens route the list to the custom RPCs and record nothing for it', () => {
  const q = read('src/screens/quiz/QuizScreen.tsx');
  assert.match(q, /const customMode = isCustomListId\(achievementId\);/);
  assert.match(
    q,
    /const p = customMode\s*\? await readTermList\('starred'\)\.then\(\s*\(ids\) => startCustomListQuiz\(ids, customCount \?\? CUSTOM_QUIZ_MIN\),/,
  );
  assert.match(q, /: await startQuizAttempt\(achievementId\);/);
  assert.match(q, /const result = await \(customMode \? submitCustomListQuiz : submitQuiz\)\(args\);/);
  // Practice: never the topic celebration.
  assert.match(q, /if \(!customMode && result\.outcome === 'full_pass' && !payload\.is_practice\) \{/);

  const s = read('src/screens/study/ScenariosScreen.tsx');
  assert.match(s, /const customMode = isCustomListId\(achievementId\);/);
  assert.match(s, /\(customMode\s*\? readTermList\('starred'\)\.then\(\(ids\) => fetchCustomListScenarios\(ids\), \(\) => null\)\s*: fetchScenarioHomework\(achievementId\)\s*\)/);
  assert.match(s, /if \(!customMode\) \{\s*void recordScenarioAnswer\(/);
  assert.match(s, /if \(customMode\) \{\s*setRoundSaved\(true\);\s*return;\s*\}/);
  assert.match(s, /if \(!customMode\) void markScenariosExempt\(achievementId\)/);
  // Every local mirror write is skipped for the list.
  const mirrors = s.match(/saveLocalMethodStates\(achievementId, 'scenarios'/g) ?? [];
  const guarded = s.match(/if \(!customMode\) void saveLocalMethodStates\(achievementId, 'scenarios'/g) ?? [];
  assert.equal(mirrors.length - guarded.length, 1, 'only finishRound’s write, after its custom early return');
});

/* ── 2/4. Resume rules ────────────────────────────────────────────────────── */

test('4. the same length rejoins the same sitting; another length is a new draw', async () => {
  fresh((name, args) => ({ data: payload(Number(args.p_count)), error: null }));
  const list = ids(120);
  await quiz.startCustomListQuiz(list, 30);
  await quiz.startCustomListQuiz(list, 30);
  await quiz.startCustomListQuiz(list, 100);
  const [a, b, c] = calls.map((x) => x.args.p_client_attempt_id);
  assert.equal(a, b, 'a relaunch at the same length must rejoin');
  assert.notEqual(a, c, 'a new length must not rejoin a sitting of another size');
  // After a finished attempt the intent is cleared, so the next start is new.
  await quiz.clearQuizIntent(gate.CUSTOM_LIST_ID);
  await quiz.startCustomListQuiz(list, 100);
  assert.notEqual(calls[3].args.p_client_attempt_id, c);
});

/* ── 3. Fewer than 30 terms ───────────────────────────────────────────────── */

test('3a. the app refuses a list under 30 before BEGIN (popup), and clamps the length', () => {
  for (const n of [0, 1, 29]) assert.notEqual(gate.customQuizTap({ read: true, unreadable: false, count: n }), 'choose');
  assert.equal(gate.customQuizTap({ read: true, unreadable: false, count: 30 }), 'choose');
  assert.equal(gate.clampQuizLength(30, 29), null);
  const d = read(DASH);
  const at = d.indexOf('const beginCustomQuiz = (n: number) => {');
  const body = d.slice(at, d.indexOf('};', at));
  assert.match(body, /const len = clampQuizLength\(n, starred\.size\);/);
  assert.match(body, /if \(len == null\) \{[\s\S]*notify\(CUSTOM_QUIZ_MIN_TITLE, customQuizMinBody\(starred\.size\)\);\s*return;\s*\}/);
  assert.match(
    body,
    /navigation\.navigate\('Quiz', \{ achievementId: FLAGGED_TOPIC_ID, topicName: FLAGGED_TOPIC_NAME, customCount: len \}\)/,
  );
  assert.doesNotMatch(body, /drawRandomTerms|console\.warn/);
});

test('3b. the server refusal under 30 is said in words, not as an error code', async () => {
  fresh(() => ({ data: null, error: { message: 'custom_list_too_small' } }));
  await assert.rejects(quiz.startCustomListQuiz(ids(12), 30), (e: unknown) => (e as { code?: string }).code === 'custom_list_too_small');
  assert.match(quiz.QUIZ_START_ERROR_COPY.custom_list_too_small, /at least 30 terms/);
  fresh(() => ({ data: null, error: { message: 'custom_list_no_questions' } }));
  await assert.rejects(quiz.startCustomListQuiz(ids(40), 30), (e: unknown) => (e as { code?: string }).code === 'custom_list_no_questions');
  // The list's own words for membership / lockout; topics keep theirs.
  assert.match(quiz.quizStartErrorCopy('academy_required', true), /My Custom List quiz/);
  assert.equal(quiz.quizStartErrorCopy('academy_required', false), quiz.QUIZ_START_ERROR_COPY.academy_required);
});

/* ── 5. Practice wording ──────────────────────────────────────────────────── */

test('5. practice wording: not counted, never "topic complete", no certificate or credit', () => {
  for (const line of Object.values(quiz.CUSTOM_LIST_QUIZ_OUTCOME_COPY)) {
    assert.doesNotMatch(line, /topic is complete|certificate|credit|banked|\bvoid/i);
  }
  assert.match(quiz.quizOutcomeCopy(gate.CUSTOM_LIST_ID, 'full_pass'), /not counted/);
  assert.equal(quiz.quizOutcomeCopy('topic-uuid', 'full_pass'), quiz.QUIZ_OUTCOME_COPY.full_pass);
  const d = read(DASH);
  assert.match(d, /`Score \$\{result\.score\}\. \$\{quizOutcomeCopy\(quizId, result\.outcome\)\}`/);
  const r = read('src/screens/results/ResultsScreen.tsx');
  assert.match(r, /const customList = isCustomListId\(achievementId\);/);
  assert.match(r, /Practice on My Custom List: not counted toward anything, and nothing is recorded as progress\./);
  // Retake asks for the same length again.
  assert.match(r, /params: \{ achievementId, topicName, \.\.\.\(customList \? \{ customCount \} : null\) \}/);
  assert.match(read('src/screens/quiz/QuizScreen.tsx'), /isPractice: customMode \|\| payload\.is_practice,/);
});

/* ── 6. The copy names all five methods ──────────────────────────────────── */

test('6. every place that describes the list names all five methods', () => {
  assert.deepEqual(gate.customListMethods(), ['flashcards', 'fill_in_blank', 'matching', 'scenarios']);
  assert.equal(gate.customListHasQuiz(), true);
  const five = (text: string, where: string) => {
    for (const w of ['flashcards', 'fill-in-the-blank', 'matching', 'scenarios', 'quiz']) {
      assert.ok(text.toLowerCase().includes(w), `${where} does not name ${w}`);
    }
  };
  const sheet = read('src/features/commercial/StudyAccessSheet.tsx');
  const body = sheet.match(/ body: '([^']*)',/)?.[1] ?? '';
  five(body, 'the membership sheet');
  const intros = read('src/features/intro/screenIntros.ts');
  const para = intros.match(/'(Your deck sits on the Study dashboard[^']*)'/)?.[1] ?? '';
  five(para, 'the intro');
  const study = HELP_CATEGORIES.find((c) => c.key === 'study')!;
  five(study.entries.find((e) => e.id === 'study-custom-list')!.a, 'the help answer');
});

test('6b. no HOLD is left for D12', () => {
  assert.equal(gate.CUSTOM_LIST_SERVER_READY, true);
  for (const f of [DASH, 'src/features/commercial/studyGate.ts', 'src/features/commercial/StudyAccessSheet.tsx', 'src/features/intro/screenIntros.ts', 'src/features/help/helpContent.ts']) {
    assert.doesNotMatch(read(f), /⏸ HOLD|on HOLD \(studyGate|CUSTOM_LIST_SERVER_READY — HOLD|server RPC not live/, f);
  }
});
