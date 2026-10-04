/**
 * OWNER RULING 2026-10-04 — "clipping clears when moving to another tool."
 * Receipts (key toolsClip); each fails on HEAD e262b2ec.
 *
 * The engine's clipRuns counter belongs to the whole CAPTURE (only the native
 * resetMetersLocked zeroes it). meterWarningFlags raised 'input_clipping' on
 * clipRuns > 0, so a tool that adopted the warm stream (SPL → RTA →
 * Spectrogram …) showed — and SAVED into its records — clipping caused in the
 * previous tool. Now useDspEngine arms a per-run baseline every time start()
 * goes live, and every tool reads its flags through the hook's `meterFlags`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

type Baseline = { arm(c: number, s?: number): void; runsSince(c: number, s?: number): number };

test('1. clipBaseline: runs before the tool started are the baseline, not this run\'s clipping', async () => {
  const { createClipBaseline } = (await import('../src/features/tools/engine/clipBaseline.ts')) as {
    createClipBaseline: () => Baseline;
  };
  const b = createClipBaseline();
  assert.equal(b.runsSince(7, 100), 0, 'a tool that has not started owns no clipping');
  // The SPL meter clipped 5 times; the RTA adopts the warm stream.
  b.arm(5, 100);
  assert.equal(b.runsSince(5, 110), 0, 'inherited runs do not light the RTA');
  assert.equal(b.runsSince(6, 120), 1, 'a run during THIS tool still counts');
  // Moving to another tool (or STOP → START) re-arms: starts clean again.
  b.arm(6, 130);
  assert.equal(b.runsSince(6, 140), 0);
});

test('2. clipBaseline: a counter that drops below the baseline is a new capture — all of it is new, and it keeps following', async () => {
  const { createClipBaseline } = (await import('../src/features/tools/engine/clipBaseline.ts')) as {
    createClipBaseline: () => Baseline;
  };
  const b = createClipBaseline();
  b.arm(5, 500);
  assert.equal(b.runsSince(2, 3), 2, 'a restarted counter below the base: every run is new');
  assert.equal(b.runsSince(7, 9), 7, 'and it is not re-subtracted once the restarted counter passes the old base');
  // A frame sequence that restarts also means a new capture, even at a count
  // that happens to sit at or above the old base.
  const c = createClipBaseline();
  c.arm(2, 900);
  assert.equal(c.runsSince(3, 4), 3, 'a restarted sequence: all runs are new');
  // A zeroed counter re-bases quietly.
  const z = createClipBaseline();
  z.arm(4);
  assert.equal(z.runsSince(0), 0);
  assert.equal(z.runsSince(1), 1);
});

test('3. useDspEngine: the flag mapping takes the run baseline, start() arms it before going live, and the hook hands tools meterFlags', () => {
  const src = read('features/tools/engine/useDspEngine.ts');
  assert.match(src, /export function meterWarningFlags\(m: MeterFrame \| null, clip\?: ClipBaseline\)/);
  assert.match(src, /const clipRuns = clip \? clip\.runsSince\(m\.clipRuns, m\.sequence\) : m\.clipRuns;\s*\n\s*if \(clipRuns > 0\) flags\.push\('input_clipping'\);/);
  assert.doesNotMatch(src, /if \(m\.clipRuns > 0\) flags\.push/);
  const startFn = src.slice(src.indexOf('const start = useCallback'), src.indexOf('const stop = useCallback'));
  const arm = startFn.indexOf('clipRef.current?.arm(');
  const running = startFn.indexOf("setState('running')");
  assert.ok(arm > 0 && running > arm, 'the baseline is armed BEFORE the run goes live (every start: open, adopt, refocus, STOP→START)');
  assert.ok(startFn.indexOf('if (gen !== genRef.current)', startFn.indexOf('await acquiring')) < arm, 'armed only by the start that owns the stream');
  assert.match(src, /meterFlags,\n\s*resetPeakHold/, 'the hook returns meterFlags');
  // droppedFrames stays sticky for the session — the ruling covers clipping only.
  assert.match(src, /if \(m\.droppedFrames > 0\) flags\.push\('capture_dropout'\);/);
});

test('4. every tool shows AND saves clipping through the per-run meterFlags, never the raw per-capture counter', () => {
  const screens: [string, number][] = [
    ['screens/tools/SplMeterScreen.tsx', 2],
    ['screens/tools/RtaScreen.tsx', 2],
    ['screens/tools/SpectrogramScreen.tsx', 2],
    ['screens/tools/FrequencyCounterScreen.tsx', 2],
    ['screens/tools/MultiMeterScreen.tsx', 2],
    ['screens/tools/WaveformScreen.tsx', 1],
    ['screens/lab/HarmonicsView.tsx', 1],
  ];
  for (const [p, uses] of screens) {
    const src = read(p);
    assert.doesNotMatch(src, /meterWarningFlags\(/, `${p}: no raw meterWarningFlags call`);
    assert.match(src, /meterFlags \} = useDspEngine\(/, `${p}: takes meterFlags from the hook`);
    assert.equal((src.match(/meterFlags\(/g) ?? []).length, uses, `${p}: live + save both use meterFlags`);
  }
  // Rt60 keeps its own ARM baseline and drops the engine's input_clipping.
  const rt60 = read('screens/tools/Rt60Screen.tsx');
  assert.match(rt60, /if \(f !== 'input_clipping' && f !== 'capture_dropout' && !next\.includes\(f\)\) next\.push\(f\);/);
});
