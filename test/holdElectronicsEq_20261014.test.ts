/**
 * Slider audit HOLD items, electronics + EQ (owner approved the defaults,
 * 2026-10-14): #9 Amp class C TUNE log lane · #10 Tube GRID V cutoff wording ·
 * #13 De-esser Range 0–8 dB · #14 Live Spectrum EQ gain ±8 dB · #27 FX EQ
 * bell drawn on the display · #29 Camera Analogy field-of-view wedge restored.
 * Pure maps are tested directly; RN-only wiring is pinned in source.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { laneFromValue, valueFromLane } from '../src/screens/lab/amp/ampLaneMap.ts';
import { CUTOFF_WORDS, GRID_CUTOFF, gridState, gridWord, plateCurrentFrac } from '../src/screens/lab/tube/gridModel.ts';
import { EQ_CURVE_RANGE_DB, eqCurvePoints, eqCurveX, eqCurveY } from '../src/screens/lab/fxEqCurve.ts';
import { DEFAULTS, PHRASE, processPhrase } from '../src/features/deesser/deEsserModel.ts';

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8');

describe('#9 — Amp class C TUNE rides a log lane', () => {
  test('endpoints unchanged, 1.00× at the exact centre', () => {
    assert.equal(laneFromValue(0.5, 0.5, 2, 'log'), 0);
    assert.equal(laneFromValue(2, 0.5, 2, 'log'), 1);
    assert.ok(Math.abs(laneFromValue(1, 0.5, 2, 'log') - 0.5) < 1e-12);
    assert.ok(Math.abs(valueFromLane(0, 0.5, 2, 'log') - 0.5) < 1e-12);
    assert.ok(Math.abs(valueFromLane(1, 0.5, 2, 'log') - 2) < 1e-12);
  });
  test('equal slides are equal ratios, and the lane round-trips', () => {
    const r1 = valueFromLane(0.3, 0.5, 2, 'log') / valueFromLane(0.2, 0.5, 2, 'log');
    const r2 = valueFromLane(0.8, 0.5, 2, 'log') / valueFromLane(0.7, 0.5, 2, 'log');
    assert.ok(Math.abs(r1 - r2) < 1e-12);
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      assert.ok(Math.abs(laneFromValue(valueFromLane(t, 0.5, 2, 'log'), 0.5, 2, 'log') - t) < 1e-9);
    }
  });
  test('linear stays the default', () => {
    assert.equal(laneFromValue(1.25, 0.5, 2), 0.5);
    assert.equal(valueFromLane(0.5, 0.5, 2), 1.25);
  });
  test('wired: faderParam uses the map; TUNE asks for log; readout unchanged', () => {
    const rack = read('screens/lab/amp/AmpRack.tsx');
    assert.match(rack, /value: laneFromValue\(o\.value, o\.min, o\.max, o\.scale\)/);
    assert.match(rack, /const raw = valueFromLane\(t, o\.min, o\.max, o\.scale\);/);
    assert.match(rack, /home: o\.home != null \? laneFromValue\(o\.home, o\.min, o\.max, o\.scale\)/);
    const m4 = read('screens/lab/amp/modules/mod4Classes.tsx');
    assert.match(m4, /id: 'tune',[\s\S]{0,200}min: 0\.5,\s*max: 2,[\s\S]{0,300}scale: 'log',/);
    assert.match(m4, /format: \(v\) => `\$\{v\.toFixed\(2\)\}× \$\{Math\.abs\(v - 1\) < 0\.03 \? '· TUNED' : '· mistuned'\}`/);
  });
});

describe('#10 — Tube GRID V at cutoff: "cut off — no current flows"', () => {
  test('the words, and zero plate current at and below cutoff', () => {
    assert.equal(CUTOFF_WORDS, 'cut off — no current flows');
    for (const x of [0, 0.05, 0.1, GRID_CUTOFF]) {
      assert.equal(gridWord(x), 'cut off — no current flows');
      assert.equal(plateCurrentFrac(x), 0);
      assert.equal(gridState(x), 'CUT OFF');
    }
    assert.equal(gridWord(0.5), 'partly negative');
    assert.equal(gridWord(0.95), 'barely negative — full flow');
  });
  test('plate current: continuous from 0 at cutoff, rising, 1 at the top (3/2 law)', () => {
    let prev = 0;
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      const I = plateCurrentFrac(x);
      assert.ok(I >= prev - 1e-12, `not monotonic at ${x}`);
      prev = I;
    }
    assert.ok(plateCurrentFrac(GRID_CUTOFF + 0.01) < 0.01);
    assert.equal(plateCurrentFrac(1), 1);
    const u = 0.5;
    assert.ok(Math.abs(plateCurrentFrac(GRID_CUTOFF + u * (1 - GRID_CUTOFF)) - Math.pow(u, 1.5)) < 1e-12);
  });
  test('wired: lane %, bezel PLATE I and the electrons all use the model', () => {
    const tube = read('screens/lab/tube/VacuumTubeLabScreen.tsx');
    assert.match(tube, /const word = gridWord;/);
    assert.match(tube, /const plateI = plateCurrentFrac\(v\);/);
    assert.match(tube, /\{ k: 'PLATE I', v: pct\(plateI\)/);
    assert.match(tube, /flow=\{plateI\}/);
    assert.doesNotMatch(tube, /very negative — cutoff/);
    const viz = read('screens/lab/tube/viz.tsx');
    assert.match(viz, /const passFrac = flow \?\? cond;/);
    assert.match(viz, /const passes = hashW\(i \* 7\.7\) < passFrac;/);
  });
});

describe('#13 — De-esser Range is 0–8 dB', () => {
  test('at the default threshold the gain computer never asks for more than 8 dB', () => {
    const wide = processPhrase(PHRASE, { ...DEFAULTS, rangeDb: 24 });
    const peak = Math.max(...wide.map((p) => p.grDb));
    assert.ok(peak <= 8 && peak > 6, `peak ${peak}`);
    // So a range of 8 gives the same result as the model's default 12.
    const at8 = processPhrase(PHRASE, { ...DEFAULTS, rangeDb: 8 });
    const at12 = processPhrase(PHRASE, { ...DEFAULTS, rangeDb: 12 });
    at8.forEach((p, i) => assert.equal(p.grDb, at12[i].grDb));
  });
  test('wired: the slider tops out at 8 dB and the lab rack starts inside it', () => {
    const src = read('screens/lab/deesser/DeEsserLabScreen.tsx');
    assert.match(src, /const RANGE_MAX_DB = 8;/);
    assert.match(src, /label="Range \(maximum reduction\)" value=\{s\.rangeDb\} min=\{0\} max=\{RANGE_MAX_DB\}/);
    assert.match(src, /const LAB_DEFAULTS: Settings = \{ \.\.\.DEFAULTS, rangeDb: Math\.min\(DEFAULTS\.rangeDb, RANGE_MAX_DB\) \};/);
    assert.match(src, /useState\(\(\) => \{ rack = \{ \.\.\.LAB_DEFAULTS \}; return true; \}\);/);
    assert.doesNotMatch(src, /max=\{24\}/);
  });
});

describe('#14 — Live Spectrum EQ gain is ±8 dB and every step draws', () => {
  const src = read('screens/lab/eq/modules/LiveSpectrumEq.tsx');
  test('the lane spans ±8 dB and the curve clamp uses the same constant', () => {
    assert.match(src, /const BELL_GAIN_MAX_DB = 8;/);
    assert.match(src, /value: \(bellG \+ BELL_GAIN_MAX_DB\) \/ \(2 \* BELL_GAIN_MAX_DB\),/);
    assert.match(src, /yForDb\(Math\.min\(BELL_GAIN_MAX_DB, eqAt\(f\)\)\)/);
    assert.match(src, /tint: gainColor\(bellG, BELL_GAIN_MAX_DB\)/);
    assert.doesNotMatch(src, /\(bellG \+ 18\) \/ 36/);
    assert.match(src, /const zeroY = zeroLineY\(floorY, ts\);/);
  });
  test('the zero line leaves room for +8 dB at every glass height', () => {
    // Mirror of zeroLineY + yForDb (FLOOR_DB −90, ZERO_Y 16, 2-unit top margin).
    assert.match(src, /const fit = \(BELL_GAIN_MAX_DB \* floorY - FLOOR_DB \* 2 \* ts\) \/ \(BELL_GAIN_MAX_DB - FLOOR_DB\);/);
    for (const chartH of [60, 120, 200, 320, 600, 900]) {
      for (const ts of [1, 2]) {
        const floorY = chartH - 8 * ts;
        const zeroY = Math.max(16 * ts, (8 * floorY + 90 * 2 * ts) / 98);
        const pxPerDb = (floorY - zeroY) / 90;
        const yRaw = (db: number) => zeroY - db * pxPerDb;
        assert.ok(yRaw(8) >= 2 * ts - 1e-9, `+8 dB clipped at chartH ${chartH} ts ${ts}`);
        assert.ok(yRaw(7.5) > yRaw(8), 'the last 0.5 dB step moves the curve');
      }
    }
  });
});

describe('#27 — FX EQ draws the bell on the display', () => {
  // A stand-in bell: +g dB at fc falling off in log frequency.
  const bell = (fc: number, g: number) => (f: number) => g * Math.exp(-Math.pow(Math.log2(f / fc), 2));
  test('the peak is sampled exactly at the band centre and lands at the right height', () => {
    const pts = eqCurvePoints(bell(1234, 12), 8, 312, 59, 41, 1234);
    const peak = pts.reduce((a, p) => (p.db > a.db ? p : a));
    assert.equal(peak.f, 1234);
    assert.ok(Math.abs(peak.y - (59 - (12 / EQ_CURVE_RANGE_DB) * 41)) < 1e-9);
    for (let i = 1; i < pts.length; i++) assert.ok(pts[i].x >= pts[i - 1].x);
  });
  test('the curve follows the faders: a different FREQ moves the peak, a cut points down', () => {
    const a = eqCurvePoints(bell(200, 6), 8, 312, 59, 41, 200);
    const b = eqCurvePoints(bell(5000, 6), 8, 312, 59, 41, 5000);
    const px = (pts: ReturnType<typeof eqCurvePoints>) => pts.reduce((m, p) => (p.db > m.db ? p : m)).x;
    assert.ok(px(b) > px(a));
    assert.ok(eqCurveY(-6, 59, 41) > 59 && eqCurveY(6, 59, 41) < 59);
  });
  test('axis + clamping: 20 Hz → 20 kHz across the panel; a stop band pins to the edge', () => {
    assert.equal(eqCurveX(20, 8, 312), 8);
    assert.equal(eqCurveX(20000, 8, 312), 312);
    assert.equal(eqCurveY(-200, 59, 41), 59 + 41);
    assert.equal(eqCurveY(-Infinity, 59, 41), 59 + 41);
    assert.equal(eqCurveY(40, 59, 41), 59 - 41);
  });
  test('wired: EqFlow draws it from eqResponseDb on the SAME bands the DSP runs', () => {
    const anim = read('screens/lab/fxAnim.tsx');
    // Round 3 (2026-10-16): the curve lives in its OWN strip (sh tall) under
    // the time-domain wave box, never across the wave.
    assert.match(anim, /eqCurvePoints\(\(f\) => eqResponseDb\(bands, f\), x0, x1, sh \/ 2, halfH, centre\)/);
    assert.match(anim, /<Path path=\{curve\.line\} color=\{STAGE_GREEN\} style="stroke"/);
    assert.match(anim, /\{`EQ CURVE · \$\{EQ_CURVE_F_MIN\} Hz → \$\{EQ_CURVE_F_MAX \/ 1000\} kHz`\}/);
    // The note's points ride the stage text scale (≥ 9 pt at 1×).
    assert.match(anim, /fontSize: 10 \* ts, left: 8 \* ts, bottom: 3 \* ts/);
  });
});

describe('#29 — Camera Analogy field-of-view wedge is back', () => {
  test('the wedge spans aimX ± halfW from the camera apex, under the camera body', () => {
    const src = read('screens/lab/eq/modules/CameraAnalogy.tsx');
    assert.match(src, /points=\{`\$\{CAM_APEX\[0\]\},\$\{CAM_APEX\[1\]\} \$\{aimX - halfW\},\$\{FOV_TOP\} \$\{aimX \+ halfW\},\$\{FOV_TOP\}`\}/);
    assert.match(src, /<Line x1=\{aimX - halfW\} y1=\{FOV_TOP\} x2=\{aimX \+ halfW\} y2=\{FOV_TOP\}/);
    // Drawn before the camera body (the body sits over the apex).
    assert.ok(src.indexOf('${aimX - halfW},${FOV_TOP}') < src.indexOf('CAMERA seen from behind'));
    // PAN and ZOOM feed it.
    assert.match(src, /const aimX = xForF\(cameraF\);/);
    assert.match(src, /const halfW = \(bwOct \* PX_PER_OCT\) \/ 2;/);
    assert.match(src, /<RoomScene aimX=\{aimX\} halfW=\{halfW\} width=\{fw\} \/>/);
  });
});

describe('#16 Mastering mod8 GAP locks while CROSSFADE is on', () => {
  test('the GAP fader carries a locked reason when crossfade is on', () => {
    const s = readFileSync('src/screens/lab/mastering/modules/mod8Project.tsx', 'utf8');
    assert.match(s, /locked: crossfade \? 'CROSSFADE is on — the tracks overlap, so there is no gap to set\. Turn CROSSFADE off to ride GAP\.' : undefined,/);
  });
});
