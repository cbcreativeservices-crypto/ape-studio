/**
 * The shared lab frame's four held items (owner 2026-11-13: "do your
 * recommended fixes for the 4 held items"; Game Audio bug tests 1 and 2 of
 * 2026-11-13, audit 2 F13).
 *
 *  1. Six dock keys wrapped to two rows on a 320-wide phone (page 22 needed
 *     ~318 px of a 304 px dock). A narrow dock now tightens the keys' side
 *     padding and gap before it wraps; 375 and 390 are untouched.
 *  2. The first-visit intro card rose over a tray the learner had opened, or
 *     arrived late on top of a drag. Work under way in the rack now holds an
 *     owed card and drops it for this visit, and closes a card already up.
 *  3. A sticky tray's note "· stays open — compare while you watch" cut the
 *     page's own title. The note shortens, then goes; the title is never cut.
 *  4. A bezel key ended in "…" when its value fitted. It now shows whole, as
 *     its short form (kNarrow), or not at all; the value stays whole.
 *
 * The widths below are the ones measured in the web preview on 2026-11-13.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  DOCK_KEY_GAP_TIGHT,
  DOCK_KEY_PAD,
  DOCK_MIN_KEY_W,
  DOCK_TIGHT_STEPS,
  TRAY_STICKY_NOTE,
  TRAY_STICKY_NOTE_SHORT,
  VALUE_FIT_MARGIN_PX,
  LABEL_FIT_MARGIN_PX,
  bezelKeyFit,
  dockFitSize,
  dockKeyNeed,
  dockLabelFit,
  dockStripFit,
  dockTightRow,
  trayTitleFit,
} from '../src/screens/lab/rack/dockFit.ts';
import { introWorkAction } from '../src/features/lab/screenGuide/introHold.ts';
import { MIN_DISPLAY_PT } from '../src/theme/legibility.ts';

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const sum = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);
/** A phone's dock strip: the screen less the faceplate's 8 px each side. */
const dockAt = (screen: number) => screen - 16;

/** Game Audio page 22's six keys, measured at 320 (natural widths at the
 *  authored 12 pt label / 14 pt value). `spaced` = label + space, `glyphed` =
 *  that + the 12 pt verb glyph; a toggle (SOUND) carries an LED (14 px). */
const P22 = [
  { name: 'MOVE', spaced: 32.2, glyphed: 42.7, chars: 4, value: 60.48 },
  { name: 'SOUNDS', spaced: 46, glyphed: 56.5, chars: 6, value: 68.05 },
  { name: 'MUSIC', spaced: 37.45, glyphed: 47.95, chars: 5, value: 22.69 },
  { name: 'REPORT', spaced: 44.4, glyphed: 54.9, chars: 6, value: 45.38 },
] as const;
const keyOf = (k: (typeof P22)[number]) => ({
  chrome: 2 + 2 * DOCK_KEY_PAD,
  labelBase: 12,
  label: k.glyphed,
  spaced: k.spaced,
  spacedGlyph: k.glyphed,
  trackPx: (k.chars + 1) * 0.5,
  valueBase: 14,
  value: k.value + VALUE_FIT_MARGIN_PX,
});
const P22_NEEDS = [
  ...P22.map((k) => dockKeyNeed(keyOf(k))),
  dockKeyNeed({ chrome: 2 + 2 * DOCK_KEY_PAD + 14, labelBase: 12, label: 35.94 }), // SOUND (toggle, LED)
  dockKeyNeed({ chrome: 2 + 2 * DOCK_KEY_PAD, labelBase: 12, label: 38.03 }), // ■ STOP (action)
];

describe('item 1: a narrow dock tightens its chrome before it wraps', () => {
  it('page 22 at 320: the least widths are the measured ~318 px against a 304 px dock', () => {
    assert.deepEqual(P22_NEEDS, [51, 55, 48, 53, 52, 40]);
    assert.ok(sum(P22_NEEDS) + DOCK_KEY_GAP_TIGHT * 5 > dockAt(320), 'at the authored chrome they cannot share one row');
  });

  it('page 22 at 320: one row, keys at 2 px padding, every key at least 44 wide, on the screen', () => {
    const row = dockStripFit(P22_NEEDS, dockAt(320))!;
    assert.equal(row.wrap, false);
    assert.equal(row.padX, DOCK_TIGHT_STEPS[0].padX);
    assert.equal(row.gap, DOCK_TIGHT_STEPS[0].gap);
    assert.equal(row.widths.length, 6);
    assert.ok(sum(row.widths) + row.gap * 5 <= dockAt(320) + 0.01, 'the row stays on the screen');
    row.widths.forEach((w, i) => {
      assert.ok(w >= DOCK_MIN_KEY_W, `key ${i}: ${w} wide`);
      assert.ok(w >= P22_NEEDS[i] - 2 * (DOCK_KEY_PAD - row.padX), `key ${i}: ${w} for its tightened need`);
    });
  });

  it('page 22 at 320: every label and value still fits at 9 pt or more in its tightened key', () => {
    const row = dockStripFit(P22_NEEDS, dockAt(320))!;
    P22.forEach((k, i) => {
      const inner = row.widths[i] - 2 - 2 * row.padX;
      const f = dockLabelFit(12, k.glyphed, inner, k.spaced, k.glyphed, (k.chars + 1) * 0.5, LABEL_FIT_MARGIN_PX);
      const glyph = k.glyphed - k.spaced;
      const line = f.tight ? ((k.spaced - (f.tracked ? 0 : (k.chars + 1) * 0.5)) * f.fs) / 12 + glyph : (k.glyphed * f.fs) / 12;
      assert.ok(f.fs >= MIN_DISPLAY_PT, `${k.name} label at ${f.fs}`);
      assert.ok(line <= inner, `${k.name} label ${line} in ${inner}`);
      const v = dockFitSize(14, k.value + VALUE_FIT_MARGIN_PX, inner);
      assert.ok(v != null && v >= MIN_DISPLAY_PT, `${k.name} value at ${v}`);
    });
  });

  it('page 22 at 375 and 390: exactly as before (no tightening; 390 keeps equal keys and the normal gap)', () => {
    assert.equal(dockStripFit(P22_NEEDS, dockAt(390)), null, '390: equal keys, normal gap');
    const at375 = dockStripFit(P22_NEEDS, dockAt(375))!;
    assert.equal(at375.wrap, false);
    assert.equal(at375.padX, DOCK_KEY_PAD, '375: the authored padding');
    assert.equal(at375.gap, DOCK_KEY_GAP_TIGHT);
  });

  it('a dock that already fits one row at the tight gap is never tightened', () => {
    // Not equal at the normal gap, but one row at the tight gap: as before.
    const row = dockStripFit([58, 56, 56, 56, 56], dockAt(320))!;
    assert.equal(row.wrap, false);
    assert.equal(row.gap, DOCK_KEY_GAP_TIGHT);
    assert.equal(row.padX, DOCK_KEY_PAD);
    assert.equal(dockTightRow([40, 40], dockAt(320))?.padX, DOCK_TIGHT_STEPS[0].padX, 'the pure step itself');
  });

  it('the six conga keys still take two rows: no step can hold them (whole words beat a cut one)', () => {
    const needs = [58, 48, 68, 60, 65, 54];
    assert.equal(dockTightRow(needs, dockAt(320)), null);
    const row = dockStripFit(needs, dockAt(320))!;
    assert.equal(row.wrap, true);
    assert.equal(row.padX, DOCK_KEY_PAD);
  });

  it('a step that would leave a key under 44 wide is refused: the row wraps instead', () => {
    // Five wide words and one tiny key: both steps fit the sum, but the tiny
    // key's share would be 16 (first step) or 36 (second) px wide.
    const needs = [62, 62, 62, 62, 62, 20];
    const strip = 326;
    assert.ok(sum(needs) - 2 * 2 * 6 + 5 * DOCK_KEY_GAP_TIGHT <= strip, 'the first step fits the sum');
    assert.equal(dockTightRow(needs, strip), null);
    assert.equal(dockStripFit(needs, strip)!.wrap, true);
  });

  it('the keys take the step: padding from the strip, need at the authored padding', () => {
    const src = read('screens/lab/rack/DockButton.tsx');
    assert.match(src, /const padX = fit\?\.padX \?\? DOCK_KEY_PAD;/);
    assert.match(src, /btnW - 2 - 2 \* padX/);
    assert.match(src, /chrome: 2 \+ 2 \* DOCK_KEY_PAD/);
    assert.match(src, /row\.padX !== DOCK_KEY_PAD \? \{ padX: row\.padX \}/);
  });
});

describe('item 2: the intro card never rises over work under way', () => {
  it('the rule', () => {
    assert.equal(introWorkAction(false, true, null), 'none', 'a quiet screen: the card presents as before');
    assert.equal(introWorkAction(true, true, null), 'drop', 'a tray opened first: dropped for this visit, not marked seen');
    assert.equal(introWorkAction(true, false, 'intro'), 'close', 'a card already up closes when the learner opens a tray');
    assert.equal(introWorkAction(true, false, 'guide'), 'none', 'the asked-for stepped guide stays');
    assert.equal(introWorkAction(true, false, null), 'none');
  });

  it('the rack reports its open tray or drag; the host holds, drops and closes on it', () => {
    const rack = read('screens/lab/rack/RackUnit.tsx');
    assert.match(rack, /useScreenGuideWork\(active && interacting\)/);
    assert.match(rack, /const interacting = laneActive \|\| trayParam != null;/);
    const host = read('features/lab/screenGuide/ScreenGuide.tsx');
    assert.match(host, /<IntroWorkContext\.Provider value=\{reportWork\}>/);
    assert.match(host, /const hold = screenHold \|\| working;/);
    assert.match(host, /hold=\{hold \|\| shown != null\}/);
    assert.match(host, /if \(workAction === 'close'\) close\(\);/);
    assert.match(host, /else if \(workAction === 'drop' && owedId\) handle\(owedId\);/);
  });

  it('a dropped card is not marked seen: handle() alone, never claimIntro', () => {
    const host = read('features/lab/screenGuide/ScreenGuide.tsx');
    const handleFn = host.match(/const handle = useCallback\(\(id: string\) => \{[\s\S]*?\}, \[\]\);/)?.[0] ?? '';
    assert.ok(handleFn.length > 0);
    assert.doesNotMatch(handleFn, /claimIntro|markScreenIntroSeen/);
  });
});

describe('item 3: a sticky tray title: the note gives way, never the title', () => {
  // Page 22's SOUNDS tray, measured: title + long note 481.06, + short note
  // 334.98, title alone 265.31; the head gives 251.7 at 320, 306.7 at 375,
  // 321.7 at 390.
  const SOUNDS = [481.06, 334.98, 265.31] as const;

  it('page 22 SOUNDS at 320: no note, the whole title one size smaller (never under 9 pt), one line', () => {
    const f = trayTitleFit(251.7, ...SOUNDS);
    assert.equal(f.note, 'none');
    assert.equal(f.wrap, false);
    assert.ok(f.fs >= MIN_DISPLAY_PT && f.fs < 12, String(f.fs));
    assert.ok((SOUNDS[2] * f.fs) / 12 <= 251.7, 'the title fits whole');
  });

  it('page 22 SOUNDS at 375 and 390: no note, the title whole at its own size', () => {
    for (const w of [306.7, 321.7]) assert.deepEqual(trayTitleFit(w, ...SOUNDS), { note: 'none', fs: 12, wrap: false });
  });

  it('a short title keeps the whole note where it fits, and the short note where only that fits', () => {
    // MUSIC at 390: the whole note fits (drawn as before).
    assert.deepEqual(trayTitleFit(321.7, 300, 150, 60), { note: 'full', fs: 12, wrap: false });
    assert.deepEqual(trayTitleFit(251.7, 300, 150, 60), { note: 'short', fs: 12, wrap: false });
  });

  it('a title too wide even at 9 pt wraps to two lines whole (never "…"); unmeasured = as today', () => {
    assert.deepEqual(trayTitleFit(200, 600, 450, 400), { note: 'none', fs: 12, wrap: true });
    assert.deepEqual(trayTitleFit(0, 0, 0, 0), { note: 'full', fs: 12, wrap: false });
  });

  it('the tray draws the chosen note, and never the old hard-coded one', () => {
    const src = read('screens/lab/rack/DockTray.tsx');
    assert.equal(TRAY_STICKY_NOTE, '  ·  stays open — compare while you watch');
    assert.equal(TRAY_STICKY_NOTE_SHORT, '  ·  stays open');
    assert.doesNotMatch(src, />\s*·\s*stays open — compare while you watch</);
    assert.match(src, /titleFit\.note === 'short' \? TRAY_STICKY_NOTE_SHORT : TRAY_STICKY_NOTE/);
    assert.match(src, /numberOfLines=\{titleFit\.wrap \? 2 : 1\}/);
  });
});

describe('item 4: a bezel key is whole, short or gone, never "…"', () => {
  // DJ Systems page 8 at 320: "CH1 → MIX" 59.8 px in a first cell 74 wide
  // (inner 58), value "−2.8 dB" fits; at 390 the cell is 91 (inner 75).
  it('a key too wide for its cell is dropped; the value keeps the cell', () => {
    assert.equal(bezelKeyFit(58, 59.8), 'none');
  });
  it('…or drawn as its short form when the readout has one that fits', () => {
    assert.equal(bezelKeyFit(58, 59.8, 22.4), 'narrow');
    assert.equal(bezelKeyFit(20, 59.8, 22.4), 'none', 'a short form that does not fit either: dropped');
  });
  it('a key that fits is drawn exactly as before (390), and an unmeasured cell too', () => {
    assert.equal(bezelKeyFit(75, 59.8), 'full');
    assert.equal(bezelKeyFit(58, 58.3), 'full', 'within half a pixel');
    assert.equal(bezelKeyFit(0, 59.8), 'full');
    assert.equal(bezelKeyFit(58, 0), 'full');
  });
  it('the bezel measures the key line and draws the chosen key; kNarrow is additive', () => {
    const src = read('screens/lab/rack/BezelReadouts.tsx');
    assert.match(src, /const keyFit = bezelKeyFit\(keyAvail, keyW, it\.kNarrow \? narrowW : undefined\);/);
    assert.match(src, /\{cropped \|\| keyFit === 'none' \? null : \(/);
    assert.match(src, /accessibilityLabel=\{`\$\{it\.k\}:/, 'read aloud is always the full key');
    assert.match(read('screens/lab/rack/rackTypes.ts'), /kNarrow\?: string;/);
  });
});
