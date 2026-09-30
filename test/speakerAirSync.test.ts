/**
 * Owner 2026-09-29 (Start Here lesson 1): "make sure that when we show a
 * speaker moving that it is in sync with the waveform or particle display next
 * to it … the speaker looks out of time to the particles movement and the
 * color bands representing pressure."
 *
 * The wave must be born where the drawn AIR begins, so the molecules beside
 * the cone move with it (cone: A·sin ωt; air at its left edge: A·sin(ωt − 0)).
 * Starting it at the cone mouth — a blank strip short of the first molecule —
 * put the nearest molecules ~⅓ cycle behind the cone.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('three-window view: wave origin = the air window edge, no air phase shift', () => {
  const v = readFileSync('src/screens/lab/foundations/viz.tsx', 'utf8');
  assert.match(v, /const originX = spkW \+ gap;/);
  assert.match(v, /const airPhasePx = 0;/);
  // Cone and air share one clock and the same sine law.
  assert.match(v, /off = amp \* excMax \* Math\.sin\(2 \* Math\.PI \* visHz \* t\)/);
  assert.match(v, /dx = amp \* dispMax \* Math\.sin\(om \* t - k \* \(xs\[i\] \+ phasePx\)\)/);
});

test('Start Here lab step 1: the graph starts at the air edge too', () => {
  const p = readFileSync('src/screens/startHere/pages.tsx', 'utf8');
  assert.match(p, /originX=\{srcW \+ 6\}/);
  assert.match(p, /flexDirection: 'row', alignItems: 'center', gap: 6 \}/);
});

test('Digital lab: one compression + one rarefaction per cone cycle, whole-cycle flight', () => {
  const v = readFileSync('src/screens/lab/digital/vizSignal.tsx', 'utf8');
  assert.match(v, /const age = ph \/ \(2 \* Math\.PI\) - idx \/ 2;/);
  assert.match(v, /const travel = count \/ 2;/);
  assert.doesNotMatch(v, /const frac0 = idx \/ count;/);
  // Model check (count = 6, flight = 3 cycles): band idx is born when
  // θ/2π − idx/2 ≡ 0 (mod 3). Compressions (even idx 0,2,4) → cycles 0,1,2:
  // one per cycle, at θ ≡ 0 where the cone (sin θ) crosses centre moving
  // forward. Rarefactions (odd idx) → half-cycles.
  const count = 6, travel = count / 2;
  const birthCycle = (idx: number) => ((idx / 2) % travel + travel) % travel;
  assert.deepEqual([0, 2, 4].map(birthCycle), [0, 1, 2]);
  assert.deepEqual([1, 3, 5].map(birthCycle), [0.5, 1.5, 2.5]);
});
