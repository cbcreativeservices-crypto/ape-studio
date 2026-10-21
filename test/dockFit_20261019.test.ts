/**
 * The shared Rack dock, every lab (owner 2026-10-19: "shrink cut-off dock
 * words at 320 px to fit (9 pt minimum) in the shared dock"). A key's label
 * or value that would end in "…" shrinks to fit, never under 9 pt; one that
 * fits today is drawn exactly as before; one that cannot fit even at 9 pt
 * keeps the old line. The widths below are the ones measured in the web
 * preview (2026-10-19).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIT_SLACK_PX, dockFitSize, dockLabelFit } from '../src/screens/lab/rack/dockFit.ts';
import { MIN_DISPLAY_PT } from '../src/theme/legibility.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

describe('the shared dock: shrink to fit, 9 pt minimum (owner 2026-10-19)', () => {
  it('a line that fits today is drawn at its authored size, exactly (no change at 390)', () => {
    // 390 wide: "PLATTER ▸" 58 px in a 58 px key, "STOPPED" 53 px — as before
    assert.equal(dockFitSize(12, 58, 58), 12);
    assert.equal(dockFitSize(14, 53, 58), 14);
    assert.equal(dockFitSize(12, 46 + FIT_SLACK_PX, 46), 12, 'within half a pixel already fits');
    assert.deepEqual(dockLabelFit(12, 58, 58, 51.5, 62), { fs: 12, tight: false, tracked: true });
  });
  it('before the widths are measured nothing changes', () => {
    assert.equal(dockFitSize(14, 0, 46), 14);
    assert.equal(dockFitSize(14, 53, 0), 14);
    assert.deepEqual(dockLabelFit(12, 0, 0, 0, 0), { fs: 12, tight: false, tracked: true });
    assert.deepEqual(dockLabelFit(12, 57.7, 0, 47.2, 57.7, 4), { fs: 12, tight: false, tracked: true });
  });
  it('a value that would be cut shrinks to the largest size that fits, never under 9', () => {
    // 320 wide: "STOPPED" / "DJ2 OUT" / "HANDOFF" — 52.9 px at 14 in a 45.8 px key
    const fs = dockFitSize(14, 52.9, 45.8)!;
    assert.ok(fs < 14 && fs >= MIN_DISPLAY_PT, String(fs));
    assert.ok((52.9 * fs) / 14 <= 45.8, 'it fits');
    assert.ok((52.9 * (fs + 0.1)) / 14 > 45.8 - 0.4, 'and is not needlessly small');
  });
  it('a value that cannot fit even at 9 pt keeps the old behaviour (null)', () => {
    assert.equal(dockFitSize(14, 120, 45.8), null);
  });
  it('a label keeps its 12-pt verb glyph; the label shrinks around it', () => {
    // "THRESH ▪": the line 49.2 px, the label alone 41.0, the glyph 8.3
    const r = dockLabelFit(12, 49.2, 45.8, 44.4, 52.7, 3.5);
    assert.equal(r.tight, true);
    assert.ok(r.fs >= MIN_DISPLAY_PT && r.fs < 12);
    assert.ok((44.4 * r.fs) / 12 + (52.7 - 44.4) <= 45.8, 'label + its 12-pt glyph fit');
  });
  it('a long label goes TIGHT, then lets its tracking go, before it falls back', () => {
    // "ATK/REL ▸" at 320: 57.7 px as drawn, 47.2 with its space in the label font, ▸ 10.5
    const r = dockLabelFit(12, 57.7, 45.8, 47.2, 57.7, 4);
    assert.equal(r.tight, true);
    assert.equal(r.tracked, false, 'tracked it would be 8.97 pt — under the floor');
    assert.ok(r.fs >= MIN_DISPLAY_PT);
    // "MAKEUP ▸" fits tight with its tracking kept
    const m = dockLabelFit(12, 57.3, 45.8, 46.7, 57.2, 3.5);
    assert.deepEqual([m.tight, m.tracked], [true, true]);
    assert.ok(m.fs >= MIN_DISPLAY_PT);
    // a label far too long for any of that: today's line, unchanged
    assert.deepEqual(dockLabelFit(12, 120, 45.8, 110, 120.5, 6), { fs: 12, tight: false, tracked: true });
  });
  it('a label with no glyph (a key) just shrinks, or falls back', () => {
    assert.deepEqual(dockLabelFit(12, 41, 41), { fs: 12, tight: false, tracked: true });
    const k = dockLabelFit(12, 50, 45.8);
    assert.equal(k.tight, false);
    assert.ok(k.fs >= MIN_DISPLAY_PT && k.fs < 12);
    assert.deepEqual(dockLabelFit(12, 90, 45.8), { fs: 12, tight: false, tracked: true });
  });
  it('DockButton: measured off screen and unread, the value on fitValue at the size it fits, the glyph never shrunk', () => {
    const s = read('src/screens/lab/rack/DockButton.tsx');
    assert.match(s, /accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden/);
    assert.match(s, /\{\.\.\.fitValue\(valueFs\)\}/);
    assert.match(s, /const valueFs = \(value \? dockFitSize\(VALUE_FS, valueW, inner\) : VALUE_FS\) \?\? VALUE_FS;/, 'null (not even 9 pt) → the authored 14, as before');
    // the glyph's own style never takes the shrunk size
    for (const m of s.matchAll(/<Text style=\{\[styles\.glyph[^\]]*\]\}/g)) assert.doesNotMatch(m[0], /labelSize/);
    assert.match(s, /glyph: \{ fontSize: 12, color: colors\.textSub \}/);
    assert.match(s, /label: \{ fontFamily: fonts\.oswaldSemiBold, fontSize: 12, letterSpacing: 0\.5, color: colors\.textSub \}/);
    assert.match(s, /value: \{ fontFamily: fonts\.mono, fontSize: 14, color: colors\.amber \}/);
    assert.match(s, /const LABEL_FS = 12;\s*const LABEL_SPACING = 0\.5;\s*const VALUE_FS = 14;/, 'the constants match the styles');
  });
});
