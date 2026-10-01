/**
 * Calculator night bug pass 3 of 3 (2026-10-01) — regressions.
 *
 *  F1 the workflow store has an account-wipe generation fence + resetLocal
 *     (exported as resetCalcWorkflowStore): a save asked for before a wipe —
 *     queued, mid read-modify-write, or from a screen mounted before it —
 *     never re-creates the departing account's `ape:calcwf:*` blob;
 *  F2 the runner / project editor / workflow builder pass their mount
 *     generation and raise no "Save failed" popup for a fenced write;
 *  C1 (correction to pass 2) a count that is whole only up to float noise
 *     (0.35 s × 44100 Hz) prints exact, not rounded to 4 figures;
 *  C2 a carried-in count (chain / prior step / project value) is written into
 *     the field exact, not at 6 figures;
 *  G1 duplicating a template / saving a NEW workflow waits for the tier.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const store = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

const ws = await import('../src/screens/lab/calc/workflowStore.ts');
const { workflowStore, workflowGeneration, resetCalcWorkflowStore } = ws;
const { wholeCount, fmtCarried } = await import('../src/screens/lab/calc/calcUnits.ts');
const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8');

const run = (id: string) => ({
  id,
  workflowId: 'w',
  workflowName: 'W',
  startedAt: '2026-10-01T00:00:00Z',
  stepIndex: 1,
  steps: [{ inputs: { a: { raw: '1', unitIdx: 0, source: { kind: 'manual' } } }, stale: false }],
});
const project = (id: string) => ({ id, name: 'P', values: [], createdAt: 'x', updatedAt: 'x' });

beforeEach(() => store.clear());

test('F1 resetCalcWorkflowStore is the exported reset and bumps the generation', () => {
  assert.equal(resetCalcWorkflowStore, ws.resetLocal);
  const g = workflowGeneration();
  resetCalcWorkflowStore();
  assert.equal(workflowGeneration(), g + 1);
});

test('F1 a save in flight across the wipe is dropped', async () => {
  const p = workflowStore.saveRun(run('old') as never); // asked for before the wipe
  store.clear(); // the ape:* sweep
  resetCalcWorkflowStore();
  assert.equal(await p, false);
  assert.equal(store.has('ape:calcwf:runs'), false);
});

test('F1 a save carrying a pre-wipe mount generation is dropped; a fresh one lands', async () => {
  const mountGen = workflowGeneration();
  resetCalcWorkflowStore();
  assert.equal(await workflowStore.saveProject(project('old') as never, mountGen), false);
  assert.equal(store.has('ape:calcwf:projects'), false);
  assert.equal(await workflowStore.saveProject(project('new') as never), true);
  assert.deepEqual((await workflowStore.listProjects()).map((x) => x.id), ['new']);
});

test('F2 the screens pass their mount generation and stay quiet when fenced', () => {
  const runner = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  assert.match(runner, /const storeGenRef = useRef\(workflowGeneration\(\)\);/);
  assert.match(runner, /workflowStore\.saveRun\(r, storeGenRef\.current\)/);
  assert.match(runner, /workflowStore\.saveResult\(summary, storeGenRef\.current\)/);
  assert.match(runner, /else if \(storeGenRef\.current === workflowGeneration\(\)\) notify\('Save failed'/);
  const projects = read('screens/lab/calc/CalcProjectsScreen.tsx');
  assert.match(projects, /workflowStore\.saveProject\(p, storeGenRef\.current\)/);
  const edit = read('screens/lab/calc/CalcWorkflowEditScreen.tsx');
  assert.match(edit, /workflowStore\.saveWorkflow\(w, storeGenRef\.current\)/);
});

test('C1 float-noise counts snap; genuine fractions and tiny values do not', () => {
  assert.equal(0.35 * 44100, 15434.999999999998); // the binary product
  assert.equal(wholeCount(0.35 * 44100, 'samples'), 15435);
  assert.equal(wholeCount(65536, 'samples'), 65536);
  assert.equal(wholeCount(-23, 'number'), -23);
  assert.equal(Object.is(wholeCount(-0, 'number'), -0), false);
  assert.equal(wholeCount(1e-12, 'number'), null);
  assert.equal(wholeCount(255.5, 'samples'), null);
  assert.equal(wholeCount(12345678, 'samples'), null); // exponent form from 1e7
  assert.equal(wholeCount(48000, 'frequency'), null); // counts only
  assert.match(read('screens/lab/calc/calcPanel.tsx'), /const whole = wholeCount\(o\.value, o\.quantity\);/);
});

test('C2 carried-in counts go into the field exact', () => {
  assert.equal(fmtCarried(1200001, 'number'), '1200001');
  assert.equal(fmtCarried(1234567, 'number'), '1234567');
  assert.equal(fmtCarried(1234567.25, 'number'), '1234570'); // non-count: 6 figures as before
  assert.equal(fmtCarried(48000.123456, 'frequency'), '48000.1');
  assert.match(read('screens/lab/calc/CalcWorkflowRunScreen.tsx'), /effRaw\[f\.key\] = fmtCarried\(u\.fromBase\(o\.value\), f\.quantity\);/);
  assert.match(read('screens/lab/calc/CalcWorkspaceScreen.tsx'), /fmtCarried\(u\.fromBase\(chain\.baseValue\), f\.quantity\)/);
  assert.match(read('screens/lab/calc/CalcProjectsScreen.tsx'), /raw: fmtCarried\(units\[0\]\.fromBase\(v\.baseValue\), PROJECT_KINDS\[kindIdx\]\.kind\)/);
});

test('G1 creating a workflow waits for the tier', () => {
  const list = read('screens/lab/calc/CalcWorkflowsScreen.tsx');
  assert.match(list, /const guardSave = \(action: 'create' \| 'duplicate'\): boolean => \{\n[\s\S]{0,400}?if \(!resolved\) \{/);
  const edit = read('screens/lab/calc/CalcWorkflowEditScreen.tsx');
  assert.match(edit, /if \(!editingId && !resolved\) \{/);
});
