import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANATOMY, ANATOMY_MIN_SPACING, PRODUCTION, VOICED_PAIRS, VOWELS, vowelSpectrum, CONSONANTS, plosiveTrace, distanceEffect, proximityBoostDb,
  VOICE_RANGES, PROBLEMS, voiceSpectrum, problemSpectrum, problemTrace, bandMean, SPEECH_CHECKS, shuffleCheck,
} from '../src/features/speech/speechModel.ts';

test('anatomy: 11 tappable structures with unique ids, chip labels and leader anchors inside the drawing', () => {
  assert.equal(ANATOMY.length, 11);
  assert.equal(new Set(ANATOMY.map((a) => a.id)).size, 11);
  for (const a of ANATOMY) {
    assert.ok(a.x >= 10 && a.x <= 290 && a.y >= 10 && a.y <= 310, `${a.id} disc inside the 300×320 box with its radius`);
    assert.ok(a.ax >= 0 && a.ax <= 300 && a.ay >= 0 && a.ay <= 320, `${a.id} anchor`);
    assert.ok(a.role.length > 20);
    assert.ok(a.short.length > 0 && a.short.length <= 12, `${a.id} chip label "${a.short}" fits a chip`);
  }
  assert.equal(ANATOMY[0].id, 'lungs');
  assert.equal(ANATOMY[ANATOMY.length - 2].id, 'lips', 'numbered along the airflow: lungs first, lips last (jaw closes the list)');
});

test('anatomy: tap discs are far enough apart that their 22-unit hit circles never overlap', () => {
  for (let i = 0; i < ANATOMY.length; i++) {
    for (let j = i + 1; j < ANATOMY.length; j++) {
      const a = ANATOMY[i], b = ANATOMY[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      assert.ok(d >= ANATOMY_MIN_SPACING, `${a.id}–${b.id} discs only ${d.toFixed(1)} apart`);
    }
  }
});

test('production sequence runs breath → folds → resonance → articulation → speech', () => {
  assert.deepEqual(PRODUCTION.map((s) => s.id), ['breath', 'phonation', 'resonance', 'articulation', 'speech']);
});

test('voiced pairs: every pair has both members and a minimal-pair example', () => {
  assert.ok(VOICED_PAIRS.length >= 6);
  for (const p of VOICED_PAIRS) { assert.notEqual(p.unvoiced, p.voiced); assert.equal(p.example.length, 2); }
});

test('vowels: F1 < F2 < F3 for every vowel; EE lowest F1 & highest F2; AH highest F1', () => {
  for (const v of VOWELS) assert.ok(v.f1 < v.f2 && v.f2 < v.f3, v.id);
  const ee = VOWELS.find((v) => v.id === 'i')!, ah = VOWELS.find((v) => v.id === 'a')!;
  assert.equal(Math.min(...VOWELS.map((v) => v.f1)), ee.f1);
  assert.equal(Math.max(...VOWELS.map((v) => v.f2)), ee.f2);
  assert.equal(Math.max(...VOWELS.map((v) => v.f1)), ah.f1);
  // tongue geometry agrees with acoustics: high tongue ↔ low F1, front tongue ↔ high F2
  assert.ok(ee.height > ah.height && ee.back < ah.back);
});

test('vowelSpectrum: peaks near the formants, normalized to 1', () => {
  const ee = VOWELS.find((v) => v.id === 'i')!;
  const sp = vowelSpectrum(ee, 120, 128, 4000);
  assert.ok(Math.max(...sp.mag) <= 1 + 1e-12 && Math.max(...sp.mag) > 0.999);
  const nearF1 = bandMean(sp, ee.f1 - 120, ee.f1 + 120);
  const between = bandMean(sp, 900, 1500);
  assert.ok(nearF1 > between * 2, `F1 region ${nearF1} should dominate the valley ${between}`);
});

test('consonant categories: six, each with examples and a band', () => {
  assert.equal(CONSONANTS.length, 6);
  for (const c of CONSONANTS) { assert.ok(c.examples.length > 0); assert.ok(c.bandLoHz < c.bandHiHz); }
  const fric = CONSONANTS.find((c) => c.id === 'fricative')!, nasal = CONSONANTS.find((c) => c.id === 'nasal')!;
  assert.ok(fric.bandHiHz > nasal.bandHiHz * 5);
});

test('plosiveTrace: the pop filter removes the slow pressure hump but keeps the click', () => {
  const raw = plosiveTrace(240, false), filtered = plosiveTrace(240, true);
  const peak = (a: Float64Array) => Math.max(...Array.from(a, Math.abs));
  assert.ok(peak(raw) > 0.9 && peak(filtered) < 0.7);
  // the very first samples (the click) are the same either way
  for (let i = 0; i < 4; i++) assert.ok(Math.abs(raw[i] - filtered[i]) < 1e-9);
});

test('distance: direct sound follows inverse square, plosive energy falls faster, SNR shrinks', () => {
  const d1 = distanceEffect(1), d6 = distanceEffect(6), d12 = distanceEffect(12);
  assert.ok(Math.abs(d12.directDb) < 1e-9);
  assert.ok(Math.abs(d6.directDb - 6.02) < 0.05);
  assert.ok(Math.abs(d1.directDb - 21.58) < 0.05);
  assert.ok(d1.plosiveDb - d12.plosiveDb > d1.directDb - d12.directDb);
  assert.ok(d1.snrDb > d6.snrDb && d6.snrDb > d12.snrDb);
  assert.ok(d1.directToRoomDb > d12.directToRoomDb);
  assert.equal(d1.roomDb, d12.roomDb);
});

test('proximity boost is monotonic with closeness and ~0 far away', () => {
  assert.ok(proximityBoostDb(1) > proximityBoostDb(6));
  assert.ok(proximityBoostDb(6) > proximityBoostDb(12));
  assert.ok(proximityBoostDb(48) === 0 && proximityBoostDb(100) === 0);
  assert.ok(proximityBoostDb(1) >= 10 && proximityBoostDb(1) <= 16);
});

test('voice ranges: male < female < child, ranges overlap-free in the typical values but stated as typical', () => {
  const [m, f, c] = VOICE_RANGES;
  assert.ok(m.f0TypicalHz < f.f0TypicalHz && f.f0TypicalHz < c.f0TypicalHz);
  for (const r of VOICE_RANGES) assert.ok(r.f0LoHz < r.f0TypicalHz && r.f0TypicalHz < r.f0HiHz);
  assert.ok(/Typical/.test(m.name));
});

test('problems: eight, each with cause / hear / see / fix, and loss bands only on spectrum visuals', () => {
  assert.equal(PROBLEMS.length, 8);
  for (const p of PROBLEMS) {
    assert.ok(p.cause.length > 20 && p.hear.length > 5 && p.fix.length > 20 && p.see.length > 20, p.id);
    if (p.band) { assert.equal(p.visual, 'spectrum', p.id); assert.ok(p.band.lo < p.band.hi && p.band.label.length > 0, p.id); }
  }
  assert.equal(PROBLEMS.find((p) => p.id === 'muffled')!.band!.kind, 'loss');
  assert.equal(PROBLEMS.find((p) => p.id === 'sibilance')!.band!.kind, 'excess');
});

test('checks: nine authored, four options each, correct in range, two placed mid-lab', () => {
  assert.equal(SPEECH_CHECKS.length, 9);
  assert.equal(new Set(SPEECH_CHECKS.map((c) => c.id)).size, 9);
  for (const c of SPEECH_CHECKS) {
    assert.equal(c.options.length, 4, c.id);
    assert.ok(c.correct >= 0 && c.correct < 4, c.id);
    assert.ok(c.explain.length > 40, `${c.id} explains, not just confirms`);
    assert.equal(new Set(c.options).size, 4, `${c.id} options distinct`);
  }
  assert.deepEqual(SPEECH_CHECKS.filter((c) => c.where !== 'final').map((c) => c.where), ['consonants', 'distance']);
});

test('checks: no length cue — the correct option is never the single longest', () => {
  for (const c of SPEECH_CHECKS) {
    const longest = Math.max(...c.options.map((o) => o.length));
    const holders = c.options.filter((o) => o.length === longest);
    assert.ok(!(holders.length === 1 && c.options[c.correct].length === longest), `${c.id}: correct option is the longest`);
  }
});

test('shuffleCheck: permutes the options and the correct index follows its text', () => {
  const c = SPEECH_CHECKS[0];
  // deterministic LCG so the test is reproducible
  let seed = 7;
  const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const seen = new Set<string>();
  for (let k = 0; k < 40; k++) {
    const s = shuffleCheck(c, rng);
    assert.deepEqual([...s.options].sort(), [...c.options].sort());
    assert.equal(s.options[s.correct], c.options[c.correct]);
    seen.add(s.options.join('|'));
  }
  assert.ok(seen.size > 3, 'the order actually varies');
});

test('problemSpectrum changes the right region relative to the clean voice', () => {
  const clean = voiceSpectrum(48);
  const sib = problemSpectrum('sibilance', 48);
  assert.ok(bandMean(sib, 4000, 10000) > bandMean(clean, 4000, 10000) * 2);
  assert.ok(Math.abs(bandMean(sib, 100, 1000) - bandMean(clean, 100, 1000)) < 1e-9);
  const plo = problemSpectrum('plosives', 48);
  assert.ok(bandMean(plo, 20, 150) > bandMean(clean, 20, 150) * 1.5);
  const muf = problemSpectrum('muffled', 48);
  assert.ok(bandMean(muf, 3000, 12000) < bandMean(clean, 3000, 12000) * 0.5);
  const nas = problemSpectrum('nasality', 48);
  assert.ok(bandMean(nas, 900, 1400) > bandMean(clean, 900, 1400) * 1.3);
  const dist = problemSpectrum('distance', 48);
  assert.ok(bandMean(dist, 200, 500) < bandMean(clean, 200, 500));
});

test('problemTrace: clicks add sharp spikes, plosive adds a hump, breath replaces the tail', () => {
  const clean = problemTrace('sibilance'); // no trace defect → clean vowel
  const clicks = problemTrace('clicks');
  let diffs = 0; for (let i = 0; i < clean.length; i++) if (Math.abs(clean[i] - clicks[i]) > 0.5) diffs++;
  assert.ok(diffs >= 4 && diffs <= 16, `clicks touch ${diffs} samples`);
  const plo = problemTrace('plosives');
  assert.ok(Math.max(...Array.from(plo)) > 0.9 && Math.max(...Array.from(clean)) < 0.5);
});
