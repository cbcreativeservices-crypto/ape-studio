/**
 * Tuner phase 1 (owner 2026-10-23, from the tuner research report): the bench
 * in scripts/tunerBench.ts, as assertions. Same synthetic readings through the
 * BEFORE and AFTER display logic at the native 20 readings/s.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { greenAfterSilence, lowB, steadiness, stepResponse, timeToConfirm, vibratoGreen } from '../scripts/tunerBench.ts';

describe('tuner phase 1 bench', () => {
  it('the needle settles at least twice as fast, inside the report goals (T50 ≤ 150 ms, T90 ≤ 250 ms)', () => {
    for (const from of [5, 20, -20]) {
      const b = stepResponse('before', from);
      const a = stepResponse('after', from);
      assert.ok(a.t90 * 2 <= b.t90, `T90 ${from}: ${a.t90} vs ${b.t90}`);
      assert.ok(a.t50 <= 150 && a.t90 <= 250, `goals ${from}: ${a.t50}/${a.t90}`);
    }
  });
  it('the printed cents change about 4 times a second, not every reading', () => {
    for (const sigma of [1, 2.5]) {
      assert.ok(steadiness('after', sigma).digitChangesPerS <= 4.2);
      assert.ok(steadiness('before', sigma).digitChangesPerS > 10);
    }
  });
  it('the needle stays within a cent and a half of wobble on a lively string', () => {
    assert.ok(steadiness('after', 2.5).needleSd < 1.5);
  });
  it('a steady string still reaches IN TUNE as quickly as before', () => {
    assert.ok(timeToConfirm('after', 0.5, 1) <= timeToConfirm('before', 0.5, 1));
    assert.ok(Number.isFinite(timeToConfirm('after', 0.5, 2.5)));
  });
  it('vibrato is never called IN TUNE; silence never stays green', () => {
    assert.equal(vibratoGreen('after', 8, 5), 0);
    assert.ok(vibratoGreen('before', 8, 5) > 0.5, 'the bench reproduces the old false green');
    assert.equal(greenAfterSilence('after'), 0);
  });
  it('a 5-string low B heard on its 2nd partial is read as low B', () => {
    const r = lowB();
    assert.equal(r.after, 'B0');
    assert.ok(Math.abs(r.afterCents - 3) < 0.1);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const rd = (p: string) => readFileSync(join(import.meta.dirname, '..', ...p.split('/')), 'utf8').replace(/\r\n/g, '\n');

describe('tuner screen pass 2026-10-23', () => {
  it('the ADVANCED TUNER key is square, on two lines', () => {
    const s = rd('src/screens/tools/FrequencyCounterScreen.tsx');
    assert.ok(s.includes("label={'ADVANCED\\nTUNER'}"));
    assert.match(s, /advBtnWrap: \{ width: ADV_KEY/);
  });
  it('the tuner colour wheel sits top-left, like the RTA and Multimeter', () => {
    assert.match(rd('src/screens/tools/FrequencyCounterScreen.tsx'), /tunerWheel: \{ position: 'absolute', top: 8, left: 10/);
  });
  it('both tuners use the phase 1 logic (no stacked damping, digits throttled)', () => {
    const adv = rd('src/screens/tools/CenterLockTuner.tsx');
    assert.doesNotMatch(adv, /dampCents\(/);
    assert.match(adv, /fmtCents\(view\.digitCents\)/);
    const hook = rd('src/features/tools/tuner/useSteadyTuner.ts');
    assert.match(hook, /filterCents\(/);
    assert.doesNotMatch(hook, /averageCents\(/);
  });
});
