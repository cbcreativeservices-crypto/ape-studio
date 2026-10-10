/**
 * PATTERN P14 / P15 (pattern hunt wave 3, 2026-10-02) — display text under
 * 9 pt, and values cropped to "12…".
 *
 * Owner rules: nothing renders under 9 pt on a 375 / 390-wide phone
 * (authored fontSize × the fit scale); a cropped readout drops its LABEL,
 * never its number; a value is never ellipsized.
 *
 * The shared piece is src/theme/legibility.ts:
 *   MIN_DISPLAY_PT = 9, and fitValue(fontSize) — the one-line props that make
 *   a value SHRINK to fit (never under 9 pt) instead of ending in "…".
 *
 * Receipts:
 *   1. fitValue behaviour (never under 9 pt, never grows, never ellipsizes).
 *   2. The house floors stay at 9 (vizMeters Lbl, vizSpectral Ax,
 *      BezelReadouts).
 *   3. RATCHET A — no literal fontSize under 9 anywhere in src/ outside the
 *      allowlist, each entry with its fit-scale justification.
 *   4. RATCHET B — no numberOfLines={1} without adjustsFontSizeToFit outside
 *      the allowlist (labels and titles may truncate; values may not). A NEW
 *      one-line Text must use fitValue() or be added here with a reason.
 *   5. The migrated value sites stay on fitValue.
 * Both allowlists may only SHRINK: a stale count fails too.
 */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MIN_DISPLAY_PT, fitValue } from '../src/theme/legibility.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const rel = (f: string) => relative(SRC, f).split(sep).join('/');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}
/** Comments out (block, JSX and whole-line //), line endings normalised. */
const strip = (code: string) =>
  code
    .replace(/\r\n/g, '\n')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const FILES = walk(SRC).map((f) => ({ f: rel(f), s: strip(readFileSync(f, 'utf8')) }));

// ── 1. the shared piece ─────────────────────────────────────────────────────

describe('fitValue: a value shrinks to fit, never under 9 pt, never "…"', () => {
  it('the floor is 9 pt', () => {
    assert.equal(MIN_DISPLAY_PT, 9);
  });
  it('one line, shrink-to-fit, and the smallest size it can reach is ≥ 9 pt for every authored size', () => {
    for (let fs = 9; fs <= 120; fs += 0.5) {
      const p = fitValue(fs);
      assert.equal(p.numberOfLines, 1);
      assert.equal(p.adjustsFontSizeToFit, true);
      assert.ok(p.minimumFontScale <= 1, `fontSize ${fs}: scale ${p.minimumFontScale} would GROW the text`);
      assert.ok(fs * p.minimumFontScale >= 9, `fontSize ${fs}: shrinks to ${fs * p.minimumFontScale} pt, under the floor`);
    }
  });
  it('rounds the scale UP (13 pt → 0.693, not 0.692 — 8.996 pt would be under the floor)', () => {
    assert.equal(fitValue(13).minimumFontScale, 0.693);
    assert.equal(fitValue(18).minimumFontScale, 0.5);
  });
  it('text already at or under 9 pt is not allowed to shrink at all', () => {
    assert.equal(fitValue(9).minimumFontScale, 1);
    assert.equal(fitValue(7).minimumFontScale, 1);
    assert.equal(fitValue(Number.NaN).minimumFontScale, 1);
    assert.equal(fitValue(0).minimumFontScale, 1);
  });
});

// ── 2. the house floors ─────────────────────────────────────────────────────

describe('the overlay-label floors stay at 9 pt', () => {
  it('vizMeters Lbl, vizSpectral Ax, BezelReadouts value', () => {
    assert.match(read('src/screens/lab/meter/vizMeters.tsx'), /const LBL_MIN = 9;/);
    assert.match(read('src/screens/lab/meter/vizMeters.tsx'), /Math\.max\(LBL_MIN, auth\)/);
    const ax = read('src/screens/lab/meter/vizSpectral.tsx').match(/const AX_MIN = ([\d.]+);/);
    assert.ok(ax && Number(ax[1]) >= 9, 'vizSpectral AX_MIN ≥ 9');
    assert.match(read('src/screens/lab/rack/BezelReadouts.tsx'), /const V_MIN_FS = 9;/);
  });
});

// ── 3. RATCHET A: literal font sizes under 9 ────────────────────────────────

/**
 * Sites that draw an authored size under 9 and are still ≥ 9 pt rendered, or
 * are not text the learner reads. Count per file. May only shrink.
 */
const SUB9_ALLOWED: Record<string, { n: number; why: string }> = {
  'screens/lab/soundsystems/pagesLearnB.tsx': {
    n: 3,
    why: 'LoadRig: 300-unit viewBox in StageFit; at 375 wide the glass is 353, the drawing ≥ 341 → × 1.14 → 8.5 renders 9.7 pt',
  },
  'screens/lab/cableinstall/scenes/LabelScene.tsx': {
    n: 1,
    why: 'SlackArt: 220-unit viewBox in a card ≥ 283 wide on a 375 phone → 7 × 1.29 ≥ 9 pt',
  },
  'screens/lab/cableinstall/scenes/supportIcons.tsx': {
    n: 1,
    why: '"FIRE ALARM" printed on the drawn fire-alarm box — sticker texture on a sort-card icon, not a label (same rule as gearArt legends)',
  },
};

/** fontSize: 8.5 / fontSize={8.5} / fontSize: Math.max(6, …) / <Callout size={7}>. */
function sub9Sites(s: string): string[] {
  const hits: string[] = [];
  const res = [
    /fontSize\s*[:=]\s*\{?\s*(\d+(?:\.\d+)?)\s*(?=[,}\s;)])/g,
    /fontSize\s*[:=]\s*\{?\s*Math\.max\(\s*(\d+(?:\.\d+)?)\s*,/g,
    /<Callout\b[^>]*?\bsize=\{(\d+(?:\.\d+)?)\}/g,
  ];
  for (const re of res) {
    for (const m of s.matchAll(re)) {
      const v = Number(m[1]);
      if (v > 0 && v < 9) hits.push(m[0].slice(0, 40));
    }
  }
  return hits;
}

describe('RATCHET A: no literal font size under 9 pt without a fit-scale reason', () => {
  const found = new Map<string, string[]>();
  for (const { f, s } of FILES) {
    const h = sub9Sites(s);
    if (h.length) found.set(f, h);
  }
  it('no file draws a literal size under 9 beyond its allowlisted count', () => {
    const bad: string[] = [];
    for (const [f, h] of found) {
      const allowed = SUB9_ALLOWED[f]?.n ?? 0;
      if (h.length > allowed) bad.push(`${f}: ${h.length} (allowed ${allowed}) — ${h.join(' | ')}`);
    }
    assert.deepEqual(bad, [], 'Text under 9 pt. Raise it to ≥ 9, or (a scaled drawing) add it here with the measured fit scale.');
  });
  it('the allowlist only shrinks: every entry is still exactly accurate', () => {
    const stale: string[] = [];
    for (const [f, a] of Object.entries(SUB9_ALLOWED)) {
      const n = found.get(f)?.length ?? 0;
      if (n !== a.n) stale.push(`${f}: allowlisted ${a.n}, found ${n} — lower the entry`);
    }
    assert.deepEqual(stale, []);
  });
  it('the sites fixed on 2026-10-02 stay at 9', () => {
    assert.match(read('src/screens/tools/hubPreviewShared.tsx'), /fontFamily: fonts\.mono,\n\s*fontSize: 9,/); // DEMO tag (was 6.5)
    assert.match(read('src/screens/tools/ToolsHubScreen.tsx'), /dosiLabel: \{[^}]*fontSize: 9,/);
    assert.match(read('src/components/tooldemos/SignalGenDemo.tsx'), /fontSize=\{9\} letterSpacing=\{1\} fill=\{CALL_STEEL\}>\s*SAME PEAK/);
    assert.match(read('src/screens/lab/calc/CalcWorkspaceScreen.tsx'), /bcellK: \{[^}]*fontSize: 9,/);
    assert.match(read('src/components/LedColorPicker.tsx'), /defaultTag: \{[^}]*fontSize: 9,/);
    assert.match(read('src/screens/enrollment/EnrollmentScreen.tsx'), /recordKind: \{[^}]*fontSize: 9,/);
    assert.match(read('src/screens/lab/meter/vizMeters.tsx'), /fontSize: Math\.max\(9, size \* 0\.14\)/);
  });
});

// ── 4. RATCHET B: one-line Text that can end in "…" ─────────────────────────

/**
 * Files whose numberOfLines={1} Text carries a LABEL, TITLE or NAME (may
 * truncate), counted per file. A value never belongs here — give it
 * {...fitValue(fontSize)}. May only shrink.
 */
const ONE_LINE_ALLOWED: Record<string, { n: number; why: string }> = {
  'components/nav/TabBar.tsx': { n: 1, why: 'tab footnote label' },
  'components/ProgressRing.tsx': { n: 1, why: 'centre label (caller-supplied word)' },
  'components/ShareTermSheet.tsx': { n: 2, why: 'glossary term headings' },
  'components/tooldemos/SignalGenDemo.tsx': { n: 3, why: 'fixed caption words' },
  'components/tooldemos/SplDemo.tsx': { n: 1, why: 'fixed caption' },
  'features/study/PaceReadout.tsx': { n: 5, why: 'status words and captions (the three value lines use fitValue)' },
  'features/study/PresetFader.tsx': { n: 5, why: 'preset names and hints' },
  'screens/awards/AwardsScreen.tsx': { n: 1, why: 'award label' },
  'screens/careerfinder/kit.tsx': { n: 1, why: 'kicker label' },
  'screens/curriculum/CurriculumScreen.tsx': { n: 2, why: 'fixed menu titles' },
  'screens/dashboard/DashboardScreen.tsx': { n: 6, why: 'labels, topic names, terms; one is the powered-off "—" placeholder' },
  'screens/dashboard/TopicDeckSheet.tsx': { n: 2, why: 'topic names' },
  'screens/directory/DirectoryScreen.tsx': { n: 1, why: 'verify-URL caption' },
  'screens/directory/RequestsView.tsx': { n: 1, why: 'website name' },
  'screens/enrollment/EnrollmentScreen.tsx': { n: 13, why: 'topic / certificate / subject names and fixed labels' },
  'screens/enrollment/EnrollmentSelection.tsx': { n: 1, why: 'LOAD ALL / UNLOAD ALL' },
  'screens/enrollment/HomeSetupSheet.tsx': { n: 4, why: 'names and subjects' },
  'screens/exam/FinalExamScreen.tsx': { n: 1, why: 'award name' },
  'screens/glossary/GlossaryScreen.tsx': { n: 5, why: 'term names and the GLOSSARY title' },
  'screens/lab/amp/AmpRig.tsx': { n: 1, why: 'panel title' },
  'screens/lab/cableinstall/bits.tsx': { n: 1, why: 'jurisdiction label' },
  'screens/lab/cableinstall/CableInstallLabScreen.tsx': { n: 1, why: 'module title' },
  'screens/lab/cableinstall/scenes/EmiScene.tsx': { n: 1, why: 'source · BALANCED · distance WORD caption' },
  'screens/lab/cableinstall/scenes/FloorScene.tsx': { n: 2, why: 'dimension / twist labels' },
  'screens/lab/cableinstall/scenes/KnowScene.tsx': { n: 1, why: 'topic names' },
  'screens/lab/cableinstall/scenes/RouteScene.tsx': { n: 2, why: 'dimension labels, route names' },
  'screens/lab/calc/CalcWorkspaceScreen.tsx': { n: 2, why: 'function name, formula title' },
  'screens/lab/cymatics/GalleryCompare.tsx': { n: 2, why: 'pattern names (the Hz line uses fitValue)' },
  'screens/lab/cymatics/GalleryScreen.tsx': { n: 3, why: 'titles and pattern names' },
  'screens/lab/cymatics/modules/modHarmony.tsx': { n: 1, why: 'interval labels' },
  'screens/lab/cymatics/vizLiquid.tsx': { n: 3, why: 'DISH / PLATFORM / LAMP (the mm and Hz labels use fitValue)' },
  'screens/lab/cymatics/vizMembrane.tsx': { n: 2, why: 'CUTAWAY name / CONE FROM THE FRONT (the value lines use fitValue)' },
  'screens/lab/digital/modules/modQuant.tsx': {
    n: 1,
    why: 'bit weight at the 9 pt floor (cannot shrink): "−32,768" ≈ 31 pt Barlow Condensed in a ≥ 37-pt cell at 375 — fits',
  },
  'screens/lab/foundations/FoundationsPlaygroundScreen.tsx': { n: 2, why: 'panel captions' },
  'screens/lab/foundations/viz.tsx': { n: 4, why: 'fixed panel captions' },
  'screens/lab/HarmonicStems.tsx': { n: 1, why: 'interval names' },
  'screens/lab/HarmonicsView.tsx': {
    n: 1,
    why: 'harmonic marker at the 9 pt floor (cannot shrink); GUTTER_W sized for "12: 1.2k · G#3 +2¢" at mono 9 — UNVERIFIED on device, flagged',
  },
  'screens/lab/kit/gear.tsx': { n: 1, why: 'control name (the knob value uses fitValue)' },
  'screens/lab/kit/LabNavBar.tsx': { n: 2, why: 'noun and position label' },
  'screens/lab/micselect/MicSelectLabScreen.tsx': { n: 1, why: 'scene label' },
  'screens/lab/production/ProductionActivityScreen.tsx': { n: 1, why: 'title' },
  'screens/lab/production/ProductionLabScreen.tsx': { n: 1, why: 'project name' },
  'screens/lab/production/ProductionStageScreen.tsx': { n: 1, why: 'stage title' },
  'screens/lab/production/ReadinessMeter.tsx': { n: 1, why: 'stage title' },
  'screens/lab/rack/BezelReadouts.tsx': {
    n: 4,
    why: 'the house idiom itself: key label (dropped when cropped), unit, and two values drawn smaller by numFs() to the 9 pt floor',
  },
  'screens/lab/rack/DockButton.tsx': { n: 1, why: 'key label (the value uses fitValue)' },
  'screens/lab/rack/DockTray.tsx': { n: 1, why: 'param label' },
  'screens/lab/rack/ParamLane.tsx': { n: 1, why: 'lane label (the readout uses fitValue)' },
  'screens/lab/soundsystems/art/ChainMeter.tsx': { n: 1, why: 'stage short label (the value uses fitValue)' },
  'screens/lab/soundsystems/art/ConsolePanel.tsx': { n: 4, why: 'channel labels and names' },
  'screens/lab/soundsystems/pagesOperate.tsx': { n: 1, why: 'gear label' },
  'screens/lab/tube/TubeCardScreen.tsx': { n: 3, why: 'card title, family and category names' },
  'screens/settings/SettingsScreen.tsx': { n: 1, why: 'category name' },
  'screens/startHere/StartHereScreen.tsx': { n: 1, why: 'kicker' },
  'screens/study/FlashcardsScreen.tsx': { n: 1, why: 'term name' },
  'screens/study/StudyHeader.tsx': { n: 1, why: 'subtitle' },
  'screens/tools/CenterLockTuner.tsx': { n: 1, why: 'string label / LOCKED (the note and identity use fitValue)' },
  'screens/tools/MeasurementLibraryScreen.tsx': { n: 1, why: 'measurement title' },
  'screens/tools/MultiMeterScreen.tsx': { n: 1, why: 'route name' },
  'screens/tools/RtaScreen.tsx': { n: 1, why: 'fixed honesty caption' },
  'screens/tools/ToolFullScreen.tsx': { n: 2, why: 'title and label' },
  'screens/tools/ToolLockUi.tsx': { n: 1, why: 'lock label' },
  'screens/tools/ToolsHubScreen.tsx': { n: 1, why: 'module title' },
};

/** numberOfLines={1} in a JSX opening tag that has no adjustsFontSizeToFit. */
function oneLineNoFit(s: string): number {
  let n = 0;
  for (const m of s.matchAll(/numberOfLines=\{1\}/g)) {
    const st = s.lastIndexOf('<', m.index!);
    let depth = 0;
    let j = st;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && s[j - 1] !== '=') break;
    }
    if (!/adjustsFontSizeToFit/.test(s.slice(st, j + 1))) n++;
  }
  return n;
}

describe('RATCHET B: a one-line value shrinks, it never ends in "…"', () => {
  const found = new Map<string, number>();
  for (const { f, s } of FILES) {
    const n = oneLineNoFit(s);
    if (n) found.set(f, n);
  }
  it('no new numberOfLines={1} without adjustsFontSizeToFit (use {...fitValue(fontSize)} for a value)', () => {
    const bad: string[] = [];
    for (const [f, n] of found) {
      const allowed = ONE_LINE_ALLOWED[f]?.n ?? 0;
      if (n > allowed) bad.push(`${f}: ${n} (allowed ${allowed})`);
    }
    assert.deepEqual(bad, []);
  });
  it('the allowlist only shrinks: every entry is still exactly accurate', () => {
    const stale: string[] = [];
    for (const [f, a] of Object.entries(ONE_LINE_ALLOWED)) {
      const n = found.get(f) ?? 0;
      if (n !== a.n) stale.push(`${f}: allowlisted ${a.n}, found ${n} — lower the entry`);
    }
    assert.deepEqual(stale, []);
  });
});

// ── 5. the migrated value sites ─────────────────────────────────────────────

describe('the value sites migrated on 2026-10-02 stay on fitValue', () => {
  const sites: Array<[string, RegExp]> = [
    ['src/screens/lab/rack/DockButton.tsx', /styles\.value, [^\]]*\]\} \{\.\.\.fitValue\(14\)\}>\s*\{value\}/],
    ['src/screens/lab/rack/ParamLane.tsx', /styles\.laneValue, [^\]]*\]\} \{\.\.\.fitValue\(12\.5\)\}>\s*\{readout\}/],
    ['src/screens/lab/rack/RackUnit.tsx', /styles\.dragTagText\} \{\.\.\.fitValue\(13\)\}>\s*\{bound\.label\}  \{bound\.format\(bound\.value\)\}/],
    ['src/screens/lab/kit/gear.tsx', /\bs\.knobValue\} \{\.\.\.fitValue\(10\.5\)\}>\s*\{fmt\(value\)\}/],
    ['src/screens/lab/gain/gainViz.tsx', /\{\.\.\.fitValue\(10\)\}>\s*\{c\.readout\}/],
    ['src/screens/lab/soundsystems/art/ChainMeter.tsx', /\{\.\.\.fitValue\(grow \? 11 \* ts : 11\)\}>\s*\{v > 0 \? '\+' : ''\}/],
    ['src/screens/tools/SplMeterScreen.tsx', /styles\.fsValue, \{ fontSize: fsNumSize \}\]\} \{\.\.\.fitValue\(fsNumSize\)\}>\s*\{bigText\}/],
    ['src/screens/tools/CenterLockTuner.tsx', /styles\.identity, \{ color: tint \}\]\} \{\.\.\.fitValue\(16\)\}>\{identity\}/],
    ['src/features/settings/NotifyScheduleModal.tsx', /styles\.stepValue\} \{\.\.\.fitValue\(20\)\}>\{value\}/],
  ];
  for (const [file, re] of sites) {
    it(file, () => assert.match(read(file), re));
  }
  it('SplMeter: all three control-bar values', () => {
    assert.equal(read('src/screens/tools/SplMeterScreen.tsx').match(/styles\.ctrlBarValue\} \{\.\.\.fitValue\(14\)\}>\{b\.value\}/g)?.length, 3);
  });
  it('PaceReadout: the pace tag, the average and the projection', () => {
    const s = read('src/features/study/PaceReadout.tsx');
    assert.match(s, /styles\.trackPaceLabel\} \{\.\.\.fitValue\(10\)\}>/);
    assert.match(s, /styles\.metricLine\} \{\.\.\.fitValue\(12\)\}>/);
    assert.match(s, /styles\.metricMeta\} \{\.\.\.fitValue\(11\)\}>/);
  });
});
