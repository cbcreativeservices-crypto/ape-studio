/**
 * Amplitude colour standard — the worklet ramp `heatRgbW` is pinned to
 * `heatColor` (src/features/tools/levelColor.ts). Per-frame Skia shaders in
 * the Cymatics Lab run on the UI thread and cannot call the JS heatColor, so
 * they use this twin; if either is edited without the other, the lab's heat
 * maps silently leave the house ramp. This test makes that loud.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const C = await import('../src/features/tools/levelColor.ts');

const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

test('heatRgbW equals heatColor sample-for-sample across the ramp', () => {
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const [r, g, b] = C.heatRgbW(t);
    const [er, eg, eb] = hexToRgb(C.heatColor(t));
    assert.ok(Math.abs(r - er) <= 1 && Math.abs(g - eg) <= 1 && Math.abs(b - eb) <= 1, `t=${t.toFixed(3)}: worklet (${r.toFixed(1)},${g.toFixed(1)},${b.toFixed(1)}) vs heatColor (${er},${eg},${eb})`);
  }
});

test('the ramp is black at zero, blue-dominant as soon as there is signal, red at full scale', () => {
  assert.deepEqual(C.heatRgbW(0).map(Math.round), [0, 0, 0]);
  // Just above the black fade the hue is still on the blue side of the ramp.
  const [r, g, b] = C.heatRgbW(0.1);
  assert.ok(b > r && b > g, `blue-dominant at 0.1: (${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`);
  const top = C.heatRgbW(1).map(Math.round);
  assert.deepEqual(top, hexToRgb('#ff5f4e'));
  assert.deepEqual(C.heatRgbW(1.7).map(Math.round), top, 'clamped above 1');
  assert.deepEqual(C.heatRgbW(-0.3).map(Math.round), [0, 0, 0], 'clamped below 0');
});
