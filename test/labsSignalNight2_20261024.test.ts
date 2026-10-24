/**
 * labsSignal — overnight toddler pass 2 (2026-10-24), receipts.
 *
 * Owner priority: iPad LANDSCAPE must not hide titles/labels that portrait
 * shows (the Home carousel caption class).
 *
 * 1. Calculator Lab category popup. The popup card is capped at 720 pt on a
 *    tablet (popCardTablet), so it is the SAME width in iPad portrait
 *    (820 − 32 → 720) and landscape (1180 − 32 → 720). The tiles inside chose
 *    their width from the WINDOW (winW ≥ 1100 → 24 %, four across), so only in
 *    landscape four ~163 pt tiles were crammed into the box portrait fills with
 *    three ~218 pt tiles — and the calculator NAMES and taglines (both
 *    numberOfLines={2}) were cut to "…" in landscape only. Fix: the popup
 *    widens (960 pt) exactly when the tiles go four across, so a landscape
 *    tile is as wide as a portrait one (the iPad pass's four-across rule kept).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('Calculator Lab popup tiles on an iPad in landscape', () => {
  const src = read('src/screens/lab/calc/CalcLabScreen.tsx');

  it('four-across tiles are still chosen from a landscape-wide window (iPad pass 2026-10-06)', () => {
    assert.match(src, /winW >= 1100 \? styles\.tileFrameTabletWide : styles\.tileFrameTablet/);
  });

  it('the popup that holds them widens with them, so landscape tiles are no narrower than portrait', () => {
    // Portrait: 3 × 32 % of a 720 box ≈ 218 pt. Landscape: 4 × 24 % must sit
    // in a box of at least 720 × 32/24 = 960 pt, or the names are cut.
    const m = /popCardTabletWide: \{ maxWidth: (\d+) \}/.exec(src);
    assert.ok(m, 'no wide popup card for the four-across tiles');
    assert.ok(Number(m![1]) >= Math.ceil((720 * 32) / 24), `wide popup ${m![1]} pt is narrower than 960 pt`);
    assert.match(
      src,
      /style=\{\[styles\.popCard, tablet && styles\.popCardTablet, tablet && popWide && styles\.popCardTabletWide\]\}/,
      'the wide popup card is not applied with the four-across tiles',
    );
    // Same threshold as the tile switch, so the two can never disagree.
    assert.match(src, /const popWide = winW >= 1100;/);
  });

  it('a landscape iPad window is wide enough for the 960 pt popup plus its 16 pt margins', () => {
    for (const w of [1180, 1194, 1366]) assert.ok(w - 32 >= 960, `${w}`);
  });
});
