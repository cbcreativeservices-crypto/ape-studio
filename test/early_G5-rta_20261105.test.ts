/**
 * G5 RTA, bug S3 (2026-11-05): the HI-RES words must promise only what a student
 * can see. At every band count a low tone spills into fewer neighboring bars; at
 * 61 bands the low bands also separate. It does NOT reliably steady the bars: at
 * MED and SLOW the lowest band wobbles slightly MORE at 16384 (checker, on noise
 * through the engine's Hann FFT and band edges), so that word is banned below.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { deriveSixthOctave, NO_LEVEL, SIXTH_BANDS } from '../src/features/tools/sixthOctave.ts';

const src = readFileSync(join(import.meta.dirname, '..', 'src/screens/tools/RtaScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');
const SR = 48000;
const STD = 8192;
const HI = 16384;

/** The settings note as the student reads it: JSX line wraps collapse to spaces. */
function settingsNote(): string {
  const m = src.match(/<Text style=\{styles\.settingsNote\}>\s*Changing banding,([\s\S]*?)<\/Text>/);
  assert.ok(m, 'settings note not found');
  return `Changing banding,${m[1]}`.replace(/\s+/g, ' ').trim();
}
function hiResChip(): string {
  const m = src.match(/<Chip\s+label="HI-RES"([\s\S]*?)\/>/);
  assert.ok(m, 'HI-RES chip not found');
  return m[1];
}
const estimatedCount = (fft: number) => {
  const r = deriveSixthOctave(new Float32Array(fft / 2 + 1).fill(-40), SR, fft, 1, { current: null }, new Float64Array(SIXTH_BANDS).fill(NO_LEVEL));
  return r.estimated!.filter(Boolean).length;
};
/** A sine's band power through the engine's path (Fft.hpp periodic Hann, then
 *  OctaveBands.hpp kLo = ceil(lo/df), kHi = floor(hi/df)), in dB re its peak bin. */
function toneBandDb(toneHz: number, centerHz: number, fft: number): number {
  const df = SR / fft;
  const k0 = Math.ceil(centerHz / 2 ** (1 / 6) / df);
  const k1 = Math.floor((centerHz * 2 ** (1 / 6)) / df);
  const bin = (k: number) => {
    let re = 0;
    let im = 0;
    for (let n = 0; n < fft; n++) {
      const x = 0.5 * (1 - Math.cos((2 * Math.PI * n) / fft)) * Math.sin((2 * Math.PI * toneHz * n) / SR);
      const w = (2 * Math.PI * k * n) / fft;
      re += x * Math.cos(w);
      im -= x * Math.sin(w);
    }
    return re * re + im * im;
  };
  let peak = 0;
  for (let k = 1; k < 30; k++) peak = Math.max(peak, bin(k));
  let sum = 0;
  for (let k = k0; k <= k1; k++) sum += bin(k);
  return 10 * Math.log10(sum / peak);
}
/** Bins whose centres fall inside a 1/3-octave band at this FFT. */
function binsIn(centerHz: number, fft: number): number {
  const df = SR / fft;
  const lo = centerHz / 2 ** (1 / 6);
  const hi = centerHz * 2 ** (1 / 6);
  let n = 0;
  for (let i = 1; i * df < hi; i++) if (i * df >= lo) n++;
  return n;
}

describe('G5 RTA HI-RES words match what HI-RES does', () => {
  it('the physics behind the words: real detail at 61 bands, less spill at every band count', () => {
    assert.ok(estimatedCount(HI) < estimatedCount(STD), '61 bands must gain bands that stop sharing a bin');
    assert.deepEqual([binsIn(25, STD), binsIn(25, HI)], [1, 2]);
    assert.deepEqual([binsIn(40, STD), binsIn(40, HI)], [1, 3]);
    // A 40 Hz tone at 31 bands: both neighbor bars fall by more than 15 dB.
    assert.ok(toneBandDb(40, 31.5, HI) < toneBandDb(40, 31.5, STD) - 15);
    assert.ok(toneBandDb(40, 50, HI) < toneBandDb(40, 50, STD) - 15);
  });
  it('the settings note says less spill everywhere, separation at 61, and never "steadies"', () => {
    const note = settingsNote();
    assert.match(note, /Low tones spill into fewer neighboring bars at every band count/);
    assert.match(note, /at 61 bands the low bands also separate down to ~30 Hz/);
    assert.match(note, /slows the response/);
    assert.doesNotMatch(note, /stead/i);
    assert.doesNotMatch(note, /doubles the FFT for finer low-frequency detail/);
  });
  it('the HI-RES chip spoken label stays true and never says steadies', () => {
    const chip = hiResChip();
    // True at every band count, and pinned by audit R057801: left as committed.
    assert.match(chip, /finer detail in the low bands, slower response/);
    assert.doesNotMatch(chip, /stead/i);
  });
  it('HI-RES stays enabled in every mode and really switches the FFT', () => {
    const chip = hiResChip();
    assert.match(chip, /onPress=\{\(\) => applyHiRes\(true\)\}/);
    assert.doesNotMatch(chip, /disabled|mode\b/);
    assert.match(src, /cfg\.fftSize = on \? HIRES_FFT : FFT_SIZE;/);
  });
  it('the 31-band blurb is untouched (with the owner)', () => {
    assert.ok(src.includes("31: 'One-third octave — the live-sound standard, matching a 31-band graphic EQ fader for fader.'"));
  });
});
