/**
 * Visual Audio Analysis — lab-art fix round 3 (2026-10-16). The grading found
 * the VU module's face printed 20-10-7-5-3-0-3-5 (no −2/−1/+1/+2, running to
 * +5) where a studio VU face is −20 … +3, and the waveform's dB numerals were
 * printed ON the trace ("−12" read as "−1").
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');

test('the skinned VU face is the standard −20 … +3 scale with every dB from −3 to +3', () => {
  const s = read('screens/tools/SkinnedVu.tsx');
  const block = s.slice(s.indexOf('export const MAJORS'), s.indexOf('];', s.indexOf('export const MAJORS')));
  const dbs = [...block.matchAll(/db: (-?\d+)/g)].map((m) => Number(m[1]));
  assert.deepEqual(dbs, [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3]);
});

test('the VU needle is voltage-linear across the whole face (+3 VU = 1.413 × 0 VU)', () => {
  const s = read('screens/tools/SkinnedVu.tsx');
  const fn = s.slice(s.indexOf('export function vuAngle'), s.indexOf('}', s.indexOf('export function vuAngle')) + 1);
  assert.match(fn, /const a = -48 \+ 70 \* t;/);
  assert.doesNotMatch(fn, /4\.2 \* db/);
  // the same law as the lab's own VuMeterView majors
  const viz = read('screens/lab/meter/vizMeters.tsx');
  assert.match(viz, /const majors = \[-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3\];/);
  const ang = (db: number) => -48 + 70 * Math.pow(10, db / 20);
  assert.ok(ang(3) < 54 && ang(3) > 50, '+3 sits just inside the pin stop');
});

test('waveform: the dB numerals live in a gutter left of the audio, at ≥ 9 pt', () => {
  const viz = read('screens/lab/meter/vizMeters.tsx');
  const wf = viz.slice(viz.indexOf('export function WaveformView('), viz.indexOf('// M2 — Peak meter'));
  assert.match(wf, /const gut = p\.plain \? 0 : 30 \* ts;/);
  assert.match(wf, /body\.moveTo\(gut \+ 0\.5 \* colW/);
  assert.match(wf, /<Lbl key=\{d\} x=\{2\} y=\{yOf\(Math\.pow\(10, d \/ 20\)\) - 5\} w=\{26\} align="right" size=\{9\}>/);
});
