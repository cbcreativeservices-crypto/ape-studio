/**
 * Owner 2026-09-29:
 *  - "the wiggly waveform lines … are incorrect and not how waveforms are drawn
 *    … DO NOT draw stylized audio like this ever again." Waveform displays draw
 *    real audio at a real time base (renderOverview), never a handful of slow
 *    cartoon cycles.
 *  - "the led meter colors are not following our color standard." The peak LED
 *    meter lights on the LOUDNESS_STOPS ramp pinned to the absolute dB scale.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderOverview, renderSignal, OVERVIEW_SR, type SignalKey } from '../src/screens/lab/meter/meterEngine.ts';

const peak = (x: number[]) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const crossingsPerSec = (x: number[]) => {
  let c = 0;
  for (let i = 1; i < x.length; i++) if ((x[i - 1] < 0) !== (x[i] < 0)) c++;
  return c / (x.length / OVERVIEW_SR);
};

test('overview audio keeps the meter engine peak (every lesson number unchanged)', () => {
  for (const k of ['sine', 'speech', 'guitar', 'kick', 'snare', 'organ', 'music', 'whitenoise', 'pinknoise'] as SignalKey[]) {
    assert.ok(Math.abs(peak(renderOverview(k)) - peak(renderSignal(k, 2048))) < 1e-9, k);
  }
});

test('overview audio moves at real audio rates, not a few slow wiggles', () => {
  // A 220 Hz tone crosses zero 440×/s; a voice (f0 ~130 Hz + formants) far
  // more than a stylized strip of ~14 cycles could ever show.
  assert.ok(Math.abs(crossingsPerSec(renderOverview('sine')) - 440) < 10);
  for (const k of ['speech', 'guitar', 'organ'] as SignalKey[]) assert.ok(crossingsPerSec(renderOverview(k)) > 200, k);
});

test('WaveformView draws the overview for program material and the beginner view', () => {
  const src = readFileSync('src/screens/lab/meter/vizMeters.tsx', 'utf8');
  assert.match(src, /const overview = p\.plain \|\| !TONES\.includes\(p\.signal\);/);
  assert.match(src, /overview \? renderOverview\(p\.signal\)/);
});

test('the peak LED meter uses the loudness standard, not fixed green/amber/red', () => {
  const src = readFileSync('src/screens/lab/meter/vizMeters.tsx', 'utf8');
  assert.match(src, /const LED_COLS = LOUDNESS_STOPS\.map/);
  assert.doesNotMatch(src, /path=\{litGreen\} color=/);
  assert.doesNotMatch(src, /path=\{litAmber\} color=/);
});
