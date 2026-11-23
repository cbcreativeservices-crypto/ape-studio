/**
 * Digital Audio Sampling & Conversion Lab — two display faults (owner, iPhone,
 * 2026-11-22), receipts:
 *
 *  1. "In Quant and Bit Depth: adjusting level and bits looks the same. bits
 *     should be showing vertical resolution changes but it doesnt."
 *     → the level lines ARE the quantizer (2^bits levels on a FIXED full-scale
 *       axis), the green trace is the original rounded to the levels at every
 *       instant (amplitude rounding only: coordinator's correction after the
 *       in-app check, a hold in time made 8- to 24-bit look stepped too), each
 *       sample's stored value lies on it, LEVEL never moves a level line and
 *       BITS always does.
 *
 *  2. "in digital processing and analog to digital (and maybe others?) the
 *     wave form transforms after the present moment which look odd. Once a
 *     wave form has happend, it should not become some other waveform later
 *     in time...."
 *     → every moving trace is one signal s(θ) on one time base: the value
 *       drawn for signal time T is the same on every frame (controls held),
 *       and the two Module 6 panes are time-aligned.
 *
 * The maths is imported from the very files the UI thread runs
 * (src/screens/lab/digital/quantMath.ts and timeBase.ts).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const Q = await import('../src/screens/lab/digital/quantMath.ts');
const T = await import('../src/screens/lab/digital/timeBase.ts');

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const D = 'src/screens/lab/digital/';
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
/** The green trace's value at t (the run containing t). */
const greenAt = (runs: { t0: number; t1: number; q: number }[], t: number) => {
  let lo = 0;
  let hi = runs.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (runs[m].t0 <= t) lo = m;
    else hi = m - 1;
  }
  return runs[lo].q;
};

// ═════════════════════════════════════════════════════════════════════════════
describe('1. Quantization & Bit Depth: the grid is the quantizer', () => {
  it('(a) for 3, 4 and 8 bits the drawn level count is 2^bits, evenly stepped across full scale', () => {
    for (const bits of [3, 4, 8]) {
      const lv = Q.quantLevelValues(bits);
      assert.equal(lv.length, Math.pow(2, bits), `${bits}-bit level count`);
      assert.equal(lv.length, Q.quantLevelCount(bits));
      const step = Q.quantStep(bits);
      assert.ok(near(step, 2 / Math.pow(2, bits)), 'one step = full-scale span / 2^bits');
      assert.ok(near(lv[0], -1), 'the bottom code sits ON −full scale');
      assert.ok(near(lv[lv.length - 1], 1 - step), 'the top code sits one step below +full scale (two’s complement)');
      for (let i = 1; i < lv.length; i++) assert.ok(near(lv[i] - lv[i - 1], step), 'evenly spaced');
    }
    assert.equal(Q.quantLevelValues(3).length, 8);
    assert.equal(Q.quantLevelValues(4).length, 16);
  });

  it('(a) every stored sample is its sampled value rounded to the NEAREST level, and lies on the green trace', () => {
    for (const bits of [3, 4, 8]) {
      const lv = Q.quantLevelValues(bits);
      const step = Q.quantStep(bits);
      for (const levelDb of [0, -6, -12, -24, -40]) {
        const s = Q.quantSamples(bits, levelDb);
        assert.equal(s.length, Q.QUANT_SAMPLES);
        s.forEach((smp, i) => {
          // brute-force nearest level
          let best = lv[0];
          for (const L of lv) if (Math.abs(smp.v - L) < Math.abs(smp.v - best) - 1e-12) best = L;
          assert.ok(
            near(Math.abs(smp.v - smp.q), Math.abs(smp.v - best), 1e-12),
            `${bits}-bit ${levelDb} dBFS sample ${i}: stored ${smp.q} is not the nearest level to ${smp.v} (that is ${best})`,
          );
          assert.ok(lv.some((L) => near(L, smp.q)), 'the stored value sits ON a level line');
          assert.ok(near(smp.v, Q.quantSine(smp.t, levelDb)), 'the sampled value is the original at its instant');
          if (levelDb < 0) assert.ok(Math.abs(smp.v - smp.q) <= step / 2 + 1e-12, 'rounding error ≤ half a step below full scale');
          // and that stored value lies ON the green trace at its instant
          assert.ok(near(greenAt(Q.quantStaircase(bits, levelDb), smp.t), smp.q), `sample ${i} lies on the green trace`);
        });
      }
    }
  });

  it('at 4-bit and −12 dBFS (the owner’s screenshot) the staircase is unmistakable', () => {
    const s = Q.quantSamples(4, -12);
    const codes = new Set(s.map((x) => x.code));
    assert.deepEqual([...codes].sort((a, b) => a - b), [-2, -1, 0, 1, 2], 'the sine spans five levels');
    assert.equal(Q.quantLevelsUsed(4, -12), 5);
    const maxErr = Math.max(...s.map((x) => Math.abs(x.v - x.q)));
    assert.ok(maxErr > 0.3 * Q.quantStep(4), 'the rounding error is a visible part of a step');
    // and at 16 bits it honestly looks like the original
    const hi = Q.quantSamples(16, -12);
    assert.ok(Math.max(...hi.map((x) => Math.abs(x.v - x.q))) < 2e-5);
  });

  it('(b) LEVEL never moves a level line; BITS always does', () => {
    // The lines depend on bits alone.
    assert.deepEqual(Q.quantLevelValues(4), Q.quantLevelValues(4));
    assert.notDeepEqual(Q.quantLevelValues(3), Q.quantLevelValues(4));
    assert.notDeepEqual(Q.quantLevelValues(4), Q.quantLevelValues(6));
    // The picture's vertical axis is full scale, from the glass size only —
    // never from the signal level (no auto-zoom).
    const viz = code(D + 'vizQuant.tsx');
    const qv = viz.slice(viz.indexOf('export function QuantView('), viz.indexOf('export type DitherMode'));
    assert.match(qv, /const ampPx = H \/ 2 - 16;/);
    assert.match(qv, /const yOf = \(v: number\) => midY - v \* ampPx;/);
    assert.match(qv, /for \(const v of quantLevelValues\(bits\)\)/, 'the lines are the quantizer’s levels');
    assert.doesNotMatch(qv, /const (ampPx|midY|yOf) = [^;\n]*(levelDb|amp\b|peak)/, 'the axis is never scaled by LEVEL');
    assert.match(qv, /quantGridMode\(bits, 2 \* ampPx \* ts\)/, 'line-or-band is decided on screen pixels');
    // LEVEL changes how many steps the wave uses — BITS how many exist.
    assert.equal(Q.quantLevelsUsed(4, -24), 3);
    assert.equal(Q.quantLevelsUsed(4, -30), 1, 'a −30 dBFS sine at 4 bits fits inside one step: stored as silence');
    assert.ok(Q.quantLevelsUsed(8, -12) > Q.quantLevelsUsed(4, -12));
    assert.ok(Q.quantLevelsUsed(8, -40) < Q.quantLevelsUsed(8, -6));
  });

  it('green = quantize(amber) at every instant: exact levels, one-level risers exactly at the thresholds', () => {
    for (const bits of [3, 4, 6, 8]) {
      const lv = Q.quantLevelValues(bits);
      const half = Math.pow(2, bits - 1);
      for (const levelDb of [0, -3, -12, -24]) {
        const runs = Q.quantStaircase(bits, levelDb);
        assert.ok(near(runs[0].t0, 0) && near(runs[runs.length - 1].t1, 1), 'covers the whole glass');
        for (let i = 0; i < runs.length; i++) {
          const r = runs[i];
          assert.ok(lv.some((L) => near(L, r.q, 1e-12)), `${bits}-bit: every green value is an exact level`);
          assert.ok(r.t1 > r.t0, 'no empty run');
          // inside a run the original rounds to that level
          for (const f of [0.25, 0.5, 0.75]) {
            const t = r.t0 + f * (r.t1 - r.t0);
            assert.equal(Q.quantCode(Q.quantSine(t, levelDb), bits), r.code, `${bits}-bit ${levelDb}: green(t) = quantize(amber(t))`);
          }
          if (i > 0) {
            const p = runs[i - 1];
            assert.ok(near(p.t1, r.t0), 'contiguous: a riser, never a gap');
            assert.equal(Math.abs(r.code - p.code), 1, `${bits}-bit ${levelDb}: successive values differ by exactly one level`);
            // the riser sits exactly where amber crosses the decision threshold
            const thr = (Math.min(r.code, p.code) + 0.5) / half;
            assert.ok(Math.abs(Q.quantSine(r.t0, levelDb) - thr) < 1e-9, `${bits}-bit riser at the threshold`);
          }
        }
      }
    }
    const viz = code(D + 'vizQuant.tsx');
    const qv = viz.slice(viz.indexOf('export function QuantView('), viz.indexOf('export type DitherMode'));
    assert.doesNotMatch(qv, /smoothThrough/, 'never a smooth curve through the dots');
    assert.match(qv, /quantStaircase\(bits, levelDb\)\.forEach/, 'the green trace is the dense rounding of the original');
    assert.doesNotMatch(qv, /tEnd/, 'no hold in time');
  });

  it('at 8 bits and up green lies on amber (< 1 px on a 250 pt glass); BITS changes green for every pair of 3, 4, 6, 8', () => {
    const ampPx = 250 / 2 - 16; // QuantView: full scale at ±(H/2 − 16)
    for (const bits of [8, 12, 16, 24]) {
      for (const levelDb of [0, -12, -40]) {
        const runs = Q.quantStaircase(bits, levelDb);
        let worst = 0;
        for (let i = 0; i <= 4000; i++) {
          const t = i / 4000;
          worst = Math.max(worst, Math.abs(greenAt(runs, t) - Q.quantSine(t, levelDb)));
        }
        assert.ok(worst * ampPx < 1, `${bits}-bit ${levelDb}: |green − amber| = ${(worst * ampPx).toFixed(2)} px`);
        // bounded work at any depth (24-bit would otherwise be millions of risers), still exact levels
        assert.ok(runs.length <= Q.QUANT_MAX_RISERS + 1, `${bits}-bit ${levelDb}: ${runs.length} runs`);
        const half = Math.pow(2, bits - 1);
        for (const r of runs) assert.ok(Number.isInteger(r.q * half) && r.code === r.q * half, `${bits}-bit: exact level`);
      }
    }
    const pts = Array.from({ length: 2001 }, (_v, i) => i / 2000);
    for (const levelDb of [-6, -12]) {
      const g = (bits: number) => {
        const runs = Q.quantStaircase(bits, levelDb);
        return pts.map((t) => greenAt(runs, t));
      };
      const B = [3, 4, 6, 8];
      for (let a = 0; a < B.length; a++) {
        for (let b = a + 1; b < B.length; b++) {
          const ga = g(B[a]);
          const gb = g(B[b]);
          assert.ok(ga.some((v, i) => Math.abs(v - gb[i]) > 1e-9), `${B[a]} vs ${B[b]} bits at ${levelDb} dBFS: green must differ`);
        }
      }
      // coarser bits: fewer, bigger steps
      assert.ok(Q.quantStaircase(3, levelDb).length < Q.quantStaircase(4, levelDb).length);
      assert.ok(Q.quantStaircase(4, levelDb).length < Q.quantStaircase(6, levelDb).length);
    }
  });

  it('lines when they can be drawn ≥ 3 px apart, else one shaded band (no fake ruling)', () => {
    assert.equal(Q.QUANT_MIN_LINE_PX, 3);
    // the L glass (250 tall → 218 px of full scale) and the M glass (168 px)
    assert.equal(Q.quantGridMode(3, 218), 'lines');
    assert.equal(Q.quantGridMode(4, 218), 'lines');
    assert.equal(Q.quantGridMode(6, 218), 'lines');
    assert.equal(Q.quantGridMode(6, 168), 'band');
    assert.equal(Q.quantGridMode(8, 218), 'band');
    assert.equal(Q.quantGridMode(8, 218 * 3), 'band', 'even at the biggest zoom 8-bit is a band');
    assert.equal(Q.quantGridMode(16, 218), 'band');
    const viz = code(D + 'vizQuant.tsx');
    assert.doesNotMatch(viz, /y \+= 3\.5/, 'the old fixed 3.5 px ruling (not the quantizer) is gone');
    // the host says so
    const mod = code(D + 'modules/modQuant.tsx');
    assert.match(mod, /gridMode === 'band'\s*\? `At \$\{bits\}-bit the \$\{fmtGroup\(levels\)\} levels are too close to draw apart: a shaded band\.`/);
    assert.match(mod, /onGridMode=\{setGridMode\}/);
  });

  it('the readouts come from the same numbers the picture draws', () => {
    const mod = code(D + 'modules/modQuant.tsx');
    assert.match(mod, /from '\.\.\/quantMath'/);
    assert.doesNotMatch(mod, /function quantizeNorm/, 'one quantizer only');
    assert.doesNotMatch(code(D + 'vizQuant.tsx'), /function quantizeNorm/, 'one quantizer only');
    assert.match(mod, /const levels = quantLevelCount\(bits\);/);
    assert.match(mod, /\{ k: 'LEVELS USED', v: fmtGroup\(levelsUsed\) \}/);
    // STEP SIZE 1/half FS = one drawn step in units of full-scale peak
    for (const bits of [3, 4, 8]) assert.ok(near(Q.quantStep(bits), 1 / Math.pow(2, bits - 1)));
    // ERROR RMS: the quantizer's own error
    assert.ok(Q.quantErrorRmsDb(16, 0.25) < Q.quantErrorRmsDb(4, 0.25) - 60);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
type F = (j: number, th: number) => number;

/** Every vertex drawn at clock c1 that is still on the glass at c2 shows the
 *  same value for the same signal time — and every grid vertex is f(θ). */
function assertRigid(name: string, span: number, dir: number, dTheta: number, f: F) {
  const clocks = [0, 0.37, 1.9, 7.25, 33.3, 120.01];
  const steps = [0.013, 0.2, 0.9, span * 0.4];
  for (const c1 of clocks) {
    const a = T.rigidTrace(c1, span, dir, dTheta, f);
    // ordered by u, spanning the whole glass
    assert.ok(near(a[0], 0, 1e-9) && near(a[a.length - 2], 1, 1e-9), `${name}: the trace reaches both edges`);
    for (let i = 2; i < a.length; i += 2) assert.ok(a[i] >= a[i - 2] - 1e-12, `${name}: u ascending`);
    for (const d of steps) {
      const c2 = c1 + d;
      const b = T.rigidTrace(c2, span, dir, dTheta, f);
      let matched = 0;
      for (let i = 0; i < a.length; i += 2) {
        const th = T.thetaAtU(a[i], c1, span, dir);
        const j = Math.round(th / dTheta);
        if (!near(j * dTheta, th, 1e-7)) continue; // an edge point, not a grid vertex
        assert.ok(near(a[i + 1], f(j, j * dTheta), 1e-12), `${name}: the vertex is s(θ)`);
        const u2 = T.uAtTheta(th, c2, span, dir);
        if (u2 < 0 || u2 > 1) continue; // left the glass
        // find it again at c2
        let found = false;
        for (let k = 0; k < b.length; k += 2) {
          if (near(b[k], u2, 1e-7)) {
            assert.ok(near(b[k + 1], a[i + 1], 1e-12), `${name}: θ=${th.toFixed(3)} changed from ${a[i + 1]} to ${b[k + 1]} between clocks ${c1} and ${c2}`);
            found = true;
            break;
          }
        }
        assert.ok(found, `${name}: vertex θ=${th} missing at the later frame`);
        matched++;
      }
      if (d < span * 0.5) assert.ok(matched > 3, `${name}: compared real vertices (${matched})`);
    }
  }
}

describe('2. a waveform that has happened never changes (one time base)', () => {
  it('the time base round-trips: u ↔ θ, newest at the stated edge', () => {
    for (const dir of [1, -1]) {
      for (const c of [0, 2.5, 99]) {
        for (const u of [0, 0.25, 0.5, 1]) assert.ok(near(T.uAtTheta(T.thetaAtU(u, c, 10, dir), c, 10, dir), u));
      }
    }
    assert.equal(T.thetaAtU(1, 5, 10, 1), 5, 'dir +1: now at the right edge');
    assert.equal(T.thetaAtU(0, 5, 10, -1), 5, 'dir −1: now at the left edge');
  });

  it('(c) Module 5 gain staging: the recorded wave, its ghost, its clip flags and its noise floor', () => {
    const rail = Math.pow(10, 3 / 20);
    for (const driveDb of [-54, -14.4, 0.5, 1.4, 6, 12]) {
      const g = Math.pow(10, driveDb / 20);
      assertRigid(`gain wave ${driveDb}`, T.GAIN_SPAN, 1, T.GAIN_SPAN / 120, (_j, th) => Math.max(-1, Math.min(1, T.gainAnalog(T.gainSignal(th), g, rail))));
      assertRigid(`gain analog ${driveDb}`, T.GAIN_SPAN, 1, T.GAIN_SPAN / 120, (_j, th) => T.gainAnalog(T.gainSignal(th), g, rail));
    }
    assertRigid('gain noise floor', T.GAIN_SPAN, 1, T.GAIN_SPAN / T.GAIN_NOISE_STEPS, (j) => T.gainNoise(j));
  });

  it('(c) Module 6 float and fixed panes, through the trim', () => {
    for (const gainDb of [0, 6, 12]) {
      for (const trim of [0, 0.5, 1]) {
        const gLin = Math.pow(10, gainDb / 20);
        const tLin = Math.pow(10, (-gainDb * trim) / 20);
        assertRigid(`float ${gainDb}/${trim}`, T.HEADROOM_SPAN, 1, T.HEADROOM_SPAN / 74, (_j, th) => T.headroomAt(th, gLin, tLin).float);
        assertRigid(`fixed ${gainDb}/${trim}`, T.HEADROOM_SPAN, 1, T.HEADROOM_SPAN / 74, (_j, th) => T.headroomAt(th, gLin, tLin).fixed);
      }
    }
  });

  it('(c) Module 5 chain strip and Module 1 voltage (with ADD NOISE)', () => {
    assertRigid('chain raw', T.CHAIN_SPAN, 1, T.CHAIN_SPAN / 22, (_j, th) => T.chainRaw(th));
    assertRigid('chain amped', T.CHAIN_SPAN, 1, T.CHAIN_SPAN / 22, (_j, th) => T.chainAmped(th));
    assertRigid('chain smooth', T.CHAIN_SPAN, 1, T.CHAIN_SPAN / 22, (_j, th) => T.chainSmooth(th));
    // Module 1's f: the source at θ, plus fuzz owned by the grid index
    for (const cycles of [0.6, 2, 9]) {
      const span = cycles * 2 * Math.PI;
      assertRigid(`analog voltage ${cycles}`, span, -1, span / 150, (j, th) => 0.7 * Math.sin(th) + 0.05 * (T.hashIndex(j * 31.7 + 5.3) - 0.5) * 2);
    }
  });

  it('(c) held steps, released codes, sample dots, clock ticks and jitter travel with their sample', () => {
    const cases: [string, number, number, number, number][] = [
      ['S&H held', T.SH_SPAN, 1, T.SH_DT, 0],
      ['S&H code', T.SH_SPAN, 1, T.SH_DT, T.SH_RELEASE],
      ['chain held', T.CHAIN_SPAN, 1, T.CHAIN_SAMPLE_DT, 0],
      ['DAC ZOH', 4 * Math.PI, -1, (4 * Math.PI) / 16, 0],
    ];
    for (const [name, span, dir, dt, start] of cases) {
      const f: F = (_k, th) => T.shCode(Math.sin(th));
      for (const c1 of [0.1, 3.3, 41.7]) {
        for (const d of [0.05, 0.4, 1.3]) {
          const a = T.heldSegments(c1, span, dir, dt, f, start);
          const b = T.heldSegments(c1 + d, span, dir, dt, f, start);
          for (let i = 0; i < a.length; i += 4) {
            const k = a[i + 3];
            assert.ok(near(a[i + 2], f(k, k * dt)), `${name}: segment ${k} holds sample ${k}`);
            for (let m = 0; m < b.length; m += 4) {
              if (b[m + 3] !== k) continue;
              assert.ok(near(b[m + 2], a[i + 2]), `${name}: segment ${k} changed value`);
            }
          }
          // never past "now"
          for (let i = 0; i < a.length; i += 4) assert.ok(a[i] >= -1e-9 && a[i + 1] <= 1 + 1e-9, `${name}: inside the glass`);
          // sample instants
          const sa = T.sampleInstants(c1, span, dir, dt);
          const sb = T.sampleInstants(c1 + d, span, dir, dt);
          for (let i = 0; i < sa.length; i += 3) {
            assert.ok(near(sa[i + 1], sa[i + 2] * dt), `${name}: instant ${sa[i + 2]} is θ_k`);
            for (let m = 0; m < sb.length; m += 3) {
              if (sb[m + 2] !== sa[i + 2]) continue;
              assert.ok(near(sb[m], T.uAtTheta(sa[i + 1], c1 + d, span, dir)), `${name}: tick ${sa[i + 2]} moved with the wave`);
            }
          }
        }
      }
    }
    // The S&H release: a code appears only once its delay has passed "now".
    const dt = T.SH_DT;
    const justAfter = T.heldSegments(5 * dt + 0.1 * dt, T.SH_SPAN, 1, dt, (_k, th) => th, T.SH_RELEASE);
    assert.ok(!justAfter.some((_v, i) => i % 4 === 3 && justAfter[i] === 5), 'code 5 not yet released 0.1 tick after its sample');
    const later = T.heldSegments(5 * dt + 0.5 * dt, T.SH_SPAN, 1, dt, (_k, th) => th, T.SH_RELEASE);
    assert.ok(later.some((_v, i) => i % 4 === 3 && later[i] === 5), 'code 5 released by 0.5 tick');
    // jitter belongs to the sample index alone
    for (const periodic of [false, true]) {
      for (const k of [-3, 0, 7, 1234]) assert.equal(T.jitterOf(k, periodic), T.jitterOf(k, periodic));
      assert.notEqual(T.jitterOf(3, periodic), T.jitterOf(4, periodic));
    }
  });

  it('(d) Module 6: the two panes are time-aligned — flat tops exactly where the float crosses full scale', () => {
    for (const gainDb of [3, 6, 9, 12]) {
      const gLin = Math.pow(10, gainDb / 20);
      for (const c of [0.4, 12.9]) {
        const fl = T.rigidTrace(c, T.HEADROOM_SPAN, 1, T.HEADROOM_SPAN / 74, (_j, th) => T.headroomAt(th, gLin, 1).float);
        const fx = T.rigidTrace(c, T.HEADROOM_SPAN, 1, T.HEADROOM_SPAN / 74, (_j, th) => T.headroomAt(th, gLin, 1).fixed);
        assert.equal(fl.length, fx.length, 'same vertices in both panes');
        for (let i = 0; i < fl.length; i += 2) {
          assert.equal(fl[i], fx[i], 'the same signal time sits at the same u in both panes');
          const th = T.thetaAtU(fl[i], c, T.HEADROOM_SPAN, 1);
          const h = T.headroomAt(th, gLin, 1);
          if (Math.abs(h.float) > 1) assert.equal(Math.abs(h.fixed), 1, 'flat-topped where the float is over');
          else assert.ok(near(h.fixed, h.float), 'identical where the float is under full scale');
          assert.equal(h.over, Math.abs(h.float) > 1);
        }
      }
    }
    // the panes are drawn from the same vertices (source)
    const chain = code(D + 'vizChain.tsx');
    const body = chain.slice(chain.indexOf('export function FloatHeadroomView('));
    assert.equal((body.match(/rigidTrace\(phase\.value, HEADROOM_SPAN, 1, GRID_DT,/g) ?? []).length, 3, 'float, fixed and the red flats share one grid');
  });

  it('meters agree with the trace: unit-peak programme signals', () => {
    let pk = 0;
    let pk2 = 0;
    for (let i = 0; i < 20000; i++) {
      const th = (i / 20000) * 2 * Math.PI;
      pk = Math.max(pk, Math.abs(T.gainSignal(th)));
      pk2 = Math.max(pk2, Math.abs(T.headroomSignal(th)));
    }
    assert.ok(near(pk, 1, 1e-3), `gain signal peak ${pk}`);
    assert.ok(near(pk2, 1, 1e-3), `headroom signal peak ${pk2}`);
    // Module 5: DIG = the recorded wave's peak, exactly as modChain prints it
    const rail = Math.pow(10, 3 / 20);
    for (const driveDb of [-30, -14.4, 0, 1.4]) {
      const g = Math.pow(10, driveDb / 20);
      let rec = 0;
      for (let i = 0; i < 20000; i++) rec = Math.max(rec, Math.abs(T.gainRecorded(T.gainSignal((i / 20000) * 2 * Math.PI), g, rail)));
      const printed = Math.min(1, rail * Math.tanh(g / rail));
      assert.ok(Math.abs(20 * Math.log10(rec) - 20 * Math.log10(printed)) < 0.02, `drive ${driveDb}: drawn ${rec} vs PEAK ${printed}`);
    }
    // Module 6: the bus peak is −6 dBFS + GAIN
    for (const gainDb of [0, 6, 12]) {
      let bus = 0;
      for (let i = 0; i < 20000; i++) bus = Math.max(bus, Math.abs(T.headroomAt((i / 20000) * 2 * Math.PI, Math.pow(10, gainDb / 20), 1).float));
      assert.ok(Math.abs(20 * Math.log10(bus) - (-6.02 + gainDb)) < 0.03, `bus ${gainDb}`);
    }
  });

  it('no trace in the lab rides two clocks, re-seeds by time, or pins samples to the glass', () => {
    for (const f of ['vizChain.tsx', 'vizSignal.tsx', 'vizDac.tsx']) {
      const s = code(D + f);
      assert.doesNotMatch(s, /\bph \* 1\.\d/, `${f}: a partial riding a faster copy of the clock`);
      assert.doesNotMatch(s, /Math\.floor\(ph \* \d/, `${f}: noise or bits re-drawn from the clock`);
      assert.doesNotMatch(s, /tq \* 57\.3|seed \* 13\.1/, `${f}: time-seeded noise`);
    }
    const dac = code(D + 'vizDac.tsx');
    assert.doesNotMatch(dac, /const xs = useMemo/, 'sample instants are moments in signal time, not glass positions');
    const chain = code(D + 'vizChain.tsx');
    assert.doesNotMatch(chain, /Math\.floor\(u \* 7\) \/ 7/, 'held steps are not pinned to the glass');
    assert.doesNotMatch(chain, /phQ|phC/, 'the S&H no longer re-measures its steps at each tick');
  });
});
