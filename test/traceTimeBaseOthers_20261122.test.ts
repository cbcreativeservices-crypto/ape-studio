/**
 * Moving traces outside the Digital lab — the same rule (owner, iPhone,
 * 2026-11-22): "the wave form transforms after the present moment which look
 * odd. Once a wave form has happend, it should not become some other waveform
 * later in time...." (and "maybe others?").
 *
 * Tools hub · signal-generator preview, NOISE mode. It used to show two FIXED
 * noise traces cross-fading into each other in a 340 ms loop, so the drawn
 * noise morphed in place. Now it is ONE seeded noise signal (one value per
 * sample index, periodic over one plot width) that slides across the tile at
 * the speed of the periodic shapes, so:
 *   • the value drawn for a given stretch of signal is the same at every
 *     moment of the loop until it leaves the tile;
 *   • the loop wraps with no jump (the layer's picture at the end of the loop
 *     is pixel-for-pixel its picture at the start);
 *   • no stretch of noise is on the glass twice at once.
 * The maths is imported from the very module the tile draws
 * (src/screens/tools/hubGenNoise.ts).
 *
 * Chorus lab display. Asked "Chorus display: make it a standing oscilloscope
 * picture instead of a scrolling one?", the owner answered (2026-11-23) "Yes,
 * standing scope". The glass is now a triggered scope of 6.8 ms of the real
 * 440 Hz tone: the dry tone stands still, the copy is the tone delayed by the
 * engine's delay at this instant (behind it in time), OUT is the engine's mix
 * at this instant. Nothing scrolls, so nothing drawn earlier can change; the
 * copy slides and OUT swells in place at the (drawn) LFO rate. The maths is
 * imported from src/screens/lab/chorusScope.ts, which ModFlow runs.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const N = await import('../src/screens/tools/hubGenNoise.ts');
const C = await import('../src/screens/lab/chorusScope.ts');

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const SIM = 'src/screens/tools/hubPreviewsSim.tsx';
const PLOT_W = 1800; // GEN_PLOT_W
const near = (a: number, b: number, eps = 1e-12) => Math.abs(a - b) <= eps;

describe('Tools hub · generator preview NOISE: one signal sliding, never morphing', () => {
  const samples = N.genNoiseSamples();

  it('the sequence is one seeded value per sample index, in range, and periodic', () => {
    assert.equal(samples.length, N.GEN_NOISE_PERIOD);
    assert.deepEqual(N.genNoiseSamples(), samples, 'deterministic: the same seed draws the same noise');
    for (const v of samples) assert.ok(v >= -1 && v <= 1, `value ${v} inside full scale`);
    for (const k of [-401, -200, -1, 0, 7, 199, 200, 523]) {
      assert.equal(N.genNoiseAt(samples, k), N.genNoiseAt(samples, k + N.GEN_NOISE_PERIOD), `index ${k}`);
    }
    // It is noise, not a flat line or a short repeat.
    const distinct = new Set(samples.map((v) => v.toFixed(4)));
    assert.ok(distinct.size > N.GEN_NOISE_PERIOD * 0.9, 'every sample its own value');
  });

  it('the smoothing is the filter’s own continuation across the wrap (no seam)', () => {
    // Re-run the one-pole smoother over three periods from rest: the third
    // period equals the stored one, so value 0 follows value P − 1 exactly as
    // the filter would.
    const rng = N.makeRng(N.GEN_NOISE_SEED);
    const raw: number[] = [];
    for (let k = 0; k < N.GEN_NOISE_PERIOD; k++) raw.push(rng() * 2 - 1);
    let acc = 0;
    const third: number[] = [];
    for (let pass = 0; pass < 3; pass++) {
      for (let k = 0; k < N.GEN_NOISE_PERIOD; k++) {
        acc = acc * 0.35 + raw[k] * 0.85;
        if (pass === 2) third.push(Math.max(-1, Math.min(1, acc)));
      }
    }
    for (let k = 0; k < N.GEN_NOISE_PERIOD; k++) assert.ok(near(third[k], samples[k]), `sample ${k}`);
  });

  it('the value drawn for a stretch of signal is the same at every moment of the loop', () => {
    // A stretch of signal sits at path position u; at loop fraction s it is
    // drawn at x = u − s·loop. Same u, two moments → same value, while on glass.
    const L = N.GEN_NOISE_LOOP;
    const pairs: [number, number][] = [
      [0, 0.13],
      [0.05, 0.61],
      [0.3, 0.97],
      [0.5, 0.5001],
      [0.72, 0.99],
    ];
    for (const u of [L * 0.97, L * 1.0, L * 1.234, L * 1.5, L * 1.9]) {
      for (const [s1, s2] of pairs) {
        const x1 = u - s1 * L;
        const x2 = u - s2 * L;
        if (x1 < 0 || x1 > PLOT_W || x2 < 0 || x2 > PLOT_W) continue;
        assert.ok(near(N.genNoiseDrawnAt(samples, x1, s1), N.genNoiseDrawnAt(samples, x2, s2)), `u ${u}: s ${s1} vs ${s2}`);
      }
    }
  });

  it('the loop wraps with no jump: the end of the loop draws what its start draws', () => {
    for (let x = 0; x <= PLOT_W; x += 3) {
      assert.ok(near(N.genNoiseDrawnAt(samples, x, 1), N.genNoiseDrawnAt(samples, x, 0)), `x ${x}`);
    }
    // The drawn path itself: its y at x + loop is its y at x, for the whole plot.
    const d = N.genNoisePath(samples, PLOT_W, 408, 163.2);
    const pts = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const byX = new Map(pts.map(([x, y]) => [x, y]));
    assert.equal(pts[pts.length - 1][0], PLOT_W + N.GEN_NOISE_LOOP, 'the path covers the plot plus one loop');
    for (const [x, y] of pts) {
      if (x + N.GEN_NOISE_LOOP <= PLOT_W + N.GEN_NOISE_LOOP && byX.has(x + N.GEN_NOISE_LOOP)) {
        assert.equal(byX.get(x + N.GEN_NOISE_LOOP), y, `path x ${x}`);
      }
    }
  });

  it('no stretch of noise is on the glass twice at once (the period is at least one plot width)', () => {
    assert.ok(N.GEN_NOISE_LOOP >= PLOT_W);
  });

  it('the tile scrolls the noise by exactly one loop at the periodic shapes’ speed, on the native driver, and the cross-fade is gone', () => {
    const s = code(SIM);
    assert.match(s, /import \{ GEN_NOISE_LOOP, genNoisePath, genNoiseSamples, makeRng \} from '\.\/hubGenNoise';/);
    assert.match(s, /noise: genNoisePath\(genNoiseSamples\(\), GEN_PLOT_W, GEN_MID, GEN_AMP\)/);
    assert.match(s, /return kind === 'noise' \? GEN_NOISE_LOOP : GEN_LAMBDA;/);
    assert.match(s, /const GEN_SCROLL_MS_PER_UNIT = 1500 \/ GEN_LAMBDA;/);
    assert.match(s, /if \(!active \|\| plotW <= 0\) return undefined;/, 'noise scrolls too, and only while the tile is active');
    assert.match(s, /duration: Math\.round\(loopUnits \* GEN_SCROLL_MS_PER_UNIT\)/);
    assert.match(s, /useNativeDriver: NATIVE_DRIVER/);
    assert.match(s, /outputRange: \[0, -loopPt\]/);
    assert.match(s, /viewBox=\{`0 0 \$\{GEN_PLOT_W \+ loopUnits\} \$\{GEN_PLOT_H\}`\}/);
    assert.doesNotMatch(s, /noiseFlick|GEN_NOISE_B|0xbada55/, 'no second noise trace, no flicker loop');
    assert.doesNotMatch(s, /shape === 'noise' \?/, 'noise is drawn by the same scrolling slot as every other shape');
  });
});

describe('Chorus lab · a standing (triggered) scope: nothing drawn earlier can change', () => {
  const F = 440;
  const ANIM = code('src/screens/lab/fxAnim.tsx');
  const MOD = ANIM.slice(ANIM.indexOf('function ModFlow('), ANIM.indexOf('function DynamicsFlow('));
  const GLASS_W = 340; // a phone's glass width, glass units ≈ pt
  const msPerPx = C.scopeWindowMs(F) / GLASS_W;
  const ts = [-0.1, 0, 0.37, 1.1, 2.5, 4.04, 6.8];

  it('the glass is 3 true cycles of the tone (6.8 ms at 440 Hz), with 1 ms divisions labelled on the glass at ≥ 9 pt', () => {
    assert.ok(near(C.scopeWindowMs(F), 3000 / 440));
    assert.ok(Math.abs(C.scopeWindowMs(F) - 6.82) < 0.01);
    assert.equal(C.SCOPE_DIV_MS, 1);
    assert.match(MOD, /const divPx = SCOPE_DIV_MS \/ msPerPx;/);
    assert.match(MOD, /<GlassText x=\{w - 8\} y=\{h - 16\} align="right" size=\{10\} w=\{80\} text=\{`\$\{SCOPE_DIV_MS\} ms \/ DIV`\} \/>/);
  });

  it('the dry tone is triggered on its rising zero crossing and is the same on every frame', () => {
    assert.equal(C.scopeDry(0, F), 0);
    assert.ok(C.scopeDry(0.05, F) > 0, 'rising at the trigger');
    // A function of signal time alone: no clock anywhere in it.
    for (const t of ts) assert.equal(C.scopeDry(t, F), C.scopeDry(t, F));
    // In ModFlow the dry traces are built once per layout (useMemo), never per frame.
    assert.match(MOD, /const \{ inPath, dryOutPath \} = useMemo\(\(\) => \{/);
    assert.match(MOD, /scopeDry\(\(x - x0\) \* msPerPx, srcHz\)/);
  });

  it('the copy is the dry tone delayed by the engine’s delay at this instant — behind it in time', () => {
    for (const [ctr, depth] of [[15, 0.2], [20, 0.5], [35, 1]] as const) {
      for (const lfo of [0, 0.4, Math.PI / 2, 2.2, Math.PI, 4.9]) {
        const tau = C.chorusDelayMs(ctr, depth, lfo);
        assert.ok(near(tau, ctr + 6 * depth * Math.sin(lfo)), 'τ = centre + depth·6 ms·sin(LFO)');
        for (const t of ts) {
          assert.ok(near(C.scopeCopy(t, F, tau), C.scopeDry(t - tau, F), 1e-9), `copy(t) = dry(t − τ) at t ${t}`);
          // On the glass: the copy at x shows the dry tone from τ/msPerPx to the LEFT (earlier).
          const x = 6 + t / msPerPx;
          assert.ok(near(C.scopeCopy((x - 6) * msPerPx, F, tau), C.scopeDry((x - tau / msPerPx - 6) * msPerPx, F), 1e-9));
        }
      }
    }
    // A delay of a quarter cycle puts the copy's rising crossing a quarter cycle LATER (to the right).
    const q = 1000 / F / 4;
    assert.ok(near(C.scopeCopy(q, F, q), 0, 1e-12));
    assert.ok(C.scopeCopy(q + 0.01, F, q) > 0);
  });

  it('OUT is the engine mix of dry and copy at every x: (1 − MIX)·dry + MIX·copy (feedback fixed at 0)', () => {
    for (const mix of [0.3, 0.5, 1]) {
      for (const tau of [15, 20.7, 23, 35]) {
        for (let x = 0; x <= GLASS_W; x += 17) {
          const t = (x - 6) * msPerPx;
          const want = (1 - mix) * C.scopeDry(t, F) + mix * C.scopeCopy(t, F, tau);
          assert.ok(near(C.scopeOut(t, F, tau, mix, 0), want, 1e-12), `mix ${mix} τ ${tau} x ${x}`);
        }
      }
    }
    assert.match(MOD, /scopeOut\(\(x - x0\) \* msPerPx, srcHz, tau, mixV, fbV\)/);
  });

  it('RATE sets how fast the copy slides (proportionally), DEPTH how far (proportionally)', () => {
    for (const depth of [0.2, 0.5, 1]) {
      const r1 = 0.1;
      for (const r2 of [0.2, 0.3, 0.4]) {
        assert.ok(!C.chorusLfoSlowed(r2, depth, F), 'below the cap');
        const k = C.chorusPeakSlideMsPerS(r2, depth, F) / C.chorusPeakSlideMsPerS(r1, depth, F);
        assert.ok(near(k, r2 / r1, 1e-9), `depth ${depth}: ${r2} vs ${r1} Hz`);
      }
    }
    const swing = (d: number) => C.chorusDelayMs(20, d, Math.PI / 2) - 20;
    assert.ok(near(swing(0.2), 1.2) && near(swing(0.5), 3) && near(swing(1), 6));
    assert.ok(near(C.chorusPeakSlideMsPerS(0.3, 1, F) / C.chorusPeakSlideMsPerS(0.3, 0.5, F), 2, 1e-9));
  });

  it('the drawn slide never strobes (≤ 45 rad/s), and LFO SLOWED shows exactly when the cap bites (0.864 Hz at CLASSIC)', () => {
    for (const depth of [0.2, 0.5, 1]) {
      for (const rate of [0.1, 0.5, 1, 3]) {
        const radPerS = (2 * Math.PI * F * C.chorusPeakSlideMsPerS(rate, depth, F)) / 1000;
        assert.ok(radPerS <= 45 + 1e-9, `${rate} Hz depth ${depth}: ${radPerS}`);
        assert.equal(C.chorusLfoSlowed(rate, depth, F), C.chorusLfoVisHz(rate, depth, F) < rate - 1e-6);
      }
    }
    const cap = 45 / C.chorusSlipPerHz(F, 0.5);
    assert.ok(Math.abs(cap - 0.864) < 0.001);
    assert.ok(!C.chorusLfoSlowed(0.5, 0.5, F), 'the start setting is not slowed');
    assert.ok(C.chorusLfoSlowed(0.87, 0.5, F));
  });

  it('CH-02 stays solved: at every RATE and DEPTH the copy visibly moves within 2 s, wherever you start looking', () => {
    for (const depth of [0.2, 0.5, 1]) {
      for (const rate of [0.1, 0.25, 0.5, 1, 3]) {
        const vis = C.chorusLfoVisHz(rate, depth, F);
        let worst = Infinity;
        for (let s = 0; s < 64; s++) {
          const ph0 = (s / 64) * 2 * Math.PI;
          let lo = Infinity;
          let hi = -Infinity;
          for (let i = 0; i <= 120; i++) {
            const tau = C.chorusDelayMs(20, depth, ph0 + 2 * Math.PI * vis * (2 * i) / 120);
            lo = Math.min(lo, tau);
            hi = Math.max(hi, tau);
          }
          worst = Math.min(worst, (hi - lo) / msPerPx);
        }
        assert.ok(worst >= 10, `${rate} Hz depth ${depth}: the copy moves only ${worst.toFixed(1)} glass units in the stillest 2 s`);
      }
    }
  });

  it('no term depends on a scroll clock: one LFO clock, the dead flanger/phaser/fixed-carrier branches gone', () => {
    assert.doesNotMatch(MOD, /carrier|usePhaseClock\(active, 0\.5\)|kc \* x - pc|lamPx|flavor|stages|trueLag/);
    assert.equal((MOD.match(/usePhaseClock\(/g) ?? []).length, 1);
    assert.match(MOD, /const lfo = usePhaseClock\(active, lfoVisHz\);/);
    assert.match(MOD, /const tau = chorusDelayMs\(ctrG\.value, depthG\.value, lfo\.value\);/);
    assert.match(MOD, /scopeCopy\(\(x - x0\) \* msPerPx, srcHz, tau\)/);
    assert.match(ANIM, /srcHz=\{model\.srcHz \?\? 440\}/);
  });
});
