/**
 * Mastering Lab — the pure engine (owner build order 2026-10-01).
 *
 *  • MATCHED-LEVEL GAIN MATHS: every version in a group is turned DOWN to
 *    the quietest member's loudness; attenuation only; gain = quietest − this.
 *  • The limiter holds its ceiling; the measurement reads what it should.
 *  • The monitoring-path checker teaches the ORDER and the pairing.
 *  • Monitoring advice never encourages loud; the facts are facts.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CD_RED_BOOK, applyGain, checkMonitorPath, layoutSequence, matchedGains, maxLoudnessStep, measure, monitoringAdvice, overview, peakLimiter,
  perceivedBalanceShift, samplePeakDb, stereoWidth, tiltEq, wavBytes,
} from '../src/screens/lab/mastering/masteringEngine.ts';
import { SR, makeRng, pinkNoise, sine, type Stereo } from '../src/features/ear/earDsp.ts';

/** A 2 s test programme: pink noise with a sine under it, −12 dBFS-ish. */
function programme(seconds = 2, gainLin = 0.25): Stereo {
  const rng = makeRng(7);
  const n = pinkNoise(seconds, rng);
  const s = sine(110, seconds);
  const l = new Float32Array(n.length);
  const r = new Float32Array(n.length);
  for (let i = 0; i < n.length; i++) {
    l[i] = (n[i] * 0.8 + s[i] * 0.3) * gainLin;
    r[i] = (n[i] * 0.8 - s[i] * 0.3) * gainLin * 0.9;
  }
  return { l, r };
}

describe('matched-level gain maths', () => {
  it('turns every version DOWN to the quietest member — attenuation only', () => {
    const g = matchedGains({ mix: -18.2, loud: -10.5, eq: -17.1 });
    assert.equal(g.mix, 0, 'the quietest version plays as rendered');
    assert.ok(Math.abs(g.loud - (-18.2 - -10.5)) < 1e-9, 'gain = quietest − this');
    assert.ok(Math.abs(g.eq - (-18.2 - -17.1)) < 1e-9);
    for (const v of Object.values(g)) assert.ok(v <= 0, 'never a boost');
  });
  it('ignores a non-finite loudness (silence) instead of matching everything to −∞', () => {
    const g = matchedGains({ a: -16, b: -Infinity });
    assert.equal(g.a, 0);
    assert.equal(g.b, 0);
  });
  it('a matched pair measures within a fraction of an LU of each other', () => {
    const base = programme();
    const loud = peakLimiter(base, 9, -1).out;
    const mA = measure(base);
    const mB = measure(loud);
    assert.ok(mB.lufs > mA.lufs + 3, `the driven version is clearly louder (${mA.lufs.toFixed(1)} → ${mB.lufs.toFixed(1)})`);
    const g = matchedGains({ a: mA.lufs, b: mB.lufs });
    const played = applyGain(loud, g.b);
    const mP = measure(played);
    assert.ok(Math.abs(mP.lufs - mA.lufs) < 0.3, `matched to within 0.3 LU (got ${(mP.lufs - mA.lufs).toFixed(2)})`);
    assert.ok(mP.plr < mA.plr, 'the dynamics difference survives the match — that is what the learner hears');
  });
});

describe('the limiter and the meters', () => {
  it('holds the sample peak at or under the ceiling and reports gain reduction', () => {
    const base = programme(2, 0.6);
    const r = peakLimiter(base, 6, -1);
    assert.ok(samplePeakDb(r.out) <= -1 + 1e-3, `peak ${samplePeakDb(r.out).toFixed(2)} ≤ −1 dBFS`);
    assert.ok(r.maxGrDb > 3, 'driven 6 dB into a −1 ceiling, the limiter works hard');
    assert.equal(r.grDb.length, 160);
    assert.ok(r.grDb.some((g) => g > 0));
  });
  it('does nothing to a programme already under the ceiling', () => {
    const base = programme(1, 0.05);
    const r = peakLimiter(base, 0, -1);
    assert.equal(r.maxGrDb, 0);
    assert.ok(Math.abs(r.out.l[1000] - base.l[1000]) < 1e-7);
  });
  it('true peak is never below the sample peak; PLR is true peak minus loudness', () => {
    const m = measure(programme());
    assert.ok(m.truePeakDb >= m.peakDb - 1e-6);
    assert.ok(Math.abs(m.plr - (m.truePeakDb - m.lufs)) < 1e-9);
  });
  it('a gain change moves peak and loudness by the same amount', () => {
    const a = measure(programme());
    const b = measure(applyGain(programme(), -6));
    assert.ok(Math.abs(b.peakDb - a.peakDb + 6) < 0.05);
    assert.ok(Math.abs(b.lufs - a.lufs + 6) < 0.1);
  });
  it('a positive tilt brightens: more high-band energy relative to low; width 0 is mono', () => {
    const base = programme();
    const bright = tiltEq(base, 4);
    const bandRms = (s: Stereo, from: number, to: number) => {
      // crude: compare the sum of squares of a first-difference (HF proxy) vs the signal
      let hf = 0;
      let all = 0;
      for (let i = from; i < to; i++) {
        hf += (s.l[i] - s.l[i - 1]) ** 2;
        all += s.l[i] ** 2;
      }
      return hf / all;
    };
    assert.ok(bandRms(bright, SR, SR * 2) > bandRms(base, SR, SR * 2));
    const mono = stereoWidth(base, 0);
    assert.ok(Math.abs(mono.l[5000] - mono.r[5000]) < 1e-7);
  });
  it('the overview is on a real time base', () => {
    const ov = overview(programme(2), 100);
    assert.equal(ov.seconds, 2);
    assert.equal(ov.hi.length, 100);
    for (let c = 0; c < 100; c++) {
      assert.ok(ov.hi[c] >= ov.lo[c]);
      assert.ok(ov.level[c] >= 0 && ov.level[c] <= 1);
    }
  });
});

describe('the monitoring path', () => {
  it('accepts the canonical chains', () => {
    assert.equal(checkMonitorPath(['daw', 'dac', 'monitorCtl', 'amp', 'passive']).ok, true);
    assert.equal(checkMonitorPath(['daw', 'dac', 'monitorCtl', 'active']).ok, true);
    // a controller that converts internally
    assert.equal(checkMonitorPath(['daw', 'monitorCtl', 'active']).ok, true);
  });
  it('rejects the wrong pairings and the wrong order', () => {
    assert.equal(checkMonitorPath(['daw', 'dac', 'monitorCtl', 'amp', 'active']).ok, false, 'active monitors + external amp');
    assert.equal(checkMonitorPath(['daw', 'dac', 'monitorCtl', 'passive']).ok, false, 'passive monitors with no amp');
    assert.equal(checkMonitorPath(['dac', 'daw', 'monitorCtl', 'active']).ok, false, 'conversion before playback');
    assert.equal(checkMonitorPath(['daw', 'monitorCtl', 'dac', 'active']).ok, false, 'level control before conversion');
    assert.equal(checkMonitorPath(['daw', 'dac', 'amp', 'monitorCtl', 'passive']).ok, false, 'amp before the controller');
    assert.equal(checkMonitorPath([]).ok, false);
    assert.ok(checkMonitorPath([]).notes[0].includes('playback software'));
  });
});

describe('monitoring level — hearing safety', () => {
  it('never calls a loud level good; the sensible band ends at the 85 dB action level', () => {
    assert.equal(monitoringAdvice(78).tone, 'sensible');
    assert.equal(monitoringAdvice(85).tone, 'sensible');
    assert.equal(monitoringAdvice(90).tone, 'hot');
    assert.equal(monitoringAdvice(96).tone, 'unsafe');
    assert.equal(monitoringAdvice(62).tone, 'low');
    for (const l of [90, 96, 100]) assert.doesNotMatch(monitoringAdvice(l).note, /better|turn it up|louder is/i);
    assert.match(monitoringAdvice(96).note, /hearing/i);
  });
  it('the perceived-balance model: quieter reads thinner, louder reads fuller, bounded', () => {
    assert.ok(perceivedBalanceShift(65).bassDb < 0);
    assert.ok(perceivedBalanceShift(95).bassDb > 0);
    assert.equal(perceivedBalanceShift(83).bassDb, 0);
    assert.ok(perceivedBalanceShift(120).bassDb <= 6 && perceivedBalanceShift(30).bassDb >= -12);
  });
});

describe('sequencing and the facts', () => {
  it('lays tracks on a timeline with the gap between them and finds the largest loudness step', () => {
    const tracks = [
      { id: 'a', title: 'A', seconds: 100, lufs: -12, fadeOutSec: 5 },
      { id: 'b', title: 'B', seconds: 200, lufs: -20, fadeOutSec: 5 },
      { id: 'c', title: 'C', seconds: 50, lufs: -14, fadeOutSec: 5 },
    ];
    const l = layoutSequence(tracks, 2);
    assert.equal(l.totalSec, 100 + 2 + 200 + 2 + 50);
    assert.equal(l.blocks[1].startSec, 102);
    assert.equal(maxLoudnessStep(tracks), 8);
  });
  it('Red Book is 16-bit / 44.1 kHz / stereo and a WAV size follows from it', () => {
    assert.deepEqual(CD_RED_BOOK, { bitDepth: 16, sampleRateHz: 44100, channels: 2 });
    assert.equal(wavBytes(1, 44100, 16, 2), 176400);
  });
});

describe('the real programme (the house session through the mastering chain)', () => {
  it('renders the delivered mix with headroom, limits it louder, and the matched pair lands within 0.3 LU', async () => {
    const { DELIVERED_MIX, DELIVERED_TRIM_DB } = await import('../src/screens/lab/mastering/masteringEngine.ts');
    const { renderMix, releaseSessionStems } = await import('../src/screens/lab/mixing/audio/mixAudio.ts');
    const { renderVersion } = await import('../src/screens/lab/mastering/useMasterPlayback.ts').catch(() => ({ renderVersion: null as never }));
    const base = renderMix(DELIVERED_MIX, DELIVERED_TRIM_DB).stereo;
    const mBase = measure(base);
    assert.ok(mBase.peakDb < -2 && mBase.peakDb > -14, `a delivered mix with headroom (peak ${mBase.peakDb.toFixed(1)} dBFS)`);
    assert.ok(mBase.lufs < -8 && mBase.lufs > -30, `a plausible loudness (${mBase.lufs.toFixed(1)} LUFS)`);
    const loud = (renderVersion ? renderVersion(base, { driveDb: 8, ceilingDb: -0.3 }).out : peakLimiter(base, 8, -0.3).out);
    const mLoud = measure(loud);
    assert.ok(mLoud.lufs > mBase.lufs + 2, 'the limited version is louder');
    assert.ok(mLoud.plr < mBase.plr, 'and has less peak-to-loudness ratio');
    const g = matchedGains({ mix: mBase.lufs, loud: mLoud.lufs });
    const played = measure(applyGain(loud, g.loud));
    assert.ok(Math.abs(played.lufs - mBase.lufs) < 0.3, `matched within 0.3 LU (${(played.lufs - mBase.lufs).toFixed(2)})`);
    releaseSessionStems();
  });
});
