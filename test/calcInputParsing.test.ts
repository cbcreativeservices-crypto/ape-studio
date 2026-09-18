/**
 * A calculator must never answer confidently from input it misread.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * Every calculator field parsed its text with `parseFloat`, which stops at the
 * first character it cannot use and returns whatever it has already read. So a
 * user typing a resistance the way people write resistances — `10,000` — got
 * **10 ohms**, and the resulting RC cutoff was a thousand times wrong with
 * nothing on screen to suggest anything had gone wrong. The shared report made
 * it worse by printing the text the user typed next to a number computed from
 * something else, so a branded PDF contradicted itself.
 *
 * The owner's standing rule is that these calculators are a SOURCE OF TRUTH —
 * professionals use them in the field around high voltage and rigging loads, and
 * they are held to a legal/safety-grade bar. Under that rule a confidently wrong
 * answer is the worst possible output, and refusing to answer is a good one.
 *
 * So the contract under test is deliberately asymmetric: read everything that is
 * unambiguous, and return null for everything else rather than guessing.
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
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { parseQuantity, parseList } = await import('../src/screens/lab/calc/calcUnits.ts');

describe('parseQuantity reads what is unambiguous', () => {
  it('plain numbers', () => {
    assert.equal(parseQuantity('10'), 10);
    assert.equal(parseQuantity('10.5'), 10.5);
    assert.equal(parseQuantity('.5'), 0.5);
    assert.equal(parseQuantity('-3'), -3);
    assert.equal(parseQuantity('+3'), 3);
    assert.equal(parseQuantity('0'), 0);
    assert.equal(parseQuantity('-3e-4'), -0.0003);
    assert.equal(parseQuantity('2E3'), 2000);
  });

  it('THE BUG: a grouped thousands separator is a thousands separator', () => {
    // 10,000 Ω read as 10 Ω was the finding. These are the numbers a working
    // engineer types.
    assert.equal(parseQuantity('10,000'), 10000);
    assert.equal(parseQuantity('1,234,567'), 1234567);
    assert.equal(parseQuantity('1,234,567.89'), 1234567.89);
    assert.equal(parseQuantity('48,000'), 48000);
  });

  it('spaces and underscores are grouping too, and mean nothing else', () => {
    assert.equal(parseQuantity('10 000'), 10000);
    assert.equal(parseQuantity('1 234.5'), 1234.5);
    assert.equal(parseQuantity('10_000'), 10000);
    assert.equal(parseQuantity(' 42 '), 42);
  });

  it('a European decimal comma, when the dot settles which is which', () => {
    // "1.234,5" — the LAST separator is the decimal one.
    assert.equal(parseQuantity('1.234,5'), 1234.5);
    assert.equal(parseQuantity('1.234.567,89'), 1234567.89);
  });
});

describe('parseQuantity refuses rather than guesses', () => {
  it('a lone comma that is not a thousands group is ambiguous', () => {
    // "10,5" is 10.5 to half the world and a mistyped 10,500 to the other half.
    // Guessing either way puts a wrong number on a safety-grade readout.
    assert.equal(parseQuantity('10,5'), null);
    assert.equal(parseQuantity('1,23'), null);
    assert.equal(parseQuantity('1,2345'), null);
  });

  it('trailing text parseFloat used to swallow', () => {
    assert.equal(parseQuantity('12abc'), null);
    assert.equal(parseQuantity('47uF'), null);
    assert.equal(parseQuantity('12k'), null);
    assert.equal(parseQuantity('10 ohms'), null);
    assert.equal(parseQuantity('1/2'), null);
  });

  it('nothing, or not yet a number', () => {
    assert.equal(parseQuantity(''), null);
    assert.equal(parseQuantity('   '), null);
    assert.equal(parseQuantity('-'), null);
    assert.equal(parseQuantity('.'), null);
    assert.equal(parseQuantity('e5'), null);
  });

  it('two decimal points', () => {
    assert.equal(parseQuantity('1.2.3'), null);
    assert.equal(parseQuantity('1.234,5.6'), null);
  });

  it('never returns a non-finite number', () => {
    // Infinity and NaN reaching a formula is how "—" or a nonsense reading gets
    // onto a screen someone is standing on a ladder holding.
    for (const s of ['Infinity', '-Infinity', 'NaN', '1e999']) {
      const n = parseQuantity(s);
      assert.ok(n === null || Number.isFinite(n), `${s} produced ${n}`);
    }
  });
});

describe('parseList', () => {
  it('reads a list on any of the separators', () => {
    assert.deepEqual(parseList('1, 2, 3'), [1, 2, 3]);
    assert.deepEqual(parseList('1;2;3'), [1, 2, 3]);
    assert.deepEqual(parseList('1 2 3'), [1, 2, 3]);
    assert.deepEqual(parseList('1.5, 2.5'), [1.5, 2.5]);
  });

  it('ONE bad token invalidates the list rather than being dropped', () => {
    // Silently discarding a measurement changes the average and says nothing —
    // which is the same class of failure as misreading one.
    assert.deepEqual(parseList('1, 2, banana'), []);
    assert.deepEqual(parseList('12abc'), []);
  });

  it('an empty list is empty, and trailing separators are not values', () => {
    assert.deepEqual(parseList(''), []);
    assert.deepEqual(parseList('  '), []);
    assert.deepEqual(parseList('1, 2, '), [1, 2]);
  });
});
