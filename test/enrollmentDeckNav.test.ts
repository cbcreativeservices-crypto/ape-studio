/**
 * Moving through the Enrollments deck.
 *
 * ⛔ WHAT WENT WRONG. All / Programs / Certificates used to REBUILD the deck
 * as only that kind. Owner 2026-09-19: "there is confusion between the
 * all-programs-certificate ‹ › buttons… programs and certificates is a: jump
 * to, not a filter. The ‹ › should not scroll past their end last point and
 * should always work no matter all, program or cert."
 *
 * Filtering made the arrows dead — with one program enrolled, Programs left a
 * single card and BOTH arrows greyed out — and reset the position readout to
 * 1/1, so you could not tell where you were in what you actually had. Two
 * controls, each changing what the other meant.
 *
 * These tests hold the shape that fixes it: one whole deck, chips that jump
 * into it, arrows that always have somewhere to go and never wrap.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { firstIndexOfKind, chipForKind, stepDeck } = await import('../src/screens/enrollment/deckNav.ts');

/** A realistic deck: ALL TOPICS, two programs, three certificates. */
const DECK = ['topics', 'program', 'program', 'cert', 'cert', 'cert'] as const;

describe('firstIndexOfKind', () => {
  it('jumps to the first card of each kind', () => {
    assert.equal(firstIndexOfKind(DECK, 'all'), 0);
    assert.equal(firstIndexOfKind(DECK, 'program'), 1);
    assert.equal(firstIndexOfKind(DECK, 'cert'), 3);
  });

  it('reports -1 when there is nothing of that kind to jump to', () => {
    // -1 disables the chip. A chip that looks live and moves nothing is
    // exactly how the filter version read as broken.
    assert.equal(firstIndexOfKind(['topics', 'placeholder'], 'program'), -1);
    assert.equal(firstIndexOfKind(['topics', 'program'], 'cert'), -1);
  });

  it('finds ALL TOPICS wherever it sits, rather than assuming index 0', () => {
    assert.equal(firstIndexOfKind(['placeholder', 'topics'], 'all'), 1);
  });
});

describe('chipForKind', () => {
  it('lights the chip for the card you are on', () => {
    assert.equal(chipForKind('topics'), 'all');
    assert.equal(chipForKind('program'), 'program');
    assert.equal(chipForKind('cert'), 'cert');
  });

  it('never claims a credential exists when the card is not one', () => {
    assert.equal(chipForKind('placeholder'), 'all');
    assert.equal(chipForKind('subject'), 'all');
    assert.equal(chipForKind(undefined), 'all');
  });

  it('follows the arrows: stepping across a boundary moves the highlight', () => {
    // The whole point of a readout rather than a setting.
    assert.equal(chipForKind(DECK[2]), 'program'); // last program
    assert.equal(chipForKind(DECK[3]), 'cert'); // one step on
  });
});

describe('stepDeck', () => {
  it('never scrolls past either end', () => {
    assert.equal(stepDeck(0, -1, DECK.length), 0, 'must not go below the first card');
    assert.equal(stepDeck(DECK.length - 1, +1, DECK.length), DECK.length - 1, 'must not pass the last card');
  });

  it('never wraps', () => {
    // Wrapping would make the "4/6" readout beside it appear to lie.
    assert.notEqual(stepDeck(DECK.length - 1, +1, DECK.length), 0);
    assert.notEqual(stepDeck(0, -1, DECK.length), DECK.length - 1);
  });

  it('steps one at a time through the middle', () => {
    assert.equal(stepDeck(2, +1, DECK.length), 3);
    assert.equal(stepDeck(2, -1, DECK.length), 1);
  });

  it('can always reach every card, whatever chip was last pressed', () => {
    // The deck is never rebuilt, so walking from 0 must touch all of it.
    let i = 0;
    const seen = [i];
    for (let n = 0; n < DECK.length * 2; n++) {
      const next = stepDeck(i, +1, DECK.length);
      if (next === i) break;
      i = next;
      seen.push(i);
    }
    assert.deepEqual(seen, [0, 1, 2, 3, 4, 5]);
  });

  it('survives an empty deck rather than returning -1', () => {
    assert.equal(stepDeck(0, +1, 0), 0);
    assert.equal(stepDeck(0, -1, 0), 0);
  });
});
