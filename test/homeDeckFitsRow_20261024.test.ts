/**
 * iPad landscape (owner 2026-10-24, from a real iPad): the captions above the
 * Home carousel cards ("INCLUDED FOR EVERYONE", "SET UP WHAT YOU STUDY")
 * vanished in landscape. The card was sized from a fixed chrome budget while
 * the carousel row flex-fills what is really left and centres its items, so a
 * short row cut the caption strip off the top. The card now fits the MEASURED
 * row (fitCardToRow); a card that already fits is untouched.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CAPTION_STRIP_H, cardDimsFor, fitCardToRow } from '../src/screens/courses/cardDims.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('a card that fits its row is returned unchanged (no phone or portrait iPad moves)', () => {
  const phone = cardDimsFor(393, 852, 393, 852);
  assert.equal(fitCardToRow(phone, phone.h + CAPTION_STRIP_H + 40, false), phone);
  assert.equal(fitCardToRow(phone, null, false), phone); // before the first layout
  const ipadPortrait = cardDimsFor(834, 1194, 834, 1194);
  assert.equal(fitCardToRow(ipadPortrait, 800, true), ipadPortrait);
});

test('iPad landscape: caption + card never taller than the measured row', () => {
  const base = cardDimsFor(1194, 834, 1194, 834); // 440 tall by the phone budget
  for (const row of [430, 389, 313]) {
    const fit = fitCardToRow(base, row, true);
    assert.ok(fit.h + CAPTION_STRIP_H <= row, `row ${row}: unit ${fit.h + CAPTION_STRIP_H}`);
    assert.ok(fit.w <= base.w && fit.w >= 220, `row ${row}: width ${fit.w}`);
    assert.deepEqual(fit.card, { width: fit.w, height: fit.h });
  }
});

test('the screen measures the row and every card reads the fitted size', () => {
  const s = read('src/screens/courses/CourseSelectionScreen.tsx');
  assert.match(s, /onLayout=\{\(e\) => \{\n\s+const h = Math\.round\(e\.nativeEvent\.layout\.height\);/);
  assert.match(s, /fitCardToRow\(baseDims, deckRowH, tabletWindow\)/);
  assert.match(s, /<DeckDimsContext\.Provider value=\{cd\}>/);
  assert.match(s, /const cd = useContext\(DeckDimsContext\) \?\? ownDims;/);
});
