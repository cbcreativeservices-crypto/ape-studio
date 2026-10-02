/**
 * Toddler + cat pass 2026-09-30 — tools + calculator screens.
 *
 * Source-reading pins (RN screens cannot be imported under node) so a refactor
 * cannot quietly drop the mechanism:
 *  1. SPL: a fresh session never measures its "dead capture" gap from the LAST
 *     session's final frame (spurious ENGINE INACTIVE on every restart);
 *  2. MultiMeter: its own spectrum poll skips a stalled capture, and the
 *     derived displays answer to `captureLive`, not `running`;
 *  3. CenterLock strobe: driven by a SharedValue, never React state per frame;
 *  4. Frequency Counter: Android BACK steps out of a mode before leaving;
 *  5. Workflow runner: stepping back into a finished run re-opens it;
 *  6. Workflows list: one DUPLICATE per tap.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('1 — SPL forgets the last live frame when capture stops', () => {
  const src = read('screens/tools/SplMeterScreen.tsx');
  const rest = src.slice(src.indexOf('// Rest the needles when not capturing'));
  const effect = rest.slice(0, rest.indexOf('}, [running, liveRmsDb, livePeakDb]);'));
  assert.match(effect, /if \(!running\) \{/);
  assert.match(effect, /lastFrameRef\.current = 0;/, 'the stale-gap clock must restart with each session');
  assert.match(effect, /setCaptureDead\(false\)/, 'a dead verdict must not outlive the session');
});

test('2 — MultiMeter never derives displays from a stalled capture', () => {
  const src = read('screens/tools/MultiMeterScreen.tsx');
  const poll = src.slice(src.indexOf('const id = setInterval(() => {'), src.indexOf('}, SPEC_POLL_MS);'));
  assert.match(
    poll.slice(0, 900),
    /if \(!frameIsLive\(framesRef\.current\.meter\)\) return;/,
    'the poll must skip before minting bands / columns / a dominant peak',
  );
  assert.match(src, /const bands = captureLive \? sixthBands : null;/);
  assert.match(src, /const dominant: \{ hz: number; source: 'pitch' \| 'spectrum' \} \| null = !captureLive/);
  assert.match(src, /if \(!captureLive \|\| cursorX == null/);
});

test('3 — the CenterLock strobe does not set React state per frame', () => {
  const src = read('screens/tools/CenterLockTuner.tsx');
  const fn = src.slice(src.indexOf('function StrobeBand('), src.indexOf('const STRIPE_PERIOD'));
  assert.doesNotMatch(fn, /useState\(/, 'StrobeBand must not hold the drift in React state');
  assert.match(fn, /useSharedValue\(0\)/);
  assert.match(fn, /offset\.value = off;/);
});

test('4 — Frequency Counter: BACK leaves a mode before leaving the tool', () => {
  const src = read('screens/tools/FrequencyCounterScreen.tsx');
  assert.match(src, /if \(!centerLockOpen && !vuTunerOpen && mode == null\) return;/);
  assert.match(src, /else setMode\(null\);\s*return true;/);
  // backFocused joined the deps in day pass 2 (the handler only runs focused).
  assert.match(src, /\}, \[backFocused, centerLockOpen, vuTunerOpen, mode\]\);/);
});

test('5 — workflow runner re-opens a finished run when a step is revisited', () => {
  const src = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  const goTo = src.slice(src.indexOf('const goTo = (next: number) => {'), src.indexOf('const onFinish = () => {'));
  assert.match(goTo, /completedAt: next < n \? undefined : r0?\.completedAt/); // r0: evening hunt 2 (runRef before persist)
  assert.match(goTo, /if \(next < n\) setResultSaved\(false\);/);
});

test('6 — one workflow DUPLICATE per tap', () => {
  const src = read('screens/lab/calc/CalcWorkflowsScreen.tsx');
  const dup = src.slice(src.indexOf('const duplicate = async'), src.indexOf('const duplicateOnce = async'));
  assert.match(dup, /if \(duplicatingRef\.current\) return;/);
  assert.match(dup, /duplicatingRef\.current = true;/);
  assert.match(dup, /finally \{\s*duplicatingRef\.current = false;/);
});
