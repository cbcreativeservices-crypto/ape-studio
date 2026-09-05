/**
 * Study-method sentence rules (text audit 2026-09-05): the answer must never be
 * written in the question — exact term, its word variants, a word of a
 * multi-word answer, or its abbreviation — and a fill-in-the-blank must always
 * have somewhere to put the answer.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitSentences,
  wordRoot,
  findLeaks,
  findSecondaryLeaks,
  maskLeaks,
  fibSentence,
  matchingSentenceV2,
  BLANK,
} from '../src/features/study/sentences.ts';

test('wordRoot strips one common suffix but keeps ≥3 letters', () => {
  assert.equal(wordRoot('bouncing'), 'bounc');
  assert.equal(wordRoot('phases'), 'phas');
  assert.equal(wordRoot('mixing'), 'mix');
  assert.equal(wordRoot('bus'), 'bus');
  assert.equal(wordRoot('power'), 'pow'); // 'er' stripped; 'pow' + inflections still matches power/powered
});

test('a word VARIANT of a single-word term is a leak', () => {
  const hits = findLeaks('Bounce', 'Bouncing the tracks combines them into one file.');
  assert.ok(hits.some((h) => h.kind === 'variant' && /bouncing/i.test(h.match)));
});

test('a significant WORD of a multi-word term is a partial leak; stopwords are not', () => {
  const hits = findLeaks('Phantom Power', 'The console supplies 48 volts of power to the capsule.');
  assert.ok(hits.some((h) => h.kind === 'partial' && /power/i.test(h.match)));
  const none = findLeaks('Audio Interface', 'The audio passes through the converter.');
  assert.equal(none.filter((h) => h.kind === 'partial').length, 0); // 'audio' is a stopword
});

test('the parenthetical abbreviation is a leak; the exact term is reported as exact', () => {
  const hits = findLeaks('Sound Pressure Level (SPL)', 'Meters read SPL in decibels; sound pressure level rises with distance.');
  assert.ok(hits.some((h) => h.kind === 'abbreviation' && h.match === 'SPL'));
  assert.ok(hits.some((h) => h.kind === 'exact'));
});

test('maskLeaks blanks every leak and collapses adjacent blanks', () => {
  const out = maskLeaks('Compressor', 'A compressor compresses; compressors compress loud peaks.');
  assert.ok(!/compress/i.test(out), out);
  assert.ok(out.includes(BLANK));
  assert.ok(!out.includes(`${BLANK} ${BLANK}`), out);
});

test('fibSentence prefers a sentence containing the term with no other leaks', () => {
  const def = 'A limiter stops peaks. The limiting action is fast. Engineers use it on the master.';
  const r = fibSentence('Limiter', def);
  assert.equal(r.hasBlank, true);
  assert.ok(r.masked.includes(BLANK));
  assert.equal(findSecondaryLeaks('Limiter', r.masked).length, 0);
  assert.ok(!/limit/i.test(r.masked), r.masked);
});

test('fibSentence reports hasBlank:false when no sentence contains the term', () => {
  const def = 'It removes low-frequency rumble below a set point. The slope is measured in dB per octave.';
  const r = fibSentence('High-Pass Filter', def);
  assert.equal(r.hasBlank, false);
  assert.equal(findLeaks('High-Pass Filter', r.masked).length, 0);
});

test('matchingSentenceV2 never returns a clue that leaks the term or a variant', () => {
  const def = 'Phasing occurs when two copies arrive at different times. The result is a comb-filter sound. Phase problems are common with two mics.';
  for (let i = 0; i < 20; i++) {
    const clue = matchingSentenceV2('Phase', def);
    assert.equal(findLeaks('Phase', clue).length, 0, clue);
  }
});

test('splitSentences keeps decimals and citations intact', () => {
  const parts = splitSentences('OSHA 1910.95 sets the limit at 90 dBA over 8 hours. A 16.61 ms delay is one frame.');
  assert.equal(parts.length, 2);
  assert.ok(parts[0].includes('1910.95'));
});
