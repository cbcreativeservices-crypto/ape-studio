/**
 * STUDY area, evening toddler hunt pass 3 (2026-10-02).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed file
 * was copied aside, the old one restored, this file run, the fix put back).
 *
 *   1. study/scenarioQueue + scenarioHomework — the drain counted EVERY failed
 *      send toward MAX_TRIES, including "the phone is offline". The drain runs
 *      before every new scenario answer, so a learner answering offline
 *      burned one try per answer: after six answers the oldest queued answer
 *      was discarded as "permanently failing", then the next, and so on — a
 *      round answered on a train silently lost answers (or its `complete`)
 *      that the screen had reported as kept. MAX_TRIES exists for a call the
 *      SERVER refuses (the 2026-09-20 FK poison pill); a call that never
 *      reached the server is not evidence of that, and now costs no try.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const AS = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = AS;

const q = await import('../src/features/study/scenarioQueue.ts');
const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

const answer = (questionId: string) =>
  ({ kind: 'answer', achievementId: 'a1', questionId, round: 1, correct: true, at: Date.now() }) as const;

test('scenario queue: an OFFLINE send costs no try — twenty offline answers lose nothing', async () => {
  AS.clear();
  q.resetLocal();
  // A round answered with no signal: every answer's drain fails offline, then
  // queues the answer behind the rest.
  for (let i = 1; i <= 20; i++) {
    await q.drainScenarioQueue(async () => 'offline' as never);
    await q.queueScenarioCall(answer(`q${i}`));
  }
  assert.equal(await q.pendingScenarioCount(), 20, 'offline drains discarded queued answers as "permanently failing"');
  // Signal returns: every answer goes, in order.
  const sent: string[] = [];
  const left = await q.drainScenarioQueue(async (i) => {
    sent.push(i.kind === 'answer' ? i.questionId : 'c');
    return true;
  });
  assert.equal(left, 0);
  assert.deepEqual(sent, Array.from({ length: 20 }, (_, i) => `q${i + 1}`));
});

test('scenario queue: a call the server REFUSES still clears after MAX_TRIES (poison pill)', async () => {
  AS.clear();
  q.resetLocal();
  await q.queueScenarioCall({ kind: 'complete', achievementId: 'a1', round: 1, at: Date.now() });
  await q.queueScenarioCall(answer('q9'));
  const sent: string[] = [];
  let left = 2;
  for (let n = 0; n < 12 && left > 0; n++) {
    left = await q.drainScenarioQueue(async (i) => {
      if (i.kind === 'complete') return false;
      sent.push(i.questionId);
      return true;
    });
  }
  assert.equal(left, 0);
  assert.deepEqual(sent, ['q9']);
});

test('scenario homework: a send that never reached the server answers "offline", not false', () => {
  const s = src('features/study/scenarioHomework.ts');
  // Hunt 12 (2026-10-04) widened "never reached the server" to include a call
  // refused because it went out WITHOUT a token (isAuthDenial) — see
  // studyHunt12_20261004. Offline is still part of it.
  assert.match(s, /import \{ isAuthDenial, isOfflineError \} from '\.\/sessionRetry';/);
  assert.match(s, /const notSentAsLearner = \(e: unknown\): boolean => isOfflineError\(e\) \|\| isAuthDenial\(e\);/);
  // Both raw senders classify their failure; the dispatcher passes it through.
  assert.match(s, /async function sendAnswer\([^)]*\): Promise<boolean \| 'offline'>/);
  assert.match(s, /return notSentAsLearner\(error\) \? 'offline' : false;/);
  assert.match(s, /return notSentAsLearner\(e\) \? 'offline' : false;/);
  assert.match(s, /if \(n === 'offline'\) return 'offline';/);
  // The live (non-queued) paths still treat only `true` as sent.
  assert.match(s, /\(await sendAnswer\(achievementId, questionId, round, correct\)\) === true/);
});
