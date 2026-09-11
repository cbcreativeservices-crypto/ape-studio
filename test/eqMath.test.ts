/**
 * EQ Lab — eqMath tests (untested-math QA night 2026-09-11).
 *
 * These are the numbers a console readout shows, so they are checked against
 * the standard relations rather than against themselves: the Q↔bandwidth
 * identity, Butterworth's −3 dB corner and n×6 dB/oct slope, RBJ cookbook
 * biquads evaluated on the unit circle, and the ISO band grids.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  bwOctFromQ, qFromBwOct, fFromNorm, normFromF, fmtHz, gainColor, maxPosDb,
  butterworthHpDb, butterworthLpDb, biquadMagDb, biquadPhaseDeg, rbjNotch,
  OCT_CENTERS, THIRD_CENTERS, Q_1OCT, Q_THIRD,
  graphicActualDb, graphicPhaseDeg, sliderCurveDb, baseSpectrumDb,
} from '../src/screens/lab/eq/modules/eqMath.ts';

const near = (a: number, b: number, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

describe('Q ↔ bandwidth in octaves', () => {
  it('follows the standard peaking relation 1/Q = 2·sinh(ln2/2 · BW)', () => {
    for (const q of [0.3, 0.5, 0.707, 1, 2, 4, 6, 10, 30]) {
      near(bwOctFromQ(q), (2 / Math.LN2) * Math.asinh(1 / (2 * q)), 1e-12);
      near(qFromBwOct(bwOctFromQ(q)), q, 1e-9);
      near(bwOctFromQ(qFromBwOct(bwOctFromQ(q))), bwOctFromQ(q), 1e-9);
    }
  });
  it('the console landmarks: Q 1 ≈ 1.39 oct, Q 6 ≈ 0.24 oct, Q 1.414 = exactly 1 oct', () => {
    near(bwOctFromQ(1), 1.38848, 1e-5);
    near(bwOctFromQ(6), 0.24017, 1e-5);
    near(bwOctFromQ(Math.SQRT2), 1, 1e-9);
  });
  it('the graphic-EQ board widths: 1 octave → Q 1.414, 1/3 octave → Q 4.318', () => {
    near(Q_1OCT, Math.SQRT2, 1e-9);
    near(Q_THIRD, 4.3185, 1e-3);
    near(bwOctFromQ(Q_1OCT), 1, 1e-12);
    near(bwOctFromQ(Q_THIRD), 1 / 3, 1e-12);
  });
  it('higher Q always means a narrower filter (monotonic, both directions)', () => {
    let prev = Infinity;
    for (let q = 0.2; q < 20; q *= 1.2) {
      const bw = bwOctFromQ(q);
      assert.ok(bw < prev, `Q ${q} not narrower`);
      prev = bw;
    }
    let prevQ = Infinity;
    for (let bw = 0.1; bw < 4; bw += 0.1) {
      const q = qFromBwOct(bw);
      assert.ok(q < prevQ);
      prevQ = q;
    }
  });
});

describe('frequency slider mapping', () => {
  it('spans exactly 20 Hz to 20 kHz — three decades', () => {
    near(fFromNorm(0), 20, 1e-9);
    near(fFromNorm(1), 20000, 1e-6);
    near(normFromF(20), 0, 1e-12);
    near(normFromF(20000), 1, 1e-12);
  });
  it('is LOG-even: the halfway point is the geometric mean, 632 Hz — not 10 kHz', () => {
    near(fFromNorm(0.5), Math.sqrt(20 * 20000), 1e-6);
    near(normFromF(Math.sqrt(20 * 20000)), 0.5, 1e-12);
  });
  it('equal slider travel is equal RATIO everywhere on the fader', () => {
    near(fFromNorm(0.5) / fFromNorm(0.25), fFromNorm(0.75) / fFromNorm(0.5), 1e-9);
  });
  it('round-trips, and clamps rather than running off the ends', () => {
    for (const t of [0, 0.17, 0.5, 0.83, 1]) near(normFromF(fFromNorm(t)), t, 1e-12);
    assert.equal(fFromNorm(-5), 20);
    assert.equal(fFromNorm(5), fFromNorm(1));
  });
  it('formats like a console: Hz below 1k, two decimals in the low kHz, one above 10 k', () => {
    assert.equal(fmtHz(63), '63 Hz');
    assert.equal(fmtHz(632.4), '632 Hz');
    assert.equal(fmtHz(1000), '1.00 kHz');
    assert.equal(fmtHz(1250), '1.25 kHz');
    assert.equal(fmtHz(12500), '12.5 kHz');
    assert.equal(fmtHz(20000), '20.0 kHz');
  });
});

describe('Butterworth magnitudes', () => {
  it('is −3.01 dB at the corner for EVERY order — that is what "corner" means', () => {
    for (const n of [1, 2, 3, 4, 8]) {
      near(butterworthHpDb(1000, 1000, n), -3.0103, 1e-4);
      near(butterworthLpDb(1000, 1000, n), -3.0103, 1e-4);
    }
  });
  it('the stopband slope is order × 6.02 dB/octave', () => {
    // Measured two-to-three octaves out, where the asymptote has settled but
    // the −120 dB display floor has not yet been reached.
    for (const n of [1, 2, 3, 4]) {
      const tol = n === 1 ? 0.25 : 0.02; // 1st order approaches its asymptote slowest
      near(butterworthHpDb(1000, 250, n) - butterworthHpDb(1000, 125, n), n * 6.0206, tol);
      near(butterworthLpDb(1000, 8000, n) - butterworthLpDb(1000, 4000, n), -n * 6.0206, tol);
    }
  });
  it('a 2nd-order high-pass is 12 dB down an octave below the corner', () =>
    near(butterworthHpDb(1000, 500, 2), -12.3045, 1e-3));
  it('the passband is flat — Butterworth is maximally flat, no ripple', () => {
    for (let f = 5000; f <= 20000; f *= 1.1) {
      assert.ok(butterworthHpDb(1000, f, 4) > -0.01 && butterworthHpDb(1000, f, 4) <= 0);
    }
  });
  it('is monotonic: high-pass always rises with frequency, low-pass always falls', () => {
    let p = -Infinity;
    for (let f = 20; f <= 20000; f *= 1.1) {
      const v = butterworthHpDb(500, f, 3);
      assert.ok(v >= p - 1e-12, `HP dipped at ${f}`);
      p = v;
    }
    p = Infinity;
    for (let f = 20; f <= 20000; f *= 1.1) {
      const v = butterworthLpDb(500, f, 3);
      assert.ok(v <= p + 1e-12, `LP rose at ${f}`);
      p = v;
    }
  });
  it('high-pass and low-pass are mirror images about the corner', () => {
    for (const r of [2, 4, 8]) {
      near(butterworthHpDb(1000, 1000 / r, 2), butterworthLpDb(1000, 1000 * r, 2), 1e-9);
    }
  });
  it('never returns −Infinity or NaN, however deep the stopband', () => {
    for (const n of [1, 4, 12]) {
      assert.ok(Number.isFinite(butterworthHpDb(1000, 0.001, n)));
      assert.ok(Number.isFinite(butterworthLpDb(1000, 1e9, n)));
    }
  });
});

describe('RBJ biquads on the unit circle', () => {
  it('the notch really nulls at its centre and leaves unity skirts', () => {
    const nt = rbjNotch(1000, 4);
    assert.ok(biquadMagDb(nt, 1000) < -100, 'no null at the centre');
    near(biquadMagDb(nt, 50), 0, 0.02);
    near(biquadMagDb(nt, 15000), 0, 0.05);
  });
  it('a higher-Q notch is narrower', () => {
    assert.ok(biquadMagDb(rbjNotch(1000, 12), 900) > biquadMagDb(rbjNotch(1000, 2), 900));
  });
  it('the notch\'s phase swings ±90° across the null — a real minimum-phase filter', () => {
    const nt = rbjNotch(1000, 4);
    assert.ok(biquadPhaseDeg(nt, 990) < -60);
    assert.ok(biquadPhaseDeg(nt, 1010) > 60);
    near(biquadPhaseDeg(nt, 100), 0, 3);
  });
  it('a peaking band delivers EXACTLY its dial gain at its own centre', () => {
    for (const g of [-15, -12, -6, -3, 0, 3, 6, 12, 15]) {
      const gains = OCT_CENTERS.map(() => 0);
      gains[5] = g; // the 1 kHz slider
      near(graphicActualDb(OCT_CENTERS, gains, Q_1OCT, 1000), g, 1e-9);
    }
  });
  it('a peaking band at Q_1OCT really is one octave wide at half gain', () => {
    const gains = OCT_CENTERS.map(() => 0);
    gains[5] = 12;
    const at = (f: number) => graphicActualDb(OCT_CENTERS, gains, Q_1OCT, f);
    let lo = 1000, hi = 1000;
    for (let i = 1; i < 200000; i++) { const f = 1000 * Math.pow(2, -i / 20000); if (at(f) < 6) { lo = f; break; } }
    for (let i = 1; i < 200000; i++) { const f = 1000 * Math.pow(2, i / 20000); if (at(f) < 6) { hi = f; break; } }
    near(Math.log2(hi / lo), 1, 0.01);
  });
  it('a flat board is flat — zero gain and zero phase, everywhere', () => {
    const zero = OCT_CENTERS.map(() => 0);
    for (let f = 20; f <= 20000; f *= 1.2) {
      assert.equal(graphicActualDb(OCT_CENTERS, zero, Q_1OCT, f), 0);
      assert.equal(graphicPhaseDeg(OCT_CENTERS, zero, Q_1OCT, f), 0);
    }
  });
  it('a cut is the exact mirror of the matching boost', () => {
    const up = OCT_CENTERS.map((_, i) => (i === 3 ? 9 : 0));
    const dn = OCT_CENTERS.map((_, i) => (i === 3 ? -9 : 0));
    for (let f = 20; f <= 20000; f *= 1.3) {
      near(graphicActualDb(OCT_CENTERS, up, Q_1OCT, f), -graphicActualDb(OCT_CENTERS, dn, Q_1OCT, f), 1e-9);
    }
  });
  it('LESSON 11: neighbouring sliders SUM — the board never reads like the fader curve', () => {
    const gains = OCT_CENTERS.map((_, i) => (i === 4 || i === 5 || i === 6 ? 6 : 0));
    // Three adjacent +6 bands stack well past +6 in the middle …
    const actual = graphicActualDb(OCT_CENTERS, gains, Q_1OCT, 1000);
    assert.ok(actual > 8, `three stacked +6 bands only reached ${actual}`);
    // … while the naïve "read the sliders" curve says a flat +6.
    assert.equal(sliderCurveDb(OCT_CENTERS, gains, 1000), 6);
    // And the error is not a rounding wobble — it is dB, visible on the plot.
    assert.ok(actual - sliderCurveDb(OCT_CENTERS, gains, 1000) > 2);
    // The narrower 1/3-octave board stacks harder still (31 bands, more overlap).
    const g3 = THIRD_CENTERS.map((_, i) => (i >= 16 && i <= 20 ? 6 : 0));
    assert.ok(graphicActualDb(THIRD_CENTERS, g3, Q_THIRD, 1000) > 8);
  });
  it('one lone slider does NOT reach its neighbours (the skirts really are narrow)', () => {
    const one = OCT_CENTERS.map((_, i) => (i === 5 ? 6 : 0));
    assert.ok(graphicActualDb(OCT_CENTERS, one, Q_1OCT, 500) < 2);
    assert.ok(graphicActualDb(OCT_CENTERS, one, Q_1OCT, 2000) < 2);
  });
  it('EQ costs PHASE, not only amplitude (the minimum-phase lesson)', () => {
    const gains = OCT_CENTERS.map((_, i) => (i === 5 ? 12 : 0));
    assert.notEqual(graphicPhaseDeg(OCT_CENTERS, gains, Q_1OCT, 700), 0);
    assert.notEqual(graphicPhaseDeg(OCT_CENTERS, gains, Q_1OCT, 1400), 0);
    near(graphicPhaseDeg(OCT_CENTERS, gains, Q_1OCT, 1000), 0, 1e-9); // zero AT the centre
  });
  it('every board response is finite across the band, at both octave and 1/3-octave widths', () => {
    for (const [centers, q] of [[OCT_CENTERS, Q_1OCT], [THIRD_CENTERS, Q_THIRD]] as const) {
      const gains = centers.map((_, i) => (i % 2 ? 9 : -9));
      for (let f = 20; f <= 20000; f *= 1.1) {
        assert.ok(Number.isFinite(graphicActualDb(centers, gains as number[], q, f)), `${f}`);
        assert.ok(Number.isFinite(graphicPhaseDeg(centers, gains as number[], q, f)), `${f}`);
      }
    }
  });
});

describe('the ISO band grids', () => {
  it('the 10-band board is octave-spaced (each centre twice the last)', () => {
    assert.equal(OCT_CENTERS.length, 10);
    for (let i = 1; i < OCT_CENTERS.length; i++) {
      near(OCT_CENTERS[i] / OCT_CENTERS[i - 1], 2, 0.05);
    }
  });
  it('the 31-band board is third-octave spaced (each centre 2^(1/3) of the last)', () => {
    assert.equal(THIRD_CENTERS.length, 31);
    for (let i = 1; i < THIRD_CENTERS.length; i++) {
      near(THIRD_CENTERS[i] / THIRD_CENTERS[i - 1], Math.pow(2, 1 / 3), 0.05);
    }
  });
  it('both grids ascend and cover 20 Hz … 20 kHz', () => {
    for (const grid of [OCT_CENTERS, THIRD_CENTERS]) {
      for (let i = 1; i < grid.length; i++) assert.ok(grid[i] > grid[i - 1]);
    }
    assert.equal(THIRD_CENTERS[0], 20);
    assert.equal(THIRD_CENTERS.at(-1), 20000);
  });
  it('every octave centre is also a third-octave centre (the boards agree)', () => {
    for (const f of OCT_CENTERS) {
      assert.ok(THIRD_CENTERS.some((t) => Math.abs(t - f) / f < 0.02), `${f} missing from the 1/3-oct grid`);
    }
  });
});

describe('sliderCurveDb — the naïve "read the faders" curve', () => {
  const gains = OCT_CENTERS.map((_, i) => i);
  it('passes exactly through every slider position', () => {
    OCT_CENTERS.forEach((f, i) => near(sliderCurveDb(OCT_CENTERS, gains, f), i, 1e-9));
  });
  it('is flat beyond the end bands rather than extrapolating', () => {
    assert.equal(sliderCurveDb(OCT_CENTERS, gains, 5), gains[0]);
    assert.equal(sliderCurveDb(OCT_CENTERS, gains, 20000), gains.at(-1));
  });
  it('interpolates straight on the LOG axis (geometric midpoint = arithmetic mid-gain)', () => {
    near(sliderCurveDb(OCT_CENTERS, gains, Math.sqrt(OCT_CENTERS[0] * OCT_CENTERS[1])), 0.5, 1e-9);
    near(sliderCurveDb(OCT_CENTERS, gains, Math.sqrt(OCT_CENTERS[4] * OCT_CENTERS[5])), 4.5, 1e-9);
  });
  it('stays inside the range of the fader values it joins', () => {
    for (let f = 10; f <= 20000; f *= 1.05) {
      const v = sliderCurveDb(OCT_CENTERS, gains, f);
      assert.ok(v >= Math.min(...gains) && v <= Math.max(...gains));
    }
  });
});

describe('baseSpectrumDb — the trainer reference spectrum', () => {
  it('is normalized to 0 dB at 1 kHz', () => near(baseSpectrumDb(1000), 0, 1e-3));
  it('tilts DOWN with frequency through the midband (a pink-ish program curve)', () => {
    assert.ok(baseSpectrumDb(2000) < baseSpectrumDb(1000));
    assert.ok(baseSpectrumDb(1000) < baseSpectrumDb(500));
  });
  it('the midband tilt is a CONSTANT number of dB per octave (a straight line on a log axis)', () => {
    // Between the LF and HF shoulders the curve is a pure tilt. NOTE: that
    // tilt is −1.80 dB/oct, not the −3 dB/oct the function's doc comment
    // claims — the code multiplies the pink tilt by 0.6. Reported to the
    // owner rather than changed: this is a synthetic "healthy programme"
    // reference the trainers draw, and the gentler slope may be deliberate.
    const perOct = baseSpectrumDb(1000) - baseSpectrumDb(500);
    near(perOct, -1.8, 0.01);
    for (const f of [250, 500, 1000]) {
      near(baseSpectrumDb(f * 2) - baseSpectrumDb(f), perOct, 0.02);
    }
  });
  it('rolls off at both extremes so the display never runs off the plot', () => {
    assert.ok(baseSpectrumDb(20) < baseSpectrumDb(100));
    assert.ok(baseSpectrumDb(20000) < baseSpectrumDb(10000));
  });
  it('is finite across the whole audible band', () => {
    for (let f = 20; f <= 20000; f *= 1.05) assert.ok(Number.isFinite(baseSpectrumDb(f)), `${f}`);
  });
});

describe('maxPosDb / gainColor — the MIDI amplitude ramp on EQ plots', () => {
  it('reports 0 for a response with no boost anywhere (only cuts)', () => {
    assert.equal(maxPosDb(() => -8), 0);
    assert.equal(maxPosDb(() => 0), 0);
  });
  it('finds a boost hiding anywhere in the audible band', () => {
    assert.equal(maxPosDb((f) => (f > 900 && f < 1100 ? 7 : -3)), 7);
    assert.equal(maxPosDb((f) => (f < 25 ? 11 : 0)), 11);
    assert.equal(maxPosDb((f) => (f > 19000 ? 4 : 0)), 4);
  });
  it('reports the WORST excess when several boosts are present', () => {
    assert.equal(maxPosDb((f) => (f < 100 ? 3 : f > 5000 ? 9 : 0)), 9);
  });
  it('owner rule: cuts and unity stay BLUE — only a boost warms the ramp', () => {
    const blue = gainColor(0);
    assert.equal(gainColor(-12), blue);
    assert.equal(gainColor(-0.001), blue);
    assert.notEqual(gainColor(12), blue);
  });
  it('gainColor always returns a colour string, even at silly inputs', () => {
    for (const d of [-100, 0, 6, 18, 40]) assert.match(gainColor(d), /^#?[0-9a-zA-Z(),.\s%]+$/);
    assert.match(gainColor(6, 0), /./); // maxDb guarded against divide-by-zero
  });
});
