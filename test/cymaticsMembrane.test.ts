/**
 * Cymatics Lab — membrane + loudspeaker model (src/features/cymatics/membrane.ts)
 * pinned. The science claims Phase 3 makes to a learner; a failure means the
 * lab is teaching something false:
 *   • an ideal clamped membrane's modes sit at the Bessel-zero ratios
 *     1 : 1.594 : 2.136 : 2.296 : 2.653 — NOT a harmonic series;
 *   • f ∝ √T, ∝ 1/R, ∝ 1/√σ — tighter, smaller, lighter → higher;
 *   • a centre strike drives only the n = 0 ring modes; an off-centre strike
 *     wakes the (1,1) mode the timpanist tunes to;
 *   • a kettle pulls the principal series to ≈ 1 : 1.5 : 2 : 2.5 (Rossing);
 *   • the sampled head is ±1 on the disc and NaN outside it;
 *   • the cone ladder is monotonic in frequency, the piston band has the
 *     1/f² excursion law, and ka = π f D / c.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { MembraneSpec } from '../src/features/cymatics/membrane.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const M = await import('../src/features/cymatics/membrane.ts');
const spec = (o: Partial<MembraneSpec> = {}): MembraneSpec => ({ ...M.DEFAULT_MEMBRANE, ...o });
const byId = (modes: ReturnType<typeof M.membraneModes>, n: number, s: number) => modes.find((m) => m.n === n && m.s === s)!;

test('ideal membrane: Bessel-zero ratios, not harmonics', () => {
  const modes = M.membraneModes(spec({ kettle: false, strike: { r: 0.4, thetaDeg: 20 } }), 40);
  const f01 = byId(modes, 0, 1).hz;
  const ratios = [
    [1, 1, 1.594],
    [2, 1, 2.136],
    [0, 2, 2.296],
    [3, 1, 2.653],
    [1, 2, 2.918],
  ] as const;
  for (const [n, s, expect] of ratios) assert.ok(Math.abs(byId(modes, n, s).hz / f01 - expect) < 0.003, `(${n},${s}) ratio`);
  assert.ok(Math.abs(M.fundamentalHz(spec()) - f01) < 1e-9, 'fundamentalHz is the (0,1) mode');
  // A 14" Mylar head at 3 kN/m lands in the low hundreds of hertz.
  assert.ok(f01 > 60 && f01 < 400, `f01 = ${f01.toFixed(0)} Hz`);
});

test('scaling: f ∝ √T, 1/R, 1/√σ', () => {
  const base = spec({ kettle: false });
  const f = M.fundamentalHz(base);
  assert.ok(Math.abs(M.fundamentalHz({ ...base, tensionNpm: base.tensionNpm * 4 }) / f - 2) < 1e-9, 'four times the tension → twice the pitch');
  assert.ok(Math.abs(M.fundamentalHz({ ...base, diameterMm: base.diameterMm * 2 }) / f - 0.5) < 1e-9, 'twice the diameter → half the pitch');
  const heavy = M.fundamentalHz({ ...base, head: 'calfskin' });
  const light = M.fundamentalHz({ ...base, head: 'latex' });
  assert.ok(heavy < f && light > f, 'heavier head lower, lighter head higher');
});

test('strike point: centre → only ring modes; off-centre → the (1,1) pitch mode wakes', () => {
  const centre = M.membraneModes(spec({ strike: { r: 0, thetaDeg: 0 } }), 40);
  for (const m of centre) {
    if (m.n === 0) assert.ok(m.drive > 0.5, `(0,${m.s}) driven from the centre`);
    else assert.ok(m.drive < 1e-6, `(${m.n},${m.s}) silent from the centre`);
  }
  const quarter = M.membraneModes(spec({ strike: { r: 0.25, thetaDeg: 0 } }), 40);
  assert.ok(byId(quarter, 1, 1).drive > 0.3, '(1,1) driven from a quarter-radius strike');
});

test('kettle: the principal series goes near-harmonic (Rossing) and (0,1) is damped', () => {
  const k = M.membraneModes(spec({ kettle: true, strike: { r: 0.25, thetaDeg: 0 } }), 40);
  const f11 = byId(k, 1, 1).hz;
  assert.ok(Math.abs(byId(k, 2, 1).hz / f11 - 1.5) < 0.01);
  assert.ok(Math.abs(byId(k, 3, 1).hz / f11 - 2.0) < 0.02);
  assert.ok(Math.abs(byId(k, 4, 1).hz / f11 - 2.44) < 0.02);
  assert.ok(byId(k, 0, 1).drive < byId(M.membraneModes(spec({ kettle: false, strike: { r: 0.25, thetaDeg: 0 } }), 40), 0, 1).drive, 'the bowl damps the ring mode');
  const bare = M.membraneModes(spec({ kettle: false }), 40);
  assert.ok(Math.abs(byId(bare, 2, 1).hz / byId(bare, 1, 1).hz - 1.34) < 0.01, 'without the kettle the same pair is 1.34, not 1.5');
});

test('sampled head: ±1 on the disc, NaN outside, at-resonance strength ≈ 1', () => {
  const s = spec({ strike: { r: 0.3, thetaDeg: 30 } });
  const modes = M.membraneModes(s, 16);
  const Q = M.membraneQ(s);
  const target = byId(modes, 1, 1);
  // Odd N so the centre cell sits exactly on x = 0.5 — the (1,1) nodal diameter.
  const N = 41;
  const grid = M.sampleMembrane(modes, target.hz, Q, N);
  assert.ok(Number.isNaN(grid[0]) && Number.isNaN(grid[N - 1]), 'corners are off the head');
  let peak = 0;
  for (const v of grid) if (!Number.isNaN(v)) peak = Math.max(peak, Math.abs(v));
  assert.ok(Math.abs(peak - 1) < 1e-6);
  // (1,1) has a nodal diameter through the centre, so its own contribution
  // there is 0; what remains is the honest off-resonance leak of the ring
  // modes (0,1) and (0,2), which the quarter-radius strike also excites —
  // small against the (1,1) lobes, not zero.
  assert.ok(Math.abs(grid[Math.floor(N / 2) * N + Math.floor(N / 2)]) < 0.35, 'centre near the nodal diameter');
  const st = M.membraneStrength(modes, target.hz, Q);
  assert.equal(st.dominant?.id, target.id);
  assert.ok(st.strength > 0.3);
  assert.ok(M.membraneQ(spec({ damping: 1 })) < M.membraneQ(spec({ damping: 0 })), 'a hand on the head lowers Q');
});

test('loudspeaker: ladder monotonic in f, 1/f² piston excursion, ka = πfD/c', () => {
  const d = M.DRIVER_BY_ID.woofer200;
  const freqs = [10, 30, 40, 60, 200, 500, 900, 1300, 3000];
  const nums = freqs.map((f) => M.CONE_STAGE_NUM[M.readCone(d, f).stage]);
  for (let i = 1; i < nums.length; i++) assert.ok(nums[i] >= nums[i - 1], `stage order at ${freqs[i]} Hz`);
  assert.equal(M.readCone(d, 40).stage, 'resonance');
  assert.equal(M.readCone(d, 3000).stage, 'breakup');
  const a = M.readCone(d, 200);
  const b = M.readCone(d, 400);
  assert.equal(a.stage, 'piston');
  assert.ok(Math.abs(b.excursion / a.excursion - 0.25) < 0.03, 'excursion ∝ 1/f² in the piston band');
  assert.ok(Math.abs(M.readCone(d, 546).ka - 1) < 0.01, 'ka = 1 at c / (π D)');
  assert.ok(M.readCone(M.DRIVER_BY_ID.tweeter25, 15000).stage !== 'breakup', 'a metal dome is still pistonic at 15 kHz');
  const cone = M.sampleCone(M.readCone(d, 3000), 24);
  let nan = 0;
  for (const v of cone) if (Number.isNaN(v)) nan++;
  assert.ok(nan > 24 * 24 * 0.15, 'cone sampled on a disc');
});
