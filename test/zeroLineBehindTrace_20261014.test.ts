/**
 * Owner bug report 2026-10-14 (Speech lab, Plosives): the zero/centre line was
 * drawn ON TOP of the waveform, so during a big swing a flat line cut through
 * it and ONE signal read as two ("a pressure wave on top of another pressure
 * wave"). Bad teaching, eliminated app-wide.
 *
 * Ratchet (source order): in every waveform fixed in the 2026-10-14 sweep the
 * zero line is rendered BEFORE (behind) the trace, never after it; and the
 * Envelope Lab draws its envelope on the waveform's own scale (it is the
 * wave's outline, not a second line through the middle of it).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** Text from `start` up to (not including) `end`, both required. */
function slice(src: string, start: string, end: string, what: string): string {
  const a = src.indexOf(start);
  assert.ok(a >= 0, `${what}: start anchor not found (${start})`);
  const b = src.indexOf(end, a + start.length);
  assert.ok(b > a, `${what}: end anchor not found (${end})`);
  return src.slice(a, b);
}

/** Every zero-line match in `body` must come before the first trace match. */
function zeroBehindTrace(body: string, zero: RegExp, trace: RegExp, what: string) {
  const t = body.search(trace);
  assert.ok(t >= 0, `${what}: trace not found`);
  const zs = [...body.matchAll(new RegExp(zero.source, 'g'))].map((m) => m.index ?? -1);
  assert.ok(zs.length > 0, `${what}: zero line not found`);
  for (const z of zs) assert.ok(z < t, `${what}: the zero line is drawn AFTER the trace — it must sit behind it`);
}

test('Drum Tuning waveform: zero line behind the min/max columns', () => {
  const src = read('src/screens/lab/drumtuning/stagesSignal.tsx');
  const body = slice(src, 'export function WaveStage', 'export const PART_H', 'WaveStage');
  zeroBehindTrace(body, /<Line x1=\{x0\} y1=\{mid\} x2=\{x1\} y2=\{mid\}/, /ov\.hi\.map\(/, 'drumtuning WaveStage');
});

test('Mastering waveform overview: zero line behind the min/max columns', () => {
  const src = read('src/screens/lab/mastering/stages.tsx');
  const body = slice(src, 'export function WaveOverviewStage', 'export const CONTROL_ASPECT', 'WaveOverviewStage');
  zeroBehindTrace(body, /<Line x1=\{x0\} y1=\{mid\} x2=\{x1\} y2=\{mid\}/, /ov\.hi\.map\(/, 'mastering WaveOverviewStage');
});

test('Mastering playback/editing view: zero line behind the programme', () => {
  const src = read('src/screens/lab/mastering/stages.tsx');
  const body = slice(src, "frame('PLAYBACK & EDITING", '</Svg>', 'playback view');
  zeroBehindTrace(body, /<Line x1=\{x0 \+ 4\} y1=\{midY\} x2=\{x1 - 4\} y2=\{midY\}/, /ov\.hi\.map\(/, 'mastering playback view');
});

test('Tools hub live waveform tile: centre line is chrome UNDER the trace', () => {
  const src = read('src/screens/tools/hubPreviewsLive.tsx');
  assert.doesNotMatch(src, /WAVE_CHROME_OVER/, 'the centre line must not be drawn over the waveform');
  const under = slice(src, 'const WAVE_CHROME_UNDER', 'function buildEnvelope', 'WAVE_CHROME_UNDER');
  assert.match(under, /y1=\{512\} x2=\{1924\} y2=\{512\}/, 'the zero line lives in the under-chrome');
  const mini = slice(src, 'const HubWaveMini', 'HubWaveMini.displayName', 'HubWaveMini');
  zeroBehindTrace(mini, /\{WAVE_CHROME_UNDER\}/, /<Polygon/, 'hub waveform mini');
  assert.doesNotMatch(mini.slice(mini.search(/<Polygon/)), /<Line\b/, 'no line is drawn after the waveform');
});

test('Envelope Lab: zero line behind the wave, envelope on the wave’s own scale', () => {
  const src = read('src/screens/lab/envelope/EnvelopeChart.tsx');
  zeroBehindTrace(src, /<Line x1=\{10\} y1=\{mid\} x2=\{W - 10\} y2=\{mid\}/, /<Polyline points=\{wavePts\}/, 'EnvelopeChart');
  // With the waveform shown, envelope level v sits on the wave's +v peak.
  assert.match(src, /const y = showWave \? \(v: number\) => mid - v \* halfH :/);
});
