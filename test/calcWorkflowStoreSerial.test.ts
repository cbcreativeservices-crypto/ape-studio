/**
 * Calculator workflow store — writes are SERIALISED (bug hunt 2026-09-29, T8).
 *
 * Every write is a read-modify-write of one JSON blob. Two in flight at once
 * (a double-tapped SAVE, a save racing a reorder, two favourite toggles) both
 * read the same old list and the second write erased the first. The store now
 * runs its writes one at a time on a promise chain; these pin that nothing is
 * lost when they overlap.
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

const { workflowStore } = await import('../src/screens/lab/calc/workflowStore.ts');

const wf = (id: string) => ({
  id,
  name: `W ${id}`,
  steps: [{ workspaceId: 'ws', fnKey: 'fn' }],
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: '2026-09-29T00:00:00Z',
});

beforeEach(() => store.clear());

test('two overlapping saves both land', async () => {
  const [a, b] = await Promise.all([workflowStore.saveWorkflow(wf('a')), workflowStore.saveWorkflow(wf('b'))]);
  assert.equal(a, true);
  assert.equal(b, true);
  const ids = (await workflowStore.listWorkflows()).map((w) => w.id).sort();
  assert.deepEqual(ids, ['a', 'b']);
});

test('a save racing a reorder keeps the new workflow', async () => {
  await workflowStore.saveWorkflow(wf('a'));
  await workflowStore.saveWorkflow(wf('b')); // list: b, a
  await Promise.all([workflowStore.moveWorkflow('b', 1), workflowStore.saveWorkflow(wf('c'))]);
  const ids = (await workflowStore.listWorkflows()).map((w) => w.id);
  assert.deepEqual([...ids].sort(), ['a', 'b', 'c']);
});

test('overlapping favourite toggles both stick', async () => {
  await Promise.all([workflowStore.toggleFavorite('x'), workflowStore.toggleFavorite('y')]);
  assert.deepEqual((await workflowStore.getFavorites()).sort(), ['x', 'y']);
});

test('a failed write does not jam the chain', async () => {
  const fake = (await import('./_fake-async-storage.mjs')).default as { setItem: (k: string, v: string) => Promise<void> };
  const real = fake.setItem;
  fake.setItem = async () => {
    throw new Error('disk full');
  };
  assert.equal(await workflowStore.saveWorkflow(wf('z')), false);
  fake.setItem = real;
  assert.equal(await workflowStore.saveWorkflow(wf('a')), true);
});

test('the edit screen guards a double SAVE with a ref', () => {
  const src = readFileSync(new URL('../src/screens/lab/calc/CalcWorkflowEditScreen.tsx', import.meta.url), 'utf8');
  assert.match(src, /if \(savingRef\.current\) return;/);
});

test('re-saving an edited workflow keeps its place in the user order (2026-09-30)', async () => {
  await workflowStore.saveWorkflow(wf('a'));
  await workflowStore.saveWorkflow(wf('b'));
  await workflowStore.saveWorkflow(wf('c')); // list: c, b, a
  await workflowStore.moveWorkflow('c', 1); // user order: b, c, a
  await workflowStore.saveWorkflow({ ...wf('a'), name: 'edited' });
  const list = await workflowStore.listWorkflows();
  assert.deepEqual(list.map((w) => w.id), ['b', 'c', 'a']);
  assert.equal(list[2].name, 'edited');
  await workflowStore.saveWorkflow(wf('d'));
  assert.equal((await workflowStore.listWorkflows())[0].id, 'd', 'a NEW workflow still goes first');
});
