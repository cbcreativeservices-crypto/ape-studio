/**
 * OVERNIGHT 2026-10-24, pass 2 - area "tools". Receipts; each failed before its fix.
 *
 *  1. iPAD LANDSCAPE (owner priority, same class as the Home carousel titles):
 *     the Advanced Tuner (CenterLock) full screen gave its landscape note a
 *     FIXED 280 pt column measured on a phone, while the note's font grows
 *     with the window height (0.45 x height). On a phone in landscape
 *     (height <= 430) the note is <= ~194 pt and fits; on an iPad in landscape
 *     (820 / 834 / 1024 tall) it is 369-461 pt, so "D#4" is ~550-690 pt wide in
 *     a 280 pt box that CENTRES it: the overflow spills equally both ways, off
 *     the LEFT edge of the screen and over the meter column (the 2026-09-06
 *     "clipped the note off the left edge" failure, back on a tablet). On a
 *     tablet the column now grows to the note (and the note never outgrows the
 *     column); phones keep exactly 280 and their own size.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { landscapeNoteFit, NOTE_COL_W_PHONE, NOTE_ROW_W_EM } from '../src/features/tools/tuner/centerLock.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** The screen's own landscape font size before the fit (CenterLockTuner bigSize, no trim). */
const rawLandscapeSize = (h: number) => {
  // padTop ~ max(inset, 8) + 6, padBottom ~ 8, bar 52, foot 32 (the screen's estimate).
  const avail = h - 14 - 8 - 52 - 32;
  const em = 1.26 + 0.03; // iOS NOTE_LINE_EM + NOTE_TOP_EM
  return Math.max(64, Math.round(Math.max(96, Math.min(h * 0.45, (avail - 24 - 36 - 44) / em))));
};
/** The meter column the screen gives the rest of the row (CenterLockTuner meterW). */
const meterWFor = (w: number, colW: number) => Math.min(Math.max(240, w - colW - 76), 720);

test('1. iPad landscape: the tuner note fits its column and the row fits the window', () => {
  for (const [w, h] of [
    [1180, 820],
    [1194, 834],
    [1366, 1024],
    [1133, 744],
    [1024, 768],
  ] as const) {
    const raw = rawLandscapeSize(h);
    // The old fixed column could not hold the note at this size:
    assert.ok(raw * NOTE_ROW_W_EM > NOTE_COL_W_PHONE, `${w}x${h}: the phone column was too narrow (${raw} pt note)`);
    const fit = landscapeNoteFit(w, h, raw);
    assert.ok(fit.size * NOTE_ROW_W_EM <= fit.colW, `${w}x${h}: note ${fit.size} pt must fit its ${fit.colW} pt column`);
    // padding 16 x 2 + gap 24 + note column + meter column inside the window
    assert.ok(32 + 24 + fit.colW + meterWFor(w, fit.colW) <= w, `${w}x${h}: the row overflows the window`);
    // The tablet keeps a big note (never shrunk to the phone's).
    assert.ok(fit.size >= 0.9 * raw, `${w}x${h}: the note should stay near its height-driven size`);
  }
});

test('1. phones (any way up) keep the 280 pt column and their own size', () => {
  for (const [w, h, s] of [
    [844, 390, 175],
    [932, 430, 193],
    [667, 375, 168],
    [390, 844, 180],
  ] as const) {
    assert.deepEqual(landscapeNoteFit(w, h, s), { colW: NOTE_COL_W_PHONE, size: s });
  }
  assert.equal(NOTE_COL_W_PHONE, 280);
});

test('1. the screen uses the fit for the landscape column and the note size', () => {
  const src = read('src/screens/tools/CenterLockTuner.tsx');
  assert.doesNotMatch(src, /const NOTE_COL_W = 280;/, 'no fixed phone column in the screen');
  assert.match(src, /const noteFit = landscapeNoteFit\(width, height, bigSizeRaw\);/);
  assert.match(src, /const NOTE_COL_W = noteFit\.colW;/);
  assert.match(src, /const bigSize = landscape \? noteFit\.size : bigSizeRaw;/);
});
