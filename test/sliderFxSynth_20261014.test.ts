/**
 * Slider pass Part 3 (owner 2026-10-14): every bottom-dock slider visibly does
 * something, progresses smoothly/evenly and never pauses. EQ · FX · synth ·
 * tools · Tuning. Pure mappings are tested from src/features/lab/sliderMaps.ts;
 * RN-only changes are pinned in source.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEESSER_GR_SCALE_DB,
  ECHO_SPAN_MS,
  EQ_GAIN_HOME,
  RESPONSE_SAMPLES,
  envLogMs,
  envToLog,
  echoSpacingFrac,
  eqGainFromLane,
  fmt2sig,
  fmtEnvMs,
  grDepthFrac,
  laneFromQ,
  qFromLane,
  qLaneMin,
  responseSampleFreqs,
  sineScopeCycles,
  snap2sig,
} from '../src/features/lab/sliderMaps.ts';

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8');

describe('S1 — signal generator scope cycles', () => {
  test('cycles rise continuously with FREQ (no 6-state staircase)', () => {
    let prev = -Infinity;
    const seen = new Set<string>();
    for (let i = 0; i <= 200; i++) {
      const hz = 20 * Math.pow(1000, i / 200);
      const c = sineScopeCycles(hz);
      assert.ok(c >= prev, `non-decreasing at ${hz.toFixed(1)} Hz`);
      if (hz > 20 && c < 12 * 1.2) assert.ok(c > prev, `strictly rising at ${hz.toFixed(1)} Hz`);
      prev = c;
      seen.add(c.toFixed(3));
    }
    assert.ok(seen.size > 100, `many visual states (${seen.size})`);
  });
  test('the screen uses it unrounded', () => {
    const src = read('screens/tools/SignalGenScreen.tsx');
    assert.match(src, /const cycles = sineScopeCycles\(freq\);/);
    assert.doesNotMatch(src, /Math\.round\(cyclesFor\(freq\)/);
  });
});

describe('S2 — envelope log-time lanes', () => {
  test('0.1 ms resolution below 10 ms; whole ms above', () => {
    assert.equal(envLogMs(0), 0);
    assert.equal(envLogMs(Math.log10(2.34)), 2.3);
    assert.equal(envLogMs(Math.log10(250.4)), 250);
  });
  test('round-trip below 10 ms holds the value (thumb no longer snaps to 0)', () => {
    for (const m of [1, 1.2, 2.5, 3.7, 5, 7.3, 9.9]) {
      const v = envToLog(m);
      assert.ok(v > 0, `${m} ms sits above the zero position`);
      assert.equal(envLogMs(v), m);
    }
    // a sub-1 ms value never reads as position 0 (which means 0 ms)
    assert.ok(envToLog(0.5) >= 0.02);
    assert.equal(envToLog(0), 0);
  });
  test('readouts show one decimal below 10 ms', () => {
    assert.equal(fmtEnvMs(2.3), '2.3 ms');
    assert.equal(fmtEnvMs(0), '0 ms');
    assert.equal(fmtEnvMs(40), '40 ms');
    assert.equal(fmtEnvMs(1500), '1.5 s');
  });
  test('the screen uses the shared mapping', () => {
    const src = read('screens/lab/envelope/EnvelopeLabScreen.tsx');
    assert.match(src, /const logMs = envLogMs;/);
    assert.match(src, /const toLog = envToLog;/);
  });
});

describe('S3 — modular CUTOFF fast path', () => {
  const src = read('screens/lab/ModularLabScreen.tsx');
  test('the CUTOFF lane sends one bridge call, not the whole patch', () => {
    assert.match(src, /onChange: \(v\) => setCutoff\(cutFromPos\(v\)\)/);
    const body = src.slice(src.indexOf('const setCutoff = useCallback('), src.indexOf('const setCutoff = useCallback(') + 600);
    assert.match(body, /ApeDsp\.modSet\(MOD_PARAM\.cutoff, hz\)/);
    assert.doesNotMatch(body, /pushPatch/);
    // no side effect inside the state updater
    assert.match(body, /setPatch\(\(prev\) => \(prev\.cutoff === hz \? prev : \{ \.\.\.prev, cutoff: hz \}\)\)/);
  });
  // Since the Eurorack case (2026-10-16) the VCF's FREQ knob turns with the
  // lane and the cutoff prints on the well's spectrum (labels never on a panel).
  test('the cutoff reads on the glass (FREQ knob) and on the spectrum', () => {
    assert.match(src, /case 'vcf\.freq':\s*return logPos\(p\.cutoff, 60, 14000\)/);
    assert.match(src, /\{fmtCut\(patch\.cutoff\)\}/);
  });
});

describe('S4 — harmonics live view keeps its history while F0 rides', () => {
  const src = read('screens/lab/HarmonicsView.tsx');
  test('lane ticks do not clear; release clears once', () => {
    assert.match(src, /onChange: \(v\) => pickF0\(f0FromPos\(v\), false\)/);
    assert.match(src, /onCommit: \(v\) => \{[\s\S]{0,120}historyF0Ref\.current[\s\S]{0,80}setHistory\(\[\]\)/);
  });
});

describe('S5 — harmonic stems phase slider batches per frame', () => {
  const src = read('screens/lab/HarmonicStems.tsx');
  test('moves go through queuePhase (rAF + unchanged-value skip), release flushes', () => {
    assert.match(src, /const queuePhase = \(n: number, deg: number\) =>/);
    assert.match(src, /if \(last && last\.n === n && last\.deg === deg\) return;/);
    assert.match(src, /requestAnimationFrame\(/);
    assert.match(src, /onPanResponderRelease: \(\) => flushPhase\(\)/);
    const pan = src.slice(src.indexOf('const phasePan'));
    assert.doesNotMatch(pan.slice(0, pan.indexOf('const detail:')), /setPhase\(n, Math\.round/);
  });
});

describe('E1 — delay echo spacing grows with TIME', () => {
  test('fixed window; spacing strictly grows across 80–500 ms', () => {
    assert.equal(ECHO_SPAN_MS, 3250);
    let prev = 0;
    for (let t = 80; t <= 500; t += 10) {
      const s = echoSpacingFrac(t);
      assert.ok(s > prev, `${t} ms`);
      prev = s;
    }
    assert.ok(echoSpacingFrac(500) / echoSpacingFrac(80) > 6);
  });
  test('both pictures use the fixed window', () => {
    assert.match(read('screens/lab/fxAnim.tsx'), /return echoSpacingFrac\(timeMs\) \* outSpan;/);
    const viz = read('features/lab/fxViz.tsx');
    assert.match(viz, /const spanMs = ECHO_SPAN_MS;/);
    assert.doesNotMatch(viz, /Math\.max\(timeMs \* 6\.5, 500\)/);
  });
});

describe('E2 — FREQ/Q visible at 0 dB gain', () => {
  for (const f of ['FixSignal', 'FindFrequency', 'MatchCurve']) {
    test(`${f} draws the band marker`, () => {
      const src = read(`screens/lab/eq/modules/${f}.tsx`);
      assert.match(src, /band=\{\{ f: (band|sel)\.f, q: (band|sel)\.q \}\}/);
    });
  }
  test('the graph draws the marker line + bandwidth', () => {
    const viz = read('features/lab/fxViz.tsx');
    assert.match(viz, /band\?: \{ f: number; q\?: number; color\?: string \}/);
    assert.match(viz, /bandwidthOctFromQ\(band\.q\)/);
  });
});

describe('E3 — MultiBand faders on an OFF band are locked', () => {
  test('freq, gain and q carry the OFF lock', () => {
    const src = read('screens/lab/eq/modules/MultiBand.tsx');
    assert.match(src, /const offLock = selOn \? undefined : 'This band is OFF — switch it on in BAND';/);
    assert.equal((src.match(/locked: offLock,/g) ?? []).length, 3);
  });
});

describe('E4 — LiveSpectrumEq band faders leave SPECTRUM ONLY', () => {
  test('riding a band fader shows the curve', () => {
    assert.match(read('screens/lab/eq/modules/LiveSpectrumEq.tsx'), /if \(mode === 'spectrum'\) setMode\('combined'\);/);
  });
});

describe('E5 — response curves sample densely and hit band centres', () => {
  test('384 points + exact focus frequencies, sorted', () => {
    assert.equal(RESPONSE_SAMPLES, 384);
    const fs = responseSampleFreqs(RESPONSE_SAMPLES, [1234.5]);
    assert.equal(fs.length, RESPONSE_SAMPLES + 2);
    assert.ok(fs.includes(1234.5));
    for (let i = 1; i < fs.length; i++) assert.ok(fs[i] >= fs[i - 1]);
    assert.ok(Math.abs(fs[0] - 20) < 1e-9 && Math.abs(fs[fs.length - 1] - 20000) < 1e-6);
  });
  test('graph + live spectrum + filter shapes use it', () => {
    assert.match(read('features/lab/fxViz.tsx'), /samples = RESPONSE_SAMPLES,/);
    assert.match(read('screens/lab/eq/modules/LiveSpectrumEq.tsx'), /const PTS = RESPONSE_SAMPLES;/);
    assert.match(read('screens/lab/eq/modules/FilterShapes.tsx'), /focusHz=\{\[freq\]\}/);
  });
});

describe('E6 — RT60 / CENTER snaps keep two significant figures', () => {
  test('≥ 2 significant figures across both lanes', () => {
    for (let v = 0.4; v <= 6; v += 0.013) {
      const s = snap2sig(v);
      assert.ok(Math.abs(s - v) / v <= 0.0125 + 1e-9 || Math.abs(s - v) <= 0.05 + 1e-9, `${v}`);
      const digits = fmt2sig(s).replace('.', '').replace(/^0+/, '');
      assert.ok(digits.length >= 2, `${fmt2sig(s)} keeps 2 s.f.`);
    }
    assert.equal(snap2sig(0.437), 0.44);
    assert.equal(snap2sig(1.46), 1.5);
    assert.equal(fmt2sig(0.4), '0.40');
  });
  test('both faders use it', () => {
    const src = read('screens/lab/fxLabConfigs.tsx');
    assert.equal((src.match(/snap: snap2sig/g) ?? []).length, 2);
  });
});

describe('E7 — notch Q lane covers 1–12', () => {
  test('notch lane spans exactly 1 → 12, with no dead zone', () => {
    const lo = qLaneMin(true);
    assert.equal(lo, 1);
    assert.equal(qFromLane(0, lo), 1);
    assert.ok(Math.abs(qFromLane(1, lo) - 12) < 1e-9);
    assert.ok(qFromLane(0.1, lo) > 1, 'the bottom of the lane already moves Q');
    for (const q of [1, 2, 5, 12]) assert.ok(Math.abs(qFromLane(laneFromQ(q, lo), lo) - q) < 1e-9);
    assert.equal(qLaneMin(false), 0.3);
  });
  test('FilterShapes maps the lane by shape', () => {
    const src = read('screens/lab/eq/modules/FilterShapes.tsx');
    assert.match(src, /const qMin = qLaneMin\(shape === 'notch'\);/);
    assert.match(src, /onChange: \(t\) => setQ\(qFromLane\(t, qMin\)\)/);
  });
});

describe('E8 — de-esser GR bars on a fixed 24 dB scale', () => {
  test('scale is fixed — Range never changes a bar', () => {
    assert.equal(DEESSER_GR_SCALE_DB, 24);
    assert.equal(grDepthFrac(6), 0.25);
    assert.equal(grDepthFrac(24), 1);
    assert.equal(grDepthFrac(40), 1);
  });
  test('Range is the dashed cap line carrying the −Range label', () => {
    const src = read('screens/lab/deesser/deEsserViz.tsx');
    assert.match(src, /const yB = \(gr: number\) => topB \+ grDepthFrac\(Math\.min\(rangeDb, gr\)\)/);
    assert.match(src, /y1=\{capY\}[^>]*strokeDasharray/);
    assert.doesNotMatch(src, /Math\.max\(1, rangeDb\)/);
  });
});

describe('E9 — de-esser Band width shows its Q', () => {
  test('readout = Q value · words', () => {
    assert.match(read('screens/lab/deesser/DeEsserLabScreen.tsx'), /format=\{\(v\) => `Q \$\{v\.toFixed\(1\)\} · \$\{v < 1\.2 \? 'wide'/);
  });
});

describe('E10 — EQ GAIN lanes home at 0 dB', () => {
  test('the lane centre is 0 dB on every symmetric range', () => {
    assert.equal(EQ_GAIN_HOME, 0.5);
    for (const r of [15, 18, 24]) assert.equal(eqGainFromLane(EQ_GAIN_HOME, r), 0);
  });
  for (const f of ['ParametricControls', 'FilterShapes', 'LiveSpectrumEq', 'FixSignal', 'FindFrequency', 'MatchCurve', 'MultiBand']) {
    test(`${f} GAIN has home 0.5`, () => {
      assert.match(read(`screens/lab/eq/modules/${f}.tsx`), /home: 0\.5,/);
    });
  }
});

describe('T1/T2 — tuning fine-tune meter rides the stage', () => {
  const cases: [string, number][] = [
    ['ch4Harmonics', 25],
    ['ch9Meantone', 35],
    ['ch13Apply', 45],
  ];
  for (const [ch, range] of cases) {
    test(`${ch}: DeviationMeter on the stage, range ±${range} ¢`, () => {
      const src = read(`screens/lab/tuning/chapters/${ch}.tsx`);
      assert.match(src, /aspect=\{LADDER_METER_ASPECT\}/);
      const re = new RegExp(`<DeviationMeter fit bare cents=\\{[^}]+\\} rangeCents=\\{${range}\\}`);
      assert.match(src, re);
      assert.equal((src.match(/<DeviationMeter /g) ?? []).length, 1, 'one meter — on the glass, not also in the well');
    });
  }
  test('T2 ranges cover the lanes (ch9 reaches +33.7 ¢, ch13 +43.7 ¢)', () => {
    const just = 1200 * Math.log2(5 / 4);
    const ch9Max = 4 * 705 - 2400 - just;
    const ch13Max = 430 - just;
    assert.ok(ch9Max < 35 && ch9Max > 33);
    assert.ok(ch13Max < 45 && ch13Max > 43);
  });
});
