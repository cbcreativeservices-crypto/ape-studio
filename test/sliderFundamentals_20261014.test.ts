/**
 * Slider audit part 2 (2026-10-14) — Fundamentals labs' faders.
 * Owner: the bottom-dock slider "seemed like it didn't change anything, or it
 * didn't progress smoothly/equally/incrementally".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { samplingZoom, ZOOM_MAX_CYCLES, ZOOM_MIN_CYCLES } from '../src/screens/lab/digital/samplingZoom.ts';
import { HEAT_COARSE_SCALE, heatGridDims } from '../src/screens/lab/wave/heatGrid.ts';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** Old mapping, kept here only to prove the dead zone it had. */
const oldZoom = (zoomV: number, spc: number) => {
  const cycles = Math.min(60, Math.max(0.3, (12 + zoomV * 408) / spc));
  return { cycles, nShown: Math.round(cycles * spc) };
};

test('SAMPLING ZOOM: every step of travel changes the view (no dead zone near Nyquist)', () => {
  // 48 kHz with the input swept toward 30 kHz (spc 1.6), 4×-rate mode (spc 4),
  // 1 kHz (spc 48), and a low 100 Hz tone at 192 kHz (spc 1920 — clamped both
  // ways; one honest view only).
  for (const spc of [1.6, 2, 4, 48, 480]) {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const { cycles } = samplingZoom(i / 100, spc);
      assert.ok(cycles > prev, `spc ${spc}: step ${i} did not change the view`);
      assert.ok(cycles >= ZOOM_MIN_CYCLES - 1e-9 && cycles <= ZOOM_MAX_CYCLES + 1e-9);
      prev = cycles;
    }
  }
  // The old mapping really was dead for 80 % of the lane at spc 1.6.
  assert.equal(oldZoom(0.25, 1.6).cycles, oldZoom(1, 1.6).cycles);
});

test('SAMPLING ZOOM: the ends are unchanged where the old window was not clamped', () => {
  for (const spc of [30, 34]) {
    assert.ok(Math.abs(samplingZoom(0, spc).nShown - oldZoom(0, spc).nShown) <= 1);
    assert.ok(Math.abs(samplingZoom(1, spc).nShown - oldZoom(1, spc).nShown) <= 1);
  }
  // Even linear steps in samples shown.
  const a = samplingZoom(0.25, 48).nShown - samplingZoom(0, 48).nShown;
  const b = samplingZoom(1, 48).nShown - samplingZoom(0.75, 48).nShown;
  assert.ok(Math.abs(a - b) <= 1);
  // Bad input never throws or prints NaN.
  assert.ok(Number.isFinite(samplingZoom(Number.NaN, 0).cycles));
  assert.ok(Number.isFinite(samplingZoom(0.5, 1920).cycles));
});

test('modAnalog uses the shared zoom mapping', () => {
  const s = src('src/screens/lab/digital/modules/modAnalog.tsx');
  assert.match(s, /samplingZoom\(zoomV, spc\)/);
  assert.doesNotMatch(s, /Math\.min\(60, Math\.max\(0\.3, nShownTarget/);
});

test('Wave heat map: full detail at rest, ~1/9 the cells while a fader moves', () => {
  const full = heatGridDims(360, 240, 1, false);
  assert.deepEqual(full, { cols: 138, rows: 92 }); // the original rule at phone size
  const big = heatGridDims(2000, 1600, 3, false);
  assert.deepEqual(big, { cols: Math.round(176 * 2.2), rows: Math.round(140 * 2.2) });
  const coarse = heatGridDims(360, 240, 1, true);
  assert.equal(coarse.cols, Math.round(138 * HEAT_COARSE_SCALE));
  assert.equal(coarse.rows, Math.round(92 * HEAT_COARSE_SCALE));
  assert.ok((coarse.cols * coarse.rows) / (full.cols * full.rows) < 0.15);
  const v = src('src/screens/lab/wave/vizWave.tsx');
  assert.match(v, /heatGridDims\(geo\.wPx, geo\.hPx, ts, heatCoarse\)/);
  assert.match(v, /setTimeout\(\(\) => setHeatSettledSig\(heatSig\), HEAT_SETTLE_MS\)/);
});

test('Proximity DISTANCE lane never claims a boost in OMNI', () => {
  const s = src('src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx');
  assert.match(s, /!directional \? `\$\{inches\} in · omni — no boost`/);
});

test('Room treatment THICK / SIZE are LOCKED with a reason when nothing is in the room', () => {
  const s = src('src/screens/lab/roomdesign/modules/modTreatment.tsx');
  assert.equal((s.match(/locked: sel \? undefined : NO_ITEM_LOCK/g) ?? []).length, 2);
});
