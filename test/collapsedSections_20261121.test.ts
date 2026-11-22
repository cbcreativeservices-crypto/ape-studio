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
