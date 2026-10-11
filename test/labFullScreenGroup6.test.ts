/**
 * FULL SCREEN, group 6 (2026-09-30): the Patchbay, the Connectors & Cable
 * Selection lab, Speech page 2's stage strip and the Ear Training SEE IT
 * panel draw their figures through kit/ExpandableFigure (owner rule D35: a
 * full screen is a WORKING surface — readouts on top, the page's controls
 * docked under the drawing, everything in the drawing zooms).
 *
 * Pins the mechanism, not the pixels:
 *  - every figure renders at the (w, h) the wrapper hands it, never at a
 *    fixed pixel height or "100%" (that is what makes the zoom steps work);
 *  - every interactive page hands its controls to the figure (`controls=`),
 *    and builds them ONCE so the page and the dock share state;
 *  - the accessible-image node is the drawing, never the card around the
 *    FULL SCREEN button (an accessible ancestor flattens the button away);
 *  - no raw Alert.alert anywhere in these labs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) => readFileSync(new URL(`../src/screens/lab/${rel}`, import.meta.url), 'utf8');
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const count = (src: string, re: RegExp) => (src.match(re) ?? []).length;

/* ── Patchbay ─────────────────────────────────────────────────────────── */

test('PatchPairView: faceplate + schematic are ONE fixed-aspect figure through ExpandableFigure', () => {
  const src = read('patchbay/art/PatchPairView.tsx');
  assert.match(src, /import \{ ExpandableFigure \} from '\.\.\/\.\.\/kit\/ExpandableFigure'/);
  assert.match(src, /export const PATCH_PAIR_ASPECT = W \/ \(FACE_H \+ FACE_GAP \+ H\)/, 'the stack aspect counts the gap');
  assert.match(src, /aspect=\{hideFaceplate \? PATCH_PAIR_ASPECT_BARE : PATCH_PAIR_ASPECT\}/);
  assert.match(src, /controls\?: ReactNode/, 'the page can dock its controls');
  // Readouts (status + caption) ride at the top of the dock — the SAME elements the page shows.
  assert.match(src, /\{statusEl\}\s*\{captionEl\}\s*\{controls\}/, 'status + caption then the page controls, in the dock');
  // The drawings take the wrapper's width, never "100%" + aspectRatio.
  const code = stripComments(src);
  assert.doesNotMatch(code, /width="100%"/, 'no width-100% SVGs left');
  assert.doesNotMatch(code, /aspectRatio:/, 'no CSS aspect-ratio sizing left');
  assert.match(code, /<Svg accessible accessibilityRole="image" accessibilityLabel=\{a11y\} width=\{w\} height=\{\(w \* H\) \/ W\}/);
  // The jack taps are siblings of the Svg, inside the figure (they zoom with it).
  assert.match(code, /styles\.jackTap/);
});

test('JackCutaway + StudioBayView draw through ExpandableFigure with the page controls docked', () => {
  const jack = read('patchbay/art/JackCutaway.tsx');
  assert.match(jack, /<ExpandableFigure\b[\s\S]*aspect=\{W \/ H\}[\s\S]*badge=\{badge\}/);
  assert.match(jack, /\{readout\}\s*\{controls\}/, 'the % / contacts readout sits above the slider in the dock');
  assert.match(jack, /<Svg(?: accessibilityElementsHidden importantForAccessibility="no-hide-descendants")? width=\{w\} height=\{h\} viewBox/);
  // The accessible image is the drawing, not the card (the FULL SCREEN button must stay reachable).
  assert.match(jack, /<View style=\{\{ width: w, height: h \}\} accessible accessibilityRole="image"/);
  assert.doesNotMatch(jack, /<View style=\{styles\.wrap\} accessible/);

  const bay = read('patchbay/art/StudioBayView.tsx');
  assert.match(bay, /<ExpandableFigure\b[\s\S]*aspect=\{W \/ H\}/);
  assert.match(bay, /\{legend\}\s*\{controls\}/);
  assert.match(bay, /<Svg accessible accessibilityRole="image" accessibilityLabel=\{a11y\} width=\{w\} height=\{h\}/);
});

// Rack conversion (owner 2026-10-10: "convert the patchbay lab, all 23
// modules, to the rack layout"): every patchbay page that is OPERATED is a
// rack page — the drawing pinned on the glass, every control in the dock,
// the readouts on the bezel; full screen is the rack's own working surface.
// The pages kept as documents (reading, quizzes, the static normal on page 4
// and the after-answer pictures) still draw through ExpandableFigure above.
test('every interactive patchbay page is a rack page: drawing on the glass, every control in the dock', () => {
  const a = read('patchbay/pagesA.tsx');
  const b = read('patchbay/pagesB.tsx');
  const c = read('patchbay/pagesC.tsx');
  const d = read('patchbay/pagesD.tsx');
  // pages 2, 3, 5, 6, 7 · 9 · 14, 15, 16, 17 · 19, 20
  assert.equal(count(a, /rack: true \}/g), 5, 'pagesA: pair, thru, contact, full, half');
  assert.equal(count(b, /rack: true \}/g), 1, 'pagesB: the tap');
  assert.equal(count(c, /rack: true \}/g), 4, 'pagesC: bay, zero cables, overpatch, chain');
  assert.equal(count(d, /rack: true \}/g), 2, 'pagesD: directional, T·R·S');
  for (const [name, src] of [['pagesA', a], ['pagesB', b], ['pagesC', c], ['pagesD', d]] as const) {
    const code = stripComments(src);
    // No control left inline: no slider, no docked-under-the-figure controls.
    assert.doesNotMatch(code, /ControlSlider/, `${name}: the plug is the dock's fader now`);
    assert.doesNotMatch(code, /controls=\{/, `${name}: no controls handed to an inline figure`);
    // Controls are built ONCE per page (shared state), the chips placed in the well.
    const chipDefs = count(src, /const chips = <GoalChips goals=\{goals\} latched=\{latched\} \/>;/g);
    const chipUses = count(src, /\{chips\}/g);
    assert.ok(chipUses >= chipDefs, `${name}: every chips element is placed on the page too`);
  }
  // The jacks are dock switches on every pair page (page 7 only once the prediction is in).
  assert.equal(count(a, /params: jackKeys\(state, toggle\),/g), 3, 'pages 2, 3, 6');
  assert.match(a, /params: predicted \? jackKeys\(state, toggle\) : \[\],/, 'page 7: the jacks unlock with the prediction');
  assert.match(b, /params: jackKeys\(state, toggle\),/);
  assert.match(d, /params: jackKeys\(state, toggle\),/);
  // The plug is the PLUG INSERTION fader, bound on mount (pages 5 + 20).
  assert.match(a, /params: \[insertionFader\(insertion, setInsertion\)\],\s*initialParam: 'insertion',/);
  assert.match(d, /params: \[insertionFader\(insertion, setInsertion\)\],\s*initialParam: 'insertion',/);
  // Page 14: the pair chooser-fader + the jacks; 15: the reveal switch; 16: the jacks;
  // 17: INSERT switch + VIEW options (one pair on the glass at a time).
  assert.match(c, /params: \[pairParam, \.\.\.jackKeys\(state, toggle\)\],/);
  assert.match(c, /kind: 'toggle', id: 'reveal', label: 'SHOW THE INVISIBLE NORMALS'/);
  assert.match(c, /kind: 'toggle', id: 'insert', label: 'INSERT COMPRESSOR'/);
  assert.match(c, /kind: 'options',\s*id: 'view',/);
  assert.doesNotMatch(stripComments(c), /<Btn/, 'no buttons left in the bay / chain wells');
  // The shared host gives a rack page the full height (kit/PagedLab `rack`).
  const host = read('kit/PagedLab.tsx');
  assert.match(host, /rack\?: boolean;/);
  assert.match(host, /\) : def\.rack \? \(/);
});

/* ── Connectors & Cable Selection ─────────────────────────────────────── */

test('ExplodedCable, CrossSectionView and TesterFace draw through ExpandableFigure at (w, h)', () => {
  const art = read('connectorselect/art.tsx');
  assert.match(art, /import \{ ExpandableFigure \} from '\.\.\/kit\/ExpandableFigure'/);
  assert.equal(count(art, /<ExpandableFigure\b/g), 3, 'cable, cross-section, tester face');
  const code = stripComments(art);
  assert.doesNotMatch(code, /<Svg[^>]*height=\{150\}/, 'the exploded cable is no longer a fixed 150 pt letterbox');
  assert.match(code, /<Svg(?: accessibilityElementsHidden importantForAccessibility="no-hide-descendants")? viewBox=\{`0 0 \$\{EXPLODED_W\} \$\{EXPLODED_H\}`\} width=\{w\} height=\{h\}>/);
  assert.match(code, /<Svg(?: accessibilityElementsHidden importantForAccessibility="no-hide-descendants")? viewBox="0 0 120 120" width=\{w\} height=\{h\}>/);
  assert.match(code, /export function TesterFace\(/);
  assert.match(code, /<Svg(?: accessibilityElementsHidden importantForAccessibility="no-hide-descendants")? viewBox=\{`0 0 \$\{FACE_W\} \$\{FACE_H\}`\} width=\{w\} height=\{h\}>/);
  // The lamp's word is SVG text (it zooms); the face has no RN <Text>.
  assert.doesNotMatch(code, /<Text\b/, 'no RN Text in the art — it would not grow with the box');
  // Every SvgText in the art is ≥ 9 in a 340/360-wide viewBox (9 pt floor at phone width).
  for (const m of code.matchAll(/fontSize=\{([\d.]+)\}/g)) assert.ok(Number(m[1]) >= 9, `fontSize ${m[1]} is under the 9 pt floor`);
});

test('the connectors pages dock their readouts and controls', () => {
  const a = read('connectorselect/pagesA.tsx');
  assert.match(a, /<ExplodedCable selected=\{part\} onSelect=\{selectPart\} controls=\{partReadout\} \/>/);
  assert.match(a, /CABLE_PARTS\.find\(\(p\) => p\.id === part\)/, 'the selected part is the readout');
  const b = read('connectorselect/pagesB.tsx');
  assert.match(b, /<CrossSectionView kind=\{section\.id\} width=\{160\} a11y=\{`[^`]*`\} controls=\{sectionDock\} \/>/);
  assert.equal(count(b, /\{picker\}/g), 2, 'the construction picker is built once: on the page and in the dock');
  const c = read('connectorselect/pagesC.tsx');
  assert.match(c, /import \{ TesterFace \} from '\.\/art'/);
  assert.match(c, /controls=\{<View style=\{styles\.testerDock\}>\{panel\}\{actions\}<\/View>\}/, 'END A / END B keys + FLEX·INSPECT·RESEAT dock under the face');
  assert.match(c, /\{panel\}\s*\{actions\}/, 'and the same elements sit on the card');
  assert.doesNotMatch(c, /styles\.testerMid/, 'the lamp left the middle column for the face');
});

/* ── Speech page 2 ────────────────────────────────────────────────────── */

test('Speech page 2: the stage strip draws through ExpandableFigure, compact in the head dock', () => {
  const src = read('speech/speechPagesA.tsx');
  assert.match(src, /const stripAt = \(w: number \| string, h: number\) => \(\s*<Svg(?: accessibilityElementsHidden importantForAccessibility="no-hide-descendants")? width=\{w\} height=\{h\} viewBox="0 0 340 56">/);
  assert.match(src, /<ExpandableFigure aspect=\{340 \/ 56\} title="STAGES" controls=\{<View[^>]*>\{readout\}\{nav\}<\/View>\} render=\{\(w, h\) => \(/);
  assert.match(src, /\{stripAt\(w, h\)\}/);
  assert.match(src, /const strip = stripAt\('100%', 56\);/, 'the head drawing keeps the compact strip in its own dock');
  assert.equal(count(src, /\{readout\}/g), 2, 'the readout is built once for both docks');
});

/* ── Ear Training SEE IT ──────────────────────────────────────────────── */

test('SeeItView: spectrum, waveform and goniometer draw through ExpandableFigure; levels stay inline', () => {
  const src = read('eartraining/SeeItView.tsx');
  assert.match(src, /import \{ ExpandableFigure \} from '\.\.\/kit\/ExpandableFigure'/);
  assert.equal(count(src, /<ExpandableFigure\b/g), 3);
  assert.match(src, /<ExpandableFigure aspect=\{W \/ H\} title="SPECTRUM" controls=\{controls\}/);
  assert.match(src, /<ExpandableFigure aspect=\{W \/ Hw\} title="WAVEFORM" controls=\{controls\}/);
  assert.match(src, /<ExpandableFigure aspect=\{GW \/ GH\} title="GONIOMETER" controls=\{controls\}/);
  const code = stripComments(src);
  assert.doesNotMatch(code, /width="100%"/, 'plots take the wrapper width');
  assert.doesNotMatch(code, /<Svg width=\{140\} height=\{140\}/, 'the goniometer is one scaling drawing, not two fixed panes');
  assert.match(code, /corr \{p\.corr\.toFixed\(2\)\}\s*<\/SvgText>/, 'the correlation readout is SVG text — it zooms');
  assert.match(code, /<LevelsSeeIt spec=\{spec\} trial=\{trial\} \/>/, 'the view-built levels panel is not wrapped');
  assert.match(code, /\{spec\.caption\}<\/Text>\s*\{controls\}/, 'caption as the readout, then the transport');
});

test('EarModuleScreen builds the transport once and docks it under SEE IT', () => {
  const src = read('eartraining/EarModuleScreen.tsx');
  assert.match(src, /const transport = trial \? \(/);
  assert.equal(count(src, /^\s*\{transport\}\s*$/gm), 1, 'placed on the page once');
  assert.match(src, /<SeeItView trial=\{trial\} controls=\{transport\} \/>/);
  assert.equal(count(src, /styles\.transportRow/g), 1, 'no duplicate transport JSX');
});

/* ── house rules ─────────────────────────────────────────────────────── */

test('group-6 labs: no raw Alert.alert', () => {
  for (const rel of [
    'patchbay/pagesA.tsx', 'patchbay/pagesB.tsx', 'patchbay/pagesC.tsx', 'patchbay/pagesD.tsx',
    'patchbay/art/PatchPairView.tsx', 'patchbay/art/JackCutaway.tsx', 'patchbay/art/StudioBayView.tsx',
    'connectorselect/art.tsx', 'connectorselect/pagesA.tsx', 'connectorselect/pagesB.tsx', 'connectorselect/pagesC.tsx',
    'speech/speechPagesA.tsx', 'eartraining/SeeItView.tsx', 'eartraining/EarModuleScreen.tsx',
  ]) {
    assert.doesNotMatch(read(rel), /Alert\.alert/, `${rel} uses a raw Alert.alert`);
  }
});
