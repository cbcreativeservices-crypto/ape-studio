/**
 * Miking Labs 1–4 — chaos-toddler hunt 2026-10-07 (docs/bughunt/
 * TODDLER_2026_10_07_labs1-4.md). Each pin names the bug it holds shut.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SRC = new URL('../src/screens/lab/miking/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(SRC + p, 'utf8').replace(/\r\n/g, '\n');
const setups = read('pages/PSetups.tsx');
const host = read('MikingLessonScreen.tsx');
const hub = read('MikingHubScreen.tsx');

describe('T1-01 — the SETUP fader no longer remounts the stage on every setup it crosses', () => {
  it('the stage draws the SETTLED setup, not the fader position', () => {
    assert.match(setups, /const stageI = useSettledIndex\(i, SETTLE_MS, riding, variant\);/);
    assert.match(setups, /<SetupStage key=\{`\$\{variant\}\|\$\{drawn\.id\}`\}[^>]*setup=\{drawn\}/);
    assert.doesNotMatch(setups, /<SetupStage key=\{`\$\{variant\}\|\$\{sel\.id\}`\}/);
  });
  it('LOOKED AT and START FROM follow the drawn setup (a flick credits nothing it crossed)', () => {
    assert.match(setups, /setSeen\(\(prev\) => \(prev\.has\(`\$\{variant\}\|\$\{drawn\.id\}`\)/);
    assert.match(setups, /chooseStart\?\.\(drawn\.id\);/);
  });
  it('the fader is a preview lane: it holds the redraw while the finger rides, and its words follow the finger', () => {
    assert.match(setups, /onCommit: \(v\) => \{\n\s+setRiding\(false\);/);
    assert.match(setups, /format: \(v\) => \{/);
    assert.match(setups, /formatShort: \(v\) =>/);
  });
  it('a lost release can never leave the stage stuck (the hold only slows the redraw)', () => {
    assert.match(setups, /setTimeout\(\(\) => setSt\(\{ i, key: resetKey \}\), hold \? HOLD_MS : ms\)/);
    assert.doesNotMatch(setups, /if \(settled === i \|\| hold\) return;/);
  });
  it('the view is decided in the render the stage mounts in (no second draw from an effect)', () => {
    assert.match(setups, /const view: ViewId = viewPick\?\.key === stageKey \? viewPick\.v : bestView\(drawnGuides, both\);/);
    assert.doesNotMatch(setups, /setView\(bestView\(guides, both\)\)/);
  });
});

describe('T2-01 — another variant takes its own first setup at once', () => {
  it('a new variant resets the settled index without waiting', () => {
    assert.match(setups, /if \(st\.key !== resetKey\) setSt\(\{ i, key: resetKey \}\);/);
    assert.match(setups, /const settled = st\.key === resetKey \? st\.i : i;/);
  });
});

describe('T1-02 / T1-03 — START OVER and PRACTISE AGAIN are one immediate fresh run', () => {
  it('the screen resets without waiting for the device write', () => {
    assert.doesNotMatch(host, /clearMikingPracticeRun\(lesson\.id\)\.then\(/);
    assert.match(host, /void clearMikingPracticeRun\(lesson\.id\);\n\s+setLocalAnswers\(\{\}\);/);
  });
  it("the what's-left screen's PRACTISE AGAIN clears the run like START OVER", () => {
    assert.match(host, /onPracticeAgain=\{doReset\}/);
  });
});

describe('T1-04 — an unknown lab id never shows an empty menu', () => {
  it('falls back to every family', () => {
    assert.match(hub, /const shown: MikingLabMeta\[\] = picked\.length \? picked : labs;/);
  });
});
