/**
 * Modular Synth Lab art fix (lab-art grading 2026-10-16): the flow chart of
 * boxes became a patched Eurorack case. Pins the parts that make it real and
 * honest: true Eurorack units, 9 pt legends, one cable per routing with its
 * own jacks, the engine's own filter in the spectrum.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { harmonicAmp, svfLowpassMag } from '../src/screens/lab/modular/spectrumMath.ts';

const src = readFileSync('src/screens/lab/ModularLabScreen.tsx', 'utf8').replace(/\r\n/g, '\n');
const spec = readFileSync('src/screens/lab/modular/ModularSpectrum.tsx', 'utf8').replace(/\r\n/g, '\n');
const caseSrc = src.slice(src.indexOf('const HP_MM'), src.indexOf('const styles = StyleSheet.create'));

test('true Eurorack units: 1 HP = 5.08 mm, 3U = 128.5 mm, seven modules', () => {
  assert.match(src, /const HP_MM = 5\.08;/);
  assert.match(src, /const U3_MM = 128\.5;/);
  const keys = [...caseSrc.matchAll(/key: '(\w+)',\n\s+name: '/g)].map((m) => m[1]);
  assert.deepEqual(keys, ['seq', 'lfo', 'env', 'vco', 'vcf', 'vca', 'out'], 'control sources left, audio path right to OUT');
});

test('no drawn text under 9 pt on the glass or the spectrum', () => {
  for (const s of [caseSrc, spec]) {
    for (const m of s.matchAll(/fontSize=\{([\d.]+)\}/g)) assert.ok(Number(m[1]) >= 9, `fontSize ${m[1]}`);
  }
  assert.match(caseSrc, /const LEG = 9;/);
});

test('one cable per active routing, each from its own output jack to its own input', () => {
  const adds = [...caseSrc.matchAll(/add\('([\w-]+)', \['(\w+)', [^\]]+\], \['(\w+)', '(\w+)'\]/g)];
  const ends = adds.map((m) => `${m[3]}.${m[4]}`);
  assert.equal(new Set(ends).size, ends.length, 'no input jack takes two cables');
  // The envelope's two destinations leave from two different OUT jacks.
  assert.match(caseSrc, /add\('env-vca', \['env', 'outA'\]/);
  assert.match(caseSrc, /add\('env-vcf', \['env', 'outF'\]/);
  // Sequencer = retune (CV → V/OCT) + retrigger (GATE → ENV GATE), as Modular.hpp does.
  assert.match(caseSrc, /add\('seq-cv', \['seq', 'cv'\], \['vco', 'voct'\]/);
  assert.match(caseSrc, /add\('seq-gate', \['seq', 'gate'\], \['env', 'gate'\]/);
  // Own sag depth: ≥ 5 px between any two cables' low points.
  assert.match(caseSrc, /hung\[i\]\.low = Math\.max\(hung\[i\]\.low, hung\[i - 1\]\.low \+ 5\)/);
});

test('the live readouts stay real: ENV light = envLevel, SEQ step = activeStep', () => {
  assert.match(caseSrc, /0\.25 \+ 0\.75 \* Math\.max\(0, Math\.min\(1, envLevel\)\)/);
  assert.match(caseSrc, /const lit = running && patch\.seqOn && activeStep === sI;/);
});

test('spectrum: textbook harmonic series and the engine SVF magnitude', () => {
  assert.equal(harmonicAmp(0, 3), 1 / 3); // saw 1/n
  assert.equal(harmonicAmp(1, 2), 0); // square: odd only
  assert.equal(harmonicAmp(2, 3), 1 / 9); // triangle 1/n²
  assert.equal(harmonicAmp(3, 2), 0); // sine: fundamental only
  // At the cutoff |H| = 1/k with k = 2 − 1.6·res (Modular.hpp kDamp).
  assert.ok(Math.abs(20 * Math.log10(svfLowpassMag(1000, 1000, 0)) - -6.02) < 0.01);
  assert.ok(Math.abs(20 * Math.log10(svfLowpassMag(1000, 1000, 1)) - 7.96) < 0.01);
  // 12 dB/octave well above the cutoff.
  const a = 20 * Math.log10(svfLowpassMag(8000, 500, 0));
  const b = 20 * Math.log10(svfLowpassMag(16000, 500, 0));
  assert.ok(Math.abs(a - b - 12) < 0.3);
  const modular = readFileSync('modules/ape-dsp/ios/core/Modular.hpp', 'utf8').replace(/\r\n/g, '\n');
  assert.match(modular, /const double kDamp = 2\.0 - 1\.6 \* resCur_;/, 'the engine filter is still the one the spectrum draws');
});
