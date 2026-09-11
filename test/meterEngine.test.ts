/**
 * Visual Audio Analysis Lab — meterEngine math tests (untested-math QA night
 * 2026-09-11). Every assertion is a FIRST-PRINCIPLES identity or a number the
 * lab's own copy asserts to a paying student, not a snapshot of whatever the
 * code happens to emit. Irrational values compare with tolerances.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SIGNAL_LABELS, SIGNAL_BLURBS, renderSignal,
  peakOf, rmsOf, dcOf, db, crestDb, vuStep,
  simulateLoudness,
  SPECTRUM_LABELS, spectrumDb,
  SPECTROGRAM_LABELS, spectrogramLevel,
  waterfallRt, waterfallSpectrumDb, waterfallSliceDb, waterfallRidge,
  waterfallTimeSpan, waterfallTimeDivisions,
  eqFilterShape, EQ_FILTERS, EQ_FILTER_BY_KEY, RIDGE_CALLOUT_RATIO,
  ROOM_LABELS, stereoPair, correlationOf,
  type SignalKey, type RoomKey, type ReverbKey, type WaterfallOpts,
} from '../src/screens/lab/meter/meterEngine.ts';

const near = (a: number, b: number, tol = 1e-4) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

const SIGNALS = Object.keys(SIGNAL_LABELS) as SignalKey[];
const ROOMS = Object.keys(ROOM_LABELS) as RoomKey[];
const REVERBS: ReverbKey[] = ['none', 'room', 'plate', 'hall', 'spring'];

const scene = (over: Partial<WaterfallOpts> = {}): WaterfallOpts => ({
  room: 'studio', damping01: 0, eqGains: {}, eqFilter: 'bell220q6',
  qRing: false, reverb: 'none', ...over,
});

// ── The dB ladder a learner reads off every meter in the lab ────────────────
describe('db() — the amplitude↔decibel ladder', () => {
  it('0 dB is unity amplitude (0 dBFS = full scale)', () => near(db(1), 0, 1e-12));
  it('−6.02 dB is HALF the amplitude (the lab\'s "−6 dB ≈ half" rule)', () =>
    near(db(0.5), -6.0206, 1e-4));
  it('−3.01 dB is 1/√2 — half the POWER', () => near(db(Math.SQRT1_2), -3.0103, 1e-4));
  it('−20 dB is one tenth the amplitude', () => near(db(0.1), -20, 1e-12));
  it('every 20 dB is another factor of ten', () => {
    for (const a of [1, 0.1, 0.01, 0.001]) near(db(a) - db(a / 10), 20, 1e-9);
  });
  it('silence is floored at −120 dB, never −Infinity or NaN', () => {
    assert.equal(db(0), -120);
    assert.equal(db(1e-30), -120);
    assert.ok(Number.isFinite(db(0)));
  });
});

describe('peak / RMS / crest', () => {
  const N = 4096;
  const sine = Array.from({ length: N }, (_, i) => Math.sin((2 * Math.PI * i) / N));

  it('RMS of a unit sine is 1/√2, so its crest factor is exactly 3.01 dB', () => {
    near(peakOf(sine), 1, 1e-9);
    near(rmsOf(sine), Math.SQRT1_2, 1e-6);
    near(crestDb(sine), 3.0103, 1e-3);
  });
  it('SIGNAL_BLURBS.sine promises "exactly 3 dB above RMS" — the synth delivers it', () => {
    assert.match(SIGNAL_BLURBS.sine, /3 dB above RMS/);
    near(crestDb(renderSignal('sine', 4096, 1)), 3.0103, 1e-2);
  });
  it('a square wave has RMS = peak → 0 dB crest; the synth\'s band-limited one is under 2 dB', () => {
    const sq = Array.from({ length: N }, (_, i) => (i < N / 2 ? 1 : -1));
    near(crestDb(sq), 0, 1e-9);
    assert.ok(crestDb(renderSignal('square', 4096, 1)) < 2, 'blurb: "RMS nearly equals peak"');
  });
  it('RMS of a DC signal equals its level; DC detector reports it', () => {
    const dc = new Array(N).fill(0.4);
    near(rmsOf(dc), 0.4, 1e-12);
    near(dcOf(dc), 0.4, 1e-12);
  });
  it('an AC signal has ~zero DC offset', () => near(dcOf(sine), 0, 1e-9));
  it('empty input never divides by zero', () => {
    assert.equal(rmsOf([]), 0);
    assert.equal(dcOf([]), 0);
    assert.equal(peakOf([]), 0);
  });
  it('crest is scale-invariant (halving the signal moves peak and RMS together)', () =>
    near(crestDb(sine), crestDb(sine.map((v) => v * 0.5)), 1e-9));
});

describe('renderSignal — deterministic teaching signals', () => {
  it('is seeded: same key+seed → identical buffer, every visit', () => {
    assert.deepEqual(renderSignal('speech', 256, 1), renderSignal('speech', 256, 1));
  });
  it('every signal key renders, stays inside the ±1.2 rail, and is finite', () => {
    for (const k of SIGNALS) {
      const x = renderSignal(k, 1024, 1);
      assert.equal(x.length, 1024, k);
      assert.ok(x.every(Number.isFinite), `${k} produced a non-finite sample`);
      assert.ok(peakOf(x) <= 1.2 + 1e-12, `${k} exceeded the rail`);
      assert.ok(rmsOf(x) > 0, `${k} rendered silence`);
    }
  });
  it('THE crest-factor lesson: drums peak far above their average, sustained tones do not', () => {
    const crest = Object.fromEntries(
      SIGNALS.map((k) => [k, crestDb(renderSignal(k, 4096, 1))]),
    ) as Record<SignalKey, number>;
    // "A huge peak over a tiny average — the highest crest factor of the drums."
    assert.ok(crest.snare > crest.kick, 'snare blurb claims the highest drum crest');
    // "Held, sustained chords ... peak and average sit close together —
    //  the opposite of drums."
    assert.ok(crest.organ < crest.kick - 6, 'organ must read far flatter than a kick');
    assert.ok(crest.square < crest.organ, 'a square is the densest waveform a meter can see');
    // "Meters leap on each syllable and fall back in the silences."
    assert.ok(crest.speech > crest.organ, 'speech must out-crest a sustained organ');
    // "Peaks ride far above the average — exactly what LUFS-vs-peak is about."
    assert.ok(crest.music > crest.organ, 'a full mix must out-crest a sustained organ');
  });
  it('the odd-harmonic waves stay symmetric about zero (no DC to teach around)', () => {
    for (const k of ['sine', 'square', 'triangle', 'saw', 'organ'] as SignalKey[]) {
      assert.ok(Math.abs(dcOf(renderSignal(k, 4096, 1))) < 0.01, `${k} has a DC offset`);
    }
  });
});

describe('vuStep — 300 ms VU ballistics', () => {
  it('one time constant reaches 1 − 1/e (63.2 %) of a step, by definition', () => {
    let p = 0;
    for (let i = 0; i < 3000; i++) p = vuStep(p, 1, 0.0001); // 0.3 s in 0.1 ms steps
    near(p, 1 - Math.exp(-1), 1e-3);
  });
  it('five time constants are within 1 % of the target', () => {
    let p = 0;
    for (let i = 0; i < 15000; i++) p = vuStep(p, 1, 0.0001);
    assert.ok(p > 0.99, `${p}`);
  });
  it('an infinitely short step moves the needle not at all; a long one snaps to target', () => {
    near(vuStep(0.4, 1, 0), 0.4, 1e-12);
    near(vuStep(0, 1, 100), 1, 1e-9);
  });
  it('the needle never overshoots (first-order lag, no ringing)', () => {
    let p = 0;
    for (let i = 0; i < 5000; i++) {
      const q = vuStep(p, 1, 0.001);
      assert.ok(q >= p && q <= 1, `overshoot at step ${i}: ${q}`);
      p = q;
    }
  });
  it('this is WHY a VU cannot show a transient: a 5 ms burst barely moves it', () => {
    let p = 0;
    for (let i = 0; i < 5; i++) p = vuStep(p, 1, 0.001);
    assert.ok(p < 0.02, `a 5 ms burst pushed the needle to ${p}`);
  });
});

describe('simulateLoudness — the simplified BS.1770-STYLE teaching model', () => {
  it('every signal produces a complete, finite story', () => {
    for (const k of SIGNALS) {
      const s = simulateLoudness(k);
      assert.equal(s.momentary.length, 96, k);
      assert.equal(s.short.length, 96, k);
      for (const v of [s.integratedLufs, s.lraLu, s.truePeakDbtp, s.samplePeakDbfs]) {
        assert.ok(Number.isFinite(v), `${k} produced a non-finite figure`);
      }
    }
  });
  it('TRUE peak can never read below SAMPLE peak — inter-sample peaks only ADD', () => {
    for (const k of SIGNALS) {
      const s = simulateLoudness(k);
      assert.ok(s.truePeakDbtp >= s.samplePeakDbfs,
        `${k}: dBTP ${s.truePeakDbtp} < dBFS ${s.samplePeakDbfs}`);
    }
  });
  it('loudness range is never negative (95th percentile ≥ 10th, by construction)', () => {
    for (const k of SIGNALS) assert.ok(simulateLoudness(k).lraLu >= 0, k);
  });
  it('short-term is a moving average of momentary, so it never leaves its range', () => {
    for (const k of SIGNALS) {
      const s = simulateLoudness(k);
      const lo = Math.min(...s.momentary);
      const hi = Math.max(...s.momentary);
      for (const v of s.short) assert.ok(v >= lo - 1e-9 && v <= hi + 1e-9, `${k}: ${v}`);
    }
  });
  it('integrated loudness sits inside the short-term range (it is their mean)', () => {
    for (const k of SIGNALS) {
      const s = simulateLoudness(k);
      assert.ok(s.integratedLufs >= Math.min(...s.short) - 0.06, k);
      assert.ok(s.integratedLufs <= Math.max(...s.short) + 0.06, k);
    }
  });
  it('speech and a full mix swing more than a sustained organ (the LRA lesson)', () => {
    assert.ok(simulateLoudness('speech').lraLu > simulateLoudness('organ').lraLu);
    assert.ok(simulateLoudness('music').lraLu > simulateLoudness('organ').lraLu);
  });
  it('is deterministic per (key, seed)', () => {
    assert.deepEqual(simulateLoudness('music', 3), simulateLoudness('music', 3));
  });
});

describe('spectrumDb — the M5 pattern library', () => {
  it('PINK NOISE falls −3 dB per octave = −10 dB per decade, exactly', () => {
    // The blurb teaches "a gentle -3 dB/octave downward slope" on a log analyzer.
    near(spectrumDb('pinknoise', 2000) - spectrumDb('pinknoise', 1000), -3.0103, 1e-3);
    near(spectrumDb('pinknoise', 200) - spectrumDb('pinknoise', 20), -10, 1e-9);
    near(spectrumDb('pinknoise', 20), 0, 1e-12);
  });
  it('each pattern peaks where its name says it does', () => {
    const peakOfPattern = (k: keyof typeof SPECTRUM_LABELS) => {
      let bf = 0, bv = -Infinity;
      for (let f = 20; f < 20000; f *= 1.001) {
        const v = spectrumDb(k, f);
        if (v > bv) { bv = v; bf = f; }
      }
      return bf;
    };
    near(peakOfPattern('kick') / 60, 1, 0.05);       // 60 Hz thump
    near(peakOfPattern('hum') / 60, 1, 0.05);        // mains fundamental
    near(peakOfPattern('feedback') / 1750, 1, 0.02); // the ringing tone
    near(peakOfPattern('speech') / 220, 1, 0.05);    // first formant region
    near(peakOfPattern('guitar') / 196, 1, 0.05);    // open G string
    assert.ok(peakOfPattern('cymbal') > 3000, 'a cymbal must peak in the top octaves');
  });
  it('mains hum is a HARMONIC series on 60 Hz, not one lone tone', () => {
    for (const h of [2, 3, 4]) {
      assert.ok(spectrumDb('hum', 60 * h) > spectrumDb('hum', 60 * h * 1.25) + 3,
        `no ${60 * h} Hz harmonic peak`);
    }
  });
  it('feedback is NARROW — an octave away it has collapsed', () => {
    assert.ok(spectrumDb('feedback', 1750) - spectrumDb('feedback', 3500) > 40);
  });
  it('every pattern is finite across the audible band', () => {
    for (const k of Object.keys(SPECTRUM_LABELS) as (keyof typeof SPECTRUM_LABELS)[]) {
      for (let f = 20; f <= 20000; f *= 1.05) {
        assert.ok(Number.isFinite(spectrumDb(k, f)), `${k} @ ${f}`);
      }
    }
  });
});

describe('spectrogramLevel — the M6 painters', () => {
  it('every pattern is finite and non-negative over the whole plot', () => {
    for (const k of Object.keys(SPECTROGRAM_LABELS) as (keyof typeof SPECTROGRAM_LABELS)[]) {
      for (let t = 0; t <= 1; t += 0.02) {
        for (let f = 0; f <= 1; f += 0.02) {
          const v = spectrogramLevel(k, t, f);
          assert.ok(Number.isFinite(v) && v >= 0, `${k} @ (${t},${f}) = ${v}`);
        }
      }
    }
  });
  it('white noise is broadband and flat-ish at every instant (the reference picture)', () => {
    for (const t of [0.1, 0.5, 0.9]) {
      const col = Array.from({ length: 50 }, (_, i) => spectrogramLevel('whitenoise', t, i / 49));
      assert.ok(Math.min(...col) > 0.4 && Math.max(...col) < 0.8, 'not flat');
    }
  });
  it('a whistle is ONE narrow band; a cymbal is high and broad', () => {
    const whistleCol = Array.from({ length: 101 }, (_, i) => spectrogramLevel('whistle', 0.5, i / 100));
    const loud = whistleCol.filter((v) => v > 0.5).length;
    assert.ok(loud > 0 && loud < 12, `whistle occupied ${loud}/101 bins`);
    // The cymbal decays: later is quieter than the hit.
    const hit = spectrogramLevel('cymbal', 0.15, 0.8);
    assert.ok(spectrogramLevel('cymbal', 0.9, 0.8) < hit, 'cymbal must decay over time');
  });
  it('feedback BUILDS — it is louder late than early (that is the whole lesson)', () => {
    assert.ok(spectrogramLevel('feedback', 0.9, 0.58) > spectrogramLevel('feedback', 0.02, 0.58));
  });
});

// ── EQ filter shapes: Q really is Q ──────────────────────────────────────────
describe('eqFilterShape — bandwidth actually comes from Q', () => {
  it('every catalogued filter is full-strength at its own centre', () => {
    for (const spec of EQ_FILTERS) {
      if (spec.kind === 'bell') near(eqFilterShape(spec.key, spec.hz), 1, 1e-9);
    }
  });
  it('measuring the half-gain width of the Q6 bell recovers Q = 6', () => {
    const spec = EQ_FILTER_BY_KEY.bell220q6;
    let lo = spec.hz, hi = spec.hz;
    for (let i = 1; i < 200000; i++) {
      const f = spec.hz * Math.pow(2, -i / 20000);
      if (eqFilterShape(spec.key, f) < 0.5) { lo = f; break; }
    }
    for (let i = 1; i < 200000; i++) {
      const f = spec.hz * Math.pow(2, i / 20000);
      if (eqFilterShape(spec.key, f) < 0.5) { hi = f; break; }
    }
    const bwOct = Math.log2(hi / lo);
    near(bwOct, 0.2402, 2e-3); // the label's "about a quarter-octave wide"
    near(1 / (2 * Math.sinh((Math.LN2 / 2) * bwOct)), 6, 0.01);
  });
  it('measuring the half-gain width of the Q1 bell recovers Q = 1 (~1.39 oct)', () => {
    const spec = EQ_FILTER_BY_KEY.bell440q1;
    let lo = spec.hz, hi = spec.hz;
    for (let i = 1; i < 200000; i++) {
      const f = spec.hz * Math.pow(2, -i / 20000);
      if (eqFilterShape(spec.key, f) < 0.5) { lo = f; break; }
    }
    for (let i = 1; i < 200000; i++) {
      const f = spec.hz * Math.pow(2, i / 20000);
      if (eqFilterShape(spec.key, f) < 0.5) { hi = f; break; }
    }
    const bwOct = Math.log2(hi / lo);
    near(bwOct, 1.3885, 5e-3); // the label's "nearly one and a half octaves"
    near(1 / (2 * Math.sinh((Math.LN2 / 2) * bwOct)), 1, 0.01);
  });
  it('the Q6 bell is genuinely narrower than the Q1 bell (the surgical-vs-musical point)', () => {
    // Compare at the same relative offset from each centre.
    const off = Math.pow(2, 0.4);
    assert.ok(eqFilterShape('bell220q6', 220 * off) < eqFilterShape('bell440q1', 440 * off));
  });
  it('the shelf is a TILT: half gain at the corner, ~none below, ~full above', () => {
    near(eqFilterShape('shelf1k', 1000), 0.5, 1e-9);
    assert.ok(eqFilterShape('shelf1k', 100) < 0.02, 'shelf leaked below its corner');
    assert.ok(eqFilterShape('shelf1k', 10000) > 0.98, 'shelf never reached full gain');
    // Monotonic rising — a shelf has no bump.
    let prev = -1;
    for (let f = 20; f <= 20000; f *= 1.1) {
      const v = eqFilterShape('shelf1k', f);
      assert.ok(v >= prev - 1e-12, `shelf dipped at ${f}`);
      prev = v;
    }
  });
  it('an unknown key falls back rather than returning NaN', () => {
    // @ts-expect-error deliberate bad key — the UI must never draw a NaN curve.
    assert.ok(Number.isFinite(eqFilterShape('nope', 1000)));
  });
});

describe('waterfallSpectrumDb — EQ bands SUM, they do not replace each other', () => {
  it('a +6 dB band lifts its own centre by exactly 6 dB', () => {
    const flat = scene();
    const boosted = scene({ eqGains: { bell220q6: 6 } });
    near(waterfallSpectrumDb(boosted, 220) - waterfallSpectrumDb(flat, 220), 6, 1e-9);
  });
  it('two bands at once contribute BOTH (the 2026-08-30 bug fix stays fixed)', () => {
    const flat = scene();
    const both = scene({ eqGains: { bell220q6: 6, bell440q1: -4 } });
    const delta = waterfallSpectrumDb(both, 440) - waterfallSpectrumDb(flat, 440);
    near(delta, -4 + 6 * eqFilterShape('bell220q6', 440), 1e-9);
    // And the 220 band is still there while 440 is the selected one — its own
    // +6 dB, less the wide 440 cut's skirt reaching an octave down.
    near(waterfallSpectrumDb(both, 220) - waterfallSpectrumDb(flat, 220),
      6 - 4 * eqFilterShape('bell440q1', 220), 1e-9);
    assert.ok(waterfallSpectrumDb(both, 220) - waterfallSpectrumDb(flat, 220) > 5);
  });
  it('which band is SELECTED changes nothing — only the gains do', () => {
    const a = scene({ eqGains: { bell220q6: 6 }, eqFilter: 'bell220q6' });
    const b = scene({ eqGains: { bell220q6: 6 }, eqFilter: 'shelf1k' });
    for (const f of [50, 220, 440, 1000, 8000]) {
      near(waterfallSpectrumDb(a, f), waterfallSpectrumDb(b, f), 1e-12);
    }
  });
  it('a cut is the mirror of a boost', () => {
    const up = scene({ eqGains: { bell440q1: 9 } });
    const dn = scene({ eqGains: { bell440q1: -9 } });
    const flat = scene();
    for (const f of [100, 440, 2000]) {
      near(waterfallSpectrumDb(up, f) - waterfallSpectrumDb(flat, f),
        waterfallSpectrumDb(flat, f) - waterfallSpectrumDb(dn, f), 1e-9);
    }
  });
});

describe('waterfallRt — Eyring RT60 physics', () => {
  const BANDS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  it('a bare shell reproduces its calibrated RT60 profile (inverse-Eyring round trip)', () => {
    // Rooms with no modal ring must land exactly on their authored bare curve.
    const authored: Record<string, number[]> = {
      cathedral: [9.0, 8.5, 8.0, 7.2, 6.2, 5.0, 3.2, 1.9, 1.0],
      studio: [2.2, 2.0, 1.8, 1.6, 1.5, 1.4, 1.2, 1.0, 0.8],
      theater: [7.0, 6.5, 6.0, 5.5, 5.0, 4.2, 2.9, 1.8, 1.0],
    };
    for (const [room, curve] of Object.entries(authored)) {
      BANDS.forEach((f, i) => {
        near(waterfallRt(scene({ room: room as RoomKey }), f), curve[i], 1e-6);
      });
    }
  });
  it('the two modal rooms stand ABOVE their diffuse curve at the mode, and only there', () => {
    // classroom: a 250 Hz mode at 1.75× bare. living: 110 Hz at 1.8×.
    near(waterfallRt(scene({ room: 'classroom' }), 250), 2.2 * 1.75, 1e-6);
    near(waterfallRt(scene({ room: 'classroom' }), 1000), 1.9, 1e-6); // untouched
    assert.ok(waterfallRt(scene({ room: 'living' }), 110) > 1.3 * 1.5);
    near(waterfallRt(scene({ room: 'living' }), 2000), 0.9, 1e-6); // untouched
  });
  it('treatment can only SHORTEN a decay, never lengthen it — at every frequency', () => {
    for (const room of ROOMS) {
      for (let f = 20; f <= 20000; f *= 1.15) {
        let prev = Infinity;
        for (let d = 0; d <= 1.0001; d += 0.1) {
          const rt = waterfallRt(scene({ room, damping01: d }), f);
          assert.ok(rt <= prev + 1e-9, `${room} @ ${f.toFixed(0)} Hz got LONGER at damping ${d}`);
          prev = rt;
        }
      }
    }
  });
  it('porous treatment eats the TOP first and the BOTTOM last (the bass-trap lesson)', () => {
    for (const room of ROOMS) {
      const bare = scene({ room });
      const done = scene({ room, damping01: 1 });
      const lfCut = waterfallRt(bare, 63) / waterfallRt(done, 63);
      const hfCut = waterfallRt(bare, 4000) / waterfallRt(done, 4000);
      assert.ok(hfCut > lfCut, `${room}: treatment cut the lows harder than the highs`);
    }
  });
  it('you cannot kill a cathedral with panels — it stays over a second, fully treated', () => {
    assert.ok(waterfallRt(scene({ room: 'cathedral', damping01: 1 }), 1000) > 1);
  });
  it('a fully treated small room bottoms out at the 0.12 s realism clamp, not at zero', () => {
    for (const room of ROOMS) {
      for (let f = 20; f <= 20000; f *= 1.2) {
        assert.ok(waterfallRt(scene({ room, damping01: 1 }), f) >= 0.12 - 1e-12);
      }
    }
  });
  it('bigger shells ring longer than small ones at the same treatment', () => {
    for (const d of [0, 0.5, 1]) {
      const cathedral = waterfallRt(scene({ room: 'cathedral', damping01: d }), 500);
      const studio = waterfallRt(scene({ room: 'studio', damping01: d }), 500);
      assert.ok(cathedral > studio, `damping ${d}`);
    }
  });
  it('added reverb runs in PARALLEL: the tail is never shorter than the dry room', () => {
    for (const room of ROOMS) {
      for (const reverb of REVERBS) {
        for (let f = 40; f <= 12000; f *= 1.1) {
          const wet = waterfallRt(scene({ room, reverb }), f);
          const dry = waterfallRt(scene({ room }), f);
          assert.ok(wet >= dry - 1e-9, `${room}+${reverb} @ ${f.toFixed(0)}: ${wet} < ${dry}`);
        }
      }
    }
  });
  it('reverb RT varies CONTINUOUSLY with frequency — no three-plateau cliffs', () => {
    // The 2026-08-30 regression drew vertical steps at 400 Hz and 3 kHz.
    for (const reverb of REVERBS) {
      for (let f = 40; f < 12000; f *= 1.01) {
        const a = waterfallRt(scene({ reverb }), f);
        const b = waterfallRt(scene({ reverb }), f * 1.01);
        assert.ok(Math.abs(20 * Math.log10(b / a)) < 0.5,
          `${reverb}: a cliff at ${f.toFixed(0)} Hz`);
      }
    }
  });
  it('hall keeps its lows longest, plate is the flattest — their characters', () => {
    const rtOf = (reverb: ReverbKey, f: number) =>
      waterfallRt(scene({ room: 'studio', reverb }), f);
    assert.ok(rtOf('hall', 63) / rtOf('hall', 8000) > rtOf('plate', 63) / rtOf('plate', 8000));
  });
  it('is always finite and positive across the whole plot, for every combination', () => {
    for (const room of ROOMS) {
      for (const reverb of REVERBS) {
        for (const qRing of [false, true]) {
          for (const d of [0, 0.37, 1]) {
            for (let f = 20; f <= 20000; f *= 1.3) {
              const rt = waterfallRt(scene({ room, reverb, qRing, damping01: d }), f);
              assert.ok(Number.isFinite(rt) && rt > 0, `${room}/${reverb} @ ${f}: ${rt}`);
            }
          }
        }
      }
    }
  });
  it('damping is clamped: below 0 and above 1 behave as 0 and 1', () => {
    near(waterfallRt(scene({ damping01: -3 }), 1000), waterfallRt(scene({ damping01: 0 }), 1000), 1e-12);
    near(waterfallRt(scene({ damping01: 9 }), 1000), waterfallRt(scene({ damping01: 1 }), 1000), 1e-12);
  });
});

describe('waterfallSliceDb — 60 dB in exactly RT60 seconds', () => {
  it('that is the DEFINITION of RT60, and it holds at every frequency and scene', () => {
    for (const room of ROOMS) {
      for (const reverb of REVERBS) {
        const o = scene({ room, reverb, eqGains: { bell220q6: 5 } });
        for (const f of [63, 220, 1000, 8000]) {
          const rt = waterfallRt(o, f);
          near(waterfallSliceDb(o, f, rt) - waterfallSpectrumDb(o, f), -60, 1e-9);
          near(waterfallSliceDb(o, f, rt / 2) - waterfallSpectrumDb(o, f), -30, 1e-9);
        }
      }
    }
  });
  it('t = 0 is the excitation spectrum itself', () => {
    const o = scene({ eqGains: { bell440q1: -7 } });
    for (const f of [50, 440, 5000]) near(waterfallSliceDb(o, f, 0), waterfallSpectrumDb(o, f), 1e-12);
  });
  it('the decay is monotonic in time', () => {
    const o = scene({ room: 'classroom' });
    let prev = Infinity;
    for (let t = 0; t < 4; t += 0.05) {
      const v = waterfallSliceDb(o, 250, t);
      assert.ok(v < prev, `not falling at t=${t}`);
      prev = v;
    }
  });
});

describe('waterfallRidge — ONE ridge detector for three UI elements', () => {
  it('finds the classroom\'s 250 Hz mode and the living room\'s 110 Hz mode', () => {
    const c = waterfallRidge(scene({ room: 'classroom' }));
    near(c.f / 250, 1, 0.03);
    assert.ok(c.ratio > RIDGE_CALLOUT_RATIO, `classroom ridge only ${c.ratio}`);
    const l = waterfallRidge(scene({ room: 'living' }));
    near(l.f / 110, 1, 0.03);
    assert.ok(l.ratio > RIDGE_CALLOUT_RATIO, `living ridge only ${l.ratio}`);
  });
  it('stays QUIET on a smooth room — a broadband LF tilt is acoustics, not ringing', () => {
    for (const room of ['cathedral', 'studio', 'theater'] as RoomKey[]) {
      const r = waterfallRidge(scene({ room }));
      assert.ok(r.ratio < RIDGE_CALLOUT_RATIO,
        `${room} falsely flagged ${r.f.toFixed(0)} Hz at ratio ${r.ratio}`);
      assert.ok(waterfallRidge(scene({ room, damping01: 1 })).ratio < RIDGE_CALLOUT_RATIO,
        `${room} fully damped falsely flagged a ridge`);
    }
  });
  it('the Q RING filter is found at 1.2 kHz when no room mode outshouts it', () => {
    for (const room of ['studio', 'living'] as RoomKey[]) {
      const r = waterfallRidge(scene({ room, qRing: true }));
      near(r.f / 1200, 1, 0.03);
      assert.ok(r.ratio > RIDGE_CALLOUT_RATIO, `${room}+qRing only ${r.ratio}`);
    }
  });
  it('always returns a finite, in-band frequency and a ratio ≥ 1', () => {
    for (const room of ROOMS) {
      for (const reverb of REVERBS) {
        const r = waterfallRidge(scene({ room, reverb, qRing: true }));
        assert.ok(r.f >= 40 && r.f <= 12000, `${room}/${reverb}: ${r.f}`);
        assert.ok(r.ratio >= 1 && Number.isFinite(r.ratio));
      }
    }
  });
});

describe('waterfallTimeSpan / Divisions — the pinned time ruler', () => {
  it('the ruler does NOT move when you work the damping fader (owner 2026-08-28)', () => {
    for (const room of ROOMS) {
      const span = waterfallTimeSpan(scene({ room }));
      for (const d of [0, 0.25, 0.5, 0.75, 1]) {
        assert.equal(waterfallTimeSpan(scene({ room, damping01: d })), span, room);
      }
      // Nor with EQ or the ring filter — only ROOM and REVERB are scene selectors.
      assert.equal(waterfallTimeSpan(scene({ room, qRing: true })), span, room);
      assert.equal(waterfallTimeSpan(scene({ room, eqGains: { bell220q6: 12 } })), span, room);
    }
  });
  it('the window is long enough for the bare room\'s slowest decay to finish', () => {
    for (const room of ROOMS) {
      const bare = scene({ room });
      let maxRt = 0;
      for (let f = 31.5; f <= 16000; f *= 1.05) maxRt = Math.max(maxRt, waterfallRt(bare, f));
      assert.ok(waterfallTimeSpan(bare) >= maxRt, `${room}: ${waterfallTimeSpan(bare)} < ${maxRt}`);
    }
  });
  it('a bigger room gets a longer ruler', () => {
    assert.ok(waterfallTimeSpan(scene({ room: 'cathedral' })) > waterfallTimeSpan(scene({ room: 'living' })));
  });
  it('floor marks are strictly inside the window, ascending, and round', () => {
    for (const span of [0.3, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10, 12]) {
      const d = waterfallTimeDivisions(span);
      assert.ok(d.length >= 1 && d.length <= 5, `span ${span} produced ${d.length} marks`);
      for (let i = 0; i < d.length; i++) {
        assert.ok(d[i] > 0 && d[i] < span, `${span}: mark ${d[i]} outside`);
        if (i) assert.ok(d[i] > d[i - 1], `${span}: marks not ascending`);
      }
    }
  });
});

describe('correlationOf — the phase meter\'s truth', () => {
  const N = 512;
  const a = Array.from({ length: N }, (_, i) => Math.sin((2 * Math.PI * 7 * i) / N));
  const b = Array.from({ length: N }, (_, i) => Math.cos((2 * Math.PI * 7 * i) / N));

  it('identical channels read +1 — that is MONO', () => near(correlationOf(a, a), 1, 1e-9));
  it('inverted channels read −1 — that is polarity reversal', () =>
    near(correlationOf(a, a.map((v) => -v)), -1, 1e-9));
  it('quadrature (90° apart) reads 0 — no correlation either way', () =>
    near(correlationOf(a, b), 0, 1e-9));
  it('is level-independent: a quieter right channel is still fully correlated', () =>
    near(correlationOf(a, a.map((v) => v * 0.01)), 1, 1e-9));
  it('is bounded to ±1 for any input, and never NaN on silence', () => {
    assert.ok(Math.abs(correlationOf(a, b)) <= 1);
    assert.ok(Number.isFinite(correlationOf(new Array(N).fill(0), new Array(N).fill(0))));
  });
  it('mono material is unity-correlated however wide the goniometer draws it', () => {
    const { l, r } = stereoPair(0, 0);
    near(correlationOf(l, r), 1, 1e-6);
  });
  it('flipping the right channel\'s polarity drives it to −1', () => {
    const { l, r } = stereoPair(0, 180);
    near(correlationOf(l, r), -1, 1e-6);
  });
  it('stereoPair is deterministic and produces equal-length finite channels', () => {
    const { l, r } = stereoPair(0.5, 45, 256, 5);
    assert.equal(l.length, 256);
    assert.equal(r.length, 256);
    assert.ok(l.every(Number.isFinite) && r.every(Number.isFinite));
    assert.deepEqual(stereoPair(0.5, 45, 256, 5), { l, r });
  });
});
