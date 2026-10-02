/**
 * SHARED area — evening toddler hunt, pass 3 (2026-10-02).
 *
 * pagedProgress is driven for real with AsyncStorage stubbed. FAILED against
 * the code before the fix (R2: fixed file copied aside, old one restored,
 * test run, fix restored).
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

type Kv = { map: Map<string, string>; failGet: boolean };
const kv: Kv = { map: new Map(), failGet: false };
(globalThis as unknown as { __e3Kv: Kv }).__e3Kv = kv;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return {
        url: mod(`const s = globalThis.__e3Kv; export default {
          getItem: async (k) => { if (s.failGet) throw new Error('unreadable'); return s.map.has(k) ? s.map.get(k) : null; },
          setItem: async (k, v) => { s.map.set(k, v); },
          removeItem: async (k) => { s.map.delete(k); },
        };`),
        shortCircuit: true,
      };
    }
    if (specifier === './sessionCarry' && /pagedProgress\.ts/.test(context.parentURL ?? '')) {
      return {
        url: mod(`export function dropSessionWork() {} export function holdSessionWork() { return false; }
          export function peekSessionWork() { return undefined; } export function registerSessionCarry() {}`),
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

const paged = await import('../src/features/lab/pagedProgress.ts');

test('pagedProgress: after a failed load, the screen’s SECOND save does not wipe the stored pages', async () => {
  kv.map.set('ape:labE3:v1', JSON.stringify({ completed: [0, 1, 2], lastPage: 2, done: true }));
  kv.failGet = true;
  const shown = await paged.loadPagedProgress('labE3'); // the screen is handed an empty copy
  assert.deepEqual(shown.completed, []);
  kv.failGet = false;
  // The learner finishes page 5, then page 6 — the screen saves ITS copy each time.
  await paged.savePagedProgress('labE3', { completed: [5], lastPage: 5, done: false });
  await paged.savePagedProgress('labE3', { completed: [5, 6], lastPage: 6, done: false });
  assert.deepEqual(
    JSON.parse(kv.map.get('ape:labE3:v1')!),
    { completed: [0, 1, 2, 5, 6], lastPage: 6, done: true },
    'the stored pages (and the finished lab) were replaced by the screen’s empty-based copy',
  );
});

test('pagedProgress: a practice reset after that recovery is not undone by the next save', async () => {
  await paged.resetPagedProgress('labE3');
  await paged.savePagedProgress('labE3', { completed: [0], lastPage: 0, done: false });
  assert.deepEqual(JSON.parse(kv.map.get('ape:labE3:v1')!), { completed: [0], lastPage: 0, done: false });
});

test('pagedProgress: a load that succeeds hands back the whole copy, and saves replace again', async () => {
  kv.map.set('ape:labE3:v1', JSON.stringify({ completed: [0, 1], lastPage: 1, done: false }));
  const p = await paged.loadPagedProgress('labE3');
  assert.deepEqual(p.completed, [0, 1]);
  await paged.savePagedProgress('labE3', { completed: [1], lastPage: 1, done: false });
  assert.deepEqual(JSON.parse(kv.map.get('ape:labE3:v1')!), { completed: [1], lastPage: 1, done: false });
});
