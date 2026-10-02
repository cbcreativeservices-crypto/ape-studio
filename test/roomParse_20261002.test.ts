/**
 * Room Design typed numbers (pattern hunt wave 4, 2026-10-02).
 *
 * NumField did `Number(text.replace(',', '.'))`: "1,234" became 1.234. It now
 * reads through parseRoomNumber — the calculators' parseQuantity, plus the
 * decimal-pad's lone decimal comma where that cannot also be a thousands group.
 * See src/screens/lab/roomdesign/roomParse.ts.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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

const { parseRoomNumber } = await import('../src/screens/lab/roomdesign/roomParse.ts');
const { parseQuantity } = await import('../src/screens/lab/calc/calcUnits.ts');

describe('what the calculators do with a comma (the rule we are matching)', () => {
  it('parseQuantity: grouping read, a lone decimal comma refused', () => {
    assert.equal(parseQuantity('1,234'), 1234);
    assert.equal(parseQuantity('3,5'), null);
    assert.equal(parseQuantity('0,5'), null);
    assert.equal(parseQuantity('12,75'), null);
  });
});

describe('parseRoomNumber', () => {
  it('"1,234" is no longer silently 1.234 — two realistic readings, refused (the field puts the old value back)', () => {
    assert.equal(parseRoomNumber('1,234'), null);
    assert.equal(parseRoomNumber('12,000'), null);
  });

  it('a decimal comma — the decimal-pad key in comma locales — still works', () => {
    assert.equal(parseRoomNumber('3,5'), 3.5);
    assert.equal(parseRoomNumber('0,5'), 0.5);
    assert.equal(parseRoomNumber('12,75'), 12.75);
    assert.equal(parseRoomNumber('0,500'), 0.5, 'a group never starts with 0 — this is a decimal');
    assert.equal(parseRoomNumber('2,4384'), 2.4384);
  });

  it('everything else is exactly parseQuantity', () => {
    for (const s of ['3.5', '4', '1,234.5', '1.234,5', '1,234,567', '12abc', '', '.', '1.2.3', '1,5,0', '-3', ' 4 ']) {
      if (/^[+-]?\d*,\d+$/.test(s.trim())) continue;
      assert.equal(parseRoomNumber(s), parseQuantity(s), JSON.stringify(s));
    }
    assert.equal(parseRoomNumber('12abc'), null, 'Number() and parseFloat would both have guessed');
  });
});

describe('NumField reads through it', () => {
  it('no hand-rolled comma swap left in bits.tsx', () => {
    const s = readFileSync('src/screens/lab/roomdesign/bits.tsx', 'utf8');
    assert.match(s, /const v = parseRoomNumber\(text\);\s*if \(v !== null && Number\.isFinite\(v\) && v > 0\) onCommit\(v\);/);
    assert.doesNotMatch(s, /Number\(text\.replace\(/);
  });
});
