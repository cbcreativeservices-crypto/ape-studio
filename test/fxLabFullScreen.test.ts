/**
 * FULL SCREEN on the twelve effect labs (owner 2026-09-30, D35: "full screen
 * on most labs where we can do it… Stereo image, gate, compressor, limiter").
 *
 * Pins the mechanism, not the pixels:
 *  - the FX rack stage opts into the rack's FULL SCREEN (`fullScreen: true`),
 *    and every one of the 12 configs has an animated hero, so every lab gets
 *    the key on a Skia client; the static (pre-Skia) hero declines it;
 *  - one component (FxStage) draws the glass AND the viewer, so the GR ladder
 *    is in the full-screen path and takes the stage text scale;
 *  - EVERYTHING zooms: the flow scene paints through a Group scaled by the
 *    stage text scale, its RN labels multiply their points by it, and the
 *    ladder has no fixed pixel left in its style sheet;
 *  - the glass's own shape is reported to the viewer (1× = the whole glass).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8');
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1');

const FX_LABS = ['eq', 'delay', 'reverb', 'chorus', 'flanger', 'phaser', 'compression', 'gate', 'limiter', 'distortion', 'phase', 'stereo'];

describe('FX labs — full screen', () => {
  const screen = stripComments(read('screens/lab/FxLabScreen.tsx'));
  const anim = stripComments(read('screens/lab/fxAnim.tsx'));
  const viz = stripComments(read('features/lab/fxViz.tsx'));
  const configs = read('screens/lab/fxLabConfigs.tsx');

  test('the FX rack stage opts into the rack-owned FULL SCREEN', () => {
    assert.match(screen, /stage:\s*\{[\s\S]*?fullScreen:\s*true/, 'stage.fullScreen: true');
    assert.doesNotMatch(screen, /onEnlarge:/, 'the rack owns the viewer — no host modal');
  });

  test('all 12 configs carry an animated hero, so each gets the key', () => {
    const chunks = configs.split(/\n\s*labId:\s*'/).slice(1);
    const ids = chunks.map((c) => c.slice(0, c.indexOf("'")));
    assert.deepEqual(ids.sort(), [...FX_LABS].sort(), 'the twelve effect labs');
    for (const c of chunks) {
      const id = c.slice(0, c.indexOf("'"));
      assert.match(c, /\n\s*anim:\s*\(v\)\s*=>/, `${id} has an anim mapping`);
    }
  });

  test('the dynamics labs poll the real GR — the bezel cell rides the viewer readouts', () => {
    for (const id of ['compression', 'gate', 'limiter']) {
      const i = configs.indexOf(`labId: '${id}'`);
      const block = configs.slice(i, configs.indexOf('export const', i));
      assert.match(block, /pollGr:\s*'(comp|gate|limiter)'/, `${id} polls GR`);
    }
    assert.match(screen, /k:\s*'GR',\s*v:\s*running\s*\?/, 'the GR bezel cell is the live measured value');
  });

  test('one stage component draws the glass and the viewer, and scales', () => {
    assert.match(screen, /function FxStage\(/);
    assert.match(screen, /render:\s*\(w,\s*h\)\s*=>\s*\(\s*<FxStage/, 'the rack renders FxStage in both places');
    const stage = screen.slice(screen.indexOf('function FxStage('), screen.indexOf('export function FxLabScreen('));
    assert.match(stage, /const ts = useStageTextScale\(\)/, 'reads the stage text scale');
    assert.match(stage, /useContext\(StageInFullScreen\)/, 'knows which surface it is on');
    assert.match(stage, /report\.aspect\(shape,\s*0\)/, 'reports the glass shape to the viewer');
    assert.match(stage, /onShape\(w \/ h\)/, 'the glass instance records its own shape');
    assert.match(stage, /report\.fixed\(\)/, 'the static hero declines the key');
  });

  test('the GR ladder is in the full-screen path and takes the text scale', () => {
    const stage = screen.slice(screen.indexOf('function FxStage('), screen.indexOf('export function FxLabScreen('));
    assert.match(stage, /<GrLadder[\s\S]*?scale=\{ts\}/, 'GrLadder scale={ts}');
    assert.match(stage, /height=\{Math\.max\(60,\s*gh - 26\)\}/, 'ladder height in glass units');
    assert.match(stage, /paddingRight:\s*4 \* ts,\s*paddingLeft:\s*2 \* ts/, 'its margins scale too');
    assert.equal((screen.match(/<GrLadder\b/g) ?? []).length, 1, 'exactly one ladder render path');
  });

  test('GrLadder: every pixel rides `scale`; nothing fixed is left in the sheet', () => {
    const ladder = viz.slice(viz.indexOf('export function GrLadder('), viz.indexOf('const lissaStyles'));
    assert.match(ladder, /scale = 1,/, 'defaults to 1 — other hosts unchanged');
    for (const px of ['fontSize: 9 * s', 'letterSpacing: 1.2 * s', 'width: 12 * s', 'borderRadius: 1.5 * s', 'width: 13 * s', 'gap: 3 * s', 'borderRadius: 3 * s']) {
      assert.ok(ladder.includes(px), `${px} scaled`);
    }
    assert.match(ladder, /const SEG_GAP = 2 \* s/);
    assert.match(ladder, /const STACK_PAD = 2 \* s/);
    assert.match(ladder, /const colH = height \* s/);
    assert.match(ladder, /top: \(d \/ maxDb\) \* colH - 5 \* s/, 'tick position scales');
    const sheet = ladder.slice(ladder.indexOf('const ladderStyles'));
    assert.doesNotMatch(sheet, /fontSize|width:|height:|gap:|padding:|borderRadius/, 'no fixed pixel in ladderStyles');
  });

  test('ladder tick numbers meet the 9 pt lab display floor on the glass', () => {
    const ladder = viz.slice(viz.indexOf('export function GrLadder('), viz.indexOf('const lissaStyles'));
    const m = ladder.match(/fontSize:\s*(\d+(?:\.\d+)?) \* s,\s*top: \(d \/ maxDb\)/);
    assert.ok(m, 'tick fontSize found');
    assert.ok(Number(m![1]) >= 9, `tick font ${m![1]} pt ≥ 9`);
  });

  test('fxAnim: the flow scene paints through a Group scaled by the stage text scale', () => {
    assert.match(anim, /import \{ useStageTextScale \} from '\.\/rack\/stageAspect'/);
    const scene = anim.slice(anim.indexOf('function FlowScene('), anim.indexOf('function ioScaled('));
    assert.match(scene, /const ts = useStageTextScale\(\)/);
    assert.match(scene, /<View style=\{\{ width: w \* ts, height: h \* ts \}\}>/, 'the box is the glass × ts');
    assert.match(scene, /<Canvas style=\{\{ position: 'absolute', width: w \* ts, height: h \* ts \}\}>\s*<Group transform=\{\[\{ scale: ts \}\]\}>/, 'one scaled Group wraps the picture');
    // The Group closes right before the Canvas: every Skia node is inside it.
    assert.match(scene, /<\/Group>\s*<\/Canvas>/);
  });

  test('fxAnim: the RN labels over the canvas multiply their points and positions by ts', () => {
    const scene = anim.slice(anim.indexOf('function FlowScene('), anim.indexOf('const flowStyles'));
    assert.match(scene, /ioScaled\(ts\), \{ left: 6 \* ts, top: 4 \* ts \}/, 'IN chip');
    assert.match(scene, /ioScaled\(ts\), \{ right: 6 \* ts, top: 4 \* ts \}/, 'OUT chip');
    assert.match(scene, /fontSize: 14 \* ts, letterSpacing: 1\.4 \* ts, paddingHorizontal: 4 \* ts, borderRadius: 3 \* ts/, 'chip sizes');
    assert.match(scene, /fontSize: 12 \* ts, letterSpacing: 2 \* ts, left: \(stageX - 45\) \* ts, top: \(h \/ 2 - 9\) \* ts, width: 90 \* ts/, 'processor name');
    const sheet = anim.slice(anim.indexOf('const flowStyles'));
    assert.doesNotMatch(sheet, /fontSize|letterSpacing|paddingHorizontal|borderRadius/, 'no fixed point size left in flowStyles');
  });

  test('fxAnim: the hero lays out in glass units (measured width ÷ ts)', () => {
    const hero = anim.slice(anim.indexOf('export function FxAnimHero('), anim.indexOf('const flowStyles'));
    assert.match(hero, /const ts = useStageTextScale\(\)/);
    assert.match(hero, /const glassUnitsW = w \/ ts/);
    assert.match(hero, /<FlowBody model=\{model\} w=\{glassUnitsW\}/, 'the flows get glass units');
    assert.match(hero, /height: FLOW_H \* ts/, 'the placeholder grows too');
  });

  test('the shared viewer still publishes the scale and surface this relies on', () => {
    const fs = read('screens/lab/rack/StageFullScreen.tsx');
    assert.match(fs, /<StageTextScale\.Provider value=\{textScale\}>/);
    assert.match(fs, /<StageInFullScreen\.Provider value>/);
    // ts = rendered ÷ glass width, floored at 1 (2026-10-01: a short sideways
    // body must not shrink the labels under their glass size).
    assert.match(fs, /const textScale = textScaleFor\(w, glassW \?\? 0\)/, 'ts = rendered ÷ glass width (floored at 1)');
    const math = read('screens/lab/rack/stageFitMath.ts');
    assert.match(math, /return glassW > 0 \? Math\.max\(1, w \/ glassW\) : 1;/);
  });
});

/** Mirror of the viewer's 1× fit (StageFullScreen) for the FX glass shape:
 *  the drawing at 1× is the whole glass, and the text scale that follows is
 *  what every pixel multiplies by. */
function fitAtOne(fitW: number, fitH: number, aspect: number, glassW: number) {
  const drawW = Math.min(fitW, fitH * aspect);
  return { w: Math.round(drawW), h: Math.round(drawW / aspect), ts: Math.round(drawW) / glassW };
}

describe('FX labs — full-screen geometry at 390×844', () => {
  // RackUnit: glassW = 390 − 2×10 faceplate − 2 border = 368; 'S' glass inner = 158.
  const glassW = 368;
  const aspect = glassW / 158;

  test('portrait 1× is the glass again; 2× and 3× scale every pixel', () => {
    const fitW = 390 - 16; // viewer side padding
    const one = fitAtOne(fitW, 440, aspect, glassW);
    assert.equal(one.w, 374);
    assert.ok(Math.abs(one.ts - 1.016) < 0.01, `ts at 1× ≈ 1 (${one.ts})`);
    assert.ok(one.h <= 440, 'fits the body');
    // Text at 3×: the 9 pt ladder ticks and the 14 pt IN/OUT chips.
    const ts3 = (one.w * 3) / glassW;
    assert.ok(9 * ts3 > 27 && 14 * ts3 > 42, 'labels grow with the step');
  });

  test('sideways the glass is a long strip and the viewer keeps its shape', () => {
    const landGlassW = 844 - 22;
    const landAspect = landGlassW / 158;
    const one = fitAtOne(844 - 16, 150, landAspect, landGlassW);
    assert.ok(one.h <= 150 && one.w <= 828, 'fits a short body');
    assert.ok(one.ts > 0.9 && one.ts <= 1.02, `≈ glass size at 1× (${one.ts})`);
  });
});

// 2026-10-01: the FX stage reports its CURRENT glass shape (a fixed-height
// strip). Reporting the upright shape sideways left empty bands above and
// below the drawing, so that was reverted; FIT fills the height instead.
test('FX stage reports its current glass shape', () => {
  const s = readFileSync('src/screens/lab/FxLabScreen.tsx', 'utf8');
  assert.match(s, /if \(!inFull && w > 0 && h > 0\) onShape\(w \/ h\);/);
  assert.doesNotMatch(s, /const upright = /);
});
