import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHRASE, DEFAULTS, bandpassGain, detectorDb, gainReductionDb, processPhrase, eqCut, vowelBrightnessLossDb, meanSibilantGr,
  overStage, OVER_STAGES, FREQ_HINTS, FREQ_MIN, FREQ_MAX, sFrameSpectrum, detectorCurve, PATH_SIDECHAIN, PATH_MAIN,
} from '../src/features/deesser/deEsserModel.ts';

test('phrase: sibilant frames carry the hiss, vowels carry the body', () => {
  const sib = PHRASE.filter((f) => f.sibilant), vow = PHRASE.filter((f) => !f.sibilant && f.body > 0.5);
  assert.ok(sib.length >= 4 && vow.length >= 4);
  for (const f of sib) assert.ok(f.hiss > f.body);
  for (const f of vow) assert.ok(f.body > f.hiss);
});

test('band-pass peaks at fc and is symmetric on a log axis', () => {
  assert.ok(Math.abs(bandpassGain(6500, 6500, 1.4) - 1) < 1e-12);
  assert.ok(Math.abs(bandpassGain(3250, 6500, 1.4) - bandpassGain(13000, 6500, 1.4)) < 1e-12);
  assert.ok(bandpassGain(1000, 6500, 1.4) < 0.3);
  assert.ok(bandpassGain(6500, 6500, 4) === 1 && bandpassGain(4000, 6500, 4) < bandpassGain(4000, 6500, 1.4));
});

test('gain reduction: zero below threshold, grows above it, capped by range', () => {
  const s = { ...DEFAULTS };
  const vowel = PHRASE[1], ess = PHRASE[11];
  assert.equal(gainReductionDb(vowel, s), 0);
  assert.ok(gainReductionDb(ess, s) > 0);
  assert.ok(gainReductionDb(ess, { ...s, thresholdDb: -30 }) > gainReductionDb(ess, s));
  assert.ok(gainReductionDb(ess, { ...s, thresholdDb: -40, rangeDb: 6 }) <= 6 + 1e-12);
  assert.equal(gainReductionDb(ess, { ...s, thresholdDb: 0 }), 0);
});

test('detector follows the frequency setting: an SH is missed by a high, narrow band', () => {
  const sh = PHRASE.find((f) => f.label === 'sh')!;
  const narrowHigh = { ...DEFAULTS, freqHz: 8000, q: 4 };
  const tunedLow = { ...DEFAULTS, freqHz: 4000, q: 1.4 };
  assert.ok(detectorDb(sh, tunedLow) > detectorDb(sh, narrowHigh) + 10);
});

test('split-band leaves the body alone; broadband ducks it too', () => {
  const split = processPhrase(PHRASE, { ...DEFAULTS, mode: 'split' });
  const broad = processPhrase(PHRASE, { ...DEFAULTS, mode: 'broadband' });
  PHRASE.forEach((f, i) => {
    assert.equal(split[i].outBody, f.body);
    if (split[i].grDb > 0) assert.ok(broad[i].outBody < f.body);
    assert.ok(Math.abs(split[i].outHiss - broad[i].outHiss) < 1e-12);
  });
});

test('EQ vs de-esser: a static cut dulls the vowels, the de-esser does not', () => {
  const eq = eqCut(PHRASE, 8);
  const de = processPhrase(PHRASE, DEFAULTS);
  const eqLoss = vowelBrightnessLossDb(PHRASE, eq);
  const deLoss = vowelBrightnessLossDb(PHRASE, de);
  assert.ok(Math.abs(eqLoss - 8) < 1e-9);
  assert.ok(deLoss < 0.5, `de-esser vowel loss ${deLoss}`);
  assert.ok(meanSibilantGr(de) > 3);
});

test('over-de-essing stages are ordered and threshold drives them monotonically', () => {
  for (let i = 1; i < OVER_STAGES.length; i++) assert.ok(OVER_STAGES[i].maxGrDb > OVER_STAGES[i - 1].maxGrDb);
  let prev = -1;
  for (const thr of [0, -6, -12, -18, -24, -30, -40]) {
    const gr = meanSibilantGr(processPhrase(PHRASE, { ...DEFAULTS, thresholdDb: thr, rangeDb: 24 }));
    assert.ok(gr >= prev - 1e-9);
    prev = gr;
  }
  assert.equal(overStage(0).id, 'off');
  assert.equal(overStage(3).id, 'transparent');
  assert.equal(overStage(12).id, 'lisp');
  assert.equal(overStage(30).id, 'dull');
});

test('frequency hints sit inside the 2–10 kHz range; SH lower than S hints', () => {
  for (const h of FREQ_HINTS) assert.ok(h.hz >= FREQ_MIN && h.hz <= FREQ_MAX, h.id);
  assert.ok(FREQ_HINTS.find((h) => h.id === 'sh')!.hz < FREQ_HINTS.find((h) => h.id === 'male')!.hz);
});

test('S-frame spectrum peaks in the hiss region and the detector curve peaks at fc', () => {
  const ess = PHRASE[11];
  const sp = sFrameSpectrum(ess, 64);
  let best = 0; for (let i = 1; i < sp.mag.length; i++) if (sp.mag[i] > sp.mag[best]) best = i;
  assert.ok(sp.hz[best] > 5000 && sp.hz[best] < 9000);
  const dc = detectorCurve(DEFAULTS, 64);
  let b2 = 0; for (let i = 1; i < dc.mag.length; i++) if (dc.mag[i] > dc.mag[b2]) b2 = i;
  assert.ok(Math.abs(Math.log(dc.hz[b2] / DEFAULTS.freqHz)) < 0.08);
});

test('detection path: sidechain is filter → detector → threshold → gain computer; main path has a gain element', () => {
  assert.deepEqual(PATH_SIDECHAIN.map((b) => b.id), ['bpf', 'det', 'thr', 'gc']);
  assert.ok(PATH_MAIN.some((b) => b.id === 'gain'));
});
