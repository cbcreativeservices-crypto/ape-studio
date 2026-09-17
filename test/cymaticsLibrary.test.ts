/**
 * Cymatics Lab — plate MODAL LIBRARY (src/features/cymatics/modalLibrary.ts +
 * the library branch of plateModes.ts) pinned.
 *
 * The science claims the studio makes about the solved shapes; a failure
 * means the lab is teaching something false:
 *   • every shipped file parses: 96×96 grid, 16 elastic modes, λ² ascending,
 *     unit-normalised displacement, exactly zero outside the plate;
 *   • the validated files agree with the exact annulus / bell characteristic
 *     equation to < 0.2 % (Computer B reports ≤ 0.11 %);
 *   • the exact scaling law still holds on a library shape: f ∝ h / L²;
 *   • the mode shape is 0 off the plate and the sampled field is NaN there;
 *   • a driver asked to sit where there is no plate snaps onto it;
 *   • REGRESSION: a rectangle's "centre" exciter is now its centre (the
 *     y / aspect fix in the driver weighting).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { PlateSpec } from '../src/features/cymatics/plateModes.ts';
import type { LibraryFile, LibraryShapeId } from '../src/features/cymatics/modalLibrary.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const L = await import('../src/features/cymatics/modalLibrary.ts');
const P = await import('../src/features/cymatics/plateModes.ts');

const IDS: LibraryShapeId[] = ['triangle', 'hexagon', 'ring', 'ring-clamped-inner', 'bell', 'guitar', 'violin', 'violin-fholes'];
const fileOf = (id: LibraryShapeId): LibraryFile =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../src/data/cymatics/${id}.json`, import.meta.url)), 'utf8')) as LibraryFile;
const shapes = Object.fromEntries(IDS.map((id) => [id, L.parseLibraryFile(fileOf(id))])) as Record<LibraryShapeId, ReturnType<typeof L.parseLibraryFile>>;
// The ESM test runner has no `require`; prime the loader from the parsed files.
for (const id of IDS) L.primeLibraryShape(shapes[id]);
const withSpec = (over: Partial<PlateSpec>): PlateSpec => ({ ...P.DEFAULT_PLATE, ...over });

test('base64 decoder round-trips bytes (no runtime atob assumed)', () => {
  const bytes = L.decodeBase64('AQL/gA==');
  assert.deepEqual(Array.from(bytes), [1, 2, 255, 128]);
  assert.equal(L.decodeBase64('').length, 0);
});

test('every shipped file parses: 96×96, 16 elastic modes, λ² ascending, |W| ≤ 1 and 0 off the plate', () => {
  for (const id of IDS) {
    const s = shapes[id];
    assert.equal(s.nx, 96, `${id} nx`);
    assert.equal(s.ny, 96, `${id} ny`);
    assert.equal(s.modes.length, 16, `${id} mode count`);
    assert.ok(s.modes.every((m) => m.lambda2 > 0), `${id} rigid-body modes discarded`);
    for (let k = 1; k < s.modes.length; k++) assert.ok(s.modes[k].lambda2 >= s.modes[k - 1].lambda2 - 1e-9, `${id} ascending at ${k}`);
    for (const m of s.modes) {
      let max = 0;
      for (let q = 0; q < m.W.length; q++) {
        const v = Math.abs(m.W[q]);
        if (v > max) max = v;
        if (s.mask[q] === 0) assert.equal(m.W[q], 0, `${id}/${m.id} nonzero off the plate`);
      }
      assert.equal(max, 127, `${id}/${m.id} unit-normalised`);
    }
    assert.ok(s.aspect > 0.5 && s.aspect < 2.5, `${id} aspect ${s.aspect}`);
    assert.ok(s.outline.length >= 3, `${id} outline`);
  }
  assert.equal(shapes.ring.holes.length, 1, 'ring carries its hole');
  assert.equal(shapes['violin-fholes'].holes.length, 2, 'violin carries two f-holes');
  assert.ok(shapes.bell.clampedPatch && Math.abs(shapes.bell.clampedPatch.r - 0.06) < 0.005, 'bell post Ø 12 %');
});

test('validated files agree with the exact characteristic equation to < 0.2 %', () => {
  for (const id of ['ring', 'ring-clamped-inner', 'bell'] as const) {
    const raw = fileOf(id);
    assert.ok(shapes[id].validated, `${id} is validated`);
    for (const v of raw.validation ?? []) {
      assert.ok(v.published != null);
      assert.ok(Math.abs(v.lambda2 / (v.published as number) - 1) < 0.002, `${id} ${v.mode}: ${v.lambda2} vs ${v.published}`);
    }
  }
  // The free ring's first λ² is the annulus value, not the free disc's 5.25.
  assert.ok(Math.abs(shapes.ring.modes[0].lambda2 - 18.76) < 0.05);
  assert.ok(!shapes.triangle.validated && !shapes.guitar.validated, 'no published table → Calculated, not Validated');
});

test('library shapes obey the exact scaling law: f ∝ h / L²', () => {
  const base = withSpec({ shape: 'violin', sizeMm: 400, thicknessMm: 3, material: 'wood' });
  const f0 = P.plateModes(base, 16)[0].hz;
  const twiceL = P.plateModes({ ...base, sizeMm: 800 }, 16)[0].hz;
  const twiceH = P.plateModes({ ...base, thicknessMm: 6 }, 16)[0].hz;
  assert.ok(Math.abs(twiceL / f0 - 0.25) < 1e-6, 'double the body length → quarter the frequency');
  assert.ok(Math.abs(twiceH / f0 - 2) < 1e-6, 'double the thickness → double the frequency');
  const modes = P.plateModes(base, 16);
  assert.equal(modes.length, 16);
  for (let k = 1; k < modes.length; k++) assert.ok(modes[k].hz >= modes[k - 1].hz);
  // A 355 mm spruce violin top at 3 mm lands its first free modes in the
  // low hundreds of hertz — the tap tones luthiers actually hear.
  const real = P.plateModes(withSpec({ shape: 'violin', sizeMm: 355, thicknessMm: 3, material: 'wood' }), 3);
  assert.ok(real[0].hz > 40 && real[0].hz < 400, `first violin mode ${real[0].hz.toFixed(0)} Hz`);
});

test('mode shape is 0 off the plate; the sampled field is NaN there and ±1 on it', () => {
  const tri = shapes.triangle;
  const fn = L.libraryShapeFn(tri, tri.modes[0].W);
  // An equilateral triangle in its bounding box: exactly one of the two left
  // corners of the box is off the plate (which one depends on orientation).
  const lowLeft = L.libraryInside(tri, 0.02, 0.02);
  const highLeft = L.libraryInside(tri, 0.02, 0.98);
  assert.notEqual(lowLeft, highLeft, 'one left corner is plate, the other is the corner box');
  assert.equal(fn(0.02, lowLeft ? 0.98 : 0.02), 0, 'the corner box is off the plate');
  assert.equal(fn(1.2, 0.5), 0, 'outside the unit box');
  let hits = 0;
  for (let k = 0; k < 400; k++) if (Math.abs(fn(0.3 + (k % 20) * 0.02, 0.2 + Math.floor(k / 20) * 0.03)) > 0) hits++;
  assert.ok(hits > 200, 'the interior is populated');
  const spec = withSpec({ shape: 'ring' });
  const modes = P.plateModes(spec, 8);
  const Q = P.effectiveQ(spec.material, spec.damping);
  const N = 48;
  const grid = P.sampleField(spec, modes, modes[0].hz, Q, N);
  let peak = 0;
  let nan = 0;
  for (let q = 0; q < grid.length; q++) {
    if (Number.isNaN(grid[q])) nan++;
    else peak = Math.max(peak, Math.abs(grid[q]));
  }
  assert.ok(Math.abs(peak - 1) < 1e-6, 'normalised to ±1');
  assert.ok(nan > N * N * 0.25 && nan < N * N * 0.5, `ring: corners + hole are NaN (${nan})`);
  assert.ok(Number.isNaN(grid[Math.floor(N / 2) * N + Math.floor(N / 2)]), 'the hole is NaN');
  assert.ok(Number.isNaN(grid[0]), 'the corner is NaN');
});

test('a driver asked to sit off the plate snaps onto it, so modes stay excitable', () => {
  const ring = shapes.ring;
  const q = L.librarySnapInside(ring, 0.5, 0.5); // dead centre = the hole
  assert.ok(L.libraryInside(ring, q.x, q.y));
  assert.ok(Math.abs(q.x - 0.5) > 0.1 || Math.abs(q.y - 0.5) > 0.1, 'moved out of the hole');
  const spec = withSpec({ shape: 'ring', exciter: { x: 0.5, y: 0.5 } });
  const modes = P.plateModes(spec, 16);
  assert.ok(modes.some((m) => m.drive > 0.05), 'something is excitable from the snapped driver');
  assert.equal(P.plateAspect(withSpec({ shape: 'guitar' })), shapes.guitar.aspect);
  assert.ok(P.plateAspect(withSpec({ shape: 'violin' })) > 1, 'a violin is taller than it is wide');
});

test('REGRESSION: a rectangle driven at its centre is driven at its centre', () => {
  const spec = withSpec({ shape: 'rect', aspect: 0.7, exciter: { x: 0.5, y: 0.35 } });
  const modes = P.plateModes(spec, 16);
  for (const m of modes) {
    // drive = |shape| at the plate's true centre (0.5, 0.5 in shape units).
    assert.ok(Math.abs(m.drive - Math.min(1, Math.abs(m.shape(0.5, 0.5)))) < 1e-9, `${m.label}: ${m.drive} vs ${m.shape(0.5, 0.5)}`);
  }
});
