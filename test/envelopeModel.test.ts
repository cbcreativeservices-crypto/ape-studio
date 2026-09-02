/** Sound Envelope & Transients Lab — model tests (npm test). */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  adsrAt, adsrCurve, adsrTotalMs, riseTimeMs, riseTimes, shapedWave, crestFactorDb, peakAbs, rms, PRESETS, speechCurve, TRANSIENTS, DURATION_EXAMPLES, DURATION_BANDS, logTimePos, type Adsr,
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
  it('rise-time instants sit inside the attack, in order, at the 10 % and 90 % crossings', () => {
    const { t10, t90 } = riseTimes(A);
    assert.ok(0 < t10 && t10 < t90 && t90 < A.attackMs);
    near(adsrAt(A, t10), 0.1, 1e-6);
    near(adsrAt(A, t90), 0.9, 1e-6);
    near(t90 - t10, riseTimeMs(A), 1e-9);
  });
  it('exponential attack rises faster early than linear, and its rise time is shorter', () => {
    const e: Adsr = { ...A, attackShape: 'exponential' };
    assert.ok(adsrAt(e, 20) > adsrAt(A, 20));
    assert.ok(riseTimeMs(e) < riseTimeMs(A));
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
  it('presets never draw a dead stage: sustain 0 ⇒ release 0, and struck sounds have no hold plateau', () => {
    for (const p of PRESETS) {
      if (p.adsr.sustain === 0) assert.equal(p.adsr.releaseMs, 0, `${p.name}: a release from zero would draw a labelled R region on the zero line`);
      if (p.kind === 'percussive') assert.equal(p.adsr.holdMs, 0, `${p.name}: a struck sound cannot hold a level`);
      assert.ok(p.notice.length > 20 && p.bullets.length >= 3, p.name);
    }
  });
  it('speech is a sequence of syllable envelopes with gaps of silence', () => {
    const { v, marks } = speechCurve(500);
    assert.equal(marks.length, 7);
    let zeros = 0;
    for (let i = 0; i < v.length; i++) if (v[i] === 0) zeros++;
    assert.ok(zeros > 10 && zeros < v.length / 2);
    for (let k = 1; k < marks.length; k++) assert.ok(marks[k].startMs >= marks[k - 1].endMs, 'syllables must not overlap');
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
  it('examples are listed in ascending time (the timeline numbers them left to right)', () => {
    for (let i = 1; i < DURATION_EXAMPLES.length; i++) assert.ok(DURATION_EXAMPLES[i].ms > DURATION_EXAMPLES[i - 1].ms, DURATION_EXAMPLES[i].name);
  });
  it('the snare and kick on the timeline agree with the gallery presets', () => {
    const snare = PRESETS.find((p) => p.id === 'snare')!, kick = PRESETS.find((p) => p.id === 'kick')!;
    near(DURATION_EXAMPLES.find((e) => e.name === 'Snare')!.ms, adsrTotalMs(snare.adsr), 10);
    near(DURATION_EXAMPLES.find((e) => e.name === 'Kick drum')!.ms, adsrTotalMs(kick.adsr), 10);
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
