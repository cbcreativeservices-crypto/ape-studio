/**
 * The progress meter must announce the number it prints.
 *
 * ⛔ WHAT THIS PINS (owner walkthrough 2026-09-21, found on a real phone).
 * `LedMeterWell` derived its screen-reader percentage from `filled` — the
 * value already rounded into 21 segments — so it round-tripped
 * pct → segments → pct. Observed live on Flashcards: the screen read **12%**
 * while the accessibility label announced **14%** (11.9% → 3 segments →
 * 14.28%). A blind learner was told a different number from a sighted one, on
 * the same control, at the same moment.
 *
 * Each segment is 100/21 ≈ 4.76 points, so the drift reaches ~2.4 points —
 * small, but it is a number the app states twice and gets wrong once.
 *
 * The component takes a `pct` prop now. These tests mirror both the old
 * derivation and the new one so the gap is measured rather than asserted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const SEG_COUNT = 21;

/** What the screens print. */
const printed = (pct: number) => (pct >= 100 ? 100 : Math.min(Math.round(pct), 99));
/** What the screens pass as `filled`. */
const segmentsForPct = (pct: number) => Math.round((Math.max(0, Math.min(100, pct)) / 100) * SEG_COUNT);
/** The OLD label: re-derived from the segment count. */
const announcedOld = (filled: number) => Math.round((Math.max(0, Math.min(SEG_COUNT, filled)) / SEG_COUNT) * 100);
/** The NEW label: the real percentage, rounded once. */
const announcedNew = (pct: number) => Math.round(pct);

test('the exact case seen on the phone: 11.9% printed 12 and announced 14', () => {
  const pct = (27 / 226) * 100; // 27 of 226 cards
  assert.equal(printed(pct), 12);
  assert.equal(announcedOld(segmentsForPct(pct)), 14, 'the old derivation really did say 14');
  assert.equal(announcedNew(pct), 12, 'the new label must agree with the screen');
});

test('printed and announced now agree across the whole range', () => {
  const bad: string[] = [];
  for (let n = 0; n <= 1000; n++) {
    const pct = (n / 1000) * 100;
    if (announcedNew(pct) !== printed(pct) && pct < 100) {
      // printed() clamps to 99 below 100 on purpose — "100%" is reserved for
      // genuinely finished. Allow exactly that one difference.
      if (!(printed(pct) === 99 && announcedNew(pct) === 100)) bad.push(pct.toFixed(1));
    }
  }
  assert.deepEqual(bad, [], `announced != printed at: ${bad.slice(0, 10).join(', ')}`);
});

test('the old derivation was wrong often, not rarely — so this was worth fixing', () => {
  let wrong = 0;
  for (let n = 0; n <= 100; n++) {
    if (announcedOld(segmentsForPct(n)) !== printed(n)) wrong++;
  }
  // Quantising to 21 segments misses most whole percentages.
  assert.ok(wrong > 50, `expected the old label to be wrong for most values, got ${wrong}/101`);
});

test('a zero fill still announces zero, not the min-1 display floor', () => {
  // LedMeterWell lights at least one segment so the meter never looks dead.
  // That floor is a DISPLAY choice and must not reach the announcement.
  assert.equal(announcedNew(0), 0);
});
