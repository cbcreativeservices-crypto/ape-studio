/**
 * Calculator night bug pass 2 of 3 (2026-10-01) — regressions.
 *
 *  C1 whole-number COUNT outputs are exact, never rounded to sig figs
 *     (65536-point FFT size, 107880 timecode frames);
 *  C2 the timecode worked steps echo the exact frame count / fps;
 *  E2 workflow builder ▲▼ move by step, not index (double tap);
 *  W4 a CALCULATE that answers after the screen is gone raises no dialog;
 *  S1 a NEW project / a workflow result is not saved before the tier is known;
 *  A1 the workflow runner skips its leave-save on a root RESET (sign-out wipe).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(path.join(here, '..', 'src', rel), 'utf8');

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');

const fn = (wsId: string, key: string) => {
  const f = getWorkspace(wsId)!.functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};

test('C1 integer counts are shown exactly (formatOutput source contract)', () => {
  const src = read('screens/lab/calc/calcPanel.tsx');
  // Widened in night pass 3 to snap float-noise counts too (see calcNightPass3).
  assert.match(src, /const whole = wholeCount\(o\.value, o\.quantity\);/);
  assert.match(read('screens/lab/calc/calcUnits.ts'), /if \(quantity !== 'samples' && quantity !== 'number'\) return null;/);
  // The values that used to round: both are whole numbers of the count kinds.
  const outs = fn('timecode', 'toFrames').compute({ hours: 0, mins: 59, secs: 56, fps: 30 });
  const frames = outs.find((o) => o.label === 'TOTAL FRAMES') as { value: number; quantity: string };
  assert.equal(frames.value, 107880);
  assert.equal(frames.quantity, 'number');
  assert.ok(Number.isInteger(frames.value));
});

test('C2 timecode steps echo the exact count and fps', () => {
  const to = fn('timecode', 'toFrames').steps!({ hours: 0, mins: 59, secs: 56, fps: 23.976 });
  assert.ok(to.some((s) => s.includes('86304')), to.join('\n'));
  assert.ok(to.every((s) => !s.includes('86300')), to.join('\n'));
  assert.ok(to[2].includes('23.976'), to[2]);
  const from = fn('timecode', 'fromFrames').steps!({ frames: 107892, fps: 29.97 });
  assert.ok(from[0].startsWith('Time = 107892 frames ÷ 29.97 fps'), from[0]);
});

test('E2 workflow builder moves by step identity', () => {
  const src = read('screens/lab/calc/CalcWorkflowEditScreen.tsx');
  assert.match(src, /const move = \(step: WorkflowStep, dir: -1 \| 1\) => \{\s*mutate\(\(s\) => \{\s*const i = s\.indexOf\(step\);/);
  assert.match(src, /onPress=\{\(\) => move\(s, -1\)\}/);
  assert.match(src, /onPress=\{\(\) => move\(s, 1\)\}/);
});

test('W4 no dialogs from a CALCULATE that lands after unmount', () => {
  const src = read('screens/lab/calc/CalcWorkspaceScreen.tsx');
  assert.match(src, /if \(!mountedRef\.current\) return;\s*usageFromConsumeRef\.current = true;\s*setUsage\(u\);/);
  assert.match(src, /return \(\) => \{\s*mountedRef\.current = false;\s*\};/);
});

test('S1 project and result saves wait for the entitlement tier', () => {
  const proj = read('screens/lab/calc/CalcProjectsScreen.tsx');
  assert.match(proj, /if \(editing\?\.id == null && !resolved\) \{\s*notify\(/);
  const run = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  const save = run.slice(run.indexOf('const saveResult = async'));
  assert.ok(save.indexOf('if (!resolved)') > 0 && save.indexOf('if (!resolved)') < save.indexOf('limits.savedResults === 0'));
});

test('A1 the runner does not save its draft on a sign-out RESET', () => {
  const run = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  assert.match(run, /addListener\('beforeRemove', \(e\) => \{[\s\S]*?if \(e\.data\.action\.type === 'RESET'\) return;\s*void persist\(\);/);
});
