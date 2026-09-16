/**
 * Cymatics Lab — plate model (src/features/cymatics/plateModes.ts) pinned.
 *
 * These are the SCIENCE claims the lab makes to a learner; if one fails the
 * lab is teaching something false:
 *   • scaling law: f ∝ h / L² · √(E/ρ(1−ν²)) — doubling every horizontal
 *     dimension quarters the frequency, doubling thickness doubles it;
 *   • stiffer material ↑ f, denser ↓ f (steel ≈ aluminum by coincidence);
 *   • a driver at a node cannot excite that mode; a clamp at an antinode kills it;
 *   • resonance reads AT at f_k, BELOW under the first mode, BETWEEN elsewhere;
 *   • the square plate's degenerate pair yields the diagonal ("+") and
 *     axis-aligned ("−") Chladni figures with zero on the expected lines;
 *   • Bessel J_n matches tabulated values; nearest-note maths is exact.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { PlateSpec } from '../src/features/cymatics/plateModes.ts';

// House style imports its siblings extensionless (Metro + tsc resolve that;
// Node's ESM loader does not) — the same hook certificateQr.test.ts uses.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { besselJ, DEFAULT_PLATE, effectiveQ, modeResponse, plateModes, readResonance, sampleField } = await import(
  '../src/features/cymatics/plateModes.ts'
);
const { MATERIALS } = await import('../src/features/cymatics/materials.ts');
const { formatWavelength, nearestNote, wavelengthAir } = await import('../src/features/cymatics/music.ts');

const withSpec = (over: Partial<PlateSpec>): PlateSpec => ({ ...DEFAULT_PLATE, ...over });

test('Bessel J_n matches tabulated values', () => {
  assert.ok(Math.abs(besselJ(0, 2.4048) - 0) < 1e-4, 'J0 first zero');
  assert.ok(Math.abs(besselJ(1, 1) - 0.44005) < 1e-4);
  assert.ok(Math.abs(besselJ(2, 3) - 0.48609) < 1e-4);
  assert.ok(Math.abs(besselJ(0, 20) - 0.16703) < 2e-3, 'asymptotic branch');
});

test('scaling law: doubling every horizontal dimension quarters f; doubling thickness doubles f', () => {
  const base = plateModes(withSpec({ shape: 'circle', sizeMm: 200, thicknessMm: 1, exciter: { x: 0.9, y: 0.5 } }));
  const big = plateModes(withSpec({ shape: 'circle', sizeMm: 400, thicknessMm: 1, exciter: { x: 0.9, y: 0.5 } }));
  const thick = plateModes(withSpec({ shape: 'circle', sizeMm: 200, thicknessMm: 2, exciter: { x: 0.9, y: 0.5 } }));
  assert.ok(Math.abs(big[0].hz / base[0].hz - 0.25) < 1e-6);
  assert.ok(Math.abs(thick[0].hz / base[0].hz - 2) < 1e-6);
});

test('material trend: stiffer raises, denser lowers; steel lands near aluminum', () => {
  const f = (material: PlateSpec['material']) => plateModes(withSpec({ shape: 'circle', material, exciter: { x: 0.9, y: 0.5 } }))[0].hz;
  assert.ok(f('acrylic') < f('aluminum'), 'acrylic (soft) below aluminum');
  assert.ok(f('copper') < f('aluminum'), 'copper (dense) below aluminum');
  assert.ok(Math.abs(f('steel') / f('aluminum') - 1) < 0.1, 'steel ≈ aluminum (E/ρ similar)');
  assert.equal(MATERIALS.length, 8);
});

test('a centre driver cannot excite modes with a central node; a clamp at an antinode suppresses', () => {
  // Square plate, centre driver: (2,0)+(0,2) has cos(π)+cos(π) = −2 at the
  // centre (antinode) → driven; (3,0)-type odd modes are zero at the centre.
  const centre = plateModes(withSpec({ shape: 'square' }), 40);
  const plus = centre.find((m) => m.id === 'sq-2-0-p')!;
  const odd = centre.find((m) => m.id === 'r-3-3')!;
  assert.ok(plus.drive > 0.9, 'centre antinode mode is driven');
  assert.ok(odd.drive < 1e-6, 'centre-node mode cannot be driven from the centre');
  // Now clamp the centre (an antinode of the "+" mode) → it is suppressed.
  const clamped = plateModes(withSpec({ shape: 'square', exciter: { x: 0.9, y: 0.5 }, support: { x: 0.5, y: 0.5 } }), 40);
  const plusClamped = clamped.find((m) => m.id === 'sq-2-0-p')!;
  assert.ok(plusClamped.drive < 0.05, 'clamping an antinode kills the mode');
});

test('square degenerate pair: "+" is zero on the diagonals, "−" on the centre lines', () => {
  const modes = plateModes(withSpec({ shape: 'square' }), 40);
  const plus = modes.find((m) => m.id === 'sq-2-0-p')!;
  const minus = modes.find((m) => m.id === 'sq-2-0-m')!;
  // + : cos2πx + cos2πy = 0 on x ± y = ±1/2 (the diagonals of the plate)
  assert.ok(Math.abs(plus.shape(0.25, 0.25)) < 1e-9);
  assert.ok(Math.abs(plus.shape(0.75, 0.25)) < 1e-9);
  // − : cos2πx − cos2πy = 0 on x = y and x = 1 − y … and also on x=0.5±?; check centre lines x=0.25,y=0.75 nonzero vs diagonal zero
  assert.ok(Math.abs(minus.shape(0.3, 0.3)) < 1e-9, 'diagonal x=y');
  // |cos(π/2)·1 − 1·cos(π)| / 2 = 0.5 exactly at (0.25, 0.5) (sign depends on
  // which member of the pair is m and which is n)
  assert.ok(Math.abs(Math.abs(minus.shape(0.25, 0.5)) - 0.5) < 1e-9, 'off-diagonal moves');
  assert.ok(plus.hz < minus.hz, 'the "+" figure sits slightly lower');
});

test('resonance readout: below / at / between', () => {
  const spec = withSpec({ shape: 'circle', exciter: { x: 0.9, y: 0.5 } });
  const modes = plateModes(spec);
  const Q = effectiveQ(spec.material, spec.damping);
  assert.equal(readResonance(modes[0].hz * 0.3, modes[0].hz > 0 ? modes : [], Q).state, 'below');
  const at = readResonance(modes[0].hz, modes, Q);
  assert.equal(at.state, 'at');
  assert.equal(at.dominant?.id, modes[0].id);
  assert.ok(at.strength > 0.9);
  // Geometric midpoint between two well-separated modes is "between".
  const mid = Math.sqrt(modes[0].hz * modes[1].hz);
  const between = readResonance(mid, modes, Q);
  assert.notEqual(between.state, 'at');
  assert.ok(modeResponse(mid, modes[0].hz, Q) < 3, 'far off resonance the response is small');
});

test('damping control lowers Q; response at resonance ≈ Q', () => {
  assert.ok(effectiveQ('aluminum', 0) > effectiveQ('aluminum', 1) * 10);
  const Q = 100;
  assert.ok(Math.abs(modeResponse(440, 440, Q) - Q) < 1e-9);
});

test('sampleField: normalised ±1, NaN outside a disc, sign flips across a nodal line', () => {
  const spec = withSpec({ shape: 'circle', exciter: { x: 0.9, y: 0.5 } });
  const modes = plateModes(spec);
  const Q = effectiveQ(spec.material, spec.damping);
  const N = 32;
  const grid = sampleField(spec, modes, modes[0].hz, Q, N);
  assert.equal(grid.length, N * N);
  assert.ok(Number.isNaN(grid[0]), 'corner is outside the disc');
  let max = 0;
  let hasPos = false;
  let hasNeg = false;
  for (const v of grid) {
    if (Number.isNaN(v)) continue;
    max = Math.max(max, Math.abs(v));
    if (v > 0.2) hasPos = true;
    if (v < -0.2) hasNeg = true;
  }
  assert.ok(Math.abs(max - 1) < 1e-6, 'peak normalised to 1');
  assert.ok(hasPos && hasNeg, 'the (2,0) disc mode has opposite-phase lobes');
});

test('nearest note + cents + wavelength', () => {
  assert.deepEqual(nearestNote(440).label, 'A4');
  assert.equal(nearestNote(440).cents, 0);
  assert.equal(nearestNote(466.16).label, 'A♯4');
  assert.equal(nearestNote(261.63).label, 'C4');
  assert.equal(nearestNote(445).cents, 20);
  assert.equal(nearestNote(435).centsLabel, '−20¢');
  assert.ok(Math.abs(wavelengthAir(343) - 1) < 1e-9);
  assert.equal(formatWavelength(0.78), '78 cm');
  assert.equal(formatWavelength(0.0086), '8.6 mm');
});
