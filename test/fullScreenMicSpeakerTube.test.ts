/**
 * FULL SCREEN on the Microphone Principles, Speaker Placement & Coverage and
 * Vacuum Tube labs (full-screen build 2026-09-30, group 4 — hard rule D35:
 * full screen is a working surface and EVERYTHING in the drawing zooms with
 * the step).
 *
 * Pins three things:
 *  1. every live rack section opts into the rack-owned FULL SCREEN;
 *  2. every Skia stage view is laid out in glass points and painted through a
 *     <Group> scaled by StageTextScale (the Skia trap: a canvas scales its
 *     picture with the box, but fixed-point geometry — an 8-pt grille, a
 *     116-pt bottle — does not), so a zoom step is the glass drawing, larger;
 *  3. the two draggable stages (POLAR, HAND GRIP) divide the finger by their
 *     own instance's scale, and the fixed-height panels keep the glass's shape
 *     in the full-screen box (GlassShape), so sideways never collapses them.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8');

/** The `stage={{ … }}` declarations of a screen, one per RackUnit. */
function rackStages(src: string): string[] {
  return src.split('<RackUnit').slice(1).map((chunk) => chunk.split('stage={{')[1] ?? '');
}

/** The body of one exported view function. */
function viewBody(src: string, name: string): string {
  const start = src.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `${name} is exported`);
  const next = src.indexOf('\nexport function ', start + 1);
  return src.slice(start, next < 0 ? undefined : next);
}

/** The view lays out in glass points (÷ ts) and paints through a scaled Group. */
function assertScaledView(src: string, name: string, scaleVar = 'ts') {
  const body = viewBody(src, name);
  assert.match(body, /useStageTextScale\(\)/, `${name}: reads StageTextScale`);
  assert.match(body, new RegExp(`const w = width / ${scaleVar};`), `${name}: lays out in glass points`);
  assert.match(body, new RegExp(`<Group transform=\\{\\[\\{ scale: ${scaleVar} \\}\\]\\}>`), `${name}: paints through one scaled Group`);
  // The canvas itself is the full box; only the content is scaled.
  assert.doesNotMatch(body, /<Canvas style=\{\{ width: w, height: h/, `${name}: canvas is the real box, not the glass-point box`);
}

test('Microphone Principles — every live rack section is full screen', () => {
  const src = read('micspeaker/MicPrinciplesLabScreen.tsx');
  const stages = rackStages(src);
  // POLAR · DISTANCE · PROXIMITY · OFF-AXIS · PLOSIVES · HANDLING · STEREO · HAND GRIP
  assert.equal(stages.length, 8, 'eight rack sections (CAPSULE and MISTAKES are reading pages)');
  for (const s of stages) assert.match(s, /fullScreen: true/);
  // CAPSULE keeps its inline ExpandableFigure.
  assert.match(src, /<ExpandableFigure[\s\S]*?aspect=\{MIC_ASPECT\}/);
});

test('Microphone Principles — the drags map through their own instance scale and the fixed panels keep the glass shape', () => {
  const src = read('micspeaker/MicPrinciplesLabScreen.tsx');
  // POLAR: one PanResponder per instance, finger ÷ ts, the source in glass points.
  const polar = src.slice(src.indexOf('function PolarStage('), src.indexOf('function PolarViz('));
  assert.match(polar, /useStageTextScale\(\)/);
  assert.match(polar, /\(e\.nativeEvent\.locationX - gs\.dx\) \/ k/);
  assert.match(polar, /gs\.dx \/ k, posBaseRef\.current\.y \+ gs\.dy \/ k/);
  assert.match(polar, /if \(full && dims\) report\?\.aspect\(dims\.w \/ dims\.h, 0\)/, 'the full-screen box keeps the glass shape');
  assert.match(polar, /onLayout=\{full \? undefined : \(\) => onDims\(w, h\)\}/, 'only the glass instance measures');
  // The drag-discovery chip grows with the picture (never a fixed overlay).
  assert.match(polar, /fontSize: 10\.5 \* ts/);
  // HAND GRIP: the 216-pt panel is painted at h ÷ 216 in full screen and the finger ÷ that.
  const hand = src.slice(src.indexOf('function HandStage('), src.indexOf('function WhyCutaway('));
  assert.match(hand, /const s = full \? h \/ HAND_PANEL_H : Math\.min\(1, h \/ HAND_PANEL_H\);/);
  assert.match(hand, /\(e\.nativeEvent\.locationY - gs\.dy\) \/ sRef\.current/);
  assert.match(hand, /gs\.dy \/ sRef\.current/);
  assert.match(hand, /fixedH=\{HAND_PANEL_H\}/);
  assert.match(hand, /scale=\{s\}/);
  // HANDLING: the 262-pt scene is painted at h ÷ 262 — sharp vectors, not a magnified raster.
  assert.match(src, /const s = h \/ SHOCK_H;[\s\S]*?fixedH=\{SHOCK_H\}[\s\S]*?<ShockViz viz=\{viz\} width=\{w\} scale=\{s\}/);
  assert.doesNotMatch(src, /transform: \[\{ scale: s \}\]/, 'no RN transform scale on a Skia canvas (it magnifies pixels)');
  // Every other section wraps its stage in GlassShape (sideways keeps the glass shape).
  assert.equal((src.match(/<GlassShape w=\{w\} h=\{h\} glass=\{glass\}/g) ?? []).length, 7, 'DISTANCE · PROXIMITY · OFF-AXIS · PLOSIVES · HANDLING · STEREO · HAND GRIP');
});

test('Speaker Placement & Coverage — both rack views are full screen and keep the glass shape', () => {
  const src = read('micspeaker/SpeakerCoverageLabScreen.tsx');
  assert.match(src, /const topStage: RackStage = \{[\s\S]*?fullScreen: true/);
  assert.match(src, /const sideStage: RackStage = \{[\s\S]*?fullScreen: true/);
  assert.match(src, /<GlassShape w=\{w\} h=\{h\} glass=\{topGlass\}>[\s\S]*?<viz\.TopCoverageView/);
  assert.match(src, /<GlassShape w=\{w\} h=\{h\} glass=\{sideGlass\}>[\s\S]*?<viz\.SideCoverageView/);
});

test('Vacuum Tube Fundamentals — all nine racks are full screen through one stageGlass', () => {
  const src = read('tube/VacuumTubeLabScreen.tsx');
  const stages = rackStages(src);
  assert.equal(stages.length, 9);
  for (const s of stages) {
    assert.match(s, /fullScreen: true/);
    assert.match(s, /render: stageGlass\(p\.viz, glass, /, 'each section passes its own glass ref');
  }
  assert.match(src, /function stageGlass\([\s\S]*?<GlassShape w=\{w\} h=\{h\} glass=\{glass\}>/);
});

test('micspeaker/viz — every stage view lays out in glass points and paints through a scaled Group', () => {
  const src = read('micspeaker/viz.tsx');
  for (const v of ['PolarPatternView', 'DistanceView', 'PopFilterView', 'StereoTechniqueView', 'TopCoverageView', 'SideCoverageView', 'ProximityApproachView', 'OffAxisMicView']) {
    assertScaledView(src, v);
  }
  // The two fixed-height panels take a `scale` (the host fits them by height).
  for (const v of ['ShockMountView', 'HandPlacementView']) {
    const body = viewBody(src, v);
    assert.match(body, /scale\?: number;/, `${v}: takes scale`);
    assert.match(body, /const s = scale \?\? ts;/, `${v}: defaults to StageTextScale`);
    assert.match(body, /const w = width \/ s;/);
    assert.match(body, /<Group transform=\{\[\{ scale: s \}\]\}>/);
    assert.match(body, /height: h \* s/, `${v}: the canvas is the painted height`);
  }
  // The shock-mount labels are RN text over the canvas: they grow with the
  // scene, floored at 9 pt — the L glass (250 − 2 = 248 pt) fits the 262-pt
  // scene at 0.946, where 9.5 × 0.946 = 8.99 pt would break the floor.
  const shock = viewBody(src, 'ShockMountView');
  assert.match(shock, /fontSize: Math\.max\(9, 9\.5 \* s\)/);
  assert.ok(9.5 * (248 / 262) < 9, 'the floor is load-bearing on an L glass');
  assert.ok(Math.max(9, 9.5 * (248 / 262)) >= 9);
  // The coverage maps keep their 27 % scene margin INSIDE the zoom group.
  for (const v of ['TopCoverageView', 'SideCoverageView']) {
    assert.match(viewBody(src, v), /<Group transform=\{\[\{ scale: ts \}\]\}>\s*<Group transform=\{sceneTransform\(w, h\)\}>/);
  }
  // Views that are not stages are untouched (ResponseCurveView scales its own
  // strokes and axis text; the cutaway is an inline well figure).
  assert.match(viewBody(src, 'ResponseCurveView'), /strokeWidth=\{2\.4 \* ts\}/);
});

test('tube/viz — all nine drawings lay out in glass points and paint through a scaled Group', () => {
  const src = read('tube/viz.tsx');
  for (const v of ['TubeCutawayView', 'ElectronFlowView', 'GridControlView', 'AmplifyView', 'HighVoltageView', 'BiasView', 'SaturationView', 'TubeVsTransistorView', 'TubeGlyph']) {
    assertScaledView(src, v);
  }
  // Every scaled Group is closed inside its Canvas.
  assert.equal((src.match(/<Group transform=\{\[\{ scale: ts \}\]\}>/g) ?? []).length, (src.match(/<\/Group>/g) ?? []).length);
});

test('GlassShape — records the glass size, reports its shape (or a fixed height) only in full screen', () => {
  const src = read('glassShape.tsx');
  assert.match(src, /useContext\(StageInFullScreen\)/);
  assert.match(src, /useContext\(StageAspectReport\)/);
  // The tallest glass is the design height; sideways the rack squeezes the
  // glass to a strip, so the shape is the CURRENT glass width over that
  // height — never the strip. The frame now says the glass width outright
  // (StageGlassWidth, 2026-10-01: the text scale is floored at 1, so w ÷ scale
  // is no longer the glass width where the drawing is narrower than it);
  // w ÷ scale stays as the fallback for a host that does not.
  assert.match(src, /if \(!cur \|\| h >= cur\.h\) glass\.current = \{ w, h \};/);
  assert.match(src, /const glassWNow = glassWTold > 0 \? glassWTold : w \/ ts;/);
  assert.match(src, /report\?\.aspect\(glassWNow \/ \(fixedH \?\? Math\.max\(MIN_GLASS_H, g\.h\)\), 0\)/);
  assert.match(src, /const MIN_GLASS_H = 158;/);
  // It lives beside the labs: rack/ and kit/ are not edited by this build.
  assert.match(src, /from '\.\/rack\/stageAspect'/);
});
