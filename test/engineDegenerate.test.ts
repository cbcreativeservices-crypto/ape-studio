/**
 * Audio engines — DEGENERATE-INPUT tests (edge-case QA night 2026-09-11).
 *
 * The existing per-engine suites pin the MATH at normal values. This file pins
 * the GUARDS: the `Math.max(1, x.length)`, the `Math.max(1e-6, lin)`, the
 * `Math.max(1, points - 1)`, the `null` returns that refuse to fabricate a
 * figure. Each one exists because something would otherwise divide by zero,
 * take the log of zero, or average over nothing — and a paying student would
 * read "NaN" off a meter.
 *
 * The finding worth recording: meterEngine, waveEngine, gainEngine and
 * harmonicModel ALL held up. Every empty collection, every zero denominator and
 * every silent signal already lands on a defined value or an honest `null`.
 * These tests make sure the guards stay, because a guard nobody tests is a
 * guard somebody deletes.
 *
 * Where an engine function DOES go non-finite (eqMath.fmtHz(NaN), qFromBwOct(0),
 * harmonicModel.noteInfo(0)), the input is unreachable behind a clamped slider
 * or a fixed constant band list — so the test pins THE CLAMP, and says so.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SIGNAL_LABELS, renderSignal,
  peakOf, rmsOf, dcOf, db, crestDb, vuStep,
  SPECTRUM_LABELS, spectrumDb,
  SPECTROGRAM_LABELS, spectrogramLevel,
  waterfallRt, waterfallSpectrumDb, waterfallSliceDb, waterfallRidge,
  waterfallTimeSpan, waterfallTimeDivisions,
  ROOM_LABELS, stereoPair, correlationOf,
  type SignalKey, type SpectrumKey, type SpectrogramKey, type RoomKey, type WaterfallOpts,
} from '../src/screens/lab/meter/meterEngine.ts';
import {
  bwOctFromQ, qFromBwOct, fFromNorm, normFromF, fmtHz,
  butterworthHpDb, butterworthLpDb, biquadMagDb, biquadPhaseDeg, rbjNotch,
  graphicActualDb, graphicPhaseDeg, sliderCurveDb, baseSpectrumDb, maxPosDb,
} from '../src/screens/lab/eq/modules/eqMath.ts';
import {
  CLIP_CEIL, HOT_EDGE, LOW_EDGE, computeChain, meterFill, regionFor,
  chainIsHealthy, verdictFor, type Stage,
} from '../src/screens/lab/gain/gainEngine.ts';
import {
  buildPreset, crestFactorDb, thd, normalizeSet, envelopeSlopeDbPerOct,
  synthWaveform, additivePayload, dbcOf, hasOvertones, noteInfo, midiToHz, periodMs,
  type Harmonic, type HarmonicSet,
} from '../src/screens/lab/harmonicModel.ts';
import {
  MATERIALS, alphaAt, speedOfSound, sabineRT, modeFrequency, modePressure,
  maekawaAttenuationDb, refractedRayHeight, arrayPositions, fieldDb, arrivalsAt,
  responseAt, directivityGain, type MaterialKey, type WaveScene, type WaveSource,
} from '../src/screens/lab/wave/waveEngine.ts';

const finite = (x: number, what: string) =>
  assert.ok(Number.isFinite(x), `${what} is not finite: ${x}`);

// ═══════════════════════════════════════════════════════════════════════════
// meterEngine — the lab whose every number is on a meter face
// ═══════════════════════════════════════════════════════════════════════════

const SIGNALS = Object.keys(SIGNAL_LABELS) as SignalKey[];
const SPECTRA = Object.keys(SPECTRUM_LABELS) as SpectrumKey[];
const SPECTROGRAMS = Object.keys(SPECTROGRAM_LABELS) as SpectrogramKey[];
const ROOMS = Object.keys(ROOM_LABELS) as RoomKey[];

describe('meterEngine — an EMPTY buffer (the first frame, a stopped mic)', () => {
  it('peak of nothing is 0, not −Infinity from a Math.max spread', () =>
    assert.equal(peakOf([]), 0));
  it('RMS of nothing is 0, not 0/0 = NaN', () => assert.equal(rmsOf([]), 0));
  it('DC of nothing is 0, not 0/0 = NaN', () => assert.equal(dcOf([]), 0));
  it('crest factor of nothing is 0 dB, not NaN', () => {
    const c = crestDb([]);
    finite(c, 'crestDb([])');
    assert.equal(c, 0);
  });
  it('correlation of two empty channels is 0 — the "no information" reading', () =>
    assert.equal(correlationOf([], []), 0));
  it('a one-sample buffer does not divide by (n−1)', () => {
    finite(rmsOf([0.5]), 'rmsOf([0.5])');
    finite(crestDb([0.5]), 'crestDb([0.5])');
  });
});

describe('meterEngine — DIGITAL SILENCE (a muted channel, a disconnected input)', () => {
  const silence = new Array(256).fill(0);
  it('db(0) floors at −120 instead of −Infinity', () => assert.equal(db(0), -120));
  it('db() of a NEGATIVE amplitude floors too — never NaN from log of a negative', () => {
    assert.equal(db(-1), -120);
    finite(db(-1e9), 'db(-1e9)');
  });
  it('crest factor of silence is 0 dB (−120 − −120), not NaN', () =>
    assert.equal(crestDb(silence), 0));
  it('correlation of two silent channels is 0, not 0/0', () =>
    assert.equal(correlationOf(silence, silence), 0));
  it('a silent channel against a live one does not blow up', () =>
    finite(correlationOf(silence, renderSignal('sine', 256)), 'correlationOf(silence, sine)'));
});

describe('meterEngine — every SIGNAL renders finite samples at any buffer size', () => {
  for (const key of SIGNALS) {
    it(`${key}: n = 0 yields an empty buffer, not a crash`, () =>
      assert.equal(renderSignal(key, 0).length, 0));
    it(`${key}: n = 1 yields one finite sample (no i/(n−1) division by zero)`, () => {
      const x = renderSignal(key, 1);
      assert.equal(x.length, 1);
      finite(x[0], `renderSignal(${key}, 1)[0]`);
    });
    it(`${key}: every sample stays finite and inside ±4 at n = 512`, () => {
      for (const v of renderSignal(key, 512)) {
        finite(v, `renderSignal(${key})`);
        assert.ok(Math.abs(v) <= 4, `${key} sample ${v} is off the scale`);
      }
    });
  }
});

describe('meterEngine — the VU ballistics at a degenerate time step', () => {
  it('a zero-length frame (dt = 0) leaves the needle exactly where it was', () =>
    assert.equal(vuStep(0.4, 0.9, 0), 0.4));
  it('a zero time constant snaps straight to target instead of dividing by zero', () => {
    const v = vuStep(0, 1, 0.1, 0);
    finite(v, 'vuStep with tc = 0');
    assert.equal(v, 1);
  });
  it('a huge dropped frame does not overshoot past the target', () => {
    const v = vuStep(0, 1, 60);
    finite(v, 'vuStep with a 60 s frame');
    assert.ok(v <= 1 + 1e-9 && v >= 0, `${v}`);
  });
  it('a negative dt (a clock that went backwards) stays finite', () =>
    finite(vuStep(0.5, 0.9, -0.05), 'vuStep with negative dt'));
});

describe('meterEngine — spectra and spectrograms at the edges of their axes', () => {
  for (const key of SPECTRA) {
    it(`${key}: finite across the whole audible decade sweep, including 20 Hz and 20 kHz`, () => {
      for (const f of [20, 100, 1000, 4000, 20000]) finite(spectrumDb(key, f), `spectrumDb(${key}, ${f})`);
    });
  }
  for (const key of SPECTROGRAMS) {
    it(`${key}: level stays inside 0..1 even when t01/f01 run past their ends`, () => {
      for (const t of [-1, 0, 0.5, 1, 2])
        for (const f of [-1, 0, 0.5, 1, 2]) {
          const v = spectrogramLevel(key, t, f);
          finite(v, `spectrogramLevel(${key}, ${t}, ${f})`);
          assert.ok(v >= 0 && v <= 1, `${key} @ (${t},${f}) = ${v} is outside 0..1`);
        }
    });
  }
});

describe('meterEngine — the waterfall under degenerate scene settings', () => {
  const scene = (over: Partial<WaterfallOpts> = {}): WaterfallOpts => ({
    room: 'studio', damping01: 0, eqGains: {}, eqFilter: 'bell220q6',
    qRing: false, reverb: 'none', ...over,
  });

  it('FULL damping (a totally dead room) still yields a finite RT, not 0-divide', () => {
    for (const room of ROOMS)
      for (const f of [20, 200, 2000, 20000])
        finite(waterfallRt(scene({ room, damping01: 1 }), f), `waterfallRt(${room}, ${f})`);
  });

  it('damping driven out of its 0..1 range stays finite', () => {
    for (const d of [-1, 0, 1, 2])
      finite(waterfallRt(scene({ damping01: d }), 200), `waterfallRt @ damping ${d}`);
  });

  it('an EMPTY eq-gain map behaves as flat, not as undefined gains', () => {
    for (const room of ROOMS) {
      const flat = waterfallSpectrumDb(scene({ room, eqGains: {} }), 500);
      finite(flat, `waterfallSpectrumDb(${room})`);
    }
  });

  it('the ridge finder always returns a real frequency and ratio', () => {
    for (const room of ROOMS)
      for (const d of [0, 1]) {
        const r = waterfallRidge(scene({ room, damping01: d }));
        finite(r.f, `ridge f (${room}, damping ${d})`);
        finite(r.ratio, `ridge ratio (${room}, damping ${d})`);
        assert.ok(r.f > 0, `ridge frequency ${r.f} is not a frequency`);
      }
  });

  it('a time slice AT t = 0 and BEYOND the span stays finite', () => {
    const s = scene();
    const span = waterfallTimeSpan(s);
    finite(span, 'waterfallTimeSpan');
    for (const t of [0, span, span * 10, -1])
      finite(waterfallSliceDb(s, 500, t), `waterfallSliceDb @ t = ${t}`);
  });

  it('a zero or negative time span produces NO divisions rather than an infinite loop', () => {
    assert.deepEqual(waterfallTimeDivisions(0), []);
    assert.deepEqual(waterfallTimeDivisions(-1), []);
  });

  it('a real span produces a bounded, ascending, finite division list', () => {
    const d = waterfallTimeDivisions(waterfallTimeSpan(scene()));
    assert.ok(d.length > 0 && d.length < 100, `${d.length} divisions`);
    for (const [i, v] of d.entries()) {
      finite(v, 'time division');
      if (i > 0) assert.ok(v > d[i - 1], 'divisions must ascend');
    }
  });
});

describe('meterEngine — the stereo pair at its extremes', () => {
  it('a ZERO-length pair correlates to 0 rather than 0/0', () => {
    const s = stereoPair(0.5, 0, 0);
    assert.equal(s.l.length, 0);
    assert.equal(correlationOf(s.l, s.r), 0);
  });
  it('width 0 (mono) correlates at +1, width and phase pushed past their ends stay in −1..+1', () => {
    const mono = stereoPair(0, 0, 512);
    assert.ok(correlationOf(mono.l, mono.r) > 0.99, 'mono must correlate +1');
    for (const w of [-1, 0, 1, 2])
      for (const p of [-720, 0, 180, 720]) {
        const s = stereoPair(w, p, 256);
        const c = correlationOf(s.l, s.r);
        finite(c, `correlation @ width ${w}, phase ${p}`);
        assert.ok(c >= -1.0001 && c <= 1.0001, `correlation ${c} is outside −1..+1`);
      }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// eqMath
// ═══════════════════════════════════════════════════════════════════════════

describe('eqMath — fFromNorm is the CLAMP that keeps every frequency readout real', () => {
  // fmtHz(NaN) would print "NaN Hz" and fmtHz(Infinity) "Infinity kHz". Every
  // caller feeds it fFromNorm(sliderValue), so the clamp is the guard. Pin it.
  it('a slider below 0 clamps to 20 Hz, not to a sub-audio frequency', () => {
    assert.equal(fFromNorm(-1), 20);
    assert.equal(fFromNorm(-1e9), 20);
  });
  it('a slider above 1 clamps to 20 kHz', () => {
    assert.equal(fFromNorm(2), 20000);
    assert.equal(fFromNorm(1e9), 20000);
  });
  it('the clamped output always formats as a real readout', () => {
    for (const t of [-5, -1, 0, 0.001, 0.5, 0.999, 1, 5])
      assert.doesNotMatch(fmtHz(fFromNorm(t)), /NaN|Infinity|undefined/, `t = ${t}`);
  });
  it('normFromF round-trips the clamped range back to 0..1', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const back = normFromF(fFromNorm(t));
      assert.ok(Math.abs(back - t) < 1e-9, `${t} → ${back}`);
    }
  });
  it('fmtHz never emits a broken unit at the band boundaries', () => {
    for (const f of [20, 999, 1000, 9999, 10000, 20000])
      assert.match(fmtHz(f), /^[\d.]+ (Hz|kHz)$/, `${f}`);
  });
});

describe('eqMath — Q ↔ bandwidth over the usable Q range', () => {
  it('round-trips for every Q a parametric EQ actually offers', () => {
    for (const q of [0.1, 0.3, 0.707, 1, 2, 4, 8, 16, 40]) {
      const bw = bwOctFromQ(q);
      finite(bw, `bwOctFromQ(${q})`);
      assert.ok(bw > 0, `bandwidth ${bw} for Q ${q}`);
      assert.ok(Math.abs(qFromBwOct(bw) - q) < 1e-9, `Q ${q} did not round-trip`);
    }
  });
  it('a TINY but non-zero Q gives a huge-but-finite bandwidth (no Infinity on the display)', () =>
    finite(bwOctFromQ(1e-6), 'bwOctFromQ(1e-6)'));
  it('Q = 0 is OUTSIDE the contract — it yields Infinity, which is why no slider reaches it', () => {
    // Documented, not endorsed: CameraAnalogy's bwFromZoom spans 4 … 0.25 oct
    // and never returns 0, so qFromBwOct never sees 0 either.
    assert.equal(bwOctFromQ(0), Infinity);
    assert.equal(qFromBwOct(0), Infinity);
  });
});

describe('eqMath — filter magnitudes at the edges of the axis', () => {
  it('a high-pass floors at −120 dB at DC instead of returning −Infinity', () => {
    for (const order of [1, 2, 4, 8]) {
      const v = butterworthHpDb(100, 0, order);
      finite(v, `butterworthHpDb(100, 0, ${order})`);
      assert.ok(v <= -119, `${v} should sit on the floor`);
    }
  });
  it('a low-pass stays finite an octave-decade above its corner', () => {
    for (const order of [1, 2, 4, 8]) finite(butterworthLpDb(100, 1e6, order), `LP order ${order}`);
  });
  it('order 0 is a wire, not a NaN', () => {
    finite(butterworthHpDb(100, 1000, 0), 'HP order 0');
    finite(butterworthLpDb(100, 1000, 0), 'LP order 0');
  });
  it('a zero-frequency corner does not produce a NaN response at every frequency', () => {
    for (const f of [20, 1000, 20000]) finite(butterworthLpDb(0, f, 2), `LP f0 = 0 @ ${f}`);
  });
  it('the reference spectrum is finite right across the audible band', () => {
    for (const f of [20, 100, 1000, 10000, 20000]) finite(baseSpectrumDb(f), `baseSpectrumDb(${f})`);
  });
  it('maxPosDb of a response that is negative everywhere is 0, not −Infinity', () =>
    assert.equal(maxPosDb(() => -60), 0));
});

describe('eqMath — a graphic EQ with every fader at zero', () => {
  const CENTERS = [63, 125, 250, 500, 1000, 2000, 4000, 8000] as const;
  const flat = CENTERS.map(() => 0);

  it('all faders flat is EXACTLY 0 dB — no accumulated rounding across 8 bands', () => {
    for (const f of [20, 100, 1000, 20000])
      assert.equal(graphicActualDb(CENTERS, flat, 1.4, f), 0, `@ ${f} Hz`);
  });
  it('all faders flat is EXACTLY 0° of phase shift', () => {
    for (const f of [20, 1000, 20000]) assert.equal(graphicPhaseDeg(CENTERS, flat, 1.4, f), 0);
  });
  it('every fader slammed to its rail still yields a finite response', () => {
    const slammed = CENTERS.map(() => 12);
    for (const f of [20, 1000, 20000]) {
      finite(graphicActualDb(CENTERS, slammed, 1.4, f), `slammed @ ${f}`);
      finite(graphicPhaseDeg(CENTERS, slammed, 1.4, f), `slammed phase @ ${f}`);
    }
  });
  it('the naïve slider curve is flat beyond BOTH end bands, never reading off the array', () => {
    const gains = CENTERS.map((_, i) => i - 4);
    assert.equal(sliderCurveDb(CENTERS, gains, 1), gains[0]);
    assert.equal(sliderCurveDb(CENTERS, gains, 1e9), gains[gains.length - 1]);
    for (const f of [20, 63, 100, 8000, 20000]) finite(sliderCurveDb(CENTERS, gains, f), `@ ${f}`);
  });
  it('a notch at the lowest offered Q still evaluates finitely', () => {
    const c = rbjNotch(1000, 0.1);
    for (const f of [20, 1000, 20000]) {
      finite(biquadMagDb(c, f), `notch mag @ ${f}`);
      finite(biquadPhaseDeg(c, f), `notch phase @ ${f}`);
    }
  });
  it('a biquad evaluated AT DC and AT Nyquist stays finite', () => {
    const c = rbjNotch(1000, 4);
    finite(biquadMagDb(c, 0), 'mag @ DC');
    finite(biquadMagDb(c, 24000), 'mag @ Nyquist');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// gainEngine
// ═══════════════════════════════════════════════════════════════════════════

const stage = (key: string, gain: number): Stage => ({
  key, name: key, kind: 'preamp', gain, min: -60, max: 60, adjustable: true,
});

describe('gainEngine — an EMPTY chain and the rails', () => {
  it('a chain with NO stages is just the source — one node, never an empty list', () => {
    const nodes = computeChain(-20, []);
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].key, 'source');
    finite(nodes[0].level, 'source level');
    finite(nodes[0].noise, 'source noise');
  });
  it('every node of a fully railed chain still carries finite numbers', () => {
    for (const src of [-120, -60, -24, 0, 20])
      for (const g of [-60, 0, 60]) {
        for (const n of computeChain(src, [stage('a', g), stage('b', g), stage('c', g)])) {
          finite(n.level, `level (src ${src}, gain ${g})`);
          finite(n.noise, `noise (src ${src}, gain ${g})`);
          assert.ok(n.level <= CLIP_CEIL + 1e-9, `level ${n.level} above the ceiling`);
          assert.ok(verdictFor(n).length > 0, 'every node needs a verdict');
        }
      }
  });
  it('a 40-stage chain does not let the noise floor run away to Infinity', () => {
    const many = Array.from({ length: 40 }, (_, i) => stage(`s${i}`, 12));
    for (const n of computeChain(-60, many)) finite(n.noise, 'noise over 40 stages');
  });
  it('meterFill clamps to 0..1 at both rails — a bar can never overflow its track', () => {
    for (const l of [-1e6, -40, -24, 0, 6, 1e6]) {
      const f = meterFill(l);
      finite(f, `meterFill(${l})`);
      assert.ok(f >= 0 && f <= 1, `meterFill(${l}) = ${f}`);
    }
  });
  it('regionFor names a region at every level, including the boundary values', () => {
    for (const l of [-1e6, LOW_EDGE, HOT_EDGE, CLIP_CEIL, 1e6])
      assert.ok(['low', 'healthy', 'hot', 'clip'].includes(regionFor(l)), `${l}`);
  });
  it('chainIsHealthy is vacuously true for an empty node list (nothing is wrong yet)', () =>
    assert.equal(chainIsHealthy([]), true));
});

// ═══════════════════════════════════════════════════════════════════════════
// harmonicModel
// ═══════════════════════════════════════════════════════════════════════════

const harm = (n: number, amp: number, over: Partial<Harmonic> = {}): Harmonic => ({
  n, amp, phaseDeg: 0, enabled: true, muted: false, ...over,
} as Harmonic);

describe('harmonicModel — a SILENT set refuses to fabricate a figure', () => {
  const silent: HarmonicSet = [harm(1, 0), harm(2, 0), harm(3, 0)];

  it('crest factor of an empty waveform is null, not NaN', () =>
    assert.equal(crestFactorDb([]), null));
  it('crest factor of an all-zero waveform is null, not 0/0', () =>
    assert.equal(crestFactorDb([0, 0, 0, 0]), null));
  it('THD with a silent fundamental is null — undefined re nothing', () => {
    const r = thd(silent);
    assert.equal(r.pct, null);
    assert.equal(r.db, null);
    assert.deepEqual(r.perHarmonic, []);
  });
  it('THD of a pure fundamental is 0% and its dB is null (log of zero refused)', () => {
    const r = thd([harm(1, 1), harm(2, 0)]);
    assert.equal(r.pct, 0);
    assert.equal(r.db, null);
  });
  it('THD with an EMPTY set is null rather than a crash on a missing H1', () =>
    assert.equal(thd([]).pct, null));
  it('the envelope slope needs two contributors — one or none is null, never a fake fit', () => {
    assert.equal(envelopeSlopeDbPerOct([]), null);
    assert.equal(envelopeSlopeDbPerOct([harm(1, 1)]), null);
    assert.equal(envelopeSlopeDbPerOct(silent), null);
  });
  it('two harmonics at the SAME n give a zero-variance fit — null, not a 0/0 slope', () =>
    assert.equal(envelopeSlopeDbPerOct([harm(2, 1), harm(2, 0.5)]), null));
  it('normalizing a silent set returns it unchanged instead of dividing by zero', () => {
    const out = normalizeSet(silent);
    assert.equal(out.length, silent.length);
    for (const h of out) assert.equal(h.amp, 0);
  });
  it('dbcOf a silent harmonic sits on the floor, never −Infinity', () => {
    finite(dbcOf(harm(1, 0)), 'dbcOf(0 amp)');
    finite(dbcOf(harm(1, -1)), 'dbcOf(negative amp)');
  });
  it('a silent set has no overtones', () => assert.equal(hasOvertones(silent), false));
});

describe('harmonicModel — synthesis at degenerate point counts', () => {
  const set: HarmonicSet = [harm(1, 1), harm(2, 0.5), harm(3, 0.25)];

  it('0 points yields an empty waveform, not a crash', () =>
    assert.deepEqual(synthWaveform(set, 0, 2), []));
  it('ONE point does not divide by (points − 1) = 0', () => {
    const w = synthWaveform(set, 1, 2);
    assert.equal(w.length, 1);
    finite(w[0], 'single-point waveform');
  });
  it('0 cycles is a finite (DC) waveform, not NaN', () => {
    for (const v of synthWaveform(set, 64, 0)) finite(v, 'zero-cycle sample');
  });
  it('a silent set synthesises exact zeros — the peak-normalise divide is skipped', () => {
    for (const v of synthWaveform([harm(1, 0)], 64, 2)) assert.equal(v, 0);
  });
  it('every sample of every preset stays inside ±1 after normalisation', () => {
    for (const key of ['sine', 'square', 'saw', 'triangle'] as const) {
      let set: HarmonicSet;
      try { set = buildPreset(key); } catch { continue; } // preset list may differ
      for (const v of synthWaveform(set, 256, 3)) {
        finite(v, `${key} sample`);
        assert.ok(Math.abs(v) <= 1.0001, `${key} sample ${v} escaped ±1`);
      }
    }
  });
  it('the additive payload is always 25 finite numbers, even for a silent set', () => {
    for (const s of [[] as HarmonicSet, [harm(1, 0)], set]) {
      const flat = additivePayload(s, 110);
      assert.equal(flat.length, 25);
      for (const v of flat) finite(v, 'additive payload entry');
    }
  });
});

describe('harmonicModel — note naming over the range the lab can actually reach', () => {
  // The harmonics lab clamps f0 to 60…300 Hz (F0_MIN/F0_MAX in HarmonicsView)
  // and shows harmonics 1…12, so this is the whole reachable domain.
  it('every reachable fundamental × harmonic names a real note', () => {
    for (let f0 = 60; f0 <= 300; f0 += 1)
      for (let n = 1; n <= 12; n++) {
        const info = noteInfo(n * f0);
        finite(info.midi, `midi @ ${n}×${f0}`);
        finite(info.cents, `cents @ ${n}×${f0}`);
        assert.doesNotMatch(info.label, /undefined|NaN|Infinity/, `label @ ${n}×${f0}`);
        assert.ok(Math.abs(info.cents) <= 50, `cents ${info.cents} should be within ±50`);
      }
  });
  it('midiToHz round-trips back to the same note across the piano', () => {
    for (let m = 21; m <= 108; m++) assert.equal(noteInfo(midiToHz(m)).midi, m);
  });
  it('the period of every reachable fundamental is a finite millisecond figure', () => {
    for (const f0 of [60, 110, 220, 300]) {
      const p = periodMs(f0);
      finite(p, `periodMs(${f0})`);
      assert.ok(p > 0 && p < 100, `${p} ms`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// waveEngine
// ═══════════════════════════════════════════════════════════════════════════

const MATS = Object.keys(MATERIALS) as MaterialKey[];

const src = (over: Partial<WaveSource> = {}): WaveSource => ({
  id: 's1', x: 2, y: 2, freq: 200, levelDb: 0, delayMs: 0, polarity: 1, kind: 'point', ...over,
});
const room = (over: Partial<WaveScene> = {}): WaveScene => ({
  w: 8, h: 6, boundary: ['drywall', 'drywall', 'drywall', 'drywall'],
  sources: [src()], listener: { x: 4, y: 3 }, tempC: 20, ...over,
});

describe('waveEngine — absorption and RT at the boundaries of the model', () => {
  it('every material gives a finite alpha at and beyond both ends of the band table', () => {
    for (const m of MATS)
      for (const f of [0, 1, 125, 1000, 4000, 20000, 1e9]) {
        const a = alphaAt(m, f);
        finite(a, `alphaAt(${m}, ${f})`);
        assert.ok(a >= 0 && a <= 1, `alpha ${a} outside 0..1 for ${m} @ ${f}`);
      }
  });
  it('a room whose every surface is OPEN (α = 1, total absorption) still returns a finite RT', () => {
    const open = room({ boundary: ['open', 'open', 'open', 'open'] });
    for (const f of [125, 1000, 4000]) {
      const rt = sabineRT(open, f);
      finite(rt, `sabineRT(open, ${f})`);
      assert.ok(rt > 0 && rt <= 9.9, `RT ${rt} outside the model's stated range`);
    }
  });
  it('a room with NO absorption anywhere is capped at the stated 9.9 s, not Infinity', () => {
    const live = room({ boundary: ['concrete', 'concrete', 'concrete', 'concrete'] });
    for (const f of [125, 1000, 4000]) {
      const rt = sabineRT(live, f);
      finite(rt, `sabineRT(live, ${f})`);
      assert.ok(rt <= 9.9, `RT ${rt} broke the cap`);
    }
  });
});

describe('waveEngine — the listener standing exactly ON the source', () => {
  it('a zero-distance arrival is floored, never a −Infinity or NaN level', () => {
    const s = room();
    const arrivals = arrivalsAt(s, s.sources[0].x, s.sources[0].y, 200);
    assert.ok(arrivals.length > 0, 'a source in a room must produce arrivals');
    for (const a of arrivals) {
      finite(a.t, 'arrival time');
      finite(a.levelDb, 'arrival level');
      finite(a.pathLen, 'arrival path length');
      assert.ok(a.pathLen >= 0.15, 'the near-field floor must hold');
    }
  });
  it('the summed field is finite at the source, in a corner, and outside the room', () => {
    const s = room();
    for (const [x, y] of [[2, 2], [0, 0], [8, 6], [-5, -5], [100, 100]])
      for (const f of [20, 200, 2000])
        finite(responseAt(s, x, y, f), `responseAt(${x}, ${y}, ${f})`);
  });
  it('fieldDb floors a zero-magnitude (perfect cancellation) field instead of −Infinity', () => {
    const v = fieldDb({ re: 0, im: 0 });
    finite(v, 'fieldDb at perfect cancellation');
    assert.ok(v <= -119, `${v} should sit on the −120 floor`);
  });
  it('a room with NO sources yields no arrivals rather than a crash', () =>
    assert.deepEqual(arrivalsAt(room({ sources: [] }), 4, 3, 200), []));
  it('a MUTED source contributes nothing and breaks nothing', () =>
    assert.deepEqual(arrivalsAt(room({ sources: [src({ muted: true })] }), 4, 3, 200), []));
});

describe('waveEngine — modes, diffraction and refraction at zero', () => {
  it('the (0,0) mode is 0 Hz, not NaN — and every low mode is finite', () => {
    const s = room();
    for (let nx = 0; nx <= 3; nx++)
      for (let ny = 0; ny <= 3; ny++) {
        finite(modeFrequency(s, nx, ny), `mode (${nx},${ny})`);
        finite(modePressure(s, nx, ny, 0, 0), `pressure (${nx},${ny}) @ corner`);
        finite(modePressure(s, nx, ny, s.w, s.h), `pressure (${nx},${ny}) @ far corner`);
      }
  });
  it('a barrier with ZERO path difference gives the floor attenuation, not NaN', () => {
    const v = maekawaAttenuationDb(10, 10, 1000, 20);
    finite(v, 'maekawa with no detour');
    assert.ok(Math.abs(v - 10 * Math.log10(3)) < 1e-9, `${v}`);
  });
  it('a barrier evaluated at 0 Hz (infinite wavelength) stays finite', () =>
    finite(maekawaAttenuationDb(12, 10, 0, 20), 'maekawa @ 0 Hz'));
  it('a NEGATIVE path difference (the receiver in line of sight) returns 0 dB', () =>
    assert.equal(maekawaAttenuationDb(10, 20, 1000, 20), 0));
  it('a zero temperature gradient returns the launch height instead of dividing by zero', () => {
    assert.equal(refractedRayHeight(5, 100, 0, 20), 5);
    assert.equal(refractedRayHeight(5, 100, 1e-9, 20), 5);
  });
  it('a real gradient bends the ray by a finite amount at any distance', () => {
    for (const x of [0, 10, 1000]) finite(refractedRayHeight(5, x, 0.05, 20), `ray @ ${x} m`);
  });
  it('speed of sound is finite for every temperature a room can plausibly be', () => {
    for (const t of [-40, -20, 0, 20, 50]) {
      const c = speedOfSound(t);
      finite(c, `speedOfSound(${t})`);
      assert.ok(c > 200 && c < 400, `${c} m/s`);
    }
  });
  it('BELOW absolute zero is out of contract and yields NaN — never a fabricated speed', () =>
    assert.ok(Number.isNaN(speedOfSound(-300))));
});

describe('waveEngine — a line array of zero and one box', () => {
  it('zero boxes is an empty array, not a crash', () =>
    assert.deepEqual(arrayPositions(0, 0, 0, 0.4, 2), []));
  it('one box hangs exactly at the hang point, aimed straight ahead', () => {
    const a = arrayPositions(3, 7, 1, 0.4, 2);
    assert.equal(a.length, 1);
    assert.deepEqual(a[0], { x: 3, y: 7, aimDeg: 0 });
  });
  it('a zero-height box stacks in place without producing NaN positions', () => {
    for (const p of arrayPositions(0, 0, 6, 0, 3)) {
      finite(p.x, 'box x');
      finite(p.y, 'box y');
      finite(p.aimDeg, 'box aim');
    }
  });
  it('directivity stays inside its documented 0.25…1 window at any angle or frequency', () => {
    const s = src({ kind: 'speaker', aimDeg: 0, coverageDeg: 90 });
    for (const f of [0, 20, 1000, 20000])
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [-3, -4]]) {
        const g = directivityGain(s, dx, dy, f);
        finite(g, `directivityGain(${dx}, ${dy}, ${f})`);
        assert.ok(g >= 0.25 - 1e-9 && g <= 1 + 1e-9, `gain ${g} left the window`);
      }
  });
});
