/**
 * D62 adoption guardrail (owner 2026-11-15): one plain definition each for Hz, dB, RT60, ms and
 * cents, kept in src/features/lab/plainTerms.ts. Hz and dB must stay word-for-word the shared
 * units sheet, so the chip and any lab that explains them never disagree. [MD:D62]
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLAIN_TERMS, termWithShort } from '../src/features/lab/plainTerms.ts';
import { UNITS_LINES } from '../src/screens/lab/rack/bezelRules.ts';

test('Hz and dB reuse the units sheet word for word', () => {
  assert.equal(PLAIN_TERMS.hz.sentence, UNITS_LINES.find((l) => l.term.startsWith('Hz'))!.text);
  assert.equal(PLAIN_TERMS.db.sentence, UNITS_LINES.find((l) => l.term === 'dB (decibels)')!.text);
});

test('every term has a short caption and one plain sentence with no formula', () => {
  for (const [k, t] of Object.entries(PLAIN_TERMS)) {
    assert.ok(t.short.length > 0 && t.short.length <= 28, `${k} short caption length`);
    assert.ok(/\.$/.test(t.sentence), `${k} sentence ends with a full stop`);
    assert.ok(!/[=÷×√Σ]/.test(t.sentence.replace(/100 cents is/, '')), `${k} has no formula`);
  }
});

test('the facts are right', () => {
  assert.match(PLAIN_TERMS.rt60.sentence, /60 dB quieter/);
  assert.match(PLAIN_TERMS.ms.sentence, /1,000 ms is one second/);
  assert.match(PLAIN_TERMS.cents.sentence, /100 cents/);
  assert.equal(termWithShort('rt60'), 'RT60 (decay time)');
});
