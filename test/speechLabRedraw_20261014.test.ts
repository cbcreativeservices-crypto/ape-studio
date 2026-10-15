/**
 * Speech & Voice Lab redraw (owner 2026-10-14: "the whole speech lab's
 * animations all need upgrading to higher standards of quality").
 * Pins the physics behind the new pictures and the house rules they follow:
 * real audio on a real time base (never stylized), level colours from the
 * ramp, reference lines behind signals, motion gated, captions true.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SPEECH_SR, SYLLABLE_SR, VOWEL_FORMANTS, consonantSyllable, measuredSpectrumDb, plosiveCapture, sibilantWave, spectrogramDb, vowelHarmonicsDb, vowelWave,
} from '../src/features/speech/speechSignals.ts';
import { sibilanceSpectra, VOWELS } from '../src/features/speech/speechModel.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const zcPerSec = (x: Float64Array, sr: number) => { let c = 0; for (let i = 1; i < x.length; i++) if ((x[i - 1] < 0) !== (x[i] < 0)) c++; return c / (x.length / sr); };

test('a synthesized vowel is real audio: pitch 120 Hz, formant ringing between pulses', () => {
  const v = vowelWave(0.25, 'a', 120, SPEECH_SR);
  assert.equal(v.length, 4000);
  assert.ok(zcPerSec(v, SPEECH_SR) > 600, 'formants ring several times per pitch period');
  // the period is 1/120 s: autocorrelation peaks there
  const lag = Math.round(SPEECH_SR / 120);
  let r0 = 0, r1 = 0, rh = 0;
  for (let i = 0; i + lag < v.length; i++) { r0 += v[i] * v[i]; r1 += v[i] * v[i + lag]; rh += v[i] * v[i + Math.round(lag / 2)]; }
  assert.ok(r1 / r0 > 0.8 && r1 > rh, 'periodic at the pitch');
});

test('vowel harmonics: the strongest harmonics sit at each vowel\'s F1 and F2 regions', () => {
  for (const v of VOWELS) {
    const sp = vowelHarmonicsDb(VOWEL_FORMANTS[v.id as keyof typeof VOWEL_FORMANTS], 120, 4000);
    const near = (f: number) => { let best = -Infinity; for (let i = 0; i < sp.hz.length; i++) if (Math.abs(sp.hz[i] - f) <= 130) best = Math.max(best, sp.db[i]); return best; };
    const valley = (a: number, b: number) => { let lo = Infinity; for (let i = 0; i < sp.hz.length; i++) if (sp.hz[i] > a && sp.hz[i] < b) lo = Math.min(lo, sp.db[i]); return lo; };
    assert.ok(near(v.f1) > -12, `${v.id} F1 region strong (${near(v.f1).toFixed(1)} dB)`);
    if (v.f2 - v.f1 > 600) assert.ok(near(v.f2) > valley(v.f1 + 150, v.f2 - 150) + 6, `${v.id} F2 is a peak above the valley`);
    assert.ok(Math.max(...sp.db) === 0);
  }
});

test('"S" vs "AH" spectra (page 7): the S lives at 4–10 kHz, the vowel below ~1.5 kHz, barely overlapping', () => {
  const { s, ah } = sibilanceSpectra();
  const band = (sp: { hz: Float64Array; db: Float64Array }, lo: number, hi: number) => { let m = -Infinity; for (let i = 0; i < sp.hz.length; i++) if (sp.hz[i] >= lo && sp.hz[i] <= hi) m = Math.max(m, sp.db[i]); return m; };
  assert.ok(band(s, 4000, 10000) > -10 && band(s, 4000, 10000) < -3, 'S peak inside 4–10 kHz, a few dB under the vowel peak');
  assert.ok(band(s, 50, 700) < -35, 'S has almost nothing low');
  assert.ok(band(ah, 500, 1500) > -3, 'AH peak below 1.5 kHz');
  assert.ok(band(ah, 4000, 10000) < -45, 'AH has almost nothing in the S band');
});

test('"pa" at the capsule (page 6): silence, a burst at 20 ms, aspiration, then voicing ~55 ms later', () => {
  const x = plosiveCapture(true);
  const rms = (a: number, b: number) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / (b - a)); };
  const ms = (t: number) => Math.round((t / 1000) * SPEECH_SR);
  assert.ok(rms(0, ms(19)) < 0.005, 'closure');
  assert.ok(rms(ms(20), ms(23)) > 0.05, 'burst');
  assert.ok(rms(ms(25), ms(45)) < rms(ms(100), ms(150)) / 3, 'aspiration is far weaker than the vowel');
  const raw = plosiveCapture(false);
  let pk = 0, at = 0; for (let i = 0; i < raw.length; i++) if (Math.abs(raw[i]) > pk) { pk = Math.abs(raw[i]); at = i; }
  assert.ok(at / SPEECH_SR > 0.045, 'the slow air lands well after the burst (~30 ms later), not with it');
});

test('consonant syllables (page 5): each family puts its energy where the page says', () => {
  const R = 40, C = 80, MAX = 8000;
  const bandMean = (g: Float64Array[], f0: number, f1: number, t0: number, t1: number) => {
    let s = 0, n = 0;
    for (let r = 0; r < R; r++) { const f = ((r + 0.5) / R) * MAX; if (f < f0 || f > f1) continue; for (let c = 0; c < C; c++) { const t = ((c + 0.5) / C) * 0.4; if (t < t0 || t > t1) continue; s += g[r][c]; n++; } }
    return s / n;
  };
  const g = (id: Parameters<typeof consonantSyllable>[0]) => spectrogramDb(consonantSyllable(id).wave, SYLLABLE_SR, C, R, MAX);
  const fr = g('fricative');
  assert.ok(bandMean(fr, 4000, 8000, 0.04, 0.15) > bandMean(fr, 100, 1500, 0.04, 0.15) + 15, 'the S hiss is high');
  const na = g('nasal');
  assert.ok(bandMean(na, 100, 500, 0.05, 0.12) > bandMean(na, 2500, 8000, 0.05, 0.12) + 25, 'the nasal hum is low');
  const pl = g('plosive');
  assert.ok(bandMean(pl, 0, 8000, 0.0, 0.05) < -55, 'a plosive starts with silence (closure)');
  for (const id of ['plosive', 'fricative', 'affricate', 'nasal', 'liquid', 'glide'] as const) {
    const s = consonantSyllable(id);
    assert.equal(s.wave.length, Math.round(0.4 * SYLLABLE_SR));
    for (const seg of s.segments) assert.ok(seg.t1 > seg.t0 && seg.t1 <= 0.4 + 1e-9, `${id} ${seg.label}`);
    // every label fits its span on the 302-unit time axis at 9 pt (~4.6 units a glyph)
    for (const seg of s.segments) assert.ok(seg.label.length * 4.6 <= ((seg.t1 - seg.t0) / 0.4) * 302 + 8, `${id}: "${seg.label}" fits its span`);
  }
});

test('measured spectra are relative to their own loudest band', () => {
  const sp = measuredSpectrumDb(sibilantWave(0.3, 32000), 24, 50, 12000, 32000);
  assert.equal(Math.max(...sp.db), 0);
});

test('house rules in the redrawn files', () => {
  const charts = code(read('src/screens/lab/speech/speechCharts.tsx'));
  // waveform = min/max per column of real audio; the zero line sits BEHIND the signal
  assert.match(charts, /columnsMinMax\(wave, cols\)/);
  const zero = charts.indexOf('y1={mid} x2={x1} y2={mid}');
  const sig = charts.indexOf('<Path d={d} fill={`url(#${gid})`}');
  assert.ok(zero > 0 && sig > zero, 'zero line drawn before (behind) the waveform');
  assert.match(charts, /LOUDNESS_STOPS\.map/, 'spectrum bars ride the level ramp');
  // decorative loops are gated; the folds stay the listed lesson display
  assert.match(code(read('src/screens/lab/speech/speechMotion.ts')), /useDecorativeMotion\(\)/);
  assert.match(code(read('src/screens/lab/speech/headSection.tsx')), /useDecorativeMotion\(\)/);
  // no per-frame React state anywhere in the lab
  for (const f of ['speechViz.tsx', 'headSection.tsx', 'vowelViz.tsx', 'speechCharts.tsx', 'distanceViz.tsx', 'speechPagesA.tsx', 'speechPagesB.tsx', 'consonantViz.tsx']) {
    assert.doesNotMatch(code(read(`src/screens/lab/speech/${f}`)), /setInterval\(\(\) => set[A-Z]\w*\(\(\w+\) => \(?\w+ \+ 0\./, f);
  }
  // the old primitive stand-ins are gone: grey bars for a jaw, an ellipse for lips, a box larynx
  const A = code(read('src/screens/lab/speech/speechPagesA.tsx'));
  assert.doesNotMatch(A, /<Rect x=\{272\} y=\{40\} width=\{48\} height=\{6\}/);
  assert.doesNotMatch(A, /<Ellipse cx=\{296\} cy=\{122\}/);
  const head = code(read('src/screens/lab/speech/headSection.tsx'));
  assert.doesNotMatch(head, /<Rect x=\{132\} y=\{214\} width=\{36\} height=\{38\}/);
});
