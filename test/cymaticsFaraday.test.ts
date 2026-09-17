/**
 * Cymatics Lab — Faraday model (src/features/cymatics/faraday.ts) pinned.
 *
 * The science claims the Liquid Studio makes; a failure means the lab is
 * teaching something false:
 *   • dispersion recovers the gravity-wave and capillary-wave limits;
 *   • the response is the SUBHARMONIC: f/2;
 *   • the onset threshold rises with viscosity (glycerin ≫ water) and depth
 *     changes it (shallow layers damp more);
 *   • dish modes come from the right Bessel zeros (pinned vs free);
 *   • the stage ladder is monotonic in acceleration;
 *   • pattern families follow the published map (water → squares; oil →
 *     stripes; two-frequency → quasiperiodic; small dish → dish modes);
 *   • cornstarch shear-thickens (effective ν rises with a) and gel is
 *     honestly "no pattern in range".
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { LiquidSpec } from '../src/features/cymatics/faraday.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const F = await import('../src/features/cymatics/faraday.ts');
const { LIQUIDS, kinematicViscosity, LIQUID_BY_ID } = await import('../src/features/cymatics/liquids.ts');

const spec = (o: Partial<LiquidSpec> = {}): LiquidSpec => ({ ...F.DEFAULT_LIQUID, ...o });

test('dispersion: gravity limit ω²≈gk (deep, long waves) and capillary limit ω²≈σk³/ρ', () => {
  const g = F.G;
  const kG = 5; // λ ≈ 1.26 m, deep water (d = 10 m)
  assert.ok(Math.abs(F.omegaOf(kG, 10, 0.0728, 998) ** 2 / (g * kG) - 1) < 0.01);
  const kC = 20000; // λ ≈ 0.3 mm
  assert.ok(Math.abs(F.omegaOf(kC, 0.01, 0.0728, 998) ** 2 / ((0.0728 * kC ** 3) / 998) - 1) < 0.01);
  // solveK inverts omegaOf
  const w = 2 * Math.PI * 25;
  const k = F.solveK(w, 0.004, 0.0728, 998);
  assert.ok(Math.abs(F.omegaOf(k, 0.004, 0.0728, 998) / w - 1) < 1e-6);
});

test('the Faraday response is the subharmonic, f/2, and λ shrinks with frequency', () => {
  const r40 = F.readFaraday(spec(), 40, 0.5);
  const r80 = F.readFaraday(spec(), 80, 0.5);
  assert.equal(r40.responseHz, 20);
  assert.equal(r80.responseHz, 40);
  assert.ok(r80.lambdaMm < r40.lambdaMm);
  assert.ok(r40.lambdaMm > 5 && r40.lambdaMm < 30, `water at 40 Hz drive: λ ≈ ${r40.lambdaMm.toFixed(1)} mm`);
});

test('onset threshold: water is modest, glycerin mix higher, pure gel out of range; shallower layers damp more', () => {
  const water = F.readFaraday(spec({ liquid: 'water' }), 40, 0.3).thresholdG;
  const gly = F.readFaraday(spec({ liquid: 'glycerin50' }), 40, 0.3).thresholdG;
  const gel = F.readFaraday(spec({ liquid: 'gel' }), 40, 0.3).thresholdG;
  assert.ok(water > 0.03 && water < 0.6, `water a_c ≈ ${water.toFixed(2)} g`);
  assert.ok(gly > water * 1.5, 'glycerin mix needs more');
  assert.ok(gel > 2.5, 'gel is out of this rig’s range');
  const shallow = F.readFaraday(spec({ depthMm: 2 }), 40, 0.3).thresholdG;
  const deep = F.readFaraday(spec({ depthMm: 15 }), 40, 0.3).thresholdG;
  assert.ok(shallow > deep, 'a thin layer damps harder (bottom boundary layer)');
  // Pinned contact line damps more than a free one.
  const pinned = F.readFaraday(spec({ contact: 'pinned' }), 40, 0.3).thresholdG;
  const free = F.readFaraday(spec({ contact: 'free' }), 40, 0.3).thresholdG;
  assert.ok(pinned > free);
});

test('dish modes: first ring mode uses the right Bessel zero for pinned vs free contact lines', () => {
  const R = 0.05;
  const pinned = F.containerModes(spec({ contact: 'pinned', sizeMm: 100 }), 1e4).find((m) => m.id === 'c-0-0')!;
  const free = F.containerModes(spec({ contact: 'free', sizeMm: 100 }), 1e4).find((m) => m.id === 'c-0-0')!;
  assert.ok(Math.abs(pinned.k * R - 2.4048) < 1e-3);
  assert.ok(Math.abs(free.k * R - 3.8317) < 1e-3);
  const square = F.containerModes(spec({ shape: 'square', sizeMm: 100 }), 1e4).find((m) => m.id === 's-1-0')!;
  assert.ok(Math.abs(square.k - Math.PI / 0.1) < 1e-6);
  // Sorted ascending
  const ms = F.containerModes(spec());
  for (let i = 1; i < ms.length; i++) assert.ok(ms[i].hz >= ms[i - 1].hz);
});

test('stage ladder is monotonic in acceleration for water', () => {
  const order = ['flat', 'sloshing', 'ripples', 'onset', 'stable', 'transition', 'mixed', 'unstable', 'chaotic', 'splash'];
  const s = spec({ liquid: 'water', wallMm: 40 });
  let last = -1;
  for (let a = 0.005; a <= 1.5; a *= 1.12) {
    const st = F.readLiquid(s, 50, a).stage;
    const idx = order.indexOf(st);
    assert.ok(idx >= 0, `unexpected stage ${st}`);
    // sloshing may be skipped (depends on a nearby dish mode) but never regress
    assert.ok(idx >= last, `stage regressed from ${order[last]} to ${st} at a=${a.toFixed(3)} g`);
    last = idx;
  }
  assert.ok(last >= order.indexOf('unstable'), 'reaches the high-drive stages within 1.5 g');
});

test('pattern families follow the published map', () => {
  const nuWater = kinematicViscosity(LIQUID_BY_ID.water);
  const nuOil = kinematicViscosity(LIQUID_BY_ID.mineral_light);
  assert.equal(F.bulkFamily(nuWater, 40, false), 'squares');
  assert.equal(F.bulkFamily(nuWater, 120, false), 'stripes');
  assert.equal(F.bulkFamily(nuOil, 40, false), 'stripes');
  assert.equal(F.bulkFamily(kinematicViscosity(LIQUID_BY_ID.glycerin50), 30, false), 'hexagons');
  assert.equal(F.bulkFamily(nuWater, 40, true), 'quasiperiodic');
  // A large dish at high frequency is bulk regime → squares for water.
  const big = F.readLiquid(spec({ sizeMm: 300 }), 60, 0.3);
  assert.equal(big.stage === 'stable' || big.stage === 'onset' || big.stage === 'transition', true);
  assert.equal(['squares', 'stripes'].includes(big.family), true);
  // A small dish at low frequency: the dish's own modes win.
  const small = F.readLiquid(spec({ sizeMm: 60 }), 20, 0.25);
  if (small.stage === 'stable' || small.stage === 'onset') assert.ok(['rings', 'lobes', 'spokes', 'star'].includes(small.family), `small dish family ${small.family}`);
});

test('cornstarch shear-thickens; gel is honestly "damped"', () => {
  const s = spec({ liquid: 'cornstarch' });
  assert.ok(F.effectiveNu(s, 0.5) > F.effectiveNu(s, 0.1) * 3);
  const st = F.readLiquid(s, 40, 0.8);
  assert.equal(st.stage, 'damped');
  assert.equal(F.readLiquid(spec({ liquid: 'gel' }), 40, 1.0).stage, 'damped');
  assert.equal(LIQUIDS.length, 8);
});

test('surface basis: normalised ±1, NaN outside the dish, rings are axisymmetric, quadrature partner differs', () => {
  const s = spec();
  const N = 32;
  const k = F.readFaraday(s, 40, 0.3).k;
  const rings = F.sampleSurface(s, 'rings', k, null, N);
  assert.ok(Number.isNaN(rings[0]));
  let max = 0;
  for (const v of rings) if (!Number.isNaN(v)) max = Math.max(max, Math.abs(v));
  assert.ok(Math.abs(max - 1) < 1e-6);
  const c = N / 2;
  const a = rings[(c - 4) * N + c];
  const b = rings[c * N + (c - 4)];
  assert.ok(Math.abs(a - b) < 0.05, 'axisymmetric');
  const sq = F.sampleSurface(s, 'squares', k, null, N);
  const sqB = F.sampleSurface(s, 'squares', k, null, N, true);
  let diff = 0;
  for (let i = 0; i < sq.length; i++) if (!Number.isNaN(sq[i])) diff += Math.abs(sq[i] - sqB[i]);
  assert.ok(diff > 10, 'quadrature basis is a different field');
  const caus = F.causticMap(sq, N);
  assert.equal(caus.length, N * N);
  assert.ok(Number.isNaN(caus[0]));
});
