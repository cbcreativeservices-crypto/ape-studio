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
 * currently)"; asked how, the owner chose "Low Cut now, gate at build"). The build step, must-do E9 (the
 * owner's go 2026-11-27, "Yes, start it"): the engine has its own LOW CUT node (fx::LowCut = 9, engine 11)
 * and runs LOW CUT → GATE → EQ → COMP → … (modules/ape-dsp/ios/core/Effects.hpp); the rack is drawn in that
 * order. Until then (OTA, engine 10) LOW CUT rode on the EQ node's band 5 and the engine ran EQ → COMP → GATE.
 */
const fx = readFileSync('modules/ape-dsp/ios/core/Effects.hpp', 'utf8').replace(/\r\n/g, '\n');
const api = readFileSync('modules/ape-dsp/index.ts', 'utf8').replace(/\r\n/g, '\n');
const ORDER = ['lowCut', 'gate', 'eq', 'comp', 'dist', 'mod', 'delay', 'reverb', 'stereo', 'limiter'];

test('LOW CUT is the first unit in the rack and says what it is; GATE is second', () => {
  const mods = screen.slice(screen.indexOf('const MODULES: ChainUnit[] = ['));
  assert.match(mods, /^const MODULES: ChainUnit\[\] = \[\n  \{ id: FX\.lowCut, label: 'LOW CUT', plain: 'removes rumble', setting: 'below 80 Hz'[^\n]*\n  \{ id: FX\.gate, label: 'GATE'/);
});

test('the rack is drawn in the engine’s order: LOW CUT, GATE, EQ, COMP, DIST, MOD, DELAY, REVERB, STEREO, LIMIT', () => {
  const at = screen.indexOf('const MODULES: ChainUnit[] = [');
  const mods = screen.slice(at, screen.indexOf('];', at));
  const drawn = [...mods.matchAll(/\{ id: FX\.(\w+), label: '[^']+'/g)].map((m) => m[1]);
  assert.deepEqual(drawn, ORDER);
  // the TS mirror of the engine order
  const order = api.match(/export const FX_CHAIN_ORDER = \[([^\]]+)\]/)?.[1] ?? '';
  assert.deepEqual(order.split(',').map((x) => x.trim().replace(/^FX\./, '')), ORDER);
  // and the engine itself, processStereo top to bottom
  const chain = fx.slice(fx.indexOf('class EffectChain'));
  const body = chain.slice(chain.indexOf('void processStereo('), chain.indexOf('/// The ONE bridge setter'));
  const ran = [...body.matchAll(/(\w+)_\.processStereo\(L, R, n\);/g)].map((m) => m[1]);
  assert.deepEqual(ran, ORDER);
});

test('LOW CUT is its own engine node, a 12 dB/octave high-pass at 80 Hz (no longer the EQ node’s band 5)', () => {
  assert.match(screen, /const LOW_CUT_HZ = 80;/);
  assert.match(screen, /\[FX\.lowCut\]: \[\{ fx: FX\.lowCut, param: P\.lowCutHz, value: LOW_CUT_HZ \}\]/);
  assert.doesNotMatch(screen, /LOW_CUT_BAND|eqNodeOps|eqNodeOn|EQ_BAND_TYPES\.highPass/);
  // EQ band 5 is written OFF again, like bands 1–4
  assert.match(screen, /\{ fx: FX\.eq, param: P\.eqBand\(5, 'type'\), value: EQ_BAND_TYPES\.off \}/);
  // the new id is 9; the existing ids are unchanged
  assert.match(api, /limiter: 8,\n  lowCut: 9,/);
  assert.match(api, /lowCutHz: 1,/);
  assert.match(fx, /Limiter = 8,\n  LowCut = 9,/);
  // the node builds the same Butterworth high-pass the EQ's HighPass band uses
  const node = fx.slice(fx.indexOf('class LowCutEffect'), fx.indexOf('class DynamicsEffect'));
  assert.match(node, /const Biquad bq = Biquad::highpass\(freqHz_\.load\(std::memory_order_relaxed\), fs_\);/);
  assert.match(node, /std::atomic<double> freqHz_\{80\.0\};/);
  assert.match(fx, /case HighPass: bq = Biquad::highpass\(f, fs_\); break;/);
  assert.match(fx, /case fx::LowCut: lowCut_\.setParam\(paramId, v\); break;/);
  // a lab's stop path disables LOW CUT too
  assert.match(fx, /for \(int id = fx::Eq; id <= fx::kLastId; \+\+id\) set\(id, 0, 0\.0\);/);
  assert.match(fx, /constexpr int kLastId = LowCut;/);
});

test('every unit, LOW CUT included, is switched on its own node: no shared-node special case', () => {
  assert.match(screen, /for \(const m of MODULES\) \{\n\s*if \(!en\[m\.id\]\) continue;/);
  assert.match(screen, /if \(running\) \{\n\s*if \(next\[id\]\) \{/);
});

test('the lit patches still point at the same units (index = the cable INTO that unit, in the new order)', () => {
  // LOW CUT 0, GATE 1, EQ 2, COMP 3, DIST 4, MOD 5, DELAY 6, REVERB 7, STEREO 8, LIMIT 9
  assert.match(screen, /key: 'bass_comp'[^\n]*hot: \[3\]/);
  assert.match(screen, /key: 'delay_reverb'[^\n]*hot: \[7\]/);
  assert.match(screen, /key: 'gate_click'[^\n]*hot: \[1\]/);
  assert.match(screen, /key: 'squash'[^\n]*hot: \[3, 9\]/);
});

test('the words say ten units, LOW CUT then GATE, and are honest about the phone speaker', () => {
  assert.match(guide, /Ten units in a fixed order: LOW CUT, GATE, EQ, COMP/);
  assert.match(guide, /This rack gates before EQ and COMP, a common starting point/);
  assert.doesNotMatch(guide, /runs COMP before GATE/);
  assert.match(screen, /On the phone speaker the deep bass is already cut before the chain, so LOW CUT changes\s+little there/);
  assert.match(screen, /GATE comes next, ahead of EQ\s+and COMP, a common starting point/);
  assert.doesNotMatch(screen, /runs COMP before GATE/);
  assert.doesNotMatch(screen, /chainCount\}\/9/);
});
