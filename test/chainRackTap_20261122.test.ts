/**
 * Signal Chain Builder: the rack is tappable (owner 2026-11-22).
 *
 * The owner's screenshot title: "says you can tap modules but doesnt work".
 * The EXPLORE caption read "Tap modules in or out of the chain" while the rack
 * picture was a read-only display (rule of 2026-10-10: controls live in the
 * dock). Asked which fix, the owner chose "Make the rack tappable": a tap on a
 * unit switches it in or out, and the MODULES dock key still does the same.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rack = readFileSync('src/screens/lab/chainRack.tsx', 'utf8').replace(/\r\n/g, '\n');
const screen = readFileSync('src/screens/lab/SignalChainLabScreen.tsx', 'utf8').replace(/\r\n/g, '\n');
const guide = readFileSync('src/screens/lab/chainScreenGuides.ts', 'utf8').replace(/\r\n/g, '\n');

test('the rack offers one tap target per unit, wired to the toggle', () => {
  assert.match(rack, /onToggle\?: \(id: number\) => void/);
  assert.match(rack, /units\.map\(\(u, i\) => \{[\s\S]*?<Pressable[\s\S]*?onPress=\{\(\) => onToggle\(u\.id\)\}/);
  assert.match(screen, /<ChainRack[\s\S]*?onToggle=\{toggleModule\}/);
});

test('each tap target says what it is and whether the unit is in', () => {
  assert.match(rack, /accessibilityRole="switch"/);
  assert.match(rack, /accessibilityState=\{\{ checked: on \}\}/);
  assert.match(rack, /in the chain' : 'bypassed'/);
});

test('the tap target covers the panel and the words under it, at a finger size', () => {
  // height = the panel + the label line + 8; the panel is never under 18 pt (four rows on a short phone) and the label line is 13.
  assert.match(rack, /height: uh \+ labelH \+ 8/);
  assert.match(rack, /const uh = Math\.max\(rows > 3 \? 18 : 22,/);
  assert.match(rack, /const labelH = 13;/);
  assert.ok(18 + 13 + 8 >= 39);
});

test('the MODULES dock key still switches each unit', () => {
  assert.match(screen, /id: 'modules'[\s\S]*?onPress=\{\(\) => toggleModule\(m\.id\)\}/);
});

test('the words on the page match what the rack now does', () => {
  assert.match(screen, /exploreCaption="Tap modules in or out of the chain/);
  assert.match(screen, /TAP A UNIT IN OR OUT/);
  assert.doesNotMatch(screen, /MODULES key toggles each\)'/);
  assert.match(guide, /Tap a unit in the rack or under MODULES to put it in or bypass it/);
});

/**
 * LOW CUT (owner 2026-11-22: "the gate is usually before any eq and compression. Low Cut as well (not shown
 * currently)"; asked how, the owner chose "Low Cut now, gate at build"). The engine's order is compiled in
 * (modules/ape-dsp/ios/core/Effects.hpp: eq, comp, gate, ...), so the gate move waits for the store build
 * (must-do E9). LOW CUT is real today: the EQ node's band 5 as a high-pass, and the EQ node runs first.
 */
const fx = readFileSync('modules/ape-dsp/ios/core/Effects.hpp', 'utf8').replace(/\r\n/g, '\n');

test('LOW CUT is the first unit in the rack and says what it is', () => {
  const mods = screen.slice(screen.indexOf('const MODULES: ChainUnit[] = ['));
  assert.match(mods, /^const MODULES: ChainUnit\[\] = \[\r?\n  \{ id: LOW_CUT, label: 'LOW CUT', plain: 'removes rumble', setting: 'below 80 Hz'/);
});

test('LOW CUT is a real filter: the EQ node\u2019s band 5 as a high-pass at 80 Hz', () => {
  assert.match(screen, /const LOW_CUT_BAND = 5;/);
  assert.match(screen, /const LOW_CUT_HZ = 80;/);
  assert.match(screen, /param: P\.eqBand\(LOW_CUT_BAND, 'type'\), value: EQ_BAND_TYPES\.highPass/);
  assert.match(screen, /param: P\.eqBand\(LOW_CUT_BAND, 'freq'\), value: LOW_CUT_HZ/);
  // the engine builds that band as its 12 dB/octave Butterworth high-pass
  assert.match(fx, /case HighPass: bq = Biquad::highpass\(f, fs_\); break;/);
});

test('the drawing is true to the engine: the EQ node (LOW CUT + EQ) runs before COMP and GATE', () => {
  const order = fx.slice(fx.indexOf('class EffectChain'));
  const at = (name) => order.indexOf(name + '.processStereo');
  assert.ok(at('eq_') > 0 && at('eq_') < at('comp_') && at('comp_') < at('gate_'));
});

test('the EQ node is on when either unit is in, and a unit that is out has its band off', () => {
  assert.match(screen, /const eqNodeOn = \(en: Record<number, boolean>\) => !!\(en\[FX\.eq\] \|\| en\[LOW_CUT\]\);/);
  assert.match(screen, /op\.param === shelfType && !en\[FX\.eq\] \? \{ \.\.\.op, value: EQ_BAND_TYPES\.off \}/);
  assert.match(screen, /op\.param === cutType && !en\[LOW_CUT\] \? \{ \.\.\.op, value: EQ_BAND_TYPES\.off \}/);
  assert.match(screen, /ApeDsp\.fxSet\(FX\.eq, 0, eqNodeOn\(next\) \? 1 : 0\);/);
});

test('the lit patches still point at the same units (each index moved up by one)', () => {
  assert.match(screen, /key: 'bass_comp'[^\n]*hot: \[2\]/);
  assert.match(screen, /key: 'delay_reverb'[^\n]*hot: \[7\]/);
  assert.match(screen, /key: 'gate_click'[^\n]*hot: \[3\]/);
  assert.match(screen, /key: 'squash'[^\n]*hot: \[2, 9\]/);
});

test('the words say ten units with LOW CUT first, and are honest about the phone speaker', () => {
  assert.match(guide, /Ten units in a fixed order: LOW CUT, EQ, COMP, GATE/);
  assert.match(screen, /On the phone speaker the deep bass is already cut before the chain, so LOW CUT changes\s+little there/);
  assert.doesNotMatch(screen, /chainCount\}\/9/);
});
