/**
 * Sound Envelope & Transients — lab-art fix round 3 (2026-10-16). The grading
 * found the snare drawn as a pure decaying sine ("a tom or a sine ping") and
 * the "10 %" tag sitting on the release line and the wave. House rule too:
 * a waveform is real audio at a real time base, drawn min/max per column.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESET_TONES, PRESETS, columnMinMax, envelopeAudio, peakAbs, TONE_FS } from '../src/features/envelope/envelopeModel.ts';

const chart = readFileSync(new URL('../src/screens/lab/envelope/EnvelopeChart.tsx', import.meta.url), 'utf8');

test('the snare is its shell tone PLUS the wires\' noise; a cymbal is mostly noise', () => {
  assert.ok((PRESET_TONES.snare.noise ?? 0) >= 0.5);
  assert.ok((PRESET_TONES.cymbal.noise ?? 0) >= 0.8);
  for (const p of PRESETS) assert.ok(PRESET_TONES[p.id], `${p.id} has a source`);
});

test('envelopeAudio: real pitch at TONE_FS, shaped by the envelope, stable (fixed seed)', () => {
  const snare = PRESETS.find((p) => p.id === 'snare')!;
  const a = envelopeAudio(snare.adsr, PRESET_TONES.snare);
  const b = envelopeAudio(snare.adsr, PRESET_TONES.snare);
  assert.equal(a.length, Math.round((122 / 1000) * TONE_FS));
  assert.deepEqual(Array.from(a.slice(0, 50)), Array.from(b.slice(0, 50)));
  assert.ok(peakAbs(a) <= 1 + 1e-9);
  // A noisy snare is NOT a sinusoid: successive zero crossings are irregular.
  let zc = 0;
  for (let i = 1; i < a.length; i++) if (Math.sign(a[i]) !== Math.sign(a[i - 1])) zc++;
  assert.ok(zc > 3 * 2 * 190 * 0.122, `noise adds crossings (${zc})`);
});

test('columnMinMax brackets every sample of its column', () => {
  const x = new Float32Array([0, 0.5, -0.25, 1, -1, 0.1]);
  const { mn, mx } = columnMinMax(x, 2);
  assert.deepEqual([mn[0], mx[0], mn[1], mx[1]], [-0.25, 0.5, -1, 1]);
});

test('the chart draws that audio min/max per column (never fixed cartoon cycles), with a moiré-safe column count', () => {
  assert.match(chart, /const wave = showWave \? envelopeAudio\(adsr, tone\) : null;/);
  assert.doesNotMatch(chart, /shapedWave\(/);
  assert.match(chart, /Math\.floor\(cycles \/ 3\)/);
});

test('the 10 % / 90 % tags sit in a right gutter past the plot, off the release line', () => {
  assert.match(chart, /const PX1 = W - 10 - \(showRise \? 30 : 0\);/);
  assert.match(chart, /<Tag x=\{W - 4\} y=\{y\(0\.1\) \+ 4\} text="10%"/);
});
