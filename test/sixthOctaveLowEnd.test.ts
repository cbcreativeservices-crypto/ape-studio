/**
 * 61-band RTA low end (owner 2026-09-29: "I use the RTA in my class to show low
 * end rumble — I want those low Hz to be showing always"). Sub-bin 1/6-oct
 * bands are now shown (flagged `estimated`) instead of grayed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveSixthOctave, NO_LEVEL, SIXTH_BANDS, SIXTH_CENTERS } from '../src/features/tools/sixthOctave.ts';

const SR = 48000;

function spectrumWithTone(fft: number, hz: number, db: number): Float32Array {
  const spec = new Float32Array(fft / 2).fill(-140);
  spec[Math.round(hz / (SR / fft))] = db;
  return spec;
}

function derive(spec: Float32Array, fft: number) {
  const hold = new Float64Array(SIXTH_BANDS).fill(NO_LEVEL);
  return deriveSixthOctave(spec, SR, fft, 1, { current: null }, hold);
}

test('at FFT 8192 every band from 20 Hz up shows a level — none grayed', () => {
  const b = derive(spectrumWithTone(8192, 1000, -20), 8192);
  const firstNyq = SIXTH_CENTERS.findIndex((c) => c / Math.pow(2, 1 / 12) >= SR / 2);
  const upTo = firstNyq === -1 ? SIXTH_BANDS : firstNyq;
  for (let k = 0; k < upTo; k++) assert.equal(b.resolvable[k], true, `band ${SIXTH_CENTERS[k].toFixed(1)} Hz`);
});

test('the sub-bass bands are flagged estimated; the mids are not', () => {
  const b = derive(spectrumWithTone(8192, 1000, -20), 8192);
  assert.equal(b.estimated![0], true); // 20 Hz
  assert.equal(b.estimated![SIXTH_CENTERS.findIndex((c) => c >= 1000)], false);
});

test('a 25 Hz rumble lands in the low bands, loudest near 25 Hz', () => {
  const b = derive(spectrumWithTone(8192, 25, -20), 8192);
  let best = 0;
  for (let k = 1; k < SIXTH_BANDS; k++) if (b.levelsDb[k] > b.levelsDb[best]) best = k;
  assert.ok(SIXTH_CENTERS[best] >= 20 && SIXTH_CENTERS[best] <= 32, `loudest at ${SIXTH_CENTERS[best]} Hz`);
  assert.ok(b.levelsDb[best] > -40, `level ${b.levelsDb[best]}`);
});

test('energy is shared, never invented: band powers sum to the bin power', () => {
  const fft = 8192;
  const b = derive(spectrumWithTone(fft, 25, -20), fft);
  let sum = 0;
  for (let k = 0; k < SIXTH_BANDS; k++) if (b.levelsDb[k] > NO_LEVEL) sum += Math.pow(10, b.levelsDb[k] / 10);
  const floor = (fft / 2 - 1) * Math.pow(10, -14); // the −140 dB floor bins
  const tone = Math.pow(10, -2);
  assert.ok(sum <= tone + floor + 1e-9, `sum ${sum}`);
  assert.ok(sum >= tone * 0.99, `sum ${sum}`);
});
