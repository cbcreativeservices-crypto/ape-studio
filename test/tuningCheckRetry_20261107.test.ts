/**
 * Tuning Lab UnderstandingCheck retry (owner decision 7, lab text audit
 * 2026-11-07). Many `explain` lines name the right answer, so on a check with
 * no `wrong` map the FIRST miss says only "Not quite — try again."; from the
 * second miss on, the explanation shows as a hint. A correct pick still shows
 * "✓ explain", and picks with a `wrong` entry are unchanged.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkFeedback, FIRST_MISS, GENERIC_WRONG } from '../src/screens/lab/tuning/components/checkFeedback.ts';

const explain = 'An octave doubles the frequency.';
const base = { correct: 1, explain };

describe('UnderstandingCheck retry feedback (decision 7)', () => {
  it('no pick → no line', () => {
    assert.equal(checkFeedback({ ...base, picked: null, misses: 0 }), null);
  });
  it('first miss with no `wrong` map hides the explanation', () => {
    assert.equal(FIRST_MISS, 'Not quite — try again.');
    const line = checkFeedback({ ...base, picked: 0, misses: 1 });
    assert.equal(line, 'Not quite — try again.');
    assert.ok(!line!.includes(explain));
  });
  it('second and later misses show the explanation as a hint', () => {
    for (const misses of [2, 3, 7]) {
      assert.equal(checkFeedback({ ...base, picked: 2, misses }), `${explain} — try again with that in mind.`);
    }
  });
  it('a correct pick still shows ✓ explain, whatever the miss count', () => {
    assert.equal(checkFeedback({ ...base, picked: 1, misses: 0 }), `✓ ${explain}`);
    assert.equal(checkFeedback({ ...base, picked: 1, misses: 3 }), `✓ ${explain}`);
  });
  it('picks with a `wrong` map are unchanged (bespoke line, or the generic fallback)', () => {
    const wrong = ['Doubling the length halves the pitch.', undefined, undefined];
    assert.equal(checkFeedback({ ...base, wrong, picked: 0, misses: 1 }), wrong[0]);
    assert.equal(checkFeedback({ ...base, wrong, picked: 2, misses: 1 }), GENERIC_WRONG);
  });
  it('the component counts misses and resets the count with the question signature', () => {
    const src = readFileSync('src/screens/lab/tuning/components/check.tsx', 'utf8').replace(/\r\n/g, '\n');
    assert.match(src, /const feedback = checkFeedback\(\{ picked, correct, explain, wrong, misses \}\);/);
    assert.match(src, /missesRef\.current \+= 1;\n\s*setMisses\(missesRef\.current\);/);
    assert.match(src, /useEffect\(\(\) => \{\n\s*missesRef\.current = 0;\n\s*setMisses\(0\);\n\s*\}, \[signature\]\);/);
    assert.ok(!src.includes('try again with that in mind'), 'the hint text lives only in checkFeedback.ts');
  });
});
