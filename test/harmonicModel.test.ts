/**
 * Ear Lab — harmonicModel math tests (untested-math QA night 2026-09-11).
 *
 * The presets are billed as "exact ideal series", so they are checked against
 * the closed-form Fourier coefficients, not against themselves. THD, crest
 * factor and the note/frequency helpers are checked against first principles
 * and against the reference points the lab's own copy asserts.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MODEL_HARMONICS, DBC_FLOOR_DB, AMP_FLOOR, PULSE_DUTY,
  PRESETS, PRESET_BLURBS, buildPreset,
  effectiveAmp, hasOvertones, dbcOf, synthWaveform, additivePayload,
  crestFactorDb, thd, normalizeSet, envelopeSlopeDbPerOct,
  NOTE_NAMES, BLACK_PC, noteInfo, midiToHz, harmonicHz, periodMs,
  type PresetKey, type Harmonic,
} from '../src/screens/lab/harmonicModel.ts';

const near = (a: number, b: number, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

const KEYS = PRESETS.map((p) => p.key);
const h = (over: Partial<Harmonic> = {}): Harmonic =>
  ({ n: 1, amp: 1, phaseDeg: 0, enabled: true, muted: false, ...over });

describe('model shape', () => {
  it('every preset builds 12 harmonics numbered 1..12, all enabled and unmuted', () => {
    for (const k of KEYS) {
      const s = buildPreset(k);
      assert.equal(s.length, MODEL_HARMONICS);
      s.forEach((x, i) => {
        assert.equal(x.n, i + 1, k);
        assert.equal(x.enabled, true, k);
        assert.equal(x.muted, false, k);
        assert.ok(x.amp >= 0 && x.amp <= 1, `${k} H${x.n} amp ${x.amp} out of 0..1`);
        assert.ok(x.phaseDeg >= 0 && x.phaseDeg < 360, `${k} H${x.n} phase ${x.phaseDeg}`);
      });
    }
  });
  it('the −60 dB floor and its amplitude agree: 10^(−60/20) = 0.001', () => {
    assert.equal(DBC_FLOOR_DB, -60);
    near(AMP_FLOOR, 0.001, 1e-12);
    near(20 * Math.log10(AMP_FLOOR), DBC_FLOOR_DB, 1e-9);
  });
  it('no preset ships a value sitting EXACTLY on the silence boundary', () => {
    for (const k of KEYS) {
      for (const x of buildPreset(k)) {
        assert.notEqual(x.amp, AMP_FLOOR, `${k} H${x.n} is on the floor — it would read as silent`);
      }
    }
  });
  it('buildPreset returns a fresh, fully-owned set each call', () => {
    const a = buildPreset('saw');
    a[0].amp = 0.123;
    assert.equal(buildPreset('saw')[0].amp, 1);
  });
});

describe('canonical series — the exact Fourier coefficients', () => {
  it('SINE is the fundamental alone', () => {
    const s = buildPreset('sine');
    assert.equal(s[0].amp, 1);
    assert.ok(s.slice(1).every((x) => x.amp === 0));
  });
  it('SQUARE is odd harmonics at 1/n — and nothing even', () => {
    for (const x of buildPreset('square')) {
      near(x.amp, x.n % 2 === 1 ? 1 / x.n : 0);
    }
    assert.match(PRESET_BLURBS.square, /1\/n/);
  });
  it('TRIANGLE is odd harmonics at 1/n² with the (−1)^((n−1)/2) sign', () => {
    for (const x of buildPreset('triangle')) {
      near(x.amp, x.n % 2 === 1 ? 1 / (x.n * x.n) : 0);
      const flip = x.n % 2 === 1 && ((x.n - 1) / 2) % 2 === 1;
      assert.equal(x.phaseDeg, flip ? 180 : 0, `H${x.n}`);
    }
    // 180° lands on 3, 7, 11 exactly (the header's claim).
    assert.deepEqual(buildPreset('triangle').filter((x) => x.phaseDeg === 180).map((x) => x.n),
      [3, 7, 11]);
    assert.match(PRESET_BLURBS.triangle, /1\/n²/);
  });
  it('SAW is EVERY harmonic at 1/n with the (−1)^(n+1) sign (180° on evens)', () => {
    for (const x of buildPreset('saw')) {
      near(x.amp, 1 / x.n);
      assert.equal(x.phaseDeg, x.n % 2 === 0 ? 180 : 0, `H${x.n}`);
    }
  });
  it('PULSE follows |sin(nπd)|/(n·sin(πd)) at d = 0.25, normalized H1 = 1', () => {
    assert.equal(PULSE_DUTY, 0.25);
    for (const x of buildPreset('pulse')) {
      const ideal = Math.abs(Math.sin(x.n * Math.PI * 0.25)) / (x.n * Math.sin(Math.PI * 0.25));
      near(x.amp, ideal < 1e-6 ? 0 : ideal, 1e-9);
    }
    near(buildPreset('pulse')[1].amp, 1 / (2 * Math.SQRT1_2), 1e-12); // H2 = 0.7071
  });
  it('a 25 % duty cycle nulls EVERY 4th harmonic — H4, H8, H12 exactly zero', () => {
    const s = buildPreset('pulse');
    for (const n of [4, 8, 12]) assert.equal(s[n - 1].amp, 0, `H${n} should be nulled`);
    for (const n of [1, 2, 3, 5, 6, 7, 9, 10, 11]) assert.ok(s[n - 1].amp > 0, `H${n} missing`);
    assert.match(PRESET_BLURBS.pulse, /every 4th/);
  });
  it('PULSE carries the cosine-basis sign in phase (90° positive, 270° negative)', () => {
    for (const x of buildPreset('pulse')) {
      assert.equal(x.phaseDeg, Math.sin(x.n * Math.PI * 0.25) >= 0 ? 90 : 270, `H${x.n}`);
    }
    // At d = 0.25 the coefficient is negative on n = 5, 6, 7 (the header's claim).
    assert.deepEqual(buildPreset('pulse').filter((x) => x.phaseDeg === 270).map((x) => x.n),
      [5, 6, 7, 8]); // H8's amplitude is 0, so its stored phase is cosmetic
  });
  it('the distortion recipes match their taught symmetry story', () => {
    const even = (k: PresetKey) => buildPreset(k).filter((x) => x.n % 2 === 0 && x.amp > 0).length;
    // "Symmetry adds only ODD harmonics"
    assert.equal(even('symClip'), 0);
    assert.equal(even('hardClip'), 0);
    // "Broken symmetry adds EVEN harmonics too"
    assert.ok(even('asymClip') > 0);
    assert.ok(even('softSat') > 0);
  });
  it('HARD CLIP really does roll off more slowly than SYM CLIP (harsher edge)', () => {
    const hard = envelopeSlopeDbPerOct(buildPreset('hardClip'));
    const sym = envelopeSlopeDbPerOct(buildPreset('symClip'));
    assert.ok(hard !== null && sym !== null);
    assert.ok(hard > sym, `hardClip ${hard} dB/oct must be shallower than symClip ${sym}`);
    assert.match(PRESET_BLURBS.hardClip, /SLOWER roll-off|wall of strong high harmonics/);
  });
});

describe('thd()', () => {
  it('a pure sine has ZERO distortion', () => {
    const t = thd(buildPreset('sine'));
    assert.equal(t.pct, 0);
    assert.equal(t.db, null); // 20·log10(0) is not a number to print
  });
  it('matches √(Σaₙ², n≥2)/a₁ for the truncated ideal square (43.833 %)', () => {
    const expected = Math.sqrt([3, 5, 7, 9, 11].reduce((a, n) => a + 1 / (n * n), 0)) * 100;
    near(thd(buildPreset('square')).pct!, expected, 1e-9);
    near(thd(buildPreset('square')).pct!, 43.8325, 1e-3);
  });
  it('matches the truncated ideal saw (75.165 %) and triangle (12.076 %)', () => {
    near(thd(buildPreset('saw')).pct!,
      Math.sqrt(Array.from({ length: 11 }, (_, i) => 1 / ((i + 2) ** 2)).reduce((a, b) => a + b, 0)) * 100,
      1e-9);
    near(thd(buildPreset('triangle')).pct!,
      Math.sqrt([3, 5, 7, 9, 11].reduce((a, n) => a + 1 / n ** 4, 0)) * 100, 1e-9);
  });
  it('the dB figure is 20·log10(pct/100): 100 % = 0 dB, 10 % = −20 dB, 1 % = −40 dB', () => {
    const at = (pct: number) => {
      // one harmonic carrying exactly `pct` of the fundamental
      const set = [h({ n: 1, amp: 1 }), h({ n: 2, amp: pct / 100 })];
      return thd(set);
    };
    near(at(100).db!, 0, 1e-9);
    near(at(10).db!, -20, 1e-9);
    near(at(1).db!, -40, 1e-9);
  });
  it('per-harmonic figures are aₙ/a₁ × 100', () => {
    const set = [h({ n: 1, amp: 0.5 }), h({ n: 2, amp: 0.25 }), h({ n: 3, amp: 0.05 })];
    const t = thd(set);
    assert.deepEqual(t.perHarmonic.map((p) => p.n), [2, 3]);
    near(t.perHarmonic[0].pct, 50, 1e-9);
    near(t.perHarmonic[1].pct, 10, 1e-9);
  });
  it('is scale-invariant — THD is a RATIO, so halving everything changes nothing', () => {
    const a = buildPreset('saw');
    const b = a.map((x) => ({ ...x, amp: x.amp * 0.37 }));
    near(thd(a).pct!, thd(b).pct!, 1e-9);
  });
  it('is NULL (never fabricated) when the fundamental is silent', () => {
    for (const set of [
      buildPreset('saw').map((x) => (x.n === 1 ? { ...x, amp: 0 } : x)),
      buildPreset('saw').map((x) => (x.n === 1 ? { ...x, muted: true } : x)),
      buildPreset('saw').map((x) => (x.n === 1 ? { ...x, enabled: false } : x)),
    ]) {
      const t = thd(set);
      assert.equal(t.pct, null);
      assert.equal(t.db, null);
      assert.deepEqual(t.perHarmonic, []);
    }
  });
  it('muting a harmonic removes it from the distortion figure', () => {
    const full = thd(buildPreset('square')).pct!;
    const muted = thd(buildPreset('square').map((x) => (x.n === 3 ? { ...x, muted: true } : x))).pct!;
    assert.ok(muted < full);
    near(muted, Math.sqrt([5, 7, 9, 11].reduce((a, n) => a + 1 / (n * n), 0)) * 100, 1e-9);
  });
  it('a harmonic at or under the floor counts as silent, not as distortion', () => {
    const t = thd([h({ n: 1, amp: 1 }), h({ n: 2, amp: AMP_FLOOR })]);
    assert.equal(t.pct, 0);
    assert.equal(t.perHarmonic[0].pct, 0);
  });
});

describe('crestFactorDb()', () => {
  it('a pure sine is 3.0103 dB — the reference point every meter lesson uses', () => {
    const sine = Array.from({ length: 4096 }, (_, i) => Math.sin((2 * Math.PI * i) / 4096));
    near(crestFactorDb(sine)!, 3.0103, 1e-3);
    near(crestFactorDb(synthWaveform(buildPreset('sine'), 4096, 4))!, 3.0103, 1e-2);
  });
  it('a perfect square wave is 0 dB (peak = RMS)', () => {
    near(crestFactorDb(Array.from({ length: 1000 }, (_, i) => (i < 500 ? 1 : -1)))!, 0, 1e-9);
  });
  it('DC is 0 dB and is never negative for any waveform', () => {
    near(crestFactorDb([0.3, 0.3, 0.3, 0.3])!, 0, 1e-12);
    for (const k of KEYS) {
      const c = crestFactorDb(synthWaveform(buildPreset(k), 2048, 3));
      assert.ok(c !== null && c >= -1e-9, `${k}: ${c}`);
    }
  });
  it('is scale-invariant (which is why peak-normalizing the drawing is safe)', () => {
    const w = synthWaveform(buildPreset('saw'), 2048, 3);
    near(crestFactorDb(w)!, crestFactorDb(w.map((v) => v * 0.013))!, 1e-9);
  });
  it('PHASE moves crest while the magnitude spectrum stays identical — the lab\'s point', () => {
    const flat = buildPreset('square');
    const rotated = flat.map((x) => (x.n > 1 ? { ...x, phaseDeg: 90 } : x));
    // Same amplitudes → same THD …
    near(thd(flat).pct!, thd(rotated).pct!, 1e-12);
    // … different waveform → different crest.
    assert.ok(Math.abs(crestFactorDb(synthWaveform(flat, 4096, 2))!
      - crestFactorDb(synthWaveform(rotated, 4096, 2))!) > 0.5);
  });
  it('never fabricates a figure for nothing', () => {
    assert.equal(crestFactorDb([]), null);
    assert.equal(crestFactorDb([0, 0, 0]), null);
  });
});

describe('synthWaveform()', () => {
  it('is peak-normalized to ±1 and the right length', () => {
    for (const k of KEYS) {
      const w = synthWaveform(buildPreset(k), 1024, 3);
      assert.equal(w.length, 1024, k);
      near(Math.max(...w.map(Math.abs)), 1, 1e-9);
      assert.ok(w.every(Number.isFinite), k);
    }
  });
  it('points = 1 does not divide by zero (bug-audit guard stays in place)', () => {
    const w = synthWaveform(buildPreset('saw'), 1, 3);
    assert.equal(w.length, 1);
    assert.ok(Number.isFinite(w[0]));
  });
  it('a silent set draws a flat line, not NaN', () => {
    assert.deepEqual(synthWaveform(buildPreset('sine').map((x) => ({ ...x, amp: 0 })), 4, 1),
      [0, 0, 0, 0]);
  });
  it('honours enabled / muted / the silence floor', () => {
    const base = buildPreset('saw');
    const a = synthWaveform(base.map((x) => (x.n === 2 ? { ...x, muted: true } : x)), 256, 2);
    const b = synthWaveform(base.map((x) => (x.n === 2 ? { ...x, enabled: false } : x)), 256, 2);
    const c = synthWaveform(base.map((x) => (x.n === 2 ? { ...x, amp: 0 } : x)), 256, 2);
    assert.deepEqual(a, b);
    assert.deepEqual(a, c);
  });
  it('the period really is 1/f0: N cycles give 2N−1 interior zero crossings', () => {
    // t spans [0, cycles] inclusive, so both endpoints ARE zeros and only the
    // 2N−1 crossings between them show up as sign changes.
    for (const cycles of [2, 4, 6]) {
      const w = synthWaveform(buildPreset('sine'), 4001, cycles);
      let crossings = 0;
      for (let i = 1; i < w.length; i++) if (w[i - 1] < 0 !== w[i] < 0) crossings++;
      assert.equal(crossings, 2 * cycles - 1, `${cycles} cycles`);
    }
  });
  it('harmonic n really oscillates n times faster than the fundamental', () => {
    const cross = (set: Harmonic[]) => {
      const w = synthWaveform(set, 8001, 1);
      let c = 0;
      for (let i = 1; i < w.length; i++) if (w[i - 1] < 0 !== w[i] < 0) c++;
      return c;
    };
    for (const n of [1, 2, 3, 5]) {
      assert.equal(cross([h({ n, amp: 1 })]), 2 * n - 1, `H${n}`);
    }
  });
});

describe('additivePayload()', () => {
  it('is always 25 numbers: f0 + 12 amps + 12 phases', () => {
    const p = additivePayload(buildPreset('square'), 440);
    assert.equal(p.length, 1 + 2 * MODEL_HARMONICS);
    assert.equal(p[0], 440);
  });
  it('places each harmonic in slot n, with its phase at 12 + n', () => {
    const set = [h({ n: 1, amp: 1, phaseDeg: 0 }), h({ n: 3, amp: 0.25, phaseDeg: 180 })];
    const p = additivePayload(set, 100);
    assert.equal(p[1], 1);
    assert.equal(p[3], 0.25);
    assert.equal(p[MODEL_HARMONICS + 3], 180);
  });
  it('uses the SAME silence predicate as the drawing — audio matches the picture', () => {
    const set = buildPreset('saw').map((x) => (x.n === 2 ? { ...x, muted: true } : x));
    assert.equal(additivePayload(set, 440)[2], 0);
    assert.equal(additivePayload(set, 440)[MODEL_HARMONICS + 2], 0);
    assert.equal(additivePayload([h({ n: 2, amp: AMP_FLOOR })], 440)[2], 0);
  });
});

describe('dbcOf / hasOvertones / effectiveAmp / normalizeSet', () => {
  it('dbcOf is 20·log10(amp) re full scale, floored at −60 dB', () => {
    near(dbcOf(h({ amp: 1 })), 0, 1e-12);
    near(dbcOf(h({ amp: 0.5 })), -6.0206, 1e-4);
    near(dbcOf(h({ amp: 0.1 })), -20, 1e-12);
    assert.equal(dbcOf(h({ amp: AMP_FLOOR })), -60);
    assert.equal(dbcOf(h({ amp: 0 })), -60);
    assert.equal(dbcOf(h({ amp: 1e-30 })), -60);
  });
  it('effectiveAmp zeroes disabled and muted stems', () => {
    assert.equal(effectiveAmp(h({ amp: 0.7 })), 0.7);
    assert.equal(effectiveAmp(h({ amp: 0.7, muted: true })), 0);
    assert.equal(effectiveAmp(h({ amp: 0.7, enabled: false })), 0);
  });
  it('hasOvertones gates the "audio plays a pure sine" honesty note correctly', () => {
    assert.equal(hasOvertones(buildPreset('sine')), false);
    assert.equal(hasOvertones(buildPreset('square')), true);
    assert.equal(hasOvertones(buildPreset('square').map((x) => (x.n > 1 ? { ...x, muted: true } : x))), false);
    assert.equal(hasOvertones([h({ n: 1, amp: 1 }), h({ n: 2, amp: AMP_FLOOR })]), false);
  });
  it('normalizeSet lifts the largest stored amplitude to exactly 1, preserving ratios', () => {
    const scaled = buildPreset('saw').map((x) => ({ ...x, amp: x.amp * 0.3 }));
    const n = normalizeSet(scaled);
    near(Math.max(...n.map((x) => x.amp)), 1, 1e-12);
    n.forEach((x, i) => near(x.amp, buildPreset('saw')[i].amp, 1e-12));
  });
  it('normalizeSet scales muted stems too, so unmuting afterwards is consistent', () => {
    const s = buildPreset('saw').map((x) => (x.n === 2 ? { ...x, muted: true, amp: 0.5 } : { ...x, amp: x.amp * 0.5 }));
    near(normalizeSet(s).find((x) => x.n === 2)!.amp, 1, 1e-12);
  });
  it('a silent set is returned unchanged (nothing honest to scale)', () => {
    const silent = buildPreset('sine').map((x) => ({ ...x, amp: 0 }));
    assert.ok(normalizeSet(silent).every((x) => x.amp === 0));
  });
  it('normalizeSet never returns the same object references (no shared mutation)', () => {
    const s = buildPreset('saw');
    assert.notEqual(normalizeSet(s)[0], s[0]);
  });
});

describe('envelopeSlopeDbPerOct()', () => {
  it('a 1/n series is exactly −6.02 dB/octave (saw and square both)', () => {
    near(envelopeSlopeDbPerOct(buildPreset('saw'))!, -6.0206, 1e-3);
    near(envelopeSlopeDbPerOct(buildPreset('square'))!, -6.0206, 1e-3);
  });
  it('a 1/n² series is exactly −12.04 dB/octave (triangle)', () => {
    near(envelopeSlopeDbPerOct(buildPreset('triangle'))!, -12.0412, 1e-3);
  });
  it('a flat series has zero slope', () => {
    near(envelopeSlopeDbPerOct(buildPreset('saw').map((x) => ({ ...x, amp: 0.5 })))!, 0, 1e-9);
  });
  it('is NULL when fewer than two harmonics contribute — no honest fit exists', () => {
    assert.equal(envelopeSlopeDbPerOct(buildPreset('sine')), null);
    assert.equal(envelopeSlopeDbPerOct([]), null);
    assert.equal(envelopeSlopeDbPerOct(buildPreset('saw').map((x) => ({ ...x, muted: true }))), null);
  });
});

describe('note / frequency helpers (A4 = 440 Hz)', () => {
  it('the anchor: 440 Hz is A4, MIDI 69, dead in tune', () => {
    assert.deepEqual(noteInfo(440), { midi: 69, label: 'A4', cents: 0 });
    assert.equal(midiToHz(69), 440);
  });
  it('the piano\'s ends and middle C land where they should', () => {
    assert.equal(noteInfo(27.5).label, 'A0');   // MIDI 21, lowest key
    assert.equal(noteInfo(4186.009044809578).label, 'C8'); // MIDI 108, top key
    assert.equal(noteInfo(261.6255653005986).label, 'C4'); // middle C
    near(midiToHz(60), 261.6256, 1e-4);
    near(midiToHz(21), 27.5, 1e-9);
  });
  it('an octave is exactly 2× — and 12 semitones', () => {
    for (const m of [21, 45, 69, 93]) {
      near(midiToHz(m + 12) / midiToHz(m), 2, 1e-12);
      assert.equal(noteInfo(midiToHz(m) * 2).midi, m + 12);
    }
  });
  it('a semitone is 2^(1/12) ≈ 100 cents', () => {
    near(midiToHz(70) / midiToHz(69), Math.pow(2, 1 / 12), 1e-12);
    near(1200 * Math.log2(midiToHz(70) / midiToHz(69)), 100, 1e-9);
  });
  it('cents report the deviation, and stay inside ±50', () => {
    assert.equal(noteInfo(443).cents, 12);   // 12·log2(443/440)·100 ≈ +11.8
    assert.equal(noteInfo(437).cents, -12);
    for (let f = 20; f < 8000; f *= 1.003) {
      const c = noteInfo(f).cents;
      assert.ok(c >= -50 && c <= 50, `${f} Hz → ${c} cents`);
    }
  });
  it('round-trips every MIDI note 0..127', () => {
    for (let m = 0; m <= 127; m++) {
      assert.equal(noteInfo(midiToHz(m)).midi, m);
      assert.equal(noteInfo(midiToHz(m)).cents, 0);
    }
  });
  it('note names and the black-key set are the standard twelve', () => {
    assert.equal(NOTE_NAMES.length, 12);
    assert.deepEqual([...NOTE_NAMES], ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
    assert.equal(BLACK_PC.size, 5);
    for (const pc of BLACK_PC) assert.match(NOTE_NAMES[pc], /#/);
    NOTE_NAMES.forEach((n, pc) => assert.equal(n.includes('#'), BLACK_PC.has(pc), n));
  });
  it('harmonics are exact integer multiples, and the period is 1000/f ms', () => {
    for (const n of [1, 2, 3, 7, 12]) assert.equal(harmonicHz(n, 220), n * 220);
    assert.equal(periodMs(1000), 1);
    near(periodMs(440), 2.272727, 1e-6);
    near(periodMs(harmonicHz(2, 440)), periodMs(440) / 2, 1e-12);
  });
});
