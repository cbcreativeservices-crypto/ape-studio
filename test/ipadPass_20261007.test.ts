/**
 * GUARD — the iPad pass (owner report 2026-10-06, iPad on builds 33/34).
 *
 *  1. "Trophy images in 'My Gallery' need to expand much larger and take up
 *     more of the screen. They stay small."
 *  2. "Audio tools menu and other screens like it have blank space on both
 *     sides of the narrowed phone-width display. All that dead space makes it
 *     look not designed for iPad (needed for Apple approval)."
 *  3. "Most audio tools are not working. Spectrogram and SPL wheel meter both
 *     did not work at all." — investigated by code (no iPad here); the
 *     provable native hardening is pinned at the bottom.
 *
 * ✅ PHONES: every rule below branches on the 600 pt SHORT edge, so a phone in
 * either orientation takes exactly its old path. The tests say so with the
 * old arithmetic written out.
 */
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { CARD_MAX_W, READING_MAX_W, WIDE_MAX_W, wideColumn } from '../src/theme/readingColumn.ts';
import {
  GALLERY_PHONE_ART,
  TROPHY_VIEWER_PHONE,
  galleryLayout,
  gridColumns,
  tileSpan,
  trophyViewerSize,
} from '../src/theme/tablet.ts';
import { GRID_GAP, HUB_MAX_CONTENT_W, TABLET_FIT_SLACK, TILE_FIT_SLACK, hubColumnsFor, hubContentMaxW, tileWidthFor } from '../src/screens/tools/hubGrid.ts';

const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

/** Phones, both ways up — the widest is 430 / 932. */
const PHONES: Array<[number, number]> = [[320, 568], [375, 667], [390, 844], [412, 915], [430, 932], [932, 430], [844, 390]];
/** iPads, both ways up: mini, 11", 13". */
const IPADS: Array<[number, number]> = [[744, 1133], [1133, 744], [834, 1194], [1194, 834], [1024, 1366], [1366, 1024]];

// ── 1. My Gallery ───────────────────────────────────────────────────────────

test('gallery: a phone keeps two columns and the 48 pt badge exactly', () => {
  for (const [w, h] of PHONES) {
    const g = galleryLayout(w, h);
    assert.equal(g.art, null, `${w}×${h}: a phone keeps its fixed badge`);
    // The old arithmetic, verbatim: gridColumns(winW - 32, 220, 12, 2, 4).
    assert.equal(g.cols, gridColumns(w - 32, 220, 12, 2, 4), `${w}×${h}`);
    assert.equal(g.pad, 16);
    assert.equal(g.gap, 12);
  }
  assert.equal(GALLERY_PHONE_ART, 48);
});

test('gallery: on an iPad the trophy fills its card — many times the phone badge', () => {
  for (const [w, h] of IPADS) {
    const g = galleryLayout(w, h);
    assert.ok(g.art !== null, `${w}×${h} is a tablet`);
    assert.ok(g.cols >= 3 && g.cols <= 6, `${w}×${h}: ${g.cols} columns`);
    // The art is the card's inner width (14 pt padding a side).
    assert.equal(g.art, g.tileW - 28);
    assert.ok(g.art! >= 180, `${w}×${h}: art ${g.art} pt — must be far larger than 48`);
    // The row fits the window with its padding.
    assert.ok(g.cols * g.tileW + (g.cols - 1) * g.gap <= w - 2 * g.pad, `${w}×${h}: row overflows`);
  }
  // Portrait 13": four big cards; landscape: five.
  assert.equal(galleryLayout(1024, 1366).cols, 4);
  assert.equal(galleryLayout(1366, 1024).cols, 5);
});

test('gallery screen: tablet art is a layout-measured square that FILLS the card', () => {
  const g = read('src/screens/achievements/GalleryScreen.tsx');
  assert.match(g, /const grid = galleryLayout\(winW, winH\);/);
  assert.match(g, /artTablet: \{ width: '100%', aspectRatio: 1 \}/);
  assert.match(g, /<TrophyImage iconUrl=\{e\.iconUrl\} fill radius=\{12\}/);
  // The phone keeps its fixed 48 pt badge.
  assert.match(g, /size=\{GALLERY_PHONE_ART\}/);
  // numColumns still re-keys on a change (tablet premium pass rule).
  assert.match(g, /key=\{`cols-\$\{cols\}`\}/);
});

test('trophy viewer: 150 on a phone, scaled to the iPad and inside its height', () => {
  for (const [w, h] of PHONES) assert.equal(trophyViewerSize(w, h), TROPHY_VIEWER_PHONE);
  for (const [w, h] of IPADS) {
    const s = trophyViewerSize(w, h);
    assert.ok(s >= 400, `${w}×${h}: ${s}`);
    assert.ok(s <= h - 320, `${w}×${h}: leaves room for the title and Back`);
    assert.ok(s <= Math.min(w, h), `${w}×${h}: fits the short edge`);
  }
  const t = read('src/screens/results/TrophyScreen.tsx');
  assert.match(t, /const art = trophyViewerSize\(winW, winH\);/);
  assert.match(t, /size=\{art\}/);
  const m = read('src/components/TrophyModal.tsx');
  assert.match(m, /if \(isTabletWindow\(w, h\)\) \{/);
  // The phone formula is untouched.
  assert.match(m, /return Math\.round\(Math\.min\(w \* 0\.82, h \* hShare, cap\) \* 0\.77\);/);
});

// ── 2. Menus use the whole iPad ─────────────────────────────────────────────

test('the wide column is a real tablet width and never binds on an iPad', () => {
  assert.equal(wideColumn.maxWidth, WIDE_MAX_W);
  assert.equal(wideColumn.width, '100%');
  assert.equal(wideColumn.alignSelf, 'center');
  assert.ok(WIDE_MAX_W >= 1366, 'a 13" iPad in landscape must not be capped');
  assert.ok(WIDE_MAX_W > CARD_MAX_W && CARD_MAX_W > READING_MAX_W);
});

test('tileSpan floors so a flex-wrap row can never overflow', () => {
  for (const avail of [700, 991, 1000, 1333.5]) {
    for (const cols of [2, 3, 4, 5]) {
      const s = tileSpan(avail, cols, 14);
      assert.ok(cols * s + (cols - 1) * 14 <= avail, `${avail}/${cols}`);
      assert.ok(cols * (s + 1) + (cols - 1) * 14 > avail - cols, 'and wastes under a pixel per tile');
    }
  }
});

test('Tools hub: every phone keeps the exact old tile, two across in 560', () => {
  // The old tileWidthFor, verbatim.
  const old = (w: number) => Math.floor((Math.min(w, 560) - 14 * 2 - (1 + 12) * 2 - 12 - 2) / 2);
  for (const [w, h] of PHONES) {
    assert.equal(hubColumnsFor(w, h), 2, `${w}×${h}`);
    assert.equal(hubContentMaxW(w, h), HUB_MAX_CONTENT_W, `${w}×${h}`);
    assert.equal(tileWidthFor(w, h), old(w), `${w}×${h}`);
  }
  assert.equal(HUB_MAX_CONTENT_W, READING_MAX_W);
  assert.equal(GRID_GAP, 12);
  assert.equal(TILE_FIT_SLACK, 2);
});

test('Tools hub: an iPad fills its width — four displays across, or two big ones', () => {
  for (const [w, h] of IPADS) {
    const cols = hubColumnsFor(w, h);
    assert.ok(cols === 4 || cols === 2, `${w}×${h}: never three (it strands two tiles)`);
    assert.equal(hubContentMaxW(w, h), WIDE_MAX_W);
    const tw = tileWidthFor(w, h);
    const inner = Math.min(w, WIDE_MAX_W) - 14 * 2 - (1 + 12) * 2;
    assert.ok(cols * tw + (cols - 1) * GRID_GAP + TABLET_FIT_SLACK <= inner, `${w}×${h}: the row must fit with a scrollbar's slack`);
    assert.ok(TABLET_FIT_SLACK >= 16, 'a web scrollbar (15 pt) must never drop a display');
    assert.ok(tw >= 200, `${w}×${h}: tile ${tw} pt`);
    // The panel spans the window (minus the 14 pt scroll padding) — no gutters.
    assert.ok(inner + 26 >= w - 28 - 1, `${w}×${h}`);
  }
  assert.equal(hubColumnsFor(1024, 1366), 2, '13" portrait — two big displays fill it');
  assert.ok(tileWidthFor(1024, 1366) >= 460, 'portrait displays nearly double the old 247');
  assert.equal(hubColumnsFor(1366, 1024), 4, '13" landscape');
  assert.equal(hubColumnsFor(1133, 744), 4, 'mini landscape');
  assert.equal(hubColumnsFor(744, 1133), 2, 'mini portrait — two big tiles');
  const hub = read('src/screens/tools/ToolsHubScreen.tsx');
  assert.match(hub, /tileMetricsFor\(windowW, windowH\)/, 'the tablet rule needs the live HEIGHT too');
  assert.match(hub, /<View style=\{\[styles\.brandBarCap, hubCap\]\}>/);
  assert.match(hub, /contentContainerStyle=\{\[styles\.scroll, hubCap, \{ paddingBottom: 24 \+ insets\.bottom \}\]\}/);
});

test('TabletGrid is a Fragment on a phone — the phone tree is untouched', () => {
  const g = read('src/components/TabletGrid.tsx');
  assert.match(g, /if \(!isTabletWindow\(winW, winH\)\) return <>\{children\}<\/>;/);
  // Hooks run before that early return (rules of hooks).
  assert.ok(g.indexOf('useState(0)') < g.indexOf('if (!isTabletWindow(winW, winH))'));
  assert.match(g, /style=\{\{ width: span \}\}/);
});

/** Every menu/hub/grid screen widened in this pass, and what proves it. */
const WIDENED: Array<[string, RegExp]> = [
  ['src/screens/lab/AudioLearningScreen.tsx', /cardColumn, wide\]/],
  ['src/screens/lab/EarLabScreen.tsx', /cardColumn, wide\]/],
  ['src/screens/lab/LabCategoryScreen.tsx', /cardColumn, wide\]/],
  ['src/screens/lab/miking/MikingHubScreen.tsx', /cardColumn, wide, /],
  ['src/screens/lab/calc/CalcLabScreen.tsx', /cardColumn, wide\]/],
  ...['amp/AmpLabHomeScreen', 'cymatics/CymaticsHomeScreen', 'digital/DigitalLabHomeScreen', 'eq/EqLabHomeScreen', 'gain/GainLabHomeScreen', 'meter/MeterLabHomeScreen', 'wave/WaveLabHomeScreen', 'eartraining/EarTrainingLabScreen'].map(
    (f) => [`src/screens/lab/${f}.tsx`, /cardColumn, wide/] as [string, RegExp],
  ),
  ['src/screens/lab/cymatics/GalleryScreen.tsx', /cardColumn, tablet && wideColumn\]/],
  ['src/screens/achievements/AchievementsHomeScreen.tsx', /\[styles\.scroll, wide\]/],
  ['src/screens/achievements/TopicsScreen.tsx', /cardColumn, wide\]/],
  ['src/screens/achievements/CredentialWall.tsx', /cardColumn, wide\]/],
  ['src/screens/tools/MeasurementLibraryScreen.tsx', /\[styles\.scroll, wide\]/],
];

test('every widened menu takes the wide column on a tablet only', () => {
  for (const [file, re] of WIDENED) {
    const src = read(file);
    assert.match(src, re, `${file}: lost its tablet width`);
    assert.match(src, /useWideOnTablet\(\)|isTabletWindow\(ww, wh\)/, `${file}: must branch on the tablet rule`);
  }
});

test('menus spend the width on columns, not on stretched rows', () => {
  const grids = [
    'src/screens/lab/AudioLearningScreen.tsx',
    'src/screens/lab/LabCategoryScreen.tsx',
    'src/screens/achievements/AchievementsHomeScreen.tsx',
    'src/screens/achievements/TopicsScreen.tsx',
    'src/screens/achievements/CredentialWall.tsx',
    'src/screens/tools/ToolsHubScreen.tsx',
    ...['amp/AmpLabHomeScreen', 'cymatics/CymaticsHomeScreen', 'digital/DigitalLabHomeScreen', 'eq/EqLabHomeScreen', 'gain/GainLabHomeScreen', 'meter/MeterLabHomeScreen', 'wave/WaveLabHomeScreen', 'eartraining/EarTrainingLabScreen'].map((f) => `src/screens/lab/${f}.tsx`),
  ];
  for (const f of grids) assert.match(read(f), /<TabletGrid /, `${f}: a wide menu needs its columns`);
  // Tile menus gain a fourth column once the window is landscape-wide.
  for (const f of ['src/screens/lab/EarLabScreen.tsx', 'src/screens/lab/miking/MikingHubScreen.tsx']) {
    const s = read(f);
    assert.match(s, /tileQuarter: \{ width: '24%' \}/);
    assert.match(s, /style=\{tablet \? tabletTile : styles\.tileHalf\}/);
  }
  assert.match(read('src/screens/lab/calc/CalcLabScreen.tsx'), /tileFrameTabletWide: \{ width: '24%' \}/);
  const lib = read('src/screens/tools/MeasurementLibraryScreen.tsx');
  assert.match(lib, /numColumns=\{wide \? 2 : 1\}/);
  assert.match(lib, /key=\{wide \? 'cols-2' : 'cols-1'\}/, 'numColumns cannot change on a mounted list');
});

test('prose inside a wide menu keeps the reading measure (tablet only)', () => {
  for (const f of ['src/screens/lab/AudioLearningScreen.tsx', 'src/screens/lab/EarLabScreen.tsx', 'src/screens/lab/LabCategoryScreen.tsx', 'src/screens/achievements/AchievementsHomeScreen.tsx']) {
    assert.match(read(f), /\[styles\.intro, wide && readingText\]/, f);
  }
});

// ── 3. Audio tools — native hardening (needs a BUILD) ───────────────────────

test('iOS capture: the core runs at the rate the mic tap delivers, and a dead input is an error, not a crash', () => {
  const s = read('modules/ape-dsp/ios/ApeDspModule.swift');
  const start = s.slice(s.indexOf('private func startCapture()'), s.indexOf('private func stopCapture('));
  assert.ok(start.length > 0);
  // The guard comes BEFORE installTap (the uncatchable exception).
  const guardAt = start.indexOf('guard format.sampleRate > 0, format.channelCount > 0 else {');
  const tapAt = start.indexOf('input.installTap(');
  assert.ok(guardAt > 0 && tapAt > guardAt, 'refuse a 0 Hz / 0 ch input before installTap');
  assert.match(start, /throw NSError\(domain: "ApeDsp", code: 2/);
  // The core is configured from the tap format, after it is read.
  assert.match(start, /sampleRate = format\.sampleRate\n\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*core\.configureSampleRate\(sampleRate\)/);
  assert.ok(start.indexOf('core.configureSampleRate(sampleRate)') > start.indexOf('let format = input.inputFormat(forBus: 0)'));
  // The generator no longer re-scales a running capture to the session's rate.
  assert.match(s, /let sr = running && sampleRate > 0 \? sampleRate : \(session\.sampleRate > 0 \? session\.sampleRate : 48_000\)/);
});
