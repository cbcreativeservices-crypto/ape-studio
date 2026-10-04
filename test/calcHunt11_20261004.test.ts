/**
 * Calc — hunt 11 (2026-10-04) receipts.
 *
 *  H11-1 parseQuantity stripped a space, underscore, no-break space or
 *        apostrophe WHEREVER it stood, as if it were always thousands grouping.
 *        "5'10" (five feet ten — how people write a height or a distance) came
 *        back as 510, "1 5" as 15, "12 34" as 1234: a confident wrong number in
 *        a source-of-truth calculator (D53), with nothing on screen to say so.
 *        The comma rule already demanded REAL grouping (three digits a group);
 *        these separators now must be real grouping too, or the field is
 *        refused ("Check this value") like any other unreadable entry.
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

describe('H11-1 a space-like separator is grouping only when it IS grouping', () => {
  it('feet-and-inches and stray separators are refused, never glued together', () => {
    assert.equal(parseQuantity("5'10"), null); // was 510
    assert.equal(parseQuantity('1 5'), null); // was 15
    assert.equal(parseQuantity('12 34'), null); // was 1234
    assert.equal(parseQuantity('10_5'), null); // was 105
    assert.equal(parseQuantity("6'"), null); // 6 ft? the unit is the selector's job
    assert.equal(parseQuantity('0 500'), null); // no grouped number leads with 0 (as "0,500")
  });

  it('real grouping still reads exactly as before', () => {
    assert.equal(parseQuantity('10 000'), 10000);
    assert.equal(parseQuantity('1 234.5'), 1234.5);
    assert.equal(parseQuantity('1 234 567'), 1234567);
    assert.equal(parseQuantity('10_000'), 10000);
    assert.equal(parseQuantity("1'234.5"), 1234.5); // Swiss
    assert.equal(parseQuantity('1 000'), 1000); // narrow no-break space (French)
    assert.equal(parseQuantity('-10 000'), -10000);
    assert.equal(parseQuantity('0.000 001'), 0.000001); // ISO 80000 fraction groups
    assert.equal(parseQuantity(' 42 '), 42);
    assert.equal(parseQuantity(' 42 '), 42);
    assert.equal(parseQuantity('10,000'), 10000);
    assert.equal(parseQuantity('1.234,5'), 1234.5);
  });

  it('a list still splits on spaces (each value is parsed on its own)', () => {
    assert.deepEqual(parseList('8 8 4'), [8, 8, 4]);
    assert.deepEqual(parseList('85, 94, 100'), [85, 94, 100]);
  });
});
