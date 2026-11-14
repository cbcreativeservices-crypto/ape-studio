/**
 * The shared lab frame, round 2 of the 2026-11-13 bug test (Game Audio pages
 * 1–11 and 12–22, R2-GA1-04, R2-GA2-02, R2-GA2-03 / B-16).
 *
 *  1. R2-GA1-04: at 320 some dock keys were under the 44 pt touch target
 *     (p10 STEP 33, ■ STOP 40; p9 LEVEL / STEP / ■ STOP 43). The 44 floor was
 *     checked only on the tightened row. Every key is now ≥ 44 on every path.
 *  2. R2-GA2-02: dock values ended in "…" ("FACE 9…", "SPEED 4…" at 375,
 *     "UNRE…" at 320), 0.2–0.6 px over their box. On the web every onLayout
 *     width is a whole pixel (offsetWidth), so the key's width and the value's
 *     natural width can each be half a pixel off; the value margin was 0.3 and
 *     the fits-as-authored check a +0.5 slack. A value now keeps a margin that
 *     covers both. And a chooser-fader key (SOUNDS "SPEED 40%" → "SPEED 100%")
 *     asks for room for its widest value, so the keys do not move under a drag.
 *  3. R2-GA2-03 / B-16: "SURFA…" in the p22 bezel at 320 (47.11 px in 46.58):
 *     bezelKeyFit accepted a key up to half a pixel WIDER than its room. A key
 *     now fits with a pixel to spare, or goes short, or goes. The sub line
 *     under a value (DJ Systems "USE A SCAL…" at 320) shrinks to fit too.
 *
 * Widths are the ones measured in the web preview on 2026-11-13.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  BEZEL_KEY_MARGIN_PX,
  DOCK_KEY_GAP,
  DOCK_KEY_GAP_TIGHT,
  DOCK_KEY_PAD,
  DOCK_MIN_KEY_W,
  DOCK_TIGHT_STEPS,
  VALUE_FIT_MARGIN_PX,
  VALUE_MEASURE_PX,
  bezelKeyFit,
  dockKeyNeed,
  dockFitSize,
  dockKeyWidths,
  dockStripFit,
  dockTightRow,
  dockValueFitSize,
  widestLaneValue,
  type DockStripRow,
} from '../src/screens/lab/rack/dockFit.ts';
import { MIN_DISPLAY_PT } from '../src/theme/legibility.ts';

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const sum = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);
/** A phone's dock strip: the screen less the faceplate's 8 px each side. */
const dockAt = (screen: number) => screen - 16;

/** The rows a fit lays the keys on (two when it wraps). */
const rowsOf = (row: DockStripRow) => {
  if (!row.wrap) return [row.widths];
  const half = Math.ceil(row.widths.length / 2);
  return [row.widths.slice(0, half), row.widths.slice(half)];
};

/** dockStripFit as it was before this round (for "nothing changes at 375+"). */
function oldStripFit(needs: readonly number[], stripW: number): DockStripRow | null {
  const gaps = needs.length - 1;
  if (dockKeyWidths(needs, stripW - DOCK_KEY_GAP * gaps) == null) return null;
  const across = (row: readonly number[], gap: number = DOCK_KEY_GAP_TIGHT) => {
    const avail = stripW - gap * (row.length - 1);
    return (dockKeyWidths(row, avail) ?? row.map(() => avail / row.length)).map((w) => Math.floor(w * 100) / 100);
  };
  const wrap = needs.length > 3 && sum(needs) + DOCK_KEY_GAP_TIGHT * gaps > stripW;
  if (!wrap) return { gap: DOCK_KEY_GAP_TIGHT, widths: across(needs), wrap, padX: DOCK_KEY_PAD };
  const tight = dockTightRow(needs, stripW);
  if (tight) return tight;
  const half = Math.ceil(needs.length / 2);
  return { gap: DOCK_KEY_GAP_TIGHT, widths: [...across(needs.slice(0, half)), ...across(needs.slice(half))], wrap, padX: DOCK_KEY_PAD };
}

/** A small seeded random source, so a failure can be replayed. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('1. R2-GA1-04: every dock key is at least 44 wide, on every path', () => {
  it('Game Audio p10 at 320: STEP (33) and ■ STOP (40) now reach 44; the row stays on the screen', () => {
    // The keys' needs as drawn before: the row fitted, so each key got its need.
    const needs = [45, 33, 54, 60, 52, 40];
    assert.ok(sum(needs) + DOCK_KEY_GAP_TIGHT * 5 <= dockAt(320), 'the needs alone fit one row: the old path took them as they were');
    assert.ok(oldStripFit(needs, dockAt(320))!.widths.some((w) => w < DOCK_MIN_KEY_W), 'the regression: keys under 44');
    const row = dockStripFit(needs, dockAt(320))!;
    assert.equal(row.wrap, false, 'still one row');
    assert.ok(sum(row.widths) + row.gap * 5 <= dockAt(320) + 0.01);
    row.widths.forEach((w, i) => {
      assert.ok(w >= DOCK_MIN_KEY_W, `key ${i}: ${w}`);
      assert.ok(w >= needs[i] - 2 * (DOCK_KEY_PAD - row.padX), `key ${i}: ${w} holds its need`);
    });
  });

  it('Game Audio p9 at 320: LEVEL / STEP / ■ STOP (42.66 each) now reach 44, on one row', () => {
    const needs = [40, 30, 57, 47, 52, 40];
    const row = dockStripFit(needs, dockAt(320))!;
    assert.equal(row.wrap, false);
    row.widths.forEach((w, i) => assert.ok(w >= DOCK_MIN_KEY_W, `key ${i}: ${w}`));
  });

  it('equal keys narrower than 44 (seven at 320) are not left equal: they get 44 or take two rows', () => {
    const row = dockStripFit([30, 30, 30, 30, 30, 30, 30], dockAt(320))!;
    assert.ok(row, 'not left at the equal 38.6');
    row.widths.forEach((w) => assert.ok(w >= DOCK_MIN_KEY_W, String(w)));
    for (const r of rowsOf(row)) assert.ok(sum(r) + row.gap * (r.length - 1) <= dockAt(320) + 0.01);
  });

  it('any four to six keys at 320, 375 and 390: each key ≥ 44 and ≥ its need, and no row runs off the screen', () => {
    const rand = rng(20261113);
    for (let t = 0; t < 4000; t++) {
      const n = 4 + Math.floor(rand() * 3);
      const needs = Array.from({ length: n }, () => Math.round(20 + rand() * 60));
      for (const screen of [320, 375, 390]) {
        const strip = dockAt(screen);
        const row = dockStripFit(needs, strip);
        if (row == null) {
          const even = (strip - DOCK_KEY_GAP * (n - 1)) / n;
          assert.ok(even >= DOCK_MIN_KEY_W && needs.every((x) => x <= even), `equal keys only when every need fits: ${needs} at ${screen}`);
          continue;
        }
        const save = 2 * (DOCK_KEY_PAD - row.padX);
        row.widths.forEach((w, i) => {
          assert.ok(w >= DOCK_MIN_KEY_W, `${needs} at ${screen}: key ${i} ${w}`);
          // A wrapped row of two or three keys always has room for each need.
          if (row.wrap || sum(needs) - save * n + row.gap * (n - 1) <= strip) assert.ok(w >= needs[i] - save - 0.01, `${needs} at ${screen}: key ${i} ${w} for ${needs[i]}`);
        });
        for (const r of rowsOf(row)) assert.ok(sum(r) + row.gap * (r.length - 1) <= strip + 0.01, `${needs} at ${screen}: on the screen`);
      }
    }
  });

  it('nothing changes where every key was already 44 or more (375 and 390 docks above all)', () => {
    const rand = rng(7);
    let compared = 0;
    for (let t = 0; t < 4000; t++) {
      const n = 2 + Math.floor(rand() * 5);
      const needs = Array.from({ length: n }, () => Math.round(20 + rand() * 60));
      for (const screen of [320, 375, 390]) {
        const old = oldStripFit(needs, dockAt(screen));
        if (old != null && old.widths.some((w) => w < DOCK_MIN_KEY_W)) continue; // the bug itself
        if (old == null && (dockAt(screen) - DOCK_KEY_GAP * (n - 1)) / n < DOCK_MIN_KEY_W) continue;
        assert.deepEqual(dockStripFit(needs, dockAt(screen)), old, `${needs} at ${screen}`);
        compared++;
      }
    }
    assert.ok(compared > 5000, String(compared));
  });

  it('the tightened row is still tried before a second row (p22 at 320 stays on one row)', () => {
    // p22's needs with the chooser-fader keys holding their widest values
    // ("FACE 355°", "SPEED 100%"): measured 2026-11-13 after the fix.
    const needs = [56, 61, 48, 53, 52, 40];
    const row = dockStripFit(needs, dockAt(320))!;
    assert.equal(row.wrap, false);
    assert.ok(DOCK_TIGHT_STEPS.some((s) => s.padX === row.padX));
    row.widths.forEach((w) => assert.ok(w >= DOCK_MIN_KEY_W));
  });
});

describe('2. R2-GA2-02: a dock value is whole or shrunk, never "…"', () => {
  /** On the web: the key's width and the line's natural width are whole
   *  pixels, each up to half a pixel off; a shrunk mono line also scales up
   *  to 0.2 px off linear. The drawn line must stay inside the real box. */
  const drawnFits = (natural: number, inner: number) => {
    const fs = dockValueFitSize(14, natural, inner);
    if (fs == null) return true; // not even 9 pt: the authored line, as before
    const scaled = fs === 14 ? 0 : 0.2;
    return ((natural + 0.5) * fs) / 14 + scaled <= inner - 0.5 + 1e-9;
  };

  it('the measured cases: "UNREAL" at 320, "FACE 90°" and "SPEED 40%" at 375', () => {
    // p20 TOOL at 320: key 45.66 (read 46), inner 36; "UNREAL" 45.38 (read 45).
    const unreal = dockValueFitSize(14, 45, 46 - 2 - 8)!;
    assert.ok((45.38 * unreal) / 14 <= 35.66, `UNREAL at ${unreal}: ${(45.38 * unreal) / 14} in 35.66`);
    // p22 MOVE at 375 (before the chooser-fader fix the key was 56.5, read 57).
    const face = dockValueFitSize(14, 60, 57 - 10)!;
    assert.ok((60.48 * face) / 14 <= 46.5, `FACE 90° at ${face}`);
    const speed = dockValueFitSize(14, 68, 57 - 10)!;
    assert.ok((68.05 * speed) / 14 <= 46.5, `SPEED 40% at ${speed}`);
  });

  it('every whole-pixel pair: the drawn value stays inside its real box', () => {
    for (let inner = 20; inner <= 80; inner++) for (let natural = 10; natural <= 120; natural++) assert.ok(drawnFits(natural, inner), `${natural} in ${inner}`);
  });

  it('a value a full pixel short of its key stays as authored (p9 "VAR ON" at 375: 45 in 46)', () => {
    assert.equal(dockValueFitSize(14, 45, 46), 14);
    assert.equal(dockValueFitSize(14, 46 - VALUE_MEASURE_PX, 46), 14);
    assert.ok(dockValueFitSize(14, 45.5, 46)! < 14, 'half a pixel short is not enough');
    assert.equal(dockValueFitSize(14, 0, 46), 14, 'not measured yet: as authored');
  });

  it('a key given its need still draws its value at 9 pt or more', () => {
    const chrome = 2 + 2 * DOCK_KEY_PAD;
    for (let v = 10; v <= 120; v += 0.37) {
      const need = dockKeyNeed({ chrome, labelBase: 12, label: 10, valueBase: 14, value: v });
      const fs = dockValueFitSize(14, v, need - chrome);
      assert.ok(fs != null && fs >= MIN_DISPLAY_PT, `${v}: ${fs}`);
    }
    assert.ok(VALUE_FIT_MARGIN_PX >= VALUE_MEASURE_PX);
  });

  it('DockButton measures the value as it is and fits it with dockValueFitSize', () => {
    const s = read('screens/lab/rack/DockButton.tsx');
    assert.match(s, /<MeasureLine style=\{styles\.value\} onWidth=\{setValueW\} onHeight=\{setValueH\}>/);
    assert.doesNotMatch(s, /setValueW\(w \+/, 'no margin added to the measure');
    assert.match(s, /dockValueFitSize\(VALUE_FS, valueW, inner, WEB\)/);
  });
});

describe('4. checker follow-up: the margins are the web\'s; a phone fits exactly as before round 2', () => {
  /** The pre-round-2 value rule: the measure plus 0.3, a half-pixel slack. */
  const oldValueFs = (natural: number, inner: number) => dockFitSize(14, natural > 0 ? natural + 0.3 : natural, inner);
  /** The pre-round-2 need: the value measured plus 0.3, no other margin. */
  const oldNeed = (chrome: number, label: number, v: number) => Math.ceil(chrome + Math.max(label * (MIN_DISPLAY_PT / 12), v > 0 ? ((v + 0.3) * MIN_DISPLAY_PT) / 14 : 0)) + 1;
  /** The pre-round-2 bezel rule: within half a pixel is whole. */
  const oldBezel = (avail: number, key: number, narrow?: number) =>
    !(avail > 0) || !(key > 0) ? 'full' : key <= avail + 0.5 ? 'full' : narrow != null && narrow > 0 && narrow <= avail + 0.5 ? 'narrow' : 'none';

  it('a dock value: native is the old rule at every width pair (Meter Waterfall CONCRETE stays 10.9 on a phone)', () => {
    for (let inner = 20; inner <= 80; inner += 0.25) for (let natural = 0; natural <= 120; natural += 0.5) assert.equal(dockValueFitSize(14, natural, inner, false), oldValueFs(natural, inner), `${natural} in ${inner}`);
  });

  it('a key\'s need: native is the old need', () => {
    for (let v = 0; v <= 120; v += 0.37) for (const label of [10, 30, 60]) assert.equal(dockKeyNeed({ chrome: 10, labelBase: 12, label, valueBase: 14, value: v, web: false }), oldNeed(10, label, v), `${label} / ${v}`);
  });

  it('a bezel key: native is the old half-pixel slack (Sound Systems CHECKS, TOTAL LOAD, SPL @ 10 m stay on a phone)', () => {
    for (let avail = 10; avail <= 120; avail += 0.25) for (let key = 5; key <= 130; key += 0.5) assert.equal(bezelKeyFit(avail, key, 20, false), oldBezel(avail, key, 20), `${key} in ${avail}`);
    // CHECKS on a phone: 41.83 in 42.00 is whole, as before.
    assert.equal(bezelKeyFit(42, 41.83, undefined, false), 'full');
  });

  it('the components decide by platform: the web takes the margins, a phone does not', () => {
    const btn = read('screens/lab/rack/DockButton.tsx');
    assert.match(btn, /const WEB = Platform\.OS === 'web';/);
    assert.match(btn, /web: WEB,/);
    const bez = read('screens/lab/rack/BezelReadouts.tsx');
    assert.match(bez, /const WEB = Platform\.OS === 'web';/);
    assert.match(bez, /bezelKeyFit\(keyAvail, keyW, it\.kNarrow \? narrowW : undefined, WEB\)/);
    assert.match(bez, /setCellW\(WEB \? Math\.floor\(e\.nativeEvent\.layout\.width\) : Math\.round\(e\.nativeEvent\.layout\.width\)\)/);
    assert.match(bez, /const subFs = WEB && it\.sub \?/, 'the sub line\'s fit is the web\'s; fitValue shrinks it on a phone');
  });
});

describe('5. checker test gaps (mutations M06, M16, M17)', () => {
  it('M06: three keys or fewer never wrap, even when one is very wide ([220, 30, 30] at 320)', () => {
    const row = dockStripFit([220, 30, 30], dockAt(320))!;
    assert.equal(row.wrap, false);
    assert.equal(row.widths.length, 3);
    assert.ok(sum(row.widths) + row.gap * 2 <= dockAt(320) + 0.01, 'one row, on the screen');
    assert.ok(row.widths[0] >= 220, 'the wide key keeps its need');
  });

  it('M16: the fitted sub-line size is put on the drawn sub line, and the sub is measured', () => {
    const s = read('screens/lab/rack/BezelReadouts.tsx');
    assert.match(s, /<Text style=\{\[styles\.v, styles\.unit, it\.tint \? \{ color: it\.tint \} : null, subFs !== SUB_FS \? \{ fontSize: subFs \} : null\]\} \{\.\.\.fitValue\(subFs\)\}>\s*\{it\.sub\}/);
    assert.match(s, /onLayout=\{\(e\) => setSubW\(e\.nativeEvent\.layout\.width\)\}>\s*\{it\.sub\}/);
  });

  it('M17: the widest-value line is measured, and only for a key that has one', () => {
    const s = read('screens/lab/rack/DockButton.tsx');
    assert.match(s, /\{!isKey && value && valueSpan \? \(\s*<MeasureLine style=\{styles\.value\} onWidth=\{setSpanW\}>\s*\{valueSpan\}\s*<\/MeasureLine>/);
  });
});

describe('2b. a chooser-fader key holds still under the drag', () => {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const facing = (v: number) => `${Math.min(71, Math.max(0, Math.round(v * 72))) * 5}°`;

  it('the widest value over the lane: "SPEED 100%", "FACE 355°"', () => {
    assert.equal(widestLaneValue((v) => `SPEED ${pct(v)}`, 'SPEED 40%'), 'SPEED 100%');
    assert.equal(widestLaneValue((v) => `FACE ${facing(v)}`, 'FACE 90°').length, 'FACE 355°'.length);
  });

  it('never less than today\'s value, and a format that throws is skipped', () => {
    assert.equal(widestLaneValue(() => 'A', 'TODAY IS LONG'), 'TODAY IS LONG');
    assert.equal(
      widestLaneValue((v) => {
        if (v > 0.5) throw new Error('no');
        return 'OK';
      }, 'X'),
      'OK',
    );
  });

  it('the need is the same at 40% and at 100%: the keys do not move', () => {
    // "SPEED 40%" measured 68.05 at 14 pt, "SPEED 100%" 75.6 (mono: one more glyph).
    const key = { chrome: 10, labelBase: 12, label: 56.5, spaced: 46, spacedGlyph: 56.5, trackPx: 3.5, valueBase: 14 };
    const span = 75.6;
    const at40 = dockKeyNeed({ ...key, value: Math.max(68.05, span) });
    const at100 = dockKeyNeed({ ...key, value: Math.max(75.6, span) });
    assert.equal(at40, at100);
  });

  it('RackUnit gives a chooser-fader its span; DockButton asks for it (a plain fader still asks for nothing)', () => {
    const rack = read('screens/lab/rack/RackUnit.tsx');
    assert.match(rack, /valueSpan=\{p\.chooser \? widestLaneValue\(p\.formatShort \?\? p\.format, \(p\.formatShort \?\? p\.format\)\(p\.value\)\) : undefined\}/);
    const btn = read('screens/lab/rack/DockButton.tsx');
    assert.match(btn, /value: glyph === '▪' \? 0 : valueSpan \? Math\.max\(valueW, spanW\) : valueW,/);
  });
});

describe('3. R2-GA2-03 / B-16: a bezel key is whole, short or gone', () => {
  it('"SURFACE" at 320 with MUSIC ALERT: 47 px measured in a 47 px room is not whole', () => {
    // cell 63.58 (read 64) − 16 padding − 1 border = 47; key 47.11 (read 47).
    assert.notEqual(bezelKeyFit(47, 47), 'full');
    assert.equal(bezelKeyFit(47, 47), 'none');
    assert.equal(bezelKeyFit(47, 47, 30), 'narrow', 'a short form that fits is used');
  });

  it('"LAST TAKE" at 375 (54.36 px in 53.81): not drawn whole', () => {
    assert.notEqual(bezelKeyFit(54, 54), 'full');
  });

  it('every whole-pixel pair: a key drawn whole fits its real cell', () => {
    for (let avail = 10; avail <= 120; avail++)
      for (let key = 5; key <= 130; key++) if (bezelKeyFit(avail, key) === 'full') assert.ok(key + 0.5 <= avail - 0.5 + 1e-9, `${key} in ${avail}`);
    assert.ok(BEZEL_KEY_MARGIN_PX >= 1, 'the two half-pixel measures');
  });

  it('a key with a pixel to spare is drawn as before', () => {
    assert.equal(bezelKeyFit(57, 56), 'full');
    assert.equal(bezelKeyFit(0, 56), 'full', 'not measured yet');
  });

  it('BezelReadouts floors the cell width and fits the sub line', () => {
    const s = read('screens/lab/rack/BezelReadouts.tsx');
    assert.match(s, /setCellW\(WEB \? Math\.floor\(e\.nativeEvent\.layout\.width\)/, 'floored on the web');
    assert.match(s, /const subFs = WEB && it\.sub \? \(dockValueFitSize\(SUB_FS, subW, keyAvail\) \?\? SUB_FS\) : SUB_FS;/);
    assert.match(s, /\{\.\.\.fitValue\(subFs\)\}/);
  });

  it('the DJ Systems sub lines at 320 ("USE A SCALE", "dBA (MODEL)", "SETTING UP") fit at 9 pt or more', () => {
    // natural at 11 pt, read whole; the cell's inner width 57 (57.75 drawn).
    for (const natural of [65, 65, 59]) {
      const fs = dockValueFitSize(11, natural, 57);
      assert.ok(fs != null && fs >= MIN_DISPLAY_PT && fs < 11, `${natural}: ${fs}`);
      assert.ok(((natural + 0.5) * fs) / 11 + 0.2 <= 56.5, `${natural} drawn at ${fs}`);
    }
  });
});
