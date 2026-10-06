/**
 * Calculator bug pass 1 of 3 (night 2026-10-01) — regressions.
 *
 *  TC1 Timecode → frames counts whole frames per timecode second (29.97 NDF
 *      00:05:00 = 9000 frames, matching the Frames → timecode table);
 *  W1  the CALCULATE signature covers only the current function's fields, and
 *      every paid input set stays revealed (no second credit for A → B → A);
 *  W2  answers are held until the entitlement tier is known;
 *  W3  a late boot-time status read never rolls the counter back;
 *  R1  "Start over" on the resume prompt keeps the old draft until the new run
 *      saves (onCancel also fires on a scrim tap / Android BACK);
 *  E1  workflow builder ✕ removes by step, not index (double tap);
 *  P1  project editor ✕ removes by row; the project limit is re-checked
 *      against the stored list at save;
 *  M1  BPM mistakes copy: a triplet quarter is 2/3 of a quarter.
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
  const w = getWorkspace(wsId);
  assert.ok(w, wsId);
  const f = w!.functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};
const num = (outs: ReturnType<ReturnType<typeof fn>['compute']>, label: string) => {
  const o = outs.find((x) => x.label === label);
  assert.ok(o && 'value' in o, label);
  return (o as { value: number }).value;
};

test('TC1 timecode → frames uses whole frames per timecode second', () => {
  const to = fn('timecode', 'toFrames');
  const ntsc = to.compute({ hours: 0, mins: 5, secs: 0, fps: 29.97 });
  assert.equal(num(ntsc, 'TOTAL FRAMES'), 9000);
  assert.ok(Math.abs(num(ntsc, 'REAL ELAPSED TIME') - 9000 / 29.97) < 1e-9);
  // Integer rates are unchanged.
  assert.equal(num(to.compute({ hours: 0, mins: 6, secs: 0, fps: 25 }), 'TOTAL FRAMES'), 9000);
  // Round trip with Frames → timecode's own table.
  const table = fn('timecode', 'fromFrames').table!({ frames: 9000, fps: 29.97 });
  assert.deepEqual(table.rows[0], ['00', '05', '00', '00']);
});

test('W1 CALCULATE signature is scoped to the function and remembers every paid set', () => {
  const src = read('screens/lab/calc/CalcWorkspaceScreen.tsx');
  assert.match(src, /v: fields\.map\(\(fd\) => \[fd\.key, raw\[fd\.key\] \?\? '', unitIdx\[fd\.key\] \?\? defaultUnitIdx\(fd\)\]\)/);
  assert.doesNotMatch(src, /JSON\.stringify\(\{ f: fn\?\.key \?\? '', raw, unitIdx \}\)/);
  assert.match(src, /const resultUnlocked = !capped \|\| consumedSigs\.has\(inputSig\);/);
  assert.match(src, /setConsumedSigs\(\(s\) => new Set\(s\)\.add\(inputSig\)\)/);
});

test('W2 the answer waits for the entitlement tier', () => {
  const src = read('screens/lab/calc/CalcWorkspaceScreen.tsx');
  // Hunt 4 (2026-10-03) widened the hold to a failed read (calcHunt4_20261003).
  assert.match(src, /const tierPending = \(!resolved \|\| tierUnconfirmed\) && !onboardingSampling;/);
  assert.match(src, /\) : tierPending \? \(\s*<Text style=\{styles\.resultPlaceholder\}>[\s\S]{0,260}'Checking your account…'\}\s*<\/Text>\s*\) : capped && !resultUnlocked \? \(/);
});

test('W3 a late status read cannot overwrite the post-CALCULATE count', () => {
  const src = read('screens/lab/calc/CalcWorkspaceScreen.tsx');
  assert.match(src, /if \(alive && !usageFromConsumeRef\.current\) setUsage\(u\);/);
  assert.match(src, /usageFromConsumeRef\.current = true;\s*setUsage\(u\);/);
});

test('R1 resume prompt dismissal never deletes the saved draft by itself', () => {
  const src = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  const onCancel = src.slice(src.indexOf("cancelText: 'Start over'"), src.indexOf('setRun(blank());', src.indexOf("cancelText: 'Start over'")));
  assert.doesNotMatch(onCancel, /deleteRun/);
  assert.match(onCancel, /abandonedDraftRef\.current = draft\.id;/);
  assert.match(src, /if \(ok && old && old !== r\.id\) \{\s*abandonedDraftRef\.current = null;\s*void workflowStore\.deleteRun\(old(, storeGenRef\.current)?\);/);
});

test('E1/P1 double-tapped ✕ removes one row; project limit re-checked at save', () => {
  const edit = read('screens/lab/calc/CalcWorkflowEditScreen.tsx');
  assert.match(edit, /const removeStep = \(step: WorkflowStep\) => mutate\(\(s\) => s\.filter\(\(x\) => x !== step\)\);/);
  assert.match(edit, /onPress=\{\(\) => removeStep\(s\)\}/);
  const proj = read('screens/lab/calc/CalcProjectsScreen.tsx');
  assert.match(proj, /setValues\(\(vs\) => vs\.filter\(\(x\) => x !== v\)\)/);
  assert.match(proj, /const stored = await workflowStore\.listProjects\(\);\s*if \(stored\.length >= limits\.savedProjects\) \{/);
  assert.match(proj, /guardCreate\(stored\.length\);/);
});

test('M1 triplet quarter copy is 2/3 of a quarter', () => {
  const w = getWorkspace('bpm')!;
  const line = w.mistakes.find((m) => m.includes('triplet quarter'));
  assert.ok(line);
  assert.match(line!, /×2\/3 of a quarter/);
  assert.doesNotMatch(line!, /×2\/3 of a half\)/);
});
