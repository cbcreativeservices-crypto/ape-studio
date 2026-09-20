/**
 * The meter lab's crest-factor teaching must match the signals it generates.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * Module 2 told learners that KICK/SNARE and ORGAN sit "around 20 dB apart" on
 * the CREST readout. Measured against the lab's OWN generators they are 16.1,
 * 18.0 and 4.8 dB — so the real separation is 11–13 dB, and the number on the
 * screen contradicted the sentence beside it by nearly an octave of dynamic
 * range. In a metering module, where reading the number IS the lesson, that is
 * the worst place to be wrong.
 *
 * The copy now says "more than 10 dB", which is robust to small generator
 * tweaks. This test pins the thing that sentence depends on: the percussive
 * signals must stay well above the sustained one, by more than 10 dB and by
 * less than 20 — if either bound breaks, the copy needs rewriting, and this is
 * what will say so.
 *
 * It also pins the ORDER, which is the actual teaching point: a sustained tone
 * has a low crest factor and a transient one a high crest factor. A generator
 * change that quietly inverted that would leave every word of the module true
 * and the lesson backwards.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crestDb, renderSignal } from '../src/screens/lab/meter/meterEngine.ts';

const crest = (key: string) => crestDb(renderSignal(key as never));

describe('meter lab crest factors', () => {
  it('keeps the percussive signals well above the sustained one', () => {
    const organ = crest('organ');
    for (const key of ['kick', 'snare']) {
      const gap = crest(key) - organ;
      assert.ok(
        gap > 10,
        `${key} is only ${gap.toFixed(1)} dB above ORGAN — the module says "more than 10 dB"`,
      );
      assert.ok(
        gap < 20,
        `${key} is ${gap.toFixed(1)} dB above ORGAN — past 20 dB the copy is understating it and should be rewritten`,
      );
    }
  });

  it('keeps a sustained tone low-crest and a transient one high-crest', () => {
    // The lesson itself, not a number: invert this and every sentence in the
    // module stays true while teaching the opposite.
    assert.ok(crest('sine') < 6, `a steady sine should be a low-crest signal, got ${crest('sine').toFixed(1)} dB`);
    assert.ok(crest('organ') < 8, `a sustained organ should be low-crest, got ${crest('organ').toFixed(1)} dB`);
    assert.ok(crest('kick') > 12, `a kick should be high-crest, got ${crest('kick').toFixed(1)} dB`);
    assert.ok(crest('snare') > 12, `a snare should be high-crest, got ${crest('snare').toFixed(1)} dB`);
  });

  it('puts speech between the two, where its syllable gaps belong', () => {
    const speech = crest('speech');
    assert.ok(speech > crest('organ'), 'speech has pauses — it must out-crest a sustained tone');
    assert.ok(speech < crest('snare'), 'speech should not out-crest a snare hit');
  });
});
