/**
 * A budget field must not silently commit a number the person did not type.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * The production labs' number fields have now been wrong three different ways in
 * two days, each time in a value that rides into a packet handed to a client:
 *
 *   1. A decimal point could not be typed at all. `7.5` hours was recorded as
 *      75, because the handler committed `Number("7.")` = 7 and fed it back as
 *      the controlled value, erasing the point before the next digit arrived.
 *   2. The fix for that stripped commas, so `1,5` — one and a half to most of
 *      the world, typed on a keypad that has a comma on it — became 15.
 *   3. The fix for THAT rewrote the text on each keystroke, so the comma in
 *      `12,000` became a decimal point before the three digits identifying it
 *      as grouping could arrive: the field committed 12. Pasting the same
 *      characters still gave 12000, so identical input produced two answers a
 *      thousand apart depending on how it arrived.
 *
 * The lesson, learned the same way in the calculators, is that text must not be
 * transformed while it is being typed — it is interpreted at commit time, from
 * the whole string. This pins the interpretation, including the half-typed
 * states, because every previous bug lived in exactly those.
 *
 * Where the reading is genuinely ambiguous the answer is null. These numbers go
 * into a budget and a schedule that get exported; a value the app is not sure
 * about is worse than a blank the person can see and fill in.
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

// The component file pulls in react-native, so the pure helper is re-declared
// here from the source and checked against it below. That keeps the test
// runnable without a native runtime while making drift a failure rather than a
// silent divergence.
const SRC = fileURLToPath(new URL('../src/screens/lab/production/FieldRow.tsx', import.meta.url));
const { readFileSync } = await import('node:fs');
const source = readFileSync(SRC, 'utf8');

const body = source.slice(
  source.indexOf('export function interpretTypedNumber'),
  source.indexOf('\n}', source.indexOf('export function interpretTypedNumber')) + 2,
);
const interpretTypedNumber = new Function(
  `${body.replace('export function', 'function').replace(/: string|: number \| null/g, '')}; return interpretTypedNumber;`,
)() as (raw: string) => number | null;

describe('the helper under test is the one that ships', () => {
  it('was extracted from FieldRow.tsx', () => {
    // If the function is renamed or moved, everything below would silently test
    // nothing — so prove the extraction found real code first.
    assert.ok(body.includes('interpretTypedNumber'), 'did not find the function in the source');
    assert.ok(body.length > 400, `extracted only ${body.length} chars`);
    assert.equal(typeof interpretTypedNumber, 'function');
  });
});

describe('what a person types, character by character', () => {
  it('THE REGRESSION: a grouped thousand is a thousand, not twelve', () => {
    assert.equal(interpretTypedNumber('12,000'), 12000);
    assert.equal(interpretTypedNumber('1,234,567.89'), 1234567.89);
  });

  it('THE BUG BEFORE THAT: a decimal comma is a decimal comma', () => {
    assert.equal(interpretTypedNumber('1,5'), 1.5);
    assert.equal(interpretTypedNumber('-1,5'), -1.5);
  });

  it('THE BUG BEFORE THAT: a decimal point can be typed', () => {
    assert.equal(interpretTypedNumber('7.'), 7);
    assert.equal(interpretTypedNumber('7.5'), 7.5);
    assert.equal(interpretTypedNumber('1250.50'), 1250.5);
  });

  it('every half-typed state on the way to 12,000 is safe', () => {
    // None of these may commit something wildly wrong; the final one must be
    // exactly right.
    assert.equal(interpretTypedNumber('1'), 1);
    assert.equal(interpretTypedNumber('12'), 12);
    assert.equal(interpretTypedNumber('12,'), 12);
    assert.equal(interpretTypedNumber('12,0'), 12);
    assert.equal(interpretTypedNumber('12,00'), 12);
    assert.equal(interpretTypedNumber('12,000'), 12000);
  });

  it('plain numbers, signs and zero', () => {
    assert.equal(interpretTypedNumber('0'), 0);
    assert.equal(interpretTypedNumber('42'), 42);
    assert.equal(interpretTypedNumber('-3'), -3);
  });
});

describe('what it refuses rather than guesses', () => {
  it('a separator pattern that is neither grouping nor one decimal comma', () => {
    assert.equal(interpretTypedNumber('1,234,5'), null);
    assert.equal(interpretTypedNumber(',5'), null);
    assert.equal(interpretTypedNumber('1,,2'), null);
  });

  it('a comma and a point that cannot both be right', () => {
    assert.equal(interpretTypedNumber('1,5.5'), null);
  });

  it('two decimal points', () => {
    assert.equal(interpretTypedNumber('1.2.3'), null);
  });

  it('nothing, or not yet a number', () => {
    assert.equal(interpretTypedNumber(''), null);
    assert.equal(interpretTypedNumber('   '), null);
    assert.equal(interpretTypedNumber('-'), null);
    assert.equal(interpretTypedNumber('.'), null);
  });

  it('a minus is a SIGN, not a character that may appear anywhere', () => {
    // A pasted "1-2" used to commit 12, because every minus was stripped before
    // parsing (found by the pass-6 verifier).
    assert.equal(interpretTypedNumber('1-2'), null);
    assert.equal(interpretTypedNumber('1-'), null);
    assert.equal(interpretTypedNumber('--1'), null);
    assert.equal(interpretTypedNumber('-1'), -1);
  });

  it('never returns a non-finite number', () => {
    for (const s of ['1e999', '99999999999999999999999999']) {
      const n = interpretTypedNumber(s);
      assert.ok(n === null || Number.isFinite(n), `${s} produced ${n}`);
    }
  });
});
