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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  CD_RED_BOOK, XF_OVERLAP_SEC, applyGain, checkMonitorPath, dailyLimitHours, dailyLimitLabel, layoutSequence, matchedGains, maxLoudnessStep, measure,
  monitoringAdvice, overview, peakLimiter, perceivedBalanceShift, samplePeakDb, stereoWidth, tiltEq, wavBytes,
} from '../src/screens/lab/mastering/masteringEngine.ts';
import { SR, makeRng, pinkNoise, sine, type Stereo } from '../src/features/ear/earDsp.ts';
import { loudnessLufsEstimate } from '../src/screens/lab/mixing/engine/advanced.ts';

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
  it('grades a working-but-minimal chain apart from a complete one (cognitive review finding 5)', () => {
    assert.equal(checkMonitorPath(['daw', 'dac', 'monitorCtl', 'amp', 'passive']).grade, 'complete');
    assert.equal(checkMonitorPath(['daw', 'monitorCtl', 'active']).grade, 'complete', 'the controller converts inside itself');
    const minimal = checkMonitorPath(['daw', 'active']);
    assert.equal(minimal.ok, true, 'DAW → active monitors WORKS');
    assert.equal(minimal.grade, 'minimal', '…but it is not PATH COMPLETE');
    assert.match(minimal.reason, /no controller/i);
    assert.equal(checkMonitorPath(['daw', 'dac', 'active']).grade, 'minimal', 'no controller → minimal even with a converter');
    assert.equal(checkMonitorPath(['daw', 'dac', 'monitorCtl', 'amp', 'active']).grade, 'fail');
    assert.equal(checkMonitorPath([]).grade, 'empty');
    for (const chain of [['daw', 'active'], ['daw', 'monitorCtl', 'active'], ['daw', 'dac', 'amp', 'passive']] as const) {
      assert.ok(checkMonitorPath(chain).reason.length > 10, 'a one-line reason for the glass');
    }
  });
  it('an EXTERNAL converter after the controller fails; the wording names the analog / digital controller cases', () => {
    const r = checkMonitorPath(['daw', 'monitorCtl', 'dac', 'active']);
    assert.equal(r.ok, false);
    assert.ok(r.notes.some((n) => /analog monitor controller/.test(n) && /digital controller converts inside itself/.test(n)));
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
  it('never calls a loud level good; "sensible" stays UNDER the 85 dBA limit (safety review finding 2)', () => {
    assert.equal(monitoringAdvice(78).tone, 'sensible');
    assert.equal(monitoringAdvice(83).tone, 'sensible');
    assert.equal(monitoringAdvice(84).tone, 'hot');
    assert.equal(monitoringAdvice(85).tone, 'hot', '85 dBA is the 8-hour limit, not a sensible all-day level');
    assert.equal(monitoringAdvice(88).tone, 'hot');
    assert.equal(monitoringAdvice(89).tone, 'unsafe');
    assert.equal(monitoringAdvice(90).tone, 'unsafe');
    assert.equal(monitoringAdvice(96).tone, 'unsafe');
    assert.equal(monitoringAdvice(62).tone, 'low');
    assert.match(monitoringAdvice(85).note, /85 dBA[^.]*8 hours/i);
    assert.match(monitoringAdvice(85).note, /every 3 dB above halves it/i);
    assert.match(monitoringAdvice(62).note, /reference level/i);
    for (const l of [84, 90, 96, 100]) assert.doesNotMatch(monitoringAdvice(l).note, /better|turn it up|louder is|survivable/i);
    assert.match(monitoringAdvice(96).note, /hearing/i);
  });
  it('DAILY LIMIT follows NIOSH: 8 h at 85 dBA, halved every 3 dB; "8 h+" below the limit', () => {
    assert.equal(dailyLimitLabel(80), '8 h+');
    assert.equal(dailyLimitLabel(84), '8 h+');
    assert.equal(dailyLimitLabel(85), '8 h');
    assert.equal(dailyLimitLabel(88), '4 h');
    assert.equal(dailyLimitLabel(91), '2 h');
    assert.equal(dailyLimitLabel(94), '1 h');
    assert.equal(dailyLimitLabel(92), '1.6 h');
    assert.equal(dailyLimitLabel(97), '30 min');
    assert.equal(dailyLimitLabel(100), '15 min');
    assert.ok(Math.abs(dailyLimitHours(88) - 4) < 1e-9);
  });
  it('the perceived-balance model (ISO 226-style, simplified): −5.3 at 65, −6.4 at 55, +2.5 at 90, bounded', () => {
    assert.ok(perceivedBalanceShift(65).bassDb < 0);
    assert.ok(perceivedBalanceShift(95).bassDb > 0);
    assert.equal(perceivedBalanceShift(83).bassDb, 0);
    assert.ok(Math.abs(perceivedBalanceShift(65).bassDb - -5.3) < 0.15, `65 dB → ${perceivedBalanceShift(65).bassDb}`);
    assert.ok(Math.abs(perceivedBalanceShift(55).bassDb - -6.4) < 0.15, `55 dB → ${perceivedBalanceShift(55).bassDb}`);
    assert.ok(Math.abs(perceivedBalanceShift(90).bassDb - 2.5) < 0.15, `90 dB → ${perceivedBalanceShift(90).bassDb}`);
    assert.ok(perceivedBalanceShift(120).bassDb <= 6 && perceivedBalanceShift(30).bassDb >= -12);
  });
});

describe('K-weighting at the house rate (audio review finding 12)', () => {
  it('a 997 Hz full-scale sine, LEFT ONLY, reads −3.01 LUFS within 0.1 (the BS.1770 reference case)', () => {
    const s = sine(997, 2);
    const l = new Float32Array(s.length);
    const r = new Float32Array(s.length);
    for (let i = 0; i < s.length; i++) l[i] = s[i];
    const lufs = loudnessLufsEstimate({ l, r });
    assert.ok(Math.abs(lufs - -3.01) < 0.1, `got ${lufs.toFixed(3)} LUFS`);
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
    // CROSSFADE: gap 0, neighbours overlap by XF_OVERLAP_SEC (cognitive review finding 3).
    const x = layoutSequence(tracks, 2, true);
    assert.equal(x.blocks[1].startSec, 100 - XF_OVERLAP_SEC);
    assert.equal(x.totalSec, 100 + 200 + 50 - 2 * XF_OVERLAP_SEC);
    assert.ok(x.blocks[1].startSec < x.blocks[0].endSec, 'the next track starts inside the fade');
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
  it('Module 5: tilt + the +2 dB trim gives the match ≥ 1.5 dB of bite, peak-safe (cognitive finding 1b, safety finding 12)', async () => {
    const { DELIVERED_MIX, DELIVERED_TRIM_DB } = await import('../src/screens/lab/mastering/masteringEngine.ts');
    const { renderMix, releaseSessionStems } = await import('../src/screens/lab/mixing/audio/mixAudio.ts');
    const { renderVersion, needsSafetyCeiling, SAFETY_CEILING_DB } = await import('../src/screens/lab/mastering/masteringEngine.ts');
    const base = renderMix(DELIVERED_MIX, DELIVERED_TRIM_DB).stereo;
    const mBase = measure(base);
    const eq = renderVersion(base, { tiltDb: 1.5, trimDb: 2 });
    const mEq = measure(eq.out);
    assert.ok(mEq.lufs - mBase.lufs >= 1.5, `WITH EQ reads ≥ 1.5 LU louder (got ${(mEq.lufs - mBase.lufs).toFixed(2)})`);
    assert.ok(samplePeakDb(eq.out) <= SAFETY_CEILING_DB + 1e-3, 'the trim is held under the safety ceiling');
    const g = matchedGains({ mix: mBase.lufs, eq: mEq.lufs });
    assert.ok(g.eq <= -1.5, `WITH EQ is matched down by ≥ 1.5 dB (got ${g.eq.toFixed(2)})`);
    assert.equal(needsSafetyCeiling({ tiltDb: 1.5, trimDb: 2 }), true);
    assert.equal(needsSafetyCeiling({ driveDb: 8, ceilingDb: -0.3 }), false, 'an explicit ceiling is its own safety');
    assert.equal(needsSafetyCeiling({ trimDb: -3 }), false, 'attenuation never needs one');
    assert.equal(needsSafetyCeiling({}), false);
    releaseSessionStems();
  });
});

describe('the auto-replay rule (safety review finding 1b)', () => {
  it('a fader or MATCH change replays the sounding version ONLY while matched', async () => {
    const { autoReplayAllowed } = await import('../src/screens/lab/mastering/masteringEngine.ts');
    assert.equal(autoReplayAllowed(true, 'loud'), 'loud');
    assert.equal(autoReplayAllowed(false, 'loud'), null, 'unmatched: stop and wait for a press');
    assert.equal(autoReplayAllowed(true, null), null);
  });
  it('a hard clip never appears in the render path; the safety ceiling is the lab limiter; the hook applies the rule', () => {
    const engine = readFileSync(join(process.cwd(), 'src/screens/lab/mastering/masteringEngine.ts'), 'utf8');
    assert.match(engine, /if \(needsSafetyCeiling\(p\)\) \{\s*const lim = peakLimiter\(s, 0, SAFETY_CEILING_DB\);/);
    assert.doesNotMatch(engine.replace(/hi\[c\] = Math\.max\(-1, Math\.min\(1, mx\)\);|lo\[c\] = Math\.max\(-1, Math\.min\(1, mn\)\);/g, ''), /Math\.max\(-1, Math\.min\(1,/, 'no hard clamp on audio samples (the overview picture clamps for drawing only)');
    const hook = readFileSync(join(process.cwd(), 'src/screens/lab/mastering/useMasterPlayback.ts'), 'utf8');
    assert.match(hook, /autoReplayAllowed\(matched, activeRef\.current \?\? pendingRef\.current\)/);
  });
});
