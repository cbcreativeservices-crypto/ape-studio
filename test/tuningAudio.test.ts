/**
 * Tuning lab audio renderers — service-level tests (spec Stage 5 §6). The
 * requested frequencies must actually be in the rendered clips; sines carry
 * no upper harmonics; rich tones do; chords never clip; A/B clips share one
 * loudness rule; ramps remove clicks.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { powerSpectrumDb, bandDb, rmsDb, SR } from '../src/features/ear/earDsp.ts';
import {
  renderTone, renderNotes, renderPartials, renderSequence, concatWithGap, clipSeconds, finalize,
} from '../src/features/tuning/tuningRender.ts';

const peakHz = (x: Float32Array) => {
  const { freqs, db } = powerSpectrumDb(x);
  let m = 1;
  for (let i = 2; i < db.length; i++) if (db[i] > db[m]) m = i;
  return freqs[m];
};
const peakAbs = (x: Float32Array) => {
  let p = 0;
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]));
  return p;
};

describe('requested frequencies reach the renderer', () => {
  it('a sine at 440 Hz peaks at 440 Hz and has no 2nd harmonic', () => {
    const x = renderNotes([440], 1, 'sine');
    assert.ok(Math.abs(peakHz(x) - 440) < 8);
    assert.ok(bandDb(x, 440, 0.1) - bandDb(x, 880, 0.1) > 40);
  });
  it('a rich tone carries its harmonics with decreasing amplitude', () => {
    const x = renderNotes([220], 1, 'rich');
    // Spectral-line level: the strongest bin within ±8 Hz of each harmonic
    // (a fixed-Hz probe — octave-fraction windows widen with frequency and
    // bias the average downward).
    const { freqs, db } = powerSpectrumDb(x);
    const line = (f: number) => {
      let m = -300;
      for (let i = 0; i < freqs.length; i++) if (Math.abs(freqs[i] - f) <= 8) m = Math.max(m, db[i]);
      return m;
    };
    const h1 = line(220), h2 = line(440), h5 = line(1100);
    assert.ok(h1 > h2 && h2 > h5, `${h1} ${h2} ${h5}`);
    assert.ok(h1 - h5 < 20, `1/k roll-off expected ≈14 dB, got ${(h1 - h5).toFixed(1)}`);
  });
  it('isolated partials contain exactly the two requested lines', () => {
    const f = 261.6255653;
    const x = renderPartials([5 * f, 4 * (81 / 64) * f], 1);
    assert.ok(bandDb(x, 5 * f, 0.06) > bandDb(x, f, 0.06) + 40); // fundamentals absent
    assert.ok(bandDb(x, 5.0625 * f, 0.02) > bandDb(x, 4.5 * f, 0.02) + 20);
  });
});

describe('loudness and safety', () => {
  it('chord (three rich voices) never exceeds the peak ceiling', () => {
    const f = 261.6255653;
    const x = renderNotes([f, f * 5 / 4, f * 3 / 2], 1.5, 'rich');
    assert.ok(peakAbs(x) <= 0.9 + 1e-6);
  });
  it('A and B clips share the same loudness rule (RMS within 0.5 dB or peak-limited)', () => {
    const f = 261.6255653;
    const a = renderNotes([f, f * 5 / 4], 1, 'rich');
    const b = renderNotes([f, f * 81 / 64], 1, 'rich');
    assert.ok(Math.abs(rmsDb(a) - rmsDb(b)) < 0.5);
  });
  it('ramps: first and last samples start/end near zero (no clicks)', () => {
    const x = finalize(renderTone(1000, 0.5, 'sine'));
    assert.ok(Math.abs(x[0]) < 1e-6 && Math.abs(x[x.length - 1]) < 1e-3);
    assert.ok(Math.abs(x[3]) < 0.01);
  });
});

describe('sequences', () => {
  it('a scale renders every note at its requested frequency in order', () => {
    const f = 261.6255653;
    const ratios = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2];
    const x = renderSequence(ratios.map((r) => f * r), 0.3, 'sine', 0.05);
    const per = Math.round(0.35 * SR);
    ratios.forEach((r, i) => {
      const seg = x.slice(i * per + 2000, i * per + 2000 + 8192);
      assert.ok(Math.abs(peakHz(seg) / (f * r) - 1) < 0.02, `note ${i}`);
    });
    assert.ok(Math.abs(clipSeconds(x) - 8 * 0.35) < 1e-3);
  });
  it('alternate = A, gap, B with the gap silent', () => {
    const a = renderNotes([440], 0.4, 'sine');
    const b = renderNotes([466], 0.4, 'sine');
    const ab = concatWithGap(a, b, 0.3);
    assert.equal(ab.length, a.length + Math.round(0.3 * SR) + b.length);
    const gap = ab.slice(a.length + 100, a.length + Math.round(0.3 * SR) - 100);
    assert.ok(peakAbs(gap) === 0);
  });
});
