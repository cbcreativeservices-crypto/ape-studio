/**
 * The zero-term exemption, exercised through the formula the app actually uses.
 *
 * The companion `zeroTermTopicNeverLocks.test.ts` pins the SHAPE (confirmed-empty
 * only, marked from the success path, cleared on account switch). This one pins
 * the ARITHMETIC: that a zero item count really does produce 0 without the
 * exemption and 100 with it, in `smoothMethodPct` — the live formula shared by
 * the Dashboard rack, Enrollments, Profile and the Directory.
 *
 * Source-text guards cannot catch someone reordering the branches so the
 * exemption is unreachable. This can.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

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

const { smoothMethodPct, topicOverallPct } = await import('../src/features/dashboard/topicPct.ts');
const { termsExemptIds } = await import('./_stub-topicpct-deps.mjs');

const EMPTY_TOPIC = 'topic-with-no-terms';
const NORMAL_TOPIC = 'topic-with-terms';
const ITEM_METHODS = ['flashcards', 'fill-in-blank', 'matching'] as const;

beforeEach(() => termsExemptIds.clear());

describe('a zero-term topic before the exemption', () => {
  test('every item-based method is stuck at 0 — the lock', () => {
    for (const key of ITEM_METHODS) {
      assert.equal(
        smoothMethodPct({ item_states: {} }, 0, key, EMPTY_TOPIC, 1),
        0,
        `${key} should read 0 with no terms and no exemption`,
      );
    }
  });
});

describe('a zero-term topic once CONFIRMED empty', () => {
  beforeEach(() => termsExemptIds.add(EMPTY_TOPIC));

  test('every item-based method reads 100, so the chain can power', () => {
    for (const key of ITEM_METHODS) {
      assert.equal(
        smoothMethodPct({ item_states: {} }, 0, key, EMPTY_TOPIC, 1),
        100,
        `${key} must not stay locked on a topic that has nothing to study`,
      );
    }
  });

  test('the exemption does NOT leak to other topics', () => {
    assert.equal(
      smoothMethodPct({ item_states: {} }, 12, 'flashcards', NORMAL_TOPIC, 1),
      0,
      'a topic that WAS NOT confirmed empty must still report its real progress',
    );
  });

  test('a real topic that merely has an unknown count is NOT granted', () => {
    // itemCount 0 with no exemption is "we do not know" — it must stay locked,
    // because only a confirmed-empty fetch may mark a topic.
    assert.equal(smoothMethodPct({ item_states: {} }, 0, 'flashcards', NORMAL_TOPIC, 1), 0);
  });

  test('overall progress reaches 100, so the quiz gate can open', () => {
    const pct = topicOverallPct(
      ['flashcards', 'fill-in-blank', 'matching'],
      () => ({ item_states: {} }),
      0,
      EMPTY_TOPIC,
      () => 1,
    );
    assert.equal(pct, 100, 'the credential requiring this topic would stay unreachable');
  });
});
