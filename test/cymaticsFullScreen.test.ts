/**
 * Cymatics Lab — FULL SCREEN on every live display (house rule D35, full-screen
 * build group 5, 2026-09-30). The owner asked for full screen "on most labs
 * where we can do it": a WORKING surface — controls docked, readouts on top,
 * and EVERYTHING in the drawing zooms.
 *
 * Pins the mechanism, not the pixels:
 *  - the four rack modules (Nodes, Change, Harmony, Systems) opt in through
 *    the shared CymaticsRackLayout; the Plate, Liquid and Membrane studios and
 *    the Gallery art board opt in on their own RackStage;
 *  - the three Skia drawings lay themselves out in GLASS units (box ÷
 *    StageTextScale) and paint through ONE scaled Group, so every px constant
 *    grows with the picture — and the particle COUNT is left alone (the sand
 *    gets bigger, not heavier);
 *  - touches are mapped back through the same scale, so a drag lands where
 *    the finger is at every zoom;
 *  - the SVG / View stages (Harmony, Systems, Change's A/B tags) draw through
 *    useGlassUnits (viewBox or a scaled overlay) — never a fixed px label
 *    over a zoomed picture;
 *  - the Intro's live figures get the kit's ExpandableFigure.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) => readFileSync(new URL(`../src/screens/lab/cymatics/${rel}`, import.meta.url), 'utf8');
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

test('the rack modules opt into FULL SCREEN through CymaticsRackLayout', () => {
  const src = strip(read('modules/rackLayout.tsx'));
  assert.match(src, /fullScreen\?: boolean/, 'the wrapper exposes the option');
  assert.match(src, /fullScreen: rack\.fullScreen \?\? true/, 'ON by default for every rack module');
  for (const m of ['modNodes', 'modChange', 'modHarmony', 'modSystems']) {
    const mod = strip(read(`modules/${m}.tsx`));
    assert.match(mod, /<CymaticsRackLayout/, `${m} is on the rack`);
    assert.doesNotMatch(mod, /fullScreen:\s*false/, `${m} does not opt out`);
  }
});

for (const screen of ['PlateStudioScreen', 'LiquidStudioScreen', 'MembraneStudioScreen']) {
  test(`${screen} opts its glass into FULL SCREEN`, () => {
    const src = strip(read(`${screen}.tsx`));
    assert.match(src, /fullScreen: true,/, 'stage.fullScreen is set');
    assert.match(src, /hideDragTag: true/, 'the bezel prints the bound value, so no drag tag over the drawing');
  });
}

test('the Gallery art board opts into FULL SCREEN (PatternFigure scales its strokes by frame width)', () => {
  const src = strip(read('GalleryArt.tsx'));
  assert.match(src, /fullScreen: true,/);
  const fig = strip(read('PatternFigure.tsx'));
  assert.match(fig, /lineScale=\{frame\.w \/ LINE_REF_W\}/, 'line weights follow the frame, so they grow with the zoom');
});

for (const [file, view] of [
  ['vizPlate.tsx', 'PlateView'],
  ['vizLiquid.tsx', 'LiquidView'],
  ['vizMembrane.tsx', 'MembraneView'],
] as const) {
  test(`${view} draws through a scaled Group in glass units`, () => {
    const src = strip(read(file));
    assert.match(src, /useStageTextScale\(\)/, 'reads StageTextScale');
    assert.match(src, /const width = boxW \/ s;\s*const height = boxH \/ s;/, 'lays out in glass units');
    // (strip() leaves a JSX comment as `{}`.)
    assert.match(src, /<Canvas style=\{\{ width: boxW, height: boxH \}\}>\s*(\{\s*\})?\s*<Group transform=\{\[\{ scale: s \}\]\}>/, 'the canvas is the box; one Group is the zoom');
    assert.match(src, /style=\{\{ width: boxW, height: boxH \}\}\s*accessible/, 'the touch surface is the box');
    assert.match(src, /\/ g\.s|\/ geom\.current\.s/, 'touches are mapped back into glass units');
  });
}

test('the particle count never grows with the zoom (sand gets bigger, not heavier)', () => {
  const src = strip(read('vizPlate.tsx'));
  assert.match(src, /const count = Math\.max\(200, Math\.min\(8000, Math\.round\(p\.particleCount\)\)\);/, 'count comes from the prop alone');
  assert.doesNotMatch(src, /particleCount \* s|count \* s/, 'never multiplied by the scale');
  // The grain radius is in glass units and scales through the Group — it is not
  // a second scale on top.
  assert.match(src, /const dotR = 0\.9 \+ p\.particleSize \* 1\.9;/);
});

test('the RN labels over the Skia drawings ride a scaled overlay, not a fixed-px absoluteFill', () => {
  for (const file of ['vizLiquid.tsx', 'vizMembrane.tsx']) {
    const src = strip(read(file));
    assert.match(src, /const glassOverlay = \{ position: 'absolute' as const, left: 0, top: 0, width, height, transform: \[\{ translateX: \(boxW - width\) \/ 2 \}, \{ translateY: \(boxH - height\) \/ 2 \}, \{ scale: s \}\] \};/);
    assert.doesNotMatch(src, /style=\{StyleSheet\.absoluteFill\}/, `${file}: no fixed-size label layer over a zoomed picture`);
  }
});

test('the SVG stages (Harmony, Systems) and the A/B tags (Change) scale through useGlassUnits', () => {
  const shared = strip(read('modules/shared.tsx'));
  assert.match(shared, /export function useGlassUnits\(boxW: number, boxH: number\)/);
  assert.match(shared, /viewBox: `0 0 \$\{w\} \$\{h\}`/, 'the SVG viewBox is the glass-unit box');
  const systems = strip(read('modules/modSystems.tsx'));
  assert.equal((systems.match(/useGlassUnits\(boxW, boxH\)/g) ?? []).length, 6, 'all six system drawings');
  assert.equal((systems.match(/<Svg \{\.\.\.svg\}(?: accessibilityElementsHidden importantForAccessibility="no-hide-descendants")?>/g) ?? []).length, 6, 'every Svg carries the scaled viewBox');
  assert.doesNotMatch(systems, /<Svg width=\{w\} height=\{h\}>/, 'no unscaled Svg left');
  const harmony = strip(read('modules/modHarmony.tsx'));
  assert.equal((harmony.match(/useGlassUnits\(boxW, boxH\)/g) ?? []).length, 3, 'waves, Lissajous, spectrum');
  assert.match(harmony, /<View pointerEvents="none" style=\{overlay\}>/, 'the wave labels ride the scaled overlay');
  assert.doesNotMatch(harmony, /<Svg width=\{w\} height=\{h\}>/);
  const change = strip(read('modules/modChange.tsx'));
  assert.match(change, /function PairStage\(/, 'the two-plate stage is a component so it can read the scale');
  assert.match(change, /fontSize: 12 \* s/, 'the A / B tags grow with the picture');
});

test('the Intro module wraps its live figures in ExpandableFigure with the badge riding along', () => {
  const src = strip(read('modules/modIntro.tsx'));
  assert.equal((src.match(/<ExpandableFigure/g) ?? []).length, 3, 'the pressure strip and both plate demos');
  assert.match(src, /function FigBadge\(/, 'the on-figure badge scales with the figure');
  assert.match(src, /badge="ILLUSTRATIVE — AIR MOLECULES, LONGITUDINAL WAVE"/, 'the disclosure travels into full screen');
  assert.match(src, /controls=\{/, 'the AT / OFF RESONANCE chips ride along docked');
  const strip96 = strip(read('vizPlate.tsx'));
  assert.match(strip96, /export function PressureWaveStrip\(\{ width: boxW, height: boxH, running \}/, 'the strip zooms too');
});

test('the cymatics screens can be opened in the browser harness by name', () => {
  // The harness moved out of App.tsx into src/dev/webPreviews.tsx (2026-10-04).
  const app = readFileSync(new URL('../src/dev/webPreviews.tsx', import.meta.url), 'utf8');
  for (const name of ['CymaticsPlateStudio', 'CymaticsModule', 'CymaticsLiquidStudio', 'CymaticsMembraneStudio', 'CymaticsGallery']) {
    assert.match(app, new RegExp(`^\\s*${name}: \\w+ as ComponentType,`, 'm'), `${name} is in LAB_PREVIEW_SCREENS`);
  }
});
