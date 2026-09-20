/**
 * The scenario progress queue.
 *
 * ⛔ WHY IT EXISTS: scenarios was the ONE study method that lost a learner's
 * work outright. The other three route every event into a durable queue;
 * scenarios fired its RPCs, swallowed the failure with a console.warn, and
 * returned. A round answered on a train was gone — and the round report,
 * built from in-memory answers, congratulated the learner anyway.
 *
 * The two properties that matter are ORDER and NO-LOSS, so those are what
 * these pin.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it, beforeEach } from 'node:test';
import { fileURLToPath } from 'node:url';

/** In-memory AsyncStorage stand-in — the module only uses get/set/remove. */
const store = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

const { queueScenarioCall, drainScenarioQueue, pendingScenarioCount, clearScenarioQueue } = await import(
  '../src/features/study/scenarioQueue.ts'
);

const answer = (round: number, questionId: string) =>
  ({ kind: 'answer', achievementId: 'a1', questionId, round, correct: true, at: Date.now() }) as const;
const complete = (round: number) => ({ kind: 'complete', achievementId: 'a1', round, at: Date.now() }) as const;

describe('scenario queue', () => {
  beforeEach(async () => {
    store.clear();
  });

  it('keeps work that could not be sent', async () => {
    await queueScenarioCall(answer(1, 'q1'));
    await queueScenarioCall(answer(1, 'q2'));
    assert.equal(await pendingScenarioCount(), 2);
  });

  it('sends oldest first and empties on success', async () => {
    await queueScenarioCall(answer(1, 'q1'));
    await queueScenarioCall(answer(1, 'q2'));
    await queueScenarioCall(complete(1));
    const seen: string[] = [];
    const left = await drainScenarioQueue(async (i) => {
      seen.push(i.kind === 'answer' ? i.questionId : `complete:${i.round}`);
      return true;
    });
    assert.deepEqual(seen, ['q1', 'q2', 'complete:1']);
    assert.equal(left, 0);
    assert.equal(await pendingScenarioCount(), 0);
  });

  it('⛔ STOPS at the first failure — it must never skip past one', async () => {
    // A `complete` landing before the answers it completes would tell the
    // server a round finished with questions missing.
    await queueScenarioCall(answer(1, 'q1'));
    await queueScenarioCall(answer(1, 'q2'));
    await queueScenarioCall(complete(1));
    const seen: string[] = [];
    const left = await drainScenarioQueue(async (i) => {
      const id = i.kind === 'answer' ? i.questionId : `complete:${i.round}`;
      seen.push(id);
      return id !== 'q2'; // q2 fails
    });
    assert.deepEqual(seen, ['q1', 'q2'], 'must not attempt anything after the failure');
    assert.equal(left, 2, 'q2 and the complete both stay queued');
  });

  it('resumes from where it stopped, in order', async () => {
    await queueScenarioCall(answer(1, 'q1'));
    await queueScenarioCall(answer(1, 'q2'));
    let failFirst = true;
    await drainScenarioQueue(async () => {
      const ok = !failFirst;
      failFirst = false;
      return ok;
    });
    assert.equal(await pendingScenarioCount(), 2, 'nothing sent — the first call failed');
    const seen: string[] = [];
    await drainScenarioQueue(async (i) => {
      seen.push(i.kind === 'answer' ? i.questionId : 'c');
      return true;
    });
    assert.deepEqual(seen, ['q1', 'q2']);
  });

  it('a throwing sender is a failure, not a crash', async () => {
    await queueScenarioCall(answer(1, 'q1'));
    const left = await drainScenarioQueue(async () => {
      throw new Error('offline');
    });
    assert.equal(left, 1, 'the work is still queued');
  });

  it('⛔ clears on an account switch — queued rows carry no user', async () => {
    await queueScenarioCall(answer(1, 'q1'));
    await clearScenarioQueue();
    assert.equal(await pendingScenarioCount(), 0);
  });

  /**
   * ── THE LOST-UPDATE RACE (bug pass 1, 2026-09-20) ────────────────────────
   *
   * `recordScenarioAnswer` is fired per answer without being awaited, and it
   * waits on two network round trips before queuing anything. Offline those
   * sit in the RPC timeout for seconds, so two enqueues genuinely overlap.
   * Unserialised, both read the same array, both push, both write — and one
   * learner's answer is gone from disk forever. These two failed before the
   * queue was put behind a serial chain.
   */
  it('⛔ does not lose an answer queued concurrently', async () => {
    await Promise.all([queueScenarioCall(answer(1, 'q1')), queueScenarioCall(answer(1, 'q2'))]);
    assert.equal(await pendingScenarioCount(), 2, 'one enqueue overwrote the other');
  });

  it('⛔ does not lose an answer queued DURING a slow drain', async () => {
    await queueScenarioCall(answer(1, 'q1'));
    let arrivedDuringDrain: Promise<void> | null = null;
    const left = await drainScenarioQueue(async () => {
      // The new answer lands while the first is still in flight — exactly what
      // happens when the learner answers again during an RPC timeout.
      if (!arrivedDuringDrain) arrivedDuringDrain = queueScenarioCall(answer(1, 'q2'));
      await arrivedDuringDrain;
      return true;
    });
    assert.equal(left, 1, 'the answer queued mid-drain was written over by the drain');
    assert.equal(await pendingScenarioCount(), 1);
  });

  it('the surviving row after a mid-drain enqueue is the NEW one, in order', async () => {
    await queueScenarioCall(answer(1, 'q1'));
    await drainScenarioQueue(async () => {
      await queueScenarioCall(answer(1, 'q2'));
      return true;
    });
    const seen: string[] = [];
    await drainScenarioQueue(async (i) => {
      seen.push(i.kind === 'answer' ? i.questionId : 'c');
      return true;
    });
    assert.deepEqual(seen, ['q2'], 'q1 was sent; q2 must be what is left');
  });

  it('survives a corrupt queue instead of wedging scenarios forever', async () => {
    store.set('ape:scenarioQueue', '{not json');
    assert.equal(await pendingScenarioCount(), 0);
    await queueScenarioCall(answer(1, 'q1'));
    assert.equal(await pendingScenarioCount(), 1);
  });
});
