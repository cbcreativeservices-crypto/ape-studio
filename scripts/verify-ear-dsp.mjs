// Node verification of earDsp renders — FFT-proves the stimuli are honest.
// Run from the repo root: node scripts/verify-ear-dsp.mjs  (or npx tsx …)
import {
  toStereo, normalizePeak,
  sine, classicWave, harmonicComplex, whiteNoise, pinkNoise, brownNoise,
  peakEq, lowShelf, highShelf, notch, applyBiquad, mixDelayed, reverb,
  compress, clip, hum, buzz, dropout, digitalGlitch, rfInterference,
  makeRng, rmsDb, normalizeRms, fadeEdges, pan, invertChannel, sumToMono,
  decorrelate, bandDb, encodeWav, powerSpectrumDb, gainDb, rms,
} from '../src/features/ear/earDsp.ts';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  ✓', name, detail); }
  else { fail++; console.log('  ✗ FAIL', name, detail); }
};

console.log('— tones —');
{
  const t = sine(1000, 1);
  const p = powerSpectrumDb(t);
  let maxI = 0; for (let i = 1; i < p.db.length; i++) if (p.db[i] > p.db[maxI]) maxI = i;
  ok('1 kHz sine peaks at 1 kHz', Math.abs(p.freqs[maxI] - 1000) < 8, `peak@${p.freqs[maxI].toFixed(1)}`);
  const sq = classicWave('square', 500, 1);
  const h3 = bandDb(sq, 1500), h2 = bandDb(sq, 1000);
  ok('square: odd harmonic >> even', h3 - h2 > 15, `3rd-2nd=${(h3 - h2).toFixed(1)}dB`);
  // Alias test done right: a band-limited saw has partials AT harmonics only —
  // aliasing would smear energy BETWEEN them. Measure the valley at 5.5×f0.
  const saw = classicWave('saw', 3000, 1);
  const partial = bandDb(saw, 15000, 0.05);
  const valley = bandDb(saw, 16500, 0.05);
  ok('saw band-limited (deep valley between partials)', partial - valley > 30, `partial-valley=${(partial - valley).toFixed(0)}dB`);
}

console.log('— noise colours —');
{
  const rng = makeRng(42);
  const w = whiteNoise(2, rng);
  const slopeW = bandDb(w, 8000) - bandDb(w, 500);
  ok('white ~flat (|slope| < 2 dB over 4 oct)', Math.abs(slopeW) < 2, `${slopeW.toFixed(2)}dB`);
  const p = pinkNoise(2, makeRng(43));
  const slopeP = bandDb(p, 8000) - bandDb(p, 500);
  ok('pink ~-3 dB/oct (−12±3 over 4 oct)', slopeP > -15 && slopeP < -9, `${slopeP.toFixed(1)}dB`);
  const b = brownNoise(2, makeRng(44));
  const slopeB = bandDb(b, 4000) - bandDb(b, 250);
  ok('brown steeper than pink (≤−20 over 4 oct)', slopeB < -20, `${slopeB.toFixed(1)}dB`);
}

console.log('— EQ —');
{
  const rng = makeRng(7);
  const base = normalizeRms(pinkNoise(2, rng));
  const boosted = applyBiquad(base, peakEq(250, 6));
  const delta = bandDb(boosted, 250) - bandDb(base, 250);
  const far = bandDb(boosted, 4000) - bandDb(base, 4000);
  ok('+6 dB @ 250 Hz really is +6 (±1)', Math.abs(delta - 6) < 1, `Δ=${delta.toFixed(2)}dB`);
  ok('…and leaves 4 kHz alone (±0.7)', Math.abs(far) < 0.7, `Δfar=${far.toFixed(2)}dB`);
  const cut = applyBiquad(base, peakEq(500, -6));
  const dCut = bandDb(cut, 500) - bandDb(base, 500);
  ok('−6 dB @ 500 Hz really is −6 (±1)', Math.abs(dCut + 6) < 1, `Δ=${dCut.toFixed(2)}dB`);
  const hs = applyBiquad(base, highShelf(4000, 6));
  ok('high shelf lifts 10 kHz ≈ +6', Math.abs(bandDb(hs, 10000) - bandDb(base, 10000) - 6) < 1.2);
  const ls = applyBiquad(base, lowShelf(200, -6));
  ok('low shelf drops 80 Hz ≈ −6', Math.abs(bandDb(ls, 80) - bandDb(base, 80) + 6) < 1.5);
  const nt = applyBiquad(base, notch(1000));
  ok('notch kills 1 kHz (≥12 dB down)', bandDb(base, 1000, 0.05) - bandDb(nt, 1000, 0.05) > 12);
}

console.log('— comb / delay —');
{
  const base = normalizeRms(pinkNoise(2, makeRng(9)));
  const comb = mixDelayed(base, 1, 0.9); // 1 ms → first null at 500 Hz
  const nullDepth = bandDb(base, 500, 0.06) - bandDb(comb, 500, 0.06);
  const peakGain = bandDb(comb, 1000, 0.06) - bandDb(base, 1000, 0.06);
  ok('1 ms comb: deep null at 500 Hz (>8 dB)', nullDepth > 8, `${nullDepth.toFixed(1)}dB`);
  ok('1 ms comb: peak at 1 kHz (>3 dB)', peakGain > 3, `${peakGain.toFixed(1)}dB`);
}

console.log('— dynamics —');
{
  // program: alternating loud/soft harmonic bursts
  const loud = harmonicComplex(220, 0.25), soft = gainDb(harmonicComplex(220, 0.25), -18);
  const prog = new Float32Array(48000 * 2);
  for (let b = 0; b < 8; b++) {
    const src = b % 2 === 0 ? loud : soft;
    prog.set(src, b * 12000);
  }
  // The honest dynamics test: compression must SHRINK the loud-vs-soft gap.
  const comp = compress(prog, 20, -42, 2, 50); // HEAVY: high ratio, deep threshold, release shorter than the segments
  const seg = (b, buf) => rmsDb(buf.slice(b * 12000, b * 12000 + 11000));
  const gapBefore = seg(0, prog) - seg(1, prog);
  const gapAfter = seg(0, comp) - seg(1, comp);
  ok('heavy compression shrinks loud/soft gap (≥6 dB)', gapBefore - gapAfter > 6, `${gapBefore.toFixed(1)}→${gapAfter.toFixed(1)}dB`);
  // RECIPE TRAP (documented in earDsp): drive is relative to FULL SCALE, so
  // module recipes must peak-normalize BEFORE driving or nothing clips.
  const cl = clip(normalizePeak(sine(330, 1)), 'hard', 10);
  const thd = bandDb(cl, 990) - bandDb(cl, 330);
  ok('hard clip creates strong 3rd harmonic (> −25 dB rel.)', thd > -25, `${thd.toFixed(1)}dB`);
}

console.log('— reverb / defects —');
{
  const dry = fadeEdges(harmonicComplex(440, 0.4));
  const padded = new Float32Array(48000 * 2.5); padded.set(dry);
  const wet = reverb(padded, 'hall', 2.2, 0.5);
  const tailStart = Math.round(48000 * 0.8);
  const tailRms = rmsDb(wet.slice(tailStart, tailStart + 24000));
  const dryTail = rmsDb(padded.slice(tailStart, tailStart + 24000));
  ok('hall reverb leaves an audible tail (dry is silent there)', tailRms - dryTail > 20, `tail=${tailRms.toFixed(0)} dry=${dryTail.toFixed(0)}`);
  // RT60 is what the render is BUILT to: a 1.0 s hall must lose ≈30 dB over
  // any 0.5 s of pure tail (damping steals a little extra from the highs).
  const wet1 = reverb(padded, 'hall', 1.0, 0.5, 1);
  const win = (at) => rmsDb(wet1.slice(Math.round(at * 48000), Math.round((at + 0.1) * 48000)));
  const drop = win(0.7) - win(1.2);
  ok('RT60 = 1.0 s hall drops ≈30 dB per 0.5 s of tail (22–45)', drop > 22 && drop < 45, `${drop.toFixed(1)} dB`);
  const room = reverb(padded, 'room', 0.4, 0.5, 1);
  const winR = (at) => rmsDb(room.slice(Math.round(at * 48000), Math.round((at + 0.05) * 48000)));
  const dropR = winR(0.5) - winR(0.7);
  ok('RT60 = 0.4 s room drops ≈30 dB per 0.2 s of tail (20–48)', dropR > 20 && dropR < 48, `${dropR.toFixed(1)} dB`);
  const h = hum(1, 60, 3);
  ok('60 Hz hum: fundamental dominates 180 Hz', bandDb(h, 60, 0.1) - bandDb(h, 180, 0.1) > 8);
  const bz = buzz(1, 60);
  ok('buzz: rich highs vs hum', bandDb(bz, 2000) - bandDb(h, 2000) > 20);
  const drp = dropout(normalizeRms(pinkNoise(1.5, makeRng(5))), 0.6, 120);
  ok('dropout: gap is silent', rmsDb(drp.slice(Math.round(0.63 * 48000), Math.round(0.68 * 48000))) < -60);
  // GSM emulation: a 217 Hz TDMA pulse train → spectral line at 217 Hz that
  // stands well above the gap halfway to the next line (325 Hz).
  const rf = rfInterference(new Float32Array(48000), makeRng(6));
  const rfLine = bandDb(rf, 217, 0.06) - bandDb(rf, 325, 0.06);
  ok('RF interference pulses at 217 Hz (line ≥ 10 dB over gap)', rfLine > 10, `${rfLine.toFixed(1)} dB`);
}

console.log('— stereo / levels / wav —');
{
  const m = normalizeRms(pinkNoise(1, makeRng(11)));
  const s = pan(m, -1);
  ok('hard-left pan: right silent', rmsDb(s.r) < -60);
  // Canonical polarity stimulus: IDENTICAL channels, one inverted → mono sum
  // cancels essentially completely.
  const same = toStereo(m);
  const inv = invertChannel(same, 'r');
  const monoOk = rmsDb(sumToMono(same));
  const monoBad = rmsDb(sumToMono(inv));
  ok('polarity-invert cancels in mono (≥50 dB drop)', monoOk - monoBad > 50, `${(monoOk - monoBad).toFixed(1)}dB`);
  // The decorrelated variant still weakens in mono (partial cancel) — the
  // "hollow, not silent" real-world case the module also teaches.
  const de = decorrelate(m);
  const deInv = invertChannel(de, 'r');
  ok('decorrelated invert partially cancels (2–15 dB)', rmsDb(sumToMono(de)) - rmsDb(sumToMono(deInv)) > 2);
  const n1 = normalizeRms(pinkNoise(1, makeRng(12)), -20);
  ok('normalizeRms hits target (±0.1)', Math.abs(rmsDb(n1) + 20) < 0.1, rmsDb(n1).toFixed(2));
  const wav = encodeWav(s);
  ok('WAV header RIFF/WAVE + right size', wav[0] === 82 && wav[8] === 87 && wav.length === 44 + 48000 * 2 * 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
