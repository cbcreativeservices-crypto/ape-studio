/**
 * FULL-SCREEN BUILD, group 2 (2026-09-30) — the owner asked for full screen
 * "on most labs where we can do it". Eight single-page rack labs opt into the
 * rack's ⤢ FULL SCREEN (`stage.fullScreen: true` → StageFullScreen: zoom
 * steps, bezel readouts on top, the dock pinned under the drawing).
 *
 * Pins the mechanism and the owner's D35 rule ("EVERYTHING in the drawing
 * zooms with the step"), not the pixels:
 *  - every lab in the group opts in through the shared rack flag;
 *  - a pixel-authored drawing paints through a viewBox of (box ÷ ts) or
 *    multiplies its px constants by the stage text scale, so strokes, ticks
 *    and labels grow with the picture (the Oscillator idiom);
 *  - RN text laid over a drawing multiplies its font by the scale;
 *  - the Binaural square and the Harmonograph machine report their own
 *    aspect so the full-screen canvas is the drawing's shape at every zoom;
 *  - the Harmonograph's share/print viewer (a sibling Modal) is never opened
 *    from inside full screen — nothing presents over the full-screen Modal.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) => readFileSync(new URL(`../src/screens/lab/${rel}`, import.meta.url), 'utf8');
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const LABS = [
  'NoiseLabScreen',
  'HarmonicsView',
  'FmLabScreen',
  'ModularLabScreen',
  'BinauralLabScreen',
  'AutotuneLabScreen',
  'BassLabScreen',
  'HarmonographLabScreen',
] as const;

for (const name of LABS) {
  test(`${name} opts into the rack's FULL SCREEN`, () => {
    const src = stripComments(read(`${name}.tsx`));
    assert.match(src, /fullScreen:\s*true/, 'stage.fullScreen: true');
    assert.doesNotMatch(src, /onEnlarge:/, 'the rack owns the viewer — no host modal');
  });
}

test('pixel-authored drawings paint through a (box ÷ ts) viewBox so everything zooms', () => {
  // FM sideband graph, Autotune cents grid, Modular patch diagram, Bass
  // fretboard: authored in glass pixels, painted through a logical viewBox.
  for (const [name, needle] of [
    ['FmLabScreen', /viewBox=\{`0 0 \$\{lw\} \$\{lgh\}`\}/],
    ['AutotuneLabScreen', /viewBox=\{`0 0 \$\{w\} \$\{h\}`\}/],
    ['ModularLabScreen', /viewBox=\{`0 0 \$\{w\} \$\{h\}`\}/],
    ['BassLabScreen', /viewBox=\{`0 0 \$\{w\} \$\{svgH\}`\}/],
  ] as const) {
    const src = read(`${name}.tsx`);
    assert.match(src, /useStageTextScale\(\)/, `${name} reads the stage text scale`);
    assert.match(src, needle, `${name} paints through the logical viewBox`);
  }
});

test('RN text laid over a drawing grows with the scale', () => {
  const fm = read('FmLabScreen.tsx');
  assert.match(fm, /fontSize:\s*10\.5 \* ts/, 'FM legend font × ts');
  assert.match(fm, /const gh = h - LEGEND_H \* ts/, 'FM legend strip height × ts');
  const bass = read('BassLabScreen.tsx');
  assert.match(bass, /fontSize:\s*9\.5 \* ts/, 'Bass NUT/BRIDGE strip font × ts');
  assert.match(bass, /height - LABELS_H \* ts/, 'Bass label strip height × ts');
});

test('Bass: a tap in full screen is divided back to glass units before the fret/row snap', () => {
  const src = read('BassLabScreen.tsx');
  assert.match(src, /const x = px \/ ts;\s*const y = py \/ ts;/);
});

test('Autotune: the stage hands its width in (no blank first frame in full screen)', () => {
  const src = read('AutotuneLabScreen.tsx');
  assert.match(src, /<CentsGrid [^>]*width=\{w\}/);
});

test('Harmonics stage: every px constant is × the stage text scale', () => {
  const src = read('HarmonicsView.tsx');
  assert.match(src, /const ts = useStageTextScale\(\);/);
  for (const needle of [
    /const pad = STAGE_PAD \* ts/,
    /const gutterW = GUTTER_W \* ts/,
    /const pianoW = PIANO_W \* ts/,
    /const bandH = BAND_H \* ts/,
    /const labelGap = MIN_LABEL_GAP \* ts/,
    /const waveH = WAVE_STRIP_H \* ts/,
    /fontSize: 9 \* ts/, // the gutter labels (RN mono text)
    /fontSize=\{9 \* ts\}/, // the piano C labels (SVG, no viewBox)
    /fontSize: 13 \* ts/, // the "no capture" line
    /width: 2 \* ts/, // the playhead
  ]) {
    assert.match(src, needle, `${needle}`);
  }
});

test('Binaural: a fixed logical square, fonts never under 9.5 pt, drag mapped px → logical', () => {
  const src = read('BinauralLabScreen.tsx');
  assert.match(src, /const STAGE_U = 248/);
  assert.match(src, /viewBox=\{`0 0 \$\{STAGE_U\} \$\{STAGE_U\}`\}/, 'the Svg paints the logical square');
  assert.match(src, /const stageFont = \(pt: number, s: number\) => pt \/ Math\.min\(1, s\)/, '≥ pt rendered');
  assert.match(src, /e\.nativeEvent\.locationX \/ st\.s/, 'grab in logical units');
  assert.match(src, /g\.dx \/ st\.s/, 'drag delta in logical units');
  assert.match(src, /report\?\.aspect\(1, 0\)/, 'reports a square canvas to full screen');
  assert.doesNotMatch(src, /fontSize=\{9(\.5)?\}/, 'no fixed-size label left on the stage');
});

test('Harmonograph: the machine reports its viewBox shape and never opens the viewer over full screen', () => {
  const src = read('HarmonographMachine.tsx');
  assert.match(src, /report\?\.aspect\(VBW \/ VBH, 0\)/);
  assert.match(src, /const inFull = useContext\(StageInFullScreen\);/);
  assert.match(src, /const insetPress = inFull \? undefined : onInsetPress;/);
  assert.match(src, /\{insetPress && sc > 0 \? \(/, 'the inset Pressable uses the gated handler');
  // The share/print viewer itself is untouched: still mounted by the screen.
  const screen = read('HarmonographLabScreen.tsx');
  assert.match(screen, /<HarmonographViewer/);
  assert.match(screen, /onInsetPress=\{\(\) => setViewerOpen\(true\)\}/);
});

test('the seven labs are reachable in the web preview harness by name', () => {
  // The harness moved out of App.tsx into src/dev/webPreviews.tsx (2026-10-04).
  const app = readFileSync(new URL('../src/dev/webPreviews.tsx', import.meta.url), 'utf8');
  for (const key of ['NoiseLab', 'HarmonicLab', 'FmLab', 'ModularLab', 'BinauralLab', 'AutotuneLab', 'HarmonographLab', 'BassLab']) {
    assert.match(app, new RegExp(`\\n\\s+${key}: \\w+ as ComponentType,`), key);
  }
});
