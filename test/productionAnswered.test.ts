/**
 * A production plan must not report itself ready on things nobody filled in.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * `isAnswered` accepted any non-empty array, and a table field's value is an
 * array of ROW objects. Tapping "add row" appends a row whose cells are all
 * empty, so `length > 0` was true and the field read COMPLETE — and the stage
 * counted it as a decision the user had made.
 *
 * Measured across the shipping stage data: 11 of 16 required pre-production
 * tables and 5 of 6 post-production tables went green from a single blank row.
 * Two of them were the HAZARD REGISTER and the RIGHTS REGISTER, which exist
 * precisely to record that somebody looked, and whose emptiness is the most
 * expensive kind there is to discover late.
 *
 * The whole point of the readiness engine is that a plan cannot look finished
 * when it is not, so this is the property it most needs pinned.
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

const { isAnswered } = await import('../src/features/production/types.ts');

describe('isAnswered — a blank row is not an answer', () => {
  it('THE BUG: a table holding one empty row is unanswered', () => {
    assert.equal(isAnswered([{ hz_what: '', hz_who: '', hz_control: '' }] as never), false);
  });

  it('several empty rows are still unanswered', () => {
    assert.equal(isAnswered([{ a: '' }, { a: '' }, { a: '  ' }] as never), false);
  });

  it('one cell with anything in it makes the row real', () => {
    assert.equal(isAnswered([{ hz_what: 'Working at height', hz_who: '' }] as never), true);
  });

  it('a later row rescues earlier empty ones', () => {
    assert.equal(isAnswered([{ a: '' }, { a: 'something' }] as never), true);
  });

  it('a numeric or boolean cell counts, including zero and false', () => {
    // 0 dB and "no" are real answers. Treating them as blank is the opposite
    // failure and just as wrong.
    assert.equal(isAnswered([{ n: 0 }] as never), true);
    assert.equal(isAnswered([{ b: false }] as never), true);
  });

  it('a cell holding NaN is not an answer', () => {
    assert.equal(isAnswered([{ n: Number.NaN }] as never), false);
  });
});

describe('isAnswered — the scalar cases are unchanged', () => {
  it('empty and whitespace strings are unanswered', () => {
    assert.equal(isAnswered(undefined), false);
    assert.equal(isAnswered(null as never), false);
    assert.equal(isAnswered(''), false);
    assert.equal(isAnswered('   '), false);
  });

  it('real text, numbers and booleans are answered', () => {
    assert.equal(isAnswered('48 kHz'), true);
    assert.equal(isAnswered(0), true);
    assert.equal(isAnswered(-12.5), true);
    assert.equal(isAnswered(false), true);
  });

  it('a non-finite number is not an answer', () => {
    assert.equal(isAnswered(Number.NaN), false);
    assert.equal(isAnswered(Number.POSITIVE_INFINITY), false);
  });

  it('multi-choice is an array of plain strings and still works', () => {
    assert.equal(isAnswered([]), false);
    assert.equal(isAnswered(['pitch']), true);
    assert.equal(isAnswered(['', '  ']), false);
  });
});
