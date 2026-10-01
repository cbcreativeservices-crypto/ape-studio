/**
 * GUARD — the Tuning & Temperament Lab is on the Rack Unit.
 *
 * OWNER (TestFlight build 32, 2026-09-30): "Tuning and temperament lab has
 * poor arrangement of controls above displays so we need to fix and do a
 * proper rack system for it." And: "full screen on most labs where we can
 * do it."
 *
 * The standard (governance D24): every lab page with a live display and
 * controls uses the Rack Unit — the display pinned on the glass, the only
 * scroller between, the controls docked at the bottom. Reading may scroll;
 * operating may not. Four things have to stay true or the rebuild quietly
 * regresses:
 *   1. every chapter with a display declares `rack: true` and renders the
 *      TuningRackLayout (the one wrapper that mounts RackUnit) — the reading
 *      chapter (12) stays a document;
 *   2. the wrapper turns FULL SCREEN on and lets the rack pad the safe area
 *      itself (nothing sits under the rack since the shared strip, 2026-09-30);
 *   3. the controls are in the DOCK, not the well: no chapter keeps its own
 *      slider track, ±¢ step keys, play rows or A/B button strip in the
 *      scroll — those are DockParams now;
 *   4. the shell gives a rack chapter the full height with no ScrollView of
 *      its own, navigates through the SHARED strip (kit/LabNavBar: ⏮ / ‹ PREV
 *      / MODULE n / 14 ▾ / NEXT › → FINISH ›), and keeps ■ STOP on the
 *      reading chapter and the end screen, the end screen and the guest rule.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { JUST_MAJOR_THIRD, MEANTONE_FIFTH, ratioToCents, centsToRatio } from '../src/features/tuning/tuningMath.ts';

const root = join(process.cwd(), 'src', 'screens', 'lab', 'tuning');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const registry = strip(read('chapters/index.ts'));
const layout = strip(read('rackLayout.tsx'));
const shell = strip(read('TuningLabScreen.tsx'));
const chapterFiles = readdirSync(join(root, 'chapters')).filter((f) => /^ch\d+\w*\.tsx$/.test(f));
const RACK_CHAPTERS = chapterFiles.filter((f) => !f.startsWith('ch12'));

describe('every display chapter is a rack page', () => {
  test('the registry marks 13 of 14 chapters rack: true — chapter 12 (reading) is not', () => {
    for (let i = 0; i < 14; i++) {
      const row = registry.match(new RegExp(`\\{ index: ${i},[^}]*\\}`));
      assert.ok(row, `chapter ${i} is missing from the registry`);
      if (i === 12) assert.doesNotMatch(row[0], /rack: true/, 'chapter 12 is a reading page and must keep the document layout');
      else assert.match(row[0], /rack: true/, `chapter ${i} has a live display and must be a rack page`);
    }
  });

  test('each rack chapter renders TuningRackLayout and nothing else wraps it', () => {
    for (const f of RACK_CHAPTERS) {
      const code = strip(read(`chapters/${f}`));
      assert.match(code, /<TuningRackLayout/, `${f} does not render the rack wrapper`);
      assert.match(code, /stage: \(w(: number)?, h(: number)?\) =>|stage,|stage=\{/, `${f} declares no stage`);
      assert.match(code, /initialParam: '/, `${f} names no initialParam — the dock must bind on mount`);
      // The reading goes in the well: the understanding check or the chapter's
      // own completion button must be INSIDE the wrapper, not beside it.
      assert.doesNotMatch(code, /<\/TuningRackLayout>[\s\S]*<UnderstandingCheck/, `${f} has reading outside the rack`);
    }
  });

  test('chapter 12 keeps the document layout', () => {
    const code = strip(read('chapters/ch12Tradeoffs.tsx'));
    assert.doesNotMatch(code, /TuningRackLayout|RackUnit/, 'chapter 12 is prose and cards — no rack');
  });
});

describe('the wrapper is the Rack Unit with full screen on', () => {
  test('TuningRackLayout mounts RackUnit', () => {
    assert.match(layout, /import \{ RackUnit \} from '\.\.\/rack\/RackUnit'/);
    assert.match(layout, /<RackUnit/);
  });

  test('FULL SCREEN is on for every stage (owner 2026-09-30: "full screen on most labs")', () => {
    assert.match(layout, /fullScreen: true/, 'the rack no longer owns full screen for the tuning stages');
  });

  test('nothing sits under the rack any more, so it pads the safe area itself (no bottomInset 0)', () => {
    // The old footer (sound line, ■ STOP, BACK / CONTINUE) is gone — the
    // strip is above the rack and the rack's own NEXT ends the well — so a
    // bottomInset of 0 would run the dock into the home indicator.
    assert.doesNotMatch(layout, /bottomInset=/);
  });

  test('the badge defaults to an honesty badge and the well carries the accuracy note', () => {
    assert.match(layout, /badge: rack\.badge \?\? BADGE_EXACT/);
    assert.match(layout, /<AccuracyNote/);
  });
});

describe('controls live in the dock, not the well', () => {
  test('no rack chapter keeps a slider track, step keys, play buttons or an A/B strip in its scroll', () => {
    for (const f of RACK_CHAPTERS) {
      const code = strip(read(`chapters/${f}`));
      assert.doesNotMatch(code, /function SliderTrack|function Track\b/, `${f} still defines its own slider track — the ParamLane is the slider`);
      assert.doesNotMatch(code, /<AudioComparisonControls/, `${f} keeps the A/B button strip in the well — that is a dock tray now`);
      // The WELL is what the wrapper's children render: everything from the
      // <TuningRackLayout> tag on. (A `group` tray's own buttons are declared
      // in the params above it — those ARE the dock.)
      const well = code.slice(code.indexOf('<TuningRackLayout'));
      assert.ok(well.length > 0, `${f} renders no TuningRackLayout`);
      assert.doesNotMatch(well, /<Btn[^>]*label="[−+]\s*(0\.1|1|10) ¢"/, `${f} keeps ±¢ step keys in the well — the lane replaced them`);
      assert.doesNotMatch(well, /<Btn[^>]*label=\{?[`"']▶/, `${f} keeps a play button in the well — play keys belong on the dock`);
      assert.doesNotMatch(well, /<Btn[^>]*label="■/, `${f} keeps a stop button in the well — ■ STOP is a dock key`);
      assert.doesNotMatch(well, /<DragRail(?![^>]*\bbare\b)/, `${f} renders a DragRail with its own step row — on the rack it is bare`);
    }
  });

  test('every chapter that plays a tone has ■ STOP on the dock (full screen hides the footer)', () => {
    for (const f of RACK_CHAPTERS) {
      const code = strip(read(`chapters/${f}`));
      if (!/renderAndPlay|playTray|playKey/.test(code)) continue;
      assert.match(code, /stopKey\(ctx\.player\)|id: 'stop'/, `${f} plays audio but has no ■ STOP key on its dock`);
    }
  });

  test("the lane's helpers are the shared ones", () => {
    assert.match(layout, /export \{ flipFader, lanePos, laneVal \} from '\.\.\/soundsystems\/rackLayout'/);
  });
});

describe('the shell hosts a rack chapter at full height', () => {
  test('a rack chapter gets the full height and no ScrollView of its own', () => {
    assert.match(shell, /const rack = !!def\.rack;/);
    assert.match(shell, /rack \? \([\s\S]*?<View style=\{styles\.rackFill\}>[\s\S]*?<Chapter key=\{chapter\} ctx=\{ctx\} \/>/, 'the rack branch is gone — the chapter would scroll inside the shell again');
    assert.match(shell, /rackFill: \{ flex: 1 \}/);
  });

  test('the chapter objective reaches the rack chapter through ctx', () => {
    assert.match(shell, /objective: def\.objective/);
    assert.match(layout, /ctx\.objective/);
  });

  test('the shell navigates through the shared strip (kit/LabNavBar), 1-based, with FINISH on the last chapter', () => {
    assert.match(shell, /import \{ LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav \} from '\.\.\/kit\/LabNavBar'/);
    assert.match(shell, /<LabHeader\b/);
    assert.match(shell, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(shell, /<LabNavProvider value=\{nav\}>/, 'the rack chapters get the in-flow NEXT from the provider');
    // One unit per chapter, in registry order, keyed by the 0-based index the
    // strip prints 1-based; `done` is this device's completed list.
    assert.match(shell, /CHAPTERS\.map\(\(c\) => \(\{ id: String\(c\.index\), title: c\.title, done: !!progress\?\.completed\.includes\(c\.index\) \}\)\)/);
    assert.match(shell, /index: CHAPTERS\.findIndex\(\(c\) => c\.index === chapter\)/);
    // NEXT / CONTENTS go through goTo (stop + save); FINISH stops and opens the end screen.
    assert.match(shell, /const navGo = useCallback\(\(i: number\) => goTo\(CHAPTERS\[i\]\?\.index \?\? 0\), \[goTo\]\);/);
    assert.match(shell, /const finish = useCallback\(\(\) => \{\n\s*player\.stop\(\);\n\s*setEnding\(true\);/);
    // The practice reset rides CONTENTS; the retired words and the local list are gone.
    assert.match(shell, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    for (const word of ['CONTINUE', 'listOpen', 'CHAPTER_TITLES', 'styles.dots', 'builtNext', 'builtPrev']) {
      assert.ok(!shell.includes(word), `the shell still carries "${word}"`);
    }
    // The reading chapter (no rack) draws the in-flow NEXT at the end of its scroll.
    assert.match(shell, /<Chapter ctx=\{ctx\} \/>\n\s*(\{\}\n\s*)?<LabNextButton \/>/);
    // BASIC / MATH stays in the header.
    assert.match(shell, /right=\{[\s\S]*?accessibilityLabel="See the math"/);
  });

  test('■ STOP and the sound line stay on the reading chapter and the end screen only; the end screen and the guest rule survive', () => {
    assert.match(shell, /\{rack && !ending \? null : \(\n\s*<View style=\{\[styles\.footer/);
    assert.match(shell, /■ STOP/);
    assert.match(shell, /<LabEndScreen/);
    assert.match(shell, /loadedAsGuestRef/);
    assert.match(shell, /if \(!resolved\) return;/, 'restore must wait for `resolved`');
    assert.match(shell, /if \(!guestRef\.current && !loadedAsGuestRef\.current\) void saveTuningProgress\(next\);/);
    assert.match(shell, /player\.stop\(\); \/\/ leaving a chapter stops its audio/);
  });
});

describe('the stage drawings zoom (D35)', () => {
  test('the SVG displays fill their box at the viewBox shape in fit mode', () => {
    for (const [file, name] of [
      ['components/primitives.tsx', 'CentsRail'],
      ['components/primitives.tsx', 'DeviationMeter'],
      ['components/harmonicLadder.tsx', 'HarmonicComparison'],
      ['components/harmonicLadder.tsx', 'BeatingModel'],
      ['components/stageFigures.tsx', 'Spiral'],
      ['components/stageFigures.tsx', 'DeviationChart'],
    ] as const) {
      const code = strip(read(file));
      const fn = code.slice(code.indexOf(`export function ${name}(`));
      const body = fn.slice(0, fn.indexOf('\nexport ', 10) > 0 ? fn.indexOf('\nexport ', 10) : undefined);
      assert.match(body, /style=\{fit \? \{ aspectRatio: [^}]+\} : undefined\}/, `${name} has no fit mode — it would not scale with the glass or full screen`);
    }
  });

  test('the view-built elevator scales every point constant by the stage text scale', () => {
    const code = strip(read('components/octaveElevator.tsx'));
    assert.match(code, /useStageTextScale\(\)/);
    assert.match(code, /fontSize: 9\.5 \* scale/);
    assert.match(code, /fontSize: 17 \* scale/);
  });

  test('no stage label is authored under the 9 pt floor', () => {
    for (const file of ['components/primitives.tsx', 'components/harmonicLadder.tsx', 'components/stageFigures.tsx']) {
      const code = strip(read(file));
      for (const m of code.matchAll(/fontSize=\{([\d.]+)\}/g)) {
        assert.ok(Number(m[1]) >= 9, `${file}: an SVG label is authored at ${m[1]} — the floor is 9 pt on the glass`);
      }
    }
  });

  test('the HEIGHT-bound drawings (ladders, chart, beating model) author no label under 9.5', () => {
    // A 340 × 150 drawing on an M glass that has dropped to S (a 375-wide
    // phone under 700 pt tall) fits by height at ×0.974: a 9 was 8.8 pt.
    for (const file of ['components/harmonicLadder.tsx', 'components/stageFigures.tsx']) {
      const code = strip(read(file));
      const fn = code.slice(0, code.indexOf('export function Spiral(') > 0 ? code.indexOf('export function Spiral(') : undefined);
      const rest = code.indexOf('export function DeviationChart(') > 0 ? code.slice(code.indexOf('export function DeviationChart(')) : '';
      for (const m of (fn + rest).matchAll(/fontSize=\{([\d.]+)\}/g)) {
        assert.ok(Number(m[1]) >= 9.5, `${file}: a height-bound label is authored at ${m[1]} — 9.5 keeps it ≥ 9 pt on a short phone`);
      }
    }
  });
});

/* ── review 2026-09-30: audio-expert + cognitive pass ─────────────────────── */

const ch = (n: number) => strip(read(`chapters/${chapterFiles.find((f) => f.startsWith(`ch${n}`) && !/^ch\d\d/.test(f.slice(2 + String(n).length)))!}`));

describe('the exact targets are reachable from the lane (review 2026-09-30)', () => {
  test('a 0.1 ¢ lane alone cannot land four fifths inside the 0.05 ¢ window — hence the snap', () => {
    // ⁴√5 = 696.578 ¢ lies between two 0.1 ¢ steps; the nearer one, 696.6,
    // puts g⁴/4 at +0.086 ¢ from 5/4, outside the window. The snap is what
    // makes the target reachable by thumb, not a convenience.
    const third = (fifth: number) => ratioToCents(Math.pow(centsToRatio(fifth), 4) / 4);
    assert.ok(Math.abs(third(696.6) - JUST_MAJOR_THIRD.cents) > 0.05);
    assert.ok(Math.abs(third(696.5) - JUST_MAJOR_THIRD.cents) > 0.05);
    assert.ok(Math.abs(third(MEANTONE_FIFTH.cents) - JUST_MAJOR_THIRD.cents) < 1e-9);
  });

  test('rackLayout exports snapNear and the three fine lanes use it on their exact target', () => {
    assert.match(layout, /export const snapNear = \(value: number, target: number, window = 0\.25\): number =>/);
    assert.match(ch(9), /onChange: \(p\) => setFifthCents\(snapNear\(laneVal\(p, MIN, MAX, 0\.1\), MEANTONE_FIFTH\.cents\)\)/);
    assert.match(ch(4), /setSliderCents\(snapNear\(laneVal\(p, MIN, MAX, 0\.1\), JUST_MAJOR_THIRD\.cents\)\)/);
    assert.match(ch(13), /onChange: \(p\) => setThirdCents\(snapNear\(laneVal\(p, MIN, MAX, 0\.1\), JUST_MAJOR_THIRD\.cents\)\)/);
    // SHOW ME lands on the exact constant, not a two-decimal copy of it.
    assert.doesNotMatch(ch(9) + ch(4) + ch(13), /\+(MEANTONE_FIFTH|JUST_MAJOR_THIRD)\.cents\.toFixed\(2\)/);
  });

  test('a lane in a five-key dock has a ≤7-character formatShort', () => {
    for (const n of [4, 9, 13]) assert.match(ch(n), /formatShort: \(p\) => `\$\{snapNear\([^`]*\)\.toFixed\(1\)\}¢`/, `chapter ${n}'s fine lane has no key-width readout`);
  });
});

describe('every bezel number and rail label matches the engine (review 2026-09-30)', () => {
  test("chapter 9's four stacked fifths are labelled with the FOLDED powers", () => {
    // g² is 1393 ¢ and g³ 2090 ¢; what sits at 193 ¢ and 890 ¢ is g²/2 and g³/2.
    assert.match(ch(9), /\['', 'g', 'g²\/2', 'g³\/2'\]\[k\]/);
    assert.doesNotMatch(ch(9), /`\$\{sp\} · g\$\{\['', '', '²', '³'\]\[k\]\}`/);
  });

  test('chapter 9 puts the whole-chain stop key outside the part conditionals (one STOP on every part)', () => {
    const code = ch(9);
    assert.equal((code.match(/stopKey\(ctx\.player\)/g) ?? []).length, 1);
    assert.match(code, /\n    stopKey\(ctx\.player\),\n  \];/);
  });

  test('chapter 13 puts ■ STOP outside the figure conditionals too', () => {
    const code = ch(13);
    assert.equal((code.match(/stopKey\(ctx\.player\)/g) ?? []).length, 1);
    assert.match(code, /\n    stopKey\(ctx\.player\),\n  \];/);
  });

  test("chapter 2's default landmark is on the rail from the first frame, and MARKER reads two decimals", () => {
    assert.match(ch(2), /useState<number \| null>\(3\)/);
    assert.match(ch(2), /k: 'MARKER', v: `\$\{challenge\.toFixed\(2\)\} ¢`/);
  });

  test("chapter 6's spiral wears the explanatory-model badge, not the exact-ratios one", () => {
    assert.match(ch(6), /badge: BADGE_MODEL/);
  });
});

describe('a cropped readout drops its label, never its number (D36)', () => {
  test("chapter 5's NEWEST cell is the spelling; the fraction rides on the lane readout", () => {
    assert.match(ch(5), /\{ k: 'NEWEST', v: newest\.spelling,/);
    assert.match(ch(5), /return `\$\{n\} of 12 · \$\{CHAIN\[n\]\.spelling\} \$\{fracLabel\(CHAIN\[n\]\.normalized\)\}`;/);
  });

  test('the exact-label cells in chapters 9 (part D) and 11 carry the spelling on the KEY line', () => {
    assert.match(ch(9), /k: `NOTE \$\{MT\.notes\[revealed - 1\]\.spelling\}`, v: MT\.notes\[revealed - 1\]\.value\.exactLabel/);
    assert.match(ch(11), /k: `NOTE \$\{note\.spelling\}`, v: note\.value\.exactLabel/);
  });

  test("chapter 11's dock names are at most 5 characters so B·<name> fits a five-key dock", () => {
    const m = ch(11).match(/const KEY_NAME[^=]*= (\{[^}]*\})/);
    assert.ok(m);
    for (const name of m![1].match(/'([^']*)'/g) ?? []) assert.ok(name.length - 2 <= 5, `${name} is wider than a dock key`);
    assert.match(ch(11), /valueLabel: `B·\$\{KEY_NAME\[bId\]\}`/);
  });

  test("chapter 13's FIGURE shorts fit a five-key dock", () => {
    for (const s of ['FOLD', 'THIRD', 'E MOVES']) assert.match(ch(13), new RegExp(`short: '${s}'`));
  });
});

describe('every dock key changes the picture (review 2026-09-30)', () => {
  test('chapter 3: SHOW OP prints the pending operation on the elevator', () => {
    assert.match(strip(read('components/octaveElevator.tsx')), /op\?: '×2' \| '÷2' \| null;/);
    assert.match(ch(3), /op=\{!turn && demoStep === 1 \? \(demo === 'A' \? '÷2' : '×2'\) : null\}/);
  });
  test('chapter 4: LISTEN · partials fades the non-compared rungs', () => {
    assert.match(strip(read('components/harmonicLadder.tsx')), /isolate\?: boolean;/);
    assert.match(ch(4), /isolate=\{mode === 'partials'\}/);
  });
  test('chapter 5: BY PITCH numbers the rail markers in generation order', () => {
    assert.match(ch(5), /label: order === 'fifth' && s\.index > 0 \? `\$\{s\.index\}·\$\{s\.spelling\}` : s\.spelling/);
  });
  test('chapter 6: the HEAR pick rings the sounding note on the spiral', () => {
    assert.match(strip(read('components/stageFigures.tsx')), /highlight\?: SpiralHighlight/);
    assert.match(ch(6), /<Spiral highlight=\{/);
  });
  test('chapter 8: the EXAMPLE lights its notes on the rail', () => {
    assert.match(ch(8), /inExample\.includes\(n\.spelling\) \? \('neutral' as const\)/);
  });
  test('chapter 10: the A / B pick lights the pattern on the rail', () => {
    assert.match(ch(10), /const lit = new Set<number>\(!status\.playing \? \[\]/);
    assert.match(ch(10), /role: lit\.has\(k\) \? 'active'/);
  });
});

describe('the two-lane rail keeps its endpoint labels clear of lane 1', () => {
  test('the axis rises and the endpoints take the bottom row when a lane-1 marker is drawn', () => {
    const code = strip(read('components/primitives.tsx'));
    assert.match(code, /const axisY = hasLane1 \? height - 44 : height - 30;/);
    assert.match(code, /const endY = hasLane1 \? height - 5 : height - 8;/);
  });
});
