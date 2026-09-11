/**
 * Advanced Mixing — truth-engine suite (owner GO 2026-09-11). Pins the phase
 * math, mid/side algebra, the BS.1770-style loudness/true-peak ESTIMATES
 * against known references, and the stem null test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SR, sine, type Stereo } from '../src/features/ear/earDsp.ts';
import {
  combNotchesHz,
  combPeaksHz,
  correlation,
  decodeMidSide,
  encodeMidSide,
  loudnessLufsEstimate,
  nullResidueDb,
  nullsWhenSummed,
  sumStereo,
  truePeakDbEstimate,
} from '../src/screens/lab/mixing/engine/advanced.ts';

const stereoOf = (l: Float32Array, r: Float32Array): Stereo => ({ l, r });

describe('phase & alignment', () => {
  it('1 ms two-path delay: first notch 500 Hz, first peak 1 kHz', () => {
    assert.equal(combNotchesHz(1)[0], 500);
    assert.equal(combNotchesHz(1)[1], 1500);
    assert.equal(combPeaksHz(1)[0], 1000);
  });
  it('correlation: dual-mono = +1, inverted copy = −1, silence-safe', () => {
    const x = sine(200, 0.2);
    const inv = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) inv[i] = -x[i];
    assert.ok(correlation(x, x) > 0.999);
    assert.ok(correlation(x, inv) < -0.999);
    assert.equal(correlation(new Float32Array(100), x.slice(0, 100)), 0);
  });
  it('polarity flip nulls against the original; a delay never does', () => {
    assert.equal(nullsWhenSummed('polarityFlip'), true);
    assert.equal(nullsWhenSummed('delayed', 1), false);
  });
});

describe('mid/side', () => {
  it('encode→decode is identity; side is silent for dual-mono; width 0 collapses to mono', () => {
    const l = sine(300, 0.1);
    const r = sine(450, 0.1);
    const { m, side } = encodeMidSide(stereoOf(l, r));
    const back = decodeMidSide(m, side, 1);
    for (let i = 0; i < 500; i++) {
      assert.ok(Math.abs(back.l[i] - l[i]) < 1e-6);
      assert.ok(Math.abs(back.r[i] - r[i]) < 1e-6);
    }
    const mono = encodeMidSide(stereoOf(l, l));
    for (let i = 0; i < 500; i++) assert.equal(mono.side[i], 0);
    const collapsed = decodeMidSide(m, side, 0);
    for (let i = 0; i < 500; i++) assert.equal(collapsed.l[i], collapsed.r[i]);
  });
});

describe('loudness estimates (labeled ESTIMATES, BS.1770-style)', () => {
  it('a 997 Hz full-scale sine, LEFT ONLY, reads ≈ −3.0 LUFS (the BS.1770 reference case)', () => {
    // The spec's compliance case is SINGLE-channel; dual-mono reads 3 dB
    // higher (≈ 0 LUFS) because both channels sum into the measure.
    const x = sine(997, 2);
    const silent = new Float32Array(x.length);
    const lufs = loudnessLufsEstimate(stereoOf(x, silent));
    assert.ok(Math.abs(lufs - -3.01) < 0.6, `got ${lufs.toFixed(2)} LUFS`);
    const dual = loudnessLufsEstimate(stereoOf(x, x));
    assert.ok(Math.abs(dual - 0) < 0.6, `dual-mono should read ≈ 0 LUFS (got ${dual.toFixed(2)})`);
  });
  it('−20 dB gain reads 20 LU lower', () => {
    const x = sine(997, 2);
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = x[i] * 0.1;
    const a = loudnessLufsEstimate(stereoOf(x, x));
    const b = loudnessLufsEstimate(stereoOf(y, y));
    assert.ok(Math.abs(a - b - 20) < 0.3);
  });
  it('true peak catches an inter-sample overshoot the sample peak misses', () => {
    // A near-Nyquist tone at 0 dBFS sample peak overshoots BETWEEN samples.
    const n = Math.round(0.1 * SR);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = Math.sin((Math.PI * i) / 2 + Math.PI / 4); // fs/4, samples at ±0.7071
    let samplePeak = 0;
    for (let i = 0; i < n; i++) samplePeak = Math.max(samplePeak, Math.abs(x[i]));
    const tp = truePeakDbEstimate(stereoOf(x, x));
    assert.ok(tp > 20 * Math.log10(samplePeak) + 1, `true peak ${tp.toFixed(2)} must exceed sample peak ${(20 * Math.log10(samplePeak)).toFixed(2)}`);
  });
});

describe('stems & reconstruction', () => {
  it('linear stems null against their sum; a clipped “master” leaves a residue', () => {
    const a = sine(220, 0.5);
    const b = sine(330, 0.5);
    const stems = [stereoOf(a, a), stereoOf(b, b)];
    const master = sumStereo(stems);
    assert.ok(nullResidueDb(sumStereo(stems), master) < -100, 'linear sum must null');
    const clipped: Stereo = { l: new Float32Array(master.l), r: new Float32Array(master.r) };
    for (let i = 0; i < clipped.l.length; i++) {
      clipped.l[i] = Math.max(-0.9, Math.min(0.9, clipped.l[i] * 1.4));
      clipped.r[i] = Math.max(-0.9, Math.min(0.9, clipped.r[i] * 1.4));
    }
    assert.ok(nullResidueDb(sumStereo(stems), clipped) > -40, 'nonlinear bus processing must break the null — the section-16 lesson');
  });
});
