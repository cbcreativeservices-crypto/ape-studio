/** Sound Envelope & Transients Lab — model tests (npm test). */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  adsrAt, adsrCurve, adsrTotalMs, riseTimeMs, shapedWave, crestFactorDb, peakAbs, rms, PRESETS, speechCurve, TRANSIENTS, DURATION_EXAMPLES, DURATION_BANDS, logTimePos, type Adsr,
} from '../src/features/envelope/envelopeModel.ts';

const near = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);
const A: Adsr = { attackMs: 100, decayMs: 100, sustain: 0.5, releaseMs: 100, holdMs: 200 };

describe('ADSR envelope', () => {
  it('reaches peak at the end of attack, sustain after decay, zero after release', () => {
    assert.equal(adsrAt(A, 0), 0);
    near(adsrAt(A, 50), 0.5, 1e-9); // linear attack midpoint
    near(adsrAt(A, 100), 1, 1e-9);
    near(adsrAt(A, 200), 0.5, 1e-9); // sustain level
    near(adsrAt(A, 300), 0.5, 1e-9); // held
    near(adsrAt(A, 450), 0.25, 1e-9); // half through release
    assert.equal(adsrAt(A, 600), 0);
    assert.equal(adsrTotalMs(A), 500);
  });
  it('never leaves 0..1 and rejects nonsense times', () => {
    for (const p of PRESETS) {
      const { v } = adsrCurve(p.adsr, 300);
      for (let i = 0; i < v.length; i++) assert.ok(v[i] >= 0 && v[i] <= 1 + 1e-9);
    }
    assert.equal(adsrAt(A, -5), 0);
    assert.equal(adsrAt(A, NaN), 0);
  });
  it('rise time is 10→90 percent of a linear attack = 80% of it', () => {
    near(riseTimeMs(A), 80, 0.5);
    assert.equal(riseTimeMs({ ...A, attackMs: 0 }), 0);
  });
  it('exponential attack rises faster early than linear', () => {
    const e: Adsr = { ...A, attackShape: 'exponential' };
    assert.ok(adsrAt(e, 20) > adsrAt(A, 20));
  });
  it('presets: percussive shapes have no sustain and fast attacks; sustained ones hold', () => {
    const snare = PRESETS.find((p) => p.id === 'snare')!;
    const violin = PRESETS.find((p) => p.id === 'violin')!;
    assert.equal(snare.adsr.sustain, 0);
    assert.ok(snare.adsr.attackMs < 10);
    assert.ok(violin.adsr.sustain > 0.7 && violin.adsr.attackMs > 100);
    const cymbal = PRESETS.find((p) => p.id === 'cymbal')!;
    assert.ok(cymbal.adsr.decayMs > 2000);
  });
  it('speech is a sequence of syllable envelopes with gaps of silence', () => {
    const { v, marks } = speechCurve(500);
    assert.equal(marks.length, 7);
    let zeros = 0;
    for (let i = 0; i < v.length; i++) if (v[i] === 0) zeros++;
    assert.ok(zeros > 10 && zeros < v.length / 2);
  });
  it('transient kinds order their attack times', () => {
    assert.ok(TRANSIENTS.sharp.adsr.attackMs < TRANSIENTS.soft.adsr.attackMs && TRANSIENTS.soft.adsr.attackMs < TRANSIENTS.none.adsr.attackMs);
  });
});

describe('peak vs average', () => {
  it('a steady sine has a crest factor ≈ 3.01 dB', () => {
    const x = new Float32Array(4000);
    for (let i = 0; i < x.length; i++) x[i] = Math.sin((2 * Math.PI * 25 * i) / x.length);
    near(crestFactorDb(x), 3.0103, 0.05);
    near(peakAbs(x), 1, 1e-3);
    near(rms(x), 0.7071, 2e-3);
  });
  it('a percussive shape has a much higher crest factor than a sustained one', () => {
    const snare = shapedWave(PRESETS.find((p) => p.id === 'snare')!.adsr, 2000, 80);
    const trumpet = shapedWave(PRESETS.find((p) => p.id === 'trumpet')!.adsr, 2000, 80);
    assert.ok(crestFactorDb(snare) > crestFactorDb(trumpet) + 6);
  });
});

describe('duration axis', () => {
  it('every example falls inside its category band', () => {
    for (const e of DURATION_EXAMPLES) {
      const b = DURATION_BANDS.find((x) => x.category === e.category)!;
      assert.ok(e.ms >= b.fromMs && e.ms <= b.toMs, e.name);
    }
  });
  it('log positions are monotonic and bounded', () => {
    let last = -1;
    for (const ms of [1, 10, 100, 1000, 10000, 20000]) {
      const p = logTimePos(ms);
      assert.ok(p > last && p >= 0 && p <= 1);
      last = p;
    }
  });
});
