/**
 * Collapsed-sections build (owner 2026-11-21: "Build all 40", the proposal in
 * Downloads/2026-11-21_LAB_COLLAPSED_SECTIONS_PROPOSAL.md). Extra reading
 * starts CLOSED, one tap away, with every word kept; the first move, the one
 * "how to read this display" box, live feedback, safety lines, LAB NOTES and
 * everything that earns credit stay open. Each block would have failed before
 * its change. Nothing here is remembered: every visit starts the same.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
// Windows checkouts are CRLF (core.autocrlf): normalise before matching on '\n'.
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const LAB = 'src/screens/lab/';
const closed = (title: string) => `<CollapsibleSection title="${title}" startOpen={false}`;
const count = (s: string, sub: string) => s.split(sub).length - 1;

describe('Visual Audio Analysis: myths, mistakes and the deep reads start closed', () => {
  const A = read(`${LAB}meter/modules/modMeterA.tsx`);
  const B = read(`${LAB}meter/modules/modMeterB.tsx`);
  const C = read(`${LAB}meter/modules/modMeterC.tsx`);
  it('COMMON MISTAKES is a closed fold in both card helpers (7 modules)', () => {
    for (const s of [A, B]) assert.ok(s.includes(closed('COMMON MISTAKES')));
    assert.equal(count(A, '<MistakesCard items='), 4);
    assert.equal(count(B, '<CommonMistakes items='), 3);
  });
  it('every MYTH / REALITY card sits inside a closed fold (VU, Waterfall, Phase, Stereo, Scope)', () => {
    for (const [s, n] of [[A, 1], [B, 1], [C, 3]] as const) {
      assert.equal(count(s, '<MythReality'), n);
      assert.equal(count(s, `${closed('MYTH vs REALITY')}>\n          <MythReality`), n);
    }
  });
  it('FIELD GUIDE, THE RAWEST VIEW and WHY IT WORKS start closed', () => {
    assert.ok(B.includes(closed('FIELD GUIDE — WHAT TO TRY')));
    assert.ok(C.includes(closed('THE RAWEST VIEW')));
    assert.ok(C.includes(closed('WHY IT WORKS')));
  });
  it('the "how to read" boxes and the only explanations stay open', () => {
    for (const t of ['READING THE PICTURE — CUE BY CUE', 'SAMPLE-BY-SAMPLE, THEN A MEMORY', 'THE LESSON — WATCH THE NEEDLE LOSE TO THE LED', 'WHY EVERYONE NORMALIZES BY INTEGRATED LUFS']) assert.ok(A.includes(`<CollapsibleSection title="${t}">`), t);
    assert.ok(B.includes('<CollapsibleSection title="THE WATERFALL — READ THE AXES FIRST" onHelp='));
    assert.ok(B.includes('<CollapsibleSection title="READ THE AXES FIRST" onHelp='));
    assert.ok(C.includes('<CollapsibleSection title="THE GRADUATION EXERCISE">'));
  });
});

describe('LEARN tab: CONTROLS, COMMON MISTAKES, PRO TIPS and FORMULA start closed in the shared frame', () => {
  const shell = read(`${LAB}LabShell.tsx`);
  const body = read('src/features/lab/guidedLessons/GuidedLessonSheet.tsx');
  it('both LEARN branches pass the fold, and the fold starts closed', () => {
    assert.equal(count(shell, '<GuidedLessonBody lesson={lesson} fold={LearnFold} />'), 2);
    assert.match(shell, /function LearnFold\(\{ title, children \}[^)]*\) \{\s*return \(\s*<CollapsibleSection title=\{title\} startOpen=\{false\}>/);
  });
  it('the four blocks fold; what it is, outcomes and GUIDED STEPS do not; a focused control never folds', () => {
    for (const t of ['CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT']) assert.ok(body.includes(`folded('${t}',`), t);
    assert.ok(!body.includes("folded('GUIDED STEPS'") && !body.includes("folded('WHAT YOU WILL UNDERSTAND'"));
    assert.match(body, /const Fold = control \? undefined : fold;/);
  });
  it('LAB NOTES itself stays open (it holds the checks and the lesson sheet)', () => {
    assert.match(shell, /<CollapsibleSection title="LAB NOTES" keepMounted>/);
  });
});

describe('Labs on the shared frame, EXPLORE', () => {
  it('THE AUDIO PATH folds, but a sound error or the cannot-play line stays in view above it', () => {
    const fx = read(`${LAB}FxLabScreen.tsx`);
    const fold = fx.indexOf(closed('THE AUDIO PATH'));
    assert.ok(fold > 0);
    assert.ok(fx.indexOf('{engineReady && fxReady && genError ? <Text style={styles.error}>{genError}</Text> : null}') < fold);
    assert.ok(fx.indexOf('The effect audio can’t play on this device.') < fold);
    assert.ok(fx.includes('<Text style={styles.sectionHead}>DESIGNED RESPONSE</Text>'), 'live response curve stays open');
  });
  it('Noise SPKR background, Signal Chain rack notes and the Plate spec card start closed', () => {
    assert.ok(read(`${LAB}NoiseLabScreen.tsx`).includes(closed('SPKR — PHONE SPEAKER OUTPUT (REALITY)')));
    assert.ok(read(`${LAB}SignalChainLabScreen.tsx`).includes(closed('ABOUT THIS RACK’S SETTINGS AND ORDER')));
    assert.ok(read(`${LAB}cymatics/PlateStudioScreen.tsx`).includes(closed('WHAT THIS PLATE IS')));
    assert.match(read('src/features/cymatics/presets.ts'), /open WHAT THIS PLATE IS: it prints the ratios/);
  });
});

describe('Digital Audio: REAL CONVERTERS and the myth cards start closed', () => {
  it('module 3, and the myths of modules 1, 2 and 6', () => {
    assert.ok(read(`${LAB}digital/modules/modQuant.tsx`).includes(closed('REAL CONVERTERS — THEORY VS PRACTICE')));
    assert.equal(count(read(`${LAB}digital/modules/modAnalog.tsx`), closed('MYTH vs REALITY')), 2);
    assert.equal(count(read(`${LAB}digital/modules/modChain.tsx`), closed('MYTH vs REALITY')), 1);
  });
  it('module 1 keeps its only explanation open', () => {
    assert.ok(read(`${LAB}digital/modules/modAnalog.tsx`).includes('<CollapsibleSection title="WHAT EXISTS ON THIS WIRE">'));
  });
});

describe('Microphone Principles and Speaker Coverage', () => {
  const mic = read(`${LAB}micspeaker/MicPrinciplesLabScreen.tsx`);
  it('six static WHAT’S HAPPENING boxes start closed; Polar (it glosses the wedge before its check) and the three live ones stay open', () => {
    for (const k of ['capsule', 'distance', 'proximity', 'off_axis', 'shock_mount', 'mistakes']) assert.ok(mic.includes(`${closed("WHAT'S HAPPENING")} onHelp={() => help('${k}')}>`), k);
    for (const k of ['polar_pattern', 'pop_filter', 'stereo_pair', 'hand_position']) assert.ok(mic.includes(`<CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('${k}')}>`), k);
  });
  it('Speaker Coverage: WHAT’S HAPPENING closed, its hint says open it; READING THE COLORS stays open', () => {
    const sc = read(`${LAB}micspeaker/SpeakerCoverageLabScreen.tsx`);
    assert.ok(sc.includes(`${closed("WHAT'S HAPPENING")} onHelp=`));
    assert.match(sc, /then open WHAT’S HAPPENING\.'/);
    assert.ok(sc.includes('<CollapsibleSection title="READING THE COLORS" onHelp='));
  });
});

describe('Cable Install and Stage Plot', () => {
  it('Fire READING THE SECTION starts closed, like the three COLOR KEY folds', () => {
    assert.ok(read(`${LAB}cableinstall/scenes/FireScene.tsx`).includes(closed('READING THE SECTION')));
  });
  it('Export PREVIEW folds (not remembered) and its guide says open it', () => {
    const x = read(`${LAB}stageplot/ExportArea.tsx`);
    assert.match(x, /const \[previewOpen, setPreviewOpen\] = useState\(false\);/);
    assert.match(x, /fold=\{\{ summary: 'The whole packet, as the PDF will show it\.', open: previewOpen, onToggle: \(\) => setPreviewOpen\(\(o\) => !o\) \}\}/);
    assert.match(read(`${LAB}stageplot/guides/export.ts`), /open PREVIEW, then press SHARE PDF/);
  });
  it('WHAT THIS LAB COVERS folds; AFTER THIS LAB (a button) stays in view', () => {
    const s = read(`${LAB}stageplot/StagePlotLabScreen.tsx`);
    assert.match(s, /const \[recapOpen, setRecapOpen\] = useState\(false\);/);
    assert.match(s, /<FoldSection\s+title="WHAT THIS LAB COVERS"/);
    assert.ok(s.indexOf('</FoldSection>') < s.indexOf('AFTER THIS LAB</Text>'));
  });
});

/* ── Second pass (owner 2026-11-21: "build the second-pass collapse fixes too") ──
 * The reading beside a task folds into a closed box INSIDE its step or LAB
 * NOTES; the task, its controls, its credit and the one core explanation stay
 * open. Each block would have failed before its change. */

/** The text of the first closed box with this title, up to its closing tag. */
const foldBody = (s: string, title: string) => {
  const a = s.indexOf(closed(title));
  assert.ok(a > 0, `fold "${title}" (closed on arrival)`);
  return s.slice(a, s.indexOf('</CollapsibleSection>', a));
};

describe('second pass · Game Audio: side reading folds inside the steps; tasks, logs, chips and checks stay open', () => {
  const GA = `${LAB}gameaudio/pages/`;
  it('page 3: the second UNDERSTAND paragraph and the common mistake fold; the core line and the lab-setting note stay open', () => {
    const s = read(`${GA}p03Platforms.tsx`);
    assert.ok(foldBody(s, 'MORE DETAIL').includes('These can be three different devices.'));
    assert.ok(foldBody(s, 'COMMON MISTAKE').includes('<Note tone="mistake">Treating a platform name'));
    assert.ok(s.indexOf('<P>Three questions are easy to confuse.') < s.indexOf(closed('MORE DETAIL')));
    assert.match(s, /\n {8}<Note>The two budgets are settings for this lab’s scene\./);
  });
  it('page 6: the common mistake folds; the definitions, the cards and the fault card stay open', () => {
    const s = read(`${GA}p06Pipeline.tsx`);
    assert.ok(foldBody(s, 'COMMON MISTAKE').includes('Confusing importing a sound'));
    assert.match(s, /\n {8}<P>Three things come out of this work/);
    assert.match(s, /\n {8}<FaultCard\n/);
  });
  it('page 20: the side notes fold; the window list and the name cards the six checks need stay open', () => {
    const s = read(`${GA}p20Tools.tsx`);
    assert.ok(foldBody(s, 'MORE DETAIL · THE ENGINE’S EDITOR').includes('A game engine’s editor shows the level'));
    const names = foldBody(s, 'MORE DETAIL · ENGINES, VERSIONS AND WWISE WORDS');
    for (const x of ['Names change between versions.', 'Sound Cue and the newer MetaSound', 'Game Syncs are Switches']) assert.ok(names.includes(x), x);
    assert.ok(foldBody(s, 'COMMON MISTAKE').includes('Looking for the same name in a new tool.'));
    assert.match(s, /\n {8}<ToolWindowList \/>/);
    assert.match(s, /\n {8}<ToolNameCards \/>/);
    assert.match(s, /\n {8}<P>Slide WINDOW to light each window in turn\./);
    assert.equal(s.split('<UnderstandingCheck').length - 1, 6);
  });
});

describe('second pass · Tuning: LAB NOTES stays open; one aside per chapter folds', () => {
  it('LAB NOTES itself still opens on arrival (it holds BEGIN / NEXT / FINISH and the checks)', () => {
    assert.match(read(`${LAB}tuning/rackLayout.tsx`), /<CollapsibleSection title=\{notesTitle\}>/);
  });
  it('chapter 7: the 4:5:6 line and its PLAY instruction stay open; the "not harmonics" caveat folds', () => {
    const s = read(`${LAB}tuning/chapters/ch7Just.tsx`);
    assert.match(s, /<Body>The C-major triad can be written as the simple whole-number relationship 4:5:6 — a ratio between the three notes\. Hear C, E, G, the chord and the aligned partials from the PLAY key\.<\/Body>/);
    assert.ok(foldBody(s, 'MORE DETAIL · WHAT 4:5:6 IS NOT').includes('They are not harmonics 4, 5 and 6 of the C shown here'));
    assert.ok(s.includes('onCorrect={ctx.markDone}'));
  });
  it('chapter 9: where the wolf goes folds; the summary line and the check stay open', () => {
    const s = read(`${LAB}tuning/chapters/ch9Meantone.tsx`);
    assert.ok(foldBody(s, 'MORE DETAIL · WHERE THE WOLF GOES').includes('its location is a choice, not a law'));
    assert.match(s, /\n {10}<Body>Quarter-comma meantone narrows ordinary fifths so selected major thirds become pure\./);
    assert.ok(s.indexOf(closed('MORE DETAIL · WHERE THE WOLF GOES')) < s.indexOf('<UnderstandingCheck', s.indexOf("part === 'E'")));
  });
});

describe('second pass · Room Design: LAB NOTES stays open; the method folds inside it', () => {
  it('LAB NOTES itself still opens on arrival', () => {
    assert.match(read(`${LAB}roomdesign/rackLayout.tsx`), /<CollapsibleSection title=\{notesTitle\}>/);
  });
  it('Suggest: HOW THE SEARCH WORKS folds; the desk note, the honesty line and the safety pointer stay open', () => {
    const s = read(`${LAB}roomdesign/modules/modSuggest.tsx`);
    const body = foldBody(s, 'HOW THE SEARCH WORKS');
    assert.ok(body.includes('Each setup is a search over positions inside your walls.') && body.includes('Smoother bass counts the length modes'));
    const end = s.indexOf('</CollapsibleSection>', s.indexOf(closed('HOW THE SEARCH WORKS')));
    for (const x of ['<Caption>Bass and image setups may move the desk', '<Caption>No setup is a guaranteed optimum.', '<Caption>{SAFETY_LEVEL_POINTER}</Caption>']) assert.ok(s.indexOf(x) > end, x);
  });
  it('Monitoring: the triangle paragraph and both safety lines stay open; distance and the cancellation math fold after them', () => {
    const s = read(`${LAB}roomdesign/modules/modMonitoring.tsx`);
    const at = s.indexOf(closed('MORE DETAIL · DISTANCE, HEIGHT AND THE CANCELLATION GUIDE'));
    const body = foldBody(s, 'MORE DETAIL · DISTANCE, HEIGHT AND THE CANCELLATION GUIDE');
    assert.ok(body.includes('Nearfield monitors are meant to be heard from') && body.includes('The cancellation guide above comes from'));
    for (const x of ['A good starting point, not a law', '<Caption>A stand must be rated', '<Caption>{SAFETY_LEVEL_NOTE}</Caption>']) assert.ok(s.indexOf(x) > 0 && s.indexOf(x) < at, x);
  });
});

describe('second pass · Connectors: tasks and safety stay open', () => {
  it('every safety rule keeps its reason in view beside I WILL WORK THIS WAY (the guide says read the reason first)', () => {
    const s = read(`${LAB}connectorselect/pagesD.tsx`);
    assert.match(s, /<Prompt>\{r\.rule\}<\/Prompt>\n\s*<Body>\{r\.why\}<\/Body>\n\s*<Btn/);
    assert.ok(!s.includes('CollapsibleSection'));
  });
});
