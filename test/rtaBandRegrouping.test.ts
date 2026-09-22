/**
 * Combining frequency bands SUMS their energy. It does not average it.
 *
 * ⛔ WHAT THIS PINS (owner ruling 2026-09-22, found by the audio-tools hunt).
 *
 * The RTA's 7- and 15-band modes are derived on the device by regrouping the
 * native 1/3-octave bands. That regrouping computed
 *
 *     level = 10 * log10(power / m)      // m = bands in the group
 *
 * which is an energy AVERAGE. But a wider band CONTAINS the energy of the
 * narrow bands inside it, so the combination is a sum — and every other path
 * in the app sums.
 *
 * The `/ m` cost exactly 10·log10(m) on every bar, so switching BANDING moved
 * the entire display with no change in the signal at all. Two modes of the
 * same instrument, disagreeing about the same sound, in a tool people use to
 * make decisions about rooms.
 *
 * ⚠️ The GEOMETRIC MEAN CENTRE FREQUENCY is still an average, and correctly so
 * — `exp(logSum / m)`. Averaging the centre and summing the energy is the
 * right pair. Only the energy was wrong, which is part of why it survived:
 * there is a legitimate `/ m` two lines above the broken one.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** The old, wrong combination. */
const averaged = (levelsDb: number[]) =>
  10 * Math.log10(levelsDb.reduce((p, db) => p + Math.pow(10, db / 10), 0) / levelsDb.length);
/** The correct one. */
const summed = (levelsDb: number[]) =>
  10 * Math.log10(levelsDb.reduce((p, db) => p + Math.pow(10, db / 10), 0));

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) < tol;

test('two equal bands combine to +3.01 dB, not to the same level', () => {
  assert.ok(near(summed([70, 70]), 70 + 10 * Math.log10(2)), 'summing two equal bands adds 3.01 dB');
  assert.ok(near(averaged([70, 70]), 70), 'the old maths returned the input level unchanged');
  assert.ok(near(summed([70, 70]) - averaged([70, 70]), 10 * Math.log10(2)));
});

test('the error is exactly 10*log10(m) — it scales with how wide the grouping is', () => {
  for (const m of [2, 3, 4, 5, 8]) {
    const bands = Array.from({ length: m }, () => 65);
    assert.ok(
      near(summed(bands) - averaged(bands), 10 * Math.log10(m)),
      `group of ${m} should differ by ${(10 * Math.log10(m)).toFixed(2)} dB`,
    );
  }
});

test('the real cases: a 31-band source into 15 and into 7', () => {
  // Math.floor(((g+1)*31)/groups) - Math.floor((g*31)/groups) gives group sizes
  // of 2 or 3 for 15 groups, and 4 or 5 for 7 groups.
  const drop = (m: number) => 10 * Math.log10(m);
  assert.ok(drop(2) > 3.0 && drop(2) < 3.02, `15-band groups of 2 dropped ${drop(2).toFixed(2)} dB`);
  assert.ok(drop(4) > 6.0 && drop(4) < 6.03, `7-band groups of 4 dropped ${drop(4).toFixed(2)} dB`);
  // Worth stating plainly: every bar moved, and nothing about the sound did.
  assert.ok(drop(5) > 6.9, 'the widest groups moved nearly 7 dB');
});

test('unequal bands: the loudest dominates, and summing never reports less than it', () => {
  const bands = [80, 50, 50];
  assert.ok(summed(bands) >= 80, 'a combined band cannot be quieter than its loudest constituent');
  assert.ok(averaged(bands) < 80, 'the old maths could report LESS than a band it contained');
});

test('SOURCE GUARD: the level line must not divide by the group size', () => {
  const src = readFileSync(new URL('../src/screens/tools/RtaScreen.tsx', import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('function regroupBands'), src.indexOf('// ---- 1/6-octave'));
  assert.match(fn, /10 \* Math\.log10\(power\)/, 'the group level must be the summed power');
  assert.doesNotMatch(fn, /Math\.log10\(power \/ m\)/, 'dividing by m re-averages the energy');
  // The centre frequency average is legitimate and must SURVIVE.
  assert.match(fn, /Math\.exp\(logSum \/ m\)/, 'the geometric mean centre frequency must stay');
});
