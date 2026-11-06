/**
 * Batch 4 G1 (2026-11-05): Wave Physics Reflection + Absorption, FREQ fader.
 * The rays were drawn at fixed strength while material loss reached only the
 * pulse dots, so 65 % absorbed looked the same as 14 %. Each reflection order
 * now fades with the energy it still has at the current frequency.
 *
 * vizWave.tsx pulls in Skia, so the two pure helpers are cut out of the real
 * source and run here against the real alphaAt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { alphaAt, type MaterialKey } from '../src/screens/lab/wave/waveEngine.ts';

const read = (p: string) =>
  readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const VIZ = read('src/screens/lab/wave/vizWave.tsx');
const MOD = read('src/screens/lab/wave/modules/modWaveA.tsx');

function loadHelpers() {
  const start = VIZ.indexOf('const RAY_FADE_FLOOR');
  assert.ok(start >= 0, 'RAY_FADE_FLOOR is in vizWave.tsx');
  const fnAt = VIZ.indexOf('export function rayOpacity', start);
  assert.ok(fnAt >= 0, 'rayOpacity is in vizWave.tsx');
  const end = VIZ.indexOf('\n}\n', fnAt) + 3;
  const js = ts.transpileModule(VIZ.slice(start, end).replace(/export function/g, 'function'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function('alphaAt', `${js}\nreturn { orderEnergies, rayOpacity };`)(alphaAt) as {
    orderEnergies: (paths: MaterialKey[][], freq: number) => number[];
    rayOpacity: (base: number, energy: number) => number;
  };
}

/** The opacity each FREQ setting really draws for one material in all four walls. */
function drawn(mat: MaterialKey, freq: number) {
  const { orderEnergies, rayOpacity } = loadHelpers();
  const e = orderEnergies([[], [mat], [mat, mat]], freq);
  return { first: rayOpacity(0.6, e[1]), second: rayOpacity(0.42, e[2]), arrow: rayOpacity(0.65, e[1]) };
}

test('FREQ: the rays are visibly weaker where the wall absorbs more', () => {
  // Carpet: about 14 % absorbed low, 65 %+ absorbed high.
  const low = drawn('carpet', 160);
  const high = drawn('carpet', 800);
  assert.ok(low.first > high.first * 1.4, `1st order ${low.first} vs ${high.first}`);
  assert.ok(low.second > high.second * 1.8, `2nd order ${low.second} vs ${high.second}`);
  assert.ok(low.arrow > high.arrow * 1.4, `arrow ${low.arrow} vs ${high.arrow}`);
});

test('energy is (1−α) per bounce, so 2nd-order rays lose it twice', () => {
  const { orderEnergies } = loadHelpers();
  const a = alphaAt('foam', 1000);
  const e = orderEnergies([[], ['foam'], ['foam', 'foam']], 1000);
  assert.equal(e[0], 1);
  assert.ok(Math.abs(e[1] - (1 - a)) < 1e-9);
  assert.ok(Math.abs(e[2] - (1 - a) ** 2) < 1e-9);
});

test('walls that differ use the mean of the order; an order with no rays stays full', () => {
  const { orderEnergies } = loadHelpers();
  const e = orderEnergies([['concrete'], ['foam']], 1000);
  const want = (1 - alphaAt('concrete', 1000) + (1 - alphaAt('foam', 1000))) / 2;
  assert.ok(Math.abs(e[1] - want) < 1e-9);
  assert.equal(e[2], 1);
});

test('a ray never vanishes, even when the wall takes everything', () => {
  const { rayOpacity } = loadHelpers();
  assert.ok(rayOpacity(0.42, 0) >= 0.12);
  assert.ok(rayOpacity(0.6, 0) >= 0.18);
  assert.equal(rayOpacity(0.6, 1), 0.6);
  assert.equal(rayOpacity(0.6, 5), 0.6); // never brighter than the design strength
});

test('concrete barely moves at any FREQ, which is why the screen says so', () => {
  const low = drawn('concrete', 125);
  const high = drawn('concrete', 4000);
  assert.ok(Math.abs(low.first - high.first) < 0.02);
  const words = MOD.slice(MOD.indexOf('export function ReflectionModule'), MOD.indexOf('MODULE 2 — ABSORPTION')).replace(/\s+/g, ' ');
  assert.match(words, /mat === 'concrete' \?/);
  assert.match(words, /Concrete reflects nearly the same at every frequency/);
  assert.match(words, /Pick another MAT/);
});

test('every reflection layer is wired to the energy, the direct ray is not', () => {
  for (const order of [1, 2]) {
    const line = VIZ.split('\n').find((l) => l.includes(`path={rays.byOrder[${order}]}`)) ?? '';
    assert.match(line, new RegExp(`opacity=\\{rayOp\\(0\\.\\d+, ${order}\\)\\}`), line);
    const arrow = VIZ.split('\n').find((l) => l.includes(`path={rays.arrows[${order}]}`)) ?? '';
    assert.match(arrow, new RegExp(`opacity=\\{rayOp\\(0\\.\\d+, ${order}\\)\\}`), arrow);
  }
  assert.match(VIZ, /<GlowStroke path=\{rays\.byOrder\[0\]\} color=\{RAY_COLORS\[0\]\} width=\{1\.6\} opacity=\{0\.85\} \/>/);
  assert.match(VIZ, /<Path path=\{rays\.arrows\[0\]\} color=\{RAY_COLORS\[0\]\} opacity=\{0\.9\} \/>/);
});

test('only Reflection, Absorption and Reverberation opt in, so every other room is unchanged', () => {
  assert.match(VIZ, /p\.raysShowLoss && rays \? rayOpacity\(base, rays\.energy\[order\]\) : base/);
  assert.equal(MOD.match(/^\s+raysShowLoss$/gm)?.length, 2);
  const inside = (from: string, to: string) => MOD.slice(MOD.indexOf(from), MOD.indexOf(to));
  assert.match(inside('export function ReflectionModule', 'export function AbsorptionModule'), /^\s+raysShowLoss$/m);
  assert.match(inside('export function AbsorptionModule', 'export function DiffusionModule'), /^\s+raysShowLoss$/m);
  // Reverb joined them on the owner's go (section 5, 2026-11-05): its rays fade the same way.
  assert.equal(read('src/screens/lab/wave/modules/modWaveB.tsx').match(/^\s+raysShowLoss$/gm)?.length, 1);
});

test('Diffusion: ENERGY RETURNED stays SAME ON OR OFF, the fan keeps its fixed strength', () => {
  // The energy is read before the diffuser branch and from the walls alone.
  const memo = VIZ.slice(VIZ.indexOf('const rays = useMemo'));
  const push = memo.indexOf('bouncedOff.push(img.bounces.map((b) => scene.boundary[b]))');
  const branch = memo.indexOf('const sIdx = scatterWall == null');
  assert.ok(push >= 0 && branch > push);
  assert.match(VIZ, /<Path path=\{rays\.scatter\} color=\{RAY_COLORS\[1\]\} style="stroke" strokeWidth=\{0\.9\} opacity=\{0\.5\} \/>/);
});
