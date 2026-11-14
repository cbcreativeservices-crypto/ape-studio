/**
 * Lab fix round 1 (2026-11-14), group S3: the silent learner, header icons,
 * bezel captions, trays, the reading well and the Labs menu.
 *
 * Owner approval, 2026-11-14: "Begin fixing all bugs found and do obvious (my
 * decision is not required) fixes as you suggestted in the report." — then
 * the report's suggested order, items 4 (silent learner line and "needs
 * sound" tags), 7 (header icons) and 8 (trays, bezel captions, reading well),
 * and quick wins 6 and 12. Report: docs/labs/novice_audit_2026_11_14/
 * LAB_BEGINNER_AUDIT_REPORT.md, section 3 rows 3, 6, 7, 8, 9.
 *
 * Every test below fails on the code before the fix.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(spec)) {
      for (const ext of ['.ts', '.tsx']) {
        const c = new URL(spec + ext, ctx.parentURL);
        if (existsSync(fileURLToPath(c))) return { url: c.href, shortCircuit: true };
      }
    }
    return next(spec, ctx);
  },
});

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Source without comments, so a rule is checked in code, not in a note. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const silent = await import('../src/screens/lab/rack/silentRules.ts');
const bezel = await import('../src/screens/lab/rack/bezelRules.ts');
const lane = await import('../src/screens/lab/rack/laneStep.ts');
const peek = await import('../src/screens/lab/rack/peekRules.ts');
const { LAB_CATEGORIES, categoryLabRows, getCategory } = await import('../src/screens/lab/labCatalog.ts');

// ─────────────────────────────────────────────── 1. the silent learner (row 3)
describe('row 3 · the silent learner', () => {
  it('the frame line is one plain sentence pair in the student voice, shown only on request', () => {
    assert.equal(silent.SOUND_OFF_LINE, 'Sound off? You can still do every step. The readouts show what you would hear.');
    assert.equal(silent.soundOffLineText(true), silent.SOUND_OFF_LINE);
    assert.equal(silent.soundOffLineText('Own words.'), 'Own words.');
    assert.equal(silent.soundOffLineText(undefined), null);
    assert.equal(silent.soundOffLineText(false), null);
    assert.equal(silent.soundOffLineText('  '), null);
  });
  it('a stored value stands in for a silent readout, and says so when read aloud', () => {
    assert.deepEqual(silent.silentValue(true, '— dB', '4.2 dB'), { v: '4.2 dB', a11y: '4.2 dB (not heard: sound is off)' });
    assert.deepEqual(silent.silentValue(false, '3.9 dB', '4.2 dB'), { v: '3.9 dB', a11y: '3.9 dB' });
    assert.deepEqual(silent.silentValue(true, '— dB', null), { v: '— dB', a11y: '— dB' });
    assert.equal(silent.needsSoundA11y('Hear the click'), 'Hear the click (needs sound)');
  });
  it('the rack prints the line at the top of its well, only while sound is off, only where the stage asks', () => {
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /const soundOffText = soundOffLineText\(stage\.soundOffLine\);/);
    assert.match(r, /\{soundOffText \? <SoundOffLine text=\{soundOffText\} \/> : null\}\s*\{typeof children === 'function'/);
    const p = code('screens/lab/rack/silentPath.tsx');
    assert.match(p, /return !useAudioOutputEnabled\(\);/, 'sound off = the app output gate is off');
    assert.match(p, /if \(!off\) return null;/, 'the line never shows while sound is on');
    assert.match(read('screens/lab/rack/rackTypes.ts'), /soundOffLine\?: boolean \| string;/);
  });
  it('a bezel cell can carry a silent value; the cell swaps it in while sound is off and says "not heard"', () => {
    assert.match(read('screens/lab/rack/rackTypes.ts'), /silent\?: \{ v: string; sub\?: string; vA11y\?: string \};/);
    const it0 = { k: 'GR', v: '— dB', silent: { v: '4.2 dB', sub: 'MODEL' } };
    assert.deepEqual(bezel.bezelShown(it0, false), { it: it0, silent: false });
    const off = bezel.bezelShown(it0, true);
    assert.equal(off.silent, true);
    assert.equal(off.it.v, '4.2 dB');
    assert.equal(off.it.sub, 'MODEL');
    assert.equal(bezel.bezelCellSaid(off.it, true), '4.2 dB MODEL (not heard: sound is off)');
    assert.match(code('screens/lab/rack/BezelReadouts.tsx'), /const shown = items\.map\(\(it\) => bezelShown\(it, soundOff\)\);/);
  });
  it('the needs-sound tag exists and reads aloud as "needs sound"', () => {
    const p = code('screens/lab/rack/silentPath.tsx');
    assert.match(p, /export function NeedsSoundTag\(/);
    assert.match(p, /accessibilityLabel="needs sound"/);
    assert.equal(silent.NEEDS_SOUND, 'NEEDS SOUND');
  });
  it('two example labs ask for the line where the picture really shows the sound: Delay and Phase', () => {
    const fx = read('screens/lab/fxLabConfigs.tsx');
    for (const id of ['delay', 'phase']) {
      const block = fx.slice(fx.indexOf(`labId: '${id}',`), fx.indexOf(`labId: '${id}',`) + 600);
      assert.match(block, /soundOffLine: 'Sound off\? /, id);
    }
    assert.match(code('screens/lab/FxLabScreen.tsx'), /soundOffLine: config\.soundOffLine,/);
  });
});

// ─────────────────────────────────────────────── 2. header icons (row 6)
describe('row 6 · header icons: no two look-alike ⓘ', () => {
  it('the app Help key says HELP in words', () => {
    const h = code('components/HelpKey.tsx');
    assert.match(h, /export const HELP_KEY_TEXT = 'HELP';/);
    assert.match(h, /\{HELP_KEY_TEXT\}<\/Text>/);
    assert.doesNotMatch(h, />\?<\/Text>/, 'the bare "?" glyph is gone');
  });
  it('the accuracy chip never wears the screen guide ⓘ: ± accuracy, § scope, ✓ verified, ABOUT', () => {
    const a = code('components/AccuracyNote.tsx');
    assert.doesNotMatch(a, /isCalc \? '✓' : 'ⓘ'/);
    assert.match(a, /return variant === 'calc' \? '✓' : variant === 'practice' \? '§' : variant === 'about' \? '' : '±';/);
    assert.match(a, /\{accuracyGlyph\(variant\)\}/);
    assert.doesNotMatch(a.replace(/'[^'\n]*ⓘ[^'\n]*'/g, ''), /ⓘ/, 'no ⓘ glyph left in the chip');
  });
  it('a concept lesson can show ONLY its own note: variant "about" (no calibration, light meter or tool list)', () => {
    const a = code('components/AccuracyNote.tsx');
    assert.match(a, /variant\?: 'tool' \| 'calc' \| 'practice' \| 'about';/);
    assert.match(a, /const sheetBody: readonly string\[\] = isAbout \? \[\] :/);
    assert.match(a, /const showToolList = !isCalc && !isPractice && !isAbout;/);
    assert.match(a, /const sheetCloser = isAbout \? null :/);
    assert.match(a, /export const ABOUT_CHIP = 'ABOUT';/);
  });
  it('the screen guide keeps the one ⓘ ("Explain this screen")', () => {
    assert.match(read('features/lab/screenGuide/types.ts'), /SCREEN_GUIDE_KEY_LABEL = 'Explain this screen'/);
  });
});

// ─────────────────────────────────────────────── 3. bezel (row 7)
describe('row 7 · bezel captions, the Hz / dB chip, "dBFS dBFS"', () => {
  it('"-8.4 dBFS dBFS" is gone: a unit already in the spoken value is not read twice (DJ dbCell)', () => {
    assert.equal(bezel.bezelCellSaid({ v: '-8.4', vA11y: '-8.4 dBFS', sub: 'dBFS' }), '-8.4 dBFS');
    // …while a sub the value does not carry is still read (the imperial line).
    assert.equal(bezel.bezelCellSaid({ v: '≈ 25 cm', sub: '(9.8 in)' }), '≈ 25 cm (9.8 in)');
    assert.equal(bezel.bezelCellSaid({ v: '-12.0', sub: 'dBFS' }), '-12.0 dBFS');
    assert.match(code('screens/lab/rack/BezelReadouts.tsx'), /accessibilityLabel=\{`\$\{it\.k\}: \$\{bezelCellSaid\(it, silent\)\}`\}/);
  });
  it('a caption is a lab-supplied field, drawn under the value on the first visit only', () => {
    assert.match(read('screens/lab/rack/rackTypes.ts'), /caption\?: string;/);
    assert.match(read('screens/lab/rack/rackTypes.ts'), /captionsId\?: string;/);
    const b = code('screens/lab/rack/BezelReadouts.tsx');
    assert.match(b, /caption=\{captions \? x\.it\.caption : undefined\}/);
    assert.match(b, /<Text style=\{styles\.caption\} \{\.\.\.fitValue\(10\)\}>/, 'never under 9 pt');
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /const captionsUnseen = useCaptionsUnseen\(captionsId\);/);
    assert.match(r, /if \(captionsShownRef\.current\) void markCaptionsSeen\(captionsShownRef\.current\);/, 'the visit is recorded when the rack goes');
    assert.match(r, /captions=\{showCaptions\} unitsChip \/>/);
    assert.equal(bezel.captionsIdFor(undefined, ['where', undefined, 'how much']), 'where|how much');
    assert.equal(bezel.captionsIdFor('equalizer', ['where']), 'equalizer');
    assert.equal(bezel.captionsIdFor(undefined, [undefined, '']), null);
  });
  it('captions and the chip are intro flags on the shared safe store, kept through the guest wipe', () => {
    const f = read('screens/lab/rack/bezelFirstSight.ts');
    assert.match(f, /export const BEZEL_FIRST_SIGHT_KEY = 'ape:intro:bezelCaptions';/);
    assert.match(f, /createLocalStore<BezelFirstSight>\(/);
    assert.match(f, /onScreenIntrosReset\(\(\) => store\.reset\(\)\);/);
  });
  it('the Hz / dB chip shows only where the strip shows Hz or dB, and its words are plain and right', () => {
    assert.equal(bezel.showsHzOrDb(['1.0 kHz']), true);
    assert.equal(bezel.showsHzOrDb(['+6.0dB']), true);
    assert.equal(bezel.showsHzOrDb(['-8.4 dBFS']), true);
    assert.equal(bezel.showsHzOrDb(['80 ms', '50%', 'BELL']), false);
    assert.equal(bezel.UNITS_CHIP_LABEL, 'Hz? dB? WHAT THEY MEAN ›');
    const words = bezel.UNITS_LINES.map((l: { text: string }) => l.text).join(' ');
    assert.match(words, /1 kHz is 1,000 Hz/);
    assert.match(words, /\+6 dB is about twice the signal, −6 dB about half/);
    assert.doesNotMatch(words, /colour|behaviour|centre/, 'US spelling');
  });
});

// ─────────────────────────────────────────────── 4. trays (row 8)
describe('row 8 · trays', () => {
  it('the inline tray no longer washes and blocks the well; the full-screen one keeps its clear backdrop', () => {
    const t = code('screens/lab/rack/DockTray.tsx');
    assert.match(t, /\{passThrough \? null : \(\s*<Pressable\s+style=\{\[styles\.backdrop/);
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /<DockTray param=\{trayRouted\} onClose=\{closeTray\} onHelp=\{help\} bottomInset=\{0\} passThrough onCardLayout=\{setInlineTrayH\}/);
    assert.match(r, /<DockTray param=\{trayRouted\} onClose=\{closeTray\} onHelp=\{help\} bottomInset=\{0\} dim=\{false\} onCardLayout=\{setFullTrayH\} \/>/);
  });
  it('a tap on the well closes the tray; scrolling closes a pick-and-close tray, not a sticky A/B one', () => {
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /if \(Math\.hypot\(e\.nativeEvent\.pageX - t0\.x, e\.nativeEvent\.pageY - t0\.y\) < 10\) closeTray\(\);/);
    assert.match(r, /onScrollBeginDrag=\{\(\) => \{\s*if \(trayParam && !\(trayParam\.kind === 'group' \|\| trayParam\.sticky\)\) closeTray\(\);/);
  });
  it('the well foot gets the card height, so the readout a step names and NEXT scroll above the card', () => {
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /\{trayParam && inlineTrayH > 0 \? <View style=\{\{ height: inlineTrayH \+ 12 \}\} pointerEvents="none" \/> : null\}/);
  });
  it('a stray tap never resets work: the in-tray reset needs a second tap within 3 s', () => {
    const t = code('screens/lab/rack/DockTray.tsx');
    assert.match(t, /export const RESET_ARM_MS = 3000;/);
    assert.match(t, /export const RESET_ARMED_TEXT = 'TAP AGAIN TO RESET';/);
    assert.match(t, /if \(!resetArmed\) \{\s*setResetArmed\(true\);[\s\S]{0,120}return;\s*\}\s*setResetArmed\(false\);\s*param\.onReset\?\.onPress\(\);/);
    assert.doesNotMatch(t, /onPress=\{param\.onReset\.onPress\}/, 'no one-tap reset left');
  });
  it('every lane without its own nudges has − and + keys: one readout step (≥ 2 %), hold = that end', () => {
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /\{bound\.nudges\?\.length \? null : <LaneStepKey dir=\{-1\} param=\{bound\} \/>\}/);
    assert.match(r, /\{bound\.nudges\?\.length \? null : <LaneStepKey dir=\{1\} param=\{bound\} \/>\}/);
    assert.match(r, /onLongPress=\{\(\) => set\(dir < 0 \? 0 : 1\)\}/);
    // A fine fader moves at least 2 % per tap.
    const fine = (v: number) => `${(v * 100).toFixed(1)} %`;
    assert.ok(Math.abs(lane.laneStepValue(0.5, 1, fine) - 0.52) < 1e-9);
    assert.ok(Math.abs(lane.laneStepValue(0.5, -1, fine) - 0.48) < 1e-9);
    // A four-position fader always reaches its NEXT position (never a dead key).
    const four = (v: number) => ['A', 'B', 'C', 'D'][Math.round(v * 3)];
    const up = lane.laneStepValue(0, 1, four);
    assert.equal(four(up), 'B');
    const down = lane.laneStepValue(1, -1, four);
    assert.equal(four(down), 'C');
    // The ends hold.
    assert.equal(lane.laneStepValue(1, 1, fine), 1);
    assert.equal(lane.laneStepValue(0, -1, fine), 0);
    assert.equal(lane.laneStepValue(0.99, 1, fine), 1);
    // A format that throws still steps.
    assert.ok(Math.abs(lane.laneStepValue(0.5, 1, () => { throw new Error('x'); }) - 0.52) < 1e-9);
    assert.match(lane.laneStepA11y('TIME', -1), /^TIME: one step down\. Hold for the lowest setting\.$/);
  });
  it('a dock label is never cut to "…": hidden until measured, two lines at 9 pt when no size fits one', () => {
    const d = code('screens/lab/rack/DockButton.tsx');
    assert.match(d, /const labelMeasured = isKey \|\| \(btnW > 0 && labelW > 0\);/);
    assert.match(d, /!labelMeasured && styles\.unmeasured\]\} numberOfLines=\{labelWraps \? 2 : 1\}>/);
    assert.match(d, /const MIN_LABEL_WRAP_FS = 9;/);
  });
  it('a one-shot key is an action key: it flashes, it never stays lit (frame, verified)', () => {
    const d = code('screens/lab/rack/DockButton.tsx');
    assert.match(d, /timer\.current = setTimeout\(\(\) => setFired\(false\), 220\);/);
  });
});

// ─────────────────────────────────────────────── 5. reading well (row 9)
describe('row 9 · the reading well gets room while reading', () => {
  it('the fold keeps 40 % of the glass (never under 72 dp) and only folds a well that still overflows after', () => {
    assert.equal(peek.peekHeight(250), 100);
    assert.equal(peek.peekHeight(160), 72);
    assert.equal(peek.peekHeight(60), 60);
    const base = { contentH: 900, viewH: 228, glassH: 250, busy: false, allowed: true };
    assert.equal(peek.shouldPeek({ ...base, y: 30 }), true);
    assert.equal(peek.shouldPeek({ ...base, y: 10 }), false, 'not before the learner reads');
    assert.equal(peek.shouldPeek({ ...base, y: 30, busy: true }), false, 'never under a drag or an open tray');
    assert.equal(peek.shouldPeek({ ...base, y: 30, allowed: false }), false, 'tablet / HIDE DISPLAY');
    assert.equal(peek.shouldPeek({ ...base, y: 30, contentH: 228 + 150 + 30 }), false, 'a short well would unfold itself');
  });
  it('the glass is clipped, never resized; any touch on the display or dock, a tray, or the top unfolds it', () => {
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /style=\{\[styles\.peekClip, folded && \{ height: peekHeight\(glassH\) \}\]\}/);
    assert.match(r, /style=\{\[styles\.glass, \{ height: glassH \}, folded && \{ marginTop: -Math\.round\(\(glassH - peekHeight\(glassH\)\) \/ 2\) \}\]\}/);
    assert.match(r, /onTouchStart=\{peek \? \(\) => setPeek\(false\) : undefined\} \{\.\.\.mouseToo\(peek \? \(\) => setPeek\(false\) : undefined\)\}>\{dockFor\(false\)\}<\/View>/);
    assert.match(r, /if \(peek && \(interacting \|\| !peekAllowed\)\) setPeek\(false\);/);
    assert.match(r, /if \(y <= 4\) setPeek\(false\);/);
    assert.match(r, /const peekAllowed = !tablet && !stageCollapsed;/);
    assert.match(r, /peek \? '▾  OPEN DISPLAY'/);
  });
});

// ─────────────────────────────────────────────── 6. the Labs menu
describe('quick win 12 + section 7 · the Labs menu', () => {
  type Leaf = { name: string; blurb: string; tileBlurb?: string; startHere?: boolean; route?: string; key?: string };
  const leaves = (): Leaf[] => LAB_CATEGORIES.flatMap((c: never) => categoryLabRows(c)) as Leaf[];
  it('START HERE marks Understanding Level & Amplitude, and only it (a marker, never a lock)', () => {
    const marked = leaves().filter((l) => l.startHere).map((l) => l.name);
    assert.deepEqual(marked, ['Understanding Level & Amplitude']);
    const e = code('screens/lab/EarLabScreen.tsx');
    assert.match(e, /\{leaf\.startHere \? <Text style=\{styles\.startHere\}>START HERE<\/Text> : null\}/);
  });
  it('Microphone Selection is first in Instruments & Recording, before the 128 miking lessons', () => {
    const rows = categoryLabRows(getCategory('instruments') as never) as Leaf[];
    assert.equal(rows[0].name, 'Microphone Selection Lab');
    assert.ok(rows.some((r) => r.name === 'Bass Guitar Physics'), 'nothing dropped');
  });
  it('no tile text is cut at three lines: every tile blurb fits (34 of 65 were cut)', () => {
    // Measured at 390 wide (2026-11-14, the 8142 preview, line-clamp check):
    // the shortest blurb that was cut had 84 characters; two longer ones fit
    // whole (Gain Staging 86, Mixing Guides 91, words that wrap well). Every
    // short form is written to 64 characters at most.
    const MEASURED_FIT = new Set(['Gain Staging', 'Mixing Guides']);
    const long = leaves().filter((l) => (l.tileBlurb ?? l.blurb).length > 83 && !MEASURED_FIT.has(l.name)).map((l) => l.name);
    assert.deepEqual(long, []);
    assert.deepEqual(leaves().filter((l) => l.tileBlurb && l.tileBlurb.length > 64).map((l) => l.name), []);
    // A tile blurb is a real short form, in US spelling, never the full blurb cut.
    for (const l of leaves()) {
      if (!l.tileBlurb) continue;
      assert.ok(l.tileBlurb.length < l.blurb.length, l.name);
      assert.doesNotMatch(l.tileBlurb, /colour|behaviour|centre|analyse/, l.name);
      assert.doesNotMatch(l.tileBlurb, /\byou'?ll (master|build|mix)\b/i, `${l.name}: knowledge, not skills`);
    }
    const e = code('screens/lab/EarLabScreen.tsx');
    assert.match(e, /\{leaf\.tileBlurb \?\? leaf\.blurb\}/);
    assert.match(e, /\$\{leaf\.blurb\}/, 'the full blurb is still read aloud');
  });
  it('the ✓ done mark is back on the tiles, read-only from the lab-credit store', () => {
    const e = code('screens/lab/EarLabScreen.tsx');
    assert.match(e, /const done = useLabDone\(tileDoneKey\(leaf\)\) && !dev;/);
    assert.match(e, /return leaf\.key \?\? \(leaf\.route \? trainingKeyFor\(leaf\.route\) : ''\);/);
    assert.match(e, /<Text style=\{styles\.doneTag\}>✓ DONE<\/Text>/);
    assert.doesNotMatch(e, /markLabUnit|markTrainingDone|registerLabUnits/, 'the menu never writes credit');
  });
});

// ─────────────────────────────────────────────── 7. S2's shared need in LabShell
describe("quick win 4 · every LabShell check ends on FINISH · SEE WHAT'S LEFT", () => {
  it('a lab with no checkEnd of its own gets the shared LabCheckEnd under its CHECK', () => {
    const s = code('screens/lab/LabShell.tsx');
    assert.match(s, /import \{ LabCheckEnd \} from '\.\/kit\/LabCheckEnd';/);
    assert.match(s, /\{checkEnd \?\? <LabCheckEnd labId=\{labId\} labTitle=\{checkTitle \?\? title\} \/>\}/);
    assert.doesNotMatch(s, /\{checkEnd \?\? null\}/);
    // LabCheckEnd never imports LabShell (no cycle).
    assert.doesNotMatch(read('screens/lab/kit/LabCheckEnd.tsx'), /from '\.\.\/LabShell'/);
  });
});

// ─────────────────────────────────────────────── 8. F2's shared needs (DJ, Sound Systems)
describe("F2 · DJ and Sound Systems trays; a locked key's spoken reason", () => {
  it('DJ and Sound Systems draw their docks through the shared RackUnit, so the row 8 tray rules reach them', () => {
    assert.match(read('screens/lab/dj/DjRack.tsx'), /<RackUnit\b/);
    assert.match(read('screens/lab/soundsystems/rackLayout.tsx') + read('screens/lab/soundsystems/SsPagedLab.tsx'), /RackUnit/);
    assert.doesNotMatch(read('screens/lab/dj/DjRack.tsx'), /<DockTray\b/, 'no private tray that would escape the rules');
  });
  it('"DCA cell.." is gone: a reason that ends in a full stop is not given a second one', async () => {
    const { lockedReason } = await import('../src/screens/lab/rack/dockFit.ts');
    assert.equal(lockedReason('Pick a DCA cell.'), 'Pick a DCA cell');
    assert.equal(lockedReason('Pick a TAP first'), 'Pick a TAP first');
    assert.equal(lockedReason('Not yet! '), 'Not yet');
    const r = code('screens/lab/rack/RackUnit.tsx');
    // RackUnit inlines the same rule (its dock is also run from source by test/batch4_G5).
    assert.equal((r.match(/locked — \$\{p\.locked\.trim\(\)\.replace\(\/\[\.!\?\]\+\$\/, ''\)\}\./g) ?? []).length, 3);
    assert.doesNotMatch(r, /locked — \$\{p\.locked\}\./);
  });
});

// ─────────────────────────────────────────────── 9. S1's SN1 in LabShell
describe("S1 SN1 · LabShell's arrival Sound Safety ask", () => {
  it('is an auto ask, and right after a first-open card closes it asks at once (never 1.2 s later on a tap)', () => {
    const s = code('screens/lab/LabShell.tsx');
    assert.match(s, /import \{ markSoundAsk \} from '\.\.\/\.\.\/features\/audio\/soundSafetyAck';/);
    assert.match(s, /import \{ rootModalHoldMs \} from '\.\.\/\.\.\/components\/DimModal';/);
    assert.match(s, /markSoundAsk\('auto'\);[^\n]*\n\s*void requestAudioOutput\(\);/);
    assert.match(s, /if \(labTermFirst\) \{\s*waitedRef\.current = true;\s*return undefined;\s*\}/);
    assert.match(s, /if \(waitedRef\.current\) \{\s*const t = setTimeout\(ask, rootModalHoldMs\(\)\);/);
    // Low-Light still never auto-asks.
    assert.match(s, /if \(areOverlaysSuppressed\(\)\) return;/);
  });
});

// ─────────────────────────────────────────────── 10. F2: an open tray under a tall display
describe('F2 · an open tray on a tall display folds it (DJ screen 10 left one lesson line)', () => {
  it('folds when the reading room above the card is under 120 dp, decided from the unfolded layout', () => {
    // DJ at 390 × 844: rack ~760, dock ~130, card ~220, the well's top ~430.
    const base = { rootH: 760, bottom: 0, dockH: 130, cardH: 220, wellTop: 430, glassH: 300 };
    assert.equal(peek.shouldTrayFold(base), true);
    assert.equal(peek.shouldTrayFold({ ...base, wellTop: 200 }), false, 'room enough: as before');
    assert.equal(peek.shouldTrayFold({ ...base, cardH: 0 }), false, 'card not measured yet');
    assert.equal(peek.TRAY_READ_MIN, 120);
  });
  it('the rack folds with the same clip while such a tray is open and unfolds when it closes', () => {
    const r = code('screens/lab/rack/RackUnit.tsx');
    assert.match(r, /const trayFold =\s*trayParam != null &&\s*peekAllowed &&\s*!full &&\s*shouldTrayFold\(/);
    assert.match(r, /const folded = peek \|\| trayFold;/);
    assert.match(r, /style=\{\[styles\.peekClip, folded && \{ height: peekHeight\(glassH\) \}\]\}/);
    // minWell's chrome is read only with the whole display showing.
    assert.match(r, /if \(!stage\.minWell \|\| stageCollapsed \|\| folded\) return;/);
  });
});
