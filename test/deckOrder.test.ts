/**
 * The last 1% must not cost more than the first 99%.
 *
 * Owner, 2026-09-19: "i worked on fill in the blank at 99% for about 4 min did
 * 15+ cards - and never got to 100%." The deck ordered by ATTEMPTS while the
 * gate credits on CORRECT, so the one uncredited item — attempted twice, wrong
 * twice — was sorted BEHIND all 161 items already answered correctly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { hasCredit, orderByCredit, remainingCount, type ItemState } from '../src/features/study/deckOrder.ts';

const item = (id: string) => ({ id });

test('credit means correct at least once — attempts are not credit', () => {
  assert.equal(hasCredit({ attempts: 9, correct: 0 }), false);
  assert.equal(hasCredit({ attempts: 9 }), false);
  assert.equal(hasCredit({ attempts: 1, correct: 1 }), true);
  assert.equal(hasCredit(undefined), false);
});

test('⛔ THE REGRESSION: a twice-wrong item leads the deck, it does not trail it', () => {
  // The exact shape of the owner's stuck topic, in miniature.
  const items = [item('a'), item('b'), item('stuck'), item('c')];
  const states: Record<string, ItemState> = {
    a: { attempts: 1, correct: 1 },
    b: { attempts: 2, correct: 1 },
    stuck: { attempts: 2, correct: 0 }, // the one blocking 100%
    c: { attempts: 1, correct: 1 },
  };
  assert.equal(orderByCredit(items, states)[0].id, 'stuck');
});

test('the hardest-hit uncredited item comes first', () => {
  const items = [item('once'), item('never'), item('thrice')];
  const states: Record<string, ItemState> = {
    once: { attempts: 1, correct: 0 },
    never: {},
    thrice: { attempts: 3, correct: 0 },
  };
  assert.deepEqual(orderByCredit(items, states).map((i) => i.id), ['thrice', 'once', 'never']);
});

test('an untouched deck keeps the order it arrived in', () => {
  const items = [item('a'), item('b'), item('c')];
  assert.deepEqual(orderByCredit(items, {}).map((i) => i.id), ['a', 'b', 'c']);
});

test('a fully credited deck is unchanged, and nothing remains', () => {
  const items = [item('a'), item('b')];
  const states: Record<string, ItemState> = { a: { correct: 1 }, b: { correct: 2 } };
  assert.deepEqual(orderByCredit(items, states).map((i) => i.id), ['a', 'b']);
  assert.equal(remainingCount(items, states), 0);
});

test('remainingCount counts what the learner actually has left', () => {
  const items = [item('a'), item('b'), item('c')];
  const states: Record<string, ItemState> = { a: { correct: 1 }, b: { attempts: 5, correct: 0 } };
  assert.equal(remainingCount(items, states), 2); // b is not done, c is untouched
});
